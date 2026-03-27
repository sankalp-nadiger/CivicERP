import { Request, Response } from 'express';
import { Complaint, User, Department, Area, Officer, Contractor } from "../models/index.js";
import { v4 } from "uuid";
import bcryptjs from 'bcryptjs';
import client from "../utils/RedisSetup.js";
import axios from "axios";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTranslatedComplaint } from '../services/translationService.js';
import {
    canTransitionComplaintStatus,
    normalizeComplaintStatus,
} from '../utils/complaintStatus.js';

const normalize = (value: unknown): string =>
    String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const normalizePreferredLang = (value: unknown): string => {
    const raw = String(value ?? 'en').trim().toLowerCase();
    const base = raw.split('-')[0] || 'en';
    return ['en', 'hi', 'kn'].includes(base) ? base : 'en';
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildKeywordRegex = (value: unknown): RegExp | undefined => {
    const tokens = normalize(value)
        .split(' ')
        .map(t => t.trim())
        .filter(Boolean);
    if (tokens.length === 0) return undefined;

    const stop = new Set([
        'department',
        'dept',
        'office',
        'head',
        'division',
        'unit',
        'of',
        'and',
        'the',
        'city',
        'municipal',
        'corporation',
    ]);

    const keywords = tokens
        .filter(t => !stop.has(t))
        .filter(t => /[a-z]/i.test(t))
        .filter(t => t.length >= 3)
        .sort((a, b) => b.length - a.length)
        .slice(0, 3);

    // If everything was filtered out (e.g., only numbers / stopwords), fall back to the raw normalized string.
    const parts = (keywords.length ? keywords : [normalize(value)]).filter(Boolean).map(escapeRegex);
    if (parts.length === 0) return undefined;

    return new RegExp(parts.join('|'), 'i');
};

class ComplaintController {
    constructor() {
        this.addComplaint = this.addComplaint.bind(this);
        this.getMyComplaints = this.getMyComplaints.bind(this);
        this.translateTexts = this.translateTexts.bind(this);
        this.getComplaintStats = this.getComplaintStats.bind(this);
        this.getScopedComplaints = this.getScopedComplaints.bind(this);
        this.getAssignedComplaintsForContractor = this.getAssignedComplaintsForContractor.bind(this);
        this.updateAssignedComplaintStatusForContractor = this.updateAssignedComplaintStatusForContractor.bind(this);
        this.assignComplaintToContractor = this.assignComplaintToContractor.bind(this);
    }

    private async resolveAuthenticatedContractor(tokenId: unknown, tokenRoleRaw: unknown) {
        const rawId = String(tokenId || '').trim();
        const tokenRole = String(tokenRoleRaw || '').trim().toLowerCase();
        if (!rawId) return null;

        let contractor: any = null;

        // New flow: contractor token carries contractor _id.
        if (tokenRole === 'contractor' && /^[a-f\d]{24}$/i.test(rawId)) {
            contractor = await Contractor.findById(rawId)
                .select('_id name email')
                .lean();
        }

        // Backward compatibility: older tokens may carry User._id.
        if (!contractor) {
            const user = await User.findById(rawId).select('_id email role').lean();
            if (user) {
                const userEmail = String((user as any).email || '').trim().toLowerCase();
                contractor = await Contractor.findOne({
                    $or: [
                        { userId: (user as any)._id },
                        ...(userEmail ? [{ email: userEmail }] : []),
                    ],
                })
                    .select('_id name email')
                    .lean();
            }
        }

        if (!contractor) return null;

        return Contractor.findById((contractor as any)._id)
            .select('_id name email')
            .lean();
    }

    private async tryResolveDepartmentId(issueCategories: unknown): Promise<any | undefined> {
        const categories = Array.isArray(issueCategories) ? issueCategories : [];
        const categoryNeedles = categories.map(c => normalize(c)).filter(Boolean);
        if (categoryNeedles.length === 0) return undefined;

        const departments = await Department.find().select('_id name').lean();
        if (!departments?.length) return undefined;

        const stop = new Set([
            'department',
            'dept',
            'complaint',
            'issue',
            'problem',
            'service',
            'of',
            'and',
            'the',
        ]);

        const tokenize = (value: string) =>
            value
                .split(' ')
                .map(t => t.trim())
                .filter(Boolean)
                .filter(t => !stop.has(t))
                .filter(t => t.length >= 3);

        // Pick best match by token overlap (handles "Water Department" vs "Water supply")
        let best: { id: any; score: number } | undefined;
        for (const dept of departments) {
            const deptNeedle = normalize((dept as any).name);
            if (!deptNeedle) continue;
            const deptTokens = tokenize(deptNeedle);
            if (deptTokens.length === 0) continue;

            for (const cat of categoryNeedles) {
                const catTokens = tokenize(cat);
                if (catTokens.length === 0) continue;

                const overlap = deptTokens.filter(t => catTokens.includes(t));
                if (overlap.length === 0) continue;

                // Weight by overlap count + longest matching token length
                const longest = Math.max(...overlap.map(t => t.length));
                const score = overlap.length * 100 + longest;
                if (!best || score > best.score) {
                    best = { id: (dept as any)._id, score };
                }
            }
        }

        return best?.id;
    }

    private async tryResolveAreaId(departmentId: any | undefined, location: unknown): Promise<any | undefined> {
        const loc = normalize(location);
        if (!loc) return undefined;

        const buildCandidates = async (filter: any) =>
            Area.find(filter).select('_id name aliases').lean();

        const filter: any = {};
        if (departmentId) filter.departmentId = departmentId;
        let areas = await buildCandidates(filter);

        // If departmentId-filtered search yields nothing (common when areas aren't tied to departments), search all areas.
        if ((!areas || areas.length === 0) && departmentId) {
            areas = await buildCandidates({});
        }

        if (!areas?.length) return undefined;

        // 1) Strong match: full normalized area name appears in location string
        for (const area of areas) {
            const areaNeedle = normalize((area as any).name);
            if (areaNeedle && loc.includes(areaNeedle)) {
                return (area as any)._id;
            }
        }

        const locTokens = new Set(loc.split(' ').filter(t => t.length >= 3));

        // 2) Score-based match using name + aliases tokens/regex
        let best: { id: any; score: number } | undefined;
        for (const area of areas) {
            const candidates: string[] = [String((area as any).name || '')];
            const aliases = (area as any).aliases;
            if (Array.isArray(aliases)) {
                for (const a of aliases) {
                    if (a) candidates.push(String(a));
                }
            }

            for (const c of candidates) {
                const needle = normalize(c);
                if (!needle) continue;

                if (loc.includes(needle)) {
                    const score = 10_000 + needle.length;
                    if (!best || score > best.score) best = { id: (area as any)._id, score };
                    continue;
                }

                const tokens = needle.split(' ').filter(t => t.length >= 3);
                const overlap = tokens.filter(t => locTokens.has(t));
                if (overlap.length > 0) {
                    const longest = Math.max(...overlap.map(t => t.length));
                    const score = overlap.length * 100 + longest;
                    if (!best || score > best.score) best = { id: (area as any)._id, score };
                    continue;
                }

                const regex = buildKeywordRegex(needle);
                if (regex && regex.test(loc)) {
                    const score = 10;
                    if (!best || score > best.score) best = { id: (area as any)._id, score };
                }
            }
        }

        // Require at least some signal
        if (best && best.score >= 10) return best.id;
        return undefined;
    }

    async addComplaint(req: Request, res: Response) {
        const { uuid, complaint, complaint_proof, issue_category, title, location, latitude, longitude, departmentId: explicitDepartmentId, areaId: explicitAreaId, summarized_complaint: clientSummarized } = req.body;
        try {
            // complaint_proof must be a URL (e.g., the `publicUrl` returned by POST /uploads/presign).
            // Prevent accidentally persisting local device paths like /data/user/0/... into MongoDB.
            if (
                complaint_proof != null &&
                String(complaint_proof).trim() !== '' &&
                !/^https?:\/\//i.test(String(complaint_proof).trim())
            ) {
                return res.status(400).json({
                    message:
                        'Invalid complaint_proof. Upload the file to S3 using POST /uploads/presign + PUT to uploadUrl, then send the returned publicUrl as complaint_proof.',
                });
            }

            let mycomplaint = new Complaint()
            let user = await User.findOne({ uuid })
            console.log("title"+title)
            if (user == null) {
                res.status(404).json({ "message": "User Not Found" })
                return;
            }
            let non_hashed_complaint_id = uuid + v4()
            const saltrounds = 10;
            let salt = await bcryptjs.genSalt(saltrounds);
            let complaint_id = await bcryptjs.hash(non_hashed_complaint_id, salt);
            user.previous_complaints.push(non_hashed_complaint_id);
            await user.save();
            let complaint_to_be_added = complaint;
            
            // ML model calls
            let summaryAssigned = false;
            let priorityAssigned = false;

            // If client provided a summarized_complaint, prefer it
            if (clientSummarized && typeof clientSummarized === 'string' && clientSummarized.trim()) {
                mycomplaint.summarized_complaint = clientSummarized.trim();
                summaryAssigned = true;
            }

            try {
                // Only call ML summary if we don't already have one
                if (!summaryAssigned) {
                    let response = await axios.post('http://127.0.0.1:5002/getSummary', {
                        message: complaint_to_be_added
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    let data = response.data;
                    if (data && data.summary && String(data.summary).trim()) {
                        mycomplaint.summarized_complaint = String(data.summary).trim();
                        summaryAssigned = true;
                    }
                }

                // Get score and normalize (optional)
                try {
                    let response = await axios.post('http://127.0.0.1:5002/getScore', {
                        complaint: complaint_to_be_added
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    let data = response.data;
                    let score = data.index;
                    let mylist = issue_category;
                    response = await axios.post('http://127.0.0.1:5002/normalize', {
                        score: score,
                        categories: mylist,
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    data = response.data;
                    if (data && data.complaint_severity_score != null) {
                        mycomplaint.priority_factor = data.complaint_severity_score;
                        priorityAssigned = true;
                    }
                    console.log('Priority set from ML:', mycomplaint.priority_factor)
                } catch (innerErr) {
                    console.log('ML scoring/normalize failed:', innerErr);
                }
            } catch (e) {
                console.log("Summary ML Error:", e);
            }

            // Ensure required summarized_complaint is always set (fallback)
            if (!summaryAssigned) {
                // Use the first sentence or a truncated complaint as a sensible fallback
                let fallback = '';
                try {
                    const firstSentence = String(complaint_to_be_added).split(/\.|\n/).map(s=>s.trim()).filter(Boolean)[0];
                    fallback = firstSentence || String(complaint_to_be_added).trim();
                } catch (_) {
                    fallback = String(complaint_to_be_added).trim();
                }
                if (fallback.length > 200) fallback = fallback.substring(0, 200) + '...';
                mycomplaint.summarized_complaint = fallback;
            }

            // Ensure priority_factor is set to a reasonable default if ML failed
            if (!priorityAssigned) {
                // Default medium priority
                mycomplaint.priority_factor = typeof mycomplaint.priority_factor === 'number' && mycomplaint.priority_factor > 0 ? mycomplaint.priority_factor : 0.5;
            }

            // Save complaint
            mycomplaint.complaint = complaint_to_be_added;
            mycomplaint.complaintOriginal = complaint_to_be_added;
            mycomplaint.originalLanguage = normalizePreferredLang(req.body?.originalLanguage || req.body?.lang);
            mycomplaint.complaint_proof = complaint_proof;
            mycomplaint.issue_category = issue_category;
            // Reference the user who raised the complaint
            mycomplaint.raisedBy = user._id;
            mycomplaint.complaint_id = complaint_id;
            mycomplaint.title = title;
            mycomplaint.location = location;

            // Store coordinates in location itself (single source of truth).
            try {
                const lat = latitude !== undefined ? Number(latitude) : Number.NaN;
                const lng = longitude !== undefined ? Number(longitude) : Number.NaN;

                const isValid = (a: number, b: number) =>
                    Number.isFinite(a) && Number.isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180;

                if (isValid(lat, lng)) {
                    mycomplaint.location = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                } else {
                    const m = String(location || '').match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
                    if (m) {
                        const pLat = Number(m[1]);
                        const pLng = Number(m[2]);
                        if (isValid(pLat, pLng)) {
                            mycomplaint.location = `Location: ${pLat.toFixed(6)}, ${pLng.toFixed(6)}`;
                        }
                    }
                }
            } catch (_) {
                // Non-critical: coordinate parsing shouldn't block complaint creation
            }
            mycomplaint.status = "OPEN"; // Default status

            // Attach departmentId + areaId to support officer scoping.
            // Prefer explicit ids provided by client (if valid Mongo ObjectIds), otherwise fall back to inference.
            try {
                const isMongoId = (value: unknown) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

                let departmentId = isMongoId(explicitDepartmentId) ? explicitDepartmentId : undefined;
                let areaId = isMongoId(explicitAreaId) ? explicitAreaId : undefined;

                if (!departmentId) {
                    departmentId = await this.tryResolveDepartmentId(issue_category);
                }

                if (!areaId) {
                    areaId = await this.tryResolveAreaId(departmentId as any, location);
                }

                if (departmentId) (mycomplaint as any).departmentId = departmentId;
                if (areaId) (mycomplaint as any).areaId = areaId;
            } catch (e) {
                // Enrichment is non-critical; do not fail complaint creation
                console.log('Complaint enrichment failed:', (e as any)?.message || e);
            }
        
            await mycomplaint.save();
            await client.set(non_hashed_complaint_id, complaint_id);
            res.status(201).json({ "message": "Added Complaint Successfully" })
        } catch (e: any) {
            console.log(e.message);
            res.status(400).json({ "message": e.message })
        }
    }

    async getMyComplaints(req: Request, res: Response) {
        const { user } = req.body;
        const uuid = user?.uuid;
        const lang = normalizePreferredLang(req.query?.lang);
        if (!uuid) {
            return res.status(400).json({ message: 'user.uuid is required' });
        }
        try {
            const foundUser = await User.findOne({ uuid })
            if (foundUser === null) {
                res.status(404).json({ "message": "User Not Found" })
                return;
            }

            // Primary source: Mongo relation on Complaint.raisedBy (resilient across Redis restarts).
            const byRaisedUser = await Complaint.find({ raisedBy: foundUser._id })
                .populate('raisedBy', 'name uuid email')
                .sort({ date: -1 });

            // Legacy fallback: older records looked up via user.previous_complaints + Redis key indirection.
            const legacyList: any[] = [];
            const complaints = foundUser.previous_complaints || [];
            for (let i = 0; i < complaints.length; i++) {
                try {
                    const legacyKey = String(complaints[i] || '');
                    if (!legacyKey) continue;

                    // 1) Old path: key in Redis maps to stored complaint_id.
                    const redisComplaintId = await client.get(legacyKey);
                    if (redisComplaintId !== null) {
                        let complaint = await Complaint.findOne({ complaint_id: redisComplaintId });
                        if (complaint !== null) {
                            complaint = await Complaint.findById(complaint._id).populate('raisedBy', 'name uuid email');
                            if (complaint !== null) legacyList.push(complaint)
                        }
                    }

                    // 2) Compatibility: sometimes previous_complaints already stores complaint_id directly.
                    let directComplaint = await Complaint.findOne({ complaint_id: legacyKey });
                    if (directComplaint !== null) {
                        directComplaint = await Complaint.findById(directComplaint._id).populate('raisedBy', 'name uuid email');
                        if (directComplaint !== null) legacyList.push(directComplaint)
                    }
                } catch (e: any) {
                    console.log(e.message)
                }
            }

            // 3) Extra legacy fallback: very old data used uuid-prefixed complaint_id.
            let uuidPrefixedList: any[] = [];
            try {
                uuidPrefixedList = await Complaint.find({ complaint_id: { $regex: `^${uuid}` } })
                    .populate('raisedBy', 'name uuid email')
                    .sort({ date: -1 });
            } catch (e: any) {
                console.log(e.message)
            }

            const merged = new Map<string, any>();
            for (const complaint of byRaisedUser) {
                merged.set(String((complaint as any)._id), complaint);
            }
            for (const complaint of legacyList) {
                merged.set(String((complaint as any)._id), complaint);
            }
            for (const complaint of uuidPrefixedList) {
                merged.set(String((complaint as any)._id), complaint);
            }

            const finalList = Array.from(merged.values());
            for (const complaint of finalList) {
                const translatedText = await getTranslatedComplaint(complaint, lang);
                (complaint as any).complaint = translatedText;
            }

            finalList.sort((a: any, b: any) => {
                const aDate = new Date(a?.date || a?.createdAt || 0).getTime();
                const bDate = new Date(b?.date || b?.createdAt || 0).getTime();
                return bDate - aDate;
            });

            res.status(200).json({ "complaints": finalList })
        } catch (e: any) {
            console.log(e.message)
            res.status(500).json({ "message": "Internal server error" })
        }
    }

    async translateTexts(req: any, res: any) {
        try {
            const targetLangRaw = String(req.body?.targetLang || '').trim().toLowerCase();
            const targetLang = targetLangRaw.split('-')[0];
            const texts = req.body?.texts as Record<string, unknown> | undefined;

            if (!targetLang) {
                return res.status(400).json({ message: 'targetLang is required' });
            }
            if (targetLang === 'en') {
                return res.status(200).json({ translations: texts || {} });
            }
            if (!['hi', 'kn'].includes(targetLang)) {
                return res.status(400).json({ message: 'Unsupported targetLang' });
            }
            if (!texts || typeof texts !== 'object') {
                return res.status(400).json({ message: 'texts object is required' });
            }

            const libreUrl = String(process.env.LIBRETRANSLATE_URL || '').trim();
            if (!libreUrl) {
                return res.status(500).json({
                    message: 'Server translation not configured (missing LIBRETRANSLATE_URL)',
                });
            }

            // Limit payload size to control cost/latency
            const entries = Object.entries(texts);
            const sanitized: Record<string, string> = {};
            let totalChars = 0;
            for (const [key, value] of entries) {
                const s = typeof value === 'string' ? value : value == null ? '' : String(value);
                const trimmed = s.trim();
                if (!trimmed) continue;
                const clipped = trimmed.length > 1500 ? trimmed.slice(0, 1500) : trimmed;
                sanitized[key] = clipped;
                totalChars += clipped.length;
            }
            if (totalChars === 0) {
                return res.status(200).json({ translations: {} });
            }
            if (totalChars > 3500) {
                return res.status(413).json({ message: 'Too much text to translate in one request' });
            }

            const libreApiKey = String(process.env.LIBRETRANSLATE_API_KEY || '').trim();
            const sourceLang = String(process.env.LIBRETRANSLATE_SOURCE_LANG || 'auto').trim() || 'auto';

            const keys = Object.keys(sanitized);
            const values = keys.map(k => sanitized[k]);

            // LibreTranslate supports q as either string or array.
            // We'll send as array and accept either array or string in response for compatibility.
            const endpoint = libreUrl.replace(/\/$/, '') + '/translate';
            const payload: any = {
                q: values,
                source: sourceLang,
                target: targetLang,
                format: 'text',
            };
            if (libreApiKey) payload.api_key = libreApiKey;

            const response = await axios.post(endpoint, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20_000,
            });

            // Possible shapes:
            // - { translatedText: '...' }
            // - { translatedText: ['...', '...'] }
            // - { translatedText: [{translatedText:'...'}] } (some forks)
            // - { translations: [...] } (some forks)
            const body = response?.data;

            let translatedArray: any[] | null = null;
            if (Array.isArray(body?.translatedText)) translatedArray = body.translatedText;
            else if (Array.isArray(body?.translations)) translatedArray = body.translations;
            else if (typeof body?.translatedText === 'string') translatedArray = [body.translatedText];

            const out: Record<string, string> = {};
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const fallback = sanitized[key];

                const item = translatedArray?.[i];
                const candidate =
                    typeof item === 'string'
                        ? item
                        : typeof item?.translatedText === 'string'
                            ? item.translatedText
                            : typeof item?.translation === 'string'
                                ? item.translation
                                : '';

                out[key] = candidate && String(candidate).trim() ? String(candidate) : fallback;
            }

            return res.status(200).json({ translations: out });
        } catch (e: any) {
            const status = typeof e?.response?.status === 'number' ? e.response.status : 500;
            const detail =
                typeof e?.response?.data === 'string'
                    ? e.response.data
                    : e?.response?.data
                        ? JSON.stringify(e.response.data)
                        : typeof e?.message === 'string'
                            ? e.message
                            : undefined;

            console.error('translateTexts error:', detail || e);
            return res.status(status).json({ message: 'Translation failed', detail });
        }
    }

    async getComplaintStats(req: Request, res: Response) {
        const { user } = req.body;
        const uuid = user.uuid;
        try {
            let user = await User.findOne({ uuid })
            if (user === null) {
                res.status(404).json({ "message": "User Not Found" })
                return;
            }
            let complaints = user.previous_complaints;
            let newlist = []
            for (let i = 0; i < complaints.length; i++) {
                try {
                    let x = await client.get(complaints[i]);
                    if (x !== null) {
                        let complaint = await Complaint.findOne({ complaint_id: x });
                        if (complaint !== null) {
                            // populate raisedBy for each complaint
                            complaint = await Complaint.findById(complaint._id).populate('raisedBy', 'name uuid email');
                            if (complaint !== null) {
                                newlist.push(complaint)
                            }
                        }
                    }
                } catch (e: any) {
                    console.log(e.message)
                }
            }
    
            // Calculate stats using newlist without changing existing logic
            let total = newlist.length;
            let completed = 0;
            let inProgress = 0;
            let todos = 0;
    
            for (let j = 0; j < newlist.length; j++) {
                const status = normalizeComplaintStatus((newlist[j] as any).status);
                if (status === 'CLOSED') {
                    completed++;
                } else if (status === 'OPEN') {
                    todos++;
                } else {
                    // ASSIGNED -> VERIFIED are active/in-progress states.
                    inProgress++;
                }
            }
    
            res.status(200).json({ 
                "complaints": newlist,
                "stats": {
                    "total": total,
                    "completed": completed,
                    "inProgress": inProgress,
                    "todos": todos
                }
            })
        } catch (e: any) {
            console.log(e.message)
            res.status(500).json({ "message": "Internal server error" })
        }
    }

    // For logged-in officers (e.g. Zone Officer): return only complaints in their scope.
    // Scope = officer.departmentId + officer.areaId (with fallback to text matching for legacy complaints).
    async getScopedComplaints(req: any, res: Response) {
        try {
            const userId = req.user?.id;
            const lang = normalizePreferredLang(req.query?.lang);
            if (!userId) {
                res.status(401).json({ message: 'Not authenticated' });
                return;
            }

            // Prefer linking by userId; fall back to email linking for older data.
            let officer = await Officer.findOne({ userId })
                .populate('departmentId', 'name')
                .populate('areaId', 'name');

            if (!officer) {
                const user = await User.findById(userId).select('email governanceLevel governanceType username').lean();
                const userEmail = (user as any)?.email;

                if (userEmail) {
                    officer = await Officer.findOne({ email: userEmail })
                        .populate('departmentId', 'name')
                        .populate('areaId', 'name');

                    // If we found an officer by email but it's not linked, link it now.
                    if (officer && String((officer as any).userId) !== String(userId)) {
                        await Officer.updateOne({ _id: (officer as any)._id }, { $set: { userId } });
                        officer = await Officer.findById((officer as any)._id)
                            .populate('departmentId', 'name')
                            .populate('areaId', 'name');
                    }
                }

                if (!officer) {
                    const hint = userEmail
                        ? `No Officer profile linked to ${userEmail}. Create this account via the governance dashboards so scope is assigned.`
                        : 'No Officer profile linked to this user. Create the officer via the governance dashboards so scope is assigned.';
                    res.status(404).json({ message: hint });
                    return;
                }
            }

            const departmentId = (officer as any).departmentId?._id || (officer as any).departmentId;
            const areaId = (officer as any).areaId?._id || (officer as any).areaId;
            const departmentName = (officer as any).departmentId?.name || (officer as any).departmentName;
            const areaName = (officer as any).areaId?.name || (officer as any).areaName;

            // Fail closed: if the officer has no scope assigned, return nothing (avoid leaking all complaints)
            if (!departmentId && !departmentName) {
                res.status(200).json({ complaints: [], message: 'Officer has no department assigned' });
                return;
            }
            if (!areaId && !areaName) {
                res.status(200).json({ complaints: [], message: 'Officer has no area/zone assigned' });
                return;
            }

            const andClauses: any[] = [];

            if (departmentId || departmentName) {
                const deptRegex = buildKeywordRegex(departmentName);
                andClauses.push({
                    $or: [
                        ...(departmentId ? [{ departmentId }] : []),
                        ...(deptRegex
                            ? [{ issue_category: { $elemMatch: { $regex: deptRegex } } }]
                            : []),
                    ],
                });
            }

            if (areaId || areaName) {
                const areaRegex = buildKeywordRegex(areaName);
                andClauses.push({
                    $or: [
                        ...(areaId ? [{ areaId }] : []),
                        ...(areaRegex ? [{ location: { $regex: areaRegex } }] : []),
                    ],
                });
            }

            const query = andClauses.length ? { $and: andClauses } : {};

            const complaints = await Complaint.find(query)
                .populate('raisedBy', 'username uuid email')
                .sort({ date: -1 });

            for (const complaint of complaints) {
                const translatedText = await getTranslatedComplaint(complaint, lang);
                (complaint as any).complaint = translatedText;
            }

            res.status(200).json({ complaints });
        } catch (e: any) {
            console.error(e);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Contractor view: return complaints assigned to logged-in contractor account.
    // GET /complaints/assigned/me
    async getAssignedComplaintsForContractor(req: any, res: Response) {
        try {
            const tokenId = req.user?.id;
            const tokenRole = String(req.user?.role || '').trim().toLowerCase();
            const lang = normalizePreferredLang(req.query?.lang);
            if (!tokenId) {
                res.status(401).json({ message: 'Not authenticated' });
                return;
            }

            let contractor: any = await this.resolveAuthenticatedContractor(tokenId, tokenRole);

            if (!contractor) {
                res.status(200).json({ complaints: [], message: 'No contractor profile linked to this account.' });
                return;
            }

            const contractorName = String((contractor as any).name || '').trim();
            const query: any = {
                $or: [
                    { assignedContractorId: (contractor as any)._id },
                    ...(contractorName ? [{ assignedContractorName: contractorName }] : []),
                ],
            };

            const complaints = await Complaint.find(query)
                .populate('raisedBy', 'username uuid email')
                .sort({ lastupdate: -1, date: -1 });

            for (const complaint of complaints) {
                const translatedText = await getTranslatedComplaint(complaint, lang);
                (complaint as any).complaint = translatedText;
            }

            res.status(200).json({ complaints, contractorId: (contractor as any)._id });
        } catch (e: any) {
            console.error('getAssignedComplaintsForContractor error:', e);
            res.status(500).json({ message: e?.message || 'Internal server error' });
        }
    }

    // Contractor workflow update for assigned complaints.
    // PUT /complaints/assigned/status
    // Body: { complaint_id: string, status: 'WORK_STARTED' | 'IN_PROGRESS' | 'WORK_COMPLETED' | 'WORK_DONE', comments?: string, statusProof?: string }
    async updateAssignedComplaintStatusForContractor(req: any, res: Response) {
        try {
            const tokenId = req.user?.id;
            const tokenRole = req.user?.role;
            if (!tokenId) {
                res.status(401).json({ message: 'Not authenticated' });
                return;
            }

            const contractor = await this.resolveAuthenticatedContractor(tokenId, tokenRole);
            if (!contractor) {
                res.status(403).json({ message: 'No contractor profile linked to this account.' });
                return;
            }

            const { complaint_id, status, comments, statusProof } = req.body || {};
            const complaintId = String(complaint_id || '').trim();
            const requestedStatus = normalizeComplaintStatus(status);

            if (!complaintId) {
                res.status(400).json({ message: 'complaint_id is required' });
                return;
            }

            if (!requestedStatus) {
                res.status(400).json({ message: 'status is required' });
                return;
            }

            const contractorAllowedStatuses = new Set(['WORK_STARTED', 'IN_PROGRESS', 'WORK_COMPLETED']);
            if (!contractorAllowedStatuses.has(requestedStatus)) {
                res.status(403).json({
                    message: 'Contractor can only update to WORK_STARTED, IN_PROGRESS, or WORK_COMPLETED.',
                });
                return;
            }

            const proofUrl = String(statusProof || '').trim();
            if (requestedStatus === 'WORK_COMPLETED') {
                if (!proofUrl || !/^https?:\/\//i.test(proofUrl)) {
                    res.status(400).json({
                        message: 'statusProof image URL is required when marking complaint as WORK_COMPLETED.',
                    });
                    return;
                }
            }

            const complaint = await Complaint.findOne({ complaint_id: complaintId });
            if (!complaint) {
                res.status(404).json({ message: 'Complaint not found' });
                return;
            }

            const assignedId = String((complaint as any).assignedContractorId || '').trim();
            const assignedName = String((complaint as any).assignedContractorName || '').trim();
            const contractorId = String((contractor as any)._id || '').trim();
            const contractorName = String((contractor as any).name || '').trim();

            const isAssignedToThisContractor =
                (assignedId && assignedId === contractorId) ||
                (assignedName && contractorName && assignedName.toLowerCase() === contractorName.toLowerCase());

            if (!isAssignedToThisContractor) {
                res.status(403).json({ message: 'You can update only complaints assigned to you.' });
                return;
            }

            const transition = canTransitionComplaintStatus((complaint as any).status, requestedStatus);
            if (!transition.ok) {
                res.status(409).json({ message: transition.reason });
                return;
            }

            (complaint as any).status = requestedStatus;
            (complaint as any).lastupdate = new Date();
            if (proofUrl) {
                (complaint as any).statusProof = proofUrl;
            }
            (complaint as any).comments = Array.isArray((complaint as any).comments) ? (complaint as any).comments : [];
            (complaint as any).comments.push([
                requestedStatus,
                contractorName || String((contractor as any).email || 'Contractor'),
                new Date().toISOString(),
                typeof comments === 'string' && comments.trim() ? comments.trim() : `Updated to ${requestedStatus}`,
            ].join('|'));

            await complaint.save();

            // Free the contractor once field work is completed.
            if (requestedStatus === 'WORK_COMPLETED') {
                await Contractor.updateOne(
                    { _id: contractorId },
                    {
                        $set: {
                            availabilityStatus: 'AVAILABLE',
                            currentAssignedTask: '',
                            lastLocationUpdateAt: new Date(),
                        },
                    }
                );
            }

            res.status(200).json({ message: 'Status updated successfully', complaint });
        } catch (e: any) {
            console.error('updateAssignedComplaintStatusForContractor error:', e);
            res.status(500).json({ message: e?.message || 'Failed to update complaint status' });
        }
    }

    // Assign a complaint to a contractor (Department Head / Level 2 workflow)
    // PUT /complaints/assign
    // Body: { complaint_id: string, contractorId: string }
    async assignComplaintToContractor(req: any, res: Response) {
        try {
            const requesterId = req.user?.id;
            if (!requesterId) {
                res.status(401).json({ message: 'Not authenticated' });
                return;
            }

            const requester = await User.findById(requesterId)
                .select('_id email username governanceLevel governanceType departmentId')
                .lean();

            const level = String((requester as any)?.governanceLevel || '').toUpperCase();
            if (level !== 'LEVEL_1' && level !== 'LEVEL_2') {
                res.status(403).json({ message: 'Only Level 1/2 users can assign complaints to contractors.' });
                return;
            }

            const { complaint_id, contractorId } = req.body || {};
            const complaintId = String(complaint_id || '').trim();
            const contractorObjectId = String(contractorId || '').trim();

            if (!complaintId) {
                res.status(400).json({ message: 'complaint_id is required' });
                return;
            }
            if (!/^[a-f\d]{24}$/i.test(contractorObjectId)) {
                res.status(400).json({ message: 'contractorId is required and must be a valid id' });
                return;
            }

            const complaint = await Complaint.findOne({ complaint_id: complaintId });
            if (!complaint) {
                res.status(404).json({ message: 'Complaint not found' });
                return;
            }

            const contractor = await Contractor.findById(contractorObjectId).lean();
            if (!contractor) {
                res.status(404).json({ message: 'Contractor not found' });
                return;
            }

            const transition = canTransitionComplaintStatus((complaint as any).status, 'ASSIGNED');
            if (!transition.ok) {
                res.status(409).json({ message: transition.reason });
                return;
            }

            // Update complaint assignment fields
            (complaint as any).assignedContractorId = (contractor as any)._id;
            (complaint as any).assignedContractorName = String((contractor as any).name || '').trim();
            (complaint as any).assignedAt = new Date();
            (complaint as any).assignedBy = (requester as any)?._id;
            (complaint as any).status = 'ASSIGNED';

            const actor = (requester as any)?.email || (requester as any)?.username || 'Level2';
            const assignmentComment = [
                'ASSIGNED',
                actor,
                new Date().toISOString(),
                `Assigned to ${(contractor as any).name}`
            ].join('|');
            (complaint as any).comments = Array.isArray((complaint as any).comments) ? (complaint as any).comments : [];
            (complaint as any).comments.push(assignmentComment);
            (complaint as any).lastupdate = new Date();

            await complaint.save();

            // Also mark contractor as BUSY and attach a readable task label
            const taskLabel = `Complaint ${complaintId}${(complaint as any).title ? `: ${(complaint as any).title}` : ''}`.trim();
            await Contractor.updateOne(
                { _id: (contractor as any)._id },
                {
                    $set: {
                        availabilityStatus: 'BUSY',
                        currentAssignedTask: taskLabel,
                        lastLocationUpdateAt: new Date(),
                    },
                }
            );

            res.status(200).json({ message: 'Assigned successfully', complaint });
        } catch (e: any) {
            console.error('assignComplaintToContractor error:', e);
            res.status(500).json({ message: e?.message || 'Failed to assign complaint' });
        }
    }
}

export default new ComplaintController();
import { Request, Response } from 'express';
import { Complaint, User, Department, Area, Officer } from "../models/index.js";
import { v4 } from "uuid";
import bcryptjs from 'bcryptjs';
import client from "../utils/RedisSetup.js";
import axios from "axios";

const normalize = (value: unknown): string =>
    String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

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
        const { uuid, complaint, complaint_proof, issue_category, title, location, departmentId: explicitDepartmentId, areaId: explicitAreaId, summarized_complaint: clientSummarized } = req.body;
        try {
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
            mycomplaint.complaint_proof = complaint_proof;
            mycomplaint.issue_category = issue_category;
            // Reference the user who raised the complaint
            mycomplaint.raisedBy = user._id;
            mycomplaint.complaint_id = complaint_id;
            mycomplaint.title = title;
            mycomplaint.location = location;
            mycomplaint.status = "todo"; // Default status

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
            res.status(200).json({ "complaints": newlist })
        } catch (e: any) {
            console.log(e.message)
            res.status(500).json({ "message": "Internal server error" })
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
                if (newlist[j].status === "completed") {
                    completed++;
                } else if (newlist[j].status === "Under Investigation" || newlist[j].status === "in-progress") {
                    inProgress++;
                } else if (newlist[j].status === "todo") {
                    todos++;
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
                        ? `No Officer profile linked to ${userEmail}. Create this account via Level 2 → "Add Zone Officer" (or Level 3 → "Add Ward Officer") so scope is assigned.`
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

            res.status(200).json({ complaints });
        } catch (e: any) {
            console.error(e);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

export default new ComplaintController();
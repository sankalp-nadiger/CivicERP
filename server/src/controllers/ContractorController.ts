import { Request, Response } from 'express';
import { Contractor, Department, User } from '../models/index.js';

const normalize = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeNeedle = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildKeywordRegex = (value: unknown): RegExp | undefined => {
  const tokens = normalizeNeedle(value)
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return undefined;

  const stop = new Set([
    'department',
    'dept',
    'office',
    'division',
    'unit',
    'of',
    'and',
    'the',
    'municipal',
    'corporation',
    'city',
  ]);

  const keywords = tokens
    .filter(t => !stop.has(t))
    .filter(t => t.length >= 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  const parts = (keywords.length ? keywords : [normalizeNeedle(value)])
    .filter(Boolean)
    .map(escapeRegex);
  if (parts.length === 0) return undefined;

  return new RegExp(parts.join('|'), 'i');
};

const asUpperStatus = (value: unknown): 'AVAILABLE' | 'BUSY' | undefined => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'AVAILABLE' || raw === 'BUSY') return raw;
  return undefined;
};

class ContractorController {
  private async getRequester(req: Request) {
    const requesterId = (req as any)?.user?.id as string | undefined;
    if (!requesterId) return null;
    return User.findById(requesterId).select('email governanceLevel governanceType role departmentId').lean();
  }

  private async getDepartmentForLevel2Email(email: string, governanceType?: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    const query: any = {};
    if (governanceType) query.governanceType = String(governanceType).toLowerCase();

    // Department.userId is an ObjectId reference; it will not include email unless populated.
    // So we resolve using:
    // 1) Department.email exact match
    // 2) User lookup by email then Department.userId match
    const user = await User.findOne({ email: normalizedEmail }).select('_id email').lean();

    const or: any[] = [{ email: normalizedEmail }];
    if (user?._id) or.push({ userId: user._id });

    // Prefer level=2 departments, but fall back if the department was created with the wrong level.
    const preferred = await Department.findOne({ ...query, level: 2, $or: or })
      .select('_id name email userId level')
      .lean();
    if (preferred) return preferred as any;

    return Department.findOne({ ...query, $or: or }).select('_id name email userId level').lean();
  }

  // GET /contractors
  // Query: status, departmentId, departmentName, zone, ward
  async list(req: Request, res: Response) {
    try {
      const requester = await this.getRequester(req);
      if (!requester) {
        res.status(401).json({ message: 'You are not authenticated!' });
        return;
      }

      const level = String((requester as any).governanceLevel || '').toUpperCase();
      if (level !== 'LEVEL_1' && level !== 'LEVEL_2') {
        res.status(403).json({ message: 'Only administrators can view contractors.' });
        return;
      }

      const status = asUpperStatus(req.query.status);
      const zone = normalize(req.query.zone);
      const ward = normalize(req.query.ward);
      const departmentId = normalize(req.query.departmentId);
      const departmentName = normalize(req.query.departmentName);

      const query: any = {};
      if (status) query.availabilityStatus = status;
      if (zone) query.zone = zone;
      if (ward) query.ward = ward;

      // Department scoping:
      // - Level 2: always restricted to their department (derived from Dept record by email)
      // - Level 1: may filter by departmentId/departmentName
      if (level === 'LEVEL_2') {
        const dept = await this.getDepartmentForLevel2Email(String((requester as any).email || ''), String((requester as any).governanceType || ''));
        if (dept?._id) {
          // Primary scoping by departmentId, but also allow departmentName matches.
          // This makes the system tolerant of seeded/demo data where contractor.departmentId
          // may not match the Department record used by the logged-in Department Head.
          const deptName = String((dept as any).name || '').trim();
          const deptRegex = buildKeywordRegex(deptName);

          query.$or = [
            { departmentId: (dept as any)._id },
            ...(deptName ? [{ departmentName: deptName }] : []),
            ...(deptRegex ? [{ departmentName: { $regex: deptRegex } }] : []),
          ];
        } else {
          // Fallback: if the account has departmentId set in the User record, use it.
          const requesterDeptId = String((requester as any).departmentId || '').trim();
          if (requesterDeptId && /^[a-f\d]{24}$/i.test(requesterDeptId)) {
            query.departmentId = requesterDeptId;
          } else if (departmentName) {
            const regex = buildKeywordRegex(departmentName);
            query.departmentName = regex ? { $regex: regex } : departmentName;
          } else {
            res.status(403).json({ message: 'Department is not configured for this account.' });
            return;
          }
        }
      } else {
        if (departmentId && /^[a-f\d]{24}$/i.test(departmentId)) {
          query.departmentId = departmentId;
        } else if (departmentName) {
          query.departmentName = departmentName;
        }
      }

      const contractors = await Contractor.find(query)
        .select('_id name departmentId departmentName phoneNumber latitude longitude availabilityStatus currentAssignedTask zone ward lastLocationUpdateAt')
        .sort({ updatedAt: -1 })
        .lean();

      res.status(200).json({ contractors });
    } catch (error: any) {
      console.error('Error listing contractors:', error);
      res.status(500).json({ message: error?.message || 'Failed to list contractors' });
    }
  }

  // POST /contractors
  // Creates or updates contractor by _id (if provided)
  async upsert(req: Request, res: Response) {
    try {
      const requester = await this.getRequester(req);
      if (!requester) {
        res.status(401).json({ message: 'You are not authenticated!' });
        return;
      }

      const level = String((requester as any).governanceLevel || '').toUpperCase();
      if (level !== 'LEVEL_1') {
        res.status(403).json({ message: 'Only Level 1 administrators can manage contractors.' });
        return;
      }

      const {
        id,
        name,
        departmentId,
        departmentName,
        phoneNumber,
        latitude,
        longitude,
        availability_status,
        availabilityStatus,
        current_assigned_task,
        currentAssignedTask,
        zone,
        ward,
      } = req.body || {};

      const resolvedStatus = asUpperStatus(availabilityStatus ?? availability_status) || 'AVAILABLE';

      if (!name || !departmentName || !phoneNumber) {
        res.status(400).json({ message: 'Missing required fields: name, departmentName, phoneNumber' });
        return;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({ message: 'Invalid latitude/longitude' });
        return;
      }

      const update: any = {
        name: String(name).trim(),
        departmentName: String(departmentName).trim(),
        phoneNumber: String(phoneNumber).trim(),
        latitude: lat,
        longitude: lng,
        availabilityStatus: resolvedStatus,
        currentAssignedTask: String(currentAssignedTask ?? current_assigned_task ?? '').trim(),
        zone: String(zone ?? '').trim(),
        ward: String(ward ?? '').trim(),
        lastLocationUpdateAt: new Date(),
      };

      if (departmentId && /^[a-f\d]{24}$/i.test(String(departmentId))) {
        update.departmentId = departmentId;
      }

      let contractor;
      if (id && /^[a-f\d]{24}$/i.test(String(id))) {
        contractor = await Contractor.findByIdAndUpdate(id, update, { new: true, upsert: true });
      } else {
        contractor = await Contractor.create(update);
      }

      res.status(200).json({ contractor });
    } catch (error: any) {
      console.error('Error upserting contractor:', error);
      res.status(500).json({ message: error?.message || 'Failed to upsert contractor' });
    }
  }

  // PUT /contractors/:id
  // Update location/status (for future mobile app integration)
  async update(req: Request, res: Response) {
    try {
      const requester = await this.getRequester(req);
      if (!requester) {
        res.status(401).json({ message: 'You are not authenticated!' });
        return;
      }

      const level = String((requester as any).governanceLevel || '').toUpperCase();
      // Allow Level 1 and Level 2 to update for now (mobile app auth can be tightened later)
      if (level !== 'LEVEL_1' && level !== 'LEVEL_2') {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }

      const contractorId = String(req.params.id || '').trim();
      if (!/^[a-f\d]{24}$/i.test(contractorId)) {
        res.status(400).json({ message: 'Invalid contractor id' });
        return;
      }

      const { latitude, longitude, availabilityStatus, availability_status, currentAssignedTask, current_assigned_task, zone, ward } = req.body || {};

      const update: any = { lastLocationUpdateAt: new Date() };

      if (latitude !== undefined) {
        const lat = Number(latitude);
        if (!Number.isFinite(lat)) {
          res.status(400).json({ message: 'Invalid latitude' });
          return;
        }
        update.latitude = lat;
      }
      if (longitude !== undefined) {
        const lng = Number(longitude);
        if (!Number.isFinite(lng)) {
          res.status(400).json({ message: 'Invalid longitude' });
          return;
        }
        update.longitude = lng;
      }

      const status = asUpperStatus(availabilityStatus ?? availability_status);
      if (status) update.availabilityStatus = status;

      if (currentAssignedTask !== undefined || current_assigned_task !== undefined) {
        update.currentAssignedTask = String(currentAssignedTask ?? current_assigned_task ?? '').trim();
      }
      if (zone !== undefined) update.zone = String(zone ?? '').trim();
      if (ward !== undefined) update.ward = String(ward ?? '').trim();

      const contractor = await Contractor.findByIdAndUpdate(contractorId, update, { new: true });
      if (!contractor) {
        res.status(404).json({ message: 'Contractor not found' });
        return;
      }

      res.status(200).json({ contractor });
    } catch (error: any) {
      console.error('Error updating contractor:', error);
      res.status(500).json({ message: error?.message || 'Failed to update contractor' });
    }
  }
}

export default new ContractorController();

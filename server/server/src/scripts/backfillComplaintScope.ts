import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Area, Complaint, Department } from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_box';

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

  const parts = (keywords.length ? keywords : [normalize(value)])
    .filter(Boolean)
    .map(escapeRegex);
  if (parts.length === 0) return undefined;
  return new RegExp(parts.join('|'), 'i');
};

const resolveDepartmentId = async (issueCategory: unknown): Promise<mongoose.Types.ObjectId | undefined> => {
  const categories = Array.isArray(issueCategory) ? issueCategory : [];
  const needles = categories.map(c => normalize(c)).filter(Boolean);
  if (needles.length === 0) return undefined;

  const departments = await Department.find().select('_id name').lean();
  if (!departments?.length) return undefined;

  const stop = new Set(['department', 'dept', 'complaint', 'issue', 'problem', 'service', 'of', 'and', 'the']);
  const tokenize = (value: string) =>
    value
      .split(' ')
      .map(t => t.trim())
      .filter(Boolean)
      .filter(t => !stop.has(t))
      .filter(t => t.length >= 3);

  let best: { id: any; score: number } | undefined;
  for (const dept of departments) {
    const deptNeedle = normalize((dept as any).name);
    if (!deptNeedle) continue;
    const deptTokens = tokenize(deptNeedle);
    if (deptTokens.length === 0) continue;

    for (const cat of needles) {
      const catTokens = tokenize(cat);
      if (catTokens.length === 0) continue;

      const overlap = deptTokens.filter(t => catTokens.includes(t));
      if (overlap.length === 0) continue;

      const longest = Math.max(...overlap.map(t => t.length));
      const score = overlap.length * 100 + longest;
      if (!best || score > best.score) {
        best = { id: (dept as any)._id, score };
      }
    }
  }

  return best?.id;
};

const resolveAreaId = async (
  departmentId: mongoose.Types.ObjectId | undefined,
  location: unknown,
): Promise<mongoose.Types.ObjectId | undefined> => {
  const loc = normalize(location);
  if (!loc) return undefined;

  const filter: any = {};
  if (departmentId) filter.departmentId = departmentId;
  const areas = await Area.find(filter).select('_id name').lean();
  if (!areas?.length) return undefined;

  for (const area of areas) {
    const needle = normalize((area as any).name);
    if (needle && loc.includes(needle)) return (area as any)._id;
  }

  for (const area of areas) {
    const regex = buildKeywordRegex((area as any).name);
    if (regex && regex.test(loc)) return (area as any)._id;
  }

  return undefined;
};

async function backfill() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const toProcess = await Complaint.find({
    $or: [{ departmentId: { $exists: false } }, { areaId: { $exists: false } }, { departmentId: null }, { areaId: null }],
  })
    .select('_id complaint_id issue_category location departmentId areaId')
    .lean();

  console.log(`Found ${toProcess.length} complaints missing scope.`);

  let updated = 0;
  const ops: any[] = [];

  for (const c of toProcess) {
    const existingDept = (c as any).departmentId;
    const existingArea = (c as any).areaId;

    const departmentId = existingDept || (await resolveDepartmentId((c as any).issue_category));
    const areaId = existingArea || (await resolveAreaId(departmentId, (c as any).location));

    const set: any = {};
    if (!existingDept && departmentId) set.departmentId = departmentId;
    if (!existingArea && areaId) set.areaId = areaId;

    if (Object.keys(set).length) {
      updated++;
      ops.push({
        updateOne: {
          filter: { _id: (c as any)._id },
          update: { $set: set },
        },
      });
    }
  }

  if (ops.length) {
    const result = await Complaint.bulkWrite(ops);
    console.log('Bulk update result:', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  }

  console.log(`Done. Updated ${updated} complaint(s).`);
  await mongoose.connection.close();
  process.exit(0);
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

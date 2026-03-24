import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Contractor, Department, User } from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_box';

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

  const stop = new Set(['department', 'dept', 'office', 'division', 'unit', 'of', 'and', 'the', 'municipal', 'corporation', 'city']);

  const keywords = tokens
    .filter(t => !stop.has(t))
    .filter(t => t.length >= 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  const parts = (keywords.length ? keywords : [normalizeNeedle(value)])
    .filter(Boolean)
    .map(escapeRegex);
  if (!parts.length) return undefined;
  return new RegExp(parts.join('|'), 'i');
};

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm --prefix server run debug-contractors -- <email>');
    process.exit(1);
  }

  console.log('Mongo URI:', MONGODB_URI.replace(/:\/\/.*@/, '://***@'));
  await mongoose.connect(MONGODB_URI);

  const user = await User.findOne({ email }).select('_id email role governanceLevel governanceType departmentId').lean();
  console.log('\nUser:', user);

  const deptsByEmail = await Department.find({ email }).select('_id name email level governanceType userId').lean();
  console.log(`\nDepartments with email == ${email}:`, deptsByEmail);

  let deptsByUserId: any[] = [];
  if (user?._id) {
    deptsByUserId = await Department.find({ userId: user._id }).select('_id name email level governanceType userId').lean();
  }
  console.log('\nDepartments with userId == user._id:', deptsByUserId);

  const totalContractors = await Contractor.countDocuments({});
  console.log('\nTotal contractors:', totalContractors);

  const deptNameGroups = await Contractor.aggregate([
    { $group: { _id: '$departmentName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log('\nContractors by departmentName:', deptNameGroups);

  const deptIdGroups = await Contractor.aggregate([
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log('\nContractors by departmentId:', deptIdGroups);

  // Simulate the Level 2 contractor scoping logic
  const requesterDeptId = String((user as any)?.departmentId || '').trim();
  const dept = (deptsByEmail[0] || deptsByUserId[0]) as any | undefined;

  let matchQuery: any = {};
  if (dept?._id) {
    const deptName = String(dept.name || '').trim();
    const deptRegex = buildKeywordRegex(deptName);
    matchQuery.$or = [
      { departmentId: dept._id },
      ...(deptName ? [{ departmentName: deptName }] : []),
      ...(deptRegex ? [{ departmentName: { $regex: deptRegex } }] : []),
    ];
  } else if (requesterDeptId && /^[a-f\d]{24}$/i.test(requesterDeptId)) {
    matchQuery.departmentId = requesterDeptId;
  } else {
    // last resort: fuzzy by "water" based on user email/departmentId absence
    matchQuery.departmentName = { $regex: /water/i };
  }

  const visibleCount = await Contractor.countDocuments(matchQuery);
  console.log('\nSimulated visible contractors count:', visibleCount);
  console.log('Simulated query:', JSON.stringify(matchQuery));

  const sample = await Contractor.find(matchQuery)
    .select('_id name departmentId departmentName phoneNumber availabilityStatus zone ward')
    .limit(5)
    .lean();
  console.log('\nSample visible contractors:', sample);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

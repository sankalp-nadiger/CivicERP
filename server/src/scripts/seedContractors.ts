import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Contractor, Department } from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_box';

const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase();

const normalizeNeedle = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDeptRegex = (name: string): RegExp | null => {
  const tokens = normalizeNeedle(name)
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean);
  if (!tokens.length) return null;

  const stop = new Set(['department', 'dept', 'office', 'division', 'unit', 'of', 'and', 'the']);
  const keywords = tokens
    .filter(t => !stop.has(t))
    .filter(t => t.length >= 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  const parts = (keywords.length ? keywords : [normalizeNeedle(name)]).filter(Boolean).map(escapeRegex);
  if (!parts.length) return null;
  return new RegExp(parts.join('|'), 'i');
};

type SeedContractor = {
  name: string;
  departmentName: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  availabilityStatus: 'AVAILABLE' | 'BUSY';
  currentAssignedTask: string;
  zone: string;
  ward: string;
};

const seedContractors: SeedContractor[] = [
  // Duplicate names across departments
  {
    name: 'Ramesh',
    departmentName: 'Roads',
    phoneNumber: '+91-9990000001',
    latitude: 12.302,
    longitude: 76.642,
    availabilityStatus: 'AVAILABLE',
    currentAssignedTask: 'Pothole inspection - Ward 12',
    zone: 'West Zone',
    ward: 'Ward 12',
  },
  {
    name: 'Ramesh',
    departmentName: 'Water Supply',
    phoneNumber: '+91-9990000002',
    latitude: 12.308,
    longitude: 76.650,
    availabilityStatus: 'BUSY',
    currentAssignedTask: 'Pipeline leak repair - Ward 7',
    zone: 'Central Zone',
    ward: 'Ward 7',
  },
  {
    name: 'Suresh',
    departmentName: 'Roads',
    phoneNumber: '+91-9990000003',
    latitude: 12.297,
    longitude: 76.640,
    availabilityStatus: 'BUSY',
    currentAssignedTask: 'Asphalt patching - Main road',
    zone: 'West Zone',
    ward: 'Ward 12',
  },
  {
    name: 'Suresh',
    departmentName: 'Sanitation',
    phoneNumber: '+91-9990000004',
    latitude: 12.305,
    longitude: 76.635,
    availabilityStatus: 'AVAILABLE',
    currentAssignedTask: 'Route standby',
    zone: 'North Zone',
    ward: 'Ward 3',
  },
  {
    name: 'Mahesh',
    departmentName: 'Roads',
    phoneNumber: '+91-9990000005',
    latitude: 12.304,
    longitude: 76.648,
    availabilityStatus: 'AVAILABLE',
    currentAssignedTask: '',
    zone: 'Central Zone',
    ward: 'Ward 9',
  },
  {
    name: 'Mahesh',
    departmentName: 'Electricity',
    phoneNumber: '+91-9990000006',
    latitude: 12.311,
    longitude: 76.654,
    availabilityStatus: 'BUSY',
    currentAssignedTask: 'Street light repair - Ward 9',
    zone: 'Central Zone',
    ward: 'Ward 9',
  },

  // A few more for filter/map density
  {
    name: 'Anita',
    departmentName: 'Water Supply',
    phoneNumber: '+91-9990000007',
    latitude: 12.315,
    longitude: 76.660,
    availabilityStatus: 'AVAILABLE',
    currentAssignedTask: 'Valve check - Ward 7',
    zone: 'Central Zone',
    ward: 'Ward 7',
  },
  {
    name: 'Rahul',
    departmentName: 'Sanitation',
    phoneNumber: '+91-9990000008',
    latitude: 12.290,
    longitude: 76.630,
    availabilityStatus: 'BUSY',
    currentAssignedTask: 'Garbage clearance - Ward 3',
    zone: 'North Zone',
    ward: 'Ward 3',
  },
  {
    name: 'Priya',
    departmentName: 'Roads',
    phoneNumber: '+91-9990000009',
    latitude: 12.299,
    longitude: 76.645,
    availabilityStatus: 'AVAILABLE',
    currentAssignedTask: 'Material pickup',
    zone: 'West Zone',
    ward: 'Ward 10',
  },
  {
    name: 'Kiran',
    departmentName: 'Electricity',
    phoneNumber: '+91-9990000010',
    latitude: 12.307,
    longitude: 76.646,
    availabilityStatus: 'BUSY',
    currentAssignedTask: 'Transformer check - Ward 9',
    zone: 'Central Zone',
    ward: 'Ward 9',
  },
];

async function ensureDepartment(departmentName: string) {
  const name = String(departmentName).trim();
  // 1) Exact match
  const exact = await Department.findOne({ name }).select('_id name').lean();
  if (exact && (exact as any)._id) return exact as any;

  // 2) Fuzzy match (e.g., "Water Supply" vs "Water Supply Department")
  const regex = buildDeptRegex(name);
  if (regex) {
    const fuzzy = await Department.findOne({ name: { $regex: regex } }).select('_id name').lean();
    if (fuzzy && (fuzzy as any)._id) return fuzzy as any;
  }

  // Create minimal Department record so contractors can reference departmentId.
  // This is for demo/seed only.
  const dep = await Department.create({
    name,
    description: 'Seeded department for contractor demo',
    contactPerson: 'Seed Admin',
    email: `${normalize(name).replace(/\s+/g, '.')}.head@seed.local`,
    phone: '0000000000',
    governanceType: 'city',
    level: 2,
    areas: [],
  });

  return { _id: dep._id, name: dep.name };
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Ensure departments exist and map to ids
  const deptMap = new Map<string, any>();
  for (const sc of seedContractors) {
    const key = normalize(sc.departmentName);
    if (deptMap.has(key)) continue;
    const dep = await ensureDepartment(sc.departmentName);
    if (!(dep as any)?._id) {
      throw new Error(`Failed to resolve department for ${sc.departmentName}`);
    }
    deptMap.set(key, (dep as any)._id);
  }

  let upserts = 0;
  for (const sc of seedContractors) {
    const departmentId = deptMap.get(normalize(sc.departmentName));

    const update: any = {
      name: sc.name,
      departmentId,
      departmentName: sc.departmentName,
      phoneNumber: sc.phoneNumber,
      latitude: sc.latitude,
      longitude: sc.longitude,
      availabilityStatus: sc.availabilityStatus,
      currentAssignedTask: sc.currentAssignedTask,
      zone: sc.zone,
      ward: sc.ward,
      lastLocationUpdateAt: new Date(),
    };

    const result = await Contractor.updateOne(
      { phoneNumber: sc.phoneNumber },
      { $set: update },
      { upsert: true }
    );

    if ((result as any).upsertedCount || (result as any).modifiedCount) upserts += 1;
  }

  console.log(`Seed complete. Upserted/updated ${upserts} contractors.`);

  await mongoose.disconnect();
  console.log('Disconnected');
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

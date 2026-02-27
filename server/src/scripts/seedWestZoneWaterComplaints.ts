import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Area, Complaint, Department, User } from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_box';

const normalize = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pickDepartment = async () => {
  const all = await Department.find().select('_id name').lean();
  const water = all.find(d => normalize((d as any).name).includes('water'));
  return water?._id;
};

const pickArea = async () => {
  const all = await Area.find().select('_id name aliases').lean();
  const isWest = (a: any) => {
    const name = normalize(a?.name);
    if (name.includes('west')) return true;
    const aliases = Array.isArray(a?.aliases) ? a.aliases : [];
    return aliases.some((x: any) => normalize(x).includes('west'));
  };
  const west = all.find(isWest);
  return west?._id;
};

const makeId = () => `WZ-WATER-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const departmentId = await pickDepartment();
  const areaId = await pickArea();
  const anyUser = await User.findOne().select('_id').lean();

  const now = Date.now();

  const complaints = [
    {
      title: 'No water supply since morning (West Zone)',
      complaint:
        'There has been no water supply in our street since 6 AM. Multiple houses are affected. Please restore water supply urgently.',
      summarized_complaint: 'Water supply interruption reported in West Zone locality.',
      issue_category: ['Municipal', 'Water Supply', 'Water Department'],
      // Prefer storing coordinates so officers always see an accurate map pin.
      location: 'Location: 12.312345, 76.640123 (West Zone, Ward 12)',
      status: 'todo',
      priority_factor: 0.9,
      comments: ['Complaint registered successfully'],
      complaint_id: makeId(),
      date: new Date(now - 2 * 24 * 60 * 60 * 1000),
      lastupdate: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Water pipeline leakage causing flooding (West Zone)',
      complaint:
        'A major pipeline leakage is causing water to overflow on the road. The leak is near the junction and is wasting water and blocking traffic.',
      summarized_complaint: 'Pipeline leakage causing overflow in West Zone.',
      issue_category: ['Water Supply', 'Leakage', 'Water'],
      location: 'Location: 12.314210, 76.636900 (West Zone Junction, Ward 12)',
      status: 'in-progress',
      priority_factor: 0.8,
      comments: ['Complaint registered successfully', 'Assigned to Water Department team'],
      complaint_id: makeId(),
      date: new Date(now - 1 * 24 * 60 * 60 * 1000),
      lastupdate: new Date(now - 12 * 60 * 60 * 1000),
    },
    {
      title: 'Low water pressure in West Zone ward',
      complaint:
        'Water pressure has been very low for the past week. Residents are unable to fill tanks. Please check valves and supply lines.',
      summarized_complaint: 'Low water pressure issue in West Zone ward area.',
      issue_category: ['Water', 'Water Supply', 'Pressure'],
      location: 'Location: 12.310800, 76.644050 (West Zone, Ward 12, Near Community Park)',
      status: 'todo',
      priority_factor: 0.7,
      comments: ['Complaint registered successfully'],
      complaint_id: makeId(),
      date: new Date(now - 5 * 60 * 60 * 1000),
      lastupdate: new Date(now - 5 * 60 * 60 * 1000),
    },
  ];

  const docs = complaints.map(c => ({
    ...c,
    statusProof: 'www.google.com',
    raisedBy: anyUser?._id,
    ...(departmentId ? { departmentId } : {}),
    ...(areaId ? { areaId } : {}),
  }));

  // Remove any prior seeded complaints by title (so reruns overwrite cleanly)
  for (const c of docs) {
    await Complaint.deleteMany({ title: c.title });
  }

  const inserted = await Complaint.insertMany(docs);

  console.log(`Inserted ${inserted.length} complaint(s).`);
  console.log('Attached scope ids:', { departmentId: departmentId?.toString() || null, areaId: areaId?.toString() || null });

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

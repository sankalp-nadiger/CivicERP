/**
 * Clean up old complaints with non-Mysore locations
 */
import { config } from 'dotenv';
import { connect } from 'mongoose';
import { Complaint } from '../models/index.js';

config();

async function run() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI not defined');
  }

  await connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  // Delete complaints with "North Zone", "South Zone", "East Zone", "West Zone", "Central Area"
  const oldZones = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Area'];
  
  const result = await Complaint.deleteMany({
    location: { $in: oldZones }
  });

  console.log(`✅ Deleted ${result.deletedCount} complaints from old zones`);

  process.exit(0);
}

run().catch((e: any) => {
  console.error('❌ Cleanup failed:', e?.message || e);
  process.exit(1);
});

/**
 * Clean up complaints with incorrect or missing locations
 * Deletes complaints where:
 * - Both latitude and longitude are missing/null/undefined
 * - Latitude is outside valid range (-90 to 90)
 * - Longitude is outside valid range (-180 to 180)
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

  // Find complaints with missing locations
  const missingLocationComplaints = await Complaint.find({
    $or: [
      { latitude: { $exists: false } },
      { latitude: null },
      { longitude: { $exists: false } },
      { longitude: null }
    ]
  });

  // Find complaints with invalid coordinates
  const invalidCoordinateComplaints = await Complaint.find({
    $or: [
      { latitude: { $lt: -90 } },
      { latitude: { $gt: 90 } },
      { longitude: { $lt: -180 } },
      { longitude: { $gt: 180 } }
    ]
  });

  const totalInvalid = missingLocationComplaints.length + invalidCoordinateComplaints.length;

  if (totalInvalid === 0) {
    console.log('✅ No complaints with incorrect locations found');
    process.exit(0);
  }

  console.log(`\n📍 Found ${missingLocationComplaints.length} complaints with missing coordinates`);
  console.log(`📍 Found ${invalidCoordinateComplaints.length} complaints with invalid coordinates`);
  console.log(`\n🗑️  Total complaints to delete: ${totalInvalid}`);

  // Show sample of complaints to be deleted
  console.log('\n📋 Sample complaints to be deleted:');
  [...missingLocationComplaints.slice(0, 3), ...invalidCoordinateComplaints.slice(0, 2)].forEach((c, idx) => {
    console.log(
      `  ${idx + 1}. ID: ${c.complaint_id} | Location: ${String((c as any).location || 'N/A')} | "${c.complaint.substring(0, 50)}..."`
    );
  });

  // Delete missing location complaints
  const resultMissing = await Complaint.deleteMany({
    $or: [
      { latitude: { $exists: false } },
      { latitude: null },
      { longitude: { $exists: false } },
      { longitude: null }
    ]
  });

  // Delete invalid coordinate complaints
  const resultInvalid = await Complaint.deleteMany({
    $or: [
      { latitude: { $lt: -90 } },
      { latitude: { $gt: 90 } },
      { longitude: { $lt: -180 } },
      { longitude: { $gt: 180 } }
    ]
  });

  const totalDeleted = resultMissing.deletedCount + resultInvalid.deletedCount;
  console.log(`\n✅ Successfully deleted ${totalDeleted} complaints with incorrect locations`);
  console.log(`   - Missing coordinates: ${resultMissing.deletedCount}`);
  console.log(`   - Invalid coordinates: ${resultInvalid.deletedCount}`);

  process.exit(0);
}

run().catch((e: any) => {
  console.error('❌ Cleanup failed:', e?.message || e);
  process.exit(1);
});

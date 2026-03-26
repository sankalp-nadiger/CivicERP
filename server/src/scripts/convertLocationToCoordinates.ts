/**
 * Convert location names to coordinate strings in location field.
 * Also removes legacy latitude/longitude fields.
 */
import { config } from 'dotenv';
import { connect } from 'mongoose';
import { Complaint } from '../models/index.js';

config();

// Location mapping for Mysore areas
const locationCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Jayanagar, Mysore': { lat: 12.2900, lng: 76.6400 },
  'VV Puram, Mysore': { lat: 12.2950, lng: 76.6380 },
  'Devaraja Market, Mysore': { lat: 12.2980, lng: 76.6420 },
  'Sayyaji Rao Road, Mysore': { lat: 12.2930, lng: 76.6350 },
  'Ashoka Road, Mysore': { lat: 12.2920, lng: 76.6450 },
  'Kuvempunagar, Mysore': { lat: 12.3100, lng: 76.6600 },
  'Vijayanagar, Mysore': { lat: 12.3050, lng: 76.6500 },
  'Chamundeshwari, Mysore': { lat: 12.2780, lng: 76.6300 },
  'Hebbal, Mysore': { lat: 12.3300, lng: 76.6700 },
  'Gokulam, Mysore': { lat: 12.2750, lng: 76.6250 },
};

async function run() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI not defined');
  }

  await connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  // Find all unique locations
  const uniqueLocations = await Complaint.distinct('location', {
    location: { $exists: true, $ne: null }
  });

  console.log(`\n📍 Found ${uniqueLocations.length} unique locations in database:`);
  uniqueLocations.forEach((loc) => {
    console.log(`   - ${loc}`);
  });

  // Update complaints with location coordinate strings
  let totalUpdated = 0;
  let updatedByLocation: { [key: string]: number } = {};

  for (const location of uniqueLocations) {
    const coords = locationCoordinates[location];

    if (coords) {
      // Add small random variance to coordinates (±0.5km)
      const baseLatitude = coords.lat + (Math.random() - 0.5) * 0.005;
      const baseLongitude = coords.lng + (Math.random() - 0.5) * 0.005;
      const encodedLocation = `Location: ${baseLatitude.toFixed(6)}, ${baseLongitude.toFixed(6)}`;

      const result = await Complaint.updateMany(
        { location },
        {
          $set: {
            location: encodedLocation,
          },
          $unset: {
            latitude: 1,
            longitude: 1,
          },
        }
      );

      totalUpdated += result.modifiedCount;
      updatedByLocation[location] = result.modifiedCount;
      console.log(`   ✅ Updated ${result.modifiedCount} complaints for "${location}"`);
    } else {
      console.log(`   ⚠️  No coordinate mapping found for "${location}"`);
    }
  }

  console.log(`\n✅ Successfully updated ${totalUpdated} complaints with coordinate locations`);
  console.log('\n📊 Updates by location:');
  Object.entries(updatedByLocation).forEach(([loc, count]) => {
    if (count > 0) {
      console.log(`   - ${loc}: ${count} complaints`);
    }
  });

  process.exit(0);
}

run().catch((e: any) => {
  console.error('❌ Update failed:', e?.message || e);
  process.exit(1);
});

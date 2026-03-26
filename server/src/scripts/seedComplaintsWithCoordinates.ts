/**
 * Seed complaints with valid coordinates for predictive analytics testing
 */
import { config } from 'dotenv';
import { connect } from 'mongoose';
import { Complaint } from '../models/index.js';

config();

const locations = [
  { name: 'Jayanagar, Mysore', lat: 12.2900, lng: 76.6400 },
  { name: 'VV Puram, Mysore', lat: 12.2950, lng: 76.6380 },
  { name: 'Devaraja Market, Mysore', lat: 12.2980, lng: 76.6420 },
  { name: 'Sayyaji Rao Road, Mysore', lat: 12.2930, lng: 76.6350 },
  { name: 'Ashoka Road, Mysore', lat: 12.2920, lng: 76.6450 },
];

const complaintDescriptions = [
  { category: ['Pothole'], text: 'Large pothole on road causing vehicle damage' },
  { category: ['Pothole'], text: 'Multiple potholes near market area, dangerous for traffic' },
  { category: ['Pothole'], text: 'Road surface severely damaged with potholes' },
  { category: ['Water Problem'], text: 'Water logging in residential area during monsoon' },
  { category: ['Water Problem'], text: 'Water pipeline burst, water wastage ongoing' },
  { category: ['Water Problem'], text: 'Low water pressure in this area, supply issue' },
  { category: ['Garbage'], text: 'Garbage not collected for 3 days, health hazard' },
  { category: ['Garbage'], text: 'Overflowing garbage bins at street corner' },
  { category: ['Garbage'], text: 'Waste accumulation blocking drainage system' },
  { category: ['Electricity'], text: 'Street light not working, dark alley at night' },
  { category: ['Drainage'], text: 'Drainage choked, sewage overflow in lane' },
  { category: ['Street Lighting'], text: 'Multiple street lights damaged in this area' },
];

async function run() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI not defined');
  }

  await connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const now = new Date();
  const complaints = [];

  // Create 30 sample complaints across last 7 days
  for (let i = 0; i < 30; i++) {
    const location = locations[i % locations.length];
    const complaintData = complaintDescriptions[i % complaintDescriptions.length];
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);

    const complaint = {
      complaint: complaintData.text,
      summarized_complaint: complaintData.text,
      complaint_id: `MYSORE-${Date.now()}-${i}`,
      issue_category: complaintData.category,
      latitude: location.lat + (Math.random() - 0.5) * 0.005, // ~0.5km variance
      longitude: location.lng + (Math.random() - 0.5) * 0.005,
      location: location.name,
      status: 'Complaint Registered',
      date,
      priority_factor: Math.random() * 0.5,
    };

    complaints.push(complaint);
  }

  const result = await Complaint.insertMany(complaints);
  console.log(`✅ Inserted ${result.length} complaints with coordinates in Mysore`);
  console.log('\nSample complaints:');
  complaints.slice(0, 5).forEach((c, idx) => {
    console.log(
      `  ${idx + 1}. "${c.complaint}" (${c.issue_category[0]}) @ ${c.location}`
    );
  });

  process.exit(0);
}

run().catch((e: any) => {
  console.error('❌ Seed failed:', e?.message || e);
  process.exit(1);
});

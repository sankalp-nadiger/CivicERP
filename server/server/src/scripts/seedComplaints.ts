import mongoose from 'mongoose';
import { Complaint, User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_box';

const dummyComplaints = [
  {
    title: 'Broken Street Light on Sayyaji Rao Road',
    complaint: 'The street light near Sayyaji Rao Road Circle has been broken for the past 2 weeks. This is causing safety concerns for pedestrians at night.',
    summarized_complaint: 'Broken street light causing safety issues at Sayyaji Rao Road.',
    issue_category: ['Infrastructure', 'Public Safety'],
    status: 'todo',
    priority_factor: 0.75,
    location: 'Sayyaji Rao Road, Near Circle, Mysuru, Karnataka',
    comments: ['Complaint registered successfully']
  },
  {
    title: 'Waterlogging in Residential Area',
    complaint: 'Severe waterlogging in Kuvempunagar residential area after every rain. The drainage system is completely blocked, causing water to enter homes.',
    summarized_complaint: 'Blocked drainage causing waterlogging in Kuvempunagar area.',
    issue_category: ['Municipal', 'Drainage', 'Infrastructure'],
    status: 'in-progress',
    priority_factor: 0.85,
    location: 'Kuvempunagar, 2nd Stage, Mysuru, Karnataka',
    comments: ['Complaint registered successfully', 'Assigned to municipal drainage department']
  },
  {
    title: 'Illegal Parking Near School',
    complaint: 'Vehicles are illegally parked near Vidyaranyapuram School entrance, blocking the road and creating traffic congestion during school hours.',
    summarized_complaint: 'Illegal parking causing traffic congestion near school.',
    issue_category: ['Traffic', 'Public Safety'],
    status: 'todo',
    priority_factor: 0.65,
    location: 'Vidyaranyapuram Main Road, Mysuru, Karnataka',
    comments: ['Complaint registered successfully']
  },
  {
    title: 'Garbage Dump Not Cleared',
    complaint: 'A large garbage dump has accumulated near Devaraja Market. It has not been cleared for over a month and is causing health hazards.',
    summarized_complaint: 'Uncleared garbage dump causing health hazards.',
    issue_category: ['Municipal', 'Garbage', 'Health'],
    status: 'in-progress',
    priority_factor: 0.90,
    location: 'Near Devaraja Market, Dhanvantri Road, Mysuru, Karnataka',
    comments: ['Complaint registered successfully', 'Municipal team notified']
  },
  {
    title: 'Damaged Road with Potholes',
    complaint: 'The road from Hunsur Road to Ring Road is severely damaged with multiple deep potholes. This is causing accidents and vehicle damage.',
    summarized_complaint: 'Damaged road with potholes causing accidents.',
    issue_category: ['Infrastructure', 'Roads'],
    status: 'completed',
    priority_factor: 0.80,
    location: 'Hunsur Road to Ring Road Junction, Mysuru, Karnataka',
    comments: ['Complaint registered successfully', 'Road repair work initiated', 'Work completed and verified']
  },
  {
    title: 'Public Park Maintenance Required',
    complaint: 'The public park in Jayalakshmipuram needs urgent maintenance. The swings are broken, grass is overgrown, and lighting is not working.',
    summarized_complaint: 'Public park requires maintenance and repairs.',
    issue_category: ['Municipal', 'Parks', 'Infrastructure'],
    status: 'todo',
    priority_factor: 0.45,
    location: 'Community Park, Jayalakshmipuram, Mysuru, Karnataka',
    comments: ['Complaint registered successfully']
  },
  {
    title: 'Noise Pollution from Construction Site',
    complaint: 'Construction work at the new commercial complex in Gokulam starts at 6 AM every day with loud machinery, violating noise pollution norms and disturbing residents.',
    summarized_complaint: 'Construction noise pollution violating norms.',
    issue_category: ['Environment', 'Noise Pollution'],
    status: 'in-progress',
    priority_factor: 0.60,
    location: 'Gokulam 3rd Stage, Near Main Road, Mysuru, Karnataka',
    comments: ['Complaint registered successfully', 'Notice sent to construction company']
  },
  {
    title: 'Stray Dog Menace',
    complaint: 'Large number of stray dogs in Vijayanagar are creating problems. Multiple incidents of dog bites reported, especially affecting children and elderly.',
    summarized_complaint: 'Stray dog problem causing safety concerns.',
    issue_category: ['Public Safety', 'Animal Control'],
    status: 'todo',
    priority_factor: 0.70,
    location: 'Vijayanagar 2nd Stage, Mysuru, Karnataka',
    comments: ['Complaint registered successfully']
  },
  {
    title: 'Water Supply Interruption',
    complaint: 'No water supply in our locality in Hebbal for the past 3 days. The water tanker promised by the municipal corporation has not arrived yet.',
    summarized_complaint: 'Water supply disruption for 3 days.',
    issue_category: ['Municipal', 'Water Supply'],
    status: 'in-progress',
    priority_factor: 0.95,
    location: 'Hebbal Industrial Area, Mysuru, Karnataka',
    comments: ['Complaint registered successfully', 'Emergency water tanker dispatched']
  },
  {
    title: 'Electricity Meter Malfunction',
    complaint: 'The electricity meter at our building in Ramakrishnanagar is showing incorrect readings, leading to inflated bills. Multiple residents have complained but no action taken.',
    summarized_complaint: 'Faulty electricity meter causing billing issues.',
    issue_category: ['Electricity', 'Billing'],
    status: 'completed',
    priority_factor: 0.55,
    location: 'Ramakrishnanagar, Near BM Habitat Mall, Mysuru, Karnataka',
    comments: ['Complaint registered successfully', 'Meter inspection scheduled', 'Meter replaced and verified']
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a user to associate complaints with (or create anonymous complaints)
    let user = await User.findOne();
    
    console.log('Clearing existing complaints...');
    await Complaint.deleteMany({});
    console.log('Existing complaints cleared');

    console.log('Inserting dummy complaints...');
    
    for (const dummyData of dummyComplaints) {
      const complaint = new Complaint({
        ...dummyData,
        complaint_id: `CMP${Date.now()}${Math.floor(Math.random() * 1000)}`,
        raisedBy: user?._id || undefined,
        statusProof: 'https://example.com/proof.pdf',
        date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
        lastupdate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date within last 7 days
      });
      
      await complaint.save();
      console.log(`✓ Created: ${complaint.title}`);
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`\n✅ Successfully seeded ${dummyComplaints.length} complaints!`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

seedDatabase();

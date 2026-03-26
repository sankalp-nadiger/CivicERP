/**
 * Populate departmentId for complaints based on issue categories
 */
import { config } from 'dotenv';
import { connect } from 'mongoose';
import { Complaint, Department } from '../models/index.js';

config();

const categoryToDepartment: { [key: string]: string } = {
  pothole: 'Roads',
  road: 'Roads',
  street: 'Roads',
  drainage: 'Roads',
  sanitation: 'Sanitation',
  garbage: 'Sanitation',
  waste: 'Sanitation',
  water: 'Water',
  pipeline: 'Water',
  electricity: 'Electricity',
  'street lighting': 'Electricity',
  'water problem': 'Water',
};

async function run() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI not defined');
  }

  await connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  // Get all departments
  const departments = await Department.find().select('_id name').lean();
  const deptMap = new Map<string, string>();
  for (const dept of (departments as any[])) {
    deptMap.set(String(dept.name).toLowerCase(), String(dept._id));
  }

  console.log(`\n📚 Found ${departments.length} departments:`);
  departments.forEach((d: any) => {
    console.log(`   - ${d.name} (${d._id})`);
  });

  // Find complaints without departmentId
  const complaintsWithoutDept = await Complaint.find({
    $or: [
      { departmentId: { $exists: false } },
      { departmentId: null }
    ]
  }).select('_id issue_category location').lean();

  console.log(`\n🔍 Found ${complaintsWithoutDept.length} complaints without departmentId`);

  let updated = 0;

  for (const complaint of (complaintsWithoutDept as any[])) {
    const categories = Array.isArray(complaint.issue_category) ? complaint.issue_category : [];
    let matchedDeptId: string | null = null;

    // Try to match issue category to department
    for (const cat of categories) {
      const normalizedCat = String(cat).toLowerCase().trim();
      for (const [key, deptName] of Object.entries(categoryToDepartment)) {
        if (normalizedCat.includes(key)) {
          const deptId = deptMap.get(deptName.toLowerCase());
          if (deptId) {
            matchedDeptId = deptId;
            break;
          }
        }
      }
      if (matchedDeptId) break;
    }

    if (matchedDeptId) {
      await Complaint.findByIdAndUpdate(
        complaint._id,
        { departmentId: matchedDeptId },
        { new: true }
      );
      updated++;
      console.log(
        `   ✅ Updated ${complaint._id.toString().substring(0, 8)}... | Categories: ${categories.join(', ')}`
      );
    } else {
      console.log(
        `   ⚠️  Could not match ${complaint._id.toString().substring(0, 8)}... | Categories: ${categories.join(', ')}`
      );
    }
  }

  console.log(`\n✅ Successfully updated ${updated} complaints with departmentId`);

  process.exit(0);
}

run().catch((e: any) => {
  console.error('❌ Update failed:', e?.message || e);
  process.exit(1);
});

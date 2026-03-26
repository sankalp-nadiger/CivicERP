/**
 * Diagnostic script to test predictive-analysis readiness.
 * Coordinates are expected inside complaint.location text.
 */
import { config } from 'dotenv';
import { connect } from 'mongoose';
import { Complaint } from '../models/index.js';
import { tryParseLatLngFromText } from '../utils/geo.js';

config();

async function diagnosePredict() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI not defined');
  }

  await connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  console.log(`\n📅 Querying complaints since: ${since.toISOString()}`);

  const recent = await Complaint.find({ date: { $gte: since } })
    .select('_id location issue_category departmentId date complaint')
    .populate('departmentId', 'name')
    .lean();

  console.log(`\n📊 Found ${recent.length} complaints from last 7 days`);

  if (recent.length === 0) {
    console.log('❌ No complaints found - predictive analysis will fail');
    process.exit(1);
  }

  console.log('\n📍 Checking location coordinates:');
  for (const c of (recent as any[]).slice(0, 10)) {
    const parsed = tryParseLatLngFromText(c.location);
    if (parsed) {
      console.log(`   ✅ ID: ${c._id} | Parsed: ${parsed.lat}, ${parsed.lng} | Location: ${c.location}`);
    } else {
      console.log(`   ❌ ID: ${c._id} | Unparsable location: ${c.location}`);
    }
  }

  const totalWithCoords = (recent as any[]).filter(c => tryParseLatLngFromText(c.location)).length;
  const totalWithoutCoords = recent.length - totalWithCoords;

  console.log(`\n📈 Summary of all complaints:`);
  console.log(`   ✅ With coordinate location: ${totalWithCoords}`);
  console.log(`   ❌ Without coordinate location: ${totalWithoutCoords}`);

  if (totalWithCoords === 0) {
    console.log('\n⚠️  ISSUE FOUND: No complaints have coordinate values inside location field.');
    console.log('   → Predictive analysis will only use text-based clustering (fallback mode)');
  } else {
    console.log('\n✅ Enough complaints with coordinate locations for geographic clustering');
  }

  console.log('\n🔍 Additional diagnostics:');
  const noDept = (recent as any[]).filter(c => !c.departmentId).length;
  if (noDept > 0) {
    console.log(`   ⚠️  ${noDept} complaints missing departmentId`);
  }

  console.log('\n✅ Diagnostics complete. Ready to test /analytics/predict endpoint.');

  process.exit(0);
}

diagnosePredict().catch((e: any) => {
  console.error('❌ Diagnostic failed:', e?.message || e);
  process.exit(1);
});

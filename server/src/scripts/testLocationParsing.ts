/**
 * Test if complaint locations are parsable
 */
import { config } from 'dotenv';
import { connect } from 'mongoose';
import { Complaint } from '../models/index.js';
import { tryParseLatLngFromText } from '../utils/geo.js';

config();

async function run() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) throw new Error('MONGO_URI not defined');

  await connect(mongoURI);

  const recent = await Complaint.find({ 
    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
  }).select('_id location').lean();

  console.log(`📊 Testing ${recent.length} complaints from last 7 days:\n`);

  let parseable = 0;
  for (const c of (recent as any[]).slice(0, 15)) {
    const parsed = tryParseLatLngFromText(c.location);
    if (parsed) {
      parseable++;
      console.log(`✅ ${c._id.toString().slice(0, 8)}: "${c.location}" → ${parsed.lat}, ${parsed.lng}`);
    } else {
      console.log(`❌ ${c._id.toString().slice(0, 8)}: "${c.location}" (unparseable)`);
    }
  }

  console.log(`\n📈 ${parseable}/${Math.min(15, recent.length)} tested complaints are parseable`);
  process.exit(0);
}

run().catch(e => {
  console.error('❌', e?.message || e);
  process.exit(1);
});

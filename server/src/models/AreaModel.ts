import mongoose from 'mongoose';

const AreaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Optional locality keywords that should map to this area (helps infer area from free-text addresses)
  aliases: [{ type: String }],
  description: { type: String },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  governanceType: { type: String, required: true, enum: ['city', 'panchayat'] },
  level: { type: Number, required: true }, // 1-4
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to created user
  officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const Area = mongoose.model('Area', AreaSchema);
export default Area;

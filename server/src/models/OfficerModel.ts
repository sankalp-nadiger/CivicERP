import mongoose from 'mongoose';

const OfficerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  // Fallback when departmentId is not available (e.g. frontend uses local mock ids)
  departmentName: { type: String },
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
  // Fallback when areaId is not available (e.g. frontend uses local mock ids)
  areaName: { type: String },
  governanceType: { type: String, required: true, enum: ['city', 'panchayat'] },
  level: { type: Number, required: true }, // 2-4
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const Officer = mongoose.model('Officer', OfficerSchema);
export default Officer;

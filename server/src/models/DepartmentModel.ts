import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  governanceType: { type: String, required: true, enum: ['city', 'panchayat'] },
  level: { type: Number, required: true }, // 1-4
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to created user
  areas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Area' }],
  createdAt: { type: Date, default: Date.now },
});

const Department = mongoose.model('Department', DepartmentSchema);
export default Department;

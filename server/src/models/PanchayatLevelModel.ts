import mongoose from 'mongoose';

const PanchayatLevelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  level: { type: Number, required: true }, // 1-4
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  complaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
});

const PanchayatLevel = mongoose.model('PanchayatLevel', PanchayatLevelSchema);
export default PanchayatLevel;

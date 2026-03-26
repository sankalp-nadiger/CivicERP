import mongoose from 'mongoose';

const ContractorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true },
    password: { type: String, required: false, select: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
    departmentName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    area: { type: String, required: false, default: '' },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'BUSY'],
      default: 'AVAILABLE',
      required: true,
    },
    currentAssignedTask: { type: String, default: '' },

    // Optional location grouping fields for dashboard filters
    zone: { type: String, default: '' },
    ward: { type: String, default: '' },

    lastLocationUpdateAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ContractorSchema.index({ departmentId: 1 });
ContractorSchema.index({ departmentName: 1 });
ContractorSchema.index({ area: 1 });
ContractorSchema.index({ email: 1 }, { unique: true, sparse: true });
ContractorSchema.index({ userId: 1 });
ContractorSchema.index({ availabilityStatus: 1 });
ContractorSchema.index({ zone: 1 });
ContractorSchema.index({ ward: 1 });

const Contractor = mongoose.model('Contractor', ContractorSchema);
export default Contractor;

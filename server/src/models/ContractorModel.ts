import mongoose from 'mongoose';

const ContractorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
    departmentName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
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
ContractorSchema.index({ availabilityStatus: 1 });
ContractorSchema.index({ zone: 1 });
ContractorSchema.index({ ward: 1 });

const Contractor = mongoose.model('Contractor', ContractorSchema);
export default Contractor;

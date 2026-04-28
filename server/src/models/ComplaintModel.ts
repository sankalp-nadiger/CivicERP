import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  complaint: {
    type: String,
    required: true,
  },
  complaintOriginal: {
    type: String,
  },
  originalLanguage: {
    type: String,
    default: 'en',
  },
  translations: {
    type: Map,
    of: String,
    default: {},
  },
  summarized_complaint:{
    type:String,
    required:true,
    default:""
  },
  complaint_proof: {
    type: String,
  },
  issue_category: {
    type: [String],
    required: true,
    default:[]
  },
  complaint_id: {
    type: String,
    required: true,
    unique: true,
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  status: {
    type: String,
    required: true,
    default: "Complaint Registered",
  },
  statusProof:{
    type:String,
    required:true,
    default:"www.google.com"
  },
  lastupdate: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  priority_factor:{
    type:Number,
    default:0.0,
    required:true
  },
  comments:{
    type:[String],
    default:[]
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
    default: undefined,
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: false,
    default: undefined,
  },
  location: {
    type: String,
    required: false,
  },

  // Contractor assignment (Level 2 workflow)
  assignedContractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contractor',
    required: false,
    default: undefined,
  },
  assignedContractorName: {
    type: String,
    required: false,
    default: '',
  },
  assignedAt: {
    type: Date,
    required: false,
    default: undefined,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: undefined,
  },
  assignmentHistory: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
});

const Complaint = mongoose.model("Complaint", ComplaintSchema);
export default Complaint;
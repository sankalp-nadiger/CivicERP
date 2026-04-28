import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: undefined,
    },
    recipientEmail: {
      type: String,
      required: false,
      default: '',
    },
    recipientRole: {
      type: String,
      required: false,
      default: '',
    },
    type: {
      type: String,
      required: true,
      default: 'complaint.assignment',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedComplaintId: {
      type: String,
      required: false,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      required: false,
      default: undefined,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
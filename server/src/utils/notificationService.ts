import contactEmail from './NodeMailer.js';
import { Notification } from '../models/index.js';

type NotificationRecipient = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
};

type NotificationInput = {
  recipient: NotificationRecipient;
  type: string;
  title: string;
  message: string;
  relatedComplaintId?: string;
  metadata?: Record<string, unknown>;
};

export const createComplaintNotification = async (input: NotificationInput) => {
  const recipientUserId = String(input.recipient.userId || '').trim();
  const recipientEmail = String(input.recipient.email || '').trim();
  const recipientRole = String(input.recipient.role || '').trim();

  const record = await Notification.create({
    recipientUserId: recipientUserId || undefined,
    recipientEmail,
    recipientRole,
    type: input.type,
    title: input.title,
    message: input.message,
    relatedComplaintId: String(input.relatedComplaintId || '').trim(),
    metadata: input.metadata || {},
  });

  if (contactEmail && recipientEmail) {
    try {
      await contactEmail.sendMail({
        from: process.env.USER_EMAIL,
        to: recipientEmail,
        subject: input.title,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <h2>${input.title}</h2>
            <p>${input.message}</p>
            ${input.relatedComplaintId ? `<p><strong>Complaint ID:</strong> ${input.relatedComplaintId}</p>` : ''}
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send complaint notification email:', error);
    }
  }

  return record;
};

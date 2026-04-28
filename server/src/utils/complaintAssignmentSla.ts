import Complaint from '../models/ComplaintModel.js';
import Contractor from '../models/ContractorModel.js';
import User from '../models/UserModel.js';
import { createComplaintNotification } from './notificationService.js';

export const ASSIGNMENT_ACCEPTANCE_SLA_HOURS = 6;
export const ASSIGNMENT_ACCEPTANCE_SLA_MS = ASSIGNMENT_ACCEPTANCE_SLA_HOURS * 60 * 60 * 1000;

export const getAssignmentDeadline = (assignedAt: unknown): Date | null => {
  const assignedDate = assignedAt ? new Date(assignedAt as any) : null;
  if (!assignedDate || Number.isNaN(assignedDate.getTime())) return null;
  return new Date(assignedDate.getTime() + ASSIGNMENT_ACCEPTANCE_SLA_MS);
};

export const getAssignmentTimeRemaining = (assignedAt: unknown, now = Date.now()): number | null => {
  const deadline = getAssignmentDeadline(assignedAt);
  if (!deadline) return null;
  return deadline.getTime() - now;
};

export const sweepExpiredComplaintAssignments = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - ASSIGNMENT_ACCEPTANCE_SLA_MS);
  const expiredComplaints = await Complaint.find({
    status: 'ASSIGNED',
    assignedAt: { $lte: cutoff },
  });

  let processed = 0;
  for (const complaint of expiredComplaints) {
    const assignedById = String((complaint as any).assignedBy || '').trim();
    const contractorId = String((complaint as any).assignedContractorId || '').trim();
    const contractorName = String((complaint as any).assignedContractorName || '').trim();

    (complaint as any).status = 'REASSIGN_REQUIRED';
    (complaint as any).lastupdate = new Date();
    (complaint as any).comments = Array.isArray((complaint as any).comments) ? (complaint as any).comments : [];
    (complaint as any).comments.push([
      'REASSIGN_REQUIRED',
      'SLA Monitor',
      new Date().toISOString(),
      'Contractor did not accept within 6 hours'
    ].join('|'));
    (complaint as any).assignmentHistory = Array.isArray((complaint as any).assignmentHistory) ? (complaint as any).assignmentHistory : [];
    (complaint as any).assignmentHistory.push({
      action: 'REASSIGN_REQUIRED',
      contractorId: contractorId || undefined,
      contractorName: contractorName || undefined,
      assignedAt: (complaint as any).assignedAt || undefined,
      triggeredAt: new Date(),
      note: '6-hour acceptance SLA breached',
    });

    await complaint.save();

    if (contractorId) {
      const contractor = await Contractor.findById(contractorId).select('_id name email userId').lean();
      if (contractor) {
        await Contractor.updateOne(
          { _id: (contractor as any)._id },
          {
            $set: {
              availabilityStatus: 'AVAILABLE',
              currentAssignedTask: '',
              lastLocationUpdateAt: new Date(),
            },
          }
        );
      }
    }

    if (assignedById) {
      const deptHead = await User.findById(assignedById).select('_id email role').lean();
      if (deptHead) {
        await createComplaintNotification({
          recipient: {
            userId: String((deptHead as any)._id || '').trim(),
            email: String((deptHead as any).email || '').trim(),
            role: String((deptHead as any).role || '').trim(),
          },
          type: 'complaint.assignment.timeout',
          title: 'Complaint reassignment required',
          message: 'Contractor did not accept within 6 hours. The complaint is now ready for reassignment.',
          relatedComplaintId: String((complaint as any).complaint_id || '').trim(),
          metadata: {
            contractorId: contractorId || null,
            contractorName: contractorName || null,
            assignedAt: (complaint as any).assignedAt || null,
            status: 'REASSIGN_REQUIRED',
          },
        });
      }
    }

    processed += 1;
  }

  return processed;
};

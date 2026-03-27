export const COMPLAINT_STATUS_FLOW = [
  'OPEN',
  'ASSIGNED',
  'WORK_STARTED',
  'IN_PROGRESS',
  'WORK_COMPLETED',
  'VERIFIED',
  'CLOSED',
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUS_FLOW)[number];

const LEGACY_TO_CANONICAL: Record<string, ComplaintStatus> = {
  // Open
  open: 'OPEN',
  todo: 'OPEN',
  'complaint registered': 'OPEN',
  registered: 'OPEN',

  // Assigned
  assigned: 'ASSIGNED',

  // Work started
  work_started: 'WORK_STARTED',
  'work started': 'WORK_STARTED',
  started: 'WORK_STARTED',

  // In progress
  in_progress: 'IN_PROGRESS',
  'in-progress': 'IN_PROGRESS',
  'in progress': 'IN_PROGRESS',
  progress: 'IN_PROGRESS',
  'under investigation': 'IN_PROGRESS',

  // Work completed
  work_done: 'WORK_COMPLETED',
  work_completed: 'WORK_COMPLETED',
  'work completed': 'WORK_COMPLETED',
  completed: 'WORK_COMPLETED',
  'work done': 'WORK_COMPLETED',

  // Verified
  verified: 'VERIFIED',

  // Closed
  closed: 'CLOSED',
  resolved: 'CLOSED',
};

export const normalizeComplaintStatus = (raw: unknown): ComplaintStatus | null => {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  const upper = text.toUpperCase();
  if ((COMPLAINT_STATUS_FLOW as readonly string[]).includes(upper)) {
    return upper as ComplaintStatus;
  }

  const mapped = LEGACY_TO_CANONICAL[text.toLowerCase()];
  return mapped || null;
};

export const canTransitionComplaintStatus = (
  currentRaw: unknown,
  nextRaw: unknown,
): { ok: boolean; current: ComplaintStatus; next: ComplaintStatus; reason?: string } => {
  const current = normalizeComplaintStatus(currentRaw) || 'OPEN';
  const next = normalizeComplaintStatus(nextRaw);

  if (!next) {
    return {
      ok: false,
      current,
      next: current,
      reason: `Invalid status. Allowed values: ${COMPLAINT_STATUS_FLOW.join(', ')}`,
    };
  }

  if (current === next) {
    return { ok: true, current, next };
  }

  const currentIndex = COMPLAINT_STATUS_FLOW.indexOf(current);
  const nextIndex = COMPLAINT_STATUS_FLOW.indexOf(next);
  const isImmediateNext = nextIndex === currentIndex + 1;

  if (!isImmediateNext) {
    const expectedNext = COMPLAINT_STATUS_FLOW[currentIndex + 1];
    return {
      ok: false,
      current,
      next,
      reason: expectedNext
        ? `Invalid transition ${current} -> ${next}. Next allowed status is ${expectedNext}.`
        : `Invalid transition ${current} -> ${next}. Complaint is already in terminal status ${current}.`,
    };
  }

  return { ok: true, current, next };
};

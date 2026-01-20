export type WorkflowStage = 'Intake' | 'Screening' | 'Assignment' | 'Fieldwork' | 'Verification' | 'Approval';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EvidenceSubmission {
  beforePhoto?: File;
  afterPhoto?: File;
  coordinates: Coordinates;
  notes?: string;
  submittedAt?: Date;
}

export interface ContractorTask {
  id: string;
  ticketId: string;
  category: string;
  location: string;
  coordinates: Coordinates;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  currentStage: WorkflowStage;
  assignedDate: Date;
  slaDeadline: Date;
  status: 'pending' | 'in-progress' | 'in-verification' | 'completed' | 'failed';
  evidence?: EvidenceSubmission;
  lastUpdated?: Date;
}

export interface TaskUpdatePayload {
  taskId: string;
  stage: WorkflowStage;
  evidence?: EvidenceSubmission;
  notes?: string;
  timestamp: Date;
}

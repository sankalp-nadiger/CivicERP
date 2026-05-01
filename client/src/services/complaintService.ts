const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const storedAuth = localStorage.getItem('auth_token');
  if (storedAuth) return storedAuth;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
  if (tokenCookie) return tokenCookie.split('=')[1];
  
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export interface Complaint {
  _id: string;
  title?: string;
  complaint: string;
  complaintOriginal?: string;
  originalLanguage?: 'en' | 'kn' | 'hi' | string;
  translations?: Partial<Record<'en' | 'kn' | 'hi', string>> | Record<string, string>;
  categoryTranslations?: Partial<Record<'en' | 'kn' | 'hi', string[]>> | Record<string, string[]>;
  summarized_complaint: string;
  complaint_proof?: string;
  issue_category: string[];
  complaint_id: string;
  departmentId?: string;
  areaId?: string;
  raisedBy?: {
    _id: string;
    name?: string;
    email?: string;
    uuid?: string;
  };
  status: string;
  statusProof?: string;
  lastupdate: Date;
  date: Date;
  priority_factor: number;
  comments: string[];
  location?: string;

  assignedContractorId?: string;
  assignedContractorName?: string;
  assignedAt?: string;
  assignedBy?: string;
  assignmentHistory?: Array<Record<string, unknown>>;
}

export interface ComplaintStats {
  total: number;
  completed: number;
  inProgress: number;
  todos: number;
}

export interface AdminComplaintsResponse {
  complaints: Complaint[];
}

export interface ScopedComplaintsResponse {
  complaints: Complaint[];
  message?: string;
}

export interface ContractorAssignedComplaintsResponse {
  complaints: Complaint[];
  contractorId?: string;
  message?: string;
}

export interface TranslateTextsResponse {
  translations: Record<string, string>;
}

type PresignUploadResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
};

export const generateComplaintId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `CMP-${timestamp.substr(-6)}-${random}`;
};

// Fetch all complaints for admin
export const getAllComplaints = async (): Promise<Complaint[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/all`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch complaints');
    }

    const data: AdminComplaintsResponse = await response.json();
    return data.complaints || [];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

// Fetch complaints scoped to the logged-in officer (department + area)
export const getScopedComplaints = async (): Promise<ScopedComplaintsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/scoped`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = 'Failed to fetch scoped complaints';
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        message = parsed?.message || message;
      } catch {
        message = raw || message;
      }
      throw new Error(message);
    }

    const data: ScopedComplaintsResponse = await response.json();
    return {
      complaints: data.complaints || [],
      message: data.message,
    };
  } catch (error) {
    console.error('Error fetching scoped complaints:', error);
    throw error;
  }
};

// Fetch complaints assigned to the logged-in contractor account.
export const getAssignedComplaintsForContractor = async (): Promise<ContractorAssignedComplaintsResponse> => {
  const response = await fetch(`${API_BASE_URL}/complaints/assigned/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const raw = await response.text();
  let parsed: ContractorAssignedComplaintsResponse | null = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    // Compatibility fallback: older server build may not have /complaints/assigned/me route yet.
    const looksLikeMissingRoute =
      response.status === 404 &&
      String(parsed?.message || raw || '').toLowerCase().includes('route not found');

    if (looksLikeMissingRoute) {
      const fallback = await fetch(`${API_BASE_URL}/complaints/scoped`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const fallbackRaw = await fallback.text();
      let fallbackParsed: any = null;
      try {
        fallbackParsed = fallbackRaw ? JSON.parse(fallbackRaw) : null;
      } catch {
        fallbackParsed = null;
      }
      if (fallback.ok) {
        return {
          complaints: fallbackParsed?.complaints || [],
          message: fallbackParsed?.message || 'Using scoped complaints fallback because assigned endpoint is unavailable on server.',
        };
      }
    }

    const message = parsed?.message || raw || 'Failed to fetch assigned complaints';
    throw new Error(`${message} (HTTP ${response.status})`);
  }

  return {
    complaints: parsed?.complaints || [],
    contractorId: parsed?.contractorId,
    message: parsed?.message,
  };
};

// Get complaint statistics for admin
export const getAdminComplaintStats = async (): Promise<{ complaints: Complaint[], stats: ComplaintStats }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/mystats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch complaint stats');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    throw error;
  }
};

// Update complaint status
export const updateComplaintStatus = async (
  complaint_id: string,
  status: string,
  comments?: string
): Promise<Complaint> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ complaint_id, status, comments }),
    });

    if (!response.ok) {
      throw new Error('Failed to update complaint status');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};

export const uploadComplaintStatusProofImage = async (params: {
  file: File;
  uuid?: string;
  folder?: string;
}): Promise<string> => {
  const file = params.file;
  const contentType = String(file.type || '').trim();
  if (!contentType.startsWith('image/')) {
    throw new Error('Only image files are supported for status proof upload');
  }

  const presignResponse = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      filename: file.name,
      contentType,
      uuid: params.uuid,
      folder: params.folder || 'complaints/status-proof',
    }),
  });

  const presignRaw = await presignResponse.text();
  let presignParsed: PresignUploadResponse | { message?: string } | null = null;
  try {
    presignParsed = presignRaw ? JSON.parse(presignRaw) : null;
  } catch {
    presignParsed = null;
  }

  if (!presignResponse.ok) {
    throw new Error((presignParsed as any)?.message || presignRaw || 'Failed to create presigned upload URL');
  }

  const uploadUrl = String((presignParsed as any)?.uploadUrl || '').trim();
  const publicUrl = String((presignParsed as any)?.publicUrl || '').trim();
  if (!uploadUrl || !publicUrl) {
    throw new Error('Invalid presigned upload response');
  }

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error(`Failed to upload image to storage (HTTP ${putResponse.status})`);
  }

  return publicUrl;
};

// Contractor-only status update: WORK_STARTED -> IN_PROGRESS -> WORK_COMPLETED
export const updateAssignedComplaintStatusForContractor = async (
  complaint_id: string,
  status: 'WORK_STARTED' | 'IN_PROGRESS' | 'WORK_COMPLETED' | 'WORK_DONE',
  comments?: string,
  statusProof?: string,
): Promise<Complaint> => {
  const normalizedStatus = status === 'WORK_DONE' ? 'WORK_COMPLETED' : status;

  const response = await fetch(`${API_BASE_URL}/complaints/assigned/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ complaint_id, status: normalizedStatus, comments, statusProof }),
  });

  const raw = await response.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(parsed?.message || raw || 'Failed to update assigned complaint status');
  }

  return parsed?.complaint as Complaint;
};

// Assign complaint to contractor (Level 2)
export const assignComplaintToContractor = async (params: {
  complaint_id: string;
  contractorId: string;
}): Promise<Complaint> => {
  const response = await fetch(`${API_BASE_URL}/complaints/assign`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      complaint_id: params.complaint_id,
      contractorId: params.contractorId,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = 'Failed to assign complaint';
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      message = parsed?.message || message;
    } catch {
      message = raw || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.complaint as Complaint;
};

export const translateComplaintTexts = async (params: {
  targetLang: string;
  texts: Record<string, string | undefined | null>;
}): Promise<Record<string, string>> => {
  const response = await fetch(`${API_BASE_URL}/complaints/translate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      targetLang: params.targetLang,
      texts: params.texts,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(raw || 'Failed to translate text');
  }

  const data: TranslateTextsResponse = await response.json();
  return data.translations || {};
};

export const getUserComplaints = (userId: string) => {
  return JSON.parse(localStorage.getItem(`user_complaints_${userId}`) || '[]');
};

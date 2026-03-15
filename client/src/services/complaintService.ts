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

export interface TranslateTextsResponse {
  translations: Record<string, string>;
}

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

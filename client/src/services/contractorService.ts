const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthToken = (): string | null => {
  const storedAuth = localStorage.getItem('auth_token');
  if (storedAuth) return storedAuth;

  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
  if (tokenCookie) return tokenCookie.split('=')[1];

  return null;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY';

export interface Contractor {
  _id: string;
  name: string;
  departmentId?: string;
  departmentName: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  availabilityStatus: AvailabilityStatus;
  currentAssignedTask?: string;
  zone?: string;
  ward?: string;
  lastLocationUpdateAt?: string;
}

export interface ListContractorsResponse {
  contractors: Contractor[];
}

export const listContractors = async (params?: {
  status?: AvailabilityStatus | 'ALL';
  zone?: string;
  ward?: string;
  departmentId?: string;
  departmentName?: string;
}): Promise<Contractor[]> => {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params?.zone) searchParams.set('zone', params.zone);
  if (params?.ward) searchParams.set('ward', params.ward);
  if (params?.departmentId) searchParams.set('departmentId', params.departmentId);
  if (params?.departmentName) searchParams.set('departmentName', params.departmentName);

  const qs = searchParams.toString();

  const response = await fetch(`${API_BASE_URL}/contractors${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = `Failed to fetch contractors (${response.status})`;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      message = parsed?.message || message;
    } catch {
      message = raw || message;
    }
    throw new Error(message);
  }

  const data = (await response.json()) as ListContractorsResponse;
  return data.contractors || [];
};

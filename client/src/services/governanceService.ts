const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get auth token from storage or cookie
const getAuthToken = (): string | null => {
  // Try to get from localStorage (if stored after login)
  const storedAuth = localStorage.getItem('auth_token');
  if (storedAuth) {
    return storedAuth;
  }
  
  // Try to get from cookie
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
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

export interface CreateDepartmentData {
  name: string;
  description: string;
  contactPerson: string;
  email: string;
  phone?: string;
  governanceType: string;
  level: number;
}

export interface CreateAreaData {
  name: string;
  aliases?: string[];
  description: string;
  contactPerson: string;
  email: string;
  phone?: string;
  departmentId?: string;
  governanceType: string;
  level: number;
}

export interface AddOfficerData {
  name: string;
  email: string;
  phone?: string;
  departmentId?: string;
  departmentName?: string;
  areaId?: string;
  areaName?: string;
  governanceType: string;
  level: number;
  reportsTo?: string;
}

export interface BackendDepartment {
  _id: string;
  name: string;
  description?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  governanceType?: string;
  level?: number;
  userId?: { _id: string; email?: string };
}

export const createDepartment = async (data: CreateDepartmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = `Failed to create department (${response.status})`;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        message = parsed?.message || message;
      } catch {
        message = raw || message;
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const createArea = async (data: CreateAreaData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/areas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = `Failed to create area (${response.status})`;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        message = parsed?.message || message;
      } catch {
        message = raw || message;
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating area:', error);
    throw error;
  }
};

export const addOfficer = async (data: AddOfficerData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/officers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = `Failed to add officer (${response.status})`;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        message = parsed?.message || message;
      } catch {
        message = raw || message;
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding officer:', error);
    throw error;
  }
};

export const getDepartments = async (params?: { governanceType?: string; level?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.governanceType) searchParams.set('governanceType', params.governanceType);
  if (typeof params?.level === 'number') searchParams.set('level', String(params.level));
  const qs = searchParams.toString();

  try {
    const response = await fetch(`${API_BASE_URL}/governance/departments${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = `Failed to fetch departments (${response.status})`;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        message = parsed?.message || message;
      } catch {
        message = raw || message;
      }
      throw new Error(message);
    }

    return (await response.json()) as BackendDepartment[];
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

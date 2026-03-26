const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type PredictInsight = {
  location: string;
  issue: string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  recommendation: string;
};

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

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const predictIssues = async (): Promise<PredictInsight[]> => {
  const response = await fetch(`${API_BASE_URL}/analytics/predict`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = 'Failed to fetch predictive insights';
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      message = parsed?.message || message;
    } catch {
      message = raw || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  return Array.isArray(data?.insights) ? data.insights : [];
};

const PREDICTIVE_ANALYTICS_URL = 'https://rag-pipeline-civic.onrender.com/predictiveAnalytics';

export type PredictInsight = {
  location: string;
  issue: string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  recommendation: string;
};

export type PredictIssuesRequest = {
  departmentName?: string;
  language?: string;
  windowDays?: number;
};

const normalizeLanguage = (): string => {
  const raw = (localStorage.getItem('i18nextLng') || navigator.language || 'en').toLowerCase();
  const normalized = raw.split('-')[0];
  return ['en', 'hi', 'kn'].includes(normalized) ? normalized : 'en';
};

const extractLatLng = (value: unknown): { lat: number; lng: number } | null => {
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/^location\s*:\s*/i, '').trim();
  const match = cleaned.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const latLngToWords = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'North' : 'South';
  const lngDir = lng >= 0 ? 'East' : 'West';
  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);
  return `Latitude ${latAbs} ${latDir}, Longitude ${lngAbs} ${lngDir}`;
};

const humanizeLocation = async (value: unknown, language: string): Promise<string> => {
  if (typeof value !== 'string' || !value.trim()) return 'Citywide';

  const coords = extractLatLng(value);
  if (!coords) return value.trim();

  try {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: String(coords.lat),
      lon: String(coords.lng),
      zoom: '14',
      addressdetails: '1',
      'accept-language': language || 'en',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (response.ok) {
      const geo = await response.json();
      const address = geo?.address || {};
      const place =
        address?.suburb ||
        address?.neighbourhood ||
        address?.city_district ||
        address?.town ||
        address?.city ||
        address?.village ||
        geo?.display_name;

      if (typeof place === 'string' && place.trim()) {
        return place.trim();
      }
    }
  } catch {
    // Ignore reverse-geocoding failures and fall back to worded coordinates.
  }

  return latLngToWords(coords.lat, coords.lng);
};

const toConfidenceLabel = (value: unknown): PredictInsight['confidence'] => {
  if (typeof value === 'number') {
    if (value >= 0.75) return 'High';
    if (value >= 0.45) return 'Medium';
    return 'Low';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
  }

  return 'Medium';
};

const sanitizeText = (text: unknown, fallback: string): string => {
  if (typeof text !== 'string') return fallback;
  const cleaned = text.replace(/```json|```/gi, '').trim();
  return cleaned || fallback;
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

export const predictIssues = async (request?: PredictIssuesRequest): Promise<PredictInsight[]> => {
  const payload = {
    departmentName: request?.departmentName ?? '',
    language: request?.language ?? normalizeLanguage(),
    windowDays: request?.windowDays ?? 7,
  };

  const response = await fetch(PREDICTIVE_ANALYTICS_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
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

  // Backward compatibility: retain old server shape if present.
  if (Array.isArray(data?.insights)) {
    const normalized = await Promise.all(
      data.insights.map(async (insight: any) => ({
        ...insight,
        location: await humanizeLocation(insight?.location, payload.language),
      }))
    );
    return normalized;
  }

  // External endpoint shape: headline/description/evidence/recommendations.
  if (data && typeof data === 'object') {
    const topArea = data?.evidence?.topAreas?.[0]?.name;
    const topCause = data?.evidence?.forecast?.probableTopCause || data?.evidence?.topCauses?.[0]?.name;
    const recommendation = data?.evidence?.recommendations?.[0] || data?.description;
    const confidence = toConfidenceLabel(data?.evidence?.confidence);
    const location = await humanizeLocation(topArea, payload.language);

    return [
      {
        location,
        issue: sanitizeText(topCause || data?.headline, 'Predicted civic issue'),
        confidence,
        recommendation: sanitizeText(recommendation, 'Review predictive summary and prioritize preventive actions.'),
      },
    ];
  }

  return [];
};

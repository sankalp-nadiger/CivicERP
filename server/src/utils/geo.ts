export type LatLng = { lat: number; lng: number };

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isValidLatLng = (lat: unknown, lng: unknown): lat is number => {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const haversineDistanceKm = (a: LatLng, b: LatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const tryParseLatLngFromText = (text: unknown): LatLng | null => {
  const s = String(text ?? '');
  if (!s) return null;

  // Match "12.312345, 76.640123" (first pair in the string)
  const m = s.match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;

  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
};

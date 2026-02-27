import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { Complaint as ApiComplaint } from "@/services/complaintService";

const extractLatLng = (raw: unknown): { lat: number; lng: number } | null => {
  const text = String(raw || "").trim();
  if (!text) return null;

  const match = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

type WeightedPoint = { lat: number; lng: number; weight: number };

const buildWeightedPoints = (complaints: ApiComplaint[]): WeightedPoint[] => {
  const byCell = new Map<string, WeightedPoint>();

  // Cluster into ~11m cells (4 decimals lat/lng) so multiple complaints at the same
  // location show up as "hotter".
  const keyFor = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

  for (const complaint of complaints || []) {
    const coords = extractLatLng((complaint as any).location);
    if (!coords) continue;

    const key = keyFor(coords.lat, coords.lng);
    const existing = byCell.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      byCell.set(key, { lat: coords.lat, lng: coords.lng, weight: 1 });
    }
  }

  return Array.from(byCell.values());
};

const FitBounds: React.FC<{ points: WeightedPoint[] }> = ({ points }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15));
    }
  }, [map, points]);

  return null;
};

export const ComplaintsHeatmap: React.FC<{
  complaints: ApiComplaint[];
  title?: string;
  heightClassName?: string;
}> = ({ complaints, title = "Complaint Heatmap", heightClassName = "h-80" }) => {
  const weightedPoints = React.useMemo(() => buildWeightedPoints(complaints), [complaints]);
  const totalComplaints = complaints?.length || 0;
  const plottedCount = weightedPoints.reduce((sum, p) => sum + p.weight, 0);

  const maxWeight = React.useMemo(() => Math.max(1, ...weightedPoints.map(p => p.weight)), [weightedPoints]);

  // Tailwind height class -> inline height fallback (Leaflet needs an explicit px height).
  const mapHeightPx = React.useMemo(() => {
    const match = String(heightClassName).match(/h-(\d+)/);
    if (!match) return 320;
    const scale = Number(match[1]);
    if (!Number.isFinite(scale)) return 320;
    return scale * 4; // Tailwind h-80 -> 20rem -> 320px
  }, [heightClassName]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Showing {plottedCount} of {totalComplaints} complaints (only complaints with coordinates are mapped)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {weightedPoints.length === 0 ? (
          <div className="rounded border bg-white p-6 text-sm text-gray-600">
            No mappable complaint locations found. Add locations as "Location: lat, lng" to see the heatmap.
          </div>
        ) : (
          <div className="overflow-hidden rounded border bg-white">
            <MapContainer
              center={[weightedPoints[0].lat, weightedPoints[0].lng] as [number, number]}
              zoom={12}
              style={{ height: mapHeightPx, width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={weightedPoints} />

              {weightedPoints.map((p) => {
                const intensity = p.weight / maxWeight;
                const radiusPx = Math.round(6 + intensity * 18);
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lng}`)}`;

                return (
                  <CircleMarker
                    key={`${p.lat},${p.lng}`}
                    center={[p.lat, p.lng] as [number, number]}
                    radius={radiusPx}
                    pathOptions={{
                      color: "#3b82f6",
                      weight: 0,
                      fillColor: "#3b82f6",
                      fillOpacity: 0.15 + intensity * 0.35,
                    }}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">{p.weight} complaints</div>
                        <div className="text-xs text-gray-600">{p.lat.toFixed(6)}, {p.lng.toFixed(6)}</div>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

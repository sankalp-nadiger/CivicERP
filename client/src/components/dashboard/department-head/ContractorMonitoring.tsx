import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listContractors, type AvailabilityStatus, type Contractor } from '@/services/contractorService';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const toFixed = (n: number, digits = 3) => (Number.isFinite(n) ? n.toFixed(digits) : '-');

const FitBounds: React.FC<{ points: Array<{ lat: number; lng: number }> }> = ({ points }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));
  }, [map, points]);

  return null;
};

const statusBadge = (status: AvailabilityStatus) => {
  if (status === 'AVAILABLE') return <Badge className="bg-green-100 text-green-800">Available</Badge>;
  return <Badge className="bg-red-100 text-red-800">Busy</Badge>;
};

export const ContractorMonitoring: React.FC<{
  defaultDepartmentName?: string;
  defaultDepartmentId?: string;
}> = ({ defaultDepartmentId, defaultDepartmentName }) => {
  const [status, setStatus] = React.useState<'ALL' | AvailabilityStatus>('ALL');
  const [zone, setZone] = React.useState<string>('ALL');
  const [ward, setWard] = React.useState<string>('ALL');
  const [departmentName, setDepartmentName] = React.useState<string>(defaultDepartmentName || '');
  const [showMap, setShowMap] = React.useState(false);

  // Keep departmentName in sync if parent resolves it later.
  React.useEffect(() => {
    if (!defaultDepartmentName) return;
    setDepartmentName(prev => (prev ? prev : defaultDepartmentName));
  }, [defaultDepartmentName]);

  const query = useQuery({
    queryKey: ['contractors', { status, zone, ward, departmentName, defaultDepartmentId }],
    queryFn: () =>
      listContractors({
        status,
        zone: zone === 'ALL' ? undefined : zone,
        ward: ward === 'ALL' ? undefined : ward,
        departmentId: defaultDepartmentId || undefined,
        departmentName: departmentName || undefined,
      }),
    refetchInterval: 10000,
  });

  const contractors = query.data || [];

  const departments = React.useMemo(() => {
    const values = contractors.map(c => String(c.departmentName || '').trim()).filter(Boolean);
    if (defaultDepartmentName) values.push(String(defaultDepartmentName).trim());
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [contractors, defaultDepartmentName]);

  const zones = React.useMemo(() => {
    const values = contractors.map(c => String(c.zone || '').trim()).filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [contractors]);

  const wards = React.useMemo(() => {
    const values = contractors.map(c => String(c.ward || '').trim()).filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [contractors]);

  const mapPoints = React.useMemo(
    () =>
      contractors
        .filter(c => Number.isFinite(c.latitude) && Number.isFinite(c.longitude))
        .map(c => ({ lat: c.latitude, lng: c.longitude })),
    [contractors]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Contractor Monitoring</h2>
          <p className="text-sm text-gray-600">
            View contractor location, department, and availability status (auto-refreshes every 10s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Map view</span>
          <Switch checked={showMap} onCheckedChange={setShowMap} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-gray-600">Availability</div>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="BUSY">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Department</div>
              <Select
                value={departmentName || 'ALL'}
                onValueChange={(v) => setDepartmentName(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Zone</div>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {zones.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Ward</div>
              <Select value={ward} onValueChange={setWard}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {wards.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Department: <span className="font-medium text-gray-700">{departmentName || '—'}</span>
          </div>
        </CardContent>
      </Card>

      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Map</CardTitle>
          </CardHeader>
          <CardContent>
            {contractors.length === 0 ? (
              <div className="rounded border bg-white p-6 text-sm text-gray-600">No contractors to display.</div>
            ) : (
              <div className="overflow-hidden rounded border bg-white">
                <MapContainer
                  center={[contractors[0].latitude, contractors[0].longitude] as [number, number]}
                  zoom={12}
                  style={{ height: 360, width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds points={mapPoints} />

                  {contractors.map((c: Contractor) => {
                    const color = c.availabilityStatus === 'AVAILABLE' ? '#16a34a' : '#dc2626';
                    const gm = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.latitude},${c.longitude}`)}`;
                    return (
                      <CircleMarker
                        key={c._id}
                        center={[c.latitude, c.longitude] as [number, number]}
                        radius={10}
                        pathOptions={{
                          color,
                          weight: 2,
                          fillColor: color,
                          fillOpacity: 0.3,
                        }}
                      >
                        <Popup>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">{c.name}</div>
                            <div className="text-xs text-gray-600">{c.departmentName}</div>
                            <div className="text-xs">{toFixed(c.latitude, 6)}, {toFixed(c.longitude, 6)}</div>
                            <div className="text-xs">Status: {c.availabilityStatus}</div>
                            {c.currentAssignedTask ? (
                              <div className="text-xs">Task: {c.currentAssignedTask}</div>
                            ) : null}
                            <a
                              href={gm}
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
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contractors</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isError ? (
            <div className="rounded border bg-white p-6 text-sm text-red-600">
              {(query.error as Error)?.message || 'Failed to load contractors'}
            </div>
          ) : contractors.length === 0 ? (
            <div className="rounded border bg-white p-6 text-sm text-gray-600">
              {query.isFetching ? 'Loading contractors…' : 'No contractors found for the selected filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Location</TableHead>
                  <TableHead>Availability Status</TableHead>
                  <TableHead>Current Assigned Task</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.departmentName}</TableCell>
                    <TableCell>
                      {toFixed(c.latitude)}, {toFixed(c.longitude)}
                    </TableCell>
                    <TableCell>{statusBadge(c.availabilityStatus)}</TableCell>
                    <TableCell>{c.currentAssignedTask || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

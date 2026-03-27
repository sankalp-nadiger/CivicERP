import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createContractor, listContractors, type AvailabilityStatus, type Contractor } from '@/services/contractorService';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useToast } from '@/hooks/use-toast';

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

const statusBadge = (status: AvailabilityStatus, t: any) => {
  if (status === 'AVAILABLE') return <Badge className="bg-green-100 text-green-800">{t('level2.contractors.filters.available', 'Available')}</Badge>;
  return <Badge className="bg-red-100 text-red-800">{t('level2.contractors.filters.busy', 'Busy')}</Badge>;
};

export const ContractorMonitoring: React.FC<{
  defaultDepartmentName?: string;
  defaultDepartmentId?: string;
}> = ({ defaultDepartmentId, defaultDepartmentName }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<'ALL' | AvailabilityStatus>('ALL');
  const [zone, setZone] = React.useState<string>('ALL');
  const [ward, setWard] = React.useState<string>('ALL');
  const [departmentName, setDepartmentName] = React.useState<string>(defaultDepartmentName || '');
  const [showMap, setShowMap] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    area: '',
    zone: '',
    ward: '',
  });

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
        .map(c => ({ lat: c.latitude as number, lng: c.longitude as number })),
    [contractors]
  );

  const mappableContractors = React.useMemo(
    () => contractors.filter(c => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)),
    [contractors]
  );

  const handleCreateContractor = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phoneNumber = form.phoneNumber.trim();
    const area = form.area.trim();

    if (!name || !email || !phoneNumber || !area) {
      toast({
        title: t('level2.contractors.toast.missingFieldsTitle', 'Missing fields'),
        description: t('level2.contractors.toast.missingFieldsDescription', 'Name, email, phone and area are required.'),
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createContractor({
        name,
        email,
        phoneNumber,
        area,
        zone: form.zone.trim() || undefined,
        ward: form.ward.trim() || undefined,
        departmentId: defaultDepartmentId || undefined,
        departmentName: departmentName || defaultDepartmentName || undefined,
      });

      toast({
        title: t('level2.contractors.toast.contractorCreatedTitle', 'Contractor created'),
        description: result.emailSent
          ? t('level2.contractors.toast.contractorCreatedEmailSent', 'Contractor credentials were emailed successfully.')
          : t('level2.contractors.toast.contractorCreatedEmailDisabled', 'Contractor created. Email service may be disabled.'),
      });

      setForm({ name: '', email: '', phoneNumber: '', area: '', zone: '', ward: '' });
      setCreateOpen(false);
      await query.refetch();
    } catch (error) {
      toast({
        title: t('level2.contractors.toast.contractorCreationFailedTitle', 'Create contractor failed'),
        description: error instanceof Error ? error.message : t('common.error', 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('level2.contractors.title', 'Contractor Monitoring')}</h2>
          <p className="text-sm text-gray-600">
            {t('level2.contractors.subtitle', 'View contractor location, department, and availability status (auto-refreshes every 10s)')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>{t('level2.contractors.createButton', 'Create Contractor')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('level2.contractors.dialog.title', 'Create Contractor')}</DialogTitle>
                <DialogDescription>
                  {t('level2.contractors.dialog.description', 'A login account will be created and credentials will be sent to the contractor email.')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{t('level2.contractors.dialog.fields.name', 'Name')}</Label>
                  <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <Label>{t('level2.contractors.dialog.fields.email', 'Email')}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
                </div>
                <div>
                  <Label>{t('level2.contractors.dialog.fields.phoneNumber', 'Phone Number')}</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>{t('level2.contractors.dialog.fields.area', 'Area')}</Label>
                  <Input value={form.area} onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('level2.contractors.dialog.fields.zone', 'Zone (optional)')}</Label>
                    <Input value={form.zone} onChange={(e) => setForm(prev => ({ ...prev, zone: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t('level2.contractors.dialog.fields.ward', 'Ward (optional)')}</Label>
                    <Input value={form.ward} onChange={(e) => setForm(prev => ({ ...prev, ward: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateContractor} disabled={isCreating}>
                  {isCreating ? t('level2.contractors.dialog.submitButton.creating', 'Creating...') : t('level2.contractors.dialog.submitButton.submit', 'Create & Send Credentials')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-sm text-gray-600">{t('level2.contractors.mapToggle', 'Map view')}</span>
          <Switch checked={showMap} onCheckedChange={setShowMap} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('level2.contractors.filters.title', 'Filters')}</CardTitle>
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? t('level2.contractors.filters.refreshButton.refreshing', 'Refreshing…') : t('level2.contractors.filters.refreshButton.refresh', 'Refresh')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-gray-600">{t('level2.contractors.filters.availability', 'Availability')}</div>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('level2.contractors.filters.placeholder', 'All')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('level2.contractors.filters.placeholder', 'All')}</SelectItem>
                  <SelectItem value="AVAILABLE">{t('level2.contractors.filters.available', 'Available')}</SelectItem>
                  <SelectItem value="BUSY">{t('level2.contractors.filters.busy', 'Busy')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">{t('level2.contractors.filters.department', 'Department')}</div>
              <Select
                value={departmentName || 'ALL'}
                onValueChange={(v) => setDepartmentName(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('level2.contractors.filters.placeholder', 'All')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('level2.contractors.filters.placeholder', 'All')}</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">{t('level2.contractors.filters.zone', 'Zone')}</div>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger>
                  <SelectValue placeholder={t('level2.contractors.filters.placeholder', 'All')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('level2.contractors.filters.placeholder', 'All')}</SelectItem>
                  {zones.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">{t('level2.contractors.filters.ward', 'Ward')}</div>
              <Select value={ward} onValueChange={setWard}>
                <SelectTrigger>
                  <SelectValue placeholder={t('level2.contractors.filters.placeholder', 'All')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('level2.contractors.filters.placeholder', 'All')}</SelectItem>
                  {wards.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            {t('level2.contractors.filters.departmentLabel', 'Department: ')} <span className="font-medium text-gray-700">{departmentName || '—'}</span>
          </div>
        </CardContent>
      </Card>

      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('level2.contractors.map.title', 'Map')}</CardTitle>
          </CardHeader>
          <CardContent>
            {mappableContractors.length === 0 ? (
              <div className="rounded border bg-white p-6 text-sm text-gray-600">{t('level2.contractors.map.noContractors', 'No contractors to display.')}</div>
            ) : (
              <div className="overflow-hidden rounded border bg-white">
                <MapContainer
                  center={[mappableContractors[0].latitude as number, mappableContractors[0].longitude as number] as [number, number]}
                  zoom={12}
                  style={{ height: 360, width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds points={mapPoints} />

                  {mappableContractors.map((c: Contractor) => {
                    const color = c.availabilityStatus === 'AVAILABLE' ? '#16a34a' : '#dc2626';
                    const gm = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.latitude},${c.longitude}`)}`;
                    return (
                      <CircleMarker
                        key={c._id}
                        center={[c.latitude as number, c.longitude as number] as [number, number]}
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
                            <div className="text-xs">{t('level2.contractors.map.popup.status', 'Status: ')}{c.availabilityStatus}</div>
                            {c.currentAssignedTask ? (
                              <div className="text-xs">{t('level2.contractors.map.popup.task', 'Task: ')}{c.currentAssignedTask}</div>
                            ) : null}
                            <a
                              href={gm}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {t('level2.contractors.map.popup.openMaps', 'Open in Google Maps')}
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
          <CardTitle className="text-base">{t('level2.contractors.table.title', 'Contractors')}</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isError ? (
            <div className="rounded border bg-white p-6 text-sm text-red-600">
              {(query.error as Error)?.message || t('level2.contractors.table.error', 'Failed to load contractors')}
            </div>
          ) : contractors.length === 0 ? (
            <div className="rounded border bg-white p-6 text-sm text-gray-600">
              {query.isFetching ? t('level2.contractors.table.loading', 'Loading contractors…') : t('level2.contractors.table.empty', 'No contractors found for the selected filters.')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('level2.contractors.table.columns.name', 'Contractor Name')}</TableHead>
                  <TableHead>{t('level2.contractors.table.columns.department', 'Department')}</TableHead>
                  <TableHead>{t('level2.contractors.table.columns.area', 'Area')}</TableHead>
                  <TableHead>{t('level2.contractors.table.columns.status', 'Availability Status')}</TableHead>
                  <TableHead>{t('level2.contractors.table.columns.task', 'Current Assigned Task')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.departmentName}</TableCell>
                    <TableCell>{c.area || '-'}</TableCell>
                    <TableCell>{statusBadge(c.availabilityStatus, t)}</TableCell>
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

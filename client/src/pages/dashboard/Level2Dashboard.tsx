/**
 * LEVEL_2 DASHBOARD
 * Department Head / District Program Officer
 * Manages their department and subordinate Zone Officers
 */

import React, { useState, useEffect } from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  StatCard,
  ComplaintCard,
  AddOfficerDialog,
  UserListCard
} from "@/components/dashboard/DashboardComponents";
import { getAllComplaints, Complaint as ApiComplaint } from "@/services/complaintService";
import { ComplaintsTable } from "@/components/dashboard/shared/ComplaintsTable";
import { ComplaintsHeatmap } from "@/components/dashboard/shared/ComplaintsHeatmap";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as governanceService from "@/services/governanceService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLevelDisplayName, getAreaHierarchy } from "@/config/governanceTemplates";
import {
  getComplaintStats,
  getComplaintsByDepartment,
  getComplaintsByStatus,
  getUsersByLevel,
  getSubordinates,
  generateUserId
} from "@/lib/governanceUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Users, FileText, AlertCircle, TrendingUp, Plus } from "lucide-react";

export default function Level2Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const {
    governanceType,
    currentUser,
    departments,
    areas,
    users,
    complaints,
    setCurrentUser,
    updateUser,
    updateComplaint,
    escalateComplaint,
    addUser,
    removeUser
  } = useGovernance();

  const [selectedComplaint, setSelectedComplaint] = React.useState<any>(null);
  const [newStatus, setNewStatus] = React.useState("");
  const [apiComplaints, setApiComplaints] = useState<ApiComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [myDepartmentFromApi, setMyDepartmentFromApi] = useState<governanceService.BackendDepartment | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'zones'>('overview');

  const authEmail = (authUser?.email || '').trim().toLowerCase();
  const authGovLevel = (authUser?.governanceLevel || '').toString().trim().toUpperCase();
  const isAuthLevel2 = authGovLevel === 'LEVEL_2' || /level\s*[-_]?\s*2/i.test(authGovLevel);

  // Fetch complaints from database
  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const fetchedComplaints = await getAllComplaints();
      setApiComplaints(fetchedComplaints);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('level2.toast.fetchComplaintsFailed', 'Failed to fetch complaints from the database'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sidebar = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    const parentLabel = hierarchy.parent === "ZONE" ? t("dashboard.zones", "Zones") : t("dashboard.taluks", "Taluks");
    return [
      { label: t("dashboard.overview", "Overview"), path: "/dashboard/level2", icon: <FileText className="w-4 h-4" /> },
      { label: t("dashboard.complaints", "Complaints"), path: "/dashboard/level2/complaints", icon: <AlertCircle className="w-4 h-4" /> },
      { label: parentLabel, path: "/dashboard/level2/zones", icon: <Users className="w-4 h-4" /> }
    ];
  }, [governanceType, t]);

  const parentLabel = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    return hierarchy.parent === "ZONE" ? t("dashboard.zones", "Zones") : t("dashboard.taluks", "Taluks");
  }, [governanceType, t]);

  const getActiveTabFromPath = React.useCallback((): 'overview' | 'complaints' | 'zones' => {
    const path = location.pathname;
    if (path.includes('/complaints')) return 'complaints';
    if (path.includes('/zones')) return 'zones';
    return 'overview';
  }, [location.pathname]);

  React.useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [getActiveTabFromPath]);

  // Set governance currentUser from authenticated user (prevents using seeded dummy Dept Head users)
  React.useEffect(() => {
    if (!governanceType) return;
    if (!authEmail || !isAuthLevel2) return;

    const existing = users.find(
      u => u.level === 'LEVEL_2' && (u.email || '').trim().toLowerCase() === authEmail
    );
    if (existing) {
      if (!currentUser || currentUser.id !== existing.id) {
        setCurrentUser(existing);
      }
      return;
    }

    const deptName = (myDepartmentFromApi?.name || '').trim().toLowerCase();
    const localDept = deptName
      ? departments.find(d => (d.name || '').trim().toLowerCase() === deptName)
      : undefined;

    const newUser = {
      id: generateUserId(),
      name: myDepartmentFromApi?.contactPerson || authUser?.name || t('level2.misc.departmentHeadFallback', 'Department Head'),
      email: authUser?.email || authEmail,
      level: 'LEVEL_2' as const,
      governanceType,
      department: localDept?.id,
      createdAt: new Date(),
      status: 'ACTIVE' as const,
    };

    addUser(newUser);
    setCurrentUser(newUser);
  }, [addUser, authEmail, authUser?.email, authUser?.name, currentUser, departments, governanceType, isAuthLevel2, myDepartmentFromApi?.contactPerson, myDepartmentFromApi?.name, setCurrentUser, users]);

  // If backend department info is available, use the human contact name instead of autogenerated usernames
  React.useEffect(() => {
    const contactPerson = (myDepartmentFromApi?.contactPerson || '').trim();
    if (!contactPerson) return;
    if (!currentUser) return;
    if (currentUser.level !== 'LEVEL_2') return;
    if ((currentUser.email || '').trim().toLowerCase() !== authEmail) return;

    const currentName = (currentUser.name || '').trim();
    if (!currentName) return;
    if (currentName === contactPerson) return;

    // Common pattern from seeded/generated usernames: <something>_<timestamp>
    const looksAutogenerated = /_[0-9]{10,}$/.test(currentName);
    const looksLikeAuthName = !!authUser?.name && currentName === authUser.name;
    if (!looksAutogenerated && !looksLikeAuthName) return;

    updateUser(currentUser.id, { name: contactPerson });
    setCurrentUser({ ...currentUser, name: contactPerson });
  }, [authEmail, authUser?.name, currentUser, myDepartmentFromApi?.contactPerson, setCurrentUser, updateUser]);

  // Cleanup: remove seeded dummy department heads like 'Dept Head 1'
  React.useEffect(() => {
    const dummyPattern = /^dept\s*head\s*\d+$/i;
    const toRemove = users.filter(
      u =>
        u.level === 'LEVEL_2' &&
        dummyPattern.test((u.name || '').trim()) &&
        (u.email || '').trim().toLowerCase() !== authEmail
    );

    toRemove.forEach(u => removeUser(u.id));
  }, [authEmail, removeUser, users]);

  // Resolve the logged-in Department Head's department from backend (by email)
  React.useEffect(() => {
    const email = (authUser?.email || '').trim().toLowerCase();
    if (!email) return;

    let cancelled = false;
    (async () => {
      try {
        const deps = await governanceService.getDepartments({ level: 2 });
        const match = deps.find(d => (d.email || '').trim().toLowerCase() === email)
          || deps.find(d => (d.userId?.email || '').trim().toLowerCase() === email);
        if (!cancelled) setMyDepartmentFromApi(match || null);
      } catch (e) {
        if (!cancelled) setMyDepartmentFromApi(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser?.email]);

  if (!currentUser || !governanceType) {
    return null;
  }

  const governanceKey = governanceType.toLowerCase() as 'city' | 'panchayat';
  const level2RoleLabel = t(
    `roles.${governanceKey}.LEVEL_2`,
    getLevelDisplayName(governanceType, 'LEVEL_2')
  );
  const level3RoleLabel = t(
    `roles.${governanceKey}.LEVEL_3`,
    getLevelDisplayName(governanceType, 'LEVEL_3')
  );

  // Department of current user
  const myDepartment = departments.find(d => d.id === currentUser.department);

  const resolvedDepartmentName = myDepartmentFromApi?.name || myDepartment?.name;
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const resolvedDepartmentNeedle = resolvedDepartmentName ? normalize(resolvedDepartmentName) : null;
  const resolvedDepartmentId = (myDepartmentFromApi?._id || '').toString().trim();

  const departmentKeywords = React.useMemo(() => {
    if (!resolvedDepartmentNeedle) return [] as string[];
    const stop = new Set(['department', 'dept', 'office', 'division', 'unit', 'of', 'and', 'the']);
    return resolvedDepartmentNeedle
      .split(' ')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(w => !stop.has(w))
      .filter(w => w.length >= 4);
  }, [resolvedDepartmentNeedle]);

  const departmentAliasKeywords = React.useMemo(() => {
    // Minimal, targeted aliasing to ensure common complaint wording maps to departments.
    // Electricity often receives "street light" complaints even if categories don't say "Electricity".
    if (!resolvedDepartmentNeedle) return [] as string[];
    if (resolvedDepartmentNeedle.includes('electricity')) {
      return [
        'street light',
        'street lighting',
        'lighting',
        'light',
        'power',
        'meter',
        'billing',
        'transformer',
      ];
    }
    return [] as string[];
  }, [resolvedDepartmentNeedle]);

  const myComplaints = myDepartment
    ? getComplaintsByDepartment(complaints, myDepartment.id)
    : [];
  const stats = getComplaintStats(myComplaints);

  // Filter complaints by department - match department name with issue categories
  const departmentComplaints = resolvedDepartmentNeedle
    ? apiComplaints.filter(complaint => {
        const complaintDeptId = (complaint.departmentId || '').toString().trim();
        if (resolvedDepartmentId && complaintDeptId && complaintDeptId === resolvedDepartmentId) {
          return true;
        }

        const categories = complaint.issue_category || [];
        const categoryText = normalize(categories.join(' '));
        const titleText = normalize(String((complaint as any).title || ''));
        const complaintText = normalize(String((complaint as any).complaint || ''));
        const summaryText = normalize(String((complaint as any).summarized_complaint || ''));
        const haystack = [categoryText, titleText, complaintText, summaryText].filter(Boolean).join(' ');

        if (!haystack) return false;
        if (haystack.includes(resolvedDepartmentNeedle)) return true;

        const allKeywords = [...departmentKeywords, ...departmentAliasKeywords].filter(Boolean);
        return allKeywords.some(k => {
          const needle = normalize(k);
          if (!needle) return false;
          return haystack.includes(needle);
        });
      })
    : apiComplaints;

  const visibleDepartmentComplaints = departmentComplaints.filter(c => {
    const s = String(c.status || '').toLowerCase();
    return !s.includes('resolved');
  });

  // Calculate stats from the same list shown in the table (resolved items are hidden)
  const apiStats = {
    total: visibleDepartmentComplaints.length,
    open: visibleDepartmentComplaints.filter(c => c.status.toLowerCase().includes('todo') || c.status.toLowerCase().includes('registered')).length,
    inProgress: visibleDepartmentComplaints.filter(c => c.status.toLowerCase().includes('progress') || c.status.toLowerCase().includes('investigation')).length,
    closed: visibleDepartmentComplaints.filter(c => c.status.toLowerCase().includes('completed') || c.status.toLowerCase().includes('resolved')).length,
  };
  const subordinates = getSubordinates(users, currentUser.id);

  // One-time cleanup: remove specific Zone Officers from saved state
  React.useEffect(() => {
    if (!currentUser) return;

    const blockedNames = new Set(["sanjay", "likhith"]);
    const toRemove = users.filter(
      u =>
        u.level === "LEVEL_3" &&
        u.reportsTo === currentUser.id &&
        blockedNames.has((u.name || "").trim().toLowerCase())
    );

    toRemove.forEach(u => removeUser(u.id));
  }, [currentUser, removeUser, users]);

  const handleStatusUpdate = (complaintId: string, newStatus: string) => {
    updateComplaint(complaintId, { status: newStatus as any });
    setSelectedComplaint(null);
  };

  const handleEscalate = (complaintId: string) => {
    const superiorUser = users.find(u => u.id === currentUser.reportsTo);
    if (superiorUser) {
      escalateComplaint(complaintId, superiorUser.id);
    }
  };

  const isMongoObjectId = (value?: string) => {
    if (!value) return false;
    return /^[a-f\d]{24}$/i.test(value);
  };

  const handleAddZoneOfficer = async (data: { name: string; email: string; phone?: string; areaId?: string }) => {
    try {
      const selectedAreaName = data.areaId
        ? areas.find(a => a.id === data.areaId)?.name
        : undefined;
      const result = await governanceService.addOfficer({
        name: data.name,
        email: data.email,
        phone: data.phone,
        governanceType: governanceType.toLowerCase() as 'city' | 'panchayat',
        level: 3,
        // Only send these if they are real Mongo IDs (prevents Mongoose cast errors)
        departmentId: isMongoObjectId(myDepartment?.id) ? myDepartment?.id : undefined,
        departmentName: resolvedDepartmentName || myDepartmentFromApi?.name || myDepartment?.name,
        areaId: isMongoObjectId(data.areaId) ? data.areaId : undefined,
        areaName: selectedAreaName,
        reportsTo: currentUser.id,
      });

      // Update local (mock) state for UI
      const newUser = {
        id: generateUserId(),
        name: data.name,
        email: data.email,
        level: "LEVEL_3" as const,
        governanceType,
        department: myDepartment?.id,
        areaId: data.areaId || areas.find(a => a.type === "ZONE" || a.type === "TALUK")?.id,
        createdAt: new Date(),
        status: "PENDING_INVITE" as const,
        reportsTo: currentUser.id,
      };
      addUser(newUser);

      toast({
        title: t('level2.toast.officerAddedTitle', 'Officer Added Successfully!'),
        description: result.emailSent
          ? t(
              'level2.toast.officerAddedEmailSent',
              '{{name}} has been added. Login credentials sent to {{email}}',
              { name: data.name, email: data.email }
            )
          : t(
              'level2.toast.officerAddedEmailUnavailable',
              '{{name}} has been added. Email service unavailable - credentials logged.',
              { name: data.name }
            ),
        variant: result.emailSent ? "default" : "destructive",
      });

      if (!result.emailSent && result.credentials) {
        console.log('Generated credentials (Email not sent):', result.credentials);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('level2.errors.addOfficerFailed', 'Failed to add officer.');
      toast({
        title: t('level2.toast.errorAddingOfficerTitle', 'Error Adding Officer'),
        description: message,
        variant: "destructive",
      });
      console.error('Error adding zone officer:', error);
    }
  };

  // Prepare chart data from department complaints.
  // Buckets by the last 7 calendar days (oldest -> newest) in local time.
  // "received" is counted by complaint creation date (`date`),
  // "resolved" is counted by last update date (`lastupdate`) for currently resolved complaints.
  const dailyComplaints = React.useMemo(() => {
    const dayLabels = [
      t('days.sunShort', 'Sun'),
      t('days.monShort', 'Mon'),
      t('days.tueShort', 'Tue'),
      t('days.wedShort', 'Wed'),
      t('days.thuShort', 'Thu'),
      t('days.friShort', 'Fri'),
      t('days.satShort', 'Sat'),
    ];

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isResolved = (status: unknown) => {
      const s = String(status || '').toLowerCase();
      return s.includes('resolved') || s.includes('completed');
    };

    const todayStart = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() - (6 - i));
      return d;
    });

    const receivedByDay = new Map<string, number>();
    const resolvedByDay = new Map<string, number>();

    for (const complaint of departmentComplaints) {
      const createdAt = new Date((complaint as any).date ?? (complaint as any).lastupdate);
      if (!Number.isNaN(createdAt.getTime())) {
        const key = dayKey(createdAt);
        receivedByDay.set(key, (receivedByDay.get(key) || 0) + 1);
      }

      if (isResolved((complaint as any).status)) {
        const updatedAt = new Date((complaint as any).lastupdate ?? (complaint as any).date);
        if (!Number.isNaN(updatedAt.getTime())) {
          const key = dayKey(updatedAt);
          resolvedByDay.set(key, (resolvedByDay.get(key) || 0) + 1);
        }
      }
    }

    return days.map(d => {
      const key = dayKey(d);
      return {
        day: dayLabels[d.getDay()] || key,
        received: receivedByDay.get(key) || 0,
        resolved: resolvedByDay.get(key) || 0,
      };
    });
  }, [departmentComplaints, t]);

  const statusBreakdown = [
    { name: t('dashboard.stats.open', 'Open'), value: apiStats.open },
    { name: t('dashboard.stats.inProgress', 'In Progress'), value: apiStats.inProgress },
    { name: t('dashboard.stats.closed', 'Closed'), value: apiStats.closed }
  ].filter(d => d.value > 0);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {level2RoleLabel} {t('dashboard.title', 'Dashboard')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.labels.department', 'Department')}: <strong>{resolvedDepartmentName || t('dashboard.misc.notAssigned', 'Not assigned')}</strong>
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title={t('dashboard.stats.totalComplaints', 'Total Complaints')}
              value={apiStats.total}
              icon={<FileText className="w-4 h-4" />}
            />
            <StatCard
              title={t('dashboard.stats.open', 'Open')}
              value={apiStats.open}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title={t('dashboard.stats.inProgress', 'In Progress')}
              value={apiStats.inProgress}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title={t('dashboard.stats.closed', 'Closed')}
              value={apiStats.closed}
              icon={<FileText className="w-4 h-4" />}
            />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              const next = (value || 'overview') as 'overview' | 'complaints' | 'zones';
              setActiveTab(next);
              if (next === 'complaints') navigate('/dashboard/level2/complaints');
              else if (next === 'zones') navigate('/dashboard/level2/zones');
              else navigate('/dashboard/level2');
            }}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="overview">{t('dashboard.overview', 'Overview')}</TabsTrigger>
              <TabsTrigger value="complaints">{t('dashboard.complaints', 'Complaints')}</TabsTrigger>
              <TabsTrigger value="zones">{parentLabel}</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.sections.dailyTrend', 'Daily Trend')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyComplaints}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="received"
                          name={t('level2.charts.received', 'Received')}
                          stroke="#3b82f6"
                        />
                        <Line
                          type="monotone"
                          dataKey="resolved"
                          name={t('level2.charts.resolved', 'Resolved')}
                          stroke="#10b981"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.sections.statusBreakdown', 'Status Breakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">{t('common.noData', 'No data available')}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <ComplaintsHeatmap
                complaints={departmentComplaints}
                title={t("dashboard.heatmap.title", "Complaints Heatmap")}
              />
            </TabsContent>

            {/* Complaints */}
            <TabsContent value="complaints" className="space-y-4">
              {isLoadingComplaints ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    {t('level1.loadingComplaints', 'Loading complaints...')}
                  </CardContent>
                </Card>
              ) : (
                <ComplaintsTable 
                  complaints={departmentComplaints} 
                  onComplaintUpdate={fetchComplaints}
                />
              )}
            </TabsContent>

            {/* Zones */}
            <TabsContent value="zones" className="space-y-4">
              <UserListCard
                users={subordinates}
                title={t('level2.team.underYouTitle', '{{role}}s Under You', {
                  role: level3RoleLabel,
                })}
              />
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('level2.team.addOfficerTitle', 'Add {{role}}', {
                      role: level3RoleLabel,
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddOfficerDialog
                    roleTitle={level3RoleLabel}
                    areas={(() => {
                      const selectable = areas.filter(a => a.type === "ZONE" || a.type === "TALUK");
                      if ((governanceType || "CITY").toString().toUpperCase() !== "CITY") return selectable;
                      const order = new Map([
                        ["east zone", 0],
                        ["west zone", 1],
                        ["central zone", 2],
                        ["north zone", 3],
                        ["south zone", 4],
                      ]);
                      return [...selectable].sort((a, b) => {
                        const aKey = (a.name || "").toString().trim().toLowerCase();
                        const bKey = (b.name || "").toString().trim().toLowerCase();
                        const ai = order.get(aKey) ?? 999;
                        const bi = order.get(bKey) ?? 999;
                        if (ai !== bi) return ai - bi;
                        return aKey.localeCompare(bKey);
                      });
                    })()}
                    onSubmit={handleAddZoneOfficer}
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('common.add', 'Add')} {level3RoleLabel}
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Update Status Dialog */}
      {selectedComplaint && (
        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('complaintsTable.updateStatus.title', 'Update Status')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('dashboard.labels.complaint', 'Complaint')}: {selectedComplaint.title}</p>
              <div>
                <Label>{t('complaintsTable.updateStatus.newStatus', 'New Status')}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.actions.selectNewStatus', 'Select new status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">{t('dashboard.statusOptions.open', 'Open')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{t('dashboard.statusOptions.inProgress', 'In Progress')}</SelectItem>
                    <SelectItem value="WORK_DONE">{t('dashboard.statusOptions.workDone', 'Work Done')}</SelectItem>
                    <SelectItem value="VERIFIED">{t('dashboard.statusOptions.verified', 'Verified')}</SelectItem>
                    <SelectItem value="CLOSED">{t('dashboard.statusOptions.closed', 'Closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleStatusUpdate(selectedComplaint.id, newStatus)}
                disabled={!newStatus}
                className="w-full"
              >
                {t('complaintsTable.updateStatus.submit', 'Update Status')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

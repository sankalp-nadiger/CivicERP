/**
 * LEVEL_4 DASHBOARD
 * Ward Officer / Panchayat Clerk
 * PRIMARY OWNER OF COMPLAINTS - assigns to executors, tracks SLA
 */

import React, { useState, useEffect } from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import {
  getAssignedComplaintsForContractor,
  getScopedComplaints,
  Complaint as ApiComplaint,
} from "@/services/complaintService";
import { ComplaintsTable } from "@/components/dashboard/shared/ComplaintsTable";
import { ComplaintsHeatmap } from "@/components/dashboard/shared/ComplaintsHeatmap";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { StatCard, ComplaintCard } from "@/components/dashboard/DashboardComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getLevelDisplayName, getAreaHierarchy } from "@/config/governanceTemplates";
import {
  getComplaintStats,
  getComplaintsByArea,
  getSubordinates,
  calculateSLAStatus
} from "@/lib/governanceUtils";
import { FileText, AlertCircle, CheckCircle, Clock, MapPin } from "lucide-react";

export default function Level4Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const {
    governanceType,
    currentUser,
    areas,
    users,
    complaints,
    setCurrentUser,
    updateComplaint,
    escalateComplaint
  } = useGovernance();
  const { toast } = useToast();
  const [selectedComplaint, setSelectedComplaint] = React.useState<any>(null);
  const [assignToUser, setAssignToUser] = React.useState("");
  const [apiComplaints, setApiComplaints] = useState<ApiComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  // Fetch complaints from database
  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const isContractor = String(authUser?.role || '').toLowerCase() === 'contractor';
      const { complaints: fetchedComplaints, message } = isContractor
        ? await getAssignedComplaintsForContractor()
        : await getScopedComplaints();
      setApiComplaints(fetchedComplaints);

      if (message && fetchedComplaints.length === 0) {
        toast({
          title: isContractor ? 'No assigned complaints' : 'No scoped complaints',
          description: message,
        });
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to fetch complaints from the database';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.role]);

  const sidebar = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    const myAreaLabel = hierarchy.child === "WARD" ? t("dashboard.myWard", "My Ward") : t("dashboard.myVillage", "My Village");
    return [
      { label: t("dashboard.overview", "Overview"), path: "/dashboard/level4", icon: <FileText className="w-4 h-4" /> },
      { label: t("dashboard.myComplaints", "My Complaints"), path: "/dashboard/level4/complaints", icon: <AlertCircle className="w-4 h-4" /> },
      { label: myAreaLabel, path: "/dashboard/level4/area", icon: <MapPin className="w-4 h-4" /> },
      { label: t("dashboard.slaStatus", "SLA Status"), path: "/dashboard/level4/sla", icon: <Clock className="w-4 h-4" /> }
    ];
  }, [governanceType, t]);

  React.useEffect(() => {
    if (!currentUser) {
      const level4User = users.find(u => u.level === "LEVEL_4");
      if (level4User) {
        setCurrentUser(level4User);
      }
    }
  }, [currentUser, users, setCurrentUser]);

  if (!currentUser || !governanceType) {
    return null;
  }

  const myArea = areas.find(a => a.id === currentUser.areaId);
  const myComplaints = currentUser.areaId ? getComplaintsByArea(complaints, currentUser.areaId) : [];
  const stats = getComplaintStats(myComplaints);

  const normalizeComplaintStatus = (raw: unknown) => {
    const text = String(raw ?? '').trim();
    if (!text) return '';
    const upper = text.toUpperCase();
    if ([
      'OPEN',
      'ASSIGNED',
      'WORK_STARTED',
      'IN_PROGRESS',
      'WORK_COMPLETED',
      'VERIFIED',
      'CLOSED',
    ].includes(upper)) {
      return upper;
    }
    const lower = text.toLowerCase();
    if (lower === 'todo' || lower.includes('registered') || lower === 'open') return 'OPEN';
    if (lower === 'assigned') return 'ASSIGNED';
    if (lower === 'work_started' || lower === 'work started' || lower === 'started') return 'WORK_STARTED';
    if (lower === 'in-progress' || lower === 'in progress' || lower === 'in_progress' || lower === 'progress' || lower.includes('investigation')) return 'IN_PROGRESS';
    if (lower === 'work_completed' || lower === 'work completed' || lower === 'completed' || lower === 'work done') return 'WORK_COMPLETED';
    if (lower === 'verified') return 'VERIFIED';
    if (lower === 'closed' || lower === 'resolved') return 'CLOSED';
    return '';
  };

  // Calculate stats from API complaints
  const apiStats = {
    total: apiComplaints.length,
    open: apiComplaints.filter(c => normalizeComplaintStatus(c.status) === 'OPEN').length,
    inProgress: apiComplaints.filter(c => ['ASSIGNED', 'WORK_STARTED', 'IN_PROGRESS', 'WORK_COMPLETED', 'VERIFIED'].includes(normalizeComplaintStatus(c.status))).length,
    closed: apiComplaints.filter(c => normalizeComplaintStatus(c.status) === 'CLOSED').length,
  };
  const executors = getSubordinates(users, currentUser.id);

  const breachedComplaints = myComplaints.filter(
    c => calculateSLAStatus(c).status === "BREACHED"
  );

  const handleAssignComplaint = (complaintId: string) => {
    if (assignToUser) {
      updateComplaint(complaintId, { assignedTo: assignToUser, status: "IN_PROGRESS" });
      setSelectedComplaint(null);
      setAssignToUser("");
    }
  };

  const handleEscalate = (complaintId: string) => {
    const superiorUser = users.find(u => u.id === currentUser.reportsTo);
    if (superiorUser) {
      escalateComplaint(complaintId, superiorUser.id);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getLevelDisplayName(governanceType, "LEVEL_4")} {t("dashboard.title", "Dashboard")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.labels.area', 'Area')}: <strong>{myArea?.name || t('dashboard.misc.notAssigned', 'Not assigned')}</strong> | {t('dashboard.misc.primaryOwner', 'Primary complaint owner')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title={t('dashboard.stats.totalComplaints', 'Total Complaints')} value={apiStats.total} icon={<FileText className="w-4 h-4" />} />
            <StatCard title={t('dashboard.stats.open', 'Open')} value={apiStats.open} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title={t('dashboard.stats.inProgress', 'In Progress')} value={apiStats.inProgress} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title={t('dashboard.stats.closed', 'Closed')} value={apiStats.closed} icon={<CheckCircle className="w-4 h-4" />} />
          </div>

          {breachedComplaints.length > 0 && (
            <Card className="mb-8 border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">⚠️ {t('dashboard.sla.breachAlert', 'SLA Breach Alert')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800">
                  {t('dashboard.sla.breachMessage', {
                    defaultValue: '{{count}} complaints have breached SLA. Please escalate immediately.',
                    count: breachedComplaints.length,
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="mb-8">
            <ComplaintsHeatmap
              complaints={apiComplaints}
              title={t("dashboard.heatmap.title", "Complaints Heatmap")}
            />
          </div>

          <Tabs defaultValue="complaints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="complaints">{t("dashboard.myComplaints", "My Complaints")}</TabsTrigger>
              <TabsTrigger value="sla">{t("dashboard.slaStatus", "SLA Status")}</TabsTrigger>
              <TabsTrigger value="executors">{t("dashboard.executors", "Assigned Executors")}</TabsTrigger>
            </TabsList>

            <TabsContent value="complaints">
              {isLoadingComplaints ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    {t('dashboard.misc.loadingComplaints', 'Loading complaints...')}
                  </CardContent>
                </Card>
              ) : (
                <ComplaintsTable 
                  complaints={apiComplaints} 
                  onComplaintUpdate={fetchComplaints}
                />
              )}
            </TabsContent>

            <TabsContent value="sla">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.sla.timeline', 'SLA Timeline')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myComplaints.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('dashboard.misc.noComplaints', 'No complaints')}</p>
                    ) : (
                      myComplaints.map(complaint => {
                        const slaStatus = calculateSLAStatus(complaint);
                        return (
                          <div key={complaint.id} className="border p-3 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm">{complaint.title}</p>
                              <Badge
                                variant={
                                  slaStatus.status === "BREACHED"
                                    ? "destructive"
                                    : slaStatus.status === "NEAR_BREACH"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {slaStatus.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Created: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                              <span>Deadline: {slaStatus.deadline.toLocaleDateString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className={`h-2 rounded-full ${
                                  slaStatus.status === "BREACHED"
                                    ? "bg-red-500"
                                    : slaStatus.status === "NEAR_BREACH"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${slaStatus.percentageUsed}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {slaStatus.percentageUsed}% used ({slaStatus.hoursRemaining} hours remaining)
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="executors">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.executors', 'Assigned Executors')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {executors.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('dashboard.misc.noExecutors', 'No executors assigned')}</p>
                    ) : (
                      executors.map(executor => (
                        <div key={executor.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
                          <div>
                            <p className="font-medium text-sm">{executor.name}</p>
                            <p className="text-xs text-gray-500">{executor.email}</p>
                          </div>
                          <Badge variant="outline">{executor.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedComplaint && (
        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.assign.title', 'Assign to Executor')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('dashboard.labels.complaint', 'Complaint')}: {selectedComplaint.title}</p>
              <div>
                <Label>{t('dashboard.assign.assignTo', 'Assign To')}</Label>
                <Select value={assignToUser} onValueChange={setAssignToUser}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.assign.selectExecutor', 'Select executor')} />
                  </SelectTrigger>
                  <SelectContent>
                    {executors.map(executor => (
                      <SelectItem key={executor.id} value={executor.id}>
                        {executor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleAssignComplaint(selectedComplaint.id)}
                disabled={!assignToUser}
                className="w-full"
              >
                {t('dashboard.assign.submit', 'Assign Complaint')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

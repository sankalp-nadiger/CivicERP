/**
 * LEVEL_3 DASHBOARD
 * Zone Officer / Panchayat Development Officer
 * Manages complaints in their area and subordinate Ward Officers
 */

import React, { useState, useEffect } from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { StatCard, ComplaintCard, AddOfficerDialog, UserListCard } from "@/components/dashboard/DashboardComponents";
import { getScopedComplaints, Complaint as ApiComplaint } from "@/services/complaintService";
import * as governanceService from "@/services/governanceService";
import { ComplaintsTable } from "@/components/dashboard/shared/ComplaintsTable";
import { ComplaintsHeatmap } from "@/components/dashboard/shared/ComplaintsHeatmap";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getLevelDisplayName, getAreaHierarchy } from "@/config/governanceTemplates";
import {
  getComplaintStats,
  getComplaintsByArea,
  getSubordinates,
  getChildAreas,
  generateUserId
} from "@/lib/governanceUtils";
import { FileText, AlertCircle, Users, Plus } from "lucide-react";

export default function Level3Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const {
    governanceType,
    currentUser,
    departments,
    areas,
    users,
    complaints,
    setCurrentUser,
    updateComplaint,
    escalateComplaint,
    addUser
  } = useGovernance();

  const [selectedComplaint, setSelectedComplaint] = React.useState<any>(null);
  const [newStatus, setNewStatus] = React.useState("");
  const [apiComplaints, setApiComplaints] = useState<ApiComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  // Fetch complaints from database
  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const { complaints: fetchedComplaints, message } = await getScopedComplaints();
      setApiComplaints(fetchedComplaints);

      if (message && fetchedComplaints.length === 0) {
        toast({
          title: 'No scoped complaints',
          description: message,
        });
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch your scoped complaints from the database';
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
  }, []);

  const sidebar = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    const childLabel = hierarchy.child === "WARD" ? t("dashboard.wards", "Wards") : t("dashboard.villages", "Villages");
    return [
      { label: t("dashboard.overview", "Overview"), path: "/dashboard/level3", icon: <FileText className="w-4 h-4" /> },
      { label: t("dashboard.complaints", "Complaints"), path: "/dashboard/level3/complaints", icon: <AlertCircle className="w-4 h-4" /> },
      { label: childLabel, path: "/dashboard/level3/wards", icon: <Users className="w-4 h-4" /> },
      { label: `${getLevelDisplayName(governanceType || 'CITY', "LEVEL_4")}s`, path: "/dashboard/level3/officers", icon: <Users className="w-4 h-4" /> }
    ];
  }, [governanceType, t]);

  React.useEffect(() => {
    if (!currentUser) {
      const level3User = users.find(u => u.level === "LEVEL_3");
      if (level3User) {
        setCurrentUser(level3User);
      }
    }
  }, [currentUser, users, setCurrentUser]);

  if (!currentUser || !governanceType) {
    return null;
  }

  const myArea = areas.find(a => a.id === currentUser.areaId);
  const myComplaints = currentUser.areaId ? getComplaintsByArea(complaints, currentUser.areaId) : [];
  const stats = getComplaintStats(myComplaints);

  // Calculate stats from API complaints
  const apiStats = {
    total: apiComplaints.length,
    open: apiComplaints.filter(c => c.status.toLowerCase().includes('todo') || c.status.toLowerCase().includes('registered')).length,
    inProgress: apiComplaints.filter(c => c.status.toLowerCase().includes('progress') || c.status.toLowerCase().includes('investigation')).length,
    closed: apiComplaints.filter(c => c.status.toLowerCase().includes('completed') || c.status.toLowerCase().includes('resolved')).length,
  };
  const subordinates = getSubordinates(users, currentUser.id);
  const childAreas = currentUser.areaId ? getChildAreas(areas, currentUser.areaId) : [];

  const isMongoObjectId = (value?: string) => {
    if (!value) return false;
    return /^[a-f\d]{24}$/i.test(value);
  };

  const handleEscalate = (complaintId: string) => {
    const superiorUser = users.find(u => u.id === currentUser.reportsTo);
    if (superiorUser) {
      escalateComplaint(complaintId, superiorUser.id);
    }
  };

  const handleAddWardOfficer = async (data: { name: string; email: string; phone?: string; areaId?: string }) => {
    try {
      const selectedAreaId = data.areaId || childAreas[0]?.id;
      const selectedAreaName = selectedAreaId ? areas.find(a => a.id === selectedAreaId)?.name : undefined;

      const myDepartment = currentUser.department
        ? departments.find(d => d.id === currentUser.department)
        : undefined;

      const result = await governanceService.addOfficer({
        name: data.name,
        email: data.email,
        phone: data.phone,
        governanceType: governanceType.toLowerCase() as 'city' | 'panchayat',
        level: 4,
        departmentId: isMongoObjectId(myDepartment?.id) ? myDepartment?.id : undefined,
        departmentName: myDepartment?.name,
        areaId: isMongoObjectId(selectedAreaId) ? selectedAreaId : undefined,
        areaName: selectedAreaName,
        reportsTo: currentUser.id,
      });

      // Update local (mock) state for UI
      const newUser = {
        id: generateUserId(),
        name: data.name,
        email: data.email,
        level: "LEVEL_4" as const,
        governanceType,
        department: currentUser.department,
        areaId: selectedAreaId,
        createdAt: new Date(),
        status: "PENDING_INVITE" as const,
        reportsTo: currentUser.id,
      };
      addUser(newUser);

      toast({
        title: "Officer Added Successfully!",
        description: result.emailSent
          ? `${data.name} has been added. Login credentials sent to ${data.email}`
          : `${data.name} has been added. Email service unavailable - credentials logged.`,
        variant: result.emailSent ? "default" : "destructive",
      });

      if (!result.emailSent && result.credentials) {
        console.log('Generated credentials (Email not sent):', result.credentials);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add officer.';
      toast({
        title: "Error Adding Officer",
        description: message,
        variant: "destructive",
      });
      console.error('Error adding ward officer:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getLevelDisplayName(governanceType, "LEVEL_3")} {t("dashboard.title", "Dashboard")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.labels.area', 'Area')}: <strong>{myArea?.name || t('dashboard.misc.notAssigned', 'Not assigned')}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title={t('dashboard.stats.totalComplaints', 'Total Complaints')} value={apiStats.total} icon={<FileText className="w-4 h-4" />} />
            <StatCard title={t('dashboard.stats.open', 'Open')} value={apiStats.open} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title={t('dashboard.stats.inProgress', 'In Progress')} value={apiStats.inProgress} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title={t('dashboard.stats.closed', 'Closed')} value={apiStats.closed} icon={<AlertCircle className="w-4 h-4" />} />
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t("dashboard.overview", "Overview")}</TabsTrigger>
              <TabsTrigger value="complaints">{t("dashboard.complaints", "Complaints")}</TabsTrigger>
              <TabsTrigger value="team">{t("dashboard.officers", "Officers")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.sections.areaSummary', 'Area Summary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        {t('dashboard.labels.total', 'Total')} {governanceType === "CITY" ? t('dashboard.wards', 'Wards') : t('dashboard.villages', 'Villages')}
                      </p>
                      <p className="text-2xl font-bold">{childAreas.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">{getLevelDisplayName(governanceType, "LEVEL_4")}s</p>
                      <p className="text-2xl font-bold">{subordinates.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ComplaintsHeatmap
                complaints={apiComplaints}
                title={t("dashboard.heatmap.title", "Complaints Heatmap")}
              />
            </TabsContent>

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

            <TabsContent value="team" className="space-y-4">
              <UserListCard users={subordinates} title={`${getLevelDisplayName(governanceType, "LEVEL_4")}s Under You`} />
              <Card>
                <CardHeader>
                  <CardTitle>Add {getLevelDisplayName(governanceType, "LEVEL_4")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddOfficerDialog
                    roleTitle={getLevelDisplayName(governanceType, "LEVEL_4")}
                    areas={childAreas}
                    onSubmit={handleAddWardOfficer}
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {getLevelDisplayName(governanceType, "LEVEL_4")}
                      </Button>
                    }
                  />
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
              <DialogTitle>Update Complaint Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Complaint: {selectedComplaint.title}</p>
              <div>
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WORK_DONE">Work Done</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  updateComplaint(selectedComplaint.id, { status: newStatus as any });
                  setSelectedComplaint(null);
                }}
                disabled={!newStatus}
                className="w-full"
              >
                Update Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/**
 * LEVEL_1 DASHBOARD
 * Municipal Commissioner / Zilla Panchayat CEO
 * Top-level admin who manages entire governance structure
 */

import React, { useCallback, useState, useEffect } from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  StatCard,
  CreateDepartmentDialog,
  AddOfficerDialog,
  UserListCard
} from "@/components/dashboard/DashboardComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getLevelDisplayName, getAreaHierarchy } from "@/config/governanceTemplates";
import {
  getComplaintStats,
  getUsersByLevel,
  getChildAreas,
  generateDepartmentId,
  generateAreaId,
  generateUserId
} from "@/lib/governanceUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Users, Building2, MapPin, FileText, Plus, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { ComplaintsTable } from "@/components/dashboard/shared/ComplaintsTable";
import { ComplaintsHeatmap } from "@/components/dashboard/shared/ComplaintsHeatmap";
import { getAllComplaints, Complaint as ApiComplaint } from "@/services/complaintService";
import * as governanceService from "@/services/governanceService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Level1Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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
    addDepartment,
    removeDepartment,
    addArea,
    removeArea,
    addUser,
    removeUser
  } = useGovernance();

  const [apiComplaints, setApiComplaints] = useState<ApiComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'department' | 'area' | 'user', id: string, name: string} | null>(null);

  const visibleComplaints = React.useMemo(() => {
    return apiComplaints.filter(c => {
      const s = String(c.status || '').toLowerCase();
      return !s.includes('resolved');
    });
  }, [apiComplaints]);
  
  // Determine active section from URL path
  const getActiveSectionFromPath = () => {
    const path = location.pathname;
    if (path.includes('/departments')) return 'departments';
    if (path.includes('/users')) return 'users';
    if (path.includes('/complaints')) return 'complaints';
    return 'overview';
  };

  const sidebar = React.useMemo(() => {
    return [
      { label: t("dashboard.overview", "Overview"), path: "/dashboard/level1", icon: <FileText className="w-4 h-4" /> },
      { label: t("dashboard.complaints", "Complaints"), path: "/dashboard/level1/complaints", icon: <FileText className="w-4 h-4" /> },
      { label: t("dashboard.departments", "Departments"), path: "/dashboard/level1/departments", icon: <Building2 className="w-4 h-4" /> },
      { label: t("dashboard.users", "Users"), path: "/dashboard/level1/users", icon: <Users className="w-4 h-4" /> }
    ];
  }, [governanceType, t]);

  // Guard legacy URLs (previously /areas was used for Zones/Taluks)
  React.useEffect(() => {
    if (location.pathname.includes('/dashboard/level1/areas')) {
      navigate('/dashboard/level1', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Update active section when location changes
  useEffect(() => {
    setActiveSection(getActiveSectionFromPath());
  }, [location.pathname]);

  // Fetch complaints from database
  const fetchComplaints = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) setIsLoadingComplaints(true);
      try {
        const fetchedComplaints = await getAllComplaints();
        setApiComplaints(fetchedComplaints);
      } catch (error) {
        console.error('Failed to fetch complaints:', error);
        toast({
          title: t("common.error", "Error"),
          description: t("level1.toast.fetchComplaintsFailed", "Failed to fetch complaints from the database"),
          variant: 'destructive',
        });
      } finally {
        if (!silent) setIsLoadingComplaints(false);
      }
    },
    [toast, t]
  );

  React.useEffect(() => {
    if (!currentUser) {
      // Auto-select LEVEL_1 user if not selected
      const level1User = users.find(u => u.level === "LEVEL_1");
      if (level1User) {
        setCurrentUser(level1User);
      }
    }
  }, [currentUser, users, setCurrentUser]);

  useEffect(() => {
    // Initial load (shows loading state in complaints tab)
    fetchComplaints();

    // Keep stats fresh when new complaints are raised elsewhere.
    const refreshSilently = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetchComplaints({ silent: true });
    };

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', refreshSilently);
    const intervalId = window.setInterval(refreshSilently, 30_000);

    return () => {
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', refreshSilently);
      window.clearInterval(intervalId);
    };
  }, [fetchComplaints]);

  if (!currentUser || !governanceType) {
    return null;
  }

  const governanceKey = governanceType.toLowerCase() as "city" | "panchayat";
  const level1RoleLabel = t(
    `roles.${governanceKey}.LEVEL_1`,
    getLevelDisplayName(governanceType, "LEVEL_1")
  );
  const level2RoleLabel = t(
    `roles.${governanceKey}.LEVEL_2`,
    getLevelDisplayName(governanceType, "LEVEL_2")
  );
  const level3RoleLabel = t(
    `roles.${governanceKey}.LEVEL_3`,
    getLevelDisplayName(governanceType, "LEVEL_3")
  );
  const dashboardTitle = t("dashboard.title", "Dashboard");

  const stats = getComplaintStats(complaints);
  const level2Users = getUsersByLevel(users, "LEVEL_2");
  const level3Users = getUsersByLevel(users, "LEVEL_3");

  // Calculate stats from API complaints.
  // The complaints table hides resolved items, so keep "total" aligned to what's visible.
  const apiStats = {
    total: visibleComplaints.length,
    open: visibleComplaints.filter(c => c.status.toLowerCase().includes('todo') || c.status.toLowerCase().includes('registered')).length,
    inProgress: visibleComplaints.filter(c => c.status.toLowerCase().includes('progress') || c.status.toLowerCase().includes('investigation')).length,
    closed: apiComplaints.filter(c => c.status.toLowerCase().includes('completed') || c.status.toLowerCase().includes('resolved')).length,
    breached: 0, // Would need SLA data from backend
  };

  const handleCreateDepartment = async (data: { name: string; description: string; contactPerson: string; email: string; phone?: string }) => {
    try {
      // Call backend API to create department and send email
      const result = await governanceService.createDepartment({
        name: data.name,
        description: data.description,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        governanceType: governanceType.toLowerCase() as 'city' | 'panchayat', // Convert to lowercase for backend
        level: 2, // Department Head is Level 2
      });

      // Also add to local state
      addDepartment({
        id: generateDepartmentId(),
        name: data.name,
        description: data.description,
        governanceType,
        createdAt: new Date()
      });

      toast({
        title: t("level1.toast.departmentCreatedTitle", "Department Created Successfully!"),
        description: result.emailSent 
          ? t("level1.toast.departmentCreatedEmailSent", "{{name}} has been created. Login credentials sent to {{email}}", { name: data.name, email: data.email })
          : t("level1.toast.departmentCreatedEmailUnavailable", "{{name}} has been created. Email service unavailable - credentials logged.", { name: data.name }),
        variant: result.emailSent ? "default" : "destructive",
      });
      
      if (!result.emailSent && result.credentials) {
        console.log('Generated credentials (Email not sent):', result.credentials);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("level1.errors.createDepartmentFailed", "Failed to create department.");
      toast({
        title: t("level1.toast.errorCreatingDepartmentTitle", "Error Creating Department"),
        description: message,
        variant: "destructive",
      });
      console.error('Error creating department:', error);
    }
  };

  const handleAddOfficer = async (data: { name: string; email: string; phone?: string; departmentId?: string }) => {
    try {
      // Call backend API to add officer and send email
      const result = await governanceService.addOfficer({
        name: data.name,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId || departments[0]?.id,
        governanceType: governanceType.toLowerCase() as 'city' | 'panchayat', // Convert to lowercase for backend
        level: 2,
        reportsTo: currentUser.id,
      });

      // Also add to local state
      const newUser = {
        id: generateUserId(),
        name: data.name,
        email: data.email,
        level: "LEVEL_2" as const,
        governanceType,
        department: data.departmentId || departments[0]?.id,
        createdAt: new Date(),
        status: "PENDING_INVITE" as const,
        reportsTo: currentUser.id
      };
      addUser(newUser);

      toast({
        title: t("level1.toast.officerAddedTitle", "Officer Added Successfully!"),
        description: result.emailSent 
          ? t("level1.toast.officerAddedEmailSent", "{{name}} has been added. Login credentials sent to {{email}}", { name: data.name, email: data.email })
          : t("level1.toast.officerAddedEmailUnavailable", "{{name}} has been added. Email service unavailable - credentials logged.", { name: data.name }),
        variant: result.emailSent ? "default" : "destructive",
      });
      
      if (!result.emailSent && result.credentials) {
        console.log('Generated credentials (Email not sent):', result.credentials);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("level1.errors.addOfficerFailed", "Failed to add officer.");
      toast({
        title: t("level1.toast.errorAddingOfficerTitle", "Error Adding Officer"),
        description: message,
        variant: "destructive",
      });
      console.error('Error adding officer:', error);
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'department') {
        removeDepartment(itemToDelete.id);
        toast({
          title: t("level1.toast.departmentDeletedTitle", "Department Deleted"),
          description: t("level1.toast.itemRemoved", "{{name}} has been removed successfully.", { name: itemToDelete.name }),
        });
      } else if (itemToDelete.type === 'area') {
        removeArea(itemToDelete.id);
        toast({
          title: t("level1.toast.areaDeletedTitle", "Area Deleted"),
          description: t("level1.toast.itemRemoved", "{{name}} has been removed successfully.", { name: itemToDelete.name }),
        });
      } else if (itemToDelete.type === 'user') {
        removeUser(itemToDelete.id);
        toast({
          title: t("level1.toast.userDeletedTitle", "User Deleted"),
          description: t("level1.toast.itemRemoved", "{{name}} has been removed successfully.", { name: itemToDelete.name }),
        });
      }
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: t("level1.toast.deleteFailed", "Failed to delete item. Please try again."),
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openDeleteDialog = (type: 'department' | 'area' | 'user', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  // Prepare chart data
  const complaintStatusData = [
    { name: t("complaintsTable.status.todo", "To Do"), value: visibleComplaints.filter(c => c.status.toLowerCase().includes('todo') || c.status.toLowerCase().includes('registered')).length },
    { name: t("complaintsTable.status.inProgress", "In Progress"), value: visibleComplaints.filter(c => c.status.toLowerCase().includes('progress') || c.status.toLowerCase().includes('investigation')).length },
    { name: t("complaintsTable.status.completed", "Completed"), value: apiComplaints.filter(c => c.status.toLowerCase().includes('completed') || c.status.toLowerCase().includes('resolved')).length },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: t("complaintsTable.priority.high", "High"), value: visibleComplaints.filter(c => c.priority_factor >= 0.7).length },
    { name: t("complaintsTable.priority.medium", "Medium"), value: visibleComplaints.filter(c => c.priority_factor >= 0.4 && c.priority_factor < 0.7).length },
    { name: t("complaintsTable.priority.low", "Low"), value: visibleComplaints.filter(c => c.priority_factor < 0.4).length },
  ].filter(d => d.value > 0);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t(
                "level1.heading",
                "{{role}} {{dashboard}}",
                { role: level1RoleLabel, dashboard: dashboardTitle }
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {t(
                "level1.subtitle",
                "Manage {{scope}} operations",
                {
                  scope:
                    governanceType === "CITY"
                      ? t("governance.cityMunicipalCorporation", "City Municipal Corporation")
                      : t("governance.panchayat", "Panchayat"),
                }
              )}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title={t("level1.stats.totalComplaints", "Total Complaints")}
              value={apiStats.total}
              icon={<FileText className="w-4 h-4" />}
            />
            <StatCard
              title={t("level1.stats.openComplaints", "Open Complaints")}
              value={apiStats.open}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title={t("complaintsTable.status.inProgress", "In Progress")}
              value={apiStats.inProgress}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title={t("level1.stats.closedTotal", "Closed (Total)")}
              value={apiStats.closed}
              icon={<CheckCircle className="w-4 h-4" />}
            />
          </div>

          {/* Content based on active section */}
          <div className="space-y-4">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Complaint Status Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("level1.charts.complaintStatusDistribution", "Complaint Status Distribution")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {complaintStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={complaintStatusData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">{t("level1.empty.noComplaintsYet", "No complaints yet")}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Priority Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("level1.charts.priorityDistribution", "Priority Distribution")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={priorityData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {priorityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">{t("common.noData", "No data available")}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <ComplaintsHeatmap
                  complaints={visibleComplaints}
                  title={t("dashboard.heatmap.title", "Complaints Heatmap")}
                />
              </div>
            )}

            {/* Complaints Section */}
            {activeSection === 'complaints' && (
              <div className="space-y-4">
                {isLoadingComplaints ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      {t("level1.loadingComplaints", "Loading complaints...")}
                    </CardContent>
                  </Card>
                ) : (
                  <ComplaintsTable 
                    complaints={apiComplaints} 
                    onComplaintUpdate={fetchComplaints}
                  />
                )}
              </div>
            )}

            {/* Departments Section */}
            {activeSection === 'departments' && (
  <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.departments", "Departments")}</CardTitle>
          <CardDescription>
            {t("level1.departments.count", "{{count}} departments", { count: departments.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {departments.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("level1.departments.empty", "No departments created yet")}
              </p>
            ) : (
              departments.map(dept => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{dept.name}</p>
                    <p className="text-xs text-gray-500">{dept.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t("common.active", "Active")}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog('department', dept.id, dept.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <CreateDepartmentDialog onSubmit={handleCreateDepartment} />
        </CardContent>
      </Card>
    </div>
  </div>
)}


            {/* Users Section */}
            {activeSection === 'users' && (
              <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserListCard 
                  users={level2Users} 
                  title={t("level1.users.level2Title", "{{role}}", { role: level2RoleLabel })}
                  onDelete={(id, name) => openDeleteDialog('user', id, name)}
                />
                <UserListCard 
                  users={level3Users} 
                  title={t("level1.users.level3Title", "{{role}}", { role: level3RoleLabel })}
                  onDelete={(id, name) => openDeleteDialog('user', id, name)}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t("level1.officers.addTitle", "Add Officers")}</CardTitle>
                  <CardDescription>{t("level1.officers.addDescription", "Invite new officers to the system")}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <AddOfficerDialog
                    roleTitle={level2RoleLabel}
                    departments={departments}
                    onSubmit={handleAddOfficer}
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("common.add", "Add")} {level2RoleLabel}
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("level1.deleteDialog.title", "Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "level1.deleteDialog.descriptionPrefix",
                "This will permanently delete"
              )}{" "}
              <strong>{itemToDelete?.name}</strong>.{" "}
              {t(
                "level1.deleteDialog.descriptionSuffix",
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
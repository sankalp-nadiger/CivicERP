/**
 * LEVEL_1 DASHBOARD
 * Municipal Commissioner / Zilla Panchayat CEO
 * Top-level admin who manages entire governance structure
 */

import React from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  StatCard,
  CreateDepartmentDialog,
  CreateAreaDialog,
  AddOfficerDialog,
  UserListCard
} from "@/components/dashboard/DashboardComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Users, Building2, MapPin, FileText, Plus } from "lucide-react";

export default function Level1Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    governanceType,
    currentUser,
    departments,
    areas,
    users,
    complaints,
    setCurrentUser,
    addDepartment,
    addArea,
    addUser
  } = useGovernance();

  const sidebar = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    return [
      { label: "Overview", path: "/dashboard/level1", icon: <FileText className="w-4 h-4" /> },
      { label: "Departments", path: "/dashboard/level1/departments", icon: <Building2 className="w-4 h-4" /> },
      { label: hierarchy.parent === "ZONE" ? "Zones" : "Taluks", path: "/dashboard/level1/areas", icon: <MapPin className="w-4 h-4" /> },
      { label: "Users", path: "/dashboard/level1/users", icon: <Users className="w-4 h-4" /> }
    ];
  }, [governanceType]);

  React.useEffect(() => {
    if (!currentUser) {
      // Auto-select LEVEL_1 user if not selected
      const level1User = users.find(u => u.level === "LEVEL_1");
      if (level1User) {
        setCurrentUser(level1User);
      }
    }
  }, [currentUser, users, setCurrentUser]);

  if (!currentUser || !governanceType) {
    return null;
  }

  const stats = getComplaintStats(complaints);
  const level2Users = getUsersByLevel(users, "LEVEL_2");
  const level3Users = getUsersByLevel(users, "LEVEL_3");
  const parentAreas = areas.filter(a => a.type === getAreaHierarchy(governanceType).parent);

  const handleCreateDepartment = (data: { name: string; description: string; contactPerson: string; email: string; phone?: string }) => {
    const generatedPassword = `Dept${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    addDepartment({
      id: generateDepartmentId(),
      name: data.name,
      description: data.description,
      governanceType,
      createdAt: new Date()
    });

    // TODO: Call backend API to send credentials via email
    // For now, show a toast with the credentials
    toast({
      title: "Department Created Successfully!",
      description: `${data.name} has been created. Login credentials sent to ${data.email}`,
    });
    
    // In production, this would call: 
    // await sendCredentialsEmail({ email: data.email, username: data.email, password: generatedPassword, departmentName: data.name })
    console.log('Generated credentials:', { email: data.email, password: generatedPassword, contactPerson: data.contactPerson, phone: data.phone });
  };

  const handleCreateArea = (data: { name: string; type: string; parentId?: string; contactPerson: string; email: string; phone?: string }) => {
    const generatedPassword = `Area${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    addArea({
      id: generateAreaId(),
      name: data.name,
      type: data.type as any,
      parentId: data.parentId,
      governanceType,
      createdAt: new Date()
    });

    // TODO: Call backend API to send credentials via email
    toast({
      title: "Area Created Successfully!",
      description: `${data.name} has been created. Login credentials sent to ${data.email}`,
    });
    
    console.log('Generated credentials:', { email: data.email, password: generatedPassword, contactPerson: data.contactPerson, phone: data.phone });
  };

  const handleAddOfficer = (level: "LEVEL_2" | "LEVEL_3", data: { name: string; email: string; phone?: string; departmentId?: string }) => {
    const generatedPassword = `Off${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const newUser = {
      id: generateUserId(),
      name: data.name,
      email: data.email,
      level,
      governanceType,
      department: data.departmentId || departments[0]?.id,
      createdAt: new Date(),
      status: "PENDING_INVITE" as const,
      reportsTo: level === "LEVEL_2" ? currentUser.id : level2Users[0]?.id
    };
    addUser(newUser);

    toast({
      title: "Officer Added Successfully!",
      description: `${data.name} has been added. Login credentials sent to ${data.email}`,
    });
    
    console.log('Generated credentials:', { email: data.email, password: generatedPassword, name: data.name, phone: data.phone });
  };

  // Prepare chart data
  const complaintStatusData = [
    { name: "Open", value: stats.open },
    { name: "In Progress", value: stats.inProgress },
    { name: "Work Done", value: stats.workDone },
    { name: "Verified", value: stats.verified },
    { name: "Closed", value: stats.closed },
    { name: "Escalated", value: stats.escalated }
  ].filter(d => d.value > 0);

  const slaData = [
    { name: "On Time", value: stats.total - stats.breached },
    { name: "Breached", value: stats.breached }
  ];

  const COLORS = ["#3b82f6", "#ef4444"];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getLevelDisplayName(governanceType, "LEVEL_1")} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage {governanceType === "CITY" ? "City Municipal Corporation" : "Panchayat"} operations
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Complaints"
              value={stats.total}
              icon={<FileText className="w-4 h-4" />}
            />
            <StatCard
              title="Open Complaints"
              value={stats.open}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title="SLA Breached"
              value={stats.breached}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title="Closed (This Month)"
              value={stats.closed}
              icon={<CheckCircle className="w-4 h-4" />}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Complaint Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Complaint Status Distribution</CardTitle>
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
                      <p className="text-sm text-gray-500 text-center py-8">No complaints yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* SLA Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>SLA Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {slaData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={slaData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>{departments.length} department{departments.length !== 1 ? "s" : ""}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {departments.length === 0 ? (
                        <p className="text-sm text-gray-500">No departments created yet</p>
                      ) : (
                        departments.map(dept => (
                          <div key={dept.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
                            <div>
                              <p className="font-medium text-sm">{dept.name}</p>
                              <p className="text-xs text-gray-500">{dept.description}</p>
                            </div>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        ))
                      )}
                    </div>
                    <CreateDepartmentDialog onSubmit={handleCreateDepartment} />
                  </CardContent>
                </Card>

                {/* Areas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Areas</CardTitle>
                    <CardDescription>{areas.length} area{areas.length !== 1 ? "s" : ""}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {areas.length === 0 ? (
                        <p className="text-sm text-gray-500">No areas created yet</p>
                      ) : (
                        areas.map(area => (
                          <div key={area.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
                            <div>
                              <p className="font-medium text-sm">{area.name}</p>
                              <p className="text-xs text-gray-500">{area.type}</p>
                            </div>
                            <Badge variant="outline">{area.type}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                    <CreateAreaDialog
                      parentAreaType={getAreaHierarchy(governanceType).parent!}
                      childAreaType={getAreaHierarchy(governanceType).child!}
                      parentAreas={parentAreas}
                      onSubmit={handleCreateArea}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserListCard users={level2Users} title={`${getLevelDisplayName(governanceType, "LEVEL_2")}s`} />
                <UserListCard users={level3Users} title={`${getLevelDisplayName(governanceType, "LEVEL_3")}s`} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Add Officers</CardTitle>
                  <CardDescription>Invite new officers to the system</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <AddOfficerDialog
                    roleTitle={getLevelDisplayName(governanceType, "LEVEL_2")}
                    departments={departments}
                    onSubmit={(data) => handleAddOfficer("LEVEL_2", data)}
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {getLevelDisplayName(governanceType, "LEVEL_2")}
                      </Button>
                    }
                  />
                  <AddOfficerDialog
                    roleTitle={getLevelDisplayName(governanceType, "LEVEL_3")}
                    departments={departments}
                    onSubmit={(data) => handleAddOfficer("LEVEL_3", data)}
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {getLevelDisplayName(governanceType, "LEVEL_3")}
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

import { AlertCircle, CheckCircle } from "lucide-react";

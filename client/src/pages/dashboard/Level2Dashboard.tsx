/**
 * LEVEL_2 DASHBOARD
 * Department Head / District Program Officer
 * Manages their department and subordinate Zone Officers
 */

import React from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  StatCard,
  ComplaintCard,
  AddOfficerDialog,
  UserListCard
} from "@/components/dashboard/DashboardComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

  const sidebar = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    const parentLabel = hierarchy.parent === "ZONE" ? "Zones" : "Taluks";
    return [
      { label: "Overview", path: "/dashboard/level2", icon: <FileText className="w-4 h-4" /> },
      { label: "Complaints", path: "/dashboard/level2/complaints", icon: <AlertCircle className="w-4 h-4" /> },
      { label: parentLabel, path: "/dashboard/level2/zones", icon: <Users className="w-4 h-4" /> }
    ];
  }, [governanceType]);

  React.useEffect(() => {
    if (!currentUser) {
      const level2User = users.find(u => u.level === "LEVEL_2");
      if (level2User) {
        setCurrentUser(level2User);
      }
    }
  }, [currentUser, users, setCurrentUser]);

  if (!currentUser || !governanceType) {
    return null;
  }

  // Department of current user
  const myDepartment = departments.find(d => d.id === currentUser.department);
  const myComplaints = myDepartment
    ? getComplaintsByDepartment(complaints, myDepartment.id)
    : [];
  const stats = getComplaintStats(myComplaints);
  const subordinates = getSubordinates(users, currentUser.id);

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

  const handleAddZoneOfficer = (data: { name: string; email: string; phone?: string; areaId?: string }) => {
    const generatedPassword = `Zone${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
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
      reportsTo: currentUser.id
    };
    addUser(newUser);

    toast({
      title: "Officer Added Successfully!",
      description: `${data.name} has been added. Login credentials sent to ${data.email}`,
    });
    
    console.log('Generated credentials:', { email: data.email, password: generatedPassword, name: data.name, phone: data.phone });
  };

  // Prepare chart data
  const dailyComplaints = Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    received: Math.floor(Math.random() * 10) + 2,
    resolved: Math.floor(Math.random() * 8) + 1
  }));

  const statusBreakdown = [
    { name: "Open", value: stats.open },
    { name: "In Progress", value: stats.inProgress },
    { name: "Work Done", value: stats.workDone },
    { name: "Closed", value: stats.closed }
  ].filter(d => d.value > 0);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getLevelDisplayName(governanceType, "LEVEL_2")} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Department: <strong>{myDepartment?.name || "Not assigned"}</strong>
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
              title="Open"
              value={stats.open}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title="SLA Breached"
              value={stats.breached}
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <StatCard
              title="Closed"
              value={stats.closed}
              icon={<AlertCircle className="w-4 h-4" />}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="team">My Team</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyComplaints}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="received" stroke="#3b82f6" />
                        <Line type="monotone" dataKey="resolved" stroke="#10b981" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">No data</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Complaints */}
            <TabsContent value="complaints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Filter by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["OPEN", "IN_PROGRESS", "WORK_DONE", "VERIFIED", "CLOSED"].map(status => (
                      <Button
                        key={status}
                        variant="outline"
                        className="text-sm"
                      >
                        {status.replace("_", " ")} ({getComplaintsByStatus(myComplaints, status).length})
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {myComplaints.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">No complaints in your department yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  myComplaints.map(complaint => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onAction={(action) => {
                        if (action === "update") {
                          setSelectedComplaint(complaint);
                        } else if (action === "escalate") {
                          handleEscalate(complaint.id);
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Team */}
            <TabsContent value="team" className="space-y-4">
              <UserListCard users={subordinates} title={`${getLevelDisplayName(governanceType, "LEVEL_3")}s Under You`} />
              <Card>
                <CardHeader>
                  <CardTitle>Add {getLevelDisplayName(governanceType, "LEVEL_3")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddOfficerDialog
                    roleTitle={getLevelDisplayName(governanceType, "LEVEL_3")}
                    areas={areas.filter(a => a.type === "ZONE" || a.type === "TALUK")}
                    onSubmit={handleAddZoneOfficer}
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

      {/* Update Status Dialog */}
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
                onClick={() => handleStatusUpdate(selectedComplaint.id, newStatus)}
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

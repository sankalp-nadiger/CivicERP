/**
 * LEVEL_3 DASHBOARD
 * Zone Officer / Panchayat Development Officer
 * Manages complaints in their area and subordinate Ward Officers
 */

import React from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { StatCard, ComplaintCard, AddOfficerDialog, UserListCard } from "@/components/dashboard/DashboardComponents";
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
  const {
    governanceType,
    currentUser,
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
    const childLabel = hierarchy.child === "WARD" ? "Wards" : "Villages";
    return [
      { label: "Overview", path: "/dashboard/level3", icon: <FileText className="w-4 h-4" /> },
      { label: "Complaints", path: "/dashboard/level3/complaints", icon: <AlertCircle className="w-4 h-4" /> },
      { label: childLabel, path: "/dashboard/level3/wards", icon: <Users className="w-4 h-4" /> },
      { label: `${getLevelDisplayName(governanceType || 'CITY', "LEVEL_4")}s`, path: "/dashboard/level3/officers", icon: <Users className="w-4 h-4" /> }
    ];
  }, [governanceType]);

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
  const subordinates = getSubordinates(users, currentUser.id);
  const childAreas = currentUser.areaId ? getChildAreas(areas, currentUser.areaId) : [];

  const handleEscalate = (complaintId: string) => {
    const superiorUser = users.find(u => u.id === currentUser.reportsTo);
    if (superiorUser) {
      escalateComplaint(complaintId, superiorUser.id);
    }
  };

  const handleAddWardOfficer = (data: { name: string; email: string; phone?: string; areaId?: string }) => {
    const generatedPassword = `Ward${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const newUser = {
      id: generateUserId(),
      name: data.name,
      email: data.email,
      level: "LEVEL_4" as const,
      governanceType,
      areaId: data.areaId || childAreas[0]?.id,
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

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <DashboardSidebar routes={sidebar} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getLevelDisplayName(governanceType, "LEVEL_3")} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Area: <strong>{myArea?.name || "Not assigned"}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Complaints" value={stats.total} icon={<FileText className="w-4 h-4" />} />
            <StatCard title="Open" value={stats.open} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title="In Progress" value={stats.inProgress} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title="Closed" value={stats.closed} icon={<AlertCircle className="w-4 h-4" />} />
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="team">{getLevelDisplayName(governanceType, "LEVEL_4")}s</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Area Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Total {governanceType === "CITY" ? "Wards" : "Villages"}</p>
                      <p className="text-2xl font-bold">{childAreas.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">{getLevelDisplayName(governanceType, "LEVEL_4")}s</p>
                      <p className="text-2xl font-bold">{subordinates.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complaints">
              <div className="grid gap-4">
                {myComplaints.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">No complaints in your area</p>
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

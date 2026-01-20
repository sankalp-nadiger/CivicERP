/**
 * LEVEL_4 DASHBOARD
 * Ward Officer / Panchayat Clerk
 * PRIMARY OWNER OF COMPLAINTS - assigns to executors, tracks SLA
 */

import React from "react";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useNavigate } from "react-router-dom";
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
  const [selectedComplaint, setSelectedComplaint] = React.useState<any>(null);
  const [assignToUser, setAssignToUser] = React.useState("");

  const sidebar = React.useMemo(() => {
    const hierarchy = getAreaHierarchy(governanceType);
    const myAreaLabel = hierarchy.child === "WARD" ? "My Ward" : "My Village";
    return [
      { label: "Overview", path: "/dashboard/level4", icon: <FileText className="w-4 h-4" /> },
      { label: "My Complaints", path: "/dashboard/level4/complaints", icon: <AlertCircle className="w-4 h-4" /> },
      { label: myAreaLabel, path: "/dashboard/level4/area", icon: <MapPin className="w-4 h-4" /> },
      { label: "SLA Status", path: "/dashboard/level4/sla", icon: <Clock className="w-4 h-4" /> }
    ];
  }, [governanceType]);

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
              {getLevelDisplayName(governanceType, "LEVEL_4")} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Area: <strong>{myArea?.name || "Not assigned"}</strong> | Primary complaint owner
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Complaints" value={stats.total} icon={<FileText className="w-4 h-4" />} />
            <StatCard title="Open" value={stats.open} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title="SLA Breached" value={breachedComplaints.length} icon={<AlertCircle className="w-4 h-4" />} />
            <StatCard title="Closed" value={stats.closed} icon={<CheckCircle className="w-4 h-4" />} />
          </div>

          {breachedComplaints.length > 0 && (
            <Card className="mb-8 border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">⚠️ SLA Breach Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800">
                  {breachedComplaints.length} complaint{breachedComplaints.length !== 1 ? "s" : ""} have breached SLA.
                  Please escalate immediately.
                </p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="complaints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="complaints">My Complaints</TabsTrigger>
              <TabsTrigger value="sla">SLA Status</TabsTrigger>
              <TabsTrigger value="executors">Assigned Executors</TabsTrigger>
            </TabsList>

            <TabsContent value="complaints">
              <div className="grid gap-4">
                {myComplaints.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">No complaints assigned to you</p>
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

            <TabsContent value="sla">
              <Card>
                <CardHeader>
                  <CardTitle>SLA Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myComplaints.length === 0 ? (
                      <p className="text-sm text-gray-500">No complaints</p>
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
                  <CardTitle>Assigned Executors/Contractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {executors.length === 0 ? (
                      <p className="text-sm text-gray-500">No executors assigned</p>
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
              <DialogTitle>Assign to Executor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Complaint: {selectedComplaint.title}</p>
              <div>
                <Label>Assign To</Label>
                <Select value={assignToUser} onValueChange={setAssignToUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select executor" />
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
                Assign Complaint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FileText, CheckCircle, Clock, Filter, Download, Forward } from "lucide-react";
import Navbar from "@/components/Navbar";

const AdminDashboard = () => {
  const [filter, setFilter] = useState('all');
  
  const complaints = [
    {
      id: 'C001',
      title: 'Street Light Not Working',
      category: 'Street Lighting',
      location: 'Sector 15, Block A',
      priority: 'High',
      status: 'Pending',
      submittedBy: 'John Doe',
      date: '2024-01-20',
      department: 'Electricity Board'
    },
    {
      id: 'C002',
      title: 'Water Supply Issue',
      category: 'Water Supply',
      location: 'Sector 22',
      priority: 'Medium',
      status: 'In Progress',
      submittedBy: 'Jane Smith',
      date: '2024-01-19',
      department: 'Water Department'
    },
    {
      id: 'C003',
      title: 'Garbage Collection Delay',
      category: 'Sanitation',
      location: 'Sector 8',
      priority: 'Low',
      status: 'Resolved',
      submittedBy: 'Mike Johnson',
      date: '2024-01-18',
      department: 'Sanitation'
    }
  ];

  const stats = [
    { title: 'Total Complaints', value: '1,234', icon: FileText, color: 'text-blue-600' },
    { title: 'Pending', value: '247', icon: Clock, color: 'text-yellow-600' },
    { title: 'In Progress', value: '156', icon: Users, color: 'text-blue-600' },
    { title: 'Resolved', value: '831', icon: CheckCircle, color: 'text-green-600' }
  ];

  const departments = [
    { name: 'Electricity Board', complaints: 45, resolved: 38 },
    { name: 'Water Department', complaints: 32, resolved: 28 },
    { name: 'Sanitation', complaints: 28, resolved: 25 },
    { name: 'Roads & Drainage', complaints: 21, resolved: 18 }
  ];

  const updateStatus = (id: string, newStatus: string) => {
    console.log(`Updating complaint ${id} to ${newStatus}`);
    // Update complaint status
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Municipal Authority Control Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="complaints" className="space-y-6">
          <TabsList>
            <TabsTrigger value="complaints">Complaints Management</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Complaints Management</CardTitle>
                    <CardDescription>Review and manage all citizen complaints</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Complaints</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{complaint.title}</h4>
                          <p className="text-sm text-gray-600">
                            {complaint.id} • {complaint.location} • {complaint.submittedBy}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            complaint.priority === 'High' ? 'destructive' :
                            complaint.priority === 'Medium' ? 'default' : 'secondary'
                          }>
                            {complaint.priority}
                          </Badge>
                          <Badge variant={
                            complaint.status === 'Resolved' ? 'default' :
                            complaint.status === 'In Progress' ? 'secondary' : 'outline'
                          }>
                            {complaint.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {complaint.department} • {complaint.date}
                        </span>
                        <div className="flex gap-2">
                          <Select onValueChange={(value) => updateStatus(complaint.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline">
                            <Forward className="h-4 w-4 mr-1" />
                            Forward
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Monitor department performance and complaint distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{dept.name}</h4>
                        <p className="text-sm text-gray-600">
                          {dept.resolved}/{dept.complaints} complaints resolved
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round((dept.resolved / dept.complaints) * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">Resolution Rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Data insights and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Advanced analytics, charts, and reporting features will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

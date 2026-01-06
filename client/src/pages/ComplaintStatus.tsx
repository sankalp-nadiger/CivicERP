
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";

const ComplaintStatus = () => {
  const [searchId, setSearchId] = useState('');
  const [complaints] = useState([
    {
      id: 'C001',
      title: 'Street Light Not Working',
      category: 'Street Lighting',
      location: 'Sector 15, Block A',
      status: 'In Progress',
      priority: 'High',
      submittedDate: '2024-01-15',
      lastUpdate: '2024-01-16'
    },
    {
      id: 'C002',
      title: 'Water Supply Issue',
      category: 'Water Supply',
      location: 'Sector 22',
      status: 'Resolved',
      priority: 'Medium',
      submittedDate: '2024-01-10',
      lastUpdate: '2024-01-14'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Track Complaint Status</CardTitle>
              <CardDescription>
                Enter your complaint ID to check the current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="complaintId">Complaint ID</Label>
                  <Input
                    id="complaintId"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter complaint ID (e.g., C001)"
                  />
                </div>
                <Button className="mt-6">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Complaints</h3>
            {complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{complaint.title}</h4>
                      <p className="text-gray-600">ID: {complaint.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{complaint.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{complaint.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Update</p>
                      <p className="font-medium">{complaint.lastUpdate}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Submitted on {complaint.submittedDate}
                    </p>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintStatus;

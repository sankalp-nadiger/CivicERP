
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, FileText, Bell } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { getUserComplaints } from "@/services/complaintService";

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userComplaints, setUserComplaints] = useState([]);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    joinDate: '2024-01-15'
  });

  useEffect(() => {
    if (user) {
      const complaints = getUserComplaints(user.id);
      setUserComplaints(complaints);
    }
  }, [user]);

  const handleSave = () => {
    setIsEditing(false);
    // Save profile data
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'default';
      case 'In Progress': return 'secondary';
      case 'Pending': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="complaints">My Complaints</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xl">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{profileData.name}</CardTitle>
                      <CardDescription>
                        <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                          {user?.role === 'admin' ? 'Admin' : 'Citizen'}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">
                      Member since {profileData.joinDate}
                    </p>
                    <div className="space-x-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave}>
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>
                          <User className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complaints">
              <Card>
                <CardHeader>
                  <CardTitle>My Complaints</CardTitle>
                  <CardDescription>Track all your submitted complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userComplaints.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No complaints filed yet. <a href="/file-complaint" className="text-blue-600 underline">File your first complaint</a>
                      </p>
                    ) : (
                      userComplaints.map((complaint: any) => (
                        <div key={complaint.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{complaint.title}</p>
                            <p className="text-sm text-gray-600">ID: {complaint.id} • {complaint.date}</p>
                            <p className="text-sm text-gray-500 mt-1">{complaint.description.substring(0, 100)}...</p>
                          </div>
                          <Badge variant={getStatusColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Settings className="h-5 w-5 inline mr-2" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Account settings and preferences will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Bell className="h-5 w-5 inline mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Notification preferences and history will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;

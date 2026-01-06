
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, CheckCircle, Clock, MapPin, Phone, Mail, Shield, BarChart3, Settings } from "lucide-react";
import LoginModal from "@/components/LoginModal";
import Navbar from "@/components/Navbar";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginType, setLoginType] = useState<'public' | 'admin'>('public');
  const { user, isAuthenticated } = useAuth();

  const handleLogin = (type: 'public' | 'admin') => {
    setLoginType(type);
    setShowLoginModal(true);
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {user.role === 'admin' ? (
                <Shield className="h-8 w-8 text-red-600" />
              ) : (
                <Users className="h-8 w-8 text-blue-600" />
              )}
              <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <p className="text-xl text-gray-600">{user.name}</p>
            <Badge variant={user.role === 'admin' ? 'destructive' : 'default'} className="mt-2">
              {user.role === 'admin' ? (
                <><Shield className="h-4 w-4 mr-1" />Admin</>
              ) : (
                <><Users className="h-4 w-4 mr-1" />Public User</>
              )}
            </Badge>
          </div>

          {/* Role-specific Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {user.role === 'admin' ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">9</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">Great progress!</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4</div>
                    <p className="text-xs text-muted-foreground">Currently online</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Complaints</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">Total submitted</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1</div>
                    <p className="text-xs text-muted-foreground">Successfully completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1</div>
                    <p className="text-xs text-muted-foreground">Being worked on</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">Average response time</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Analytics for Admin */}
          {user.role === 'admin' && (
            <div className="mb-8">
              <AnalyticsCharts />
            </div>
          )}

          {/* Role-specific Quick Actions */}
          {user.role === 'admin' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <CardTitle>View Analytics</CardTitle>
                  </div>
                  <CardDescription>Detailed reports and complaint analytics</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-6 w-6 text-gray-600" />
                    <CardTitle>Manage Departments</CardTitle>
                  </div>
                  <CardDescription>Add or edit department information</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <CardTitle>Urgent Complaints</CardTitle>
                  </div>
                  <CardDescription>High priority issues requiring attention</CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/file-complaint'}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <CardTitle>Report a Problem</CardTitle>
                  </div>
                  <CardDescription>Report civic issues in your area like broken roads, water problems, etc.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/complaint-status'}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <CardTitle>Track My Reports</CardTitle>
                  </div>
                  <CardDescription>Check the status and progress of your submitted complaints</CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.role === 'admin' ? 'Recent Complaints' : 'My Recent Activity'}
                </CardTitle>
                <CardDescription>
                  {user.role === 'admin' ? 'Latest issues reported by public' : 'Your recent complaint submissions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: '#C001', issue: 'Broken Road in Connaught Place', area: 'Central Delhi', priority: 'High', status: 'Pending' },
                    { id: '#C002', issue: 'Water Leakage in Pipeline', area: 'Karol Bagh', priority: 'Medium', status: 'In Progress' },
                    { id: '#C003', issue: 'Street Light Not Working', area: 'Lajpat Nagar', priority: 'Low', status: 'Resolved' }
                  ].map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{complaint.issue}</p>
                        <p className="text-sm text-gray-600">{complaint.area} • {complaint.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={complaint.priority === 'High' ? 'destructive' : complaint.priority === 'Medium' ? 'default' : 'secondary'}>
                          {complaint.priority}
                        </Badge>
                        <Badge variant={complaint.status === 'Resolved' ? 'default' : 'outline'}>
                          {complaint.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>Important helpline numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Police Emergency', phone: '100' },
                    { name: 'Fire Brigade', phone: '101' },
                    { name: 'Ambulance', phone: '108' }
                  ].map((contact) => (
                    <div key={contact.name} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium text-sm">{contact.name}</span>
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Online Complaint Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Report civic issues in your area - from broken roads and water problems to street lighting and garbage collection. 
            Help make your community better by connecting directly with local authorities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => handleLogin('public')}
              className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
            >
              <Users className="h-5 w-5" />
              <span>Public Login</span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => handleLogin('admin')}
              className="border-red-600 text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Admin Login</span>
            </Button>
          </div>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Why Report Civic Issues?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-lg text-gray-700">
              Every pothole fixed, every streetlight repaired, and every water issue resolved makes our cities better. 
              Your reports help local authorities prioritize and address the issues that matter most to your community.
            </p>
          </CardContent>
        </Card>

        {/* Impact Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">Issues Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">78%</div>
            <div className="text-gray-600">Resolution Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">2 days</div>
            <div className="text-gray-600">Average Response Time</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Easy Problem Reporting",
              description: "Just click on the map to mark the exact location and describe the issue",
              icon: MapPin
            },
            {
              title: "Photo & Video Support",
              description: "Upload pictures and videos to help authorities understand the problem better",
              icon: FileText
            },
            {
              title: "Track Progress",
              description: "Get updates on how your complaint is being handled from start to finish",
              icon: Users
            }
          ].map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        loginType={loginType}
      />
    </div>
  );
};

export default Index;

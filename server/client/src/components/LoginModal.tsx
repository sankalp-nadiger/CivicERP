import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Users } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginType: 'public' | 'admin';
}

const LoginModal = ({ isOpen, onClose, loginType }: LoginModalProps) => {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password, loginType);
      if (success) {
        toast({
          title: "Login Successful",
          description: `Welcome to OCMS ${loginType === 'admin' ? 'Authority' : 'Citizen'} Portal`,
        });
        onClose();
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        location: formData.location
      });
      
      if (success) {
        toast({
          title: "Registration Successful",
          description: "Welcome to OCMS! You are now logged in.",
        });
        onClose();
      } else {
        toast({
          title: "Registration Failed",
          description: "Please try again with different details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {loginType === 'admin' ? (
              <Shield className="h-6 w-6 text-red-600" />
            ) : (
              <Users className="h-6 w-6 text-blue-600" />
            )}
            <DialogTitle>
              {loginType === 'admin' ? 'Municipal Authority Access' : 'Citizen Access'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {loginType === 'admin' 
              ? 'Secure access for municipal officers to manage complaints and services'
              : 'Login or register to file complaints and track their status'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Badge variant={loginType === 'admin' ? 'destructive' : 'default'} className="w-full justify-center py-2">
            {loginType === 'admin' ? (
              <><Shield className="h-4 w-4 mr-2" />Authority Portal</>
            ) : (
              <><Users className="h-4 w-4 mr-2" />Citizen Portal</>
            )}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            {loginType === 'public' && <TabsTrigger value="register">Register</TabsTrigger>}
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>
                  {loginType === 'admin' ? 'Authority Login' : 'Citizen Login'}
                </CardTitle>
                <CardDescription>
                  {loginType === 'admin' 
                    ? 'Enter your official credentials to access the admin dashboard'
                    : 'Enter your credentials to access your citizen account'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {loginType === 'admin' ? 'Official Email' : 'Email Address'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={loginType === 'admin' ? 'officer@municipal.gov' : 'your.email@example.com'}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {loginType === 'admin' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        <Shield className="h-4 w-4 inline mr-1" />
                        This is a secure portal for authorized municipal personnel only.
                      </p>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : `Sign In as ${loginType === 'admin' ? 'Authority' : 'Citizen'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {loginType === 'public' && (
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Citizen Registration</CardTitle>
                  <CardDescription>
                    Create a new citizen account to start filing complaints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email Address</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location/Area</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Sector 15, Block A"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Citizen Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGovernance } from '@/contexts/GovernanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { initializeGovernance } = useGovernance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);

    // Backend authentication only - no fallback demo mode
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // Try contractor signin first so contractor accounts always receive contractor token shape.
      let resp = await fetch(`${API}/auth/contractor/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      let isContractorSignin = resp.ok;
      if (!resp.ok) {
        const userResp = await fetch(`${API}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });
        if (userResp.ok) {
          resp = userResp;
          isContractorSignin = false;
        }
      }

      if (resp.ok) {
        const raw = await resp.json();
        const userData = isContractorSignin
          ? {
              token: raw?.token,
              email: raw?.contractor?.email,
              username: raw?.contractor?.name,
              name: raw?.contractor?.name,
              role: 'contractor',
            }
          : raw;

        // Persist token for API calls (used by complaintService/governanceService)
        if (userData?.token) {
          localStorage.setItem('auth_token', String(userData.token));
        }
        const role = (userData.role || '').toLowerCase();
        
        // Store user data in auth context
        login({ 
          email: userData.email, 
          name: userData.username || userData.name || 'User', 
          role: role as any, 
          departmentId: userData.departmentId, 
          governanceLevel: userData.governanceLevel, 
          governanceType: userData.governanceType 
        });
        
        toast({ 
          title: 'Login Successful', 
          description: `Welcome ${userData.username || userData.name || userData.email}` 
        });

        // Route based on user role and governance level
        if (role === 'contractor') {
          navigate('/dashboard/level4');
        } else if (role === 'admin' || role === 'authority') {
          // Prefer explicit governanceLevel from backend (e.g. 'LEVEL_2')
          const rawGovLevel = (userData.governanceLevel || '').toString().toUpperCase();
          const directLevelMatch = rawGovLevel.match(/^LEVEL_(\d+)$/);
          if (directLevelMatch) {
            const level = Number(directLevelMatch[1]);
            if (level >= 1 && level <= 4) {
              navigate(`/dashboard/level${level}`);
              setIsLoading(false);
              return;
            }
          }

          // Fallback: detect governance level from strings like 'city-level2'
          const govMatch = (userData.governanceLevel || userData.role || email).match(/(city|panchayat)?[-_]?level(\d)/i);
          if (govMatch) {
            const level = Number(govMatch[2]);
            if (level >= 1 && level <= 4) {
              navigate(`/dashboard/level${level}`);
              setIsLoading(false);
              return;
            }
          }
          
          // Default admin dashboard if no level found
          navigate('/dashboard/level1');
        } else {
          // Regular users go to citizen dashboard or home
          navigate('/');
        }
        setIsLoading(false);
        return;
      }

      // Handle authentication errors from backend
      const errorData = await resp.json().catch(() => ({ message: 'Invalid credentials' }));
      setError(errorData.message || 'Invalid email or password');
      setIsLoading(false);
      
    } catch (e) {
      console.error('Login error:', e);
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  }, [email, password, login, navigate, initializeGovernance]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg my-8">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">CivicERP Dashboard</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-medium"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="text-center text-xs text-gray-500 pt-2 border-t">
            <p>Use your registered email and password to access the system.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

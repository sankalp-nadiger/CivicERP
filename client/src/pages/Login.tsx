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

    // Try backend signin first
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const resp = await fetch(`${API}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (resp.ok) {
        const userData = await resp.json();
        const role = (userData.role || '').toLowerCase();
        login({ email: userData.email, name: userData.username || userData.name || 'User', role: role as any, departmentId: userData.departmentId, governanceLevel: userData.governanceLevel, governanceType: userData.governanceType });
        toast({ title: 'Login Successful', description: `Welcome ${userData.username || userData.name || userData.email}` });

        // Detect governance level from role, governanceLevel, or email
        const govMatch = (userData.governanceLevel || userData.role || email).match(/(city|panchayat)?[-_]?level(\d)/i);
        if (govMatch) {
          const level = Number(govMatch[2]);
          if (level >= 1 && level <= 4) {
            navigate(`/dashboard/level${level}`);
            setIsLoading(false);
            return;
          }
        }
        
        // If no valid level found, redirect to login
        toast({ title: 'Error', description: 'Invalid governance level. Please contact administrator.', variant: 'destructive' });
        setIsLoading(false);
        return;

        setIsLoading(false);
        return;
      }

      // If backend returns error, fall back to demo matching
    } catch (e) {
      console.warn('Backend signin failed, falling back to demo auth', e);
    }

    // Fallback demo matching - governance users only
    setTimeout(() => {
      try {
        // Governance users: detect city/panchayat and level (1-4)
        const govMatch = email.match(/(city|panchayat)[-_]?level(\d)/i);
        if (govMatch) {
          const govType = govMatch[1].toLowerCase();
          const level = Number(govMatch[2]);
          if (level >= 1 && level <= 4) {
            const governanceLevel = `${govType}-level${level}`;
            initializeGovernance(govType.toUpperCase() as 'CITY' | 'PANCHAYAT');
            login({ email, name: `${govType.toUpperCase()} Level ${level}`, role: 'public', governanceLevel, governanceType: govType as 'city' | 'panchayat' });
            toast({ title: 'Login Successful', description: `Welcome to ${governanceLevel}` });
            navigate(`/dashboard/level${level}`);
            return;
          }
        }

        setError('Invalid credentials. Please use format: city-level1@... or panchayat-level2@...');
      } catch (err) {
        setError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 700);
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
            <p>Use emails like <em>city-level1@example.com</em> or <em>panchayat-level2@example.com</em> to access governance level dashboards (levels 1–4).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { GovernanceProvider } from "@/contexts/GovernanceContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import Login from "./pages/Login";
import {
  Level1Dashboard,
  Level2Dashboard,
  Level3Dashboard,
  Level4Dashboard
} from '@/pages/dashboard'

const queryClient = new QueryClient();

const extractLevelNumber = (governanceLevel?: string): number | null => {
  if (!governanceLevel) return null;
  const raw = governanceLevel.toString().trim();

  const direct = raw.toUpperCase().match(/^LEVEL_(\d+)$/);
  if (direct) return Number(direct[1]);

  const loose = raw.match(/level\s*[-_]?\s*(\d+)/i);
  if (loose) return Number(loose[1]);

  return null;
};

const ProtectedDashboardRoute: React.FC<{ level: 1 | 2 | 3 | 4; children: React.ReactElement }> = ({
  level,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userLevel = extractLevelNumber(user?.governanceLevel);
  if (userLevel && userLevel !== level) {
    return <Navigate to={`/dashboard/level${userLevel}`} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Governance Platform Routes */}
      <Route
        path="/dashboard/level1/*"
        element={
          <ProtectedDashboardRoute level={1}>
            <Level1Dashboard />
          </ProtectedDashboardRoute>
        }
      />
      <Route
        path="/dashboard/level2/*"
        element={
          <ProtectedDashboardRoute level={2}>
            <Level2Dashboard />
          </ProtectedDashboardRoute>
        }
      />
      <Route
        path="/dashboard/level3/*"
        element={
          <ProtectedDashboardRoute level={3}>
            <Level3Dashboard />
          </ProtectedDashboardRoute>
        }
      />
      <Route
        path="/dashboard/level4/*"
        element={
          <ProtectedDashboardRoute level={4}>
            <Level4Dashboard />
          </ProtectedDashboardRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GovernanceProvider>
          <SidebarProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SidebarProvider>
        </GovernanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

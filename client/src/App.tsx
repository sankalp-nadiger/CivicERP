
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Governance Platform Routes */}
      <Route path="/dashboard/level1/*" element={<Level1Dashboard />} />
      <Route path="/dashboard/level2/*" element={<Level2Dashboard />} />
      <Route path="/dashboard/level3/*" element={<Level3Dashboard />} />
      <Route path="/dashboard/level4/*" element={<Level4Dashboard />} />
      
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

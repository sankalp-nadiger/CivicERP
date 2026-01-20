/**
 * Governance Dashboard Sidebar
 * Dynamic sidebar based on user level and governance type
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useGovernance } from "@/contexts/GovernanceContext";
import { getLevelDisplayName } from "@/config/governanceTemplates";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

interface DashboardSidebarProps {
  routes: Array<{
    label: string;
    path: string;
    icon?: React.ReactNode;
  }>;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ routes }) => {
  const { currentUser, governanceType, logout } = useGovernance();
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!currentUser || !governanceType) {
    return null;
  }

  const userLevelDisplay = getLevelDisplayName(governanceType, currentUser.level);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Governance Platform</h2>
        <div className="bg-gray-100 p-3 rounded-lg space-y-1">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{currentUser.name}</span>
          </p>
          <p className="text-xs text-gray-500">{userLevelDisplay}</p>
          <p className="text-xs text-gray-500">{governanceType === "CITY" ? "City Corporation" : "Panchayat"}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === route.path
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {route.icon && <span>{route.icon}</span>}
            <span className="text-sm font-medium">{route.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {sidebarContent}
    </div>
  );
};

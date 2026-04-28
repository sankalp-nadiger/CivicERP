/**
 * Governance Dashboard Sidebar
 * Dynamic sidebar based on user level and governance type
 */

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGovernance } from "@/contexts/GovernanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLevelDisplayName } from "@/config/governanceTemplates";
import { LogOut, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(false);
  const { t, i18n } = useTranslation();

  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

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

  const handleLogout = () => {
    logout();
    authLogout();
    navigate("/login", { replace: true });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {t("governance.platform", "Governance Platform")}
        </h2>
        <div className="bg-gray-100 p-3 rounded-lg space-y-1">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{currentUser.name}</span>
          </p>
          <p className="text-xs text-gray-500">{userLevelDisplay}</p>
          <p className="text-xs text-gray-500">
            {governanceType === "CITY"
              ? t("governance.cityCorporation", "City Corporation")
              : t("governance.panchayat", "Panchayat")}
          </p>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {t("common.language", "Language")}: {t(`language.${currentLanguage}`, currentLanguage)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuRadioGroup
              value={currentLanguage}
              onValueChange={(lng) => i18n.changeLanguage(lng)}
            >
              <DropdownMenuRadioItem value="en">{t("language.en", "English")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="hi">{t("language.hi", "Hindi")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="kn">{t("language.kn", "Kannada")}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t("common.logout", "Logout")}
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
            <SheetTitle>{t("governance.navigation", "Navigation")}</SheetTitle>
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

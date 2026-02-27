import React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import {
  BarChart3,
  Building2,
  Users,
  FileText,
  History,
  Settings,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: 'mcc' | 'department-head';
  onLogout: () => void;
}

const mccMenuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'contractors', label: 'Contractors', icon: Users },
  { id: 'complaints', label: 'Complaints', icon: FileText },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const departmentHeadMenuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'contractors', label: 'Contractors', icon: Users },
  { id: 'tasks', label: 'Assigned Tasks', icon: CheckCircle2 },
  { id: 'complaints', label: 'Assign Task', icon: FileText },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeSection,
  onSectionChange,
  userRole,
  onLogout,
}) => {
  const menuItems = userRole === 'mcc' ? mccMenuItems : departmentHeadMenuItems;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">CivicERP</h2>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'px-4 py-2 rounded-md cursor-pointer transition-colors',
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <div className="border-t p-4 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </Sidebar>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertCircle, TrendingUp, Users, Zap } from 'lucide-react';
import { SLATimer } from '../shared/SLATimer';

const performanceData = [
  { week: 'Week 1', assigned: 12, completed: 8, delayed: 2 },
  { week: 'Week 2', assigned: 15, completed: 13, delayed: 1 },
  { week: 'Week 3', assigned: 18, completed: 16, delayed: 2 },
  { week: 'Week 4', assigned: 14, completed: 13, delayed: 1 },
];

const contractorPerformance = [
  { contractor: 'ABC Construction', efficiency: 92 },
  { contractor: 'XYZ Plumbing', efficiency: 88 },
  { contractor: 'Green Waste', efficiency: 95 },
  { contractor: 'Urban Drainage', efficiency: 87 },
  { contractor: 'ElectroTech', efficiency: 91 },
];

export const DepartmentHeadOverview: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    { label: 'Active Tasks', value: '24', icon: Zap, color: 'text-blue-500' },
    { label: 'Completed This Month', value: '52', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Available Contractors', value: '3', icon: Users, color: 'text-purple-500' },
    { label: 'At Risk', value: '4', icon: AlertCircle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">{stat.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Task Performance - Last 4 Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="assigned" stroke="#3b82f6" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" />
              <Line type="monotone" dataKey="delayed" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Contractor Efficiency & SLA Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contractor Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contractorPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contractor" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critical Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
            <SLATimer
              deadline={new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)}
              taskId="TASK-101"
              priority="critical"
            />
            <SLATimer
              deadline={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
              taskId="TASK-102"
              priority="high"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

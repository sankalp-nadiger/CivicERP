import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SLATimer } from '../shared/SLATimer';

const departmentStats = [
  { dept: 'Water Supply', completed: 156, pending: 32, delayed: 5 },
  { dept: 'Waste Management', completed: 142, pending: 28, delayed: 8 },
  { dept: 'Roads', completed: 128, pending: 35, delayed: 4 },
  { dept: 'Parks', completed: 95, pending: 18, delayed: 2 },
];

const complaintTypeData = [
  { name: 'Potholes', value: 145 },
  { name: 'Drainage', value: 98 },
  { name: 'Water Leaks', value: 87 },
  { name: 'Waste', value: 64 },
  { name: 'Others', value: 48 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const MCCOverview: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    { label: 'Total Complaints', value: '442', icon: AlertCircle, color: 'text-orange-500' },
    { label: 'Resolved Today', value: '34', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Active Departments', value: '5', icon: Briefcase, color: 'text-blue-500' },
    { label: 'Department Heads', value: '8', icon: Users, color: 'text-purple-500' },
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

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dept" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10b981" />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
              <Bar dataKey="delayed" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Complaint Types Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complaintTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complaintTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA Timers for Critical Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Critical SLA Timers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
            <SLATimer
              deadline={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
              taskId="TASK-001"
              priority="high"
            />
            <SLATimer
              deadline={new Date(Date.now() + 6 * 60 * 60 * 1000)}
              taskId="TASK-002"
              priority="critical"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const slaComplianceData = [
  { dept: 'Water Supply', compliance: 95 },
  { dept: 'Waste Mgmt', compliance: 87 },
  { dept: 'Roads', compliance: 92 },
  { dept: 'Parks', compliance: 88 },
  { dept: 'Health', compliance: 91 },
];

const bottleneckData = [
  { week: 'Week 1', pending: 45, inProgress: 32, resolved: 88 },
  { week: 'Week 2', pending: 52, inProgress: 38, resolved: 95 },
  { week: 'Week 3', pending: 38, inProgress: 45, resolved: 112 },
  { week: 'Week 4', pending: 41, inProgress: 35, resolved: 126 },
];

interface Bottleneck {
  department: string;
  issue: string;
  affectedTasks: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const bottlenecks: Bottleneck[] = [
  { department: 'Water Supply', issue: 'Contractor availability', affectedTasks: 12, severity: 'high' },
  { department: 'Waste Management', issue: 'Resource allocation', affectedTasks: 8, severity: 'medium' },
  { department: 'Road Infrastructure', issue: 'Weather delays', affectedTasks: 5, severity: 'low' },
];

export const CityWideAnalytics: React.FC = () => {
  const { t } = useTranslation();

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Average SLA Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">90.6%</div>
            <p className="text-xs text-gray-500 mt-1">↑ 2.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">342</div>
            <p className="text-xs text-gray-500 mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Critical Bottlenecks</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">3</div>
            <p className="text-xs text-gray-500 mt-1">Requiring immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Compliance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mcc.slaCompliance')} by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={slaComplianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dept" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="compliance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Task Pipeline - Last 4 Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bottleneckData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pending" stroke="#ef4444" />
              <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottleneck Detection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mcc.bottleneckDetection')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bottlenecks.map((bottleneck, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{bottleneck.department}</h4>
                    <p className="text-sm text-gray-600">{bottleneck.issue}</p>
                  </div>
                  <Badge className={getSeverityColor(bottleneck.severity)}>
                    {bottleneck.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Affecting {bottleneck.affectedTasks} tasks
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

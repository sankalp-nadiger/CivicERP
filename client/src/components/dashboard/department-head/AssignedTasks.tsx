import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';

export interface AssignedTask {
  id: string;
  complaintType: string;
  description: string;
  contractorName: string;
  contractorId: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedDate: Date;
  deadline: Date;
  departmentId: string;
}

// Mock tasks data for different departments
const MOCK_TASKS: AssignedTask[] = [
  {
    id: 'TASK-001',
    complaintType: 'Water Leak',
    description: 'Main water pipe leak at Main Street',
    contractorName: 'XYZ Plumbing',
    contractorId: '2',
    status: 'in-progress',
    priority: 'high',
    assignedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    departmentId: '1', // Water Supply
  },
  {
    id: 'TASK-002',
    complaintType: 'Water Supply Interruption',
    description: 'No water supply in Block C residential area',
    contractorName: 'ABC Construction',
    contractorId: '1',
    status: 'assigned',
    priority: 'critical',
    assignedDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
    departmentId: '1', // Water Supply
  },
  {
    id: 'TASK-003',
    complaintType: 'Broken Water Tap',
    description: 'Public water tap damaged at Central Park',
    contractorName: 'XYZ Plumbing',
    contractorId: '2',
    status: 'completed',
    priority: 'medium',
    assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    departmentId: '1', // Water Supply
  },
  {
    id: 'TASK-004',
    complaintType: 'Water Meter Issue',
    description: 'Faulty water meter reading',
    contractorName: 'Green Waste Solutions',
    contractorId: '3',
    status: 'delayed',
    priority: 'medium',
    assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    departmentId: '1', // Water Supply
  },
];

export const AssignedTasks: React.FC = () => {
  const { user } = useAuth();

  // Filter tasks by current department
  const departmentTasks = useMemo(() => {
    return MOCK_TASKS.filter(task => task.departmentId === user?.departmentId);
  }, [user?.departmentId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      case 'assigned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Assigned Tasks</h2>
        <p className="text-gray-600">
          {departmentTasks.length} task{departmentTasks.length !== 1 ? 's' : ''} assigned to your department
        </p>
      </div>

      {departmentTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No tasks assigned yet</p>
              <p className="text-gray-500 text-sm mt-2">Assign a task to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {departmentTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.complaintType}</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Task Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">TASK ID</p>
                      <p className="text-sm font-mono text-gray-900">{task.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">CONTRACTOR</p>
                      <p className="text-sm font-semibold text-blue-600">{task.contractorName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">ASSIGNED DATE</p>
                      <p className="text-sm text-gray-900">{formatDate(task.assignedDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">DEADLINE</p>
                      <p className="text-sm text-gray-900">{formatDate(task.deadline)}</p>
                    </div>
                  </div>

                  {/* Status Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {task.status !== 'completed' && (
                        <Button size="sm" variant="default">
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;

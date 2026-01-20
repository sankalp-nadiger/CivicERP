import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  complaintId: string;
  complaintType: string;
  description: string;
  contractor: string;
  status: 'assigned' | 'in-progress' | 'completed';
  assignedDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TaskAssignmentProps {
  onTaskAssigned?: (task: Task) => void;
}

const complaints = [
  { id: 'C001', type: 'Pothole', location: 'Main Street', priority: 'high' },
  { id: 'C002', type: 'Drainage', location: 'North Zone', priority: 'critical' },
  { id: 'C003', type: 'Water Leak', location: 'Central Area', priority: 'medium' },
  { id: 'C004', type: 'Broken Light', location: 'East Zone', priority: 'low' },
  { id: 'C005', type: 'Waste Accumulation', location: 'South Zone', priority: 'high' },
];

const contractors = [
  { id: '1', name: 'ABC Construction' },
  { id: '2', name: 'XYZ Plumbing' },
  { id: '3', name: 'Green Waste Solutions' },
  { id: '4', name: 'Urban Drainage Ltd' },
  { id: '5', name: 'ElectroTech Services' },
];

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({ onTaskAssigned }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<string>('');
  const [selectedContractor, setSelectedContractor] = useState<string>('');
  const [description, setDescription] = useState('');
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  const handleAssignTask = () => {
    if (!selectedComplaint || !selectedContractor) {
      toast.error('Please select complaint and contractor');
      return;
    }

    const complaint = complaints.find((c) => c.id === selectedComplaint);
    const contractor = contractors.find((c) => c.id === selectedContractor);

    if (!complaint || !contractor) return;

    const newTask: Task = {
      id: Date.now().toString(),
      complaintId: selectedComplaint,
      complaintType: complaint.type,
      description: description || `Repair ${complaint.type.toLowerCase()}`,
      contractor: contractor.name,
      status: 'assigned',
      assignedDate: new Date(),
      priority: complaint.priority as Task['priority'],
    };

    setAssignedTasks([...assignedTasks, newTask]);
    
    if (onTaskAssigned) {
      onTaskAssigned(newTask);
    }

    toast.success(`Task assigned to ${contractor.name}`);
    setSelectedComplaint('');
    setSelectedContractor('');
    setDescription('');
    setIsOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('departmentHead.taskAssignment')}</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('departmentHead.assignTask')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('departmentHead.assignTask')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('departmentHead.selectComplaint')}</label>
                <Select value={selectedComplaint} onValueChange={setSelectedComplaint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a complaint" />
                  </SelectTrigger>
                  <SelectContent>
                    {complaints.map((complaint) => (
                      <SelectItem key={complaint.id} value={complaint.id}>
                        {complaint.type} - {complaint.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">{t('departmentHead.selectContractor')}</label>
                <Select value={selectedContractor} onValueChange={setSelectedContractor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add task details..."
                />
              </div>

              <Button onClick={handleAssignTask} className="w-full">
                {t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assigned Tasks List */}
      <div className="space-y-3">
        {assignedTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {t('common.noData')}
            </CardContent>
          </Card>
        ) : (
          assignedTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{task.complaintType}</h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Task ID</p>
                    <p className="font-semibold">{task.complaintId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                  <div>
                    <p className="text-gray-600">Contractor</p>
                    <p className="font-medium">{task.contractor}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Assigned Date</p>
                    <p className="font-medium">{task.assignedDate.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

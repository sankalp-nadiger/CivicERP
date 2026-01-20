import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  head: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
}

export const DepartmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Water Supply',
      head: 'John Doe',
      email: 'john@municipality.gov',
      status: 'active',
      createdAt: new Date('2025-01-01'),
    },
    {
      id: '2',
      name: 'Waste Management',
      head: 'Jane Smith',
      email: 'jane@municipality.gov',
      status: 'active',
      createdAt: new Date('2025-01-02'),
    },
    {
      id: '3',
      name: 'Road Infrastructure',
      head: 'Bob Johnson',
      email: 'bob@municipality.gov',
      status: 'pending',
      createdAt: new Date('2025-01-03'),
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', head: '', email: '' });

  const handleAddDepartment = () => {
    if (!formData.name || !formData.head || !formData.email) {
      toast.error('Please fill all fields');
      return;
    }

    if (editingId) {
      setDepartments(
        departments.map((d) =>
          d.id === editingId
            ? { ...d, name: formData.name, head: formData.head, email: formData.email }
            : d
        )
      );
      toast.success('Department updated successfully');
      setEditingId(null);
    } else {
      const newDept: Department = {
        id: Date.now().toString(),
        name: formData.name,
        head: formData.head,
        email: formData.email,
        status: 'pending',
        createdAt: new Date(),
      };
      setDepartments([...departments, newDept]);
      toast.success('Department added successfully');
    }

    setFormData({ name: '', head: '', email: '' });
    setIsOpen(false);
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, head: dept.head, email: dept.email });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    setDepartments(departments.filter((d) => d.id !== id));
    toast.success('Department deleted');
  };

  const handleSendInvite = (dept: Department) => {
    toast.success(`Invitation sent to ${dept.email}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('mcc.departmentManagement')}</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', head: '', email: '' });
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('mcc.addDepartment')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('mcc.editDepartment') : t('mcc.addDepartment')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('mcc.departmentName')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Water Supply"
                />
              </div>
              <div>
                <Label>{t('mcc.departmentHead')}</Label>
                <Input
                  value={formData.head}
                  onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="head@municipality.gov"
                />
              </div>
              <Button onClick={handleAddDepartment} className="w-full">
                {t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{departments.length} Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('mcc.departmentName')}</TableHead>
                <TableHead>{t('mcc.departmentHead')}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{t('common.add')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.head}</TableCell>
                  <TableCell>{dept.email}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(dept.status)}>
                      {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {dept.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendInvite(dept)}
                          className="gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {t('mcc.sendSignupLink')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(dept)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

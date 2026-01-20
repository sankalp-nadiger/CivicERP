import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Phone } from 'lucide-react';

export interface Contractor {
  id: string;
  name: string;
  specialization: string;
  availability: 'free' | 'occupied';
  currentProjects: number;
  maxCapacity: number;
  contact: string;
  location: string;
  rating: number;
  completedTasks: number;
}

interface ContractorManagementProps {
  onSelectContractor?: (contractor: Contractor) => void;
}

export const ContractorManagement: React.FC<ContractorManagementProps> = ({ onSelectContractor }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'free' | 'occupied'>('all');

  const [contractors] = useState<Contractor[]>([
    {
      id: '1',
      name: 'ABC Construction',
      specialization: 'Road Repair',
      availability: 'free',
      currentProjects: 0,
      maxCapacity: 5,
      contact: '+91-9876543210',
      location: 'Downtown',
      rating: 4.8,
      completedTasks: 156,
    },
    {
      id: '2',
      name: 'XYZ Plumbing',
      specialization: 'Water Supply',
      availability: 'occupied',
      currentProjects: 3,
      maxCapacity: 5,
      contact: '+91-9876543211',
      location: 'North Zone',
      rating: 4.6,
      completedTasks: 98,
    },
    {
      id: '3',
      name: 'Green Waste Solutions',
      specialization: 'Waste Management',
      availability: 'free',
      currentProjects: 1,
      maxCapacity: 8,
      contact: '+91-9876543212',
      location: 'South Zone',
      rating: 4.5,
      completedTasks: 234,
    },
    {
      id: '4',
      name: 'Urban Drainage Ltd',
      specialization: 'Drainage Systems',
      availability: 'occupied',
      currentProjects: 2,
      maxCapacity: 4,
      contact: '+91-9876543213',
      location: 'Central',
      rating: 4.7,
      completedTasks: 178,
    },
    {
      id: '5',
      name: 'ElectroTech Services',
      specialization: 'Street Lighting',
      availability: 'free',
      currentProjects: 0,
      maxCapacity: 3,
      contact: '+91-9876543214',
      location: 'East Zone',
      rating: 4.4,
      completedTasks: 67,
    },
  ]);

  const filteredContractors = contractors.filter((contractor) => {
    const matchesSearch = contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAvailability = filterAvailability === 'all' || contractor.availability === filterAvailability;
    
    return matchesSearch && matchesAvailability;
  });

  return (
  <div className="flex flex-col min-h-[100dvh] min-h-0">
    {/* HEADER */}
    <div className="shrink-0 space-y-4">
      <h2 className="text-2xl font-bold">
        {t('departmentHead.contractorManagement')}
      </h2>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('departmentHead.searchContractors')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'free', 'occupied'] as const).map((status) => (
            <Button
              key={status}
              variant={filterAvailability === status ? 'default' : 'outline'}
              onClick={() => setFilterAvailability(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>
      </div>
    </div>

    {/* SCROLLABLE CONTENT */}
    <div className="flex-1 min-h-0 overflow-y-auto pt-4">
      <Card>
        <CardHeader>
          <CardTitle>{filteredContractors.length} Contractors</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filteredContractors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('common.noData')}
              </div>
            ) : (
              filteredContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {contractor.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {contractor.specialization}
                      </p>
                    </div>

                    <Badge
                      className={
                        contractor.availability === 'free'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {contractor.availability === 'free'
                        ? t('departmentHead.free')
                        : t('departmentHead.occupied')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Capacity</p>
                      <p className="font-semibold">
                        {contractor.currentProjects}/{contractor.maxCapacity}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rating</p>
                      <p className="font-semibold text-yellow-600">
                        ⭐ {contractor.rating}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Completed</p>
                      <p className="font-semibold">
                        {contractor.completedTasks}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-semibold text-blue-600">
                        {contractor.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contractor.contact}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {contractor.location}
                    </div>
                  </div>

                  {onSelectContractor && (
                    <Button
                      onClick={() => onSelectContractor(contractor)}
                      disabled={contractor.availability === 'occupied'}
                      className="w-full"
                      size="sm"
                    >
                      {t('departmentHead.assignTask')}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

};

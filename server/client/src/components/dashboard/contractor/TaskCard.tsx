import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ContractorTask } from './types';

interface TaskCardProps {
  task: ContractorTask;
  isSelected: boolean;
  onSelect: (task: ContractorTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isSelected, onSelect }) => {
  const { t } = useTranslation();

  const timeUntilDeadline = useMemo(() => {
    const now = new Date();
    const diff = task.slaDeadline.getTime() - now.getTime();
    const daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { daysRemaining, hoursRemaining, isOverdue: diff <= 0 };
  }, [task.slaDeadline]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-gray-900';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'border-green-400 bg-green-900/20';
      case 'in-verification':
        return 'border-blue-400 bg-blue-900/20';
      case 'completed':
        return 'border-gray-600 bg-gray-900/20';
      default:
        return 'border-yellow-400 bg-yellow-900/20';
    }
  };

  return (
    <Card
      onClick={() => onSelect(task)}
      className={`cursor-pointer transition-all border-2 ${
        isSelected
          ? 'bg-yellow-900 border-yellow-400 ring-2 ring-yellow-400'
          : 'bg-gray-800 border-gray-700 hover:border-yellow-400'
      } ${getStatusColor(task.status)}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-bold text-lg text-yellow-400">{task.ticketId}</p>
            <p className="text-sm text-gray-300">{task.category}</p>
          </div>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority.toUpperCase()}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-sm truncate">{task.location}</span>
        </div>

        {/* Stage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {t('contractor.stage', 'Stage:')}
            </span>
            <span className="text-white font-semibold">{task.currentStage}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all"
              style={{
                width: `${((['Intake', 'Screening', 'Assignment', 'Fieldwork', 'Verification', 'Approval'].indexOf(task.currentStage) + 1) / 6) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* SLA Timer */}
        <div className="flex items-center gap-2 p-2 bg-gray-900 rounded border-l-4 border-l-amber-400">
          <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {timeUntilDeadline.isOverdue ? (
              <p className="text-xs font-bold text-red-400">
                {t('contractor.slaBreached', 'SLA Breached')}
              </p>
            ) : (
              <p className="text-xs text-gray-300">
                {timeUntilDeadline.daysRemaining > 0 ? (
                  <span>
                    {timeUntilDeadline.daysRemaining}d {timeUntilDeadline.hoursRemaining}h
                    <span className="text-gray-500"> left</span>
                  </span>
                ) : (
                  <span className="text-red-400">
                    {timeUntilDeadline.hoursRemaining}h left
                  </span>
                )}
              </p>
            )}
          </div>
          {timeUntilDeadline.daysRemaining <= 1 && !timeUntilDeadline.isOverdue && (
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          )}
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              task.status === 'in-progress'
                ? 'bg-green-500 text-white'
                : task.status === 'in-verification'
                ? 'bg-blue-500 text-white'
                : task.status === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-yellow-500 text-gray-900'
            }`}
          >
            {task.status.toUpperCase().replace('-', ' ')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

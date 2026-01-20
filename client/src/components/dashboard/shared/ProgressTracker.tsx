import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

export interface ProgressStage {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  timestamp?: Date;
}

interface ProgressTrackerProps {
  stages: ProgressStage[];
  taskId: string;
  complaintType: string;
  contractor: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  stages,
  taskId,
  complaintType,
  contractor,
}) => {
  const { t } = useTranslation();

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const progress = (completedStages / stages.length) * 100;

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('departmentHead.progressTracking')}</CardTitle>
        <p className="text-sm text-gray-600 mt-2">Task ID: {taskId}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{t('common.loading')}</span>
            <span className="text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Complaint Type</p>
            <p className="font-semibold text-gray-900">{complaintType}</p>
          </div>
          <div>
            <p className="text-gray-600">Contractor</p>
            <p className="font-semibold text-gray-900">{contractor}</p>
          </div>
        </div>

        {/* Stages Timeline */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300" />
                )}
                {index < stages.length - 1 && (
                  <div
                    className={`w-1 h-12 my-1 ${
                      stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{stage.name}</span>
                  <Badge className={getStageColor(stage.status)}>
                    {stage.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
                {stage.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stage.timestamp.toLocaleDateString()} {stage.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

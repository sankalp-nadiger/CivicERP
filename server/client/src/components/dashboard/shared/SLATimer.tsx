import React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';

interface SLATimerProps {
  deadline: Date;
  taskId: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export const SLATimer: React.FC<SLATimerProps> = ({ deadline, taskId, priority = 'medium' }) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, isOverdue: false });

  React.useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({ days, hours, minutes, isOverdue: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  const getProgressColor = (daysLeft: number) => {
    if (timeRemaining.isOverdue) return 'bg-red-500';
    if (daysLeft <= 1) return 'bg-red-500';
    if (daysLeft <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const totalDays = Math.ceil((deadline.getTime() - new Date(deadline.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = totalDays - (timeRemaining.days + (timeRemaining.hours / 24));
  const progress = (elapsedDays / totalDays) * 100;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-semibold">{t('sla.timer')}</CardTitle>
          </div>
          {timeRemaining.isOverdue && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('sla.deadline')}</span>
            <span className={timeRemaining.isOverdue ? 'text-red-600 font-semibold' : ''}>
              {deadline.toLocaleDateString()} {deadline.toLocaleTimeString()}
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{timeRemaining.days}</p>
            <p className="text-xs text-gray-500">{t('sla.daysRemaining')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{timeRemaining.hours}</p>
            <p className="text-xs text-gray-500">{t('sla.hoursRemaining')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{timeRemaining.minutes}</p>
            <p className="text-xs text-gray-500">min</p>
          </div>
        </div>

        {timeRemaining.isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700 font-medium">
            {t('sla.overdue')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

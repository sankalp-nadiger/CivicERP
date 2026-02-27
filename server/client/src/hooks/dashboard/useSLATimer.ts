import { useState, useCallback } from 'react';

interface SLAConfig {
  days: number;
  hours: number;
  minutes: number;
}

export const useSLATimer = () => {
  const [timers, setTimers] = useState<Record<string, Date>>({});

  const getSLAConfig = useCallback((priority: 'low' | 'medium' | 'high' | 'critical'): SLAConfig => {
    const configs: Record<string, SLAConfig> = {
      low: { days: 7, hours: 0, minutes: 0 },
      medium: { days: 3, hours: 0, minutes: 0 },
      high: { days: 1, hours: 0, minutes: 0 },
      critical: { days: 0, hours: 4, minutes: 0 },
    };
    return configs[priority];
  }, []);

  const calculateDeadline = useCallback((priority: 'low' | 'medium' | 'high' | 'critical'): Date => {
    const config = getSLAConfig(priority);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + config.days);
    deadline.setHours(deadline.getHours() + config.hours);
    deadline.setMinutes(deadline.getMinutes() + config.minutes);
    return deadline;
  }, [getSLAConfig]);

  const registerTimer = useCallback((taskId: string, deadline: Date) => {
    setTimers(prev => ({
      ...prev,
      [taskId]: deadline,
    }));
  }, []);

  const isOverdue = useCallback((taskId: string): boolean => {
    const deadline = timers[taskId];
    if (!deadline) return false;
    return new Date() > deadline;
  }, [timers]);

  return { registerTimer, calculateDeadline, isOverdue, getSLAConfig, timers };
};

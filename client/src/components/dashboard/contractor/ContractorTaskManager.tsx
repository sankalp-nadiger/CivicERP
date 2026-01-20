import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, MapPin, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import { WorkflowStageSelector } from './WorkflowStageSelector';
import { EvidenceUpload } from './EvidenceUpload';
import { OfflineSyncStatus } from './OfflineSyncStatus';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { ContractorTask, WorkflowStage } from './types';

/* ---------------- MOCK DATA ---------------- */

const mockTasks: ContractorTask[] = [
  {
    id: 'TASK-001',
    ticketId: 'TKT-2026-001',
    category: 'Pothole',
    location: 'Main Street & 5th Avenue',
    coordinates: { lat: 40.7128, lng: -74.006 },
    priority: 'high',
    description: 'Large pothole on Main Street blocking traffic',
    currentStage: 'Fieldwork',
    assignedDate: new Date(Date.now() - 2 * 86400000),
    slaDeadline: new Date(Date.now() + 3 * 86400000),
    status: 'in-progress',
  },
  {
    id: 'TASK-002',
    ticketId: 'TKT-2026-002',
    category: 'Streetlight',
    location: 'Park Avenue & 3rd Street',
    coordinates: { lat: 40.758, lng: -73.9855 },
    priority: 'medium',
    description: 'Streetlight not working at night',
    currentStage: 'Assignment',
    assignedDate: new Date(Date.now() - 86400000),
    slaDeadline: new Date(Date.now() + 5 * 86400000),
    status: 'pending',
  },
];

const WORKFLOW_STAGES: WorkflowStage[] = [
  'Intake',
  'Screening',
  'Assignment',
  'Fieldwork',
  'Verification',
  'Approval',
];

/* ---------------- COMPONENT ---------------- */

const ContractorTaskManager: React.FC = () => {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<ContractorTask[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<ContractorTask | null>(
    mockTasks[0]
  );
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'pending'>(
    'synced'
  );

  /* -------- ONLINE / OFFLINE SAFE INIT -------- */

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* -------- SYNC SIMULATION -------- */

  useEffect(() => {
    if (isOnline && syncStatus === 'pending') {
      setSyncStatus('syncing');
      const timer = setTimeout(() => setSyncStatus('synced'), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncStatus]);

  /* -------- HANDLERS -------- */

  const handleStageUpdate = (taskId: string, stage: WorkflowStage) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, currentStage: stage, status: 'in-progress' }
          : task
      )
    );

    setSelectedTask((prev) =>
      prev && prev.id === taskId
        ? { ...prev, currentStage: stage, status: 'in-progress' }
        : prev
    );

    if (!isOnline) setSyncStatus('pending');
  };

  const handleEvidenceSubmit = (taskId: string, evidence: any) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              evidence,
              currentStage: 'Verification',
              lastUpdated: new Date(),
            }
          : task
      )
    );

    setSelectedTask((prev) =>
      prev && prev.id === taskId
        ? {
            ...prev,
            evidence,
            currentStage: 'Verification',
            lastUpdated: new Date(),
          }
        : prev
    );

    if (!isOnline) setSyncStatus('pending');
  };

  const activeTasks = tasks.filter(
    (task) => task.status === 'in-progress' || task.status === 'pending'
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* ---------------- HEADER ---------------- */}
      <header className="shrink-0 p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              {t('contractor.taskManager.title', 'Task Manager')}
            </h1>
            <p className="text-sm text-gray-400">
              {t(
                'contractor.taskManager.subtitle',
                'Field Operations Dashboard'
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-400">
              {isOnline ? (
                <>
                  <Wifi className="text-green-400" />
                  <span className="text-green-400 font-semibold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="text-red-400" />
                  <span className="text-red-400 font-semibold">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-4 flex gap-3 p-3 bg-amber-900 rounded-lg border border-amber-400">
            <AlertTriangle className="text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Offline Mode</p>
              <p className="text-sm text-amber-100">
                Changes will sync when connection is restored
              </p>
            </div>
          </div>
        )}

        {syncStatus !== 'synced' && isOnline && (
          <div className="mt-3">
            <OfflineSyncStatus status={syncStatus} />
          </div>
        )}
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TASK LIST */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">
              Active Tasks ({activeTasks.length})
            </h2>

            <div className="space-y-3">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onSelect={setSelectedTask}
                />
              ))}
            </div>
          </div>

          {/* TASK DETAILS */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <div className="space-y-6">
                <Card className="bg-gray-800 border-yellow-400 border-2">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-yellow-400">
                          {selectedTask.ticketId}
                        </CardTitle>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedTask.description}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm font-bold">
                        {selectedTask.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-gray-300">
                      <MapPin className="text-green-400" />
                      {selectedTask.location}
                    </div>
                  </CardHeader>
                </Card>

                <WorkflowStageSelector
                  currentStage={selectedTask.currentStage}
                  availableStages={WORKFLOW_STAGES}
                  onStageChange={(stage) =>
                    handleStageUpdate(selectedTask.id, stage)
                  }
                  isOffline={!isOnline}
                />

                <EvidenceUpload
                  taskId={selectedTask.id}
                  onEvidenceSubmit={handleEvidenceSubmit}
                  isOffline={!isOnline}
                  coordinates={selectedTask.coordinates}
                />
              </div>
            ) : (
              <Card className="h-80 flex items-center justify-center bg-gray-800">
                <p className="text-gray-400">Select a task to continue</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export { ContractorTaskManager };

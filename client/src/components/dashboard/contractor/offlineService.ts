import type { ContractorTask, EvidenceSubmission, WorkflowStage } from './types';

/**
 * Offline Storage Service for Contractor Task Manager
 * Manages local caching and sync queue for offline-first operation
 */

export interface PendingUpdate {
  id: string;
  type: 'stage_update' | 'evidence_submit';
  taskId: string;
  timestamp: Date;
  data: any;
}

const STORAGE_KEYS = {
  TASKS: 'contractor_tasks',
  PENDING_UPDATES: 'contractor_pending_updates',
  LAST_SYNC: 'contractor_last_sync',
  SYNC_STATUS: 'contractor_sync_status',
};

/**
 * Save tasks to local storage
 */
export const saveTasks = (tasks: ContractorTask[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks locally:', error);
  }
};

/**
 * Load tasks from local storage
 */
export const loadTasks = (): ContractorTask[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load tasks from local storage:', error);
    return [];
  }
};

/**
 * Queue a stage update for sync
 */
export const queueStageUpdate = (taskId: string, stage: WorkflowStage): PendingUpdate => {
  const update: PendingUpdate = {
    id: `update_${taskId}_${Date.now()}`,
    type: 'stage_update',
    taskId,
    timestamp: new Date(),
    data: { stage },
  };

  addPendingUpdate(update);
  return update;
};

/**
 * Queue an evidence submission for sync
 */
export const queueEvidenceSubmission = (
  taskId: string,
  evidence: EvidenceSubmission
): PendingUpdate => {
  const update: PendingUpdate = {
    id: `evidence_${taskId}_${Date.now()}`,
    type: 'evidence_submit',
    taskId,
    timestamp: new Date(),
    data: { evidence },
  };

  addPendingUpdate(update);
  return update;
};

/**
 * Add update to pending queue
 */
const addPendingUpdate = (update: PendingUpdate): void => {
  try {
    const existing = getPendingUpdates();
    const updated = [...existing, update];
    localStorage.setItem(STORAGE_KEYS.PENDING_UPDATES, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to queue update:', error);
  }
};

/**
 * Get all pending updates
 */
export const getPendingUpdates = (): PendingUpdate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PENDING_UPDATES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get pending updates:', error);
    return [];
  }
};

/**
 * Clear pending updates after successful sync
 */
export const clearPendingUpdates = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_UPDATES);
    updateLastSync();
  } catch (error) {
    console.error('Failed to clear pending updates:', error);
  }
};

/**
 * Remove specific pending update
 */
export const removePendingUpdate = (updateId: string): void => {
  try {
    const existing = getPendingUpdates();
    const updated = existing.filter((u) => u.id !== updateId);
    localStorage.setItem(STORAGE_KEYS.PENDING_UPDATES, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove pending update:', error);
  }
};

/**
 * Update last sync timestamp
 */
export const updateLastSync = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Failed to update sync timestamp:', error);
  }
};

/**
 * Get last sync timestamp
 */
export const getLastSync = (): Date | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return stored ? new Date(stored) : null;
  } catch (error) {
    console.error('Failed to get last sync timestamp:', error);
    return null;
  }
};

/**
 * Set sync status
 */
export const setSyncStatus = (status: 'synced' | 'syncing' | 'pending'): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, status);
  } catch (error) {
    console.error('Failed to set sync status:', error);
  }
};

/**
 * Get current sync status
 */
export const getSyncStatus = (): 'synced' | 'syncing' | 'pending' => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
    return (stored as any) || 'synced';
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return 'synced';
  }
};

/**
 * Convert File to base64 for storage
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convert base64 to File
 */
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
};

/**
 * Prepare task update for API submission
 */
export const prepareTaskUpdatePayload = (
  update: PendingUpdate
): Record<string, any> => {
  return {
    id: update.id,
    type: update.type,
    taskId: update.taskId,
    timestamp: update.timestamp.toISOString(),
    ...update.data,
  };
};

/**
 * Clear all offline data (for logout or reset)
 */
export const clearAllOfflineData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = (): {
  totalUpdates: number;
  totalTasks: number;
  lastSync: string | null;
} => {
  return {
    totalUpdates: getPendingUpdates().length,
    totalTasks: loadTasks().length,
    lastSync: getLastSync()?.toLocaleString() || 'Never',
  };
};

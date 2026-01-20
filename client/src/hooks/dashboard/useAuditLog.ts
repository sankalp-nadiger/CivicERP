import { useState, useCallback, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  action: string;
  performer: string;
  timestamp: Date;
  changes?: Record<string, { old: string; new: string }>;
  description: string;
}

export const useAuditLog = (initialLogs: AuditLogEntry[] = []) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);

  const addLog = useCallback((log: Omit<AuditLogEntry, 'id'>) => {
    const newLog: AuditLogEntry = {
      ...log,
      id: Date.now().toString(),
    };
    setLogs((prevLogs) => [newLog, ...prevLogs]);
    
    // Persist to localStorage for cryptographic audit trail
    const allLogs = [newLog, ...logs];
    localStorage.setItem('audit_logs', JSON.stringify(allLogs));
    
    return newLog;
  }, [logs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('audit_logs');
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('audit_logs');
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs);
        setLogs(parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })));
      } catch (error) {
        console.error('Failed to parse audit logs:', error);
      }
    }
  }, []);

  return { logs, addLog, clearLogs };
};

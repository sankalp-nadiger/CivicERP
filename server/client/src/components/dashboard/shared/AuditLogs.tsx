import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Clock, FileText } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  action: string;
  performer: string;
  timestamp: Date;
  changes?: Record<string, { old: string; new: string }>;
  description: string;
}

interface AuditLogsProps {
  entries: AuditLogEntry[];
  taskId: string;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ entries, taskId }) => {
  const { t } = useTranslation();

  const sortedEntries = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const getActionColor = (action: string) => {
    const actionMap: Record<string, string> = {
      'created': 'bg-blue-100 text-blue-800',
      'updated': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'verified': 'bg-cyan-100 text-cyan-800',
    };
    return actionMap[action.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-500" />
          <CardTitle>{t('auditLog.workHistory')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sortedEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('common.noData')}
              </div>
            ) : (
              sortedEntries.map((entry, index) => (
                <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                  {/* Timeline dot */}
                  <div className="absolute -left-3 w-5 h-5 bg-blue-500 rounded-full border-2 border-white" />
                  
                  <div className="space-y-2">
                    {/* Header with action and performer */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Badge className={getActionColor(entry.action)}>
                          {entry.action.toUpperCase()}
                        </Badge>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {entry.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Performer */}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{entry.performer}</span>
                    </div>

                    {/* Changes if any */}
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-medium text-gray-700">
                          <FileText className="h-3 w-3" />
                          {t('auditLog.changes')}
                        </div>
                        {Object.entries(entry.changes).map(([field, change]) => (
                          <div key={field} className="flex gap-2 text-gray-600">
                            <span className="font-medium">{field}:</span>
                            <span className="line-through text-red-600">{change.old}</span>
                            <span className="text-green-600">→ {change.new}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

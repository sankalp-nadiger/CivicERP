import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OfflineSyncStatusProps {
  status: 'synced' | 'syncing' | 'pending';
}

export const OfflineSyncStatus: React.FC<OfflineSyncStatusProps> = ({ status }) => {
  const { t } = useTranslation();
  const [pendingUpdates, setPendingUpdates] = useState(0);

  useEffect(() => {
    if (status === 'pending') {
      // Simulate loading pending updates from localStorage
      const pendingData = localStorage.getItem('pending_updates');
      if (pendingData) {
        try {
          const updates = JSON.parse(pendingData);
          setPendingUpdates(Array.isArray(updates) ? updates.length : 1);
        } catch {
          setPendingUpdates(1);
        }
      } else {
        setPendingUpdates(1);
      }
    }
  }, [status]);

  const getStatusIcon = () => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-amber-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'synced':
        return {
          title: t('contractor.allSynced', 'All Changes Synced'),
          description: t(
            'contractor.syncedDescription',
            'All local changes have been uploaded'
          ),
        };
      case 'syncing':
        return {
          title: t('contractor.syncingData', 'Syncing Data'),
          description: t(
            'contractor.syncingDescription',
            'Uploading local changes to server'
          ),
        };
      case 'pending':
        return {
          title: t('contractor.pendingSync', 'Pending Changes'),
          description: t(
            'contractor.pendingDescription',
            `${pendingUpdates} update${pendingUpdates > 1 ? 's' : ''} waiting to sync`
          ),
        };
    }
  };

  const { title, description } = getStatusText();
  const bgColor =
    status === 'synced'
      ? 'bg-green-900/20 border-green-600'
      : status === 'syncing'
      ? 'bg-blue-900/20 border-blue-600'
      : 'bg-amber-900/20 border-amber-600';

  return (
    <Card className={`${bgColor} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-semibold text-white text-sm">{title}</p>
              <p className="text-xs text-gray-300">{description}</p>
            </div>
          </div>

          {status === 'pending' && (
            <Button size="sm" variant="outline" className="text-xs">
              {t('contractor.syncNow', 'Sync Now')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineSyncStatus;

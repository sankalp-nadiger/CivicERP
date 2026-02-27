import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WorkflowStage } from './types';

interface WorkflowStageSelectorProps {
  currentStage: WorkflowStage;
  availableStages: WorkflowStage[];
  onStageChange: (stage: WorkflowStage) => void;
  isOffline?: boolean;
}

export const WorkflowStageSelector: React.FC<WorkflowStageSelectorProps> = ({
  currentStage,
  availableStages,
  onStageChange,
  isOffline = false,
}) => {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [nextStage, setNextStage] = useState<WorkflowStage | null>(null);

  const currentIndex = availableStages.indexOf(currentStage);
  const nextAvailableStage =
    currentIndex < availableStages.length - 1
      ? availableStages[currentIndex + 1]
      : null;

  const handleStageClick = (stage: WorkflowStage) => {
    const stageIndex = availableStages.indexOf(stage);
    if (stageIndex <= currentIndex + 1) {
      setNextStage(stage);
      setIsConfirming(true);
    }
  };

  const handleConfirmStageChange = () => {
    if (nextStage) {
      onStageChange(nextStage);
      setIsConfirming(false);
      setNextStage(null);
    }
  };

  const getStageDescription = (stage: WorkflowStage): string => {
    const descriptions: Record<WorkflowStage, string> = {
      Intake: t('contractor.stages.intake', 'Initial complaint registration'),
      Screening: t('contractor.stages.screening', 'Complaint verification'),
      Assignment: t('contractor.stages.assignment', 'Task assigned to contractor'),
      Fieldwork: t('contractor.stages.fieldwork', 'On-site repair work'),
      Verification: t('contractor.stages.verification', 'Quality check & inspection'),
      Approval: t('contractor.stages.approval', 'Final approval & closure'),
    };
    return descriptions[stage];
  };

  const getStageColor = (stage: WorkflowStage, index: number): string => {
    if (stage === currentStage) return 'bg-yellow-500 text-gray-900';
    if (index < currentIndex) return 'bg-green-500 text-white';
    if (index === currentIndex + 1) return 'bg-blue-500 text-white';
    return 'bg-gray-600 text-gray-400';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-yellow-400">
          {t('contractor.workflowProgress', 'Workflow Progress')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Stage Flow */}
        <div>
          <div className="space-y-3">
            {availableStages.map((stage, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = stage === currentStage;
              const isNext = index === currentIndex + 1;
              const isLocked = index > currentIndex + 1;

              return (
                <div key={stage}>
                  <button
                    onClick={() => handleStageClick(stage)}
                    disabled={isLocked || isOffline}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                      isCurrent
                        ? 'border-yellow-400 bg-yellow-900'
                        : isCompleted
                        ? 'border-green-400 bg-green-900/20'
                        : isNext
                        ? 'border-blue-400 bg-blue-900/20 cursor-pointer'
                        : 'border-gray-600 bg-gray-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getStageColor(
                          stage,
                          index
                        )}`}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{stage}</p>
                        <p className="text-xs text-gray-400">
                          {getStageDescription(stage)}
                        </p>
                      </div>
                    </div>

                    {isLocked ? (
                      <Lock className="h-5 w-5 text-gray-500" />
                    ) : isNext ? (
                      <ChevronRight className="h-5 w-5 text-blue-400" />
                    ) : isCompleted ? (
                      <div className="text-green-400 font-bold">✓</div>
                    ) : null}
                  </button>

                  {/* Connector Line */}
                  {index < availableStages.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div
                        className={`w-1 h-8 ${
                          index < currentIndex ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Action Button */}
        {nextAvailableStage && !isOffline && (
          <div className="pt-4 border-t border-gray-700">
            <Button
              onClick={() => {
                setNextStage(nextAvailableStage);
                setIsConfirming(true);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 text-lg rounded-lg flex items-center justify-center gap-2"
            >
              <ChevronRight className="h-5 w-5" />
              {t('contractor.moveToNext', `Move to ${nextAvailableStage}`)}
            </Button>
          </div>
        )}

        {isOffline && (
          <div className="p-3 bg-amber-900 border-l-4 border-amber-400 rounded text-sm text-amber-200">
            {t(
              'contractor.stageChangeOffline',
              'Stage changes will be synced when online'
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {isConfirming && nextStage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-yellow-400 max-w-sm w-full">
              <CardHeader>
                <CardTitle className="text-yellow-400">
                  {t('contractor.confirmStageChange', 'Confirm Stage Change')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-gray-300">
                    {t(
                      'contractor.moveTaskFrom',
                      'Move task from'
                    )}{' '}
                    <span className="font-bold text-white">{currentStage}</span>{' '}
                    {t('contractor.to', 'to')}{' '}
                    <span className="font-bold text-yellow-400">{nextStage}</span>?
                  </p>
                  <p className="text-sm text-gray-400">
                    {getStageDescription(nextStage)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsConfirming(false);
                      setNextStage(null);
                    }}
                    className="flex-1"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    onClick={handleConfirmStageChange}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold"
                  >
                    {t('common.confirm', 'Confirm')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowStageSelector;

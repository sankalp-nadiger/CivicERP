import React, { useEffect, useState } from 'react';
import {
  Complaint,
  assignComplaintToContractor,
  translateComplaintTexts,
  updateAssignedComplaintStatusForContractor,
  updateComplaintStatus,
  uploadComplaintStatusProofImage,
} from '@/services/complaintService';
import { listContractors, type Contractor } from '@/services/contractorService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, Filter, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { GoogleMapsEmbed } from '@/components/GoogleMapsEmbed';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const COMPLAINT_STATUS_FLOW = [
  'OPEN',
  'ASSIGNED',
  'WORK_STARTED',
  'IN_PROGRESS',
  'WORK_COMPLETED',
  'VERIFIED',
  'CLOSED',
] as const;

type ComplaintStatus = (typeof COMPLAINT_STATUS_FLOW)[number];

const normalizeComplaintStatus = (raw: unknown): ComplaintStatus | null => {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  const upper = text.toUpperCase();
  if ((COMPLAINT_STATUS_FLOW as readonly string[]).includes(upper)) {
    return upper as ComplaintStatus;
  }

  const lower = text.toLowerCase();
  if (lower === 'todo' || lower.includes('registered') || lower === 'open') return 'OPEN';
  if (lower === 'assigned') return 'ASSIGNED';
  if (lower === 'work_started' || lower === 'work started' || lower === 'started') return 'WORK_STARTED';
  if (lower === 'in-progress' || lower === 'in progress' || lower === 'in_progress' || lower === 'progress' || lower.includes('investigation')) return 'IN_PROGRESS';
  if (lower === 'work_completed' || lower === 'work completed' || lower === 'completed' || lower === 'work done') return 'WORK_COMPLETED';
  if (lower === 'verified') return 'VERIFIED';
  if (lower === 'closed' || lower === 'resolved') return 'CLOSED';

  return null;
};

const resolveProofUrl = (rawValue: unknown): string | null => {
  const raw = String(rawValue ?? '').trim();
  if (!raw) return null;

  // Support inline base64 payloads persisted by older clients.
  if (/^data:image\//i.test(raw)) return raw;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `${window.location.protocol}${raw}`;

  // Support legacy values that may be stored as server-relative paths.
  if (raw.startsWith('/')) return `${API_BASE_URL.replace(/\/$/, '')}${raw}`;

  // Support legacy values like "uploads/proofs/file.jpg".
  return `${API_BASE_URL.replace(/\/$/, '')}/${raw.replace(/^\/+/, '')}`;
};

const getProofRawValue = (complaint: Complaint): unknown => {
  const source = complaint as Complaint & {
    complaintProof?: unknown;
    proofUrl?: unknown;
    proof_url?: unknown;
    imageUrl?: unknown;
    image_url?: unknown;
  };

  return (
    source.complaint_proof ??
    source.complaintProof ??
    source.proofUrl ??
    source.proof_url ??
    source.imageUrl ??
    source.image_url ??
    null
  );
};

interface ComplaintsTableProps {
  complaints: Complaint[];
  onComplaintUpdate?: () => void;
  enableContractorAssignment?: boolean;
  assignmentDepartment?: {
    departmentId?: string;
    departmentName?: string;
  };
}

export function ComplaintsTable({ complaints, onComplaintUpdate, enableContractorAssignment, assignmentDepartment }: ComplaintsTableProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [complaintOverrides, setComplaintOverrides] = useState<Record<string, Complaint>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isContractorRole = String(user?.role || '').toLowerCase() === 'contractor';

  const mergedComplaints = React.useMemo(() => {
    return complaints.map((complaint) => complaintOverrides[complaint.complaint_id] ?? complaint);
  }, [complaints, complaintOverrides]);

  const safeFormatDate = (value: unknown, pattern: string) => {
    try {
      const date = value instanceof Date ? value : new Date(value as any);
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return t('complaintsTable.na', 'N/A');
      return format(date, pattern);
    } catch {
      return t('complaintsTable.na', 'N/A');
    }
  };

  const getStatusI18nKey = (status: string): string | null => {
    const normalized = normalizeComplaintStatus(status);
    if (!normalized) return null;

    const keyMap: Record<ComplaintStatus, string> = {
      OPEN: 'open',
      ASSIGNED: 'assigned',
      WORK_STARTED: 'workStarted',
      IN_PROGRESS: 'inProgress',
      WORK_COMPLETED: 'workCompleted',
      VERIFIED: 'verified',
      CLOSED: 'closed',
    };

    return keyMap[normalized];
  };

  const getStatusLabel = (status: string) => {
    const key = getStatusI18nKey(status);
    if (!key) return status;
    return t(`complaintsTable.status.${key}`, status);
  };

  const getStatusBadgeVariant = (status: string) => {
    const normalizedStatus = normalizeComplaintStatus(status);
    if (normalizedStatus === 'CLOSED') {
      return 'default';
    }
    if (normalizedStatus === 'WORK_COMPLETED' || normalizedStatus === 'VERIFIED') {
      return 'secondary';
    }
    if (normalizedStatus === 'OPEN' || normalizedStatus === 'ASSIGNED' || normalizedStatus === 'WORK_STARTED' || normalizedStatus === 'IN_PROGRESS') {
      return 'outline';
    }
    return 'destructive';
  };

  const getPriorityBadge = (priorityFactor: number) => {
    if (priorityFactor >= 0.7) return { label: t('complaintsTable.priority.high', 'High'), variant: 'destructive' as const };
    if (priorityFactor >= 0.4) return { label: t('complaintsTable.priority.medium', 'Medium'), variant: 'secondary' as const };
    return { label: t('complaintsTable.priority.low', 'Low'), variant: 'outline' as const };
  };

  const filteredComplaints = mergedComplaints.filter(complaint => {
    const canonicalStatus = normalizeComplaintStatus(complaint.status);
    const matchesStatus = statusFilter === 'all' || canonicalStatus === statusFilter;
    const matchesSearch = searchQuery === '' || 
      complaint.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.issue_category.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (
    complaint: Complaint,
    newStatus: string,
    comments?: string,
    completionProofFile?: File | null,
  ) => {
    setIsUpdating(true);
    try {
      const normalizedStatus = normalizeComplaintStatus(newStatus) || 'OPEN';
      let updated: Complaint;

      if (isContractorRole) {
        let statusProofUrl: string | undefined;

        if (normalizedStatus === 'WORK_COMPLETED') {
          if (!completionProofFile) {
            throw new Error(t('complaintsTable.contractor.proofRequired', 'Upload a resolved-work image before marking as Work Completed.'));
          }

          statusProofUrl = await uploadComplaintStatusProofImage({
            file: completionProofFile,
            uuid: complaint.raisedBy?.uuid,
            folder: 'complaints/status-proof',
          });
        }

        updated = await updateAssignedComplaintStatusForContractor(
          complaint.complaint_id,
          normalizedStatus,
          comments,
          statusProofUrl,
        );
      } else {
        updated = await updateComplaintStatus(complaint.complaint_id, normalizedStatus, comments);
      }

      setComplaintOverrides(prev => ({ ...prev, [updated.complaint_id]: updated }));
      setSelectedComplaint(updated);
      toast({
        title: t('complaintsTable.toast.statusUpdatedTitle', 'Status Updated'),
        description: t('complaintsTable.toast.statusUpdatedDesc', 'Complaint status has been updated successfully'),
      });
      onComplaintUpdate?.();
    } catch (error) {
      toast({
        title: t('complaintsTable.toast.updateFailedTitle', 'Update Failed'),
        description: t('complaintsTable.toast.updateFailedDesc', 'Failed to update complaint status'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('complaintsTable.title', 'All Complaints')}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t('complaintsTable.searchPlaceholder', 'Search complaints...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('complaintsTable.filterPlaceholder', 'Filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('complaintsTable.status.all', 'All Status')}</SelectItem>
                <SelectItem value="OPEN">{t('complaintsTable.status.open', 'Open')}</SelectItem>
                <SelectItem value="ASSIGNED">{t('complaintsTable.status.assigned', 'Assigned')}</SelectItem>
                <SelectItem value="WORK_STARTED">{t('complaintsTable.status.workStarted', 'Work Started')}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t('complaintsTable.status.inProgress', 'In Progress')}</SelectItem>
                <SelectItem value="WORK_COMPLETED">{t('complaintsTable.status.workCompleted', 'Work Completed')}</SelectItem>
                <SelectItem value="VERIFIED">{t('complaintsTable.status.verified', 'Verified')}</SelectItem>
                <SelectItem value="CLOSED">{t('complaintsTable.status.closed', 'Closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('complaintsTable.columns.complaintId', 'Complaint ID')}</TableHead>
                <TableHead>{t('complaintsTable.columns.title', 'Title')}</TableHead>
                <TableHead>{t('complaintsTable.columns.category', 'Category')}</TableHead>
                <TableHead>{t('complaintsTable.columns.status', 'Status')}</TableHead>
                <TableHead>{t('complaintsTable.columns.priority', 'Priority')}</TableHead>
                <TableHead>{t('complaintsTable.columns.date', 'Date')}</TableHead>
                <TableHead>{t('complaintsTable.columns.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    {t('complaintsTable.empty', 'No complaints found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((complaint) => {
                  const priority = getPriorityBadge(complaint.priority_factor);
                  return (
                    <TableRow key={complaint._id}>
                      <TableCell className="font-mono text-xs">
                        {complaint.complaint_id.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {complaint.title || complaint.summarized_complaint || t('complaintsTable.untitled', 'Untitled')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {complaint.issue_category.slice(0, 2).map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {complaint.issue_category.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{complaint.issue_category.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(complaint.status)}>
                          {getStatusLabel(complaint.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {safeFormatDate(complaint.date, 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('complaintsTable.view', 'View')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          {t('complaintsTable.showing', {
            defaultValue: 'Showing {{shown}} of {{total}} complaints',
            shown: filteredComplaints.length,
            total: mergedComplaints.length,
          })}
        </div>

        <Dialog
          open={isDetailsOpen}
          onOpenChange={(open) => {
            setIsDetailsOpen(open);
            if (!open) setSelectedComplaint(null);
          }}
        >
          <DialogContent
            className="max-w-3xl max-h-[90vh] overflow-y-auto"
            key={selectedComplaint?._id || selectedComplaint?.complaint_id || 'empty'}
          >
            {selectedComplaint && (
              <>
                <DialogHeader>
                  <DialogTitle>{t('complaintsTable.detailsTitle', 'Complaint Details')}</DialogTitle>
                  <DialogDescription>
                    {t('complaintsTable.detailsIdPrefix', 'ID')}: {selectedComplaint.complaint_id}
                  </DialogDescription>
                </DialogHeader>
                <ComplaintDetailsView
                  complaint={selectedComplaint}
                  onUpdateStatus={handleUpdateStatus}
                  onAssignContractor={async (complaint, contractorId) => {
                    const updatedComplaint = await assignComplaintToContractor({ complaint_id: complaint.complaint_id, contractorId });
                    setComplaintOverrides(prev => ({ ...prev, [updatedComplaint.complaint_id]: updatedComplaint }));
                    setSelectedComplaint(updatedComplaint);
                    onComplaintUpdate?.();
                  }}
                  isUpdating={isUpdating}
                  isContractorRole={isContractorRole}
                  enableContractorAssignment={enableContractorAssignment === true}
                  assignmentDepartment={assignmentDepartment}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface ComplaintDetailsViewProps {
  complaint: Complaint;
  onUpdateStatus: (complaint: Complaint, status: string, comments?: string, completionProofFile?: File | null) => void;
  onAssignContractor: (complaint: Complaint, contractorId: string) => Promise<void>;
  isUpdating: boolean;
  isContractorRole: boolean;
  enableContractorAssignment: boolean;
  assignmentDepartment?: {
    departmentId?: string;
    departmentName?: string;
  };
}

function ComplaintDetailsView({ complaint, onUpdateStatus, onAssignContractor, isUpdating, isContractorRole, enableContractorAssignment, assignmentDepartment }: ComplaintDetailsViewProps) {
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [comments, setComments] = useState('');
  const [completionProofFile, setCompletionProofFile] = useState<File | null>(null);
  const [proofImageLoadError, setProofImageLoadError] = useState(false);
  const { t, i18n } = useTranslation();

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const [translated, setTranslated] = useState<{
    title?: string;
    location?: string;
    complaint?: string;
    summarized_complaint?: string;
  } | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    setNewStatus(complaint.status);
    setComments('');
    setCompletionProofFile(null);
    setSelectedContractorId('');
    setProofImageLoadError(false);
  }, [complaint._id, complaint.complaint_id, complaint.status]);

  useEffect(() => {
    if (!enableContractorAssignment) return;

    let cancelled = false;
    setIsLoadingContractors(true);
    listContractors({
      status: 'ALL',
      departmentId: assignmentDepartment?.departmentId,
      departmentName: assignmentDepartment?.departmentName,
    })
      .then((list) => {
        if (cancelled) return;
        setContractors(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load contractors', err);
        setContractors([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingContractors(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enableContractorAssignment, assignmentDepartment?.departmentId, assignmentDepartment?.departmentName]);

  const issueCategories = Array.isArray(complaint.issue_category) ? complaint.issue_category : [];
  const commentHistory = Array.isArray(complaint.comments) ? complaint.comments : [];
  const proofRawValue = getProofRawValue(complaint);
  const proofUrl = resolveProofUrl(proofRawValue);
  const resolutionProofRaw = (complaint as any)?.statusProof ?? (complaint as any)?.status_proof ?? null;
  const resolutionProofUrl = resolveProofUrl(resolutionProofRaw);
  const selectedStatusNormalized = normalizeComplaintStatus(newStatus);
  const requiresCompletionProof = isContractorRole && selectedStatusNormalized === 'WORK_COMPLETED';
  const canPreviewImage = Boolean(proofUrl && !proofImageLoadError);

  const safeFormatDate = (value: unknown, pattern: string) => {
    try {
      const date = value instanceof Date ? value : new Date(value as any);
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return t('complaintsTable.na', 'N/A');
      return format(date, pattern);
    } catch {
      return t('complaintsTable.na', 'N/A');
    }
  };

  const getStatusI18nKey = (status: string): string | null => {
    const normalized = normalizeComplaintStatus(status);
    if (!normalized) return null;

    const keyMap: Record<ComplaintStatus, string> = {
      OPEN: 'open',
      ASSIGNED: 'assigned',
      WORK_STARTED: 'workStarted',
      IN_PROGRESS: 'inProgress',
      WORK_COMPLETED: 'workCompleted',
      VERIFIED: 'verified',
      CLOSED: 'closed',
    };

    return keyMap[normalized];
  };

  const getStatusLabel = (status: string) => {
    const key = getStatusI18nKey(status);
    if (!key) return status;
    return t(`complaintsTable.status.${key}`, status);
  };

  // Function to handle translation for any language
  const performTranslation = React.useCallback((lang: string) => {
    if (lang === 'en') {
      setTranslated(null);
      return;
    }
    if (!['hi', 'kn'].includes(lang)) {
      setTranslated(null);
      return;
    }

    let isCancelled = false;
    setIsTranslating(true);
    translateComplaintTexts({
      targetLang: lang,
      texts: {
        title: complaint.title || '',
        location: complaint.location || '',
        complaint: complaint.complaint || '',
        summarized_complaint: complaint.summarized_complaint || '',
      },
    })
      .then((translations) => {
        if (!isCancelled) {
          setTranslated({
            title: translations.title,
            location: translations.location,
            complaint: translations.complaint,
            summarized_complaint: translations.summarized_complaint,
          });
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Complaint translation failed', err);
          setTranslated(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsTranslating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [complaint.title, complaint.location, complaint.complaint, complaint.summarized_complaint]);

  // Subscribe to language changes for dynamic translation
  useEffect(() => {
    const lang = String(i18n.language || 'en').toLowerCase().split('-')[0];
    performTranslation(lang);

    // Listen for language change events from i18n
    const handleLanguageChanged = (lng: string) => {
      const newLang = String(lng || 'en').toLowerCase().split('-')[0];
      performTranslation(newLang);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, performTranslation]);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.title', 'Title')}</label>
          <p className="text-sm mt-1">{translated?.title || complaint.title || t('complaintsTable.na', 'N/A')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.raisedBy', 'Raised By')}</label>
          <p className="text-sm mt-1">
            {complaint.raisedBy?.name || complaint.raisedBy?.email || t('complaintsTable.anonymous', 'Anonymous')}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.priorityFactor', 'Priority Factor')}</label>
          <p className="text-sm mt-1">{(complaint.priority_factor * 100).toFixed(1)}%</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.lastUpdated', 'Last Updated')}</label>
          <p className="text-sm mt-1">
            {safeFormatDate(complaint.lastupdate, 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      </div>

      {/* Location */}
      {complaint.location && (
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {t('complaintsTable.fields.location', 'Location')}
          </label>
          <p className="text-sm mt-2 p-3 bg-green-50 rounded border border-green-200">
            {translated?.location || complaint.location}
          </p>
          <GoogleMapsEmbed location={translated?.location || complaint.location} />
        </div>
      )}

      {/* Categories */}
      <div>
        <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.categories', 'Categories')}</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {issueCategories.map((cat, idx) => (
            <Badge key={idx} variant="secondary">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Full Complaint */}
      <div>
        <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.fullComplaint', 'Full Complaint')}</label>
        <p className="text-sm mt-2 p-3 bg-gray-50 rounded border">
          {translated?.complaint || complaint.complaint}
        </p>
      </div>

      {/* Summarized Complaint */}
      {complaint.summarized_complaint && (
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.aiSummary', 'AI Summary')}</label>
          <p className="text-sm mt-2 p-3 bg-blue-50 rounded border border-blue-200">
            {translated?.summarized_complaint || complaint.summarized_complaint}
          </p>
        </div>
      )}

      {isTranslating && (
        <p className="text-xs text-gray-500">
          {t('complaintsTable.translating', 'Translating...')}
        </p>
      )}

      {/* Proof */}
      <div>
        <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.proof', 'Proof')}</label>
        {proofUrl ? (
          <div className="mt-2 space-y-3">
            {canPreviewImage && (
              <img
                src={proofUrl}
                alt={t('complaintsTable.fields.proof', 'Proof')}
                className="max-h-72 w-full rounded border object-contain bg-gray-50"
                loading="lazy"
                onError={() => setProofImageLoadError(true)}
              />
            )}
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block"
            >
              {t('complaintsTable.viewProof', 'View Proof Document')}
            </a>
            {/* <p className="text-xs text-gray-500 break-all">{proofUrl}</p> */}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            {proofRawValue
              ? t('complaintsTable.proofInvalid', 'Proof link is not a valid URL.')
              : t('complaintsTable.proofMissing', 'No proof photo uploaded by user.')}
          </p>
        )}
      </div>

      {/* Resolution Proof (Contractor upload when work is completed) */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          {t('complaintsTable.fields.resolutionProof', 'Resolution Proof')}
        </label>
        {resolutionProofUrl ? (
          <div className="mt-2 space-y-2">
            <a
              href={resolutionProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block"
            >
              {t('complaintsTable.viewResolutionProof', 'View Resolution Proof')}
            </a>
            {/* <p className="text-xs text-gray-500 break-all">{resolutionProofUrl}</p> */}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            {t('complaintsTable.resolutionProofMissing', 'No resolution proof uploaded yet.')}
          </p>
        )}
      </div>

      {/* Comments History */}
      {commentHistory.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.commentHistory', 'Comment History')}</label>
          <div className="mt-2 space-y-2">
            {commentHistory.map((comment, idx) => {
              const parts = comment.split('|');
              const statusPart = parts[0] || '';
              return (
                <div key={idx} className="p-3 bg-gray-50 rounded border text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {statusPart ? getStatusLabel(statusPart) : t('complaintsTable.statusLabel', 'Status')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {t('complaintsTable.by', 'by')} {parts[1] || t('complaintsTable.unknown', 'Unknown')} • {parts[2] ? safeFormatDate(parts[2], 'MMM dd, yyyy HH:mm') : ''}
                    </span>
                  </div>
                  <p>{parts[3] || comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Update Status Section */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">{t('complaintsTable.updateStatus.title', 'Update Status')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('complaintsTable.updateStatus.newStatus', 'New Status')}</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isContractorRole ? (
                  <>
                    <SelectItem value="WORK_STARTED">{t('complaintsTable.status.workStarted', 'Work Started')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{t('complaintsTable.status.inProgress', 'In Progress')}</SelectItem>
                    <SelectItem value="WORK_COMPLETED">{t('complaintsTable.status.workCompleted', 'Work Completed')}</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="OPEN">{t('complaintsTable.status.open', 'Open')}</SelectItem>
                    <SelectItem value="ASSIGNED">{t('complaintsTable.status.assigned', 'Assigned')}</SelectItem>
                    <SelectItem value="WORK_STARTED">{t('complaintsTable.status.workStarted', 'Work Started')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{t('complaintsTable.status.inProgress', 'In Progress')}</SelectItem>
                    <SelectItem value="WORK_COMPLETED">{t('complaintsTable.status.workCompleted', 'Work Completed')}</SelectItem>
                    <SelectItem value="VERIFIED">{t('complaintsTable.status.verified', 'Verified')}</SelectItem>
                    <SelectItem value="CLOSED">{t('complaintsTable.status.closed', 'Closed')}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {requiresCompletionProof && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('complaintsTable.contractor.resolutionImage', 'Resolved Complaint Image')}
              </label>
              <Input
                className="mt-1"
                type="file"
                accept="image/*"
                onChange={(e) => setCompletionProofFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {completionProofFile
                  ? completionProofFile.name
                  : t('complaintsTable.contractor.resolutionImageHint', 'Upload a final photo before marking work as completed.')}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">{t('complaintsTable.updateStatus.comments', 'Comments')}</label>
            <Textarea
              placeholder={t('complaintsTable.updateStatus.commentsPlaceholder', 'Add comments about this status update...')}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <Button
            onClick={() => onUpdateStatus(complaint, newStatus, comments, completionProofFile)}
            disabled={
              isUpdating ||
              newStatus === complaint.status ||
              (requiresCompletionProof && !completionProofFile)
            }
            className="w-full"
          >
            {isUpdating ? t('complaintsTable.updateStatus.updating', 'Updating...') : t('complaintsTable.updateStatus.submit', 'Update Status')}
          </Button>
        </div>
      </div>

      {/* Assign Contractor (Level 2) */}
      {enableContractorAssignment && (
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">{t('complaintsTable.assignContractor.title', 'Assign Contractor')}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('complaintsTable.assignContractor.current', 'Currently Assigned')}</label>
                <p className="text-sm mt-1">
                  {complaint.assignedContractorName ? complaint.assignedContractorName : t('complaintsTable.assignContractor.none', 'Not assigned')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('complaintsTable.assignContractor.available', 'Available Contractors')}</label>
                <Select value={selectedContractorId} onValueChange={setSelectedContractorId} disabled={isLoadingContractors}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder={isLoadingContractors ? t('common.loading', 'Loading...') : t('complaintsTable.assignContractor.select', 'Select a contractor')} />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        {t('complaintsTable.assignContractor.noContractors', 'No available contractors')}
                      </SelectItem>
                    ) : (
                      contractors.map(c => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name} • {c.availabilityStatus}{c.ward ? ` • ${c.ward}` : ''}{c.zone ? ` • ${c.zone}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!selectedContractorId || selectedContractorId === '__none') return;
                setIsAssigning(true);
                try {
                  await onAssignContractor(complaint, selectedContractorId);
                  toast({
                    title: t('complaintsTable.assignContractor.toast.successTitle', 'Assigned'),
                    description: t('complaintsTable.assignContractor.toast.successDesc', 'Complaint assigned to contractor successfully'),
                  });
                } catch (err) {
                  toast({
                    title: t('complaintsTable.assignContractor.toast.failTitle', 'Assignment failed'),
                    description: (err as any)?.message || t('complaintsTable.assignContractor.toast.failDesc', 'Failed to assign complaint'),
                    variant: 'destructive',
                  });
                } finally {
                  setIsAssigning(false);
                }
              }}
              disabled={isAssigning || isUpdating || !selectedContractorId || selectedContractorId === '__none'}
              className="w-full"
            >
              {isAssigning ? t('complaintsTable.assignContractor.assigning', 'Assigning...') : t('complaintsTable.assignContractor.assign', 'Assign')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

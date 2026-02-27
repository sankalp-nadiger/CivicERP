import React, { useState } from 'react';
import { Complaint, updateComplaintStatus } from '@/services/complaintService';
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
  DialogTrigger,
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

interface ComplaintsTableProps {
  complaints: Complaint[];
  onComplaintUpdate?: () => void;
}

export function ComplaintsTable({ complaints, onComplaintUpdate }: ComplaintsTableProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const getStatusBadgeVariant = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('resolved')) {
      return 'default';
    }
    if (normalizedStatus.includes('progress') || normalizedStatus.includes('investigation')) {
      return 'secondary';
    }
    if (normalizedStatus.includes('todo') || normalizedStatus.includes('registered')) {
      return 'outline';
    }
    return 'destructive';
  };

  const getPriorityBadge = (priorityFactor: number) => {
    if (priorityFactor >= 0.7) return { label: t('complaintsTable.priority.high', 'High'), variant: 'destructive' as const };
    if (priorityFactor >= 0.4) return { label: t('complaintsTable.priority.medium', 'Medium'), variant: 'secondary' as const };
    return { label: t('complaintsTable.priority.low', 'Low'), variant: 'outline' as const };
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = statusFilter === 'all' || complaint.status.toLowerCase().includes(statusFilter.toLowerCase());
    const matchesSearch = searchQuery === '' || 
      complaint.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.issue_category.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (complaint: Complaint, newStatus: string, comments?: string) => {
    setIsUpdating(true);
    try {
      await updateComplaintStatus(complaint.complaint_id, newStatus, comments);
      toast({
        title: t('complaintsTable.toast.statusUpdatedTitle', 'Status Updated'),
        description: t('complaintsTable.toast.statusUpdatedDesc', 'Complaint status has been updated successfully'),
      });
      onComplaintUpdate?.();
      setSelectedComplaint(null);
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
                <SelectItem value="todo">{t('complaintsTable.status.todo', 'To Do')}</SelectItem>
                <SelectItem value="progress">{t('complaintsTable.status.inProgress', 'In Progress')}</SelectItem>
                <SelectItem value="completed">{t('complaintsTable.status.completed', 'Completed')}</SelectItem>
                <SelectItem value="resolved">{t('complaintsTable.status.resolved', 'Resolved')}</SelectItem>
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
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(complaint.date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedComplaint(complaint)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {t('complaintsTable.view', 'View')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{t('complaintsTable.detailsTitle', 'Complaint Details')}</DialogTitle>
                              <DialogDescription>
                                {t('complaintsTable.detailsIdPrefix', 'ID')}: {complaint.complaint_id}
                              </DialogDescription>
                            </DialogHeader>
                            <ComplaintDetailsView
                              complaint={complaint}
                              onUpdateStatus={handleUpdateStatus}
                              isUpdating={isUpdating}
                            />
                          </DialogContent>
                        </Dialog>
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
            total: complaints.length,
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComplaintDetailsViewProps {
  complaint: Complaint;
  onUpdateStatus: (complaint: Complaint, status: string, comments?: string) => void;
  isUpdating: boolean;
}

function ComplaintDetailsView({ complaint, onUpdateStatus, isUpdating }: ComplaintDetailsViewProps) {
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [comments, setComments] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.title', 'Title')}</label>
          <p className="text-sm mt-1">{complaint.title || t('complaintsTable.na', 'N/A')}</p>
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
            {format(new Date(complaint.lastupdate), 'MMM dd, yyyy HH:mm')}
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
            {complaint.location}
          </p>
          <GoogleMapsEmbed location={complaint.location} />
        </div>
      )}

      {/* Categories */}
      <div>
        <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.categories', 'Categories')}</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {complaint.issue_category.map((cat, idx) => (
            <Badge key={idx} variant="secondary">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Full Complaint */}
      <div>
        <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.fullComplaint', 'Full Complaint')}</label>
        <p className="text-sm mt-2 p-3 bg-gray-50 rounded border">{complaint.complaint}</p>
      </div>

      {/* Summarized Complaint */}
      {complaint.summarized_complaint && (
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.aiSummary', 'AI Summary')}</label>
          <p className="text-sm mt-2 p-3 bg-blue-50 rounded border border-blue-200">
            {complaint.summarized_complaint}
          </p>
        </div>
      )}

      {/* Proof */}
      {complaint.complaint_proof && (
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.proof', 'Proof')}</label>
          <a
            href={complaint.complaint_proof}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-1 block"
          >
            {t('complaintsTable.viewProof', 'View Proof Document')}
          </a>
        </div>
      )}

      {/* Comments History */}
      {complaint.comments.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">{t('complaintsTable.fields.commentHistory', 'Comment History')}</label>
          <div className="mt-2 space-y-2">
            {complaint.comments.map((comment, idx) => {
              const parts = comment.split('|');
              return (
                <div key={idx} className="p-3 bg-gray-50 rounded border text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{parts[0] || t('complaintsTable.statusLabel', 'Status')}</Badge>
                    <span className="text-xs text-gray-500">
                      {t('complaintsTable.by', 'by')} {parts[1] || t('complaintsTable.unknown', 'Unknown')} • {parts[2] ? format(new Date(parts[2]), 'MMM dd, yyyy HH:mm') : ''}
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
                <SelectItem value="todo">{t('complaintsTable.status.todo', 'To Do')}</SelectItem>
                <SelectItem value="in-progress">{t('complaintsTable.status.inProgress', 'In Progress')}</SelectItem>
                <SelectItem value="Under Investigation">{t('complaintsTable.status.underInvestigation', 'Under Investigation')}</SelectItem>
                <SelectItem value="completed">{t('complaintsTable.status.completed', 'Completed')}</SelectItem>
                <SelectItem value="resolved">{t('complaintsTable.status.resolved', 'Resolved')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            onClick={() => onUpdateStatus(complaint, newStatus, comments)}
            disabled={isUpdating || newStatus === complaint.status}
            className="w-full"
          >
            {isUpdating ? t('complaintsTable.updateStatus.updating', 'Updating...') : t('complaintsTable.updateStatus.submit', 'Update Status')}
          </Button>
        </div>
      </div>
    </div>
  );
}

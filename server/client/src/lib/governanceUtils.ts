/**
 * Governance utility functions
 */

import type { Complaint, User } from "@/types/governance";
import type { GovernanceType } from "@/config/governanceTemplates";
import { GOVERNANCE_TEMPLATES, SLA_STATUS } from "@/config/governanceTemplates";

export const calculateSLAStatus = (complaint: Complaint) => {
  const now = new Date();
  const deadline = new Date(complaint.slaDeadline);
  const msRemaining = deadline.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, msRemaining / (1000 * 60 * 60));
  const totalHours = (deadline.getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60);
  const percentageUsed = Math.min(100, ((totalHours - hoursRemaining) / totalHours) * 100);

  let status: "ON_TIME" | "NEAR_BREACH" | "BREACHED" = "ON_TIME";
  if (hoursRemaining <= 0) {
    status = "BREACHED";
  } else if (percentageUsed > 80) {
    status = "NEAR_BREACH";
  }

  return {
    status,
    hoursRemaining: Math.ceil(hoursRemaining),
    percentageUsed: Math.round(percentageUsed),
    deadline
  };
};

export const formatTimeRemaining = (hours: number): string => {
  if (hours <= 0) return "Time's up!";
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""}`;
};

export const getComplaintsByArea = (complaints: Complaint[], areaId: string): Complaint[] => {
  return complaints.filter(c => c.areaId === areaId);
};

export const getComplaintsByDepartment = (complaints: Complaint[], departmentId: string): Complaint[] => {
  return complaints.filter(c => c.departmentId === departmentId);
};

export const getComplaintsByAssignee = (complaints: Complaint[], userId: string): Complaint[] => {
  return complaints.filter(c => c.assignedTo === userId);
};

export const getComplaintsByStatus = (complaints: Complaint[], status: string): Complaint[] => {
  return complaints.filter(c => c.status === status);
};

export const getComplaintStats = (complaints: Complaint[]) => {
  return {
    total: complaints.length,
    open: complaints.filter(c => c.status === "OPEN").length,
    inProgress: complaints.filter(c => c.status === "IN_PROGRESS").length,
    workDone: complaints.filter(c => c.status === "WORK_DONE").length,
    verified: complaints.filter(c => c.status === "VERIFIED").length,
    closed: complaints.filter(c => c.status === "CLOSED").length,
    escalated: complaints.filter(c => c.status === "ESCALATED").length,
    breached: complaints.filter(c => {
      const slaStatus = calculateSLAStatus(c);
      return slaStatus.status === "BREACHED";
    }).length,
    highPriority: complaints.filter(c => c.isHighPriority).length
  };
};

export const getHierarchy = (users: User[], userId: string): User[] => {
  const user = users.find(u => u.id === userId);
  if (!user) return [];

  const result = [user];
  if (user.reportsTo) {
    const superior = users.find(u => u.id === user.reportsTo);
    if (superior) {
      result.push(superior);
      const superiorHierarchy = getHierarchy(users, superior.id);
      result.push(...superiorHierarchy.slice(1));
    }
  }
  return result;
};

export const getSubordinates = (users: User[], userId: string): User[] => {
  return users.filter(u => u.reportsTo === userId);
};

export const getUsersByLevel = (users: User[], level: string): User[] => {
  return users.filter(u => u.level === level);
};

export const getUsersByDepartment = (users: User[], departmentId: string): User[] => {
  return users.filter(u => u.department === departmentId);
};

export const getUsersByArea = (users: User[], areaId: string): User[] => {
  return users.filter(u => u.areaId === areaId);
};

export const getChildAreas = (areas: any[], parentId: string) => {
  return areas.filter(a => a.parentId === parentId);
};

export const getAreaHierarchy = (areas: any[], areaId: string) => {
  const area = areas.find(a => a.id === areaId);
  if (!area) return [];

  const result = [area];
  if (area.parentId) {
    const parent = areas.find(a => a.id === area.parentId);
    if (parent) {
      result.push(parent);
    }
  }
  return result.reverse();
};

export const calculatePerformanceMetrics = (complaints: Complaint[], userId?: string) => {
  const filtered = userId ? complaints.filter(c => c.assignedTo === userId) : complaints;

  const stats = getComplaintStats(filtered);
  const avgResolutionTime = filtered.length > 0
    ? filtered
        .filter(c => c.status === "CLOSED")
        .reduce((sum, c) => {
          const createdDate = new Date(c.createdAt).getTime();
          const closedDate = new Date().getTime(); // Assume closed now for mock
          return sum + (closedDate - createdDate);
        }, 0) / (filtered.filter(c => c.status === "CLOSED").length || 1)
    : 0;

  const slaBreachers = filtered.filter(c => {
    const slaStatus = calculateSLAStatus(c);
    return slaStatus.status === "BREACHED";
  }).length;
  const slaBreakerRate = filtered.length > 0 ? Math.round((slaBreachers / filtered.length) * 100) : 0;

  return {
    totalComplaints: stats.total,
    closureRate: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0,
    slaBreakerRate,
    avgResolutionDays: Math.round(avgResolutionTime / (24 * 60 * 60 * 1000)),
    openComplaints: stats.open,
    escalatedComplaints: stats.escalated
  };
};

export const generateComplaintId = (): string => {
  return `COMPLAINT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateUserId = (): string => {
  return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateAreaId = (): string => {
  return `AREA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateDepartmentId = (): string => {
  return `DEPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

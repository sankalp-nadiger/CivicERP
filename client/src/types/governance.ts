/**
 * Type definitions for Governance Platform
 */

import type { GovernanceType, UserLevel } from "@/config/governanceTemplates";

export interface Area {
  id: string;
  name: string;
  type: "ZONE" | "WARD" | "TALUK" | "VILLAGE";
  parentId?: string;
  governanceType: GovernanceType;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  governanceType: GovernanceType;
  description: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  level: UserLevel;
  department?: string;
  areaId?: string;
  governanceType: GovernanceType;
  reportsTo?: string; // User ID of superior
  createdAt: Date;
  status: "ACTIVE" | "INACTIVE" | "PENDING_INVITE";
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  governanceType: GovernanceType;
  areaId: string;
  departmentId: string;
  createdAt: Date;
  status: "OPEN" | "IN_PROGRESS" | "WORK_DONE" | "VERIFIED" | "CLOSED" | "ESCALATED";
  slaDeadline: Date;
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  escalationCount: number;
  lastEscalatedAt?: Date;
  remarks: string[];
  isHighPriority: boolean;
  proofUrls: string[];
}

export interface SLAStatus {
  complaintId: string;
  status: "ON_TIME" | "NEAR_BREACH" | "BREACHED";
  hoursRemaining: number;
  percentageUsed: number;
}

export interface GovernanceState {
  governanceType?: GovernanceType;
  currentUser?: User;
  departments: Department[];
  areas: Area[];
  users: User[];
  complaints: Complaint[];
}

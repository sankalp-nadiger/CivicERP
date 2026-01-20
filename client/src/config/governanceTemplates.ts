/**
 * Governance Templates Configuration
 * Defines level-based hierarchy for CITY and PANCHAYAT structures
 * This is the SINGLE SOURCE OF TRUTH for all role labels and hierarchy
 */

export type GovernanceType = "CITY" | "PANCHAYAT";
export type UserLevel = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" | "EXECUTOR" | "ELECTED";

export interface GovernanceTemplate {
  levels: Record<UserLevel, string>;
  areaTypes: string[];
  parentAreaType?: string;
  childAreaType?: string;
  slaHours: Record<UserLevel, number>;
}

export const GOVERNANCE_TEMPLATES: Record<GovernanceType, GovernanceTemplate> = {
  CITY: {
    levels: {
      LEVEL_1: "Municipal Commissioner",
      LEVEL_2: "Department Head",
      LEVEL_3: "Zone Officer",
      LEVEL_4: "Ward Officer",
      EXECUTOR: "Engineer / Contractor",
      ELECTED: "Corporator"
    },
    areaTypes: ["ZONE", "WARD"],
    parentAreaType: "ZONE",
    childAreaType: "WARD",
    slaHours: {
      LEVEL_1: 480, // 20 days
      LEVEL_2: 240, // 10 days
      LEVEL_3: 120, // 5 days
      LEVEL_4: 48, // 2 days
      EXECUTOR: 24, // 1 day
      ELECTED: 999 // No SLA
    }
  },

  PANCHAYAT: {
    levels: {
      LEVEL_1: "Zilla Panchayat CEO",
      LEVEL_2: "District Program Officer",
      LEVEL_3: "Panchayat Development Officer",
      LEVEL_4: "Panchayat Clerk",
      EXECUTOR: "Contractor / Worker",
      ELECTED: "Sarpanch / Ward Member"
    },
    areaTypes: ["TALUK", "VILLAGE"],
    parentAreaType: "TALUK",
    childAreaType: "VILLAGE",
    slaHours: {
      LEVEL_1: 480, // 20 days
      LEVEL_2: 240, // 10 days
      LEVEL_3: 120, // 5 days
      LEVEL_4: 48, // 2 days
      EXECUTOR: 24, // 1 day
      ELECTED: 999 // No SLA
    }
  }
};

// Department types (same for both CITY and PANCHAYAT)
export const DEPARTMENTS = [
  "Roads & Infrastructure",
  "Water Supply & Sanitation",
  "Public Health",
  "Waste Management",
  "Parks & Recreation",
  "Electricity",
  "Traffic & Safety",
  "Community Services"
];

// Complaint statuses
export const COMPLAINT_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WORK_DONE: "WORK_DONE",
  VERIFIED: "VERIFIED",
  CLOSED: "CLOSED",
  ESCALATED: "ESCALATED"
} as const;

// SLA status indicators
export const SLA_STATUS = {
  ON_TIME: "ON_TIME",
  NEAR_BREACH: "NEAR_BREACH",
  BREACHED: "BREACHED"
} as const;

// Helper to get display name for level
export const getLevelDisplayName = (
  governanceType: GovernanceType | string | undefined,
  level: UserLevel
): string => {
  const key = (governanceType || 'CITY').toString().toUpperCase() as GovernanceType;
  return GOVERNANCE_TEMPLATES[key].levels[level];
};

// Helper to get area types for governance type
export const getAreaTypes = (governanceType: GovernanceType | string | undefined): string[] => {
  const key = (governanceType || 'CITY').toString().toUpperCase() as GovernanceType;
  return GOVERNANCE_TEMPLATES[key].areaTypes;
};

// Helper to get parent and child area types
export const getAreaHierarchy = (governanceType: GovernanceType | string | undefined) => {
  const key = (governanceType || 'CITY').toString().toUpperCase() as GovernanceType;
  const template = GOVERNANCE_TEMPLATES[key];
  return {
    parent: template.parentAreaType,
    child: template.childAreaType
  };
};

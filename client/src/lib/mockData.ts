/**
 * Mock Data Generator for Governance Platform
 * All data is frontend-only and persisted to localStorage
 */

import type { Department, Area, User, Complaint } from "@/types/governance";
import type { GovernanceType, UserLevel } from "@/config/governanceTemplates";
import { DEPARTMENTS, GOVERNANCE_TEMPLATES, COMPLAINT_STATUS } from "@/config/governanceTemplates";

// Mock complaint categories
const COMPLAINT_CATEGORIES = [
  "Pothole & Road Damage",
  "Water Leakage",
  "Streetlight Issue",
  "Garbage Collection",
  "Noise Pollution",
  "Tree Felling",
  "Park Maintenance",
  "Drainage Issue",
  "Electrical Issue",
  "Building Violation"
];

export const generateMockAreas = (governanceType: GovernanceType): Area[] => {
  const template = GOVERNANCE_TEMPLATES[governanceType];
  const parentType = template.parentAreaType!;
  const childType = template.childAreaType!;

  const areas: Area[] = [];

  if (governanceType === "CITY") {
    // Create 5 Zones with 4 Wards each
    // Keep IDs stable for existing seeded data: area_0..area_4
    const zones: Array<{ id: string; name: string }> = [
      { id: "area_0", name: "North Zone" },
      { id: "area_1", name: "Central Zone" },
      { id: "area_2", name: "South Zone" },
      { id: "area_3", name: "East Zone" },
      { id: "area_4", name: "West Zone" },
    ];

    zones.forEach((zone, zoneIdx) => {
      const zoneId = zone.id;
      areas.push({
        id: zoneId,
        name: zone.name,
        type: "ZONE" as const,
        governanceType,
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 6 months ago
      });

      // Add wards under each zone
      for (let i = 1; i <= 4; i++) {
        areas.push({
          id: `area_${zoneIdx}_${i}`,
          name: `Ward ${zoneIdx * 4 + i}`,
          type: "WARD" as const,
          parentId: zoneId,
          governanceType,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
        });
      }
    });
  } else {
    // Create 3 Taluks with 3 Villages each
    const taluks = ["Taluk A", "Taluk B", "Taluk C"];
    taluks.forEach((taluk, talukIdx) => {
      const talukId = `area_${talukIdx}`;
      areas.push({
        id: talukId,
        name: taluk,
        type: "TALUK" as const,
        governanceType,
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      });

      // Add villages under each taluk
      for (let i = 1; i <= 3; i++) {
        areas.push({
          id: `area_${talukIdx}_${i}`,
          name: `Village ${talukIdx * 3 + i}`,
          type: "VILLAGE" as const,
          parentId: talukId,
          governanceType,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
        });
      }
    });
  }

  return areas;
};

export const generateMockDepartments = (governanceType: GovernanceType): Department[] => {
  return DEPARTMENTS.map((deptName, idx) => ({
    id: `dept_${idx}`,
    name: deptName,
    governanceType,
    description: `${deptName} department`,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  }));
};

export const generateMockUsers = (
  governanceType: GovernanceType,
  departments: Department[],
  areas: Area[]
): User[] => {
  const users: User[] = [];

  // LEVEL_1 User (Commissioner / ZP CEO)
  users.push({
    id: "user_l1_1",
    name: governanceType === "CITY" ? "Rajesh Kumar (Commissioner)" : "Amrita Singh (ZP CEO)",
    email: governanceType === "CITY" ? "commissioner@city.gov" : "ceo@panchayat.gov",
    level: "LEVEL_1",
    governanceType,
    department: departments[0]?.id,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    status: "ACTIVE"
  });

  // LEVEL_2 Users (Department Heads) - 2 for each governance type
  const level2Count = 3;
  for (let i = 0; i < level2Count && i < departments.length; i++) {
    users.push({
      id: `user_l2_${i}`,
      name: `Dept Head ${i + 1}`,
      email: `depthead${i + 1}@gov.local`,
      level: "LEVEL_2",
      governanceType,
      department: departments[i].id,
      reportsTo: "user_l1_1",
      createdAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    });
  }

  // LEVEL_3 Users (Zone Officers / PDOs) - 2 for each LEVEL_2
  for (let i = 0; i < level2Count; i++) {
    for (let j = 0; j < 2; j++) {
      const areaId = areas.find(a => a.type === "ZONE" || a.type === "TALUK")?.[j]?.id || areas[0]?.id;
      users.push({
        id: `user_l3_${i}_${j}`,
        name: `Zone Officer ${i * 2 + j + 1}`,
        email: `zoneofficer${i * 2 + j + 1}@gov.local`,
        level: "LEVEL_3",
        governanceType,
        department: departments[i]?.id,
        areaId,
        reportsTo: `user_l2_${i}`,
        createdAt: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000),
        status: "ACTIVE"
      });
    }
  }

  // LEVEL_4 Users (Ward Officers / Clerks) - 2 for each LEVEL_3
  let l4Index = 0;
  for (let i = 0; i < level2Count; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const childAreas = areas.filter(a => a.parentId === users[5 + i * 2 + j]?.areaId);
        const areaId = childAreas[k]?.id || areas.find(a => a.type === "WARD" || a.type === "VILLAGE")?.id || areas[0]?.id;
        
        users.push({
          id: `user_l4_${l4Index}`,
          name: `Ward Officer ${l4Index + 1}`,
          email: `wardofficer${l4Index + 1}@gov.local`,
          level: "LEVEL_4",
          governanceType,
          department: departments[i]?.id,
          areaId,
          reportsTo: `user_l3_${i}_${j}`,
          createdAt: new Date(Date.now() - 330 * 24 * 60 * 60 * 1000),
          status: "ACTIVE"
        });
        l4Index++;
      }
    }
  }

  // EXECUTOR Users (Engineers / Contractors)
  for (let i = 0; i < 6; i++) {
    users.push({
      id: `user_executor_${i}`,
      name: `Engineer / Contractor ${i + 1}`,
      email: `executor${i + 1}@gov.local`,
      level: "EXECUTOR",
      governanceType,
      department: departments[i % departments.length]?.id,
      reportsTo: `user_l4_${i}`,
      createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    });
  }

  // ELECTED Users (Corporators / Sarpanches) - Not in admin chain
  for (let i = 0; i < 4; i++) {
    const areaType = governanceType === "CITY" ? "WARD" : "VILLAGE";
    const areaId = areas.find(a => a.type === areaType)?.[i]?.id || areas[i]?.id;
    users.push({
      id: `user_elected_${i}`,
      name: governanceType === "CITY" ? `Corporator ${i + 1}` : `Sarpanch ${i + 1}`,
      email: `elected${i + 1}@gov.local`,
      level: "ELECTED",
      governanceType,
      areaId,
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    });
  }

  return users;
};

export const generateMockComplaints = (
  governanceType: GovernanceType,
  areas: Area[],
  departments: Department[],
  users: User[]
): Complaint[] => {
  const complaints: Complaint[] = [];

  const l4Users = users.filter(u => u.level === "LEVEL_4");
  const executorUsers = users.filter(u => u.level === "EXECUTOR");

  // Generate 15 complaints with various statuses
  for (let i = 0; i < 15; i++) {
    const areaId = areas[Math.floor(Math.random() * areas.length)].id;
    const deptId = departments[Math.floor(Math.random() * departments.length)].id;
    const createdByUser = users.find(u => u.level === "ELECTED") || users[0];
    const assignedTo = l4Users[i % l4Users.length];

    const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const template = GOVERNANCE_TEMPLATES[governanceType];
    const slaHours = template.slaHours["LEVEL_4"];
    const slaDeadline = new Date(createdDate.getTime() + slaHours * 60 * 60 * 1000);

    const statuses = Object.values(COMPLAINT_STATUS);
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as Complaint["status"];
    const escalationCount = randomStatus === "ESCALATED" ? Math.floor(Math.random() * 3) + 1 : 0;

    complaints.push({
      id: `complaint_${i}`,
      title: `${COMPLAINT_CATEGORIES[Math.floor(Math.random() * COMPLAINT_CATEGORIES.length)]} - Ward ${i + 1}`,
      description: `Detailed description of complaint ${i + 1}. This is a test complaint for the governance platform.`,
      category: COMPLAINT_CATEGORIES[Math.floor(Math.random() * COMPLAINT_CATEGORIES.length)],
      governanceType,
      areaId,
      departmentId: deptId,
      createdAt: createdDate,
      status: randomStatus,
      slaDeadline,
      assignedTo: assignedTo.id,
      createdBy: createdByUser?.id || "system",
      escalationCount,
      lastEscalatedAt: escalationCount > 0 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      remarks: [`Initial complaint filed`, `Status: ${randomStatus}`],
      isHighPriority: Math.random() > 0.7,
      proofUrls: []
    });
  }

  return complaints;
};

// Local Storage Manager
const STORAGE_KEYS = {
  STATE: "governance_state",
  SETUP_COMPLETE: "governance_setup_complete"
};

export const loadOrCreateState = (governanceType?: GovernanceType) => {
  const stored = localStorage.getItem(STORAGE_KEYS.STATE);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);

      // Lightweight migration: expand CITY zones from 3 -> 5 if needed
      if (parsed?.governanceType === "CITY" && Array.isArray(parsed?.areas)) {
        const existingAreas = parsed.areas as Area[];
        const existingZoneNames = new Set(
          existingAreas
            .filter(a => a?.type === "ZONE")
            .map(a => (a?.name || "").toString().trim().toLowerCase())
        );

        const neededZones: Array<{ id: string; name: string; idx: number }> = [
          { id: "area_3", name: "East Zone", idx: 3 },
          { id: "area_4", name: "West Zone", idx: 4 },
        ];

        const toAdd: Area[] = [];
        neededZones.forEach(z => {
          if (!existingZoneNames.has(z.name.toLowerCase())) {
            toAdd.push({
              id: z.id,
              name: z.name,
              type: "ZONE" as const,
              governanceType: "CITY",
              createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            });

            for (let i = 1; i <= 4; i++) {
              toAdd.push({
                id: `area_${z.idx}_${i}`,
                name: `Ward ${z.idx * 4 + i}`,
                type: "WARD" as const,
                parentId: z.id,
                governanceType: "CITY",
                createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              });
            }
          }
        });

        if (toAdd.length > 0) {
          parsed.areas = [...existingAreas, ...toAdd];
          saveState(parsed);
        }
      }

      return parsed;
    } catch {
      console.error("Failed to parse stored state");
    }
  }

  // Auto-initialize with CITY if no type provided and no stored state
  const typeToUse = governanceType || "CITY" as GovernanceType;

  const areas = generateMockAreas(typeToUse);
  const departments = generateMockDepartments(typeToUse);
  const users = generateMockUsers(typeToUse, departments, areas);
  const complaints = generateMockComplaints(typeToUse, areas, departments, users);

  const state = {
    governanceType: typeToUse,
    departments,
    areas,
    users,
    complaints
  };

  saveState(state);
  return state;
};

export const saveState = (state: any) => {
  localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEYS.STATE);
  localStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE);
};

export const isSetupComplete = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE) === "true";
};

export const markSetupComplete = () => {
  localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, "true");
};

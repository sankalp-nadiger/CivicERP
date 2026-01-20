/**
 * Governance Context
 * Manages global state for the governance platform
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { GovernanceType, UserLevel } from "@/config/governanceTemplates";
import type { Department, Area, User, Complaint } from "@/types/governance";
import { loadOrCreateState, saveState, clearState, isSetupComplete, markSetupComplete } from "@/lib/mockData";

interface GovernanceContextType {
  // State
  governanceType?: GovernanceType;
  currentUser?: User;
  departments: Department[];
  areas: Area[];
  users: User[];
  complaints: Complaint[];
  setupComplete: boolean;

  // Actions
  initializeGovernance: (governanceType: GovernanceType) => void;
  setCurrentUser: (user: User) => void;
  addDepartment: (dept: Department) => void;
  addArea: (area: Area) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (complaintId: string, updates: Partial<Complaint>) => void;
  escalateComplaint: (complaintId: string, escalatedToUserId: string) => void;
  logout: () => void;
  reset: () => void;
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [governanceType, setGovernanceType] = useState<GovernanceType | undefined>();
  const [currentUser, setCurrentUserState] = useState<User | undefined>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [setupComplete, setSetupComplete] = useState(isSetupComplete());

  // Initialize from localStorage on mount
  // Auto-initialize with CITY if no saved state exists
  useEffect(() => {
    const savedState = loadOrCreateState();
    if (savedState) {
      setGovernanceType(savedState.governanceType);
      setDepartments(savedState.departments);
      setAreas(savedState.areas);
      setUsers(savedState.users);
      setComplaints(savedState.complaints);
      // Auto-set current user to LEVEL_1 if not set
      if (!currentUser) {
        const level1User = savedState.users.find(u => u.level === "LEVEL_1");
        if (level1User) {
          setCurrentUserState(level1User);
        }
      }
    }
  }, []);

  const saveToLocalStorage = (state: {
    governanceType?: GovernanceType;
    departments: Department[];
    areas: Area[];
    users: User[];
    complaints: Complaint[];
  }) => {
    saveState(state);
  };

  const initializeGovernance = (type: GovernanceType) => {
    const state = loadOrCreateState(type);
    if (state) {
      setGovernanceType(state.governanceType);
      setDepartments(state.departments);
      setAreas(state.areas);
      setUsers(state.users);
      setComplaints(state.complaints);
      markSetupComplete();
      setSetupComplete(true);
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
  };

  const addDepartment = (dept: Department) => {
    const updated = [...departments, dept];
    setDepartments(updated);
    saveToLocalStorage({ governanceType, departments: updated, areas, users, complaints });
  };

  const addArea = (area: Area) => {
    const updated = [...areas, area];
    setAreas(updated);
    saveToLocalStorage({ governanceType, departments, areas: updated, users, complaints });
  };

  const addUser = (user: User) => {
    const updated = [...users, user];
    setUsers(updated);
    saveToLocalStorage({ governanceType, departments, areas, users: updated, complaints });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(updated);
    saveToLocalStorage({ governanceType, departments, areas, users: updated, complaints });
  };

  const addComplaint = (complaint: Complaint) => {
    const updated = [...complaints, complaint];
    setComplaints(updated);
    saveToLocalStorage({ governanceType, departments, areas, users, complaints: updated });
  };

  const updateComplaint = (complaintId: string, updates: Partial<Complaint>) => {
    const updated = complaints.map(c => c.id === complaintId ? { ...c, ...updates } : c);
    setComplaints(updated);
    saveToLocalStorage({ governanceType, departments, areas, users, complaints: updated });
  };

  const escalateComplaint = (complaintId: string, escalatedToUserId: string) => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const updated = complaints.map(c =>
      c.id === complaintId
        ? {
            ...c,
            assignedTo: escalatedToUserId,
            status: "ESCALATED" as const,
            escalationCount: c.escalationCount + 1,
            lastEscalatedAt: new Date(),
            remarks: [...c.remarks, `Escalated to next level at ${new Date().toLocaleString()}`]
          }
        : c
    );
    setComplaints(updated);
    saveToLocalStorage({ governanceType, departments, areas, users, complaints: updated });
  };

  const logout = () => {
    setCurrentUserState(undefined);
  };

  const reset = () => {
    clearState();
    setGovernanceType(undefined);
    setCurrentUserState(undefined);
    setDepartments([]);
    setAreas([]);
    setUsers([]);
    setComplaints([]);
    setSetupComplete(false);
  };

  return (
    <GovernanceContext.Provider
      value={{
        governanceType,
        currentUser,
        departments,
        areas,
        users,
        complaints,
        setupComplete,
        initializeGovernance,
        setCurrentUser,
        addDepartment,
        addArea,
        addUser,
        updateUser,
        addComplaint,
        updateComplaint,
        escalateComplaint,
        logout,
        reset
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
};

export const useGovernance = (): GovernanceContextType => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error("useGovernance must be used within GovernanceProvider");
  }
  return context;
};

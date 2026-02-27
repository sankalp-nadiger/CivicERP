export interface Department {
  id: string;
  name: string;
  head: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
}

export interface Contractor {
  id: string;
  name: string;
  specialization: string;
  availability: 'free' | 'occupied';
  currentProjects: number;
  maxCapacity: number;
  contact: string;
  location: string;
  rating: number;
  completedTasks: number;
}

export interface Task {
  id: string;
  complaintId: string;
  complaintType: string;
  description: string;
  contractor: string;
  status: 'assigned' | 'in-progress' | 'completed';
  assignedDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: Date;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performer: string;
  timestamp: Date;
  changes?: Record<string, { old: string; new: string }>;
  description: string;
  entityType?: string;
  entityId?: string;
}

// Mock API Service
export const dashboardService = {
  // Department APIs
  getDepartments: async (): Promise<Department[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },

  createDepartment: async (dept: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...dept,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
  },

  updateDepartment: async (id: string, dept: Partial<Department>): Promise<Department> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...dept,
      id,
      createdAt: new Date(),
    } as Department;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  sendInvitation: async (email: string, departmentId: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // In real implementation, this would call the backend
    return { success: true };
  },

  // Contractor APIs
  getContractors: async (): Promise<Contractor[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },

  updateContractorAvailability: async (
    contractorId: string,
    availability: 'free' | 'occupied'
  ): Promise<Contractor> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: contractorId,
      name: '',
      specialization: '',
      availability,
      currentProjects: 0,
      maxCapacity: 5,
      contact: '',
      location: '',
      rating: 0,
      completedTasks: 0,
    };
  },

  // Task APIs
  createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...task,
      id: Date.now().toString(),
    };
  },

  updateTaskStatus: async (taskId: string, status: Task['status']): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: taskId,
      complaintId: '',
      complaintType: '',
      description: '',
      contractor: '',
      status,
      assignedDate: new Date(),
      priority: 'medium',
      deadline: new Date(),
    };
  },

  getTasks: async (departmentId?: string): Promise<Task[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },

  // Analytics APIs
  getCityWideAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      slaCompliance: 90.6,
      activeTasks: 342,
      bottlenecks: 3,
    };
  },

  getDepartmentAnalytics: async (departmentId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      activeTasksCount: 24,
      completedThisMonth: 52,
      availableContractors: 3,
      atRisk: 4,
    };
  },

  // Audit Log APIs
  getAuditLogs: async (entityId: string): Promise<AuditLogEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },

  createAuditLog: async (log: Omit<AuditLogEntry, 'id'>): Promise<AuditLogEntry> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...log,
      id: Date.now().toString(),
    };
  },
};

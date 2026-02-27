
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id?: string;
  name: string;
  email: string;
  role: 'public' | 'admin' | 'mcc' | 'department-head' | 'contractor' | 'executor' | 'elected';
  phone?: string;
  location?: string;
  department?: string; // For admin users
  departmentId?: string; // For department head users
  departmentName?: string; // For department head users
  companyName?: string; // For contractor users
  governanceLevel?: string; // For governance users (city-level1-6, panchayat-level1-6)
  governanceType?: 'city' | 'panchayat'; // Type of governance
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('civicerc_user');
    const storedToken = localStorage.getItem('auth_token');
    if (storedUser) {
      try {
        // Treat token as the source of truth for API auth
        if (!storedToken) {
          localStorage.removeItem('civicerc_user');
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('civicerc_user');
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: Partial<User>) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name || 'User',
      email: userData.email || '',
      role: userData.role || 'public',
      departmentId: userData.departmentId,
      departmentName: userData.departmentName,
      ...userData,
    };

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('civicerc_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('civicerc_user');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

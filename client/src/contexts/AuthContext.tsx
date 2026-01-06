
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'public' | 'admin';
  phone?: string;
  location?: string;
  department?: string; // For admin users
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'public' | 'admin') => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
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

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('ocms_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string, role: 'public' | 'admin'): Promise<boolean> => {
    // Simulate API call with role-specific mock data
    try {
      let mockUser: User;
      
      if (role === 'admin') {
        mockUser = {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Srikanth',
          email,
          role: 'admin',
          phone: '+91 98765 43210',
          location: 'Government Office, New Delhi',
          department: 'Public Works Department'
        };
      } else {
        mockUser = {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Varun',
          email,
          role: 'public',
          phone: '+91 99887 65432',
          location: 'Connaught Place, New Delhi'
        };
      }

      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('ocms_user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Registration is only for public users
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: userData.name,
        email: userData.email,
        role: 'public',
        phone: userData.phone,
        location: userData.location
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('ocms_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ocms_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

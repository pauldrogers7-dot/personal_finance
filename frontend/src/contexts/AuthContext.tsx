// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  hasPassword: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  setPassword: (password: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simple hash function for password storage
// Note: This is basic protection. For production, use a proper backend with bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    // Check if a password is set
    const storedPasswordHash = localStorage.getItem('appPasswordHash');
    setHasPassword(!!storedPasswordHash);

    // Check if there's an active session
    const sessionActive = sessionStorage.getItem('authenticated');
    if (sessionActive === 'true' && storedPasswordHash) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (password: string): Promise<boolean> => {
    const storedPasswordHash = localStorage.getItem('appPasswordHash');
    if (!storedPasswordHash) {
      return false;
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash === storedPasswordHash) {
      setIsAuthenticated(true);
      sessionStorage.setItem('authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('authenticated');
  };

  const setPassword = async (password: string) => {
    const passwordHash = await hashPassword(password);
    localStorage.setItem('appPasswordHash', passwordHash);
    setHasPassword(true);
    setIsAuthenticated(true);
    sessionStorage.setItem('authenticated', 'true');
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const storedPasswordHash = localStorage.getItem('appPasswordHash');
    if (!storedPasswordHash) {
      return false;
    }

    const currentPasswordHash = await hashPassword(currentPassword);
    if (currentPasswordHash !== storedPasswordHash) {
      return false;
    }

    const newPasswordHash = await hashPassword(newPassword);
    localStorage.setItem('appPasswordHash', newPasswordHash);
    return true;
  };

  const value = {
    isAuthenticated,
    hasPassword,
    login,
    logout,
    setPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

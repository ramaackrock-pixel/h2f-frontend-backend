import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { User, Role } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('physio_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Safety cleanup: remove any old tokens that might be vulnerable to XSS
  useEffect(() => {
    localStorage.removeItem('physio_token');
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4042/api/v1'}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Backend returns data directly as { role, name, accessToken, ... }
      const userData: User = {
        id: data.role + '-' + Date.now(), // Fallback ID for UI
        name: data.name,
        email: email,
        role: data.role as Role,
        jobRole: data.jobRole || undefined,
        branch: data.branch || undefined,
        avatar: data.avatar || undefined
      };

      setUser(userData);
      localStorage.setItem('physio_user', JSON.stringify(userData));
      localStorage.setItem('physio_auth', 'true');
      return userData;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4042/api/v1'}/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('physio_user');
      localStorage.removeItem('physio_auth');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');

  }
  return context;
};

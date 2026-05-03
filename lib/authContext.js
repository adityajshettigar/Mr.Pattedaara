'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from './apiClient';

const AuthCtx = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  can: () => false,
  isRole: () => false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      // apiClient.me() returns the user object directly!
      const fetchedUser = await authApi.me(); 
      
      if (fetchedUser) {
        setUser(fetchedUser); // FIXED: No more .user here
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth Session Error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    try {
      // apiClient.login() returns the user object directly!
      const loggedInUser = await authApi.login(email, password);
      
      setUser(loggedInUser); // FIXED: No more .user here
      return loggedInUser;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const can = (action) => {
    if (!user) return false;
    const PERMS = {
      superintendent: ['read', 'write', 'delete', 'manage_users', 'assign_cases'],
      investigating_officer: ['read', 'write'],
      analyst: ['read', 'write_forensics', 'update_status'],
      viewer: ['read'],
    };
    return (PERMS[user.role] || []).includes(action);
  };

  const isRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, can, isRole }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthCtx);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
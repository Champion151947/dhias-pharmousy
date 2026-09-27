import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (identifier, password) => {
    const data = await authApi.login(identifier, password);
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, phone, password) => {
    const data = await authApi.signup(name, email, phone, password);
    setUser(data.user);
    return data;
  };

  const googleLogin = async (name, email, picture) => {
    const data = await authApi.google(name, email, picture);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const data = await authApi.updateProfile(updates);
    setUser(data.user);
    return data;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    googleLogin,
    logout,
    updateProfile,
    refreshUser: fetchUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
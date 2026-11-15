import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ElderProfile, UserRole } from '../types';
import { ApiClient } from '../services/api';

interface AuthResponseData {
  user: User;
  token: string;
  elderProfile?: ElderProfile | null;
}

interface AuthContextType {
  user: User | null;
  elderProfile: ElderProfile | null;
  activeMode: 'ELDER' | 'CAREGIVER';
  linkedElders: ElderProfile[];
  activeElder: ElderProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  googleLogin: (idToken: string, role?: UserRole) => Promise<void>;
  pairWithElder: (carePasscode: string) => Promise<{ elder: ElderProfile }>;
  setActiveMode: (mode: 'ELDER' | 'CAREGIVER') => void;
  setActiveElder: (elder: ElderProfile) => void;
  refreshLinkedElders: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [elderProfile, setElderProfile] = useState<ElderProfile | null>(null);
  const [linkedElders, setLinkedElders] = useState<ElderProfile[]>([]);
  const [activeElder, setActiveElder] = useState<ElderProfile | null>(null);
  const [activeMode, setActiveMode] = useState<'ELDER' | 'CAREGIVER'>('ELDER');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth state from stored token
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedElder = localStorage.getItem('elderProfile');
    const storedActiveElder = localStorage.getItem('activeElder');
    const storedMode = localStorage.getItem('activeMode') as 'ELDER' | 'CAREGIVER' | null;

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (storedElder) {
          const parsedElder = JSON.parse(storedElder);
          setElderProfile(parsedElder);
          if (!storedActiveElder) {
            setActiveElder(parsedElder);
          }
        }
        if (storedActiveElder) {
          try {
            setActiveElder(JSON.parse(storedActiveElder));
          } catch {}
        }
        if (storedMode) {
          setActiveMode(storedMode);
        } else {
          setActiveMode(parsedUser.role === 'ELDERLY' ? 'ELDER' : 'CAREGIVER');
        }
      } catch {
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  // Fetch linked elders whenever user is a caregiver
  useEffect(() => {
    if (user && (user.role === 'CAREGIVER' || user.role === 'FAMILY' || user.role === 'ADMIN')) {
      refreshLinkedElders();
    }
  }, [user]);

  const handleSetActiveElder = (elder: ElderProfile) => {
    setActiveElder(elder);
    localStorage.setItem('activeElderId', elder.id);
    localStorage.setItem('activeElder', JSON.stringify(elder));
  };

  const refreshLinkedElders = async () => {
    try {
      const res = await ApiClient.get<ElderProfile[]>('/care-circle/elders');
      if (res.data && res.data.length > 0) {
        setLinkedElders(res.data);
        const savedElderId = localStorage.getItem('activeElderId');
        const matched = savedElderId ? res.data.find((e) => e.id === savedElderId) : null;
        if (matched) {
          setActiveElder(matched);
        } else if (!activeElder) {
          setActiveElder(res.data[0]);
          localStorage.setItem('activeElderId', res.data[0].id);
          localStorage.setItem('activeElder', JSON.stringify(res.data[0]));
        }
      }
    } catch {
      // In-memory or offline fallback
    }
  };

  const handleAuthSuccess = (data: AuthResponseData) => {
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.elderProfile) {
      setElderProfile(data.elderProfile);
      setActiveElder(data.elderProfile);
      localStorage.setItem('elderProfile', JSON.stringify(data.elderProfile));
      localStorage.setItem('activeElder', JSON.stringify(data.elderProfile));
      localStorage.setItem('activeElderId', data.elderProfile.id);
    }

    const defaultMode = data.user.role === 'ELDERLY' ? 'ELDER' : 'CAREGIVER';
    setActiveMode(defaultMode);
    localStorage.setItem('activeMode', defaultMode);
  };

  const login = async (email: string, password: string) => {
    const res = await ApiClient.post<AuthResponseData>('/auth/login', { email, password });
    if (res.data) {
      handleAuthSuccess(res.data);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'ELDERLY'
  ) => {
    const res = await ApiClient.post<AuthResponseData>('/auth/register', {
      name,
      email,
      password,
      role
    });
    if (res.data) {
      handleAuthSuccess(res.data);
    }
  };

  const googleLogin = async (idToken: string, role: UserRole = 'CAREGIVER') => {
    const res = await ApiClient.post<AuthResponseData>('/auth/google', { idToken, role });
    if (res.data) {
      handleAuthSuccess(res.data);
    }
  };

  const pairWithElder = async (carePasscode: string): Promise<{ elder: ElderProfile }> => {
    const res = await ApiClient.post<{ elder: ElderProfile }>('/care-circle/pair', {
      carePasscode
    });
    if (res.data) {
      handleSetActiveElder(res.data.elder);
      await refreshLinkedElders();
      return res.data;
    }
    throw new Error('Pairing failed');
  };

  const changeMode = (mode: 'ELDER' | 'CAREGIVER') => {
    setActiveMode(mode);
    localStorage.setItem('activeMode', mode);
  };

  const logout = async () => {
    try {
      await ApiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout notification failed:', err);
    }
    localStorage.clear();
    setUser(null);
    setElderProfile(null);
    setActiveElder(null);
    setLinkedElders([]);
    setActiveMode('ELDER');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        elderProfile,
        activeMode,
        linkedElders,
        activeElder,
        loading,
        login,
        register,
        googleLogin,
        pairWithElder,
        setActiveMode: changeMode,
        setActiveElder: handleSetActiveElder,
        refreshLinkedElders,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

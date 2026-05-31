import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import { toast } from 'sonner';

export type UserRole = 'owner' | 'jockey' | 'referee' | 'spectator';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  avatarUrl?: string;
  balance?: string;
  level?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
      // Refresh user data from API to get latest avatarUrl, etc.
      userApi.getMe(storedToken)
        .then((fresh) => {
          const patch = {
            avatarUrl: fresh.avatarUrl ?? undefined,
            fullName: fresh.fullName,
          };
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, ...patch };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        })
        .catch(() => {/* silently ignore — token may be expired */})
        .finally(() => setIsReady(true));
    } else {
      setIsReady(true);
    }
  }, []);

  const login = (newUser: User, newToken: string, newRefreshToken?: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('accessToken', newToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    if (token) {
      try {
        await authApi.logout(token);
        toast.success('Đã đăng xuất tài khoản');
      } catch (error) {
        console.error('API logout failed', error);
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  if (!isReady) return null; // or a loading spinner

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

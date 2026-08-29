import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SavrUser } from './api';
import { fetchSession, loginUser, logoutUser, registerUser, type RegisterPayload } from './api';

interface AuthContextValue {
  user: SavrUser | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<SavrUser>;
  login: (username: string, password: string) => Promise<SavrUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SavrUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { user: current } = await fetchSession();
    setUser(current);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    register: async (payload) => {
      const created = await registerUser(payload);
      setUser(created);
      return created;
    },
    login: async (username, password) => {
      const loggedIn = await loginUser(username, password);
      setUser(loggedIn);
      return loggedIn;
    },
    logout: async () => {
      await logoutUser();
      setUser(null);
    },
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { getToken, getUser, setSession, clearSession, StoredUser } from '@/lib/session';

interface AuthContextValue {
  token: string | null;
  user: StoredUser | null;
  // Restoration from storage happens after mount, not before first render.
  // `ready` is how a guard tells "not signed in" apart from "haven't checked yet".
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface LoginResponse {
  access_token: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(getToken());
    setUser(getUser());
    setReady(true);
  }, []);

  async function signIn(email: string, password: string) {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const nextUser: StoredUser = { email };
    setSession(res.access_token, nextUser);
    setToken(res.access_token);
    setUser(nextUser);
  }

  function signOut() {
    clearSession();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

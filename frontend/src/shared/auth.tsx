import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { api } from './api';
import {
  getStoredSession,
  setStoredSession,
  type AuthSession,
  type AuthUser,
} from './session';

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  isAdmin: boolean;
  login: (args: { email: string; password: string }) => Promise<void>;
  register: (args: {
    email: string;
    password: string;
    name?: string | null;
  }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const stored = getStoredSession();

    if (!stored?.token) {
      setReady(true);
      return;
    }

    api
      .authMe()
      .then((res) => {
        if (!alive) return;
        const next = { token: stored.token, user: res.user };
        setSession(next);
        setStoredSession(next);
      })
      .catch(() => {
        if (!alive) return;
        setSession(null);
        setStoredSession(null);
      })
      .finally(() => {
        if (!alive) return;
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      isAdmin: Boolean(session?.user?.admin),
      async login(args) {
        const next = await api.authLogin(args);
        setSession(next);
        setStoredSession(next);
      },
      async register(args) {
        const next = await api.authRegister(args);
        setSession(next);
        setStoredSession(next);
      },
      signOut() {
        setSession(null);
        setStoredSession(null);
      },
    }),
    [ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

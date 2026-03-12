export const AUTH_STORAGE_KEY = 'bpt.auth';

export type AuthUser = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  admin: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredToken(): string | null {
  return getStoredSession()?.token ?? null;
}

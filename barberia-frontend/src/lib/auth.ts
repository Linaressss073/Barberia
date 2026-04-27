const KEYS = {
  access: 'bb_access',
  refresh: 'bb_refresh',
  user: 'bb_user',
} as const;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export const getAccessToken = (): string | null => localStorage.getItem(KEYS.access);
export const getRefreshToken = (): string | null => localStorage.getItem(KEYS.refresh);

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(KEYS.user);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function saveSession(user: AuthUser, accessToken: string, refreshToken: string): void {
  localStorage.setItem(KEYS.access, accessToken);
  localStorage.setItem(KEYS.refresh, refreshToken);
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearSession(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export const isAuthenticated = (): boolean => !!getAccessToken();

import { getApiV1Url } from './config';
import { getAccessToken, getRefreshToken, saveSession, clearSession, getUser } from './auth';

interface ApiSuccess<T> {
  success: true;
  data: T;
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${getApiV1Url()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearSession(); return null; }
    const body: ApiSuccess<{ accessToken: string; refreshToken: string }> = await res.json();
    const user = getUser();
    if (user) saveSession(user, body.data.accessToken, body.data.refreshToken);
    return body.data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiV1Url();
  let token = getAccessToken();

  const buildHeaders = (t: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...((options.headers ?? {}) as Record<string, string>),
  });

  const doRequest = (t: string | null) =>
    fetch(`${base}${path}`, { ...options, headers: buildHeaders(t) });

  let res = await doRequest(token);

  if (res.status === 401 && token) {
    token = await tryRefresh();
    if (token) {
      res = await doRequest(token);
    } else {
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  const body: ApiSuccess<T> = await res.json();
  return body.data;
}

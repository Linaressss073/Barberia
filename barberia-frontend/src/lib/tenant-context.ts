import { getApiV1Url } from './config';
import { getAccessToken, getUser, saveSession } from './auth';

const KEY = 'bb_selected_tenant_id';

export function getSelectedTenantId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function setSelectedTenantId(id: string): void {
  localStorage.setItem(KEY, id);
}

export function clearSelectedTenantId(): void {
  localStorage.removeItem(KEY);
}

/**
 * If localStorage has no active tenant but the user is a customer,
 * call GET /auth/me to recover activeTenantId from DB and cache it.
 * Returns the tenantId (or null if none).
 */
export async function syncActiveTenantFromServer(): Promise<string | null> {
  if (typeof localStorage === 'undefined') return null;
  const cached = localStorage.getItem(KEY);
  if (cached) return cached;

  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${getApiV1Url()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const body = await res.json() as { data: { activeTenantId?: string | null; [k: string]: unknown } };
    const tid = body.data?.activeTenantId ?? null;
    if (tid) {
      setSelectedTenantId(tid);
      // Also keep saved user in sync
      const user = getUser();
      if (user) saveSession({ ...user, activeTenantId: tid }, token, localStorage.getItem('bb_refresh') ?? '');
    }
    return tid;
  } catch {
    return null;
  }
}

/** Call after "Reservar aquí" — persists selection in DB then in localStorage */
export async function setActiveTenantWithSync(tenantId: string): Promise<void> {
  setSelectedTenantId(tenantId);
  const token = getAccessToken();
  if (!token) return;
  try {
    await fetch(`${getApiV1Url()}/customer-tenants/active`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tenantId }),
    });
  } catch {
    // localStorage already updated — DB sync failure is non-blocking
  }
}

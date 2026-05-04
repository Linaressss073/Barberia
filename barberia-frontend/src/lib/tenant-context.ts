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

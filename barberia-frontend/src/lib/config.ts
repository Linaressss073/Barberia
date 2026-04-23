/** URL base del API (Nest), sin barra final. Ej.: https://api.example.com */
export function getPublicApiBaseUrl(): string {
  const base = import.meta.env.PUBLIC_API_URL;
  if (base == null || base === '') return '';
  return String(base).replace(/\/$/, '');
}

/** Prefijo REST del backend (`GLOBAL_PREFIX` típico: api/v1). */
export function getApiV1Url(): string {
  const base = getPublicApiBaseUrl();
  if (!base) return '';
  return `${base}/api/v1`;
}

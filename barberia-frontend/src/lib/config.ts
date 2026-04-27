/** URL base del API (Nest), sin barra final. Ej.: https://api.example.com */
export function getPublicApiBaseUrl(): string {
  const base = import.meta.env.PUBLIC_API_URL;
  if (base == null || base === '') return 'http://localhost:3000';
  return String(base).replace(/\/$/, '');
}

/** URL completa del prefijo REST: PUBLIC_API_URL + /api/v1 */
export function getApiV1Url(): string {
  return `${getPublicApiBaseUrl()}/api/v1`;
}

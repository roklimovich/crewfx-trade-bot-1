/** Reads the (non-HTTP-only) CSRF cookie the backend sets on login/register/refresh. */
function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)sf_csrf=([^;]+)/);
  return match?.[1];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
  }
}

/**
 * Thin wrapper around fetch for our own API routes:
 * - always sends cookies (credentials: 'include')
 * - attaches X-CSRF-Token on mutating requests (see src/middleware.ts)
 * - throws ApiError with the parsed error message on non-2xx responses
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = getCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError((data as { error?: string })?.error ?? 'Request failed', res.status, data);
  }

  return data as T;
}

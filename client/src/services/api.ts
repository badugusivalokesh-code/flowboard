import type { ApiErrorBody } from '@/types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export class ApiRequestError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** Distinct from ApiRequestError: the request never reached a server at all
 * (offline, DNS failure, CORS rejection, server down) — there's no status
 * code or response body to report, just "the network didn't work." Callers
 * that want a different message for this case can check `instanceof`. */
export class NetworkError extends Error {
  constructor() {
    super('Could not reach the server. Check your connection and try again.');
    this.name = 'NetworkError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper: JSON in/out, credentials included (required for the
 * httpOnly auth cookie), and errors normalized into ApiRequestError (server
 * responded, but with an error) or NetworkError (no response at all) so
 * callers can branch cleanly instead of parsing raw fetch failures.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured');
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    // A deliberate abort (component unmounted, request superseded) isn't a
    // network failure — let it propagate as-is so callers can ignore it.
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new NetworkError();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const body = payload as ApiErrorBody | undefined;
    throw new ApiRequestError(
      res.status,
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.details
    );
  }

  return payload as T;
}

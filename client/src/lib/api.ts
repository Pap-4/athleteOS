export interface ApiErrorDetail {
  path: string
  message: string
}

export class ApiError extends Error {
  status: number
  code: string
  details: ApiErrorDetail[]

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const BASE = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'athleteos.token'

/** Fired when the API rejects our token, so the auth provider can sign out. */
export const AUTH_EXPIRED_EVENT = 'athleteos:auth-expired'

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // storage unavailable (private mode); the session just won't persist
    }
  },
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = tokenStore.get()
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the API running?')
  }

  if (res.status === 204) return undefined as T

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | null)
      ?.error
    // A 401 on a protected call (not a failed sign-in) means the session is over.
    if (res.status === 401 && token && !path.startsWith('/api/v1/auth/sign')) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed (${res.status})`,
      err?.details ?? [],
    )
  }
  return data as T
}

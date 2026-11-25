const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost/berber/api/public'

let csrfToken = ''

export function getApiUrl(): string {
  return API_URL
}

export function mediaUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // uploads/gallery/... → public/uploads.php?f=gallery/...
  const cleaned = path.replace(/^uploads\//, '')
  return `${API_URL}/uploads.php?f=${encodeURIComponent(cleaned)}`
}

export function setCsrfToken(token: string) {
  csrfToken = token
}

export function getCsrfToken() {
  return csrfToken
}

type Json = Record<string, unknown> | unknown[] | null

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `İstek başarısız (${res.status})`)
  }
  return (data.data !== undefined ? data.data : data) as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  return parseResponse<T>(res)
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: Json,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: form,
  })
  return parseResponse<T>(res)
}

export async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken
  const data = await apiGet<{ csrf_token: string }>('/csrf')
  csrfToken = data.csrf_token
  return csrfToken
}

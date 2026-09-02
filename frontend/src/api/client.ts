const TOKEN_KEY = 'hs_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// The browser's local calendar date, used as the "today" reference the backend
// should evaluate streaks and weekly rates against (backend stays GMT by default).
export function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && !path.endsWith('/login') && !path.endsWith('/register')) {
      clearToken()
      window.location.assign('/login')
    }
    throw new ApiError((body as { error?: string }).error ?? 'Request failed', res.status)
  }
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export interface User {
  id: number
  email: string
}

export type HabitType = 'build' | 'break'

export interface BuildStats {
  currentStreak: number
  weekly: {
    weekStart: string
    weekEnd: string
    completedDays: string[]
    totalDaysThisWeek: number
    missedThisWeek: number
  }
}

export interface BreakStats {
  cleanStreak: number
  lastRelapse: string | null
  relapses: string[]
}

export interface Habit {
  id: number
  user_id: number
  name: string
  type: HabitType
  created_at: string
  stats: { build?: BuildStats; break?: BreakStats }
}

export interface Goal {
  id: number
  user_id: number
  habit_id: number
  title: string
  description: string | null
  created_at: string
  habit_name: string
  habit_type: HabitType
}

export interface AuthResponse {
  token: string
  user: User
}
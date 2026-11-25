import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGet, apiSend, ensureCsrf, setCsrfToken } from '../api/client'
import type { User } from '../api/types'

type AuthState = {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    phone: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      await ensureCsrf()
      const data = await apiGet<{ user: User | null; csrf_token: string }>('/auth/me')
      if (data.csrf_token) setCsrfToken(data.csrf_token)
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    await ensureCsrf()
    const data = await apiSend<{ user: User; csrf_token: string }>('/auth/login', 'POST', {
      email,
      password,
    })
    setCsrfToken(data.csrf_token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (payload: { name: string; phone: string; email: string; password: string }) => {
      await ensureCsrf()
      const data = await apiSend<{ user: User; csrf_token: string }>('/auth/register', 'POST', payload)
      setCsrfToken(data.csrf_token)
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    await ensureCsrf()
    await apiSend('/auth/logout', 'POST', {})
    setUser(null)
    setCsrfToken('')
    await ensureCsrf()
  }, [])

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout }),
    [user, loading, refresh, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı')
  return ctx
}

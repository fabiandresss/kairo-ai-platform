import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginUser, logoutUser, registerUser, sessionUser } from '../services'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => sessionUser())

  const login = useCallback(async (e: string, p: string, r: boolean) => setUser(await loginUser(e, p, r)), [])
  /** Registers a demo account. Does not sign in: the UI confirms first. */
  const register = useCallback(async (n: string, e: string, p: string) => {
    await registerUser(n, e, p)
  }, [])
  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}

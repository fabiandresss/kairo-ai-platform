import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { read, write } from '../lib/storage'

export type ThemePref = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface ThemeCtx {
  pref: ThemePref
  theme: Resolved
  setPref: (p: ThemePref) => void
  toggle: () => void
}

const Ctx = createContext<ThemeCtx | null>(null)
const KEY = 'kairo.theme'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

function resolve(p: ThemePref): Resolved {
  return p === 'system' ? (mq().matches ? 'dark' : 'light') : p
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(() => read<ThemePref>(KEY, 'system'))
  const [theme, setTheme] = useState<Resolved>(() => resolve(read<ThemePref>(KEY, 'system')))

  const apply = useCallback((p: ThemePref, animate: boolean) => {
    const r = resolve(p)
    const root = document.documentElement
    if (animate) {
      root.classList.add('theme-transition')
      window.setTimeout(() => root.classList.remove('theme-transition'), 300)
    }
    root.dataset.theme = r
    setTheme(r)
  }, [])

  useEffect(() => {
    apply(pref, false)
    if (pref !== 'system') return
    const m = mq()
    const onChange = () => apply('system', true)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [pref, apply])

  const setPref = useCallback(
    (p: ThemePref) => {
      write(KEY, p)
      setPrefState(p)
      apply(p, true)
    },
    [apply],
  )

  const value = useMemo(
    () => ({ pref, theme, setPref, toggle: () => setPref(theme === 'dark' ? 'light' : 'dark') }),
    [pref, theme, setPref],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTheme outside ThemeProvider')
  return c
}

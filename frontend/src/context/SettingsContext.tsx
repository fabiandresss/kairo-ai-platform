import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { read, write } from '../lib/storage'

export interface AppSettings {
  ollamaUrl: string
  defaultModel: string
  language: 'es'
  streaming: boolean
  storage: 'local'
}

const DEFAULTS: AppSettings = {
  ollamaUrl: 'http://localhost:11434',
  defaultModel: 'llama3.1:8b',
  language: 'es',
  streaming: true,
  storage: 'local',
}

interface Ctx {
  settings: AppSettings
  update: (patch: Partial<AppSettings>) => void
}
const C = createContext<Ctx | null>(null)
const KEY = 'kairo.settings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...DEFAULTS, ...read<Partial<AppSettings>>(KEY, {}) }))
  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((s) => {
      const n = { ...s, ...patch }
      write(KEY, n)
      return n
    })
  }, [])
  const value = useMemo(() => ({ settings, update }), [settings, update])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useSettings() {
  const c = useContext(C)
  if (!c) throw new Error('useSettings outside SettingsProvider')
  return c
}

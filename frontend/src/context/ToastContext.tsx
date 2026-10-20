import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { uid } from '../lib/utils'

type Kind = 'success' | 'error' | 'info'
interface Toast {
  id: string
  kind: Kind
  message: string
}
interface Ctx {
  notify: (message: string, kind?: Kind) => void
}
const C = createContext<Ctx | null>(null)

const icons = { success: CheckCircle2, error: AlertTriangle, info: Info }
const tone = { success: 'text-success', error: 'text-danger', info: 'text-fg-2' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const notify = useCallback(
    (message: string, kind: Kind = 'success') => {
      const id = uid('t')
      setToasts((t) => [...t, { id, kind, message }])
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ notify }), [notify])

  return (
    <C.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-label="Notificaciones"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = icons[t.kind]
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className="anim-fade-up pointer-events-auto flex items-start gap-3 rounded-md border border-line-strong bg-raised px-3.5 py-3 shadow-[var(--shadow)]"
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${tone[t.kind]}`} aria-hidden />
              <p className="flex-1 text-[13px]">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Cerrar notificación" className="text-fg-3 hover:text-fg">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </C.Provider>
  )
}

export function useToast() {
  const c = useContext(C)
  if (!c) throw new Error('useToast outside ToastProvider')
  return c
}

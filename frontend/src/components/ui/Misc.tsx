import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, FlaskConical, PenLine, Search, ShieldCheck, Sigma, Bot, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { AgentRole, RunStatus, StepState } from '../../types'

/* ---------- Badge ---------- */
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'; className?: string }) {
  const tones = {
    neutral: 'bg-surface-2 text-fg-2',
    accent: 'bg-accent-subtle text-accent-text',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-wide uppercase whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  )
}

/* ---------- Status (never color-only: shape + text) ---------- */
const runMap: Record<RunStatus, { label: string; tone: 'success' | 'accent' | 'danger' | 'neutral'; shape: ReactNode }> = {
  success: { label: 'Completada', tone: 'success', shape: <Check size={11} strokeWidth={3} /> },
  running: { label: 'En curso', tone: 'accent', shape: <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-accent" /> },
  failed: { label: 'Fallida', tone: 'danger', shape: <span className="text-[11px] leading-none font-bold">!</span> },
  cancelled: { label: 'Cancelada', tone: 'neutral', shape: <span className="h-px w-2 bg-current" /> },
}
export function RunStatusBadge({ status }: { status: RunStatus }) {
  const s = runMap[status]
  return (
    <Badge tone={s.tone}>
      {s.shape}
      {s.label}
    </Badge>
  )
}

export function StepDot({ state }: { state: StepState }) {
  if (state === 'done')
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-fg text-background" aria-label="Completado">
        <Check size={11} strokeWidth={3} />
      </span>
    )
  if (state === 'running')
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-accent" aria-label="En curso">
        <span className="anim-pulse h-2 w-2 rounded-full bg-accent" />
      </span>
    )
  if (state === 'error')
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-danger text-[11px] font-bold text-danger" aria-label="Error">
        !
      </span>
    )
  return <span className="h-5 w-5 rounded-full border border-dashed border-line-strong" aria-label="Pendiente" />
}

/* ---------- Agent identity: one neutral style, role defines the glyph ---------- */
const glyphs: Record<AgentRole, LucideIcon> = {
  researcher: Search,
  analyst: Sigma,
  verifier: ShieldCheck,
  writer: PenLine,
  custom: Bot,
}
export function roleFromName(name: string): AgentRole {
  const n = name.toLowerCase()
  if (n.includes('research')) return 'researcher'
  if (n.includes('analy')) return 'analyst'
  if (n.includes('verif')) return 'verifier'
  if (n.includes('writer')) return 'writer'
  if (n.includes('eval')) return 'custom'
  return 'custom'
}
export function AgentGlyph({ role, size = 32 }: { role: AgentRole; size?: number }) {
  const Icon = glyphs[role]
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-fg"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={size * 0.5} strokeWidth={1.75} />
    </span>
  )
}
export { FlaskConical }

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition-colors',
            value === t.id ? 'bg-raised text-fg shadow-sm' : 'text-fg-3 hover:text-fg',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { id: T; label: ReactNode; aria?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          aria-label={o.aria}
          onClick={() => onChange(o.id)}
          className={cn(
            'press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 whitespace-nowrap text-[13px] font-medium transition-colors',
            value === o.id ? 'bg-raised text-fg shadow-sm' : 'text-fg-2 hover:text-fg',
          )}
        >
          {o.label}
          {value === o.id && <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />}
        </button>
      ))}
    </div>
  )
}

/* ---------- Tooltip (CSS, keyboard accessible) ---------- */
export function Tooltip({ text, children, side = 'right' }: { text: string; children: ReactNode; side?: 'right' | 'top' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-40 rounded-full border border-line-strong bg-raised px-3 py-1 text-xs whitespace-nowrap opacity-0 shadow-[var(--shadow)] transition-opacity group-focus-within/tt:opacity-100 group-hover/tt:opacity-100',
          side === 'right' ? 'top-1/2 left-full ml-2 -translate-y-1/2' : 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
        )}
      >
        {text}
      </span>
    </span>
  )
}

/* ---------- Dropdown ---------- */
export function Dropdown({
  trigger,
  items,
  align = 'right',
  up,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode
  items: ({ label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean } | 'sep')[]
  align?: 'left' | 'right'
  up?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={cn(
            'anim-pop absolute z-40 min-w-52 rounded-lg border border-line bg-raised p-1.5 shadow-[var(--shadow)]',
            align === 'right' ? 'right-0' : 'left-0',
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {items.map((it, i) =>
            it === 'sep' ? (
              <div key={i} className="my-1 h-px bg-line" />
            ) : (
              <button
                key={it.label}
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  it.onSelect()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] hover:bg-surface-2',
                  it.danger ? 'text-danger' : 'text-fg',
                )}
              >
                {it.icon}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full border border-dashed border-line-strong bg-surface-2 text-fg-3">{icon}</div>
      <h3 className="t-heading">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-[13px] text-fg-2">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full !rounded-lg" />
      ))}
    </div>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({ title, muted, eyebrow, description, actions }: { title: string; muted?: string; eyebrow?: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        {eyebrow && <p className="t-label group-label mb-2">{eyebrow}</p>}
        <h1 className="t-display">
          {title}
          {muted && <span className="text-fg-3"> {muted}</span>}
        </h1>
        {description && <p className="mt-1 max-w-xl text-[13.5px] text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-lg px-4 py-3 text-[13px]',
        tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-surface-2 text-fg-2',
      )}
      role="note"
    >
      {children}
    </div>
  )
}

/* ---------- Key/value row ---------- */
export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <dt className="t-label">{k}</dt>
      <dd className="text-right text-[13px]">{children}</dd>
    </div>
  )
}

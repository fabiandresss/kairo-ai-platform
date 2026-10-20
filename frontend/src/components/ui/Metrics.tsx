import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ---------- Cifras grandes con decimales en gris ---------- */
export function Fig({ value, decimals = 0, suffix, className }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const [int, dec] = value.toLocaleString('es', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: true }).split(',')
  return (
    <span className={cn('fig', className)}>
      {int}
      {dec !== undefined && <span className="fig-dec">,{dec}</span>}
      {suffix && <span className="fig-dec ml-1 text-[0.5em] tracking-normal">{suffix}</span>}
    </span>
  )
}

/* ---------- Delta: semántica sólido + suave ---------- */
export function Delta({ value, suffix = '', good = 'up', children }: { value: number; suffix?: string; good?: 'up' | 'down'; children?: ReactNode }) {
  const up = value >= 0
  const positive = good === 'up' ? up : !up
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium tabular-nums', positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
        <Icon size={12} strokeWidth={2.4} aria-hidden />
        <span className="sr-only">{up ? 'sube' : 'baja'}</span>
        {Math.abs(value).toLocaleString('es', { maximumFractionDigits: 1 })}
        {suffix}
      </span>
      {children && <span className="text-fg-3">{children}</span>}
    </span>
  )
}

/* ---------- Mini barras (KPI) ---------- */
export function MiniBars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1)
  return (
    <span className={cn('flex h-8 items-end gap-[3px]', className)} aria-hidden>
      {data.map((v, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full', i === data.length - 1 ? 'bg-current' : 'bg-current opacity-30')}
          style={{ height: `${Math.max((v / max) * 100, 12)}%` }}
        />
      ))}
    </span>
  )
}

/** Tarjeta de métrica: etiqueta mono + cifra grande. `hero` = la única destacada de la fila. */
export function Stat({
  label,
  children,
  hint,
  icon,
  bars,
  hero,
  className,
}: {
  label: string
  children: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  bars?: number[]
  hero?: boolean
  className?: string
}) {
  return (
    <div className={cn(hero ? 'card-hero' : 'card', 'flex flex-col p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="t-label">{label}</p>
        {icon && (
          <span className={cn('grid h-8 w-8 place-items-center rounded-full', hero ? 'bg-hero-ink/10' : 'bg-surface-2 text-fg-2')} aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[30px] leading-none sm:text-[34px]">{children}</p>
        {bars && bars.length > 1 && <MiniBars data={bars} className={hero ? 'text-hero-ink' : 'text-fg'} />}
      </div>
      {hint && <div className={cn('mt-3 text-xs', hero ? 'text-hero-ink/75' : 'text-fg-3')}>{hint}</div>}
    </div>
  )
}

/* ---------- Gráfico de barras densas (solo Tailwind; alto dinámico por dato) ---------- */
export interface Bar {
  key: string
  value: number
  text: string
  tone?: 'default' | 'accent' | 'danger'
}

export function BarChart({ bars, label, height = 96, className, start, end }: { bars: Bar[]; label: string; height?: number; className?: string; start?: string; end?: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  return (
    <div className={className}>
      <ul role="img" aria-label={label} className="flex items-end gap-1" style={{ height }}>
        {bars.map((b) => (
          <li key={b.key} title={`${b.key}: ${b.text}`} className="flex h-full min-w-0 max-w-7 flex-1 items-end">
            <span
              className={cn('block w-full rounded-full transition-[height]', b.tone === 'accent' ? 'bg-accent' : b.tone === 'danger' ? 'bg-danger' : 'bg-fg/20')}
              style={{ height: `${Math.max((b.value / max) * 100, 6)}%` }}
            />
          </li>
        ))}
      </ul>
      {(start || end) && (
        <div className="mono mt-2 flex justify-between text-[11px] text-fg-3" aria-hidden>
          <span>{start}</span>
          <span>{end}</span>
        </div>
      )}
    </div>
  )
}

/* ---------- Agrupar por día: «HOY», «AYER», «18 OCT» ---------- */
export function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const y = new Date()
  y.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const short = d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  if (same(d, today)) return `Hoy, ${short}`
  if (same(d, y)) return `Ayer, ${short}`
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function groupByDay<T>(items: T[], getIso: (t: T) => string): { label: string; items: T[] }[] {
  const out: { label: string; items: T[] }[] = []
  for (const it of items) {
    const label = dayLabel(getIso(it))
    const last = out[out.length - 1]
    if (last?.label === label) last.items.push(it)
    else out.push({ label, items: [it] })
  }
  return out
}

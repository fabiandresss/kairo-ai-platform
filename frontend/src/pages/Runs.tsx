import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, ChevronRight, Coins, ScrollText, Timer, X as XIcon } from 'lucide-react'
import { BarChart, Fig, Stat, groupByDay } from '../components/ui/Metrics'
import { SearchInput } from '../components/ui/Field'
import { Drawer } from '../components/ui/Overlay'
import { AgentGlyph, Badge, EmptyState, KV, Notice, PageHeader, RunStatusBadge, Segmented, SkeletonList, roleFromName } from '../components/ui/Misc'
import { useAsyncList } from '../lib/useAsync'
import { cn, formatDuration } from '../lib/utils'
import { runsService } from '../services'
import type { Run, RunStatus, TraceEvent } from '../types'

type Filter = 'all' | RunStatus

const evLabel: Record<TraceEvent['type'], string> = { plan: 'Plan', agent: 'Agente', tool: 'Herramienta', verify: 'Verificación', error: 'Error', final: 'Respuesta' }

function Trace({ run }: { run: Run }) {
  const [open, setOpen] = useState<string | null>(run.events.find((e) => e.status === 'failed')?.id ?? null)
  const total = Math.max(run.durationMs, 1)
  return (
    <ol className="space-y-2">
      {run.events.map((e) => {
        const expanded = open === e.id
        const hasDetail = e.input || e.output
        return (
          <li key={e.id} className="inset">
            <button
              onClick={() => setOpen(expanded ? null : e.id)}
              aria-expanded={expanded}
              disabled={!hasDetail}
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left disabled:cursor-default"
            >
              <ChevronRight size={14} className={cn('shrink-0 text-fg-3 transition-transform', expanded && 'rotate-90', !hasDetail && 'opacity-0')} aria-hidden />
              <AgentGlyph role={e.type === 'tool' ? 'custom' : roleFromName(e.actor)} size={24} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{e.title}</span>
                <span className="text-xs text-fg-3">{e.actor} · {evLabel[e.type]}</span>
              </span>
              {e.status === 'failed' && <Badge tone="danger">Error</Badge>}
              {e.status === 'running' && <Badge tone="accent">En curso</Badge>}
              <span className="mono w-16 shrink-0 text-right text-fg-3">{formatDuration(e.durationMs)}</span>
            </button>
            <div className="mx-3.5 mb-3 h-1.5 rounded-full bg-raised" aria-hidden>
              <div
                className={cn('h-full rounded-full', e.status === 'failed' ? 'bg-danger' : 'bg-fg/40')}
                style={{ marginLeft: `${(e.at / total) * 100}%`, width: `${Math.max((e.durationMs / total) * 100, 2)}%` }}
              />
            </div>
            {expanded && hasDetail && (
              <div className="space-y-2 border-t border-line px-3.5 py-3">
                {e.input && <div><p className="t-label mb-1">Entrada</p><pre className="mono break-words whitespace-pre-wrap">{e.input}</pre></div>}
                {e.output && <div><p className="t-label mb-1">Salida</p><pre className={cn('mono break-words whitespace-pre-wrap', e.status === 'failed' && 'text-danger')}>{e.output}</pre></div>}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function Runs() {
  const { data, loading, error } = useAsyncList(() => runsService.list())
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState<Run | null>(null)

  const list = useMemo(
    () => data.filter((r) => (filter === 'all' || r.status === filter) && `${r.title} ${r.id} ${r.workflow ?? ''}`.toLowerCase().includes(q.toLowerCase())),
    [data, q, filter],
  )

  const stats = useMemo(() => {
    const done = data.filter((r) => r.status !== 'running')
    const ok = data.filter((r) => r.status === 'success').length
    return {
      total: data.length,
      rate: done.length ? (ok / done.length) * 100 : 0,
      avg: data.length ? data.reduce((a, r) => a + r.durationMs, 0) / data.length / 1000 : 0,
      tokens: data.reduce((a, r) => a + r.tokens, 0),
    }
  }, [data])
  const recent = useMemo(() => [...data].sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(-24), [data])

  const groups = useMemo(() => groupByDay([...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt)), (r) => r.startedAt), [list])
  const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '')

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-3">
      <PageHeader eyebrow="Observabilidad" title="Runs & Traces." muted="Cada paso, a la vista." description="Historial de ejecuciones con la traza de cada agente y herramienta." />
      {!loading && !error && data.length > 0 && (
        <section aria-label="Resumen" className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat hero label="Tasa de éxito" icon={<Check size={15} />} bars={recent.map((r) => (r.status === 'success' ? 2 : 1))} hint="Ejecuciones terminadas sin error">
            <Fig value={stats.rate} decimals={1} suffix="%" />
          </Stat>
          <Stat label="Ejecuciones" icon={<ScrollText size={15} />} hint="en el historial"><Fig value={stats.total} /></Stat>
          <Stat label="Duración media" icon={<Timer size={15} />} bars={recent.map((r) => r.durationMs)} hint="por ejecución"><Fig value={stats.avg} decimals={1} suffix="s" /></Stat>
          <Stat label="Tokens" icon={<Coins size={15} />} bars={recent.map((r) => r.tokens)} hint="todas las ejecuciones"><Fig value={stats.tokens} /></Stat>
        </section>
      )}
      {recent.length > 1 && (
        <section aria-label="Latencia y tokens" className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="t-label">Latencia por ejecución</p>
              <span className="mono text-[11px] text-fg-3">máx {formatDuration(Math.max(...recent.map((r) => r.durationMs)))}</span>
            </div>
            <BarChart
              className="mt-4"
              label="Duración de las últimas ejecuciones"
              start={shortDate(recent[0]?.startedAt)}
              end={shortDate(recent[recent.length - 1]?.startedAt)}
              bars={recent.map((r) => ({ key: r.id, value: r.durationMs, text: formatDuration(r.durationMs), tone: r.status === 'failed' ? 'danger' : 'default' }))}
            />
          </div>
          <div className="card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="t-label">Tokens por ejecución</p>
              <span className="mono text-[11px] text-fg-3">última {recent[recent.length - 1]?.tokens.toLocaleString('es')}</span>
            </div>
            <BarChart
              className="mt-4"
              label="Tokens de las últimas ejecuciones"
              start={shortDate(recent[0]?.startedAt)}
              end={shortDate(recent[recent.length - 1]?.startedAt)}
              bars={recent.map((r, i) => ({ key: r.id, value: r.tokens, text: r.tokens.toLocaleString('es'), tone: i === recent.length - 1 ? 'accent' : 'default' }))}
            />
          </div>
        </section>
      )}

      <section aria-label="Historial" className="card p-4 sm:p-5">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <h2 className="t-heading mr-auto">Historial</h2>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por tarea o ID" label="Buscar ejecuciones" className="w-full sm:w-64" />
        </div>
        <div className="mt-3">
          <Segmented
            label="Filtrar por estado"
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'Todas' },
              { id: 'success', label: 'Completadas' },
              { id: 'running', label: 'En curso' },
              { id: 'failed', label: 'Fallidas' },
              { id: 'cancelled', label: 'Canceladas' },
            ]}
          />
        </div>

        {loading ? <div className="mt-4"><SkeletonList /></div> : error ? <p role="alert" className="mt-4 text-danger">{error}</p> : list.length === 0 ? (
          <div className="mt-4"><EmptyState icon={<ScrollText size={20} />} title="Sin ejecuciones">No hay resultados con estos filtros.</EmptyState></div>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <h3 className="t-label group-label mt-5 mb-2 first-letter:uppercase">{g.label}</h3>
              <ul className="space-y-1.5" aria-label={g.label}>
                {g.items.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => setSel(r)} className="press flex w-full items-center gap-3 rounded-lg bg-surface-2/60 px-3 py-3 text-left transition-colors hover:bg-surface-2 sm:gap-4 sm:px-4">
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                          r.status === 'success' && 'bg-success-soft text-success',
                          r.status === 'failed' && 'bg-danger-soft text-danger',
                          r.status === 'running' && 'bg-accent-subtle text-accent-text',
                          r.status === 'cancelled' && 'bg-raised text-fg-3',
                        )}
                        aria-hidden
                      >
                        {r.status === 'success' ? <Check size={16} /> : r.status === 'failed' ? <XIcon size={16} /> : r.status === 'running' ? <span className="anim-pulse h-2 w-2 rounded-full bg-accent" /> : <span className="h-px w-3 bg-current" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{r.title}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="mono truncate text-fg-3">{r.id}{r.workflow && ` · ${r.workflow}`}</span>
                          <span className="sm:hidden"><RunStatusBadge status={r.status} /></span>
                        </span>
                      </span>
                      <span className="hidden sm:block"><RunStatusBadge status={r.status} /></span>
                      <span className="w-20 shrink-0 text-right">
                        <Fig value={r.durationMs / 1000} decimals={1} suffix="s" className="text-[17px]" />
                        <span className="mono block text-[11px] text-fg-3">{new Date(r.startedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <ArrowUpRight size={15} className="hidden shrink-0 text-fg-3 sm:block" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      <div className="mt-3"><Notice><span>Las ejecuciones mostradas son datos de ejemplo. Aparecerán las reales cuando el backend de orquestación esté conectado.</span></Notice></div>

      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.title ?? ''} description={sel?.id}>
        {sel && (
          <div className="space-y-6">
            <div className="inset flex items-end justify-between gap-4 p-5">
              <div>
                <p className="t-label">Duración</p>
                <p className="mt-2 text-[40px] leading-none"><Fig value={sel.durationMs / 1000} decimals={1} suffix="s" /></p>
              </div>
              <RunStatusBadge status={sel.status} />
            </div>
            <dl>
              <KV k="Estado"><RunStatusBadge status={sel.status} /></KV>
              <KV k="Origen">{sel.source === 'chat' ? 'Chat' : `Workflow · ${sel.workflow}`}</KV>
              <KV k="Modelo"><span className="mono">{sel.model}</span></KV>
              <KV k="Duración"><span className="mono">{formatDuration(sel.durationMs)}</span></KV>
              <KV k="Tokens"><span className="mono">{sel.tokens.toLocaleString('es')}</span></KV>
            </dl>
            <section>
              <h3 className="t-label mb-2">Línea de tiempo</h3>
              <Trace run={sel} />
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}

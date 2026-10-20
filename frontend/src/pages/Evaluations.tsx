import { useMemo, useState } from 'react'
import { Check, FlaskConical, Gauge, Timer, X } from 'lucide-react'
import { SearchInput } from '../components/ui/Field'
import { Drawer } from '../components/ui/Overlay'
import { Badge, EmptyState, KV, Notice, PageHeader, Segmented, SkeletonList, Tabs } from '../components/ui/Misc'
import { Button } from '../components/ui/Button'
import { BarChart, Delta, Fig, Stat } from '../components/ui/Metrics'
import { useAsyncList } from '../lib/useAsync'
import { cn, formatDate, formatDuration } from '../lib/utils'
import { datasetsService, evalRunsService } from '../services'
import type { EvalRun } from '../types'

type Tab = 'runs' | 'datasets'
type Outcome = 'all' | 'passed' | 'failed'

function Bar({ label, value, max, text, strong }: { label: string; value: number; max: number; text: string; strong?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between"><span className="t-label">{label}</span><span className="mono">{text}</span></div>
      <div className="h-2.5 rounded-full bg-raised" role="img" aria-label={`${label}: ${text}`}>
        <div className={cn('h-full rounded-full', strong ? 'bg-accent' : 'bg-fg/30')} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  )
}

export default function Evaluations() {
  const runs = useAsyncList(() => evalRunsService.list())
  const sets = useAsyncList(() => datasetsService.list())
  const [tab, setTab] = useState<Tab>('runs')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [detail, setDetail] = useState<EvalRun | null>(null)
  const [outcome, setOutcome] = useState<Outcome>('all')

  const filtered = useMemo(() => runs.data.filter((r) => r.target.toLowerCase().includes(q.toLowerCase())), [runs.data, q])
  const compared = runs.data.filter((r) => picked.includes(r.id))
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id]))
  const setName = (id: string) => sets.data.find((d) => d.id === id)?.name ?? id

  const summary = useMemo(() => {
    const d = runs.data
    const cases = d.reduce((a, r) => a + r.passed + r.failed, 0)
    const passed = d.reduce((a, r) => a + r.passed, 0)
    return {
      acc: cases ? (passed / cases) * 100 : 0,
      lat: d.length ? d.reduce((a, r) => a + r.avgLatencyMs, 0) / d.length / 1000 : 0,
      cases,
      ordered: [...d].sort((a, b) => a.at.localeCompare(b.at)),
    }
  }, [runs.data])
  const trend = useMemo(() => {
    const o = [...runs.data].sort((a, b) => a.at.localeCompare(b.at))
    return o.length > 1 ? (o[o.length - 1].accuracy - o[o.length - 2].accuracy) * 100 : null
  }, [runs.data])

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-3">
      <PageHeader eyebrow="Calidad" title="Evaluations." muted="Mide antes de confiar." description="Mide la calidad de agentes y workflows sobre conjuntos de casos de prueba." />
      {!runs.loading && runs.data.length > 0 && (
        <section aria-label="Resumen" className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]">
          <Stat
            hero
            label="Precisión global"
            icon={<Gauge size={15} />}
            bars={summary.ordered.map((r) => r.accuracy)}
            hint={trend !== null ? <span className="inline-flex flex-wrap items-center gap-1.5">{summary.cases} casos · <span className="rounded-full bg-hero-ink/10 px-2 py-0.5 font-medium tabular-nums">{trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toLocaleString('es', { maximumFractionDigits: 1 })} pts</span></span> : `${summary.cases} casos evaluados`}
          >
            <Fig value={summary.acc} decimals={1} suffix="%" />
          </Stat>
          <Stat label="Latencia media" icon={<Timer size={15} />} bars={summary.ordered.map((r) => r.avgLatencyMs)} hint="entre todas las ejecuciones"><Fig value={summary.lat} decimals={2} suffix="s" /></Stat>
          <div className="card p-5">
            <p className="t-label">Scores por ejecución</p>
            <BarChart
              className="mt-4"
              height={72}
              label="Precisión de cada ejecución de evaluación"
              start={summary.ordered[0]?.target.split(' ·')[0]}
              end={summary.ordered[summary.ordered.length - 1]?.target.split(' ·')[0]}
              bars={summary.ordered.map((r, i) => ({ key: r.target, value: r.accuracy, text: `${Math.round(r.accuracy * 100)}%`, tone: i === summary.ordered.length - 1 ? 'accent' : 'default' }))}
            />
          </div>
        </section>
      )}
      <Tabs label="Secciones" value={tab} onChange={setTab} tabs={[{ id: 'runs', label: 'Ejecuciones' }, { id: 'datasets', label: 'Datasets' }]} />

      {tab === 'runs' ? (
        <div className="pt-4">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por agente o modelo" label="Buscar evaluaciones" className="mb-4 max-w-sm" />
          {runs.loading ? <SkeletonList /> : filtered.length === 0 ? (
            <EmptyState icon={<FlaskConical size={20} />} title="Sin ejecuciones">No hay evaluaciones con ese criterio.</EmptyState>
          ) : (
            <>
              <ul className="card space-y-1.5 p-2 sm:p-3" aria-label="Ejecuciones de evaluación. Selecciona dos para compararlas.">
                {filtered.map((r) => (
                  <li key={r.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 transition-colors sm:gap-4 sm:px-4', picked.includes(r.id) ? 'bg-accent-subtle' : 'hover:bg-surface-2')}>
                    <input type="checkbox" aria-label={`Comparar ${r.target}`} checked={picked.includes(r.id)} onChange={() => toggle(r.id)} className="k-check shrink-0" />
                    <button onClick={() => { setDetail(r); setOutcome('all') }} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[14px] font-medium">{r.target}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-3">
                        <span>{setName(r.datasetId)}</span>
                        <span>{formatDate(r.at)}</span>
                        <span className="mono"><span className="text-success">{r.passed}</span> / <span className="text-danger">{r.failed}</span></span>
                      </span>
                      <span className="mt-2 block h-1.5 max-w-xs rounded-full bg-surface-2" aria-hidden>
                        <span className={cn('block h-full rounded-full', r.accuracy >= 0.8 ? 'bg-success' : r.accuracy >= 0.6 ? 'bg-warning' : 'bg-danger')} style={{ width: `${Math.round(r.accuracy * 100)}%` }} />
                      </span>
                    </button>
                    <span className="shrink-0 text-right">
                      <Fig value={r.accuracy * 100} decimals={1} suffix="%" className="text-[20px]" />
                      <span className="mono block text-[11px] text-fg-3">{formatDuration(r.avgLatencyMs)}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <section className="mt-6" aria-label="Comparación">
                <div className="mb-3 flex items-center justify-between"><h2 className="t-label">Comparación</h2>{picked.length > 0 && <Button size="sm" variant="ghost" onClick={() => setPicked([])}>Limpiar</Button>}</div>
                {compared.length < 2 ? <p className="inset px-4 py-3 text-[13px] text-fg-2">Marca dos ejecuciones de la lista para compararlas ({picked.length}/2).</p> : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {compared.map((r, i) => (
                      <div key={r.id} className={cn('card space-y-4 p-5', i === 0 && 'card-selected')}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="t-heading">{r.target}</p>
                          {i === 1 && <Delta value={(r.accuracy - compared[0].accuracy) * 100} suffix=" pts">vs. A</Delta>}
                        </div>
                        <Bar label="Precisión" value={r.accuracy} max={1} text={`${Math.round(r.accuracy * 100)}%`} strong={r.accuracy >= Math.max(...compared.map((c) => c.accuracy))} />
                        <Bar label="Latencia media" value={r.avgLatencyMs} max={Math.max(...compared.map((c) => c.avgLatencyMs))} text={formatDuration(r.avgLatencyMs)} strong={r.avgLatencyMs <= Math.min(...compared.map((c) => c.avgLatencyMs))} />
                        <Bar label="Fallos" value={r.failed} max={Math.max(1, ...compared.map((c) => c.failed))} text={String(r.failed)} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="pt-4">
          {sets.loading ? <SkeletonList rows={2} /> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {sets.data.map((d) => (
                <li key={d.id} className="card p-5">
                  <div className="flex items-center justify-between gap-3"><span className="t-heading">{d.name}</span><Badge className="mono !normal-case !tracking-normal">{d.cases.length} casos</Badge></div>
                  <p className="mt-0.5 text-[13px] text-fg-2">{d.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4"><Notice><span>Los resultados son datos de ejemplo. El motor de evaluación se conectará con el backend.</span></Notice></div>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.target ?? ''} description={detail ? setName(detail.datasetId) : ''}>
        {detail && (
          <div className="space-y-6">
            <div className="inset flex items-end justify-between gap-4 p-5">
              <div>
                <p className="t-label">Precisión</p>
                <p className="mt-2 text-[40px] leading-none"><Fig value={detail.accuracy * 100} decimals={1} suffix="%" /></p>
              </div>
              <span className="mono text-right text-[12px]"><span className="text-success">{detail.passed} ok</span><br /><span className="text-danger">{detail.failed} fallos</span></span>
            </div>
            <dl>
              <KV k="Fecha">{formatDate(detail.at)}</KV>
              <KV k="Precisión"><span className="mono">{Math.round(detail.accuracy * 100)}%</span></KV>
              <KV k="Aciertos / fallos"><span className="mono">{detail.passed} / {detail.failed}</span></KV>
              <KV k="Latencia media"><span className="mono">{formatDuration(detail.avgLatencyMs)}</span></KV>
            </dl>
            <section>
              <div className="mb-2 flex items-center justify-between"><h3 className="t-label">Casos</h3><Segmented label="Filtrar casos" value={outcome} onChange={setOutcome} options={[{ id: 'all', label: 'Todos' }, { id: 'passed', label: 'Acierto' }, { id: 'failed', label: 'Fallo' }]} /></div>
              <ul className="inset divide-y divide-line px-4">
                {detail.results.filter((r) => outcome === 'all' || (outcome === 'passed') === r.passed).map((r) => (
                  <li key={r.caseId} className="flex items-start gap-3 py-2.5">
                    {r.passed ? <Check size={15} className="mt-0.5 text-success" aria-label="Acierto" /> : <X size={15} className="mt-0.5 text-danger" aria-label="Fallo" />}
                    <div><p className="mono">{r.caseId}</p><p className="text-[13px] text-fg-2">{r.note}</p></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUp, BarChart3, ChevronDown, Copy, FileText, GitCompare, History, MessageSquarePlus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { KairoMark } from '../components/brand/KairoMark'
import { Button, IconButton } from '../components/ui/Button'
import { Badge, AgentGlyph, Notice, StepDot, roleFromName } from '../components/ui/Misc'
import { SearchInput } from '../components/ui/Field'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { groupByDay } from '../components/ui/Metrics'
import { useToast } from '../context/ToastContext'
import { read, write } from '../lib/storage'
import { cn, formatDuration, timeAgo, uid } from '../lib/utils'
import { runChat } from '../services'
import type { ChatMessage, ChatStep, Conversation } from '../types'

const KEY = 'kairo.data.conversations'

const EXAMPLES = [
  { icon: Search, title: 'Investigar un tema técnico', prompt: 'Investiga las diferencias entre Qdrant, Chroma y pgvector y prepara un informe breve.' },
  { icon: BarChart3, title: 'Analizar datos y detectar anomalías', prompt: 'Analiza este conjunto de métricas de servidor y señala los valores atípicos.' },
  { icon: GitCompare, title: 'Comparar y verificar conclusiones', prompt: 'Compara LangGraph y CrewAI y verifica cada conclusión con sus fuentes.' },
  { icon: FileText, title: 'Elaborar un reporte coordinado', prompt: 'Elabora un reporte sobre modelos open-source para ejecutar en 16 GB de RAM.' },
]

function StepTimeline({ steps, streaming }: { steps: ChatStep[]; streaming: boolean }) {
  const [open, setOpen] = useState(true)
  const done = steps.filter((s) => s.state === 'done').length
  const running = steps.find((s) => s.state === 'running')
  return (
    <div className="inset mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="t-label">Ejecución</span>
        <span className="flex-1 truncate text-[13px] text-fg-2">
          {running ? `${running.agent}: ${running.label}` : `${done} de ${steps.length} pasos completados`}
        </span>
        <ChevronDown size={15} className={cn('text-fg-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ol className="border-t border-line px-4 py-3.5">
          {steps.map((s, i) => (
            <li key={s.id} className="relative flex gap-3 pb-3 last:pb-0">
              {i < steps.length - 1 && <span className="absolute top-6 bottom-0 left-[9.5px] w-px bg-line-strong" aria-hidden />}
              <StepDot state={s.state} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium">
                    <AgentGlyph role={roleFromName(s.agent)} size={20} />
                    {s.agent}
                  </span>
                  {s.durationMs && <span className="mono text-fg-3">{formatDuration(s.durationMs)}</span>}
                </div>
                <p className="text-[13px] text-fg-2">{s.label}</p>
                {s.tools?.map((t) => (
                  <p key={t.name} className="mt-1 flex items-center gap-2 text-xs text-fg-3">
                    <span className="mono rounded-full bg-raised px-2 py-0.5">{t.name}</span>
                    {t.summary}
                  </p>
                ))}
              </div>
            </li>
          ))}
          {streaming && <li className="sr-only">Ejecutando…</li>}
        </ol>
      )}
    </div>
  )
}

function Message({ m, onRetry, onCopy }: { m: ChatMessage; onRetry: () => void; onCopy: () => void }) {
  if (m.role === 'user')
    return (
      <div className="anim-fade-up flex justify-end">
        <p className="max-w-[85%] rounded-xl rounded-br-md bg-fg px-5 py-3 text-[14px] text-background whitespace-pre-wrap">{m.content}</p>
      </div>
    )
  return (
    <div className="anim-fade-up flex gap-3">
      <div className="mt-0.5 hidden sm:block">
        <KairoMark size={24} />
      </div>
      <div className="min-w-0 flex-1">
        {m.steps && <StepTimeline steps={m.steps} streaming={m.status === 'streaming'} />}
        {m.simulated && m.status !== 'streaming' && (
          <div className="mb-3">
            <Notice>
              <span>Respuesta de demostración: ningún modelo la generó ni se ejecutaron agentes reales. Conecta Ollama en Settings.</span>
            </Notice>
          </div>
        )}
        <div className="text-[14.5px] leading-[1.7] whitespace-pre-wrap">
          {m.content}
          {m.status === 'streaming' && <span className="anim-pulse ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-accent" aria-hidden />}
        </div>
        {m.status === 'error' && <p className="mt-2 text-[13px] text-danger">La ejecución falló. Puedes reintentar.</p>}
        {m.status !== 'streaming' && (
          <div className="mt-3 flex gap-1">
            <IconButton label="Copiar respuesta" onClick={onCopy}>
              <Copy size={15} />
            </IconButton>
            <IconButton label="Reintentar" onClick={onRetry}>
              <RotateCcw size={15} />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const { settings } = useSettings()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0]
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [convs, setConvs] = useState<Conversation[]>(() => read<Conversation[]>(KEY, []))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)

  const active = convs.find((c) => c.id === activeId) ?? null
  const persist = (next: Conversation[]) => {
    setConvs(next)
    write(KEY, next)
  }

  useEffect(() => {
    if (params.get('new')) {
      setActiveId(null)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [active?.messages])

  const filtered = useMemo(
    () => convs.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [convs, query],
  )

  const send = async (text: string, convId?: string) => {
    const prompt = text.trim()
    if (!prompt || busy) return
    setInput('')
    if (area.current) area.current.style.height = 'auto'
    const now = new Date().toISOString()
    const userMsg: ChatMessage = { id: uid('m'), role: 'user', content: prompt, createdAt: now }
    const aiId = uid('m')
    const aiMsg: ChatMessage = { id: aiId, role: 'assistant', content: '', createdAt: now, steps: [], status: 'streaming' }

    let id = convId ?? activeId
    let list = convs
    if (!id) {
      id = uid('c')
      list = [{ id, title: prompt.slice(0, 54), updatedAt: now, messages: [] }, ...convs]
      setActiveId(id)
    }
    const cid = id
    const patch = (fn: (c: Conversation) => Conversation) => {
      list = list.map((c) => (c.id === cid ? fn(c) : c))
      setConvs(list)
    }
    patch((c) => ({ ...c, updatedAt: now, messages: [...c.messages, userMsg, aiMsg] }))
    setBusy(true)
    const updateAi = (fn: (m: ChatMessage) => ChatMessage) =>
      patch((c) => ({ ...c, messages: c.messages.map((m) => (m.id === aiId ? fn(m) : m)) }))

    try {
      const res = await runChat(prompt, settings.ollamaUrl, settings.defaultModel, {
        onSteps: (steps) => updateAi((m) => ({ ...m, steps })),
        onToken: (t) => updateAi((m) => ({ ...m, content: m.content + t })),
      })
      updateAi((m) => ({ ...m, status: 'done', simulated: res.simulated }))
    } catch {
      updateAi((m) => ({ ...m, status: 'error' }))
    } finally {
      setBusy(false)
      write(KEY, list)
      setConvs(list)
    }
  }

  const retry = (idx: number) => {
    if (!active) return
    const prev = active.messages[idx - 1]
    if (prev?.role !== 'user') return
    const trimmed = active.messages.slice(0, idx - 1)
    persist(convs.map((c) => (c.id === active.id ? { ...c, messages: trimmed } : c)))
    setTimeout(() => send(prev.content, active.id), 0)
  }

  const remove = (id: string) => {
    persist(convs.filter((c) => c.id !== id))
    if (id === activeId) setActiveId(null)
    notify('Conversación eliminada.', 'info')
  }

  const history = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar conversaciones" label="Buscar conversaciones" className="flex-1" />
        <IconButton label="Nueva conversación" onClick={() => { setActiveId(null); setHistoryOpen(false) }}>
          <MessageSquarePlus size={17} />
        </IconButton>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-fg-3">{convs.length ? 'Sin coincidencias.' : 'Aún no hay conversaciones.'}</li>}
        {groupByDay(filtered, (c) => c.updatedAt).map((g) => (
          <li key={g.label}>
            <p className="t-label group-label px-3 pt-3 pb-1.5">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((c) => (
                <li key={c.id} className="group relative">
                  <button
                    onClick={() => { setActiveId(c.id); setHistoryOpen(false) }}
                    aria-current={c.id === activeId}
                    className={cn('w-full rounded-lg px-3 py-2.5 pr-10 text-left transition-colors hover:bg-surface-2', c.id === activeId && 'bg-surface-2')}
                  >
                    <span className="flex items-center gap-2">
                      {c.id === activeId && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
                      <span className="block truncate text-[13px] font-medium">{c.title}</span>
                    </span>
                    <span className="text-xs text-fg-3">{timeAgo(c.updatedAt)} · {c.messages.length} mensajes</span>
                  </button>
                  <IconButton label={`Eliminar «${c.title}»`} onClick={() => remove(c.id)} className="absolute top-2 right-1.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="flex h-full gap-3 px-3 pb-3 lg:px-0">
      <aside className="card hidden w-72 shrink-0 overflow-hidden xl:block" aria-label="Historial de conversaciones">
        {history}
      </aside>

      {historyOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} aria-hidden />
          <aside role="dialog" aria-modal="true" className="card anim-pop absolute inset-y-3 left-3 w-80 max-w-[88vw] overflow-hidden bg-surface" aria-label="Historial de conversaciones">
            <div className="absolute top-3 right-3 z-10"><IconButton label="Cerrar historial" onClick={() => setHistoryOpen(false)}><X size={16} /></IconButton></div>
            <div className="pt-10 h-full">{history}</div>
          </aside>
        </div>
      )}

      <section className="card flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="Conversación">
        <div className="flex items-center justify-between px-3 pt-3 xl:hidden">
          <Button size="sm" variant="ghost" icon={<History size={15} />} onClick={() => setHistoryOpen(true)}>
            Historial
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!active || active.messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-6 [@media(max-height:760px)]:py-3">
              <KairoMark size={32} />
              <h1 className="mt-5 text-[clamp(30px,4.6vw,46px)] leading-[1.05] font-semibold tracking-[-0.045em] [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:text-[clamp(26px,3.4vw,34px)]">
                {firstName ? `Hola, ${firstName}.` : 'Hola.'}
                <br />
                <span className="text-fg-3">¿Qué resolvemos hoy?</span>
              </h1>
              <p className="mt-2 max-w-lg text-[14px] text-fg-2 [@media(max-height:760px)]:hidden">
                Kairo planifica la tarea, la reparte entre agentes especializados, verifica el resultado y te entrega una respuesta, mostrando cada paso.
              </p>
              <p className="t-label mt-6 mb-2 [@media(max-height:760px)]:sr-only">Empieza con un ejemplo</p>
              <ul className="grid gap-2.5 sm:grid-cols-2 [@media(max-height:760px)]:mt-4">
                {EXAMPLES.map((ex) => (
                  <li key={ex.title}>
                    <button onClick={() => { setInput(ex.prompt); area.current?.focus() }} className="inset press group flex h-full w-full items-start gap-3 p-4 [@media(max-height:760px)]:items-center [@media(max-height:760px)]:py-3 text-left transition-colors hover:bg-accent-subtle">
                      <span className="chip grid h-9 w-9 shrink-0 place-items-center"><ex.icon size={16} strokeWidth={1.75} className="text-fg-2 group-hover:text-accent-text" aria-hidden /></span>
                      <span className="flex-1">
                        <span className="block text-[14px] font-medium">{ex.title}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-fg-3 [@media(max-height:760px)]:hidden">{ex.prompt}</span>
                      </span>
                      <ArrowUp size={14} className="mt-1 rotate-45 text-fg-3 transition-colors group-hover:text-accent-text" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-7 px-5 py-8" aria-live="polite">
              {active.messages.map((m, i) => (
                <Message key={m.id} m={m} onRetry={() => retry(i)} onCopy={() => { navigator.clipboard?.writeText(m.content); notify('Respuesta copiada.') }} />
              ))}
              <div ref={bottom} />
            </div>
          )}
        </div>

        <div className="px-3 pb-3 sm:px-5 sm:pb-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input) }}
            className="mx-auto max-w-3xl rounded-xl border border-transparent bg-surface-2 transition-colors focus-within:border-accent focus-within:bg-raised focus-within:ring-2 focus-within:ring-accent/25"
          >
            <label htmlFor="composer" className="sr-only">Mensaje para Kairo</label>
            <textarea
              id="composer"
              ref={area}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Describe una tarea para tus agentes…"
              className="block max-h-[200px] w-full resize-none focus-visible:!outline-none bg-transparent px-4 pt-3.5 pb-1 text-[14.5px] outline-none placeholder:text-fg-3"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
              <div className="flex items-center gap-2 overflow-hidden">
                <Badge className="mono !normal-case !tracking-normal">{settings.defaultModel}</Badge>
                <span className="hidden truncate text-xs text-fg-3 sm:inline">Enter envía · Shift+Enter nueva línea</span>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Enviar mensaje"
                className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-fg transition-[filter] hover:brightness-110 disabled:bg-raised disabled:text-fg-3"
              >
                <ArrowUp size={17} strokeWidth={2.4} />
              </button>
            </div>
          </form>
          <p className="mx-auto mt-2 hidden max-w-3xl text-center text-xs text-fg-3 sm:block">Los pasos del orquestador son una simulación hasta conectar el backend. El texto final procede de Ollama si está disponible.</p>
        </div>
      </section>
    </div>
  )
}


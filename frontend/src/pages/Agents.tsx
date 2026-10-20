import { useMemo, useState, type FormEvent } from 'react'
import { Bot, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Select, SearchInput, TextArea, TextInput } from '../components/ui/Field'
import { ConfirmDialog, Drawer, Modal } from '../components/ui/Overlay'
import { AgentGlyph, Badge, EmptyState, KV, PageHeader, Segmented, SkeletonList } from '../components/ui/Misc'
import { cn } from '../lib/utils'
import { useToast } from '../context/ToastContext'
import { useAsyncList } from '../lib/useAsync'
import { agentsService } from '../services'
import type { Agent, AgentRole, AgentStatus } from '../types'

const ROLES: { value: AgentRole; label: string }[] = [
  { value: 'researcher', label: 'Researcher' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'verifier', label: 'Verifier' },
  { value: 'writer', label: 'Writer' },
  { value: 'custom', label: 'Personalizado' },
]
const MODELS = ['llama3.1:8b', 'qwen2.5:7b', 'mistral:7b', 'gemma2:9b', 'phi3:mini']
const TOOLS = ['web.search', 'fs.read', 'py.sandbox']
const statusLabel: Record<AgentStatus, string> = { active: 'Activo', idle: 'En espera', disabled: 'Desactivado' }

const empty = (): Omit<Agent, 'id'> => ({
  name: '',
  role: 'custom',
  description: '',
  status: 'idle',
  model: MODELS[0],
  temperature: 0.3,
  instructions: '',
  tools: [],
  capabilities: [],
})

function AgentForm({ initial, onSubmit, onCancel, saving }: { initial: Omit<Agent, 'id'>; onSubmit: (a: Omit<Agent, 'id'>) => void; onCancel: () => void; saving: boolean }) {
  const [f, setF] = useState(initial)
  const [caps, setCaps] = useState(initial.capabilities.join(', '))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.name.trim().length < 2) er.name = 'El nombre debe tener al menos 2 caracteres.'
    if (!f.description.trim()) er.description = 'Describe brevemente la función del agente.'
    if (f.instructions.trim().length < 10) er.instructions = 'Escribe instrucciones de al menos 10 caracteres.'
    setErrors(er)
    if (Object.keys(er).length) return
    onSubmit({ ...f, name: f.name.trim(), capabilities: caps.split(',').map((c) => c.trim()).filter(Boolean) })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextInput label="Nombre" value={f.name} onChange={(e) => set('name', e.target.value)} error={errors.name} data-autofocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Función" value={f.role} onChange={(e) => set('role', e.target.value as AgentRole)} options={ROLES} />
        <Select label="Estado" value={f.status} onChange={(e) => set('status', e.target.value as AgentStatus)} options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))} />
      </div>
      <TextArea label="Descripción" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Modelo local" value={f.model} onChange={(e) => set('model', e.target.value)} options={MODELS.map((m) => ({ value: m, label: m }))} />
        <TextInput label="Temperatura" type="number" min={0} max={1} step={0.1} value={f.temperature} onChange={(e) => set('temperature', Number(e.target.value))} mono />
      </div>
      <TextArea label="Instrucciones" rows={4} value={f.instructions} onChange={(e) => set('instructions', e.target.value)} error={errors.instructions} />
      <fieldset>
        <legend className="t-label mb-1.5">Herramientas</legend>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((t) => {
            const on = f.tools.includes(t)
            return (
              <button
                type="button"
                key={t}
                aria-pressed={on}
                onClick={() => set('tools', on ? f.tools.filter((x) => x !== t) : [...f.tools, t])}
                className={`mono rounded-full border px-3.5 py-2 transition-colors ${on ? 'border-accent bg-accent-subtle text-fg' : 'border-line bg-raised text-fg-2 hover:text-fg'}`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </fieldset>
      <TextInput label="Capacidades" optional hint="Separadas por comas." value={caps} onChange={(e) => setCaps(e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" loading={saving}>Guardar agente</Button>
      </div>
    </form>
  )
}

export default function Agents() {
  const { data, loading, error, reload } = useAsyncList(() => agentsService.list())
  const { notify } = useToast()
  const [q, setQ] = useState('')
  const [st, setSt] = useState<'all' | AgentStatus>('all')
  const [selected, setSelected] = useState<Agent | null>(null)
  const [editing, setEditing] = useState<Agent | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Agent | null>(null)
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => data.filter((a) => (st === 'all' || a.status === st) && `${a.name} ${a.description} ${a.model}`.toLowerCase().includes(q.toLowerCase())), [data, q, st])
  const activeCount = data.filter((a) => a.status === 'active').length

  const save = async (v: Omit<Agent, 'id'>) => {
    setBusy(true)
    try {
      if (editing === 'new') {
        await agentsService.create(v)
        notify(`Agente «${v.name}» creado.`)
      } else if (editing) {
        await agentsService.update(editing.id, v)
        notify(`Agente «${v.name}» actualizado.`)
        setSelected(null)
      }
      setEditing(null)
      await reload()
    } catch {
      notify('No se pudo guardar el agente.', 'error')
    } finally {
      setBusy(false)
    }
  }
  const del = async () => {
    if (!deleting) return
    setBusy(true)
    await agentsService.remove(deleting.id)
    notify(`Agente «${deleting.name}» eliminado.`, 'info')
    setDeleting(null)
    setSelected(null)
    setBusy(false)
    reload()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-3">
      <PageHeader
        eyebrow="Workspace"
        title="Agents."
        muted="Un equipo, un objetivo."
        description="Agentes especializados que el orquestador puede asignar a cada subtarea."
        actions={<Button variant="primary" icon={<Plus size={15} />} onClick={() => setEditing('new')}>Nuevo agente</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar agentes" label="Buscar agentes" className="w-full sm:w-64" />
        <Segmented
          label="Filtrar por estado"
          value={st}
          onChange={setSt}
          options={[
            { id: 'all', label: `Todos · ${data.length}` },
            { id: 'active', label: `Activos · ${activeCount}` },
            { id: 'idle', label: 'En espera' },
            { id: 'disabled', label: 'Desactivados' },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <p role="alert" className="text-danger">{error}</p>
      ) : list.length === 0 ? (
        <EmptyState icon={<Bot size={20} />} title="Sin agentes" action={<Button variant="primary" onClick={() => setEditing('new')}>Crear agente</Button>}>
          {q ? 'Ningún agente coincide con la búsqueda.' : 'Crea tu primer agente especializado.'}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <li key={a.id}>
              <button onClick={() => setSelected(a)} className="card press group flex h-full w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5">
                <AgentGlyph role={a.role} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="t-heading">{a.name}</span>
                    <Badge tone={a.status === 'active' ? 'success' : a.status === 'disabled' ? 'danger' : 'neutral'}><span className={cn('h-1.5 w-1.5 rounded-full bg-current', a.status === 'active' && 'anim-pulse')} aria-hidden />{statusLabel[a.status]}</Badge>
                  </span>
                  <span className="mt-1 block text-[13px] text-fg-2">{a.description}</span>
                  <span className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge className="mono !normal-case !tracking-normal">{a.model}</Badge>
                    {a.tools.slice(0, 2).map((t) => <Badge key={t} className="mono !normal-case !tracking-normal">{t}</Badge>)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected?.description}
        footer={
          selected && (
            <>
              <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => setDeleting(selected)}>Eliminar</Button>
              <Button icon={<Pencil size={14} />} onClick={() => { setEditing(selected); }}>Editar</Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <dl>
              <KV k="Función">{ROLES.find((r) => r.value === selected.role)?.label}</KV>
              <KV k="Estado">{statusLabel[selected.status]}</KV>
              <KV k="Modelo"><span className="mono">{selected.model}</span></KV>
              <KV k="Temperatura"><span className="mono">{selected.temperature}</span></KV>
            </dl>
            <section>
              <h3 className="t-label mb-2">Instrucciones</h3>
              <p className="text-[13.5px] leading-relaxed text-fg-2">{selected.instructions}</p>
            </section>
            <section>
              <h3 className="t-label mb-2">Herramientas</h3>
              {selected.tools.length ? <div className="flex flex-wrap gap-1.5">{selected.tools.map((t) => <Badge key={t} className="mono !normal-case !tracking-normal">{t}</Badge>)}</div> : <p className="text-[13px] text-fg-3">Sin herramientas asignadas.</p>}
            </section>
            <section>
              <h3 className="t-label mb-2">Capacidades</h3>
              <ul className="list-disc space-y-1 pl-4 text-[13.5px] text-fg-2">{selected.capabilities.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
          </div>
        )}
      </Drawer>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo agente' : 'Editar agente'} wide>
        {editing && <AgentForm initial={editing === 'new' ? empty() : editing} onSubmit={save} onCancel={() => setEditing(null)} saving={busy} />}
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={del} loading={busy} title="Eliminar agente" message={`Se eliminará «${deleting?.name}». Esta acción no se puede deshacer.`} />
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Plug, Plus, Trash2, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { PasswordInput, Select, Switch, TextArea, TextInput } from '../components/ui/Field'
import { ConfirmDialog, Drawer, Modal } from '../components/ui/Overlay'
import { Badge, EmptyState, KV, Notice, PageHeader, SkeletonList } from '../components/ui/Misc'
import { cn } from '../lib/utils'
import { useToast } from '../context/ToastContext'
import { useAsyncList } from '../lib/useAsync'
import { integrationsService, testEndpoint } from '../services'
import type { ConnectionState, Integration, IntegrationKind } from '../types'

const kinds: { value: IntegrationKind; label: string }[] = [
  { value: 'mcp', label: 'Servidor MCP' },
  { value: 'local', label: 'Servicio local' },
  { value: 'http', label: 'Endpoint HTTP' },
]
const stateUi: Record<ConnectionState, { label: string; tone: 'success' | 'danger' | 'neutral' }> = {
  connected: { label: 'Conexión verificada', tone: 'success' },
  error: { label: 'Error de conexión', tone: 'danger' },
  disconnected: { label: 'Desconectado', tone: 'neutral' },
  untested: { label: 'Sin probar', tone: 'neutral' },
}

function IntegrationForm({ onSubmit, onCancel, saving }: { onSubmit: (v: Omit<Integration, 'id'>, secret: string) => void; onCancel: () => void; saving: boolean }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<IntegrationKind>('mcp')
  const [endpoint, setEndpoint] = useState('')
  const [desc, setDesc] = useState('')
  const [secret, setSecret] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (name.trim().length < 2) er.name = 'Introduce un nombre.'
    if (!endpoint.trim()) er.endpoint = 'Introduce la URL o el comando de conexión.'
    else if (kind !== 'mcp' && !/^https?:\/\//.test(endpoint.trim())) er.endpoint = 'Debe empezar por http:// o https://.'
    setErrors(er)
    if (Object.keys(er).length) return
    onSubmit({ name: name.trim(), description: desc.trim(), kind, endpoint: endpoint.trim(), secretHint: secret ? '••••••••' : undefined, enabled: false, state: 'untested', tools: [] }, secret)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextInput label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} data-autofocus />
      <Select label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as IntegrationKind)} options={kinds} />
      <TextInput
        label={kind === 'mcp' ? 'Comando o URL del servidor' : 'URL del endpoint'}
        mono
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        error={errors.endpoint}
        placeholder={kind === 'mcp' ? 'stdio://npx @modelcontextprotocol/server-filesystem ./workspace' : 'http://localhost:8080'}
        hint={kind === 'mcp' ? 'Los servidores por stdio los lanzará el backend.' : undefined}
      />
      <TextArea label="Descripción" optional rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <PasswordInput label="Token o clave de acceso" optional autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} hint="No se vuelve a mostrar una vez guardado." />
      <div className="flex justify-end gap-2 pt-2"><Button onClick={onCancel}>Cancelar</Button><Button type="submit" variant="primary" loading={saving}>Añadir integración</Button></div>
    </form>
  )
}

export default function Integrations() {
  const { data, loading, error, reload } = useAsyncList(() => integrationsService.list())
  const { notify } = useToast()
  const [adding, setAdding] = useState(false)
  const [sel, setSel] = useState<Integration | null>(null)
  const [deleting, setDeleting] = useState<Integration | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  const current = sel ? (data.find((i) => i.id === sel.id) ?? sel) : null

  const test = async (i: Integration) => {
    setTesting(true)
    const r = await testEndpoint(i.kind, i.endpoint)
    await integrationsService.update(i.id, { state: r.ok ? 'connected' : 'error', lastError: r.ok ? undefined : r.message })
    setTesting(false)
    notify(r.message, r.ok ? 'success' : 'error')
    reload()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-3">
      <PageHeader
        eyebrow="Configuración"
        title="Integrations."
        muted="Herramientas para tus agentes."
        description="Servidores MCP, servicios locales y endpoints que los agentes pueden usar como herramientas."
        actions={<Button variant="primary" icon={<Plus size={15} />} onClick={() => setAdding(true)}>Añadir integración</Button>}
      />
      <div className="mb-4"><Notice><span>El estado «Conexión verificada» solo aparece tras una prueba real de red. Las integraciones de ejemplo empiezan sin probar.</span></Notice></div>

      {loading ? <SkeletonList /> : error ? <p role="alert" className="text-danger">{error}</p> : data.length === 0 ? (
        <EmptyState icon={<Plug size={20} />} title="Sin integraciones" action={<Button variant="primary" onClick={() => setAdding(true)}>Añadir integración</Button>}>Conecta Ollama, un servidor MCP o un endpoint propio.</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.map((i) => (
            <li key={i.id} className={cn('card flex items-start gap-3 p-5', !i.enabled && 'opacity-80')}>
              <button onClick={() => setSel(i)} className="flex min-w-0 flex-1 items-start gap-4 text-left">
                <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full', i.state === 'connected' ? 'bg-success-soft text-success' : i.state === 'error' ? 'bg-danger-soft text-danger' : 'bg-surface-2')}><Plug size={18} strokeWidth={1.75} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="t-heading">{i.name}</span><Badge>{kinds.find((k) => k.value === i.kind)?.label}</Badge><Badge tone={stateUi[i.state].tone}>{stateUi[i.state].label}</Badge></span>
                  <span className="mt-1 block text-[13px] text-fg-2">{i.description}</span>
                  <span className="mono mt-2 block truncate rounded-full bg-surface-2 px-3 py-1.5 text-fg-3">{i.endpoint}</span>
                </span>
              </button>
              <Switch label={`${i.enabled ? 'Desactivar' : 'Activar'} ${i.name}`} checked={i.enabled} onChange={async (v) => { await integrationsService.update(i.id, { enabled: v }); notify(`${i.name} ${v ? 'activada' : 'desactivada'}.`, 'info'); reload() }} />
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Añadir integración" wide>
        <IntegrationForm
          saving={saving}
          onCancel={() => setAdding(false)}
          onSubmit={async (v) => {
            setSaving(true)
            await integrationsService.create(v)
            setSaving(false)
            setAdding(false)
            notify(`«${v.name}» añadida. Pruébala para verificar la conexión.`)
            reload()
          }}
        />
      </Modal>

      <Drawer
        open={!!current}
        onClose={() => setSel(null)}
        title={current?.name ?? ''}
        description={current?.description}
        footer={current && (<><Button variant="danger" icon={<Trash2 size={14} />} onClick={() => setDeleting(current)}>Eliminar</Button><Button variant="primary" icon={<Zap size={14} />} loading={testing} onClick={() => test(current)}>Probar conexión</Button></>)}
      >
        {current && (
          <div className="space-y-6">
            <dl>
              <KV k="Tipo">{kinds.find((k) => k.value === current.kind)?.label}</KV>
              <KV k="Estado"><Badge tone={stateUi[current.state].tone}>{stateUi[current.state].label}</Badge></KV>
              <KV k="Activa">{current.enabled ? 'Sí' : 'No'}</KV>
              <KV k="Endpoint"><span className="mono break-all">{current.endpoint}</span></KV>
              <KV k="Credencial"><span className="mono">{current.secretHint ?? 'No configurada'}</span></KV>
            </dl>
            {current.lastError && <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-[13px] text-danger">{current.lastError}</p>}
            <section>
              <h3 className="t-label mb-2">Herramientas declaradas</h3>
              {current.tools.length ? <div className="flex flex-wrap gap-1.5">{current.tools.map((t) => <Badge key={t} className="mono !normal-case !tracking-normal">{t}</Badge>)}</div> : <p className="text-[13px] text-fg-3">Se descubrirán al conectar el backend.</p>}
            </section>
          </div>
        )}
      </Drawer>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar integración" message={`Se eliminará «${deleting?.name}».`} onConfirm={async () => { if (deleting) { await integrationsService.remove(deleting.id); setDeleting(null); setSel(null); notify('Integración eliminada.', 'info'); reload() } }} />
    </div>
  )
}

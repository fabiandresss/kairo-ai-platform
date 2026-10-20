import { useState, type ReactNode } from 'react'
import { Monitor, Moon, RotateCcw, Sun, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Select, Switch, TextInput } from '../components/ui/Field'
import { ConfirmDialog } from '../components/ui/Overlay'
import { Badge, KV, PageHeader, Segmented } from '../components/ui/Misc'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { agentsService, datasetsService, evalRunsService, integrationsService, runsService, testOllama, workflowsService } from '../services'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card mb-3 grid gap-5 p-6 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2 className="t-label text-fg">{title}</h2>
        {description && <p className="mt-2 text-[13px] text-fg-3">{description}</p>}
      </div>
      <div className="max-w-lg space-y-4">{children}</div>
    </section>
  )
}

export default function SettingsPage() {
  const { pref, setPref } = useTheme()
  const { settings, update } = useSettings()
  const { notify } = useToast()
  const [url, setUrl] = useState(settings.ollamaUrl)
  const [urlErr, setUrlErr] = useState('')
  const [testing, setTesting] = useState(false)
  const [models, setModels] = useState<string[] | null>(null)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const saveUrl = () => {
    if (!/^https?:\/\/[^\s]+$/.test(url.trim())) return setUrlErr('Introduce una URL válida, p. ej. http://localhost:11434')
    setUrlErr('')
    update({ ollamaUrl: url.trim().replace(/\/$/, '') })
    notify('Endpoint de Ollama guardado.')
  }
  const test = async () => {
    setTesting(true)
    const r = await testOllama(url.trim())
    setTesting(false)
    setResult(r)
    setModels(r.models ?? null)
    if (r.ok && r.models?.length && !r.models.includes(settings.defaultModel)) update({ defaultModel: r.models[0] })
  }
  const modelOptions = (models ?? [settings.defaultModel]).map((m) => ({ value: m, label: m }))

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-3">
      <PageHeader eyebrow="Configuración" title="Settings." muted="A tu manera." description="Preferencias de la aplicación y conexión con tus modelos locales." />

      <Section title="Apariencia" description="El tema se guarda en este navegador.">
        <Segmented
          label="Tema"
          value={pref}
          onChange={setPref}
          options={[
            { id: 'light', label: <><Sun size={14} /> Claro</> },
            { id: 'dark', label: <><Moon size={14} /> Oscuro</> },
            { id: 'system', label: <><Monitor size={14} /> Sistema</> },
          ]}
        />
      </Section>

      <Section title="Ollama" description="Servidor local de modelos open-source. Sin claves ni coste.">
        <TextInput label="Endpoint" mono value={url} onChange={(e) => setUrl(e.target.value)} error={urlErr} />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={saveUrl}>Guardar</Button>
          <Button icon={<Zap size={14} />} loading={testing} onClick={test}>Probar conexión</Button>
        </div>
        {result && (
          <p role="status" className={`rounded-lg px-4 py-3 text-[13px] ${result.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{result.message}</p>
        )}
        <Select label="Modelo por defecto" value={settings.defaultModel} onChange={(e) => update({ defaultModel: e.target.value })} options={modelOptions} hint={models ? 'Modelos detectados en tu servidor Ollama.' : 'Prueba la conexión para listar los modelos instalados.'} />
        <div className="inset flex items-center justify-between gap-4 px-4 py-3.5">
          <div><p className="text-[13px] font-medium">Respuesta en streaming</p><p className="text-xs text-fg-3">Muestra el texto a medida que se genera.</p></div>
          <Switch label="Respuesta en streaming" checked={settings.streaming} onChange={(v) => update({ streaming: v })} />
        </div>
      </Section>

      <Section title="Almacenamiento" description="Todo se guarda localmente en el navegador mientras no exista backend (PostgreSQL).">
        <div className="flex items-center gap-2 text-[13px]"><Badge>localStorage</Badge> Conversaciones, agentes, workflows e integraciones de ejemplo.</div>
        <Button variant="danger" icon={<RotateCcw size={14} />} onClick={() => setConfirmReset(true)}>Restablecer datos de ejemplo</Button>
      </Section>

      <Section title="Acerca de">
        <dl>
          <KV k="Producto">Kairo — Intelligence, orchestrated.</KV>
          <KV k="Versión"><span className="mono">0.1.0 (frontend prototipo)</span></KV>
          <KV k="Licencia de dependencias">Open source</KV>
          <KV k="Servicios de pago">Ninguno</KV>
        </dl>
      </Section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        confirmLabel="Restablecer"
        title="Restablecer datos de ejemplo"
        message="Se restaurarán agentes, workflows, ejecuciones, integraciones y evaluaciones de ejemplo. Tus conversaciones y cuentas no se tocan."
        onConfirm={() => {
          ;[agentsService, workflowsService, runsService, integrationsService, datasetsService, evalRunsService].forEach((s) => s.reset())
          setConfirmReset(false)
          notify('Datos de ejemplo restablecidos.')
        }}
      />
    </div>
  )
}

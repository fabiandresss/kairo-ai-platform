import { useCallback, useMemo, useState, type FormEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { ArrowLeft, Bot, CircleDot, Flag, GitBranch, Play, Plus, Save, Trash2, Wrench } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { TextArea, TextInput } from '../components/ui/Field'
import { ConfirmDialog, Modal } from '../components/ui/Overlay'
import { Badge, EmptyState, Notice, PageHeader, SkeletonList } from '../components/ui/Misc'
import { useToast } from '../context/ToastContext'
import { useAsyncList } from '../lib/useAsync'
import { cn, timeAgo, uid } from '../lib/utils'
import { agentsService, workflowsService } from '../services'
import type { Workflow, WorkflowNodeData } from '../types'

type KNode = Node<WorkflowNodeData, 'kairo'>

const kindIcon = { input: CircleDot, agent: Bot, tool: Wrench, output: Flag }
const kindLabel = { input: 'Entrada', agent: 'Agente', tool: 'Herramienta', output: 'Salida' }

function KairoNode({ data, selected }: NodeProps<KNode>) {
  const Icon = kindIcon[data.kind]
  return (
    <div
      className={cn(
        'min-w-[160px] rounded-lg border bg-surface px-3.5 py-3 shadow-[var(--shadow-card)] transition-colors',
        selected ? 'border-accent ring-2 ring-accent/30' : 'border-line',
      )}
    >
      {data.kind !== 'input' && <Handle type="target" position={Position.Left} />}
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-fg">
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <div>
          <p className="t-label !text-[10px]">{kindLabel[data.kind]}</p>
          <p className={cn('text-[13px] font-medium', data.kind === 'tool' && 'mono !text-[12.5px]')}>{data.label}</p>
        </div>
      </div>
      {data.kind !== 'output' && <Handle type="source" position={Position.Right} />}
    </div>
  )
}
const nodeTypes = { kairo: KairoNode }

function Editor({ workflow, onBack, onSaved }: { workflow: Workflow; onBack: () => void; onSaved: () => void }) {
  const { notify } = useToast()
  const { data: agents } = useAsyncList(() => agentsService.list())
  const [nodes, setNodes, onNodesChange] = useNodesState<KNode>(workflow.graph.nodes as KNode[])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(workflow.graph.edges)
  const [name, setName] = useState(workflow.name)
  const [status, setStatus] = useState(workflow.status)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const selected = nodes.find((n) => n.selected)

  const onConnect = useCallback(
    (c: Connection) => {
      setEdges((e) => addEdge({ ...c, animated: false }, e))
      setDirty(true)
    },
    [setEdges],
  )

  const addNode = (data: WorkflowNodeData) => {
    const id = uid('n')
    const x = 80 + (nodes.length % 5) * 40
    const y = 60 + (nodes.length % 4) * 70
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id, type: 'kairo', position: { x, y }, data, selected: true } as KNode])
    setDirty(true)
  }

  const patchSelected = (patch: Partial<WorkflowNodeData>) => {
    if (!selected) return
    setNodes((ns) => ns.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n)))
    setDirty(true)
  }
  const removeSelected = () => {
    if (!selected) return
    setNodes((ns) => ns.filter((n) => n.id !== selected.id))
    setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id))
    setDirty(true)
  }

  const save = async (nextStatus = status) => {
    if (!name.trim()) return notify('El workflow necesita un nombre.', 'error')
    setSaving(true)
    await workflowsService.update(workflow.id, {
      name: name.trim(),
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      graph: {
        nodes: nodes.map((n) => ({ id: n.id, type: 'kairo', position: n.position, data: n.data })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      },
    })
    setStatus(nextStatus)
    setDirty(false)
    setSaving(false)
    notify('Workflow guardado.')
    onSaved()
  }

  const run = () => {
    const issues: string[] = []
    if (!nodes.some((n) => n.data.kind === 'input')) issues.push('falta un nodo de entrada')
    if (!nodes.some((n) => n.data.kind === 'output')) issues.push('falta un nodo de salida')
    if (issues.length) return notify(`No se puede validar: ${issues.join(' y ')}.`, 'error')
    notify('Estructura válida. El motor de ejecución (LangGraph) aún no está conectado: no se ejecutó nada.', 'info')
  }

  const toolNames = ['web.search', 'fs.read', 'py.sandbox']

  return (
    <div className="flex min-h-full flex-col gap-3 px-3 pb-3 lg:px-0 xl:h-full">
      <div className="card flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={onBack}>Workflows</Button>
        <input
          aria-label="Nombre del workflow"
          value={name}
          onChange={(e) => { setName(e.target.value); setDirty(true) }}
          className="min-w-32 flex-1 basis-40 rounded-full bg-transparent px-3 py-1.5 text-[15px] font-semibold tracking-tight outline-none hover:bg-surface-2 focus:bg-surface-2"
        />
        <Badge tone={status === 'active' ? 'success' : 'neutral'}>{status === 'active' ? 'Activo' : 'Borrador'}</Badge>
        {dirty && <span className="text-xs text-fg-3">Cambios sin guardar</span>}
        <Button icon={<Save size={15} />} onClick={() => save()} loading={saving}>Guardar</Button>
        <Button onClick={() => save(status === 'active' ? 'draft' : 'active')}>{status === 'active' ? 'Pasar a borrador' : 'Activar'}</Button>
        <Button variant="primary" icon={<Play size={14} />} onClick={run}>Validar y ejecutar</Button>
      </div>

      <div className="flex flex-col gap-3 xl:min-h-0 xl:flex-1 xl:flex-row">
        <aside className="card order-2 shrink-0 space-y-5 overflow-y-auto p-4 xl:order-1 xl:w-56" aria-label="Paleta de nodos">
          <section>
            <h3 className="t-label mb-2">Entrada / salida</h3>
            <div className="flex flex-wrap gap-1.5 xl:flex-col">
              <Button size="sm" icon={<CircleDot size={14} />} onClick={() => addNode({ kind: 'input', label: 'Entrada' })}>Entrada</Button>
              <Button size="sm" icon={<Flag size={14} />} onClick={() => addNode({ kind: 'output', label: 'Salida' })}>Salida</Button>
            </div>
          </section>
          <section>
            <h3 className="t-label mb-2">Agentes</h3>
            <div className="flex flex-wrap gap-1.5 xl:flex-col">
              {agents.map((a) => (
                <Button key={a.id} size="sm" icon={<Bot size={14} />} onClick={() => addNode({ kind: 'agent', label: a.name, ref: a.id })}>{a.name}</Button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="t-label mb-2">Herramientas</h3>
            <div className="flex flex-wrap gap-1.5 xl:flex-col">
              {toolNames.map((t) => (
                <Button key={t} size="sm" icon={<Wrench size={14} />} onClick={() => addNode({ kind: 'tool', label: t, ref: t })}><span className="mono">{t}</span></Button>
              ))}
            </div>
          </section>
        </aside>

        <div className="card order-1 h-[460px] shrink-0 overflow-hidden xl:order-2 xl:h-auto xl:flex-1" role="region" aria-label="Lienzo del workflow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={(c) => { onNodesChange(c); if (c.some((x) => x.type === 'position' || x.type === 'remove')) setDirty(true) }}
            onEdgesChange={(c) => { onEdgesChange(c); if (c.some((x) => x.type === 'remove')) setDirty(true) }}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="var(--grid-dot)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <aside className="card order-3 w-full shrink-0 overflow-y-auto p-4 xl:w-64" aria-label="Configuración del nodo">
          {selected ? (
            <div className="space-y-4">
              <h3 className="t-label text-fg">Nodo seleccionado</h3>
              <TextInput label="Etiqueta" value={selected.data.label} onChange={(e) => patchSelected({ label: e.target.value })} />
              <TextArea label="Nota" optional rows={3} value={selected.data.note ?? ''} onChange={(e) => patchSelected({ note: e.target.value })} />
              <p className="text-xs text-fg-3">Tipo: {kindLabel[selected.data.kind]}</p>
              <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={removeSelected}>Eliminar nodo</Button>
            </div>
          ) : (
            <p className="text-[13px] text-fg-3">Selecciona un nodo para editarlo. Arrastra desde un punto de conexión para unir nodos.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

export default function Workflows() {
  const { data, loading, error, reload } = useAsyncList(() => workflowsService.list())
  const { notify } = useToast()
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Workflow | null>(null)
  const [nm, setNm] = useState('')
  const [ds, setDs] = useState('')
  const [nmErr, setNmErr] = useState('')

  const current = useMemo(() => data.find((w) => w.id === openId), [data, openId])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (nm.trim().length < 2) return setNmErr('El nombre debe tener al menos 2 caracteres.')
    const w = await workflowsService.create({
      name: nm.trim(),
      description: ds.trim(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
      graph: {
        nodes: [
          { id: 'n1', type: 'kairo', position: { x: 0, y: 80 }, data: { kind: 'input', label: 'Entrada' } },
          { id: 'n2', type: 'kairo', position: { x: 300, y: 80 }, data: { kind: 'output', label: 'Salida' } },
        ],
        edges: [],
      },
    })
    setCreating(false)
    setNm('')
    setDs('')
    setNmErr('')
    await reload()
    setOpenId(w.id)
    notify('Workflow creado como borrador.')
  }

  if (current)
    return (
      <ReactFlowProvider>
        <Editor key={current.id} workflow={current} onBack={() => setOpenId(null)} onSaved={reload} />
      </ReactFlowProvider>
    )

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-3">
      <PageHeader
        eyebrow="Workspace"
        title="Workflows."
        muted="Diseña, conecta, valida."
        description="Diseña flujos de agentes y herramientas en un lienzo de nodos."
        actions={<Button variant="primary" icon={<Plus size={15} />} onClick={() => setCreating(true)}>Nuevo workflow</Button>}
      />
      <div className="mb-4"><Notice><span>El editor es visual: guarda la estructura del flujo, pero todavía no hay motor de ejecución conectado.</span></Notice></div>
      {loading ? <SkeletonList /> : error ? <p role="alert" className="text-danger">{error}</p> : data.length === 0 ? (
        <EmptyState icon={<GitBranch size={20} />} title="Sin workflows" action={<Button variant="primary" onClick={() => setCreating(true)}>Crear workflow</Button>}>Crea un flujo para coordinar agentes y herramientas.</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.map((w) => (
            <li key={w.id} className="card group flex items-center gap-3 p-5">
              <button onClick={() => setOpenId(w.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2"><GitBranch size={18} strokeWidth={1.75} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="t-heading">{w.name}</span><Badge tone={w.status === 'active' ? 'success' : 'neutral'}>{w.status === 'active' ? 'Activo' : 'Borrador'}</Badge></span>
                  <span className="mt-1 line-clamp-2 block text-[13px] text-fg-2">{w.description || 'Sin descripción'}</span>
                </span>
                <span className="mono hidden text-[11px] text-fg-3 sm:block">{w.graph.nodes.length} nodos<br />{timeAgo(w.updatedAt)}</span>
              </button>
              <Button size="sm" variant="ghost" aria-label={`Eliminar ${w.name}`} onClick={() => setDeleting(w)}><Trash2 size={15} /></Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo workflow" description="Empezará como borrador con un nodo de entrada y uno de salida.">
        <form onSubmit={create} noValidate className="space-y-4">
          <TextInput label="Nombre" value={nm} onChange={(e) => setNm(e.target.value)} error={nmErr} data-autofocus />
          <TextArea label="Descripción" optional rows={3} value={ds} onChange={(e) => setDs(e.target.value)} />
          <div className="flex justify-end gap-2"><Button onClick={() => setCreating(false)}>Cancelar</Button><Button type="submit" variant="primary">Crear</Button></div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar workflow"
        message={`Se eliminará «${deleting?.name}».`}
        onConfirm={async () => { if (deleting) { await workflowsService.remove(deleting.id); setDeleting(null); notify('Workflow eliminado.', 'info'); reload() } }}
      />
    </div>
  )
}

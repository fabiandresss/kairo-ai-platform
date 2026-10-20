/**
 * DATOS DE EJEMPLO — todo lo de este archivo es ficticio.
 * Los servicios en src/services lo usan como semilla local mientras no exista backend.
 */
import type { Agent, EvalDataset, EvalRun, Integration, Run, TraceEvent, Workflow } from '../types'
import { ago } from '../lib/utils'

export const seedAgents: Agent[] = [
  {
    id: 'agt_researcher',
    name: 'Researcher',
    role: 'researcher',
    description: 'Busca, filtra y resume información de fuentes locales y herramientas conectadas.',
    status: 'active',
    model: 'llama3.1:8b',
    temperature: 0.3,
    instructions:
      'Reúne información relevante con la herramienta de búsqueda. Cita la fuente de cada afirmación y descarta resultados duplicados.',
    tools: ['web.search', 'fs.read'],
    capabilities: ['Búsqueda', 'Síntesis de fuentes', 'Citas'],
  },
  {
    id: 'agt_analyst',
    name: 'Analyst',
    role: 'analyst',
    description: 'Analiza datos, detecta patrones y cuantifica hallazgos.',
    status: 'active',
    model: 'qwen2.5:7b',
    temperature: 0.2,
    instructions: 'Calcula métricas con precisión, señala anomalías y explica la metodología empleada.',
    tools: ['py.sandbox', 'fs.read'],
    capabilities: ['Estadística', 'Detección de anomalías', 'Comparativas'],
  },
  {
    id: 'agt_verifier',
    name: 'Verifier',
    role: 'verifier',
    description: 'Contrasta los resultados con las fuentes y detecta inconsistencias.',
    status: 'active',
    model: 'llama3.1:8b',
    temperature: 0.0,
    instructions: 'Verifica cada afirmación contra la evidencia aportada. Marca lo que no puedas confirmar.',
    tools: ['web.search'],
    capabilities: ['Contraste de fuentes', 'Detección de contradicciones'],
  },
  {
    id: 'agt_writer',
    name: 'Writer',
    role: 'writer',
    description: 'Redacta el informe final de forma estructurada y clara.',
    status: 'idle',
    model: 'mistral:7b',
    temperature: 0.6,
    instructions: 'Redacta con estructura clara, sin añadir datos que no estén en los resultados verificados.',
    tools: [],
    capabilities: ['Informes', 'Resúmenes ejecutivos'],
  },
]

export const seedWorkflows: Workflow[] = [
  {
    id: 'wf_report',
    name: 'Informe técnico verificado',
    description: 'Investiga un tema, verifica los hallazgos y redacta un informe.',
    status: 'active',
    updatedAt: ago(180),
    graph: {
      nodes: [
        { id: 'n1', type: 'kairo', position: { x: 0, y: 120 }, data: { kind: 'input', label: 'Solicitud' } },
        { id: 'n2', type: 'kairo', position: { x: 240, y: 40 }, data: { kind: 'agent', label: 'Researcher', ref: 'agt_researcher' } },
        { id: 'n3', type: 'kairo', position: { x: 0, y: 250 }, data: { kind: 'tool', label: 'web.search', ref: 'web.search' } },
        { id: 'n4', type: 'kairo', position: { x: 500, y: 120 }, data: { kind: 'agent', label: 'Verifier', ref: 'agt_verifier' } },
        { id: 'n5', type: 'kairo', position: { x: 740, y: 120 }, data: { kind: 'agent', label: 'Writer', ref: 'agt_writer' } },
        { id: 'n6', type: 'kairo', position: { x: 980, y: 120 }, data: { kind: 'output', label: 'Respuesta final' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n3', target: 'n2' },
        { id: 'e3', source: 'n2', target: 'n4' },
        { id: 'e4', source: 'n4', target: 'n5' },
        { id: 'e5', source: 'n5', target: 'n6' },
      ],
    },
  },
  {
    id: 'wf_anomaly',
    name: 'Detección de anomalías',
    description: 'Analiza un conjunto de datos y reporta valores atípicos.',
    status: 'draft',
    updatedAt: ago(60 * 30),
    graph: {
      nodes: [
        { id: 'n1', type: 'kairo', position: { x: 0, y: 80 }, data: { kind: 'input', label: 'Dataset' } },
        { id: 'n2', type: 'kairo', position: { x: 250, y: 80 }, data: { kind: 'agent', label: 'Analyst', ref: 'agt_analyst' } },
        { id: 'n3', type: 'kairo', position: { x: 500, y: 80 }, data: { kind: 'output', label: 'Reporte' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
]

const ev = (
  id: string,
  at: number,
  durationMs: number,
  type: TraceEvent['type'],
  actor: string,
  title: string,
  status: TraceEvent['status'] = 'success',
  input?: string,
  output?: string,
): TraceEvent => ({ id, at, durationMs, type, actor, title, status, input, output })

export const seedRuns: Run[] = [
  {
    id: 'run_8f3a21',
    title: 'Comparar bases de datos vectoriales open-source',
    source: 'chat',
    status: 'success',
    startedAt: ago(35),
    durationMs: 48200,
    model: 'llama3.1:8b',
    tokens: 6120,
    simulated: true,
    events: [
      ev('e1', 0, 1800, 'plan', 'Orchestrator', 'Plan en 4 pasos', 'success', 'Comparar bases de datos vectoriales open-source', 'Researcher → Analyst → Verifier → Writer'),
      ev('e2', 1800, 21000, 'agent', 'Researcher', 'Recopilar información de 5 proyectos', 'success'),
      ev('e3', 4200, 6400, 'tool', 'web.search', 'Búsqueda: "vector database benchmark"', 'success', 'query="vector database benchmark"', '12 resultados'),
      ev('e4', 22800, 11500, 'agent', 'Analyst', 'Tabla comparativa de rendimiento y licencia', 'success'),
      ev('e5', 34300, 9800, 'verify', 'Verifier', 'Contrastar cifras con las fuentes', 'success', undefined, '1 observación: cifra de Qdrant sin fuente primaria'),
      ev('e6', 44100, 4100, 'final', 'Writer', 'Redactar informe final', 'success'),
    ],
  },
  {
    id: 'run_c92b10',
    title: 'Analizar anomalías en logs de servidor',
    source: 'workflow',
    workflow: 'Detección de anomalías',
    status: 'failed',
    startedAt: ago(140),
    durationMs: 12400,
    model: 'qwen2.5:7b',
    tokens: 1890,
    simulated: true,
    events: [
      ev('e1', 0, 1500, 'plan', 'Orchestrator', 'Plan en 2 pasos', 'success'),
      ev('e2', 1500, 9800, 'agent', 'Analyst', 'Procesar logs.csv', 'failed'),
      ev('e3', 4000, 3200, 'error', 'py.sandbox', 'MemoryError al cargar 2.1 GB', 'failed', 'fs.read("logs.csv")', 'MemoryError: no se pudo asignar memoria'),
    ],
  },
  {
    id: 'run_41d7e8',
    title: 'Resumen de novedades de LangGraph',
    source: 'chat',
    status: 'running',
    startedAt: ago(1),
    durationMs: 9100,
    model: 'llama3.1:8b',
    tokens: 940,
    simulated: true,
    events: [
      ev('e1', 0, 1200, 'plan', 'Orchestrator', 'Plan en 3 pasos'),
      ev('e2', 1200, 7900, 'agent', 'Researcher', 'Buscando versiones recientes', 'running'),
    ],
  },
  {
    id: 'run_7be551',
    title: 'Informe técnico verificado',
    source: 'workflow',
    workflow: 'Informe técnico verificado',
    status: 'cancelled',
    startedAt: ago(60 * 26),
    durationMs: 5300,
    model: 'llama3.1:8b',
    tokens: 410,
    simulated: true,
    events: [
      ev('e1', 0, 1100, 'plan', 'Orchestrator', 'Plan en 4 pasos'),
      ev('e2', 1100, 4200, 'agent', 'Researcher', 'Cancelado por el usuario', 'failed'),
    ],
  },
]

export const seedIntegrations: Integration[] = [
  {
    id: 'int_ollama',
    name: 'Ollama',
    description: 'Servidor local de modelos open-source.',
    kind: 'local',
    endpoint: 'http://localhost:11434',
    enabled: true,
    state: 'untested',
    tools: ['generate', 'chat', 'embeddings'],
  },
  {
    id: 'int_fs',
    name: 'Filesystem MCP',
    description: 'Servidor MCP para leer archivos de una carpeta permitida.',
    kind: 'mcp',
    endpoint: 'stdio://npx @modelcontextprotocol/server-filesystem ./workspace',
    enabled: false,
    state: 'untested',
    tools: ['fs.read', 'fs.list'],
  },
  {
    id: 'int_search',
    name: 'SearXNG',
    description: 'Metabuscador auto-alojado para la herramienta web.search.',
    kind: 'http',
    endpoint: 'http://localhost:8080',
    secretHint: '••••••••',
    enabled: false,
    state: 'untested',
    tools: ['web.search'],
  },
]

const cases = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `c${i + 1}`,
    prompt: `Caso ${i + 1}: pregunta de verificación`,
    expected: 'Respuesta consistente con la fuente',
  }))

export const seedDatasets: EvalDataset[] = [
  { id: 'ds_facts', name: 'Verificación de hechos', description: 'Afirmaciones con fuente conocida.', cases: cases(20) },
  { id: 'ds_data', name: 'Análisis de datos', description: 'Cálculos y detección de outliers.', cases: cases(12) },
]

export const seedEvalRuns: EvalRun[] = [
  { id: 'ev_01', datasetId: 'ds_facts', target: 'Verifier · llama3.1:8b', at: ago(60 * 5), passed: 17, failed: 3, avgLatencyMs: 4200, accuracy: 0.85, results: [] },
  { id: 'ev_02', datasetId: 'ds_facts', target: 'Verifier · mistral:7b', at: ago(60 * 30), passed: 15, failed: 5, avgLatencyMs: 3600, accuracy: 0.75, results: [] },
  { id: 'ev_03', datasetId: 'ds_data', target: 'Analyst · qwen2.5:7b', at: ago(60 * 50), passed: 10, failed: 2, avgLatencyMs: 6100, accuracy: 0.83, results: [] },
].map((r) => ({
  ...r,
  results: Array.from({ length: r.passed + r.failed }, (_, i) => ({
    caseId: `c${i + 1}`,
    passed: i < r.passed,
    note: i < r.passed ? 'Coincide con lo esperado' : 'Afirmación sin respaldo en la fuente',
  })),
}))

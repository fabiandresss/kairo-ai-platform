export type AgentRole = 'researcher' | 'analyst' | 'verifier' | 'writer' | 'custom'
export type AgentStatus = 'active' | 'idle' | 'disabled'

export interface Agent {
  id: string
  name: string
  role: AgentRole
  description: string
  status: AgentStatus
  model: string
  temperature: number
  instructions: string
  tools: string[]
  capabilities: string[]
}

export type WorkflowStatus = 'draft' | 'active'
export interface WorkflowNodeData extends Record<string, unknown> {
  kind: 'input' | 'agent' | 'tool' | 'output'
  label: string
  ref?: string
  note?: string
}
export interface WorkflowGraph {
  nodes: { id: string; position: { x: number; y: number }; data: WorkflowNodeData; type?: string }[]
  edges: { id: string; source: string; target: string }[]
}
export interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  updatedAt: string
  graph: WorkflowGraph
}

export type RunStatus = 'success' | 'running' | 'failed' | 'cancelled'
export interface TraceEvent {
  id: string
  at: number // ms offset from run start
  durationMs: number
  type: 'plan' | 'agent' | 'tool' | 'verify' | 'error' | 'final'
  actor: string
  title: string
  input?: string
  output?: string
  status: 'success' | 'running' | 'failed'
}
export interface Run {
  id: string
  title: string
  source: 'chat' | 'workflow'
  workflow?: string
  status: RunStatus
  startedAt: string
  durationMs: number
  model: string
  tokens: number
  events: TraceEvent[]
  simulated: boolean
}

export type IntegrationKind = 'mcp' | 'local' | 'http'
export type ConnectionState = 'connected' | 'disconnected' | 'error' | 'untested'
export interface Integration {
  id: string
  name: string
  description: string
  kind: IntegrationKind
  endpoint: string
  secretHint?: string // masked, never the full secret
  enabled: boolean
  state: ConnectionState
  tools: string[]
  lastError?: string
}

export interface EvalCase {
  id: string
  prompt: string
  expected: string
  passed?: boolean
  score?: number
}
export interface EvalDataset {
  id: string
  name: string
  description: string
  cases: EvalCase[]
}
export interface EvalRun {
  id: string
  datasetId: string
  target: string
  at: string
  passed: number
  failed: number
  avgLatencyMs: number
  accuracy: number
  results: { caseId: string; passed: boolean; note: string }[]
}

export type StepState = 'pending' | 'running' | 'done' | 'error'
export interface ChatStep {
  id: string
  agent: string
  label: string
  state: StepState
  detail?: string
  tools?: { name: string; summary: string }[]
  durationMs?: number
}
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  steps?: ChatStep[]
  status?: 'streaming' | 'done' | 'error'
  simulated?: boolean
}
export interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface User {
  id: string
  name: string
  email: string
}

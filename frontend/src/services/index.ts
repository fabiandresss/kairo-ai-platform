import { seedAgents, seedDatasets, seedEvalRuns, seedIntegrations, seedRuns, seedWorkflows } from '../data/seed'
import type { Agent, EvalDataset, EvalRun, Integration, Run, Workflow } from '../types'
import { createCollection } from './collection'

export const agentsService = createCollection<Agent>('agents', seedAgents, 'agt')
export const workflowsService = createCollection<Workflow>('workflows', seedWorkflows, 'wf')
export const runsService = createCollection<Run>('runs', seedRuns, 'run')
export const integrationsService = createCollection<Integration>('integrations', seedIntegrations, 'int')
export const datasetsService = createCollection<EvalDataset>('datasets', seedDatasets, 'ds')
export const evalRunsService = createCollection<EvalRun>('evalruns', seedEvalRuns, 'ev')

export * from './auth'
export * from './ollama'
export * from './chat'

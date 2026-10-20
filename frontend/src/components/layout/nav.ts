import { Bot, FlaskConical, GitBranch, MessageSquare, Plug, ScrollText, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  hint: string
}
export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/chat', label: 'Chat', icon: MessageSquare, hint: 'Conversa con el orquestador' },
      { to: '/agents', label: 'Agents', icon: Bot, hint: 'Agentes especializados' },
      { to: '/workflows', label: 'Workflows', icon: GitBranch, hint: 'Editor visual de flujos' },
    ],
  },
  {
    title: 'Observability',
    items: [
      { to: '/runs', label: 'Runs & Traces', icon: ScrollText, hint: 'Historial y trazas' },
      { to: '/evaluations', label: 'Evaluations', icon: FlaskConical, hint: 'Calidad de agentes y flujos' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/integrations', label: 'Integrations', icon: Plug, hint: 'MCP y herramientas' },
      { to: '/settings', label: 'Settings', icon: Settings, hint: 'Preferencias y modelos locales' },
    ],
  },
]

export const ALL_NAV = NAV.flatMap((g) => g.items)

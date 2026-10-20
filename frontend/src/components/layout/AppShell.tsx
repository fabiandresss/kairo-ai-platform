import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronsUpDown, LayoutGrid, LogOut, Plus, Monitor, Moon, Search, Settings, Sun, X } from 'lucide-react'
import { KairoLogo } from '../brand/KairoMark'
import { IconButton } from '../ui/Button'
import { Dropdown } from '../ui/Misc'
import { CommandMenu } from './CommandMenu'
import { ALL_NAV, NAV } from './nav'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-3">
      {NAV.map((g) => (
        <div key={g.title} className="mb-5 [@media(max-height:700px)]:mb-3">
          <p className="t-label px-3 pb-2">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-10 items-center gap-3 rounded-full px-3 [@media(max-height:700px)]:h-8 text-[13.5px] transition-colors',
                      isActive ? 'bg-fg font-medium text-background shadow-[0_10px_24px_-14px_var(--foreground)]' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <it.icon size={16} strokeWidth={1.75} aria-hidden />
                      <span className="flex-1">{it.label}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function ThemeMenu() {
  const { pref, theme, setPref } = useTheme()
  const Icon = theme === 'dark' ? Moon : Sun
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <IconButton label="Cambiar tema" onClick={toggle}>
          <Icon size={16} />
        </IconButton>
      )}
      items={[
        { label: `Claro${pref === 'light' ? ' ✓' : ''}`, icon: <Sun size={14} />, onSelect: () => setPref('light') },
        { label: `Oscuro${pref === 'dark' ? ' ✓' : ''}`, icon: <Moon size={14} />, onSelect: () => setPref('dark') },
        { label: `Sistema${pref === 'system' ? ' ✓' : ''}`, icon: <Monitor size={14} />, onSelect: () => setPref('system') },
      ]}
    />
  )
}

function AccountMenu() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="p-3">
      <Dropdown
        up
        align="left"
        trigger={({ toggle }) => (
          <button
            onClick={toggle}
            aria-haspopup="menu"
            aria-label="Menú de cuenta"
            className="inset flex w-full items-center gap-2.5 rounded-full p-1.5 pr-3 text-left transition-colors hover:bg-surface-2 hover:brightness-95"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg">{initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{user?.name}</span>
              <span className="block truncate text-xs text-fg-3">{user?.email}</span>
            </span>
            <ChevronsUpDown size={14} className="text-fg-3" aria-hidden />
          </button>
        )}
        items={[
          { label: 'Preferencias', icon: <Settings size={14} />, onSelect: () => nav('/settings') },
          'sep',
          {
            label: 'Cerrar sesión',
            icon: <LogOut size={14} />,
            onSelect: () => {
              logout()
              nav('/login')
            },
          },
        ]}
      />
    </div>
  )
}

/** Barra inferior móvil con FAB central (crear) — patrón FabTabBar. */
function FabTabBar({ onMore }: { onMore: () => void }) {
  const nav = useNavigate()
  const left = [ALL_NAV[0], ALL_NAV[1]]
  const right = [ALL_NAV[3]]
  const item = (it: (typeof ALL_NAV)[number]) => (
    <NavLink
      key={it.to}
      to={it.to}
      className={({ isActive }) =>
        cn('press flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-medium', isActive ? 'text-fg' : 'text-fg-3 hover:text-fg')
      }
    >
      {({ isActive }) => (
        <>
          <it.icon size={20} strokeWidth={1.6} className={isActive ? 'text-accent-text' : ''} aria-hidden />
          <span className="max-w-full truncate">{it.label.split(' ')[0]}</span>
          <span className={cn('h-1 w-1 rounded-full', isActive ? 'bg-accent' : 'bg-transparent')} aria-hidden />
        </>
      )}
    </NavLink>
  )
  return (
    <nav aria-label="Acceso rápido" className="glass fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 rounded-xl px-2 shadow-[var(--shadow)] ring-1 ring-line lg:hidden">
      {left.map(item)}
      <button
        onClick={() => nav('/chat?new=1')}
        aria-label="Nueva conversación"
        className="press -mt-7 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-accent-fg shadow-[0_12px_24px_-10px_var(--accent)] ring-4 ring-background"
      >
        <Plus size={24} strokeWidth={2.2} aria-hidden />
      </button>
      {right.map(item)}
      <button
        onClick={onMore}
        aria-haspopup="dialog"
        className="press flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium text-fg-3 hover:text-fg"
      >
        <LayoutGrid size={20} strokeWidth={1.6} aria-hidden />
        <span>Más</span>
        <span className="h-1 w-1" aria-hidden />
      </button>
    </nav>
  )
}

export default function AppShell() {
  const [mobileNav, setMobileNav] = useState(false)
  const [cmd, setCmd] = useState(false)
  const loc = useLocation()
  const current = ALL_NAV.find((n) => loc.pathname.startsWith(n.to))

  useEffect(() => setMobileNav(false), [loc.pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmd((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <KairoLogo size={24} />
      </div>
      <SidebarNav onNavigate={() => setMobileNav(false)} />
      <AccountMenu />
    </div>
  )

  return (
    <div className="flex h-full gap-0 bg-background lg:gap-3 lg:p-3">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        Saltar al contenido
      </a>

      <aside className="card hidden w-64 shrink-0 overflow-hidden lg:block">{sidebar}</aside>

      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setMobileNav(false)} aria-hidden />
          <aside role="dialog" aria-modal="true" aria-label="Navegación" className="card anim-pop absolute inset-y-3 left-3 w-72 max-w-[85vw] overflow-hidden">
            <div className="absolute top-4 right-3 z-10">
              <IconButton label="Cerrar menú" onClick={() => setMobileNav(false)}>
                <X size={16} />
              </IconButton>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 px-4 sm:px-6 lg:px-3">
          <KairoLogo size={22} showName={false} className="lg:hidden" />
          <div className="min-w-0 flex-1">
            <p className="t-label">Kairo / <span className="text-fg">{current?.label ?? 'Kairo'}</span></p>
          </div>
          <button
            onClick={() => setCmd(true)}
            className="chip hidden h-10 items-center gap-2 px-4 text-[13px] text-fg-3 transition-colors hover:border-line-strong hover:text-fg sm:inline-flex"
          >
            <Search size={14} aria-hidden /> Buscar o ejecutar
            <kbd className="mono rounded-full bg-surface-2 px-2 text-[11px]">Ctrl K</kbd>
          </button>
          <IconButton label="Buscar o ejecutar" className="sm:hidden" onClick={() => setCmd(true)}>
            <Search size={16} />
          </IconButton>
          <ThemeMenu />
        </header>

        <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none max-lg:pb-28">
          <Outlet />
        </main>
      </div>

      <FabTabBar onMore={() => setMobileNav(true)} />

      <CommandMenu open={cmd} onClose={() => setCmd(false)} />
    </div>
  )
}

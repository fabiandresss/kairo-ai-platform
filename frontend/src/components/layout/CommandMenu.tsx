import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Moon, Plus, Search, Sun } from 'lucide-react'
import { ALL_NAV } from './nav'
import { useTheme } from '../../context/ThemeContext'

interface Cmd {
  id: string
  label: string
  group: string
  icon: React.ReactNode
  run: () => void
}

export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const { theme, toggle } = useTheme()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const cmds = useMemo<Cmd[]>(
    () => [
      { id: 'new-chat', label: 'Nueva conversación', group: 'Acciones', icon: <Plus size={15} />, run: () => nav('/chat?new=1') },
      {
        id: 'theme',
        label: theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
        group: 'Acciones',
        icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
        run: toggle,
      },
      ...ALL_NAV.map((n) => ({ id: n.to, label: `Ir a ${n.label}`, group: 'Navegación', icon: <n.icon size={15} />, run: () => nav(n.to) })),
    ],
    [nav, theme, toggle],
  )
  const results = cmds.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => input.current?.focus(), 0)
    }
  }, [open])

  if (!open) return null
  const choose = (c?: Cmd) => {
    if (!c) return
    onClose()
    c.run()
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-start justify-items-center p-4 pt-[14vh]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de comandos"
        className="anim-pop relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow)]"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIdx((i) => Math.min(i + 1, results.length - 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setIdx((i) => Math.max(i - 1, 0))
          }
          if (e.key === 'Enter') choose(results[idx])
        }}
      >
        <div className="m-2 flex items-center gap-2.5 rounded-full bg-surface-2 px-4">
          <Search size={16} className="text-fg-3" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setIdx(0)
            }}
            placeholder="Escribe un comando o busca una sección…"
            aria-label="Buscar comando"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-3"
          />
        </div>
        <ul role="listbox" aria-label="Resultados" className="max-h-72 overflow-y-auto p-2 pt-0">
          {results.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-fg-3">Sin resultados</li>}
          {results.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === idx}
              onMouseEnter={() => setIdx(i)}
              onClick={() => choose(c)}
              className={`flex cursor-pointer items-center gap-3 rounded-full px-4 py-2.5 text-[13px] ${i === idx ? 'bg-surface-2' : ''}`}
            >
              <span className="text-fg-2">{c.icon}</span>
              <span className="flex-1">{c.label}</span>
              <span className="t-label">{c.group}</span>
              {i === idx && <CornerDownLeft size={13} className="text-fg-3" />}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}

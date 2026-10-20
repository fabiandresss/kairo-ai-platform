import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Info, Moon, Sun } from 'lucide-react'
import { KairoLogo } from '../../components/brand/KairoMark'
import { OrchestrationArt } from '../../components/brand/OrchestrationArt'
import { IconButton } from '../../components/ui/Button'
import { useTheme } from '../../context/ThemeContext'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { theme, toggle } = useTheme()
  return (
    <div className="grid min-h-full bg-background lg:grid-cols-[minmax(440px,1fr)_1.15fr] lg:gap-3 lg:p-3">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-12 lg:min-h-0 lg:px-10">
        <div className="flex items-center justify-between">
          <Link to="/login" aria-label="Kairo — inicio">
            <KairoLogo size={26} />
          </Link>
          <IconButton label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} onClick={toggle}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          <div className="card p-6 sm:p-8">
            <p className="t-label mb-3">Acceso · Kairo</p>
            <h1 className="t-display">{title}</h1>
            {subtitle && <p className="mt-2 text-[14px] text-fg-2">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
        </div>

        <p className="mx-auto flex max-w-[420px] items-start gap-2 text-xs text-fg-3">
          <Info size={14} className="mt-px shrink-0" aria-hidden />
          Modo demostración: las cuentas se guardan únicamente en este navegador. No hay servidor ni seguridad de producción.
        </p>
      </div>

      <aside className="card relative hidden overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <p className="t-label inline-flex w-fit rounded-full bg-surface-2 px-3 py-1.5">Multi-agent · Local-first · Open source</p>
          <div>
            <OrchestrationArt className="mx-auto h-auto w-full max-w-[560px]" />
          </div>
          <div>
            <p className="text-[34px] leading-[1.1] font-semibold tracking-[-0.035em]">
              Intelligence,
              <br />
              <span className="text-accent-text">orchestrated.</span>
            </p>
            <p className="mt-3 max-w-sm text-[13.5px] text-fg-2">Varios agentes, un objetivo. Ejecutados en tu máquina, con cada paso a la vista.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

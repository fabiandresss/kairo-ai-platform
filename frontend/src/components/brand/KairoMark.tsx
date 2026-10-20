import { useId } from 'react'
import { cn } from '../../lib/utils'

/**
 * Kairo symbol — a K read as convergence: one stem (the objective) and two
 * routes (agents) meeting at an orange junction (the orchestrator).
 * Strokes follow currentColor so it adapts to either theme; the junction is
 * always brand orange.
 */
export function KairoMark({ size = 28, className, title = 'Kairo' }: { size?: number; className?: string; title?: string }) {
  const id = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-labelledby={id}
      className={cn('shrink-0', className)}
    >
      <title id={id}>{title}</title>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 4.5v23" />
        <path d="M8 16 24.5 5.5" />
        <path d="M8 16 24.5 26.5" />
      </g>
      <circle cx="24.5" cy="5.5" r="2.4" fill="currentColor" />
      <circle cx="24.5" cy="26.5" r="2.4" fill="currentColor" />
      <circle cx="8" cy="16" r="3.6" fill="#FC4B08" />
    </svg>
  )
}

export function KairoLogo({ size = 26, showName = true, className }: { size?: number; showName?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-fg', className)}>
      <KairoMark size={size} />
      {showName && (
        <span className="font-semibold tracking-[-0.04em]" style={{ fontSize: size * 0.82 }}>
          kairo
        </span>
      )}
    </span>
  )
}

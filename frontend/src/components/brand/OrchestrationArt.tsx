/**
 * Original brand composition: several independent routes (agents) converge on
 * a single orange node (the orchestrated result). Pure SVG, theme-aware via
 * CSS variables. Decorative only (aria-hidden).
 */
const sources = [
  { y: 60, label: 'RESEARCH' },
  { y: 150, label: 'ANALYSIS' },
  { y: 240, label: 'VERIFY' },
  { y: 330, label: 'WRITE' },
  { y: 420, label: 'TOOLS' },
]

export function OrchestrationArt({ className }: { className?: string }) {
  const cx = 360
  const cy = 240
  return (
    <svg viewBox="0 0 520 480" className={className} aria-hidden fill="none" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="art-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--grid-dot)" />
        </pattern>
      </defs>
      <rect width="520" height="480" fill="url(#art-dots)" opacity="0.7" />

      {sources.map((s, i) => {
        const mid = 190 + i * 6
        const d = `M 40 ${s.y} H ${mid} C ${mid + 70} ${s.y}, ${cx - 90} ${cy}, ${cx} ${cy}`
        return (
          <g key={s.label}>
            <path d={d} stroke="var(--border-strong)" strokeWidth="1.5" />
            <path d={d} stroke="var(--foreground)" strokeWidth="1.5" className="flow-dash" opacity="0.5" />
            <circle cx="40" cy={s.y} r="4" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.5" />
            <text x="40" y={s.y - 12} fontFamily="var(--font-mono)" fontSize="9.5" letterSpacing="1.2" fill="var(--foreground-muted)">
              {s.label}
            </text>
          </g>
        )
      })}

      <path d={`M ${cx} ${cy} H 480`} stroke="var(--foreground)" strokeWidth="2" />
      <circle cx="480" cy={cy} r="5" fill="var(--foreground)" />
      <text x="480" y={cy - 16} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9.5" letterSpacing="1.2" fill="var(--foreground-muted)">
        RESPUESTA
      </text>

      <circle cx={cx} cy={cy} r="26" stroke="#FC4B08" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="14" fill="#FC4B08" />
    </svg>
  )
}

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)] hover:brightness-110 active:brightness-95 border border-transparent',
  secondary: 'bg-surface-2 text-fg border border-transparent hover:brightness-95',
  ghost: 'bg-transparent text-fg-2 hover:text-fg hover:bg-surface-2 border border-transparent',
  danger: 'bg-danger-soft text-danger border border-transparent hover:brightness-95',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[13px] gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, children, className, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'press inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background,filter,color,transform] disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="anim-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

export function IconButton({
  label,
  children,
  className,
  active,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'press inline-grid h-9 w-9 place-items-center rounded-full text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40',
        active && 'bg-accent-subtle text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

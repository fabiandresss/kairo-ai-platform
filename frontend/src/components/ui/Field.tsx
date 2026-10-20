import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const control =
  'w-full rounded-lg border bg-surface-2 px-4 text-[13.5px] text-fg placeholder:text-fg-3 transition-colors outline-none ' +
  'hover:border-line-strong focus:border-accent focus:bg-raised focus:ring-2 focus:ring-accent/25 disabled:opacity-50 disabled:cursor-not-allowed'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
  className?: string
}

export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId()
  const msgId = `${id}-msg`
  const describedBy = error || hint ? msgId : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="t-label">
        {label}
        {optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-fg-3">opcional</span>}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {(error || hint) && (
        <p id={msgId} role={error ? 'alert' : undefined} className={cn('text-xs', error ? 'text-danger' : 'text-fg-3')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

type InputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { label: string; hint?: string; error?: string; optional?: boolean; mono?: boolean }

export const TextInput = forwardRef<HTMLInputElement, InputBase>(function TextInput(
  { label, hint, error, optional, mono, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(control, 'h-11', mono && 'mono', invalid ? 'border-danger' : 'border-transparent')}
          {...rest}
        />
      )}
    </Field>
  )
})

export const PasswordInput = forwardRef<HTMLInputElement, InputBase>(function PasswordInput(
  { label, hint, error, optional, className, ...rest },
  ref,
) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(control, 'h-11 pr-11', invalid ? 'border-danger' : 'border-transparent')}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={show}
            className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-fg-3 hover:text-fg"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )}
    </Field>
  )
})

type TextareaBase = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string; hint?: string; error?: string; optional?: boolean }
export function TextArea({ label, hint, error, optional, className, ...rest }: TextareaBase) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(control, 'min-h-24 resize-y py-2.5 leading-relaxed', invalid ? 'border-danger' : 'border-transparent')}
          {...rest}
        />
      )}
    </Field>
  )
}

type SelectBase = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { label: string; hint?: string; error?: string; options: { value: string; label: string }[] }
export function Select({ label, hint, error, options, className, ...rest }: SelectBase) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(control, 'h-11 appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8', invalid ? 'border-danger' : 'border-transparent')}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4.5 6 8.5 10 4.5' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E\")",
          }}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-raised text-fg">
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  className,
  label = 'Buscar',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  label?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-3" aria-hidden />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(control, 'h-10 rounded-full border-transparent pr-9 pl-10 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-fg-3 hover:text-fg"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
        checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-2',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full shadow transition-transform',
          checked ? 'translate-x-5 bg-accent-fg' : 'bg-fg-2',
        )}
      />
    </button>
  )
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-fg-2 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="k-check mt-0.5"
      />
      <span>{children}</span>
    </label>
  )
}

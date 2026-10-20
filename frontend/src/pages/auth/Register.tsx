import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Circle } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { PasswordInput, TextInput } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { cn, isEmail } from '../../lib/utils'

const rules = [
  { id: 'len', label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'Una letra', test: (p: string) => /[A-Za-z]/.test(p) },
  { id: 'num', label: 'Un número', test: (p: string) => /\d/.test(p) },
]

export default function Register() {
  const { user, register } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (user) return <Navigate to="/chat" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Introduce tu nombre.'
    if (!email.trim()) next.email = 'Introduce tu correo electrónico.'
    else if (!isEmail(email)) next.email = 'El formato del correo no es válido.'
    if (!password) next.password = 'Crea una contraseña.'
    else if (!rules.every((r) => r.test(password))) next.password = 'La contraseña no cumple los requisitos.'
    if (!confirm) next.confirm = 'Confirma tu contraseña.'
    else if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password)
      setDone(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  if (done)
    return (
      <AuthLayout title="Cuenta creada" subtitle="Tu cuenta de demostración está lista.">
        <div role="status" className="space-y-5">
          <p className="flex items-start gap-3 rounded-lg bg-success-soft p-4 text-[13.5px]">
            <Check size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
            <span>
              Se guardó <strong>{email}</strong> solo en este navegador (contraseña con hash y sal, nunca en texto plano). No existe todavía ninguna cuenta en un servidor.
            </span>
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => nav('/login', { state: { registered: true } })}>
            Ir a iniciar sesión
          </Button>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout title="Crear cuenta" subtitle="Empieza a orquestar agentes en local.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-[13px] text-danger">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            {formError}
          </p>
        )}
        <TextInput label="Nombre" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextInput label="Correo electrónico" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="tu@correo.com" />
        <div>
          <PasswordInput label="Contraseña" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Requisitos de contraseña">
            {rules.map((r) => {
              const ok = r.test(password)
              return (
                <li key={r.id} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-success' : 'text-fg-3')}>
                  {ok ? <Check size={12} strokeWidth={3} aria-hidden /> : <Circle size={10} aria-hidden />}
                  {r.label}
                  <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <PasswordInput label="Confirmar contraseña" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="mt-6 text-[13.5px] text-fg-2">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-accent-text underline-offset-4 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { Checkbox, PasswordInput, TextInput } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { isEmail } from '../../lib/utils'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const justRegistered = (loc.state as { registered?: boolean } | null)?.registered
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/chat" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Introduce tu correo electrónico.'
    else if (!isEmail(email)) next.email = 'El formato del correo no es válido.'
    if (!password) next.password = 'Introduce tu contraseña.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await login(email.trim(), password, remember)
      nav('/chat', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Accede a tu espacio de trabajo en Kairo.">
      {justRegistered && (
        <p role="status" className="mb-5 rounded-lg bg-success-soft px-4 py-3 text-[13px] text-success">
          Cuenta de demostración creada en este navegador. Ya puedes iniciar sesión.
        </p>
      )}
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-[13px] text-danger">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            {formError}
          </p>
        )}
        <TextInput label="Correo electrónico" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="tu@correo.com" />
        <PasswordInput label="Contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="flex items-center justify-between gap-3">
          <Checkbox checked={remember} onChange={setRemember}>
            Mantener la sesión iniciada
          </Checkbox>
          <Link to="/forgot-password" className="text-[13px] whitespace-nowrap text-accent-text underline-offset-4 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          {loading ? 'Comprobando…' : 'Iniciar sesión'}
        </Button>
      </form>
      <p className="mt-6 text-[13.5px] text-fg-2">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-accent-text underline-offset-4 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </AuthLayout>
  )
}

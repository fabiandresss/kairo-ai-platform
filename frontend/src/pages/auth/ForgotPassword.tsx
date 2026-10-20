import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Field'
import { requestPasswordReset } from '../../services'
import { isEmail } from '../../lib/utils'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Introduce tu correo electrónico.')
    if (!isEmail(email)) return setError('El formato del correo no es válido.')
    setError('')
    setLoading(true)
    await requestPasswordReset(email.trim())
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te mostraremos cómo restablecerla.">
      {sent ? (
        <div role="status" className="space-y-5">
          <p className="flex items-start gap-3 rounded-lg bg-surface-2 p-4 text-[13.5px]">
            <Info size={18} className="mt-0.5 shrink-0 text-fg-2" aria-hidden />
            <span>
              Solicitud registrada en la interfaz para <strong>{email}</strong>. <strong>No se ha enviado ningún correo</strong>: aún no hay un proveedor de autenticación conectado. En esta demo puedes crear una cuenta nueva con otro correo.
            </span>
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 text-[13.5px] font-medium text-accent-text underline-offset-4 hover:underline">
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={submit} noValidate className="space-y-4">
            <TextInput label="Correo electrónico" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder="tu@correo.com" />
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Solicitar recuperación
            </Button>
          </form>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-[13.5px] text-fg-2 hover:text-fg">
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </>
      )}
    </AuthLayout>
  )
}

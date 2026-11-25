import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Field, Input } from '../components/Field'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/hesabim'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : next} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-3xl text-ink">Giriş</h1>
      <p className="mt-2 text-ink-soft">Randevu almak için hesabına gir.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error ? <Alert>{error}</Alert> : null}
        <Field label="E-posta">
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Şifre">
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Giriliyor…' : 'Giriş yap'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Hesabın yok mu?{' '}
        <Link to="/kayit" className="font-semibold text-accent underline-offset-2 hover:underline">
          Kayıt ol
        </Link>
      </p>
    </section>
  )
}

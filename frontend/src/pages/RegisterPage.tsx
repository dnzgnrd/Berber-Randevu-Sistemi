import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Field, Input } from '../components/Field'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { user, register, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to="/randevu" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      })
      navigate('/randevu')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt yapılamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-3xl text-ink">Kayıt ol</h1>
      <p className="mt-2 text-ink-soft">Bir kez kaydol, randevularını buradan yönet.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error ? <Alert>{error}</Alert> : null}
        <Field label="Ad soyad">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </Field>
        <Field label="Telefon">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="05xx xxx xx xx"
          />
        </Field>
        <Field label="E-posta">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Şifre (en az 8 karakter)">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Kaydediliyor…' : 'Kayıt ol'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Zaten üye misin?{' '}
        <Link to="/giris" className="font-semibold text-accent underline-offset-2 hover:underline">
          Giriş yap
        </Link>
      </p>
    </section>
  )
}

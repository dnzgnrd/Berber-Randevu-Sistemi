import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { apiGet, apiSend, ensureCsrf } from '../api/client'
import type { Service, Slot } from '../api/types'
import { Alert, Button, Field, Select } from '../components/Field'
import { useAuth } from '../context/AuthContext'

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function BookPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState<number | ''>('')
  const [date, setDate] = useState(todayIso())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  )

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<Service[]>('/services')
        setServices(data)
        if (data[0]) setServiceId(data[0].id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hizmetler yüklenemedi.')
      }
    })()
  }, [])

  useEffect(() => {
    if (!date) return
    setSelected(null)
    setLoadingSlots(true)
    setError('')
    void (async () => {
      try {
        const data = await apiGet<{ slots: Slot[] }>(`/appointments/slots?date=${encodeURIComponent(date)}`)
        setSlots(data.slots)
      } catch (err) {
        setSlots([])
        setError(err instanceof Error ? err.message : 'Saatler yüklenemedi.')
      } finally {
        setLoadingSlots(false)
      }
    })()
  }, [date])

  if (!authLoading && user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  async function book() {
    setError('')
    setMessage('')
    if (!user) {
      navigate(`/giris?next=/randevu`)
      return
    }
    if (!serviceId || !selected) {
      setError('Hizmet ve saat seç.')
      return
    }
    setBusy(true)
    try {
      await ensureCsrf()
      await apiSend('/appointments', 'POST', {
        service_id: serviceId,
        date,
        start_time: selected,
      })
      setMessage('Randevu isteğin alındı. Onaylanınca geçerli sayılır; saat şimdilik dolu görünür.')
      setSelected(null)
      const data = await apiGet<{ slots: Slot[] }>(`/appointments/slots?date=${encodeURIComponent(date)}`)
      setSlots(data.slots)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevu alınamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Randevu</h1>
      <ol className="mt-3 max-w-xl list-decimal space-y-1 pl-5 text-ink-soft">
        <li>Hizmeti seç</li>
        <li>Günü ve boş saati seç</li>
        <li>İsteği gönder — dükkan onaylayınca kesinleşir</li>
      </ol>
      <p className="mt-3 text-sm text-ink-soft">
        <span className="font-semibold text-ink">Boş</span> alınabilir ·{' '}
        <span className="font-semibold text-ink">Dolu</span> başkası aldı ·{' '}
        <span className="font-semibold text-ink">Geçti</span> saat doldu
      </p>

      {!user ? (
        <Alert>
          Randevu için{' '}
          <Link to="/giris?next=/randevu" className="font-semibold underline">
            giriş
          </Link>{' '}
          yapman gerekir.
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Field label="Hizmet">
          <Select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : '')}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.duration_min} dk — {s.price} TL
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gün">
          <input
            type="date"
            min={todayIso()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-11 border border-line bg-white/70 px-3 py-2"
            required
          />
        </Field>
      </div>

      {selectedService && selectedService.duration_min > 30 ? (
        <p className="mt-3 text-sm text-ink-soft">
          {selectedService.name} {selectedService.duration_min} dakika sürer; peş peşe boş saat gerekir.
        </p>
      ) : null}

      <div className="mt-8">
        <h2 className="font-display text-xl text-ink">Saatler</h2>
        {loadingSlots ? <p className="mt-3 text-ink-soft">Yükleniyor…</p> : null}
        {!loadingSlots && slots.length === 0 ? (
          <p className="mt-3 text-ink-soft">Bu gün kapalı veya uygun saat yok.</p>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {slots.map((slot) => {
            const isSelected = selected === slot.start
            const disabled = slot.status !== 'available'
            let label = slot.start
            let hint = ''
            if (slot.status === 'booked') hint = 'Dolu'
            if (slot.status === 'past') hint = 'Geçti'
            return (
              <button
                key={slot.start}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(slot.start)}
                className={`min-h-14 border px-2 py-2 text-sm transition ${
                  disabled
                    ? 'cursor-not-allowed border-line/60 bg-bg-deep/60 text-ink-soft/70'
                    : isSelected
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-white/70 text-ink hover:border-accent'
                }`}
              >
                <span className="block font-semibold">{label}</span>
                {hint ? <span className="mt-0.5 block text-[0.7rem]">{hint}</span> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert tone="ok">{message}</Alert> : null}
        <Button
          className="w-full sm:w-auto"
          disabled={busy || !selected || !serviceId || user?.role === 'admin'}
          onClick={() => void book()}
        >
          {busy ? 'Gönderiliyor…' : 'İsteği gönder'}
        </Button>
        {message ? (
          <p className="text-sm">
            <Link to="/hesabim" className="font-semibold text-accent underline-offset-2 hover:underline">
              Randevularıma git
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}

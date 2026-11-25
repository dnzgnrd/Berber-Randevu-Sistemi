import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { apiGet, apiSend, ensureCsrf } from '../api/client'
import type { Appointment } from '../api/types'
import { Alert, Button } from '../components/Field'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { formatTrDate } from '../lib/format'

type Filter = 'all' | Appointment['status']

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'pending', label: 'Bekleyen' },
  { id: 'approved', label: 'Onaylı' },
  { id: 'cancelled', label: 'İptal' },
  { id: 'rejected', label: 'Red' },
]

export function AccountPage() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    setError('')
    try {
      const data = await apiGet<Appointment[]>('/appointments/mine')
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevular yüklenemedi.')
    }
  }

  useEffect(() => {
    if (user) void load()
  }, [user])

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  )

  if (!loading && !user) {
    return <Navigate to="/giris?next=/hesabim" replace />
  }

  async function cancel(id: number) {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      await apiSend(`/appointments/${id}/cancel`, 'POST', {})
      setMessage('Randevu iptal edildi. Saat yeniden açıldı.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal edilemedi.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink">Randevularım</h1>
      {user ? (
        <p className="mt-2 text-ink-soft">
          Merhaba {user.name}. Onaylı, bekleyen ve iptal ettiğin randevular burada.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          to="/randevu"
          className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline"
        >
          Yeni randevu seç →
        </Link>
        {typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? (
          <button
            type="button"
            className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
            onClick={() => void Notification.requestPermission()}
          >
            Onay bildirimlerini aç
          </button>
        ) : null}
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Durum filtresi">
        {FILTERS.map((f) => {
          const count =
            f.id === 'all' ? items.length : items.filter((i) => i.status === f.id).length
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`min-h-11 shrink-0 border px-3 text-sm font-semibold ${
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-white/60 text-ink-soft hover:border-ink/40 hover:text-ink'
              }`}
            >
              {f.label}
              <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert tone="ok">{message}</Alert> : null}
        {visible.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-8 text-center text-ink-soft">
            Bu listede randevu yok.
          </p>
        ) : (
          visible.map((item) => (
            <article key={item.id} className="border border-line bg-white/70 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{item.service_name}</p>
                  <p className="mt-1 text-ink">
                    {formatTrDate(item.appt_date)} · {item.start_time}–{item.end_time}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">{item.price} TL</p>
                  <div className="mt-3">
                    <StatusBadge status={item.status} showHint />
                  </div>
                </div>
                {item.can_cancel ? (
                  <Button
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => void cancel(item.id)}
                  >
                    {busyId === item.id ? 'İptal…' : 'İptal et'}
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

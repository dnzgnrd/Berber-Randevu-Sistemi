import { useEffect, useState } from 'react'
import { apiGet, apiSend, ensureCsrf } from '../../api/client'
import type { Appointment } from '../../api/types'
import { trIncludes } from '../../lib/turkish'
import { Alert, Button, Input } from '../../components/Field'
import { StatusBadge } from '../../components/StatusBadge'

type Filter = 'all' | Appointment['status']

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'pending', label: 'Bekleyen' },
  { id: 'approved', label: 'Onaylı' },
  { id: 'cancelled', label: 'İptal' },
  { id: 'rejected', label: 'Red' },
]

function formatTrDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function AllAppointmentsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<Appointment[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load(status: Filter) {
    setError('')
    try {
      const path =
        status === 'all'
          ? '/admin/appointments'
          : `/admin/appointments?status=${encodeURIComponent(status)}`
      const data = await apiGet<Appointment[]>(path)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste yüklenemedi.')
    }
  }

  useEffect(() => {
    void load(filter)
  }, [filter])

  const filtered = items.filter(
    (i) =>
      !q.trim() ||
      trIncludes(i.customer_name || '', q) ||
      trIncludes(i.service_name, q) ||
      trIncludes(i.customer_phone || '', q),
  )

  async function act(id: number, action: 'approve' | 'reject') {
    setBusyId(id)
    setError('')
    try {
      await ensureCsrf()
      await apiSend(`/admin/appointments/${id}/${action}`, 'POST', {})
      await load(filter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Son 100 randevu. Bekleyenlerde onay / red yapabilirsin.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {FILTERS.map((f) => {
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
                  : 'border-line bg-white/60 text-ink-soft hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 max-w-sm">
        <Input
          placeholder="İsim, telefon veya hizmet ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Randevularda ara"
        />
      </div>

      {error ? (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-6 border border-dashed border-line px-4 py-8 text-center text-ink-soft">
          Kayıt yok.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((item) => (
            <li key={item.id} className="border border-line bg-white/70 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{item.customer_name}</p>
                  <p className="text-sm text-ink-soft">{item.customer_phone}</p>
                  <p className="mt-1 text-sm">
                    {item.service_name} · {formatTrDate(item.appt_date)} {item.start_time}–
                    {item.end_time}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                {item.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button disabled={busyId === item.id} onClick={() => void act(item.id, 'approve')}>
                      Onayla
                    </Button>
                    <Button
                      variant="danger"
                      disabled={busyId === item.id}
                      onClick={() => void act(item.id, 'reject')}
                    >
                      Reddet
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

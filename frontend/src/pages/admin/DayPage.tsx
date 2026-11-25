import { useEffect, useState } from 'react'
import { apiGet } from '../../api/client'
import type { Appointment } from '../../api/types'
import { Alert } from '../../components/Field'
import { StatusBadge } from '../../components/StatusBadge'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DayPage() {
  const [date, setDate] = useState(todayIso())
  const [items, setItems] = useState<Appointment[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    void (async () => {
      try {
        const data = await apiGet<{ appointments: Appointment[] }>(
          `/admin/appointments/day?date=${encodeURIComponent(date)}`,
        )
        setItems(data.appointments)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Günlük liste alınamadı.')
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [date])

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Seçtiğin günde onaylı, bekleyen, iptal ve red randevuların hepsi listelenir.
      </p>
      <label className="block max-w-xs space-y-1.5">
        <span className="text-sm font-semibold">Gün</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full min-h-11 border border-line bg-white/70 px-3 py-2"
        />
      </label>
      {error ? (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {loading ? <p className="mt-4 text-ink-soft">Yükleniyor…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="mt-4 border border-dashed border-line px-4 py-8 text-center text-ink-soft">
          Bu günde kayıt yok.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border border-line bg-white/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {item.start_time}–{item.end_time} · {item.customer_name}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.service_name} · {item.customer_phone}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

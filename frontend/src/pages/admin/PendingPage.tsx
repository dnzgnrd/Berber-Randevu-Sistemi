import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiSend, ensureCsrf } from '../../api/client'
import type { Appointment } from '../../api/types'
import { trIncludes } from '../../lib/turkish'
import { Alert, Button, Input } from '../../components/Field'
import { StatusBadge } from '../../components/StatusBadge'

function formatTrDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function PendingPage() {
  const [items, setItems] = useState<Appointment[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    try {
      const data = await apiGet<Appointment[]>('/admin/appointments/pending')
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste yüklenemedi.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

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
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Sadece cevap bekleyen istekler. Onaylı / iptal / red için{' '}
        <Link to="/admin/tumu" className="font-semibold text-accent underline-offset-2 hover:underline">
          Tüm randevular
        </Link>{' '}
        sekmesine bak.
      </p>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="İsim, telefon veya hizmet ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Bekleyenlerde ara"
        />
      </div>
      {error ? <Alert>{error}</Alert> : null}
      {filtered.length === 0 ? (
        <p className="border border-dashed border-line px-4 py-8 text-center text-ink-soft">
          Bekleyen randevu yok.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id} className="border border-line bg-white/70 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{item.customer_name}</p>
                  <p className="text-sm text-ink-soft">{item.customer_phone}</p>
                  <p className="mt-1 text-sm">
                    {item.service_name} · {formatTrDate(item.appt_date)} {item.start_time}–
                    {item.end_time}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

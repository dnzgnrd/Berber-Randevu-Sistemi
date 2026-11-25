import { useEffect, useState } from 'react'
import { apiGet, apiSend, ensureCsrf } from '../../api/client'
import type { DayOff, WorkingHour } from '../../api/types'
import { Alert, Button, Field, Input } from '../../components/Field'

const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export function HoursPage() {
  const [hours, setHours] = useState<WorkingHour[]>([])
  const [daysOff, setDaysOff] = useState<DayOff[]>([])
  const [offDate, setOffDate] = useState('')
  const [offNote, setOffNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const [h, d] = await Promise.all([
      apiGet<WorkingHour[]>('/shop/working-hours'),
      apiGet<DayOff[]>('/shop/days-off'),
    ])
    setHours(h)
    setDaysOff(d)
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Yüklenemedi.'))
  }, [])

  async function saveHours() {
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      await apiSend('/admin/working-hours', 'PUT', {
        hours: hours.map((h) => ({
          weekday: h.weekday,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed,
        })),
      })
      setMessage('Çalışma saatleri kaydedildi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    }
  }

  async function addOff() {
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      await apiSend('/admin/days-off', 'POST', { date: offDate, note: offNote })
      setOffDate('')
      setOffNote('')
      setMessage('Tatil günü eklendi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eklenemedi.')
    }
  }

  async function removeOff(id: number) {
    try {
      await ensureCsrf()
      await apiSend(`/admin/days-off/${id}`, 'DELETE')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi.')
    }
  }

  return (
    <div className="space-y-10">
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="ok">{message}</Alert> : null}

      <div>
        <h2 className="font-display text-xl">Haftalık saatler</h2>
        <ul className="mt-4 space-y-3">
          {hours.map((h, idx) => (
            <li key={h.weekday} className="grid gap-2 border border-line bg-white/40 p-3 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center">
              <span className="font-semibold">{dayNames[h.weekday]}</span>
              <Input
                type="time"
                value={h.open_time}
                disabled={h.is_closed}
                onChange={(e) => {
                  const next = [...hours]
                  next[idx] = { ...h, open_time: e.target.value }
                  setHours(next)
                }}
              />
              <Input
                type="time"
                value={h.close_time}
                disabled={h.is_closed}
                onChange={(e) => {
                  const next = [...hours]
                  next[idx] = { ...h, close_time: e.target.value }
                  setHours(next)
                }}
              />
              <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => {
                    const next = [...hours]
                    next[idx] = { ...h, is_closed: e.target.checked }
                    setHours(next)
                  }}
                />
                Kapalı
              </label>
            </li>
          ))}
        </ul>
        <Button className="mt-4" onClick={() => void saveHours()}>
          Saatleri kaydet
        </Button>
      </div>

      <div>
        <h2 className="font-display text-xl">Tatil günleri</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Tarih">
            <Input type="date" value={offDate} onChange={(e) => setOffDate(e.target.value)} />
          </Field>
          <Field label="Not">
            <Input value={offNote} onChange={(e) => setOffNote(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => void addOff()} disabled={!offDate}>
              Ekle
            </Button>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {daysOff.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                {d.off_date}
                {d.note ? ` — ${d.note}` : ''}
              </span>
              <Button variant="ghost" onClick={() => void removeOff(d.id)}>
                Sil
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

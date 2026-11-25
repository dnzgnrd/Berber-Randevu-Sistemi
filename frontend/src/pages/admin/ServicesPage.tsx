import { useEffect, useState, type FormEvent } from 'react'
import { apiGet, apiSend, ensureCsrf } from '../../api/client'
import type { Service } from '../../api/types'
import { Alert, Button, Field, Input } from '../../components/Field'

type Draft = {
  id?: number
  name: string
  duration_min: number
  price: number
  sort_order: number
  is_active: boolean
}

const empty: Draft = {
  name: '',
  duration_min: 30,
  price: 0,
  sort_order: 0,
  is_active: true,
}

export function ServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [draft, setDraft] = useState<Draft>(empty)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const data = await apiGet<Service[]>('/admin/services')
    setItems(data)
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Yüklenemedi.'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      if (draft.id) {
        await apiSend(`/admin/services/${draft.id}`, 'PUT', draft)
        setMessage('Hizmet güncellendi.')
      } else {
        await apiSend('/admin/services', 'POST', draft)
        setMessage('Hizmet eklendi.')
      }
      setDraft(empty)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    }
  }

  return (
    <div className="space-y-8">
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="ok">{message}</Alert> : null}

      <ul className="divide-y divide-line border-y border-line">
        {items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold">
                {s.name} {!s.is_active ? '(pasif)' : ''}
              </p>
              <p className="text-sm text-ink-soft">
                {s.duration_min} dk · {s.price} TL
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                setDraft({
                  id: s.id,
                  name: s.name,
                  duration_min: s.duration_min,
                  price: s.price,
                  sort_order: s.sort_order ?? 0,
                  is_active: s.is_active !== false,
                })
              }
            >
              Düzenle
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="max-w-lg space-y-3 border border-line bg-white/40 p-4">
        <h2 className="font-display text-xl">{draft.id ? 'Hizmeti düzenle' : 'Yeni hizmet'}</h2>
        <Field label="Ad">
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            required
          />
        </Field>
        <Field label="Süre (dk)">
          <Input
            type="number"
            min={15}
            step={15}
            value={draft.duration_min}
            onChange={(e) => setDraft({ ...draft, duration_min: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Fiyat (TL)">
          <Input
            type="number"
            min={0}
            step={10}
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Sıra">
          <Input
            type="number"
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
          />
        </Field>
        {draft.id ? (
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            />
            Aktif
          </label>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit">{draft.id ? 'Güncelle' : 'Ekle'}</Button>
          {draft.id ? (
            <Button variant="ghost" type="button" onClick={() => setDraft(empty)}>
              Vazgeç
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}

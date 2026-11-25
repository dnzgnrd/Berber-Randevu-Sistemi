import { useEffect, useState, type FormEvent } from 'react'
import { apiForm, apiGet, apiSend, ensureCsrf, mediaUrl } from '../../api/client'
import type { GalleryItem } from '../../api/types'
import { Alert, Button, Field, Input } from '../../components/Field'

export function GalleryAdminPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const data = await apiGet<GalleryItem[]>('/gallery')
    setItems(data)
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Yüklenemedi.'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Fotoğraf seç.')
      return
    }
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      const form = new FormData()
      form.append('photo', file)
      form.append('alt_text', alt)
      await apiForm('/admin/gallery', form)
      setFile(null)
      setAlt('')
      setMessage('Fotoğraf eklendi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız.')
    }
  }

  async function remove(id: number) {
    try {
      await ensureCsrf()
      await apiSend(`/admin/gallery/${id}`, 'DELETE')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi.')
    }
  }

  return (
    <div className="space-y-8">
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="ok">{message}</Alert> : null}

      <form onSubmit={onSubmit} className="max-w-lg space-y-3 border border-line bg-white/40 p-4">
        <h2 className="font-display text-xl">Fotoğraf ekle</h2>
        <Field label="Dosya (JPG/PNG/WebP)">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <Field label="Alt metin">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Kısa açıklama" />
        </Field>
        <Button type="submit">Yükle</Button>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="border border-line bg-white/40">
            <img
              src={mediaUrl(item.file_path)}
              alt={item.alt_text || 'Galeri'}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="flex items-center justify-between gap-2 p-2 text-sm">
              <span className="truncate">{item.alt_text || '—'}</span>
              <Button variant="ghost" onClick={() => void remove(item.id)}>
                Sil
              </Button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

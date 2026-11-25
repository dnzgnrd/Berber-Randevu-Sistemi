import { useEffect, useState } from 'react'
import { apiGet, mediaUrl } from '../api/client'
import type { GalleryItem } from '../api/types'
import { Alert } from '../components/Field'

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<GalleryItem[]>('/gallery')
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Galeri yüklenemedi.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Galeri</h1>
      <p className="mt-2 text-ink-soft">Dükkandan kareler. Fotoğraflar eklendikçe burada görünür.</p>

      {error ? (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {loading ? <p className="mt-6 text-ink-soft">Yükleniyor…</p> : null}

      <div className="mt-8 columns-1 gap-4 sm:columns-2 md:columns-3">
        {items.length === 0 && !loading
          ? [1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className={`mb-4 break-inside-avoid bg-bg-deep ${n % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}
                role="img"
                aria-label="Fotoğraf yer tutucu"
              />
            ))
          : items.map((item, i) => (
              <figure key={item.id} className={`mb-4 break-inside-avoid ${i % 4 === 0 ? '' : ''}`}>
                <img
                  src={mediaUrl(item.file_path)}
                  alt={item.alt_text || 'Bre Berber galeri fotoğrafı'}
                  loading="lazy"
                  className="w-full object-cover"
                  style={{ aspectRatio: i % 3 === 0 ? '3 / 4' : '1 / 1' }}
                />
              </figure>
            ))}
      </div>
    </section>
  )
}

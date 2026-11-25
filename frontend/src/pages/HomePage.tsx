import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, mediaUrl } from '../api/client'
import type { GalleryItem, Service, ShopSettings } from '../api/types'
import { useAuth } from '../context/AuthContext'

const MARQUEE = ['Kes', 'Tıraş', 'Gel otur', 'Sıra yok', 'Bre Berber', 'Tunceli']

export function HomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const [s, svc, g] = await Promise.all([
          apiGet<ShopSettings>('/shop/settings'),
          apiGet<Service[]>('/services'),
          apiGet<GalleryItem[]>('/gallery'),
        ])
        setSettings(s)
        setServices(svc)
        setGallery(g)
      } catch {
        // seed
      }
    })()
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden border-b-2 border-ink bg-ink text-bg">
        <div
          className="pointer-events-none absolute right-[-1rem] top-6 h-36 w-36 rounded-[2rem] bg-pop md:h-48 md:w-48"
          aria-hidden
          style={{ animation: 'floaty 5s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute bottom-10 left-[-1rem] h-24 w-24 rounded-full bg-accent md:h-32 md:w-32"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-24 right-1/3 h-16 w-16 rounded-full bg-sky md:h-20 md:w-20"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-5xl gap-8 px-4 pb-12 pt-10 md:grid-cols-[1.15fr_0.85fr] md:items-end md:pb-16 md:pt-14">
          <div>
            <p
              className="inline-flex rounded-full bg-pop px-3 py-1 text-sm font-bold text-ink"
              style={{ animation: 'rise 0.5s ease both' }}
            >
              Tunceli · Atatürk Mahallesi
            </p>
            <h1
              className="mt-5 font-display text-[3.5rem] leading-[0.9] font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ animation: 'rise 0.55s ease 0.04s both' }}
            >
              Bre
              <br />
              <span className="italic text-pop">Berber</span>
            </h1>
            <p
              className="mt-5 max-w-md text-lg text-bg/90 md:text-xl"
              style={{ animation: 'rise 0.55s ease 0.08s both' }}
            >
              Düzgün kesim, temiz sakal. Gel, koltuğa otur — iş biter.
            </p>
            <p className="mt-2 max-w-md text-bg/60" style={{ animation: 'rise 0.55s ease 0.12s both' }}>
              Randevunu buradan al; kapıda sıra bekleme.
            </p>
            {!isAdmin ? (
              <div className="mt-8" style={{ animation: 'rise 0.55s ease 0.16s both' }}>
                <Link
                  to="/randevu"
                  className="inline-flex min-h-12 items-center rounded-2xl border-2 border-pop bg-accent px-8 text-lg font-bold text-white shadow-[5px_5px_0_0_#fde047] transition hover:-translate-y-1 hover:bg-accent-hover hover:shadow-[7px_7px_0_0_#fde047] active:translate-y-0 active:shadow-[3px_3px_0_0_#fde047]"
                >
                  Randevu Al ✦
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <Link
                  to="/admin"
                  className="inline-flex min-h-12 items-center rounded-2xl border-2 border-pop bg-pop px-7 text-lg font-bold text-ink shadow-[4px_4px_0_0_#f43f5e]"
                >
                  Admin paneli
                </Link>
              </div>
            )}
          </div>

          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-2 border-pop bg-gradient-to-br from-accent/40 via-ink to-teal/40"
            style={{ animation: 'rise 0.65s ease 0.1s both', transform: 'rotate(2deg)' }}
            role="img"
            aria-label="Dükkan fotoğrafı yakında"
          >
            <div className="absolute inset-4 rounded-[1.5rem] border-2 border-dashed border-bg/35" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="font-display text-2xl font-bold italic text-pop">Fotoğraf yakında</p>
              <p className="mt-1 text-sm text-bg/70">Berber kendi karelerini koyacak</p>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b-2 border-ink bg-pop py-3" aria-hidden>
        <div
          className="flex w-max gap-8 whitespace-nowrap font-display text-xl font-bold italic text-ink md:text-2xl"
          style={{ animation: 'marquee 20s linear infinite' }}
        >
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((word, i) => (
            <span key={`${word}-${i}`} className="inline-flex items-center gap-8">
              {word}
              <span className="text-accent">★</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl font-bold italic text-ink md:text-5xl">
            Menü gibi <span className="text-accent">net</span>
          </h2>
          <p className="max-w-xs rounded-2xl bg-white/70 px-3 py-2 text-sm font-semibold text-ink-soft">
            Ne istersen o. Süre ve fiyat ortada.
          </p>
        </div>
        <ul className="mt-10 space-y-4">
          {services.map((s, i) => (
            <li key={s.id}>
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-ink bg-white px-5 py-4 shadow-[4px_4px_0_0_#14b8a6] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#f43f5e] md:px-6"
                style={{
                  animation: `rise 0.45s ease ${0.05 * i}s both`,
                  transform: i % 2 === 1 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)',
                }}
              >
                <div>
                  <p className="font-display text-2xl font-bold md:text-3xl">{s.name}</p>
                  <p className="mt-0.5 text-sm font-bold text-teal">{s.duration_min} dakika</p>
                </div>
                <p className="rounded-2xl bg-pop px-3 py-1 font-display text-3xl font-bold tabular-nums text-ink md:text-4xl">
                  {s.price}
                  <span className="ml-1 text-base">TL</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y-2 border-ink bg-accent py-14 text-white md:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-4xl font-bold italic md:text-5xl">İşten kareler</h2>
            <Link
              to="/galeri"
              className="min-h-11 rounded-full bg-pop px-4 py-2 font-bold text-ink hover:bg-white"
            >
              Tüm galeri →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {(gallery.length > 0 ? gallery.slice(0, 4) : [null, null, null, null]).map((item, i) => {
              const tilt = ['-rotate-2', 'rotate-2', 'rotate-1', '-rotate-1'][i]
              const tall = i === 0 || i === 3
              return (
                <div
                  key={item?.id ?? `ph-${i}`}
                  className={`overflow-hidden rounded-3xl border-2 border-ink bg-ink/25 ${tilt} ${
                    tall ? 'aspect-[3/4]' : 'aspect-square'
                  } ${i === 1 ? 'md:translate-y-6' : ''} ${i === 2 ? 'md:-translate-y-3' : ''}`}
                >
                  {item ? (
                    <img
                      src={mediaUrl(item.file_path)}
                      alt={item.alt_text || 'Bre Berber'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="flex h-full items-end p-3 text-sm font-bold text-white/85"
                      role="img"
                      aria-label="Fotoğraf yer tutucu"
                    >
                      Yakında
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <h2 className="font-display text-4xl font-bold italic text-ink md:text-5xl">
          Kapı <span className="text-teal">dayız</span>
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[5px_5px_0_0_#38bdf8] md:p-6">
            <p className="text-lg leading-snug">
              {settings?.address ||
                'Atatürk Mah. 13. Cad. (Tunceli–Elazığ Yolu), Ender Yapı No: 4, Merkez / Tunceli'}
            </p>
            <a
              href="tel:+905412136262"
              className="mt-5 block font-display text-4xl font-bold text-accent hover:underline md:text-5xl"
            >
              {settings?.phone || '0541 213 62 62'}
            </a>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <a
                className="rounded-full bg-bg-deep px-3 py-1.5 hover:bg-pop"
                href={`https://wa.me/${settings?.whatsapp || '05412136262'}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="rounded-full bg-bg px-3 py-1.5 hover:bg-pop"
                href={`mailto:${settings?.email || 'tangobaymurat@hotmail.com'}`}
              >
                E-posta
              </a>
            </div>
            <p className="mt-4 text-ink-soft">Pzt–Cmt 09:00–19:00 · Pazar kapalı</p>
          </div>
          <a
            className="flex min-h-52 items-end rounded-3xl border-2 border-ink bg-teal p-5 text-lg font-bold text-white shadow-[5px_5px_0_0_#fde047] transition hover:-translate-y-1 hover:bg-sky md:p-6"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              settings?.maps_query || 'Atatürk Mah. 13. Cad. Ender Yapı No: 4 Merkez Tunceli',
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Haritada bul →
          </a>
        </div>
      </section>
    </div>
  )
}

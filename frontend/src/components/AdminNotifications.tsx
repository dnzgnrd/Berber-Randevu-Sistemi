import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatApptLine } from '../lib/format'

type NotifPayload = {
  pending_count: number
  server_time: string
  items: Array<{
    id: number
    customer_name: string
    service_name: string
    appt_date: string
    start_time: string
    created_at: string
  }>
}

export function AdminNotifications() {
  const { user } = useAuth()
  const { push } = useToast()
  const [count, setCount] = useState(0)
  const lastCount = useRef<number | null>(null)
  const sinceRef = useRef<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') return

    let cancelled = false

    async function tick() {
      try {
        const q = sinceRef.current
          ? `?since=${encodeURIComponent(sinceRef.current)}`
          : ''
        const data = await apiGet<NotifPayload>(`/admin/notifications${q}`)
        if (cancelled) return

        setCount(data.pending_count)

        const prev = lastCount.current
        if (prev !== null && data.pending_count > prev) {
          const newest = data.items[0]
          const title = 'Yeni randevu isteği'
          const lines = newest
            ? [
                `${newest.customer_name} · ${newest.service_name}`,
                formatApptLine(newest.appt_date, newest.start_time),
              ]
            : [`Bekleyen: ${data.pending_count}`]

          push({
            title,
            lines,
            href: '/admin',
            hrefLabel: 'Bekleyenlere git →',
            tone: 'info',
          })

          const body = lines.join(' — ')
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification('Bre Berber', { body: `${title}: ${body}`, tag: 'bre-pending' })
            } catch {
              // ignore
            }
          }
        }
        lastCount.current = data.pending_count
        sinceRef.current = data.server_time
      } catch {
        // ignore
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), 12000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [user, push])

  if (user?.role !== 'admin') return null

  return (
    <Link
      to="/admin"
      className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[0.95rem] font-bold text-ink hover:bg-pop/80"
    >
      Admin
      {count > 0 ? (
        <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}

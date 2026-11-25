import { useEffect, useRef } from 'react'
import { apiGet } from '../api/client'
import type { Appointment } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatApptLine } from '../lib/format'

function storageKey(userId: number) {
  return `bre_customer_appt_status_${userId}`
}

type StatusMap = Record<string, Appointment['status']>

export function CustomerNotifications() {
  const { user } = useAuth()
  const { push } = useToast()
  const ready = useRef(false)

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      ready.current = false
      return
    }

    let cancelled = false
    ready.current = false

    async function tick() {
      try {
        const items = await apiGet<Appointment[]>('/appointments/mine')
        if (cancelled) return

        const key = storageKey(user!.id)
        let prev: StatusMap = {}
        try {
          prev = JSON.parse(localStorage.getItem(key) || '{}') as StatusMap
        } catch {
          prev = {}
        }

        const next: StatusMap = {}
        for (const a of items) {
          next[String(a.id)] = a.status
          const old = prev[String(a.id)]
          if (!ready.current) continue
          if (!old || old === a.status) continue

          if (a.status === 'approved') {
            const title = 'Randevun onaylandı'
            const lines = [
              a.service_name,
              formatApptLine(a.appt_date, a.start_time, a.end_time),
            ]
            push({ title, lines, href: '/hesabim', hrefLabel: 'Randevularıma bak →', tone: 'ok' })
            browserNotify(title, lines.join(' — '))
          } else if (a.status === 'rejected') {
            const title = 'Randevu isteğin reddedildi'
            const lines = [
              a.service_name,
              formatApptLine(a.appt_date, a.start_time, a.end_time),
              'Başka bir saat seçebilirsin.',
            ]
            push({ title, lines, href: '/randevu', hrefLabel: 'Yeni saat seç →', tone: 'warn' })
            browserNotify(title, lines.join(' — '))
          }
        }

        localStorage.setItem(key, JSON.stringify(next))
        ready.current = true
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

  return null
}

function browserNotify(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag: 'bre-customer' })
  } catch {
    // ignore
  }
}

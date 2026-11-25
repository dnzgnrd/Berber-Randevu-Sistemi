import type { Appointment } from '../api/types'

const META: Record<
  Appointment['status'],
  { label: string; hint: string; className: string }
> = {
  pending: {
    label: 'Beklemede',
    hint: 'Dükkan henüz cevap vermedi. Saat şimdilik dolu görünür.',
    className: 'border-[#c4a574] bg-[#f5ead7] text-[#6b4f1d]',
  },
  approved: {
    label: 'Onaylandı',
    hint: 'Randevun kesin. O saatte gelmen yeterli.',
    className: 'border-ok/40 bg-ok/15 text-ok',
  },
  rejected: {
    label: 'Reddedildi',
    hint: 'Bu istek kabul edilmedi. Yeni saat seçebilirsin.',
    className: 'border-danger/40 bg-danger/10 text-danger',
  },
  cancelled: {
    label: 'İptal edildi',
    hint: 'Bu randevu iptal. Saat yeniden açıldı.',
    className: 'border-line bg-bg-deep text-ink-soft',
  },
}

export function statusMeta(status: Appointment['status']) {
  return META[status]
}

export function StatusBadge({
  status,
  showHint = false,
}: {
  status: Appointment['status']
  showHint?: boolean
}) {
  const meta = META[status]
  return (
    <div>
      <span
        className={`inline-flex min-h-8 items-center border px-2.5 text-sm font-semibold ${meta.className}`}
      >
        {meta.label}
      </span>
      {showHint ? <p className="mt-1.5 text-sm text-ink-soft">{meta.hint}</p> : null}
    </div>
  )
}

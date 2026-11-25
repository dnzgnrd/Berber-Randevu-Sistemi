export function formatTrDate(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

export function formatApptLine(date: string, start: string, end?: string) {
  const day = formatTrDate(date)
  return end ? `${day} · ${start}–${end}` : `${day} · ${start}`
}

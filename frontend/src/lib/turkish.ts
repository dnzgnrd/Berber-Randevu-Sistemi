/** Türkçe karakter duyarlı küçük harf / arama */
const MAP: Record<string, string> = {
  İ: 'i',
  I: 'ı',
  Ş: 'ş',
  Ğ: 'ğ',
  Ü: 'ü',
  Ö: 'ö',
  Ç: 'ç',
}

export function trLower(value: string): string {
  return value
    .split('')
    .map((ch) => MAP[ch] ?? ch)
    .join('')
    .toLocaleLowerCase('tr-TR')
}

export function trIncludes(haystack: string, needle: string): boolean {
  return trLower(haystack).includes(trLower(needle.trim()))
}

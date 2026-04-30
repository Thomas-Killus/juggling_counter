/**
 * Get today's date as YYYY-MM-DD in local time (avoids UTC timezone shift).
 */
export function getTodayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Format YYYY-MM-DD → "Monday, 30 April 2026" (locale-friendly display).
 */
export function formatDateDisplay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format YYYY-MM-DD → M/D/YYYY (Google Sheets date format, no leading zeros).
 * e.g. "2026-04-30" → "4/30/2026"
 */
export function toSheetDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${m}/${d}/${y}`
}

/**
 * Format YYYY-MM-DD → short label like "Apr 30".
 */
export function formatShortDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

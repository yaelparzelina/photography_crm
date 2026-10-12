// Converts a Firestore Timestamp / Date / string to a valid Date, or null if it isn't a real date.
function toValidDate(value) {
  if (!value) return null
  const date = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(timestamp) {
  const date = toValidDate(timestamp)
  if (!date) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

export function toInputDate(timestamp) {
  const date = toValidDate(timestamp)
  return date ? date.toISOString().split('T')[0] : ''
}

export function fromInputDate(str) {
  return toValidDate(str)
}

// --- Calendar days (stored as UTC midnight of the chosen day, like fromInputDate) ---

export function dayFromParts(year, monthIndex, day) {
  const date = new Date(Date.UTC(year, monthIndex, day))
  // Reject overflow such as 31/02
  return date.getUTCFullYear() === year && date.getUTCMonth() === monthIndex && date.getUTCDate() === day ? date : null
}

// dd/mm/yyyy of a calendar day
export function formatDay(value) {
  const key = toInputDate(value)
  if (!key) return ''
  const [y, m, d] = key.split('-')
  return `${d}/${m}/${y}`
}

// Parses what the owner types: 16/10/2026, 16.10.26, 16-10-2026 or 2026-10-16. Returns null if it isn't a full date.
export function parseDateText(text) {
  const s = (text || '').trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return dayFromParts(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
  if (!m) return null
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
  return dayFromParts(year, Number(m[2]) - 1, Number(m[1]))
}

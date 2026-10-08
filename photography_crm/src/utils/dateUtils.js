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

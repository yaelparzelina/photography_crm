import { toInputDate } from './dateUtils'
import { normalizeBusinessDays } from './delivery'

// Business days in Israel: Sunday–Thursday, excluding holiday days.
// Holidays come from the Hebrew calendar (Intl), so no yearly table is needed.
// All calculations use calendar days in UTC (dates are stored as UTC midnight of the chosen day).

const hebrewParts = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', timeZone: 'UTC' })

function hebrewDate(date) {
  const parts = hebrewParts.formatToParts(date)
  return {
    day: Number(parts.find((p) => p.type === 'day').value),
    month: parts.find((p) => p.type === 'month').value,
  }
}

// Holiday days (יום טוב) observed in Israel, plus יום העצמאות
const HOLIDAYS = {
  Tishri: [1, 2, 10, 15, 22], // ראש השנה, יום כיפור, סוכות, שמחת תורה
  Nisan: [15, 21], // פסח: first and seventh day
  Sivan: [6], // שבועות
}

export function holidayName(date) {
  const { day, month } = hebrewDate(date)
  if (HOLIDAYS[month]?.includes(day)) {
    if (month === 'Tishri') return day <= 2 ? 'ראש השנה' : day === 10 ? 'יום כיפור' : day === 15 ? 'סוכות' : 'שמחת תורה'
    if (month === 'Nisan') return 'פסח'
    return 'שבועות'
  }
  // יום העצמאות is ה׳ באייר, moved so it never touches Shabbat: Fri → Thu (ד׳), Sat → Thu (ג׳), Mon → Tue (ו׳)
  if (month === 'Iyar') {
    const dow = date.getUTCDay()
    if ((day === 5 && dow === 3) || (day === 4 && dow === 4) || (day === 3 && dow === 4) || (day === 6 && dow === 2)) {
      return 'יום העצמאות'
    }
  }
  return null
}

export function isBusinessDay(date) {
  const dow = date.getUTCDay()
  return dow !== 5 && dow !== 6 && !holidayName(date)
}

// A Firestore Timestamp / Date / 'YYYY-MM-DD' → Date at UTC midnight of that calendar day (or null)
export function toDay(value) {
  const key = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toInputDate(value)
  return key ? new Date(`${key}T00:00:00Z`) : null
}

const addDays = (date, n) => new Date(date.getTime() + n * 86400000)

// The date the photos are due: N business days after the shoot (day 1 is the first business day after it)
export function deliveryDeadline(shootDate, businessDays) {
  const start = toDay(shootDate)
  if (!start) return null
  let remaining = normalizeBusinessDays(businessDays)
  let d = start
  while (remaining > 0) {
    d = addDays(d, 1)
    if (isBusinessDay(d)) remaining--
  }
  return d
}

// Business days from today until the deadline: 0 on the day itself, negative once overdue
export function businessDaysUntil(deadline, today = new Date()) {
  const from = toDay(today)
  const to = toDay(deadline)
  if (!from || !to) return null
  if (to.getTime() === from.getTime()) return 0
  const forward = to > from
  let count = 0
  let d = from
  while (d.getTime() !== to.getTime()) {
    d = addDays(d, forward ? 1 : -1)
    // Counting forward includes the deadline day; counting back includes today's passed days
    if (isBusinessDay(forward ? d : addDays(d, 1))) count++
  }
  return forward ? count : -count
}

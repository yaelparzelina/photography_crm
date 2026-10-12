import { serverTimestamp } from 'firebase/firestore'
import { toDay, deliveryDeadline } from './businessDays'

// Board columns, right to left. `statuses` are the client statuses a column can hold.
// 'closing' and 'lost' share one slot, stacked (closing on top).
export const BOARD_COLUMNS = [
  { id: 'new', title: 'לקוחות חדשים', statuses: ['new_lead'] },
  { id: 'proposal', title: 'הצעת מחיר נשלחה', statuses: ['proposal_sent'] },
  { id: 'callback', title: 'לחזור ללקוח', statuses: ['proposal_sent'] },
  { id: 'closing', title: 'סגירת חוזה והנחיות לבוש', statuses: ['proposal_sent', 'agreement_sent', 'agreement_signed'] },
  { id: 'lost', title: 'לא סגר', statuses: ['didnt_book'], expires: true },
  { id: 'preshoot', title: 'לפני צילום', statuses: ['shoot_scheduled'], sortedByDate: true },
  { id: 'editing', title: 'עריכת תמונות', statuses: ['editing_in_progress'], sortedByDate: true },
  { id: 'album', title: 'משלוח אלבום', statuses: ['editing_in_progress'], sortedByDate: true },
  { id: 'done', title: 'הסתיים', statuses: ['done'], expires: true },
]

export const COLUMN_BY_ID = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, c]))

// Slots as laid out on the screen: each slot is one column or a stack of columns
export const BOARD_SLOTS = [['new'], ['proposal'], ['callback'], ['closing', 'lost'], ['preshoot'], ['editing'], ['album'], ['done']]

// Where a status goes when the client isn't placed in a specific column
const DEFAULT_COLUMN = {
  new_lead: 'new',
  proposal_sent: 'proposal',
  agreement_sent: 'closing',
  agreement_signed: 'closing',
  didnt_book: 'lost',
  shoot_scheduled: 'preshoot',
  editing_in_progress: 'editing',
  done: 'done',
}

// Days a ticket stays in an expiring column (לא סגר / הסתיים)
export const EXPIRE_DAYS = 7
// Clients from before the board existed count from its launch day
export const BOARD_LAUNCH_DATE = new Date('2026-10-12T00:00:00Z')

export function columnOf(client) {
  const status = client.status || 'new_lead'
  const stored = COLUMN_BY_ID[client.boardColumn]
  if (stored?.statuses.includes(status)) return stored.id
  return DEFAULT_COLUMN[status] || 'new'
}

// The status a client gets when dropped in a column
export function dropStatus(columnId, client) {
  if (columnId === 'closing') {
    if (client.agreementSigned) return 'agreement_signed'
    if (client.agreementSentAt || client.status === 'agreement_sent') return 'agreement_sent'
    return 'proposal_sent'
  }
  return COLUMN_BY_ID[columnId].statuses[0]
}

// Position of a new arrival: before everything already in the column (more negative = higher up)
const topOrder = () => -Date.now()

// Firestore changes for moving a client to a column (to the top, unless a position is given)
export function moveChanges(columnId, client, order = topOrder()) {
  return { status: dropStatus(columnId, client), boardColumn: columnId, boardMovedAt: serverTimestamp(), boardHidden: false, boardOrder: order }
}

// Firestore changes for a status change made outside the board (client card, clients list)
export function statusChanges(status) {
  return { status, boardColumn: null, boardMovedAt: serverTimestamp(), boardHidden: false, boardOrder: topOrder() }
}

const toDate = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null)

function movedAt(client) {
  return toDate(client.boardMovedAt) || null
}

export function isOnBoard(client, now = new Date()) {
  const col = COLUMN_BY_ID[columnOf(client)]
  if (!col.expires) return true
  if (client.boardHidden) return false
  const since = movedAt(client) || BOARD_LAUNCH_DATE
  return now.getTime() - since.getTime() < EXPIRE_DAYS * 86400000
}

export function clientDeadline(client) {
  return client.shootDate ? deliveryDeadline(client.shootDate, client.businessDays) : null
}

const time = (d) => (d ? d.getTime() : Infinity)

// Manual order inside a column: the saved position, else most recently moved first
export function orderKey(client) {
  if (typeof client.boardOrder === 'number') return client.boardOrder
  return -(movedAt(client) || toDate(client.createdAt) || new Date(0)).getTime()
}

// Position for a ticket placed at `index` among `list` (the column's tickets without it, in display order)
export function orderAt(list, index) {
  if (!list.length) return topOrder()
  if (index <= 0) return orderKey(list[0]) - 1000
  if (index >= list.length) return orderKey(list[list.length - 1]) + 1000
  return (orderKey(list[index - 1]) + orderKey(list[index])) / 2
}

// Tickets of one column, in display order
export function sortColumn(columnId, clients) {
  const list = [...clients]
  if (columnId === 'preshoot') {
    return list.sort((a, b) => time(toDay(a.shootDate)) - time(toDay(b.shootDate)))
  }
  if (columnId === 'editing' || columnId === 'album') {
    return list.sort((a, b) => time(clientDeadline(a)) - time(clientDeadline(b)))
  }
  return list.sort((a, b) => orderKey(a) - orderKey(b))
}

// All clients currently on the board, grouped by column and sorted
export function groupBoard(clients, now = new Date()) {
  const groups = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, []]))
  for (const c of clients) if (isOnBoard(c, now)) groups[columnOf(c)].push(c)
  for (const id of Object.keys(groups)) groups[id] = sortColumn(id, groups[id])
  return groups
}

// dd/mm, with the year only when it isn't the current one
export function shortDate(value, now = new Date()) {
  const d = toDay(value)
  if (!d) return ''
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return d.getUTCFullYear() === now.getFullYear() ? `${dd}/${mm}` : `${dd}/${mm}/${String(d.getUTCFullYear()).slice(2)}`
}

// WhatsApp chat link for a client's phone, or null
export function whatsappUrl(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  const intl = digits.startsWith('972') ? digits : digits.startsWith('0') ? `972${digits.slice(1)}` : digits
  return `https://wa.me/${intl}`
}

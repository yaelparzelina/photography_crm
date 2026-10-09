import { getClientName } from './clientUtils'
import { toInputDate } from './dateUtils'

// --- Consent wording & defaults ---

export const NEWSLETTER_CONSENT_TEXT =
  'אשמח לקבל ניוזלטר, טיפים והטבות בלעדיות ללקוחות – מבטיחה לא להציף והסרה בקליק בכל עת.'

// Whether the consent box on the agreement signing page starts ticked.
// Note: an unticked box (active opt-in) is stronger legal proof of consent.
export const NEWSLETTER_DEFAULT_CHECKED = true

// Required by Israeli anti-spam law at the start of the subject line
export const AD_SUBJECT_PREFIX = 'פרסומת: '

export const SENDER_FOOTER = 'רויטל פרצלינה | צילום\n054-8788851 | rparzelina@gmail.com'

export const CONSENT_SOURCE_LABELS = {
  owner: 'סומן ידנית',
  agreement: 'בחתימה על הסכם',
}

export const UNSUBSCRIBE_SOURCE_LABELS = {
  owner: 'הוסר ידנית',
  link: 'דרך קישור ההסרה',
  agreement: 'סירב/ה בחתימה על הסכם',
}

// --- Status ---

export const NEWSLETTER_STATUS = {
  subscribed: { label: 'מנוי/ה', color: 'bg-green-100 text-green-800' },
  declined: { label: 'סירב/ה', color: 'bg-orange-100 text-orange-800' },
  unsubscribed: { label: 'הוסר/ה', color: 'bg-red-100 text-red-800' },
  none: { label: 'לא נשאל/ה', color: 'bg-gray-100 text-gray-600' },
}

export const NEWSLETTER_FIELDS = [
  'newsletterConsent', 'newsletterConsentAt', 'newsletterConsentSource',
  'newsletterUnsubscribedAt', 'newsletterUnsubscribeSource',
]

// subscribed: agreed · declined: said no when signing an agreement ·
// unsubscribed: removed (via the unsubscribe link or by the owner) · none: never asked
export function getNewsletterStatus(client) {
  if (client?.newsletterConsent) return 'subscribed'
  if (client?.newsletterUnsubscribedAt) {
    return client.newsletterUnsubscribeSource === 'agreement' ? 'declined' : 'unsubscribed'
  }
  return 'none'
}

// Only a manual removal by the owner may be undone back to "never asked" (the client's own refusal may not)
export function canResetToNone(client) {
  return getNewsletterStatus(client) === 'unsubscribed' && client.newsletterUnsubscribeSource === 'owner'
}

export const RESET_TO_NONE = {
  newsletterConsent: false, newsletterUnsubscribedAt: null, newsletterUnsubscribeSource: null,
}

// Fields to write when consent is turned on/off
export function consentChange(on, source, at = new Date()) {
  return on
    ? { newsletterConsent: true, newsletterConsentAt: at, newsletterConsentSource: source, newsletterUnsubscribedAt: null, newsletterUnsubscribeSource: null }
    : { newsletterConsent: false, newsletterUnsubscribedAt: at, newsletterUnsubscribeSource: source }
}

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

// --- Filtering ---

function toDate(v) {
  if (!v) return null
  const d = v.toDate ? v.toDate() : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function filterMailingList(clients, { newsletterStatus = 'subscribed', typeIds, statuses, from, to, search }) {
  const q = (search || '').trim().toLowerCase()
  return clients.filter((c) => {
    if (newsletterStatus !== 'all' && getNewsletterStatus(c) !== newsletterStatus) return false
    // Empty selections mean "no filter"
    if (typeIds?.length && !typeIds.includes(c.photoshootTypeId || '')) return false
    if (statuses?.length && !statuses.includes(c.status || 'new_lead')) return false
    if (from || to) {
      const shoot = toDate(c.shootDate)
      if (!shoot) return false
      if (from && shoot < from) return false
      if (to && shoot > new Date(to.getTime() + 86399999)) return false
    }
    if (q) {
      const hay = `${getClientName(c)} ${c.email || ''} ${c.phone || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

// A client can receive the newsletter only when subscribed and has an email
export function canReceive(client) {
  return getNewsletterStatus(client) === 'subscribed' && !!normalizeEmail(client.email)
}

// --- Export (CSV) ---
// English headers that Mailchimp, MailerLite and Brevo recognize automatically on import.

function toE164(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('972')) return `+${digits}`
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`
  return digits
}

function csvCell(value) {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildMailingCsv(clients, typeMap) {
  const header = ['Email', 'First Name', 'Last Name', 'Phone', 'Photoshoot Type', 'Last Shoot Date', 'Consent Date', 'Consent Source', 'Tags']
  const rows = clients.map((c) => {
    const type = typeMap[c.photoshootTypeId] || ''
    const firstName = c.firstName || (!c.lastName ? c.name || '' : '')
    return [
      normalizeEmail(c.email),
      firstName,
      c.lastName || '',
      toE164(c.phone),
      type,
      toInputDate(c.shootDate),
      toInputDate(c.newsletterConsentAt),
      CONSENT_SOURCE_LABELS[c.newsletterConsentSource] || '',
      type,
    ]
  })
  // BOM so Excel shows Hebrew correctly; the newsletter services accept it too
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
}

// --- Gmail ---

export function unsubscribeUrl(origin = window.location.origin, base = import.meta.env.BASE_URL) {
  return `${origin}${base}#/unsubscribe`
}

export function emailFooter(link) {
  return `\n\n\n—\n${SENDER_FOOTER}\nלהסרה מרשימת התפוצה: ${link}`
}

export function gmailComposeUrl(emails, { subject = AD_SUBJECT_PREFIX, body = '' } = {}) {
  // encodeURIComponent (not URLSearchParams) so spaces stay %20 rather than '+'
  const params = { view: 'cm', fs: '1', bcc: emails.join(','), su: subject, body }
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `https://mail.google.com/mail/?${qs}`
}

// Gmail's daily limit for regular accounts is 500 recipients
export const GMAIL_DAILY_LIMIT = 500

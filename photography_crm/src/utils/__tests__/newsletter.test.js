import { describe, it, expect } from 'vitest'
import {
  getNewsletterStatus, consentChange, filterMailingList, canReceive, buildMailingCsv,
  gmailComposeUrl, emailFooter, unsubscribeUrl, NEWSLETTER_CONSENT_TEXT,
} from '../newsletter'

const ts = (iso) => ({ toDate: () => new Date(iso) })

const clients = [
  { id: 'a', firstName: 'דנה', lastName: 'לוי', email: ' Dana@Example.com ', phone: '050-1234567', photoshootTypeId: 'bat', status: 'done',
    shootDate: ts('2025-03-10'), newsletterConsent: true, newsletterConsentAt: ts('2025-03-01'), newsletterConsentSource: 'agreement' },
  { id: 'b', firstName: 'רון', lastName: 'כהן', email: 'ron@example.com', photoshootTypeId: 'family', status: 'new_lead',
    shootDate: ts('2024-06-01'), newsletterConsent: true, newsletterConsentSource: 'owner' },
  { id: 'c', firstName: 'גיל', email: 'gil@example.com', photoshootTypeId: 'bat', status: 'done',
    newsletterConsent: false, newsletterUnsubscribedAt: ts('2025-05-01') },
  { id: 'd', name: 'לקוח ישן', email: '', photoshootTypeId: 'family', newsletterConsent: true },
  { id: 'e', firstName: 'נועה', email: 'noa@example.com' },
]

describe('newsletter status', () => {
  it('distinguishes subscribed, unsubscribed and never subscribed', () => {
    expect(clients.map(getNewsletterStatus)).toEqual(['subscribed', 'subscribed', 'unsubscribed', 'subscribed', 'none'])
  })

  it('consentChange records date and source, and turning off records an unsubscribe', () => {
    const at = new Date('2025-01-01')
    expect(consentChange(true, 'owner', at)).toMatchObject({ newsletterConsent: true, newsletterConsentAt: at, newsletterConsentSource: 'owner', newsletterUnsubscribedAt: null })
    expect(consentChange(false, 'link', at)).toMatchObject({ newsletterConsent: false, newsletterUnsubscribedAt: at, newsletterUnsubscribeSource: 'link' })
  })

  it('only subscribed clients with an email can receive', () => {
    expect(clients.filter(canReceive).map((c) => c.id)).toEqual(['a', 'b'])
  })
})

describe('filterMailingList', () => {
  const ids = (opts) => filterMailingList(clients, opts).map((c) => c.id)

  it('defaults to subscribers', () => {
    expect(ids({})).toEqual(['a', 'b', 'd'])
  })
  it('filters by several photoshoot types, client status and shoot date range', () => {
    expect(ids({ typeIds: ['bat'] })).toEqual(['a'])
    expect(ids({ newsletterStatus: 'all', typeIds: ['bat', 'family'] })).toEqual(['a', 'b', 'c', 'd'])
    expect(ids({ statuses: ['done'] })).toEqual(['a'])
    expect(ids({ from: new Date('2025-01-01') })).toEqual(['a'])
    expect(ids({ to: new Date('2024-12-31') })).toEqual(['b'])
    expect(ids({ newsletterStatus: 'all', search: 'רון' })).toEqual(['b'])
  })
})

describe('buildMailingCsv', () => {
  it('uses headers the newsletter services recognize, normalized emails, +972 phones and a BOM', () => {
    const csv = buildMailingCsv([clients[0]], { bat: 'בת מצווה' })
    expect(csv.startsWith('﻿Email,First Name,Last Name,Phone,Photoshoot Type,Last Shoot Date,Consent Date,Consent Source,Tags')).toBe(true)
    expect(csv).toContain('dana@example.com,דנה,לוי,+972501234567,בת מצווה,2025-03-10,2025-03-01,בחתימה על הסכם,בת מצווה')
  })
  it('quotes values with commas', () => {
    expect(buildMailingCsv([{ ...clients[0], lastName: 'לוי, כהן' }], {})).toContain('"לוי, כהן"')
  })
})

describe('gmail', () => {
  it('builds a compose link with BCC, subject and body', () => {
    const url = gmailComposeUrl(['a@x.com', 'b@x.com'], { subject: 'פרסומת: מבצע', body: 'שלום עולם' })
    expect(url.startsWith('https://mail.google.com/mail/?view=cm&fs=1&bcc=a%40x.com%2Cb%40x.com&su=')).toBe(true)
    expect(decodeURIComponent(url.split('su=')[1].split('&')[0])).toBe('פרסומת: מבצע')
    expect(url).not.toContain('+')
  })
  it('footer includes sender details and the unsubscribe link', () => {
    const link = unsubscribeUrl('https://site.test', '/app/')
    expect(link).toBe('https://site.test/app/#/unsubscribe')
    expect(emailFooter(link)).toContain('054-8788851')
    expect(emailFooter(link)).toContain('להסרה מרשימת התפוצה: https://site.test/app/#/unsubscribe')
  })
  it('consent text is the agreed wording', () => {
    expect(NEWSLETTER_CONSENT_TEXT).toBe('אשמח לקבל ניוזלטר, טיפים והטבות בלעדיות ללקוחות – מבטיחה לא להציף והסרה בקליק בכל עת.')
  })
})

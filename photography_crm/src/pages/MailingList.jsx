import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Download, Copy, Check, AlertTriangle, X, Trash2 } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePendingUnsubscribes, useNewsletterSends } from '../hooks/useNewsletter'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Segmented from '../components/ui/Segmented'
import CheckboxGroup from '../components/ui/CheckboxGroup'
import CopyLink from '../components/ui/CopyLink'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { inputClass, cardClass } from '../components/ui/styles'
import { STATUS_OPTIONS, IN_PROGRESS_PRESET } from '../utils/statusConfig'
import { getClientName } from '../utils/clientUtils'
import { formatDate, toInputDate, fromInputDate } from '../utils/dateUtils'
import {
  NEWSLETTER_STATUS, CONSENT_SOURCE_LABELS, UNSUBSCRIBE_SOURCE_LABELS, AD_SUBJECT_PREFIX, GMAIL_DAILY_LIMIT,
  getNewsletterStatus, filterMailingList, canReceive, normalizeEmail, buildMailingCsv,
  gmailComposeUrl, unsubscribeUrl, emailFooter,
} from '../utils/newsletter'

const NEWSLETTER_FILTERS = [
  { value: 'subscribed', label: 'מנויים' },
  { value: 'unsubscribed', label: 'הוסרו' },
  { value: 'none', label: 'לא נרשמו' },
  { value: 'all', label: 'הכל' },
]

const thClass = 'px-3 py-3 text-xs font-medium text-gray-500 text-start whitespace-nowrap'
const tdClass = 'px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap'

function NewsletterBadge({ client }) {
  const status = getNewsletterStatus(client)
  const config = NEWSLETTER_STATUS[status]
  const detail = status === 'subscribed'
    ? `${formatDate(client.newsletterConsentAt)} · ${CONSENT_SOURCE_LABELS[client.newsletterConsentSource] || ''}`
    : status === 'unsubscribed'
      ? `${formatDate(client.newsletterUnsubscribedAt)} · ${UNSUBSCRIBE_SOURCE_LABELS[client.newsletterUnsubscribeSource] || ''}`
      : ''
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
      {detail && <span className="text-[11px] text-gray-400">{detail}</span>}
    </span>
  )
}

function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MailingList() {
  const navigate = useNavigate()
  const { clients, loading } = useClients()
  const { types } = usePhotoshootTypes()
  const { requests: pendingUnsubscribes, dismiss } = usePendingUnsubscribes()
  const { sends, logSend, deleteSend } = useNewsletterSends()
  const [deleteSendTarget, setDeleteSendTarget] = useState(null)

  const [newsletterStatus, setNewsletterStatus] = useState('subscribed')
  const [search, setSearch] = useState('')
  const [typeIds, setTypeIds] = useState([]) // empty = all types
  const [statuses, setStatuses] = useState([]) // empty = all statuses
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [deselected, setDeselected] = useState(new Set())
  const [copied, setCopied] = useState(false)
  const [logForm, setLogForm] = useState(null) // { method, subject } while logging a send

  const typeMap = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t.name])), [types])
  const typeOptions = useMemo(() => [...types.map((t) => ({ value: t.id, label: t.name })), { value: '', label: 'ללא סוג' }], [types])

  const rows = useMemo(() => filterMailingList(clients, {
    newsletterStatus, typeIds, statuses, from, to, search,
  }), [clients, newsletterStatus, typeIds, statuses, from, to, search])

  const selectable = rows.filter(canReceive)
  const recipients = selectable.filter((c) => !deselected.has(c.id))
  const recipientEmails = [...new Set(recipients.map((c) => normalizeEmail(c.email)))]
  const allVisibleSelected = selectable.length > 0 && selectable.every((c) => !deselected.has(c.id))
  const subscribedNoEmail = clients.filter((c) => getNewsletterStatus(c) === 'subscribed' && !normalizeEmail(c.email))
  const counts = useMemo(() => {
    const out = { subscribed: 0, unsubscribed: 0, none: 0 }
    clients.forEach((c) => { out[getNewsletterStatus(c)]++ })
    return out
  }, [clients])

  function toggleRow(id) {
    setDeselected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setDeselected((s) => {
      const next = new Set(s)
      selectable.forEach((c) => (allVisibleSelected ? next.add(c.id) : next.delete(c.id)))
      return next
    })
  }

  function describeFilters() {
    const parts = []
    if (typeIds.length) parts.push(`סוגים: ${typeIds.map((id) => typeMap[id] || 'ללא סוג').join(', ')}`)
    if (statuses.length) parts.push(`סטטוסים: ${statuses.map((s) => STATUS_OPTIONS.find((o) => o.value === s)?.label).join(', ')}`)
    if (from || to) parts.push(`צילום: ${from ? formatDate(from) : '…'}–${to ? formatDate(to) : '…'}`)
    if (search) parts.push(`חיפוש: ${search}`)
    return parts.join(' · ') || 'כל המנויים'
  }

  function openGmail() {
    const url = gmailComposeUrl(recipientEmails, { subject: AD_SUBJECT_PREFIX, body: emailFooter(unsubscribeUrl()) })
    window.open(url, '_blank', 'noopener')
    setLogForm({ method: 'gmail', subject: '' })
  }

  function exportCsv() {
    downloadFile(buildMailingCsv(recipients, typeMap), `mailing-list-${toInputDate(new Date())}.csv`, 'text/csv;charset=utf-8')
    setLogForm({ method: 'export', subject: '' })
  }

  async function copyEmails() {
    await navigator.clipboard.writeText(recipientEmails.join(', '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLog() {
    await logSend({
      subject: logForm.subject.trim(),
      method: logForm.method,
      recipientCount: recipientEmails.length,
      recipients: recipientEmails,
      filters: describeFilters(),
    })
    setLogForm(null)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>

  const noRecipientsHint = recipientEmails.length === 0 ? 'אין נמענים נבחרים — רק מנויים עם כתובת מייל יכולים לקבל דיוור' : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">רשימת תפוצה</h1>
        <p className="text-sm text-gray-500">
          {counts.subscribed} מנויים · {counts.unsubscribed} הוסרו · {counts.none} לא נרשמו
        </p>
      </div>

      {pendingUnsubscribes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-900 mb-2">
            <AlertTriangle className="w-4 h-4" /> בקשות הסרה שלא זוהו ללקוח (אין לקוח עם כתובת המייל הזו)
          </p>
          <ul className="space-y-1">
            {pendingUnsubscribes.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm text-amber-900">
                <span dir="ltr">{r.email}</span>
                <span className="text-amber-700 text-xs">{formatDate(r.createdAt)}</span>
                <Button variant="link" size="sm" onClick={() => dismiss(r.id)}>סמן כטופל</Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">אם תעדכני את המייל בכרטיס הלקוח, הבקשה תשויך אליו אוטומטית.</p>
        </div>
      )}

      {subscribedNoEmail.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
          {subscribedNoEmail.length} מנויים ללא כתובת מייל (לא יקבלו דיוור):{' '}
          {subscribedNoEmail.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ', '}
              <Button variant="link" size="md" className="underline underline-offset-2" onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
                {getClientName(c) || 'ללא שם'}
              </Button>
            </span>
          ))}
        </div>
      )}

      <Card title="סינון">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="ניוזלטר">
              <div className="flex items-center min-h-[42px]">
                <Segmented label="סטטוס ניוזלטר" options={NEWSLETTER_FILTERS} value={newsletterStatus}
                  onChange={(v) => { setNewsletterStatus(v); setDeselected(new Set()) }} />
              </div>
            </Field>
            <Field label="חיפוש" className="flex-1 min-w-[12rem]">
              <input className={inputClass()} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="שם, מייל או טלפון" />
            </Field>
            <Field label="צילום מתאריך">
              <input type="date" max="9999-12-31" className={inputClass()} value={toInputDate(from)}
                onChange={(e) => setFrom(fromInputDate(e.target.value))} />
            </Field>
            <Field label="עד תאריך">
              <input type="date" max="9999-12-31" className={inputClass()} value={toInputDate(to)}
                onChange={(e) => setTo(fromInputDate(e.target.value))} />
            </Field>
          </div>
          <CheckboxGroup label="סוג צילום" options={typeOptions} value={typeIds} onChange={setTypeIds} />
          <CheckboxGroup label="סטטוס לקוח" options={STATUS_OPTIONS} value={statuses} onChange={setStatuses}
            presets={[IN_PROGRESS_PRESET]} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-gray-900 me-auto">
            {recipientEmails.length} נמענים נבחרו
            {recipientEmails.length > GMAIL_DAILY_LIMIT && (
              <span className="text-red-600 font-normal"> · מעל מגבלת ג׳ימייל ({GMAIL_DAILY_LIMIT} ביום)</span>
            )}
          </p>
          <Button onClick={openGmail} disabled={!recipientEmails.length} disabledReason={noRecipientsHint}>
            <Mail className="w-4 h-4" /> שלח בג׳ימייל (BCC)
          </Button>
          <Button variant="secondary" onClick={exportCsv} disabled={!recipientEmails.length} disabledReason={noRecipientsHint}>
            <Download className="w-4 h-4" /> ייצוא לקובץ
          </Button>
          <Button variant="secondary" onClick={copyEmails} disabled={!recipientEmails.length} disabledReason={noRecipientsHint}>
            {copied ? <><Check className="w-4 h-4 text-green-600" /> הועתק!</> : <><Copy className="w-4 h-4" /> העתק כתובות</>}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          ג׳ימייל ייפתח עם הנמענים בעותק מוסתר (BCC), שורת נושא שמתחילה ב״{AD_SUBJECT_PREFIX.trim()}״ (חובה לפי חוק הספאם)
          וחתימה עם קישור ההסרה. הקובץ מתאים לייבוא ל-Mailchimp, MailerLite ו-Brevo.
        </p>
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-sm font-medium text-gray-800 mb-2">קישור הסרה מרשימת התפוצה (להדבקה בסוף כל דיוור)</p>
          <CopyLink url={unsubscribeUrl()} />
        </div>

        {logForm && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-2">
              {logForm.method === 'gmail' ? 'שלחת את המייל? ' : 'ייצאת את הרשימה? '}
              מומלץ לתעד את השליחה ({recipientEmails.length} נמענים)
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="נושא הדיוור" className="flex-1 min-w-[14rem]">
                <input className={inputClass()} value={logForm.subject}
                  onChange={(e) => setLogForm((f) => ({ ...f, subject: e.target.value }))} placeholder="למשל: מבצע צילומי משפחה לחגים" />
              </Field>
              <Button onClick={handleLog} disabled={!logForm.subject.trim()} disabledReason="יש למלא נושא">תעד שליחה</Button>
              <IconButton label="לא עכשיו" onClick={() => setLogForm(null)}><X className="w-4 h-4" /></IconButton>
            </div>
          </div>
        )}
      </Card>

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={thClass}>
                <input type="checkbox" aria-label="בחר את כל הנמענים המוצגים" className="w-4 h-4 accent-gray-900"
                  checked={allVisibleSelected} disabled={!selectable.length} onChange={toggleAllVisible} />
              </th>
              <th className={thClass}>שם</th>
              <th className={thClass}>אימייל</th>
              <th className={thClass}>טלפון</th>
              <th className={thClass}>סוג צילום</th>
              <th className={thClass}>תאריך צילום</th>
              <th className={thClass}>סטטוס לקוח</th>
              <th className={thClass}>ניוזלטר</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">לא נמצאו לקוחות</td></tr>
            )}
            {rows.map((c) => {
              const receivable = canReceive(c)
              return (
                <tr key={c.id} className={receivable ? '' : 'text-gray-400'}>
                  <td className={tdClass}>
                    <input type="checkbox" aria-label={`בחר את ${getClientName(c)}`} className="w-4 h-4 accent-gray-900"
                      checked={receivable && !deselected.has(c.id)} disabled={!receivable} onChange={() => toggleRow(c.id)} />
                  </td>
                  <td className={tdClass}>
                    <Button variant="link" onClick={() => navigate(`/dashboard/clients/${c.id}`)} className="font-medium text-gray-900">
                      {getClientName(c) || '—'}
                    </Button>
                  </td>
                  <td className={tdClass} dir="ltr">
                    {c.email || <span className="text-amber-600 text-xs" dir="rtl">אין אימייל</span>}
                  </td>
                  <td className={tdClass} dir="ltr">{c.phone || '—'}</td>
                  <td className={tdClass}>{typeMap[c.photoshootTypeId] || '—'}</td>
                  <td className={tdClass}>{formatDate(c.shootDate) || '—'}</td>
                  <td className={tdClass}><StatusBadge status={c.status || 'new_lead'} /></td>
                  <td className={tdClass}><NewsletterBadge client={c} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Card title="היסטוריית דיוורים">
        {sends.length === 0 ? (
          <p className="text-sm text-gray-400">עדיין לא תועדו דיוורים</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {sends.map((s) => (
              <li key={s.id} className="py-2.5 flex items-start gap-3">
                <div className="flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="text-gray-400 text-xs">{formatDate(s.sentAt)}</span>
                  <span className="font-medium text-gray-900">{s.subject}</span>
                  <span className="text-gray-500">{s.recipientCount} נמענים · {s.method === 'gmail' ? 'ג׳ימייל' : 'ייצוא לקובץ'}</span>
                  <span className="text-gray-400 text-xs basis-full">{s.filters}</span>
                </div>
                <IconButton label="מחק תיעוד" variant="danger" onClick={() => setDeleteSendTarget(s)}>
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!deleteSendTarget}
        title="מחיקת תיעוד דיוור"
        message={`למחוק את התיעוד "${deleteSendTarget?.subject}"? הדיוור עצמו לא יבוטל, רק הרישום שלו.`}
        confirmLabel="מחק"
        destructive
        onConfirm={async () => { await deleteSend(deleteSendTarget.id); setDeleteSendTarget(null) }}
        onCancel={() => setDeleteSendTarget(null)}
      />
    </div>
  )
}

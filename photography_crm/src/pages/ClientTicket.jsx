import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePackagesByType } from '../hooks/usePackages'
import { useLinks } from '../hooks/useLinks'
import { useSignedDocuments } from '../hooks/useSignedDocuments'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import AgreementEditorModal from '../components/AgreementEditorModal'
import Modal, { ModalActions } from '../components/ui/Modal'
import ProposalTemplate from '../templates/ProposalTemplate'
import SignedAgreementDocument from '../components/SignedAgreementDocument'
import DisabledHint from '../components/ui/DisabledHint'
import Toggle from '../components/ui/Toggle'
import Segmented from '../components/ui/Segmented'
import AlbumFields from '../components/AlbumFields'
import BusinessDaysField from '../components/BusinessDaysField'
import { normalizeBusinessDays } from '../utils/delivery'
import {
  consentChange, getNewsletterStatus, canResetToNone, RESET_TO_NONE, NEWSLETTER_FIELDS, NEWSLETTER_STATUS,
  CONSENT_SOURCE_LABELS, UNSUBSCRIBE_SOURCE_LABELS,
} from '../utils/newsletter'
import { normalizeAlbum } from '../utils/album'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import CopyLink from '../components/ui/CopyLink'
import { inputClass, itemClass } from '../components/ui/styles'
import { printElement } from '../utils/printDocument'
import { STATUS_OPTIONS } from '../utils/statusConfig'
import { getClientName, signedDocumentTitle } from '../utils/clientUtils'
import { formatDate, toInputDate, fromInputDate } from '../utils/dateUtils'
import { ArrowRight, Trash2, FileText, Eye, Download, MessageCircle } from 'lucide-react'


// Comparable form of a field value (Firestore Timestamps and Dates compare by time)
function valueKey(v) {
  if (v && typeof v.toDate === 'function') return `d:${v.toDate().getTime()}`
  if (v instanceof Date) return `d:${v.getTime()}`
  return JSON.stringify(v ?? null)
}

function normalizeClientData(data) {
  const { name: legacyName, ...rest } = data
  return {
    ...rest,
    firstName: data.firstName || legacyName || '',
    lastName: data.lastName || '',
  }
}

export default function ClientTicket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Where to go back to: the page that opened this card (e.g. the mailing list), else the client list
  const returnTo = location.state?.from || '/dashboard'
  const backLabel = location.state?.fromLabel ? `חזרה ל${location.state.fromLabel}` : 'חזרה לרשימה'
  const { deleteClient } = useClients()
  const { types } = usePhotoshootTypes()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showAgreementEditor, setShowAgreementEditor] = useState(false)
  const [proposalLinkId, setProposalLinkId] = useState(null)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [activeLinkId, setActiveLinkId] = useState(null)
  const [showProposalPreview, setShowProposalPreview] = useState(false)
  const [previewSignedDoc, setPreviewSignedDoc] = useState(null)
  const [printSignedDoc, setPrintSignedDoc] = useState(null)

  const initializedRef = useRef(false)
  // Fields the owner changed on this page. All other fields always follow the saved data,
  // so changes made elsewhere (e.g. the email the client typed when signing) show up and are never overwritten.
  const editedRef = useRef(new Set())
  const printRef = useRef(null)
  const { documents: signedDocuments } = useSignedDocuments(id)

  useEffect(() => {
    if (!printSignedDoc || !printRef.current) return
    printElement(printRef.current, signedDocumentTitle(printSignedDoc))
    setPrintSignedDoc(null)
  }, [printSignedDoc])

  const { packages } = usePackagesByType(form.photoshootTypeId)
  const { createProposalLink } = useLinks()

  useEffect(() => {
    if (!dirty || !client) return
    try {
      // Only the fields edited on this page are kept, so a draft never brings back stale values.
      // Read the raw value: JSON.stringify turns Dates into strings before the replacer sees them
      const changes = Object.fromEntries([...editedRef.current].map((k) => [k, form[k]]))
      localStorage.setItem(`draft_${id}`, JSON.stringify({ _v: 2, changes }, function (key, val) {
        const raw = this[key]
        if (raw instanceof Date || typeof raw?.toDate === 'function') {
          const date = raw.toDate ? raw.toDate() : raw
          return Number.isNaN(date.getTime()) ? null : { _t: date.toISOString() }
        }
        return val
      }))
    } catch { /* ignore */ }
  }, [form, dirty, id, client])

  useEffect(() => {
    initializedRef.current = false
    const unsub = onSnapshot(doc(db, 'clients', id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setClient(data)
        const saved = normalizeClientData(data)
        if (!initializedRef.current) {
          initializedRef.current = true
          editedRef.current = new Set()
          const raw = localStorage.getItem(`draft_${id}`)
          let draft = null
          if (raw) {
            try {
              const parsed = JSON.parse(raw, (_, val) => {
                if (val && typeof val === 'object' && val._t) return fromInputDate(val._t)
                return val
              })
              if (parsed?._v === 2) {
                draft = parsed.changes || {}
              } else {
                // Older drafts stored the whole form: treat only fields that differ from the saved data as edits
                const { name: legacyName, ...draftRest } = parsed
                const full = { ...draftRest, firstName: parsed.firstName || legacyName || '', lastName: parsed.lastName || '' }
                draft = Object.fromEntries(Object.entries(full).filter(([k, v]) => k !== 'id' && valueKey(v) !== valueKey(saved[k])))
              }
            } catch { /* ignore a broken draft */ }
          }
          if (draft) {
            const changes = draft
            Object.keys(changes).forEach((k) => editedRef.current.add(k))
            setForm({ ...saved, ...changes })
            setDirty(Object.keys(changes).length > 0)
          } else {
            setForm(saved)
          }
        } else {
          // Saved data changed while the page is open: update every field the owner hasn't touched
          setForm((f) => {
            const next = { ...f }
            for (const [k, v] of Object.entries(saved)) {
              if (!editedRef.current.has(k)) next[k] = v
            }
            return next
          })
        }
      }
      setLoading(false)
    })
    return unsub
  }, [id])

  // Applies changes made on this page and remembers which fields were edited
  function update(changes) {
    Object.keys(changes).forEach((k) => editedRef.current.add(k))
    setForm((f) => ({ ...f, ...changes }))
    setDirty(true)
  }

  function set(field, value) {
    update({ [field]: value })
    if (field === 'phone') setPhoneError('')
    if (field === 'email') setEmailError('')
  }

  function albumFromPackage(pkg) {
    return {
      includesAlbum: !!pkg?.includesAlbum,
      albumSize: pkg?.albumSize || '',
      albumPages: pkg?.albumPages || '',
    }
  }

  function handlePackageChange(packageId) {
    const pkg = packages.find((p) => p.id === packageId)
    update({ packageId, ...(pkg ? albumFromPackage(pkg) : {}) })
  }

  // Clients saved before album details existed on the card show the package's album details
  const selectedPackage = packages.find((p) => p.id === form.packageId)
  const albumData = form.includesAlbum == null && selectedPackage
    ? { ...form, ...albumFromPackage(selectedPackage) }
    : form

  function setAlbum(field, value) {
    update({ ...(form.includesAlbum == null ? albumFromPackage(selectedPackage) : {}), [field]: value })
  }

  function handleNavigateBack() {
    if (dirty) { setShowLeaveWarning(true) } else { navigate(returnTo) }
  }

  function handleLeaveWithoutSaving() {
    localStorage.removeItem(`draft_${id}`)
    navigate(returnTo)
  }

  function validatePhone(phone) {
    if (!phone) return true
    return /^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ''))
  }

  function validateEmail(email) {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleSave() {
    let valid = true
    if (!validatePhone(form.phone)) { setPhoneError('מספר טלפון לא תקין'); valid = false }
    if (!validateEmail(form.email)) { setEmailError('כתובת מייל לא תקינה'); valid = false }
    if (!valid) return
    setSaving(true)
    try {
      const { id: _id, createdAt, agreementSigned, agreementSignedAt, ...rest } = form
      await updateDoc(doc(db, 'clients', id), {
        ...rest,
        shootDate: form.shootDate || null,
        eventDate: form.eventDate || null,
        businessDays: normalizeBusinessDays(form.businessDays),
        publicityApproved: !!form.publicityApproved,
        dateOfBirth: form.dateOfBirth || null,
        ...(albumData.includesAlbum != null ? normalizeAlbum(albumData) : {}),
      })
      localStorage.removeItem(`draft_${id}`)
      editedRef.current.clear()
      setDirty(false)
      navigate(returnTo)
    } finally {
      setSaving(false)
    }
  }

  const newsletterStatus = getNewsletterStatus(form)
  const newsletterNote = newsletterStatus === 'subscribed'
    ? `ברשימת התפוצה מ-${formatDate(form.newsletterConsentAt)} · ${CONSENT_SOURCE_LABELS[form.newsletterConsentSource] || ''}`
    : newsletterStatus === 'declined' || newsletterStatus === 'unsubscribed'
      ? `${NEWSLETTER_STATUS[newsletterStatus].label} ב-${formatDate(form.newsletterUnsubscribedAt)} · ${UNSUBSCRIBE_SOURCE_LABELS[form.newsletterUnsubscribeSource] || ''}`
      : 'לא נשאל/ה (לא ברשימת התפוצה)'

  // Turning the switch off only records a removal if the client was really subscribed (in the saved data).
  // Otherwise it just undoes an accidental "on", restoring the saved state.
  function handleNewsletterToggle(on) {
    if (on) { update(consentChange(true, 'owner')); return }
    if (getNewsletterStatus(client) === 'subscribed') { update(consentChange(false, 'owner')); return }
    NEWSLETTER_FIELDS.forEach((k) => editedRef.current.delete(k))
    setForm((f) => ({ ...f, ...Object.fromEntries(NEWSLETTER_FIELDS.map((k) => [k, client[k] ?? null])) }))
  }

  // Opens the messages page prefilled from what's currently on the card (saved or not)
  function openMessages() {
    navigate('/dashboard/messages', {
      state: {
        client: {
          id,
          firstName: form.firstName || '',
          fullName: getClientName(form),
          gender: form.gender === 'male' ? 'male' : 'female',
          includesAlbum: !!albumData.includesAlbum,
        },
      },
    })
  }

  async function handleDelete() {
    try {
      await deleteClient(id)
      localStorage.removeItem(`draft_${id}`)
      navigate(returnTo)
    } catch {
      // navigation only on success
    }
  }

  async function handleGenerateProposal() {
    setGeneratingProposal(true)
    try {
      const linkId = await createProposalLink(id, form.photoshootTypeId)
      setProposalLinkId(linkId)
    } finally {
      setGeneratingProposal(false)
    }
  }

  function proposalUrl(linkId) {
    return `${window.location.origin}${import.meta.env.BASE_URL}#/client/${linkId}`
  }
  function agreementUrl(linkId) {
    return `${window.location.origin}${import.meta.env.BASE_URL}#/sign/${linkId}`
  }

  const needsTypeHint = !form.photoshootTypeId ? 'יש לבחור סוג צילום בפרטי הצילום תחילה' : null

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>
  if (!client) return <div className="text-center py-20 text-gray-500">לקוח לא נמצא</div>

  return (
    <div className="max-w-3xl">
      <Button variant="link" onClick={handleNavigateBack} className="mb-6">
        <ArrowRight className="w-4 h-4" /> {backLabel}
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{getClientName(client) || 'לקוח חדש'}</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={openMessages}>
            <MessageCircle className="w-4 h-4" /> הודעות ללקוח
          </Button>
          <StatusBadge status={form.status} />
        </div>
      </div>

      <Card title="סטטוס" className="mb-4">
        <select className={inputClass()} value={form.status || 'new_lead'} onChange={(e) => set('status', e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Card>

      <Card title="פרטי לקוח" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex gap-3">
            <Field label="שם" className="flex-1">
              <input className={inputClass()} value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} />
            </Field>
            <Field label="שם משפחה" className="flex-1">
              <input className={inputClass()} value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} />
            </Field>
          </div>
          <Field label="טלפון" error={phoneError}>
            <input className={inputClass(!!phoneError)} value={form.phone || ''} placeholder="05X-XXXXXXX" onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="אימייל" error={emailError}>
            <input type="email" className={inputClass(!!emailError)} value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="תאריך לידה">
            <input type="date" max="9999-12-31" className={inputClass()}
              value={form.dateOfBirth ? toInputDate(form.dateOfBirth) : ''}
              onChange={(e) => set('dateOfBirth', fromInputDate(e.target.value))} />
          </Field>
          <Field label="פנייה בלשון">
            <div className="flex items-center min-h-[42px]">
              <Segmented label="פנייה בלשון" value={form.gender === 'male' ? 'male' : 'female'}
                options={[{ value: 'female', label: 'נקבה' }, { value: 'male', label: 'זכר' }]}
                onChange={(v) => set('gender', v)} />
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Toggle text="מאשר/ת קבלת ניוזלטר והטבות" checked={!!form.newsletterConsent}
              onChange={handleNewsletterToggle} />
            <p className="text-xs text-gray-400 mt-1">
              {newsletterNote}
              {canResetToNone(form) && (
                <>
                  {' · '}
                  <Button variant="link" size="sm" className="underline underline-offset-2 text-xs" onClick={() => update(RESET_TO_NONE)}>
                    החזר ל״לא נשאל/ה״ (סומן בטעות)
                  </Button>
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card title="פרטי הצילום" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="סוג צילום">
            <select className={inputClass()} value={form.photoshootTypeId || ''}
              onChange={(e) => { set('photoshootTypeId', e.target.value); set('packageId', '') }}>
              <option value="">בחר סוג</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="חבילה">
            <DisabledHint reason={needsTypeHint} className="block">
              <select className={`${inputClass()} disabled:pointer-events-none`} value={form.packageId || ''}
                onChange={(e) => handlePackageChange(e.target.value)} disabled={!form.photoshootTypeId}>
                <option value="">בחר חבילה</option>
                {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </DisabledHint>
          </Field>
          <Field label="תאריך צילום">
            <input type="date" max="9999-12-31" className={inputClass()}
              value={form.shootDate ? toInputDate(form.shootDate) : ''}
              onChange={(e) => set('shootDate', fromInputDate(e.target.value))} />
          </Field>
          <Field label="תאריך אירוע">
            <input type="date" max="9999-12-31" className={inputClass()}
              value={form.eventDate ? toInputDate(form.eventDate) : ''}
              onChange={(e) => set('eventDate', fromInputDate(e.target.value))} />
          </Field>
          <BusinessDaysField value={form.businessDays} onChange={(v) => set('businessDays', v)} />
          <Field label="מחיר (₪)">
            <input type="number" className={inputClass()} value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <div className="flex items-center min-h-[42px]">
            <Toggle text="שילם מקדמה" checked={form.paidAdvance} onChange={(v) => set('paidAdvance', v)} />
          </div>
          <div className="flex items-center min-h-[42px]">
            <Toggle text="אישור פרסום תמונות" checked={form.publicityApproved} onChange={(v) => set('publicityApproved', v)} />
          </div>
          <AlbumFields data={albumData} onChange={setAlbum} className="sm:col-span-2" />
        </div>
        <Field label="הערות" className="mt-4">
          <textarea rows={3} className={inputClass()} value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </Card>

      <Card title="מסמכים" className="mb-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Proposal */}
          <div className={`${itemClass} p-4`}>
            <p className="text-sm font-medium text-gray-800 mb-3">הצעת מחיר</p>
            {proposalLinkId ? (
              <CopyLink url={proposalUrl(proposalLinkId)}>
                <Button variant="link" size="sm" onClick={() => setShowProposalPreview(true)}>
                  <Eye className="w-3.5 h-3.5" /> תצוגה מקדימה
                </Button>
              </CopyLink>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleGenerateProposal} disabled={!form.photoshootTypeId || generatingProposal}
                  disabledReason={needsTypeHint}>
                  צור קישור
                </Button>
                <Button variant="secondary" onClick={() => setShowProposalPreview(true)} disabled={!form.photoshootTypeId}
                  disabledReason={needsTypeHint}>
                  תצוגה מקדימה
                </Button>
              </div>
            )}
          </div>
          {/* Agreement */}
          <div className={`${itemClass} p-4`}>
            <p className="text-sm font-medium text-gray-800 mb-3">הסכם עבודה</p>
            {activeLinkId ? (
              <CopyLink url={agreementUrl(activeLinkId)} />
            ) : (
              <Button onClick={() => setShowAgreementEditor(true)}>
                צור / ערוך הסכם
              </Button>
            )}
          </div>
        </div>
        {/* Signing status */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          {client.agreementSigned ? (
            <p className="text-sm text-green-700">
              ✓ חוזה נחתם ב-{formatDate(client.agreementSignedAt)}
              {client.email && ` על ידי ${client.email}`}
            </p>
          ) : (
            <p className="text-sm text-gray-400">ממתין לחתימת לקוח</p>
          )}
        </div>
        {/* Signed documents */}
        {signedDocuments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-2">מסמכים חתומים</p>
            <ul className="space-y-2">
              {signedDocuments.map((d) => (
                <li key={d.id} className={`${itemClass} flex items-center justify-between gap-3 px-4 py-3`}>
                  <span className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{signedDocumentTitle(d)}</span>
                  </span>
                  <span className="flex items-center gap-4 shrink-0">
                    <Button variant="link" size="sm" onClick={() => setPreviewSignedDoc(d)}>
                      <Eye className="w-3.5 h-3.5" /> תצוגה מקדימה
                    </Button>
                    <Button variant="link" size="sm" onClick={() => setPrintSignedDoc(d)}>
                      <Download className="w-3.5 h-3.5" /> הורדה
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Save + Delete + Back */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4" /> מחק לקוח
          </Button>
          <Button variant="secondary" onClick={handleNavigateBack}>
            <ArrowRight className="w-4 h-4" /> {backLabel}
          </Button>
        </div>
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showLeaveWarning}
        title="יציאה ללא שמירה"
        message="ביצעת שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת?"
        confirmLabel="צא ללא שמירה"
        destructive
        extraAction={{ label: 'שמור וצא', onClick: async () => { setShowLeaveWarning(false); await handleSave() } }}
        onConfirm={handleLeaveWithoutSaving}
        onCancel={() => setShowLeaveWarning(false)}
      />

      <ConfirmDialog
        isOpen={showDelete}
        title="מחיקת לקוח"
        message={`האם אתה בטוח שברצונך למחוק את הלקוח ${getClientName(client)}? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק לצמיתות"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <AgreementEditorModal
        isOpen={showAgreementEditor}
        onClose={() => setShowAgreementEditor(false)}
        client={{ ...client, ...form }}
        types={types}
        onLinkCreated={(linkId, synced) => {
          setActiveLinkId(linkId)
          setShowAgreementEditor(false)
          setForm((f) => ({ ...f, ...synced }))
        }}
      />

      <Modal isOpen={!!previewSignedDoc} onClose={() => setPreviewSignedDoc(null)}
        title={previewSignedDoc ? signedDocumentTitle(previewSignedDoc) : ''} maxWidth="max-w-2xl">
        {previewSignedDoc && (
          <>
            <SignedAgreementDocument signedDoc={previewSignedDoc} />
            <ModalActions>
              <Button onClick={() => setPrintSignedDoc(previewSignedDoc)}>
                <Download className="w-4 h-4" /> הורדה (PDF)
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>

      {printSignedDoc && (
        <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, width: '800px' }}>
          <SignedAgreementDocument ref={printRef} signedDoc={printSignedDoc} />
        </div>
      )}

      <Modal isOpen={showProposalPreview} onClose={() => setShowProposalPreview(false)}
        title="תצוגה מקדימה — הצעת מחיר" maxWidth="max-w-2xl">
        <ProposalTemplate
          photoshootTypeName={types.find((t) => t.id === form.photoshootTypeId)?.name || ''}
          packages={packages}
        />
      </Modal>
    </div>
  )
}

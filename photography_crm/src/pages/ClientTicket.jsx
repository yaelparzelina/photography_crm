import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePackagesByType } from '../hooks/usePackages'
import { useLinks } from '../hooks/useLinks'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import AgreementEditorModal from '../components/AgreementEditorModal'
import { STATUS_OPTIONS } from '../utils/statusConfig'
import { formatDate, toInputDate, fromInputDate } from '../utils/dateUtils'
import { ArrowRight, Copy, Check, Trash2 } from 'lucide-react'

const inputClass = 'w-full border border-gray-200 rounded-lg ps-4 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

export default function ClientTicket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteClient } = useClients()
  const { types } = usePhotoshootTypes()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [showAgreementEditor, setShowAgreementEditor] = useState(false)
  const [proposalLinkId, setProposalLinkId] = useState(null)
  const [copiedProposal, setCopiedProposal] = useState(false)
  const [copiedAgreement, setCopiedAgreement] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [activeLinkId, setActiveLinkId] = useState(null)

  const { packages } = usePackagesByType(form.photoshootTypeId)
  const { createProposalLink } = useLinks()

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setClient(data)
        setForm(data)
      }
      setLoading(false)
    })
    return unsub
  }, [id])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === 'phone') setPhoneError('')
    if (field === 'email') setEmailError('')
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
        dateOfBirth: form.dateOfBirth || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteClient(id)
      navigate('/dashboard')
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

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>
  if (!client) return <div className="text-center py-20 text-gray-500">לקוח לא נמצא</div>

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowRight className="w-4 h-4" /> חזרה לרשימה
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{client.name || 'לקוח חדש'}</h1>
        <StatusBadge status={form.status} />
      </div>

      {/* Section: Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">סטטוס</h2>
        <select className={inputClass} value={form.status || 'new_lead'} onChange={(e) => set('status', e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Section: Client Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">פרטי לקוח</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>שם מלא</label>
            <input className={inputClass} value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>טלפון</label>
            <input className={`${inputClass} ${phoneError ? 'border-red-400' : ''}`} value={form.phone || ''} placeholder="05X-XXXXXXX" onChange={(e) => set('phone', e.target.value)} />
            {phoneError && <p className="text-red-600 text-xs mt-1">{phoneError}</p>}
          </div>
          <div>
            <label className={labelClass}>אימייל</label>
            <input type="email" className={`${inputClass} ${emailError ? 'border-red-400' : ''}`} value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <label className={labelClass}>תאריך לידה</label>
            <input type="date" className={inputClass}
              value={form.dateOfBirth ? toInputDate(form.dateOfBirth) : ''}
              onChange={(e) => set('dateOfBirth', fromInputDate(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Section: Shoot Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">פרטי הצילום</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>סוג צילום</label>
            <select className={inputClass} value={form.photoshootTypeId || ''}
              onChange={(e) => { set('photoshootTypeId', e.target.value); set('packageId', '') }}>
              <option value="">בחר סוג</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>חבילה</label>
            <select className={inputClass} value={form.packageId || ''}
              onChange={(e) => set('packageId', e.target.value)} disabled={!form.photoshootTypeId}>
              <option value="">בחר חבילה</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>תאריך צילום</label>
            <input type="date" className={inputClass}
              value={form.shootDate ? toInputDate(form.shootDate) : ''}
              onChange={(e) => set('shootDate', fromInputDate(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>מחיר (₪)</label>
            <input type="number" className={inputClass} value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="text-sm font-medium text-gray-700">שילם מקדמה</label>
            <button type="button" onClick={() => set('paidAdvance', !form.paidAdvance)}
              aria-label="שילם מקדמה"
              className={`relative w-10 h-6 rounded-full transition-colors ${form.paidAdvance ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.paidAdvance ? 'right-5' : 'right-1'}`} />
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>הערות</label>
          <textarea rows={3} className={inputClass} value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>

      {/* Section: Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">מסמכים</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Proposal */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 mb-3">הצעת מחיר</p>
            {proposalLinkId ? (
              <div className="space-y-2">
                <input readOnly value={proposalUrl(proposalLinkId)}
                  className="w-full text-xs border border-gray-200 rounded-lg ps-3 pe-3 py-2 bg-gray-50 text-gray-600" />
                <button onClick={() => { navigator.clipboard.writeText(proposalUrl(proposalLinkId)); setCopiedProposal(true); setTimeout(() => setCopiedProposal(false), 2000) }}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                  {copiedProposal ? <><Check className="w-3 h-3 text-green-600" /> הועתק!</> : <><Copy className="w-3 h-3" /> העתק קישור</>}
                </button>
              </div>
            ) : (
              <button onClick={handleGenerateProposal} disabled={!form.photoshootTypeId || generatingProposal}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
                צור קישור
              </button>
            )}
          </div>
          {/* Agreement */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 mb-3">הסכם עבודה</p>
            {activeLinkId ? (
              <div className="space-y-2">
                <input readOnly value={agreementUrl(activeLinkId)}
                  className="w-full text-xs border border-gray-200 rounded-lg ps-3 pe-3 py-2 bg-gray-50 text-gray-600" />
                <button onClick={() => { navigator.clipboard.writeText(agreementUrl(activeLinkId)); setCopiedAgreement(true); setTimeout(() => setCopiedAgreement(false), 2000) }}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                  {copiedAgreement ? <><Check className="w-3 h-3 text-green-600" /> הועתק!</> : <><Copy className="w-3 h-3" /> העתק קישור</>}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAgreementEditor(true)} disabled={!form.packageId}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
                צור / ערוך הסכם
              </button>
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
      </div>

      {/* Save + Delete + Back */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-4 py-2 transition-colors">
            <Trash2 className="w-4 h-4" /> מחק לקוח
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2 transition-colors">
            <ArrowRight className="w-4 h-4" /> חזרה לרשימה
          </button>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {saved ? '✓ נשמר' : saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="מחיקת לקוח"
        message={`האם אתה בטוח שברצונך למחוק את הלקוח ${client.name}? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק לצמיתות"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <AgreementEditorModal
        isOpen={showAgreementEditor}
        onClose={() => setShowAgreementEditor(false)}
        client={client}
        packages={packages}
        types={types}
        onLinkCreated={(linkId) => { setActiveLinkId(linkId); setShowAgreementEditor(false) }}
      />
    </div>
  )
}

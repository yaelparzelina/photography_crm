import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import AgreementTemplate from '../templates/AgreementTemplate'
import PublicLayout from '../components/layout/PublicLayout'
import SignaturePad from '../components/SignaturePad'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import { inputClass, cardClass } from '../components/ui/styles'

const AGREEMENT_FIELDS = [
  'clientName', 'photoshootTypeName', 'packageName', 'shootDate', 'price',
  'photoCount', 'includesAlbum', 'albumSize', 'albumPages', 'businessDays',
]

export default function ClientSigning() {
  const { linkId } = useParams()
  const [link, setLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [signature, setSignature] = useState(null)
  const [signatureError, setSignatureError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const agreementRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'links', linkId)).then((snap) => {
      setLink(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
  }, [linkId])

  async function handleSubmit(e) {
    e.preventDefault()
    let valid = true
    if (!email.trim()) {
      setEmailError('נדרש אימייל לאישור ההסכם')
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('כתובת מייל לא תקינה')
      valid = false
    }
    if (!signature) {
      setSignatureError('נדרשת חתימה לאישור ההסכם')
      valid = false
    }
    if (!valid) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const agreement = Object.fromEntries(AGREEMENT_FIELDS.map((f) => [f, link[f] ?? null]))
      const batch = writeBatch(db)
      batch.set(doc(db, 'clients', link.clientId, 'signedDocuments', link.id), {
        type: 'agreement',
        linkId: link.id,
        agreement,
        agreementText: agreementRef.current?.innerText || '',
        email,
        signature,
        signedAt: serverTimestamp(),
      })
      batch.update(doc(db, 'clients', link.clientId), {
        email,
        agreementSigned: true,
        agreementSignedAt: serverTimestamp(),
        status: 'agreement_signed',
      })
      await batch.commit()
      setSuccess(true)
    } catch {
      setSubmitError('אירעה שגיאה, אנא נסה שוב')
      setSubmitting(false)
    }
  }

  if (loading) return <PublicLayout><div className="text-center py-20 text-gray-400">טוען...</div></PublicLayout>
  if (!link || !link.active) return (
    <PublicLayout>
      <div className={`${cardClass} text-center py-20`}>
        <p className="text-gray-600 text-sm">קישור זה אינו פעיל יותר.</p>
        <p className="text-gray-400 text-xs mt-1">אנא צור קשר עם הצלמת.</p>
      </div>
    </PublicLayout>
  )
  if (success) return (
    <PublicLayout>
      <div className={`${cardClass} text-center py-20`}>
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">תודה!</h2>
        <p className="text-gray-500 text-sm">ההסכם אושר בהצלחה. נהיה בקשר.</p>
      </div>
    </PublicLayout>
  )

  return (
    <PublicLayout>
      <div className={`${cardClass} overflow-hidden`}>
        <div ref={agreementRef}>
          <AgreementTemplate link={link} />
        </div>
        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 text-base">אישור ההסכם</h3>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="כתובת המייל שלך — לאישור ההסכם ולמשלוח עדכונים" error={emailError}>
              <input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                placeholder="your@email.com" className={inputClass(!!emailError)} />
            </Field>
            <Field label="חתימה — בחתימתי אני מאשר/ת שקראתי את תנאי ההסכם ואני מסכים/ה להם" error={signatureError}>
              <SignaturePad hasError={!!signatureError}
                onChange={(data) => { setSignature(data); setSignatureError('') }} />
            </Field>
            {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting ? 'שולח...' : 'אני מאשר/ת את ההסכם'}
            </Button>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}

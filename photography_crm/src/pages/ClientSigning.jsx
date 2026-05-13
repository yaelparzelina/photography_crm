import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import AgreementTemplate from '../templates/AgreementTemplate'
import PublicLayout from '../components/layout/PublicLayout'

export default function ClientSigning() {
  const { linkId } = useParams()
  const [link, setLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
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
    if (!email.trim()) {
      setEmailError('נדרש אימייל לאישור ההסכם')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('כתובת מייל לא תקינה')
      return
    }
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'clients', link.clientId), {
        email,
        agreementSigned: true,
        agreementSignedAt: serverTimestamp(),
        status: 'agreement_signed',
      })
      setSuccess(true)
    } catch {
      setEmailError('אירעה שגיאה, אנא נסה שוב')
      setSubmitting(false)
    }
  }

  if (loading) return <PublicLayout><div className="text-center py-20 text-gray-400">טוען...</div></PublicLayout>
  if (!link || !link.active) return (
    <PublicLayout>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-600 text-sm">קישור זה אינו פעיל יותר.</p>
        <p className="text-gray-400 text-xs mt-1">אנא צור קשר עם הצלמת.</p>
      </div>
    </PublicLayout>
  )
  if (success) return (
    <PublicLayout>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">תודה!</h2>
        <p className="text-gray-500 text-sm">ההסכם אושר בהצלחה. נהיה בקשר.</p>
      </div>
    </PublicLayout>
  )

  return (
    <PublicLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <AgreementTemplate link={link} />
        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 text-base">אישור ההסכם</h3>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת המייל שלך — לאישור ההסכם ולמשלוח עדכונים
              </label>
              <input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                placeholder="your@email.com"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${emailError ? 'border-red-400' : 'border-gray-200'}`} />
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {submitting ? 'שולח...' : 'אני מאשר/ת את ההסכם'}
            </button>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}

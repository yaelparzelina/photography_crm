import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PublicLayout from '../components/layout/PublicLayout'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import { inputClass, cardClass } from '../components/ui/styles'
import { normalizeEmail } from '../utils/newsletter'

// Public page linked from the bottom of every newsletter.
// ?email=... prefills the field (newsletter services can insert the recipient's address).
export default function Unsubscribe() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = normalizeEmail(email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('כתובת מייל לא תקינה')
      return
    }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'unsubscribeRequests'), { email: value, processed: false, createdAt: serverTimestamp() })
      setDone(true)
    } catch {
      setError('אירעה שגיאה, אנא נסו שוב')
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      <div className={`${cardClass} p-8 max-w-md mx-auto`}>
        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">הכתובת הוסרה מרשימת התפוצה</h1>
            <p className="text-gray-500 text-sm">לא יישלחו אליה עוד ניוזלטרים והטבות.</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">הסרה מרשימת התפוצה</h1>
            <p className="text-sm text-gray-600 mb-6">הקלידו את כתובת המייל שאליה קיבלתם את הדיוור, והיא תוסר מרשימת התפוצה.</p>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field label="כתובת מייל" error={error}>
                <input type="email" dir="ltr" value={email} placeholder="your@email.com"
                  onChange={(e) => { setEmail(e.target.value); setError('') }} className={inputClass(!!error)} />
              </Field>
              <Button type="submit" size="lg" fullWidth disabled={submitting}>
                {submitting ? 'מסיר...' : 'הסירו אותי מהרשימה'}
              </Button>
            </form>
          </>
        )}
      </div>
    </PublicLayout>
  )
}

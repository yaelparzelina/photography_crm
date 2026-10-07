import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Camera } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import { inputClass, cardClass } from '../components/ui/styles'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch {
      setError('שם משתמש או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className={`${cardClass} p-8`}>
          <div className="flex flex-col items-center mb-8">
            <Camera className="w-10 h-10 text-gray-700 mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900">Photography CRM</h1>
            <p className="text-gray-400 text-sm mt-1">כניסה לממשק ניהול</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="אימייל">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass()} />
            </Field>
            <Field label="סיסמה">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass()} />
            </Field>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? 'נכנס...' : 'כניסה'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

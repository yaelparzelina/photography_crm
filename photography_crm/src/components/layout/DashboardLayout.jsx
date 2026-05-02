import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { Camera, Users, Settings, LogOut } from 'lucide-react'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const linkClass = (path) =>
    `flex items-center gap-1.5 text-sm transition-colors ${
      location.pathname.startsWith(path) ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">Photography CRM</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            <Users className="w-4 h-4" /> לקוחות
          </Link>
          <Link to="/dashboard/settings" className={linkClass('/dashboard/settings')}>
            <Settings className="w-4 h-4" /> הגדרות
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> התנתקות
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { Camera, Users, Settings, LogOut, MessageCircle, Mail, Shirt, LayoutGrid, Menu, X } from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import { useUnsubscribeSync } from '../../hooks/useNewsletter'
import { useDressGuidesSeed } from '../../hooks/useDressGuides'
import { usePreShootTemplateSeed } from '../../hooks/useMessageTemplates'

const NAV = [
  { to: '/dashboard', label: 'לוח לקוחות', icon: LayoutGrid, end: true },
  { to: '/dashboard/clients', label: 'מאגר לקוחות', icon: Users, end: true },
  { to: '/dashboard/messages', label: 'הודעות ללקוח', icon: MessageCircle },
  { to: '/dashboard/mailing-list', label: 'רשימת תפוצה', icon: Mail },
  { to: '/dashboard/dress-guides', label: 'הנחיות לבוש', icon: Shirt },
  { to: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 text-sm transition-colors ${
    isActive ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
  }`

// Phone/tablet menu rows: large touch targets
const menuLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors ${
    isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
  }`

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The board uses the full screen width; other pages keep a readable width
  const wide = pathname === '/dashboard'
  // The phone menu is open for the page it was opened on, so moving to another page closes it
  const [menuPage, setMenuPage] = useState(null)
  const menuOpen = menuPage === pathname
  const setMenuOpen = (open) => setMenuPage(open ? pathname : null)
  const navRef = useRef(null)
  const { clients, loading: clientsLoading } = useClients()
  // Applies requests from the public unsubscribe page to the matching client records
  useUnsubscribeSync(clients, clientsLoading)
  // Adds the starter dress guides (and their messages) on first use
  useDressGuidesSeed()
  usePreShootTemplateSeed()

  // Close the phone menu when tapping outside it or pressing Escape
  useEffect(() => {
    if (!menuOpen) return
    const outside = (e) => { if (!navRef.current?.contains(e.target)) setMenuPage(null) }
    const key = (e) => { if (e.key === 'Escape') setMenuPage(null) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', key)
    }
  }, [menuOpen])

  async function handleLogout() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout failed', err)
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav ref={navRef} className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 lg:py-3.5 flex items-center justify-between gap-4">
          <NavLink to="/dashboard" end className="flex items-center gap-2 hover:opacity-75 transition-opacity shrink-0">
            <Camera className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">Photography CRM</span>
          </NavLink>

          <div className="hidden lg:flex items-center gap-5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon className="w-4 h-4" /> {label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" /> התנתקות
            </button>
          </div>

          <button type="button" className="lg:hidden -me-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label={menuOpen ? 'סגירת התפריט' : 'פתיחת התפריט'} aria-expanded={menuOpen} aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-gray-100 px-3 py-3 shadow-lg bg-white max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="grid gap-1 sm:grid-cols-2">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={menuLinkClass} onClick={() => setMenuPage(null)}>
                  <Icon className="w-5 h-5" /> {label}
                </NavLink>
              ))}
            </div>
            <button onClick={handleLogout}
              className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-500 hover:bg-red-50 hover:text-red-600 border-t border-gray-100">
              <LogOut className="w-5 h-5" /> התנתקות
            </button>
          </div>
        )}
      </nav>
      <main className={wide ? 'px-3 sm:px-6 py-4 sm:py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'}>
        <Outlet />
      </main>
    </div>
  )
}

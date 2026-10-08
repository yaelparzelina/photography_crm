// Renders the whole app (no component mocks) for a logged-in user on every dashboard route,
// with Firebase replaced by in-memory data. Catches crashes that isolated component tests miss.
import { render, screen, fireEvent } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {}, auth: {} }))

const data = vi.hoisted(() => ({
  photoshootTypes: [{ id: 'type1', name: 'בת מצווה', order: 0 }],
  packages: [
    { id: 'pkg1', name: 'קלאסית', photoshootTypeId: 'type1', order: 0, photoCount: 30, price: 1500, includesAlbum: false },
    { id: 'pkg2', name: 'פרימיום', photoshootTypeId: 'type1', order: 1, photoCount: 80, price: 3500, includesAlbum: true, albumSize: '30x30', albumPages: 20 },
  ],
  clients: [
    { id: 'c1', name: 'לקוח ישן', status: 'new_lead', photoshootTypeId: 'type1', packageId: 'pkg2', createdAt: { toDate: () => new Date('2024-01-01') } },
    { id: 'c2', firstName: 'דנה', lastName: 'לוי', status: 'done', photoshootTypeId: 'type1', packageId: 'pkg1',
      includesAlbum: true, albumSize: '40x40', albumPages: 24, eventDate: { toDate: () => new Date('2024-05-01') },
      createdAt: { toDate: () => new Date('2024-02-01') } },
  ],
}))

function snapOf(name, filter) {
  const docs = (data[name] || []).filter(filter || (() => true))
    .map((d) => ({ id: d.id, data: () => { const { id: _id, ...rest } = d; return rest } }))
  return { docs, empty: docs.length === 0 }
}

vi.mock('firebase/firestore', () => ({
  collection: (_db, ...path) => ({ path: path.join('/') }),
  doc: (_db, ...path) => ({ path: path.join('/') }),
  query: (ref, ...cons) => ({ ...ref, cons }),
  where: (field, op, value) => ({ field, value }),
  orderBy: () => ({}),
  onSnapshot: (ref, cb) => {
    const [col, id, sub] = ref.path.split('/')
    if (sub) cb(snapOf('none'))
    else {
      const d = data[col].find((x) => x.id === id)
      cb({ exists: () => !!d, id, data: () => d })
    }
    return () => {}
  },
  getDoc: vi.fn(), getDocs: vi.fn(), addDoc: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(), serverTimestamp: vi.fn(), writeBatch: vi.fn(),
}))

vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: (q) => {
    if (!q) return [undefined, false]
    const w = q.cons?.find((c) => c.field)
    return [snapOf(q.path, w ? (d) => d[w.field] === w.value : null), false]
  },
}))

vi.mock('react-firebase-hooks/auth', () => ({ useAuthState: () => [{ uid: 'u1', email: 'owner@example.com' }, false] }))
vi.mock('firebase/auth', () => ({ signOut: vi.fn(), signInWithEmailAndPassword: vi.fn() }))

import { AuthProvider } from '../context/AuthContext'
import App from '../App'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <StrictMode><AuthProvider><App /></AuthProvider></StrictMode>
    </MemoryRouter>
  )
}

describe('App smoke (logged in)', () => {
  beforeEach(() => localStorage.clear())

  it('dashboard renders clients and the in-progress filter', () => {
    renderAt('/dashboard')
    expect(screen.getByText('לקוח ישן')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('כל הסטטוסים'), { target: { value: 'in_progress' } })
    expect(screen.queryByText('דנה לוי')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('לקוח חדש'))
    expect(screen.getByText('צור לקוח')).toBeInTheDocument()
  })

  it('client page renders for a legacy client and album details follow the package', () => {
    renderAt('/dashboard/clients/c1')
    expect(screen.getByText('פרטי הצילום')).toBeInTheDocument()
    expect(screen.getByText('תאריך אירוע')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('20'), { target: { value: '22' } })
    expect(screen.getByDisplayValue('22')).toBeInTheDocument()
    fireEvent.click(screen.getByText('צור / ערוך הסכם'))
    expect(screen.getByText('עריכת הסכם עבודה')).toBeInTheDocument()
  })

  it('client page renders for a client with album details and event date', () => {
    renderAt('/dashboard/clients/c2')
    expect(screen.getByDisplayValue('40x40')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-05-01')).toBeInTheDocument()
  })

  it('client page survives an invalid date in saved data and in an unsaved draft', () => {
    localStorage.setItem('draft_c2', JSON.stringify({ firstName: 'דנה', eventDate: { _t: '20266-10-08' }, shootDate: 'garbage' }))
    data.clients[1].shootDate = { toDate: () => new Date('nope') }
    renderAt('/dashboard/clients/c2')
    expect(screen.getByText('תאריך אירוע')).toBeInTheDocument()
    delete data.clients[1].shootDate
  })

  it('settings packages tab renders and edits a package', () => {
    renderAt('/dashboard/settings')
    fireEvent.click(screen.getByText('חבילות'))
    fireEvent.change(screen.getByDisplayValue('בחר...'), { target: { value: 'type1' } })
    expect(screen.getByText('פרימיום')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'ערוך' })[1])
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })
})

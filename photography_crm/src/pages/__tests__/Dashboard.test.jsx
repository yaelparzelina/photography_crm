import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
}))

vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(() => [undefined, false]),
}))

const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock NewClientModal to isolate Dashboard from its Firebase dependencies
vi.mock('../../components/NewClientModal', () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-modal="true">
        <h2 id="modal-title">לקוח חדש</h2>
        <button onClick={onClose}>סגור</button>
      </div>
    ) : null,
}))

const mockUseClients = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useClients', () => ({
  useClients: () => mockUseClients(),
}))

const mockUsePhotoshootTypes = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/usePhotoshootTypes', () => ({
  usePhotoshootTypes: () => mockUsePhotoshootTypes(),
}))

import Dashboard from '../Dashboard'

const defaultTypes = [
  { id: 'type1', name: 'צילום חתונה' },
  { id: 'type2', name: 'צילום משפחה' },
]

const defaultClients = [
  {
    id: 'client1',
    firstName: 'ישראל',
    lastName: 'ישראלי',
    phone: '050-1234567',
    email: 'israel@example.com',
    status: 'new_lead',
    photoshootTypeId: 'type1',
    shootDate: null,
    paidAdvance: false,
    agreementSigned: false,
    createdAt: { toDate: () => new Date('2024-01-01') },
  },
  {
    id: 'client2',
    firstName: 'שרה',
    lastName: 'כהן',
    phone: '052-9876543',
    email: 'sarah@example.com',
    status: 'done',
    photoshootTypeId: 'type2',
    shootDate: { toDate: () => new Date('2024-06-15') },
    paidAdvance: true,
    agreementSigned: true,
    createdAt: { toDate: () => new Date('2024-02-01') },
  },
]

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseClients.mockReturnValue({
      clients: defaultClients,
      loading: false,
      createClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
    })
    mockUsePhotoshootTypes.mockReturnValue({
      types: defaultTypes,
      loading: false,
    })
  })

  it('shows loading state when loading is true', () => {
    mockUseClients.mockReturnValue({ clients: [], loading: true })
    renderDashboard()
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })

  it('shows "לא נמצאו לקוחות" when clients array is empty', () => {
    mockUseClients.mockReturnValue({ clients: [], loading: false })
    renderDashboard()
    expect(screen.getByText('לא נמצאו לקוחות')).toBeInTheDocument()
  })

  it('renders client rows with name, status select, and shoot date', () => {
    renderDashboard()
    expect(screen.getByText('ישראל ישראלי')).toBeInTheDocument()
    expect(screen.getByText('שרה כהן')).toBeInTheDocument()
    // Status is now a colorful badge button — default sort is createdAt desc
    // sarah (2024-02-01, done) first → 'הסתיים', israel (2024-01-01, new_lead) second → 'ליד חדש'
    const tbody = screen.getAllByRole('rowgroup')[1]
    const rows = within(tbody).getAllByRole('row')
    expect(within(rows[0]).getByText('הסתיים')).toBeInTheDocument()
    expect(within(rows[1]).getByText('ליד חדש')).toBeInTheDocument()
    expect(screen.getByText('15/06/2024')).toBeInTheDocument()
  })

  it('filters clients by firstName search', () => {
    renderDashboard()
    const input = screen.getByPlaceholderText('חיפוש לפי שם, טלפון, מייל...')
    fireEvent.change(input, { target: { value: 'ישראל' } })
    expect(screen.getByText('ישראל ישראלי')).toBeInTheDocument()
    expect(screen.queryByText('שרה כהן')).not.toBeInTheDocument()
  })

  it('filters clients by phone search', () => {
    renderDashboard()
    const input = screen.getByPlaceholderText('חיפוש לפי שם, טלפון, מייל...')
    fireEvent.change(input, { target: { value: '052' } })
    expect(screen.queryByText('ישראל ישראלי')).not.toBeInTheDocument()
    expect(screen.getByText('שרה כהן')).toBeInTheDocument()
  })

  it('filters clients by email search', () => {
    renderDashboard()
    const input = screen.getByPlaceholderText('חיפוש לפי שם, טלפון, מייל...')
    fireEvent.change(input, { target: { value: 'sarah@' } })
    expect(screen.queryByText('ישראל ישראלי')).not.toBeInTheDocument()
    expect(screen.getByText('שרה כהן')).toBeInTheDocument()
  })

  it('filters clients by several statuses with checkboxes, and "נקה" shows all again', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /כל הסטטוסים/ }))
    const panel = screen.getByRole('listbox')
    fireEvent.click(within(panel).getByLabelText('הסתיים'))
    expect(screen.queryByText('ישראל ישראלי')).not.toBeInTheDocument()
    expect(screen.getByText('שרה כהן')).toBeInTheDocument()
    fireEvent.click(within(panel).getByLabelText('ליד חדש'))
    expect(screen.getByText('ישראל ישראלי')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2 נבחרו/ })).toBeInTheDocument()
    fireEvent.click(within(panel).getByText('נקה בחירה'))
    expect(within(panel).getByLabelText('הסתיים')).not.toBeChecked()
    expect(screen.getByText('ישראל ישראלי')).toBeInTheDocument()
    expect(screen.getByText('שרה כהן')).toBeInTheDocument()
  })

  it('"in progress" filter hides done and didnt_book clients', () => {
    mockUseClients.mockReturnValue({
      clients: [...defaultClients, { ...defaultClients[0], id: 'client3', firstName: 'דנה', lastName: 'לוי', status: 'didnt_book' }],
      loading: false,
      updateClient: vi.fn(),
    })
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /כל הסטטוסים/ }))
    const panel = screen.getByRole('listbox')
    fireEvent.click(within(panel).getByText('הכל בתהליך'))
    expect(within(panel).getByLabelText('ליד חדש')).toBeChecked()
    expect(within(panel).getByLabelText('עריכה בתהליך')).toBeChecked()
    expect(within(panel).getByLabelText('הסתיים')).not.toBeChecked()
    expect(within(panel).getByLabelText('לא סגר')).not.toBeChecked()
    expect(screen.getByRole('button', { expanded: true })).toHaveTextContent('הכל בתהליך')
    expect(screen.getByText('ישראל ישראלי')).toBeInTheDocument()
    expect(screen.queryByText('שרה כהן')).not.toBeInTheDocument()
    expect(screen.queryByText('דנה לוי')).not.toBeInTheDocument()
  })

  it('status menu opens upwards for a row at the bottom of the screen, downwards otherwise', () => {
    renderDashboard()
    const badge = screen.getAllByRole('button', { name: /ליד חדש/ })[0]
    badge.getBoundingClientRect = () => ({ top: window.innerHeight - 30, bottom: window.innerHeight - 6, right: 500, left: 400 })
    fireEvent.click(badge)
    let menu = screen.getByRole('menu')
    expect(menu.style.bottom).not.toBe('')
    expect(menu.style.top).toBe('')
    fireEvent.click(badge)

    badge.getBoundingClientRect = () => ({ top: 100, bottom: 124, right: 500, left: 400 })
    fireEvent.click(badge)
    menu = screen.getByRole('menu')
    expect(menu.style.top).toBe('128px')
    fireEvent.scroll(window)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('clicking a row navigates to /dashboard/clients/:id', () => {
    renderDashboard()
    fireEvent.click(screen.getByText('ישראל ישראלי'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/clients/client1')
  })

  it('clicking "+ לקוח חדש" button opens the modal', () => {
    renderDashboard()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('לקוח חדש'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('לקוח חדש', { selector: '#modal-title' })).toBeInTheDocument()
  })

  it('clicking name column header sorts by firstName asc then desc on second click', () => {
    renderDashboard()
    const nameHeader = screen.getByRole('columnheader', { name: /שם/ })
    // First click: sort by firstName asc — י (yod) comes before ש (shin) in Hebrew alphabet
    fireEvent.click(nameHeader)
    let rows = screen.getAllByRole('row')
    // rows[0] is header row, rows[1] and rows[2] are data rows
    expect(within(rows[1]).getByText('ישראל ישראלי')).toBeInTheDocument()

    // Second click: toggle to desc
    fireEvent.click(nameHeader)
    rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('שרה כהן')).toBeInTheDocument()
  })

  it('shows photoshoot type name from typeMap', () => {
    renderDashboard()
    expect(screen.getByText('צילום חתונה')).toBeInTheDocument()
    expect(screen.getByText('צילום משפחה')).toBeInTheDocument()
  })
})

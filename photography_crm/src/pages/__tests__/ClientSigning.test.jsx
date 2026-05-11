import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- Firebase mocks ---
vi.mock('../../firebase', () => ({ db: {} }))

const mockGetDoc = vi.hoisted(() => vi.fn())
const mockUpdateDoc = vi.hoisted(() => vi.fn())
const mockDoc = vi.hoisted(() => vi.fn())
const mockServerTimestamp = vi.hoisted(() => vi.fn(() => 'SERVER_TS'))

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  updateDoc: mockUpdateDoc,
  serverTimestamp: mockServerTimestamp,
}))

// --- Router mock ---
vi.mock('react-router-dom', () => ({
  useParams: () => ({ linkId: 'link-1' }),
}))

// --- Template & layout mocks ---
vi.mock('../../templates/AgreementTemplate', () => ({
  default: ({ link }) => (
    <div data-testid="agreement-template">
      <span>{link.clientName}</span>
    </div>
  ),
}))

vi.mock('../../components/layout/PublicLayout', () => ({
  default: ({ children }) => <div data-testid="public-layout">{children}</div>,
}))

import ClientSigning from '../ClientSigning'

const activeLink = {
  active: true,
  clientId: 'client-1',
  clientName: 'ישראל ישראלי',
  photoshootTypeName: 'צילום חתונה',
  packageName: 'חבילה בסיסית',
  photoCount: 50,
  includesAlbum: false,
  price: 3000,
}

function makeSnap({ exists = true, data = activeLink } = {}) {
  return { exists: () => exists, id: 'link-1', data: () => data }
}

describe('ClientSigning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.mockReturnValue({})
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('shows loading state initially', () => {
    mockGetDoc.mockReturnValue(new Promise(() => {}))
    render(<ClientSigning />)
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })

  it('shows expired message when link does not exist', async () => {
    mockGetDoc.mockResolvedValue(makeSnap({ exists: false }))
    render(<ClientSigning />)
    await waitFor(() => {
      expect(screen.getByText('קישור זה אינו פעיל יותר.')).toBeInTheDocument()
    })
  })

  it('shows expired message when active: false', async () => {
    mockGetDoc.mockResolvedValue(makeSnap({ exists: true, data: { ...activeLink, active: false } }))
    render(<ClientSigning />)
    await waitFor(() => {
      expect(screen.getByText('קישור זה אינו פעיל יותר.')).toBeInTheDocument()
    })
    expect(screen.getByText('אנא צור קשר עם הצלמת.')).toBeInTheDocument()
  })

  it('shows agreement template and email form when active', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => {
      expect(screen.getByTestId('agreement-template')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'אני מאשר/ת את ההסכם' })).toBeInTheDocument()
  })

  it('shows email validation error on invalid email submission', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
    // Use fireEvent.submit on the form to bypass jsdom native validation
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('כתובת מייל לא תקינה')).toBeInTheDocument()
    })
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('shows success screen after successful form submission', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    mockUpdateDoc.mockResolvedValue(undefined)
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('תודה!')).toBeInTheDocument()
    })
    expect(screen.getByText('ההסכם אושר בהצלחה. נהיה בקשר.')).toBeInTheDocument()
  })

  it('shows error message if updateDoc throws', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    mockUpdateDoc.mockRejectedValue(new Error('Firestore error'))
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('אירעה שגיאה, אנא נסה שוב')).toBeInTheDocument()
    })
  })
})

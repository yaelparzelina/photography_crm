import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- Firebase mocks ---
vi.mock('../../firebase', () => ({ db: {}, auth: {} }))

const mockOnSnapshot = vi.hoisted(() => vi.fn())
const mockUpdateDoc = vi.hoisted(() => vi.fn())
const mockDoc = vi.hoisted(() => vi.fn())

vi.mock('firebase/firestore', () => ({
  onSnapshot: mockOnSnapshot,
  updateDoc: mockUpdateDoc,
  doc: mockDoc,
  collection: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  setDoc: vi.fn(),
}))

// --- Hook mocks ---
const mockDeleteClient = vi.hoisted(() => vi.fn())
const mockUseClients = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useClients', () => ({
  useClients: () => mockUseClients(),
}))

const mockUsePhotoshootTypes = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/usePhotoshootTypes', () => ({
  usePhotoshootTypes: () => mockUsePhotoshootTypes(),
}))

const mockUsePackagesByType = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/usePackages', () => ({
  usePackagesByType: () => mockUsePackagesByType(),
}))

const mockCreateProposalLink = vi.hoisted(() => vi.fn())
const mockUseLinks = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useLinks', () => ({
  useLinks: () => mockUseLinks(),
}))

// --- Router mock ---
const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// --- AgreementEditorModal mock ---
vi.mock('../../components/AgreementEditorModal', () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-modal="true" data-testid="agreement-editor-modal">
        <h2>עריכת הסכם עבודה</h2>
        <button onClick={onClose}>סגור</button>
      </div>
    ) : null,
}))

import ClientTicket from '../ClientTicket'

// --- Default test data ---
const clientData = {
  name: 'ישראל ישראלי',
  phone: '050-1234567',
  email: 'israel@example.com',
  status: 'new_lead',
  photoshootTypeId: 'type1',
  packageId: 'pkg1',
  shootDate: null,
  dateOfBirth: null,
  price: 3000,
  paidAdvance: false,
  notes: '',
  agreementSigned: false,
  agreementSignedAt: null,
  createdAt: { toDate: () => new Date('2024-01-01') },
}

const defaultTypes = [
  { id: 'type1', name: 'צילום חתונה' },
  { id: 'type2', name: 'צילום משפחה' },
]

const defaultPackages = [
  { id: 'pkg1', name: 'חבילה בסיסית', photoCount: 50, includesAlbum: false },
  { id: 'pkg2', name: 'חבילה מורחבת', photoCount: 100, includesAlbum: true, albumSize: '30x30', albumPages: 20 },
]

function makeSnapshot({ exists = true, data = clientData } = {}) {
  return {
    exists: () => exists,
    id: 'client-1',
    data: () => data,
  }
}

function setupOnSnapshot(snap) {
  mockOnSnapshot.mockImplementation((ref, callback) => {
    callback(snap)
    return () => {}
  })
}

function renderTicket() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/clients/client-1']}>
      <Routes>
        <Route path="/dashboard/clients/:id" element={<ClientTicket />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ClientTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.mockReturnValue({})
    mockUpdateDoc.mockResolvedValue(undefined)
    mockDeleteClient.mockResolvedValue(undefined)
    mockUseClients.mockReturnValue({ deleteClient: mockDeleteClient })
    mockUsePhotoshootTypes.mockReturnValue({ types: defaultTypes })
    mockUsePackagesByType.mockReturnValue({ packages: defaultPackages })
    mockCreateProposalLink.mockResolvedValue('proposal-link-123')
    mockUseLinks.mockReturnValue({ createProposalLink: mockCreateProposalLink })
  })

  it('shows loading state when onSnapshot has not resolved', () => {
    // Make onSnapshot NOT call the callback immediately
    mockOnSnapshot.mockImplementation(() => () => {})
    renderTicket()
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })

  it('shows "לקוח לא נמצא" when snapshot does not exist', () => {
    setupOnSnapshot(makeSnapshot({ exists: false }))
    renderTicket()
    expect(screen.getByText('לקוח לא נמצא')).toBeInTheDocument()
  })

  it('renders all sections: פרטי לקוח, פרטי הצילום, סטטוס, מסמכים', () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    expect(screen.getByText('פרטי לקוח')).toBeInTheDocument()
    expect(screen.getByText('פרטי הצילום')).toBeInTheDocument()
    expect(screen.getByText('סטטוס')).toBeInTheDocument()
    expect(screen.getByText('מסמכים')).toBeInTheDocument()
  })

  it('editing name field updates form state', () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    const nameInput = screen.getByDisplayValue('ישראל ישראלי')
    fireEvent.change(nameInput, { target: { value: 'שם חדש' } })
    expect(screen.getByDisplayValue('שם חדש')).toBeInTheDocument()
  })

  it('changing photoshoot type clears packageId', () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    // type1 is selected — find by its option text
    const typeSelect = screen.getByDisplayValue('צילום חתונה')
    fireEvent.change(typeSelect, { target: { value: 'type2' } })
    // After changing type, packageId should be cleared → package select shows empty option
    const selects = screen.getAllByRole('combobox')
    // selects[0] = status (top section), selects[1] = type, selects[2] = package
    const packageSelectEl = selects[2]
    expect(packageSelectEl.value).toBe('')
  })

  it('save button calls updateDoc with form data', async () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    fireEvent.click(screen.getByText('שמור שינויים'))
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalled()
    })
  })

  it('save button shows "✓ נשמר" feedback briefly', async () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    fireEvent.click(screen.getByText('שמור שינויים'))
    await waitFor(() => {
      expect(screen.getByText('✓ נשמר')).toBeInTheDocument()
    })
  })

  it('delete button opens confirm dialog', () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    fireEvent.click(screen.getByText('מחק לקוח'))
    expect(screen.getByText('מחיקת לקוח')).toBeInTheDocument()
    expect(screen.getByText('מחק לצמיתות')).toBeInTheDocument()
  })

  it('confirming delete calls deleteClient and navigates to /dashboard', async () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    fireEvent.click(screen.getByText('מחק לקוח'))
    fireEvent.click(screen.getByText('מחק לצמיתות'))
    await waitFor(() => {
      expect(mockDeleteClient).toHaveBeenCalledWith('client-1')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('"צור קישור" proposal button calls createProposalLink and shows link URL', async () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    const proposalBtn = screen.getByText('צור קישור')
    fireEvent.click(proposalBtn)
    await waitFor(() => {
      expect(mockCreateProposalLink).toHaveBeenCalledWith('client-1', 'type1')
    })
    await waitFor(() => {
      expect(screen.getByDisplayValue(/proposal-link-123/)).toBeInTheDocument()
    })
  })

  it('"צור / ערוך הסכם" button opens AgreementEditorModal', () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    expect(screen.queryByTestId('agreement-editor-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('צור / ערוך הסכם'))
    expect(screen.getByTestId('agreement-editor-modal')).toBeInTheDocument()
  })

  it('shows agreement signed status with date and email', () => {
    const signedData = {
      ...clientData,
      agreementSigned: true,
      agreementSignedAt: { toDate: () => new Date('2024-06-15') },
    }
    setupOnSnapshot(makeSnapshot({ data: signedData }))
    renderTicket()
    expect(screen.getByText(/חוזה נחתם ב/)).toBeInTheDocument()
    expect(screen.getByText(/15\/06\/2024/)).toBeInTheDocument()
    expect(screen.getByText(/israel@example\.com/)).toBeInTheDocument()
  })

  it('shows "ממתין לחתימת לקוח" when agreement not signed', () => {
    setupOnSnapshot(makeSnapshot())
    renderTicket()
    expect(screen.getByText('ממתין לחתימת לקוח')).toBeInTheDocument()
  })
})

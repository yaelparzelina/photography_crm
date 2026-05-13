import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- Firebase mocks ---
vi.mock('../../firebase', () => ({ db: {} }))

vi.mock('firebase/firestore', () => ({
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
  setDoc: vi.fn(),
}))

// --- useLinks mock ---
const mockCreateAgreementLink = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useLinks', () => ({
  useLinks: () => ({ createAgreementLink: mockCreateAgreementLink }),
}))

import AgreementEditorModal from '../AgreementEditorModal'

// --- Test data ---
const defaultPackages = [
  {
    id: 'pkg1',
    name: 'חבילה בסיסית',
    photoCount: 50,
    includesAlbum: false,
    albumSize: '',
    albumPages: '',
  },
  {
    id: 'pkg2',
    name: 'חבילה מורחבת',
    photoCount: 100,
    includesAlbum: true,
    albumSize: '30x30',
    albumPages: 20,
  },
]

const defaultTypes = [
  { id: 'type1', name: 'צילום חתונה' },
]

const defaultClient = {
  id: 'client-1',
  name: 'ישראל ישראלי',
  email: 'israel@example.com',
  photoshootTypeId: 'type1',
  packageId: 'pkg1',
  shootDate: new Date('2024-06-15'),
  price: 3000,
  agreementSigned: false,
}

function renderModal(props = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    client: defaultClient,
    packages: defaultPackages,
    types: defaultTypes,
    onLinkCreated: vi.fn(),
    ...props,
  }
  return render(<AgreementEditorModal {...defaultProps} />)
}

describe('AgreementEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAgreementLink.mockResolvedValue('agreement-link-456')
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "יש לבחור חבילה" message when no matching package found', () => {
    renderModal({ client: { ...defaultClient, packageId: 'nonexistent' } })
    expect(screen.getByText('יש לבחור חבילה בכרטיס הלקוח תחילה.')).toBeInTheDocument()
  })

  it('pre-fills overrides from package data when opened', () => {
    renderModal()
    // Photo count input should be pre-filled with pkg.photoCount = 50
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  it('shows photo count input pre-filled with pkg.photoCount', () => {
    renderModal({ client: { ...defaultClient, packageId: 'pkg2' } })
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  it('album toggle shows album fields when toggled on', () => {
    renderModal()
    // pkg1 has includesAlbum: false, so album fields not visible initially
    expect(screen.queryByPlaceholderText('30x30')).not.toBeInTheDocument()
    // Toggle on
    const albumToggle = screen.getByRole('button', { name: /החלף כולל אלבום/ })
    fireEvent.click(albumToggle)
    expect(screen.getByPlaceholderText('30x30')).toBeInTheDocument()
  })

  it('album toggle hides album fields when pkg has album and toggled off', () => {
    renderModal({ client: { ...defaultClient, packageId: 'pkg2' } })
    // pkg2 has includesAlbum: true, so album fields visible
    expect(screen.getByPlaceholderText('30x30')).toBeInTheDocument()
    // Toggle off
    const albumToggle = screen.getByRole('button', { name: /החלף כולל אלבום/ })
    fireEvent.click(albumToggle)
    expect(screen.queryByPlaceholderText('30x30')).not.toBeInTheDocument()
  })

  it('"צור קישור" calls createAgreementLink with correct snapshot and calls onLinkCreated', async () => {
    const onLinkCreated = vi.fn()
    renderModal({ onLinkCreated })
    fireEvent.click(screen.getByText('צור קישור'))
    await waitFor(() => {
      expect(mockCreateAgreementLink).toHaveBeenCalledWith(
        'client-1',
        expect.objectContaining({
          clientName: 'ישראל ישראלי',
          photoshootTypeName: 'צילום חתונה',
          packageName: 'חבילה בסיסית',
          photoCount: 50,
          includesAlbum: false,
        })
      )
      expect(onLinkCreated).toHaveBeenCalledWith('agreement-link-456')
    })
  })

  it('shows shoot date error and blocks generation when shoot date is empty', async () => {
    renderModal({ client: { ...defaultClient, shootDate: null } })
    fireEvent.click(screen.getByText('צור קישור'))
    expect(screen.getByText('נדרש תאריך צילום ליצירת ההסכם')).toBeInTheDocument()
    expect(mockCreateAgreementLink).not.toHaveBeenCalled()
  })

  it('after generation, shows success state with link URL', async () => {
    renderModal()
    fireEvent.click(screen.getByText('צור קישור'))
    await waitFor(() => {
      expect(screen.getByText('✓ הקישור נוצר בהצלחה')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue(/agreement-link-456/)).toBeInTheDocument()
  })

  it('when client.agreementSigned=true, shows regen warning dialog before generating', async () => {
    const signedClient = { ...defaultClient, agreementSigned: true }
    renderModal({ client: signedClient })
    fireEvent.click(screen.getByText('צור קישור'))
    // Should show warning dialog instead of generating immediately
    expect(screen.getByText('יצירת הסכם חדש')).toBeInTheDocument()
    expect(mockCreateAgreementLink).not.toHaveBeenCalled()
  })

  it('regen warning: confirming calls doGenerate', async () => {
    const signedClient = { ...defaultClient, agreementSigned: true }
    const onLinkCreated = vi.fn()
    renderModal({ client: signedClient, onLinkCreated })
    fireEvent.click(screen.getByText('צור קישור'))
    // Confirm in the warning dialog
    fireEvent.click(screen.getByText('המשך'))
    await waitFor(() => {
      expect(mockCreateAgreementLink).toHaveBeenCalled()
      expect(onLinkCreated).toHaveBeenCalledWith('agreement-link-456')
    })
  })

  it('regen warning: cancelling closes warning without generating', () => {
    const signedClient = { ...defaultClient, agreementSigned: true }
    renderModal({ client: signedClient })
    fireEvent.click(screen.getByText('צור קישור'))
    expect(screen.getByText('יצירת הסכם חדש')).toBeInTheDocument()
    // Cancel - ConfirmDialog has a "בטל" cancel button
    const cancelBtns = screen.getAllByText('בטל')
    // The one in the ConfirmDialog (not the modal's own cancel button)
    const confirmCancelBtn = cancelBtns[cancelBtns.length - 1]
    fireEvent.click(confirmCancelBtn)
    expect(screen.queryByText('יצירת הסכם חדש')).not.toBeInTheDocument()
    expect(mockCreateAgreementLink).not.toHaveBeenCalled()
  })
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- Firebase mocks ---
vi.mock('../../firebase', () => ({ db: {} }))

const mockGetDoc = vi.hoisted(() => vi.fn())
const mockBatchSet = vi.hoisted(() => vi.fn())
const mockBatchUpdate = vi.hoisted(() => vi.fn())
const mockBatchCommit = vi.hoisted(() => vi.fn())
const mockDoc = vi.hoisted(() => vi.fn())
const mockServerTimestamp = vi.hoisted(() => vi.fn(() => 'SERVER_TS'))

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  writeBatch: () => ({ set: mockBatchSet, update: mockBatchUpdate, commit: mockBatchCommit }),
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

vi.mock('../../components/SignaturePad', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange('data:image/png;base64,SIG')}>mock-sign</button>
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
    mockDoc.mockImplementation((_db, ...path) => path.join('/'))
    mockBatchCommit.mockResolvedValue(undefined)
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
    expect(mockBatchCommit).not.toHaveBeenCalled()
  })

  it('requires a signature before submitting', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('נדרשת חתימה לאישור ההסכם')).toBeInTheDocument()
    })
    expect(mockBatchCommit).not.toHaveBeenCalled()
  })

  it('saves signed document with agreement, email and signature', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
    fireEvent.click(screen.getByText('mock-sign'))
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => expect(mockBatchCommit).toHaveBeenCalled())
    expect(mockBatchSet).toHaveBeenCalledWith(
      'clients/client-1/signedDocuments/link-1',
      expect.objectContaining({
        type: 'agreement',
        linkId: 'link-1',
        email: 'client@example.com',
        signature: 'data:image/png;base64,SIG',
        signedAt: 'SERVER_TS',
        agreement: expect.objectContaining({ clientName: 'ישראל ישראלי', price: 3000 }),
      })
    )
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      'clients/client-1',
      expect.objectContaining({ email: 'client@example.com', agreementSigned: true, status: 'agreement_signed' })
    )
  })

  it('shows success screen after successful form submission', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
    fireEvent.click(screen.getByText('mock-sign'))
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('תודה!')).toBeInTheDocument()
    })
    expect(screen.getByText('ההסכם אושר בהצלחה. נהיה בקשר.')).toBeInTheDocument()
  })

  it('newsletter box is ticked by default and records consent from the agreement', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))
    const box = screen.getByRole('checkbox', { name: /אשמח לקבל ניוזלטר/ })
    expect(box).toBeChecked()
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'client@example.com' } })
    fireEvent.click(screen.getByText('mock-sign'))
    fireEvent.submit(box.closest('form'))
    await waitFor(() => expect(mockBatchCommit).toHaveBeenCalled())
    expect(mockBatchUpdate).toHaveBeenCalledWith('clients/client-1', expect.objectContaining({
      newsletterConsent: true, newsletterConsentSource: 'agreement', newsletterConsentAt: 'SERVER_TS',
    }))
    expect(mockBatchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ newsletterConsent: true }))
  })

  it('unticking the newsletter box records that the client does not want it (removes a subscription)', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))
    fireEvent.click(screen.getByRole('checkbox', { name: /אשמח לקבל ניוזלטר/ }))
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'client@example.com' } })
    fireEvent.click(screen.getByText('mock-sign'))
    fireEvent.submit(screen.getByPlaceholderText('your@email.com').closest('form'))
    await waitFor(() => expect(mockBatchCommit).toHaveBeenCalled())
    expect(mockBatchUpdate).toHaveBeenCalledWith('clients/client-1', expect.objectContaining({
      newsletterConsent: false, newsletterUnsubscribedAt: 'SERVER_TS', newsletterUnsubscribeSource: 'agreement',
    }))
    expect(mockBatchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ newsletterConsent: false }))
  })

  it('shows error message if saving fails', async () => {
    mockGetDoc.mockResolvedValue(makeSnap())
    mockBatchCommit.mockRejectedValue(new Error('Firestore error'))
    render(<ClientSigning />)
    await waitFor(() => screen.getByPlaceholderText('your@email.com'))

    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
    fireEvent.click(screen.getByText('mock-sign'))
    fireEvent.submit(emailInput.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('אירעה שגיאה, אנא נסה שוב')).toBeInTheDocument()
    })
  })
})

import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({ db: {}, auth: {} }))
vi.mock('firebase/firestore', () => ({}))
vi.mock('react-firebase-hooks/firestore', () => ({ useCollection: vi.fn(() => [undefined, false]) }))

const mockUseClients = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useClients', () => ({ useClients: () => mockUseClients() }))
vi.mock('../../hooks/usePhotoshootTypes', () => ({
  usePhotoshootTypes: () => ({ types: [{ id: 'bat', name: 'בת מצווה' }, { id: 'family', name: 'משפחה' }, { id: 'newborn', name: 'ניו בורן' }] }),
}))
const mockLogSend = vi.hoisted(() => vi.fn(() => Promise.resolve()))
const mockDismiss = vi.hoisted(() => vi.fn())
const mockDeleteSend = vi.hoisted(() => vi.fn(() => Promise.resolve()))
const mockSends = vi.hoisted(() => ({ value: [] }))
const mockPending = vi.hoisted(() => ({ value: [] }))
vi.mock('../../hooks/useNewsletter', () => ({
  usePendingUnsubscribes: () => ({ requests: mockPending.value, dismiss: mockDismiss }),
  useNewsletterSends: () => ({ sends: mockSends.value, logSend: mockLogSend, deleteSend: mockDeleteSend }),
}))
const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => mockNavigate }))

import MailingList from '../MailingList'

const ts = (iso) => ({ toDate: () => new Date(iso) })
const clients = [
  { id: 'a', firstName: 'דנה', lastName: 'לוי', email: 'dana@example.com', photoshootTypeId: 'bat', status: 'done', shootDate: ts('2025-03-10'), newsletterConsent: true, newsletterConsentAt: ts('2025-03-01'), newsletterConsentSource: 'agreement' },
  { id: 'b', firstName: 'רון', lastName: 'כהן', email: 'ron@example.com', photoshootTypeId: 'family', status: 'new_lead', newsletterConsent: true },
  { id: 'c', firstName: 'שירה', email: 'shira@example.com', photoshootTypeId: 'newborn', status: 'done', newsletterConsent: true },
  { id: 'd', firstName: 'גיל', email: 'gil@example.com', photoshootTypeId: 'bat', newsletterConsent: false, newsletterUnsubscribedAt: ts('2025-05-01'), newsletterUnsubscribeSource: 'link' },
  { id: 'e', firstName: 'בלי', lastName: 'מייל', email: '', photoshootTypeId: 'bat', newsletterConsent: true },
]

function renderPage() {
  return render(<MemoryRouter><MailingList /></MemoryRouter>)
}

describe('MailingList', () => {
  let openSpy
  beforeEach(() => {
    vi.clearAllMocks()
    mockPending.value = []
    mockSends.value = []
    mockUseClients.mockReturnValue({ clients, loading: false })
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true })
  })

  it('shows subscribers by default with name, email, type and consent details', () => {
    renderPage()
    expect(screen.getByText('דנה לוי')).toBeInTheDocument()
    expect(screen.getByText('dana@example.com')).toBeInTheDocument()
    expect(screen.getByText(/01\/03\/2025 · בחתימה על הסכם/)).toBeInTheDocument()
    expect(screen.queryByText('גיל')).not.toBeInTheDocument()
    expect(screen.getByText('3 נמענים נבחרו')).toBeInTheDocument()
  })

  it('warns about subscribers without an email', () => {
    renderPage()
    expect(screen.getByText(/1 מנויים ללא כתובת מייל/)).toBeInTheDocument()
  })

  it('filters by a group of photoshoot types with checkboxes (bat mitzvah + family only)', () => {
    renderPage()
    expect(screen.getByText('3 נמענים נבחרו')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /סוג צילום: הכל/ }))
    const types = screen.getByRole('listbox', { name: 'סוג צילום' })
    fireEvent.click(within(types).getByLabelText('בת מצווה'))
    fireEvent.click(within(types).getByLabelText('משפחה'))
    expect(screen.queryByText('שירה')).not.toBeInTheDocument()
    expect(screen.getByText('2 נמענים נבחרו')).toBeInTheDocument()
    fireEvent.click(within(types).getByText('נקה בחירה'))
    expect(screen.getByText('שירה')).toBeInTheDocument()
  })

  it('filters by client status', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /סטטוס: הכל/ }))
    const statuses = screen.getByRole('listbox', { name: 'סטטוס' })
    fireEvent.click(within(statuses).getByLabelText('הסתיים'))
    expect(screen.queryByText('רון כהן')).not.toBeInTheDocument()
    fireEvent.click(within(statuses).getByLabelText('הסתיים'))
    fireEvent.click(within(statuses).getByLabelText('הכל בתהליך'))
    expect(screen.getByText('רון כהן')).toBeInTheDocument()
    expect(screen.queryByText('דנה לוי')).not.toBeInTheDocument()
  })

  it('opens Gmail with the selected recipients in BCC, ad subject and unsubscribe footer', () => {
    renderPage()
    fireEvent.click(screen.getByLabelText('בחר את רון כהן'))
    fireEvent.click(screen.getByText(/שלח במייל/))
    const url = openSpy.mock.calls[0][0]
    const bcc = decodeURIComponent(url.split('bcc=')[1].split('&')[0])
    expect(bcc).toBe('dana@example.com,shira@example.com')
    expect(decodeURIComponent(url.split('su=')[1].split('&')[0])).toBe('פרסומת: ')
    expect(decodeURIComponent(url.split('body=')[1])).toContain('#/unsubscribe')
  })

  it('logs a send after opening Gmail', async () => {
    renderPage()
    fireEvent.click(screen.getByText(/שלח במייל/))
    fireEvent.change(screen.getByPlaceholderText(/מבצע צילומי משפחה/), { target: { value: 'מבצע חגים' } })
    fireEvent.click(screen.getByText('תעד שליחה'))
    await waitFor(() => expect(mockLogSend).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'מבצע חגים', method: 'gmail', recipientCount: 3,
    })))
  })

  it('shows unsubscribed clients when that filter is chosen, and they cannot be selected', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('סטטוס ניוזלטר'), { target: { value: 'unsubscribed' } })
    expect(screen.getByText('גיל')).toBeInTheDocument()
    expect(screen.getByText(/דרך קישור ההסרה/)).toBeInTheDocument()
    expect(screen.getByLabelText('בחר את גיל')).toBeDisabled()
  })

  it('deletes a send log entry after confirming', async () => {
    mockSends.value = [{ id: 's1', subject: 'בדיקת ממשק', recipientCount: 2, method: 'gmail', filters: '', sentAt: ts('2025-09-01') }]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'מחק תיעוד' }))
    expect(screen.getByText(/למחוק את התיעוד "בדיקת ממשק"/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('מחק'))
    await waitFor(() => expect(mockDeleteSend).toHaveBeenCalledWith('s1'))
  })

  it('separates clients who declined from those who were removed or never asked', () => {
    mockUseClients.mockReturnValue({ clients: [...clients,
      { id: 'f', firstName: 'סירבה', email: 'no@example.com', newsletterConsent: false, newsletterUnsubscribedAt: ts('2025-04-01'), newsletterUnsubscribeSource: 'agreement' },
      { id: 'g', firstName: 'לאנשאלה', email: 'q@example.com' },
    ], loading: false })
    renderPage()
    expect(screen.getByText(/4 מנויים · 1 סירבו · 1 הוסרו · 1 לא נשאלו/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('סטטוס ניוזלטר'), { target: { value: 'declined' } })
    expect(screen.getByText('סירבה')).toBeInTheDocument()
    expect(screen.queryByText('גיל')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('סטטוס ניוזלטר'), { target: { value: 'none' } })
    expect(screen.getByText('לאנשאלה')).toBeInTheDocument()
  })

  it('lists unsubscribe requests that did not match any client', () => {
    mockPending.value = [{ id: 'r1', email: 'stranger@example.com', createdAt: ts('2025-06-01') }]
    renderPage()
    expect(screen.getByText('stranger@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByText('סמן כטופל'))
    expect(mockDismiss).toHaveBeenCalledWith('r1')
  })
})

import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../../firebase', () => ({ db: {}, auth: {} }))
vi.mock('firebase/firestore', () => ({ serverTimestamp: () => 'TS' }))
vi.mock('react-firebase-hooks/firestore', () => ({ useCollection: vi.fn(() => [undefined, false]) }))

const mocks = vi.hoisted(() => ({ clients: [], updateClient: vi.fn(() => Promise.resolve()) }))
vi.mock('../../hooks/useClients', () => ({
  useClients: () => ({ clients: mocks.clients, loading: false, updateClient: mocks.updateClient, createClient: vi.fn() }),
}))
vi.mock('../../hooks/usePhotoshootTypes', () => ({
  usePhotoshootTypes: () => ({ types: [{ id: 'bat', name: 'בת מצווה' }, { id: 'family', name: 'משפחה' }] }),
}))
vi.mock('../../hooks/useMessageTemplates', () => ({
  useMessageTemplates: () => ({
    templates: [
      { id: 'tReady', title: 'התמונות מוכנות' },
      { id: 'tPre', title: 'הודעה לפני צילום', kind: 'pre_shoot' },
      { id: 'tFam', title: 'הנחיות לבוש לצילומי משפחה', guideId: 'family' },
      { id: 'tBat', title: 'הנחיות לבוש לבוק בת מצווה', guideId: 'bat-mitzvah' },
      { id: 'tBatM', title: 'הנחיות לבוש לבוק בת מצווה (לבוש צנוע)', guideId: 'bat-mitzvah-modest' },
    ],
  }),
}))
vi.mock('../../hooks/useDressGuides', () => ({
  useDressGuides: () => ({
    guides: [
      { id: 'family', name: 'צילומי משפחה' }, { id: 'bat-mitzvah', name: 'בוק בת מצווה' },
      { id: 'bat-mitzvah-modest', name: 'בוק בת מצווה (לבוש צנוע)' },
    ],
  }),
}))
const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => mockNavigate }))

import ClientBoard from '../ClientBoard'

const at = (s) => ({ toDate: () => new Date(s) })
const base = [
  { id: 'n1', firstName: 'נועה', lastName: 'כהן', status: 'new_lead', photoshootTypeId: 'family', phone: '050-1234567', createdAt: at('2026-10-30') },
  { id: 'c1', firstName: 'רון', lastName: 'לוי', status: 'proposal_sent', boardColumn: 'callback', callbackDate: at('2026-11-01T00:00:00Z') },
  { id: 'k1', firstName: 'מאיה', lastName: 'בר', status: 'agreement_sent', photoshootTypeId: 'bat', shootDate: at('2026-11-20T00:00:00Z'), eventDate: at('2026-12-10T00:00:00Z') },
  { id: 'p1', firstName: 'דנה', lastName: 'גל', status: 'shoot_scheduled', shootDate: at('2026-11-05T00:00:00Z') },
  { id: 'e1', firstName: 'שירה', lastName: 'טל', status: 'editing_in_progress', shootDate: at('2026-10-25T00:00:00Z'), businessDays: 10, paidAdvance: true, includesAlbum: true },
  { id: 'd1', firstName: 'גיל', lastName: 'אור', status: 'done', boardMovedAt: at('2026-10-30T00:00:00Z') },
  { id: 'd2', firstName: 'ישן', lastName: 'מאוד', status: 'done', boardMovedAt: at('2026-09-01T00:00:00Z') },
]

const col = (name) => screen.getByRole('region', { name })

function renderBoard() {
  return render(<MemoryRouter><ClientBoard /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-02T10:00:00Z')) // Monday
  mocks.clients = base.map((c) => ({ ...c }))
})
afterEach(() => vi.useRealTimers())

describe('ClientBoard', () => {
  it('shows each client in its column with the right tags', () => {
    renderBoard()
    expect(within(col('לקוחות חדשים')).getByText('נועה כהן')).toBeInTheDocument()
    expect(within(col('לקוחות חדשים')).getByText('משפחה')).toBeInTheDocument()
    expect(within(col('לחזור ללקוח')).getByText('לחזור 01/11')).toBeInTheDocument()
    const closing = col('סגירת חוזה והנחיות לבוש')
    expect(within(closing).getByText('חוזה נשלח')).toBeInTheDocument()
    expect(within(closing).getByText('צילום 20/11')).toBeInTheDocument()
    expect(within(closing).getByText('אירוע 10/12')).toBeInTheDocument()
    expect(within(col('לפני צילום')).getByText('צילום 05/11')).toBeInTheDocument()
    // shot Sunday 25/10, 10 business days → Sunday 08/11; from Monday 02/11: 03, 04, 05 and 08/11 are left
    const editing = col('עריכת תמונות')
    expect(within(editing).getByText('מסירה 08/11 · עוד 4 ימי עסקים')).toBeInTheDocument()
    expect(within(editing).getByLabelText('שילם מקדמה')).toBeInTheDocument()
    expect(within(editing).getByLabelText('כולל אלבום')).toBeInTheDocument()
    expect(within(col('לקוחות חדשים')).getByRole('link', { name: 'וואטסאפ לנועה כהן' })).toHaveAttribute('href', 'https://wa.me/972501234567')
  })

  it('"done" clients disappear a week after they got there', () => {
    renderBoard()
    expect(within(col('הסתיים')).getByText('גיל אור')).toBeInTheDocument()
    expect(screen.queryByText('ישן מאוד')).not.toBeInTheDocument()
  })

  it('moves a client with the "move to" menu, and the move can be undone', async () => {
    renderBoard()
    fireEvent.click(screen.getByRole('button', { name: 'פעולות עבור נועה כהן' }))
    fireEvent.click(within(screen.getByRole('menu')).getByText('לחזור ללקוח'))
    await waitFor(() => expect(mocks.updateClient).toHaveBeenCalledWith('n1',
      { status: 'proposal_sent', boardColumn: 'callback', boardMovedAt: 'TS', boardHidden: false }))
    expect(screen.getByText('נועה כהן הועבר/ה ל״לחזור ללקוח״')).toBeInTheDocument()
    fireEvent.click(screen.getByText('בטל'))
    expect(mocks.updateClient).toHaveBeenLastCalledWith('n1', { status: 'new_lead', boardColumn: null, boardMovedAt: null, boardHidden: null })
  })

  it('removes a finished client from the board early, one or the whole column', async () => {
    renderBoard()
    fireEvent.click(screen.getByRole('button', { name: 'פעולות עבור גיל אור' }))
    fireEvent.click(screen.getByText('הסר מהלוח'))
    await waitFor(() => expect(mocks.updateClient).toHaveBeenCalledWith('d1', { boardHidden: true }))
    expect(screen.getByText(/נשאר\/ת במאגר הלקוחות/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'הסר את כל ״הסתיים״ מהלוח' }))
    expect(screen.getByText(/להסיר את כל 1 הלקוחות מ״הסתיים״/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'הסר מהלוח' }))
    await waitFor(() => expect(mocks.updateClient).toHaveBeenCalledTimes(2))
  })

  it('a client in an active column has no "remove from board" option', () => {
    renderBoard()
    fireEvent.click(screen.getByRole('button', { name: 'פעולות עבור נועה כהן' }))
    expect(within(screen.getByRole('menu')).queryByText('הסר מהלוח')).not.toBeInTheDocument()
  })

  it('sets a callback date on the ticket', () => {
    renderBoard()
    fireEvent.change(screen.getByLabelText('תאריך לחזרה לרון לוי'), { target: { value: '2026-11-09' } })
    const [id, data] = mocks.updateClient.mock.calls[0]
    expect(id).toBe('c1')
    expect(data.callbackDate.toISOString()).toBe('2026-11-09T00:00:00.000Z')
  })

  it('pre-shoot: opens the pre-shoot message for the client and marks it as sent', () => {
    renderBoard()
    const pre = col('לפני צילום')
    fireEvent.click(within(pre).getByText('הודעה לפני צילום'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/messages', {
      state: {
        client: { id: 'p1', firstName: 'דנה', fullName: 'דנה גל', gender: 'female', includesAlbum: false },
        focus: { templateIds: ['tPre'], label: 'הודעה לפני צילום' },
      },
    })
    fireEvent.click(within(pre).getByLabelText('נשלחה'))
    expect(mocks.updateClient).toHaveBeenCalledWith('p1', { preShootMessageSentAt: expect.any(Date) })
  })

  it('dress guide button opens the guides matching the shoot type', () => {
    renderBoard()
    fireEvent.click(within(col('סגירת חוזה והנחיות לבוש')).getByText('הנחיות לבוש'))
    expect(mockNavigate.mock.calls[0][1].state.focus).toEqual({ templateIds: ['tBat', 'tBatM'], label: 'הנחיות לבוש' })
  })

  it('opens the client card from a ticket, and back returns to the board', () => {
    renderBoard()
    fireEvent.click(screen.getByText('נועה כהן'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/clients/n1', { state: { from: '/dashboard', fromLabel: 'לוח הלקוחות' } })
  })

  it('search filters tickets; new client opens the form', () => {
    renderBoard()
    fireEvent.change(screen.getByLabelText('חיפוש בלוח'), { target: { value: 'רון' } })
    expect(screen.queryByText('נועה כהן')).not.toBeInTheDocument()
    expect(screen.getByText('רון לוי')).toBeInTheDocument()
    fireEvent.click(within(col('לקוחות חדשים')).getByRole('button', { name: 'לקוח חדש' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

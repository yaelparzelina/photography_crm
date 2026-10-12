import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({ db: {}, auth: {} }))
vi.mock('firebase/firestore', () => ({}))
vi.mock('react-firebase-hooks/firestore', () => ({ useCollection: vi.fn(() => [undefined, false]) }))

const templates = [
  { id: 'a', title: 'התמונות מוכנות', hasGender: false, hasAlbum: false, variants: { f_base: 'היי {שם}' }, order: 0 },
  { id: 'b', title: 'הודעה לפני צילום', kind: 'pre_shoot', hasGender: false, hasAlbum: false, variants: { f_base: 'מזכירה {שם}' }, order: 1 },
]
vi.mock('../../hooks/useMessageTemplates', () => ({
  useMessageTemplates: () => ({ templates, loading: false, seedIfNeeded: vi.fn(() => Promise.resolve()) }),
}))
const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => mockNavigate }))

import Messages from '../Messages'

const client = { id: 'c1', firstName: 'דנה', fullName: 'דנה גל', gender: 'female', includesAlbum: false }

function renderAt(state) {
  return render(<MemoryRouter initialEntries={[{ pathname: '/dashboard/messages', state }]}><Messages /></MemoryRouter>)
}

beforeEach(() => vi.clearAllMocks())

describe('Messages', () => {
  it('opened for specific messages, shows only those, prefilled for the client', () => {
    renderAt({ client, focus: { templateIds: ['b'], label: 'הודעה לפני צילום' } })
    expect(screen.getByText('מוצגות רק:')).toBeInTheDocument()
    expect(screen.getAllByText('הודעה לפני צילום').length).toBeGreaterThan(0)
    expect(screen.queryByText('התמונות מוכנות')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('דנה')).toBeInTheDocument()
    fireEvent.click(screen.getByText('הצג את כל ההודעות'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/messages', { replace: true, state: { client } })
  })

  it('falls back to every message when the requested one is missing', () => {
    renderAt({ focus: { templateIds: ['gone'], label: 'הודעה לפני צילום' } })
    expect(screen.getByText(/לא נמצאה הודעה מתאימה/)).toBeInTheDocument()
    expect(screen.getByText('התמונות מוכנות')).toBeInTheDocument()
  })
})

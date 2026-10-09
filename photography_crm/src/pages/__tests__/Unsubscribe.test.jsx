import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'

vi.mock('../../firebase', () => ({ db: {} }))
const mockAddDoc = vi.hoisted(() => vi.fn(() => Promise.resolve()))
vi.mock('firebase/firestore', () => ({
  collection: (_db, name) => name,
  addDoc: mockAddDoc,
  serverTimestamp: () => 'TS',
}))
vi.mock('../../components/layout/PublicLayout', () => ({ default: ({ children }) => <div>{children}</div> }))

import Unsubscribe from '../Unsubscribe'

function renderAt(path) {
  return render(<MemoryRouter initialEntries={[path]}><Unsubscribe /></MemoryRouter>)
}

describe('Unsubscribe', () => {
  it('saves a normalized removal request and confirms', async () => {
    renderAt('/unsubscribe')
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: ' Dana@Example.COM ' } })
    fireEvent.click(screen.getByText('הסירו אותי מהרשימה'))
    await waitFor(() => expect(screen.getByText('הכתובת הוסרה מרשימת התפוצה')).toBeInTheDocument())
    expect(mockAddDoc).toHaveBeenCalledWith('unsubscribeRequests', { email: 'dana@example.com', processed: false, createdAt: 'TS' })
  })

  it('validates the email', () => {
    renderAt('/unsubscribe')
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'nope' } })
    fireEvent.click(screen.getByText('הסירו אותי מהרשימה'))
    expect(screen.getByText('כתובת מייל לא תקינה')).toBeInTheDocument()
  })

  it('prefills the email from the link (?email=)', () => {
    renderAt('/unsubscribe?email=ron%40example.com')
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('ron@example.com')
  })
})

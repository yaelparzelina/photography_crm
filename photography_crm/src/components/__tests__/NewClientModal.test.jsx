import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
}))

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
}))

vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(() => [undefined, false]),
}))

const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockCreateClient = vi.hoisted(() => vi.fn())
const mockUseClients = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useClients', () => ({
  useClients: () => mockUseClients(),
}))

const mockUsePhotoshootTypes = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/usePhotoshootTypes', () => ({
  usePhotoshootTypes: () => mockUsePhotoshootTypes(),
}))

import NewClientModal from '../NewClientModal'

const defaultTypes = [
  { id: 'type1', name: 'צילום חתונה' },
  { id: 'type2', name: 'צילום משפחה' },
]

function renderModal(props = {}) {
  const defaultProps = { isOpen: true, onClose: vi.fn(), ...props }
  return render(
    <MemoryRouter>
      <NewClientModal {...defaultProps} />
    </MemoryRouter>
  )
}

describe('NewClientModal', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockCreateClient.mockReset()
    mockCreateClient.mockResolvedValue('new-client-id')
    mockUseClients.mockReturnValue({
      clients: [],
      loading: false,
      createClient: mockCreateClient,
    })
    mockUsePhotoshootTypes.mockReturnValue({
      types: defaultTypes,
      loading: false,
    })
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders form fields when isOpen is true', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('שם מלא *')).toBeInTheDocument()
    expect(screen.getByText('טלפון')).toBeInTheDocument()
    expect(screen.getByText('סוג צילום')).toBeInTheDocument()
  })

  it('populates photoshoot type dropdown from usePhotoshootTypes', () => {
    renderModal()
    expect(screen.getByText('צילום חתונה')).toBeInTheDocument()
    expect(screen.getByText('צילום משפחה')).toBeInTheDocument()
    const select = screen.getByDisplayValue('בחר סוג צילום')
    expect(select).toBeInTheDocument()
  })

  it('calls createClient with form values on submit', async () => {
    renderModal()
    const inputs = screen.getAllByRole('textbox')
    // name input is first, phone is second
    fireEvent.change(inputs[0], { target: { value: 'לקוח חדש' } })
    fireEvent.change(inputs[1], { target: { value: '050-1111111' } })
    const select = screen.getByDisplayValue('בחר סוג צילום')
    fireEvent.change(select, { target: { value: 'type1' } })

    fireEvent.click(screen.getByText('צור לקוח'))

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        name: 'לקוח חדש',
        phone: '050-1111111',
        photoshootTypeId: 'type1',
      })
    })
  })

  it('calls onClose and navigates to new client ticket after submit', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'לקוח' } })

    fireEvent.click(screen.getByText('צור לקוח'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/clients/new-client-id')
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.click(screen.getByText('בטל'))
    expect(onClose).toHaveBeenCalled()
  })
})

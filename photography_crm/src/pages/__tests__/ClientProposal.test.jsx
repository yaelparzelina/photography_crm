import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- Firebase mocks ---
vi.mock('../../firebase', () => ({ db: {} }))

const mockGetDoc = vi.hoisted(() => vi.fn())
const mockGetDocs = vi.hoisted(() => vi.fn())
const mockDoc = vi.hoisted(() => vi.fn())
const mockCollection = vi.hoisted(() => vi.fn())
const mockQuery = vi.hoisted(() => vi.fn())
const mockWhere = vi.hoisted(() => vi.fn())
const mockOrderBy = vi.hoisted(() => vi.fn())

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDocs: mockGetDocs,
}))

// --- Router mock ---
vi.mock('react-router-dom', () => ({
  useParams: () => ({ linkId: 'link-1' }),
}))

// --- Template mocks ---
vi.mock('../../templates/ProposalTemplate', () => ({
  default: ({ photoshootTypeName, packages }) => (
    <div data-testid="proposal-template">
      <span data-testid="type-name">{photoshootTypeName}</span>
      <span data-testid="pkg-count">{packages.length}</span>
    </div>
  ),
}))

vi.mock('../../components/layout/PublicLayout', () => ({
  default: ({ children }) => <div data-testid="public-layout">{children}</div>,
}))

import ClientProposal from '../ClientProposal'

function makeSnap({ exists = true, data = {} } = {}) {
  return { exists: () => exists, id: 'link-1', data: () => data }
}

function makeTypeSnap({ exists = true, name = 'צילום חתונה' } = {}) {
  return { exists: () => exists, data: () => ({ name }) }
}

function makePkgSnap(packages = []) {
  return { docs: packages.map((p, i) => ({ id: `pkg-${i}`, data: () => p })) }
}

describe('ClientProposal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.mockReturnValue({})
    mockCollection.mockReturnValue({})
    mockQuery.mockReturnValue({})
    mockWhere.mockReturnValue({})
    mockOrderBy.mockReturnValue({})
  })

  it('shows loading state initially', () => {
    // getDoc never resolves
    mockGetDoc.mockReturnValue(new Promise(() => {}))
    render(<ClientProposal />)
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })

  it('shows expired message when link is inactive (active: false)', async () => {
    mockGetDoc.mockResolvedValue(makeSnap({ exists: true, data: { active: false } }))
    render(<ClientProposal />)
    await waitFor(() => {
      expect(screen.getByText('קישור זה אינו פעיל יותר.')).toBeInTheDocument()
    })
    expect(screen.getByText('אנא צור קשר עם הצלמת.')).toBeInTheDocument()
  })

  it('shows expired message when link does not exist', async () => {
    mockGetDoc.mockResolvedValue(makeSnap({ exists: false }))
    render(<ClientProposal />)
    await waitFor(() => {
      expect(screen.getByText('קישור זה אינו פעיל יותר.')).toBeInTheDocument()
    })
  })

  it('renders ProposalTemplate when link is active', async () => {
    const linkData = { active: true, photoshootTypeId: 'type-1' }
    mockGetDoc
      .mockResolvedValueOnce(makeSnap({ exists: true, data: linkData }))
      .mockResolvedValueOnce(makeTypeSnap({ exists: true, name: 'צילום חתונה' }))
    mockGetDocs.mockResolvedValue(makePkgSnap([{ name: 'חבילה א', price: 1000 }]))

    render(<ClientProposal />)
    await waitFor(() => {
      expect(screen.getByTestId('proposal-template')).toBeInTheDocument()
    })
    expect(screen.getByTestId('type-name').textContent).toBe('צילום חתונה')
  })
})

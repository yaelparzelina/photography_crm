import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProposalTemplate from '../ProposalTemplate'

vi.mock('../../utils/dateUtils', () => ({
  formatDate: (d) => '01/01/2026',
}))

const samplePackages = [
  {
    id: '1',
    name: 'חבילה בסיסית',
    price: 1500,
    photoCount: 50,
    locationCount: 1,
    includesAlbum: false,
  },
  {
    id: '2',
    name: 'חבילה מורחבת',
    price: 2500,
    photoCount: 85,
    locationCount: 2,
    includesAlbum: true,
    albumSize: '60x30',
    albumPages: 30,
  },
]

describe('ProposalTemplate', () => {
  it('renders studio name "רויטל פרצלינה"', () => {
    render(<ProposalTemplate photoshootTypeName="בת מצווה" packages={samplePackages} />)
    expect(screen.getByText('רויטל פרצלינה')).toBeInTheDocument()
  })

  it('renders photoshoot type name in heading', () => {
    render(<ProposalTemplate photoshootTypeName="בת מצווה" packages={samplePackages} />)
    expect(screen.getByText('צילומי בת מצווה')).toBeInTheDocument()
  })

  it('renders each package name and price', () => {
    render(<ProposalTemplate photoshootTypeName="בת מצווה" packages={samplePackages} />)
    expect(screen.getByText('חבילה בסיסית')).toBeInTheDocument()
    expect(screen.getByText('חבילה מורחבת')).toBeInTheDocument()
    expect(screen.getByText('₪1,500')).toBeInTheDocument()
    expect(screen.getByText('₪2,500')).toBeInTheDocument()
  })

  it('renders photo count and location count per package', () => {
    render(<ProposalTemplate photoshootTypeName="בת מצווה" packages={samplePackages} />)
    expect(screen.getByText('• 50 תמונות ערוכות ברמה גבוהה')).toBeInTheDocument()
    expect(screen.getByText('• 1 לוקיישן')).toBeInTheDocument()
    expect(screen.getByText('• 85 תמונות ערוכות ברמה גבוהה')).toBeInTheDocument()
    expect(screen.getByText('• 2 לוקיישנים')).toBeInTheDocument()
  })

  it('shows album details when includesAlbum=true, hides when false', () => {
    render(<ProposalTemplate photoshootTypeName="בת מצווה" packages={samplePackages} />)
    // Package with album should show album details
    expect(screen.getByText('• אלבום מעוצב ומודפס בגודל 60x30, 30 עמודים, פתיחה שטוחה')).toBeInTheDocument()
    // Package without album should not show album details — only one album line present
    const albumItems = screen.getAllByText(/אלבום מעוצב ומודפס/)
    expect(albumItems).toHaveLength(1)
  })
})

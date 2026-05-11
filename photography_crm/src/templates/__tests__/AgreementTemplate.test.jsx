import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AgreementTemplate from '../AgreementTemplate'

vi.mock('../../utils/dateUtils', () => ({
  formatDate: (d) => '01/01/2026',
}))

const sampleLink = {
  clientName: 'יעל כהן',
  photoshootTypeName: 'בת מצווה',
  packageName: 'חבילה מורחבת',
  shootDate: { toDate: () => new Date('2026-03-15') },
  photoCount: 85,
  includesAlbum: true,
  albumSize: '60x30',
  albumPages: 30,
  price: 2515,
}

describe('AgreementTemplate', () => {
  it('renders "רויטל פרצלינה" in header', () => {
    render(<AgreementTemplate link={sampleLink} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('רויטל פרצלינה')
  })

  it('renders client name in title and intro paragraph', () => {
    render(<AgreementTemplate link={sampleLink} />)
    expect(screen.getByText(/הסכם עבודת צילום בת מצווה ליעל כהן/)).toBeInTheDocument()
    expect(screen.getByText(/הסכם הוא בין הצלמת רויטל פרצלינה, לבין יעל כהן/)).toBeInTheDocument()
  })

  it('renders photoshoot type name and package name', () => {
    render(<AgreementTemplate link={sampleLink} />)
    expect(screen.getByText(/סשן צילומי בת מצווה — חבילה מורחבת בתאריך/)).toBeInTheDocument()
  })

  it('renders formatted shoot date when provided; shows blank when null', () => {
    const { rerender } = render(<AgreementTemplate link={sampleLink} />)
    // formatDate is mocked to return '01/01/2026' — the shoot date appears in the package line
    expect(screen.getByText(/סשן צילומי בת מצווה — חבילה מורחבת בתאריך 01\/01\/2026/)).toBeInTheDocument()

    rerender(<AgreementTemplate link={{ ...sampleLink, shootDate: null }} />)
    expect(screen.getByText(/סשן צילומי בת מצווה — חבילה מורחבת בתאריך ___________/)).toBeInTheDocument()
  })

  it('renders photo count', () => {
    render(<AgreementTemplate link={sampleLink} />)
    expect(screen.getByText('✓ 85 תמונות ערוכות ברמה גבוהה')).toBeInTheDocument()
  })

  it('shows album section when includesAlbum=true; hides when false', () => {
    const { rerender } = render(<AgreementTemplate link={sampleLink} />)
    expect(screen.getByText(/אלבום מעוצב ומודפס בגודל 60x30 ס"מ, 30 עמודים/)).toBeInTheDocument()
    expect(screen.getByText(/האלבום יימסר עם שליח לבית הלקוח/)).toBeInTheDocument()

    rerender(<AgreementTemplate link={{ ...sampleLink, includesAlbum: false }} />)
    expect(screen.queryByText(/אלבום מעוצב ומודפס בגודל/)).not.toBeInTheDocument()
    expect(screen.queryByText(/האלבום יימסר עם שליח לבית הלקוח/)).not.toBeInTheDocument()
  })

  it('renders price', () => {
    render(<AgreementTemplate link={sampleLink} />)
    expect(screen.getByText(/עלות החבילה — ₪2,515/)).toBeInTheDocument()
  })
})

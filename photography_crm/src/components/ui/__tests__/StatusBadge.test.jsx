import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  it('shows Hebrew label for new_lead', () => {
    render(<StatusBadge status="new_lead" />)
    expect(screen.getByText('ליד חדש')).toBeInTheDocument()
  })
  it('shows Hebrew label for done', () => {
    render(<StatusBadge status="done" />)
    expect(screen.getByText('הסתיים')).toBeInTheDocument()
  })
  it('renders nothing for unknown status', () => {
    const { container } = render(<StatusBadge status="unknown" />)
    expect(container).toBeEmptyDOMElement()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal isOpen={false} onClose={vi.fn()}>תוכן</Modal>)
    expect(container).toBeEmptyDOMElement()
  })
  it('renders children when open', () => {
    render(<Modal isOpen onClose={vi.fn()}>תוכן פנימי</Modal>)
    expect(screen.getByText('תוכן פנימי')).toBeInTheDocument()
  })
  it('has role="dialog"', () => {
    render(<Modal isOpen onClose={vi.fn()}>x</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('close button has accessible label', () => {
    render(<Modal isOpen onClose={vi.fn()}>x</Modal>)
    expect(screen.getByRole('button', { name: 'סגור' })).toBeInTheDocument()
  })
  it('calls onClose when close button clicked', () => {
    const fn = vi.fn()
    render(<Modal isOpen onClose={fn}>x</Modal>)
    fireEvent.click(screen.getByRole('button', { name: 'סגור' }))
    expect(fn).toHaveBeenCalled()
  })
  it('calls onClose on Escape key', () => {
    const fn = vi.fn()
    render(<Modal isOpen onClose={fn}>x</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(fn).toHaveBeenCalled()
  })
})

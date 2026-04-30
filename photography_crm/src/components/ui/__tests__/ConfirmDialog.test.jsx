import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '../ConfirmDialog'

const props = {
  isOpen: true,
  title: 'מחיקת לקוח',
  message: 'האם אתה בטוח?',
  confirmLabel: 'מחק',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmDialog', () => {
  beforeEach(() => {
    props.onConfirm = vi.fn()
    props.onCancel = vi.fn()
  })

  it('renders when open', () => {
    render(<ConfirmDialog {...props} />)
    expect(screen.getByText('מחיקת לקוח')).toBeInTheDocument()
    expect(screen.getByText('האם אתה בטוח?')).toBeInTheDocument()
  })
  it('does not render when closed', () => {
    render(<ConfirmDialog {...props} isOpen={false} />)
    expect(screen.queryByText('מחיקת לקוח')).not.toBeInTheDocument()
  })
  it('calls onConfirm on confirm click', () => {
    render(<ConfirmDialog {...props} />)
    fireEvent.click(screen.getByText('מחק'))
    expect(props.onConfirm).toHaveBeenCalled()
  })
  it('calls onCancel on cancel click', () => {
    render(<ConfirmDialog {...props} />)
    fireEvent.click(screen.getByText('בטל'))
    expect(props.onCancel).toHaveBeenCalled()
  })
  it('calls onCancel on Escape key', () => {
    render(<ConfirmDialog {...props} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onCancel).toHaveBeenCalled()
  })
})

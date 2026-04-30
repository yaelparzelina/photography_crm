import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>שמור</Button>)
    expect(screen.getByText('שמור')).toBeInTheDocument()
  })
  it('calls onClick', () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>לחץ</Button>)
    fireEvent.click(screen.getByText('לחץ'))
    expect(fn).toHaveBeenCalledOnce()
  })
  it('does not call onClick when disabled', () => {
    const fn = vi.fn()
    render(<Button onClick={fn} disabled>לחץ</Button>)
    fireEvent.click(screen.getByText('לחץ'))
    expect(fn).not.toHaveBeenCalled()
  })
})

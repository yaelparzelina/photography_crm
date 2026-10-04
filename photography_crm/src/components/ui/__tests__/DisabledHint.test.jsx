import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DisabledHint from '../DisabledHint'

describe('DisabledHint', () => {
  it('renders a tooltip with the reason when given', () => {
    render(<DisabledHint reason="סיבה"><button disabled>כפתור</button></DisabledHint>)
    expect(screen.getByRole('tooltip')).toHaveTextContent('סיבה')
  })

  it('renders only the child when there is no reason', () => {
    render(<DisabledHint reason={null}><button>כפתור</button></DisabledHint>)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByText('כפתור')).toBeInTheDocument()
  })
})

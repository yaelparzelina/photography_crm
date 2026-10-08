import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

function Boom() {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('shows a recovery screen instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByText('משהו השתבש')).toBeInTheDocument()
    expect(screen.getByText('נקה שינויים שלא נשמרו וטען מחדש')).toBeInTheDocument()
    console.error.mockRestore()
  })
})

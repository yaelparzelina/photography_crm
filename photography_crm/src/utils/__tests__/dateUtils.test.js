import { describe, it, expect } from 'vitest'
import { formatDate, toInputDate, fromInputDate } from '../dateUtils'

describe('formatDate', () => {
  it('formats a Date as DD/MM/YYYY', () => {
    expect(formatDate(new Date('2026-03-05'))).toBe('05/03/2026')
  })
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })
  it('handles Firestore timestamp with toDate()', () => {
    const ts = { toDate: () => new Date('2026-01-15') }
    expect(formatDate(ts)).toBe('15/01/2026')
  })
})

describe('toInputDate', () => {
  it('formats date for input[type=date]', () => {
    expect(toInputDate(new Date('2026-06-20'))).toBe('2026-06-20')
  })
  it('returns empty string for null', () => {
    expect(toInputDate(null)).toBe('')
  })
})

describe('fromInputDate', () => {
  it('converts YYYY-MM-DD string to Date', () => {
    const result = fromInputDate('2026-08-10')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2026)
  })
  it('returns null for empty string', () => {
    expect(fromInputDate('')).toBeNull()
  })
})

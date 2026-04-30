import { describe, it, expect } from 'vitest'
import { generateLinkId } from '../linkGenerator'

describe('generateLinkId', () => {
  it('generates a 12-character string', () => {
    expect(generateLinkId()).toHaveLength(12)
  })
  it('only contains alphanumeric characters', () => {
    expect(generateLinkId()).toMatch(/^[A-Za-z0-9]{12}$/)
  })
  it('generates unique IDs across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateLinkId))
    expect(ids.size).toBe(100)
  })
})

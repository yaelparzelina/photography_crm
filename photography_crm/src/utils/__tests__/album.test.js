import { describe, it, expect } from 'vitest'
import { normalizeAlbum, DEFAULT_ALBUM_SIZE, DEFAULT_ALBUM_PAGES } from '../album'

describe('normalizeAlbum', () => {
  it('uses default size and pages when empty', () => {
    expect(normalizeAlbum({ includesAlbum: true, albumSize: '', albumPages: '' }))
      .toEqual({ includesAlbum: true, albumSize: DEFAULT_ALBUM_SIZE, albumPages: DEFAULT_ALBUM_PAGES })
  })
  it('keeps values entered manually', () => {
    expect(normalizeAlbum({ includesAlbum: true, albumSize: '40x40', albumPages: '24' }))
      .toEqual({ includesAlbum: true, albumSize: '40x40', albumPages: 24 })
  })
  it('clears album details when no album', () => {
    expect(normalizeAlbum({ includesAlbum: false, albumSize: '40x40', albumPages: 24 }))
      .toEqual({ includesAlbum: false, albumSize: null, albumPages: null })
  })
  it('default pages is 30', () => {
    expect(DEFAULT_ALBUM_PAGES).toBe(30)
  })
})

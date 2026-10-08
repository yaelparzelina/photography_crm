export const DEFAULT_ALBUM_SIZE = '30x30'
export const DEFAULT_ALBUM_PAGES = 30

// Normalizes album fields for saving: empty size/pages fall back to the defaults,
// and album details are cleared when no album is included.
export function normalizeAlbum({ includesAlbum, albumSize, albumPages }) {
  if (!includesAlbum) return { includesAlbum: false, albumSize: null, albumPages: null }
  return {
    includesAlbum: true,
    albumSize: albumSize || DEFAULT_ALBUM_SIZE,
    albumPages: Number(albumPages) || DEFAULT_ALBUM_PAGES,
  }
}

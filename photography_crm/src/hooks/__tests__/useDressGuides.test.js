import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({ db: {} }))
const fs = vi.hoisted(() => {
  let n = 0
  return {
    reset() { n = 0 },
    doc: vi.fn((_db, ...path) => {
      if (path.length === 0) return { path: `${_db.path}/auto${++n}`, id: `auto${n}` } // doc(collectionRef)
      return { path: path.join('/'), id: path.at(-1) }
    }),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
  }
})
vi.mock('firebase/firestore', () => ({
  collection: (_db, ...path) => ({ path: path.join('/') }),
  doc: fs.doc, setDoc: fs.setDoc, updateDoc: fs.updateDoc, deleteDoc: fs.deleteDoc,
  getDoc: vi.fn(), query: vi.fn(), orderBy: vi.fn(), runTransaction: vi.fn(),
  serverTimestamp: () => 'TS',
}))
vi.mock('react-firebase-hooks/firestore', () => ({ useCollection: vi.fn(() => [undefined, false]) }))

import { buildSeedDocs, saveGuide, deleteGuide } from '../useDressGuides'

beforeEach(() => {
  vi.clearAllMocks()
  fs.reset()
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['img'], { type: 'image/jpeg' })) }))
})

describe('dress guide data', () => {
  it('seed creates the 4 guides, the 7 family photos and a message for each guide', async () => {
    const writes = await buildSeedDocs(1000)
    const byCol = (col) => writes.filter((w) => w.ref.path.startsWith(`${col}/`))
    expect(byCol('dressGuides').map((w) => w.ref.id)).toEqual(['family', 'bat-mitzvah', 'bat-mitzvah-modest', 'bar-mitzvah'])
    expect(byCol('dressGuidePhotos')).toHaveLength(7)
    expect(fetch).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}dress-guides/family-1.jpg`)
    const family = byCol('dressGuides')[0].data
    expect(family.photoIds).toHaveLength(7)
    expect(family.photoFiles).toBeUndefined()
    const templates = byCol('messageTemplates')
    expect(templates.map((w) => w.data.title)).toEqual([
      'הנחיות לבוש לצילומי משפחה', 'הנחיות לבוש לבוק בת מצווה', 'הנחיות לבוש לבוק בת מצווה (לבוש צנוע)', 'הנחיות לבוש לבוק בר מצווה',
    ])
    expect(family.messageTemplateId).toBe(templates[0].ref.id)
    expect(templates[3].data.variants.f_base).toMatch(/#\/dress\/bar-mitzvah$/)
  })

  it('saving an existing guide writes new photos, deletes removed ones and renames its message', async () => {
    const previous = { name: 'ישן', messageTemplateId: 'm1' }
    await saveGuide({
      slug: 'family',
      form: { name: 'חדש', title: 'כותרת', palette: [], tips: [], outfits: [], extraUiField: 1 },
      photos: [{ id: 'p2', src: 'x' }, { id: 'new-1', src: 'data:NEW', isNew: true }],
      previousPhotoIds: ['p1', 'p2'],
      previous,
    })
    expect(fs.setDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'dressGuidePhotos/auto1' }),
      { data: 'data:NEW', guideId: 'family', createdAt: 'TS' })
    const [ref, data] = fs.updateDoc.mock.calls[0]
    expect(ref.path).toBe('dressGuides/family')
    expect(data.photoIds).toEqual(['p2', 'auto1'])
    expect(data.extraUiField).toBeUndefined()
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'messageTemplates/m1' }), { title: 'הנחיות לבוש לחדש' })
    expect(fs.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'dressGuidePhotos/p1' }))
    expect(fs.deleteDoc).toHaveBeenCalledTimes(1)
  })

  it('saving a new guide creates its message with the link', async () => {
    const id = await saveGuide({ slug: null, form: { name: 'צילומי ניובורן', palette: [], tips: [], outfits: [] }, photos: [] })
    expect(id).toMatch(/^[A-Za-z0-9]{8}$/)
    const template = fs.setDoc.mock.calls.find(([r]) => r.path.startsWith('messageTemplates/'))
    expect(template[1]).toMatchObject({ title: 'הנחיות לבוש לצילומי ניובורן', guideId: id })
    expect(template[1].variants.f_base).toContain(`#/dress/${id}`)
    const guide = fs.setDoc.mock.calls.find(([r]) => r.path === `dressGuides/${id}`)
    expect(guide[1].messageTemplateId).toBe(template[0].id)
  })

  it('deleting a guide removes its photos and message', async () => {
    await deleteGuide({ id: 'family', photoIds: ['p1', 'p2'], messageTemplateId: 'm1' })
    expect(fs.deleteDoc.mock.calls.map(([r]) => r.path)).toEqual(
      ['dressGuides/family', 'dressGuidePhotos/p1', 'dressGuidePhotos/p2', 'messageTemplates/m1'])
  })
})

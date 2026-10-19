import { describe, it, expect } from 'vitest'
import {
  suggestColor, guideUrl, guideMessageTitle, guideMessageTemplate, DEFAULT_GUIDES, normalizeGuide, newGuideSlug,
} from '../dressGuides'
import { scaleToFit } from '../imageResize'
import { publicUrl } from '../publicUrl'

// Live-site address of the app (tests run with base '/', the build with '/photography_crm/')
const LIVE = `https://yaelparzelina.github.io${import.meta.env.BASE_URL}`

describe('dress guide helpers', () => {
  it('suggests a swatch colour for known names, tolerating spelling variants', () => {
    expect(suggestColor('חיטה')).toBe('#D8BF94')
    expect(suggestColor('אופייט')).toBe(suggestColor('אוף־וייט'))
    expect(suggestColor('אוף-וייט')).toBe(suggestColor('אוף־וייט'))
    expect(suggestColor("ג'ינס")).toBe(suggestColor('ג׳ינס'))
    expect(suggestColor('גינס')).toBe(suggestColor('ג׳ינס'))
    expect(suggestColor('פיסטוק')).toBe(suggestColor('ירוק פיסטוק'))
    expect(suggestColor('סגול')).toBeNull()
  })

  it('links point at the live site and the message has the agreed text', () => {
    expect(guideUrl('family')).toBe(`${LIVE}#/dress/family`)
    expect(publicUrl('/x', 'https://a.test', '/b/')).toBe('https://a.test/b/#/x')
    const t = guideMessageTemplate({ name: 'צילומי משפחה' }, 'family')
    expect(t).toMatchObject({ title: 'הנחיות לבוש לצילומי משפחה', hasGender: false, hasAlbum: false, guideId: 'family' })
    expect(t.variants.f_base).toBe(`היי, מצרפת הנחיות לבוש לצילומים: ${LIVE}#/dress/family`)
  })

  it('starter guides have the agreed message titles, colours for every swatch, and photos only for family', () => {
    expect(DEFAULT_GUIDES.map((g) => guideMessageTitle(g.name))).toEqual([
      'הנחיות לבוש לצילומי משפחה',
      'הנחיות לבוש לבוק בת מצווה',
      'הנחיות לבוש לבוק בת מצווה (לבוש צנוע)',
      'הנחיות לבוש לבוק בר מצווה',
    ])
    DEFAULT_GUIDES.forEach((g) => g.palette.forEach((c) => expect(c.color).toMatch(/^#[0-9A-F]{6}$/)))
    expect(DEFAULT_GUIDES.map((g) => g.photoFiles.length)).toEqual([7, 0, 0, 0])
  })

  it('normalizeGuide fills in missing lists', () => {
    expect(normalizeGuide({ name: 'x', palette: null })).toMatchObject({
      name: 'x', paletteGroups: [{ title: '', colors: [] }], tips: [], outfits: [], photoIds: [],
    })
  })

  it('pages from before colour groups keep all their colours in one untitled group', () => {
    const colors = [{ name: 'חיטה', color: '#D8BF94' }, { name: 'חמרה', color: '#B4593B' }]
    const g = normalizeGuide({ name: 'x', palette: colors })
    expect(g.paletteGroups).toEqual([{ title: '', colors }])
    expect(g.palette).toBeUndefined()
    // pages saved with groups keep them as they are
    const groups = [{ title: 'אדמה', colors }, { title: 'ים', colors: [] }]
    expect(normalizeGuide({ paletteGroups: groups, palette: colors }).paletteGroups).toEqual(groups)
  })

  it('new slugs are 8 url-safe characters', () => {
    expect(newGuideSlug()).toMatch(/^[A-Za-z0-9]{8}$/)
  })

  it('scaleToFit shrinks the longer side and never enlarges', () => {
    expect(scaleToFit(4000, 3000, 1400)).toEqual({ width: 1400, height: 1050 })
    expect(scaleToFit(3000, 4000, 1400)).toEqual({ width: 1050, height: 1400 })
    expect(scaleToFit(800, 600, 1400)).toEqual({ width: 800, height: 600 })
  })
})

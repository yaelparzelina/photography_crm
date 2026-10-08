import { describe, it, expect } from 'vitest'
import {
  tokenize, buildText, hasMissing, variantKey, variantKeys, completeVariants, getVariantText, DEFAULT_TEMPLATES,
} from '../messageTemplate'

describe('tokenize', () => {
  it('finds name, blanks (3+ underscores), links and bold', () => {
    const tokens = tokenize('היי {שם}, קוד: ____ *חשוב ___* https://g.page/r/abc/review')
    expect(tokens.map((t) => t.type)).toEqual(['text', 'name', 'text', 'blank', 'text', 'bold', 'text', 'link'])
    expect(tokens[5].children.map((t) => t.type)).toEqual(['text', 'blank'])
    expect(tokens[7].value).toBe('https://g.page/r/abc/review')
  })

  it('numbers blanks in reading order, including inside bold', () => {
    const tokens = tokenize('___ *___* ___')
    expect(tokens.filter((t) => t.type === 'blank').map((t) => t.index)).toEqual([0, 2])
    expect(tokens[2].children[0].index).toBe(1)
  })

  it('does not swallow trailing punctuation into links', () => {
    const link = tokenize('ראו https://example.com/x.').find((t) => t.type === 'link')
    expect(link.value).toBe('https://example.com/x')
  })
})

describe('buildText', () => {
  it('fills values seamlessly, keeps *bold* markers and emojis, and leaves ___ for empty blanks', () => {
    const tokens = tokenize('היי {שם}, 💃\n*קוד*: ___ \nשל ___')
    expect(buildText(tokens, { 0: '1234' }, 'דנה')).toBe('היי דנה, 💃\n*קוד*: 1234\nשל ___')
  })

  it('uses ___ for an empty name', () => {
    expect(buildText(tokenize('היי {שם},'), {}, '')).toBe('היי ___,')
  })
})

describe('hasMissing', () => {
  it('is true until every blank and the name are filled', () => {
    const tokens = tokenize('היי {שם} *___*')
    expect(hasMissing(tokens, {}, 'דנה')).toBe(true)
    expect(hasMissing(tokens, { 0: 'x' }, '')).toBe(true)
    expect(hasMissing(tokens, { 0: 'x' }, 'דנה')).toBe(false)
  })
})

describe('variants', () => {
  const t = { hasGender: true, hasAlbum: true }
  it('picks the right variant key', () => {
    expect(variantKey(t, 'female', true)).toBe('f_album')
    expect(variantKey(t, 'male', false)).toBe('m_noalbum')
    expect(variantKey({ hasGender: false, hasAlbum: false }, 'male', true)).toBe('f_base')
  })

  it('lists keys for the enabled versions', () => {
    expect(variantKeys(false, false)).toEqual(['f_base'])
    expect(variantKeys(true, true)).toEqual(['f_album', 'f_noalbum', 'm_album', 'm_noalbum'])
  })

  it('copies existing text into newly enabled versions', () => {
    expect(completeVariants({ f_base: 'א' }, true, false)).toEqual({ f_base: 'א', m_base: 'א' })
    expect(completeVariants({ f_base: 'א', m_base: 'ב' }, true, true))
      .toEqual({ f_album: 'א', f_noalbum: 'א', m_album: 'ב', m_noalbum: 'ב' })
  })
})

describe('starter messages', () => {
  const [ready, review] = DEFAULT_TEMPLATES
  it('"התמונות מוכנות" has 4 versions with the requested fixes', () => {
    expect(getVariantText(ready, 'female', true)).toContain('רשמי לי בבקשה')
    expect(getVariantText(ready, 'male', true)).toContain('רשום לי בבקשה')
    expect(getVariantText(ready, 'female', true)).toContain('ובעוד כמה דקות')
    for (const k of Object.keys(ready.variants)) {
      expect(ready.variants[k]).toContain('*תופעות לוואי אפשריות: חיוכים, דפיקות לב מואצות ואהבה גדולה*😘')
      expect(ready.variants[k].startsWith('היי {שם},')).toBe(true)
    }
    expect(ready.variants.f_noalbum).toBe(ready.variants.m_noalbum)
    expect(ready.variants.f_noalbum).not.toContain('האלבום')
  })

  it('"ביקורת" uses אלייך/תוכלי for female and אליך/תוכל for male, with intact links', () => {
    expect(getVariantText(review, 'female')).toContain('פונה אלייך')
    expect(getVariantText(review, 'female')).toContain('תוכלי בבקשה')
    expect(getVariantText(review, 'male')).toContain('פונה אליך')
    expect(getVariantText(review, 'male')).toContain('תוכל בבקשה')
    const links = tokenize(getVariantText(review, 'male')).filter((x) => x.type === 'link').map((x) => x.value)
    expect(links).toEqual(['https://www.facebook.com/revitalphotography', 'https://g.page/r/CaD0Jk1TrLYnEBM/review'])
  })
})

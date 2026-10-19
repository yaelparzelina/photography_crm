import { publicUrl } from './publicUrl'
import { generateLinkId } from './linkGenerator'

// --- Colours ---

// Swatch colours for colour names commonly used in the guides (suggested automatically in the editor)
export const COLOR_SWATCHES = {
  'אוף־וייט': '#F2EBDD',
  'לבן': '#FFFFFF',
  'חיטה': '#D8BF94',
  'בז׳': '#D9C4A7',
  'חאקי': '#B5A47C',
  'חום': '#6B4A35',
  'חמרה': '#B4593B',
  'אדום': '#A93A35',
  'ורוד': '#E7B7B6',
  'בננה': '#F0DD9E',
  'תכלת': '#AAC7DC',
  'כחול': '#3F5D82',
  'ג׳ינס': '#6383A3',
  'ירוק': '#6E8C6A',
  'ירוק פיסטוק': '#B9C99A',
  'אפור': '#A3A19D',
  'שחור': '#2B2B2B',
}

// Other common spellings of the same colours
const COLOR_ALIASES = {
  'אופייט': 'אוף־וייט', 'אופוייט': 'אוף־וייט', 'אוף וייט': 'אוף־וייט', 'אוף־ווייט': 'אוף־וייט', 'אופוויט': 'אוף־וייט',
  'גינס': 'ג׳ינס', 'פיסטוק': 'ירוק פיסטוק', 'בז': 'בז׳',
}

export function suggestColor(name) {
  const key = (name || '').trim().replace(/['`’]/g, '׳').replace(/-/g, '־')
  return COLOR_SWATCHES[key] || COLOR_SWATCHES[COLOR_ALIASES[key]] || null
}

// True for one of the shades above (set by a name), false for a colour picked by hand
const SUGGESTED = new Set(Object.values(COLOR_SWATCHES).map((c) => c.toLowerCase()))
export function isSuggestedColor(color) {
  return SUGGESTED.has((color || '').toLowerCase())
}

// --- Links & messages ---

// WhatsApp chat with the photographer, from the closing card of each guide
export const WHATSAPP_URL = 'https://wa.me/972548788851'

export function guideUrl(slug) {
  return publicUrl(`/dress/${slug}`)
}

// Local address of a guide, for the owner's own preview (works in dev and on the live site)
export function guidePreviewHref(slug) {
  return `${import.meta.env.BASE_URL}#/dress/${slug}`
}

export function newGuideSlug() {
  return generateLinkId().slice(0, 8)
}

export function guideMessageTitle(name) {
  return `הנחיות לבוש ל${name.trim()}`
}

export function guideMessageTemplate(guide, slug) {
  return {
    title: guideMessageTitle(guide.name),
    hasGender: false,
    hasAlbum: false,
    variants: { f_base: `היי, מצרפת הנחיות לבוש לצילומים: ${guideUrl(slug)}` },
    guideId: slug,
  }
}

// --- Content ---

export const SECTION_TITLES = {
  palette: 'פלטת הצבעים',
  tips: 'חשוב לדעת',
  outfits: 'רעיונות לסטים של בגדים',
  photos: 'תמונות להשראה',
}

export function emptyGuide() {
  return {
    name: '', title: '', subtitle: '', intro: '',
    paletteText: '', paletteGroups: [emptyColorGroup()], tips: [], outfits: [],
    note: '', closing: DEFAULT_CLOSING, signoff: '', photoIds: [],
  }
}

// Colours are grouped into combinations that go together; each group has an optional title
export function emptyColorGroup() {
  return { title: '', colors: [] }
}

// Fills in fields missing from older or partial documents.
// Pages from before colour groups kept one flat `palette` list: it becomes a single group.
export function normalizeGuide(data) {
  const { palette, ...rest } = data || {}
  const out = { ...emptyGuide(), ...rest }
  for (const k of ['tips', 'outfits', 'photoIds']) if (!Array.isArray(out[k])) out[k] = []
  if (!Array.isArray(rest.paletteGroups)) {
    out.paletteGroups = [{ title: '', colors: Array.isArray(palette) ? palette : [] }]
  }
  out.paletteGroups = out.paletteGroups.map((g) => ({ title: g?.title || '', colors: Array.isArray(g?.colors) ? g.colors : [] }))
  return out
}

const DEFAULT_CLOSING = 'זוהי רשימה שתכוון אתכם, אם יהיו לכם עוד אפשרויות זה יאפשר לנו לשחק עם הבחירות 🤎\n'
  + 'שתפו אותי בוואטסאפ ונחשוב יחד מה מתאים להביא ליום הצילומים 🙂'

const swatches = (...names) => names.map((name) => ({ name, color: COLOR_SWATCHES[name] }))

const AVOID_NOISY = 'נסו להימנע מחולצות עם טקסטורות, גרפיקות או כל דבר ״רועש״ אחר. העין צריכה להגיע לפנים – ולא לאלמנט על הבגד.'
const AVOID_BLACK_NOISY = 'נסו להימנע מבגדים בצבע שחור ומחולצות עם טקסטורות, גרפיקות או כל דבר ״רועש״ אחר. העין צריכה להגיע לפנים – ולא לאלמנט על הבגד.'

const BOOK_INTRO = (see) => `מצרפת רשימת בגדים – ${see} זאת כהצעה. הרעיון הוא שיהיו כמה סטים של בגדים להחלפה, כדי שיהיה מבחר של תמונות באלבום.`

// The starter guides (from the photographer's PDFs). `photoFiles` are bundled in public/dress-guides/.
export const DEFAULT_GUIDES = [
  {
    slug: 'family',
    name: 'צילומי משפחה',
    title: 'הנחיות לבוש לצילומי משפחה',
    subtitle: '',
    intro: '',
    paletteText: 'פחות ממליצה על לבוש שחור.',
    palette: swatches('אוף־וייט', 'חיטה', 'חום', 'חמרה', 'תכלת', 'כחול', 'ירוק', 'ירוק פיסטוק', 'ג׳ינס'),
    tips: [
      { type: 'do', text: 'בצילום משפחתי – כל בני המשפחה לבושים באותה פלטת צבעים.' },
      { type: 'dont', text: 'חשוב להימנע מטקסטורות או מגרפיקות ״רועשות״ כמו פסים, משבצות, עיגולים וכד׳. המבט צריך להגיע לפנים – לא לבגד.' },
      { type: 'do', text: 'חשוב להגיע עם בגדים מגוהצים. בגדים שמתקמטים – ממליצה ללבוש ממש לפני שיוצאים מהרכב, או להחליף במקום.' },
    ],
    outfits: [],
    note: '',
    closing: DEFAULT_CLOSING,
    signoff: 'מחכה ומתרגשת ❤️',
    photoFiles: [1, 2, 3, 4, 5, 6, 7].map((n) => `dress-guides/family-${n}.jpg`),
  },
  {
    slug: 'bat-mitzvah',
    name: 'בוק בת מצווה',
    title: 'בוק בת מצווה',
    subtitle: 'מזל טוב!',
    intro: BOOK_INTRO('ראי'),
    paletteText: 'אשמח אם תוכלי לשלב באאוטפיטים גוונים של צבעים רגועים, כמו:',
    palette: swatches('תכלת', 'חיטה', 'אוף־וייט', 'חמרה', 'ירוק פיסטוק'),
    tips: [
      { type: 'dont', text: AVOID_BLACK_NOISY },
      { type: 'do', text: 'לצילומים בים רצוי צבעים בהירים: לבן, אוף־וייט או תכלת עדין.' },
    ],
    outfits: [
      'אוברול ג׳ינס / ג׳ינס קצר, חולצת טריקו חלקה, חגורה, חולצה משובצת או חולצה דקה ארוכה (כעליונית)',
      'גופיית בטן תכלת, ג׳ינס לבן / חאקי וסניקרס',
      'חולצה (צבעים אופציונליים: צבעי פסטל, ורוד, בננה, פיסטוק או אדום), ג׳ינס קצר, בנדנה ומשקפי שמש',
      'מכנסי שורט, גופייה, ג׳קט זרוק קליל / עליונית דקה ארוכה (כמו קימונו ארוך), סניקרס מגניבות / אולסטאר',
      'חולצת בטן זרוקה, מכנסיים זרוקים, כובע מגניב, אוזניות גדולות וגרביים עד הברך',
      'חצאית, גופייה, חולצת ג׳ינס / ג׳קט ג׳ינס',
    ],
    note: 'נ.ב. את האביזרים אני דואגת להביא – רשמתי אותם לצורך ההשראה.',
    closing: DEFAULT_CLOSING,
    signoff: '',
    photoFiles: [],
  },
  {
    slug: 'bat-mitzvah-modest',
    name: 'בוק בת מצווה (לבוש צנוע)',
    title: 'בוק בת מצווה',
    subtitle: 'מזל טוב!',
    intro: BOOK_INTRO('ראי'),
    paletteText: 'אשמח אם תוכלי לשלב באאוטפיטים גוונים של צבעים רגועים, כמו:',
    palette: swatches('תכלת', 'חיטה', 'חמרה', 'ירוק', 'ירוק פיסטוק', 'בננה'),
    tips: [
      { type: 'dont', text: AVOID_BLACK_NOISY },
      { type: 'do', text: 'לצילומים בים רצוי בגדים בהירים.' },
    ],
    outfits: [
      'שמלת ג׳ינס / אוברול חצאית ג׳ינס / חצאית ג׳ינס, חולצת טריקו חלקה, חולצה משובצת מכופתרת ארוכה (כעליונית)',
      'שריג פתוח / חולצה חלקה / חצאית חאקי',
      'שמלה לבנה חגיגית, ג׳קט ג׳ינס וסניקרס',
      'חולצה (צבעים אופציונליים: צבעי פסטל, ורוד, בננה, פיסטוק או אדום) וחצאית. אני דואגת להביא בנדנה, סקייטבורד ומשקפי שמש.',
      'חצאית, חולצה חלקה, ג׳קט זרוק קליל / עליונית דקה ארוכה (כמו קימונו ארוך), סניקרס / אולסטאר',
      'שמלה חגיגית נוספת',
    ],
    note: '',
    closing: DEFAULT_CLOSING,
    signoff: '',
    photoFiles: [],
  },
  {
    slug: 'bar-mitzvah',
    name: 'בוק בר מצווה',
    title: 'בוק בר מצווה',
    subtitle: 'מזל טוב!',
    intro: BOOK_INTRO('ראו'),
    paletteText: 'אשמח אם תוכלו לשלב באאוטפיטים גוונים של צבעים רגועים, כמו:',
    palette: swatches('תכלת', 'חיטה', 'חמרה', 'בננה', 'ירוק', 'ירוק פיסטוק'),
    tips: [
      { type: 'dont', text: AVOID_NOISY },
    ],
    outfits: [
      'ג׳ינס ארוך, חולצת טי־שירט חלקה, חולצה משובצת מכופתרת',
      'בגדים חגיגיים: מכנסיים, חולצה מכופתרת וסניקרס',
      'ג׳ינס קצר, חולצת טי־שירט וסניקרס',
      'ג׳ינס, טי־שירט, כובע מגניב, אוזניות גדולות וסקייטבורד',
      'מכנסי חאקי, חולצה מכופתרת לבנה / תכלת, ג׳קט ג׳ינס וסניקרס',
      'ג׳ינס ארוך כחול, חולצת טריקו לבנה',
      'מכנסיים בהירים (אולי פשתן), חולצת טריקו בהירה',
    ],
    note: 'את האביזרים אני דואגת להביא.',
    closing: DEFAULT_CLOSING,
    signoff: '',
    photoFiles: [],
  },
]

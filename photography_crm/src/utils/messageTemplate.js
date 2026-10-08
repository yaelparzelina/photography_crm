// Message template syntax:
//   ___   (3+ underscores)  a blank to fill by hand
//   {שם}                    the client's first name (auto-filled from the client page, still editable)
//   *text*                  bold in WhatsApp
//   https://...             a link
export const NAME_TOKEN = '{שם}'
export const BLANK = '___'

const TOKEN_RE = /(\{שם\}|_{3,}|https?:\/\/[^\s]*[^\s.,!?)\]]|\*[^*\n]+\*)/g

// Splits a template into display tokens. Blanks are numbered in reading order.
export function tokenize(text) {
  let blankIndex = 0
  function walk(str, allowBold) {
    const out = []
    let last = 0
    for (const m of str.matchAll(TOKEN_RE)) {
      const t = m[0]
      if (m.index > last) out.push({ type: 'text', value: str.slice(last, m.index) })
      if (t === NAME_TOKEN) out.push({ type: 'name' })
      else if (t.startsWith('_')) out.push({ type: 'blank', index: blankIndex++ })
      else if (t.startsWith('http')) out.push({ type: 'link', value: t })
      else if (allowBold) out.push({ type: 'bold', children: walk(t.slice(1, -1), false) })
      else out.push({ type: 'text', value: t })
      last = m.index + t.length
    }
    if (last < str.length) out.push({ type: 'text', value: str.slice(last) })
    return out
  }
  return walk(text || '', true)
}

// Builds the text to paste in WhatsApp. Unfilled blanks stay as ___.
export function buildText(tokens, values, name) {
  const render = (list) => list.map((t) => {
    if (t.type === 'text' || t.type === 'link') return t.value
    if (t.type === 'blank') return values[t.index]?.trim() || BLANK
    if (t.type === 'name') return name?.trim() || BLANK
    return `*${render(t.children)}*`
  }).join('')
  return render(tokens).split('\n').map((line) => line.trimEnd()).join('\n').trim()
}

// True if any blank (or the name) is still empty.
export function hasMissing(tokens, values, name) {
  return tokens.some((t) => {
    if (t.type === 'blank') return !values[t.index]?.trim()
    if (t.type === 'name') return !name?.trim()
    if (t.type === 'bold') return hasMissing(t.children, values, name)
    return false
  })
}

// --- Variants: up to 4 versions per message (female/male × with/without album) ---

export function variantKey(template, gender, withAlbum) {
  const g = template.hasGender && gender === 'male' ? 'm' : 'f'
  const a = template.hasAlbum ? (withAlbum ? 'album' : 'noalbum') : 'base'
  return `${g}_${a}`
}

export function variantKeys(hasGender, hasAlbum) {
  const genders = hasGender ? ['f', 'm'] : ['f']
  const albums = hasAlbum ? ['album', 'noalbum'] : ['base']
  return genders.flatMap((g) => albums.map((a) => `${g}_${a}`))
}

export function variantLabel(key, hasGender, hasAlbum) {
  const [g, a] = key.split('_')
  const parts = []
  if (hasGender) parts.push(g === 'm' ? 'זכר' : 'נקבה')
  if (hasAlbum) parts.push(a === 'album' ? 'עם אלבום' : 'בלי אלבום')
  return parts.length ? parts.join(' · ') : 'טקסט ההודעה'
}

export function getVariantText(template, gender, withAlbum) {
  return template.variants?.[variantKey(template, gender, withAlbum)] ?? ''
}

// Fills in missing variants when versions are turned on, copying the closest existing text.
export function completeVariants(variants, hasGender, hasAlbum) {
  const existing = Object.values(variants).find((v) => v) || ''
  const result = {}
  for (const key of variantKeys(hasGender, hasAlbum)) {
    const [g, a] = key.split('_')
    result[key] = variants[key]
      ?? variants[`f_${a}`]
      ?? variants[`${g}_base`] ?? variants.f_base
      ?? variants[`${g}_noalbum`] ?? variants.f_noalbum
      ?? existing
  }
  return result
}

// --- Starter messages ---

const READY_COMMON_START = `היי {שם},

בשורות משמחות! התמונות שלכם מוכנות`

const READY_MIDDLE = `

התמונות ישלחו בגלריה דיגיטלית ויגיעו אליכם ממש עוד רגע.
ייתכן שמיד ישמעו קריאות שמחה איזה כיף! איזה כיף! תמונות מהממות!

אל דאגה זה טבעי ונורמלי 😉🥰
*תופעות לוואי אפשריות: חיוכים, דפיקות לב מואצות ואהבה גדולה*😘
אז תהנו ותתרגשו! ❤️

ממש נהניתי לצלם את אתכם! 🥰

מצורף קישור לגלריה, יש להוריד את התמונות למחשב (נשמר בענן עד 7 ימים) קוד להורדה: ___`

const readyWithAlbum = (writeVerb) => `${READY_COMMON_START} וגם האלבום💃${READY_MIDDLE}

ובעוד כמה דקות אשלח תצוגת האלבום לאישור לפני הדפסה, אשמח שתסתכלו ותאשרו🙏🏻❤️

${writeVerb} לי בבקשה מה תאריך הלידה הלועזי או העברי של ___ לכתיבה בכריכה של האלבום📝
🩵🩵🩵`

const readyNoAlbum = `${READY_COMMON_START} 💃${READY_MIDDLE}

🩵🩵🩵`

const review = (toYou, canYou) => `היי {שם},
פונה ${toYou} עם בקשונת😇
בא לי לשמוע ולהפיץ לעוד אנשים את החוויה שלי אתכם ✨
${canYou} בבקשה לכתוב ביקורת בגוגל ופייסבוק 🙏🏻

הביקורת ממש חשובה לי כדי לעזור לקדם העסק שלי
ואין כמו השיווק מפה לאוזן הכי עובד! 🙏🏻

מצרפת לך קישורים לדפים שלי 👇🏻 ✨

תודה רבה רבה!❤️❤️❤️

פייסבוק:
https://www.facebook.com/revitalphotography

גוגל:
https://g.page/r/CaD0Jk1TrLYnEBM/review`

export const DEFAULT_TEMPLATES = [
  {
    title: 'התמונות מוכנות',
    hasGender: true,
    hasAlbum: true,
    variants: {
      f_album: readyWithAlbum('רשמי'),
      f_noalbum: readyNoAlbum,
      m_album: readyWithAlbum('רשום'),
      m_noalbum: readyNoAlbum,
    },
  },
  {
    title: 'ביקורת',
    hasGender: true,
    hasAlbum: false,
    variants: {
      f_base: review('אלייך', 'תוכלי'),
      m_base: review('אליך', 'תוכל'),
    },
  },
]

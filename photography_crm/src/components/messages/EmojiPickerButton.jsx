import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import Button from '../ui/Button'

const HEBREW_I18N = {
  categoriesLabel: 'קטגוריות',
  emojiUnsupportedMessage: 'הדפדפן לא תומך באימוג׳י צבעוניים',
  favoritesLabel: 'בשימוש לאחרונה',
  loadingMessage: 'טוען…',
  networkErrorMessage: 'לא ניתן לטעון את האימוג׳ים',
  regionLabel: 'בחירת אימוג׳י',
  searchDescription: 'חיפוש באנגלית, למשל heart',
  searchLabel: 'חיפוש (באנגלית)',
  searchResultsLabel: 'תוצאות חיפוש',
  skinToneDescription: 'בחירת גוון עור',
  skinToneLabel: 'גוון עור (כרגע {skinTone})',
  skinTonesLabel: 'גווני עור',
  skinTones: ['ברירת מחדל', 'בהיר', 'בהיר-בינוני', 'בינוני', 'בינוני-כהה', 'כהה'],
  categories: {
    custom: 'מותאם',
    'smileys-emotion': 'פרצופים ורגשות',
    'people-body': 'אנשים',
    'animals-nature': 'חיות וטבע',
    'food-drink': 'אוכל ושתייה',
    'travel-places': 'מקומות',
    activities: 'פעילויות',
    objects: 'חפצים',
    symbols: 'סמלים',
    flags: 'דגלים',
  },
}

// Opens the full emoji picker; calls onPick(emoji) for each chosen emoji.
export default function EmojiPickerButton({ onPick }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const pickerHostRef = useRef(null)
  const onPickRef = useRef(onPick)
  useEffect(() => { onPickRef.current = onPick })

  useEffect(() => {
    if (!open) return
    let picker
    let cancelled = false
    import('emoji-picker-element').then(({ Picker }) => {
      if (cancelled || !pickerHostRef.current) return
      picker = new Picker({ i18n: HEBREW_I18N, locale: 'en' })
      picker.style.setProperty('--emoji-font-family', '"Noto Color Emoji", sans-serif')
      picker.style.width = '100%'
      picker.addEventListener('emoji-click', (e) => onPickRef.current(e.detail.unicode))
      pickerHostRef.current.appendChild(picker)
    })
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => {
      cancelled = true
      document.removeEventListener('mousedown', handleOutside)
      picker?.remove()
    }
  }, [open])

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Smile className="w-3.5 h-3.5" /> כל האימוג׳ים
      </Button>
      {open && (
        <div ref={pickerHostRef} dir="ltr"
          className="absolute top-full start-0 mt-1 z-30 w-[22rem] max-w-[90vw] rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white" />
      )}
    </span>
  )
}

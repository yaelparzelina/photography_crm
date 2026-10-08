import { useState, useRef, useEffect } from 'react'
import { Bold } from 'lucide-react'
import Modal, { ModalActions } from '../ui/Modal'
import Button from '../ui/Button'
import Field from '../ui/Field'
import Toggle from '../ui/Toggle'
import { inputClass } from '../ui/styles'
import { variantKeys, variantLabel, completeVariants, NAME_TOKEN, BLANK } from '../../utils/messageTemplate'

const QUICK_EMOJIS = ['❤️', '🥰', '😘', '😉', '😇', '💃', '🙏🏻', '✨', '📝', '👇🏻', '🩵', '📸', '🎉', '😊', '💐', '⭐']

const EMPTY = { title: '', hasGender: false, hasAlbum: false, variants: { f_base: '' } }

function VariantTextarea({ label, value, onChange }) {
  const ref = useRef(null)

  // Inserts text at the cursor, or wraps the selection (for bold)
  function insert(before, after = '') {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = end + before.length + after.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        <Button variant="secondary" size="sm" onClick={() => insert(BLANK)}>___ שדה למילוי</Button>
        <Button variant="secondary" size="sm" onClick={() => insert(NAME_TOKEN)}>{NAME_TOKEN} שם הלקוח</Button>
        <Button variant="secondary" size="sm" onClick={() => insert('*', '*')}><Bold className="w-3.5 h-3.5" /> הדגשה</Button>
        <span className="flex flex-wrap gap-0.5 ms-1">
          {QUICK_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => insert(e)} aria-label={`הוסף ${e}`}
              className="w-7 h-7 rounded-md text-base hover:bg-gray-100">{e}</button>
          ))}
        </span>
      </div>
      <textarea ref={ref} rows={10} dir="rtl" value={value} onChange={(e) => onChange(e.target.value)}
        className={`${inputClass()} leading-relaxed`} />
    </Field>
  )
}

export default function MessageEditor({ isOpen, template, onClose, onSave }) {
  const [draft, setDraft] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form each time the editor opens
    setDraft(template
      ? { title: template.title, hasGender: !!template.hasGender, hasAlbum: !!template.hasAlbum, variants: { ...template.variants } }
      : EMPTY)
    setError('')
  }, [isOpen, template])

  function setFlag(flag, value) {
    setDraft((d) => {
      const next = { ...d, [flag]: value }
      next.variants = completeVariants(d.variants, next.hasGender, next.hasAlbum)
      return next
    })
  }

  async function handleSave() {
    if (!draft.title.trim()) { setError('יש לתת כותרת להודעה'); return }
    const keys = variantKeys(draft.hasGender, draft.hasAlbum)
    const variants = Object.fromEntries(keys.map((k) => [k, draft.variants[k] || '']))
    setSaving(true)
    try {
      await onSave({ title: draft.title.trim(), hasGender: draft.hasGender, hasAlbum: draft.hasAlbum, variants })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const keys = variantKeys(draft.hasGender, draft.hasAlbum)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={template ? 'עריכת הודעה' : 'הודעה חדשה'} maxWidth="max-w-3xl">
      <div className="space-y-5">
        <Field label="כותרת (לא מועתקת)" error={error}>
          <input className={inputClass(!!error)} value={draft.title}
            onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setError('') }} />
        </Field>

        <div className="flex flex-wrap gap-6">
          <Toggle text="גרסת נקבה / זכר" checked={draft.hasGender} onChange={(v) => setFlag('hasGender', v)} />
          <Toggle text="גרסה עם / בלי אלבום" checked={draft.hasAlbum} onChange={(v) => setFlag('hasAlbum', v)} />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          ___ = שדה למילוי ידני · {NAME_TOKEN} = שם הלקוח (מתמלא אוטומטית מכרטיס הלקוח) · *טקסט* = מודגש בוואטסאפ ·
          קישורים: מדביקים את הכתובת המלאה (https://...) · לכל האימוג׳ים במחשב: מקש Windows + נקודה
        </p>

        {keys.map((k) => (
          <VariantTextarea key={k} label={variantLabel(k, draft.hasGender, draft.hasAlbum)}
            value={draft.variants[k] || ''}
            onChange={(v) => setDraft((d) => ({ ...d, variants: { ...d.variants, [k]: v } }))} />
        ))}

        <ModalActions>
          <Button variant="secondary" onClick={onClose}>בטל</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמור הודעה'}</Button>
        </ModalActions>
      </div>
    </Modal>
  )
}

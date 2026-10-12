import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Upload, ExternalLink } from 'lucide-react'
import { loadGuide, saveGuide } from '../hooks/useDressGuides'
import { emptyGuide, suggestColor, guideMessageTitle, guidePreviewHref, SECTION_TITLES } from '../utils/dressGuides'
import { resizeImage } from '../utils/imageResize'
import DressGuideView from '../components/dressGuides/DressGuideView'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Segmented from '../components/ui/Segmented'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { inputClass } from '../components/ui/styles'

const textareaClass = `${inputClass()} leading-relaxed`
const TIP_TYPES = [{ value: 'do', label: '✓ מומלץ' }, { value: 'dont', label: '✕ להימנע' }]

function move(list, i, dir) {
  const next = [...list]
  ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
  return next
}

// Rows with reorder / remove and an "add" link underneath
function ListEditor({ items, onChange, newItem, addLabel, itemLabel, children }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">{children(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}</div>
          <div className="flex flex-col items-center">
            <IconButton label={`הזז למעלה: ${itemLabel} ${i + 1}`} disabled={i === 0} onClick={() => onChange(move(items, i, -1))}>
              <ChevronUp className="w-4 h-4" />
            </IconButton>
            <IconButton label={`הזז למטה: ${itemLabel} ${i + 1}`} disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))}>
              <ChevronDown className="w-4 h-4" />
            </IconButton>
          </div>
          <IconButton label={`הסר ${itemLabel} ${i + 1}`} variant="danger" className="mt-2" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ))}
      <Button variant="link" size="sm" onClick={() => onChange([...items, newItem()])}>
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </Button>
    </div>
  )
}

function PhotosEditor({ photos, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function addFiles(files) {
    setBusy(true)
    setError('')
    const added = []
    for (const file of files) {
      try {
        added.push({ id: `new-${crypto.randomUUID()}`, src: await resizeImage(file), isNew: true })
      } catch {
        setError(`לא ניתן להוסיף את "${file.name}"`)
      }
    }
    onChange([...photos, ...added])
    setBusy(false)
  }

  return (
    <div>
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {photos.map((p, i) => (
            <li key={p.id} className="relative group">
              <img src={p.src} alt={`תמונה ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-100" />
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between bg-white/90 rounded-md px-0.5">
                <IconButton label={`הזז ימינה: תמונה ${i + 1}`} disabled={i === 0} onClick={() => onChange(move(photos, i, -1))}>
                  <ChevronRight className="w-4 h-4" />
                </IconButton>
                <IconButton label={`הסר תמונה ${i + 1}`} variant="danger" onClick={() => onChange(photos.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4" />
                </IconButton>
                <IconButton label={`הזז שמאלה: תמונה ${i + 1}`} disabled={i === photos.length - 1} onClick={() => onChange(move(photos, i, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" aria-label="בחירת תמונות"
        onChange={(e) => { addFiles([...e.target.files]); e.target.value = '' }} />
      <Button variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload className="w-3.5 h-3.5" /> {busy ? 'מעלה...' : 'הוספת תמונות'}
      </Button>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2">התמונות מוקטנות אוטומטית. הן נשמרות רק בלחיצה על ״שמור״.</p>
    </div>
  )
}

const snapshotOf = (form, photos) => JSON.stringify([form, photos.map((p) => p.id)])

export default function DressGuideEditor() {
  const { slug } = useParams()
  const isNew = slug === 'new'
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(() => (isNew ? { guide: emptyGuide(), photos: [] } : null)) // as saved
  const [form, setForm] = useState(() => loaded?.guide ?? null)
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isNew) return
    loadGuide(slug).then((data) => {
      if (!data) { setNotFound(true); return }
      setLoaded(data)
      setForm(data.guide)
      setPhotos(data.photos)
    }).catch(() => setNotFound(true))
  }, [slug, isNew])

  if (notFound) return <div className="text-center py-20 text-gray-400">דף ההנחיות לא נמצא</div>
  if (!form) return <div className="text-center py-20 text-gray-400">טוען...</div>

  const dirty = snapshotOf(form, photos) !== snapshotOf(loaded.guide, loaded.photos)
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const bind = (field) => ({ value: form[field] ?? '', onChange: (e) => set(field)(e.target.value) })

  function leave() {
    if (dirty) setConfirmLeave(true)
    else navigate('/dashboard/dress-guides')
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setErrors({ name: 'יש למלא שם' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setErrors({})
    setSaving(true)
    setSaveError('')
    try {
      await saveGuide({
        slug: isNew ? null : slug,
        form: { ...form, name: form.name.trim() },
        photos,
        previousPhotoIds: loaded.photos.map((p) => p.id),
        previous: isNew ? null : loaded.guide,
      })
      navigate('/dashboard/dress-guides')
    } catch (err) {
      console.error(err)
      setSaveError('השמירה נכשלה, נסי שוב')
      setSaving(false)
    }
  }

  // Changing a colour's name suggests its swatch, unless the colour was picked by hand
  function updateSwatch(prev, next) {
    if (next.name !== prev.name) {
      const wasAuto = !prev.color || prev.color === suggestColor(prev.name)
      const suggestion = suggestColor(next.name)
      if (wasAuto && suggestion) return { ...next, color: suggestion }
    }
    return next
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <IconButton label="חזרה להנחיות לבוש" onClick={leave}><ArrowRight className="w-5 h-5" /></IconButton>
          <h1 className="text-2xl font-semibold text-gray-900">{isNew ? 'דף הנחיות חדש' : form.name || 'עריכת דף הנחיות'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a href={guidePreviewHref(slug)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 me-2">
              <ExternalLink className="w-4 h-4" /> פתח את הדף
            </a>
          )}
          <Button variant="secondary" onClick={leave}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving || (!dirty && !isNew)} disabledReason={saving ? null : 'אין שינויים לשמירה'}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </div>
      {saveError && <p className="text-red-600 text-sm mb-4">{saveError}</p>}

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="space-y-4">
          <Card title="פרטי הדף">
            <div className="space-y-4">
              <Field label="שם הדף *" error={errors.name}>
                <input className={inputClass(!!errors.name)} {...bind('name')} placeholder="למשל: צילומי ניובורן" />
                <p className="text-xs text-gray-400 mt-1">
                  כותרת ההודעה ב״הודעות ללקוח״: {guideMessageTitle(form.name || '...')}
                </p>
              </Field>
              <Field label="כותרת">
                <input className={inputClass()} {...bind('title')} placeholder="למשל: הנחיות לבוש לצילומי ניובורן" />
              </Field>
              <Field label="כותרת משנה">
                <input className={inputClass()} {...bind('subtitle')} placeholder="למשל: מזל טוב!" />
              </Field>
              <Field label="פתיח">
                <textarea rows={3} className={textareaClass} {...bind('intro')} />
              </Field>
            </div>
          </Card>

          <Card title={SECTION_TITLES.palette}>
            <Field label="טקסט מעל הצבעים" className="mb-4">
              <textarea rows={2} className={textareaClass} {...bind('paletteText')} />
            </Field>
            <ListEditor items={form.palette} onChange={set('palette')} newItem={() => ({ name: '', color: '' })}
              addLabel="הוספת צבע" itemLabel="צבע">
              {(c, update, i) => (
                <div className="flex items-center gap-2">
                  <input type="color" value={c.color || '#E8D9C5'} aria-label={`גוון לצבע ${i + 1}`}
                    onChange={(e) => update({ ...c, color: e.target.value })}
                    className="w-10 h-10 shrink-0 rounded-lg border border-gray-200 bg-white p-1 cursor-pointer" />
                  <input className={inputClass()} value={c.name} aria-label={`שם צבע ${i + 1}`} placeholder="למשל: חיטה"
                    onChange={(e) => update(updateSwatch(c, { ...c, name: e.target.value }))} />
                </div>
              )}
            </ListEditor>
          </Card>

          <Card title={SECTION_TITLES.tips}>
            <ListEditor items={form.tips} onChange={set('tips')} newItem={() => ({ type: 'do', text: '' })}
              addLabel="הוספת הנחיה" itemLabel="הנחיה">
              {(tip, update, i) => (
                <div className="space-y-1.5">
                  <Segmented label={`סוג הנחיה ${i + 1}`} options={TIP_TYPES} value={tip.type}
                    onChange={(type) => update({ ...tip, type })} />
                  <textarea rows={2} className={textareaClass} value={tip.text} aria-label={`הנחיה ${i + 1}`}
                    onChange={(e) => update({ ...tip, text: e.target.value })} />
                </div>
              )}
            </ListEditor>
          </Card>

          <Card title={SECTION_TITLES.outfits}>
            <ListEditor items={form.outfits} onChange={set('outfits')} newItem={() => ''} addLabel="הוספת סט" itemLabel="סט">
              {(o, update, i) => (
                <textarea rows={2} className={textareaClass} value={o} aria-label={`סט ${i + 1}`}
                  onChange={(e) => update(e.target.value)} />
              )}
            </ListEditor>
            <Field label="הערה (מופיעה מתחת לרשימה)" className="mt-4">
              <textarea rows={2} className={textareaClass} {...bind('note')} placeholder="למשל: נ.ב. את האביזרים אני דואגת להביא" />
            </Field>
          </Card>

          <Card title={SECTION_TITLES.photos}>
            <PhotosEditor photos={photos} onChange={setPhotos} />
          </Card>

          <Card title="סיום">
            <div className="space-y-4">
              <Field label="טקסט סיום (מעל כפתור הוואטסאפ)">
                <textarea rows={3} className={textareaClass} {...bind('closing')} />
              </Field>
              <Field label="חתימה">
                <input className={inputClass()} {...bind('signoff')} placeholder="למשל: מחכה ומתרגשת ❤️" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20">
          <p className="text-xs font-medium text-gray-500 mb-2">תצוגה מקדימה</p>
          <div className="rounded-2xl border border-gray-200 overflow-y-auto lg:max-h-[calc(100vh-7rem)] shadow-sm" data-testid="guide-preview">
            <DressGuideView guide={form} photos={photos} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmLeave}
        title="יציאה בלי לשמור"
        message="יש שינויים שלא נשמרו. לצאת בלי לשמור?"
        confirmLabel="צא בלי לשמור"
        destructive
        onConfirm={() => navigate('/dashboard/dress-guides')}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  )
}

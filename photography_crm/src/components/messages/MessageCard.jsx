import { useState, useMemo } from 'react'
import { Copy, Check, Edit2, Trash2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Toggle from '../ui/Toggle'
import Segmented from '../ui/Segmented'
import { cardClass } from '../ui/styles'
import MessageText from './MessageText'
import { tokenize, buildText, hasMissing, getVariantText } from '../../utils/messageTemplate'

const GENDER_OPTIONS = [{ value: 'female', label: 'נקבה' }, { value: 'male', label: 'זכר' }]

// One message: version switches, fill-in blanks, and a copy button.
// Everything prefilled from the client (name, gender, album) stays editable here.
export default function MessageCard({ template, client, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [gender, setGender] = useState(client?.gender === 'male' ? 'male' : 'female')
  const [withAlbum, setWithAlbum] = useState(!!client?.includesAlbum)
  const [values, setValues] = useState({})
  const [name, setName] = useState(client?.firstName || '')
  const [status, setStatus] = useState(null) // 'copied' | 'missing'

  const text = getVariantText(template, gender, withAlbum)
  const tokens = useMemo(() => tokenize(text), [text])
  const missing = hasMissing(tokens, values, name)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText(tokens, values, name))
    } catch {
      setStatus('error')
      return
    }
    setStatus(missing ? 'missing' : 'copied')
    if (!missing) setTimeout(() => setStatus((s) => (s === 'copied' ? null : s)), 2500)
  }

  return (
    <article className={`${cardClass} p-5`}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900 flex-1 min-w-[8rem]">{template.title}</h2>
        {template.hasGender && (
          <Segmented label="לשון פנייה" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        )}
        {template.hasAlbum && (
          <Toggle text="עם אלבום" checked={withAlbum} onChange={setWithAlbum} />
        )}
        <div className="flex items-center">
          <IconButton label="הזז למעלה" onClick={onMoveUp} disabled={isFirst}><ChevronUp className="w-4 h-4" /></IconButton>
          <IconButton label="הזז למטה" onClick={onMoveDown} disabled={isLast}><ChevronDown className="w-4 h-4" /></IconButton>
          <IconButton label="ערוך" onClick={onEdit}><Edit2 className="w-4 h-4" /></IconButton>
          <IconButton label="מחק" variant="danger" onClick={onDelete}><Trash2 className="w-4 h-4" /></IconButton>
        </div>
      </div>

      <div className="bg-[#e7fbe2] border border-[#d1f2c9] rounded-2xl rounded-tr-sm px-4 py-3">
        <MessageText tokens={tokens} values={values} name={name} onNameChange={setName}
          onValueChange={(i, v) => setValues((vals) => ({ ...vals, [i]: v }))}
          highlightMissing={status === 'missing'} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <Button onClick={handleCopy}>
          {status === 'copied' ? <><Check className="w-4 h-4" /> הועתק!</> : <><Copy className="w-4 h-4" /> העתק הודעה</>}
        </Button>
        {status === 'missing' && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {missing ? 'ההודעה הועתקה, אבל יש שדות שלא מולאו (מסומנים באדום)' : 'הועתק לפני שכל השדות מולאו — כדאי להעתיק שוב'}
          </p>
        )}
        {status === 'error' && <p className="text-sm text-red-600">ההעתקה נכשלה, נסי שוב</p>}
      </div>
    </article>
  )
}

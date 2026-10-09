import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import CheckboxGroup from './ui/CheckboxGroup'
import { STATUS_OPTIONS, IN_PROGRESS_PRESET, IN_PROGRESS_STATUSES } from '../utils/statusConfig'

function summary(value) {
  if (!value.length || value.length === STATUS_OPTIONS.length) return 'כל הסטטוסים'
  const sameAs = (list) => list.length === value.length && list.every((v) => value.includes(v))
  if (sameAs(IN_PROGRESS_STATUSES)) return 'הכל בתהליך'
  if (value.length === 1) return STATUS_OPTIONS.find((o) => o.value === value[0])?.label
  return `${value.length} סטטוסים`
}

// Status filter button that opens a checkbox panel (empty selection = all statuses).
export default function StatusFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog"
        className={`h-full flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 whitespace-nowrap ${
          value.length ? 'border-gray-900 text-gray-900 font-medium' : 'border-gray-200 text-gray-700'
        }`}>
        {summary(value)}
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div role="dialog" aria-label="סינון לפי סטטוס"
          className="absolute top-full end-0 mt-1 z-30 w-[min(30rem,90vw)] bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <CheckboxGroup label="סטטוס" options={STATUS_OPTIONS} value={value} onChange={onChange}
            presets={[IN_PROGRESS_PRESET]} />
        </div>
      )}
    </div>
  )
}

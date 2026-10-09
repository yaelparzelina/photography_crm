import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Field from './Field'
import { inputClass } from './styles'
import { formatDate, toInputDate, fromInputDate } from '../../utils/dateUtils'

// Drop-down with a from/to date range. Empty = no date filter.
export default function DateRangeFilter({ label, from, to, onChange, className = '' }) {
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

  const summary = from || to ? `${from ? formatDate(from) : '…'} – ${to ? formatDate(to) : '…'}` : 'כל התאריכים'

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}
        aria-label={`${label}: ${summary}`}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg ps-4 pe-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 whitespace-nowrap">
        <span className="truncate"><span className="text-gray-400">{label}: </span>{summary}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="dialog" aria-label={label}
          className="absolute top-full start-0 mt-1 z-30 w-72 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-3">
          <Field label="מתאריך">
            <input type="date" max="9999-12-31" className={inputClass()} value={toInputDate(from)}
              onChange={(e) => onChange({ from: fromInputDate(e.target.value), to })} />
          </Field>
          <Field label="עד תאריך">
            <input type="date" max="9999-12-31" className={inputClass()} value={toInputDate(to)}
              onChange={(e) => onChange({ from, to: fromInputDate(e.target.value) })} />
          </Field>
          <button type="button" onClick={() => onChange({ from: null, to: null })} disabled={!from && !to}
            className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-40">
            נקה תאריכים
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

// A drop-down list (looks like a <select>) where several options can be ticked.
// An empty selection means "no filter" and shows `allLabel`.
// `presets` appear as quick choices at the top, e.g. [{ label: 'הכל בתהליך', values: [...] }].
export default function MultiSelect({ label, options, value, onChange, allLabel = 'הכל', presets = [], className = '' }) {
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

  const sameAs = (list) => list.length === value.length && list.every((v) => value.includes(v))
  const matchingPreset = presets.find((p) => sameAs(p.values))
  const summary = !value.length || value.length === options.length
    ? allLabel
    : matchingPreset?.label
      ?? (value.length === 1 ? options.find((o) => o.value === value[0])?.label : `${value.length} נבחרו`)

  function toggle(v) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  // A preset checkbox ticks/unticks its whole group; half-ticked when only part of the group is selected
  function togglePreset(p) {
    const all = p.values.every((v) => value.includes(v))
    onChange(all ? value.filter((v) => !p.values.includes(v)) : [...new Set([...value, ...p.values])])
  }

  const rowClass = 'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-start hover:bg-gray-50 cursor-pointer'

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        aria-label={label ? `${label}: ${summary}` : summary}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg ps-4 pe-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 whitespace-nowrap">
        <span className="truncate">{label && <span className="text-gray-400">{label}: </span>}{summary}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-multiselectable="true" aria-label={label}
          className="absolute top-full start-0 mt-1 z-30 min-w-full w-max max-w-[90vw] max-h-[min(30rem,70vh)] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {presets.map((p) => {
            const all = p.values.every((v) => value.includes(v))
            const some = p.values.some((v) => value.includes(v))
            return (
              <label key={p.label} role="option" aria-selected={all} className={`${rowClass} font-medium text-gray-900`}>
                <input type="checkbox" className="w-4 h-4 accent-gray-900" checked={all}
                  ref={(el) => { if (el) el.indeterminate = some && !all }}
                  onChange={() => togglePreset(p)} />
                {p.label}
              </label>
            )
          })}
          {presets.length > 0 && <div className="my-1 border-t border-gray-100" />}
          {options.map((o) => (
            <label key={o.value} role="option" aria-selected={value.includes(o.value)} className={`${rowClass} text-gray-700`}>
              <input type="checkbox" className="w-4 h-4 accent-gray-900" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
          <div className="my-1 border-t border-gray-100" />
          <button type="button" onClick={() => onChange([])} disabled={!value.length}
            className={`${rowClass} text-gray-500 disabled:opacity-40 disabled:pointer-events-none`}>
            נקה בחירה
          </button>
        </div>
      )}
    </div>
  )
}

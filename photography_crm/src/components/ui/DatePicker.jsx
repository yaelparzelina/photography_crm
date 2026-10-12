import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react'
import { inputClass } from './styles'
import { dayFromParts, formatDay, parseDateText, toInputDate } from '../../utils/dateUtils'
import { holidayName } from '../../utils/businessDays'

// Calendar-day values are Dates at UTC midnight (the same as fromInputDate), so all math uses UTC parts.

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, i, 1))))
const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

const toDayValue = (value) => {
  const key = toInputDate(value)
  return key ? new Date(`${key}T00:00:00Z`) : null
}
const sameDay = (a, b) => !!a && !!b && a.getTime() === b.getTime()
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)
const todayDay = () => {
  const n = new Date()
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
}

// Month grid. Sunday is the first column (on the right, in RTL).
export function Calendar({ value, onSelect }) {
  const selected = toDayValue(value)
  const today = todayDay()
  const [focusDay, setFocusDay] = useState(selected || today)
  const gridRef = useRef(null)
  const year = focusDay.getUTCFullYear()
  const month = focusDay.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => dayFromParts(year, month, i + 1))]
  const currentYear = today.getUTCFullYear()
  const years = Array.from({ length: currentYear + 6 - 1920 }, (_, i) => currentYear + 5 - i)

  useEffect(() => {
    gridRef.current?.querySelector('[data-focus="true"]')?.focus({ preventScroll: true })
  }, [focusDay])

  function setMonth(y, m) {
    const day = Math.min(focusDay.getUTCDate(), new Date(Date.UTC(y, m + 1, 0)).getUTCDate())
    setFocusDay(dayFromParts(y, m, day))
  }

  function handleKey(e) {
    // RTL: the left arrow moves forward in time
    const moves = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 }
    if (moves[e.key]) { e.preventDefault(); setFocusDay(addDays(focusDay, moves[e.key])) }
    else if (e.key === 'PageDown') { e.preventDefault(); setMonth(month === 11 ? year + 1 : year, (month + 1) % 12) }
    else if (e.key === 'PageUp') { e.preventDefault(); setMonth(month === 0 ? year - 1 : year, (month + 11) % 12) }
  }

  const navBtn = 'p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100'
  const selectClass = 'border border-gray-200 rounded-lg ps-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300'

  return (
    <div className="w-[17rem]">
      <div className="flex items-center gap-1 mb-2">
        <button type="button" className={navBtn} aria-label="החודש הקודם" onClick={() => setMonth(month === 0 ? year - 1 : year, (month + 11) % 12)}>
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <select aria-label="חודש" className={selectClass} value={month} onChange={(e) => setMonth(year, Number(e.target.value))}>
            {MONTHS.map((name, i) => <option key={name} value={i}>{name}</option>)}
          </select>
          <select aria-label="שנה" className={selectClass} value={year} onChange={(e) => setMonth(Number(e.target.value), month)}>
            {!years.includes(year) && <option value={year}>{year}</option>}
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" className={navBtn} aria-label="החודש הבא" onClick={() => setMonth(month === 11 ? year + 1 : year, (month + 1) % 12)}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-400 mb-1">
        {WEEKDAYS.map((w) => <span key={w} className="py-1">{w}</span>)}
      </div>
      <div ref={gridRef} role="grid" aria-label={`${MONTHS[month]} ${year}`} className="grid grid-cols-7 gap-0.5" onKeyDown={handleKey}>
        {cells.map((d, i) => {
          if (!d) return <span key={`blank-${i}`} />
          const isSelected = sameDay(d, selected)
          const isToday = sameDay(d, today)
          const holiday = holidayName(d)
          const weekend = d.getUTCDay() >= 5
          return (
            <button key={d.getTime()} type="button" role="gridcell" aria-selected={isSelected}
              aria-label={`${d.getUTCDate()} ב${MONTHS[month]} ${year}${holiday ? ` · ${holiday}` : ''}`}
              title={holiday || undefined}
              tabIndex={sameDay(d, focusDay) ? 0 : -1} data-focus={sameDay(d, focusDay)}
              onClick={() => onSelect(d)}
              className={`relative h-9 rounded-lg text-sm tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                isSelected ? 'bg-gray-900 text-white font-medium'
                  : `hover:bg-gray-100 ${isToday ? 'ring-1 ring-gray-300 font-medium text-gray-900' : weekend ? 'text-gray-400' : 'text-gray-700'}`
              }`}>
              {d.getUTCDate()}
              {holiday && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Calendar in a floating panel next to `anchorRef`. Rendered in a portal so scrolling columns and modals don't clip it.
export function DatePopover({ anchorRef, value, onChange, onClose, clearable = true }) {
  const panelRef = useRef(null)
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    const r = anchorRef.current?.getBoundingClientRect()
    if (!r) return
    const height = 360
    const width = 304
    const below = window.innerHeight - r.bottom
    const right = Math.min(Math.max(8, window.innerWidth - r.right), window.innerWidth - width - 8)
    setPos(below < height && r.top > below
      ? { bottom: window.innerHeight - r.top + 6, right: Math.max(8, right) }
      : { top: r.bottom + 6, right: Math.max(8, right) })
  }, [anchorRef])

  useEffect(() => {
    function outside(e) {
      if (panelRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose()
    }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    function scroll(e) { if (!(e.target instanceof Node && panelRef.current?.contains(e.target))) onClose() }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', key, true)
    window.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', outside)
      document.removeEventListener('keydown', key, true)
      window.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [anchorRef, onClose])

  const pick = (d) => { onChange(d); onClose() }

  return createPortal(
    <div ref={panelRef} role="dialog" aria-label="בחירת תאריך" data-date-popover=""
      style={{ position: 'fixed', zIndex: 10000, ...(pos || { top: -9999, right: 0 }) }}
      // React events bubble out of portals to the component tree, so keep them from reaching e.g. a board ticket
      onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl p-3.5">
      <Calendar value={value} onSelect={pick} />
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
        <button type="button" className="text-sm text-gray-600 hover:text-gray-900" onClick={() => pick(todayDay())}>היום</button>
        {clearable && value && (
          <button type="button" className="text-sm text-gray-500 hover:text-red-600" onClick={() => pick(null)}>נקה תאריך</button>
        )}
      </div>
    </div>,
    document.body
  )
}

// Typing template: the owner types digits only, the slashes are already there
const MASK = '__/__/____'
const SLOTS = [0, 1, 3, 4, 6, 7, 8, 9] // where the 8 digits of ddmmyyyy go in the template

function fillMask(digits) {
  const chars = MASK.split('')
  digits.split('').forEach((d, i) => { chars[SLOTS[i]] = d })
  return chars.join('')
}
const digitsOf = (value) => formatDay(value).replace(/\D/g, '')
const dateFromDigits = (digits, century = false) => (century
  ? dayFromParts(2000 + Number(digits.slice(4, 6)), Number(digits.slice(2, 4)) - 1, Number(digits.slice(0, 2)))
  : dayFromParts(Number(digits.slice(4, 8)), Number(digits.slice(2, 4)) - 1, Number(digits.slice(0, 2))))

// Date field: type the digits into __/__/____ or pick from the calendar. Calls onChange with a Date (UTC midnight) or null.
export default function DateInput({ value, onChange, hasError = false, placeholder = 'dd/mm/yyyy', clearable = true, className = '', ...rest }) {
  const [open, setOpen] = useState(false)
  const [digits, setDigits] = useState('')
  const [editing, setEditing] = useState(false)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const invalid = editing && digits.length === 8 && !dateFromDigits(digits)
  const shown = editing ? fillMask(digits) : formatDay(value)

  // Keep the caret right after the last typed digit
  useLayoutEffect(() => {
    const input = inputRef.current
    if (!editing || document.activeElement !== input) return
    const place = () => {
      const pos = digits.length ? SLOTS[digits.length - 1] + 1 : 0
      input.setSelectionRange(pos, pos)
    }
    place()
    const frame = requestAnimationFrame(place) // after a mouse click has placed its own caret
    return () => cancelAnimationFrame(frame)
  }, [digits, editing])

  function handleChange(e) {
    const raw = e.target.value
    // A full date pasted or filled in another format (16.10.2026, 2026-10-16)
    if (!raw.includes('_')) {
      const parsed = parseDateText(raw)
      if (parsed) { setDigits(digitsOf(parsed)); onChange(parsed); return }
    }
    const next = raw.replace(/\D/g, '').slice(0, 8)
    setDigits(next)
    if (!next) { if (clearable) onChange(null); return }
    if (next.length === 8) {
      const date = dateFromDigits(next)
      if (date) onChange(date)
    }
  }

  function handleBlur() {
    setEditing(false)
    // A two-digit year (16/10/26) is completed when leaving the field
    if (digits.length === 6) {
      const date = dateFromDigits(digits, true)
      if (date) onChange(date)
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input ref={inputRef} type="text" inputMode="numeric" dir="ltr" autoComplete="off" placeholder={placeholder}
        className={`${inputClass(hasError || invalid)} text-right !pl-10 tabular-nums tracking-wide`} value={shown}
        title={invalid ? 'תאריך לא תקין' : undefined} aria-invalid={invalid || undefined}
        onFocus={() => { setEditing(true); setDigits(digitsOf(value)) }}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && e.altKey) setOpen(true) }}
        {...rest} />
      <button type="button" aria-label="פתיחת לוח שנה" aria-haspopup="dialog" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100">
        <CalendarDays className="w-4 h-4" />
      </button>
      {invalid && <p className="text-red-600 text-xs mt-1">תאריך לא תקין</p>}
      {open && (
        <DatePopover anchorRef={wrapRef} value={value} clearable={clearable}
          onChange={(d) => { setEditing(false); onChange(d) }} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

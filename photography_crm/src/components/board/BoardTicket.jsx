import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDraggable } from '@dnd-kit/core'
import {
  Camera, PartyPopper, Clock, PhoneCall, MoreHorizontal, BookOpen, Check, MessageSquareText, Shirt, EyeOff,
} from 'lucide-react'
import { BOARD_COLUMNS, COLUMN_BY_ID, clientDeadline, whatsappUrl, shortDate } from '../../utils/board'
import { businessDaysUntil, toDay } from '../../utils/businessDays'
import { getClientName } from '../../utils/clientUtils'
import { toInputDate, fromInputDate } from '../../utils/dateUtils'

const tone = {
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  good: 'bg-green-50 text-green-700 border-green-200',
}

function Tag({ icon: Icon, children, variant = 'neutral', title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 border rounded-md px-1.5 py-0.5 text-[11px] leading-4 ${tone[variant]}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

const CLOSING_CHIPS = {
  proposal_sent: { label: 'טרם נשלח חוזה', variant: 'neutral' },
  agreement_sent: { label: 'חוזה נשלח', variant: 'warn' },
  agreement_signed: { label: 'חוזה נחתם', variant: 'good' },
}

function deadlineTag(client, now) {
  const deadline = clientDeadline(client)
  if (!deadline) return null
  const left = businessDaysUntil(deadline, now)
  const text = left > 0 ? `עוד ${left} ימי עסקים` : left === 0 ? 'היום' : `באיחור ${-left} ימי עסקים`
  const variant = left < 0 ? 'danger' : left <= 2 ? 'warn' : 'neutral'
  return <Tag icon={Clock} variant={variant} title="מועד מסירת התמונות">מסירה {shortDate(deadline, now)} · {text}</Tag>
}

// "⋯" menu: move to another column, remove from the board. Rendered in a portal so columns don't clip it.
function TicketMenu({ client, columnId, onMove, onRemove }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const name = getClientName(client)

  useEffect(() => {
    if (!pos) return
    const close = (e) => {
      if (e?.type === 'mousedown' && (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target))) return
      if (e?.type === 'scroll' && e.target instanceof Node && menuRef.current?.contains(e.target)) return
      setPos(null)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  function toggle(e) {
    e.stopPropagation()
    if (pos) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    const below = window.innerHeight - r.bottom
    setPos(below > 340 || below > r.top
      ? { top: r.bottom + 4, left: Math.max(8, r.left) }
      : { bottom: window.innerHeight - r.top + 4, left: Math.max(8, r.left) })
  }

  const run = (fn) => (e) => { e.stopPropagation(); setPos(null); fn() }

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} onPointerDown={(e) => e.stopPropagation()}
        aria-label={`פעולות עבור ${name}`} aria-haspopup="menu" aria-expanded={!!pos}
        className="p-1 -m-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {pos && createPortal(
        <div ref={menuRef} role="menu" aria-label={`העברת ${name}`} style={{ position: 'fixed', ...pos, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[12rem] max-h-[70vh] overflow-y-auto">
          <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-gray-400">העברה ל…</p>
          {BOARD_COLUMNS.filter((c) => c.id !== columnId).map((c) => (
            <button key={c.id} type="button" role="menuitem" onClick={run(() => onMove(c.id))}
              className="block w-full text-start px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              {c.title}
            </button>
          ))}
          {COLUMN_BY_ID[columnId].expires && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button type="button" role="menuitem" onClick={run(onRemove)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <EyeOff className="w-3.5 h-3.5" /> הסר מהלוח
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

// Date chip for "לחזור ללקוח": opens the native date picker
function CallbackDate({ client, now, onChange }) {
  const inputRef = useRef(null)
  const day = toDay(client.callbackDate)
  const today = toDay(now)
  const due = day && day <= today
  function open(e) {
    e.stopPropagation()
    const input = inputRef.current
    try { input.showPicker() } catch { input.focus() }
  }
  return (
    <span className="relative inline-flex">
      <button type="button" onClick={open} onPointerDown={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 border rounded-md px-1.5 py-0.5 text-[11px] leading-4 ${day ? tone[due ? 'warn' : 'neutral'] : 'border-dashed border-gray-300 text-gray-500 hover:text-gray-800'}`}>
        <PhoneCall className="w-3 h-3" aria-hidden="true" />
        {day ? `לחזור ${shortDate(day, now)}` : 'תאריך לחזרה'}
      </button>
      <input ref={inputRef} type="date" tabIndex={-1} aria-label={`תאריך לחזרה ל${getClientName(client)}`}
        className="absolute inset-0 opacity-0 pointer-events-none"
        value={day ? toInputDate(day) : ''} onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(fromInputDate(e.target.value))} />
    </span>
  )
}

function ActionButton({ icon: Icon, children, onClick }) {
  return (
    <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onClick() }}
      className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md px-1.5 py-0.5 -mx-1.5">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {children}
    </button>
  )
}

export function TicketCard({ client, columnId, typeName, now = new Date(), actions = {}, dragging = false, overlay = false }) {
  const name = getClientName(client) || 'ללא שם'
  const wa = whatsappUrl(client.phone)
  const afterShoot = columnId === 'editing' || columnId === 'album'
  const chip = columnId === 'closing' ? CLOSING_CHIPS[client.status] : null

  return (
    <div className={`bg-white border rounded-xl px-3 py-2.5 space-y-2 text-start transition-shadow ${
      overlay ? 'shadow-xl border-gray-300 rotate-1 cursor-grabbing' : 'border-gray-200 hover:shadow-md cursor-pointer'
    } ${dragging ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{typeName || 'ללא סוג צילום'}</p>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          {client.paidAdvance && <span title="שילם מקדמה" aria-label="שילם מקדמה" className="text-[11px] font-semibold text-green-600">₪</span>}
          {client.includesAlbum && <BookOpen className="w-3.5 h-3.5 text-gray-400" aria-label="כולל אלבום" />}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`וואטסאפ ל${name}`} title="וואטסאפ"
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
              className="p-0.5 rounded text-green-600 hover:bg-green-50">
              <MessageSquareText className="w-3.5 h-3.5" />
            </a>
          )}
          {actions.onMove && <TicketMenu client={client} columnId={columnId} onMove={actions.onMove} onRemove={actions.onRemove} />}
        </div>
      </div>

      {(chip || client.shootDate || client.eventDate || columnId === 'callback') && (
        <div className="flex flex-wrap gap-1">
          {chip && <Tag icon={Check} variant={chip.variant}>{chip.label}</Tag>}
          {columnId === 'callback' && actions.onCallbackDate && <CallbackDate client={client} now={now} onChange={actions.onCallbackDate} />}
          {client.shootDate && !afterShoot && columnId !== 'done' && <Tag icon={Camera} title="תאריך צילום">צילום {shortDate(client.shootDate, now)}</Tag>}
          {afterShoot && deadlineTag(client, now)}
          {client.eventDate && columnId !== 'done' && <Tag icon={PartyPopper} title="תאריך אירוע">אירוע {shortDate(client.eventDate, now)}</Tag>}
        </div>
      )}

      {columnId === 'closing' && actions.onDressGuide && (
        <ActionButton icon={Shirt} onClick={actions.onDressGuide}>הנחיות לבוש</ActionButton>
      )}
      {columnId === 'preshoot' && actions.onPreShootMessage && (
        <div className="flex items-center justify-between gap-2">
          <ActionButton icon={MessageSquareText} onClick={actions.onPreShootMessage}>הודעה לפני צילום</ActionButton>
          <label className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-gray-600 cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" className="w-3.5 h-3.5 accent-gray-900" checked={!!client.preShootMessageSentAt}
              onChange={(e) => actions.onPreShootSent(e.target.checked)} />
            {client.preShootMessageSentAt ? 'נשלחה ✓' : 'נשלחה'}
          </label>
        </div>
      )}
    </div>
  )
}

export default function BoardTicket({ client, columnId, typeName, now, actions }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: client.id, data: { columnId } })
  return (
    <li ref={setNodeRef} {...listeners} {...attributes}
      aria-roledescription="כרטיס לקוח, ניתן לגרירה" aria-label={getClientName(client) || 'ללא שם'}
      onClick={actions.onOpen}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter' && !e.defaultPrevented) actions.onOpen()
      }}
      className="list-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 touch-manipulation">
      <TicketCard client={client} columnId={columnId} typeName={typeName} now={now} actions={actions} dragging={isDragging} />
    </li>
  )
}

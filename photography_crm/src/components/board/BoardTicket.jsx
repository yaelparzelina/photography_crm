import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Camera, PartyPopper, Clock, PhoneCall, MoreHorizontal, BookOpen, Check, MessageSquareText, Shirt, EyeOff,
  Hourglass, Send, ArrowUp, ArrowDown, Plus,
} from 'lucide-react'
import { BOARD_COLUMNS, COLUMN_BY_ID, clientDeadline, whatsappUrl, shortDate } from '../../utils/board'
import { businessDaysUntil, toDay } from '../../utils/businessDays'
import { getClientName } from '../../utils/clientUtils'
import { DatePopover } from '../ui/DatePicker'
import Hint from '../ui/Hint'

const tone = {
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  good: 'bg-green-50 text-green-700 border-green-200',
}

const stop = (e) => e.stopPropagation()

function Tag({ icon: Icon, children, variant = 'neutral', title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 border rounded-md px-1.5 py-0.5 text-[11px] leading-4 ${tone[variant]}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

// Contract state in "סגירת חוזה והנחיות לבוש"
const CLOSING_CHIPS = {
  proposal_sent: { label: 'טרם נשלח חוזה', variant: 'neutral', icon: Hourglass },
  agreement_sent: { label: 'חוזה נשלח', variant: 'warn', icon: Send },
  agreement_signed: { label: 'חוזה נחתם', variant: 'good', icon: Check },
}

function deadlineTag(client, now) {
  const deadline = clientDeadline(client)
  if (!deadline) return null
  const left = businessDaysUntil(deadline, now)
  const text = left > 0 ? `עוד ${left} ימי עסקים` : left === 0 ? 'היום' : `באיחור ${-left} ימי עסקים`
  const variant = left < 0 ? 'danger' : left <= 2 ? 'warn' : 'neutral'
  return <Tag icon={Clock} variant={variant} title="מועד מסירת התמונות">מסירה {shortDate(deadline, now)} · {text}</Tag>
}

// "⋯" menu: move to another column, reorder, remove from the board. Rendered in a portal so columns don't clip it.
function TicketMenu({ client, columnId, canMoveUp, canMoveDown, onMove, onReorder, onRemove }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const name = getClientName(client)
  const manual = !COLUMN_BY_ID[columnId].sortedByDate

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
    setPos(below > 380 || below > r.top
      ? { top: r.bottom + 4, left: Math.max(8, r.left) }
      : { bottom: window.innerHeight - r.top + 4, left: Math.max(8, r.left) })
  }

  const run = (fn) => (e) => { e.stopPropagation(); setPos(null); fn() }
  const itemClass = 'flex w-full items-center gap-2 text-start px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50'

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} onPointerDown={stop}
        aria-label={`פעולות עבור ${name}`} aria-haspopup="menu" aria-expanded={!!pos}
        className="p-1 -m-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {pos && createPortal(
        // React events bubble out of portals to the ticket, so keep them here
        <div ref={menuRef} role="menu" aria-label={`העברת ${name}`} style={{ position: 'fixed', ...pos, zIndex: 9999 }}
          onPointerDown={stop} onClick={stop} onKeyDown={stop}
          className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[12rem] max-h-[70vh] overflow-y-auto">
          {manual && (canMoveUp || canMoveDown) && (
            <>
              {canMoveUp && <button type="button" role="menuitem" className={itemClass} onClick={run(() => onReorder(-1))}><ArrowUp className="w-3.5 h-3.5" /> הזזה למעלה</button>}
              {canMoveDown && <button type="button" role="menuitem" className={itemClass} onClick={run(() => onReorder(1))}><ArrowDown className="w-3.5 h-3.5" /> הזזה למטה</button>}
              <div className="my-1 border-t border-gray-100" />
            </>
          )}
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
              <button type="button" role="menuitem" onClick={run(onRemove)} className={itemClass}>
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

// A date tag that opens the site's calendar. Empty: a dashed "+ label" chip.
function DateChip({ icon, value, prefix, emptyLabel, ariaLabel, now, warnWhenDue = false, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const day = toDay(value)
  const text = day ? shortDate(day, now) : ''
  const due = warnWhenDue && day && day <= toDay(now)
  const Icon = icon
  return (
    <>
      <button ref={ref} type="button" aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open}
        onPointerDown={stop} onKeyDown={stop} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className={`inline-flex items-center gap-1 border rounded-md px-1.5 py-0.5 text-[11px] leading-4 transition-colors ${
          text ? `${tone[due ? 'warn' : 'neutral']} hover:border-gray-400` : 'border-dashed border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400'
        }`}>
        {text ? <Icon className="w-3 h-3 shrink-0" aria-hidden="true" /> : <Plus className="w-3 h-3 shrink-0" aria-hidden="true" />}
        {text ? `${prefix} ${text}` : emptyLabel}
      </button>
      {open && <DatePopover anchorRef={ref} value={day} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  )
}

function ActionButton({ icon: Icon, children, onClick }) {
  return (
    <button type="button" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); onClick() }}
      className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md px-1.5 py-0.5 -mx-1.5">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {children}
    </button>
  )
}

export function TicketCard({ client, columnId, typeName, now = new Date(), actions = {}, position = {}, dragging = false, overlay = false }) {
  const name = getClientName(client) || 'ללא שם'
  const wa = whatsappUrl(client.phone)
  const afterShoot = columnId === 'editing' || columnId === 'album'
  const chip = columnId === 'closing' ? CLOSING_CHIPS[client.status] : null
  const shoot = toDay(client.shootDate) ? shortDate(client.shootDate, now) : ''
  const event = toDay(client.eventDate) ? shortDate(client.eventDate, now) : ''
  // Before the shoot, the shoot date can be set right on the ticket
  const shootEditable = (columnId === 'closing' || columnId === 'preshoot') && actions.onShootDate
  const showShoot = shoot && !afterShoot && columnId !== 'done' && !shootEditable
  const showEvent = event && columnId !== 'done'
  const callbackEditable = columnId === 'callback' && actions.onCallbackDate

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
          {client.paidAdvance && (
            <Hint text="שילם מקדמה">
              <span tabIndex={0} aria-label="שילם מקדמה" className="text-[11px] font-semibold text-green-600 cursor-default">₪</span>
            </Hint>
          )}
          {client.includesAlbum && (
            <Hint text="כולל אלבום">
              <span tabIndex={0} aria-label="כולל אלבום" className="cursor-default"><BookOpen className="w-3.5 h-3.5 text-gray-400" /></span>
            </Hint>
          )}
          {wa && (
            <Hint text="שליחת הודעה בוואטסאפ">
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`וואטסאפ ל${name}`}
                onPointerDown={stop} onClick={stop} onKeyDown={stop}
                className="p-0.5 rounded text-green-600 hover:bg-green-50">
                <MessageSquareText className="w-3.5 h-3.5" />
              </a>
            </Hint>
          )}
          {actions.onMove && (
            <TicketMenu client={client} columnId={columnId} canMoveUp={position.canMoveUp} canMoveDown={position.canMoveDown}
              onMove={actions.onMove} onReorder={actions.onReorder} onRemove={actions.onRemove} />
          )}
        </div>
      </div>

      {(chip || showShoot || shootEditable || showEvent || callbackEditable || afterShoot) && (
        <div className="flex flex-wrap gap-1">
          {chip && <Tag icon={chip.icon} variant={chip.variant}>{chip.label}</Tag>}
          {callbackEditable && (
            <DateChip icon={PhoneCall} value={client.callbackDate} prefix="לחזור" emptyLabel="תאריך לחזרה" warnWhenDue now={now}
              ariaLabel={`תאריך לחזרה ל${name}`} onChange={actions.onCallbackDate} />
          )}
          {shootEditable && (
            <DateChip icon={Camera} value={client.shootDate} prefix="צילום" emptyLabel="תאריך צילום" now={now}
              ariaLabel={`תאריך צילום ל${name}`} onChange={actions.onShootDate} />
          )}
          {showShoot && <Tag icon={Camera} title="תאריך צילום">צילום {shoot}</Tag>}
          {afterShoot && deadlineTag(client, now)}
          {showEvent && <Tag icon={PartyPopper} title="תאריך אירוע">אירוע {event}</Tag>}
        </div>
      )}

      {columnId === 'closing' && actions.onDressGuide && (
        <ActionButton icon={Shirt} onClick={actions.onDressGuide}>הנחיות לבוש</ActionButton>
      )}
      {columnId === 'preshoot' && actions.onPreShootMessage && (
        // The message button and its "sent" mark sit together as one control
        <div className={`flex items-stretch w-fit rounded-lg border text-[11px] ${client.preShootMessageSentAt ? 'border-green-200 bg-green-50/60' : 'border-gray-200'}`}>
          <button type="button" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); actions.onPreShootMessage() }}
            className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-s-lg px-2 py-1">
            <MessageSquareText className="w-3.5 h-3.5" aria-hidden="true" /> הודעה לפני צילום
          </button>
          <label className={`inline-flex items-center gap-1 whitespace-nowrap border-s px-2 py-1 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-e-lg ${client.preShootMessageSentAt ? 'border-green-200' : 'border-gray-200'}`}
            onPointerDown={stop} onClick={stop} onKeyDown={stop}>
            <input type="checkbox" className="w-3.5 h-3.5 accent-gray-900" checked={!!client.preShootMessageSentAt}
              onChange={(e) => actions.onPreShootSent(e.target.checked)} />
            {client.preShootMessageSentAt ? <span className="text-green-700">נשלחה</span> : 'נשלחה'}
          </label>
        </div>
      )}
    </div>
  )
}

export default function BoardTicket({ client, columnId, typeName, now, actions, position }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id, data: { columnId } })
  return (
    <li ref={setNodeRef} {...listeners} {...attributes}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-roledescription="כרטיס לקוח, ניתן לגרירה" aria-label={getClientName(client) || 'ללא שם'}
      onClick={actions.onOpen}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter' && !e.defaultPrevented) actions.onOpen()
      }}
      className="list-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 touch-manipulation">
      <TicketCard client={client} columnId={columnId} typeName={typeName} now={now} actions={actions} position={position} dragging={isDragging} />
    </li>
  )
}

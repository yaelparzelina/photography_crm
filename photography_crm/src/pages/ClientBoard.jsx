import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, useDroppable,
  pointerWithin, closestCenter, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus, Search, X, EyeOff } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { useMessageTemplates } from '../hooks/useMessageTemplates'
import { useDressGuides } from '../hooks/useDressGuides'
import NewClientModal from '../components/NewClientModal'
import BoardTicket, { TicketCard } from '../components/board/BoardTicket'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { BOARD_SLOTS, COLUMN_BY_ID, EXPIRE_DAYS, groupBoard, columnOf, moveChanges, orderAt } from '../utils/board'
import { PRE_SHOOT_KIND } from '../utils/messageTemplate'
import { getClientName } from '../utils/clientUtils'

const FROM_BOARD = { from: '/dashboard', fromLabel: 'לוח הלקוחות' }
const BOARD_FIELDS = ['status', 'boardColumn', 'boardMovedAt', 'boardHidden', 'boardOrder']

// Stacked slot: "סגירת חוזה" gets most of the height, "לא סגר" less
const STACK_SIZES = { closing: 'flex-[7_1_0%]', lost: 'flex-[3_1_0%]' }

// Date-sorted columns keep their order: tickets don't make room while dragging over them
const keepOrder = () => null

// Finds the column under the pointer, then the closest ticket in it (or the column itself when it's empty)
function boardCollision(args) {
  const column = pointerWithin(args).find((c) => COLUMN_BY_ID[c.id])
  if (!column) return closestCorners(args) // keyboard
  const tickets = args.droppableContainers.filter((d) => d.data.current?.columnId === column.id && d.id !== args.active.id)
  if (!tickets.length || COLUMN_BY_ID[column.id].sortedByDate) return [column]
  return closestCenter({ ...args, droppableContainers: tickets })
}

function matchesSearch(client, q) {
  if (!q) return true
  const s = q.toLowerCase()
  return [getClientName(client), client.email, client.phone].some((v) => v?.toLowerCase().includes(s))
}

function Column({ column, clients, children, actions, size }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } })
  return (
    <section ref={setNodeRef} aria-label={column.title}
      className={`flex flex-col min-h-0 rounded-2xl border transition-colors ${size || 'h-full'} ${
        isOver ? 'bg-gray-200/70 border-gray-300' : 'bg-gray-100/70 border-transparent'
      }`}>
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-gray-800 truncate">{column.title}</h2>
        <span className="text-xs text-gray-400 tabular-nums">{clients.length}</span>
        <div className="ms-auto flex items-center gap-1">{actions}</div>
      </header>
      {column.expires && (
        <p className="px-3 -mt-1 pb-2 text-[11px] text-gray-400">נעלמים מהלוח אחרי {EXPIRE_DAYS} ימים</p>
      )}
      <SortableContext items={clients.map((c) => c.id)} strategy={column.sortedByDate ? keepOrder : verticalListSortingStrategy}>
        <ul className="flex-1 min-h-[3rem] overflow-y-auto px-2 pb-2 space-y-2">
          {children}
          {clients.length === 0 && <li className="list-none text-center text-xs text-gray-400 py-4">אין לקוחות</li>}
        </ul>
      </SortableContext>
    </section>
  )
}

export default function ClientBoard() {
  const navigate = useNavigate()
  const { clients, loading, updateClient } = useClients()
  const { types } = usePhotoshootTypes()
  const { templates } = useMessageTemplates()
  const { guides } = useDressGuides()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [toast, setToast] = useState(null) // { text, undo }
  const [clearTarget, setClearTarget] = useState(null) // column id to remove from the board
  const toastTimer = useRef(null)
  // Today's date for tags and expiry, refreshed so a page left open stays correct after midnight
  const [now, setNow] = useState(() => new Date())

  const typeMap = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t.name])), [types])
  const groups = useMemo(
    () => groupBoard(clients.filter((c) => matchesSearch(c, search)), now),
    [clients, search, now]
  )
  const allGroups = useMemo(() => groupBoard(clients, now), [clients, now])
  const activeClient = activeId ? clients.find((c) => c.id === activeId) : null

  const sensors = useSensors(
    // Mouse: drag after moving a few pixels. Touch: press and hold, then drag (a quick swipe still scrolls the board).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    // Space picks up / drops a ticket; Enter opens the client card
    useSensor(KeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] }, coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => () => clearTimeout(toastTimer.current), [])
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  function showToast(text, undo) {
    clearTimeout(toastTimer.current)
    setToast({ text, undo })
    toastTimer.current = setTimeout(() => setToast(null), 6000)
  }

  // Moves a client to another column: at `index` among its tickets, or to the top
  async function move(client, columnId, index = 0) {
    const from = columnOf(client)
    if (from === columnId) return
    const previous = Object.fromEntries(BOARD_FIELDS.map((k) => [k, client[k] ?? null]))
    const order = COLUMN_BY_ID[columnId].sortedByDate ? undefined : orderAt(allGroups[columnId], index)
    await updateClient(client.id, moveChanges(columnId, client, order))
    showToast(`${getClientName(client) || 'הלקוח'} הועבר/ה ל״${COLUMN_BY_ID[columnId].title}״`, () => updateClient(client.id, previous))
  }

  // Places a client at `index` in its own column (manual order)
  function reorder(client, index) {
    const columnId = columnOf(client)
    const others = allGroups[columnId].filter((c) => c.id !== client.id)
    updateClient(client.id, { boardOrder: orderAt(others, index) })
  }

  async function removeFromBoard(client) {
    await updateClient(client.id, { boardHidden: true })
    showToast(`${getClientName(client) || 'הלקוח'} הוסר/ה מהלוח (נשאר/ת במאגר הלקוחות)`, () => updateClient(client.id, { boardHidden: false }))
  }

  async function clearColumn(columnId) {
    const list = allGroups[columnId]
    await Promise.all(list.map((c) => updateClient(c.id, { boardHidden: true })))
    setClearTarget(null)
    showToast(`${list.length} לקוחות הוסרו מהלוח`, () => Promise.all(list.map((c) => updateClient(c.id, { boardHidden: false }))))
  }

  function messageClient(client) {
    return {
      id: client.id,
      firstName: client.firstName || '',
      fullName: getClientName(client),
      gender: client.gender === 'male' ? 'male' : 'female',
      includesAlbum: !!client.includesAlbum,
    }
  }

  function openMessages(client, templateIds, label) {
    navigate('/dashboard/messages', { state: { client: messageClient(client), focus: { templateIds, label } } })
  }

  function openPreShootMessage(client) {
    const t = templates.find((x) => x.kind === PRE_SHOOT_KIND) || templates.find((x) => x.title?.includes('לפני צילום'))
    openMessages(client, t ? [t.id] : [], 'הודעה לפני צילום')
  }

  // Guide messages matching the client's shoot type (e.g. "בת מצווה" → both bat mitzvah guides); all guides if none match
  function openDressGuide(client) {
    const type = (typeMap[client.photoshootTypeId] || '').trim()
    const guideTemplates = templates.filter((t) => t.guideId)
    const matchingGuideIds = type ? guides.filter((g) => g.name.includes(type)).map((g) => g.id) : []
    const matching = guideTemplates.filter((t) => matchingGuideIds.includes(t.guideId))
    openMessages(client, (matching.length ? matching : guideTemplates).map((t) => t.id), 'הנחיות לבוש')
  }

  function actionsFor(client) {
    const list = allGroups[columnOf(client)]
    const index = list.findIndex((c) => c.id === client.id)
    return {
      onOpen: () => navigate(`/dashboard/clients/${client.id}`, { state: FROM_BOARD }),
      onMove: (columnId) => move(client, columnId),
      onReorder: (dir) => reorder(client, index + dir),
      onShootDate: (date) => updateClient(client.id, { shootDate: date || null }),
      onRemove: () => removeFromBoard(client),
      onCallbackDate: (date) => updateClient(client.id, { callbackDate: date || null }),
      onPreShootSent: (sent) => updateClient(client.id, { preShootMessageSentAt: sent ? new Date() : null }),
      onPreShootMessage: () => openPreShootMessage(client),
      onDressGuide: () => openDressGuide(client),
    }
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    const client = clients.find((c) => c.id === active.id)
    if (!over || !client) return
    const from = columnOf(client)
    const onColumn = !!COLUMN_BY_ID[over.id]
    const overColumn = onColumn ? over.id : over.data.current?.columnId
    if (!overColumn) return
    // Dropped on a ticket: take its place. Dropped on the column itself: top of the column.
    if (overColumn !== from) {
      const target = allGroups[overColumn]
      move(client, overColumn, onColumn ? 0 : Math.max(0, target.findIndex((c) => c.id === over.id)))
      return
    }
    if (COLUMN_BY_ID[from].sortedByDate || onColumn || over.id === client.id) return
    const list = allGroups[from]
    const overIndex = list.findIndex((c) => c.id === over.id)
    // Index among the other tickets: dropping on a ticket below lands after it, above lands before it (both = overIndex)
    reorder(client, overIndex)
  }

  function columnActions(columnId) {
    if (columnId === 'new') {
      return <IconButton label="לקוח חדש" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /></IconButton>
    }
    if (COLUMN_BY_ID[columnId].expires && allGroups[columnId].length > 0) {
      return (
        <IconButton label={`הסר את כל ״${COLUMN_BY_ID[columnId].title}״ מהלוח`} onClick={() => setClearTarget(columnId)}>
          <EyeOff className="w-3.5 h-3.5" />
        </IconButton>
      )
    }
    return null
  }

  function renderColumn(columnId) {
    const column = COLUMN_BY_ID[columnId]
    const list = groups[columnId]
    // Up/down in the menu only when the full column is shown (not while searching)
    const full = !search && !column.sortedByDate
    return (
      <Column key={columnId} column={column} clients={list} actions={columnActions(columnId)} size={STACK_SIZES[columnId]}>
        {list.map((c, i) => (
          <BoardTicket key={c.id} client={c} columnId={columnId} typeName={typeMap[c.photoshootTypeId]} now={now}
            actions={actionsFor(c)} position={{ canMoveUp: full && i > 0, canMoveDown: full && i < list.length - 1 }} />
        ))}
      </Column>
    )
  }

  function handleDragStart({ active }) {
    setActiveId(active.id)
    navigator.vibrate?.(15) // a short buzz on phones that support it, when a held ticket lifts
  }

  // Phone: jump to a column from the strip of column names
  function jumpTo(columnId) {
    const slot = BOARD_SLOTS.find((s) => s.includes(columnId))
    document.getElementById(`board-slot-${slot[0]}`)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>

  return (
    <div className="flex flex-col h-[calc(100dvh-6.5rem)] sm:h-[calc(100dvh-7.5rem)] min-h-[28rem]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">לוח לקוחות</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש בלוח..." aria-label="חיפוש בלוח"
              className="w-full sm:w-56 border border-gray-200 rounded-lg ps-9 pe-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300" />
            {search && (
              <IconButton label="נקה חיפוש" onClick={() => setSearch('')} className="absolute left-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4" />
              </IconButton>
            )}
          </div>
          <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> לקוח חדש</Button>
        </div>
      </div>

      {/* Phone: column names with counts; tap to jump */}
      <nav aria-label="מעבר לעמודה" className="sm:hidden -mx-3 px-3 mb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {BOARD_SLOTS.flat().map((id) => (
          <button key={id} type="button" onClick={() => jumpTo(id)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 active:bg-gray-100">
            {COLUMN_BY_ID[id].title}
            <span className="text-gray-400 tabular-nums">{groups[id].length}</span>
          </button>
        ))}
      </nav>

      <DndContext sensors={sensors} collisionDetection={boardCollision} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          screenReaderInstructions: { draggable: 'רווח להרמת הכרטיס, חיצים להזזה, רווח להנחה, Escape לביטול. Enter פותח את כרטיס הלקוח.' },
        }}>
        {/* Columns share the width; below 13rem each, the board scrolls sideways.
            Phone: one wide column at a time (with a peek at the next), snapping into place while not dragging. */}
        <div className={`flex-1 min-h-0 overflow-x-auto overflow-y-hidden -mx-3 px-3 sm:mx-0 sm:px-0 scroll-px-3 ${activeId ? '' : 'snap-x snap-mandatory sm:snap-none'}`}>
          <div className="flex gap-3 h-full">
            {BOARD_SLOTS.map((slot) => (
              <div key={slot.join('-')} id={`board-slot-${slot[0]}`}
                className="flex-none w-[82vw] snap-start sm:flex-1 sm:w-auto sm:min-w-[13rem] h-full flex flex-col gap-3">
                {slot.map((id) => renderColumn(id))}
              </div>
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeClient && (
            <div className="w-[14.5rem]">
              <TicketCard client={activeClient} columnId={columnOf(activeClient)} typeName={typeMap[activeClient.photoshootTypeId]} now={now} overlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900 text-white text-sm rounded-xl shadow-lg px-4 py-3"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <span>{toast.text}</span>
          {toast.undo && (
            <button type="button" className="font-medium text-amber-300 hover:text-amber-200"
              onClick={() => { toast.undo(); setToast(null) }}>
              בטל
            </button>
          )}
        </div>
      )}

      <NewClientModal isOpen={showNew} onClose={() => setShowNew(false)} openAfterCreate={false} />

      <ConfirmDialog
        isOpen={!!clearTarget}
        title="הסרה מהלוח"
        message={clearTarget ? `להסיר את כל ${allGroups[clearTarget].length} הלקוחות מ״${COLUMN_BY_ID[clearTarget].title}״? הם לא יימחקו ויישארו במאגר הלקוחות.` : ''}
        confirmLabel="הסר מהלוח"
        onConfirm={() => clearColumn(clearTarget)}
        onCancel={() => setClearTarget(null)}
      />
    </div>
  )
}

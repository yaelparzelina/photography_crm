import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, X, User } from 'lucide-react'
import { useMessageTemplates } from '../hooks/useMessageTemplates'
import MessageCard from '../components/messages/MessageCard'
import MessageEditor from '../components/messages/MessageEditor'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { itemClass } from '../components/ui/styles'

export default function Messages() {
  const location = useLocation()
  const navigate = useNavigate()
  // Set when opened from a client page: { id, firstName, fullName, gender, includesAlbum }
  const client = location.state?.client || null
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, moveTemplate, seedIfNeeded } = useMessageTemplates()
  const [editing, setEditing] = useState(null) // null | 'new' | template
  const [deleteTarget, setDeleteTarget] = useState(null)
  const seedRequested = useRef(false)

  useEffect(() => {
    if (loading || templates.length || seedRequested.current) return
    seedRequested.current = true
    seedIfNeeded().catch(() => { seedRequested.current = false })
  }, [loading, templates.length, seedIfNeeded])

  function clearClient() {
    navigate('/dashboard/messages', { replace: true, state: null })
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">הודעות ללקוח</h1>
        <Button onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> הודעה חדשה</Button>
      </div>

      {client && (
        <div className={`${itemClass} flex items-center gap-3 px-4 py-3 mb-4`}>
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-700 flex-1">
            הודעות עבור <span className="font-medium">{client.fullName || client.firstName}</span>
            <span className="text-gray-400"> · השם, לשון הפנייה והאלבום מולאו מכרטיס הלקוח וניתנים לשינוי</span>
          </p>
          <Button variant="link" size="sm" onClick={() => navigate(`/dashboard/clients/${client.id}`)}>לכרטיס הלקוח</Button>
          <IconButton label="נקה לקוח" onClick={clearClient}><X className="w-4 h-4" /></IconButton>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">אין הודעות עדיין</div>
      ) : (
        <div className="space-y-4">
          {templates.map((t, i) => (
            <MessageCard key={`${t.id}-${client?.id || 'none'}`} template={t} client={client}
              isFirst={i === 0} isLast={i === templates.length - 1}
              onMoveUp={() => moveTemplate(i, -1)} onMoveDown={() => moveTemplate(i, 1)}
              onEdit={() => setEditing(t)} onDelete={() => setDeleteTarget(t)} />
          ))}
        </div>
      )}

      <MessageEditor isOpen={!!editing} template={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(data) => (editing === 'new' ? createTemplate(data) : updateTemplate(editing.id, data))} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="מחיקת הודעה"
        message={`האם למחוק את ההודעה "${deleteTarget?.title}"?`}
        confirmLabel="מחק"
        destructive
        onConfirm={async () => { await deleteTemplate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

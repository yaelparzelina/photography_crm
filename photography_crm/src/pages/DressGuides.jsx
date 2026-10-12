import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { useDressGuides, deleteGuide } from '../hooks/useDressGuides'
import { guideUrl, guidePreviewHref } from '../utils/dressGuides'
import Button from '../components/ui/Button'
import CopyLink from '../components/ui/CopyLink'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { cardClass } from '../components/ui/styles'

export default function DressGuides() {
  const navigate = useNavigate()
  const { guides, loading } = useDressGuides()
  const [deleteTarget, setDeleteTarget] = useState(null)

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">הנחיות לבוש</h1>
        <Button onClick={() => navigate('/dashboard/dress-guides/new')}><Plus className="w-4 h-4" /> דף הנחיות חדש</Button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        קישורים קבועים לשליחה לכל לקוח. לכל דף יש גם הודעה מוכנה ב״הודעות ללקוח״.
      </p>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : guides.length === 0 ? (
        <div className="text-center py-20 text-gray-400">אין דפי הנחיות עדיין</div>
      ) : (
        <div className="space-y-4">
          {guides.map((g) => (
            <section key={g.id} className={`${cardClass} px-5 py-4`}>
              {/* Name wraps when needed; the buttons always stay at the top, beside it */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-gray-900">{g.name || 'ללא שם'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    {g.title}
                    {g.photoIds.length > 0 && <><span>·</span><ImageIcon className="w-3 h-3" /> {g.photoIds.length} תמונות</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/dashboard/dress-guides/${g.id}`)}>
                    <Pencil className="w-3.5 h-3.5" /> עריכה
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(g)}>
                    <Trash2 className="w-3.5 h-3.5" /> מחיקה
                  </Button>
                </div>
              </div>
              <CopyLink url={guideUrl(g.id)}>
                <a href={guidePreviewHref(g.id)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900">
                  <ExternalLink className="w-3.5 h-3.5" /> תצוגה
                </a>
              </CopyLink>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="מחיקת דף הנחיות"
        message={`למחוק את "${deleteTarget?.name}"? גם התמונות שלו וההודעה המוכנה ב״הודעות ללקוח״ יימחקו, והקישור יפסיק לעבוד.`}
        confirmLabel="מחק"
        destructive
        onConfirm={async () => { await deleteGuide(deleteTarget); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

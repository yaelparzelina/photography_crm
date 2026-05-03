import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import ConfirmDialog from './ui/ConfirmDialog'
import { useLinks } from '../hooks/useLinks'
import { Copy, Check } from 'lucide-react'

const inputClass = 'w-full border border-gray-200 rounded-lg ps-4 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'

export default function AgreementEditorModal({ isOpen, onClose, client, packages, types, onLinkCreated }) {
  const { createAgreementLink } = useLinks()
  const [overrides, setOverrides] = useState({})
  const [generatedLinkId, setGeneratedLinkId] = useState(null)
  const [showRegenWarning, setShowRegenWarning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const pkg = packages.find((p) => p.id === client?.packageId)
  const type = types.find((t) => t.id === client?.photoshootTypeId)

  useEffect(() => {
    if (isOpen && pkg) {
      setOverrides({
        photoCount: pkg.photoCount,
        includesAlbum: pkg.includesAlbum,
        albumSize: pkg.albumSize || '',
        albumPages: pkg.albumPages || '',
      })
      setGeneratedLinkId(null)
    }
  }, [isOpen, pkg])

  function set(field, value) {
    setOverrides((o) => ({ ...o, [field]: value }))
  }

  function handleGenerate() {
    if (client.agreementSigned) {
      setShowRegenWarning(true)
      return
    }
    doGenerate()
  }

  async function doGenerate() {
    setGenerating(true)
    try {
      const snapshot = {
        clientName: client.name,
        photoshootTypeName: type?.name || '',
        packageName: pkg?.name || '',
        shootDate: client.shootDate || null,
        price: client.price || null,
        photoCount: overrides.photoCount,
        includesAlbum: overrides.includesAlbum,
        albumSize: overrides.includesAlbum ? overrides.albumSize : null,
        albumPages: overrides.includesAlbum ? overrides.albumPages : null,
      }
      const linkId = await createAgreementLink(client.id, snapshot)
      setGeneratedLinkId(linkId)
      onLinkCreated(linkId)
    } finally {
      setGenerating(false)
    }
  }

  const agreementUrl = (linkId) =>
    `${window.location.origin}${import.meta.env.BASE_URL}#/sign/${linkId}`

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="עריכת הסכם עבודה">
        {!pkg ? (
          <p className="text-gray-500 text-sm">יש לבחור חבילה בכרטיס הלקוח תחילה.</p>
        ) : generatedLinkId ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700 font-medium">✓ הקישור נוצר בהצלחה</p>
            <input readOnly value={agreementUrl(generatedLinkId)}
              className="w-full text-xs border border-gray-200 rounded-lg ps-3 pe-3 py-2 bg-gray-50 text-gray-600" />
            <button onClick={() => { navigator.clipboard.writeText(agreementUrl(generatedLinkId)); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50">
              {copied ? <><Check className="w-4 h-4 text-green-600" /> הועתק!</> : <><Copy className="w-4 h-4" /> העתק קישור</>}
            </button>
            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-700 pt-1">סגור</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">לקוח:</span> {client.name}</p>
              <p><span className="font-medium">סוג:</span> {type?.name}</p>
              <p><span className="font-medium">חבילה:</span> {pkg.name}</p>
              <p><span className="font-medium">מחיר:</span> ₪{client.price?.toLocaleString() || '—'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר תמונות ערוכות</label>
              <input type="number" className={inputClass} value={overrides.photoCount ?? ''}
                onChange={(e) => set('photoCount', Number(e.target.value))} />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">כולל אלבום מודפס</label>
              <button type="button" aria-label="החלף כולל אלבום" onClick={() => set('includesAlbum', !overrides.includesAlbum)}
                className={`w-10 h-6 rounded-full transition-colors ${overrides.includesAlbum ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${overrides.includesAlbum ? '-translate-x-4 rtl:translate-x-4' : ''}`} />
              </button>
            </div>

            {overrides.includesAlbum && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">גודל אלבום</label>
                  <input className={inputClass} value={overrides.albumSize || ''}
                    onChange={(e) => set('albumSize', e.target.value)} placeholder="30x30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מספר עמודים</label>
                  <input type="number" className={inputClass} value={overrides.albumPages || ''}
                    onChange={(e) => set('albumPages', Number(e.target.value))} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 justify-start">
              <button onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">בטל</button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                {generating ? 'יוצר...' : 'צור קישור'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showRegenWarning}
        title="יצירת הסכם חדש"
        message="יצירת קישור חדש תבטל את החתימה הקיימת של הלקוח. הלקוח יצטרך לחתום מחדש על ההסכם המעודכן. להמשיך?"
        confirmLabel="המשך"
        onConfirm={() => { setShowRegenWarning(false); doGenerate() }}
        onCancel={() => setShowRegenWarning(false)}
      />
    </>
  )
}

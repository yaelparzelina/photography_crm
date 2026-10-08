import { useState, useEffect } from 'react'
import Modal, { ModalActions } from './ui/Modal'
import Button from './ui/Button'
import Field from './ui/Field'
import CopyLink from './ui/CopyLink'
import { inputClass } from './ui/styles'
import ConfirmDialog from './ui/ConfirmDialog'
import AlbumFields from './AlbumFields'
import BusinessDaysField from './BusinessDaysField'
import { normalizeBusinessDays } from '../utils/delivery'
import { normalizeAlbum } from '../utils/album'
import { useLinks } from '../hooks/useLinks'
import AgreementTemplate from '../templates/AgreementTemplate'
import { toInputDate, fromInputDate } from '../utils/dateUtils'
import { getClientName } from '../utils/clientUtils'

export default function AgreementEditorModal({ isOpen, onClose, client, packages, types, onLinkCreated }) {
  const { createAgreementLink } = useLinks()
  const [overrides, setOverrides] = useState({})
  const [generatedLinkId, setGeneratedLinkId] = useState(null)
  const [showRegenWarning, setShowRegenWarning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [shootDateError, setShootDateError] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const pkg = packages.find((p) => p.id === client?.packageId)
  const type = types.find((t) => t.id === client?.photoshootTypeId)

  useEffect(() => {
    if (isOpen && pkg) {
      // Album details come from the client card when set there, otherwise from the package
      const albumSource = client?.includesAlbum != null ? client : pkg
      setOverrides({
        photoCount: pkg.photoCount,
        businessDays: client?.businessDays ?? '',
        includesAlbum: !!albumSource.includesAlbum,
        albumSize: albumSource.albumSize || '',
        albumPages: albumSource.albumPages || '',
        shootDate: client?.shootDate || null,
      })
      setGeneratedLinkId(null)
      setShootDateError(false)
      setShowPreview(false)
    }
  }, [isOpen, pkg])

  function set(field, value) {
    setOverrides((o) => ({ ...o, [field]: value }))
  }

  function handleGenerate() {
    if (!overrides.shootDate) {
      setShootDateError(true)
      return
    }
    setShootDateError(false)
    if (client.agreementSigned) {
      setShowRegenWarning(true)
      return
    }
    doGenerate()
  }

  async function doGenerate() {
    setGenerating(true)
    try {
      const album = normalizeAlbum(overrides)
      const snapshot = {
        clientName: getClientName(client),
        photoshootTypeName: type?.name || '',
        packageName: pkg?.name || '',
        shootDate: overrides.shootDate || null,
        price: client.price || null,
        photoCount: overrides.photoCount,
        businessDays: normalizeBusinessDays(overrides.businessDays),
        ...album,
      }
      // Keep the client card in sync with what was put in the agreement
      const clientUpdates = { shootDate: snapshot.shootDate, businessDays: snapshot.businessDays, ...album }
      const linkId = await createAgreementLink(client.id, snapshot, clientUpdates)
      setGeneratedLinkId(linkId)
      onLinkCreated(linkId, clientUpdates)
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
            <CopyLink url={agreementUrl(generatedLinkId)} />
            <ModalActions>
              <Button variant="secondary" onClick={onClose}>סגור</Button>
            </ModalActions>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">לקוח:</span> {getClientName(client)}</p>
              <p><span className="font-medium">סוג:</span> {type?.name}</p>
              <p><span className="font-medium">חבילה:</span> {pkg.name}</p>
              <p><span className="font-medium">מחיר:</span> ₪{client.price?.toLocaleString() || '—'}</p>
            </div>

            <Field label="תאריך צילום *" error={shootDateError && 'נדרש תאריך צילום ליצירת ההסכם'}>
              <input type="date" max="9999-12-31" className={inputClass(shootDateError)}
                value={overrides.shootDate ? toInputDate(overrides.shootDate) : ''}
                onChange={(e) => { set('shootDate', fromInputDate(e.target.value)); setShootDateError(false) }} />
            </Field>

            <Field label="מספר תמונות ערוכות">
              <input type="number" className={inputClass()} value={overrides.photoCount ?? ''}
                onChange={(e) => set('photoCount', Number(e.target.value))} />
            </Field>

            <BusinessDaysField value={overrides.businessDays} onChange={(v) => set('businessDays', v)} />

            <AlbumFields data={overrides} onChange={set} />

            <ModalActions>
              <Button variant="secondary" onClick={onClose}>בטל</Button>
              <Button variant="secondary" onClick={() => setShowPreview(true)}>תצוגה מקדימה</Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'יוצר...' : 'צור קישור'}
              </Button>
            </ModalActions>
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

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}
        title="תצוגה מקדימה — הסכם עבודה" maxWidth="max-w-2xl">
        <AgreementTemplate link={{
          clientName: getClientName(client),
          photoshootTypeName: type?.name || '',
          packageName: pkg?.name || '',
          shootDate: overrides.shootDate || null,
          price: client?.price || null,
          photoCount: overrides.photoCount,
          businessDays: normalizeBusinessDays(overrides.businessDays),
          ...normalizeAlbum(overrides),
        }} />
      </Modal>
    </>
  )
}

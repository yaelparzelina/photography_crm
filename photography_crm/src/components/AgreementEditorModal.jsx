import { useState, useEffect, useRef } from 'react'
import Modal, { ModalActions } from './ui/Modal'
import Button from './ui/Button'
import Field from './ui/Field'
import CopyLink from './ui/CopyLink'
import { inputClass } from './ui/styles'
import ConfirmDialog from './ui/ConfirmDialog'
import DisabledHint from './ui/DisabledHint'
import AlbumFields from './AlbumFields'
import BusinessDaysField from './BusinessDaysField'
import { normalizeBusinessDays } from '../utils/delivery'
import { normalizeAlbum } from '../utils/album'
import { useLinks } from '../hooks/useLinks'
import { usePackagesByType } from '../hooks/usePackages'
import AgreementTemplate from '../templates/AgreementTemplate'
import { toInputDate, fromInputDate } from '../utils/dateUtils'
import { getClientName } from '../utils/clientUtils'

function albumFromPackage(pkg) {
  return { includesAlbum: !!pkg.includesAlbum, albumSize: pkg.albumSize || '', albumPages: pkg.albumPages || '' }
}

// Shoot type and package can be chosen here too (both required); they sync back to the client card.
export default function AgreementEditorModal({ isOpen, onClose, client, types, onLinkCreated }) {
  const { createAgreementLink } = useLinks()
  const [overrides, setOverrides] = useState({})
  const [generatedLinkId, setGeneratedLinkId] = useState(null)
  const [showRegenWarning, setShowRegenWarning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const appliedPackageRef = useRef(null) // package whose defaults were last applied

  const { packages } = usePackagesByType(overrides.photoshootTypeId)
  const pkg = packages.find((p) => p.id === overrides.packageId)
  const type = types.find((t) => t.id === overrides.photoshootTypeId)

  // Start from the client card each time the editor opens
  useEffect(() => {
    if (!isOpen) return
    appliedPackageRef.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form when the editor opens
    setOverrides({
      photoshootTypeId: client?.photoshootTypeId || '',
      packageId: client?.packageId || '',
      photoCount: null,
      businessDays: client?.businessDays ?? '',
      includesAlbum: client?.includesAlbum ?? null,
      albumSize: client?.albumSize || '',
      albumPages: client?.albumPages || '',
      shootDate: client?.shootDate || null,
    })
    setGeneratedLinkId(null)
    setErrors({})
    setShowPreview(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when (re)opened
  }, [isOpen])

  // When a package is loaded or chosen: fill its photo count, and its album details unless
  // the client card already has its own album details (first package only)
  useEffect(() => {
    if (!isOpen || !pkg || appliedPackageRef.current === pkg.id) return
    const first = appliedPackageRef.current === null
    appliedPackageRef.current = pkg.id
    setOverrides((o) => ({
      ...o,
      photoCount: pkg.photoCount,
      ...(first && o.includesAlbum != null ? {} : albumFromPackage(pkg)),
    }))
  }, [isOpen, pkg])

  function set(field, value) {
    setOverrides((o) => ({ ...o, [field]: value }))
    setErrors((e) => ({ ...e, [field]: false }))
  }

  function handleGenerate() {
    const next = {
      photoshootTypeId: !overrides.photoshootTypeId,
      packageId: !overrides.packageId,
      shootDate: !overrides.shootDate,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
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
      const clientUpdates = {
        photoshootTypeId: overrides.photoshootTypeId,
        packageId: overrides.packageId,
        shootDate: snapshot.shootDate,
        businessDays: snapshot.businessDays,
        ...album,
      }
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
        {generatedLinkId ? (
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
              <p><span className="font-medium">מחיר:</span> ₪{client.price?.toLocaleString() || '—'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="סוג צילום *" error={errors.photoshootTypeId && 'יש לבחור סוג צילום'}>
                <select className={inputClass(errors.photoshootTypeId)} value={overrides.photoshootTypeId || ''}
                  onChange={(e) => { set('photoshootTypeId', e.target.value); set('packageId', '') }}>
                  <option value="">בחר סוג</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="חבילה *" error={errors.packageId && 'יש לבחור חבילה'}>
                <DisabledHint reason={!overrides.photoshootTypeId ? 'יש לבחור סוג צילום תחילה' : null} className="block">
                  <select className={`${inputClass(errors.packageId)} disabled:pointer-events-none`} value={overrides.packageId || ''}
                    disabled={!overrides.photoshootTypeId} onChange={(e) => set('packageId', e.target.value)}>
                    <option value="">בחר חבילה</option>
                    {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </DisabledHint>
              </Field>
            </div>

            <Field label="תאריך צילום *" error={errors.shootDate && 'נדרש תאריך צילום ליצירת ההסכם'}>
              <input type="date" max="9999-12-31" className={inputClass(errors.shootDate)}
                value={overrides.shootDate ? toInputDate(overrides.shootDate) : ''}
                onChange={(e) => set('shootDate', fromInputDate(e.target.value))} />
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

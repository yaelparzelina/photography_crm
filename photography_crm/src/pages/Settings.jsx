import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePackagesByType } from '../hooks/usePackages'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Field from '../components/ui/Field'
import { ModalActions } from '../components/ui/Modal'
import { inputClass, itemClass } from '../components/ui/styles'
import { Plus, Edit2, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react'

const DEFAULT_TYPES = ['בת מצווה', 'בר מצווה', 'תדמית', 'גיל שנה', 'משפחה', 'עלייה לתורה', 'ניו בורן', 'בוק שחקן']
const DEFAULT_PACKAGES = [
  { name: 'קלאסית', order: 0, photoCount: 30, locationCount: 1, price: 1500, includesAlbum: false },
  { name: 'מורחבת', order: 1, photoCount: 50, locationCount: 2, price: 2500, includesAlbum: false },
  { name: 'פרימיום', order: 2, photoCount: 80, locationCount: 3, price: 3500, includesAlbum: true, albumSize: '30x30', albumPages: 20 },
]

async function seedDefaultData() {
  for (let i = 0; i < DEFAULT_TYPES.length; i++) {
    const typeRef = await addDoc(collection(db, 'photoshootTypes'), {
      name: DEFAULT_TYPES[i], order: i, createdAt: serverTimestamp(),
    })
    for (const pkg of DEFAULT_PACKAGES) {
      await addDoc(collection(db, 'packages'), {
        ...pkg, photoshootTypeId: typeRef.id, createdAt: serverTimestamp(),
      })
    }
  }
}

function TypesTab() {
  const { types, loading, createType, updateType, deleteType } = usePhotoshootTypes()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [seeding, setSeeding] = useState(false)

  async function handleSeed() {
    setSeeding(true)
    try { await seedDefaultData() } finally { setSeeding(false) }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    await createType(newName.trim())
    setNewName('')
  }

  async function handleUpdate() {
    await updateType(editId, { name: editName })
    setEditId(null)
  }

  async function handleDelete() {
    await deleteType(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function move(index, dir) {
    const t1 = types[index], t2 = types[index + dir]
    if (!t2) return
    await updateType(t1.id, { order: t2.order })
    await updateType(t2.id, { order: t1.order })
  }

  return (
    <div>
      {!loading && types.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-amber-800">לא קיימים סוגי צילום. האם לאתחל נתוני ברירת מחדל?</p>
          <Button size="sm" onClick={handleSeed} disabled={seeding} className="me-2">
            {seeding ? 'מאתחל...' : 'אתחל נתונים'}
          </Button>
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input className={inputClass()} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם סוג צילום חדש" />
        <Button type="submit"><Plus className="w-4 h-4" /> הוסף</Button>
      </form>

      <div className="space-y-2">
        {types.map((t, i) => (
          <div key={t.id} className={`${itemClass} px-4 py-3 flex items-center gap-3`}>
            <div className="flex flex-col">
              <IconButton label="הזז למעלה" onClick={() => move(i, -1)} disabled={i === 0} className="p-0">
                <ChevronUp className="w-4 h-4" />
              </IconButton>
              <IconButton label="הזז למטה" onClick={() => move(i, 1)} disabled={i === types.length - 1} className="p-0">
                <ChevronDown className="w-4 h-4" />
              </IconButton>
            </div>
            {editId === t.id ? (
              <>
                <input className={`${inputClass()} flex-1`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <IconButton label="שמור" variant="success" onClick={handleUpdate}><Check className="w-4 h-4" /></IconButton>
                <IconButton label="בטל" onClick={() => setEditId(null)}><X className="w-4 h-4" /></IconButton>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{t.name}</span>
                <IconButton label="ערוך" onClick={() => { setEditId(t.id); setEditName(t.name) }}>
                  <Edit2 className="w-4 h-4" />
                </IconButton>
                <IconButton label="מחק" variant="danger" onClick={() => setDeleteTarget(t)}>
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="מחיקת סוג צילום"
        message={`מחיקת "${deleteTarget?.name}" תמחק גם את כל החבילות המשויכות אליו. האם אתה בטוח?`}
        confirmLabel="מחק"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// PkgFields must be defined at module scope (NOT inside PackagesTab) to avoid React unmount/remount on every render
function PkgFields({ data, setter }) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-3">
      <Field label="שם חבילה">
        <input className={inputClass()} value={data.name || ''} onChange={(e) => setter('name', e.target.value)} /></Field>
      <Field label="מחיר (₪)">
        <input type="number" className={inputClass()} value={data.price || ''} onChange={(e) => setter('price', e.target.value)} /></Field>
      <Field label="מספר תמונות">
        <input type="number" className={inputClass()} value={data.photoCount || ''} onChange={(e) => setter('photoCount', e.target.value)} /></Field>
      <Field label="מספר לוקיישנים">
        <input type="number" className={inputClass()} value={data.locationCount || ''} onChange={(e) => setter('locationCount', e.target.value)} /></Field>
      <div className="col-span-2">
        <Toggle text="כולל אלבום" label="החלף כולל אלבום" checked={data.includesAlbum}
          onChange={(v) => setter('includesAlbum', v)} />
      </div>
      {data.includesAlbum && (
        <>
          <Field label="גודל אלבום">
            <input className={inputClass()} value={data.albumSize || ''} onChange={(e) => setter('albumSize', e.target.value)} placeholder="30x30" /></Field>
          <Field label="מספר עמודים">
            <input type="number" className={inputClass()} value={data.albumPages || ''} onChange={(e) => setter('albumPages', e.target.value)} /></Field>
        </>
      )}
    </div>
  )
}

function PackagesTab() {
  const { types } = usePhotoshootTypes()
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const { packages, createPackage, updatePackage, deletePackage } = usePackagesByType(selectedTypeId)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [showNew, setShowNew] = useState(false)
  const [newPkg, setNewPkg] = useState({ name: '', price: '', photoCount: '', locationCount: 1, includesAlbum: false, albumSize: '', albumPages: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  function setE(field, value) { setEditData((d) => ({ ...d, [field]: value })) }
  function setN(field, value) { setNewPkg((d) => ({ ...d, [field]: value })) }

  async function handleCreate() {
    if (!newPkg.name.trim()) return
    await createPackage({
      photoshootTypeId: selectedTypeId,
      name: newPkg.name,
      price: Number(newPkg.price),
      photoCount: Number(newPkg.photoCount),
      locationCount: Number(newPkg.locationCount),
      includesAlbum: newPkg.includesAlbum,
      albumSize: newPkg.includesAlbum ? newPkg.albumSize : null,
      albumPages: newPkg.includesAlbum ? Number(newPkg.albumPages) : null,
    })
    setShowNew(false)
    setNewPkg({ name: '', price: '', photoCount: '', locationCount: 1, includesAlbum: false, albumSize: '', albumPages: '' })
  }

  async function handleUpdate() {
    await updatePackage(editId, {
      name: editData.name, price: Number(editData.price),
      photoCount: Number(editData.photoCount), locationCount: Number(editData.locationCount),
      includesAlbum: editData.includesAlbum,
      albumSize: editData.includesAlbum ? editData.albumSize : null,
      albumPages: editData.includesAlbum ? Number(editData.albumPages) : null,
    })
    setEditId(null)
  }

  return (
    <div>
      <Field label="בחר סוג צילום" className="mb-6">
        <select className={inputClass()} value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
          <option value="">בחר...</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>

      {selectedTypeId && (
        <>
          <div className="space-y-3 mb-4">
            {packages.map((p) => (
              <div key={p.id} className={`${itemClass} p-4`}>
                {editId === p.id ? (
                  <>
                    <PkgFields data={editData} setter={setE} />
                    <ModalActions>
                      <Button variant="secondary" onClick={() => setEditId(null)}>בטל</Button>
                      <Button onClick={handleUpdate}>שמור</Button>
                    </ModalActions>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ₪{p.price?.toLocaleString()} · {p.photoCount} תמונות · {p.locationCount} לוקיישן
                        {p.includesAlbum && ` · אלבום ${p.albumSize}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <IconButton label="ערוך" onClick={() => { setEditId(p.id); setEditData({ ...p }) }}><Edit2 className="w-4 h-4" /></IconButton>
                      <IconButton label="מחק" variant="danger" onClick={() => setDeleteTarget(p)}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNew ? (
            <div className={`${itemClass} p-4`}>
              <p className="text-sm font-medium text-gray-800 mb-1">חבילה חדשה</p>
              <PkgFields data={newPkg} setter={setN} />
              <ModalActions>
                <Button variant="secondary" onClick={() => setShowNew(false)}>בטל</Button>
                <Button onClick={handleCreate}>הוסף חבילה</Button>
              </ModalActions>
            </div>
          ) : (
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 text-sm border border-dashed border-gray-300 text-gray-500 rounded-xl px-4 py-3 hover:border-gray-400 hover:text-gray-700 w-full justify-center">
              <Plus className="w-4 h-4" /> הוסף חבילה
            </button>
          )}

          <ConfirmDialog
            isOpen={!!deleteTarget}
            title="מחיקת חבילה"
            message={`האם למחוק את החבילה "${deleteTarget?.name}"?`}
            confirmLabel="מחק"
            destructive
            onConfirm={async () => { await deletePackage(deleteTarget.id); setDeleteTarget(null) }}
            onCancel={() => setDeleteTarget(null)}
          />
        </>
      )}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('types')
  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">הגדרות</h1>
      <div className="flex gap-2 mb-6">
        <button className={tabClass('types')} onClick={() => setTab('types')}>סוגי צילום</button>
        <button className={tabClass('packages')} onClick={() => setTab('packages')}>חבילות</button>
      </div>
      {tab === 'types' ? <TypesTab /> : <PackagesTab />}
    </div>
  )
}

import { useState } from 'react'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePackagesByType } from '../hooks/usePackages'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Plus, Edit2, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react'

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-full bg-white'

function TypesTab() {
  const { types, createType, updateType, deleteType } = usePhotoshootTypes()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

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
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם סוג צילום חדש" />
        <button type="submit" className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 whitespace-nowrap">
          <Plus className="w-4 h-4" /> הוסף
        </button>
      </form>

      <div className="space-y-2">
        {types.map((t, i) => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-0">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === types.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-0">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {editId === t.id ? (
              <>
                <input className={`${inputClass} flex-1`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <button onClick={handleUpdate} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{t.name}</span>
                <button onClick={() => { setEditId(t.id); setEditName(t.name) }} className="text-gray-400 hover:text-gray-700">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(t)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
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
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div><label className="text-xs text-gray-500 mb-1 block">שם חבילה</label>
        <input className={inputClass} value={data.name || ''} onChange={(e) => setter('name', e.target.value)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">מחיר (₪)</label>
        <input type="number" className={inputClass} value={data.price || ''} onChange={(e) => setter('price', e.target.value)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">מספר תמונות</label>
        <input type="number" className={inputClass} value={data.photoCount || ''} onChange={(e) => setter('photoCount', e.target.value)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">מספר לוקיישנים</label>
        <input type="number" className={inputClass} value={data.locationCount || ''} onChange={(e) => setter('locationCount', e.target.value)} /></div>
      <div className="col-span-2 flex items-center gap-2">
        <label className="text-xs text-gray-500">כולל אלבום</label>
        <button
          type="button"
          aria-label="החלף כולל אלבום"
          onClick={() => setter('includesAlbum', !data.includesAlbum)}
          className={`w-8 h-5 rounded-full transition-colors ${data.includesAlbum ? 'bg-green-500' : 'bg-gray-200'}`}
        >
          <span className={`block w-3 h-3 bg-white rounded-full shadow mx-1 transition-transform ${data.includesAlbum ? '-translate-x-3 rtl:translate-x-3' : ''}`} />
        </button>
      </div>
      {data.includesAlbum && (
        <>
          <div><label className="text-xs text-gray-500 mb-1 block">גודל אלבום</label>
            <input className={inputClass} value={data.albumSize || ''} onChange={(e) => setter('albumSize', e.target.value)} placeholder="30x30" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">עמודים</label>
            <input type="number" className={inputClass} value={data.albumPages || ''} onChange={(e) => setter('albumPages', e.target.value)} /></div>
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">בחר סוג צילום</label>
        <select className={inputClass} value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
          <option value="">בחר...</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {selectedTypeId && (
        <>
          <div className="space-y-3 mb-4">
            {packages.map((p) => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4">
                {editId === p.id ? (
                  <>
                    <PkgFields data={editData} setter={setE} />
                    <div className="flex gap-2 mt-3 justify-start">
                      <button onClick={() => setEditId(null)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">בטל</button>
                      <button onClick={handleUpdate} className="text-sm bg-gray-900 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700">שמור</button>
                    </div>
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
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(p.id); setEditData({ ...p }) }} className="text-gray-400 hover:text-gray-700"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(p)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNew ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-1">חבילה חדשה</p>
              <PkgFields data={newPkg} setter={setN} />
              <div className="flex gap-2 mt-3 justify-start">
                <button onClick={() => setShowNew(false)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">בטל</button>
                <button onClick={handleCreate} className="text-sm bg-gray-900 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700">הוסף חבילה</button>
              </div>
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

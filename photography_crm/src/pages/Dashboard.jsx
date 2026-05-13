import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import NewClientModal from '../components/NewClientModal'
import { formatDate } from '../utils/dateUtils'
import { STATUS_OPTIONS } from '../utils/statusConfig'

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />
}

const thClass = 'px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none'

export default function Dashboard() {
  const navigate = useNavigate()
  const { clients, loading, updateClient } = useClients()
  const { types } = usePhotoshootTypes()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [showNew, setShowNew] = useState(false)

  const typeMap = useMemo(
    () => Object.fromEntries(types.map((t) => [t.id, t.name])),
    [types]
  )

  const rows = useMemo(() => {
    let list = [...clients]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter)
    list.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av?.toDate) av = av.toDate()
      if (bv?.toDate) bv = bv.toDate()
      return sortDir === 'asc'
        ? av < bv ? -1 : av > bv ? 1 : 0
        : av > bv ? -1 : av < bv ? 1 : 0
    })
    return list
  }, [clients, search, statusFilter, sortField, sortDir])

  function handleSort(field) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">לקוחות</h1>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          <Plus className="w-4 h-4" /> לקוח חדש
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, מייל..."
            className="w-full border border-gray-200 rounded-lg ps-10 pe-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300">
          <option value="all">כל הסטטוסים</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={thClass} onClick={() => handleSort('name')}>שם <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></th>
              <th className={thClass}>סטטוס</th>
              <th className={thClass}>סוג צילום</th>
              <th className={thClass} onClick={() => handleSort('shootDate')}>תאריך צילום <SortIcon field="shootDate" sortField={sortField} sortDir={sortDir} /></th>
              <th className={thClass}>שילם מקדמה</th>
              <th className={thClass}>חוזה נחתם</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">לא נמצאו לקוחות</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/dashboard/clients/${c.id}`)}
                className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={c.status || 'new_lead'}
                    onChange={(e) => updateClient(c.id, { status: e.target.value })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-600">{typeMap[c.photoshootTypeId] || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.shootDate ? formatDate(c.shootDate) : '—'}</td>
                <td className="px-4 py-3 text-center">{c.paidAdvance ? '✓' : '—'}</td>
                <td className="px-4 py-3 text-center">{c.agreementSigned ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewClientModal isOpen={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}

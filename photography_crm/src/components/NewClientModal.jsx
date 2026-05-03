import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './ui/Modal'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'

export default function NewClientModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { createClient } = useClients()
  const { types } = usePhotoshootTypes()
  const [form, setForm] = useState({ name: '', phone: '', photoshootTypeId: '' })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const id = await createClient(form)
      onClose()
      navigate(`/dashboard/clients/${id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="לקוח חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-lg ps-4 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
            className="w-full border border-gray-200 rounded-lg ps-4 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סוג צילום</label>
          <select value={form.photoshootTypeId} onChange={(e) => set('photoshootTypeId', e.target.value)}
            className="w-full border border-gray-200 rounded-lg ps-4 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
            <option value="">בחר סוג צילום</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex justify-start gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">בטל</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'יוצר...' : 'צור לקוח'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal, { ModalActions } from './ui/Modal'
import Button from './ui/Button'
import Field from './ui/Field'
import Segmented from './ui/Segmented'
import DateInput from './ui/DatePicker'
import { inputClass } from './ui/styles'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'

const EMPTY_FORM = { firstName: '', lastName: '', phone: '', photoshootTypeId: '', gender: 'female', eventDate: null, notes: '' }

// `openAfterCreate`: go to the new client's card (the board keeps the owner on the board instead)
export default function NewClientModal({ isOpen, onClose, openAfterCreate = true }) {
  const navigate = useNavigate()
  const { createClient } = useClients()
  const { types } = usePhotoshootTypes()
  const [form, setForm] = useState(EMPTY_FORM)
  const [phoneError, setPhoneError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === 'phone') setPhoneError('')
  }

  function validatePhone(phone) {
    if (!phone) return true
    return /^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ''))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validatePhone(form.phone)) {
      setPhoneError('מספר טלפון לא תקין')
      return
    }
    setSaving(true)
    try {
      const id = await createClient(form)
      onClose()
      setForm(EMPTY_FORM)
      if (openAfterCreate) navigate(`/dashboard/clients/${id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="לקוח חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Field label="שם *" className="flex-1">
            <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass()} />
          </Field>
          <Field label="שם משפחה *" className="flex-1">
            <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass()} />
          </Field>
        </div>
        <div className="flex gap-3">
          <Field label="טלפון" error={phoneError} className="flex-1">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
              placeholder="05X-XXXXXXX" className={inputClass(!!phoneError)} />
          </Field>
          <Field label="פנייה בלשון">
            <div className="flex items-center min-h-[42px]">
              <Segmented label="פנייה בלשון" value={form.gender}
                options={[{ value: 'female', label: 'נקבה' }, { value: 'male', label: 'זכר' }]}
                onChange={(v) => set('gender', v)} />
            </div>
          </Field>
        </div>
        <Field label="סוג צילום">
          <select value={form.photoshootTypeId} onChange={(e) => set('photoshootTypeId', e.target.value)} className={inputClass()}>
            <option value="">בחר סוג צילום</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="תאריך אירוע">
          <DateInput aria-label="תאריך אירוע" value={form.eventDate} onChange={(d) => set('eventDate', d)} />
        </Field>
        <Field label="הערות">
          <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass()} />
        </Field>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>בטל</Button>
          <Button type="submit" disabled={saving}>{saving ? 'יוצר...' : 'צור לקוח'}</Button>
        </ModalActions>
      </form>
    </Modal>
  )
}

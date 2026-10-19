import Field from './ui/Field'
import { inputClass } from './ui/styles'
import { LEAD_SOURCES } from '../utils/leadSource'

// "איך הגיע?": a closed list, plus free text when "אחר" is chosen. Calls onChange with the fields to update.
export default function LeadSourceField({ value, other, onChange, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 ${className}`}>
      <Field label="איך הגיע?">
        <select className={inputClass()} aria-label="איך הגיע?" value={value || ''}
          onChange={(e) => onChange({ leadSource: e.target.value, ...(e.target.value === 'other' ? {} : { leadSourceOther: '' }) })}>
          <option value="">בחר מקור</option>
          {LEAD_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      {value === 'other' && (
        <Field label="פירוט">
          <input className={inputClass()} aria-label="פירוט מקור" value={other || ''} placeholder="למשל: פגשה אותי באירוע"
            onChange={(e) => onChange({ leadSourceOther: e.target.value })} />
        </Field>
      )}
    </div>
  )
}

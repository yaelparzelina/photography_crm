import Field from './ui/Field'
import { inputClass } from './ui/styles'
import { DEFAULT_BUSINESS_DAYS } from '../utils/delivery'

// Business days from the shoot until the edited photos are delivered. Empty = default (10).
export default function BusinessDaysField({ value, onChange, className = '' }) {
  return (
    <Field label="ימי עסקים למסירת התמונות" className={className}>
      <input type="number" min="1" step="1" inputMode="numeric" className={inputClass()}
        value={value ?? ''} placeholder={String(DEFAULT_BUSINESS_DAYS)}
        onChange={(e) => onChange(e.target.value === '' ? '' : String(Math.max(0, Math.round(Number(e.target.value)))))} />
    </Field>
  )
}

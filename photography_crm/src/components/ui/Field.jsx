import { labelClass } from './styles'

// Label + control + field-level error message.
export default function Field({ label, error, className = '', children }) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && <label className={labelClass}>{label}</label>}
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}

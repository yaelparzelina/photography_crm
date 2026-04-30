import { STATUS_CONFIG } from '../../utils/statusConfig'

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

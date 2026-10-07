// Small icon-only action (edit, delete, confirm, cancel, reorder).
const colors = {
  default: 'text-gray-400 hover:text-gray-700',
  danger: 'text-gray-400 hover:text-red-600',
  success: 'text-green-600 hover:text-green-800',
}

export default function IconButton({ label, variant = 'default', className = '', children, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={`inline-flex items-center justify-center p-1 rounded-md transition-colors hover:bg-gray-100 disabled:opacity-0 disabled:pointer-events-none ${colors[variant]} ${className}`}
      {...rest}>
      {children}
    </button>
  )
}

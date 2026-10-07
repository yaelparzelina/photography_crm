import DisabledHint from './DisabledHint'

// Single source of truth for every button in the app.
// `disabledReason` is shown as a hover hint while the button is disabled.
const base = 'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:opacity-40 disabled:pointer-events-none'
const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' }
const linkSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-sm' }
const variants = {
  primary: 'bg-gray-900 text-white hover:bg-gray-700',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
  danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700',
  link: 'text-gray-600 hover:text-gray-900',
}

export default function Button({
  children, variant = 'primary', size = 'md', fullWidth = false, disabledReason,
  type = 'button', className = '', ...rest
}) {
  const sizing = variant === 'link' ? linkSizes[size] : `rounded-lg ${sizes[size]}`
  const button = (
    <button type={type}
      className={`${base} ${sizing} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}>
      {children}
    </button>
  )
  return (
    <DisabledHint reason={rest.disabled ? disabledReason : null} className={fullWidth ? 'flex w-full' : 'inline-flex'}>
      {button}
    </DisabledHint>
  )
}

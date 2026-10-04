// Wraps a (possibly disabled) control and shows `reason` as a tooltip on hover.
// The wrapped control should have `disabled:pointer-events-none` so hover reaches the wrapper.
export default function DisabledHint({ reason, children, className = 'inline-flex' }) {
  if (!reason) return children
  return (
    <span className={`relative group ${className}`}>
      {children}
      <span role="tooltip"
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute bottom-full start-0 mb-2 z-20 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-lg pointer-events-none">
        {reason}
      </span>
    </span>
  )
}

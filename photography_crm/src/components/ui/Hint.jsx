// Shows `text` in a small dark bubble on hover or keyboard focus (same look as DisabledHint).
// `side` is where the bubble appears: 'bottom' keeps it inside scrolling lists whose top edge would clip it.
export default function Hint({ text, children, side = 'bottom', className = 'inline-flex' }) {
  return (
    <span className={`relative group/hint ${className}`}>
      {children}
      <span role="tooltip"
        className={`invisible opacity-0 group-hover/hint:visible group-hover/hint:opacity-100 group-focus-within/hint:visible group-focus-within/hint:opacity-100 transition-opacity absolute end-0 z-20 w-max max-w-[12rem] bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1 shadow-lg pointer-events-none ${
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`}>
        {text}
      </span>
    </span>
  )
}

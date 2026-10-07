// On/off switch. RTL: knob sits on the right when off, slides left when on.
// `text` renders a visible label next to the switch; `label` overrides the accessible name.
export default function Toggle({ checked, onChange, label, text }) {
  const toggle = (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label || text}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'right-5' : 'right-1'}`} />
    </button>
  )
  if (!text) return toggle
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">{text}</span>
      {toggle}
    </div>
  )
}

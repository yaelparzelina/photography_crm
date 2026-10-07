// On/off switch. RTL: knob sits on the right when off, slides left when on.
export default function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'right-5' : 'right-1'}`} />
    </button>
  )
}

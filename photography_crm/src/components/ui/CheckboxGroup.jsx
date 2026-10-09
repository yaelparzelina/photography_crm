import Button from './Button'

// Multi-select checkboxes. `value` is the list of selected values; an empty list means "no filter".
// `presets` are quick-select buttons, e.g. [{ label: 'הכל בתהליך', values: [...] }].
export default function CheckboxGroup({ label, options, value, onChange, presets = [] }) {
  function toggle(v) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div role="group" aria-label={label}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {presets.map((p) => (
          <Button key={p.label} variant="link" size="sm" className="underline underline-offset-2" onClick={() => onChange(p.values)}>
            {p.label}
          </Button>
        ))}
        <Button variant="link" size="sm" className="underline underline-offset-2" onClick={() => onChange(options.map((o) => o.value))}>
          בחר הכל
        </Button>
        <Button variant="link" size="sm" className="underline underline-offset-2" onClick={() => onChange([])} disabled={!value.length}>
          נקה
        </Button>
        {!value.length && <span className="text-xs text-gray-400">ללא סינון — מוצגים כולם</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-gray-900" checked={value.includes(o.value)}
              onChange={() => toggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}

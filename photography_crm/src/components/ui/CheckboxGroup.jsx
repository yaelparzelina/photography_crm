// Multi-select checkboxes with "select all". `value` is the list of selected values.
export default function CheckboxGroup({ label, options, value, onChange }) {
  const allSelected = options.length > 0 && options.every((o) => value.includes(o.value))

  function toggle(v) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 mb-2">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-sm text-gray-900 font-medium cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-gray-900" checked={allSelected}
            onChange={() => onChange(allSelected ? [] : options.map((o) => o.value))} />
          בחר הכל
        </label>
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-gray-900" checked={value.includes(o.value)}
              onChange={() => toggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

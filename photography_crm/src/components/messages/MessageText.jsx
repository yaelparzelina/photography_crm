// Renders a tokenized message the way it will look in WhatsApp, with inline inputs for blanks.

function BlankInput({ value, onChange, highlight, label }) {
  const filled = !!value?.trim()
  return (
    <input value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={label} dir="auto"
      size={filled ? Math.max(value.length, 1) : 4}
      style={{ fieldSizing: 'content', font: 'inherit', minWidth: filled ? 0 : '4ch' }}
      className={`inline-block align-baseline rounded outline-none transition-colors ${
        filled
          ? 'p-0 m-0 bg-transparent focus:bg-black/5'
          : highlight
            ? 'px-0.5 mx-px bg-red-50 border-b-2 border-dashed border-red-400'
            : 'px-0.5 mx-px bg-amber-50 border-b-2 border-dashed border-gray-400 focus:bg-amber-100'
      }`} />
  )
}

export default function MessageText({ tokens, values, onValueChange, name, onNameChange, highlightMissing }) {
  const render = (list, keyPrefix = '') => list.map((t, i) => {
    const key = `${keyPrefix}${i}`
    if (t.type === 'text') return <span key={key}>{t.value}</span>
    if (t.type === 'link') {
      return (
        <a key={key} href={t.value} target="_blank" rel="noreferrer" dir="ltr"
          className="text-sky-700 underline underline-offset-2 break-all">{t.value}</a>
      )
    }
    if (t.type === 'name') {
      return <BlankInput key={key} value={name} onChange={onNameChange} highlight={highlightMissing} label="שם הלקוח" />
    }
    if (t.type === 'blank') {
      return (
        <BlankInput key={key} value={values[t.index]} onChange={(v) => onValueChange(t.index, v)}
          highlight={highlightMissing} label={`שדה למילוי ${t.index + 1}`} />
      )
    }
    return <strong key={key} className="font-bold">{render(t.children, `${key}-`)}</strong>
  })

  return (
    <div dir="rtl" className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-900">
      {render(tokens)}
    </div>
  )
}

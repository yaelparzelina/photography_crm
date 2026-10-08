import Toggle from './ui/Toggle'
import Field from './ui/Field'
import { inputClass } from './ui/styles'
import { DEFAULT_ALBUM_SIZE, DEFAULT_ALBUM_PAGES } from '../utils/album'

// "Includes album" switch + album size/pages. Empty fields use the defaults shown as placeholders.
export default function AlbumFields({ data, onChange, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Toggle text="כולל אלבום" label="החלף כולל אלבום" checked={data.includesAlbum}
        onChange={(v) => onChange('includesAlbum', v)} />
      {data.includesAlbum && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="גודל אלבום">
            <input className={inputClass()} value={data.albumSize || ''} placeholder={DEFAULT_ALBUM_SIZE}
              onChange={(e) => onChange('albumSize', e.target.value)} />
          </Field>
          <Field label="מספר עמודים">
            <input type="number" min="1" className={inputClass()} value={data.albumPages || ''} placeholder={String(DEFAULT_ALBUM_PAGES)}
              onChange={(e) => onChange('albumPages', e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  )
}

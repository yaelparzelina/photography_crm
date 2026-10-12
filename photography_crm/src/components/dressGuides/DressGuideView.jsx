import { useState, useEffect } from 'react'
import { Check, X, MessageCircle, Heart } from 'lucide-react'
import { SECTION_TITLES, WHATSAPP_URL } from '../../utils/dressGuides'

// Warm palette taken from the logo and the original PDF guides
const t = {
  page: 'bg-[#FBF7F2] text-[#5C4B3E]',
  heading: 'font-serif text-[#6B4A35]',
  accent: 'text-[#B8956A]',
  card: 'bg-white/80 border border-[#EFE4D6] rounded-3xl shadow-[0_2px_20px_-8px_rgba(107,74,53,0.18)]',
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="h-px flex-1 bg-[#E8D9C5]" />
      <h2 className={`${t.heading} text-xl sm:text-2xl font-medium`}>{children}</h2>
      <span className="h-px flex-1 bg-[#E8D9C5]" />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className={`${t.card} px-5 py-7 sm:px-8`}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </section>
  )
}

function Palette({ text, palette }) {
  return (
    <Section title={SECTION_TITLES.palette}>
      {text && <p className="text-center leading-relaxed mb-6 whitespace-pre-line">{text}</p>}
      {palette.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-4">
          {palette.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex flex-col items-center gap-2 w-16">
              <span className="w-12 h-12 rounded-full border border-black/10 shadow-inner"
                style={{ backgroundColor: c.color || '#E8D9C5' }} aria-hidden="true" />
              <span className="text-xs text-center leading-tight">{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Tips({ tips }) {
  return (
    <Section title={SECTION_TITLES.tips}>
      <ul className="space-y-4">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-3 leading-relaxed">
            {tip.type === 'dont' ? (
              <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-[#F6E3DC] text-[#B4593B] flex items-center justify-center">
                <X className="w-3.5 h-3.5" strokeWidth={3} aria-label="להימנע" />
              </span>
            ) : (
              <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-[#E5ECDF] text-[#5E7D59] flex items-center justify-center">
                <Check className="w-3.5 h-3.5" strokeWidth={3} aria-label="מומלץ" />
              </span>
            )}
            <span className="whitespace-pre-line">{tip.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Outfits({ outfits }) {
  return (
    <Section title={SECTION_TITLES.outfits}>
      <ol className="grid gap-3 sm:grid-cols-2">
        {outfits.map((o, i) => (
          <li key={i} className="flex items-start gap-3 bg-[#FBF7F2] border border-[#F0E6D8] rounded-2xl px-4 py-3.5 leading-relaxed">
            <span className={`${t.heading} shrink-0 w-7 h-7 rounded-full bg-white border border-[#E8D9C5] flex items-center justify-center text-sm`}>
              {i + 1}
            </span>
            <span className="text-[15px]">{o}</span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose}
      role="dialog" aria-label="תמונה מוגדלת">
      <img src={src} alt="" className="max-h-full max-w-full rounded-xl" />
    </div>
  )
}

function Photos({ photos }) {
  const [open, setOpen] = useState(null)
  return (
    <Section title={SECTION_TITLES.photos}>
      <div className="columns-2 sm:columns-3 gap-3">
        {photos.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpen(p.src)}
            className="block w-full mb-3 break-inside-avoid overflow-hidden rounded-2xl cursor-zoom-in">
            <img src={p.src} alt="תמונת השראה" loading="lazy" className="w-full h-auto hover:scale-[1.03] transition-transform duration-500" />
          </button>
        ))}
      </div>
      {open && <Lightbox src={open} onClose={() => setOpen(null)} />}
    </Section>
  )
}

export default function DressGuideView({ guide, photos = [] }) {
  const tips = guide.tips.filter((x) => x.text?.trim())
  const outfits = guide.outfits.filter((x) => x?.trim())
  const palette = guide.palette.filter((x) => x.name?.trim())
  return (
    <div className={`${t.page} min-h-full px-4 py-10 sm:py-14`} dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-3 pb-2">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Revital Parzelina Photography"
            className="w-56 sm:w-64 mx-auto mb-6" />
          {guide.title && <h1 className={`${t.heading} text-3xl sm:text-4xl font-medium leading-tight`}>{guide.title}</h1>}
          {guide.subtitle && <p className={`${t.accent} font-serif text-2xl`}>{guide.subtitle}</p>}
          {guide.intro && <p className="max-w-xl mx-auto leading-relaxed text-[17px] whitespace-pre-line pt-2">{guide.intro}</p>}
        </header>

        {(guide.paletteText || palette.length > 0) && <Palette text={guide.paletteText} palette={palette} />}
        {tips.length > 0 && <Tips tips={tips} />}
        {outfits.length > 0 && <Outfits outfits={outfits} />}
        {guide.note && <p className="text-center text-sm italic leading-relaxed whitespace-pre-line px-4">{guide.note}</p>}
        {photos.length > 0 && <Photos photos={photos} />}

        {(guide.closing || guide.signoff) && (
          <section className="text-center rounded-3xl px-6 py-8 bg-gradient-to-b from-[#F5EBDF] to-[#F9F2EA] border border-[#EFE4D6] space-y-5">
            {guide.closing && <p className="leading-relaxed text-[17px] whitespace-pre-line">{guide.closing}</p>}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#6B4A35] hover:bg-[#5A3D2B] text-white px-6 py-3 text-sm font-medium transition-colors">
              <MessageCircle className="w-4 h-4" /> שליחת הודעה בוואטסאפ
            </a>
            {guide.signoff && <p className={`${t.heading} text-2xl`}>{guide.signoff}</p>}
          </section>
        )}

        <footer className={`${t.accent} flex items-center justify-center gap-1.5 text-xs tracking-[0.25em] pt-4`} dir="ltr">
          REVITAL PARZELINA <Heart className="w-3 h-3 fill-current" /> PHOTOGRAPHY
        </footer>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import DressGuideView from '../components/dressGuides/DressGuideView'
import { loadGuide } from '../hooks/useDressGuides'

// Public dress guide page (#/dress/:slug), not tied to any client
export default function DressGuidePage() {
  const { slug } = useParams()
  const [state, setState] = useState({ loading: true, data: null })

  useEffect(() => {
    let cancelled = false
    loadGuide(slug)
      .then((data) => !cancelled && setState({ loading: false, data }))
      .catch(() => !cancelled && setState({ loading: false, data: null }))
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (state.data) document.title = `${state.data.guide.title || 'הנחיות לבוש'} | Revital Parzelina Photography`
  }, [state.data])

  if (state.loading) {
    return <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center text-[#B8956A]">טוען...</div>
  }
  if (!state.data) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex flex-col items-center justify-center gap-3 px-4 text-center text-[#5C4B3E]">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Revital Parzelina Photography" className="w-48 mb-4" />
        <p className="font-display font-light text-xl text-[#6B4A35]">הדף לא נמצא</p>
        <p className="text-sm">ייתכן שהקישור השתנה – אפשר לבקש ממני קישור חדש בוואטסאפ.</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <DressGuideView guide={state.data.guide} photos={state.data.photos} />
    </div>
  )
}

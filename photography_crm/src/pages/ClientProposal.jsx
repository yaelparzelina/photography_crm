import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import ProposalTemplate from '../templates/ProposalTemplate'
import PublicLayout from '../components/layout/PublicLayout'

export default function ClientProposal() {
  const { linkId } = useParams()
  const [state, setState] = useState({ loading: true, link: null, typeName: '', packages: [] })

  useEffect(() => {
    async function load() {
      const linkSnap = await getDoc(doc(db, 'links', linkId))
      if (!linkSnap.exists() || !linkSnap.data().active) {
        setState({ loading: false, link: null, typeName: '', packages: [] })
        return
      }
      const linkData = { id: linkSnap.id, ...linkSnap.data() }

      const typeSnap = await getDoc(doc(db, 'photoshootTypes', linkData.photoshootTypeId))
      const typeName = typeSnap.exists() ? typeSnap.data().name : ''

      const pkgSnap = await getDocs(
        query(collection(db, 'packages'), where('photoshootTypeId', '==', linkData.photoshootTypeId))
      )
      const packages = pkgSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      setState({ loading: false, link: linkData, typeName, packages })
    }
    load()
  }, [linkId])

  if (state.loading) return <PublicLayout><div className="text-center py-20 text-gray-400">טוען...</div></PublicLayout>
  if (!state.link) return (
    <PublicLayout>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-600 text-sm">קישור זה אינו פעיל יותר.</p>
        <p className="text-gray-400 text-xs mt-1">אנא צור קשר עם הצלמת.</p>
      </div>
    </PublicLayout>
  )

  return (
    <PublicLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <ProposalTemplate photoshootTypeName={state.typeName} packages={state.packages} />
      </div>
    </PublicLayout>
  )
}

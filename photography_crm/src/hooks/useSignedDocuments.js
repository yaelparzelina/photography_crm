import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export function useSignedDocuments(clientId) {
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    if (!clientId) return
    const q = query(collection(db, 'clients', clientId, 'signedDocuments'), orderBy('signedAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [clientId])

  return { documents }
}

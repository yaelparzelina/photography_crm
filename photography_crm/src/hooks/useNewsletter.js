import { useEffect, useRef } from 'react'
import { collection, doc, query, where, orderBy, addDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'
import { normalizeEmail, consentChange } from '../utils/newsletter'

const requestsRef = collection(db, 'unsubscribeRequests')
const pendingQuery = query(requestsRef, where('processed', '==', false))
const sendsRef = collection(db, 'newsletterSends')
const sendsQuery = query(sendsRef, orderBy('sentAt', 'desc'))

// Unsubscribe requests (from the public page) that are not yet matched to a client
export function usePendingUnsubscribes() {
  const [snapshot] = useCollection(pendingQuery)
  const requests = snapshot?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []

  async function dismiss(id) {
    await updateDoc(doc(db, 'unsubscribeRequests', id), { processed: true, dismissed: true, processedAt: serverTimestamp() })
  }

  return { requests, dismiss }
}

// Matches pending unsubscribe requests to clients by email and marks them unsubscribed.
// Requests with no matching client stay pending (shown on the mailing list page).
export function useUnsubscribeSync(clients, clientsLoading) {
  const { requests } = usePendingUnsubscribes()
  const inFlight = useRef(new Set())

  useEffect(() => {
    if (clientsLoading || !requests.length) return
    const byEmail = new Map()
    clients.forEach((c) => {
      const e = normalizeEmail(c.email)
      if (e) byEmail.set(e, [...(byEmail.get(e) || []), c])
    })
    const todo = requests.filter((r) => byEmail.has(normalizeEmail(r.email)) && !inFlight.current.has(r.id))
    if (!todo.length) return
    const batch = writeBatch(db)
    todo.forEach((r) => {
      inFlight.current.add(r.id)
      const matches = byEmail.get(normalizeEmail(r.email))
      const at = r.createdAt?.toDate ? r.createdAt.toDate() : new Date()
      matches.forEach((c) => batch.update(doc(db, 'clients', c.id), consentChange(false, 'link', at)))
      batch.update(doc(db, 'unsubscribeRequests', r.id), {
        processed: true, matchedClientIds: matches.map((c) => c.id), processedAt: serverTimestamp(),
      })
    })
    batch.commit().catch(() => todo.forEach((r) => inFlight.current.delete(r.id)))
  }, [clients, clientsLoading, requests])
}

export function useNewsletterSends() {
  const [snapshot] = useCollection(sendsQuery)
  const sends = snapshot?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []

  async function logSend(data) {
    await addDoc(sendsRef, { ...data, sentAt: serverTimestamp() })
  }

  return { sends, logSend }
}

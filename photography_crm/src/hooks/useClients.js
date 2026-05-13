import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, getDocs, writeBatch } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

const ref = collection(db, 'clients')
const q = query(ref, orderBy('createdAt', 'desc'))

export function useClients() {
  const [snapshot, loading] = useCollection(q)
  const clients = snapshot?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []

  async function createClient(data) {
    const docRef = await addDoc(ref, {
      name: '', email: '', phone: '', photoshootTypeId: '', packageId: '',
      price: null, paidAdvance: false, status: 'new_lead',
      agreementSigned: false, notes: '',
      ...data,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  async function updateClient(id, data) {
    await updateDoc(doc(db, 'clients', id), data)
  }

  async function deleteClient(id) {
    const linkSnap = await getDocs(
      query(collection(db, 'links'), where('clientId', '==', id), where('active', '==', true))
    )
    if (!linkSnap.empty) {
      const batch = writeBatch(db)
      linkSnap.docs.forEach((d) => batch.update(d.ref, { active: false, deactivatedAt: serverTimestamp() }))
      await batch.commit()
    }
    await deleteDoc(doc(db, 'clients', id))
  }

  return { clients: clients ?? [], loading, createClient, updateClient, deleteClient }
}

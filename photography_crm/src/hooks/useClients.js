import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

const ref = collection(db, 'clients')

export function useClients() {
  const q = query(ref, orderBy('createdAt', 'desc'))
  const [clients, loading] = useCollectionData(q, { idField: 'id' })

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
    await deleteDoc(doc(db, 'clients', id))
  }

  return { clients: clients ?? [], loading, createClient, updateClient, deleteClient }
}

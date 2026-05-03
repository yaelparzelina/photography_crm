import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, getDocs, writeBatch } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

const ref = collection(db, 'photoshootTypes')
const q = query(ref, orderBy('order', 'asc'))

export function usePhotoshootTypes() {
  const [types, loading] = useCollectionData(q, { idField: 'id' })

  async function createType(name) {
    const order = (types ?? []).length
    await addDoc(ref, { name, order, createdAt: serverTimestamp() })
  }

  async function updateType(id, data) {
    await updateDoc(doc(db, 'photoshootTypes', id), data)
  }

  async function deleteType(id) {
    const [pkgSnap, clientSnap] = await Promise.all([
      getDocs(query(collection(db, 'packages'), where('photoshootTypeId', '==', id))),
      getDocs(query(collection(db, 'clients'), where('photoshootTypeId', '==', id))),
    ])

    const batch = writeBatch(db)
    pkgSnap.docs.forEach((d) => batch.delete(d.ref))
    clientSnap.docs.forEach((d) => batch.update(d.ref, { photoshootTypeId: '', packageId: '' }))
    batch.delete(doc(db, 'photoshootTypes', id))
    await batch.commit()
  }

  return { types: types ?? [], loading, createType, updateType, deleteType }
}

import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, getDocs } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

const ref = collection(db, 'photoshootTypes')

export function usePhotoshootTypes() {
  const q = query(ref, orderBy('order', 'asc'))
  const [types, loading] = useCollectionData(q, { idField: 'id' })

  async function createType(name) {
    const order = (types ?? []).length
    await addDoc(ref, { name, order, createdAt: serverTimestamp() })
  }

  async function updateType(id, data) {
    await updateDoc(doc(db, 'photoshootTypes', id), data)
  }

  async function deleteType(id) {
    const pkgSnap = await getDocs(query(collection(db, 'packages'), where('photoshootTypeId', '==', id)))
    await Promise.all(pkgSnap.docs.map((d) => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'photoshootTypes', id))
  }

  return { types: types ?? [], loading, createType, updateType, deleteType }
}

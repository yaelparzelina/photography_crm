import { useMemo } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

export function usePackagesByType(typeId) {
  const q = useMemo(
    () => typeId
      ? query(collection(db, 'packages'), where('photoshootTypeId', '==', typeId), orderBy('order', 'asc'))
      : null,
    [typeId]
  )
  const [snapshot, loading] = useCollection(q)
  const packages = snapshot?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []

  async function createPackage(data) {
    const order = (packages ?? []).length
    await addDoc(collection(db, 'packages'), { ...data, order, createdAt: serverTimestamp() })
  }

  async function updatePackage(id, data) {
    await updateDoc(doc(db, 'packages', id), data)
  }

  async function deletePackage(id) {
    await deleteDoc(doc(db, 'packages', id))
  }

  return { packages: packages ?? [], loading, createPackage, updatePackage, deletePackage }
}

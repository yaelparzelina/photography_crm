import { useMemo } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

export function usePackagesByType(typeId) {
  const q = useMemo(
    () => typeId
      ? query(collection(db, 'packages'), where('photoshootTypeId', '==', typeId), orderBy('order', 'asc'))
      : null,
    [typeId]
  )
  const [packages, loading] = useCollectionData(q, { idField: 'id' })

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

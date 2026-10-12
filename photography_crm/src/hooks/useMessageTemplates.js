import { useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'
import { DEFAULT_TEMPLATES, PRE_SHOOT_TEMPLATE } from '../utils/messageTemplate'

const ref = collection(db, 'messageTemplates')
const q = query(ref, orderBy('order', 'asc'))
const seededFlag = doc(db, 'settings', 'messageTemplates')
const preShootFlag = doc(db, 'settings', 'preShootTemplate')

// Adds the placeholder pre-shoot message once (never again, even if it is deleted later)
export async function seedPreShootTemplateIfNeeded() {
  if ((await getDoc(preShootFlag)).exists()) return false
  const batch = writeBatch(db)
  batch.set(doc(ref), { ...PRE_SHOOT_TEMPLATE, order: Date.now(), createdAt: serverTimestamp() })
  batch.set(preShootFlag, { seeded: true, at: serverTimestamp() })
  await batch.commit()
  return true
}

export function usePreShootTemplateSeed() {
  useEffect(() => {
    seedPreShootTemplateIfNeeded().catch((err) => console.error('Pre-shoot message seed failed', err))
  }, [])
}

export function useMessageTemplates() {
  const [snapshot, loading] = useCollection(q)
  const templates = snapshot?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []

  async function createTemplate(data) {
    const order = templates.length ? Math.max(...templates.map((t) => t.order ?? 0)) + 1 : 0
    await addDoc(ref, { ...data, order, createdAt: serverTimestamp() })
  }

  async function updateTemplate(id, data) {
    await updateDoc(doc(db, 'messageTemplates', id), data)
  }

  async function deleteTemplate(id) {
    await deleteDoc(doc(db, 'messageTemplates', id))
  }

  async function moveTemplate(index, dir) {
    const a = templates[index], b = templates[index + dir]
    if (!b) return
    const batch = writeBatch(db)
    batch.update(doc(db, 'messageTemplates', a.id), { order: b.order })
    batch.update(doc(db, 'messageTemplates', b.id), { order: a.order })
    await batch.commit()
  }

  // Adds the starter messages once (never again, even if they are all deleted later)
  async function seedIfNeeded() {
    const flag = await getDoc(seededFlag)
    if (flag.exists()) return
    const batch = writeBatch(db)
    DEFAULT_TEMPLATES.forEach((t, i) => {
      batch.set(doc(ref), { ...t, order: i, createdAt: serverTimestamp() })
    })
    batch.set(seededFlag, { seeded: true, at: serverTimestamp() })
    await batch.commit()
  }

  return { templates, loading, createTemplate, updateTemplate, deleteTemplate, moveTemplate, seedIfNeeded }
}

import { useEffect } from 'react'
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, runTransaction,
} from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'
import { DEFAULT_GUIDES, guideMessageTemplate, guideMessageTitle, newGuideSlug, normalizeGuide } from '../utils/dressGuides'
import { blobToDataUrl } from '../utils/imageResize'

const guidesRef = collection(db, 'dressGuides')
const photosRef = collection(db, 'dressGuidePhotos')
const seededFlag = doc(db, 'settings', 'dressGuides')

// Fields saved on a guide document (everything else in the editor state is UI-only)
const GUIDE_FIELDS = ['name', 'title', 'subtitle', 'intro', 'paletteText', 'paletteGroups', 'tips', 'outfits', 'note', 'closing', 'signoff']

export function useDressGuides() {
  const [snapshot, loading] = useCollection(query(guidesRef, orderBy('order', 'asc')))
  const guides = snapshot?.docs.map((d) => ({ id: d.id, ...normalizeGuide(d.data()) })) ?? []
  return { guides, loading }
}

// Loads a guide with its photos (used by the public page and the editor)
export async function loadGuide(slug) {
  const snap = await getDoc(doc(db, 'dressGuides', slug))
  if (!snap.exists()) return null
  const guide = { id: snap.id, ...normalizeGuide(snap.data()) }
  const photos = await Promise.all(guide.photoIds.map(async (id) => {
    const p = await getDoc(doc(db, 'dressGuidePhotos', id))
    return p.exists() ? { id, src: p.data().data } : null
  }))
  return { guide, photos: photos.filter(Boolean) }
}

// Saves the editor state. `photos` is the final ordered list: [{ id, src, isNew }].
// New photos are written first, then the guide, then removed photos are deleted.
export async function saveGuide({ slug, form, photos, previousPhotoIds = [], previous = null }) {
  const id = slug || newGuideSlug()
  const photoIds = []
  for (const p of photos) {
    if (p.isNew) {
      const ref = doc(photosRef)
      await setDoc(ref, { data: p.src, guideId: id, createdAt: serverTimestamp() })
      photoIds.push(ref.id)
    } else {
      photoIds.push(p.id)
    }
  }

  const data = Object.fromEntries(GUIDE_FIELDS.map((k) => [k, form[k]]))
  data.photoIds = photoIds
  data.updatedAt = serverTimestamp()

  if (previous) {
    await updateDoc(doc(db, 'dressGuides', id), data)
    if (previous.messageTemplateId && previous.name !== form.name) {
      await updateDoc(doc(db, 'messageTemplates', previous.messageTemplateId), { title: guideMessageTitle(form.name) })
        .catch(() => {}) // the message may have been deleted by the owner
    }
  } else {
    const templateRef = doc(collection(db, 'messageTemplates'))
    await setDoc(templateRef, { ...guideMessageTemplate(form, id), order: Date.now(), createdAt: serverTimestamp() })
    await setDoc(doc(db, 'dressGuides', id), {
      ...data, order: Date.now(), messageTemplateId: templateRef.id, createdAt: serverTimestamp(),
    })
  }

  const removed = previousPhotoIds.filter((pid) => !photoIds.includes(pid))
  await Promise.all(removed.map((pid) => deleteDoc(doc(db, 'dressGuidePhotos', pid))))
  return id
}

// Deletes a guide, its photos and its message
export async function deleteGuide(guide) {
  await deleteDoc(doc(db, 'dressGuides', guide.id))
  await Promise.all([
    ...guide.photoIds.map((pid) => deleteDoc(doc(db, 'dressGuidePhotos', pid))),
    guide.messageTemplateId ? deleteDoc(doc(db, 'messageTemplates', guide.messageTemplateId)) : null,
  ])
}

async function loadBundledPhoto(path) {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`)
  if (!res.ok) throw new Error(`missing ${path}`)
  return blobToDataUrl(await res.blob())
}

// Builds every document the starter guides need: [{ ref, data }]
export async function buildSeedDocs(now = Date.now()) {
  const writes = []
  for (const [i, { slug, photoFiles, ...content }] of DEFAULT_GUIDES.entries()) {
    const photoIds = []
    for (const file of photoFiles) {
      const ref = doc(photosRef)
      writes.push({ ref, data: { data: await loadBundledPhoto(file), guideId: slug, createdAt: serverTimestamp() } })
      photoIds.push(ref.id)
    }
    const templateRef = doc(collection(db, 'messageTemplates'))
    writes.push({ ref: templateRef, data: { ...guideMessageTemplate(content, slug), order: now + i, createdAt: serverTimestamp() } })
    writes.push({
      ref: doc(db, 'dressGuides', slug),
      data: { ...content, photoIds, order: i, messageTemplateId: templateRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    })
  }
  return writes
}

// Adds the starter guides and their messages once (never again, even if they are deleted later)
export async function seedDressGuidesIfNeeded() {
  const flag = await getDoc(seededFlag)
  if (flag.exists()) return false
  const writes = await buildSeedDocs()
  return runTransaction(db, async (tx) => {
    if ((await tx.get(seededFlag)).exists()) return false // another tab seeded meanwhile
    writes.forEach(({ ref, data }) => tx.set(ref, data))
    tx.set(seededFlag, { seeded: true, at: serverTimestamp() })
    return true
  })
}

export function useDressGuidesSeed() {
  useEffect(() => {
    seedDressGuidesIfNeeded().catch((err) => console.error('Dress guides seed failed', err))
  }, [])
}

import { collection, doc, setDoc, updateDoc, getDocs, query, where, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { generateLinkId } from '../utils/linkGenerator'

async function deactivateExisting(clientId, type) {
  const snap = await getDocs(
    query(collection(db, 'links'), where('clientId', '==', clientId), where('type', '==', type), where('active', '==', true))
  )
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.update(d.ref, { active: false, deactivatedAt: serverTimestamp() }))
  await batch.commit()
}

export function useLinks() {
  async function createProposalLink(clientId, photoshootTypeId) {
    await deactivateExisting(clientId, 'proposal')
    const linkId = generateLinkId()
    await setDoc(doc(db, 'links', linkId), {
      clientId, photoshootTypeId, type: 'proposal', active: true, createdAt: serverTimestamp(),
    })
    return linkId
  }

  async function createAgreementLink(clientId, snapshot) {
    await deactivateExisting(clientId, 'agreement')
    const linkId = generateLinkId()
    const batch = writeBatch(db)
    batch.set(doc(db, 'links', linkId), {
      clientId, type: 'agreement', active: true, ...snapshot, createdAt: serverTimestamp(),
    })
    batch.update(doc(db, 'clients', clientId), {
      agreementSigned: false, agreementSignedAt: null, status: 'agreement_sent',
    })
    await batch.commit()
    return linkId
  }

  async function deactivateLink(linkId) {
    await updateDoc(doc(db, 'links', linkId), { active: false, deactivatedAt: serverTimestamp() })
  }

  return { createProposalLink, createAgreementLink, deactivateLink }
}

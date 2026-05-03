import { collection, doc, setDoc, updateDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { generateLinkId } from '../utils/linkGenerator'

async function deactivateExisting(clientId, type) {
  const snap = await getDocs(
    query(collection(db, 'links'), where('clientId', '==', clientId), where('type', '==', type), where('active', '==', true))
  )
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { active: false, deactivatedAt: serverTimestamp() })))
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
    await setDoc(doc(db, 'links', linkId), {
      clientId, type: 'agreement', active: true, ...snapshot, createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'clients', clientId), {
      agreementSigned: false, agreementSignedAt: null, status: 'agreement_sent',
    })
    return linkId
  }

  async function deactivateLink(linkId) {
    await updateDoc(doc(db, 'links', linkId), { active: false, deactivatedAt: serverTimestamp() })
  }

  return { createProposalLink, createAgreementLink, deactivateLink }
}

import { formatDate } from './dateUtils'

export function getClientName(client) {
  const full = [client?.firstName, client?.lastName].filter(Boolean).join(' ')
  return full || client?.name || ''
}

export function signedDocumentTitle(signedDoc) {
  return `הסכם עבודה — ${signedDoc.agreement?.clientName || ''} — ${formatDate(signedDoc.signedAt)}`
}

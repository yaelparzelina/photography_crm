export function getClientName(client) {
  const full = [client?.firstName, client?.lastName].filter(Boolean).join(' ')
  return full || client?.name || ''
}

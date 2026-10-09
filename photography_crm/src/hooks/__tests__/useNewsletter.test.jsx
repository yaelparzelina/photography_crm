import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({ db: {} }))
const batch = vi.hoisted(() => ({ update: vi.fn(), commit: vi.fn(() => Promise.resolve()) }))
vi.mock('firebase/firestore', () => ({
  collection: (_db, name) => ({ name }),
  doc: (_db, ...path) => path.join('/'),
  query: (ref) => ref,
  where: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: () => 'TS',
  writeBatch: () => batch,
}))
const requests = vi.hoisted(() => ({ value: [] }))
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: (q) => [{ docs: (q?.name === 'unsubscribeRequests' ? requests.value : []).map((r) => ({ id: r.id, data: () => r })) }, false],
}))

import { useUnsubscribeSync } from '../useNewsletter'

describe('useUnsubscribeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks clients with a matching email (case-insensitive) as unsubscribed via the link', () => {
    requests.value = [{ id: 'r1', email: 'dana@example.com', createdAt: { toDate: () => new Date('2025-06-01') } }]
    renderHook(() => useUnsubscribeSync([{ id: 'c1', email: ' Dana@Example.com' }, { id: 'c2', email: 'other@x.com' }], false))
    expect(batch.update).toHaveBeenCalledWith('clients/c1', expect.objectContaining({
      newsletterConsent: false, newsletterUnsubscribeSource: 'link', newsletterUnsubscribedAt: new Date('2025-06-01'),
    }))
    expect(batch.update).toHaveBeenCalledWith('unsubscribeRequests/r1', expect.objectContaining({ processed: true, matchedClientIds: ['c1'] }))
    expect(batch.update).not.toHaveBeenCalledWith('clients/c2', expect.anything())
    expect(batch.commit).toHaveBeenCalled()
  })

  it('leaves requests with no matching client pending', () => {
    requests.value = [{ id: 'r2', email: 'nobody@example.com' }]
    renderHook(() => useUnsubscribeSync([{ id: 'c1', email: 'dana@example.com' }], false))
    expect(batch.commit).not.toHaveBeenCalled()
  })
})

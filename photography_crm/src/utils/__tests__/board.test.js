import { vi, describe, it, expect } from 'vitest'

vi.mock('firebase/firestore', () => ({ serverTimestamp: () => 'TS' }))

import {
  columnOf, dropStatus, moveChanges, statusChanges, isOnBoard, groupBoard, sortColumn, whatsappUrl, shortDate, orderKey, orderAt,
  BOARD_SLOTS, BOARD_COLUMNS,
} from '../board'

const at = (s) => ({ toDate: () => new Date(s) })

describe('board columns', () => {
  it('every column has one slot, with closing and lost stacked', () => {
    expect(BOARD_SLOTS.flat().sort()).toEqual(BOARD_COLUMNS.map((c) => c.id).sort())
    expect(BOARD_SLOTS[3]).toEqual(['closing', 'lost'])
  })

  it('places a client by status, keeping a stored column only when it holds that status', () => {
    expect(columnOf({ status: 'new_lead' })).toBe('new')
    expect(columnOf({})).toBe('new')
    expect(columnOf({ status: 'proposal_sent' })).toBe('proposal')
    expect(columnOf({ status: 'proposal_sent', boardColumn: 'callback' })).toBe('callback')
    expect(columnOf({ status: 'proposal_sent', boardColumn: 'closing' })).toBe('closing')
    expect(columnOf({ status: 'agreement_signed' })).toBe('closing')
    expect(columnOf({ status: 'editing_in_progress', boardColumn: 'album' })).toBe('album')
    // the status changed elsewhere (e.g. on the client card): the stored column no longer fits
    expect(columnOf({ status: 'shoot_scheduled', boardColumn: 'callback' })).toBe('preshoot')
  })

  it('dropping in the contract column follows the signing state', () => {
    expect(dropStatus('closing', { status: 'proposal_sent' })).toBe('proposal_sent')
    expect(dropStatus('closing', { status: 'shoot_scheduled', agreementSentAt: at('2026-01-01') })).toBe('agreement_sent')
    expect(dropStatus('closing', { status: 'agreement_sent' })).toBe('agreement_sent')
    expect(dropStatus('closing', { status: 'done', agreementSigned: true })).toBe('agreement_signed')
    expect(dropStatus('callback', {})).toBe('proposal_sent')
    expect(dropStatus('album', {})).toBe('editing_in_progress')
    expect(dropStatus('lost', {})).toBe('didnt_book')
  })

  it('a move records the column and time; a status change elsewhere resets the column', () => {
    expect(moveChanges('callback', {})).toEqual({
      status: 'proposal_sent', boardColumn: 'callback', boardMovedAt: 'TS', boardHidden: false, boardOrder: expect.any(Number),
    })
    expect(moveChanges('callback', {}, 5).boardOrder).toBe(5)
    expect(statusChanges('done')).toEqual({ status: 'done', boardColumn: null, boardMovedAt: 'TS', boardHidden: false, boardOrder: expect.any(Number) })
    // new arrivals go to the top
    expect(moveChanges('new', {}).boardOrder).toBeLessThan(0)
  })
})

describe('expiry', () => {
  const now = new Date('2026-11-01T12:00:00Z')
  it('done and didnt_book clients leave the board 7 days after moving, or when removed', () => {
    expect(isOnBoard({ status: 'done', boardMovedAt: at('2026-10-28T12:00:00Z') }, now)).toBe(true)
    expect(isOnBoard({ status: 'done', boardMovedAt: at('2026-10-24T12:00:00Z') }, now)).toBe(false)
    expect(isOnBoard({ status: 'didnt_book', boardMovedAt: at('2026-10-31T12:00:00Z'), boardHidden: true }, now)).toBe(false)
    expect(isOnBoard({ status: 'editing_in_progress', boardMovedAt: at('2020-01-01') }, now)).toBe(true)
  })

  it('clients from before the board count from its launch day', () => {
    expect(isOnBoard({ status: 'done' }, new Date('2026-10-15T00:00:00Z'))).toBe(true)
    expect(isOnBoard({ status: 'done' }, new Date('2026-10-20T00:00:00Z'))).toBe(false)
  })
})

describe('ordering', () => {
  it('pre-shoot by nearest shoot, editing by nearest deadline, others most recently moved first', () => {
    const shoots = [
      { id: 'late', shootDate: at('2026-12-01') }, { id: 'none' }, { id: 'soon', shootDate: at('2026-11-05') },
    ]
    expect(sortColumn('preshoot', shoots).map((c) => c.id)).toEqual(['soon', 'late', 'none'])
    const editing = [
      { id: 'a', shootDate: at('2026-11-01'), businessDays: 20 }, { id: 'b', shootDate: at('2026-11-03'), businessDays: 5 },
    ]
    expect(sortColumn('editing', editing).map((c) => c.id)).toEqual(['b', 'a'])
    const moved = [{ id: 'old', boardMovedAt: at('2026-01-01') }, { id: 'new', boardMovedAt: at('2026-02-01') }, { id: 'created', createdAt: at('2026-01-15') }]
    expect(sortColumn('new', moved).map((c) => c.id)).toEqual(['new', 'created', 'old'])
  })

  it('groupBoard puts every visible client in its column', () => {
    const g = groupBoard([
      { id: '1', status: 'new_lead' }, { id: '2', status: 'proposal_sent', boardColumn: 'callback' },
      { id: '3', status: 'done', boardMovedAt: at('2020-01-01') },
    ], new Date('2026-11-01'))
    expect(g.new.map((c) => c.id)).toEqual(['1'])
    expect(g.callback.map((c) => c.id)).toEqual(['2'])
    expect(g.done).toEqual([])
  })
})

describe('manual order', () => {
  it('saved positions win; clients without one fall back to most recently moved first', () => {
    const list = [
      { id: 'a', boardOrder: 10 }, { id: 'b', boardOrder: -5 }, { id: 'c', boardMovedAt: at('2026-02-01') },
    ]
    expect(sortColumn('callback', list).map((c) => c.id)).toEqual(['c', 'b', 'a'])
    expect(orderKey({ boardMovedAt: at('2026-02-01') })).toBe(-new Date('2026-02-01').getTime())
  })

  it('orderAt places a ticket before, between or after its neighbours', () => {
    const list = [{ boardOrder: 0 }, { boardOrder: 10 }]
    expect(orderAt(list, 0)).toBeLessThan(0)
    expect(orderAt(list, 1)).toBe(5)
    expect(orderAt(list, 2)).toBeGreaterThan(10)
    expect(orderAt([], 0)).toBeLessThan(0)
  })
})

describe('helpers', () => {
  it('builds WhatsApp links from Israeli numbers', () => {
    expect(whatsappUrl('054-878-8851')).toBe('https://wa.me/972548788851')
    expect(whatsappUrl('+972 54 8788851')).toBe('https://wa.me/972548788851')
    expect(whatsappUrl('')).toBeNull()
  })

  it('short dates hide the current year', () => {
    const now = new Date('2026-06-01')
    expect(shortDate(at('2026-10-15T00:00:00Z'), now)).toBe('15/10')
    expect(shortDate(at('2027-01-03T00:00:00Z'), now)).toBe('03/01/27')
  })
})

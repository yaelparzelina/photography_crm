import { describe, it, expect } from 'vitest'
import { STATUS_CONFIG, STATUS_OPTIONS } from '../statusConfig'

describe('STATUS_CONFIG', () => {
  const allStatuses = [
    'new_lead', 'proposal_sent', 'agreement_sent', 'agreement_signed',
    'shoot_scheduled', 'editing_in_progress', 'done', 'didnt_book',
  ]

  it.each(allStatuses)('%s has a label and color', (status) => {
    expect(STATUS_CONFIG[status]).toBeDefined()
    expect(STATUS_CONFIG[status].label).toBeTruthy()
    expect(STATUS_CONFIG[status].color).toBeTruthy()
  })
})

describe('STATUS_OPTIONS', () => {
  it('has 8 entries', () => expect(STATUS_OPTIONS).toHaveLength(8))
  it('each entry has value and label', () => {
    STATUS_OPTIONS.forEach((opt) => {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
    })
  })
})

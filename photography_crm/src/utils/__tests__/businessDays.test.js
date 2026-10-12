import { describe, it, expect } from 'vitest'
import { holidayName, isBusinessDay, deliveryDeadline, businessDaysUntil, toDay } from '../businessDays'

const day = (s) => new Date(`${s}T00:00:00Z`)
const key = (d) => d.toISOString().slice(0, 10)

describe('Israeli holidays from the Hebrew calendar', () => {
  it.each([
    ['2025-09-23', 'ראש השנה'], ['2025-09-24', 'ראש השנה'], ['2025-10-02', 'יום כיפור'],
    ['2025-10-07', 'סוכות'], ['2025-10-14', 'שמחת תורה'],
    ['2026-04-02', 'פסח'], ['2026-04-08', 'פסח'], ['2026-05-22', 'שבועות'],
    ['2026-09-12', 'ראש השנה'], ['2026-09-21', 'יום כיפור'],
  ])('%s is %s', (date, name) => {
    expect(holidayName(day(date))).toBe(name)
  })

  it('יום העצמאות follows its moving rules', () => {
    expect(holidayName(day('2025-05-01'))).toBe('יום העצמאות') // ה׳ באייר on Saturday → Thursday ג׳ באייר
    expect(holidayName(day('2025-05-03'))).toBeNull()
    expect(holidayName(day('2026-04-22'))).toBe('יום העצמאות') // Wednesday, not moved
    expect(holidayName(day('2024-05-14'))).toBe('יום העצמאות') // ה׳ באייר on Monday → Tuesday ו׳ באייר
    expect(holidayName(day('2024-05-13'))).toBeNull()
  })

  it('חול המועד and holiday eves are business days', () => {
    expect(holidayName(day('2025-10-08'))).toBeNull() // חול המועד סוכות
    expect(holidayName(day('2025-10-01'))).toBeNull() // ערב יום כיפור
    expect(isBusinessDay(day('2025-10-08'))).toBe(true)
  })

  it('Fridays and Saturdays are not business days', () => {
    expect(isBusinessDay(day('2025-10-10'))).toBe(false)
    expect(isBusinessDay(day('2025-10-11'))).toBe(false)
    expect(isBusinessDay(day('2025-10-12'))).toBe(true)
  })
})

describe('deliveryDeadline', () => {
  it('counts business days after the shoot day, skipping weekends', () => {
    // Shoot Sunday 2026-03-01: 10 business days → Sunday 2026-03-15 (two Fri–Sat weekends skipped)
    expect(key(deliveryDeadline(day('2026-03-01'), 10))).toBe('2026-03-15')
    expect(key(deliveryDeadline(day('2026-03-05'), 1))).toBe('2026-03-08') // Thursday shoot → Sunday
  })

  it('skips holidays', () => {
    // Shoot Monday 2025-09-22, 3 days: Tue 23 + Wed 24 are ראש השנה → Thu 25, Sun 28, Mon 29
    expect(key(deliveryDeadline(day('2025-09-22'), 3))).toBe('2025-09-29')
  })

  it('uses the default of 10 business days and accepts Firestore timestamps', () => {
    const ts = { toDate: () => new Date('2026-03-01T00:00:00Z') }
    expect(key(deliveryDeadline(ts, ''))).toBe('2026-03-15')
    expect(deliveryDeadline(null, 10)).toBeNull()
  })
})

describe('businessDaysUntil', () => {
  it('counts the business days left, 0 on the day, negative when overdue', () => {
    expect(businessDaysUntil(day('2026-03-15'), day('2026-03-11'))).toBe(2) // Thu → Sun: Thu12 is a business day, Fri/Sat not, Sun15
    expect(businessDaysUntil(day('2026-03-15'), day('2026-03-15'))).toBe(0)
    expect(businessDaysUntil(day('2026-03-15'), day('2026-03-17'))).toBe(-2)
  })

  it('toDay takes the calendar day of a date', () => {
    expect(key(toDay('2026-03-15'))).toBe('2026-03-15')
    expect(toDay('')).toBeNull()
  })
})

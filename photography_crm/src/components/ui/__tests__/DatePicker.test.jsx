import { render, screen, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DateInput from '../DatePicker'
import { parseDateText, formatDay } from '../../../utils/dateUtils'

function Controlled({ initial = null, onChange = () => {} }) {
  const [value, setValue] = useState(initial)
  return <DateInput aria-label="תאריך" value={value} onChange={(d) => { setValue(d); onChange(d) }} />
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-12T09:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('date text', () => {
  it('parses the formats people type and rejects impossible dates', () => {
    const iso = (s) => parseDateText(s)?.toISOString().slice(0, 10)
    expect(iso('16/10/2026')).toBe('2026-10-16')
    expect(iso('6/1/27')).toBe('2027-01-06')
    expect(iso('16.10.2026')).toBe('2026-10-16')
    expect(iso('2026-10-16')).toBe('2026-10-16')
    expect(parseDateText('31/02/2026')).toBeNull()
    expect(parseDateText('16/10')).toBeNull()
    expect(formatDay(new Date('2026-10-16T00:00:00Z'))).toBe('16/10/2026')
  })
})

describe('DateInput', () => {
  it('shows the date as dd/mm/yyyy and accepts typing', () => {
    const onChange = vi.fn()
    render(<Controlled initial={new Date('2026-10-16T00:00:00Z')} onChange={onChange} />)
    const input = screen.getByLabelText('תאריך')
    expect(input).toHaveValue('16/10/2026')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '20/10/2026' } })
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-10-20T00:00:00Z'))
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('typing shows a __/__/____ template and fills in the digits', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const input = screen.getByLabelText('תאריך')
    expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy')
    act(() => input.focus())
    expect(input).toHaveValue('__/__/____')
    // each keystroke inserts a digit into the template; the slashes stay in place
    fireEvent.change(input, { target: { value: '1__/__/____' } })
    expect(input).toHaveValue('1_/__/____')
    fireEvent.change(input, { target: { value: '16_/__/____' } })
    fireEvent.change(input, { target: { value: '161/__/____' } })
    expect(input).toHaveValue('16/1_/____')
    expect(input.selectionStart).toBe(4) // caret right after the last digit
    fireEvent.change(input, { target: { value: '16/10/2026_' } })
    expect(input).toHaveValue('16/10/2026')
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-10-16T00:00:00Z'))
    // backspace removes the last digit
    fireEvent.change(input, { target: { value: '16/10/202_' } })
    expect(input).toHaveValue('16/10/202_')
  })

  it('flags an impossible date and completes a two-digit year on leaving the field', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const input = screen.getByLabelText('תאריך')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '31022026' } })
    expect(screen.getByText('תאריך לא תקין')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '161026' } })
    expect(input).toHaveValue('16/10/26__')
    fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-10-16T00:00:00Z'))
    expect(input).toHaveValue('16/10/2026')
  })

  it('picks a day from the calendar, which opens on the current value', () => {
    const onChange = vi.fn()
    render(<Controlled initial={new Date('2026-10-16T00:00:00Z')} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת לוח שנה' }))
    expect(screen.getByRole('gridcell', { name: '16 באוקטובר 2026' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'החודש הבא' }))
    fireEvent.click(screen.getByRole('gridcell', { name: '3 בנובמבר 2026' }))
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-11-03T00:00:00Z'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('תאריך')).toHaveValue('03/11/2026')
  })

  it('year and month menus jump far (e.g. birth dates), and "today" and "clear" work', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת לוח שנה' }))
    fireEvent.change(screen.getByLabelText('שנה'), { target: { value: '2013' } })
    fireEvent.change(screen.getByLabelText('חודש'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('gridcell', { name: '7 במאי 2013' }))
    expect(onChange).toHaveBeenLastCalledWith(new Date('2013-05-07T00:00:00Z'))
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת לוח שנה' }))
    fireEvent.click(screen.getByText('נקה תאריך'))
    expect(onChange).toHaveBeenLastCalledWith(null)
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת לוח שנה' }))
    fireEvent.click(screen.getByText('היום'))
    expect(onChange).toHaveBeenLastCalledWith(new Date('2026-10-12T00:00:00Z'))
  })

  it('marks holidays and closes with Escape', () => {
    render(<Controlled initial={new Date('2026-09-15T00:00:00Z')} />)
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת לוח שנה' }))
    expect(screen.getByRole('gridcell', { name: '21 בספטמבר 2026 · יום כיפור' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

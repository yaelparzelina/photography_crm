import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import MessageEditor from '../MessageEditor'

describe('MessageEditor', () => {
  it('creates a new message with blanks, name, bold, emoji and a link', async () => {
    const onSave = vi.fn(() => Promise.resolve())
    render(<MessageEditor isOpen template={null} onClose={vi.fn()} onSave={onSave} />)
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'תזכורת' } })
    const textarea = screen.getAllByRole('textbox')[1]
    fireEvent.change(textarea, { target: { value: 'היי ' } })
    textarea.setSelectionRange(4, 4)
    fireEvent.click(screen.getByText('{שם} שם הלקוח'))
    fireEvent.change(textarea, { target: { value: textarea.value + ' https://example.com ' } })
    fireEvent.click(screen.getByText('___ שדה למילוי'))
    fireEvent.click(screen.getByLabelText('הוסף ❤️'))
    fireEvent.click(screen.getByText('שמור הודעה'))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    const saved = onSave.mock.calls[0][0]
    expect(saved.title).toBe('תזכורת')
    expect(saved.variants.f_base).toContain('{שם}')
    expect(saved.variants.f_base).toContain('https://example.com')
    expect(saved.variants.f_base).toContain('___')
    expect(saved.variants.f_base).toContain('❤️')
  })

  it('turning on gender + album versions shows 4 text boxes, prefilled from the existing text', () => {
    render(<MessageEditor isOpen template={{ title: 'א', hasGender: false, hasAlbum: false, variants: { f_base: 'טקסט' } }}
      onClose={vi.fn()} onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('switch', { name: 'גרסת נקבה / זכר' }))
    fireEvent.click(screen.getByRole('switch', { name: 'גרסה עם / בלי אלבום' }))
    expect(screen.getByText('נקבה · עם אלבום')).toBeInTheDocument()
    expect(screen.getByText('זכר · בלי אלבום')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('טקסט')).toHaveLength(4)
  })

  it('requires a title', () => {
    const onSave = vi.fn()
    render(<MessageEditor isOpen template={null} onClose={vi.fn()} onSave={onSave} />)
    fireEvent.click(screen.getByText('שמור הודעה'))
    expect(screen.getByText('יש לתת כותרת להודעה')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})

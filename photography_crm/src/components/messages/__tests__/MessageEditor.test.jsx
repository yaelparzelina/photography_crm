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
    fireEvent.click(screen.getByText('שמור'))
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

  it('Ctrl+Z / Ctrl+Y undo and redo typing and inserted blanks (also on a Hebrew keyboard layout)', () => {
    render(<MessageEditor isOpen template={{ title: 'א', hasGender: false, hasAlbum: false, variants: { f_base: 'שלום' } }}
      onClose={vi.fn()} onSave={vi.fn()} />)
    const textarea = screen.getAllByRole('textbox')[1]
    fireEvent.click(screen.getByText('___ שדה למילוי'))
    expect(textarea).toHaveValue('שלום___')
    // Hebrew layout: key is 'ז' but the physical key is KeyZ
    fireEvent.keyDown(textarea, { key: 'ז', code: 'KeyZ', ctrlKey: true })
    expect(textarea).toHaveValue('שלום')
    fireEvent.keyDown(textarea, { key: 'ט', code: 'KeyY', ctrlKey: true })
    expect(textarea).toHaveValue('שלום___')
    fireEvent.change(textarea, { target: { value: 'חדש' } })
    fireEvent.click(screen.getByRole('button', { name: 'בטל פעולה (Ctrl+Z)' }))
    expect(textarea).toHaveValue('שלום___')
  })

  it('has a full emoji picker button and a pinned footer with בטל / שמור', () => {
    render(<MessageEditor isOpen template={null} onClose={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByText('כל האימוג׳ים')).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'שמור' })
    expect(save.closest('.sticky')).not.toBeNull()
    expect(screen.queryByText('שמור הודעה')).not.toBeInTheDocument()
  })

  it('requires a title', () => {
    const onSave = vi.fn()
    render(<MessageEditor isOpen template={null} onClose={vi.fn()} onSave={onSave} />)
    fireEvent.click(screen.getByText('שמור'))
    expect(screen.getByText('יש לתת כותרת להודעה')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})

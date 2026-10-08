import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MessageCard from '../MessageCard'

const template = {
  id: 't1',
  title: 'התמונות מוכנות',
  hasGender: true,
  hasAlbum: true,
  variants: {
    f_album: 'היי {שם}, עם אלבום רשמי *מודגש* קוד: ___ של ___',
    f_noalbum: 'היי {שם}, בלי אלבום קוד: ___',
    m_album: 'היי {שם}, עם אלבום רשום קוד: ___ של ___',
    m_noalbum: 'היי {שם}, בלי אלבום קוד: ___',
  },
}

function renderCard(props = {}) {
  return render(<MessageCard template={template} onEdit={vi.fn()} onDelete={vi.fn()}
    onMoveUp={vi.fn()} onMoveDown={vi.fn()} isFirst isLast={false} {...props} />)
}

describe('MessageCard', () => {
  let writeText
  beforeEach(() => {
    writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  it('defaults to female without album and shows only that version', () => {
    renderCard()
    expect(screen.getByText(/בלי אלבום קוד/)).toBeInTheDocument()
    expect(screen.queryByText(/עם אלבום רשמי/)).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'נקבה' })).toHaveAttribute('aria-checked', 'true')
  })

  it('switches between the 4 versions with the toggles', () => {
    renderCard()
    fireEvent.click(screen.getByRole('switch', { name: 'עם אלבום' }))
    expect(screen.getByText(/רשמי/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'זכר' }))
    expect(screen.getByText(/רשום/)).toBeInTheDocument()
  })

  it('shows *bold* as bold without the asterisks', () => {
    renderCard({ client: { includesAlbum: true } })
    const bold = screen.getByText('מודגש')
    expect(bold.closest('strong')).not.toBeNull()
    expect(screen.queryByText(/\*מודגש\*/)).not.toBeInTheDocument()
  })

  it('copies filled text without the title; warns and keeps ___ for unfilled blanks', async () => {
    renderCard({ client: { firstName: 'דנה', includesAlbum: true } })
    fireEvent.change(screen.getByLabelText('שדה למילוי 1'), { target: { value: '1234' } })
    fireEvent.click(screen.getByText('העתק הודעה'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('היי דנה, עם אלבום רשמי *מודגש* קוד: 1234 של ___'))
    expect(screen.getByText(/יש שדות שלא מולאו/)).toBeInTheDocument()
    expect(writeText.mock.calls[0][0]).not.toContain('התמונות מוכנות')
  })

  it('confirms copy when everything is filled', async () => {
    renderCard()
    fireEvent.change(screen.getByLabelText('שם הלקוח'), { target: { value: 'רון' } })
    fireEvent.change(screen.getByLabelText('שדה למילוי 1'), { target: { value: '99' } })
    fireEvent.click(screen.getByText('העתק הודעה'))
    await waitFor(() => expect(screen.getByText('הועתק!')).toBeInTheDocument())
    expect(writeText).toHaveBeenCalledWith('היי רון, בלי אלבום קוד: 99')
  })

  it('prefills name, gender and album from the client, all still editable', () => {
    renderCard({ client: { firstName: 'יוסי', gender: 'male', includesAlbum: true } })
    expect(screen.getByText(/רשום/)).toBeInTheDocument()
    const nameInput = screen.getByLabelText('שם הלקוח')
    expect(nameInput).toHaveValue('יוסי')
    fireEvent.change(nameInput, { target: { value: 'יוסף' } })
    expect(nameInput).toHaveValue('יוסף')
    fireEvent.click(screen.getByRole('radio', { name: 'נקבה' }))
    fireEvent.click(screen.getByRole('switch', { name: 'עם אלבום' }))
    expect(screen.getByText(/בלי אלבום קוד/)).toBeInTheDocument()
  })

  it('hides toggles a message does not use', () => {
    renderCard({ template: { ...template, hasGender: false, hasAlbum: false, variants: { f_base: 'טקסט' } } })
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})

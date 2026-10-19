import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({ db: {}, auth: {} }))
vi.mock('firebase/firestore', () => ({}))
vi.mock('react-firebase-hooks/firestore', () => ({ useCollection: vi.fn(() => [undefined, false]) }))

const mocks = vi.hoisted(() => ({
  guides: [],
  loadGuide: vi.fn(),
  saveGuide: vi.fn(() => Promise.resolve('id')),
  deleteGuide: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../hooks/useDressGuides', () => ({
  useDressGuides: () => ({ guides: mocks.guides, loading: false }),
  loadGuide: (...a) => mocks.loadGuide(...a),
  saveGuide: (...a) => mocks.saveGuide(...a),
  deleteGuide: (...a) => mocks.deleteGuide(...a),
}))
vi.mock('../../utils/imageResize', async () => ({
  ...(await vi.importActual('../../utils/imageResize')),
  resizeImage: vi.fn(() => Promise.resolve('data:image/jpeg;base64,NEW')),
}))
const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => mockNavigate }))

import DressGuides from '../DressGuides'
import DressGuideEditor from '../DressGuideEditor'
import DressGuidePage from '../DressGuidePage'
import { DEFAULT_GUIDES, normalizeGuide } from '../../utils/dressGuides'

const LIVE = `https://yaelparzelina.github.io${import.meta.env.BASE_URL}`
const family = normalizeGuide({ ...DEFAULT_GUIDES[0], photoIds: ['p1', 'p2'], messageTemplateId: 'm1' })
const bat = normalizeGuide({ ...DEFAULT_GUIDES[1], photoIds: [] })
const photos = [{ id: 'p1', src: 'data:image/jpeg;base64,AAA' }, { id: 'p2', src: 'data:image/jpeg;base64,BBB' }]

function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path={route} element={element} /></Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.guides = [{ id: 'family', ...family }, { id: 'bat-mitzvah', ...bat }]
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true })
})

describe('DressGuides list', () => {
  it('shows every guide with a copyable public link', () => {
    renderAt('/', <DressGuides />, '/')
    expect(screen.getByText('צילומי משפחה')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'בוק בת מצווה' })).toBeInTheDocument()
    expect(screen.getByDisplayValue(`${LIVE}#/dress/family`)).toBeInTheDocument()
    fireEvent.click(screen.getAllByText('העתק קישור')[1])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${LIVE}#/dress/bat-mitzvah`)
  })

  it('deletes a guide (with its photos and message) after confirming', async () => {
    renderAt('/', <DressGuides />, '/')
    fireEvent.click(screen.getByRole('button', { name: 'מחיקת צילומי משפחה' }))
    expect(screen.getByText(/גם התמונות שלו וההודעה המוכנה/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('מחק'))
    await waitFor(() => expect(mocks.deleteGuide).toHaveBeenCalledWith(expect.objectContaining({ id: 'family', messageTemplateId: 'm1' })))
  })

  it('duplicate opens a new page that starts as a copy', () => {
    renderAt('/', <DressGuides />, '/')
    fireEvent.click(screen.getByRole('button', { name: 'שכפול בוק בת מצווה' }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/dress-guides/new', { state: { copyFrom: 'bat-mitzvah' } })
  })
})

describe('Duplicating a guide', () => {
  function renderCopy() {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/dashboard/dress-guides/new', state: { copyFrom: 'family' } }]}>
        <Routes><Route path="/dashboard/dress-guides/:slug" element={<DressGuideEditor />} /></Routes>
      </MemoryRouter>
    )
  }

  it('copies the text, colours and photos; saving creates a new page with its own copies of the photos', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: family, photos })
    renderCopy()
    expect(await screen.findByDisplayValue('צילומי משפחה (עותק)')).toBeInTheDocument()
    expect(mocks.loadGuide).toHaveBeenCalledWith('family')
    expect(screen.getByRole('heading', { name: 'שכפול דף הנחיות' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('הנחיות לבוש לצילומי משפחה')).toBeInTheDocument()
    expect(screen.getByLabelText('שם צבע 1')).toHaveValue(family.palette[0].name)
    expect(screen.getByAltText('תמונה 2')).toHaveAttribute('src', photos[1].src)

    fireEvent.click(screen.getByText('שמור'))
    await waitFor(() => expect(mocks.saveGuide).toHaveBeenCalled())
    const arg = mocks.saveGuide.mock.calls[0][0]
    expect(arg).toMatchObject({ slug: null, previous: null, previousPhotoIds: [] })
    expect(arg.form).toMatchObject({ name: 'צילומי משפחה (עותק)', palette: family.palette, tips: family.tips })
    expect(arg.form.messageTemplateId).toBeUndefined()
    expect(arg.photos.map((p) => [p.src, p.isNew])).toEqual([[photos[0].src, true], [photos[1].src, true]])
  })
})

describe('DressGuidePage (public)', () => {
  it('renders the guide content and hides empty sections', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: bat, photos: [] })
    renderAt('/dress/bat-mitzvah', <DressGuidePage />, '/dress/:slug')
    expect(await screen.findByRole('heading', { name: 'בוק בת מצווה' })).toBeInTheDocument()
    expect(mocks.loadGuide).toHaveBeenCalledWith('bat-mitzvah')
    expect(screen.getByText('מזל טוב!')).toBeInTheDocument()
    expect(screen.getByText('ירוק פיסטוק')).toBeInTheDocument()
    expect(screen.getByText(/גופיית בטן תכלת/)).toBeInTheDocument()
    expect(screen.getByLabelText('להימנע')).toBeInTheDocument()
    expect(screen.queryByText('תמונות להשראה')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /שליחת הודעה בוואטסאפ/ })).toHaveAttribute('href', 'https://wa.me/972548788851')
  })

  it('shows inspiration photos and enlarges one on click', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: family, photos })
    renderAt('/dress/family', <DressGuidePage />, '/dress/:slug')
    expect(await screen.findByText('תמונות להשראה')).toBeInTheDocument()
    expect(screen.getAllByAltText('תמונת השראה')).toHaveLength(2)
    fireEvent.click(screen.getAllByAltText('תמונת השראה')[1])
    expect(screen.getByRole('dialog', { name: 'תמונה מוגדלת' })).toBeInTheDocument()
    expect(screen.getByText('מחכה ומתרגשת ❤️')).toBeInTheDocument()
  })

  it('shows a friendly message for a missing page', async () => {
    mocks.loadGuide.mockResolvedValue(null)
    renderAt('/dress/nope', <DressGuidePage />, '/dress/:slug')
    expect(await screen.findByText('הדף לא נמצא')).toBeInTheDocument()
  })
})

describe('DressGuideEditor', () => {
  it('edits text, a tip and photos, with a live preview, and saves', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: family, photos })
    renderAt('/dashboard/dress-guides/family', <DressGuideEditor />, '/dashboard/dress-guides/:slug')
    const title = await screen.findByDisplayValue('הנחיות לבוש לצילומי משפחה')
    expect(screen.getByText('שמור').closest('button')).toBeDisabled()

    fireEvent.change(title, { target: { value: 'לבוש למשפחה' } })
    expect(screen.getByTestId('guide-preview')).toHaveTextContent('לבוש למשפחה')

    fireEvent.click(screen.getByText('הוספת הנחיה'))
    fireEvent.change(screen.getByLabelText('הנחיה 4'), { target: { value: 'להביא נעליים נוחות' } })
    fireEvent.click(screen.getByLabelText('הסר תמונה 1'))
    fireEvent.change(screen.getByLabelText('בחירת תמונות'), { target: { files: [new File(['x'], 'new.jpg', { type: 'image/jpeg' })] } })
    expect(await screen.findByAltText('תמונה 2')).toHaveAttribute('src', 'data:image/jpeg;base64,NEW')

    fireEvent.click(screen.getByText('שמור'))
    await waitFor(() => expect(mocks.saveGuide).toHaveBeenCalled())
    const arg = mocks.saveGuide.mock.calls[0][0]
    expect(arg.slug).toBe('family')
    expect(arg.form.title).toBe('לבוש למשפחה')
    expect(arg.form.tips.at(-1)).toEqual({ type: 'do', text: 'להביא נעליים נוחות' })
    expect(arg.photos.map((p) => p.id === 'p2' || p.isNew)).toEqual([true, true])
    expect(arg.previousPhotoIds).toEqual(['p1', 'p2'])
    expect(arg.previous).toBe(family)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/dress-guides')
  })

  it('on a phone, switches between the form and the preview', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: bat, photos: [] })
    renderAt('/dashboard/dress-guides/bat-mitzvah', <DressGuideEditor />, '/dashboard/dress-guides/:slug')
    await screen.findByDisplayValue('מזל טוב!')
    const preview = screen.getByTestId('guide-preview').parentElement
    expect(preview.className).toContain('hidden lg:block')
    fireEvent.click(screen.getByRole('radio', { name: 'תצוגה מקדימה' }))
    expect(preview.className).not.toContain('hidden')
    expect(screen.getByText('פרטי הדף').closest('.space-y-4').className).toContain('hidden lg:block')
  })

  it('a colour name suggests its swatch', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: bat, photos: [] })
    renderAt('/dashboard/dress-guides/bat-mitzvah', <DressGuideEditor />, '/dashboard/dress-guides/:slug')
    fireEvent.click(await screen.findByText('הוספת צבע'))
    fireEvent.change(screen.getByLabelText('שם צבע 6'), { target: { value: 'חום' } })
    expect(screen.getByLabelText('גוון לצבע 6')).toHaveValue('#6b4a35')
  })

  it('a new page requires a name and is saved without a slug', async () => {
    renderAt('/dashboard/dress-guides/new', <DressGuideEditor />, '/dashboard/dress-guides/:slug')
    fireEvent.click(screen.getByText('שמור'))
    expect(screen.getByText('יש למלא שם')).toBeInTheDocument()
    expect(mocks.saveGuide).not.toHaveBeenCalled()
    fireEvent.change(screen.getByPlaceholderText('למשל: צילומי ניובורן'), { target: { value: 'צילומי ניובורן' } })
    expect(screen.getByText(/הנחיות לבוש לצילומי ניובורן/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('שמור'))
    await waitFor(() => expect(mocks.saveGuide).toHaveBeenCalledWith(expect.objectContaining({ slug: null, previous: null })))
  })

  it('asks before leaving with unsaved changes', async () => {
    mocks.loadGuide.mockResolvedValue({ guide: bat, photos: [] })
    renderAt('/dashboard/dress-guides/bat-mitzvah', <DressGuideEditor />, '/dashboard/dress-guides/:slug')
    fireEvent.change(await screen.findByDisplayValue('מזל טוב!'), { target: { value: 'מזל טוב גדול!' } })
    fireEvent.click(screen.getByText('ביטול'))
    expect(screen.getByText('יש שינויים שלא נשמרו. לצאת בלי לשמור?')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('צא בלי לשמור'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/dress-guides')
  })
})

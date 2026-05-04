import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
}))

vi.mock('react-firebase-hooks/firestore', () => ({
  useCollectionData: vi.fn(() => [[], false]),
}))

// vi.hoisted pattern for mocks
const mockCreateType = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockUpdateType = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDeleteType = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockCreatePackage = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockUpdatePackage = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDeletePackage = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('../../hooks/usePhotoshootTypes', () => ({
  usePhotoshootTypes: () => ({
    types: [
      { id: 't1', name: 'בת מצווה', order: 0 },
      { id: 't2', name: 'בר מצווה', order: 1 },
    ],
    createType: mockCreateType,
    updateType: mockUpdateType,
    deleteType: mockDeleteType,
  }),
}))

vi.mock('../../hooks/usePackages', () => ({
  usePackagesByType: (typeId) => ({
    packages: typeId === 't1' ? [
      { id: 'p1', name: 'קלאסיק', price: 3000, photoCount: 50, locationCount: 1, includesAlbum: false, order: 0 },
    ] : [],
    createPackage: mockCreatePackage,
    updatePackage: mockUpdatePackage,
    deletePackage: mockDeletePackage,
  }),
}))

import Settings from '../Settings'

function renderSettings() {
  return render(<Settings />)
}

describe('Settings - TypesTab', () => {
  beforeEach(() => {
    mockCreateType.mockClear()
    mockUpdateType.mockClear()
    mockDeleteType.mockClear()
    mockCreatePackage.mockClear()
    mockUpdatePackage.mockClear()
    mockDeletePackage.mockClear()
  })

  it('renders the add-type form with input and submit button', () => {
    renderSettings()
    expect(screen.getByPlaceholderText('שם סוג צילום חדש')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /הוסף/ })).toBeInTheDocument()
  })

  it('calls createType when form is submitted with a value', async () => {
    renderSettings()
    const input = screen.getByPlaceholderText('שם סוג צילום חדש')
    fireEvent.change(input, { target: { value: 'הריון' } })
    fireEvent.submit(input.closest('form'))
    await waitFor(() => expect(mockCreateType).toHaveBeenCalledWith('הריון'))
  })

  it('does NOT call createType if input is empty', async () => {
    renderSettings()
    const input = screen.getByPlaceholderText('שם סוג צילום חדש')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(input.closest('form'))
    await waitFor(() => expect(mockCreateType).not.toHaveBeenCalled())
  })

  it('shows existing types from hook', () => {
    renderSettings()
    expect(screen.getByText('בת מצווה')).toBeInTheDocument()
    expect(screen.getByText('בר מצווה')).toBeInTheDocument()
  })

  it('edit button shows input with type name; Check saves via updateType; X cancels', async () => {
    renderSettings()
    const editButtons = screen.getAllByRole('button', { name: '' }).filter(
      (btn) => btn.querySelector('svg')
    )
    // Find edit button for 'בת מצווה' (first type)
    const typeRow = screen.getByText('בת מצווה').closest('div[class*="rounded-xl"]')
    const editBtn = typeRow.querySelector('button:has(svg)')
    // Use Edit2 icon button - it's a button that contains the Edit2 svg
    // Find all buttons within the row and pick the edit one (second after the up/down arrows)
    const allBtnsInRow = Array.from(typeRow.querySelectorAll('button'))
    // buttons: ChevronUp, ChevronDown, Edit2, Trash2
    const editButton = allBtnsInRow[2]
    fireEvent.click(editButton)

    // Input should appear with current name
    const editInput = screen.getByDisplayValue('בת מצווה')
    expect(editInput).toBeInTheDocument()

    // Change the name
    fireEvent.change(editInput, { target: { value: 'בת מצווה מעודכן' } })

    // Find the green check button
    const checkBtn = editInput.closest('div[class*="rounded-xl"]').querySelector('button.text-green-600')
    fireEvent.click(checkBtn)

    await waitFor(() => expect(mockUpdateType).toHaveBeenCalledWith('t1', { name: 'בת מצווה מעודכן' }))
  })

  it('X button cancels editing without calling updateType', async () => {
    renderSettings()
    const typeRow = screen.getByText('בת מצווה').closest('div[class*="rounded-xl"]')
    const allBtnsInRow = Array.from(typeRow.querySelectorAll('button'))
    const editButton = allBtnsInRow[2]
    fireEvent.click(editButton)

    // Input should appear
    const editInput = screen.getByDisplayValue('בת מצווה')
    expect(editInput).toBeInTheDocument()

    // Click X button to cancel
    const cancelBtn = editInput.closest('div[class*="rounded-xl"]').querySelector('button.text-gray-400')
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(mockUpdateType).not.toHaveBeenCalled()
      expect(screen.getByText('בת מצווה')).toBeInTheDocument()
    })
  })

  it('delete button opens ConfirmDialog; confirming calls deleteType; canceling closes dialog', async () => {
    renderSettings()
    const typeRow = screen.getByText('בת מצווה').closest('div[class*="rounded-xl"]')
    const allBtnsInRow = Array.from(typeRow.querySelectorAll('button'))
    // buttons: ChevronUp, ChevronDown, Edit2, Trash2
    const deleteButton = allBtnsInRow[3]
    fireEvent.click(deleteButton)

    // Dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('מחיקת סוג צילום')).toBeInTheDocument()

    // Cancel
    fireEvent.click(screen.getByText('בטל'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockDeleteType).not.toHaveBeenCalled()

    // Open again and confirm
    fireEvent.click(deleteButton)
    fireEvent.click(screen.getByText('מחק'))
    await waitFor(() => expect(mockDeleteType).toHaveBeenCalledWith('t1'))
  })

  it('up/down arrow buttons call updateType with swapped order values; up disabled on first item; down disabled on last item', async () => {
    renderSettings()
    // Get all type rows
    const type1Row = screen.getByText('בת מצווה').closest('div[class*="rounded-xl"]')
    const type2Row = screen.getByText('בר מצווה').closest('div[class*="rounded-xl"]')

    const type1Btns = Array.from(type1Row.querySelectorAll('button'))
    const type2Btns = Array.from(type2Row.querySelectorAll('button'))

    // ChevronUp on first item should be disabled
    expect(type1Btns[0]).toBeDisabled()
    // ChevronDown on last item should be disabled
    expect(type2Btns[1]).toBeDisabled()

    // Click down arrow on first item (move t1 down)
    fireEvent.click(type1Btns[1])
    await waitFor(() => {
      expect(mockUpdateType).toHaveBeenCalledWith('t1', { order: 1 })
      expect(mockUpdateType).toHaveBeenCalledWith('t2', { order: 0 })
    })
  })
})

describe('Settings - PackagesTab', () => {
  beforeEach(() => {
    mockCreateType.mockClear()
    mockUpdateType.mockClear()
    mockDeleteType.mockClear()
    mockCreatePackage.mockClear()
    mockUpdatePackage.mockClear()
    mockDeletePackage.mockClear()
  })

  function switchToPackagesTab() {
    renderSettings()
    fireEvent.click(screen.getByText('חבילות'))
  }

  it('shows photoshoot type dropdown with options from hook', () => {
    switchToPackagesTab()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('בת מצווה')).toBeInTheDocument()
    expect(screen.getByText('בר מצווה')).toBeInTheDocument()
  })

  it('selecting a type loads packages for that type', async () => {
    switchToPackagesTab()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 't1' } })
    await waitFor(() => expect(screen.getByText('קלאסיק')).toBeInTheDocument())
  })

  it('shows package name, price, photo count in display mode', async () => {
    switchToPackagesTab()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 't1' } })
    await waitFor(() => {
      expect(screen.getByText('קלאסיק')).toBeInTheDocument()
      expect(screen.getByText(/3,000|3000/)).toBeInTheDocument()
      expect(screen.getByText(/50 תמונות/)).toBeInTheDocument()
    })
  })

  it('edit button shows PkgFields; saving calls updatePackage with correct numeric conversions', async () => {
    switchToPackagesTab()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 't1' } })

    await waitFor(() => expect(screen.getByText('קלאסיק')).toBeInTheDocument())

    // Find and click edit button on the package
    const pkgRow = screen.getByText('קלאסיק').closest('div[class*="rounded-xl"]')
    const editBtn = pkgRow.querySelector('button.text-gray-400')
    fireEvent.click(editBtn)

    // PkgFields should be visible now
    await waitFor(() => expect(screen.getByDisplayValue('קלאסיק')).toBeInTheDocument())

    // Change price
    const priceInput = screen.getByDisplayValue('3000')
    fireEvent.change(priceInput, { target: { value: '3500' } })

    // Click save
    fireEvent.click(screen.getByText('שמור'))

    await waitFor(() => expect(mockUpdatePackage).toHaveBeenCalledWith('p1', expect.objectContaining({
      name: 'קלאסיק',
      price: 3500,
      photoCount: 50,
      locationCount: 1,
      includesAlbum: false,
    })))
  })

  it('"הוסף חבילה" button (dashed border) shows new package form; confirming calls createPackage', async () => {
    switchToPackagesTab()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 't1' } })

    await waitFor(() => expect(screen.getByText('קלאסיק')).toBeInTheDocument())

    // Click the dashed-border add button
    const addBtn = screen.getByText('הוסף חבילה')
    fireEvent.click(addBtn)

    // New package form should appear
    await waitFor(() => expect(screen.getByText('חבילה חדשה')).toBeInTheDocument())

    // Fill in name
    const nameInputs = screen.getAllByRole('textbox')
    // Find the שם חבילה input (first text input in the new form area)
    const newFormSection = screen.getByText('חבילה חדשה').closest('div[class*="rounded-xl"]')
    const nameInput = newFormSection.querySelector('input[type="text"], input:not([type="number"])')
    fireEvent.change(nameInput, { target: { value: 'פרימיום' } })

    // Fill in price
    const numberInputs = newFormSection.querySelectorAll('input[type="number"]')
    fireEvent.change(numberInputs[0], { target: { value: '5000' } })
    fireEvent.change(numberInputs[1], { target: { value: '100' } })

    // Click confirm
    fireEvent.click(screen.getByText('הוסף חבילה', { selector: 'button.bg-gray-900' }))

    await waitFor(() => expect(mockCreatePackage).toHaveBeenCalledWith(expect.objectContaining({
      photoshootTypeId: 't1',
      name: 'פרימיום',
      price: 5000,
      photoCount: 100,
      includesAlbum: false,
    })))
  })

  it('delete button on package opens ConfirmDialog; confirming calls deletePackage', async () => {
    switchToPackagesTab()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 't1' } })

    await waitFor(() => expect(screen.getByText('קלאסיק')).toBeInTheDocument())

    const pkgRow = screen.getByText('קלאסיק').closest('div[class*="rounded-xl"]')
    const buttons = Array.from(pkgRow.querySelectorAll('button'))
    const deleteBtn = buttons[buttons.length - 1]
    fireEvent.click(deleteBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('מחיקת חבילה')).toBeInTheDocument()

    fireEvent.click(screen.getByText('מחק'))
    await waitFor(() => expect(mockDeletePackage).toHaveBeenCalledWith('p1'))
  })

  it('PkgFields album toggle: clicking toggles includesAlbum; album fields appear when true, hidden when false', async () => {
    switchToPackagesTab()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 't1' } })

    await waitFor(() => expect(screen.getByText('קלאסיק')).toBeInTheDocument())

    // Open edit form
    const pkgRow = screen.getByText('קלאסיק').closest('div[class*="rounded-xl"]')
    const editBtn = pkgRow.querySelector('button.text-gray-400')
    fireEvent.click(editBtn)

    await waitFor(() => expect(screen.getByLabelText('החלף כולל אלבום')).toBeInTheDocument())

    // Album fields should not be visible initially (includesAlbum = false)
    expect(screen.queryByPlaceholderText('30x30')).not.toBeInTheDocument()

    // Click toggle
    fireEvent.click(screen.getByLabelText('החלף כולל אלבום'))

    // Album fields should appear
    await waitFor(() => expect(screen.getByPlaceholderText('30x30')).toBeInTheDocument())

    // Click toggle again to hide
    fireEvent.click(screen.getByLabelText('החלף כולל אלבום'))
    await waitFor(() => expect(screen.queryByPlaceholderText('30x30')).not.toBeInTheDocument())
  })
})

describe('Settings shell', () => {
  it('"סוגי צילום" tab is active by default; shows TypesTab content', () => {
    renderSettings()
    expect(screen.getByPlaceholderText('שם סוג צילום חדש')).toBeInTheDocument()
    expect(screen.getByText('בת מצווה')).toBeInTheDocument()
  })

  it('clicking "חבילות" tab switches to PackagesTab content', () => {
    renderSettings()
    // TypesTab is showing
    expect(screen.getByPlaceholderText('שם סוג צילום חדש')).toBeInTheDocument()

    // Switch to packages tab
    fireEvent.click(screen.getByText('חבילות'))

    // PackagesTab content should be shown
    expect(screen.queryByPlaceholderText('שם סוג צילום חדש')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('בחר סוג צילום')).toBeInTheDocument()
  })
})

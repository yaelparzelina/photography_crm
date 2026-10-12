// Shared class names for form controls and surfaces.

export function inputClass(hasError = false) {
  return `w-full border rounded-lg ps-4 pe-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400 ${hasError ? 'border-red-400' : 'border-gray-200'}`
}

export const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

export const cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm'

// Nested item inside a card (document boxes, settings list rows)
export const itemClass = 'bg-white border border-gray-100 rounded-xl'

// Big tables scroll inside a box no taller than the screen (and sideways when wide),
// so the column names in the header can stay pinned at the top while scrolling down.
export const tableBoxClass = `${cardClass} overflow-auto max-h-[calc(100dvh-8rem)]`
// Header cell that stays visible; the inset shadow replaces the border that sticky cells lose
export const stickyThClass = 'sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-1px_0_#f3f4f6]'

export const backdropClass = 'absolute inset-0 bg-black/40 backdrop-blur-sm'

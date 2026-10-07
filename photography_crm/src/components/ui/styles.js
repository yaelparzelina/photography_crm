// Shared class names for form controls and surfaces.

export function inputClass(hasError = false) {
  return `w-full border rounded-lg ps-4 pe-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400 ${hasError ? 'border-red-400' : 'border-gray-200'}`
}

export const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

export const cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm'

// Nested item inside a card (document boxes, settings list rows)
export const itemClass = 'bg-white border border-gray-100 rounded-xl'

export const backdropClass = 'absolute inset-0 bg-black/40 backdrop-blur-sm'

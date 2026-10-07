import { useEffect } from 'react'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import { backdropClass } from './styles'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className={backdropClass} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          {title
            ? <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
            : <span />
          }
          <IconButton label="סגור" onClick={onClose}><X className="w-5 h-5" /></IconButton>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Footer row for modal/dialog/form actions: cancel first, primary last (left side in RTL).
export function ModalActions({ children }) {
  return <div className="flex flex-wrap items-center justify-end gap-3 pt-2">{children}</div>
}

import { useEffect } from 'react'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import { backdropClass } from './styles'

// `footer` stays pinned to the bottom of the dialog while the content scrolls.
// On a phone the dialog is a sheet rising from the bottom of the screen; the page behind it doesn't scroll.
export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = overflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className={backdropClass} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${maxWidth} max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain`}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          {title
            ? <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
            : <span />
          }
          <IconButton label="סגור" onClick={onClose} className="!p-2 -m-1"><X className="w-5 h-5" /></IconButton>
        </div>
        <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">{children}</div>
        {footer && (
          <div className="sticky bottom-0 z-10 bg-white sm:rounded-b-2xl px-4 sm:px-6 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-gray-100 [&>*]:pt-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Footer row for modal/dialog/form actions: cancel first, primary last (left side in RTL).
export function ModalActions({ children }) {
  return <div className="flex flex-wrap items-center justify-end gap-3 pt-2">{children}</div>
}

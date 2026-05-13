import { useEffect } from 'react'

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'אישור', onConfirm, onCancel, destructive = false, extraAction = null }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            בטל
          </button>
          {extraAction && (
            <button onClick={extraAction.onClick}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
              {extraAction.label}
            </button>
          )}
          <button onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

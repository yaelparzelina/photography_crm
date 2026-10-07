import { useEffect } from 'react'
import Button from './Button'
import { ModalActions } from './Modal'
import { backdropClass } from './styles'

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'אישור', onConfirm, onCancel, destructive = false, extraAction = null }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={backdropClass} onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{message}</p>
        <ModalActions>
          <Button variant="secondary" onClick={onCancel}>בטל</Button>
          {extraAction && <Button onClick={extraAction.onClick}>{extraAction.label}</Button>}
          <Button variant={destructive ? 'dangerSolid' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </ModalActions>
      </div>
    </div>
  )
}

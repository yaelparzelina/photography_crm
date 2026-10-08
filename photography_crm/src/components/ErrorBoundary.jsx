import { Component } from 'react'
import Button from './ui/Button'
import { cardClass } from './ui/styles'

// Shows a recovery screen instead of a blank page when something crashes while rendering.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed', error, info?.componentStack)
  }

  clearDraftsAndReload = () => {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('draft_')).forEach((k) => localStorage.removeItem(k))
    } catch { /* ignore */ }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className={`${cardClass} p-8 max-w-md w-full text-center`}>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">משהו השתבש</h1>
          <p className="text-sm text-gray-600 mb-6">
            אירעה שגיאה בטעינת הדף. אפשר לנסות לטעון מחדש, או לנקות שינויים שלא נשמרו ולטעון מחדש.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>טען מחדש</Button>
            <Button onClick={this.clearDraftsAndReload}>נקה שינויים שלא נשמרו וטען מחדש</Button>
          </div>
        </div>
      </div>
    )
  }
}

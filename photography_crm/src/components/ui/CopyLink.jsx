import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Button from './Button'

// Read-only URL field with a "copy" action underneath.
export default function CopyLink({ url, children }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <input readOnly value={url}
        className="w-full text-xs border border-gray-200 rounded-lg ps-3 pe-3 py-2 bg-gray-50 text-gray-600" />
      <div className="flex items-center gap-4">
        <Button variant="link" size="sm" onClick={copy}>
          {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> הועתק!</> : <><Copy className="w-3.5 h-3.5" /> העתק קישור</>}
        </Button>
        {children}
      </div>
    </div>
  )
}

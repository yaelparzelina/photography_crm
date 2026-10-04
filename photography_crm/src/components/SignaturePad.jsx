import { useRef, useEffect, useState } from 'react'

export default function SignaturePad({ onChange, hasError = false, height = 180 }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext?.('2d')
    if (!ctx) return
    const ratio = window.devicePixelRatio || 1
    const width = canvas.offsetWidth || 600
    canvas.width = width * ratio
    canvas.height = height * ratio
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }, [height])

  function point(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleDown(e) {
    const ctx = canvasRef.current?.getContext?.('2d')
    if (!ctx) return
    e.preventDefault()
    canvasRef.current.setPointerCapture?.(e.pointerId)
    drawingRef.current = true
    const p = point(e)
    lastRef.current = p
    ctx.beginPath()
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = ctx.strokeStyle
    ctx.fill()
  }

  function handleMove(e) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastRef.current = p
  }

  function handleUp() {
    if (!drawingRef.current) return
    drawingRef.current = false
    setEmpty(false)
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext?.('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div className={`relative border rounded-lg bg-white ${hasError ? 'border-red-400' : 'border-gray-200'}`}>
        <canvas ref={canvasRef} data-testid="signature-canvas"
          style={{ width: '100%', height, touchAction: 'none', display: 'block' }}
          onPointerDown={handleDown} onPointerMove={handleMove}
          onPointerUp={handleUp} onPointerLeave={handleUp} onPointerCancel={handleUp} />
        {empty && (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none select-none">
            חתום/י כאן
          </span>
        )}
      </div>
      <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 mt-1">
        נקה חתימה
      </button>
    </div>
  )
}

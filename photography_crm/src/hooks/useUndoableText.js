import { useRef } from 'react'

const GROUP_MS = 700 // consecutive typing within this window is undone as one step

// Undo/redo history for a controlled text value.
// Returns change(next, { group }) to use instead of onChange, plus undo/redo and a keydown handler
// (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z — matched by physical key so it also works on a Hebrew layout).
export function useUndoableText(value, onChange) {
  const past = useRef([])
  const future = useRef([])
  const lastChange = useRef(0)

  function change(next, { group = false } = {}) {
    if (next === value) return
    const now = Date.now()
    if (!group || now - lastChange.current > GROUP_MS || past.current.length === 0) {
      past.current.push(value)
    }
    lastChange.current = group ? now : 0
    future.current = []
    onChange(next)
  }

  function undo() {
    if (!past.current.length) return false
    future.current.push(value)
    lastChange.current = 0
    onChange(past.current.pop())
    return true
  }

  function redo() {
    if (!future.current.length) return false
    past.current.push(value)
    lastChange.current = 0
    onChange(future.current.pop())
    return true
  }

  function onKeyDown(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return
    const isZ = e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z'
    const isY = e.code === 'KeyY' || e.key === 'y' || e.key === 'Y'
    if (isZ && !e.shiftKey) { e.preventDefault(); undo() }
    else if (isY || (isZ && e.shiftKey)) { e.preventDefault(); redo() }
  }

  return { change, undo, redo, onKeyDown }
}

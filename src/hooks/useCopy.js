import { useCallback, useEffect, useRef, useState } from 'react'

async function writeText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Falls through to the textarea path, e.g. clipboard permission denied.
    }
  }

  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  const copied = document.execCommand?.('copy') ?? false
  area.remove()
  return copied
}

/** Tracks which button was last copied so the UI can flash confirmation. */
export function useCopy(resetAfter = 1600) {
  const [copiedKey, setCopiedKey] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(
    async (key, text) => {
      const ok = await writeText(text)
      setCopiedKey(ok ? key : null)
      window.clearTimeout(timer.current)
      if (ok) timer.current = window.setTimeout(() => setCopiedKey(null), resetAfter)
      return ok
    },
    [resetAfter],
  )

  return { copiedKey, copy }
}

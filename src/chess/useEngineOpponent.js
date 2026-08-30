import { useEffect, useRef } from 'react'
import { chooseMove, DEFAULT_LEVEL, LEVELS } from './engine'

// A short pause before the reply lands: an instant answer reads as a glitch.
const MIN_THINK_MS = 380

/**
 * Plays the given colour with the built-in engine. The search runs off a timer
 * so the board can paint the "thinking" state first, and a reply is discarded
 * if the position moved on (undo, reset, a new opponent choice) meanwhile.
 */
export function useEngineOpponent({
  side,
  level = DEFAULT_LEVEL,
  fen,
  turn,
  isGameOver,
  paused,
  onMove,
}) {
  const onMoveRef = useRef(onMove)
  const active = Boolean(side) && side === turn && !isGameOver && !paused

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    let later = 0
    const settings = LEVELS[level] ?? LEVELS[DEFAULT_LEVEL]
    const started = Date.now()

    const timer = window.setTimeout(() => {
      const reply = chooseMove(fen, settings)
      if (cancelled) return
      const wait = Math.max(0, MIN_THINK_MS - (Date.now() - started))

      later = window.setTimeout(() => {
        if (cancelled) return
        if (reply) onMoveRef.current(reply.from, reply.to, reply.promotion)
      }, wait)
    }, 30)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.clearTimeout(later)
    }
  }, [active, fen, level])

  return { thinking: active }
}

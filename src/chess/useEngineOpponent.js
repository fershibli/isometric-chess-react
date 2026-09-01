import { useEffect, useRef, useState } from 'react'
import { chooseMove, DEFAULT_LEVEL, LEVELS } from './engine'

const FALLBACK_THINK = [450, 1000]

// How long the piece stays in the air between being picked up and being put
// down. Unlike the thinking pause this is a physical gesture, not a decision,
// so it barely varies.
const HOLD_MS = [300, 480]

function between([min, max], rng) {
  return min + rng() * (max - min)
}

/**
 * Plays the given colour with the built-in engine.
 *
 * A reply lands in two beats: the engine picks the piece up, and only after a
 * pause does it put it down. Watching a piece appear on its destination reads
 * as a glitch; watching one lift, hang for a moment and land reads as an
 * opponent moving it. The thinking pause before the lift is drawn fresh each
 * time — a real opponent does not answer on a metronome.
 *
 * The search itself runs off a timer so the board can paint first, and a reply
 * is discarded if the position moved on (undo, reset, a pause) meanwhile.
 */
export function useEngineOpponent({
  side,
  level = DEFAULT_LEVEL,
  fen,
  turn,
  isGameOver,
  paused,
  onMove,
  rng = Math.random,
}) {
  const onMoveRef = useRef(onMove)
  const [holding, setHolding] = useState(null)
  const active = Boolean(side) && side === turn && !isGameOver && !paused

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  useEffect(() => {
    if (!active) {
      setHolding(null)
      return undefined
    }

    let cancelled = false
    let drop = 0
    let lift = 0
    const settings = LEVELS[level] ?? LEVELS[DEFAULT_LEVEL]
    const started = Date.now()
    const thinkFor = between(settings.think ?? FALLBACK_THINK, rng)
    const holdFor = between(HOLD_MS, rng)

    const search = window.setTimeout(() => {
      const reply = chooseMove(fen, settings)
      if (cancelled || !reply) return

      // A slow search has already spent the thinking pause; only what is left
      // of it is waited out.
      lift = window.setTimeout(
        () => {
          if (cancelled) return
          setHolding(reply.from)

          drop = window.setTimeout(() => {
            if (cancelled) return
            onMoveRef.current(reply.from, reply.to, reply.promotion)
            setHolding(null)
          }, holdFor)
        },
        Math.max(0, thinkFor - (Date.now() - started)),
      )
    }, 30)

    return () => {
      cancelled = true
      window.clearTimeout(search)
      window.clearTimeout(lift)
      window.clearTimeout(drop)
    }
    // `rng` is sampled once per reply and must not restart the sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, fen, level])

  return { thinking: active && !holding, holding }
}

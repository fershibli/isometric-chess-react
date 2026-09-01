/*
 * The board is treated as a shallow pool. Two things move it: a permanent
 * swell that never quite settles, and the ring thrown out when a piece lands.
 * Both come from the same trick — feed the square's x and y into sine and
 * cosine at slightly different rates so neighbouring squares are always a
 * little out of step with each other.
 */

/** Where this square sits in the idle swell, in the range -2..2. */
export function wavePhase(row, col) {
  return Math.sin(col * 0.9 + row * 0.45) + Math.cos(row * 0.85 - col * 0.35)
}

export const RIPPLE_SPEED_MS = 52
export const RIPPLE_DURATION_MS = 900
export const RIPPLE_REACH = 7

/**
 * Timing and height for one square's part in a ripple centred on `origin`.
 * The front travels outward at a fixed speed and loses height exponentially,
 * so the far corners barely stir. Returns null past the point where the
 * movement would be sub-pixel anyway.
 */
export function rippleAt(row, col, origin, strength = 1) {
  if (!origin || strength <= 0) return null

  const distance = Math.hypot(row - origin.row, col - origin.col)
  if (distance > RIPPLE_REACH) return null

  const decay = Math.exp(-distance / 3.2)
  const height = (5 + 11 * decay) * strength
  if (height < 0.4) return null

  return {
    distance,
    delay: distance * RIPPLE_SPEED_MS,
    height,
    // A square right under the impact is pushed down first; the ring around it
    // is what rises. Everything past the first square rides the wave up.
    inverted: distance < 0.8,
  }
}

/** Total time a ripple needs to cross the board and settle. */
export function rippleLifetime() {
  return RIPPLE_REACH * RIPPLE_SPEED_MS + RIPPLE_DURATION_MS
}

import { describe, expect, it } from 'vitest'
import { RIPPLE_REACH, rippleAt, wavePhase } from './water'

describe('idle swell', () => {
  it('stays inside the range the CSS delay assumes', () => {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const phase = wavePhase(row, col)
        expect(phase).toBeGreaterThanOrEqual(-2)
        expect(phase).toBeLessThanOrEqual(2)
      }
    }
  })

  it('never gives two neighbours the same phase', () => {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        expect(wavePhase(row, col)).not.toBeCloseTo(wavePhase(row, col + 1), 3)
      }
    }
  })
})

describe('ripple', () => {
  const origin = { row: 4, col: 4 }

  it('reaches far squares later than near ones', () => {
    const near = rippleAt(4, 5, origin)
    const far = rippleAt(4, 7, origin)
    expect(far.delay).toBeGreaterThan(near.delay)
  })

  it('loses height with distance', () => {
    const near = rippleAt(4, 5, origin)
    const far = rippleAt(4, 7, origin)
    expect(far.height).toBeLessThan(near.height)
  })

  it('pushes the struck square down and lifts the ring around it', () => {
    expect(rippleAt(4, 4, origin).inverted).toBe(true)
    expect(rippleAt(4, 5, origin).inverted).toBe(false)
  })

  it('stops once the wave is out of reach or switched off', () => {
    expect(rippleAt(4, 4 + RIPPLE_REACH + 1, origin)).toBeNull()
    expect(rippleAt(4, 5, origin, 0)).toBeNull()
    expect(rippleAt(4, 5, null)).toBeNull()
  })

  it('scales height with the configured strength', () => {
    expect(rippleAt(4, 5, origin, 1).height).toBeGreaterThan(rippleAt(4, 5, origin, 0.4).height)
  })
})

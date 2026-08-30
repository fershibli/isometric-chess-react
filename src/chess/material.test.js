import { describe, expect, it } from 'vitest'
import { capturedPieces, materialBalance } from './material'

const history = [
  { color: 'w', captured: 'p' },
  { color: 'b', captured: 'n' },
  { color: 'w' },
  { color: 'w', captured: 'q' },
]

describe('material tracking', () => {
  it('attributes captures to the side that lost the piece', () => {
    const lost = capturedPieces(history)
    expect(lost.b).toEqual(['q', 'p'])
    expect(lost.w).toEqual(['n'])
  })

  it('scores the balance from White’s point of view', () => {
    expect(materialBalance(capturedPieces(history))).toBe(7)
    expect(materialBalance(capturedPieces([]))).toBe(0)
  })
})

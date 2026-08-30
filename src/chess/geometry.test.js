import { describe, expect, it } from 'vitest'
import {
  FILES,
  SIZE,
  edgeLabels,
  forEachSquare,
  projectRC,
  rcFromSquare,
  rotateRC,
  squareFromRC,
  unrotateRC,
} from './geometry'

describe('square helpers', () => {
  it('maps row/col to algebraic squares', () => {
    expect(squareFromRC(6, 4)).toBe('e2')
    expect(squareFromRC(0, 0)).toBe('a8')
    expect(squareFromRC(7, 7)).toBe('h1')
  })

  it('round-trips every square', () => {
    forEachSquare((row, col) => {
      expect(rcFromSquare(squareFromRC(row, col))).toEqual({ row, col })
    })
  })
})

describe('view rotation', () => {
  it('returns to the start after four quarter turns', () => {
    forEachSquare((row, col) => {
      expect(rotateRC(row, col, 4)).toEqual({ row, col })
    })
  })

  it('is undone by unrotateRC for every rotation', () => {
    for (let steps = 0; steps < 4; steps += 1) {
      forEachSquare((row, col) => {
        const view = rotateRC(row, col, steps)
        expect(unrotateRC(view.row, view.col, steps)).toEqual({ row, col })
      })
    }
  })
})

describe('edge labels', () => {
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8']

  it('labels the two near edges with every file and every rank', () => {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const labels = edgeLabels(rotation)
      const left = labels.filter((label) => label.by === SIZE).map((label) => label.text)
      const right = labels.filter((label) => label.bx === SIZE).map((label) => label.text)

      expect(labels).toHaveLength(2 * SIZE)
      expect([...left].sort()).toEqual(
        left.includes('a') ? [...FILES] : ranks,
      )
      expect([...right].sort()).toEqual(
        right.includes('a') ? [...FILES] : ranks,
      )
      expect(left.includes('a')).not.toBe(right.includes('a'))
    }
  })

  it('puts files along white’s home edge in the default view', () => {
    const labels = edgeLabels(0)
    expect(labels.filter((label) => label.by === SIZE).map((label) => label.text)).toEqual([...FILES])
  })
})

describe('isometric projection', () => {
  it('puts white nearest the viewer by default', () => {
    const a8 = projectRC(0, 0, 0)
    const h1 = projectRC(7, 7, 0)
    expect(a8.depth).toBeLessThan(h1.depth)
  })

  it('keeps depth unique per diagonal and inside the board', () => {
    forEachSquare((row, col) => {
      const { bx, by, depth } = projectRC(row, col, 1)
      expect(bx).toBeGreaterThanOrEqual(0)
      expect(by).toBeLessThan(SIZE)
      expect(depth).toBe(bx + by)
    })
  })
})

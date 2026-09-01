import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { chooseMove, evaluate, LEVELS } from './engine'

const fixed = { jitter: 0, rng: () => 0 }

function sanFor(fen, options) {
  const move = chooseMove(fen, options)
  if (!move) return null
  return new Chess(fen).move(move).san
}

describe('evaluate', () => {
  it('scores a fresh position as level', () => {
    expect(evaluate(new Chess())).toBe(0)
  })

  it('reads a missing black queen as a white advantage', () => {
    expect(evaluate(new Chess('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'))).
      toBeGreaterThan(800)
  })
})

describe('chooseMove', () => {
  const FREE_QUEEN = 'rnbqkbnr/ppp1pppp/8/3Q4/8/8/PPPPPPPP/RNB1KBNR b KQkq - 0 1'

  it('takes a free queen', () => {
    // One ply is all this needs, and it is the depth that stays honest: a full
    // depth-2 search of this position runs for seconds, so the old version of
    // this test was really measuring whether the machine was busy.
    expect(sanFor(FREE_QUEEN, { depth: 1, budgetMs: 4000, ...fixed })).toBe('Qxd5')
  })

  it('still plays the best-ordered move when the search never finishes', () => {
    // budgetMs of 1 aborts before the first iteration completes, so this is the
    // fallback path. It has to be a real reply, not an arbitrary legal one.
    expect(sanFor(FREE_QUEEN, { depth: 3, budgetMs: 1, jitter: 90, rng: () => 0.99 })).toBe(
      'Qxd5',
    )
  })

  it('plays the mate when there is one', () => {
    expect(sanFor('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1', { depth: 2, ...fixed })).toBe('Ra8#')
  })

  it('promotes rather than leave the pawn to be taken', () => {
    // Black's king sits next to the pawn, so delaying the promotion loses it.
    const san = sanFor('8/P7/1k6/8/8/8/8/4K3 w - - 0 1', { depth: 2, ...fixed })
    expect(san).toMatch(/^a8=Q/)
  })

  it('returns nothing once the game is over', () => {
    expect(chooseMove('7k/5QQ1/8/8/8/8/8/K7 b - - 0 1', { depth: 1 })).toBeNull()
  })

  it('ignores a FEN it cannot read', () => {
    expect(chooseMove('not a position', { depth: 1 })).toBeNull()
  })

  it('only ever suggests legal moves', () => {
    const game = new Chess()
    for (let ply = 0; ply < 12 && !game.isGameOver(); ply += 1) {
      // A tight budget on purpose: this is about the move always being legal,
      // including on the path where the search is cut off before it finishes.
      const move = chooseMove(game.fen(), {
        depth: 1,
        jitter: 40,
        budgetMs: 120,
        rng: Math.random,
      })
      expect(() => game.move(move)).not.toThrow()
    }
    expect(game.history().length).toBe(12)
  })

  it('varies its openings on the casual level', () => {
    const seen = new Set()
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const move = chooseMove(new Chess().fen(), LEVELS.casual)
      seen.add(`${move.from}${move.to}`)
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('respects the time budget', () => {
    const started = Date.now()
    chooseMove('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5', {
      depth: 4,
      budgetMs: 200,
      ...fixed,
    })
    expect(Date.now() - started).toBeLessThan(2500)
  })
})

import { PIECE_VALUES } from './pieces'

const ORDER = { q: 0, r: 1, b: 2, n: 3, p: 4 }

/** Pieces each side has lost, heaviest first. */
export function capturedPieces(history) {
  const lost = { w: [], b: [] }
  for (const move of history) {
    if (!move.captured) continue
    const victim = move.color === 'w' ? 'b' : 'w'
    lost[victim].push(move.captured)
  }
  lost.w.sort((a, b) => ORDER[a] - ORDER[b])
  lost.b.sort((a, b) => ORDER[a] - ORDER[b])
  return lost
}

function total(types) {
  return types.reduce((sum, type) => sum + PIECE_VALUES[type], 0)
}

/** Positive when White is ahead on material. */
export function materialBalance(lost) {
  return total(lost.b) - total(lost.w)
}

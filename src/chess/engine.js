import { Chess } from 'chess.js'

const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

const MATE = 100000

// Squares run a8 (index 0) to h1 (index 63), matching the order of chess.js
// `board()`. Black reads the same tables through a vertically mirrored index.
const TABLES = {
  p: [
      0,   0,   0,   0,   0,   0,   0,   0,
     55,  55,  55,  55,  55,  55,  55,  55,
     11,  15,  22,  28,  28,  22,  15,  11,
      5,   8,  13,  24,  24,  13,   8,   5,
      0,   0,   3,  20,  20,   3,   0,   0,
      4,  -4,  -8,   0,   0,  -8,  -4,   4,
      4,   8,   8, -18, -18,   8,   8,   4,
      0,   0,   0,   0,   0,   0,   0,   0,
  ],
  n: [
    -50, -35, -25, -25, -25, -25, -35, -50,
    -35, -18,   0,   0,   0,   0, -18, -35,
    -25,   0,  12,  16,  16,  12,   0, -25,
    -25,   4,  16,  20,  20,  16,   4, -25,
    -25,   0,  16,  20,  20,  16,   0, -25,
    -25,   4,  12,  16,  16,  12,   4, -25,
    -35, -18,   0,   4,   4,   0, -18, -35,
    -50, -30, -25, -25, -25, -25, -30, -50,
  ],
  b: [
    -18,  -8,  -8,  -8,  -8,  -8,  -8, -18,
     -8,   0,   0,   0,   0,   0,   0,  -8,
     -8,   0,   5,  10,  10,   5,   0,  -8,
     -8,   5,   5,  10,  10,   5,   5,  -8,
     -8,   0,  10,  10,  10,  10,   0,  -8,
     -8,  10,  10,  10,  10,  10,  10,  -8,
     -8,   5,   0,   0,   0,   0,   5,  -8,
    -18,  -8, -14,  -8,  -8, -14,  -8, -18,
  ],
  r: [
      0,   0,   0,   0,   0,   0,   0,   0,
      6,  12,  12,  12,  12,  12,  12,   6,
     -6,   0,   0,   0,   0,   0,   0,  -6,
     -6,   0,   0,   0,   0,   0,   0,  -6,
     -6,   0,   0,   0,   0,   0,   0,  -6,
     -6,   0,   0,   0,   0,   0,   0,  -6,
     -6,   0,   0,   0,   0,   0,   0,  -6,
      0,   0,   0,   6,   6,   3,   0,   0,
  ],
  q: [
    -18, -10, -10,  -4,  -4, -10, -10, -18,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,   5,   5,   5,   0, -10,
     -4,   0,   5,   5,   5,   5,   0,  -4,
      0,   0,   5,   5,   5,   5,   0,  -4,
    -10,   5,   5,   5,   5,   5,   0, -10,
    -10,   0,   5,   0,   0,   0,   0, -10,
    -18, -10, -10,  -4,  -4, -10, -10, -18,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
     20,  20,   0,   0,   0,   0,  20,  20,
     20,  30,  10,   0,   0,  10,  30,  20,
  ],
}

// Once the queens and rooks are gone the king should walk to the middle rather
// than hide behind pawns, so the two king tables are blended by game phase.
const KING_ENDGAME = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10,   0,   0, -10, -20, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30, -10,  30,  40,  40,  30, -10, -30,
  -30, -10,  30,  40,  40,  30, -10, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30, -30,   0,   0,   0,   0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
]

const PHASE_WEIGHTS = { p: 0, n: 1, b: 1, r: 2, q: 4, k: 0 }
const PHASE_TOTAL = 24

const ABORT = Symbol('search aborted')

export const LEVELS = {
  casual: { label: 'Casual', depth: 1, jitter: 90, budgetMs: 350 },
  club: { label: 'Club', depth: 2, jitter: 25, budgetMs: 900 },
  sharp: { label: 'Sharp', depth: 3, jitter: 0, budgetMs: 2200 },
}

export const DEFAULT_LEVEL = 'club'

function mirrored(index) {
  return (7 - Math.floor(index / 8)) * 8 + (index % 8)
}

function scan(game) {
  const board = game.board()
  const counts = { w: {}, b: {} }
  const squares = []
  let phase = 0

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = board[row][col]
      if (!cell) continue
      const side = counts[cell.color]
      side[cell.type] = (side[cell.type] ?? 0) + 1
      phase += PHASE_WEIGHTS[cell.type]
      squares.push({ color: cell.color, type: cell.type, index: row * 8 + col })
    }
  }

  return { counts, squares, phase: Math.min(phase, PHASE_TOTAL) / PHASE_TOTAL }
}

/** Static score in centipawns, positive when White stands better. */
export function evaluate(game) {
  const { counts, squares, phase } = scan(game)
  let score = 0

  for (const { color, type, index } of squares) {
    const view = color === 'w' ? index : mirrored(index)
    const placement =
      type === 'k' ? TABLES.k[view] * phase + KING_ENDGAME[view] * (1 - phase) : TABLES[type][view]
    const value = VALUES[type] + placement
    score += color === 'w' ? value : -value
  }

  if ((counts.w.b ?? 0) >= 2) score += 32
  if ((counts.b.b ?? 0) >= 2) score -= 32

  return Math.round(score)
}

function relative(game) {
  const score = evaluate(game)
  return game.turn() === 'w' ? score : -score
}

// Most valuable victim, least valuable attacker: try the moves most likely to
// blow the position open first so alpha-beta prunes the rest.
function orderScore(move) {
  let score = 0
  if (move.captured) score += 1000 + VALUES[move.captured] * 8 - VALUES[move.piece]
  if (move.promotion) score += 900 + VALUES[move.promotion]
  if (move.san?.includes('+')) score += 40
  return score
}

function ordered(moves, first) {
  const scored = moves.map((move) => ({
    move,
    score: orderScore(move) + (first && move.lan === first.lan ? 100000 : 0),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.map((entry) => entry.move)
}

function guard(deadline) {
  if (deadline && Date.now() > deadline) throw ABORT
}

function play(game, move, next) {
  game.move({ from: move.from, to: move.to, promotion: move.promotion })
  try {
    return next()
  } finally {
    game.undo()
  }
}

function quiesce(game, alpha, beta, ply, depth, deadline) {
  guard(deadline)

  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return game.isCheck() ? -MATE + ply : 0

  const standing = relative(game)
  if (standing >= beta) return beta
  if (depth === 0) return standing
  if (standing > alpha) alpha = standing

  for (const move of ordered(moves.filter((entry) => entry.captured || entry.promotion))) {
    const score = play(game, move, () => -quiesce(game, -beta, -alpha, ply + 1, depth - 1, deadline))
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }

  return alpha
}

function negamax(game, depth, alpha, beta, ply, deadline) {
  guard(deadline)

  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return game.isCheck() ? -MATE + ply : 0
  if (game.isInsufficientMaterial()) return 0
  if (depth <= 0) return quiesce(game, alpha, beta, ply, 4, deadline)

  let best = -Infinity
  for (const move of ordered(moves)) {
    const score = play(game, move, () => -negamax(game, depth - 1, -beta, -alpha, ply + 1, deadline))
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }

  return best
}

// Every root move gets a full window. Narrowing it here would return bounds
// rather than scores, which would make weaker moves look as good as the best.
function searchRoot(game, depth, deadline, first) {
  const scored = []

  for (const move of ordered(game.moves({ verbose: true }), first)) {
    const score = play(game, move, () => -negamax(game, depth - 1, -Infinity, Infinity, 1, deadline))
    scored.push({ move, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored
}

/**
 * Pick a reply for the side to move. Searches one ply deeper at a time so a
 * blown time budget still returns the best move found so far.
 */
export function chooseMove(fen, options = {}) {
  const { depth = 2, jitter = 0, budgetMs = 1200, rng = Math.random } = options

  let game
  try {
    game = new Chess(fen)
  } catch {
    return null
  }

  const legal = game.moves({ verbose: true })
  if (legal.length === 0) return null

  const deadline = budgetMs > 0 ? Date.now() + budgetMs : 0

  // What gets played if even the first iteration is cut off — a slow device, a
  // tight budget, a busy tab. Sorting by the same cheap heuristic the search
  // uses means the fallback is the most promising capture rather than whatever
  // move generation happened to emit first.
  let ranked = ordered(legal).map((move) => ({ move, score: 0 }))
  let searched = false

  for (let level = 1; level <= depth; level += 1) {
    try {
      ranked = searchRoot(game, level, deadline, ranked[0].move)
      searched = true
    } catch (error) {
      if (error !== ABORT) throw error
      break
    }
  }

  // Weaker levels pick freely among moves that are close to the best one, which
  // keeps openings varied instead of replaying the same game every time. With
  // no completed iteration every score is still 0, so the pool would be every
  // legal move — play the best-ordered one instead of a coin toss.
  const cutoff = ranked[0].score - jitter
  const pool =
    searched && jitter > 0 ? ranked.filter((entry) => entry.score >= cutoff) : [ranked[0]]
  const { move } = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]

  return move.promotion
    ? { from: move.from, to: move.to, promotion: move.promotion }
    : { from: move.from, to: move.to }
}

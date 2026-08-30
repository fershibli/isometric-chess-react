export const PIECE_NAMES = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
}

export const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Relative render height, so a king towers over a pawn. */
export const PIECE_SCALE = { p: 0.74, r: 0.84, n: 0.9, b: 0.94, q: 1.02, k: 1.08 }

export const PROMOTION_CHOICES = ['q', 'r', 'b', 'n']

export function colorName(color) {
  return color === 'w' ? 'White' : 'Black'
}

export function describePiece(piece) {
  if (!piece) return null
  return `${colorName(piece.color)} ${PIECE_NAMES[piece.type]}`
}

export function squareLabel(square, piece) {
  return piece ? `${describePiece(piece)} on ${square}` : `Empty ${square}`
}

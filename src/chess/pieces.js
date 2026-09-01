export const PIECE_NAMES = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
}

export const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/**
 * The solid glyphs (U+265A..F). Both armies are drawn with these: the hollow
 * outline set is far lighter on screen than the solid one, so mixing the two
 * makes White look like a sketch next to Black. Colour comes from the gradient
 * painted through the glyph instead.
 */
export const PIECE_GLYPHS = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
}

/** Relative render height, so a king towers over a pawn. */
export const PIECE_SCALE = { p: 0.78, r: 0.9, n: 1, b: 1.04, q: 1.14, k: 1.18 }

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

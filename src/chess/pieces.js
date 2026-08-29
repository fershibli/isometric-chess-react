/** Unicode glyphs and visual scale per chess.js piece type. */
export const PIECE_VISUALS = {
  k: { dark: '\u265A', light: '\u2654', size: 1.7 },
  q: { dark: '\u265B', light: '\u2655', size: 1.7 },
  r: { dark: '\u265C', light: '\u2656', size: 1.2 },
  b: { dark: '\u265D', light: '\u2657', size: 1.4 },
  n: { dark: '\u265E', light: '\u2658', size: 1.5 },
  p: { dark: '\u265F', light: '\u2659', size: 1 },
}

export function squareFromRC(row, col) {
  return `${String.fromCharCode(97 + col)}${8 - row}`
}

export function rcFromSquare(square) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1])
  return { row: 8 - rank, col: file }
}

export function glyphFor(piece) {
  if (!piece) return null
  const visual = PIECE_VISUALS[piece.type]
  return piece.color === 'b' ? visual.dark : visual.light
}

export function scaleFor(piece) {
  if (!piece) return 1
  return PIECE_VISUALS[piece.type].size
}

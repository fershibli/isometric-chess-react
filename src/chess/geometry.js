export const SIZE = 8
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
export const ROTATIONS = 4

export function squareFromRC(row, col) {
  return `${FILES[col]}${SIZE - row}`
}

export function rcFromSquare(square) {
  return {
    row: SIZE - Number(square[1]),
    col: square.charCodeAt(0) - 97,
  }
}

export function clampRC(value) {
  return Math.max(0, Math.min(SIZE - 1, value))
}

/** Quarter-turn clockwise, applied `steps` times, in row/col space. */
export function rotateRC(row, col, steps = 0) {
  const turns = ((steps % ROTATIONS) + ROTATIONS) % ROTATIONS
  let r = row
  let c = col
  for (let i = 0; i < turns; i += 1) {
    const nextRow = c
    const nextCol = SIZE - 1 - r
    r = nextRow
    c = nextCol
  }
  return { row: r, col: c }
}

export function unrotateRC(row, col, steps = 0) {
  return rotateRC(row, col, ROTATIONS - (((steps % ROTATIONS) + ROTATIONS) % ROTATIONS))
}

/**
 * Board coordinates projected into the isometric diamond.
 * `bx` grows to the lower right, `by` to the lower left, and `depth` orders
 * squares from the far corner to the near one so nearer art paints on top.
 */
export function projectRC(row, col, rotation = 0) {
  const { row: r, col: c } = rotateRC(row, col, rotation)
  return { bx: c, by: r, depth: c + r }
}

/**
 * File and rank labels for the two edges nearest the viewer, so pieces standing
 * on the board never cover them whichever way the view is rotated.
 */
export function edgeLabels(rotation = 0) {
  const board = (viewRow, viewCol) => unrotateRC(viewRow, viewCol, rotation)
  const nameOf = (first, second, rc) =>
    first.row === second.row ? FILES[rc.col] : String(SIZE - rc.row)

  const labels = []
  const leftRuns = [board(SIZE - 1, 0), board(SIZE - 1, 1)]
  const rightRuns = [board(0, SIZE - 1), board(1, SIZE - 1)]

  for (let slot = 0; slot < SIZE; slot += 1) {
    labels.push({
      key: `left-${slot}`,
      bx: slot,
      by: SIZE,
      text: nameOf(leftRuns[0], leftRuns[1], board(SIZE - 1, slot)),
    })
    labels.push({
      key: `right-${slot}`,
      bx: SIZE,
      by: slot,
      text: nameOf(rightRuns[0], rightRuns[1], board(slot, SIZE - 1)),
    })
  }

  return labels
}

export function forEachSquare(callback) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      callback(row, col)
    }
  }
}

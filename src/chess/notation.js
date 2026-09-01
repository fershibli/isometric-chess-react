import { PIECE_NAMES, colorName } from './pieces'

/*
 * Chess books print the game score in algebraic notation, one numbered row per
 * full move, White then Black. The machine-readable form of exactly that is
 * PGN, which is what every engine, database and site reads — so PGN stays the
 * export that matters. These two are for eyes and for spreadsheets.
 */

const SAN_WIDTH = 8

/**
 * The game score as a book prints it: numbered rows, White and Black in
 * aligned columns.
 */
export function moveTable(history, { result } = {}) {
  if (history.length === 0) return 'No moves yet.'

  const width = String(Math.ceil(history.length / 2)).length
  const rows = []

  for (let index = 0; index < history.length; index += 2) {
    const number = String(index / 2 + 1).padStart(width)
    const white = (history[index]?.san ?? '').padEnd(SAN_WIDTH)
    const black = history[index + 1]?.san ?? ''
    rows.push(`${number}. ${white}${black}`.trimEnd())
  }

  if (result) rows.push('', result)
  return rows.join('\n')
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const COLUMNS = [
  'ply',
  'move',
  'side',
  'san',
  'piece',
  'from',
  'to',
  'captured',
  'promotion',
  'check',
  'fen_after',
]

/** One row per ply, for a spreadsheet. Not a chess format — a data one. */
export function moveCsv(history) {
  const rows = [COLUMNS.join(',')]

  history.forEach((move, index) => {
    rows.push(
      [
        index + 1,
        Math.floor(index / 2) + 1,
        colorName(move.color).toLowerCase(),
        move.san,
        PIECE_NAMES[move.piece],
        move.from,
        move.to,
        move.captured ? PIECE_NAMES[move.captured] : '',
        move.promotion ? PIECE_NAMES[move.promotion] : '',
        move.san?.includes('#') ? 'mate' : move.san?.includes('+') ? 'check' : '',
        move.after ?? '',
      ]
        .map(csvCell)
        .join(','),
    )
  })

  return rows.join('\n')
}

/** The result tag a finished game earns, in PGN's vocabulary. */
export function resultTag(state) {
  if (!state.isGameOver) return null
  if (state.isCheckmate) return state.turn === 'w' ? '0-1' : '1-0'
  return '1/2-1/2'
}

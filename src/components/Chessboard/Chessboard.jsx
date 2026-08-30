import { useMemo, useState } from 'react'
import Tile from '../Tile/Tile'
import PieceDefs from '../Piece/PieceDefs'
import {
  SIZE,
  clampRC,
  edgeLabels,
  projectRC,
  rcFromSquare,
  rotateRC,
  squareFromRC,
  unrotateRC,
} from '../../chess/geometry'
import { squareLabel } from '../../chess/pieces'
import './Chessboard.css'

function selectionMessage(selected, board, moveCount) {
  if (!selected) return ''
  const { row, col } = rcFromSquare(selected)
  const label = squareLabel(selected, board[row][col])
  return `${label} selected. ${moveCount} legal ${moveCount === 1 ? 'move' : 'moves'}.`
}

const ARROWS = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
}

export default function Chessboard({
  board,
  selected,
  legalTargets,
  lastMove,
  checkedKing,
  rotation = 0,
  pitch = 0.5,
  intro = false,
  onSelectSquare,
  onClearSelection,
}) {
  const [focusRC, setFocusRC] = useState(() => rcFromSquare('e2'))

  const layout = useMemo(() => {
    const squares = []
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        squares.push({ row, col, ...projectRC(row, col, rotation) })
      }
    }

    return { squares, labels: edgeLabels(rotation) }
  }, [rotation])

  function moveFocus(event, delta) {
    event.preventDefault()
    const view = rotateRC(focusRC.row, focusRC.col, rotation)
    const next = unrotateRC(clampRC(view.row + delta.row), clampRC(view.col + delta.col), rotation)
    setFocusRC(next)
    document.getElementById(`tile-${squareFromRC(next.row, next.col)}`)?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onClearSelection()
      return
    }
    const delta = ARROWS[event.key]
    if (delta) moveFocus(event, delta)
  }

  return (
    <div className="board-stage" style={{ '--pitch': pitch }}>
      <PieceDefs />
      <div
        className={`board${intro ? ' board--intro' : ''}`}
        role="group"
        aria-label="Chessboard"
        aria-describedby="board-help"
        onKeyDown={handleKeyDown}
      >
        <div className="board__slab" aria-hidden="true">
          <span className="board__slab-face board__slab-face--left" />
          <span className="board__slab-face board__slab-face--right" />
          <span className="board__slab-face board__slab-face--top" />
        </div>

        {layout.labels.map((label) => (
          <span
            key={label.key}
            className="board__label"
            aria-hidden="true"
            style={{ '--bx': label.bx, '--by': label.by }}
          >
            {label.text}
          </span>
        ))}

        {layout.squares.map(({ row, col, bx, by, depth }) => {
          const square = squareFromRC(row, col)
          const target = legalTargets.get(square)
          return (
            <Tile
              key={square}
              square={square}
              row={row}
              col={col}
              piece={board[row][col]}
              isDark={(row + col) % 2 === 1}
              isSelected={selected === square}
              isLegalMove={Boolean(target)}
              isCapture={Boolean(target?.captured)}
              isLastMove={lastMove?.from === square || lastMove?.to === square}
              isChecked={checkedKing === square}
              bx={bx}
              by={by}
              depth={depth}
              delay={depth * 45}
              isFocusTarget={focusRC.row === row && focusRC.col === col}
              onSelect={onSelectSquare}
              onFocusSquare={(r, c) => setFocusRC({ row: r, col: c })}
            />
          )
        })}
      </div>
      <p id="board-help" className="sr-only">
        Arrow keys move between squares along files and ranks. Enter or space selects a piece and
        then its destination. Escape clears the selection.
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {selectionMessage(selected, board, legalTargets.size)}
      </p>
    </div>
  )
}

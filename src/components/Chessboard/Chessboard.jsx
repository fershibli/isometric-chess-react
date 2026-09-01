import { useEffect, useMemo, useState } from 'react'
import Tile from '../Tile/Tile'
import MoveTrails from '../MoveTrails/MoveTrails'
import { rippleLifetime, wavePhase } from '../../board/water'
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
  held,
  legalTargets,
  lastMove,
  checkedKing,
  rotation = 0,
  pitch = 0.5,
  intro = false,
  water = 1,
  showTrails = true,
  showCoordinates = true,
  onSelectSquare,
  onClearSelection,
}) {
  const [focusRC, setFocusRC] = useState(() => rcFromSquare('e2'))
  const [ripple, setRipple] = useState(null)

  // chess.js stamps every verbose move with the position it produced, which
  // makes a cheap identity for "a piece just landed" that undo and redo also
  // get right.
  const landingId = lastMove?.after ?? null

  useEffect(() => {
    if (!landingId || !lastMove) return undefined
    const { row, col } = rcFromSquare(lastMove.to)
    setRipple({ row, col, id: landingId })
    const timer = window.setTimeout(() => setRipple(null), rippleLifetime())
    return () => window.clearTimeout(timer)
    // Only the identity matters here; `lastMove` is read for its square.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landingId])

  const layout = useMemo(() => {
    const squares = []
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        squares.push({
          row,
          col,
          ...projectRC(row, col, rotation),
          wave: wavePhase(row, col),
        })
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

  const boardClasses = ['board']
  if (intro) boardClasses.push('board--intro')
  if (water <= 0) boardClasses.push('board--calm')

  return (
    <div className="board-stage" style={{ '--pitch': pitch, '--water': water }}>
      <div
        className={boardClasses.join(' ')}
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

        {showCoordinates
          ? layout.labels.map((label) => (
              <span
                key={label.key}
                className="board__label"
                aria-hidden="true"
                style={{ '--bx': label.bx, '--by': label.by }}
              >
                {label.text}
              </span>
            ))
          : null}

        {showTrails ? (
          <MoveTrails selected={selected} targets={legalTargets} rotation={rotation} />
        ) : null}

        {layout.squares.map(({ row, col, bx, by, depth, wave }) => {
          const square = squareFromRC(row, col)
          const target = legalTargets.get(square)
          const isLanding = lastMove?.to === square
          return (
            <Tile
              key={square}
              square={square}
              row={row}
              col={col}
              piece={board[row][col]}
              isDark={(row + col) % 2 === 1}
              // `held` is the opponent's piece in the air. It gets the same
              // lifted pose as your own selection, but never its move targets:
              // a machine that shows you its options is showing its hand.
              isSelected={selected === square || held === square}
              isLegalMove={Boolean(target)}
              isCapture={Boolean(target?.captured)}
              isLastMove={lastMove?.from === square || lastMove?.to === square}
              isChecked={checkedKing === square}
              bx={bx}
              by={by}
              depth={depth}
              wave={wave}
              ripple={ripple}
              rippleStrength={water}
              landingKey={isLanding ? landingId : 'still'}
              isLanding={isLanding && !intro}
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

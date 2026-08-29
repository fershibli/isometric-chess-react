import React, { useEffect, useState } from 'react'
import Tile from '../Tile/Tile'
import { squareFromRC } from '../../chess/pieces'
import './Chessboard.css'

export default function Chessboard({
  board,
  selected,
  legalTargets,
  lastMove,
  onSelectSquare,
}) {
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 2800)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div
      className={`chessboard${intro ? ' chessboard--intro' : ''}`}
      role="grid"
      aria-label="Chessboard"
    >
      {board.map((rank, row) =>
        rank.map((piece, col) => {
          const square = squareFromRC(row, col)
          const move = legalTargets.get(square)
          return (
            <Tile
              key={square}
              square={square}
              row={row}
              col={col}
              piece={piece}
              isDark={(row + col) % 2 === 1}
              isSelected={selected === square}
              isLegalMove={Boolean(move)}
              isCapture={Boolean(move?.captured)}
              isLastMove={lastMove?.from === square || lastMove?.to === square}
              onSelect={onSelectSquare}
            />
          )
        }),
      )}
    </div>
  )
}

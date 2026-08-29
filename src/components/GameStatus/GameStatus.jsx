import React from 'react'
import './GameStatus.css'

export default function GameStatus({
  turn,
  isCheck,
  isCheckmate,
  isStalemate,
  isDraw,
  onReset,
  onUndo,
  canUndo,
}) {
  let status = turn === 'w' ? 'White to move' : 'Black to move'
  if (isCheckmate) {
    status = turn === 'w' ? 'Checkmate — Black wins' : 'Checkmate — White wins'
  } else if (isStalemate) {
    status = 'Stalemate — draw'
  } else if (isDraw) {
    status = 'Draw'
  } else if (isCheck) {
    status = `${turn === 'w' ? 'White' : 'Black'} in check`
  }

  return (
    <div className="game-status" role="status" aria-live="polite">
      <p className="game-status__text">{status}</p>
      <div className="game-status__actions">
        <button type="button" className="game-status__button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="game-status__button" onClick={onReset}>
          New game
        </button>
      </div>
    </div>
  )
}

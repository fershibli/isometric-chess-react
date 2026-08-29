import React from 'react'
import { useChessGame } from '../../chess/useChessGame'
import Chessboard from '../Chessboard/Chessboard'
import GameStatus from '../GameStatus/GameStatus'
import './ChessPage.css'

export default function ChessPage() {
  const game = useChessGame()

  return (
    <div className="chess-page">
      <header className="chess-page__header">
        <h1 className="chess-page__title">Isometric Chess</h1>
        <GameStatus
          turn={game.turn}
          isCheck={game.isCheck}
          isCheckmate={game.isCheckmate}
          isStalemate={game.isStalemate}
          isDraw={game.isDraw}
          onReset={game.reset}
          onUndo={game.undo}
          canUndo={game.history.length > 0}
        />
      </header>
      <div className="chess-page__board-wrap">
        <Chessboard
          board={game.board}
          selected={game.selected}
          legalTargets={game.legalTargets}
          lastMove={game.lastMove}
          onSelectSquare={game.selectSquare}
        />
      </div>
    </div>
  )
}

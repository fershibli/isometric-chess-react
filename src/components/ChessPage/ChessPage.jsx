import { useEffect, useMemo, useState } from 'react'
import { useChessGame } from '../../chess/useChessGame'
import { useEngineOpponent } from '../../chess/useEngineOpponent'
import { DEFAULT_LEVEL } from '../../chess/engine'
import { ROTATIONS } from '../../chess/geometry'
import Chessboard from '../Chessboard/Chessboard'
import GameStatus from '../GameStatus/GameStatus'
import GameControls from '../GameControls/GameControls'
import OpponentControls from '../OpponentControls/OpponentControls'
import CapturedPieces from '../CapturedPieces/CapturedPieces'
import MoveList from '../MoveList/MoveList'
import PromotionDialog from '../PromotionDialog/PromotionDialog'
import ViewControls from '../ViewControls/ViewControls'
import PieceDefs from '../Piece/PieceDefs'
import './ChessPage.css'

const INTRO_MS = 1900

function fenFromLocation() {
  if (typeof window === 'undefined') return undefined
  return new URLSearchParams(window.location.search).get('fen') ?? undefined
}

export default function ChessPage() {
  const initialFen = useMemo(() => fenFromLocation(), [])
  const game = useChessGame(initialFen)
  const [rotation, setRotation] = useState(0)
  const [pitch, setPitch] = useState(0.56)
  const [intro, setIntro] = useState(true)
  const [engineSide, setEngineSide] = useState(null)
  const [level, setLevel] = useState(DEFAULT_LEVEL)

  const engine = useEngineOpponent({
    side: engineSide,
    level,
    fen: game.fen,
    turn: game.turn,
    isGameOver: game.isGameOver,
    paused: Boolean(game.pendingPromotion),
    onMove: game.playMove,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const engineTurn = Boolean(engineSide) && engineSide === game.turn
  // One take-back should hand the board back to the player, which means
  // stepping over the engine's reply as well.
  const plies = engineSide && !engineTurn ? 2 : 1

  return (
    <div className="page">
      <PieceDefs />

      <header className="page__header">
        <div>
          <p className="page__eyebrow">
            {engineSide
              ? `You play ${engineSide === 'w' ? 'Black' : 'White'}`
              : 'Two players, one screen'}
          </p>
          <h1 className="page__title">Isometric Chess</h1>
        </div>
        <ViewControls
          rotation={rotation}
          pitch={pitch}
          onRotate={(next) => setRotation(((next % ROTATIONS) + ROTATIONS) % ROTATIONS)}
          onPitch={setPitch}
        />
      </header>

      <main className="page__main">
        <div className="page__board">
          <Chessboard
            board={game.board}
            selected={game.selected}
            legalTargets={game.legalTargets}
            lastMove={game.lastMove}
            checkedKing={game.checkedKing}
            rotation={rotation}
            pitch={pitch}
            intro={intro}
            onSelectSquare={engineTurn ? game.clearSelection : game.selectSquare}
            onClearSelection={game.clearSelection}
          />
        </div>

        <aside className="panel">
          <GameStatus
            turn={game.turn}
            isCheck={game.isCheck}
            isCheckmate={game.isCheckmate}
            isStalemate={game.isStalemate}
            isDraw={game.isDraw}
            isGameOver={game.isGameOver}
            moveNumber={Math.floor(game.history.length / 2) + 1}
          />
          <GameControls
            fen={game.fen}
            pgn={game.pgn}
            canUndo={game.canUndo}
            canRedo={game.canRedo}
            onUndo={() => game.undo(plies)}
            onRedo={() => game.redo(plies)}
            onReset={game.reset}
          />
          <OpponentControls
            engineSide={engineSide}
            level={level}
            thinking={engine.thinking}
            onSide={setEngineSide}
            onLevel={setLevel}
          />
          <CapturedPieces captured={game.captured} balance={game.materialBalance} />
          <MoveList history={game.history} />
        </aside>
      </main>

      {game.pendingPromotion ? (
        <PromotionDialog
          color={game.pendingPromotion.color}
          square={game.pendingPromotion.to}
          onSelect={game.completePromotion}
          onCancel={game.cancelPromotion}
        />
      ) : null}
    </div>
  )
}

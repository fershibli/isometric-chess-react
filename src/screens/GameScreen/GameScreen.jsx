import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Chessboard from '../../components/Chessboard/Chessboard'
import GameStatus from '../../components/GameStatus/GameStatus'
import CapturedPieces from '../../components/CapturedPieces/CapturedPieces'
import MoveList from '../../components/MoveList/MoveList'
import PromotionDialog from '../../components/PromotionDialog/PromotionDialog'
import PauseOverlay from './PauseOverlay'
import { useChessGame } from '../../chess/useChessGame'
import { useEngineOpponent } from '../../chess/useEngineOpponent'
import { LEVELS } from '../../chess/engine'
import { colorName } from '../../chess/pieces'
import { resultTag } from '../../chess/notation'
import { encode, moveMessage, parseMessage, resetMessage, resignMessage } from '../../net/protocol'
import './GameScreen.css'

const INTRO_MS = 1900

function fenFromLocation() {
  if (typeof window === 'undefined') return undefined
  return new URLSearchParams(window.location.search).get('fen') ?? undefined
}

function describeSession(session) {
  if (session.mode === 'engine') {
    return `${LEVELS[session.level].label} · you play ${colorName(
      session.engineSide === 'w' ? 'b' : 'w',
    )}`
  }
  if (session.mode === 'online') {
    return `${session.label} · you play ${colorName(session.side)}`
  }
  return 'Two players, one screen'
}

export default function GameScreen({ session, settings, onSettings, onExit }) {
  const online = session.mode === 'online'
  const transport = online ? session.transport : null

  const [intro, setIntro] = useState(true)
  const [paused, setPaused] = useState(false)
  const [peerState, setPeerState] = useState(null)

  const sendMove = useCallback(
    (move) => {
      if (!transport) return
      transport.send(encode(moveMessage(move.from, move.to, move.promotion)))
    },
    [transport],
  )

  // A share link only makes sense when this browser owns the whole game.
  const initialFen = useMemo(() => (online ? undefined : fenFromLocation()), [online])
  const game = useChessGame(initialFen, { onLocalMove: online ? sendMove : undefined })

  // The transport handlers are registered once and fire long after the render
  // that created them, so they reach the game through a ref.
  const gameRef = useRef(game)
  useEffect(() => {
    gameRef.current = game
  })

  const engineSide = session.mode === 'engine' ? session.engineSide : null
  const engine = useEngineOpponent({
    side: engineSide,
    level: session.level,
    fen: game.fen,
    turn: game.turn,
    isGameOver: game.isGameOver,
    paused: Boolean(game.pendingPromotion) || paused,
    onMove: game.playRemoteMove,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!transport) return undefined

    transport.on({
      message: (raw) => {
        const message = parseMessage(raw)
        if (!message) return
        if (message.t === 'move') {
          gameRef.current.playRemoteMove(message.from, message.to, message.promotion)
        } else if (message.t === 'reset') {
          gameRef.current.reset()
          setPeerState(null)
        } else if (message.t === 'resign') {
          setPeerState('resigned')
        }
      },
      close: () => setPeerState('gone'),
      error: () => setPeerState('gone'),
    })

    // Detach, but do not hang up: in development this effect is deliberately
    // run twice, and closing the connection on the first cleanup would leave
    // the second registration talking to a dead channel. The link is closed
    // when the player actually leaves the game.
    return () => transport.on({ message: null, close: null, error: null })
  }, [transport])

  // Escape pauses, unless a piece is in hand — then it puts the piece back.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || paused) return
      if (game.selected || game.pendingPromotion) return
      event.preventDefault()
      setPaused(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [game.pendingPromotion, game.selected, paused])

  const engineTurn = Boolean(engineSide) && engineSide === game.turn
  const waitingForPeer = online && session.side !== game.turn
  const canPlay = !paused && !engineTurn && !waitingForPeer && peerState !== 'gone'

  // One take-back should hand the board back to the player, which means
  // stepping over the engine's reply as well.
  const plies = engineSide && !engineTurn ? 2 : 1

  function restart() {
    game.reset()
    setPeerState(null)
    setPaused(false)
    transport?.send(encode(resetMessage()))
  }

  function leave() {
    if (transport) {
      transport.send(encode(resignMessage()))
      transport.close()
    }
    onExit()
  }

  const notice =
    peerState === 'gone'
      ? 'Your opponent disconnected.'
      : peerState === 'resigned'
        ? 'Your opponent resigned.'
        : engine.thinking
          ? 'The machine is thinking…'
          : waitingForPeer
            ? 'Waiting for your opponent…'
            : null

  return (
    <div className="game">
      <header className="game__bar">
        <div className="game__identity">
          <p className="game__eyebrow">{describeSession(session)}</p>
          <h1 className="game__title">Isometric Chess</h1>
        </div>
        <button type="button" className="btn game__pause" onClick={() => setPaused(true)}>
          Pause
          <span className="game__key" aria-hidden="true">
            Esc
          </span>
        </button>
      </header>

      <main className="game__main">
        <div className="game__board">
          <Chessboard
            board={game.board}
            selected={game.selected}
            held={engine.holding}
            legalTargets={game.legalTargets}
            lastMove={game.lastMove}
            checkedKing={game.checkedKing}
            rotation={settings.rotation}
            pitch={settings.pitch}
            intro={intro}
            water={settings.water}
            showTrails={settings.trails}
            showCoordinates={settings.coordinates}
            onSelectSquare={canPlay ? game.selectSquare : game.clearSelection}
            onClearSelection={game.clearSelection}
          />
        </div>

        <aside className="panel plank">
          <GameStatus
            turn={game.turn}
            isCheck={game.isCheck}
            isCheckmate={game.isCheckmate}
            isStalemate={game.isStalemate}
            isDraw={game.isDraw}
            isGameOver={game.isGameOver}
            moveNumber={Math.floor(game.history.length / 2) + 1}
          />
          {notice ? (
            <p className="game__notice" aria-live="polite">
              {notice}
            </p>
          ) : null}
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

      {paused ? (
        <PauseOverlay
          online={online}
          fen={game.fen}
          pgn={game.pgn}
          history={game.history}
          result={resultTag(game)}
          canUndo={game.canUndo}
          canRedo={game.canRedo}
          settings={settings}
          onSettings={onSettings}
          onResume={() => setPaused(false)}
          onRestart={restart}
          onUndo={() => game.undo(plies)}
          onRedo={() => game.redo(plies)}
          onLeave={leave}
        />
      ) : null}
    </div>
  )
}

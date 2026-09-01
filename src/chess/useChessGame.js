import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { squareFromRC } from './geometry'
import { capturedPieces, materialBalance } from './material'

const NO_TARGETS = new Map()

function buildTargets(game, square) {
  const targets = new Map()
  for (const move of game.moves({ square, verbose: true })) {
    if (!targets.has(move.to)) targets.set(move.to, move)
  }
  return targets
}

function createGame(fen) {
  if (fen) {
    try {
      return new Chess(fen)
    } catch {
      // An unusable FEN (hand-edited share link) falls back to a fresh game.
    }
  }
  return new Chess()
}

function findKing(game, color) {
  for (const rank of game.board()) {
    for (const cell of rank) {
      if (cell?.type === 'k' && cell.color === color) return cell.square
    }
  }
  return null
}

function snapshot(game) {
  const history = game.history({ verbose: true })
  const turn = game.turn()
  const isCheck = game.isCheck()
  const lost = capturedPieces(history)

  return {
    fen: game.fen(),
    pgn: game.pgn(),
    board: game.board(),
    turn,
    history,
    // Derived from the move list, so undo and redo can never leave a stale highlight.
    lastMove: history.at(-1) ?? null,
    isCheck,
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw: game.isDraw(),
    isGameOver: game.isGameOver(),
    checkedKing: isCheck ? findKing(game, turn) : null,
    captured: lost,
    materialBalance: materialBalance(lost),
  }
}

/**
 * `onLocalMove` fires for moves this player made, and only those. Moves that
 * arrive from an opponent — the engine, or a peer over the wire — go through
 * `playRemoteMove`, which stays silent so an online game cannot echo a move
 * back to the player who sent it.
 */
export function useChessGame(initialFen, { onLocalMove } = {}) {
  const [game] = useState(() => createGame(initialFen))
  const [state, setState] = useState(() => snapshot(game))
  const [selected, setSelected] = useState(null)
  const [pendingPromotion, setPendingPromotion] = useState(null)
  const [redoStack, setRedoStack] = useState([])
  const localMoveRef = useRef(onLocalMove)

  useEffect(() => {
    localMoveRef.current = onLocalMove
  }, [onLocalMove])

  const sync = useCallback(() => setState(snapshot(game)), [game])

  // Recomputed every render: chess.js is mutable, so memoising on the selected
  // square alone would keep serving targets from the position before the move.
  const legalTargets = selected ? buildTargets(game, selected) : NO_TARGETS

  const commit = useCallback(
    (from, to, promotion, local) => {
      try {
        game.move(promotion ? { from, to, promotion } : { from, to })
      } catch {
        return false
      }
      setSelected(null)
      setPendingPromotion(null)
      setRedoStack([])
      sync()
      if (local) localMoveRef.current?.({ from, to, promotion })
      return true
    },
    [game, sync],
  )

  const applyMove = useCallback(
    (from, to, promotion) => commit(from, to, promotion, true),
    [commit],
  )

  const playRemoteMove = useCallback(
    (from, to, promotion) => commit(from, to, promotion, false),
    [commit],
  )

  const selectSquare = useCallback(
    (row, col) => {
      if (state.isGameOver || pendingPromotion) return

      const square = squareFromRC(row, col)
      const target = legalTargets.get(square)

      if (target) {
        if (target.promotion) {
          setPendingPromotion({ from: target.from, to: target.to, color: target.color })
          setSelected(null)
          return
        }
        applyMove(target.from, target.to)
        return
      }

      if (square === selected) {
        setSelected(null)
        return
      }

      const piece = game.get(square)
      setSelected(piece && piece.color === state.turn ? square : null)
    },
    [applyMove, game, legalTargets, pendingPromotion, selected, state.isGameOver, state.turn],
  )

  const completePromotion = useCallback(
    (type) => {
      if (!pendingPromotion) return
      applyMove(pendingPromotion.from, pendingPromotion.to, type)
    },
    [applyMove, pendingPromotion],
  )

  const cancelPromotion = useCallback(() => setPendingPromotion(null), [])

  const clearSelection = useCallback(() => setSelected(null), [])

  // Plies, not moves: against the engine a take-back has to walk past its reply
  // so the board comes back to the human player.
  const undo = useCallback(
    (plies = 1) => {
      const undone = []
      for (let step = 0; step < plies; step += 1) {
        const move = game.undo()
        if (!move) break
        undone.push(move)
      }
      if (undone.length === 0) return
      setRedoStack((stack) => [...stack, ...undone])
      setSelected(null)
      setPendingPromotion(null)
      sync()
    },
    [game, sync],
  )

  const redo = useCallback(
    (plies = 1) => {
      let stack = redoStack
      let replayed = 0

      while (replayed < plies && stack.length > 0) {
        const move = stack.at(-1)
        try {
          game.move({ from: move.from, to: move.to, promotion: move.promotion })
        } catch {
          break
        }
        stack = stack.slice(0, -1)
        replayed += 1
      }

      if (replayed === 0) return
      setRedoStack(stack)
      setSelected(null)
      setPendingPromotion(null)
      sync()
    },
    [game, redoStack, sync],
  )

  const reset = useCallback(() => {
    game.reset()
    setSelected(null)
    setPendingPromotion(null)
    setRedoStack([])
    sync()
  }, [game, sync])

  return {
    ...state,
    selected,
    legalTargets,
    pendingPromotion,
    canUndo: state.history.length > 0,
    canRedo: redoStack.length > 0,
    playRemoteMove,
    selectSquare,
    clearSelection,
    playMove: applyMove,
    completePromotion,
    cancelPromotion,
    undo,
    redo,
    reset,
  }
}

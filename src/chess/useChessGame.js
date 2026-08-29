import { useCallback, useState } from 'react'
import { Chess } from 'chess.js'
import { squareFromRC } from './pieces'

function snapshot(game) {
  return {
    fen: game.fen(),
    turn: game.turn(),
    board: game.board(),
    isCheck: game.isCheck(),
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw: game.isDraw(),
    isGameOver: game.isGameOver(),
    history: game.history({ verbose: true }),
  }
}

export function useChessGame() {
  const [game] = useState(() => new Chess())
  const [state, setState] = useState(() => snapshot(game))
  const [selected, setSelected] = useState(null)
  const [lastMove, setLastMove] = useState(null)

  const refresh = useCallback(() => {
    setState(snapshot(game))
  }, [game])

  const legalTargets = (() => {
    if (!selected) return new Map()
    return new Map(
      game.moves({ square: selected, verbose: true }).map((move) => [move.to, move]),
    )
  })()

  const selectSquare = useCallback(
    (row, col) => {
      if (state.isGameOver) return

      const square = squareFromRC(row, col)
      const piece = game.get(square)

      if (selected && legalTargets.has(square)) {
        const move = legalTargets.get(square)
        const result = game.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion ? 'q' : undefined,
        })
        if (result) {
          setLastMove({ from: result.from, to: result.to })
          setSelected(null)
          refresh()
        }
        return
      }

      if (piece && piece.color === state.turn) {
        setSelected(square)
        return
      }

      setSelected(null)
    },
    [game, legalTargets, refresh, selected, state.isGameOver, state.turn],
  )

  const reset = useCallback(() => {
    game.reset()
    setSelected(null)
    setLastMove(null)
    refresh()
  }, [game, refresh])

  const undo = useCallback(() => {
    const undone = game.undo()
    if (!undone) return
    const previous = game.history({ verbose: true }).at(-1)
    setLastMove(previous ? { from: previous.from, to: previous.to } : null)
    setSelected(null)
    refresh()
  }, [game, refresh])

  return {
    ...state,
    selected,
    lastMove,
    legalTargets,
    selectSquare,
    reset,
    undo,
  }
}

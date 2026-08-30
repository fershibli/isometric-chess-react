import { colorName } from '../../chess/pieces'
import './GameStatus.css'

function statusText({ turn, isCheck, isCheckmate, isStalemate, isDraw }) {
  if (isCheckmate) return `Checkmate — ${colorName(turn === 'w' ? 'b' : 'w')} wins`
  if (isStalemate) return 'Stalemate — draw'
  if (isDraw) return 'Draw'
  if (isCheck) return `${colorName(turn)} in check`
  return `${colorName(turn)} to move`
}

export default function GameStatus({
  turn,
  isCheck,
  isCheckmate,
  isStalemate,
  isDraw,
  isGameOver,
  moveNumber,
}) {
  const text = statusText({ turn, isCheck, isCheckmate, isStalemate, isDraw })
  const tone = isGameOver ? 'over' : isCheck ? 'check' : 'normal'

  return (
    <div className={`status status--${tone}`} role="status" aria-live="polite">
      <span className={`status__dot status__dot--${turn === 'w' ? 'white' : 'black'}`} />
      <p className="status__text">{text}</p>
      <span className="status__move">Move {moveNumber}</span>
    </div>
  )
}

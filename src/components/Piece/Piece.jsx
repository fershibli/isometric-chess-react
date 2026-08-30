import PieceArt from './PieceArt'
import { PIECE_SCALE } from '../../chess/pieces'
import './Piece.css'

export default function Piece({ piece, delay = 0 }) {
  if (!piece) return null

  const tone = piece.color === 'w' ? 'light' : 'dark'

  return (
    <span
      className={`piece piece--${tone}`}
      style={{ '--piece-scale': PIECE_SCALE[piece.type], '--piece-delay': `${delay}ms` }}
    >
      <PieceArt type={piece.type} tone={tone} />
    </span>
  )
}

import { PIECE_GLYPHS, PIECE_SCALE } from '../../chess/pieces'
import './Piece.css'

/**
 * A piece standing on a square. `lifted` is the picked-up pose, `landing`
 * plays the drop once — the caller remounts this component to replay it.
 */
export default function Piece({ piece, lifted = false, landing = false, delay = 0 }) {
  if (!piece) return null

  const classes = ['piece', piece.color === 'w' ? 'piece--light' : 'piece--dark']
  if (lifted) classes.push('piece--lifted')
  if (landing) classes.push('piece--landing')

  return (
    <span
      className={classes.join(' ')}
      style={{ '--piece-scale': PIECE_SCALE[piece.type], '--piece-delay': `${delay}ms` }}
    >
      <span className="piece__glyph" aria-hidden="true">
        {PIECE_GLYPHS[piece.type]}
      </span>
      {/* Only the lower body takes clicks. A king's crown hangs over the
          square behind it, and that square has to stay reachable. */}
      <span className="piece__hit" />
    </span>
  )
}

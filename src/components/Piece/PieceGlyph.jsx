import { PIECE_GLYPHS } from '../../chess/pieces'
import './PieceGlyph.css'

/**
 * One chess character, painted with a gradient through the glyph itself.
 * Used wherever a piece appears outside the board: capture tray, promotion
 * picker, menus.
 */
export default function PieceGlyph({ type, color, className = '' }) {
  const tone = color === 'w' ? 'light' : 'dark'
  return (
    <span className={`glyph glyph--${tone} ${className}`.trim()} aria-hidden="true">
      {PIECE_GLYPHS[type]}
    </span>
  )
}

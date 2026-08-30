import Piece from '../Piece/Piece'
import { squareLabel } from '../../chess/pieces'
import './Tile.css'

export default function Tile({
  square,
  row,
  col,
  piece,
  isDark,
  isSelected,
  isLegalMove,
  isCapture,
  isLastMove,
  isChecked,
  bx,
  by,
  depth,
  isFocusTarget,
  delay,
  onSelect,
  onFocusSquare,
}) {
  const classes = ['tile', isDark ? 'tile--dark' : 'tile--light']
  if (isSelected) classes.push('tile--selected')
  if (isLegalMove) classes.push(isCapture ? 'tile--capture' : 'tile--move')
  if (isLastMove) classes.push('tile--last')
  if (isChecked) classes.push('tile--check')

  return (
    <button
      type="button"
      id={`tile-${square}`}
      className={classes.join(' ')}
      style={{ '--bx': bx, '--by': by, '--depth': depth, '--tile-delay': `${delay}ms` }}
      tabIndex={isFocusTarget ? 0 : -1}
      aria-label={squareLabel(square, piece)}
      aria-pressed={piece ? isSelected : undefined}
      onClick={() => onSelect(row, col)}
      onFocus={() => onFocusSquare(row, col)}
    >
      <span className="tile__face" />
      {isLegalMove && !isCapture ? <span className="tile__dot" /> : null}
      {isLegalMove && isCapture ? <span className="tile__ring" /> : null}
      {piece ? <span className="tile__shadow" /> : null}
      <Piece piece={piece} delay={delay} />
    </button>
  )
}

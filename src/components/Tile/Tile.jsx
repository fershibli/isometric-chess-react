import { useRef } from 'react'
import Piece from '../Piece/Piece'
import { useWaterRipple } from '../../hooks/useWaterRipple'
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
  wave,
  ripple,
  rippleStrength,
  landingKey,
  isLanding,
  isFocusTarget,
  delay,
  onSelect,
  onFocusSquare,
}) {
  const faceRef = useRef(null)
  useWaterRipple(faceRef, { ripple, row, col, strength: rippleStrength })

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
      style={{
        '--bx': bx,
        '--by': by,
        '--depth': depth,
        '--wave': wave,
        '--tile-delay': `${delay}ms`,
      }}
      tabIndex={isFocusTarget ? 0 : -1}
      aria-label={squareLabel(square, piece)}
      aria-pressed={piece ? isSelected : undefined}
      onClick={() => onSelect(row, col)}
      onFocus={() => onFocusSquare(row, col)}
    >
      <span className="tile__face" ref={faceRef}>
        <span className="tile__sheen" />
      </span>
      {isLegalMove && !isCapture ? <span className="tile__dot" /> : null}
      {isLegalMove && isCapture ? <span className="tile__ring" /> : null}
      {piece ? <span className={`tile__shadow${isSelected ? ' tile__shadow--lifted' : ''}`} /> : null}
      <Piece key={landingKey} piece={piece} lifted={isSelected} landing={isLanding} delay={delay} />
    </button>
  )
}

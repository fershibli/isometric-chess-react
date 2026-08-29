import React from 'react'
import Piece from '../Piece/Piece'
import { glyphFor, scaleFor } from '../../chess/pieces'
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
  onSelect,
}) {
  const classes = ['tile']
  if (isLegalMove && isCapture) classes.push('capture-tile')
  else if (isLegalMove) classes.push('available-tile')
  else if (isSelected) classes.push('moving-tile')
  else if (isLastMove) classes.push('last-move-tile')
  else classes.push(isDark ? 'dark-tile' : 'light-tile')

  const pieceName = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn',
  }
  const label = piece
    ? `${piece.color === 'w' ? 'White' : 'Black'} ${pieceName[piece.type]} on ${square}`
    : `Empty ${square}`

  return (
    <button
      type="button"
      aria-label={label}
      className={classes.join(' ')}
      style={{ '--delay': `${(row + col) * 100}ms` }}
      onClick={() => onSelect(row, col)}
    >
      <Piece
        glyph={glyphFor(piece)}
        scale={scaleFor(piece)}
        isDark={piece?.color === 'b'}
        col={col}
      />
    </button>
  )
}
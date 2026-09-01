import { useEffect, useRef } from 'react'
import PieceGlyph from '../Piece/PieceGlyph'
import { PIECE_NAMES, PROMOTION_CHOICES, colorName } from '../../chess/pieces'
import './PromotionDialog.css'

export default function PromotionDialog({ color, square, onSelect, onCancel }) {
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  return (
    <div
      className="promo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <button
        type="button"
        className="promo__backdrop"
        aria-label="Cancel promotion"
        onClick={onCancel}
      />
      <div className="promo__card">
        <h2 className="promo__title" id="promo-title">
          {`${colorName(color)} pawn reaches ${square}`}
        </h2>
        <p className="promo__hint">Choose the piece it becomes.</p>
        <ul className="promo__options">
          {PROMOTION_CHOICES.map((type, index) => (
            <li key={type}>
              <button
                type="button"
                className="promo__option"
                ref={index === 0 ? firstRef : null}
                onClick={() => onSelect(type)}
              >
                <PieceGlyph type={type} color={color} className="promo__glyph" />
                <span className="promo__name">{PIECE_NAMES[type]}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn--ghost promo__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

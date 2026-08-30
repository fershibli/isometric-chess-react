import PieceArt from '../Piece/PieceArt'
import { PIECE_NAMES } from '../../chess/pieces'
import './CapturedPieces.css'

function Row({ label, tone, types }) {
  return (
    <div className="captured__row">
      <span className="captured__label">{label}</span>
      <ul className="captured__list">
        {types.length === 0 ? <li className="captured__empty">nothing yet</li> : null}
        {types.map((type, index) => (
          <li key={`${type}-${index}`} className="captured__item" title={PIECE_NAMES[type]}>
            <PieceArt type={type} tone={tone} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CapturedPieces({ captured, balance }) {
  const leader = balance > 0 ? 'White' : 'Black'

  return (
    <section className="captured" aria-label="Captured pieces">
      <header className="captured__header">
        <h2 className="panel__heading">Material</h2>
        {balance === 0 ? (
          <span className="captured__balance captured__balance--even">even</span>
        ) : (
          <span className="captured__balance">{`${leader} +${Math.abs(balance)}`}</span>
        )}
      </header>
      <Row label="White took" tone="dark" types={captured.b} />
      <Row label="Black took" tone="light" types={captured.w} />
    </section>
  )
}

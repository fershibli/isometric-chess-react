import { projectRC, rcFromSquare } from '../../chess/geometry'
import './MoveTrails.css'

/*
 * The board is 8 tiles wide and 8 tiles tall in its own box, so an SVG laid
 * over it with viewBox "0 0 8 8" and preserveAspectRatio="none" shares the
 * tile grid exactly — no measuring, no resize observer. A square projected to
 * (bx, by) has its centre here:
 */
function centre(square, rotation) {
  const { row, col } = rcFromSquare(square)
  const { bx, by } = projectRC(row, col, rotation)
  return { x: 4 + (bx - by) / 2, y: (bx + by) / 2 + 0.5 }
}

/** An arc from origin to target, bowed towards the viewer. */
function arc(from, to) {
  const lift = Math.hypot(to.x - from.x, to.y - from.y) * 0.3 + 0.25
  const cx = (from.x + to.x) / 2
  const cy = (from.y + to.y) / 2 - lift
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}

/**
 * The flight path a selected piece would take to each square it can reach.
 * Drawn under the pieces, above the board.
 */
export default function MoveTrails({ selected, targets, rotation = 0 }) {
  if (!selected || targets.size === 0) return null

  const from = centre(selected, rotation)
  const paths = [...targets.entries()].map(([square, move], index) => ({
    square,
    d: arc(from, centre(square, rotation)),
    capture: Boolean(move.captured),
    delay: index * 55,
  }))

  return (
    <svg
      className="trails"
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((path) => (
        <path
          key={path.square}
          className={`trails__path${path.capture ? ' trails__path--capture' : ''}`}
          d={path.d}
          vectorEffect="non-scaling-stroke"
          style={{ '--trail-delay': `${path.delay}ms` }}
        />
      ))}
    </svg>
  )
}

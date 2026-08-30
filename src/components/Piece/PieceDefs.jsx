/** Gradients shared by every piece on the board; rendered once per page. */
export default function PieceDefs() {
  return (
    <svg className="piece-defs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="piece-light" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="45%" stopColor="#ffe2b3" />
          <stop offset="100%" stopColor="#e79b4f" />
        </linearGradient>
        <linearGradient id="piece-dark" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#8f8ae8" />
          <stop offset="45%" stopColor="#4b3fa8" />
          <stop offset="100%" stopColor="#1b1550" />
        </linearGradient>
        <linearGradient id="piece-sheen" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

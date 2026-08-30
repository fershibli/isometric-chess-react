import './PieceArt.css'

const BASE = 'M11 97c0-7 6-11 12-11h14c6 0 12 4 12 11z'
const PLINTH = 'M20 81h20l3 6H17z'
const STEM = 'M25 58h10c1 9 4 17 7 24H18c3-7 6-15 7-24z'

const SHAPES = {
  p: [
    'M30 17a13 13 0 1 1 0 26 13 13 0 0 1 0-26z',
    'M23 41h14l-2 8H25z',
    'M25 47h10c1 12 4 23 6 34H19c2-11 5-22 6-34z',
    PLINTH,
    BASE,
  ],
  r: [
    'M13 12h8v10h6V12h6v10h6V12h8v22H13z',
    'M18 33h24c1 17 3 33 4 48H14c1-15 3-31 4-48z',
    PLINTH,
    BASE,
  ],
  n: [
    'M19 86c-1-14 1-26 8-36-5-4-11-4-15 0-3-9 5-21 18-27 2-8 8-13 12-11-1 4 0 7 3 9 7 6 9 16 9 28 0 14-2 24-3 37z',
    PLINTH,
    BASE,
  ],
  b: [
    'M30 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
    'M30 12c9 9 14 19 14 28 0 9-6 15-14 15s-14-6-14-15c0-9 5-19 14-28z',
    'M22 52h16l-2 8H24z',
    STEM,
    PLINTH,
    BASE,
  ],
  q: [
    'M16 54 12 20 19 32 22 16 26 32 30 12 34 32 38 16 41 32 48 20 44 54Z',
    'M18 51h24l-2 9H20z',
    STEM,
    PLINTH,
    BASE,
  ],
  k: [
    'M26 3h8v7h7v8h-7v7h-8v-7h-7v-8h7z',
    'M17 54c-1-17 6-31 13-31s14 14 13 31z',
    'M17 51h26l-2 9H19z',
    STEM,
    PLINTH,
    BASE,
  ],
}

const DETAILS = {
  n: [
    { shape: 'circle', cx: 26, cy: 32, r: 2.6, opacity: 0.75 },
    { shape: 'path', d: 'M42 20c5 8 7 19 7 31', opacity: 0.3, strokeWidth: 3 },
  ],
  q: [
    { shape: 'circle', cx: 12, cy: 17, r: 3.2 },
    { shape: 'circle', cx: 22, cy: 13, r: 3 },
    { shape: 'circle', cx: 30, cy: 9, r: 3.4 },
    { shape: 'circle', cx: 38, cy: 13, r: 3 },
    { shape: 'circle', cx: 48, cy: 17, r: 3.2 },
  ],
  b: [{ shape: 'path', d: 'M33 27l8 12', opacity: 0.35, strokeWidth: 3.5 }],
  r: [{ shape: 'path', d: 'M17 58h26', opacity: 0.28, strokeWidth: 4 }],
}

function Detail({ detail }) {
  if (detail.shape === 'circle') {
    return <circle cx={detail.cx} cy={detail.cy} r={detail.r} opacity={detail.opacity ?? 1} />
  }
  return (
    <path
      d={detail.d}
      fill="none"
      stroke="currentColor"
      strokeWidth={detail.strokeWidth}
      strokeLinecap="round"
      opacity={detail.opacity}
    />
  )
}

/** Silhouette for one piece type, drawn twice: solid body, then a glass sheen. */
export default function PieceArt({ type, tone }) {
  const shapes = SHAPES[type]
  const details = DETAILS[type] ?? []
  const fill = tone === 'light' ? 'url(#piece-light)' : 'url(#piece-dark)'

  return (
    <svg
      className={`piece__art piece__art--${tone}`}
      viewBox="0 0 60 100"
      aria-hidden="true"
      focusable="false"
    >
      <g className="piece__body" fill={fill} paintOrder="stroke fill">
        {shapes.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className="piece__details">
        {details.map((detail, index) => (
          <Detail key={index} detail={detail} />
        ))}
      </g>
      <g className="piece__sheen" fill="url(#piece-sheen)">
        {shapes.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}

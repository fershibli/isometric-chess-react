import React from 'react'
import './Piece.css'

export default function Piece({ glyph, scale, isDark, col }) {
  if (!glyph) return null

  return (
    <div
      className="piece"
      style={{
        '--color1': isDark ? '106,90,205' : '250,128,114',
        '--color2': isDark ? '0,0,128' : '255,99,71',
        '--scale': scale,
        '--delay': `${col * 100}ms`,
      }}
    >
      {glyph}
    </div>
  )
}

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { glyphFor, rcFromSquare, squareFromRC } from './pieces'

describe('square helpers', () => {
  it('maps row/col to algebraic squares', () => {
    expect(squareFromRC(6, 4)).toBe('e2')
    expect(squareFromRC(0, 0)).toBe('a8')
    expect(rcFromSquare('e2')).toEqual({ row: 6, col: 4 })
  })

  it('picks light and dark glyphs', () => {
    expect(glyphFor({ type: 'k', color: 'w' })).toBe('\u2654')
    expect(glyphFor({ type: 'k', color: 'b' })).toBe('\u265A')
  })
})

describe('playable board', () => {
  it('moves a white pawn and switches turn', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /white pawn on e2/i }))
    await user.click(screen.getByRole('button', { name: /empty e4/i }))

    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /white pawn on e4/i })).toBeInTheDocument()
  })

  it('resets the game', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /white pawn on e2/i }))
    await user.click(screen.getByRole('button', { name: /empty e4/i }))
    await user.click(screen.getByRole('button', { name: 'New game' }))

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /white pawn on e2/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /empty e4/i })).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App'

function renderApp(search = '') {
  window.history.replaceState({}, '', `/${search}`)
  return { user: userEvent.setup(), ...render(<App />) }
}

const tile = (name) => screen.getByRole('button', { name: new RegExp(name, 'i') })

/** Squares only accept pointer input on the drawn diamond, never the full box. */
async function clickSquare(user, name) {
  const button = tile(name)
  await user.click(button.querySelector('.tile__face'))
  return button
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('playing moves', () => {
  it('moves a white pawn and switches turn', async () => {
    const { user } = renderApp()

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
    expect(tile('white pawn on e4')).toBeInTheDocument()
  })

  it('records the move in the history list', async () => {
    const { user } = renderApp()

    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    expect(screen.getByText('e4')).toBeInTheDocument()
  })

  it('deselects a piece when its square is clicked again', async () => {
    const { user } = renderApp()

    const pawn = await clickSquare(user, 'white pawn on e2')
    expect(pawn).toHaveAttribute('aria-pressed', 'true')

    await clickSquare(user, 'white pawn on e2')
    expect(pawn).toHaveAttribute('aria-pressed', 'false')
  })

  it('resets the game', async () => {
    const { user } = renderApp()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')
    await user.click(screen.getByRole('button', { name: 'New game' }))

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(tile('white pawn on e2')).toBeInTheDocument()
    expect(tile('empty e4')).toBeInTheDocument()
  })
})

describe('undo and redo', () => {
  it('takes a move back and plays it again', async () => {
    const { user } = renderApp()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    const undo = screen.getByRole('button', { name: 'Undo' })
    const redo = screen.getByRole('button', { name: 'Redo' })
    expect(redo).toBeDisabled()

    await user.click(undo)
    expect(tile('white pawn on e2')).toBeInTheDocument()
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument()

    await user.click(redo)
    expect(tile('white pawn on e4')).toBeInTheDocument()
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
  })

  it('leaves no last-move highlight once the whole game is undone', async () => {
    const { user } = renderApp()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(document.querySelectorAll('.tile--last')).toHaveLength(0)
  })
})

describe('promotion', () => {
  const promotionFen = '?fen=5k2%2F4P3%2F8%2F8%2F8%2F8%2F8%2F4K3%20w%20-%20-%200%201'

  it('loads a position from the share link and asks which piece to promote to', async () => {
    const { user } = renderApp(promotionFen)

    await clickSquare(user, 'white pawn on e7')
    await clickSquare(user, 'empty e8')

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/white pawn reaches e8/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'knight' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(tile('white knight on e8')).toBeInTheDocument()
  })

  it('restores the pawn on undo and the chosen piece on redo', async () => {
    const { user } = renderApp(promotionFen)

    await clickSquare(user, 'white pawn on e7')
    await clickSquare(user, 'empty e8')
    await user.click(screen.getByRole('button', { name: 'rook' }))
    expect(tile('white rook on e8')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(tile('white pawn on e7')).toBeInTheDocument()
    expect(tile('empty e8')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Redo' }))
    expect(tile('white rook on e8')).toBeInTheDocument()
  })

  it('keeps the pawn in place when promotion is cancelled', async () => {
    const { user } = renderApp(promotionFen)

    await clickSquare(user, 'white pawn on e7')
    await clickSquare(user, 'empty e8')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(tile('white pawn on e7')).toBeInTheDocument()
  })
})

describe('keyboard play', () => {
  it('selects and moves with arrow keys and Enter', async () => {
    const { user } = renderApp()

    tile('white pawn on e2').focus()
    await user.keyboard('{Enter}')
    expect(tile('white pawn on e2')).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(document.activeElement).toBe(document.getElementById('tile-e4'))

    await user.keyboard('{Enter}')
    expect(tile('white pawn on e4')).toBeInTheDocument()
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
  })

  it('clears the selection with Escape', async () => {
    const { user } = renderApp()

    const pawn = tile('white pawn on e2')
    pawn.focus()
    await user.keyboard('{Enter}')
    expect(pawn).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Escape}')
    expect(pawn).toHaveAttribute('aria-pressed', 'false')
  })
})

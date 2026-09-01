import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

const tile = (name) => screen.getByRole('button', { name: new RegExp(name, 'i') })

/** Squares only accept pointer input on the drawn diamond, never the full box. */
async function clickSquare(user, name) {
  const button = tile(name)
  await user.click(button.querySelector('.tile__face'))
  return button
}

async function openMenu(search = '') {
  window.history.replaceState({}, '', `/${search}`)
  const user = userEvent.setup()
  render(<App />)
  return { user }
}

async function startLocal(search = '') {
  const { user } = await openMenu(search)
  await user.click(screen.getByRole('button', { name: /local match/i }))
  return { user }
}

/** Game controls live behind the pause key now, so every test has to open it. */
async function pause(user) {
  await user.click(screen.getByRole('button', { name: /^pause/i }))
  return within(screen.getByRole('dialog', { name: /paused/i }))
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('screen flow', () => {
  it('opens on the menu, not on a board', async () => {
    await openMenu()

    expect(screen.getByRole('heading', { name: /isometric chess/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /local match/i })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /chessboard/i })).not.toBeInTheDocument()
  })

  it('starts a local game from the menu', async () => {
    await startLocal()

    expect(screen.getByRole('group', { name: /chessboard/i })).toBeInTheDocument()
    expect(screen.getByText(/two players, one screen/i)).toBeInTheDocument()
  })

  it('asks for a strength and a colour before playing the machine', async () => {
    const { user } = await openMenu()

    await user.click(screen.getByRole('button', { name: /play the machine/i }))
    expect(screen.getByRole('heading', { name: /how hard/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Casual' }))
    await user.click(screen.getByRole('button', { name: /i play black|^black$/i }))
    await user.click(screen.getByRole('button', { name: /start the game/i }))

    expect(screen.getByRole('group', { name: /chessboard/i })).toBeInTheDocument()
    expect(screen.getByText(/casual/i)).toBeInTheDocument()
  })

  it('returns to the menu from a game', async () => {
    const { user } = await startLocal()

    const dialog = await pause(user)
    await user.click(dialog.getByRole('button', { name: /main menu/i }))

    expect(screen.getByRole('button', { name: /local match/i })).toBeInTheDocument()
  })

  it('keeps a settings change and applies it to the board', async () => {
    const { user } = await openMenu()

    await user.click(screen.getByRole('button', { name: /settings/i }))
    const trails = within(screen.getByRole('group', { name: /move trails/i }))
    await user.click(trails.getByRole('button', { name: 'Off' }))
    await user.click(screen.getByRole('button', { name: /main menu/i }))
    await user.click(screen.getByRole('button', { name: /local match/i }))

    expect(document.querySelector('.trails')).toBeNull()
  })
})

describe('playing moves', () => {
  it('moves a white pawn and switches turn', async () => {
    const { user } = await startLocal()

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
    expect(tile('white pawn on e4')).toBeInTheDocument()
  })

  it('records the move in the history list', async () => {
    const { user } = await startLocal()

    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    expect(screen.getByText('e4')).toBeInTheDocument()
  })

  it('deselects a piece when its square is clicked again', async () => {
    const { user } = await startLocal()

    const pawn = await clickSquare(user, 'white pawn on e2')
    expect(pawn).toHaveAttribute('aria-pressed', 'true')

    await clickSquare(user, 'white pawn on e2')
    expect(pawn).toHaveAttribute('aria-pressed', 'false')
  })

  it('draws a trail to every square the held piece can reach', async () => {
    const { user } = await startLocal()

    expect(document.querySelectorAll('.trails__path')).toHaveLength(0)

    await clickSquare(user, 'white pawn on e2')
    expect(document.querySelectorAll('.trails__path')).toHaveLength(2)
  })

  it('restarts the game from the pause screen', async () => {
    const { user } = await startLocal()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    const dialog = await pause(user)
    await user.click(dialog.getByRole('button', { name: /^restart$/i }))

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(tile('white pawn on e2')).toBeInTheDocument()
    expect(tile('empty e4')).toBeInTheDocument()
  })
})

describe('undo and redo', () => {
  it('takes a move back and plays it again', async () => {
    const { user } = await startLocal()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    let dialog = await pause(user)
    expect(dialog.getByRole('button', { name: 'Redo' })).toBeDisabled()
    await user.click(dialog.getByRole('button', { name: 'Undo' }))
    await user.click(dialog.getByRole('button', { name: 'Resume' }))

    expect(tile('white pawn on e2')).toBeInTheDocument()
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument()

    dialog = await pause(user)
    await user.click(dialog.getByRole('button', { name: 'Redo' }))
    await user.click(dialog.getByRole('button', { name: 'Resume' }))

    expect(tile('white pawn on e4')).toBeInTheDocument()
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
  })

  it('leaves no last-move highlight once the whole game is undone', async () => {
    const { user } = await startLocal()

    await clickSquare(user, 'white pawn on e2')
    await clickSquare(user, 'empty e4')

    const dialog = await pause(user)
    await user.click(dialog.getByRole('button', { name: 'Undo' }))

    expect(document.querySelectorAll('.tile--last')).toHaveLength(0)
  })
})

describe('promotion', () => {
  const promotionFen = '?fen=5k2%2F4P3%2F8%2F8%2F8%2F8%2F8%2F4K3%20w%20-%20-%200%201'

  it('loads a position from the share link and asks which piece to promote to', async () => {
    const { user } = await startLocal(promotionFen)

    await clickSquare(user, 'white pawn on e7')
    await clickSquare(user, 'empty e8')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/white pawn reaches e8/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'knight' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(tile('white knight on e8')).toBeInTheDocument()
  })

  it('restores the pawn on undo and the chosen piece on redo', async () => {
    const { user } = await startLocal(promotionFen)

    await clickSquare(user, 'white pawn on e7')
    await clickSquare(user, 'empty e8')
    await user.click(screen.getByRole('button', { name: 'rook' }))
    expect(tile('white rook on e8')).toBeInTheDocument()

    let dialog = await pause(user)
    await user.click(dialog.getByRole('button', { name: 'Undo' }))
    await user.click(dialog.getByRole('button', { name: 'Resume' }))
    expect(tile('white pawn on e7')).toBeInTheDocument()
    expect(tile('empty e8')).toBeInTheDocument()

    dialog = await pause(user)
    await user.click(dialog.getByRole('button', { name: 'Redo' }))
    await user.click(dialog.getByRole('button', { name: 'Resume' }))
    expect(tile('white rook on e8')).toBeInTheDocument()
  })

  it('keeps the pawn in place when promotion is cancelled', async () => {
    const { user } = await startLocal(promotionFen)

    await clickSquare(user, 'white pawn on e7')
    await clickSquare(user, 'empty e8')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(tile('white pawn on e7')).toBeInTheDocument()
  })
})

describe('keyboard play', () => {
  it('selects and moves with arrow keys and Enter', async () => {
    const { user } = await startLocal()

    tile('white pawn on e2').focus()
    await user.keyboard('{Enter}')
    expect(tile('white pawn on e2')).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(document.activeElement).toBe(document.getElementById('tile-e4'))

    await user.keyboard('{Enter}')
    expect(tile('white pawn on e4')).toBeInTheDocument()
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
  })

  it('clears the selection with Escape and pauses on the next one', async () => {
    const { user } = await startLocal()

    const pawn = tile('white pawn on e2')
    pawn.focus()
    await user.keyboard('{Enter}')
    expect(pawn).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Escape}')
    expect(pawn).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('dialog', { name: /paused/i })).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: /paused/i })).toBeInTheDocument()
  })
})

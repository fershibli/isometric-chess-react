import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { moveCsv, moveTable, resultTag } from './notation'

function play(moves) {
  const game = new Chess()
  for (const san of moves) game.move(san)
  return game
}

const opening = play(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']).history({ verbose: true })

describe('moveTable', () => {
  it('lays the game out the way a book prints it', () => {
    expect(moveTable(opening)).toBe(['1. e4      e5', '2. Nf3     Nc6', '3. Bb5'].join('\n'))
  })

  it('keeps the numbers aligned once the game passes move nine', () => {
    // Knights shuffling back and forth: twenty plies, ten numbered rows.
    const shuffle = []
    for (let round = 0; round < 5; round += 1) shuffle.push('Nf3', 'Nf6', 'Ng1', 'Ng8')
    const rows = moveTable(play(shuffle).history({ verbose: true })).split('\n')

    expect(rows).toHaveLength(10)
    expect(rows[0].startsWith(' 1.')).toBe(true)
    expect(rows[9].startsWith('10.')).toBe(true)
  })

  it('says so when nothing has been played', () => {
    expect(moveTable([])).toBe('No moves yet.')
  })

  it('appends a result when one is given', () => {
    expect(moveTable(opening, { result: '1-0' }).endsWith('\n\n1-0')).toBe(true)
  })
})

describe('moveCsv', () => {
  it('writes a header and one row per ply', () => {
    const rows = moveCsv(opening).split('\n')
    expect(rows[0]).toBe('ply,move,side,san,piece,from,to,captured,promotion,check,fen_after')
    expect(rows).toHaveLength(opening.length + 1)
    expect(rows[1]).toMatch(/^1,1,white,e4,pawn,e2,e4,,,,/)
  })

  it('names the captured piece and the promotion choice', () => {
    const game = play(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3'])
    const rows = moveCsv(game.history({ verbose: true })).split('\n')
    expect(rows[3]).toContain('pawn')
    expect(rows[3]).toContain('exd5')

    const promo = new Chess('5k2/4P3/8/8/8/8/8/4K3 w - - 0 1')
    promo.move({ from: 'e7', to: 'e8', promotion: 'n' })
    // No capture on this promotion, so the captured column stays empty and
    // only the promotion column names a piece.
    expect(moveCsv(promo.history({ verbose: true })).split('\n')[1]).toContain('e8,,knight,')
  })

  it('flags checks and mates', () => {
    const game = play(['f3', 'e5', 'g4', 'Qh4'])
    const rows = moveCsv(game.history({ verbose: true })).split('\n')
    expect(rows.at(-1)).toContain(',mate,')
  })

  it('quotes a field that would otherwise break the row', () => {
    expect(moveCsv([{ color: 'w', san: 'a,b', piece: 'p', from: 'a2', to: 'a4' }])).toContain('"a,b"')
  })
})

describe('resultTag', () => {
  it('names the winner of a mate from whose turn it is', () => {
    expect(resultTag({ isGameOver: true, isCheckmate: true, turn: 'b' })).toBe('1-0')
    expect(resultTag({ isGameOver: true, isCheckmate: true, turn: 'w' })).toBe('0-1')
  })

  it('calls anything else that ends a draw, and an unfinished game nothing', () => {
    expect(resultTag({ isGameOver: true, isCheckmate: false })).toBe('1/2-1/2')
    expect(resultTag({ isGameOver: false })).toBeNull()
  })
})

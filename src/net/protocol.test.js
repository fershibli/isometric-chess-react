import { describe, expect, it } from 'vitest'
import { PROTOCOL_VERSION, encode, moveMessage, parseMessage } from './protocol'

describe('parseMessage', () => {
  it('round-trips a move', () => {
    expect(parseMessage(encode(moveMessage('e2', 'e4')))).toEqual({
      t: 'move',
      from: 'e2',
      to: 'e4',
      promotion: undefined,
    })
  })

  it('keeps a promotion choice', () => {
    expect(parseMessage(encode(moveMessage('e7', 'e8', 'n'))).promotion).toBe('n')
  })

  it('rejects anything that is not a well-formed message', () => {
    expect(parseMessage('not json')).toBeNull()
    expect(parseMessage('null')).toBeNull()
    expect(parseMessage(encode({ v: 99, t: 'move', from: 'e2', to: 'e4' }))).toBeNull()
    expect(parseMessage(encode({ v: PROTOCOL_VERSION, t: 'drop-table' }))).toBeNull()
  })

  it('rejects squares and promotions that are off the board', () => {
    const bad = (extra) => encode({ v: PROTOCOL_VERSION, t: 'move', from: 'e2', to: 'e4', ...extra })
    expect(parseMessage(bad({ to: 'z9' }))).toBeNull()
    expect(parseMessage(bad({ from: '../../etc' }))).toBeNull()
    expect(parseMessage(bad({ promotion: 'k' }))).toBeNull()
  })

  it('passes control messages through', () => {
    expect(parseMessage(encode({ v: PROTOCOL_VERSION, t: 'resign' }))).toEqual({ t: 'resign' })
    expect(parseMessage(encode({ v: PROTOCOL_VERSION, t: 'hello', side: 'b' }))).toEqual({
      t: 'hello',
      side: 'b',
    })
    expect(parseMessage(encode({ v: PROTOCOL_VERSION, t: 'hello', side: 'x' }))).toBeNull()
  })
})

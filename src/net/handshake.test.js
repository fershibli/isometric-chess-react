import { describe, expect, it } from 'vitest'
import { cleanCode, decodeSignal, encodeSignal, formatCode } from './handshake'

const payload = { v: 1, t: 'offer', sdp: 'v=0\r\no=- 42 2 IN IP4 127.0.0.1\r\n'.repeat(40) }

describe('signal codes', () => {
  it('round-trips a payload', async () => {
    expect(await decodeSignal(await encodeSignal(payload))).toEqual(payload)
  })

  it('is much shorter than the raw payload', async () => {
    const code = await encodeSignal(payload)
    expect(code.length).toBeLessThan(JSON.stringify(payload).length / 3)
  })

  it('survives being wrapped and pasted back with line breaks', async () => {
    const code = await encodeSignal(payload)
    expect(await decodeSignal(formatCode(code))).toEqual(payload)
    expect(await decodeSignal(`  ${code.slice(0, 20)}\n${code.slice(20)}  `)).toEqual(payload)
  })

  it('explains itself when the code is unusable', async () => {
    await expect(decodeSignal('')).rejects.toThrow(/too short/i)
    await expect(decodeSignal('hello there')).rejects.toThrow(/does not look like/i)
    await expect(decodeSignal('C!!!!!!!!')).rejects.toThrow(/damaged/i)
  })

  it('strips whitespace anywhere in a pasted code', () => {
    expect(cleanCode(' a b\nc\td ')).toBe('abcd')
    expect(cleanCode(null)).toBe('')
  })
})

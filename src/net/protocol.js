/*
 * Everything arriving on the data channel was written by the other browser and
 * has to be treated as hostile until parsed. `parseMessage` is the only way in:
 * it returns a known-shaped message or null, and never throws.
 */

export const PROTOCOL_VERSION = 1

const SQUARE = /^[a-h][1-8]$/
const PROMOTIONS = new Set(['q', 'r', 'b', 'n'])
const KINDS = new Set(['hello', 'move', 'reset', 'resign', 'rematch'])

export function helloMessage(side) {
  return { v: PROTOCOL_VERSION, t: 'hello', side }
}

export function moveMessage(from, to, promotion) {
  const message = { v: PROTOCOL_VERSION, t: 'move', from, to }
  if (promotion) message.promotion = promotion
  return message
}

export function resetMessage() {
  return { v: PROTOCOL_VERSION, t: 'reset' }
}

export function resignMessage() {
  return { v: PROTOCOL_VERSION, t: 'resign' }
}

export function encode(message) {
  return JSON.stringify(message)
}

export function parseMessage(raw) {
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }

  if (!data || typeof data !== 'object') return null
  if (data.v !== PROTOCOL_VERSION) return null
  if (!KINDS.has(data.t)) return null

  if (data.t === 'move') {
    if (!SQUARE.test(data.from ?? '') || !SQUARE.test(data.to ?? '')) return null
    if (data.promotion != null && !PROMOTIONS.has(data.promotion)) return null
    return {
      t: 'move',
      from: data.from,
      to: data.to,
      promotion: data.promotion ?? undefined,
    }
  }

  if (data.t === 'hello') {
    if (data.side !== 'w' && data.side !== 'b') return null
    return { t: 'hello', side: data.side }
  }

  return { t: data.t }
}

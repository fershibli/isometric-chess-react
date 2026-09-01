/*
 * Turns a signalling payload into something a person can paste into WhatsApp.
 *
 * A gathered SDP offer is 1.5-4 KB of text. Deflating it first and encoding the
 * result as base64url gets that down to roughly a fifth, which is the
 * difference between a code you can send and a code nobody will send. The
 * first character says which path was taken so an older or stricter browser
 * without CompressionStream can still read a code produced by a newer one.
 */

const COMPRESSED = 'C'
const RAW = 'R'

function toBase64Url(bytes) {
  let binary = ''
  // Chunked: spreading a few thousand bytes into String.fromCharCode blows the
  // argument limit on some engines.
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const padded = text.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function through(stream, bytes) {
  const writer = stream.writable.getWriter()
  writer.write(bytes)
  writer.close()

  const chunks = []
  const reader = stream.readable.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/** Strips the formatting a code picks up from being pasted through chat apps. */
export function cleanCode(code) {
  return String(code ?? '').replace(/\s+/g, '')
}

export async function encodeSignal(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))

  if (typeof CompressionStream === 'function') {
    try {
      return COMPRESSED + toBase64Url(await through(new CompressionStream('deflate-raw'), bytes))
    } catch {
      // Falls through to the uncompressed form.
    }
  }

  return RAW + toBase64Url(bytes)
}

export async function decodeSignal(code) {
  const clean = cleanCode(code)
  if (clean.length < 2) throw new Error('That code is too short to be an invite.')

  const marker = clean[0]
  if (marker !== COMPRESSED && marker !== RAW) throw new Error('That does not look like a code.')

  let bytes
  try {
    bytes = fromBase64Url(clean.slice(1))
  } catch {
    throw new Error('That code is damaged — copy it again, all of it.')
  }

  if (marker === COMPRESSED) {
    if (typeof DecompressionStream !== 'function') {
      throw new Error('This browser cannot read compressed codes.')
    }
    try {
      bytes = await through(new DecompressionStream('deflate-raw'), bytes)
    } catch {
      throw new Error('That code is damaged — copy it again, all of it.')
    }
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error('That code is damaged — copy it again, all of it.')
  }
}

/** Line-wrapped for display; decoding strips the breaks again. */
export function formatCode(code, width = 56) {
  return (code.match(new RegExp(`.{1,${width}}`, 'g')) ?? []).join('\n')
}

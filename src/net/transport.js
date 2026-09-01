/**
 * Both peer-to-peer backends expose the same three things, so the game never
 * learns whether it is talking over WebRTC or between two tabs.
 *
 *   on({ open, message, close, error })  register handlers (replaces existing)
 *   send(text)                           returns false when nothing was sent
 *   close()                              idempotent
 */
export function createTransport({ attach, send, close }) {
  const handlers = { open: null, message: null, close: null, error: null }
  let closed = false

  const emit = (name, value) => {
    if (closed && name !== 'close') return
    handlers[name]?.(value)
  }

  attach(emit)

  return {
    on(next) {
      Object.assign(handlers, next)
    },
    send(text) {
      return closed ? false : send(text)
    },
    close() {
      if (closed) return
      closed = true
      close()
    },
    get closed() {
      return closed
    },
  }
}

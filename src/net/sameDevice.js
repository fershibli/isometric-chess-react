import { createTransport } from './transport'

/*
 * Two tabs of the same browser, joined by a room name. No network at all —
 * BroadcastChannel only reaches the same origin on the same machine. It exists
 * because "play against yourself on one laptop" is how you actually test an
 * online mode, and because two people round one desk is a real way to play.
 */

export function isSupported() {
  return typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function'
}

export function createRoomName() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}

export function joinRoom(room) {
  const channel = new window.BroadcastChannel(`isometric-chess:${room}`)
  let ready = false

  return createTransport({
    attach(emit) {
      channel.onmessage = (event) => {
        const packet = event.data
        if (packet?.hail) {
          // Either side may open first, so both answer a hail and both treat
          // the first thing they hear as the connection coming up.
          if (!ready) {
            ready = true
            emit('open')
          }
          if (packet.hail === 'hello') channel.postMessage({ hail: 'welcome' })
          return
        }
        if (typeof packet?.text === 'string') emit('message', packet.text)
      }

      // Whoever arrives second is heard by the first, and the reply tells the
      // second that someone was already there. BroadcastChannel never echoes
      // to the sender, so an empty room stays silent.
      channel.postMessage({ hail: 'hello' })
    },
    send(text) {
      channel.postMessage({ text })
      return true
    },
    close() {
      channel.close()
    },
  })
}

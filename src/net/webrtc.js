import { encodeSignal, decodeSignal } from './handshake'
import { PROTOCOL_VERSION } from './protocol'
import { createTransport } from './transport'

/*
 * Serverless in the sense that matters: no machine of ours is involved in a
 * game. STUN is used only to discover the public address each browser should
 * advertise, and `lanOnly` skips even that — on a shared network the host
 * candidates alone are enough to connect.
 *
 * Signalling is done by the players. One copies an invite code out, the other
 * pastes it in and copies a reply back. After that the browsers talk directly.
 */

const STUN = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// ICE gathering can hang on a candidate that will never resolve. Whatever has
// been collected by then is usually enough to connect.
const GATHER_TIMEOUT_MS = 4000

export function isSupported() {
  return typeof window !== 'undefined' && typeof window.RTCPeerConnection === 'function'
}

function peerConnection(lanOnly) {
  return new window.RTCPeerConnection({ iceServers: lanOnly ? [] : STUN })
}

function gathered(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()

  return new Promise((resolve) => {
    const finish = () => {
      pc.removeEventListener('icegatheringstatechange', check)
      window.clearTimeout(timer)
      resolve()
    }
    const check = () => {
      if (pc.iceGatheringState === 'complete') finish()
    }
    const timer = window.setTimeout(finish, GATHER_TIMEOUT_MS)
    pc.addEventListener('icegatheringstatechange', check)
  })
}

function wrap(pc, channelPromise) {
  let channel = null

  return createTransport({
    attach(emit) {
      channelPromise.then((opened) => {
        channel = opened
        opened.onopen = () => emit('open')
        opened.onmessage = (event) => emit('message', event.data)
        opened.onclose = () => emit('close')
        opened.onerror = () => emit('error', new Error('The connection dropped.'))
        if (opened.readyState === 'open') emit('open')
      })

      pc.addEventListener('connectionstatechange', () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) emit('close')
      })
    },
    send(text) {
      if (channel?.readyState !== 'open') return false
      channel.send(text)
      return true
    },
    close() {
      try {
        channel?.close()
      } catch {
        // Already gone.
      }
      pc.close()
    },
  })
}

/** Host side: produces the invite code, then waits for the guest's reply. */
export async function createInvite({ lanOnly = false, hostSide = 'w' } = {}) {
  const pc = peerConnection(lanOnly)
  const channel = pc.createDataChannel('chess', { ordered: true })
  const transport = wrap(pc, Promise.resolve(channel))

  await pc.setLocalDescription(await pc.createOffer())
  await gathered(pc)

  const code = await encodeSignal({
    v: PROTOCOL_VERSION,
    t: 'offer',
    sdp: pc.localDescription.sdp,
    // The host chooses colours, so the guest is told which side it has.
    guestSide: hostSide === 'w' ? 'b' : 'w',
  })

  return {
    code,
    transport,
    async accept(answerCode) {
      const signal = await decodeSignal(answerCode)
      if (signal?.t !== 'answer' || typeof signal.sdp !== 'string') {
        throw new Error('That is not a reply code — ask for the one their screen shows.')
      }
      await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
    },
  }
}

/** Guest side: reads the invite, produces the reply code. */
export async function acceptInvite(inviteCode, { lanOnly = false } = {}) {
  const signal = await decodeSignal(inviteCode)
  if (signal?.t !== 'offer' || typeof signal.sdp !== 'string') {
    throw new Error('That is not an invite code — ask for the one their screen shows.')
  }

  const pc = peerConnection(lanOnly)
  const channelPromise = new Promise((resolve) => {
    pc.ondatachannel = (event) => resolve(event.channel)
  })
  const transport = wrap(pc, channelPromise)

  await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
  await pc.setLocalDescription(await pc.createAnswer())
  await gathered(pc)

  return {
    code: await encodeSignal({
      v: PROTOCOL_VERSION,
      t: 'answer',
      sdp: pc.localDescription.sdp,
    }),
    side: signal.guestSide === 'w' ? 'w' : 'b',
    transport,
  }
}

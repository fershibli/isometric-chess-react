import { useEffect, useRef, useState } from 'react'
import Shell from '../Shell/Shell'
import { useCopy } from '../../hooks/useCopy'
import { formatCode } from '../../net/handshake'
import { acceptInvite, createInvite, isSupported as webrtcSupported } from '../../net/webrtc'
import {
  createRoomName,
  isSupported as sameDeviceSupported,
  joinRoom,
} from '../../net/sameDevice'
import './OnlineScreen.css'

const SIDES = [
  { value: 'w', label: 'I play White' },
  { value: 'b', label: 'I play Black' },
]

export default function OnlineScreen({ onStart, onBack }) {
  const [stage, setStage] = useState('menu')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [lanOnly, setLanOnly] = useState(false)
  const [hostSide, setHostSide] = useState('w')
  const [room, setRoom] = useState(createRoomName)

  const inviteRef = useRef(null)
  const transportRef = useRef(null)
  const handedOverRef = useRef(false)
  const { copiedKey, copy } = useCopy()

  // A half-finished handshake has an open RTCPeerConnection behind it. Leaving
  // the screen has to hang it up; handing it to the game must not.
  useEffect(
    () => () => {
      if (!handedOverRef.current) transportRef.current?.close()
    },
    [],
  )

  function arm(transport, side, label) {
    transportRef.current = transport
    transport.on({
      open: () => {
        handedOverRef.current = true
        onStart({ transport, side, label })
      },
      error: (problem) => setError(problem.message),
      close: () => {
        if (!handedOverRef.current) setError('The link closed before the game started.')
      },
    })
  }

  async function run(work) {
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (problem) {
      setError(problem.message ?? 'That did not work.')
    } finally {
      setBusy(false)
    }
  }

  const host = () =>
    run(async () => {
      const invite = await createInvite({ lanOnly, hostSide })
      inviteRef.current = invite
      arm(invite.transport, hostSide, 'Direct link')
      setCode(invite.code)
      setInput('')
      setStage('host-code')
    })

  const acceptReply = () =>
    run(async () => {
      await inviteRef.current.accept(input)
      setStage('waiting')
    })

  const join = () =>
    run(async () => {
      const session = await acceptInvite(input, { lanOnly })
      arm(session.transport, session.side, 'Direct link')
      setCode(session.code)
      setStage('guest-code')
    })

  function openRoom(side) {
    setError(null)
    arm(joinRoom(room), side, 'Same device')
    setStage('waiting')
  }

  function reset() {
    if (!handedOverRef.current) transportRef.current?.close()
    transportRef.current = null
    inviteRef.current = null
    setCode('')
    setInput('')
    setError(null)
    setStage('menu')
  }

  const banner = error ? <p className="notice notice--error">{error}</p> : null

  if (stage === 'menu') {
    return (
      <Shell
        eyebrow="Online match"
        title="No server, no account"
        hint="The two browsers talk straight to each other. All you exchange is one code each way."
        onBack={onBack}
        backLabel="Main menu"
      >
        {banner}
        {webrtcSupported() ? null : (
          <p className="notice notice--error">This browser has no WebRTC, so direct play is out.</p>
        )}

        <div className="field">
          <div className="field__label">
            <h2 className="heading">Your colour</h2>
          </div>
          <div className="choice-row">
            {SIDES.map((option) => (
              <button
                key={option.value}
                type="button"
                className="btn"
                aria-pressed={hostSide === option.value}
                onClick={() => setHostSide(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="field__note">Applies when you are the one sending the invite.</p>
        </div>

        <div className="field">
          <div className="field__label">
            <h2 className="heading">Reach</h2>
          </div>
          <div className="choice-row">
            <button
              type="button"
              className="btn"
              aria-pressed={!lanOnly}
              onClick={() => setLanOnly(false)}
            >
              Anywhere
            </button>
            <button
              type="button"
              className="btn"
              aria-pressed={lanOnly}
              onClick={() => setLanOnly(true)}
            >
              Same network
            </button>
          </div>
          <p className="field__note">
            {lanOnly
              ? 'Only your local addresses go in the code. Nothing outside this network is contacted.'
              : 'A public STUN server is asked what your address looks like from outside. No game data passes through it.'}
          </p>
        </div>

        <nav className="menu-list" aria-label="How to connect">
          <button
            type="button"
            className="btn btn--primary big-btn"
            disabled={busy || !webrtcSupported()}
            onClick={host}
          >
            <span className="big-btn__glyph" aria-hidden="true">
              ♔
            </span>
            <span>
              <span className="big-btn__label">{busy ? 'Building the invite…' : 'Send an invite'}</span>
              <span className="big-btn__hint">You get a code to pass on, they send one back.</span>
            </span>
          </button>

          <button
            type="button"
            className="btn big-btn"
            disabled={busy || !webrtcSupported()}
            onClick={() => setStage('guest-paste')}
          >
            <span className="big-btn__glyph" aria-hidden="true">
              ♚
            </span>
            <span>
              <span className="big-btn__label">I have an invite</span>
              <span className="big-btn__hint">Paste their code, send yours back.</span>
            </span>
          </button>

          {sameDeviceSupported() ? (
            <button
              type="button"
              className="btn big-btn"
              disabled={busy}
              onClick={() => setStage('room')}
            >
              <span className="big-btn__glyph" aria-hidden="true">
                ♖
              </span>
              <span>
                <span className="big-btn__label">Same device, two tabs</span>
                <span className="big-btn__hint">
                  No network at all. Good for trying the online board out.
                </span>
              </span>
            </button>
          ) : null}
        </nav>
      </Shell>
    )
  }

  if (stage === 'host-code') {
    return (
      <Shell
        eyebrow="Step 1 of 2"
        title="Send them this"
        hint="Any channel will do — chat, mail, a photo of the screen."
        onBack={reset}
        backLabel="Start over"
      >
        {banner}
        <p className="notice">
          This code lists the network addresses your browser can be reached on. Send it to the
          person you are playing, not to a public channel.
        </p>

        <div className="field">
          <div className="field__label">
            <h2 className="heading">Your invite</h2>
            <button type="button" className="btn btn--ghost" onClick={() => copy('invite', code)}>
              {copiedKey === 'invite' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea className="code-box" readOnly value={formatCode(code)} spellCheck="false" />
        </div>

        <div className="field">
          <div className="field__label">
            <h2 className="heading">Their reply</h2>
          </div>
          <textarea
            className="code-box"
            value={input}
            spellCheck="false"
            placeholder="Paste the code their screen shows"
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || input.trim().length === 0}
            onClick={acceptReply}
          >
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </Shell>
    )
  }

  if (stage === 'guest-paste') {
    return (
      <Shell
        eyebrow="Step 1 of 2"
        title="Paste their invite"
        onBack={reset}
        backLabel="Start over"
      >
        {banner}
        <div className="field">
          <textarea
            className="code-box"
            value={input}
            spellCheck="false"
            placeholder="Paste the invite code"
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || input.trim().length === 0}
            onClick={join}
          >
            {busy ? 'Reading…' : 'Continue'}
          </button>
        </div>
      </Shell>
    )
  }

  if (stage === 'guest-code') {
    return (
      <Shell
        eyebrow="Step 2 of 2"
        title="Send this back"
        hint="The game starts by itself the moment they paste it."
        onBack={reset}
        backLabel="Start over"
      >
        {banner}
        <div className="field">
          <div className="field__label">
            <h2 className="heading">Your reply</h2>
            <button type="button" className="btn btn--ghost" onClick={() => copy('reply', code)}>
              {copiedKey === 'reply' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea className="code-box" readOnly value={formatCode(code)} spellCheck="false" />
        </div>
        <p className="waiting">
          <span className="waiting__dots" aria-hidden="true" />
          Waiting for them to connect
        </p>
      </Shell>
    )
  }

  if (stage === 'room') {
    return (
      <Shell
        eyebrow="Same device"
        title={`Room ${room}`}
        hint="Open this page in a second tab, come back here, and pick the other colour."
        onBack={reset}
        backLabel="Start over"
      >
        {banner}
        <div className="field">
          <div className="field__label">
            <h2 className="heading">Room name</h2>
            <button type="button" className="btn btn--ghost" onClick={() => setRoom(createRoomName())}>
              New room
            </button>
          </div>
          <input
            className="code-box code-box--single"
            value={room}
            spellCheck="false"
            onChange={(event) => setRoom(event.target.value.toUpperCase().slice(0, 12))}
          />
        </div>
        <div className="choice-row">
          <button type="button" className="btn btn--primary" onClick={() => openRoom('w')}>
            Open as White
          </button>
          <button type="button" className="btn" onClick={() => openRoom('b')}>
            Open as Black
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell eyebrow="Online match" title="Linking up" onBack={reset} backLabel="Start over">
      {banner}
      <p className="waiting">
        <span className="waiting__dots" aria-hidden="true" />
        Waiting for the other side
      </p>
    </Shell>
  )
}

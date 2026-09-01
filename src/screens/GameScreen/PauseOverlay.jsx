import { useEffect, useRef } from 'react'
import ViewControls from '../../components/ViewControls/ViewControls'
import { useCopy } from '../../hooks/useCopy'
import { PITCH_LEVELS, WATER_LEVELS } from '../../app/settings'
import { ROTATIONS } from '../../chess/geometry'
import { moveCsv, moveTable } from '../../chess/notation'
import './PauseOverlay.css'

function shareUrl(fen) {
  const url = new URL(window.location.href)
  url.searchParams.set('fen', fen)
  return url.toString()
}

export default function PauseOverlay({
  online,
  fen,
  pgn,
  history,
  result,
  canUndo,
  canRedo,
  settings,
  onSettings,
  onResume,
  onRestart,
  onUndo,
  onRedo,
  onLeave,
}) {
  const firstRef = useRef(null)
  const { copiedKey, copy } = useCopy()

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  const label = (key, fallback) => (copiedKey === key ? 'Copied' : fallback)

  return (
    <div
      className="pause"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onResume()
      }}
    >
      <button type="button" className="pause__backdrop" aria-label="Resume the game" onClick={onResume} />

      <div className="pause__card plank">
        <h2 className="pause__title" id="pause-title">
          Paused
        </h2>

        <button type="button" className="btn btn--primary pause__resume" ref={firstRef} onClick={onResume}>
          Resume
        </button>

        <section className="pause__section" aria-label="Game">
          <h3 className="heading">Game</h3>
          <div className="pause__row">
            <button type="button" className="btn" onClick={onRestart}>
              {online ? 'Restart for both' : 'Restart'}
            </button>
            <button type="button" className="btn" onClick={onUndo} disabled={!canUndo || online}>
              Undo
            </button>
            <button type="button" className="btn" onClick={onRedo} disabled={!canRedo || online}>
              Redo
            </button>
          </div>
          {online ? (
            <p className="pause__note">Take-backs are off in an online game.</p>
          ) : null}
        </section>

        <section className="pause__section" aria-label="View">
          <h3 className="heading">View</h3>
          <ViewControls
            rotation={settings.rotation}
            pitch={settings.pitch}
            pitches={PITCH_LEVELS}
            onRotate={(next) =>
              onSettings({ rotation: ((next % ROTATIONS) + ROTATIONS) % ROTATIONS })
            }
            onPitch={(pitch) => onSettings({ pitch })}
          />
          <div className="pause__row pause__row--tight">
            {WATER_LEVELS.map((option) => (
              <button
                key={option.label}
                type="button"
                className="btn"
                aria-pressed={settings.water === option.value}
                onClick={() => onSettings({ water: option.value })}
              >
                {option.label} water
              </button>
            ))}
          </div>
          <div className="pause__row pause__row--tight">
            <button
              type="button"
              className="btn"
              aria-pressed={settings.trails}
              onClick={() => onSettings({ trails: !settings.trails })}
            >
              Move trails
            </button>
            <button
              type="button"
              className="btn"
              aria-pressed={settings.coordinates}
              onClick={() => onSettings({ coordinates: !settings.coordinates })}
            >
              Coordinates
            </button>
          </div>
        </section>

        <section className="pause__section" aria-label="Export">
          <h3 className="heading">Export</h3>
          <div className="pause__row">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => copy('pgn', pgn)}
              disabled={!pgn}
            >
              {label('pgn', 'PGN')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => copy('moves', moveTable(history, { result }))}
              disabled={history.length === 0}
            >
              {label('moves', 'Move list')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => copy('csv', moveCsv(history))}
              disabled={history.length === 0}
            >
              {label('csv', 'CSV')}
            </button>
          </div>
          <div className="pause__row">
            <button type="button" className="btn btn--ghost" onClick={() => copy('fen', fen)}>
              {label('fen', 'Position (FEN)')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => copy('link', shareUrl(fen))}
            >
              {label('link', 'Share link')}
            </button>
          </div>
          <p className="pause__note">
            PGN is the format other chess programs read. The move list is the same game
            written the way a book prints it; the CSV is one row per ply, for a spreadsheet.
          </p>
        </section>

        <button type="button" className="btn btn--danger pause__leave" onClick={onLeave}>
          {online ? 'Resign and leave' : 'Main menu'}
        </button>
      </div>
    </div>
  )
}

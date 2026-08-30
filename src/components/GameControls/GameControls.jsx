import { useCopy } from '../../hooks/useCopy'
import './GameControls.css'

function shareUrl(fen) {
  const url = new URL(window.location.href)
  url.searchParams.set('fen', fen)
  return url.toString()
}

export default function GameControls({ fen, pgn, canUndo, canRedo, onUndo, onRedo, onReset }) {
  const { copiedKey, copy } = useCopy()

  const label = (key, fallback) => (copiedKey === key ? 'Copied' : fallback)

  return (
    <section className="controls" aria-label="Game controls">
      <div className="controls__row">
        <button type="button" className="btn btn--primary" onClick={onReset}>
          New game
        </button>
        <button type="button" className="btn" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="btn" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
      </div>
      <div className="controls__row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => copy('pgn', pgn)}
          disabled={!pgn}
        >
          {label('pgn', 'Copy PGN')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => copy('fen', fen)}>
          {label('fen', 'Copy FEN')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => copy('link', shareUrl(fen))}
        >
          {label('link', 'Share position')}
        </button>
      </div>
    </section>
  )
}

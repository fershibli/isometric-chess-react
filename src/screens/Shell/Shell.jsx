import './Shell.css'

/** The carved plaque every out-of-game screen sits on. */
export default function Shell({ eyebrow, title, hint, onBack, backLabel = 'Back', children }) {
  return (
    <div className="shell">
      <div className="shell__card plank">
        {eyebrow ? <p className="shell__eyebrow">{eyebrow}</p> : null}
        <h1 className="shell__title">{title}</h1>
        {hint ? <p className="shell__hint">{hint}</p> : null}
        <div className="shell__body">{children}</div>
        {onBack ? (
          <button type="button" className="btn btn--ghost shell__back" onClick={onBack}>
            ← {backLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

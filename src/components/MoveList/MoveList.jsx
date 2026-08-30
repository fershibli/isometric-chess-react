import { useEffect, useRef } from 'react'
import './MoveList.css'

function toPairs(history) {
  const pairs = []
  for (let index = 0; index < history.length; index += 2) {
    pairs.push({
      number: index / 2 + 1,
      white: history[index],
      black: history[index + 1],
      whiteIndex: index,
      blackIndex: index + 1,
    })
  }
  return pairs
}

export default function MoveList({ history }) {
  const scrollRef = useRef(null)
  const pairs = toPairs(history)
  const lastIndex = history.length - 1

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [history.length])

  return (
    <section className="moves" aria-label="Move history">
      <h2 className="panel__heading">Moves</h2>
      <div className="moves__scroll" ref={scrollRef}>
        {pairs.length === 0 ? (
          <p className="moves__empty">No moves yet. White opens.</p>
        ) : (
          <ol className="moves__list">
            {pairs.map((pair) => (
              <li key={pair.number} className="moves__row">
                <span className="moves__number">{pair.number}.</span>
                <span
                  className={`moves__san${pair.whiteIndex === lastIndex ? ' moves__san--current' : ''}`}
                >
                  {pair.white.san}
                </span>
                <span
                  className={`moves__san${pair.blackIndex === lastIndex ? ' moves__san--current' : ''}`}
                >
                  {pair.black ? pair.black.san : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

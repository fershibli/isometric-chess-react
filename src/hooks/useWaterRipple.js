import { useEffect } from 'react'
import { RIPPLE_DURATION_MS, rippleAt } from '../board/water'

/**
 * Runs one square's share of a ripple on the element in `ref`.
 *
 * This is driven from JavaScript rather than a CSS class because a ripple has
 * to restart the moment the next piece lands, and re-triggering a CSS
 * animation means removing the class, forcing a reflow and adding it back.
 * The Web Animations API just replaces the running animation. Keyframes are
 * composited on top of whatever the idle swell is doing, so the two add up.
 */
export function useWaterRipple(ref, { ripple, row, col, strength = 1 }) {
  useEffect(() => {
    const node = ref.current
    // jsdom has no Web Animations API, and a reader who asked for less motion
    // does not want the board breathing at them.
    if (!node || typeof node.animate !== 'function') return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const wave = rippleAt(row, col, ripple, strength)
    if (!wave) return undefined

    const peak = wave.inverted ? wave.height * 0.55 : -wave.height
    const rebound = -peak * 0.4
    const settle = peak * 0.14

    const animation = node.animate(
      [
        { transform: 'translate3d(0, 0, 0)' },
        { transform: `translate3d(0, ${peak}px, 0)`, offset: 0.26 },
        { transform: `translate3d(0, ${rebound}px, 0)`, offset: 0.56 },
        { transform: `translate3d(0, ${settle}px, 0)`, offset: 0.8 },
        { transform: 'translate3d(0, 0, 0)' },
      ],
      {
        duration: RIPPLE_DURATION_MS,
        delay: wave.delay,
        easing: 'cubic-bezier(0.33, 0.85, 0.4, 1)',
        composite: 'add',
        fill: 'none',
      },
    )

    return () => animation.cancel()
  }, [col, ref, ripple, row, strength])
}

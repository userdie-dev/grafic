const MIN_DISTANCE = 50
const HORIZONTAL_BIAS = 1.5

/** Horizontal swipe: left = next month, right = previous. */
export function useMonthSwipe(onSwipe: (direction: 1 | -1) => void) {
  let touch: { x: number; y: number } | null = null

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    touch = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null
  }

  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0]
    if (!touch || !t) return
    const dx = t.clientX - touch.x
    const dy = t.clientY - touch.y
    touch = null
    if (Math.abs(dx) > MIN_DISTANCE && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS) onSwipe(dx < 0 ? 1 : -1)
  }

  return { onTouchStart, onTouchEnd }
}

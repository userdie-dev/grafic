import { onBeforeUnmount, ref } from 'vue'

const CLOSE_ANIMATION_MS = 200

/**
 * The parent unmounts a drawer on `close`, so wait for the exit animation to finish first.
 * A stale `close` would clear the selection of a newer editor opened meanwhile, hence the cleanup.
 */
export function useDrawerClose(onClosed: () => void) {
  const open = ref(true)
  let timer: ReturnType<typeof setTimeout> | undefined
  function close() {
    open.value = false
    timer = setTimeout(onClosed, CLOSE_ANIMATION_MS)
  }
  onBeforeUnmount(() => clearTimeout(timer))
  return { open, close, onOpenChange: (v: boolean) => !v && close() }
}

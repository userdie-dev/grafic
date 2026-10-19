import { QueryClient, dehydrate, hydrate } from '@tanstack/vue-query'

const KEY = 'grafic.cache'
const WEEK = 7 * 24 * 60 * 60 * 1000

/** Query cache mirrored to localStorage, so the last known schedule is shown without internet. */
export function createQueryClient(): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { retry: 1, gcTime: WEEK } } })

  try {
    const saved = localStorage.getItem(KEY)
    if (saved) hydrate(client, JSON.parse(saved))
  } catch {
    /* corrupted or unavailable cache: start empty */
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  client.getQueryCache().subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        const state = dehydrate(client, { shouldDehydrateQuery: (q) => q.state.status === 'success' })
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch {
        /* storage full or unavailable */
      }
    }, 500)
  })

  return client
}

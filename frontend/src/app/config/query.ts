import { QueryClient, dehydrate, hydrate } from '@tanstack/vue-query'
import { isAndroid } from '@/lib/syncService'

const KEY = 'grafic.cache'
const WEEK = 7 * 24 * 60 * 60 * 1000

/** Query cache mirrored to localStorage, so the last known schedule is shown without internet. */
export function createQueryClient(): QueryClient {
  // WebViews can report offline while the API is reachable. Let HTTP determine
  // connectivity instead of silently pausing requests until an online event.
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: 1, gcTime: WEEK, networkMode: 'always' },
    mutations: { networkMode: 'always' },
  } })

  try {
    const saved = localStorage.getItem(KEY)
    if (saved) hydrate(client, JSON.parse(saved))
  } catch {
    /* corrupted or unavailable cache: start empty */
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  function persist() {
    try {
      const state = dehydrate(client, {
        shouldDehydrateQuery: (q) => q.queryKey[0] === 'subs'
          ? q.state.data !== undefined
          : q.state.status === 'success' && !(isAndroid && q.queryKey[0] === 'shifts' && q.queryKey[1] === 'me'),
      })
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable */
    }
  }

  client.getQueryCache().subscribe((event) => {
    clearTimeout(timer)
    if (event.type === 'updated' && event.action.type === 'success' && event.query.queryKey[0] === 'subs') persist()
    else timer = setTimeout(persist, 500)
  })

  return client
}

import { Capacitor, registerPlugin } from '@capacitor/core'
import type { QueryClient } from '@tanstack/vue-query'
import { watch } from 'vue'
import { setToken } from '@/lib/api'
import type { Subscription } from '@/lib/dto'
import type { useScheduleStore } from '@/stores/schedule'

type ScheduleStore = ReturnType<typeof useScheduleStore>
type Snapshot = Pick<ScheduleStore['state'], 'device' | 'labels' | 'colors' | 'hidden' | 'groups'> & {
  subscriptions?: Subscription[]
}

const storage = registerPlugin<{
  read(): Promise<{ snapshot?: string }>
  write(options: { snapshot: string }): Promise<void>
}>('ScheduleStorage')

/** Mirror the friend list outside the WebView so it survives a bundle switch. */
export async function restoreAndroidFriends(store: ScheduleStore, client: QueryClient) {
  if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('ScheduleStorage')) return

  try {
    const { snapshot: saved } = await storage.read()
    if (saved) {
      const { subscriptions, ...previous } = JSON.parse(saved) as Snapshot
      if (previous.device && !store.state.device) {
        Object.assign(store.state, previous)
        setToken(previous.device.token)
      }
      const owner = store.state.device?.userId
      if (owner && previous.device?.userId === owner && subscriptions && !client.getQueryData(['subs', owner])) {
        client.setQueryData(['subs', owner], subscriptions)
      }
    }
  } catch (error) {
    console.warn('Could not restore the friend list', error)
  }

  let writing = Promise.resolve()
  function save() {
    const { device, labels, colors, hidden, groups } = store.state
    if (!device) return writing
    const subscriptions = client.getQueryData<Subscription[]>(['subs', device.userId])
    const snapshot = JSON.stringify({ device, labels, colors, hidden, groups, subscriptions } satisfies Snapshot)
    const next = writing.then(() => storage.write({ snapshot }))
    writing = next.catch((error: unknown) => { console.warn('Could not save the friend list', error) })
    return next
  }

  const persist = () => { void save().catch(() => { /* Logged in save(). */ }) }
  watch(() => [store.state.device, store.state.labels, store.state.colors, store.state.hidden, store.state.groups], persist, { deep: true })
  client.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success' && event.query.queryKey[0] === 'subs') persist()
  })
  persist()
  return save
}

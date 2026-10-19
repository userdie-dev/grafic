import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { setUpdateStatus } from '@/composables/useUpdateStatus'

const RELEASE_BASE = 'https://github.com/userdie-dev/grafic/releases/latest/download'
/** Build id we are updating to; survives the webview reload so the next start can confirm the update. */
const PENDING_KEY = 'grafic.updatingTo'

interface RemoteVersion {
  build: string
  url: string
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

// Reading storage can throw (blocked site data); the toast is a nicety, never a reason to fail an update.
function pendingBuild(value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(PENDING_KEY)
    if (value) localStorage.setItem(PENDING_KEY, value)
    else localStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
  return null
}

// OTA-обновление веб-части: сверяем сборку с последним GitHub Release,
// скачиваем новую и применяем (перезапуск webview).
export async function initUpdater() {
  if (!Capacitor.isNativePlatform()) return

  // подтверждаем, что текущий бандл загрузился, иначе плагин откатится назад
  await CapacitorUpdater.notifyAppReady()

  // we just booted into the bundle we downloaded last time
  if (pendingBuild() === __BUILD_ID__) {
    pendingBuild('')
    setUpdateStatus({ kind: 'updated', text: `Приложение обновлено до версии ${__APP_VERSION__}` }, 5000)
  }

  let remote: RemoteVersion
  try {
    // нативный http: fetch из webview блокируется CORS (редирект github.com -> githubusercontent без заголовков)
    const res = await CapacitorHttp.get({ url: `${RELEASE_BASE}/version.json`, headers: { 'Cache-Control': 'no-cache' } })
    if (res.status !== 200) {
      setUpdateStatus({ kind: 'error', text: `Не удалось проверить обновление: сервер ответил ${res.status}` }, 8000)
      return
    }
    remote = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as RemoteVersion
  } catch (e) {
    // no network is the usual reason, not worth a toast
    console.warn('update check failed', e)
    return
  }
  if (!remote.build || remote.build === __BUILD_ID__) return

  let bundle
  try {
    setUpdateStatus({ kind: 'downloading', text: 'Скачиваем обновление…' })
    bundle = await CapacitorUpdater.download({ url: remote.url, version: remote.build })
  } catch (e) {
    console.warn('update download failed', e)
    setUpdateStatus({ kind: 'error', text: `Не удалось скачать обновление: ${errorText(e)}` }, 10000)
    return
  }

  pendingBuild(remote.build)
  try {
    await CapacitorUpdater.set(bundle)
  } catch (e) {
    // set() reloads the webview, which can reject the pending bridge call ("Failed to fetch") even
    // though the switch worked. If the page is still alive a moment later, it really failed.
    console.warn('update set rejected', e)
    await new Promise((r) => setTimeout(r, 3000))
    pendingBuild('')
    setUpdateStatus({ kind: 'error', text: `Не удалось применить обновление: ${errorText(e)}` }, 10000)
  }
}

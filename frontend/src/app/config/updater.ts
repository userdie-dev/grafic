import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { setUpdateStatus } from '@/composables/useUpdateStatus'

const RELEASE_BASE = 'https://github.com/userdie-dev/grafic/releases/latest/download'
/** Build id we are updating to; survives the webview reload so the next start can confirm the update. */
const PENDING_KEY = 'grafic.updatingTo'

interface RemoteVersion {
  build: string
  url: string
  /** sha256 of dist.zip; the updater plugin refuses to download a bundle without it */
  checksum?: string
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

/** Drop leftovers of earlier attempts (a half-downloaded bundle with the same version makes download() fail). */
async function dropStaleBundles() {
  try {
    const [{ bundles }, { bundle: current }] = await Promise.all([CapacitorUpdater.list(), CapacitorUpdater.current()])
    for (const b of bundles) {
      if (b.id !== current.id && b.id !== 'builtin') await CapacitorUpdater.delete({ id: b.id }).catch(() => {})
    }
  } catch (e) {
    console.warn('bundle cleanup failed', e)
  }
}

export type UpdateResult = 'latest' | 'updating' | 'error'

/**
 * Compares this build with the latest GitHub Release and applies a newer one (restarts the webview).
 * Failures are only logged on the automatic check at start; a manual check reports them in the toast.
 */
export async function checkForUpdates({ manual = false } = {}): Promise<UpdateResult> {
  if (!Capacitor.isNativePlatform()) return 'latest'

  const fail = (text: string, e?: unknown): UpdateResult => {
    console.warn(text, e)
    if (manual) setUpdateStatus({ kind: 'error', text }, 8000)
    return 'error'
  }

  let remote: RemoteVersion
  try {
    // нативный http: fetch из webview блокируется CORS (редирект github.com -> githubusercontent без заголовков)
    const res = await CapacitorHttp.get({ url: `${RELEASE_BASE}/version.json`, headers: { 'Cache-Control': 'no-cache' } })
    if (res.status !== 200) return fail(`Не удалось проверить обновление: сервер ответил ${res.status}`)
    remote = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as RemoteVersion
  } catch (e) {
    return fail(`Не удалось проверить обновление: ${errorText(e)}`, e)
  }
  if (!remote.build || remote.build === __BUILD_ID__) {
    if (manual) setUpdateStatus({ kind: 'updated', text: 'У вас последняя версия' }, 4000)
    return 'latest'
  }

  let bundle
  try {
    setUpdateStatus({ kind: 'downloading', text: 'Скачиваем обновление…' })
    await dropStaleBundles()
    bundle = await CapacitorUpdater.download({ url: remote.url, version: remote.build, checksum: remote.checksum })
  } catch (e) {
    setUpdateStatus(null)
    return fail(`Не удалось скачать обновление: ${errorText(e)}`, e)
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
    setUpdateStatus(null)
    return fail(`Не удалось применить обновление: ${errorText(e)}`, e)
  }
  return 'updating'
}

// OTA-обновление веб-части при старте: тихая проверка, ошибки только в консоль.
export async function initUpdater() {
  if (!Capacitor.isNativePlatform()) return

  // подтверждаем, что текущий бандл загрузился, иначе плагин откатится назад
  await CapacitorUpdater.notifyAppReady()

  // we just booted into the bundle we downloaded last time
  if (pendingBuild() === __BUILD_ID__) {
    pendingBuild('')
    setUpdateStatus({ kind: 'updated', text: `Приложение обновлено до версии ${__APP_VERSION__}` }, 5000)
  }

  await checkForUpdates()
}

import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const RELEASE_BASE = 'https://github.com/userdie-dev/grafic/releases/latest/download'

interface RemoteVersion {
  build: string
  url: string
}

// OTA-обновление веб-части: сверяем сборку с последним GitHub Release,
// скачиваем новую и применяем (перезапуск webview).
export async function initUpdater() {
  if (!Capacitor.isNativePlatform()) return

  // подтверждаем, что текущий бандл загрузился, иначе плагин откатится назад
  await CapacitorUpdater.notifyAppReady()

  try {
    // нативный http: fetch из webview блокируется CORS (редирект github.com -> githubusercontent без заголовков)
    const res = await CapacitorHttp.get({ url: `${RELEASE_BASE}/version.json`, headers: { 'Cache-Control': 'no-cache' } })
    if (res.status !== 200) return
    const remote = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as RemoteVersion
    if (!remote.build || remote.build === __BUILD_ID__) return

    const bundle = await CapacitorUpdater.download({ url: remote.url, version: remote.build })
    await CapacitorUpdater.set(bundle)
  } catch (e) {
    console.warn('update check failed', e)
  }
}

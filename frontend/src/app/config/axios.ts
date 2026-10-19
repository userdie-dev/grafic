import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

let token = ''
/** The store owns the device; the http layer only needs its token. */
export const setToken = (t: string) => (token = t)

/** Called when the server rejects our token (e.g. its database was reset); the store re-registers the device. */
let onUnauthorized: (() => Promise<void>) | undefined
export const setUnauthorizedHandler = (fn: () => Promise<void>) => (onUnauthorized = fn)

export const http = axios.create({ baseURL: API_URL })
http.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
type Retryable = { _retried?: boolean }
http.interceptors.response.use(undefined, async (e) => {
  const cfg = axios.isAxiosError(e) ? e.config : undefined
  if (cfg && e.response?.status === 401 && token && onUnauthorized && !(cfg as Retryable)._retried) {
    try {
      await onUnauthorized()
      ;(cfg as Retryable)._retried = true
      return await http.request(cfg)
    } catch {
      /* fall through to the original error */
    }
  }
  const m = axios.isAxiosError(e) ? e.response?.data?.message : undefined
  return Promise.reject(new Error(Array.isArray(m) ? m.join(', ') : (m ?? e.message)))
})

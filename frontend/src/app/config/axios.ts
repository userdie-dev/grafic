import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

let token = ''
/** The store owns the device; the http layer only needs its token. */
export const setToken = (t: string) => (token = t)

export const http = axios.create({ baseURL: API_URL })
http.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
http.interceptors.response.use(undefined, (e) => {
  const m = axios.isAxiosError(e) ? e.response?.data?.message : undefined
  return Promise.reject(new Error(Array.isArray(m) ? m.join(', ') : (m ?? e.message)))
})

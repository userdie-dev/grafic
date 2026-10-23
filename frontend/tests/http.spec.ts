import { toUtcInput } from '@/lib/tz'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const load = async () => {
  const cfg = await import('@/app/config/axios')
  const calls: InternalAxiosRequestConfig[] = []
  let respond: (c: InternalAxiosRequestConfig) => Promise<unknown> = async (c) => ({
    data: 'ok',
    status: 200,
    statusText: '',
    headers: {},
    config: c,
  })
  cfg.http.defaults.adapter = (async (c: InternalAxiosRequestConfig) => {
    calls.push(c)
    return respond(c)
  }) as never
  return { ...cfg, calls, setRespond: (r: typeof respond) => (respond = r) }
}

describe('axios config', () => {
  it('defaults the API url to localhost:3000', async () => {
    const { API_URL } = await load()
    expect(API_URL).toBe('http://localhost:3000')
  })

  it('uses VITE_API_URL when set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    const { API_URL, http } = await load()
    expect(API_URL).toBe('https://api.example.com')
    expect(http.defaults.baseURL).toBe('https://api.example.com')
  })

  it('adds the bearer token only once it is set', async () => {
    const { http, setToken, calls } = await load()
    await http.get('/a')
    expect(calls[0]!.headers.Authorization).toBeUndefined()
    setToken('tok')
    await http.get('/b')
    expect(calls[1]!.headers.Authorization).toBe('Bearer tok')
  })

  describe('error mapping', () => {
    const fail = (data: unknown, status = 400) => async (c: InternalAxiosRequestConfig) => {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', c, {}, { data, status, statusText: '', headers: {}, config: c })
    }

    it('uses a string server message', async () => {
      const { http, setRespond } = await load()
      setRespond(fail({ message: 'Unknown code' }))
      await expect(http.get('/x')).rejects.toThrow('Unknown code')
    })

    it('joins validation message arrays', async () => {
      const { http, setRespond } = await load()
      setRespond(fail({ message: ['a bad', 'b bad'] }))
      await expect(http.get('/x')).rejects.toThrow('a bad, b bad')
    })

    it('falls back to the axios message when the body has none', async () => {
      const { http, setRespond } = await load()
      setRespond(fail({}))
      await expect(http.get('/x')).rejects.toThrow('Request failed')
    })

    it('falls back for network errors without a response', async () => {
      const { http, setRespond } = await load()
      setRespond(async () => {
        throw new AxiosError('Network Error', 'ERR_NETWORK')
      })
      await expect(http.get('/x')).rejects.toThrow('Network Error')
    })

    it('passes through non-axios errors', async () => {
      const { http, setRespond } = await load()
      setRespond(async () => {
        throw new Error('boom')
      })
      await expect(http.get('/x')).rejects.toThrow('boom')
    })
  })
})

describe('api', () => {
  let mod: Awaited<ReturnType<typeof load>>
  let api: typeof import('@/lib/api')
  beforeEach(async () => {
    mod = await load()
    api = await import('@/lib/api')
  })

  const last = () => mod.calls.at(-1)!

  it('builds requests', async () => {
    await api.registerDevice()
    expect([last().method, last().url]).toEqual(['post', '/devices'])

    await api.api.myShifts()
    expect(last().url).toBe('/me/shifts')
    await api.api.myShifts('2030-01-01', '2030-01-31')
    expect(last().url).toBe('/me/shifts?from=2030-01-01&to=2030-01-31')
    await api.api.myShifts('2030-01-01')
    expect(last().url).toBe('/me/shifts')

    await api.api.saveShifts([{ date: '2030-01-01', start: '09:00', end: '10:00' }])
    expect([last().method, last().url, JSON.parse(last().data)]).toEqual([
      'put',
      '/me/shifts',
      { shifts: [toUtcInput({ date: '2030-01-01', start: '09:00', end: '10:00' })] },
    ])

    await api.api.deleteShift('s1')
    expect([last().method, last().url]).toEqual(['delete', '/me/shifts/s1'])
    await api.api.regenerateCode()
    expect([last().method, last().url]).toEqual(['post', '/me/share-code/regenerate'])
    await api.api.subscriptions()
    expect(last().url).toBe('/subscriptions')
    await api.api.subscribe('ABC123')
    expect(JSON.parse(last().data)).toEqual({ code: 'ABC123' })
    await api.api.unsubscribe('u1')
    expect([last().method, last().url]).toEqual(['delete', '/subscriptions/u1'])
    await api.api.friendShifts('o1')
    expect(last().url).toBe('/friends/o1/shifts')
    await api.api.friendShifts('o1', 'a', 'b')
    expect(last().url).toBe('/friends/o1/shifts?from=a&to=b')
  })

  it('builds the SSE url with an encoded token', () => {
    expect(api.eventsUrl('a b/c')).toBe('http://localhost:3000/events?token=a%20b%2Fc')
  })

  it('re-exports setToken', () => expect(api.setToken).toBe(mod.setToken))
})

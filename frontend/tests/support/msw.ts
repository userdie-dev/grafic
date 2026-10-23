import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { FakeApi } from './fakeApi'

export const API = 'http://localhost:3000'

/** MSW server that forwards every API call to a FakeApi instance. */
export function createApiServer(api: FakeApi) {
  const bearer = (h: Headers) => h.get('authorization')?.replace(/^Bearer /, '')
  const respond = async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(request.method)
    const res = api.handle({
      method: request.method,
      path: url.pathname,
      query: url.searchParams,
      body: hasBody ? await request.json().catch(() => undefined) : undefined,
      token: bearer(request.headers),
    })
    return HttpResponse.json(res.body as never, { status: res.status })
  }
  return setupServer(http.all(`${API}/*`, respond))
}

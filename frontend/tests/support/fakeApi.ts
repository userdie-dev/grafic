/**
 * In-memory stand-in for the NestJS backend. It mirrors the real controllers' routes, status codes and
 * error messages, and is shared by the MSW contract tests (vitest) and the Playwright e2e suite.
 */
import type { Device, Shift, ShiftInput, Subscription } from '../../src/lib/dto'

export interface FakeRequest {
  method: string
  path: string
  query?: URLSearchParams
  body?: unknown
  /** bearer token, without the `Bearer ` prefix */
  token?: string
}
export interface FakeResponse {
  status: number
  body: unknown
}

interface User {
  id: string
  token: string
  shareCode: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const ok = (body: unknown, status = 200): FakeResponse => ({ status, body })
const fail = (status: number, message: string | string[]): FakeResponse => ({ status, body: { statusCode: status, message } })

export class FakeApi {
  users: User[] = []
  /** per-user shifts, keyed like the backend does it: date|start */
  private shifts = new Map<string, Map<string, Shift>>()
  subs: (Subscription & { subscriberId: string })[] = []
  /** every request seen, in order; lets tests assert on what the client actually sent */
  log: FakeRequest[] = []
  /** when set, the next request fails with this status (then it is cleared) */
  failNext?: { status: number; message?: string }
  private seq = 0

  private id = (p: string) => `${p}-${++this.seq}`

  private codes = 0

  private code() {
    const seed = ++this.codes
    return Array.from({ length: 6 }, (_, i) => CODE_ALPHABET[(seed * 7 + i * 11) % CODE_ALPHABET.length]).join('')
  }

  /** Creates a user directly (a friend the app under test can subscribe to). */
  seedUser(shifts: ShiftInput[] = [], shareCode?: string): User {
    const user: User = { id: this.id('user'), token: `token-${this.seq}`, shareCode: shareCode ?? this.code() }
    this.users.push(user)
    this.put(user.id, shifts)
    return user
  }

  shiftsOf(userId: string): Shift[] {
    return [...(this.shifts.get(userId)?.values() ?? [])].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  }

  private put(userId: string, items: ShiftInput[]) {
    const mine = this.shifts.get(userId) ?? new Map<string, Shift>()
    this.shifts.set(userId, mine)
    return items.map((i) => {
      const k = `${i.date}|${i.start}`
      const shift: Shift = { id: mine.get(k)?.id ?? this.id('shift'), date: i.date, start: i.start, end: i.end, note: i.note ?? null }
      mine.set(k, shift)
      return shift
    })
  }

  private list(userId: string, q?: URLSearchParams): FakeResponse {
    const from = q?.get('from') ?? undefined
    const to = q?.get('to') ?? undefined
    for (const v of [from, to]) if (v !== undefined && Number.isNaN(Date.parse(v))) return fail(400, `Invalid date: ${v}`)
    return ok(this.shiftsOf(userId).filter((s) => !from || !to || (s.date >= from && s.date <= to)))
  }

  handle(req: FakeRequest): FakeResponse {
    this.log.push(req)
    if (this.failNext) {
      const { status, message } = this.failNext
      this.failNext = undefined
      return fail(status, message ?? 'Injected failure')
    }
    const path = req.path.replace(/\/$/, '')
    const method = req.method.toUpperCase()

    if (method === 'POST' && path === '/devices') {
      const user = this.seedUser()
      const device: Device = { userId: user.id, token: user.token, shareCode: user.shareCode }
      return ok(device, 201)
    }

    const me = this.users.find((u) => u.token === req.token)
    if (!me) return fail(401, 'Unauthorized')

    if (method === 'POST' && path === '/me/share-code/regenerate') {
      me.shareCode = this.code()
      return ok({ shareCode: me.shareCode }, 201)
    }

    if (path === '/me/shifts') {
      if (method === 'GET') return this.list(me.id, req.query)
      if (method === 'PUT') {
        const items = (req.body as { shifts?: ShiftInput[] } | undefined)?.shifts
        if (!Array.isArray(items)) return fail(400, ['shifts must be an array'])
        if (items.length > 366) return fail(400, ['shifts must contain no more than 366 elements'])
        for (const i of items) {
          if (!DATE_RE.test(i.date)) return fail(400, ['date must be YYYY-MM-DD'])
          if (!TIME_RE.test(i.start)) return fail(400, ['start must be HH:mm'])
          if (!TIME_RE.test(i.end)) return fail(400, ['end must be HH:mm'])
        }
        return ok(this.put(me.id, items))
      }
    }

    const del = path.match(/^\/me\/shifts\/([^/]+)$/)
    if (del && method === 'DELETE') {
      const mine = this.shifts.get(me.id)
      const entry = [...(mine?.entries() ?? [])].find(([, s]) => s.id === del[1])
      if (!entry) return ok({ deleted: false })
      mine!.delete(entry[0])
      return ok({ deleted: true })
    }

    if (path === '/subscriptions') {
      if (method === 'GET') return ok(this.subs.filter((s) => s.subscriberId === me.id).map(({ id, ownerId }) => ({ id, ownerId })))
      if (method === 'POST') {
        const code = (req.body as { code?: unknown } | undefined)?.code
        if (typeof code !== 'string' || code.length < 4 || code.length > 6) return fail(400, ['code must be longer than or equal to 4 characters'])
        const owner = this.users.find((u) => u.shareCode === code.trim().toUpperCase())
        if (!owner) return fail(404, 'Unknown code')
        if (owner.id === me.id) return fail(400, 'Cannot subscribe to yourself')
        const sub =
          this.subs.find((s) => s.subscriberId === me.id && s.ownerId === owner.id) ??
          (this.subs.push({ id: this.id('sub'), ownerId: owner.id, subscriberId: me.id }), this.subs.at(-1)!)
        return ok({ id: sub.id, ownerId: sub.ownerId }, 201)
      }
    }

    const unsub = path.match(/^\/subscriptions\/([^/]+)$/)
    if (unsub && method === 'DELETE') {
      const before = this.subs.length
      this.subs = this.subs.filter((s) => !(s.id === unsub[1] && s.subscriberId === me.id))
      return ok({ deleted: this.subs.length < before })
    }

    const friend = path.match(/^\/friends\/([^/]+)\/shifts$/)
    if (friend && method === 'GET') {
      if (!this.subs.some((s) => s.subscriberId === me.id && s.ownerId === friend[1])) return fail(403, 'Forbidden')
      return this.list(friend[1]!, req.query)
    }

    return fail(404, `Cannot ${method} ${path}`)
  }
}

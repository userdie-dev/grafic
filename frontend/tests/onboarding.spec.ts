import { beforeEach, describe, expect, it, vi } from 'vitest'

async function load() {
  vi.resetModules()
  return (await import('@/composables/useOnboarding')).useOnboarding()
}

describe('useOnboarding', () => {
  beforeEach(() => localStorage.clear())

  it('opens on the first launch', async () => {
    expect((await load()).open.value).toBe(true)
  })

  it('stays closed after it was finished once', async () => {
    ;(await load()).finish()
    expect((await load()).open.value).toBe(false)
  })

  it('can be shown again from settings', async () => {
    const o = await load()
    o.finish()
    o.show()
    expect(o.open.value).toBe(true)
  })
})

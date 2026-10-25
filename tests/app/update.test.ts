import { describe, expect, it, vi } from 'vitest'
import { latestVersion, shouldReload } from '../../src/app/update'

const answer = (body: string, status = 200) => vi.fn(async () => new Response(body, { status }))

describe('updates', () => {
  it('reads the published version', async () => {
    const f = answer('{"version":"abc"}')
    expect(await latestVersion(1000, f)).toBe('abc')
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(String(url)).toMatch(/^version\.json\?t=\d+$/)
    expect(init).toMatchObject({ cache: 'no-store' })
  })

  it('gives up quietly when the version cannot be read', async () => {
    expect(await latestVersion(1000, answer('nope', 404))).toBeNull()
    expect(await latestVersion(1000, answer('{oops'))).toBeNull()
    expect(await latestVersion(1000, answer('{"version":5}'))).toBeNull()
    expect(
      await latestVersion(
        1000,
        vi.fn(async () => {
          throw new TypeError('offline')
        }),
      ),
    ).toBeNull()
    expect(await latestVersion(20, vi.fn(() => new Promise<Response>(() => {})))).toBeNull()
  })

  it('never reloads while a service is in progress or in dev', () => {
    expect(shouldReload('a', 'b', false)).toBe(true)
    expect([shouldReload('a', 'a', false), shouldReload('a', null, false), shouldReload('a', 'b', true), shouldReload('dev', 'b', false)]).toEqual([
      false,
      false,
      false,
      false,
    ])
  })
})

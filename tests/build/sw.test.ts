import { describe, expect, it } from 'vitest'
import { precacheList, renderServiceWorker } from '../../build/sw'
import template from '../../build/sw-template.js?raw'

class FakeRequest {
  constructor(
    readonly url: string,
    readonly init?: RequestInit,
  ) {}
}

/** Runs the service worker with in-memory caches and a fake network: enough for install and a page open. */
function runWorker(files: string[], network: (url: string) => string) {
  const handlers: Record<string, (e: unknown) => void> = {}
  const stores = new Map<string, Map<string, string>>()
  const precached: FakeRequest[] = []
  const store = (name: string) => stores.get(name) ?? stores.set(name, new Map()).get(name)!
  const caches = {
    open: async (name: string) => ({
      addAll: async (reqs: (string | FakeRequest)[]) => {
        for (const r of reqs) {
          const req = typeof r === 'string' ? new FakeRequest(r) : r
          precached.push(req)
          store(name).set(req.url, network(req.url))
        }
      },
      put: async (url: string, res: Response) => void store(name).set(url, await res.text()),
      match: async (url: string) => (store(name).has(url) ? new Response(store(name).get(url)) : undefined),
    }),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  }
  const self = { addEventListener: (type: string, h: (e: unknown) => void) => (handlers[type] = h), skipWaiting: () => {}, clients: { claim: async () => {} } }
  const fetch = async (url: string) => new Response(network(url))
  const code = renderServiceWorker(template, 'v1', files)
  new Function('self', 'caches', 'fetch', 'location', 'Request', code)(self, caches, fetch, { origin: 'https://spa.test' }, FakeRequest)
  return {
    stores,
    precached,
    install: async () => {
      const pending: Promise<unknown>[] = []
      handlers.install({ waitUntil: (p: Promise<unknown>) => pending.push(p) })
      await Promise.all(pending)
    },
    open: async (url: string) => {
      let res: Promise<Response> | undefined
      handlers.fetch({ request: { url, method: 'GET', mode: 'navigate' }, respondWith: (p: Promise<Response>) => (res = p) })
      return (await res!).text()
    },
  }
}

describe('service worker', () => {
  it('opens the newest page online but keeps the cached page that matches its cached scripts', async () => {
    let page = 'page v1'
    const sw = runWorker(['./', 'assets/index-v1.js'], url => (url.endsWith('.js') ? 'script' : page))
    await sw.install()
    page = 'page v2'
    expect(await sw.open('https://spa.test/game/')).toBe('page v2')
    expect(sw.stores.get('spa-v1')!.get('./')).toBe('page v1')
  })

  it('precaches from the network, past the browser cache', async () => {
    const sw = runWorker(['./', 'index.html'], () => 'x')
    await sw.install()
    expect(sw.precached.map(r => [r.url, r.init?.cache])).toEqual([
      ['./', 'reload'],
      ['index.html', 'reload'],
    ])
  })
})

describe('service worker build', () => {
  it('precaches every built file except maps and woff fallbacks', () => {
    const bundle = ['index.html', 'assets/index-abc.js', 'assets/index-abc.js.map', 'assets/f-600-x.woff2', 'assets/f-600-x.woff']
    const pub = ['manifest.webmanifest', 'icons/icon-192.png']
    expect(precacheList(bundle, pub)).toEqual(['./', 'assets/f-600-x.woff2', 'assets/index-abc.js', 'icons/icon-192.png', 'index.html', 'manifest.webmanifest'])
    expect(precacheList(['assets/a.js'], [])).toContain('index.html')
  })

  it('fills the version and file list into the service worker', () => {
    const out = renderServiceWorker("const VERSION = '__VERSION__'\nconst FILES = __FILES__", 'abc', ['./', 'index.html'])
    expect(out).toBe('const VERSION = "abc"\nconst FILES = ["./","index.html"]')
  })
})

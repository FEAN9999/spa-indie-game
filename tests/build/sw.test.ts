import { describe, expect, it } from 'vitest'
import { hashedFiles, precacheList, renderServiceWorker } from '../../build/sw'
import template from '../../build/sw-template.js?raw'

class FakeRequest {
  constructor(
    readonly url: string,
    readonly init?: RequestInit,
  ) {}
}

/**
 * Runs the service worker with in-memory caches and a fake network: enough for install and a page open.
 * Pass the `stores` of an earlier run to install a newer version over its caches.
 */
function runWorker(files: string[], network: (url: string) => string, opts: { version?: string; hashed?: string[]; stores?: Map<string, Map<string, string>> } = {}) {
  const handlers: Record<string, (e: unknown) => void> = {}
  const stores = opts.stores ?? new Map<string, Map<string, string>>()
  const precached: FakeRequest[] = []
  const store = (name: string) => stores.get(name) ?? stores.set(name, new Map()).get(name)!
  const caches = {
    open: async (name: string) => ({
      add: async (r: string | FakeRequest) => {
        const req = typeof r === 'string' ? new FakeRequest(r) : r
        precached.push(req)
        store(name).set(req.url, network(req.url))
      },
      put: async (url: string, res: Response) => void store(name).set(url, await res.text()),
      match: async (url: string) => (store(name).has(url) ? new Response(store(name).get(url)) : undefined),
    }),
    match: async (url: string) => {
      for (const s of stores.values()) if (s.has(url)) return new Response(s.get(url))
      return undefined
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  }
  const self = { addEventListener: (type: string, h: (e: unknown) => void) => (handlers[type] = h), skipWaiting: () => {}, clients: { claim: async () => {} } }
  const fetch = async (url: string) => new Response(network(url))
  const code = renderServiceWorker(template, opts.version ?? 'v1', files, opts.hashed ?? [])
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

  it('copies the hashed files an older version cached and downloads only the rest', async () => {
    const v1 = ['./', 'assets/index-a.js', 'assets/phaser-p.js', 'icons/icon-192.png']
    const old = runWorker(v1, url => `${url} 1`, { version: 'v1', hashed: ['assets/index-a.js', 'assets/phaser-p.js'] })
    await old.install()
    const v2 = ['./', 'assets/index-b.js', 'assets/phaser-p.js', 'icons/icon-192.png']
    const sw = runWorker(v2, url => `${url} 2`, { version: 'v2', hashed: ['assets/index-b.js', 'assets/phaser-p.js'], stores: old.stores })
    await sw.install()
    // the page and the public icon are not hashed, so they come again even though v1 has them
    expect(sw.precached.map(r => r.url).sort()).toEqual(['./', 'assets/index-b.js', 'icons/icon-192.png'])
    expect(Object.fromEntries(sw.stores.get('spa-v2')!)).toEqual({
      './': './ 2',
      'assets/index-b.js': 'assets/index-b.js 2',
      'assets/phaser-p.js': 'assets/phaser-p.js 1',
      'icons/icon-192.png': 'icons/icon-192.png 2',
    })
  })
})

describe('service worker build', () => {
  it('precaches every built file except maps and woff fallbacks', () => {
    const bundle = ['index.html', 'assets/index-abc.js', 'assets/index-abc.js.map', 'assets/f-600-x.woff2', 'assets/f-600-x.woff']
    const pub = ['manifest.webmanifest', 'icons/icon-192.png']
    expect(precacheList(bundle, pub)).toEqual(['./', 'assets/f-600-x.woff2', 'assets/index-abc.js', 'icons/icon-192.png', 'index.html', 'manifest.webmanifest'])
    expect(precacheList(['assets/a.js'], [])).toContain('index.html')
  })

  it('counts only the built files under assets/ as hashed', () => {
    expect(hashedFiles(['index.html', 'assets/phaser-p.js', 'assets/index-a.js', 'assets/index-a.js.map', 'assets/f-600-x.woff2'])).toEqual(['assets/f-600-x.woff2', 'assets/index-a.js', 'assets/phaser-p.js'])
  })

  it('fills the version, the file list and the hashed files into the service worker', () => {
    const out = renderServiceWorker("const VERSION = '__VERSION__'\nconst FILES = __FILES__\nconst HASHED = new Set(__HASHED__)", 'abc', ['./', 'index.html', 'assets/a-1.js'], ['assets/a-1.js'])
    expect(out).toBe('const VERSION = "abc"\nconst FILES = ["./","index.html","assets/a-1.js"]\nconst HASHED = new Set(["assets/a-1.js"])')
  })
})

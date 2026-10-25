import { describe, expect, it } from 'vitest'
import { precacheList, renderServiceWorker } from '../../build/sw'

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

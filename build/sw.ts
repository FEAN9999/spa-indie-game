// Pure helpers for the service worker that the build writes; the Vite plugin in vite.config.ts feeds them.

/** Source maps and the woff fallbacks of woff2 fonts are never fetched by the game. */
const SKIP = /\.(map|woff)$/

/** What the service worker caches on install: the page under './' first, then every built and public file. */
export function precacheList(bundleFiles: string[], publicFiles: string[]): string[] {
  const files = new Set([...bundleFiles, ...publicFiles, 'index.html'])
  const kept = [...files].filter(f => !SKIP.test(f) && f !== 'sw.js' && f !== 'version.json').sort()
  return ['./', ...kept]
}

export function renderServiceWorker(template: string, version: string, files: string[]): string {
  // replacer functions, so a "$" in a file name is not read as a replacement pattern
  return template.replace("'__VERSION__'", () => JSON.stringify(version)).replace('__FILES__', () => JSON.stringify(files))
}

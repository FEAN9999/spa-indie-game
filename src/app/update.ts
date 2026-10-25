export const BUILD_ID: string = __BUILD_ID__

/** Caches the game for offline play (production builds only; the game runs without it). */
export function registerServiceWorker(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {})
}

/** The version on the server, or null when it cannot be read within `timeoutMs`. */
export async function latestVersion(timeoutMs: number, fetchFn: typeof fetch = fetch): Promise<string | null> {
  const ask = (async () => {
    const res = await fetchFn(`version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = await res.json()
    return typeof body?.version === 'string' ? body.version : null
  })().catch(() => null)
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<null>(resolve => (timer = setTimeout(resolve, timeoutMs, null)))
  try {
    return await Promise.race([ask, late])
  } finally {
    clearTimeout(timer)
  }
}

/** Reload into a newer version, but never in dev and never in the middle of a service. */
export function shouldReload(running: string, latest: string | null, serving: boolean): boolean {
  return running !== 'dev' && latest !== null && latest !== running && !serving
}

/** Calls `cb` each time the player comes back to the game; returns the unsubscribe. */
export function onReturn(cb: () => void): () => void {
  const listener = () => {
    if (document.visibilityState === 'visible') cb()
  }
  document.addEventListener('visibilitychange', listener)
  return () => document.removeEventListener('visibilitychange', listener)
}

const VERSION = '__VERSION__'
const FILES = __FILES__
const CACHE = `spa-${VERSION}`
const NAV_TIMEOUT_MS = 3000

self.addEventListener('install', e => {
  // from the network, never an older copy the browser kept in its HTTP cache
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))))
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('spa-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/version.json')) return
  if (req.mode === 'navigate') e.respondWith(page(req))
  // ignoreVary: module scripts, CSS and fonts ask with an Origin header that the precache requests lacked,
  // and a server that answers "Vary: Origin" would make every lookup miss
  else e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit ?? fetch(req)))
})

// Newest page when the network answers within NAV_TIMEOUT_MS, else the precached one. The newest page
// is not cached here: its scripts belong to the next version, whose worker precaches both together.
async function page(req) {
  const fresh = fetch(req.url, { cache: 'no-cache' })
  const late = new Promise(resolve => setTimeout(resolve, NAV_TIMEOUT_MS, null))
  const res = await Promise.race([fresh.catch(() => null), late])
  return res ?? (await (await caches.open(CACHE)).match('./')) ?? fresh
}

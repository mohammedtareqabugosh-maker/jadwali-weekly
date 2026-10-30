const CACHE = 'jadwali-shell-v2'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png']

async function cacheAppShell() {
  const cache = await caches.open(CACHE)
  await cache.addAll(SHELL)
  const response = await fetch('./index.html', { cache: 'no-store' })
  if (!response.ok) return
  const html = await response.clone().text()
  await cache.put('./index.html', response)
  const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !path.startsWith('data:') && !path.startsWith('http'))
    .map((path) => new URL(path, self.registration.scope).href)
  await Promise.allSettled(paths.map(async (path) => {
    const asset = await fetch(path)
    if (asset.ok) await cache.put(path, asset)
  }))
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('jadwali-shell-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

async function cacheResponse(request, response) {
  if (response && response.ok) {
    const cache = await caches.open(CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => cacheResponse(request, response)).catch(async () => {
      return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error()
    }))
    return
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response))))
})

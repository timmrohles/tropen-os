// Tropen OS Service Worker
// Strategie: Network-first für API/Auth, Cache-first für statische Assets

// Version aus Registrierungs-URL lesen (wird bei jedem Build/Dev-Start gewechselt)
const _swVersion = new URL(location.href).searchParams.get('v') || 'v1'
const CACHE_NAME = `tropen-os-${_swVersion}`
const OFFLINE_URL = '/offline'

// Assets die beim Install gecacht werden
const PRECACHE_ASSETS = [
  '/offline',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
]

// Install: Offline-Seite und Icons vorab cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// Activate: Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: Network-first, bei Fehler Offline-Seite
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Nur GET-Requests cachen
  if (request.method !== 'GET') return

  // API-Routen, Auth und Supabase immer direkt (nie cachen)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('sentry') ||
    url.hostname.includes('anthropic')
  ) {
    return
  }

  // Navigations-Requests: Network-first, Offline-Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // Statische Assets: Cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/animations/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }
})

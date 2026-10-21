// Service Worker — Tenax Indoor Player
// Versão do cache: incrementar ao mudar a lógica
const CACHE_VERSION = 'tenax-v1'

// Instala o SW sem aguardar: ativa imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Remove caches antigos ao ativar nova versão
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Só intercepta requisições de vídeo (mp4, webm) via R2 público
  const isVideo =
    event.request.destination === 'video' ||
    /\.(mp4|webm|mov)(\?.*)?$/.test(url.pathname)

  if (!isVideo) return // deixa passar normalmente

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) return cached

      // Busca e armazena em cache
      try {
        const response = await fetch(event.request)
        if (response.ok) {
          cache.put(event.request, response.clone())
        }
        return response
      } catch {
        // Offline e sem cache: retorna erro controlado
        return new Response('Vídeo indisponível offline', { status: 503 })
      }
    })
  )
})

// Mensagem do player para pré-carregar uma URL específica
self.addEventListener('message', (event) => {
  if (event.data?.tipo === 'precarregar' && event.data.url) {
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.data.url)
      if (!cached) {
        fetch(event.data.url)
          .then((r) => { if (r.ok) cache.put(event.data.url, r) })
          .catch(() => {}) // falha silenciosa; será tentado de novo
      }
    })
  }
})

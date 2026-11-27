const CACHE = 'finance-plus-shell-v4';
const BASE = new URL('./', self.registration.scope);
const SHELL = ['index.html', 'manifest.webmanifest', 'finance-icon.svg'].map(path => new URL(path, BASE).href);
const HOME = new URL('index.html', BASE).href;

async function cacheResponse(request, response) {
  if (response.ok) {
    try { await (await caches.open(CACHE)).put(request, response.clone()); }
    catch { /* Keep the network response usable when storage is full or unavailable. */ }
  }
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('finance-plus-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => cacheResponse(request, response))
      .catch(async () => (await caches.match(request)) || (await caches.match(HOME))));
    return;
  }
  const url = new URL(request.url);
  // Vite emits content-hashed assets: serve cached copies immediately, then refresh them.
  if (/\/assets\/[^/]+-[\w-]{8,}\.(?:js|css|woff2?|svg)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => {
      const network = fetch(request).then(response => cacheResponse(request, response));
      event.waitUntil(network.then(() => undefined).catch(() => undefined));
      return cached || network.catch(() => Response.error());
    }));
    return;
  }
  // Check network first for unhashed files so deployments take effect immediately.
  event.respondWith(fetch(request).then(response => cacheResponse(request, response))
    .catch(async () => (await caches.match(request)) || Response.error()));
});

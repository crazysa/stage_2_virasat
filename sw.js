const CACHE_PREFIX = 'virasat-app-shell-';
const CACHE_NAME = `${CACHE_PREFIX}focused-demo-v1`;
const OFFLINE_MANIFEST = new URL('./offline-assets.json', self.registration.scope);
const APP_INDEX = new URL('./index.html', self.registration.scope);
const APP_ROOT = new URL('./', self.registration.scope);
const OFFLINE_STATUS = new URL('./.virasat-offline-status', self.registration.scope);
const cacheableDestinations = new Set(['document', 'script', 'style', 'image', 'font', 'manifest', 'worker']);

async function fetchAndCache(cache, url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not cache ${url.pathname}`);
  await cache.put(url.href, response.clone());
}

async function refreshAppShell() {
  const response = await fetch(OFFLINE_MANIFEST, { cache: 'no-store' });
  if (!response.ok) throw new Error('Offline asset manifest was unavailable.');
  const manifestResponse = response.clone();
  const manifest = await response.json();
  const urls = manifest.assets.map((path) => new URL(path, self.registration.scope));
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(urls.map((url) => fetchAndCache(cache, url)));
  await cache.put(OFFLINE_MANIFEST.href, manifestResponse);

  const keep = new Set([...urls.map((url) => url.href), OFFLINE_MANIFEST.href]);
  const cachedRequests = await cache.keys();
  await Promise.all(cachedRequests
    .filter((request) => !keep.has(request.url))
    .map((request) => cache.delete(request)));
}

async function notifyClient(clientId, type) {
  if (!clientId) return;
  const client = await self.clients.get(clientId);
  client?.postMessage({ type });
}

self.addEventListener('install', (event) => {
  event.waitUntil(refreshAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'VIRASAT_QUERY_CACHE_STATUS') {
    event.waitUntil(caches.open(CACHE_NAME)
      .then((cache) => cache.match(OFFLINE_STATUS.href))
      .then((status) => {
        if (status) event.source?.postMessage({ type: 'VIRASAT_CACHE_FALLBACK' });
      }));
    return;
  }
  if (event.data?.type === 'VIRASAT_REFRESH_SHELL') {
    event.waitUntil(refreshAppShell()
      .then(() => notifyClient(event.source?.id, 'VIRASAT_CACHE_READY'))
      .catch(() => undefined));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return;
  if (request.mode !== 'navigate' && !cacheableDestinations.has(request.destination)) return;

  event.respondWith((async () => {
    try {
      const network = await fetch(request, { cache: 'no-store' });
      if (!network.ok) throw new Error(`Network returned ${network.status}`);
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(OFFLINE_STATUS.href);
      // App-shell writes happen only in refreshAppShell from the build-generated
      // allowlist. Never turn arbitrary runtime responses into cache entries.
      return network;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true })
        ?? (request.mode === 'navigate' ? await cache.match(APP_ROOT.href) ?? await cache.match(APP_INDEX.href) : undefined);
      if (!cached) throw error;
      await cache.put(OFFLINE_STATUS.href, new Response('cache-fallback', {
        headers: { 'Content-Type': 'text/plain' },
      }));
      await notifyClient(event.clientId, 'VIRASAT_CACHE_FALLBACK');
      return cached;
    }
  })());
});

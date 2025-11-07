const CACHE_VERSION = 'v1';
const STATIC_CACHE = `zyra-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `zyra-dynamic-${CACHE_VERSION}`;
const API_CACHE = `zyra-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'cache-first',
  default: 'network-first'
};

const API_CACHE_DURATION = 5 * 60 * 1000;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets (including offline fallback)');
        return cache.addAll(STATIC_ASSETS)
          .catch(err => {
            console.warn('[SW] Failed to cache some static assets:', err);
          });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('zyra-') && 
                   !name.endsWith(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    const offlineCache = await caches.open(STATIC_CACHE);
    const offline = await offlineCache.match('/offline.html');
    return offline || new Response('Offline', { status: 503 });
  }
}

async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    if (request.destination === 'document') {
      const offlineCache = await caches.open(STATIC_CACHE);
      const offline = await offlineCache.match('/offline.html');
      return offline || new Response('Offline', { status: 503 });
    }

    return new Response('Network error', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isReadOnly = url.pathname.includes('/api/me') || 
                     url.pathname.includes('/api/products') ||
                     url.pathname.includes('/api/campaigns') ||
                     url.pathname.includes('/api/analytics');

  try {
    const response = await fetch(request.clone());
    
    if (response.ok && isReadOnly) {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = response.clone();
      
      const headers = new Headers(cachedResponse.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedBlob = await cachedResponse.blob();
      const newResponse = new Response(cachedBlob, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
      
      cache.put(request, newResponse);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', request.url);
    
    if (isReadOnly) {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(request);
      
      if (cached) {
        const cachedAt = cached.headers.get('sw-cached-at');
        const age = Date.now() - parseInt(cachedAt || '0');
        
        if (age < API_CACHE_DURATION) {
          const headers = new Headers(cached.headers);
          headers.set('x-cache-status', 'HIT');
          
          const blob = await cached.blob();
          return new Response(blob, {
            status: cached.status,
            statusText: cached.statusText,
            headers: headers
          });
        }
      }
    }

    return new Response(JSON.stringify({ 
      error: 'Network unavailable',
      offline: true 
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Image request failed:', request.url);
    return new Response('', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

const CACHE_NAME = 'snake-offline-v2';
const GAME_ASSETS = [
    '/game/index.html',
    '/game/snake-game.js',
    '/styles.css',
    '/script.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                GAME_ASSETS.map(async (url) => {
                    const response = await fetch(url, { redirect: 'follow'});
                    if (response.ok || response.type === 'opaqueredirect') {
                        await cache.put(url, response);
                    }
                })
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match('/game/index.html');
                if(cached) {
                    const body = await cached.text();
                    return new Response(body, {
                        status: 200,
                        headers: {'Content-Type': 'text/html'}
                    });
                }
                return new Response('Offline', { status: 503 });
            })
        );
        return;
    }

    // Serve cached assets (styles, scripts) from cache, fall back to network
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request))
    );
});

const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';
const CACHE_DYNAMIC_LIMIT = 50;

function limpiarCache(cacheName, numeroItems) {
  caches.open(cacheName)
    .then(cache => {
      return cache.keys()
        .then(keys => {

          if (keys.length > numeroItems) {
            cache.delete(keys[0])
              .then(limpiarCache(cacheName, numeroItems));
          }
        });
    });
}

function limpiarCacheViejo() {
  return caches.keys().then(
    keys => {
      keys.filter(key => key.includes('dynamic-v')).forEach(
        key => {
          if (key !== CACHE_DYNAMIC_NAME) {
            caches.delete(key);
          }
        }
      );
    }
  );
}

self.addEventListener('install', e => {
  const cacheProm = caches.open(CACHE_STATIC_NAME)
    .then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/style.css',
        '/img/main.jpg',
        '/js/app.js',
        '/img/no-img.jpg',
        '/pages/offline.html'
      ]);
    });
  const cacheInmutable = caches.open(CACHE_INMUTABLE_NAME)
    .then(cache => cache.add('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'));
  e.waitUntil(Promise.all([cacheProm, cacheInmutable]));
});

self.addEventListener('activate', e => {
  e.waitUntil(limpiarCacheViejo());
})

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(
    cachesObj => {
      if (!!cachesObj) {
        return cachesObj;
      }
      return fetch(e.request).then(
        newResp => {
          caches.open(CACHE_DYNAMIC_NAME)
            .then(cache => {
              cache.put(e.request, newResp);
              limpiarCache(CACHE_DYNAMIC_NAME, 50);
            })
            .catch(err => {
              if (e.request.headers.get('accept').includes('text/html')) {
                return fetch('/pages/offline.html');
              }
            });
          return newResp.clone();
        });
    }
  ));
});
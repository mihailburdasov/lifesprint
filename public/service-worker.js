// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

// Импортируем необходимые модули Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Используем модули Workbox
workbox.core.setCacheNameDetails({
  prefix: 'lifesprint',
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime',
});

// Precache и route для файлов, которые будут добавлены плагином InjectManifest
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache images with a cache-first strategy
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache audio files with a cache-first strategy
workbox.routing.registerRoute(
  /\.(?:mp3|wav|ogg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'audio',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache CSS and JavaScript files with a stale-while-revalidate strategy
workbox.routing.registerRoute(
  /\.(?:js|css)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache the API calls with a network-first strategy
workbox.routing.registerRoute(
  /^https:\/\/yvmukcseklazffqaxpso\.supabase\.co/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Default strategy for all other requests
workbox.routing.setDefaultHandler(
  new workbox.strategies.NetworkFirst({
    cacheName: 'default-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 часа
      }),
    ],
  })
);

// Добавляем обработчик для JavaScript-файлов
workbox.routing.registerRoute(
  /\.js$/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'js-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 12 * 60 * 60, // 12 часов
      }),
    ],
  })
);

// Добавляем обработчик для CSS-файлов
workbox.routing.registerRoute(
  /\.css$/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'css-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 12 * 60 * 60, // 12 часов
      }),
    ],
  })
);

// Добавляем обработчик для HTML-файлов
workbox.routing.registerRoute(
  /\.html$/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 12 * 60 * 60, // 12 часов
      }),
    ],
  })
);

// Добавляем обработчик для основного HTML-файла
workbox.routing.registerRoute(
  /\/$/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 12 * 60 * 60, // 12 часов
      }),
    ],
  })
);

// Добавляем обработчик для запросов к основному домену
workbox.routing.registerRoute(
  new RegExp('^https://lifesprint\\.vercel\\.app/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'main-domain-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 12 * 60 * 60, // 12 часов
      }),
    ],
  })
);

// Добавляем обработчик для запросов к основному домену без протокола
workbox.routing.registerRoute(
  new RegExp('^//lifesprint\\.vercel\\.app/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'main-domain-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 12 * 60 * 60, // 12 часов
      }),
    ],
  })
);

// Временно отключено
// // Fallback page for offline mode
// workbox.routing.setCatchHandler(async ({ event }) => {
//   if (event.request.destination === 'document') {
//     return workbox.precaching.matchPrecache('/fallback.html');
//   }
//   
//   return Response.error();
// });
// 
// // Precache the fallback page
// workbox.precaching.precacheAndRoute([
//   { url: '/fallback.html', revision: '1' }
// ]);

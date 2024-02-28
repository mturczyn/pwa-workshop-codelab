import { warmStrategyCache, offlineFallback } from 'workbox-recipes';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { strategy } from 'workbox-streams';
import { openDB } from 'idb';
import { marked } from 'marked';

// Set up page cache
const pageCache = new CacheFirst({
  cacheName: 'page-cache',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

warmStrategyCache({
  urls: ['/index.html', '/'],
  strategy: pageCache,
});

/**
 * Streaming response.
 * It was used to stream repsonse for preview page, but this
 * might break other feature (live preview) - and this was not
 * point of the exercise, so here we comment out matching route
 * and disable streaming for all.
 * To test it, simply change matcher to return true for all
 * or use commented implementation.
 */
registerRoute(
  ({ request }) => request.url.includes('preview-streaming/index'),
  strategy([
    // Get header and beginning of body
    () => `
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/images/logo.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PWA Edit | Markdown Preview With Streaming</title>
      <link rel="stylesheet" href="/css/preview.css" />
      <script type="module" src="/js/preview-streaming.js"></script>
    </head>
    <body>
      <main class="preview">`,
    // Build the body dynamically from IndexedDB
    async ({ event, request, url, params }) => {
      // ...
      const db = await openDB('settings-store');
      const content = (await db.get('settings', 'content')) || defaultText;
      return marked(content);
    },
    // Get rest of HTML
    () => '</main></body></html>',
  ]),
);

registerRoute(({ request }) => request.mode === 'navigate', pageCache);

// Set up asset cache
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'asset-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

// Set up offline fallback
offlineFallback({
  pageFallback: '/offline.html',
});

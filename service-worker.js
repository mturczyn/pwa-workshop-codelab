import { warmStrategyCache, offlineFallback } from 'workbox-recipes';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { strategy } from 'workbox-streams';

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
  ({ request }) => false, //request.url.includes('preview/index'),
  strategy([
    // Get header and beginning of body
    () => '<!DOCTYPE html><html lang="en"><head></head><body>',
    // Add some strings in
    () => `<h1>Hello from ${new Date()}</h1>`,
    // Build the body dynamically
    async ({ event, request, url, params }) => {
      // ...
      const p = new Promise((resolve) => setTimeout(resolve('AWAITED RESULT'), 2000));
      const result = await p;
      return `<p>This uses awaited result: ${result}</p><p>Stringified event:</p><p>${JSON.stringify(event)}</p>`;
    },
    // Get rest of HTML
    () => '</body></html>',
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

/*
 Copyright 2021 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { openDB } from 'idb';
import { wrap } from 'comlink';

let worker = new SharedWorker(new URL('worker.js', import.meta.url), {
  type: 'module',
});

let compiler = wrap(worker.port);

let deferredPrompt;

window.addEventListener('beforeinstallprompt', function (event) {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  event.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = event;
  console.log('>>>', 'PWA installation event', 'beforeinstallprompt');
});

// Register the service worker
if ('serviceWorker' in navigator) {
  // Wait for the 'load' event to not block other work
  window.addEventListener('load', async () => {
    // Try to register the service worker.
    try {
      // Capture the registration for later use, if needed
      let reg;

      // import.meta.env.DEV is a special environment variable injected by Vite to let us know we're in development mode. Here, we can use the JS Module form of our service worker because we can control our browsers in dev.
      if (import.meta.env.DEV) {
        reg = await navigator.serviceWorker.register('/service-worker.js', {
          type: 'module',
        });
      } else {
        // In production, we use the normal service worker registration
        reg = await navigator.serviceWorker.register('/service-worker.js');
      }

      console.log('Service worker registered! 😎', reg);
    } catch (err) {
      console.log('😥 Service worker registration failed: ', err);
    }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const db = await openDB('settings-store', 1, {
    upgrade(db) {
      db.createObjectStore('settings');
    },
  });

  // Set up the editor
  const { Editor } = await import('./app/editor.js');
  const editor = new Editor(document.body);

  // Set up the menu
  const { Menu } = await import('./app/menu.js');
  new Menu(document.querySelector('.actions'), editor);

  editor.onUpdate(async (content) => {
    await Promise.all([db.put('settings', content, 'content'), compiler.set(content)]);
  });
  // Set the initial state in the editor
  const defaultText = `# Welcome to PWA Edit!\n\nTo leave the editing area, press the \`esc\` key, then \`tab\` or \`shift+tab\`.`;

  editor.setContent((await db.get('settings', 'content')) || defaultText);

  const { NightMode } = await import('./app/night-mode.js');
  new NightMode(
    document.querySelector('#mode'),
    async (mode) => {
      editor.setTheme(mode);
      await db.put('settings', mode, 'nightmode');
    },
    await db.get('settings', 'nightmode'),
  );

  // Set up install prompt
  const { Install } = await import('./lib/install.js');
  new Install(document.querySelector('#install'), deferredPrompt);
});

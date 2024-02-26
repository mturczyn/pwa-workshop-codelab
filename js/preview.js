import { openDB } from 'idb';
import { marked } from 'marked';
import { wrap, proxy } from 'comlink';

let worker = new SharedWorker(new URL('worker.js', import.meta.url), {
  type: 'module',
});
let compiler = wrap(worker.port);

compiler.subscribe(
  proxy((value) => {
    const preview = document.querySelector('.preview');
    preview.innerHTML = value.compiled;
  }),
);

window.addEventListener('DOMContentLoaded', async () => {
  const preview = document.querySelector('.preview');
  const db = await openDB('settings-store');
  const content = (await db.get('settings', 'content')) || '';
  preview.innerHTML = marked(content);
});

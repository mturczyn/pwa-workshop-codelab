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

/*
 Copyright 2022 Google LLC

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

import { resolve } from 'path';
import { defineConfig } from 'vite';
// import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  // HTTPS is out of the box with Vite version greater than 5 (we're using 5.1.5).
  // server: { https: true, host: '0.0.0.0' },
  // plugins: [mkcert()],
  server: { host: '0.0.0.0' },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        offline: resolve(__dirname, 'offline.html'),
        'preview/index': resolve(__dirname, 'preview/index.html'),
      },
    },
  },
});

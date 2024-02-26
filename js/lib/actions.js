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

export class Actions {
  constructor(editor) {
    this.handle;
    this.previewWindow;
    // The wake lock sentinel.
    this.wakeLock;
    this.editor = editor;

    window.addEventListener('beforeunload', (event) => {
      if (!this.previewWindow) {
        return;
      }
      this.previewWindow.close();
      this.previewWindow = null;
    });

    openDB('settings-store', 1, {
      upgrade(db) {
        db.createObjectStore('settings');
      },
    }).then(async (db) => {
      const handle = await db.get('settings', 'filehandle');
      if (!handle) {
        console.log('>>>', 'Did not find file from other session!');
        return;
      }

      this.handle = handle;
      alert('Found unfinished file. Click "Open" to load it.');
    });
  }

  /**
   * Function to call when the open button is triggered
   */
  async open() {
    // fileHandle is a FileSystemFileHandle
    // withWrite is a boolean set to true if write
    let verifyPermission = async function (fileHandle, withWrite) {
      const opts = {};
      if (withWrite) {
        opts.mode = 'readwrite';
      }

      // Check if we already have permission, if so, return true.
      let actualPermission = await fileHandle.queryPermission(opts);
      console.log('>>>', 'actualPermission', actualPermission);
      if (actualPermission === 'granted') {
        return true;
      }

      // Request permission to the file, if the user grants permission, return true.
      if ((await fileHandle.requestPermission(opts)) === 'granted') {
        return true;
      }

      // The user did not grant permission, return false.
      return false;
    };

    if (!!this.handle && confirm('Would you like to load unfinished file?') && (await verifyPermission(this.handle, true))) {
      document.title = 'PWA Edit | ' + this.handle.name;
      const file = await this.handle.getFile();
      const fileContent = (await file.text()) || '';
      console.log('>>>', 'file contents from cached file (from indexDB)');
      this.editor.setContent(fileContent);
      return;
    }

    // Have the user select a file.
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          accept: {
            'text/markdown': ['.md', '.markdown'],
          },
        },
      ],
    });

    document.title = 'PWA Edit | ' + handle.name;

    this.handle = handle;

    const db = await openDB('settings-store', 1, {
      upgrade(db) {
        db.createObjectStore('settings');
      },
    });

    await db.put('settings', handle, 'filehandle');

    const file = await handle.getFile();
    const fileContent = (await file.text()) || '';

    this.editor.setContent(fileContent);
  }

  /**
   * Function to call when the save button is triggered
   */
  async save() {
    // If we don't have file opened, we let user pick the file
    // with open file dialog.
    if (!this.handle) {
      this.saveAs();
      return;
    }

    // create a FileSystemWritableFileStream to write to
    const writableStream = await this.handle.createWritable();

    // write our file
    await writableStream.write(this.editor.content());

    // close the file and write the contents to disk.
    await writableStream.close();
  }

  /**
   * Function to call when the duplicate/save as button is triggered
   */
  async saveAs() {
    const handle = await window.showSaveFilePicker({
      types: [
        {
          accept: {
            'text/markdown': ['.md', '.markdown'],
          },
        },
      ],
    });

    document.title = 'PWA Edit | ' + handle.name;

    this.handle = handle;

    const db = await openDB('settings-store', 1, {
      upgrade(db) {
        db.createObjectStore('settings');
      },
    });

    await db.put('settings', handle, 'filehandle');

    // create a FileSystemWritableFileStream to write to
    const writableStream = await this.handle.createWritable();

    // write our file
    await writableStream.write(this.editor.content());

    // close the file and write the contents to disk.
    await writableStream.close();
  }

  /**
   * Reset the editor and file handler
   */
  async reset() {
    console.log('>>>', 'Resetting...');
    document.title = 'PWA Edit';
    this.editor.setContent('');
    this.handle = null;
    const db = await openDB('settings-store');
    await db.delete('settings', 'filehandle');
  }

  /**
   * Function to call when the preview button is triggered
   */
  async preview() {
    if (!!this.previewWindow) {
      this.previewWindow.close();
      this.previewWindow = null;
      return;
    }
    let screenDetails = await window.getScreenDetails();
    let primaryScreen = screenDetails.screens.find((s) => s.isPrimary);

    console.log('>>>', primaryScreen);

    let halfWidth = primaryScreen.width / 2;
    this.previewWindow = window.open('/preview/index.html', 'preview-window', `left=${halfWidth},top=${primaryScreen.availTop},width=${halfWidth},height=${primaryScreen.height}`);
  }

  /**
   * Function to call when the focus button is triggered
   */
  async focus() {
    if (!!this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
      return;
    }

    // Function that attempts to request a screen wake lock.
    const requestWakeLock = async () => {
      try {
        this.wakeLock = await navigator.wakeLock.request();
        console.log('>>>', 'wake lock requested');
        this.wakeLock.addEventListener('release', () => {
          console.log('Screen Wake Lock released:', this.wakeLock.released);
        });
        console.log('Screen Wake Lock released:', this.wakeLock.released);
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    // Request a screen wake lock…
    await requestWakeLock();
  }
}

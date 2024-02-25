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
    this.editor = editor;

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
    // for (const cb of this._fileLoaded) {
    //   cb(fileContent);
    // }

    // Get the file content.
    // Also available, slice(), stream(), arrayBuffer()
    // const content = await file.text()

    // const fileSlice = await file.slice(0, 100);
    // const content = await fileSlice.text();
  }

  /**
   * Function to call when the save button is triggered
   */
  async save() {}

  /**
   * Function to call when the duplicate/save as button is triggered
   */
  async saveAs() {}

  /**
   * Reset the editor and file handler
   */
  async reset() {}

  /**
   * Function to call when the preview button is triggered
   */
  async preview() {}

  /**
   * Function to call when the focus button is triggered
   */
  async focus() {}
}

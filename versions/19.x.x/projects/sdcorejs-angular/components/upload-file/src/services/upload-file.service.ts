import { Injectable } from '@angular/core';
import { SdUtilities } from '@sdcorejs/angular/utilities';

@Injectable({ providedIn: 'root' })
export class UploadFileService {
  #cache: Record<string, File> = {};

  #hash = (file: File) => {
    if (!file) {
      return null;
    }
    return SdUtilities.hash(file);
  };

  isHashedKey = (key: string) => {
    if (!key) {
      return false;
    }
    return !!this.#cache[key];
  };

  get = (key: string) => {
    if (!this.isHashedKey(key)) {
      return null;
    }
    return this.#cache[key];
  };

  add = (file: File) => {
    const key = this.#hash(file);
    if (key) {
      this.#cache[key] = file;
    }
    return key;
  };

  remove = (fileOrKey: File | string) => {
    if (!fileOrKey) {
      return;
    }
    if (typeof fileOrKey === 'string') {
      if (this.isHashedKey(fileOrKey)) {
        delete this.#cache[fileOrKey];
      }
      return;
    }
    const key = this.#hash(fileOrKey);
    if (key) {
      delete this.#cache[key];
    }
  };
}


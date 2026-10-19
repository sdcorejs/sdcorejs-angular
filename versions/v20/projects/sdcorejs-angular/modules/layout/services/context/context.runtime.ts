import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';
import { SD_LAYOUT_CONTEXT_MARKER_KEY, SdLayoutContextRuntime } from './context.model';

/**
 * Browser effects of the layout context feature: page reload, cross-tab `storage` events and the
 * per-tab reconcile marker. Defaults to the document window; provide a fake `SdLayoutContextRuntime`
 * in specs and demos so nothing reloads for real:
 *
 * ```ts
 * providers: [{ provide: SD_LAYOUT_CONTEXT_RUNTIME, useValue: fakeRuntime }];
 * ```
 */
export const SD_LAYOUT_CONTEXT_RUNTIME = new InjectionToken<SdLayoutContextRuntime>('sd.layout.context.runtime', {
  providedIn: 'root',
  factory: () => createSdLayoutContextBrowserRuntime(inject(DOCUMENT).defaultView),
});

/** Creates the default runtime over `view`; without a window every operation is a no-op. */
export function createSdLayoutContextBrowserRuntime(view: Window | null): SdLayoutContextRuntime {
  if (!view) {
    return {
      reload: () => undefined,
      onStorage: () => () => undefined,
      readMarker: () => undefined,
      writeMarker: () => false,
    };
  }

  return {
    reload: () => view.location.reload(),
    onStorage: listener => {
      const handler = (event: Event): void => {
        // why: chỉ localStorage mới chứa snapshot. `localStorage.clear()` ở tab khác vẫn mang `storageArea`
        // (chỉ `key` là null); `storageArea` null chỉ gặp ở sự kiện tự dựng — vẫn chuyển tiếp cho an toàn.
        const area = (event as StorageEvent).storageArea;
        if (area === null || (area !== undefined && area === readLocalStorage(view))) listener();
      };
      view.addEventListener('storage', handler);
      return () => view.removeEventListener('storage', handler);
    },
    readMarker: () => {
      try {
        const storage = view.sessionStorage;
        return storage ? storage.getItem(SD_LAYOUT_CONTEXT_MARKER_KEY) : undefined;
      } catch {
        return undefined;
      }
    },
    writeMarker: value => {
      try {
        const storage = view.sessionStorage;
        if (!storage) return false;
        if (value === null) storage.removeItem(SD_LAYOUT_CONTEXT_MARKER_KEY);
        else storage.setItem(SD_LAYOUT_CONTEXT_MARKER_KEY, value);
        // why: đọc lại để xác nhận — có trình duyệt nuốt lỗi ghi thay vì ném.
        return storage.getItem(SD_LAYOUT_CONTEXT_MARKER_KEY) === value;
      } catch {
        return false;
      }
    },
  };
}

// why: truy cập `localStorage` có thể ném SecurityError khi trình duyệt chặn storage.
function readLocalStorage(view: Window): Storage | undefined {
  try {
    return view.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

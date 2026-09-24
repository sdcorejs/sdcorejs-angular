# `<sd-file-explorer>`

**Type**: Component
**Selector**: `sd-file-explorer`
**Import path**: `@sdcorejs/angular/components/file-explorer` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdFileExplorer`
**Standalone**: yes
**Change detection**: `OnPush` (signal-driven)

## One-line purpose

Google-Drive-like file browser in a single element: folder tree, breadcrumb, list / grid, search in the current folder, a file detail drawer (image and PDF preview, metadata, download, share link), multi-file upload with drag-and-drop, downloads and a transfer queue. It is storage-agnostic — every read and write goes through the callbacks of `SdFileExplorerOption`.

## When to use

- Browsing documents stored in any backend (S3/MinIO behind your API, SharePoint, a DMS, a database of attachments…).
- A "My files" or "Attachments" page where users navigate folders, preview and download files, upload new ones and create folders.
- An embedded picker-like browser inside a side panel — the layout adapts to the width of the explorer itself.

## When NOT to use

- A single upload field in a form → use `<sd-upload-file>`. The explorer does not depend on it and does not replace it.
- Full document management (rename, move, delete, permissions, versions) — not in this component yet; build those around it or wait for an iteration that adds them. Sharing is limited to creating a link through `share`.
- Standalone image or PDF viewing → use `<sd-preview-image>` / `<sd-preview-pdf>` directly.

## Sizing

The host renders `display: flex; height: 100%; min-height: 480px`. **Give the parent a height** (explicit `height`, `flex: 1`, a grid row…). The item area, tree and transfer queue scroll inside the explorer.

The width comes from the parent too. Inside a flex or grid container that sizes children to their content, stretch the explorer or its wrapper (`width: 100%`, `flex: 1`, `align-self: stretch`): measured narrow, it switches to the compact layout, whose smaller content width then keeps it there.

Below **720 px of its own width** (measured with `ResizeObserver`, not the viewport) the explorer switches to the compact layout: search moves under the title, the upload button becomes icon-only, the tree becomes a slide-in panel opened by a menu button, the "Modified" column is hidden, and the file detail drawer takes the whole width of the item area (minus an 8 px inset).

## Usage

```ts
import { Component, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  SdFileExplorer,
  SdFileExplorerItem,
  SdFileExplorerOpenEvent,
  SdFileExplorerOption,
} from '@sdcorejs/angular/components/file-explorer';

interface DocumentDto {
  id: string;
  folderId: string | null;
  name: string;
  isFolder: boolean;
  contentType?: string;
  size?: number;
  updatedAt?: string;
}

const toItem = (dto: DocumentDto): SdFileExplorerItem => ({
  id: dto.id,
  parentId: dto.folderId,
  name: dto.name,
  kind: dto.isFolder ? 'folder' : 'file',
  mimeType: dto.contentType,
  size: dto.size,
  modifiedAt: dto.updatedAt,
});

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [SdFileExplorer],
  template: `<sd-file-explorer [option]="option" (open)="onOpen($event)" />`,
  styles: `
    :host {
      display: block;
      height: calc(100vh - 120px);
    }
  `,
})
export class DocumentsPage {
  readonly #http = inject(HttpClient);

  readonly option: SdFileExplorerOption = {
    title: 'My files',
    list: async ({ parentId }) => {
      const params = parentId ? { folderId: parentId } : {};
      const rows = await firstValueFrom(this.#http.get<DocumentDto[]>('/api/documents', { params }));
      return rows.map(toItem);
    },
    search: async ({ parentId, keyword }) => {
      const params = { q: keyword, ...(parentId ? { folderId: parentId } : {}) };
      const rows = await firstValueFrom(this.#http.get<DocumentDto[]>('/api/documents/search', { params }));
      return rows.map(toItem);
    },
    // A URL string is used as-is; a Blob is turned into an object URL and revoked automatically.
    preview: ({ item }) => firstValueFrom(this.#http.get(`/api/documents/${item.id}/content`, { responseType: 'blob' })),
    download: ({ item, progress, signal }) =>
      new Promise<Blob>((resolve, reject) => {
        const subscription = this.#http
          .get(`/api/documents/${item.id}/content`, { responseType: 'blob', observe: 'events', reportProgress: true })
          .subscribe({
            next: event => {
              if (event.type === HttpEventType.DownloadProgress) progress(event.loaded, event.total);
              if (event.type === HttpEventType.Response && event.body) resolve(event.body);
            },
            error: reject,
          });
        signal.addEventListener('abort', () => subscription.unsubscribe());
      }),
    upload: ({ file, parentId, progress, signal }) =>
      new Promise<void>((resolve, reject) => {
        const body = new FormData();
        body.append('file', file);
        if (parentId) body.append('folderId', parentId);
        const subscription = this.#http.post('/api/documents', body, { observe: 'events', reportProgress: true }).subscribe({
          next: event => {
            if (event.type === HttpEventType.UploadProgress) progress(event.loaded, event.total);
            if (event.type === HttpEventType.Response) resolve();
          },
          error: reject,
        });
        signal.addEventListener('abort', () => subscription.unsubscribe());
      }),
    createFolder: ({ parentId, name }) => firstValueFrom(this.#http.post<void>('/api/folders', { parentId, name })),
    // Resolve the link to share; the explorer shows it with a copy button.
    share: async ({ item }) => (await firstValueFrom(this.#http.post<{ url: string }>(`/api/documents/${item.id}/share`, {}))).url,
  };

  onOpen(event: SdFileExplorerOpenEvent): void {
    console.log('opened', event.item.name, 'in', event.path.map(folder => folder.name).join(' / ') || 'root');
  }
}
```

## Inputs

| Name     | Type                   | Default    | Notes                                                                                                                            |
| -------- | ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `option` | `SdFileExplorerOption` | (required) | Data callbacks and display settings. Replacing `option.list` resets the navigation and cache; other changes are read reactively. |

Keep the `option` object (or at least its `list` function) stable. Recreating the whole object with the same callbacks is safe; recreating `list` on every change detection resets the explorer each time.

## Outputs

| Name   | Type                      | Notes                                                                                                                                                                                                                                                                                                   |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `open` | `SdFileExplorerOpenEvent` | Emitted **exactly once** each time the user opens a **file** (click, `Enter` or `Space` on a file in the list, grid or search results), right before the detail drawer starts loading. Never emitted for folders, which navigate instead, and not emitted again when the preview retries or re-renders. |

```ts
interface SdFileExplorerOpenEvent {
  item: SdFileExplorerItem; // the file that was opened
  path: readonly SdFileExplorerItem[]; // folders from the root (excluded) to the folder being viewed
}
```

## Public API

| Member      | Type                                        | Notes                                                                                                                                             |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload()`  | `() => void`                                | Lists the current folder again (old items stay visible with a thin progress bar), drops the cache of closed folders and re-runs an active search. |
| `transfers` | `Signal<readonly SdFileExplorerTransfer[]>` | Read-only snapshot of every upload / download, oldest first. Useful to warn before leaving the page while a transfer is active.                   |
| `autoId`    | `Signal<string \| undefined>`               | Resolved E2E prefix.                                                                                                                              |

```ts
readonly explorer = viewChild.required(SdFileExplorer);
readonly busy = computed(() => this.explorer().transfers().some(t => ['queued', 'preparing', 'transferring'].includes(t.status)));
```

## `SdFileExplorerOption`

| Field          | Type                                                                                 | Required | Notes                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list`         | `({ parentId, signal }) => SdFileExplorerItem[] \| Promise<…>`                       | yes      | Direct children of a folder; `parentId` is `null` for the root. Called lazily once per folder (first open or first expand in the tree), then cached until `reload()` or a successful upload / folder creation there.                                                                                                   |
| `search`       | `({ parentId, keyword, signal }) => SdFileExplorerItem[] \| Promise<…>`              | no       | Server-side search in the current folder. Called 300 ms after the last keystroke for a non-empty keyword; stale requests are aborted and ignored. **Omitted** → the box filters the loaded children of the current folder by name (case- and Vietnamese-accent-insensitive).                                           |
| `preview`      | `({ item, signal }) => string \| Blob \| null \| undefined \| Promise<…>`            | no       | Content of the detail drawer's preview. `string` = caller-owned URL (never revoked); `Blob`/`File` = object URL created and revoked by the explorer. Only called for images and PDFs; `null`/omitted → image `thumbnailUrl` or the "no preview" fallback.                                                              |
| `download`     | `({ item, progress, signal }) => Blob \| void \| Promise<Blob \| void>`              | no       | Enables download buttons (list rows and detail drawer). Return a `Blob` → saved under `item.name`. Return nothing → you handed the file to the browser; the transfer shows "Sent to browser" without a percentage.                                                                                                     |
| `share`        | `({ item, signal }) => string \| Promise<string>`                                    | no       | Enables "Share" on files (list row action and detail drawer). Resolve the link to share: the dialog shows it in a read-only field with a copy button. Whitespace is trimmed; an empty or non-string result, a throw or a rejection shows an error with retry. Called each time the dialog opens; never emits `(open)`. |
| `upload`       | `({ file, parentId, progress, signal }) => SdFileExplorerItem \| void \| Promise<…>` | no       | Enables the upload button and drag-and-drop. One call per file, **at most 3 at a time**; the destination folder is listed again after success. Throw/reject to fail the transfer (the error `message` is shown).                                                                                                       |
| `createFolder` | `({ parentId, name }) => SdFileExplorerItem \| void \| Promise<…>`                   | no       | Enables "New folder". `name` is trimmed and non-empty. After success the current folder is listed again; throw/reject keeps the dialog open with the error `message`.                                                                                                                                                  |
| `title`        | `string`                                                                             | no       | Header heading with the app icon. Omitted → the header shows only search and upload.                                                                                                                                                                                                                                   |
| `description`  | `string`                                                                             | no       | Secondary header line (ignored without `title`).                                                                                                                                                                                                                                                                       |
| `rootLabel`    | `string`                                                                             | no       | Label of the root folder in the tree and breadcrumb. Default: translated "All files".                                                                                                                                                                                                                                  |
| `defaultView`  | `'list' \| 'grid'`                                                                   | no       | Initial layout. Default `'list'`; the user can switch.                                                                                                                                                                                                                                                                 |
| `autoId`       | `string`                                                                             | no       | E2E scope → `data-autoid="components-file-explorer-{autoId}"`.                                                                                                                                                                                                                                                         |

Every callback may return a value or a `Promise`. A **missing callback hides its UI** (no upload button, no drop zone, no download or share buttons, no "New folder" button).

### `signal` and `progress`

- `signal: AbortSignal` — pass it to `fetch`, or unsubscribe your `HttpClient` call when it aborts. `list` aborts when the same folder is listed again, `list` is replaced or the explorer is destroyed (navigating away does **not** abort; the result is cached). `search` aborts when a newer keyword supersedes it. `preview` aborts when the detail drawer closes or another file is opened. `share` aborts when the share dialog closes. `upload`/`download` abort when the user cancels or the explorer is destroyed.
- `progress(loaded, total?)` — optional to call. The first call moves the transfer from `preparing` to `transferring`. A percentage is displayed **only** when `total` is a positive number; otherwise the bar stays indeterminate. Calls after the transfer ended are ignored.

## `SdFileExplorerItem`

| Field          | Type                        | Notes                                                                                                                                   |
| -------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`                    | Stable and unique across the tree.                                                                                                      |
| `parentId`     | `string \| null`            | Containing folder; `null` at the root.                                                                                                  |
| `name`         | `string`                    | Display name, including the extension for files.                                                                                        |
| `kind`         | `'folder' \| 'file'`        | Folders navigate; files open the preview.                                                                                               |
| `mimeType`     | `string?`                   | Drives the type label and the preview renderer (falls back to the extension of `name`); the icon uses it when the extension is unknown. |
| `size`         | `number?`                   | Bytes. Files only; the column shows `—` when absent.                                                                                    |
| `modifiedAt`   | `Date \| string \| number?` | Shown as "Today", "Yesterday", `dd/MM` in the current year, `dd/MM/yyyy` otherwise (order follows the locale).                          |
| `hasChildren`  | `boolean?`                  | Folders only. `false` hides the tree expander for folders known to have no sub-folders.                                                 |
| `thumbnailUrl` | `string?`                   | Image shown on grid cards; also the image preview when no `preview` callback is given. Never revoked.                                   |

Items are displayed **folders first, then files, each group in the order returned by the callback** — sort on the server (or in `list`) if you want another order.

## Transfers

`SdFileExplorerTransfer` (read through `transfers()`):

| Status         | Meaning                                                                      | UI                                                                                 |
| -------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `queued`       | Waiting for a free upload slot (3 uploads run at the same time).             | "Waiting", empty bar, cancel.                                                      |
| `preparing`    | Callback running, no progress reported yet (e.g. requesting a signed URL).   | "Preparing", indeterminate bar, cancel.                                            |
| `transferring` | Callback reported progress at least once.                                    | `NN%` with `total`, otherwise "Uploading/Downloading" + indeterminate bar, cancel. |
| `done`         | Callback resolved. `handedOff: true` when a download returned no `Blob`.     | "Completed" / "Sent to browser", full bar.                                         |
| `error`        | Callback threw or rejected; `error` holds the reason.                        | "Failed" + message, retry, dismiss.                                                |
| `cancelled`    | User cancelled; the callback `signal` was aborted and its result is ignored. | "Cancelled", retry, dismiss.                                                       |

Other fields: `id`, `direction` (`'upload' | 'download'`), `name`, `loaded`, `total`, `percent` (present only when `total` was reported). The queue panel appears at the bottom of the explorer as soon as a transfer exists; it can be collapsed, and "Clear finished" removes `done`, `error` and `cancelled` entries.

## File detail

Opening a file shows its detail in an **`<sd-side-drawer>` opened in the item area** (right of the folder tree, below the header) through the drawer's `container` input: the same inset, radius, shadow, header / body / footer, close button and slide-in as every Core drawer. The backdrop dims only the item area (toolbar, breadcrumb and list), which is `inert` meanwhile. The header (search, upload), the folder tree and the transfer queue stay usable, and page scroll stays unlocked. Expanding or collapsing tree folders keeps the drawer open; opening another folder closes it.

- Header: the file name. Body: the preview, then name, type, size and modification date. Footer (right): **Share** when `share` is set, **Download** when `download` is set; the footer is hidden when neither exists.
- Width 420 px; when the item area is 600 px wide or less (compact layout, or a desktop explorer narrower than about 840 px) the drawer fills it minus an 8 px inset and uses 44 px touch targets.
- The drawer keeps the `<sd-side-drawer>` focus trap: `Tab` stays inside it and `Esc` leaves it. On a wide explorer the folder tree stays reachable with the pointer; in the compact layout the tree opens from the toolbar, which the drawer covers, so close the drawer first.
- Images render as `<img>` from the returned URL or object URL; a broken image switches to the error state with retry.
- PDFs render with `<sd-preview-pdf>` in light theme, without sidebar and floating toolbar (its header keeps search, print and fullscreen). It is **imported on demand** (`import('@sdcorejs/angular/components/preview')`), so applications that never preview a PDF do not download PDF.js.
- Other formats never call `preview`; they show a "no preview" fallback (with a download hint when `download` is set).
- Object URLs created from returned Blobs are revoked when the drawer closes, another file opens, or the explorer is destroyed. Saved downloads revoke their object URL 40 s after the save starts (timer outside the Angular zone).
- Closing: the close button, a click on the backdrop, or `Esc`. Focus returns to the row or card that opened the file.
- Stacking: the explorer sets `--sd-side-drawer-contained-z-index: 9`, so the drawer sits above the content and below the drop overlay and the dialogs.

## Share

- Files get a share action in the list rows (icon button, label "Share {name}") and a **Share** button in the detail drawer footer. Folders and grid cards have none (open a file from the grid to share it from its detail).
- The dialog calls `share`, shows a status while the link is created, then the link in a read-only field and **Copy link**. Copying uses the Clipboard API; when it is unavailable or refused, the link is selected and the dialog asks the user to press Ctrl+C (⌘C on macOS).
- A failure shows the error `message` (or a generic text) with **Retry**. Close button, backdrop or `Esc` close the dialog, abort `signal` and return focus to the share button.
- Opened from the detail drawer, the dialog stacks above it and the drawer stays open (and `inert`) underneath.

## Keyboard and accessibility

- Tree: `role="tree"` with `aria-level`, `aria-expanded`, `aria-selected`, roving tabindex. `↑`/`↓` move, `→` expands / enters, `←` collapses / goes to the parent, `Home`/`End`, `Enter`/`Space` open the folder.
- List rows and grid cards are focusable; `Enter`/`Space` open them. The list is exposed as `role="table"`.
- `Esc` closes, in order: the new-folder or share dialog, the detail drawer, the compact folder panel, then clears the search. Pressed in the search box while it holds a keyword, it clears the keyword first, even with the detail drawer open.
- The detail drawer is a `role="dialog"` labelled with the file name, with a focus trap. The new-folder and share dialogs are `role="dialog"` with `aria-modal`; everything else in the explorer, an open detail drawer included, is `inert` while one of them is open.
- Buttons are `<sd-button>`; icon-only ones (row actions, compact upload, transfer actions) expose their label as `aria-label` and tooltip.
- Transfer bars are `role="progressbar"` with `aria-valuenow` only when a real percentage exists.

## Styling

Override these custom properties on `sd-file-explorer` or an ancestor. Defaults follow the Core theme tokens. Buttons follow the `<sd-button>` theme and the detail drawer the `<sd-side-drawer>` tokens (`--sd-overlay-radius`, …).

| Custom property                               | Default                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `--sd-file-explorer-accent`                   | `var(--sd-primary)`                                  |
| `--sd-file-explorer-accent-soft`              | 10 % accent on white (selected rows, active toggle)  |
| `--sd-file-explorer-surface`                  | `#ffffff`                                            |
| `--sd-file-explorer-sidebar-bg`               | light mix of `--sd-surface-muted`                    |
| `--sd-file-explorer-muted-surface`            | search box and grid thumbnail background             |
| `--sd-file-explorer-preview-bg`               | 9 % accent on white                                  |
| `--sd-file-explorer-border`                   | light mix of `--sd-border`                           |
| `--sd-file-explorer-text` / `-text-secondary` | `--sd-text` / softened `--sd-text-secondary`         |
| `--sd-file-explorer-success` / `-error`       | `--sd-success` / `--sd-error`                        |
| `--sd-file-explorer-radius`                   | `16px`                                               |
| `--sd-file-explorer-scrim`                    | `rgba(0, 0, 0, 0.4)` (compact folder panel, dialogs) |

## i18n

All strings use `core.component.file-explorer.*` keys (`root`, `search-placeholder`, `upload`, `new-folder`, `column.*`, `type.*`, `preview.*`, `meta.*`, `share.*`, `transfers.*`, …) in the five bundled catalogs. Sizes and dates follow the current language (`2,4 MB` in Vietnamese, `2.4 MB` in English).

## Icons

### File-type icons

Files and folders use a built-in set of **45 colour icons** (`folder-closed`, `folder-open`, `file-generic` plus families and formats: document, pdf, text, markdown, spreadsheet, csv, presentation, image, png, jpg, gif, webp, svg, design, psd, ai, figma, audio, mp3, wav, video, mp4, mov, archive, zip, rar, 7z, tar, code, html, css, js, ts, json, xml, yaml, sql, python, book, app, font, 3d).

- The SVGs are **embedded in the library bundle** and rendered as decorative `<img alt="">` from `data:` URLs — no asset configuration, no font or CDN, and the fixed file-family colours work on light and dark surfaces.
- Resolution, in order: longest known extension (`report.tar.gz` → tar, `types.d.ts` → ts), dot-files (`.env`, `.gitignore`), exact MIME type, MIME family (`image/`, `video/`, `audio/`, `text/`, `font/`, `model/`), then `file-generic`. Folders use `folder-open` when expanded in the tree and `folder-closed` elsewhere.
- Sizes: 32 px in list rows, 28 px in the tree, 48 px on grid cards, 64 px in the preview fallback.
- Source of truth (maintainers): `components/file-explorer/src/assets/icons/svg/*.svg` and `manifest.json` (icon list, 136 extensions, 23 MIME fallbacks). After changing them run `npm run generate:file-explorer-icons` at the repo root to rebuild `file-explorer-icons.generated.ts`; `npm run test:scripts` fails while the generated module is stale.

### UI icons

UI icons use `<sd-icon>` Material names (`folder`, `search`, `file_upload`, `file_download`, `share`, `content_copy`, `format_list_bulleted`, `grid_view`, `menu`, `close`, `add`, `refresh`, `delete_sweep`, `error_outline`, `expand_more`, `expand_less`, `chevron_right`, and `folder_open` / `search_off` for empty states), so the explorer renders with either the Material or the default Lucide icon set. The header icon is `folder` on a round accent-tinted badge, like the `<sd-section>` icon; the transfer-queue arrow is an inline SVG.

## Examples

### Read-only browser with browser-handled downloads

```ts
readonly option: SdFileExplorerOption = {
  rootLabel: 'Library',
  defaultView: 'grid',
  list: ({ parentId }) => this.api.children(parentId),
  preview: ({ item }) => this.api.signedUrl(item.id), // string URL, used as-is
  download: async ({ item }) => {
    window.location.assign(await this.api.signedUrl(item.id, { attachment: true }));
    // return nothing: the transfer is marked "Sent to browser", no fake percentage
  },
};
```

### Upload to a presigned URL with real progress

```ts
upload: async ({ file, parentId, progress, signal }) => {
  const { url, fields, id } = await this.api.createUpload(parentId, file.name, file.type); // 'preparing'
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = event => progress(event.loaded, event.lengthComputable ? event.total : undefined);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error'));
    signal.addEventListener('abort', () => xhr.abort());
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    form.append('file', file);
    xhr.open('POST', url);
    xhr.send(form);
  });
  await this.api.completeUpload(id);
},
```

The showcase page (`/components/file-explorer/examples`) runs these patterns against an in-memory drive: full features (including share links), read-only, compact / mobile, and loading / empty / error states.

## Anti-patterns

- DON'T recreate `option.list` on every change detection (for example a getter returning a new arrow function) — each new `list` resets the explorer.
- DON'T fake progress in `upload`/`download`; call `progress` only with real numbers, or not at all.
- DON'T revoke URLs you returned from `preview` while the panel is open; return a `Blob` if you want the explorer to own the object URL.
- DON'T put the explorer in a parent without a height — it falls back to `min-height: 480px`.

## E2E test attributes

With `option.autoId = 'drive'` the host is `components-file-explorer-drive`, and children use that prefix:

| Suffix                                                                                                | Element                                        |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `-search`, `-upload`, `-file-input`                                                                   | Search input, upload button, hidden file input |
| `-menu`, `-view-list`, `-view-grid`                                                                   | Compact tree toggle, view toggles              |
| `-new-folder`, `-folder-dialog`, `-folder-name`, `-folder-submit`                                     | New-folder button and dialog                   |
| `-tree-root`, `-tree-{id}`, `-tree-{id}-toggle`                                                       | Tree nodes and expanders                       |
| `-item-{id}`, `-item-{id}-download`, `-item-{id}-share`                                               | List row / grid card, row actions              |
| `-preview`, `-preview-share`, `-preview-download`, `-preview-retry`                                   | Detail drawer content and actions              |
| `-share-dialog`, `-share-link`, `-share-copy`                                                         | Share dialog, link field, copy button          |
| `-transfers-toggle`, `-transfers-clear`, `-transfer-{transferId}` (+ `-cancel`, `-retry`, `-dismiss`) | Transfer queue                                 |

`{id}` is the item id with characters outside `[A-Za-z0-9_-]` replaced by `-`. The detail drawer itself carries the `<sd-side-drawer>` attribute `components-side-drawer-file-explorer-drive-preview`; its close button is `.sd-side-drawer-close-btn` inside it.

## Related

- `<sd-preview-pdf>` / `<sd-preview-image>` — standalone viewers (`@sdcorejs/angular/components/preview`).
- `<sd-tree>` — general-purpose tree with selection and commands.
- `<sd-side-drawer>` — the file detail; its `container` input keeps the drawer inside the explorer.
- `<sd-breadcrumb>`, `<sd-data-state>` — used internally for the path and the loading / empty / error states.
- `<sd-upload-file>` — single form upload control; independent of this component.

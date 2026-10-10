# `<sd-file-explorer>`

**Type**: Component
**Selector**: `sd-file-explorer`
**Import path**: `@sdcorejs/angular/components/file-explorer` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdFileExplorer`
**Standalone**: yes
**Change detection**: `OnPush` (signal-driven)

## One-line purpose

Google-Drive-like file browser in a single element: folder tree, breadcrumb, list / grid, search in the current folder, a file detail drawer (image, PDF and video preview, metadata, download, share link), multi-file upload with drag-and-drop, downloads and a transfer queue, plus opt-in multi-file selection with bulk actions and per-file / per-folder commands. It is storage-agnostic — every read and write goes through the callbacks of `SdFileExplorerOption`.

## When to use

- Browsing documents stored in any backend (S3/MinIO behind your API, SharePoint, a DMS, a database of attachments…).
- A "My files" or "Attachments" page where users navigate folders, preview and download files, upload new ones and create folders.
- An embedded picker-like browser inside a side panel — the layout adapts to the width of the explorer itself.

## When NOT to use

- A single upload field in a form → use `<sd-upload-file>`. The explorer does not depend on it and does not replace it.
- Built-in document management (rename, move, delete, permissions, versions) — the explorer has none of that logic. Plug your own operations in through `selector.actions`, `fileCommands` and `folderCommands` (see [Selection and commands](#selection-and-commands)); confirmation, errors, loading and refreshing stay in your code. Sharing is limited to creating a link through `share`.
- Standalone image, PDF or video viewing → use `<sd-preview-image>` / `<sd-preview-pdf>` / `<sd-preview-video>` directly.

## Sizing

The host renders `display: flex; height: 100%; min-height: 480px`. **Give the parent a height** (explicit `height`, `flex: 1`, a grid row…). The item area, tree and transfer queue scroll inside the explorer.

The width comes from the parent too. Inside a flex or grid container that sizes children to their content, stretch the explorer or its wrapper (`width: 100%`, `flex: 1`, `align-self: stretch`): measured narrow, it switches to the compact layout, whose smaller content width then keeps it there.

Below **720 px of its own width** (measured with `ResizeObserver`, not the viewport) the explorer switches to the compact layout: search moves under the title, the upload button becomes icon-only, the tree becomes a slide-in panel opened by a menu button, the "Modified" column is hidden, the file detail drawer takes the whole width of the item area (minus an 8 px inset), and each row, card or tree node trades its commands and download / share shortcuts for one actions trigger that opens a command drawer (see [Compact layout: command drawer](#compact-layout-command-drawer)).

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

| Field            | Type                                                                                 | Required | Notes                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list`           | `({ parentId, signal }) => SdFileExplorerItem[] \| Promise<…>`                       | yes      | Direct children of a folder; `parentId` is `null` for the root. Called lazily once per folder (first open or first expand in the tree), then cached until `reload()` or a successful upload / folder creation there.                                                                                                   |
| `search`         | `({ parentId, keyword, signal }) => SdFileExplorerItem[] \| Promise<…>`              | no       | Server-side search in the current folder. Called 300 ms after the last keystroke for a non-empty keyword; stale requests are aborted and ignored. **Omitted** → the box filters the loaded children of the current folder by name (case- and Vietnamese-accent-insensitive).                                           |
| `preview`        | `({ item, signal }) => string \| Blob \| null \| undefined \| Promise<…>`            | no       | Content of the detail drawer's preview. `string` = caller-owned URL (never revoked); `Blob`/`File` = object URL created and revoked by the explorer. Only called for images, PDFs and videos; `null`/omitted → image `thumbnailUrl` or the "no preview" fallback.                                                      |
| `download`       | `({ item, progress, signal }) => Blob \| void \| Promise<Blob \| void>`              | no       | Enables download buttons (list rows and detail drawer). Return a `Blob` → saved under `item.name`. Return nothing → you handed the file to the browser; the transfer shows "Sent to browser" without a percentage.                                                                                                     |
| `share`          | `({ item, signal }) => string \| Promise<string>`                                    | no       | Enables "Share" on files (list row action and detail drawer). Resolve the link to share: the dialog shows it in a read-only field with a copy button. Whitespace is trimmed; an empty or non-string result, a throw or a rejection shows an error with retry. Called each time the dialog opens; never emits `(open)`. |
| `upload`         | `({ file, parentId, progress, signal }) => SdFileExplorerItem \| void \| Promise<…>` | no       | Enables the upload button and drag-and-drop. One call per file, **at most 3 at a time**; the destination folder is listed again after success. Throw/reject to fail the transfer (the error `message` is shown).                                                                                                       |
| `createFolder`   | `({ parentId, name }) => SdFileExplorerItem \| void \| Promise<…>`                   | no       | Enables "New folder". `name` is trimmed and non-empty. After success the current folder is listed again; throw/reject keeps the dialog open with the error `message`.                                                                                                                                                  |
| `title`          | `string`                                                                             | no       | Header heading with the app icon. Omitted → the header shows only search and upload.                                                                                                                                                                                                                                   |
| `description`    | `string`                                                                             | no       | Secondary header line (ignored without `title`).                                                                                                                                                                                                                                                                       |
| `rootLabel`      | `string`                                                                             | no       | Label of the root folder in the tree and breadcrumb. Default: translated "All files".                                                                                                                                                                                                                                  |
| `defaultView`    | `'list' \| 'grid'`                                                                   | no       | Initial layout. Default `'list'`; the user can switch.                                                                                                                                                                                                                                                                 |
| `selector`       | `SdFileExplorerSelector`                                                             | no       | Multi-file selection: a checkbox on every file of the current view, a select-all checkbox in the list header (above the grid) and a selection band with `selector.actions`. See [Selection](#selection).                                                                                                               |
| `fileCommands`   | `readonly SdFileExplorerCommand[]`                                                   | no       | Actions on one file, in list rows and grid cards. Declaring it — even as `[]` — replaces the row download and share shortcuts; the detail drawer keeps Download and Share. See [Commands](#commands).                                                                                                                  |
| `folderCommands` | `readonly SdFileExplorerCommand[]`                                                   | no       | Actions on one folder, in list rows, grid cards and the folder tree (never on the root). See [Commands](#commands).                                                                                                                                                                                                    |
| `autoId`         | `string`                                                                             | no       | E2E scope → `data-autoid="components-file-explorer-{autoId}"`.                                                                                                                                                                                                                                                         |

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

## Selection and commands

Three opt-in collections share one action shape:

| Option             | Where it renders                                                                                    | `click` receives                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `selector.actions` | Selection band above the items, while at least one file is selected                                 | `readonly SdFileExplorerItem[]` — frozen snapshot of the selection |
| `fileCommands`     | Next to the name of each file row, at the top of each file card; compact: the item's command drawer | The file, exactly as returned by `list` / `search`                 |
| `folderCommands`   | Folder rows, folder cards and folder tree nodes (not the root); compact: the item's command drawer  | The folder, exactly as returned by `list` / `search`               |

```ts
type SdFileExplorerState<T> = boolean | ((context: T) => boolean);

interface SdFileExplorerActionAppearance<T> {
  title?: string; // visible label; without it the button is icon-only
  tooltip?: string; // tooltip, and the accessible name of an icon-only button
  prefixIcon?: string; // a group without one shows more_vert
  suffixIcon?: string;
  fontSet?: SdIconSet;
  color?: SdButtonColor; // 'error' for destructive actions
  type?: SdButtonType; // 'fill' | 'light' | 'outline' | 'text'; desktop buttons only: ignored for menu items and in the compact drawer
  hidden?: SdFileExplorerState<T>;
  disabled?: SdFileExplorerState<T>;
  loading?: SdFileExplorerState<T>;
}

interface SdFileExplorerActionLeaf<T> extends SdFileExplorerActionAppearance<T> {
  click: (context: T) => void;
  children?: never;
}

interface SdFileExplorerActionGroup<T> extends SdFileExplorerActionAppearance<T> {
  children: readonly SdFileExplorerActionLeaf<T>[]; // leaves only: one level deep
  click?: never; // a group only opens its menu
}

type SdFileExplorerAction<T> = SdFileExplorerActionLeaf<T> | SdFileExplorerActionGroup<T>;
type SdFileExplorerSelectionAction = SdFileExplorerAction<readonly SdFileExplorerItem[]>;
type SdFileExplorerCommand = SdFileExplorerAction<SdFileExplorerItem>;
```

- **Leaf** → an `<sd-button>` that runs `click`. **Group** → an `<sd-button>` whose children are `<sd-button-item>`s in its Action Popover; the group itself never runs a callback. TypeScript rejects a group inside a group and a parent with both `click` and `children`; untyped configuration with those shapes, or without a `title` and a `tooltip`, is skipped with a dev-mode `console.warn`.
- **You decide the structure.** Flat buttons, groups, or several groups side by side render in the declared order. Nothing is folded into an automatic "more" menu, whatever the number of actions or the width; a narrow area wraps them onto another line instead.
- **Defaults**: a group without `prefixIcon` shows `more_vert` (also next to a `suffixIcon`). An unset `type` depends only on the kind of the definition, never on its position, title or callback: in the selection band a flat action is `light` and a group trigger `text`; every file and folder command, flat or grouped, is `text`. An unset `color` is `primary` in the selection band and `secondary` for commands. Whatever `type` and `color` you declare is kept. Menu items stay neutral unless they declare `color`. A menu item shows its `title`, or its `tooltip` when it has no title.
- **Semantic colors**: `color` takes the `sd-button` colors — `success`, `info`, `warning` and `error` included — on flat actions, group triggers and menu items. They are your data: the explorer never colors an action by its meaning, so pick the color that matches what your callback does (for example `error` for a delete that you confirm first).
- **Contrast in the selection band**: `sd-button` writes the label of a `light` or `text` button in the base color. For `success` and `warning` that base color falls under 4.5:1 on the button's light background and on the band, so in the band only, those two colors in those two variants take the status foreground role `--sd-status-success-fg` / `--sd-status-warning-fg` (default `--sd-success-dark` / `--sd-warning-dark`, also the fallback) for their label, icons and loading spinner — the pair `status-*-fg` on `status-*-bg` is the one the Core theme keeps at 4.5:1 for every preset and in dark. Enabled `text` actions in `primary` (the default color of a group trigger), `success`, `info`, `warning` and `error` also draw their hover / focus / pressed state layer (`--mat-text-button-state-layer-color`, primary by default) in the explorer tint `--sd-file-explorer-mix-tint` (white in light, the dark surface in dark), so the layer lightens — or in dark darkens — the band behind the label instead of tinting it with primary; pressed, Material's transient ripple (primary) still stacks on it. Their color, type, title, background, transient ripple, focus ring, disabled and loading look stay `sd-button`'s; `fill` and `outline`, other colors, menu items and row / tree commands are unchanged.
- **States** take a boolean or a function of the same context as `click`. They are evaluated while rendering — read Angular signals inside them to re-render when they change — and again right before `click` runs, so a second click is ignored as soon as your first click turns `loading` on, even before the next render. `hidden` removes the action (a group whose children are all hidden disappears); `disabled` keeps it visible and blocked; `loading` shows a spinner and blocks it. A loading menu item shows a spinner and is disabled. A disabled or loading group closes its open menu. A group whose children are all disabled still opens, so users can see why nothing is available.
- **You own the work.** The explorer never awaits `click`, never confirms, never deletes or moves anything and never refreshes on its own: confirm, set `loading`, report errors, then call `reload()` when your data changed.

### Selection

```ts
interface SdFileExplorerSelector {
  visible?: boolean; // default true
  actions?: readonly SdFileExplorerSelectionAction[];
  disabled?: (item: SdFileExplorerItem) => boolean;
  onSelect?: (item: SdFileExplorerItem, selectedItems: readonly SdFileExplorerItem[]) => void;
  onSelectAll?: (selectedItems: readonly SdFileExplorerItem[]) => void;
  onClear?: () => void;
}
```

- **What can be selected**: the files visible in the current folder or search results. Folders never get a checkbox, and nothing outside the current view (other folders, unloaded items) is ever selected. `disabled` locks a file's checkbox and leaves it out of "select all".
- **Select all** is a checkbox without visible text in the first column of the list header (above the cards in the grid), named and tooltipped "Select all visible files (N)" with N = selectable files. It is unchecked, mixed or checked for none, some or all of them.
- **Selection band**: shown only after at least one file is selected, on a neutral surface. It states the selection in the translated word order, then Clear and the selection actions. Actions use Core `sm` on compact/mobile layouts (32px visual height with Material's 48px touch span); wide touch layouts retain `lg`. Clear keeps a 20px icon and a 48px touch target. Wrapped action rows stay 16px apart so their touch spans do not overlap.
- **Callbacks**: `onSelect(item, selectedItems)` after each file checkbox toggle; `onSelectAll(selectedItems)` once per select-all toggle (`[]` when it deselects everything); `onClear()` once when a non-empty selection is cleared — by the clear button (focus then moves to the select-all checkbox), or because the folder, the search keyword or `list` changed, or `reload()` ran. `selectedItems` is always a frozen array in display order.
- **What keeps it**: switching between list and grid, opening a file in the detail drawer, and refreshes that do not change the scope (a finished upload or folder creation in the current folder). A file that such a refresh no longer lists, or that `disabled` starts locking, leaves the selection for good: it is not selected again when a later listing brings it back or when it is unlocked. Leaving this way is not a user action or a clear, so no callback runs — the `selectedItems` handed to `selector.actions` is always the current selection.
- Checkboxes, names and actions stay independent: a checkbox never opens a file, opening a file or folder never changes the selection, and actions never change it either.

### Commands

- `fileCommands` render next to the name of file rows and at the top of file cards; `folderCommands` on folder rows, folder cards and folder tree nodes. The synthetic root node has none.
- **Shortcut replacement**: declaring `fileCommands` — even as `[]` — removes the row download and share shortcuts, so a download command of yours is not duplicated. Leave it undefined to keep them. The detail drawer always keeps its Download and Share buttons (`download` / `share` callbacks).
- Running a command never opens the file, navigates into the folder or changes the selection.
- **Desktop**: row, card and tree commands appear on hover and on keyboard focus (`Tab` still reaches them), and stay while their menu is open or one of them is loading. In the folder tree only the hovered or focused node shows its commands, so `Tab` goes from the focused node to its commands and then out of the tree, which keeps its arrow-key navigation. Hidden tree commands take no room, so folder names use the full width of the tree; while they show, the name gets shorter (ellipsis, full name in its tooltip) and is never covered by a button.
- **Touch screens** (`(pointer: coarse)`) with the desktop layout: commands are always visible and use 48 px buttons (`lg`); the selection band uses 48 px actions and a 44 px clear button. In the folder tree, a name that does not fit next to its commands keeps its line and the commands move to a second line of the node.
- **Narrow desktop areas**: commands that do not fit next to the name wrap onto another line of the row, card or tree node, still in the declared order, and a button whose label is longer than the whole area shortens its label with an ellipsis instead of overflowing. A tree node with commands is named by its folder name alone (`aria-labelledby`), so its commands do not change how it is announced.

### Compact layout: command drawer

Below 720 px rows stay one line high: each row, card or folder tree node with something to offer carries one **actions trigger** (`more_vert`, named "Actions for {name}", `aria-haspopup="dialog"` + `aria-expanded`; 32 px, 44 px on touch screens) in place of its commands and download / share shortcuts. The trigger opens a Core **`<sd-side-drawer>` over the viewport** — portalled to `<body>`, with its backdrop, close button, `Escape`, focus trap and page scroll lock — titled with the item's full name (wrapped, never cut) above its type and size.

- **Same commands, same rules.** The drawer lists the commands the desktop layout would show for the item, in the declared order, evaluated with the same `hidden` / `disabled` / `loading` states. A group becomes a labelled section (`role="group"`) listing its children — one level, no menu inside the drawer, nothing flattened without its label. Section headings are text only, like the headings of a Core menu: the group's own `prefixIcon` and `color` stay on its desktop trigger, so a heading never repeats the icon of one of its children (a "Share" group over a "Share" item); a loading group shows a spinner in its heading. Entries look like Core menu items: neutral label, `prefixIcon` / `suffixIcon` in the declared `color` (unset stays neutral), spinner and disabled while loading; the children of a disabled or loading group are disabled. `type` only affects the desktop buttons (menu items ignore it too), and the drawer never changes your `type` or `color` values.
- **Shortcuts**: while `fileCommands` is undeclared, a list row's drawer lists **Share** and **Download** (the row shortcuts, with their callbacks). Declaring `fileCommands` — even as `[]` — removes them from the drawer as from the row. Grid cards never had the shortcuts, so their drawer only lists declared commands; an item with nothing to list gets no trigger.
- **Running a command**: the explorer checks the pressed entry again against the current item, definitions and states — a press refused this way leaves the drawer open with the current states — then closes the drawer at once and runs `click` after the next render. By then the drawer's focus trap is gone and focus is back on the trigger, so a dialog, confirmation or preview your `click` opens keeps its focus. Right before `click`, the same check runs once more, because you may change things in between: the item must still be listed where the drawer was opened (`click` receives it as listed then, a refreshed object with the same id included), the pressed definition and its group must still be declared — the same objects — and neither may be hidden, disabled or loading, signals or not. Otherwise nothing runs. A second press, or any context change before that render, runs nothing either. As on desktop, `click` is not awaited.
- **Closing**: the close button, `Escape` or the backdrop close it without running anything; focus returns to the trigger. It also closes on its own when the folder, the search keyword or `list` changes, on `reload()`, when its item leaves the listing or has nothing left to list, when the explorer leaves the compact layout (rotation, wider window), on the browser **Back** button (`popstate`) and when the explorer is destroyed. The drawer owns no history entry: Back navigates as usual and only closes the drawer on the way; inside the drawer, use its close button. When the trigger is gone, focus goes to the item's row or card (from the tree: the tree's current node), then the first item, then the search box.
- **Folder tree**: folder nodes get the same trigger and drawer. The folder panel stays open underneath, so focus comes back to the node's trigger; only the trigger of the tree's tab stop is in the tab order.
- **Width and theme**: `min(400px, 100vw - 56px)`, so a strip of backdrop always stays to tap; its content scrolls inside the drawer and keeps clear of the bottom safe area. Entries are 44 px high, 48 px on touch screens, where the drawer's close button grows to 44 px too. Being in `<body>`, the drawer follows the Core theme tokens (`--sd-text`, `--sd-border`, …) and the `<sd-side-drawer>` look, not the `--sd-file-explorer-*` overrides set on the explorer. Its header takes the drawer's own surface (`--sd-side-drawer-surface`, that is `--sd-surface`) instead of Core's always-white header, so a dark theme keeps the title and close button readable; other drawers keep Core's header.

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
- PDFs render with `<sd-preview-pdf>` in light theme, without sidebar and floating toolbar (its header keeps search, print and fullscreen). It is **imported on demand** (`import('@sdcorejs/angular/components/preview')`), so applications that never preview a PDF or a video do not download PDF.js.
- Videos render with `<sd-preview-video>`: native controls, no autoplay, metadata-only preload, and an error state with retry (a separate message for formats the browser cannot play). Its own download button is hidden because the drawer footer has **Download**. A returned `Blob` becomes an object URL that the player creates and revokes, but it must be fully downloaded first, so return a URL (signed or streamed) for large videos. Only `http(s)`, relative and `blob:` URLs are played; any other scheme shows the error state. Unlike image and PDF previews, which shrink on short explorers, a video keeps its full height so its controls stay visible. The player comes from the same on-demand import as the PDF viewer, so the first PDF or video preview downloads that chunk once.
- Other formats never call `preview`; they show a "no preview" fallback (with a download hint when `download` is set).
- Object URLs created from returned Blobs are revoked when the drawer closes, another file opens, or the explorer is destroyed. Saved downloads revoke their object URL 40 s after the save starts (timer outside the Angular zone).
- Closing: the close button, a click on the backdrop, or `Esc`. Focus returns to the row or card that opened the file.
- Stacking: the explorer sets `--sd-side-drawer-contained-z-index: 9`, so the drawer sits above the content and below the drop overlay and the dialogs.

## Share

- Files get a share action in the list rows (icon button, label "Share {name}") and a **Share** button in the detail drawer footer. Folders and grid cards have none (open a file from the grid to share it from its detail). Declaring `fileCommands` removes the row shortcut (and the row download shortcut); the drawer button stays.
- The dialog calls `share`, shows a status while the link is created, then the link in a read-only field and **Copy link**. Copying uses the Clipboard API; when it is unavailable or refused, the link is selected and the dialog asks the user to press Ctrl+C (⌘C on macOS).
- A failure shows the error `message` (or a generic text) with **Retry**. Close button, backdrop or `Esc` close the dialog, abort `signal` and return focus to the share button.
- Opened from the detail drawer, the dialog stacks above it and the drawer stays open (and `inert`) underneath.

## Keyboard and accessibility

- Tree: `role="tree"` with `aria-level`, `aria-expanded`, `aria-selected`, roving tabindex. `↑`/`↓` move, `→` expands / enters, `←` collapses / goes to the parent, `Home`/`End`, `Enter`/`Space` open the folder.
- List rows and grid cards are focusable; `Enter`/`Space` open them. The list is exposed as `role="table"`.
- Selection checkboxes are Material checkboxes named "Select {name}"; `Space` toggles them without opening the file. The select-all checkbox exposes the mixed state (`aria-checked="mixed"`). The selection sentence is one `role="status"` phrase ("2 files selected"), and the band is a `role="group"` named "File selection".
- Compact actions triggers are buttons named "Actions for {name}" (with "In progress" while one of the item's commands is loading), `aria-haspopup="dialog"` and `aria-expanded`. Their command drawer is a `role="dialog"` with `aria-modal`, labelled with the item name; groups are `role="group"` sections labelled by their title. Keys pressed on a trigger never open the row's file or the tree's folder.
- Commands are `<sd-button>`s: icon-only ones are named by their `tooltip`. A group trigger has `aria-haspopup="menu"` and `aria-expanded`; click, `Enter`/`Space`, `ArrowDown` (first item) or `ArrowUp` (last item) opens its menu, a second click closes it, and only one menu is open at a time. In the menu `↑`/`↓`/`Home`/`End` skip disabled items, `Escape` closes it and returns focus to the trigger, `Tab` closes it and moves on, and a click outside dismisses it. Choosing an item closes the menu, gives focus back to the trigger and then runs `click`. Keys pressed on a command never open the row's file or the tree's folder.
- `Esc` closes, in order: the new-folder or share dialog, the detail drawer, the compact folder panel, then clears the search. Pressed in the search box while it holds a keyword, it clears the keyword first, even with the detail drawer open.
- The detail drawer is a `role="dialog"` labelled with the file name, with a focus trap. The new-folder and share dialogs are `role="dialog"` with `aria-modal`; everything else in the explorer, an open detail drawer included, is `inert` while one of them is open.
- Buttons are `<sd-button>`; icon-only ones (row actions, compact upload, transfer actions) expose their label as `aria-label` and tooltip.
- Transfer bars are `role="progressbar"` with `aria-valuenow` only when a real percentage exists.

## Styling

Override these custom properties on `sd-file-explorer` or an ancestor. Defaults follow the Core theme tokens. Buttons follow the `<sd-button>` theme and the detail drawer the `<sd-side-drawer>` tokens (`--sd-overlay-radius`, …); in the selection band, `light` / `text` `success` and `warning` labels read the Core role `--sd-status-success-fg` / `--sd-status-warning-fg` (see [Contrast in the selection band](#selection-and-commands)), so a theme or preset that sets those roles drives them. The compact command drawer lives in `<body>`: it follows the Core tokens and `<sd-side-drawer>`, not these overrides.

| Custom property                               | Default                                                  |
| --------------------------------------------- | -------------------------------------------------------- |
| `--sd-file-explorer-accent`                   | `var(--sd-primary)`                                      |
| `--sd-file-explorer-accent-soft`              | 10 % accent on white (selected rows, active toggle)      |
| `--sd-file-explorer-surface`                  | `#ffffff`                                                |
| `--sd-file-explorer-sidebar-bg`               | light mix of `--sd-surface-muted`                        |
| `--sd-file-explorer-muted-surface`            | search box, grid thumbnail and selection band background |
| `--sd-file-explorer-preview-bg`               | 9 % accent on white                                      |
| `--sd-file-explorer-border`                   | light mix of `--sd-border`                               |
| `--sd-file-explorer-text` / `-text-secondary` | `--sd-text` / softened `--sd-text-secondary`             |
| `--sd-file-explorer-success` / `-error`       | `--sd-success` / `--sd-error`                            |
| `--sd-file-explorer-radius`                   | `16px`                                                   |
| `--sd-file-explorer-scrim`                    | `rgba(0, 0, 0, 0.4)` (compact folder panel, dialogs)     |

## i18n

All strings use `core.component.file-explorer.*` keys (`root`, `search-placeholder`, `upload`, `new-folder`, `column.*`, `type.*`, `preview.*`, `meta.*`, `share.*`, `transfers.*`, `selection.*`, `action-loading`, `item-actions`, …) in the five bundled catalogs. Sizes and dates are formatted with `I18nService.locale()` (`2,4 MB` in Vietnamese, `2.4 MB` in English). The selection band says _tệp_ in Vietnamese and _file_ in English ("2 tệp đã chọn" / "2 files selected"); `selection.selected` / `selection.selected-one` hold a `{count}` placeholder where each language puts the number ("{count}件のファイルを選択中", "已选择 {count} 个文件"). A custom catalog without the placeholder gets the number in front. Action titles and tooltips are yours: translate them before passing them in.

## Icons

### File-type icons

Files and folders use a built-in set of **45 colour icons** (`folder-closed`, `folder-open`, `file-generic` plus families and formats: document, pdf, text, markdown, spreadsheet, csv, presentation, image, png, jpg, gif, webp, svg, design, psd, ai, figma, audio, mp3, wav, video, mp4, mov, archive, zip, rar, 7z, tar, code, html, css, js, ts, json, xml, yaml, sql, python, book, app, font, 3d).

- The SVGs are **embedded in the library bundle** and rendered as decorative `<img alt="">` from `data:` URLs — no asset configuration, no font or CDN, and the fixed file-family colours work on light and dark surfaces.
- Resolution, in order: longest known extension (`report.tar.gz` → tar, `types.d.ts` → ts), dot-files (`.env`, `.gitignore`), exact MIME type, MIME family (`image/`, `video/`, `audio/`, `text/`, `font/`, `model/`), then `file-generic`. Folders use `folder-open` when expanded in the tree and `folder-closed` elsewhere.
- Sizes: 32 px in list rows, 28 px in the tree, 48 px on grid cards, 64 px in the preview fallback.
- Source of truth (maintainers): `components/file-explorer/src/assets/icons/svg/*.svg` and `manifest.json` (icon list, 136 extensions, 23 MIME fallbacks). After changing them run `npm run generate:file-explorer-icons` at the repo root to rebuild `file-explorer-icons.generated.ts`; `npm run test:scripts` fails while the generated module is stale.

### UI icons

UI icons use `<sd-icon>` Material names (`folder`, `search`, `file_upload`, `file_download`, `share`, `content_copy`, `format_list_bulleted`, `grid_view`, `menu`, `close`, `add`, `refresh`, `delete_sweep`, `error_outline`, `expand_more`, `expand_less`, `chevron_right`, `more_vert` for action groups without an icon, and `folder_open` / `search_off` for empty states), so the explorer renders with either the Material or the default Lucide icon set. The header icon is `folder` on a round accent-tinted badge, like the `<sd-section>` icon; the transfer-queue arrow is an inline SVG.

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

### Selection, bulk actions and commands

Your code confirms, tracks `loading` in a signal, reports errors and calls `reload()`; the explorer only renders the actions and hands them the selection or the item.

```ts
readonly explorer = viewChild.required(SdFileExplorer);
readonly #confirm = inject(SdConfirmService); // @sdcorejs/angular/services/confirm
readonly #busy = signal<ReadonlySet<string>>(new Set()); // ids being processed
readonly #locked = signal<ReadonlySet<string>>(new Set()); // e.g. signed contracts
readonly #isBusy = (items: readonly SdFileExplorerItem[]) => items.some(item => this.#busy().has(item.id));

readonly option: SdFileExplorerOption = {
  list: ({ parentId }) => this.api.children(parentId),
  selector: {
    disabled: item => this.#locked().has(item.id),
    onClear: () => this.log('selection cleared'),
    actions: [
      { title: 'Move', prefixIcon: 'drive_file_move', loading: items => this.#isBusy(items), click: items => this.move(items) },
      {
        title: 'Tools',
        prefixIcon: 'folder',
        children: [
          { title: 'Download', prefixIcon: 'download', click: items => this.downloadAll(items) },
          { title: 'Share', prefixIcon: 'share', disabled: items => items.length > 20, click: items => this.shareAll(items) },
        ],
      },
      {
        tooltip: 'More actions for the selected files', // icon-only group: more_vert by default
        children: [{ title: 'Delete files', prefixIcon: 'delete', color: 'error', click: items => this.remove(items) }],
      },
    ],
  },
  fileCommands: [
    { tooltip: 'Download file', prefixIcon: 'download', click: item => this.downloadAll([item]) },
    {
      tooltip: 'More file actions',
      children: [
        { title: 'Rename', prefixIcon: 'edit', click: item => this.rename(item) },
        { title: 'Delete file', prefixIcon: 'delete', color: 'error', loading: item => this.#busy().has(item.id), click: item => this.remove([item]) },
      ],
    },
  ],
  folderCommands: [
    { tooltip: 'Rename folder', prefixIcon: 'edit', click: folder => this.rename(folder) },
    { tooltip: 'More folder actions', children: [{ title: 'Move', prefixIcon: 'drive_file_move', click: folder => this.move([folder]) }] },
  ],
};

async remove(items: readonly SdFileExplorerItem[]): Promise<void> {
  try {
    await this.#confirm.confirm(`Delete ${items.length} file(s)?`); // rejects when the user cancels
  } catch {
    return;
  }
  this.#busy.update(ids => new Set([...ids, ...items.map(item => item.id)]));
  try {
    await this.api.delete(items.map(item => item.id));
    this.explorer().reload(); // lists the folder again and clears the selection
  } finally {
    this.#busy.update(ids => new Set([...ids].filter(id => !items.some(item => item.id === id))));
  }
}
```

### Semantic colors

The defaults render `Move` above as a `light` primary button and both groups as `text` primary triggers. Declare `color` (and, if you want another variant, `type`) where an action needs its own meaning:

```ts
selector: {
  actions: [
    { title: 'Move', prefixIcon: 'drive_file_move', click: items => this.move(items) }, // light, primary
    { title: 'Approve', prefixIcon: 'task_alt', color: 'success', click: items => this.approve(items) }, // light, success
    {
      title: 'Tools', // text, primary
      children: [
        { title: 'Details', prefixIcon: 'info', color: 'info', click: items => this.showDetails(items) },
        { title: 'Archive', prefixIcon: 'archive', color: 'warning', click: items => this.archive(items) },
        { title: 'Delete files', prefixIcon: 'delete', color: 'error', click: items => this.remove(items) },
      ],
    },
  ],
},
fileCommands: [
  { tooltip: 'Download file', prefixIcon: 'download', click: item => this.downloadAll([item]) }, // text, secondary
  { tooltip: 'Details', prefixIcon: 'info', color: 'info', click: item => this.showDetails([item]) }, // text, info
  { tooltip: 'Archive', prefixIcon: 'archive', type: 'light', color: 'warning', click: item => this.archive([item]) }, // as declared
],
```

`approve`, `showDetails` and `archive` are your own operations — the explorer has no approval or archive behavior and never picks a color for you.

The showcase page (`/components/file-explorer/examples`) runs these patterns against an in-memory drive: full features (including share links, selection, bulk actions, commands and the four semantic colors), read-only, compact / mobile, and loading / empty / error states.

## Anti-patterns

- DON'T recreate `option.list` on every change detection (for example a getter returning a new arrow function) — each new `list` resets the explorer.
- DON'T fake progress in `upload`/`download`; call `progress` only with real numbers, or not at all.
- DON'T revoke URLs you returned from `preview` while the panel is open; return a `Blob` if you want the explorer to own the object URL.
- DON'T put the explorer in a parent without a height — it falls back to `min-height: 480px`.
- DON'T expect an action to finish anything for you: the explorer does not await `click`, confirm, delete, move or refresh. Turn `loading` on while your work runs (that also blocks a second click) and call `reload()` afterwards.
- DON'T nest groups or give a group its own `click` — groups are one level deep and only open their menu.
- DON'T rely on a hidden overflow menu for long action lists — the explorer renders exactly the structure you declare; group rarely used actions yourself.

## E2E test attributes

With `option.autoId = 'drive'` the host is `components-file-explorer-drive`, and children use that prefix:

| Suffix                                                                                                | Element                                        |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `-search`, `-upload`, `-file-input`                                                                   | Search input, upload button, hidden file input |
| `-menu`, `-view-list`, `-view-grid`                                                                   | Compact tree toggle, view toggles              |
| `-new-folder`, `-folder-dialog`, `-folder-name`, `-folder-submit`                                     | New-folder button and dialog                   |
| `-tree-root`, `-tree-{id}`, `-tree-{id}-toggle`                                                       | Tree nodes and expanders                       |
| `-item-{id}`, `-item-{id}-download`, `-item-{id}-share`                                               | List row / grid card, row actions              |
| `-selection`, `-selection-clear`, `-select-all`, `-item-{id}-select`                                  | Selection band, clear button, checkboxes       |
| `-selection-action-{i}`, `-selection-action-{i}-{j}`                                                  | Selector action `i`, item `j` of its menu      |
| `-item-{id}-command-{i}`, `-item-{id}-command-{i}-{j}`                                                | File / folder command, item `j` of its menu    |
| `-tree-{id}-command-{i}`, `-tree-{id}-command-{i}-{j}`                                                | Folder tree command, item `j` of its menu      |
| `-item-{id}-commands`, `-tree-{id}-commands`                                                          | Compact actions trigger of a row / card / node |
| `-commands`, `-commands-{i}`, `-commands-{i}-{j}`, `-commands-share`, `-commands-download`            | Compact command drawer content and entries     |
| `-preview`, `-preview-share`, `-preview-download`, `-preview-retry`                                   | Detail drawer content and actions              |
| `-share-dialog`, `-share-link`, `-share-copy`                                                         | Share dialog, link field, copy button          |
| `-transfers-toggle`, `-transfers-clear`, `-transfer-{transferId}` (+ `-cancel`, `-retry`, `-dismiss`) | Transfer queue                                 |

`{id}` is the item id with characters outside `[A-Za-z0-9_-]` replaced by `-`. `{i}` / `{j}` are declared indexes, so a hidden sibling does not shift the others. Action and command ids sit on the `<sd-button>` host (its inner `<button>` is the control); menu item ids sit on the menu's `button[role="menuitem"]`, which only exists while the menu is open. The detail drawer itself carries the `<sd-side-drawer>` attribute `components-side-drawer-file-explorer-drive-preview`; its close button is `.sd-side-drawer-close-btn` inside it. The compact command drawer, in `<body>`, carries `components-side-drawer-file-explorer-drive-commands`; its entries are `button`s, a group's child `{j}` sits under its section `{i}`. A video preview is an `<sd-preview-video>` with `components-preview-video-file-explorer-drive-preview` (children `-video`, `-error`, `-retry`).

## Related

- `<sd-preview-pdf>` / `<sd-preview-image>` / `<sd-preview-video>` — standalone viewers (`@sdcorejs/angular/components/preview`).
- `<sd-tree>` — general-purpose tree with selection and commands.
- `<sd-side-drawer>` — the file detail; its `container` input keeps the drawer inside the explorer.
- `<sd-breadcrumb>`, `<sd-data-state>` — used internally for the path and the loading / empty / error states.
- `<sd-upload-file>` — single form upload control; independent of this component.

# Generic data, columns and capabilities (3.1)

`SdFileExplorerItem<T = unknown>` keeps your optional `data?: T` object by identity. Use the same `T` for options, open events, selection and commands. Existing `SdFileExplorerOption<T>` remains an interface with required callable `list`; existing direct calls and interface extensions remain supported.

New source-only declarations use `SdFileExplorerDataSourceOption<T>` with `dataSource: { onList, onSearch? }`. The component accepts `SdFileExplorerConfig<T>`, the union of the legacy and source-only surfaces. Do not mix `dataSource` with root `list`/`search`. Without `onSearch`, filtering stays local.

Canonical action callbacks live in `capabilities.share.onShare`, `.download.onDownload`, `.upload.onUpload`, `.preview.onPreview`, and `.createFolder.onCreateFolder`. The corresponding synchronous eligibility states are `shareable`, `downloadable`, `uploadable`, `previewable`, and `creatable`. An explicit group takes precedence over its legacy callback as a whole, including when eligibility is false. Supported actions remain visible and disabled; unsupported actions remain absent. Eligibility is rechecked at dispatch and transfer retry. These UI predicates do not replace authorization in your storage API.

Custom action leaves accept exactly one callback: canonical `onClick` or legacy `click`. Groups accept only leaf `children` and neither callback. Callbacks are not awaited: confirmation, loading, errors and reload remain yours.

Import `SdFileExplorerColumnDef` alongside `SdFileExplorer` and project list-only metadata columns:

```html
<sd-file-explorer [option]="option">
  <ng-template
    sdFileExplorerColumnDef="owner"
    [sdFileExplorerColumnFor]="option"
    title="Owner"
    width="160px"
    let-item
    let-data="data"
    let-index="index">
    {{ data?.ownerName }}
  </ng-template>
</sd-file-explorer>
```

The required `sdFileExplorerColumnFor` config anchor lets Angular infer `item`, `data` and displayed `index`. Pass the parent Explorer option; the compiler validates the anchor's DTO context but does not enforce projection-parent DTO equality. Untyped DTOs remain `unknown`. Folders use the same context. Columns append in declaration order after built-in metadata; name, selection and command columns stay built in. IDs must be non-empty and unique per instance; the first declaration wins and development mode reports duplicates. Columns do not change grid cards or provide sorting/filtering/reordering APIs.

File move is opt-in through root `move: { movable?, onMove }`. The callback receives frozen `items`, `targetFolder` (`null` for root), `source` (`drag`, `menu`, `keyboard`, `api`) and an `AbortSignal`. It owns the storage mutation and returns `false` to cancel, or `true`/`void` to accept. Explorer serializes the request, waits pessimistically, then refreshes affected cached folders without changing navigation. A refresh failure retries refresh only. Abort is cooperative and cannot promise storage rollback.

The dedicated destination picker also works with `fileCommands: []`. File-name drag handles carry the eligible visible selection in display order, or just the unselected file. Only known folder rows/cards and tree/root nodes accept internal drops; no hover navigation or blank/breadcrumb drop target exists. Folder sources, stale/forged/cross-instance tokens, same-parent members, duplicates and mixed internal/native file payloads reject the entire batch. External `Files` continue through upload only. Keyboard and API moves use the same validation pipeline.

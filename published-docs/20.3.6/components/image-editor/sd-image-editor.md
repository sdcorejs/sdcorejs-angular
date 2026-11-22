# `<sd-image-editor>`

**Type**: Component
**Selector**: `sd-image-editor`
**Import path**: `@sdcorejs/angular/components/image-editor` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdImageEditor`
**Standalone**: yes
**Change detection**: `OnPush` (signal-driven)

## One-line purpose

Inline image editor for a single still image: crop (free or with a kept ratio), 90° rotation, horizontal/vertical flip, resize in pixels, zoom/pan, undo/redo/reset, and the choice of output format and quality. **It only edits**: there is no Apply/Cancel footer inside — your page places its own buttons and calls `getResult()`, `getFile()` or `getBlob()` to get the encoded image with its real size, MIME type and dimensions. The editor never uploads, downloads or overwrites anything.

## When to use

- Cropping an avatar or a product photo to a fixed ratio before the consumer uploads it.
- Preparing a banner at a given ratio and pixel size.
- Letting users straighten (rotate/flip) and trim a photo inside a form, a modal or a drawer.
- Evidence photos (receipts, delivery proofs, site pictures) taken sideways by a phone: rotate and crop before submitting, while the original stays on the server.
- Editing an image already shown by `<sd-upload-file>` or `<sd-file-explorer>` — see [Opening from sd-upload-file and sd-file-explorer](#opening-from-sd-upload-file-and-sd-file-explorer).

## When NOT to use

- Annotation, text, stickers, colour filters, background removal, AI edits or batch processing — out of scope.
- Viewing only → use `<sd-preview-image>` (`@sdcorejs/angular/components/preview`).
- Upload and storage → the editor emits a `Blob`; send it with your own API (`<sd-upload-file>`, `<sd-file-explorer>` or `HttpClient`). Neither of those components imports the editor.
- Animated GIF/APNG/WebP, HEIC, AVIF, SVG, TIFF → rejected with a clear error (see [Formats](#formats-and-browser-behaviour)).

## Sizing

The host renders `display: flex; height: 100%; min-height: 520px`: the toolbar on top (undo, redo, reset · rotate, flip · zoom), the image stage with the settings panel on the right (288 px). There is no footer: put your Apply / Cancel buttons wherever your page needs them (under the editor, in a modal footer…). **Give the parent a height** (explicit `height`, `flex: 1`, a modal body…).

Below **720 px of its own width** (measured with `ResizeObserver`, not the viewport) the editor switches to the compact layout: the toolbar wraps, the stage gets a fixed height (`clamp(240px, 50vh, 480px)`), the panel moves under it (so it never covers the crop area) and the two scroll together. In a fixed-height parent (modal, drawer, phone screen) the editor stays inside it; in an auto-height parent it grows with its content.

## Usage

### Inline

```ts
import { Component, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdImageEditor, SdImageEditorOption } from '@sdcorejs/angular/components/image-editor';

@Component({
  selector: 'app-avatar-editor',
  imports: [SdButton, SdImageEditor],
  template: `
    <input type="file" accept="image/jpeg,image/png,image/webp" (change)="pick($event)" />
    <div style="height: 560px">
      <sd-image-editor #editor [source]="file()" [option]="option" />
    </div>
    <sd-button type="outline" title="Discard changes" [disabled]="!editor.dirty()" (click)="editor.reset()" />
    <sd-button
      type="fill"
      color="primary"
      title="Save"
      [loading]="editor.status() === 'exporting'"
      [disabled]="editor.status() !== 'ready'"
      (click)="save()" />
  `,
})
export class AvatarEditorComponent {
  readonly editor = viewChild.required(SdImageEditor);
  readonly file = signal<File | null>(null);
  readonly option: SdImageEditorOption = {
    aspectRatio: 1,
    lockAspectRatio: true,
    output: { format: 'image/jpeg', quality: 0.9, width: 512, height: 512, fileName: 'avatar' },
    limits: { maxSourceSize: 10 * 1024 * 1024 },
  };

  pick(event: Event): void {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  async save(): Promise<void> {
    const file = await this.editor().getFile(); // "avatar.jpg", 512 × 512, image/jpeg
    await this.api.uploadAvatar(file);
  }
}
```

### In a modal

The editor needs nothing special inside `<sd-modal>` or `<sd-side-drawer>`: it measures its own size and follows the modal body. Put Cancel / Apply in the modal footer, and use `@defer` so the editor code is only downloaded when the dialog opens:

```html
<sd-button type="fill" color="primary" title="Edit photo" (click)="edit()" />

<sd-modal #modal title="Edit photo" width="lg" (sdClosed)="source.set(null)">
  @defer (when source()) {
  <div style="height: min(70vh, 640px)">
    <sd-image-editor #editor [source]="source()" />
  </div>
  }
  <sd-button sdFooterLeft type="text" title="Cancel" (click)="modal.close()" />
  <sd-button sdFooterRight type="fill" color="primary" title="Apply" [disabled]="editor()?.status() !== 'ready'" (click)="apply()" />
</sd-modal>
```

```ts
readonly modal = viewChild.required(SdModal);
readonly editor = viewChild(SdImageEditor); // found once the @defer block has rendered

async apply(): Promise<void> {
  const result = await this.editor()!.getResult(); // on failure the editor shows the error; keep the modal open
  this.modal().close();
  this.save(result);
}
```

### Images behind authentication

The editor only accepts a `Blob` or `File`. It never reads credentials, cookies or tokens and never fetches URLs. Download protected or presigned images yourself, then pass the blob:

```ts
async edit(): Promise<void> {
  const blob = await firstValueFrom(this.http.get(this.photoUrl, { responseType: 'blob' })); // your interceptors add auth
  this.source.set(blob);
  this.modal().open();
}
```

### Receiving the result and uploading it

```ts
async save(): Promise<void> {
  const result = await this.editor().getResult();
  const form = new FormData();
  form.append('file', result.blob, result.fileName); // "photo.webp" — extension matches the real bytes
  await firstValueFrom(this.http.post('/api/photos', form));
  this.previewUrl = URL.createObjectURL(result.blob); // your URL: revoke it yourself when done
}
```

Cancel is yours too: close the dialog (the source is untouched) or call `reset()` to discard the edits in place.

### Opening from anywhere with one promise

Open the editor from a button, an upload field, an explorer or a table row with the same small helper: one `<sd-modal>` with your Cancel / Apply buttons in its footer, and a promise that resolves with the result on **Apply** and with `null` on **Cancel**, the close button or `Esc`.

```ts
class EditorDialog {
  readonly source = signal<Blob | null>(null);
  #resolve: ((result: SdImageEditorResult | null) => void) | null = null;

  constructor(
    private readonly modal: () => SdModal,
    private readonly editor: () => SdImageEditor | undefined
  ) {}

  readonly canApply = computed(() => this.editor()?.status() === 'ready');

  open(source: Blob): Promise<SdImageEditorResult | null> {
    this.#settle(null);
    this.source.set(source);
    this.modal().open();
    return new Promise(resolve => (this.#resolve = resolve));
  }

  async apply(): Promise<void> {
    try {
      this.#settle(await this.editor()!.getResult());
      this.modal().close();
    } catch {
      // shown in the editor; the modal stays open
    }
  }

  closed(): void {
    // bound to (sdClosed): anything but Apply yields null
    this.#settle(null);
    this.source.set(null);
  }

  #settle(result: SdImageEditorResult | null): void {
    const resolve = this.#resolve;
    this.#resolve = null;
    resolve?.(result);
  }
}
```

```html
<sd-modal #editorModal title="Edit image" width="lg" (sdClosed)="dialog.closed()">
  @defer (when dialog.source()) {
  <div style="height: min(72vh, 680px)">
    <sd-image-editor #editor [source]="dialog.source()" [option]="option" />
  </div>
  }
  <sd-button sdFooterLeft type="text" title="Cancel" (click)="editorModal.close()" />
  <sd-button sdFooterRight type="fill" color="primary" title="Apply" [disabled]="!dialog.canApply()" (click)="dialog.apply()" />
</sd-modal>
```

`@defer` keeps the editor code out of the page bundle until the first edit when nothing else on the page uses it.

## Opening from sd-upload-file and sd-file-explorer

Neither `<sd-upload-file>` nor `<sd-file-explorer>` imports the editor; your page composes them, so apps that never edit images do not download it. The showcase has both demos ("Mở từ Upload File" and "Mở từ File Explorer").

### From `<sd-upload-file>` — edit an uploaded image, keep the original

`sd-upload-file` works with keys (`[(model)]`) resolved by `[details]`. To edit one of them, fetch its blob, open the editor, upload the result as a **new** file and replace the key in the model. The old file is never overwritten, so you can keep it for audit.

```html
<sd-upload-file type="image" [upload]="upload" [details]="details" [(model)]="evidenceKeys" />
@for (key of evidenceKeys(); track key) {
<sd-button prefixIcon="crop" title="Edit" (click)="edit(key)" />
}
```

```ts
async edit(key: string): Promise<void> {
  const blob = await firstValueFrom(this.http.get(`/api/files/${key}/content`, { responseType: 'blob' }));
  const result = await this.dialog.open(blob);
  if (!result) return; // cancelled: nothing changes
  const [newKey] = await this.upload([result.file ?? new File([result.blob], result.fileName)]);
  this.evidenceKeys.update(keys => keys.map(value => (value === key ? newKey : value)));
}
```

To force a crop **before** the first upload instead, do it in your `[upload]` callback: open the editor for each picked image and send `result.blob` instead of the original file.

### From `<sd-file-explorer>` — save an edited copy next to the original

Remember the file opened in the explorer, load its blob through the same API as `option.preview`/`option.download`, then save the result as a new file and call `reload()`:

```html
<sd-button prefixIcon="crop" title="Edit image" [disabled]="!opened()" (click)="editOpened()" />
<sd-file-explorer #explorer [option]="option" (open)="opened.set($event.item.mimeType?.startsWith('image/') ? $event.item : null)" />
```

```ts
async editOpened(): Promise<void> {
  const item = this.opened();
  if (!item) return;
  const blob = await this.api.downloadBlob(item.id);
  const result = await this.dialog.open(new File([blob], item.name, { type: blob.type }));
  if (!result) return;
  await this.api.upload(item.parentId, new File([result.blob], result.fileName.replace(/(\.\w+)$/, '-edited$1')));
  this.explorer().reload(); // the edited copy appears; the original is untouched
}
```

## Inputs

| Input    | Type                                       | Default     | Description                                                                                         |
| -------- | ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------- |
| `source` | `Blob \| File \| null`                     | `null`      | Still JPEG, PNG or WebP. A new value discards the edits and loads it; `null` shows the empty state. |
| `option` | `SdImageEditorOption \| null \| undefined` | `undefined` | Ratios, output and limits (see below).                                                              |

The editor reads `source` and never modifies it, revokes object URLs it did not create, or keeps a reference after it is replaced.

## Outputs

| Output     | Payload              | When                                                                                                                                                                                 |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `(failed)` | `SdImageEditorError` | The source could not be loaded (`stage: 'load'`: unsupported, animated, too large, corrupt…). The same message is shown in the editor. Export failures reject `getResult()` instead. |

There is no `(apply)` / `(cancel)`: the editor does not own those buttons.

## Public API

Read-only signals — bind them from a template reference (`#editor`) or a `viewChild`:

| Signal                               | Type                                                        | Use                                                                             |
| ------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `status()`                           | `'empty' \| 'loading' \| 'ready' \| 'exporting' \| 'error'` | Enable your Apply button on `'ready'`, show a spinner on `'exporting'`.         |
| `dirty()`                            | `boolean`                                                   | The edits differ from the loaded image (guard before closing).                  |
| `edits()`                            | `SdImageEditorEdits \| null`                                | Current edits.                                                                  |
| `sourceInfo()`                       | `SdImageEditorSourceInfo \| null`                           | Detected MIME type, decoded width/height, bytes, `hasAlpha`, `exifOrientation`. |
| `error()`                            | `SdImageEditorError \| null`                                | Last load or export error.                                                      |
| `canUndo()`, `canRedo()`, `autoId()` | `boolean`, `boolean`, `string \| undefined`                 |                                                                                 |

Methods:

| Method                             | Returns                        | Notes                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getResult()`                      | `Promise<SdImageEditorResult>` | Encodes the current edits from the full-resolution source (reusing the size-preview encoding when nothing changed; concurrent calls share one encoding). Rejects with an `SdImageEditorError`: `not-ready` without a loaded image (or if it is replaced meanwhile), or an export code. |
| `getFile(fileName?)`               | `Promise<File>`                | Always a `File`; `fileName` (without extension) overrides `output.fileName`, the extension follows the encoded format.                                                                                                                                                                 |
| `getBlob()`                        | `Promise<Blob>`                | The encoded bytes.                                                                                                                                                                                                                                                                     |
| `reset()`                          | `void`                         | Back to the loaded image. Undoable. Also the reset icon of the toolbar.                                                                                                                                                                                                                |
| `undo()`, `redo()`                 | `void`                         |                                                                                                                                                                                                                                                                                        |
| `rotate('left' \| 'right')`        | `void`                         | 90°, as the toolbar.                                                                                                                                                                                                                                                                   |
| `flip('horizontal' \| 'vertical')` | `void`                         | Mirrors what is shown, as the toolbar.                                                                                                                                                                                                                                                 |
| `fitToView()`                      | `void`                         | View only.                                                                                                                                                                                                                                                                             |

```ts
readonly editor = viewChild.required(SdImageEditor);
// e.g. a guard before closing a dialog
canClose = () => !this.editor().dirty() || confirm('Discard your changes?');
```

## `SdImageEditorOption`

| Field             | Type                         | Default                   | Description                                                                                                                                                                                  |
| ----------------- | ---------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aspectRatios`    | `SdImageEditorAspectRatio[]` | Free, 1:1, 4:3, 16:9, 3:4 | Ratio chips `{ label?, value: number \| null }`; `value` is width / height, `null` = free.                                                                                                   |
| `aspectRatio`     | `number \| null`             | `null`                    | Ratio selected when an image loads. The initial crop is the largest centred area with that ratio.                                                                                            |
| `lockAspectRatio` | `boolean`                    | `false`                   | Keep `aspectRatio` for the whole session: the chips are hidden and the "Keep ratio" toggle is shown on and disabled, with an info icon whose tooltip reads "Ratio fixed by the application". |
| `output`          | `SdImageEditorOutputOption`  | —                         | See below.                                                                                                                                                                                   |
| `limits`          | `SdImageEditorLimits`        | —                         | See [Limits](#memory-and-limits).                                                                                                                                                            |
| `historyLimit`    | `number`                     | `50`                      | Undo steps kept.                                                                                                                                                                             |
| `autoId`          | `string`                     | —                         | E2E scope, see [E2E test attributes](#e2e-test-attributes).                                                                                                                                  |

`aspectRatio`, `lockAspectRatio` and the `output` defaults are applied when an image loads; output rules and limits apply immediately.

### `SdImageEditorOutputOption`

| Field            | Type                                          | Default                          | Description                                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`         | `'image/jpeg' \| 'image/png' \| 'image/webp'` | source format                    | Initial format. When the browser cannot encode the source format: PNG for images with transparency, JPEG otherwise. An explicitly requested format is kept even if unsupported — `getResult()` then rejects with `format-unsupported` instead of silently switching. |
| `formats`        | `SdImageEditorFormat[]`                       | JPEG, PNG, WebP                  | Formats in the picker. Unsupported ones stay visible but disabled. A single format hides the picker.                                                                                                                                                                 |
| `quality`        | `number` (0–1)                                | `0.92`                           | JPEG/WebP quality. The quality slider only appears for these formats; PNG is lossless.                                                                                                                                                                               |
| `background`     | CSS colour                                    | `'white'`                        | Painted under the image for JPEG (no alpha). The colour field appears when the output is JPEG and the image has transparent pixels.                                                                                                                                  |
| `width`/`height` | `number`                                      | —                                | Default output box: until the user types a size, the crop is scaled down to fit inside it, keeping its ratio.                                                                                                                                                        |
| `allowUpscale`   | `boolean`                                     | `false`                          | Allow an output larger than the crop (automatic or typed).                                                                                                                                                                                                           |
| `fileName`       | `string`                                      | source `File` name, else `image` | Name without extension; the extension always follows the encoded format (`.jpg`, `.png`, `.webp`).                                                                                                                                                                   |
| `resultType`     | `'auto' \| 'blob' \| 'file'`                  | `'auto'`                         | `'auto'` returns a `File` when the source is a `File`, else a plain `Blob`.                                                                                                                                                                                          |

## `SdImageEditorResult`

| Field            | Type                  | Description                                                                   |
| ---------------- | --------------------- | ----------------------------------------------------------------------------- |
| `blob`           | `Blob`                | Encoded image (the same object as `file` when a `File` is returned).          |
| `file`           | `File \| null`        | `File` named `fileName`, or `null`.                                           |
| `fileName`       | `string`              | Name with the extension of the real format.                                   |
| `mimeType`       | `SdImageEditorFormat` | Read back from the encoded bytes, never just the requested type.              |
| `width`/`height` | `number`              | Output pixels.                                                                |
| `size`           | `number`              | Bytes.                                                                        |
| `quality`        | `number \| null`      | Quality used for JPEG/WebP, `null` for PNG.                                   |
| `edits`          | `SdImageEditorEdits`  | What produced the image (below) — enough to replay the transform on a server. |
| `sizeLimited`    | `boolean`             | `true` when the automatic output size was reduced to respect `limits`.        |

## Editing model

The editor keeps the decoded source untouched plus one small `SdImageEditorEdits` object; undo/redo stores these objects (a few numbers each, at most `historyLimit`), never canvases, data URLs or re-encoded images.

```ts
interface SdImageEditorEdits {
  flip: boolean; // mirror left ↔ right first
  rotate: 0 | 90 | 180 | 270; // then rotate clockwise
  crop: { x: number; y: number; width: number; height: number }; // in pixels of the oriented image
  aspectRatio: number | null; // "keep ratio": locked crop shape, null = free
  resize: { width: number; height: number } | null; // null = follow the crop; always the crop ratio
}
```

### Transform order

`decode (EXIF orientation applied) → flip → rotate → crop → resize → encode`.

- **Crop coordinates** are whole pixels of the _oriented_ image — what the user sees — with the origin at its top-left corner.
- **Rotate/flip buttons act on what is shown.** Every combination reduces to `{ flip, rotate }`: for instance "flip vertically" on an unrotated image is stored as `{ flip: true, rotate: 180 }`, and "rotate right then flip horizontally" differs from "flip horizontally then rotate right", exactly like on screen.
- **The crop follows the content.** Rotating or flipping carries the crop rectangle with the image, so it keeps framing the same pixels. With a fixed ratio, a quarter turn re-shapes the crop to that ratio around the same centre, and a typed output size swaps width and height.
- **Keep ratio locks the crop shape.** On (a ratio chip, `option.aspectRatio`, or the lock of the "Keep ratio" row), dragging, typing and quarter turns keep `aspectRatio`; turning it on from a free crop locks the current shape. Off, the crop is dragged and typed freely.
- **The output size only scales.** Width and height always follow the crop ratio — typing one computes the other — so the image is never stretched. To change the shape, change the crop.
- **Zoom and pan only move the view.** They are not part of the edits, the history or the export.
- **Undo/redo** covers crop, keep ratio, rotation, flip and output size. A drag is one step (committed on pointer up); consecutive arrow-key nudges within 0.8 s are one step. **Reset** returns to the loaded image and can itself be undone. Format, quality and background are output settings, not history steps. A new `source` starts a fresh history.

### Preview and export use the same maths

The on-screen canvas is a copy of the source downscaled to at most 4 MP, positioned with a CSS `matrix()` built from the same orientation matrix the export uses. **`getResult()` never reads the preview**: it draws the full-resolution source once into a canvas of the output size with `Scale(output ÷ crop) · Translate(−crop) · Orientation`, then encodes that canvas. Zooming to 800 % shows the lower-resolution preview; the exported pixels are unaffected.

### EXIF orientation

JPEG orientation (tags 1–8) is applied **once, by the browser's decoder** (`createImageBitmap(..., { imageOrientation: 'from-image' })`). The editor then treats the upright image as the source, so a phone photo is never rotated twice. If a decoder ignores a swapping orientation (5–8, detected by the decoded size), the editor applies it itself, once. Exported files contain no EXIF, so other viewers show them as edited.

## Formats and browser behaviour

- **Input**: still JPEG, PNG and WebP, recognised from their bytes (the declared `Blob.type` is ignored). APNG and animated WebP are rejected with `animated` rather than silently keeping the first frame. GIF, HEIC, AVIF, SVG, BMP, TIFF and unknown bytes are rejected with `unsupported-format`; truncated or corrupt files with `decode-failed`.
- **Output**: JPEG, PNG and WebP as the browser encodes them. On load the editor encodes a 1 × 1 probe per format; formats the browser cannot really produce (for example WebP on some Safari versions, which return PNG bytes) are disabled in the picker. After every encode the first bytes are checked, and a mismatch fails with `format-unsupported` — the result is never mislabelled.
- **Transparency**: PNG and WebP keep the alpha channel. JPEG has none: transparent pixels are painted with `background` (white by default).
- **Colour and metadata**: pixels go through the browser canvas (sRGB). Colour profiles and metadata (EXIF, XMP, GPS) are not kept. Semi-transparent pixels may shift slightly because canvases store premultiplied alpha.

## Memory and limits

| Limit (`option.limits`) | Default            | Checked                                                                                                       |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `maxSourceSize`         | 40 MiB             | Before reading the file → `source-too-large`.                                                                 |
| `maxSourcePixels`       | 40 000 000         | On the header (JPEG/PNG/WebP), **before decoding**, and again on the decoded size → `source-too-many-pixels`. |
| `maxOutputPixels`       | 16 777 216 (4096²) | Caps the output size (the canvas limit of iOS Safari).                                                        |
| `maxOutputSide`         | 16 384             | Caps the longest output side.                                                                                 |

- Source limits reject the image; the editor never downscales a source silently.
- Output limits cap the automatic size (the panel shows a notice and `sizeLimited` is `true` in the result) and clamp typed sizes (with a notice). Without `allowUpscale`, a typed size cannot exceed the crop.
- If the browser still cannot allocate the output canvas, `getResult()` rejects with `render-failed`.
- Memory: the decoded full-resolution bitmap (width × height × 4 bytes) and the ≤ 4 MP preview live while the image is loaded. Both, plus any object URL the editor created, are released when the source changes and when the editor is destroyed. Results of a decode or encode that finish after the source changed or the editor was destroyed are discarded and freed.
- File size: after each committed change the editor waits 0.5 s, then encodes the output once with the real pipeline and shows its **exact** size. Above 24 MP of output it shows "Measured on export" instead. `getResult()` reuses that encoding when nothing changed. Nothing is encoded during a drag.
- No browser API is touched when the package is imported; on the server (SSR) the editor stays in the empty state.

## Keyboard and accessibility

- Every toolbar button (undo, redo, reset, rotate, flip, zoom, fit) is an `<sd-button>` with a label (tooltip = accessible name). Number fields are `<sd-input-number>` (committed on blur or Enter, so typing `1280` never passes through `1`), the format picker is an `<sd-select>`; both keep the Core floating label as their accessible name.
- The crop area is focusable (`role="group"`, described by the keyboard hint): arrow keys move it by 1 px (Shift: 10 px); **Ctrl/⌘ + arrow keys** resize it (right/down grow, left/up shrink). The X, Y, width and height fields in the panel set the crop precisely.
- **Ctrl/⌘ + Z** undo, **Ctrl/⌘ + Shift + Z** or **Ctrl/⌘ + Y** redo, **+ / −** zoom, **0** fit — only while focus is inside the editor and **not** in a text/number field, so native field undo keeps working.
- **Ctrl/⌘ + wheel** (or trackpad pinch) zooms around the pointer; a plain wheel scrolls the page. Dragging outside the crop pans the view.
- Ratio chips and the "Keep ratio" lock are toggle buttons (`aria-pressed`). With `lockAspectRatio` the info icon next to "Keep ratio" is a focusable button: its `sdTooltip` opens on hover and focus, is referenced by `aria-describedby` and closes with Escape. Loading and errors are announced (`role="status"` / `role="alert"`); a hidden status region reports exporting, and export errors appear in the Output section.
- Handles have a 28 px hit area (40 px on touch screens). Pinch-to-zoom on touch screens is not supported; use the zoom buttons.

## Styling

Override these custom properties on `sd-image-editor` or an ancestor. Defaults follow the Core theme tokens and dark mode.

| Custom property                                         | Default                                                   |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `--sd-image-editor-accent`                              | `var(--sd-primary)` (handles, active chip, ratio lock)    |
| `--sd-image-editor-surface` / `-muted-surface`          | `var(--sd-surface)` / light mix of `--sd-surface-muted`   |
| `--sd-image-editor-stage-bg`                            | mix of `--sd-surface-muted`                               |
| `--sd-image-editor-border`                              | `var(--sd-border)`                                        |
| `--sd-image-editor-text` / `-text-secondary`            | `--sd-text` / `--sd-text-secondary`                       |
| `--sd-image-editor-error`, `-warning-bg`, `-warning-fg` | `--sd-error`, `--sd-status-warning-bg/fg`                 |
| `--sd-image-editor-checker-light` / `-checker-dark`     | theme tokens (light and dark values) for the checkerboard |
| `--sd-image-editor-checker-size`                        | `16px`                                                    |
| `--sd-image-editor-shade`                               | `rgba(0, 0, 0, 0.55)` outside the crop                    |
| `--sd-image-editor-frame`                               | `white` crop frame and guides                             |
| `--sd-image-editor-radius`                              | `var(--sd-radius-12)`                                     |
| `--sd-image-editor-panel-width`                         | `288px`                                                   |

## i18n

All strings use `core.component.image-editor.*` keys (`undo`, `rotate-left`, `crop`, `resize`, `output`, `meta-*`, `size-*`, `error.*`, …) in the five bundled catalogs. Byte sizes use `I18nService.locale()`.

## Icons

Material names through `<sd-icon>` with Lucide aliases: `undo`, `redo`, `rotate_left`, `rotate_right`, `flip` (rotated 90° for the vertical flip), `zoom_out`, `zoom_in`, `fit_screen`, `crop`, `photo_size_select_large`, `tune`, `lock` / `lock_open`, `image`, `broken_image`, `restart_alt`, `check`. Apps on the Lucide set must register the corresponding Lucide icons (`provideSdIcon({ lucideIcons: [...] })`).

## Examples

### Banner 16:9 at 1600 px, WebP

```ts
readonly bannerOption: SdImageEditorOption = {
  aspectRatio: 16 / 9,
  lockAspectRatio: true,
  output: { format: 'image/webp', quality: 0.85, width: 1600, fileName: 'banner' },
};
```

The crop is scaled down to 1600 × 900 (never up, unless `allowUpscale`); the user can still type another size.

### Replaying the edits on a server

`result.edits` describes the transform relative to the original file, so a server can re-create the image from the untouched original (for example at a higher quality) instead of trusting the uploaded pixels:

1. Decode the original and apply its EXIF orientation.
2. If `edits.flip`, mirror left ↔ right.
3. Rotate clockwise by `edits.rotate` degrees.
4. Extract `edits.crop` (`x`, `y`, `width`, `height`, in pixels of the rotated image).
5. Resize to `edits.resize` (or keep the crop size when `null`).

Keep this order: your image library may apply chained operations in its own order, so run the steps one at a time if needed.

## Anti-patterns

- DON'T pass a URL: fetch it into a `Blob` first (with your auth), the editor never fetches.
- DON'T read `blob.type` from a user file to decide the format — the editor sniffs bytes; rely on `result.mimeType`.
- DON'T put the editor in a parent without a height — it falls back to `min-height: 520px`.
- DON'T expect the editor to upload or save: call `getResult()` from your own button, and revoke object URLs you create for the result.

## Known limitations (MVP)

- One still image at a time; no annotation, text, filters, background removal, AI, batch.
- Rotation in 90° steps only (no free-angle straightening).
- No pinch-to-zoom on touch screens (zoom buttons work).
- Metadata and colour profiles are not preserved; the output is sRGB.
- The preview is limited to 4 MP, so very high zoom levels look soft on large photos (the export is not affected).

## E2E test attributes

With `option.autoId = 'avatar'` the host is `components-image-editor-avatar`, and children use that prefix:

| Suffix                                                                                            | Element                                             |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `-undo`, `-redo`, `-reset`, `-rotate-left`, `-rotate-right`, `-flip-horizontal`, `-flip-vertical` | Toolbar buttons (`sd-button` hosts)                 |
| `-zoom-out`, `-zoom-value`, `-zoom-in`, `-fit`                                                    | Zoom controls                                       |
| `-stage`, `-preview`, `-crop`, `-handle-{nw\|n\|ne\|e\|se\|s\|sw\|w}`                             | Stage, preview canvas, crop box, handles            |
| `-ratio-{index}-{value\|free}`, `-keep-ratio`, `-ratio-value`                                     | Ratio chips, "Keep ratio" lock and its value        |
| `-crop-x`, `-crop-y`, `-crop-width`, `-crop-height`                                               | Crop fields (`sd-input-number` hosts)               |
| `-output-width`, `-output-height`, `-resize-reset`, `-limited`                                    | Output size fields and notices                      |
| `-format`, `-quality`, `-background`, `-export-error`                                             | Output settings (`-format` is the `sd-select` host) |
| `-meta-source`, `-meta-output`, `-meta-size`                                                      | Information rows                                    |
| `-status`, `-error`                                                                               | Hidden export status, load error state              |

## Related

- `<sd-preview-image>` — read-only viewer with zoom and rotate (`@sdcorejs/angular/components/preview`).
- `<sd-modal>`, `<sd-side-drawer>` — hosts for a dialog-based editing flow.
- `<sd-upload-file>`, `<sd-file-explorer>` — upload/storage UIs; compose them with the editor in your app (see [Opening from sd-upload-file and sd-file-explorer](#opening-from-sd-upload-file-and-sd-file-explorer)), they do not import it.

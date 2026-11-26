# `<sd-upload-file>`

**Type**: Component (generic over `TArgs`)
**Selector**: `sd-upload-file`
**Import path**: `@sdcorejs/angular/components/upload-file` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdUploadFile<TArgs = any>`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

File picker + drag-drop + preview component — manages a list of "to-be-uploaded" and "already-uploaded" files (images, documents, generic), with built-in validation, preview thumbnails, reorder, image-resize, and a public `upload()` method to be called before form submit.

## When to use

- Image attachment fields (avatar, gallery, evidence photos) — `[type]="'image'"`
- Document attachments (PDF, Word, Excel, contracts) — `[type]="'document'"` or `'file'`
- Multi-file evidence with reorderable order
- Inside a form (template-driven via `[form]="ngForm"` or reactive via `[form]="formGroup"`) where you need `required` validation tied to the form
- When the parent needs to defer the actual server upload until form-submit time (call `await uploadFileRef.upload()` before the API call)

## When NOT to use

- For huge file uploads with chunking / resumable streams → wrap your own component using a different uploader (this component reads each file fully and previews via FileReader)
- For "select existing files from a CMS" — this is a fresh-upload component, not a media-library picker
- For instant single-file upload that immediately writes to a CDN with no preview — overkill; use a simple `<input type="file">`

## Configuration provider — REQUIRED unless `[upload]` is bound

The component uploads via either:

1. The `[upload]` input function bound directly, OR
2. An injected `SD_UPLOAD_FILE_CONFIGURATION` token (single config or array of configs keyed by `key`).

```ts
// app.config.ts
provide: SD_UPLOAD_FILE_CONFIGURATION,
useValue: {
  // key?: 'avatar', // optional — match with [key] input
  upload:   (files, args) => myService.upload(files, args).then(r => r.idOrKeys),
  details:  (idOrKeys, args) => myService.details(idOrKeys, args), // returns SdUploadFileDetail[]
  download: (idOrKey, args) => myService.download(idOrKey, args),
}
```

If multiple configs are provided as an array, **duplicate `key` values throw on init**. Use `[key]="'avatar'"` to select among them.

## Inputs

| Name             | Type                                  | Default     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`         | `string \| null \| undefined`         | `undefined` | E2E test hook. Computed prefix `components-upload-file-{autoId}` on the drop zone trigger (rendered via `data-autoid` attribute). Each per-file remove button gets `components-upload-file-{autoId}-remove-{index}` (index-based for stability across duplicate filenames).                                                                                                                                                   |
| `args`           | `TArgs` (generic)                     | `undefined` | Opaque payload forwarded to `upload`/`details`/`download` handlers as second arg. Use it to pass domain context (entity id, type, …).                                                                                                                                                                                                                                                                                         |
| `label`          | `string`                              | `undefined` | Field label rendered above the picker via `<sd-label>`.                                                                                                                                                                                                                                                                                                                                                                       |
| `key`            | `string \| undefined`                 | `undefined` | Selects which config from `SD_UPLOAD_FILE_CONFIGURATION` array to use.                                                                                                                                                                                                                                                                                                                                                        |
| `description`    | `string`                              | `undefined` | Description shown under label (replaces auto-generated description).                                                                                                                                                                                                                                                                                                                                                          |
| `helperText`     | `string \| undefined`                 | `undefined` | Helper text passed to `<sd-label>`.                                                                                                                                                                                                                                                                                                                                                                                           |
| `previewWidth`   | `string`                              | `'72px'`    | Width of each image tile and of the upload tile (variant `default`). 50px before wave 3 · 4c. |
| `previewHeight`  | `string`                              | `'72px'`    | Height of each image tile and of the upload tile (variant `default`). 50px before wave 3 · 4c. |
| `variant`        | `'default' \| 'inline'`              | `'default'` | `default`: label + counter, image grid / drop zone and document rows. `inline`: one 32px line for `sd-table` cells and dense lists (upload tile, images, document chips, `+N`), without label, description or counter. |
| `align`          | `'left' \| 'center'`                  | `'left'`    | Horizontal alignment of the thumbnail row.                                                                                                                                                                                                                                                                                                                                                                                    |
| `upload`         | `SdUploadFileFuncUpload<TArgs>`       | `undefined` | `(files, args) => Promise<string[]>` — must return exactly one non-empty string ID for each supplied file, in the same order. Overrides config. A batch contains one file per distinct local key.                                                                                                                                                                                                                                                                                                                                |
| `details`        | `SdUploadFileFuncDetails<TArgs>`      | `undefined` | `(idOrKeys, args) => Promise<SdUploadFileDetail[]>` — fetches metadata to render existing files. Overrides config.                                                                                                                                                                                                                                                                                                            |
| `download`       | `SdUploadFileFuncDownload<TArgs>`     | `undefined` | `(idOrKey, args) => Promise<void>` — called when the user clicks a file. **When set, it ALWAYS takes priority over the detail `src` URL** for server files (those that have an `idOrKey`): the click triggers this handler instead of opening the URL. Use it for authenticated / proxied downloads. A freshly-picked local `File` (not yet uploaded, no `idOrKey`) still downloads directly from the blob. Overrides config. |
| `type`           | `'image' \| 'document' \| 'file'`     | `'file'`    | Layout switch: `image`=square thumbnails, `document`=row with file-type icon, `file`=mixed.                                                                                                                                                                                                                                                                                                                                   |
| `max`            | `number`                              | `10`        | Max number of files allowed in `model`.                                                                                                                                                                                                                                                                                                                                                                                       |
| `maxOfImage`     | `number`                              | `3`         | Disabled (viewed) `default` variant: only the first N images render, the last one covered by `+N`. `inline` variant: the number of items (images then documents) shown before `+N`. |
| `extensions`     | `string[]`                            | `[]`        | Allowed file extensions, e.g. `['png','jpg','pdf']`. Empty = any. Filters the file dialog (`accept`); a file with another extension (dropped, or picked through "All files") stays in the list with the reason and is not added to `model`. |
| `maxSize`        | `number`                              | `undefined` | Max size in MB per file. A larger file stays in the list with the reason and is not added to `model`. |
| `maxWidth`       | `number`                              | `undefined` | Max image width in pixels (image type only).                                                                                                                                                                                                                                                                                                                                                                                  |
| `maxHeight`      | `number`                              | `undefined` | Max image height in pixels (image type only).                                                                                                                                                                                                                                                                                                                                                                                 |
| `imageValidator` | `(image: HTMLImageElement) => string` | `undefined` | Custom image-validator returning an error message or empty string.                                                                                                                                                                                                                                                                                                                                                            |
| `scaleToPixel`   | `number`                              | `undefined` | If set, images are auto-resized client-side until `width*height ≤ scaleToPixel`.                                                                                                                                                                                                                                                                                                                                              |
| `name`           | `string`                              | random uuid | Form-control name when registered in the parent `FormGroup`.                                                                                                                                                                                                                                                                                                                                                                  |
| `form`           | `FormGroup \| NgForm`                 | `undefined` | Parent form. Accepts both reactive `FormGroup` and template-driven `NgForm` (auto-extracts `.form`). The component registers its internal control under `name`.                                                                                                                                                                                                                                                               |
| `required`       | `boolean` (`''` truthy)               | `false`     | Required validator. Bare attribute = `true`.                                                                                                                                                                                                                                                                                                                                                                                  |
| `disabled`       | `boolean` (`''` truthy)               | `false`     | Disables picker + reorder. Bare attribute = `true`. In disabled state shows file list as read-only with download/preview only.                                                                                                                                                                                                                                                                                                |

## Outputs

| Name           | Type                                | Notes                                                                                                                                                                                                                               |
| -------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loaded`       | `OutputRef<PreviewFile[]>`          | Declared output — reserved for future use; currently not emitted. Do not rely on it until the API is stabilised.                                                                                                                    |
| `filesChanged` | `OutputRef<(string \| File)[]>`     | Emits the resolved preview items after the current metadata refresh, and immediately on confirmed removal. Items are server keys, CDN URLs, or freshly-picked `File` objects. Superseded refreshes and callbacks after destruction do not emit. Missing server metadata can omit an item from this output; use `model` for the authoritative key list.                                  |
| `model`        | `ModelSignal<(string \| number)[]>` | **Two-way bindable via `[(model)]`**. Holds idOrKeys / cdn URLs / hashed-keys-of-pending-uploads. Set this from your form to pre-populate. Updating the array triggers `#details()` to resolve metadata and refresh `previewFiles`. |

## Public API (call via template ref)

```ts
@ViewChild(SdUploadFile) uploadRef!: SdUploadFile;
```

- `uploadRef.upload()` → `Promise<void>` — **Must be awaited before submitting the form to the server.** Reads pending files from the current model and per-control local snapshots/cache, independently of preview loading, then replaces their keys with returned IDs. Resolves to `void`; the next metadata refresh may still be pending. See the concurrency and error rules below.
- `uploadRef.getFiles()` → `Promise<File[]>` — Returns local `File` objects in the current preview. This method retains its preview-based behavior and may lag behind `model` while metadata is loading; it is not the source used by `upload()`.
- `uploadRef.preview(file?)` → opens the popup at `file` (default the first file).
- `uploadRef.failures()` — files refused when picked or dropped (`{ id, file, fileName, reason }`), listed with their reason until removed; never in `model`.
- `uploadRef.uploadingKeys()` / `uploadRef.uploadFailedKeys()` — `model` keys of local files `upload()` is sending, or failed to send last time (they stay in `model`; Retry calls `upload()` again).
- `uploadRef.onDownload(previewFile)` — triggers download via the configured handler.
- `uploadRef.onRemove(previewFile)` — shows a confirmation dialog and removes the file from `model` + `previewFiles` on confirm.
- `uploadRef.formControl` — internal `SdFormControl` registered in the parent `FormGroup`. Use for programmatic `touched`/`dirty` checks if needed.
- `uploadRef.previewFiles()` — read the current `PreviewFile[]` signal (useful for testing or parent inspection).
- `uploadRef.showRequiredError()` — `computed<boolean>` driving the inline required-error message: `true` when not disabled, the control is touched, and the `required` validator is failing. Backed by `sdFormControlState(formControl)` so it ticks on every control event (value / status / **touched**) — this is what lets the OnPush view re-render the error when the parent form submits (`markAllAsTouched()`), without a manual `detectChanges`.

## Async preview and upload consistency

Only the current model refresh may replace the preview or emit `filesChanged`.
Changing the model invalidates older responses, including a response that resolves
before Angular runs the next effect. Each refresh snapshots local `File` references
before waiting for server metadata, so a concurrent upload removing a hash from
the cache cannot change how that refresh classifies its files.
Each control retains its own selected local files, so uploading the same file in
another control cannot evict this control's pending upload. Local references are
released when their keys leave the observed model, upload succeeds, or the
control is destroyed.

Pending preview `FileReader`s are detached and aborted when the refresh is
superseded or the component is destroyed. Queued reader callbacks cannot update
the new preview. The Promise-based `details` and `upload` callback APIs do not
accept an `AbortSignal`: existing network requests may finish, but obsolete
preview results and model writes after destruction are ignored.

Upload behavior:

- Server IDs and URLs remain in the model even if their metadata has not loaded
  or the metadata callback fails. Upload does not depend on `previewFiles`.
- Each distinct local key is uploaded once per batch. Duplicate occurrences
  retain their positions and share the returned server ID.
- Concurrent calls to `upload()` return the same in-flight Promise. The batch
  captures the local files at its start; additions made during that batch remain
  pending for a subsequent call. Finish file selection before submitting a form,
  or disable editing during submission.
- Successful IDs replace matching local keys in the **latest** model. Reordering
  is preserved, removed keys are not restored, and unrelated new keys are retained.
- A file pick that finishes its checks (resize, image validation) after `model`
  changed appends its keys to the **latest** model and checks `max` again, so it
  cannot restore keys replaced by a finished upload or drop another pick. A pick
  that finishes after destruction does not update the model.
- A handler rejection or synchronous throw propagates to the caller without
  changing the model or cache. A missing handler shows the configuration error
  and resolves without changing either.
- A malformed result (wrong count, non-array, empty/non-string ID, or sparse
  array) rejects with `Error` before changing the model or cache. There is no
  automatic retry or server-side rollback; the application owns reconciliation
  if the server uploaded files but did not return valid IDs.
- After destruction, new calls are no-ops. An already-started upload can still
  settle and release successfully uploaded cache entries, but cannot update the
  model or emit model changes.

Migration: the public method and callback signatures are unchanged. Upload
handlers must return complete ordered ID arrays; partial or malformed success
responses now reject instead of silently dropping local files. Do not rely on
duplicate local keys causing duplicate backend uploads, or on `filesChanged`
events from superseded requests.

Regression coverage lives in `src/upload-file-race.spec.ts`. It uses Angular
TestBed, real component templates, deferred callback Promises and controlled
FileReader events to exercise response ordering, early upload, cache changes,
concurrent calls, model edits, failures, and teardown without live APIs.

## Internal data model: `PreviewFile`

```ts
interface PreviewFile {
  idOrKey?: string | number; // server key or CDN URL
  file?: File | null; // File object (pending upload)
  src?: string | null; // CDN URL when already uploaded
  previewSrc: string | ArrayBuffer | null; // base64 data URL (set by FileReader)
  isPreviewImage: boolean; // true for image/* except TIFF
  fileName?: string | null;
  fileSize?: number | null;
  extension?: string | null;
  isImgError?: boolean; // true when <img> fires error event
}
```

## Content projection (slots)

- `<ng-template sdLabelDef>…</ng-template>` — custom label template (overrides default `<sd-label>` rendering). Resolved via `contentChild(SdLabelDefDirective)`.

## Standalone imports for projected templates

Every standalone host that uses `<sd-upload-file>` must import `SdUploadFile`. If the template projects `sdLabelDef`, also import `SdLabelDefDirective`.

```ts
import { Component } from '@angular/core';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdUploadFile, SdLabelDefDirective],
  template: `
    <sd-upload-file label="Attachments" [(model)]="attachments">
      <ng-template sdLabelDef>
        <strong>Attachments</strong>
      </ng-template>
    </sd-upload-file>
  `,
})
export class AttachmentComponent {
  attachments: string[] = [];
}
```

## Visual cues (helps agent map screenshots → component)

- **Label row** (wave 3 · 4c): the label, then `{n} / {max}` right after it on the same line (12px, weight 500, tabular figures, `--sd-text-secondary`), shown when there is a label, `max > 1` and the field is not disabled. The description sits under the row; with a custom `sdLabelDef` the counter follows the template and `sd-upload-file` draws the description.
- **Image grid** (`type` image / file): a wrapping grid, gap 8px, with 8px of room above and right of it for the remove badges. The **upload tile** comes first, sized by `previewWidth` / `previewHeight` (72px by default): 1px dashed `--sd-border-strong`, 8px corners, `add_photo_alternate` + "Thêm ảnh" (`type="image"`) or `upload_file` + "Tải lên" (`type="file"`) in primary; hover, focus and files dragged over the field tint it primary 6% with a primary border. Hidden when `max` is reached or disabled.
- **Image tile**: 8px corners, a 1px inset line, `object-fit: cover`. A click (or Enter) opens the popup at that image. Hover / focus within puts a 24% scrim (`--sd-upload-file-scrim`) and shows the remove badge. Drag to reorder (images only move among image positions of `model`). While `upload()` sends it, or while its preview is read, it shows the local image under a 60% surface layer and a 22px primary spinner (`role="status"`). A failed upload turns it into an error tile (`--sd-status-error-*`, `error` icon + "Thử lại"): a click retries.
- **Remove badge**: a 20px round button at −7px / −7px of the tile or row, `--sd-surface` with a `--sd-border` line, `close` 14px; hover and focus turn icon and line `--sd-error`. Shown on hover or focus within (opacity + visibility), always under `pointer: coarse` with a 44px hit area. Named "Xóa {name}" (`core.component.upload-file.remove-named`).
- **Drop zone** (`type="document"`): full width, at least 56px, 1px dashed `--sd-border-strong`, 8px corners, `upload_file` + "Kéo thả tệp vào đây hoặc **chọn tệp**". Hover / focus tint it primary 6%; files dragged over make the line solid primary with "Thả để tải lên"; a required error makes the line `--sd-error`. Hidden when full or disabled.
- **Document rows** (`type` document / file): 52px rows, 1px `--sd-border`, 8px corners, `--sd-surface` (primary 5% on hover): file-type icon 24px, the name (14px, `--sd-text`, ellipsis) over `{EXT} · {size}`, and a 32px download button. A click on the row or its name opens the popup at that file — it no longer downloads. While `upload()` sends it: "Đang tải tệp lên…", a cancel button and an indeterminate 2px bar (still under reduced motion). A failed upload: an error row with Retry and remove. Drag to reorder among documents.
- **Refused files**: a file with the wrong extension or size (or not an image for `type="image"`) stays in the list as an error row (an error tile for `type="image"`) with the reason, outside `model`, until removed. Valid files of the same pick or drop are still added; only "too many files" still uses a toast.
- **Drag listeners** are host listeners (`dragenter` / `dragover` / `dragleave` / `drop`): Angular removes them on destroy. They react only while files are dragged and the field can take more; enter/leave are counted so the state does not flicker over child elements.
- **File-type icons**: one SVG per extension from the 51 in `src/assets/file-types/` (pdf, doc/docx, xls/xlsx, ppt/pptx, csv, zip, txt, mp4, …; `jpeg` → jpg, `tif` → tiff, `htm` → html), the generic file icon for any other. They are drawn by one internal component (`sd-upload-file-type-icon`) shared by the field and the popup, so the inlined SVGs sit once in the CSS.
- **File size**: below 1 MB it is `{n} KB`, a whole number rounded up (at least 1 KB); from 1 MB it is `{n} MB` with one decimal, in the number format of the current language (`2,4 MB` in vi, `2.4 MB` in en). It reads `PreviewFile.fileSize`, in bytes.
- **Disabled / viewed mode**: no upload tile, drop zone or remove badge; document rows keep only download. Only the first `maxOfImage` images render; the last one is covered by a 60% scrim with `+N` (16px, weight 500). A click on any tile, `+N` included, opens the popup at that image.
- **Inline variant** (`variant="inline"`): one 32px line (4px above for the badges), no wrap: a 32px dashed upload tile (`upload_file` 18px), 32px images, document chips (32px high, `--sd-surface-muted`, icon 18px + name 12px, at most 140px) and `+N` for the rest (opens the popup at the first hidden file). Empty: "Chưa có tệp" in `--sd-upload-file-empty-text`. Remove badges are 16px at −4px. Files dragged over tint the whole line primary 6%. A required error is an error line around the upload tile (and a visually hidden alert); no reorder, label, description or counter.
- **Required error**: an `error` icon (16px) and 12px/16px `--sd-error` text `Vui lòng tải lên tệp/ảnh` under the field, like the other fields (no extra padding). Gated by the reactive `showRequiredError()` computed, so it appears as soon as the parent form is submitted (`markAllAsTouched()`) — not only after a direct upload/remove interaction.
- **Auto description** (when `[description]` not set): renders `Định dạng: png, jpg và tối đa: 5MB` style based on `extensions` + `maxSize`.

## E2E test attributes

Rendered on the existing input anchor (drop zone) that already carries `data-autoid`:

| Attribute       | Value                             | Source                      |
| --------------- | --------------------------------- | --------------------------- |
| `data-autoid`   | `components-upload-file-<autoId>` | input `autoId`              |
| `data-disabled` | `"true"` / `"false"`              | input `disabled`            |
| `data-empty`    | `"true"` / `"false"`              | `sdIsEmpty(previewFiles())` |
| `data-count`    | numeric string                    | `previewFiles().length`     |

> **Not exposed:**
>
> - `data-value` — File objects don't serialize safely. Inspect `data-count` and `data-empty` for collection state.
> - `data-loading` — the component does not currently expose a loading signal. May be added later if needed.

Selector example:

```ts
const upload = page.locator('[data-autoid="components-upload-file-docs"]');
await expect(upload).toHaveAttribute('data-count', '0');
```

## Permission gating

Not built-in. Wrap host with `*sdPermission` if upload itself is permission-gated, or hide via `*ngIf` based on user role.

## Examples

### 1. Avatar single-image upload (in a reactive form)

```html
<form [formGroup]="form">
  <sd-upload-file
    label="Ảnh đại diện"
    [form]="form"
    name="avatar"
    type="image"
    [max]="1"
    [extensions]="['png','jpg','jpeg']"
    [maxSize]="2"
    [scaleToPixel]="1024 * 1024"
    [(model)]="avatarKeys"
    [required]="true">
  </sd-upload-file>
</form>
```

### 2. Multiple document upload with custom upload handler

```html
<sd-upload-file
  #uploadRef
  label="Tệp đính kèm"
  type="document"
  [max]="10"
  [extensions]="['pdf','doc','docx','xls','xlsx']"
  [maxSize]="20"
  [upload]="onUploadFiles"
  [details]="onLoadDetails"
  [download]="onDownload"
  [(model)]="attachments">
</sd-upload-file>

<sd-button title="Lưu" type="fill" color="primary" (click)="onSubmit()"></sd-button>
```

```ts
onSubmit = async () => {
  await this.uploadRef.upload(); // CRITICAL: upload pending files first
  await this.api.save({ ...this.form.value, attachments: this.attachments });
};
```

### 3. Read-only display of already-uploaded files (e.g. on detail page)

```html
<sd-upload-file label="Hình ảnh hiện trường" type="image" [disabled]="true" [maxOfImage]="3" [model]="record.imageKeys"> </sd-upload-file>
```

> **Download behavior on click.** If a `download` handler is provided (via the `[download]` input or
> `SD_UPLOAD_FILE_CONFIGURATION`), clicking a server file (one with an `idOrKey`) **always** invokes that
> handler — it does NOT open the `src` URL returned by `details()`. This lets you route downloads through an
> authenticated/proxied endpoint instead of exposing the raw CDN URL. Without a handler, the click falls back
> to downloading directly from `src` (or the local `File` blob for not-yet-uploaded picks).
>
> That fallback goes through `SdUtilities.download`: a relative path or `blob:` URL downloads, an absolute
> `http(s)` URL opens in a new tab with `noopener,noreferrer`, and any other scheme (`javascript:`,
> `vbscript:`, `data:text/html`, …) is refused — no navigation, only a dev-mode warning. It used to go
> through `BrowserUtilities.download` from `@sdcorejs/utils`, which clicked any string and opened `http`
> links without `noopener`.

### 4. Centered image gallery, larger thumbnails

```html
<sd-upload-file
  label="Bộ sưu tập"
  type="image"
  align="center"
  previewWidth="120px"
  previewHeight="120px"
  [max]="20"
  [(model)]="galleryKeys">
</sd-upload-file>
```

## Anti-patterns

- ❌ Calling backend save without `await uploadRef.upload()` first — pending `File` objects never get uploaded; the saved record will reference temporary hashed keys that don't exist on the server.
- ❌ Forgetting to provide `SD_UPLOAD_FILE_CONFIGURATION` AND not binding `[upload]` — the component will display an `SdNotifyService.error` at upload time but compile fine. Always set up at least one path.
- ❌ Using `[max]="1"` for an avatar but forgetting to use `type="image"` — drop zone will look generic and previews will be tiny.
- ❌ Using duplicate `key` values across multiple injected configs — throws an `Error` on component init.
- ❌ Passing a Reactive `FormGroup` AND a template-driven `NgForm` — pick one. The transform handles either, but mixing causes confusion.
- ❌ Setting `[required]="true"` without binding `[form]` — validation errors won't surface in your parent form.
- ❌ Mutating `model` array in place — set a new array (`this.attachments = [...newKeys]`) so the `effect` picks up the change.

## Sub-component: `PreviewComponent` (internal)

Used internally via `<preview>` selector — rendered inside `sd-upload-file`'s template.
Typically not used standalone, but accessible via `viewChild(PreviewComponent)` if needed.

| Member                          | Type                                        | Notes                                                                                    |
| ------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `open(files, index?)`           | `(PreviewFile[], number?) => Promise<void>` | Opens the viewer at the given index (default 0). No-op if array is empty or null. |
| `updateCurrentImage(direction)` | `(1 \| -1) => void`                         | Previous (−1) / next (1) file; stops at the first and last file (wave 3 · 4b — it used to wrap). |
| `onClickThumbnailImage(index)`  | `(number) => void`                          | Jumps to thumbnail at `index`.                                                           |
| `onDownload(previewFile)`       | `(PreviewFile) => void`                     | Emits the `download` output.                                                             |
| `onClose()`                     | `() => void`                                | Closes the viewer; `close` is emitted once it has closed.                                |
| `activeIndex`                   | `number` (read-only)                        | Index of the file shown.                                                                 |
| `previewFiles`                  | `PreviewFile[]` (read-only)                 | Files loaded into the viewer.                                                            |
| `@Output() download`            | `EventEmitter<PreviewFile>`                 | Emitted when user clicks the download button on a non-image file.                        |
| `@Output() close`               | `EventEmitter<void>`                        | Emitted when the viewer closes (Esc, close button, a click around it).                   |

The viewer (wave 3 · 4b, option A) is a CDK `Dialog`, not `sd-modal` (which turns into a bottom sheet on phones, caps the
width, pads the body and does not close on Esc). `thumbnailPosition` was never read nor exported and is removed.

- **Frame**: `min(1200px, 100vw − 48px)` × `100vh − 48px`, 12px corners, dark in light and dark mode (`--sd-upload-file-viewer-*`, see THEME.md); full screen without corners at ≤ 600px. A click on the dark area around it closes it.
- **Top bar** (56px): file-type icon (accent) · name (15px/20px, ellipsis) over `{EXT} · {size}` · position `3 / 7` (`aria-live="polite"`, hidden with one file) · for a loaded image: zoom out, the `%` button (fits again), zoom in, rotate · download · open in a new tab (when the file has a safe URL or is a local file) · close. 40px icon buttons. ≤ 600px hides the zoom group.
- **Stage**: the image fitted (`contain`), zoom levels fit → 50 → 75 → 100 → 150 → 200 → 300 → 400%, drag to pan when larger than the stage, rotate by 90°; another file resets zoom and rotation. A PDF with a safe URL (or a local PDF, through an object URL) is shown in an `<iframe>` named after the file — a server that refuses framing shows its own page there, and "open in a new tab" stays on the toolbar. Other files show their icon, name, `{EXT} · {size} · Không xem trước được`, **Tải xuống** and **Mở tab mới**. Loading shows a spinner only after 150ms; a failed image shows "Không tải được tệp" with **Thử lại** (loads the image again) and **Tải xuống**.
- **Previous / next**: 40px round buttons 16px from the edges, hidden with one file, disabled at the first / last file.
- **Filmstrip** (88px): one 56px button per file (`aria-label` = name, `aria-current` on the shown one): images cover, documents show an icon and the extension (PDF red, Word blue, Excel green), a failed image `broken_image`. It scrolls to centre the shown file (`scrollTo`, no smooth scroll under reduced motion).
- **Keyboard**: ←/→ previous / next, `+` / `=` zoom in, `-` zoom out, `0` fit, Esc closes. Focus moves to the stage on open and back to the opener on close.

## `SdUploadFileDetail` interface

Shape returned by the `details()` handler:

```ts
interface SdUploadFileDetail {
  idOrKey: string; // server-side identifier
  cdn: string; // CDN or direct URL
  name?: string; // display name
  extension?: string; // e.g. 'pdf', 'jpg'
  size?: number; // file size in bytes (optional)
}
```

## Related

- `<sd-input>`, `<sd-select>`, etc. — peer form-field components that share the `<sd-label>` styling
- `SD_UPLOAD_FILE_CONFIGURATION` injection token — central upload/details/download wiring
- `SdUploadFileDetail` — shape returned by `details()` (fields: `idOrKey`, `cdn`, `name`, `size`, `extension`)
- `UploadFileService` — internal `providedIn: 'root'` service that acts as a temporary in-memory cache for `File` objects between selection and upload; managed automatically by the component
- CDK `Dialog` — hosts the preview popup
- `*sdPermission` — wrap to gate by permission

## Accessibility

- **Drop zone**: `role="button"` + `tabindex="0"` + an i18n `aria-label` (`core.component.upload-file.upload`) + a `:focus-visible` ring. Enter/Space open the file picker exactly like a click (Space calls `preventDefault()` so the page does not scroll). It previously carried `aria-hidden="true"` while still taking mouse clicks — invisible to screen readers, unreachable by keyboard.
- **Image tile** (wave 3 · 4c): a `<button>` named after the file opens the popup; the remove badge is a separate button. `onSelect` / `selectedFile` / `onSelectKeydown` are deprecated and no longer used: a tap opens the popup, and the badge is always shown under `pointer: coarse`. Its keyboard handler ignores events bubbling from the nested buttons.
- **Icon-only controls are real buttons**: the zoom-in affordance and the document remove affordance were `<sd-icon (click)>` (a custom element — not focusable, no accessible name); both are now `<button type="button">` with i18n `aria-label`s.
- The image remove button's `aria-label` was the hard-coded English `"Close"` (also the wrong verb); it now uses an i18n delete label.
- **Document name is a button**: the file name in a document row was `<a href="javascript:;">` — announced as a link that goes nowhere, and blocked outright by a CSP without `unsafe-inline` for `javascript:` URLs. It is now a `<button type="button">` that keeps the `.c-file-name` class and the link look.
- **Live regions**: the per-image upload spinner is wrapped in `role="status" aria-live="polite"`, and the required-error message uses `role="alert"` so it is announced when validation fails after submit.

### i18n compromise

Remove buttons are named with the file: `core.component.upload-file.remove-named` ("Xóa {name}"). The popup, the tiles and the rows use the keys `core.component.upload-file.{add-image, upload-tile, drop-hint, choose-file, drop-to-upload, retry, no-files}` and `core.component.upload-file.viewer.*` (five locales).

## Presentation and keyboard access

The upload tile uses `previewWidth` and `previewHeight` (default 72x72px). Inside table cells use `variant="inline"`. `type="document"` has a full-width drop zone again (wave 3 · 4c); the old `appearance` input stays removed.

The upload control supports Tab, Enter and Space. Preview/remove controls have accessible button semantics and localized names. Disabled/max-count rules, upload callbacks, model values, validation and sorting are unchanged. Document actions have 44px mobile targets.

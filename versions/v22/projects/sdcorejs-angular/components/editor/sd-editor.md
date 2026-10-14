# `<sd-editor>`

**Type:** standalone OnPush component. **Class:** SdEditor. **Import:** `@sdcorejs/angular/components/editor` (also components barrel).

## Purpose

Form-bound HTML editing with a full Core toolbar, shared Tiptap OSS schema, images and validation. Use MiniEditor for the compact toolbar; it preserves the same supported rich content. Use a textarea for plain text and CodeEditor for code.

## Inputs

| Name                           | Type / default             | Behavior                                                                                                   |
| ------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| option                         | SdEditorOption / {}        | Image upload settings.                                                                                     |
| model (valueModel alias)       | string / ''                | `[(model)]` with implicit modelChange.                                                                     |
| form                           | FormGroup / optional       | Also accepts NgForm or an object whose form is a FormGroup.                                                |
| name                           | string / generated UUID    | Form registration name; owned registrations rebind and clean up.                                           |
| label, helperText, placeholder | optional string            | Label, description and empty-content prompt.                                                               |
| required, disabled, readonly   | boolean / false            | booleanAttribute coercion. Disabled removes the control from normal form value; readonly keeps it enabled. |
| maxlength                      | optional number            | Validation/counter; does not truncate.                                                                     |
| validator                      | optional SdCustomValidator | Existing asynchronous custom-validation contract.                                                          |
| inlineError                    | optional string            | Application error.                                                                                         |
| hideInlineError                | boolean / false            | Accessible tooltip/error alternative.                                                                      |
| height, maxHeight              | string / '250px' each      | Editable/preview geometry and scrolling.                                                                   |
| key                            | optional string            | Selects upload configuration, independently of form name.                                                  |
| autoId (autoIdInput alias)     | string/null / optional     | Produces components-editor-{autoId} data hook.                                                             |

Editor uses its existing form/name connector and internal SdFormControl; it is not a CVA. Required/maxlength retain UTF-16 counting semantics, excluding img and all figure content (including figure-contained table/caption text).

## Outputs and state

| Name              | Payload / behavior                                               |
| ----------------- | ---------------------------------------------------------------- |
| modelChange       | string; two-way model companion.                                 |
| sdChange          | string; user edits debounced 100ms.                              |
| sdFocus, sdBlur   | native editable FocusEvent; blur marks touched.                  |
| sdImportWarning   | readonly SdEditorImportDiagnostic[]. No automatic value rewrite. |
| importDiagnostics | readonly signal containing current import diagnostics.           |

Editable focus/blur remains distinct from whole-component focus: opening a toolbar popup can blur the editable. Equal current-value echoes preserve selection/history. Authoritative replacements cancel pending old emissions/uploads; composition delays replacement and prevents mid-composition output.

## Example

```ts
import { SdEditor, SdEditorOption } from '@sdcorejs/angular/components/editor';
const option: SdEditorOption = {
  imageConfig: {
    uploadMode: 'deferred',
    batchSize: 2,
    maxConcurrentUploads: 2,
    uploadFn: async files => uploadImages(files),
  },
};
```

```html
<sd-editor [form]="form" name="body" label="Description" [(model)]="html" [option]="option" [required]="true" [maxlength]="2000" />
```

## Methods and uploads

`focusEditor(): void` focuses the visible editable, including readonly content; disabled controls do not receive programmatic focus. `upload(): Promise<string>` flushes deferred uploads and returns safe current HTML. A deferred call without a configured callback throws, preserving the existing contract.

Configure option.imageConfig.uploadFn or provide SD_EDITOR_CONFIGURATION with `{ key?, upload }`; option callback wins, keys must be unique. Callback `(File[]) => Promise<SdEditorUploadFileDetail[]>` returns one result per input in order: `{ idOrKey, cdn, name? }`. The returned `cdn` must pass the Core image URL sanitizer: safe HTTP(S)/relative URLs and approved `data:image` URLs are accepted; temporary `blob:` URLs and unsafe schemes are refused. The Showcase callback uses data URLs; applications can return URLs from their upload API.

Image settings retain uploadMode (deferred default/immediate), validation (dimensions, maxSizeMB, allowedFormats), batchSize/maxConcurrentUploads (2 defaults), maxImagesPerSelection and lazyLoad (true default). Validation uses bytes/dimensions, not just the filename. Removed/replaced/destroyed documents ignore stale results. Failed active replacements retain retry data; success/removal/destroy releases temporary object URLs. App callbacks cannot be cancelled unless the app supports it.

Selected images have width25/50/75/100% and left/center/right actions. Original size explicitly restores natural geometry by clearing image resize dimensions, while preserving unrelated attributes/metadata and captions.

## Migration from CKEditor

The engine is now Tiptap OSS with a Core-owned Angular adapter. Editor and MiniEditor share the full document schema; toolbar size does not remove document capabilities.

| Before                                                             | After / action                                                                                                         |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Component selectors, normal bindings and upload token              | Retained; use the examples in this guide.                                                                              |
| Public `Editor`, `editorConfig`, `onReady(ClassicEditor)`          | Removed. These were CK-specific implementation surfaces; there is no fake CK instance/config facade.                   |
| `EditorOption` / `SdMiniEditorConfig` derived from CK EditorConfig | Deprecated Core-owned aliases; CK plugins, licenseKey and plugin configuration are unsupported. Use component options. |
| CK `MentionFeedObjectItem` / MentionFeed                           | Core-owned item/feed contracts. Use typed arrays or asynchronous query functions; CK DOM itemRenderer is unsupported.  |
| `sd-ckeditor-styles` / SdCKEditorStyles                            | Deprecated compatibility export/selector. It now loads shared Core content styling; editors load styling themselves.   |
| Existing stored HTML                                               | Import checks the sanitizer AND schema before enabling edits. Do not batch rewrite stored data just to migrate the UI. |

Initial and external writes do not emit normalized values. Untouched safe HTML retains its original bytes. Supported documents serialize after an actual edit; equivalent tag/parser normalization can then occur. Safe unsupported nodes/attributes/styles remain in the original caller value, show diagnostics and lock editing. Unsupported rich paste is rejected as a whole.

Unsafe HTML is displayed only as a sanitized preview and locks editing. Existing caller values are not silently rewritten, but content getters/upload refuse unsafe export with `SdEditorImportError`. Import the error class from the normal component entrypoint to handle it. HTML/Markdown conversion that cannot preserve the document is similarly refused; never treat the preview as a lossless export.

Diagnostics carry `code` (unsafe-html, unsupported-html, markdown-loss or invalid-option), a source path, optional tag/attribute and developer detail. Built-in visible messages are localized; inspect details before deciding how your application repairs a document.

The verified corpus covers paragraphs/headings, marks, fonts/colors/alignment, nested lists, ordered start/type, merged table cells, image figures/captions, inline images and legacy mentions. This is not proof for every production HTML document. Table caption/colgroup and other unsupported structures preserve the source and lock editing until implemented; Office-specific conversion is not provided.

Tiptap schema is not an XSS sanitizer. Link/image URL, paste, CSS and upload-result boundaries are checked separately. No trusted-HTML bypass or active embeds are provided. Server rendering creates no editor DOM; the client mounts after rendering/hydration and cleans up on destroy. Manual Safari and native Telex/VNI acceptance require a real device/runtime.

No Pro/paid API, Pages, collaboration, tracked changes, DOCX import/export or DocumentEditor is included. Installed editor-specific OSS license notices ship at `assets/licenses/tiptap-oss-NOTICES.txt` (Tiptap MIT, parser MIT, entity decoder BSD-2-Clause).

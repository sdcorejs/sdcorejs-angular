# `<sd-mini-editor>`

**Type:** standalone component with ControlValueAccessor. **Class:** SdMiniEditor. **Import:** `@sdcorejs/angular/components/mini-editor` (also components barrel).

## Purpose

A compact Core toolbar for comments and notes, using the exact full Editor schema. A supported rich table/image/caption document survives a basic MiniEditor text edit; compact controls do not imply a smaller schema.

## Inputs / outputs

| Name                       | Type / default                      | Behavior                                                                                         |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| option                     | SdMiniEditorOption / required       | Format, placeholder, height/maxHeight, mention feeds and callbacks.                              |
| value                      | string / ''                         | Direct `[(value)]` binding or CVA forms/ngModel. External writes synchronize before/after mount. |
| disabled                   | boolean / false                     | Combined with CVA disabled using OR.                                                             |
| valueChange, contentChange | string                              | User output throttled 500ms, leading and trailing.                                               |
| focus, blur                | native editable FocusEvent          | Also call option.onFocus/onBlur; blur calls CVA touched.                                         |
| importWarning              | readonly SdEditorImportDiagnostic[] | No automatic value rewrite.                                                                      |
| importDiagnostics          | readonly signal                     | Current import diagnostics.                                                                      |

Registered form callbacks and option.onChange receive the same output. External writes are silent, cancel stale cadence and preserve selection/history for equality with the current document. Composition pauses queued output and flushes current content after it ends.

## Example

```ts
import { SdMiniEditorOption } from '@sdcorejs/angular/components/mini-editor';
const option: SdMiniEditorOption = {
  outputFormat: 'html',
  placeholder: 'Write a comment…',
  maxHeight: '240px',
  enableMention: true,
  mentionConfig: {
    feeds: [
      {
        marker: '@',
        minimumCharacters: 0,
        feed: [
          { id: 'user-1', name: 'An' },
          { id: 'user-2', name: 'Bình' },
        ],
      },
    ],
  },
};
```

```html
<sd-mini-editor [option]="option" [(ngModel)]="content" />
```

Option fields: outputFormat ('html' default or 'markdown'), placeholder, height/maxHeight, enableMention (false default), mentionConfig, onChange(string), onFocus/onBlur(FocusEvent), onMentionSelect(SdMiniEditorMentionItem).

## Mentions

Feeds use Core-owned `SdEditorMentionFeed`: marker, feed array or `(query) => items | Promise<items>`, minimumCharacters and dropdownLimit. Items are string or `{ id: string; name?: string; text?: string; data?: unknown }`. Identity is retained; marker/name are separate. Async stale results are ignored. Keyboard arrows/Enter/Escape and touch selection use the same atomic mention node.

`insertMention({id,name,marker?})` inserts at the current selection when enabled/editable. `getMentions()` returns `{id,name,marker}[]`. Legacy data-id/data-marker spans import without silently rewriting IDs. Deprecated valueRender was previously unused and still provides no rendering behavior; CK itemRenderer is unsupported.

## Methods / Markdown

- `setContent(string)`: silent authoritative value, retained before mount.
- `getContent(): string`: selected output format.
- `getHtmlContent(): string`: safe lossless HTML representation, or typed import/conversion failure.
- `focusEditor(): void`: focuses an enabled visible editor.
- Standard writeValue/registerOnChange/registerOnTouched/setDisabledState methods implement the CVA contract.

Markdown uses the OSS converter and the full schema. It is a compatibility format: safe conversion must survive Markdown→HTML/schema comparison. Rich structures/attributes Markdown cannot express are blocked with diagnostics; no lossy Markdown is emitted or saved after a simple edit. Changing format preserves the current document rather than replaying stale initial input; unsupported conversions retain original source and report failure.

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

A successful output-format change delivers the current document in its new representation through the existing CVA and outputs. A pending edit keeps its original 500 ms deadline; only the converted latest value is delivered. A refused Markdown conversion pauses that delivery, retains the live HTML, and reports diagnostics. Restoring HTML resumes the pending delivery; replacing the value externally cancels it. Check diagnostics before saving.

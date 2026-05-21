# `<sd-editor>`

**Type**: Component
**Selector**: `sd-editor`
**Import path**: `@sdcorejs/angular/components/editor` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdEditor`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Form-bound rich-text editor (CKEditor 5 ClassicEditor) with bold/italic/underline, font size & color, alignment, lists, and optional inline image upload + label/required/maxlength validation.

## When to use
- Long-form rich-text fields on forms â€” descriptions, notes, articles, email body
- Anywhere users need formatted text with images and word-style alignment
- Content fields that must integrate with `FormGroup` / `[(model)]` and validation (required, maxlength, custom)
- When you need batched / deferred image uploads tied to form save

## When NOT to use
- For short comments / chat messages â†’ use `<sd-mini-editor>` (lighter toolbar)
- For document templates with variables, page orientation, page breaks, headings TOC â†’ use `<sd-document-builder>`
- For plain text â†’ use `<sd-input type="textarea">`
- For code â†’ use `<sd-code-editor>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdEditorOption` | `{}` | Drives image upload, batch config, lazy-load. |
| `model` (alias of `valueModel`) | `string` | `''` | Two-way bindable: `[(model)]="html"`. |
| `height` | `string` | `'250px'` | Min height of the editor content area. Wired to `--sd-editor-content-min-height`. |
| `maxHeight` | `string` | `'250px'` | Max height before vertical scroll. Wired to `--sd-editor-content-max-height`. |
| `maxlength` | `number \| undefined` | `undefined` | Max plain-text character count (counts text, not HTML tags). When set, a counter displays. |
| `label` | `string \| undefined` | `undefined` | Optional `<sd-label>` rendered above the editor. |
| `helperText` | `string \| undefined` | `undefined` | Helper text passed to `<sd-label>`. |
| `required` | `boolean` | `false` | Marks the field required. Bare attribute = true. |
| `disabled` | `boolean` | `false` | Disables editing AND associated `formControl`. Bare attribute = true. |
| `readonly` | `boolean` | `false` | View-only mode (toolbar still visible but greyed). Bare attribute = true. |
| `hideInlineError` | `boolean` | `false` | Hide the inline `<mat-error>`; instead show a small error icon with tooltip. Bare attribute = true. |
| `inlineError` | `string \| undefined` | `undefined` | Imperative error message override (e.g. server-side error). |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder shown when empty. |
| `validator` | `SdCustomValidator \| undefined` | `undefined` | Async custom validator. |
| `form` | `FormGroup \| NgForm` | `undefined` | When set + `key`/`name`, the editor registers its `formControl` as a child of this group. |
| `key` | `string \| undefined` | `undefined` | Selects which `ISdEditorConfiguration` to use (when multiple are provided via DI). |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="components-editor-<value>"` for E2E. |
| `name` | `string` | random uuid | Form control name. |

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `model` (two-way) | `string` | Companion to `[(model)]`. |
| `sdChange` | `string` | Debounced 100ms after editor data change. Already strips/normalizes inline image classes to inline styles. |
| `sdBlur` | `FocusEvent` | Editor lost focus; also marks the form control as touched. |
| `sdFocus` | `FocusEvent` | Editor gained focus. |

## Public methods
- `onReady(editor)` â€” internal CKEditor lifecycle hook (don't call manually).
- `focusEditor()` â€” programmatic focus.
- `upload(): Promise<string>` â€” runs deferred image uploads (see `imageConfig.uploadMode === 'deferred'`) and returns final HTML. Use this in your save handler when uploads are batched.

## Content projection
None â€” label/error chrome is rendered by the component itself based on inputs.

## Visual cues
- Optional `<sd-label>` row above (label + required asterisk + helper text)
- Top toolbar with grouped buttons: Bold | Italic | Underline | Font size | Font color | Alignments (left/center/right/justify) | Bulleted list | Numbered list | (optional) Upload image
- Content area: white box with min/max height, vertical scroll past max
- Bottom-right counter "<chars>/<maxlength>" in red when over limit
- Material `<mat-error>` line below for inline error (or a small red error icon with tooltip when `hideInlineError`)
- Image upload feature: drag/drop or paste images; size resize toolbar (100/75/50/25/Original); align left/center/right
- Disabled / readonly state greys out toolbar and content

## Examples

### 1. Basic with required + maxlength
```html
<sd-editor
  label="MÃ´ táº£"
  placeholder="Nháº­p mÃ´ táº£ chi tiáº¿t..."
  [maxlength]="2000"
  [required]="true"
  [(model)]="form.value.description">
</sd-editor>
```

### 2. Inside a Reactive form
```html
<form #f="ngForm" [formGroup]="formGroup">
  <sd-editor
    label="Ná»™i dung email"
    name="body"
    [form]="f"
    [required]="true"
    [(model)]="email.body"
    (sdChange)="autosave()">
  </sd-editor>
</form>
```

### 3. With image upload (provider-injected config)
```ts
// app.config.ts
providers: [
  { provide: SD_EDITOR_CONFIGURATION, useValue: {
      key: 'cms',
      upload: (file) => uploadService.upload(file),  // returns { url, idOrKey, name }
    },
  },
],
```
```html
<sd-editor key="cms" [(model)]="article.body" maxHeight="600px"></sd-editor>
```

### 4. Deferred upload (only on save)
```ts
option: SdEditorOption = {
  imageConfig: { uploadMode: 'deferred', uploadFn: f => api.uploadImage(f), lazyLoad: true },
};
```
```html
<sd-editor #editor [option]="option" [(model)]="article.body"></sd-editor>
<sd-button title="LÆ°u" (click)="onSave()"></sd-button>
```
```ts
async onSave() {
  const finalHtml = await this.editor.upload();  // flushes pending images
  await this.api.save({ ...this.article, body: finalHtml });
}
```

## Anti-patterns
- DON'T use `<sd-editor>` for short comments â€” toolbar is too heavy; use `<sd-mini-editor>`
- DON'T set `maxlength` against HTML length â€” it counts plain text
- DON'T inline-upload massive images without resize options â€” keep `image.resizeOptions` enabled
- DON'T forget `editor.upload()` before save when using `imageConfig.uploadMode: 'deferred'` â€” otherwise blob URLs leak into stored content
- DON'T register two `ISdEditorConfiguration` with the same `key` â€” the constructor throws
- DON'T mix `disabled` and `readonly` semantically â€” `disabled` disables the entire form control; `readonly` is a view-only display

## Related
- `<sd-mini-editor>` â€” compact comment-style editor
- `<sd-document-builder>` â€” full document authoring with variables, page settings
- `<sd-label>` â€” used internally for the label row
- `SdCustomValidator` â€” custom async validator type
- `SD_EDITOR_CONFIGURATION` â€” DI token for upload config


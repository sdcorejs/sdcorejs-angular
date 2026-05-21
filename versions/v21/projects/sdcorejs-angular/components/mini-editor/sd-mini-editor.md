# `<sd-mini-editor>`

**Type**: Component
**Selector**: `sd-mini-editor`
**Import path**: `@sdcorejs/angular/components/mini-editor` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdMiniEditor`
**Standalone**: yes
**Change detection**: default (implements `ControlValueAccessor`)

## One-line purpose
Compact rich-text input (CKEditor 5 ClassicEditor) for short-form content like comments, notes, and chat-style messages â€” supports bold/italic/underline/font color/lists/links and optional `@mention`, with HTML or Markdown output.

## When to use
- Comment input on a record (timeline, ticket, post)
- Reply box in a discussion thread
- Short notes / annotations on a row or detail panel
- Anywhere you'd otherwise use a `<textarea>` but want minimal formatting + mentions
- When you need Markdown output for storage

## When NOT to use
- For long documents with images, tables, headings â†’ use `<sd-editor>`
- For full document/template authoring with variables, page breaks, page orientation â†’ use `<sd-document-builder>`
- For plain unformatted text â†’ use `<sd-input type="textarea">`
- For code â†’ use `<sd-code-editor>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdMiniEditorOption` | â€” | **Required.** Drives placeholder, output format, mention, height, callbacks. See type below. |
| `value` | `string` | `''` | Two-way bindable via `[(ngModel)]` (CVA) or `[(value)]`. |
| `disabled` | `boolean` | `false` | Disables editing. Also responds to Angular forms' `setDisabledState`. |

### `SdMiniEditorOption`
```ts
interface SdMiniEditorOption {
  outputFormat?: 'html' | 'markdown';   // default 'html' â€” when 'markdown', loads CKEditor Markdown plugin
  placeholder?: string;
  height?: string;                      // CSS height (reserved; not yet wired to host style â€” use maxHeight for now)
  maxHeight?: string;                   // CSS max-height â€” wired to host var --sd-mini-editor-max-height
  enableMention?: boolean;              // false â†’ mention plugin not loaded
  mentionConfig?: SdMiniEditorMentionConfig;  // { feeds: MentionFeed[], valueRender? }
  onChange?: (content: string) => void;
  onBlur?: (event: FocusEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onMentionSelect?: (item: SdMiniEditorMentionItem) => void;
}
```

### `SdMiniEditorMentionConfig`
```ts
interface SdMiniEditorMentionConfig {
  feeds?: MentionFeed[];    // CKEditor MentionFeed â€” each item has { marker, feed, minimumCharacters?, itemRenderer?, ... }
  valueRender?: (item: MentionFeedObjectItem) => { text: string; attributes?: Record<string, string> };
}
```

### `SdMiniEditorMentionItem`
```ts
type SdMiniEditorMentionItem<T = any> = MentionFeedObjectItem & { data?: T };
// id: string  â€” raw marker-prefixed id (e.g. '@user-123'); marker is extracted as id[0], cleanId as id.slice(1)
```

### Exported type alias
```ts
type SdMiniEditorOutputFormat = 'html' | 'markdown';
// Import: import { SdMiniEditorOutputFormat } from '@sdcorejs/angular/components/mini-editor';
```

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `valueChange` | `string` | Companion to `[(value)]`. Throttled to 500ms (leading + trailing). |
| `contentChange` | `string` | Same payload as `valueChange`, kept for clarity / readability. |
| `blur` | `FocusEvent` | Editor lost focus. |
| `focus` | `FocusEvent` | Editor gained focus. |

## Public methods
- `setContent(content: string)` â€” set HTML/Markdown into the editor.
- `getContent(): string` â€” get current content (formatted per `outputFormat`).
- `getHtmlContent(): string` â€” always returns raw HTML, ignoring `outputFormat`.
- `focusEditor()` â€” programmatic focus.
- `insertMention({ id, name, marker? })` â€” programmatically insert a mention at the cursor.
- `getMentions()` â€” returns array of mentions currently in the content.

## Content projection
None â€” toolbar and editor are fully managed by CKEditor.

## Behavior notes
- **ControlValueAccessor**: the component implements `ControlValueAccessor` and works with both template-driven (`[(ngModel)]`) and reactive (`[formControl]`) forms. `writeValue` sets the internal `value` and, if the editor is already initialised, calls `setData` on it. `setDisabledState` is NOT yet implemented â€” use the `[disabled]` input directly.
- **Throttle on content change**: the `change:data` event from CKEditor is funnelled through an RxJS `Subject` throttled at 500 ms (leading + trailing). Both `valueChange` and `contentChange` fire on the same throttled tick. `option.onChange` is also called inside the same subscriber.
- **Output format**: when `option.outputFormat === 'markdown'`, the CKEditor `Markdown` plugin is loaded and `getData()` returns Markdown automatically. No manual conversion happens inside the component â€” `#convertOutput` is a pass-through.
- **Mention plugin**: loaded dynamically only when `option.enableMention === true`. A custom `downcast` converter renders mentions as `<span class="ck-custom-mention" data-id="..." data-marker="...">` (marker-prefixed id is split: `id[0]` = marker, `id.slice(1)` = clean id). Backspace/Delete on a mention node removes the entire text node in one keypress.
- **focusEditor()** and **setContent()** are safe to call before the editor is initialised (they no-op silently).
- **Host CSS variable**: `--sd-mini-editor-max-height` is set on the host element via `@HostBinding` from `option.maxHeight`. The SCSS uses it to cap `.ck-editor__editable_inline`.
- **Lifecycle**: `ngOnDestroy` unsubscribes the RxJS subscription and calls `editor.destroy()` to release CKEditor memory.

## Visual cues
- A compact rich-text box: a small toolbar at the top (Bold | Italic | Underline | Font color | Bulleted list | Numbered list | Link), then a single editing region below
- No headings, no images, no tables â€” much shorter than `<sd-editor>` toolbar
- Editor body grows to fit content but is capped by `option.maxHeight` (scroll appears beyond)
- When `enableMention` is on, typing the configured marker (e.g. `@`) opens a dropdown of suggestions
- Inserted mentions appear as inline pills with `class="ck-custom-mention"` and `data-id` / `data-marker` attributes
- Disabled state grays out the toolbar and the editor body

## Examples

### 1. Basic comment box
```html
<sd-mini-editor
  [option]="{ placeholder: 'Viáº¿t bÃ¬nh luáº­n...', maxHeight: '160px' }"
  [(ngModel)]="comment">
</sd-mini-editor>
```

### 2. With Markdown output
```html
<sd-mini-editor
  [option]="{ outputFormat: 'markdown', placeholder: 'Ghi chÃº (Markdown)...' }"
  [(value)]="note"
  (contentChange)="onChange($event)">
</sd-mini-editor>
```

### 3. With @mention of teammates
```ts
option: SdMiniEditorOption = {
  placeholder: 'Trao Ä‘á»•i vá»›i Ä‘á»™i nhÃ³m...',
  enableMention: true,
  mentionConfig: {
    feeds: [
      {
        marker: '@',
        feed: (q) => this.userService.search(q),
        minimumCharacters: 1,
        itemRenderer: (item: any) => {
          const el = document.createElement('span');
          el.textContent = `${item.name} (${item.id})`;
          return el;
        },
      },
    ],
  },
  onMentionSelect: (m) => console.log('mentioned', m.id),
};
```
```html
<sd-mini-editor [option]="option" [(value)]="message"></sd-mini-editor>
```

### 4. Imperative content control via template ref
```html
<sd-mini-editor #editor [option]="option" [(value)]="text"></sd-mini-editor>

<sd-button title="ChÃ¨n @username" type="link"
  (click)="editor.insertMention({ id: '123', name: 'nghiatt15' })"></sd-button>
```

## Anti-patterns
- DON'T use `<sd-mini-editor>` for long-form documents â€” its toolbar is intentionally minimal; use `<sd-editor>` or `<sd-document-builder>`
- DON'T pass HTML into `value` when `outputFormat: 'markdown'` is set â€” the editor will misinterpret it
- DON'T forget `option` is required â€” leaving it `undefined` will throw on render
- DON'T render many `<sd-mini-editor>` instances on one screen â€” each loads CKEditor; prefer one shared comment box
- DON'T rely on `valueChange` / `contentChange` for keystroke-by-keystroke logic â€” they are throttled to 500ms

## Accessibility
- The CKEditor editing region is a `contenteditable` div â€” it receives focus in the natural tab order. Keyboard navigation of toolbar buttons is handled by CKEditor internals (arrow keys cycle through toolbar items).
- When using `@mention`, the mention dropdown that opens is a CKEditor-native listbox; it is keyboard-accessible (arrow keys + Enter to select, Escape to dismiss).
- The component does not add `aria-label` automatically â€” when embedding in a form, wrap with `<label>` or add an `aria-label` on the host: `<sd-mini-editor aria-label="BÃ¬nh luáº­n" ...>`.
- Mention pills rendered as `<span class="ck-custom-mention" contenteditable="false">` are non-focusable by design; screen readers will read them as inline text.
- `disabled` state passes the `[disabled]` flag to the CKEditor component which marks the editing area as non-interactive. No additional ARIA attribute is explicitly set by this component for the disabled state.

## Related
- `<sd-editor>` â€” full rich text with images, alignment, font sizes, validation
- `<sd-document-builder>` â€” document/template authoring with variables, page settings, comments
- `<sd-input type="textarea">` â€” plain unformatted text
- `<sd-code-editor>` â€” Monaco-based code editor


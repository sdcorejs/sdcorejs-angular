# `<sd-code-editor>`

**Type**: Component
**Selector**: `sd-code-editor`
**Import path**: `@sdcorejs/angular/components/code-editor` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdCodeEditor`
**Standalone**: yes
**Change detection**: `OnPush`
**View encapsulation**: `None` (so PrismJS color tokens reach the DOM)

## One-line purpose
Lightweight code viewer/editor with PrismJS syntax highlighting, copy-to-clipboard, and a friendly "macOS dots" header — supports `html`, `typescript`, `json`, `css`, `scss`. Two-way bindable via the `model` alias.

## When to use
- Display a code snippet in docs, audit logs, or developer settings
- Let an admin paste/edit JSON config (the editor auto-parses JSON on input and emits the parsed object)
- Show/edit script content in low-code/automation tools
- Provide a read-only "view code" panel (`viewed` flag)
- Embed in onboarding flows that show example payloads

## When NOT to use
- For full IDE features (LSP, multi-cursor, diffs, large files) — use Monaco editor instead
- For plain-text editing without highlighting — use `<sd-input type="textarea">`
- For Markdown/WYSIWYG content — use a dedicated rich-text editor
- For user-facing form fields where invalid input matters — JSON parse errors silently fall back to a string

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `model` | `any` (signal `model<any>` aliased as `model`) | `undefined` | Two-way bound value. Strings pass through verbatim. Non-string objects are auto-formatted: when `language='json'`, `JSON.stringify(value, null, 2)`; otherwise `String(value)`. Circular refs render an inline error comment. |
| `language` | `'html' \| 'typescript' \| 'json' \| 'css' \| 'scss'` | `'typescript'` | Syntax highlighting language. `html` is mapped to PrismJS `markup` internally. |
| `maxHeight` | `string` | `'500px'` | Max height of the code area (CSS value); content scrolls vertically beyond this. |
| `viewed` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. When true, hides the textarea and shows read-only highlighted code; header label switches to `(READ ONLY)`. When false, an editable textarea is overlaid on the highlighted code. |

> **Exported type**: `CodeLanguage = 'html' | 'typescript' | 'json' | 'css' | 'scss'` — import from `@sdcorejs/angular/components/code-editor` when you need a typed variable.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | (signal model two-way) | Standard `[(model)]="…"` binding. JSON inputs are parsed back to objects on change; if parsing fails, the raw string is emitted instead. The component avoids re-emit loops via an internal `_lastEmittedValue` guard. |

## Content projection (slots)
None — content is bound exclusively via `model`.

## Behavior notes
- **Two-way data flow**:
  - **Parent → editor**: when the `model` signal changes externally, the textarea text is updated. Non-strings are stringified (JSON.stringify for `language='json'`, `String(...)` otherwise).
  - **Editor → parent**: on every keystroke, raw text is emitted via `model.set(...)`. For `language='json'`, the component tries `JSON.parse(text)` first and emits the parsed object (so consumers receive a real object); on parse failure, it emits the raw string.
- **Loop guard**: the last emitted value is recorded; if the parent re-sets the same value, the inbound effect skips re-stringifying.
- **Copy**: header copy button uses Angular CDK `Clipboard`. Success state ("Copied") auto-resets after 2000 ms.
- **Highlighting**: PrismJS imports `typescript`, `json`, `css`, `scss`, and `markup` (HTML).
- **Trailing newline**: highlighted output appends `\n` to prevent a textarea cursor from clipping the last line.

## Visual cues (helps agent map screenshots → component)
- A dark-themed code "card" with a header bar at the top.
- **Header (left)**: macOS-style traffic-light dots (red/yellow/green) — purely decorative.
- **Header (center)**: language uppercase ("TYPESCRIPT") followed by a faint `(EDITING)` or `(READ ONLY)` label.
- **Header (right)**: a "Copy" button with a copy icon; flips to a green check + "Copied" for 2 s after a successful copy.
- **Body**: PrismJS-highlighted `<pre><code>` block; when editable, an invisible-but-aligned `<textarea>` overlays the highlighted view (textarea text is transparent; you read color from the `<pre>` underneath).
- Body scrolls vertically beyond `maxHeight`.

## Examples

### 1. Read-only JSON viewer
```ts
configJson = signal({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 });
```
```html
<sd-code-editor
  language="json"
  viewed
  [(model)]="configJson">
</sd-code-editor>
```

### 2. Editable TypeScript snippet (default)
```html
<sd-code-editor
  language="typescript"
  [(model)]="userScript">
</sd-code-editor>
```

### 3. JSON config editor — parent receives a parsed object on each change
```ts
form = signal<any>({ name: 'demo', enabled: true });
```
```html
<sd-code-editor
  language="json"
  maxHeight="320px"
  [(model)]="form">
</sd-code-editor>
<!-- form() is the parsed object whenever the user typed valid JSON;
     while typing invalid JSON, form() is the raw partial string. -->
```

### 4. HTML preview of an email template
```html
<sd-code-editor
  language="html"
  viewed
  maxHeight="600px"
  [(model)]="emailHtml">
</sd-code-editor>
```

## Anti-patterns
- Treating it as a full IDE — no IntelliSense, no linting, no LSP; switch to Monaco for serious editing
- Binding very large strings (>~50 KB) — PrismJS re-highlights on every change and is synchronous
- Using `language='json'` and assuming the model is always an object — while typing invalid JSON, the model becomes the raw string; check the type before consuming
- Setting `[language]` dynamically without expecting a re-format — switching to/from `json` re-stringifies the model
- Putting a `disabled`-styled wrapper around it instead of `viewed` — `viewed` is the official read-only toggle and updates the header label

## Accessibility
- The `<pre><code>` block has `aria-hidden="true"` — it is decorative (PrismJS colors, not raw text); the overlaid `<textarea>` is the accessible input surface when in edit mode.
- When `viewed=true` only the `<pre>` is rendered; consider adding a visually-hidden `<span>` with the raw text if the snippet must be announced by screen readers.
- `spellcheck="false"`, `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="off"` are set on the textarea to prevent browser interference with code text.

## Related
- `<sd-input type="textarea">` — for plain-text multi-line input without highlighting
- `<sd-button>` — for actions next to a read-only snippet (e.g. "Run", "Reset")
- `<sd-tab>` — to switch between multiple code samples (e.g. HTML / TS / SCSS variants)

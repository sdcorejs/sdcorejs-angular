# `sdSafeHtml` pipe (`| sdSafeHtml`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdSafeHtmlPipe` (also `@Injectable({ providedIn: 'root' })`, so it can be injected and called outside a template)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes` (or direct: `@sdcorejs/angular/pipes/safe-html`)

## One-line purpose
Renders an HTML string through `[innerHTML]`, **sanitizing by default**, with an explicit opt-in bypass for markup the application itself authored.

## Breaking change (release 1.7)

This pipe previously called `DomSanitizer.bypassSecurityTrustHtml()` unconditionally, on every value, with no sanitize step — every call site was a stored-XSS sink. The library itself piped server-supplied table cell data through it (`components/table/src/components/desktop-cell/view/view.component.html`), while `components/table/sd-table.md` already described that value as "sanitized via `sdSafeHtml`".

| | Before | Now |
| --- | --- | --- |
| `value \| sdSafeHtml` | bypassed the sanitizer | **sanitizes**: `<script>`, `on*` handlers and `javascript:` URLs are removed or neutralized |
| return type (default) | `SafeHtml` token | sanitized `string` |
| bypass | always | only via `value \| sdSafeHtml: true` |

**What to check when upgrading**: any call site that renders markup Angular's sanitizer strips — inline `<svg>`, `<iframe>`, custom elements, `style` attributes — needs `: true` added. Call sites rendering server or user content should be left alone; they are the reason for the change.

## When to use
- Render server-supplied rich text (CMS posts, audit-log diffs, formatted notifications) — use the **default** mode, which sanitizes.
- Render application-authored markup that the sanitizer would strip (inline SVG sprites, custom elements) — use `: true` and be certain the string never contains user input.

## When NOT to use
- Plain text — Angular interpolation `{{ value }}` is safer and faster.
- `: true` on anything derived from user input, URL params, or an API response. That reintroduces the XSS this change removed.

## Signature
```ts
transform(html: string | number | undefined | null, trusted?: boolean): SafeHtml | string | number | undefined
```

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `html` | `string \| number \| undefined \| null` | — | Numbers are returned as-is. Empty/falsy strings, `null` and `undefined` return `undefined`. |
| `trusted` | `boolean` | `false` | `false` → `DomSanitizer.sanitize(SecurityContext.HTML, …)`, returns a plain `string` (`''` if the value sanitizes away entirely). `true` → `bypassSecurityTrustHtml`, returns a `SafeHtml` token. |

## Examples

### 1. Server-provided announcement (untrusted — sanitized)
```html
<div [innerHTML]="announcement.body | sdSafeHtml"></div>
```

### 2. Highlighted diff in an audit cell (untrusted — sanitized)
```html
<td [innerHTML]="entry.diffHtml | sdSafeHtml"></td>
```

### 3. Application-authored inline SVG (trusted — explicit bypass)
```html
<span [innerHTML]="iconSvgString | sdSafeHtml: true"></span>
```
`<svg>` is not in Angular's allow-list, so without `: true` the markup is stripped and nothing renders.

## Edge cases / null behavior
- `null` / `undefined` / `''` → `undefined` (Angular renders nothing).
- Number input → returned untouched, in both modes.
- A value that sanitizes away completely (e.g. `'<script>alert(1)</script>'`) → `''`, not `null`, so the binding clears the element rather than rendering the string `"null"`.
- `javascript:` URLs are **neutralized, not deleted** — Angular rewrites the scheme to `unsafe:`, which the browser refuses to navigate.

## Why the bypass is not auto-detected

Deliberately no "looks like HTML → bypass" heuristic. That would escalate untrusted text that merely contains a `<` straight back into the unsanitized sink. The `: true` argument is the trust declaration, and it has to be written at the call site. This mirrors the same decision taken for the toast in `services/notify` (`html?: boolean`, opt-in, explicitly sanitized).

## Anti-patterns
- ❌ `| sdSafeHtml: true` on form input, URL params, or any API response — opens XSS.
- ❌ Reaching for `: true` to "make it render" without checking why the sanitizer stripped it.
- ❌ Chaining string pipes AFTER `: true` — once the value is a `SafeHtml` token, downstream string operations break. (In default mode the result is a plain string, so chaining is fine.)

## Related
- `services/notify/sd-notify.md` — same text-by-default / opt-in-HTML model for toast messages.
- Angular `DomSanitizer` — the underlying API.

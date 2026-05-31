# `sdSafeHtml` pipe (`| sdSafeHtml`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdSafeHtmlPipe` (also `@Injectable({ providedIn: 'root' })`)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes` (or direct: `@sdcorejs/angular/pipes/safe-html`)

## One-line purpose
Bypasses Angular's HTML sanitization via `DomSanitizer.bypassSecurityTrustHtml`, allowing trusted HTML strings to be rendered with `[innerHTML]`.

## When to use
- Render server-supplied rich-text content (CMS posts, audit-log diffs, formatted notifications) where the source is trusted
- Display preformatted snippets containing safe markup (icons, basic styling, links)

## When NOT to use
- For ANY user-supplied HTML — bypassing sanitization on untrusted input is an XSS vulnerability. Sanitize on the server or sanitize manually first.
- For plain text — Angular interpolation `{{ value }}` is safer and faster.

## Signature
```ts
transform(html: string | number | undefined | null): SafeHtml | number | undefined
```

| Param | Type | Notes |
| --- | --- | --- |
| `html` | `string \| number \| undefined \| null` | Input. Numbers are returned as-is (no sanitization). Empty/falsy strings, `null`, `undefined` return `undefined`. Otherwise returns a `SafeHtml` token from `bypassSecurityTrustHtml`. |

## Examples

### 1. Rendering a server-provided announcement
```html
<div [innerHTML]="announcement.body | sdSafeHtml"></div>
```

### 2. Highlighted diff in an audit cell
```html
<td [innerHTML]="entry.diffHtml | sdSafeHtml"></td>
```

### 3. Inline icon SVG string from config
```html
<span [innerHTML]="iconSvgString | sdSafeHtml"></span>
```

## Edge cases / null behavior
- `null` / `undefined` / `''` → returns `undefined` (Angular renders nothing).
- Number input → returned untouched (no sanitization, no bypass).
- Non-string truthy → coerced through `bypassSecurityTrustHtml` directly (TypeScript signature constrains the input, but be aware).

## Anti-patterns
- ❌ Piping user input from forms / URL params — opens XSS. Sanitize upstream or use `DomSanitizer.sanitize(SecurityContext.HTML, ...)` instead.
- ❌ Using on every cell of a table "just in case" — defeats Angular's built-in protection broadly.
- ❌ Nesting with other pipes that mutate strings — once converted to `SafeHtml`, downstream string operations break.

## Related
- Angular `DomSanitizer` — the underlying API.
- Angular `[innerHTML]` binding — the consumer of the resulting `SafeHtml` value.

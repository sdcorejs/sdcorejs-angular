# `[sdHref]` Directive

**Type**: Attribute Directive
**Selector**: `a[sdHref]` (only matches an `<a>` element)
**Class**: `SdHrefDirective`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-href`)

## One-line purpose
Smart `<a>` href that uses Angular Router for internal links and opens external (`http(s)://`) links in a new tab through `sdOpenExternal` (`window.open(url, '_blank', 'noopener,noreferrer')`).

## When to use
- Anchor cells in tables / lists where the URL may be either internal route or external
- Render data-driven links from a mapping pipe (URLs computed from a permission/route resolver)
- Preserve right-click "open in new tab" semantics (the host stays a real `<a>` with `href`)

## When NOT to use
- Standard internal-only links — use `[routerLink]` directly.
- Buttons that perform actions — use `<sd-button>` (or `<sd-anchor>`).

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `sdHref` (property: `url`) | `string` | required | URL string. Template binding key is `sdHref`; class property is `url`. If empty/falsy, `href` falls back to `#` and clicks are no-ops. If it parses as an absolute `http:`/`https:` URL, treated as external. Otherwise treated as internal route — split on `?` to derive route path and `queryParams`. |

## Outputs
None.

## Behavior
- Host-binds `attr.href` to the input (or `#` when missing) so the link is keyboardable / right-clickable.
- On click:
  - If `url` is empty → `event.preventDefault()` then no-op (the `#` fallback must not append a history entry).
  - If `sdIsExternalHttpUrl(url)` → calls `sdOpenExternal(url)` and `event.preventDefault()`.
  - Otherwise → `event.preventDefault()`, splits `url` into `path?queryString`, parses `queryString` via `URLSearchParams` into a `queryParams` record, and calls `Router.navigate([path], { queryParams })`.

### External-link detection and `noopener`

`sdIsExternalHttpUrl` / `sdOpenExternal` come from `@sdcorejs/angular/utilities`:

- The old gate was `url.startsWith('http')`, which also accepts `httpfoo` and — in the sibling `includes('http')` variant used by the layout sidebars — accepts `javascript:fetch("//evil.example.com")//http`. Both routed a script-executing URL into `window.open`. The helper parses the URL and only lets `http:` / `https:` through; it also rejects embedded credentials (`https://real.com@evil.tld/x`, whose real host is `evil.tld`).
- `sdOpenExternal` always passes `'noopener,noreferrer'` as the third `window.open` argument. Without `noopener` the opened page keeps a live `window.opener` handle and can rewrite the URL of the originating tab (reverse tabnabbing).

## Examples

### 1. Internal route with query params
```html
<a [sdHref]="'/orders/detail?id=42&tab=history'">Đơn hàng 42</a>
```

### 2. External link (opens new tab)
```html
<a [sdHref]="'https://docs.example.com/api'">API docs</a>
```

### 3. Data-driven link in a table cell
```html
<a [sdHref]="row | sdResolveOrderUrl">{{ row.code }}</a>
```

## Accessibility

- The directive always emits an `attr.href` on the host `<a>` so keyboard users can Tab to the link and activate it with Enter; screen readers announce it as a standard link.
- External links open via `sdOpenExternal(url)` → `window.open(url, '_blank', 'noopener,noreferrer')`. Consider adding visually hidden text (e.g. `(opens in new tab)`) or an `aria-label` that communicates this to assistive technology users.
- The empty-`url` fallback is `href="#"`, not `javascript:;` and not a removed attribute. `javascript:;` was rewritten by Angular's `DomSanitizer` into `unsafe:javascript:;` (a sanitizer warning on every render); dropping the attribute entirely made the `<a>` non-focusable and non-Enter-activatable while the click handler stayed bound, so only mouse users could reach it. `#` is sanitizer-clean and keeps native link semantics, and `onClick` calls `preventDefault()` so no fragment navigation or history entry occurs. Still prefer conditionally hiding an anchor over rendering one with no destination.

## Theming / CSS surface

The directive does not emit any CSS classes. All styling is on the host `<a>` element which the consuming view controls directly. No `panelClass` or injected styles.

## Testing notes

- Use `provideRouter([])` and spy on `router.navigate` **before** `createComponent` to prevent the Angular router from triggering actual navigation in the test runner.
- Spy on `window.open` globally in `beforeEach` (`spyOn(window, 'open').and.returnValue(null)`) to prevent Karma from attempting to open real browser windows.
- For any URL the directive refuses (`javascript:`, `data:`, `httpfoo`, …), invoke the directive's `onClick` method directly rather than dispatching a DOM click — the rendered `href` is rewritten by the sanitizer to `unsafe:…`, and letting the browser follow it navigates the Karma runner away:
  ```typescript
  const directive = fixture.debugElement
    .query(By.directive(SdHrefDirective))
    .injector.get(SdHrefDirective);
  directive.onClick(new MouseEvent('click'));
  ```
- Assertions on `attr.href` for the empty case expect `'#'`.
- `window.open` assertions must include the third argument: `expect(openSpy).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer')`.

## Anti-patterns
- Placing `[sdHref]` on a non-anchor element — selector restricts to `a`, so it won't match.
- Combining with `[routerLink]` on the same anchor — both will compete for the click; pick one.
- Passing a relative path expected to merge with current route — directive uses absolute `Router.navigate([path])`, not relative navigation.
- Using for links that need `target="_blank"` configurability — directive hard-codes `_blank`, and only for absolute `http:`/`https:` URLs.
- Re-introducing a `startsWith('http')` / `includes('http')` scheme test anywhere near this directive — that is the exact check `sdIsExternalHttpUrl` exists to replace.

## Related
- `<sd-anchor>` — full-featured stylized anchor component.
- Angular `routerLink` — for plain internal navigation.
- `sdIsExternalHttpUrl` / `sdOpenExternal` (`@sdcorejs/angular/utilities`) — the URL-safety helpers this directive delegates to.

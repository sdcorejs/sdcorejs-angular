# `[sdHref]` Directive

**Type**: Attribute Directive
**Selector**: `a[sdHref]` (only matches an `<a>` element)
**Class**: `SdHrefDirective`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-href`)

## One-line purpose
Smart `<a>` href that uses Angular Router for internal links and `window.open(_, '_blank')` for external (`http(s)://`) links.

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
| `sdHref` (property: `url`) | `string` | required | URL string. Template binding key is `sdHref`; class property is `url`. If empty/falsy, `href` falls back to `javascript:;` and clicks are no-ops. If starts with `http`, treated as external. Otherwise treated as internal route — split on `?` to derive route path and `queryParams`. |

## Outputs
None.

## Behavior
- Host-binds `attr.href` to the input (or `javascript:;` when missing) so the link is keyboardable / right-clickable.
- On click:
  - If `url` is empty → no-op (returns early).
  - If `url` starts with `http` → calls `window.open(url, '_blank')` and `event.preventDefault()`.
  - Otherwise → `event.preventDefault()`, splits `url` into `path?queryString`, parses `queryString` via `URLSearchParams` into a `queryParams` record, and calls `Router.navigate([path], { queryParams })`.

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

- The directive preserves `attr.href` on the host `<a>` so keyboard users can Tab to the link and activate it with Enter; screen readers announce it as a standard link.
- External links open via `window.open(_, '_blank')`. Consider adding visually hidden text (e.g. `(opens in new tab)`) or an `aria-label` that communicates this to assistive technology users.
- The fallback `href="javascript:;"` (when `url` is empty) is sanitized by Angular to `unsafe:javascript:;` in the DOM, which may confuse screen readers — avoid rendering empty-href anchors in production; prefer conditionally hiding them instead.

## Theming / CSS surface

The directive does not emit any CSS classes. All styling is on the host `<a>` element which the consuming view controls directly. No `panelClass` or injected styles.

## Testing notes

- Use `provideRouter([])` and spy on `router.navigate` **before** `createComponent` to prevent the Angular router from triggering actual navigation in the test runner.
- Spy on `window.open` globally in `beforeEach` (`spyOn(window, 'open').and.returnValue(null)`) to prevent Karma from attempting to open real browser windows.
- For the empty-href no-op test, invoke the directive's `onClick` method directly rather than dispatching a DOM click — this avoids the browser following `unsafe:javascript:;` which causes a Karma page reload:
  ```typescript
  const directive = fixture.debugElement
    .query(By.directive(SdHrefDirective))
    .injector.get(SdHrefDirective);
  directive.onClick(new MouseEvent('click'));
  ```
- Angular's `DomSanitizer` prefixes `javascript:` URLs with `unsafe:` in the DOM. Assertions on `attr.href` for the empty case should expect `'unsafe:javascript:;'`.

## Anti-patterns
- Placing `[sdHref]` on a non-anchor element — selector restricts to `a`, so it won't match.
- Combining with `[routerLink]` on the same anchor — both will compete for the click; pick one.
- Passing a relative path expected to merge with current route — directive uses absolute `Router.navigate([path])`, not relative navigation.
- Using for links that need `target="_blank"` configurability — directive hard-codes `_blank` only when scheme is `http`.

## Related
- `<sd-anchor>` — full-featured stylized anchor component.
- Angular `routerLink` — for plain internal navigation.

# `*sdDesktop` Directive

**Type**: Structural Directive
**Selector**: `[sdDesktop]`
**Class**: `SdDesktopDirective`
**Standalone**: no (declared module-style — no `standalone: true` flag)
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-desktop`)

## One-line purpose
Structural directive that renders its template ONLY on desktop (non-mobile) viewports.

## When to use
- Show a desktop-only toolbar, sidebar, or wide layout block
- Render a desktop variant of a region (paired with `*sdMobile` for the alternative)
- Hide elements that don't make sense on small screens (data tables, multi-column grids)

## When NOT to use
- For dynamic, reactive viewport tracking — this directive is evaluated ONCE at construction time (no resize listener), so it does not toggle if the user resizes the window across the breakpoint. For reactive behavior, prefer Angular CDK `BreakpointObserver` or media-query-based CSS.
- For minor styling differences — use CSS media queries instead.

## Inputs
None — the directive takes no inputs. Visibility is determined entirely by `BrowserUtilities.isMobile()` at the moment the host is constructed.

## Outputs
None.

## Behavior
- On construction, calls `BrowserUtilities.isMobile()`.
- If FALSE (i.e. desktop), creates an embedded view of the template via `ViewContainerRef.createEmbeddedView`.
- If TRUE (mobile), the template is never instantiated — DOM is empty.
- No teardown / re-evaluation logic: the decision is sticky for the lifetime of the parent view.

## Examples

### 1. Show desktop-only toolbar
```html
<div class="toolbar" *sdDesktop>
  <sd-button title="Export" prefixIcon="download" (click)="onExport()"></sd-button>
  <sd-button title="Print" prefixIcon="print" (click)="onPrint()"></sd-button>
</div>
```

### 2. Pair with `*sdMobile` for layout variants
```html
<ng-container *sdDesktop>
  <sd-page-desktop-layout [data]="data()"></sd-page-desktop-layout>
</ng-container>
<ng-container *sdMobile>
  <sd-page-mobile-layout [data]="data()"></sd-page-mobile-layout>
</ng-container>
```

## Anti-patterns
- Using `*sdDesktop` on a parent that may toggle viewport class at runtime — the directive does not react to resize.
- Combining with `*ngIf` on the same element — Angular only allows one structural directive per element; wrap with `<ng-container>`.
- Using for fine-grained styling — prefer SCSS media queries.

## Related
- `*sdMobile` — the inverse: renders only on mobile.
- `BrowserUtilities.isMobile()` — underlying detection helper (exported from `@sdcorejs/angular/utilities/extensions`).

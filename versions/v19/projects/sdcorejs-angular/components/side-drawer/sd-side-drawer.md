# `<sd-side-drawer>`

**Type**: Component
**Selector**: `sd-side-drawer`
**Import path**: `@sdcorejs/angular/components/side-drawer` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdSideDrawer extends SdBaseSecureComponent`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Right-edge slide-in panel rendered into `document.body` via CDK Portal â€” used for "create / edit / detail" forms that don't deserve a full route, but need more room than a modal: filters, side-by-side review, multi-step forms.

## When to use
- Quick "Create" / "Edit" forms triggered from a list row or toolbar button
- Detail-view of a record without leaving the current list
- Advanced filter / sort builder panels
- Bulk action confirmation panels with extra fields
- Side-by-side review (drawer on the right, base content on the left)

## When NOT to use
- For destructive confirmations or short forms (1â€“3 fields) â†’ use `<sd-modal>`
- For full-screen workflows with many steps â†’ use a route + `<sd-tab-router>`
- For inline editing within a list row â†’ use `<sd-section>` + form-on-row
- For toast / alert / notify â†’ use `SdNotifyService`
- For navigation menus â†’ use `<sd-anchor>` and the app shell

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | `''` | Header title. Replaced wholesale if `[sdHeaderLeft]` slot is provided. |
| `width` | `string` | `'480px'` | CSS width of the drawer (e.g. `'640px'`, `'40vw'`, `'100%'`). |
| `hideClose` | `boolean` | `false` | Bare attribute = true. Hides the built-in `Ã—` close button in the header. |
| `disableBackdropClose` | `boolean` | `false` | Bare attribute = true. Clicking the backdrop will NOT close the drawer (force the user to click an explicit action button). |
| `drawerClass` | `any` (string \| string[] \| object) | `''` | Custom CSS classes for the root `.sd-side-drawer` container â€” bound via `[ngClass]`. |
| `autoId` | `string \| undefined \| null` | `undefined` | Stable E2E identifier. When set, renders `data-autoid="components-side-drawer-<autoId>"` on the root element. |

> **Coerce note**: `hideClose`, `disableBackdropClose` use `booleanAttribute`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdClosed` | `void` | Fires after the drawer is closed (via close button OR backdrop click, when allowed). Use to reset state in the parent. Does NOT fire when the parent component is destroyed without calling `close()`. |

## Public API (called via `@ViewChild` / template ref)

### Methods
| Method | Notes |
| --- | --- |
| `open()` | Opens the drawer. Sets `document.body.style.overflow = 'hidden'` to lock background scroll (saving the previous value to restore on close). |
| `close()` | Closes the drawer, emits `sdClosed`, stops loading, and restores the previous `body.overflow`. |
| `startLoading()` | Shows the loading overlay inside the drawer (delegates to `SdLoadingService` keyed by drawer id). Use during async submit. |
| `stopLoading()` | Hides the loading overlay. Auto-called on `close()`. |

### Readable properties
| Property | Type | Notes |
| --- | --- | --- |
| `isOpened` | `Signal<boolean>` | `true` while the drawer is visible. Read with `drawer.isOpened()`. Drive via `open()` / `close()`. |
| `isLoading` | `Signal<boolean>` | `true` while `startLoading()` is active and `stopLoading()` / `close()` has not been called. Read with `drawer.isLoading()`. |
| `isHovered$` | `Observable<boolean>` | Emits `true` on `mouseenter` and `false` on `mouseleave` of the drawer container. Set up lazily after the first render (`afterNextRender`) â€” do NOT subscribe before `open()` is called at least once. Useful if outer logic needs to detect "is the user still hovering over the drawer". |
| `id` | `string` | Unique `I<uuid>` identifier of the drawer DOM element. Passed to `SdLoadingService` so multiple simultaneous drawers do not clash. |

## Content projection (slots)
| Slot selector | Purpose |
| --- | --- |
| `[sdHeaderLeft]` | Replaces the default `title` text. Use for richer headers (icon + title, breadcrumb, ...). |
| `[sdHeaderRight]` | Header actions left of the close button (typically a "Save" or "Print" `<sd-button>`). |
| (default) | Drawer body content. Lives inside `.sd-side-drawer-content` (scrollable). |
| `[sdFooter]` | Sticky footer at the bottom of the drawer â€” typical action bar with "Cancel" / "Save". |

## Visual cues (helps agent map screenshots â†’ component)
- Slides in from the **right edge** of the viewport (CSS class `sd-side-drawer-active` toggles transform)
- Width: `width` input (default 480px); height: full viewport
- Backdrop: semi-transparent dark overlay covering the rest of the viewport; clicking it closes (unless `disableBackdropClose`)
- Header: top bar with title on the left, action area on the right ending in a hairline `Ã—` close button (24Ã—24 SVG of two crossed lines)
- Body: scrollable content area between header and footer
- Footer: separated from the body, holds projected `[sdFooter]` content (typically Cancel + primary CTA)
- Background body scroll is locked while the drawer is open; mouse-wheel and touchmove on the backdrop are blocked via `preventScroll`
- Loading overlay (when `startLoading()` called): covers the drawer body, keyed by the unique `id` (`I<uuid>`) so multiple drawers don't clash

## Examples

### 1. Create form drawer
```html
<sd-button title="Táº¡o má»›i" type="fill" color="primary" prefixIcon="add" (click)="drawer.open()"></sd-button>

<sd-side-drawer #drawer title="Táº¡o nhÃ¢n viÃªn má»›i" width="560px" (sdClosed)="resetForm()">
  <form [formGroup]="form">
    <sd-section-item label="Há» vÃ  tÃªn"><sd-input formControlName="name"></sd-input></sd-section-item>
    <sd-section-item label="Email"><sd-input formControlName="email"></sd-input></sd-section-item>
  </form>

  <div sdFooter class="d-flex gap-8 justify-content-end">
    <sd-button type="outline" title="Há»§y" (click)="drawer.close()"></sd-button>
    <sd-button type="fill" color="primary" title="LÆ°u" (click)="onSave(drawer)"></sd-button>
  </div>
</sd-side-drawer>
```
```ts
async onSave(drawer: SdSideDrawer) {
  drawer.startLoading();
  try {
    await this.api.create(this.form.value);
    drawer.close();
  } finally {
    drawer.stopLoading();
  }
}
```

### 2. Detail drawer triggered from a row
```html
<sd-side-drawer #detail title="Chi tiáº¿t yÃªu cáº§u" width="640px" disableBackdropClose>
  <sd-section title="ThÃ´ng tin chung">
    <sd-section-item label="MÃ£ yÃªu cáº§u">{{ selected?.code }}</sd-section-item>
    <sd-section-item label="NgÆ°á»i táº¡o">{{ selected?.creator }}</sd-section-item>
  </sd-section>
</sd-side-drawer>

<sd-button (click)="select(row); detail.open()" type="link" prefixIcon="visibility"></sd-button>
```

### 3. Filter panel with backdrop close
```html
<sd-side-drawer #filterDrawer title="Bá»™ lá»c" width="420px">
  <sd-query-builder [group]="filter"></sd-query-builder>

  <div sdFooter class="d-flex justify-content-between">
    <sd-button type="link" title="Äáº·t láº¡i" (click)="filter = empty()"></sd-button>
    <sd-button type="fill" color="primary" title="Ãp dá»¥ng"
      (click)="apply(filter); filterDrawer.close()">
    </sd-button>
  </div>
</sd-side-drawer>
```

### 4. Full-width drawer on tablets
```html
<sd-side-drawer #drawer title="BÃ¡o cÃ¡o" width="100%" drawerClass="sd-report-drawer"></sd-side-drawer>
```

## Anti-patterns
- âŒ Stacking two `<sd-side-drawer>`s open at once â€” both attach to body, the second backdrop will sit on top of the first; UX is confusing
- âŒ Using inside `<sd-modal>` â€” modal already locks scroll; the drawer's scroll lock fights with it
- âŒ Forgetting to provide a `[sdFooter]` action bar for forms â€” users will hunt for the "Save" button (the default close `Ã—` doesn't submit)
- âŒ `disableBackdropClose` without ALSO providing an explicit close path (button) â€” users get stuck
- âŒ Putting heavy content that isn't used â†’ drawer renders content lazily ONLY when `isOpened` (uses `@if (isOpened)`); however, the host component is constructed eagerly, so do still put expensive subscriptions behind explicit `open()` triggers
- âŒ Calling `open()` repeatedly without checking state â€” safe but wasteful (re-locks body overflow)

## Accessibility
- The close button has `aria-label="Close"`
- Backdrop has `aria-hidden="true"` (decorative)
- Background body scroll is locked while open (good â€” prevents scroll-leak)
- No focus-trap is implemented â€” for forms with required focus management, manage focus manually after `open()`

## E2E test attributes

Rendered on the `.sd-side-drawer` root element (which lives at `document.body` via CdkPortal):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-side-drawer-<autoId>` | NEW input `autoId` |
| `data-opened` | `"true"` / `"false"` | `isOpened` signal |
| `data-loading` | `"true"` / `"false"` | `isLoading` signal |

> **BREAKING:** `isOpened` and `isLoading` are now `Signal<boolean>` (read with `drawer.isOpened()` / `drawer.isLoading()`) instead of plain booleans. Update any external consumer that reads them as properties.

## Related
- `<sd-modal>` â€” full-center overlay; use for short forms / confirmations
- `<sd-section>` â€” typical content wrapper inside drawer body
- `<sd-button>` â€” typical content of footer / header-right
- `SdLoadingService` â€” drives the in-drawer loading overlay


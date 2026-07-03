# `<sd-side-drawer>`

**Type**: Component
**Selector**: `sd-side-drawer`
**Import path**: `@sdcorejs/angular/components/side-drawer` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdSideDrawer extends SdBaseSecureComponent`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Right-edge slide-in panel rendered into `document.body` via CDK Portal — used for "create / edit / detail" forms that don't deserve a full route, but need more room than a modal: filters, side-by-side review, multi-step forms.

## When to use
- Quick "Create" / "Edit" forms triggered from a list row or toolbar button
- Detail-view of a record without leaving the current list
- Advanced filter / sort builder panels
- Bulk action confirmation panels with extra fields
- Side-by-side review (drawer on the right, base content on the left)

## When NOT to use
- For destructive confirmations or short forms (1–3 fields) → use `<sd-modal>`
- For full-screen workflows with many steps → use a route + `<sd-tab-router>`
- For inline editing within a list row → use `<sd-section>` + form-on-row
- For toast / alert / notify → use `SdNotifyService`
- For navigation menus → use `<sd-anchor>` and the app shell

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | `''` | Header title. Replaced wholesale if `[sdHeaderLeft]` slot is provided. |
| `width` | `string` | `'480px'` | CSS width of the drawer (e.g. `'640px'`, `'40vw'`, `'100%'`). |
| `hideClose` | `boolean` | `false` | Bare attribute = true. Hides the built-in close button in the header. |
| `disableBackdropClose` | `boolean` | `false` | Bare attribute = true. Clicking the backdrop will NOT close the drawer (force the user to click an explicit action button). |
| `drawerClass` | `any` (string \| string[] \| object) | `''` | Custom CSS classes for the root `.sd-side-drawer` container — bound via `[ngClass]`. |
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
| `isHovered$` | `Observable<boolean>` | Emits `true` on `mouseenter` and `false` on `mouseleave` of the drawer container. Set up lazily after the first render (`afterNextRender`) — do NOT subscribe before `open()` is called at least once. Useful if outer logic needs to detect "is the user still hovering over the drawer". |
| `id` | `string` | Unique `I<uuid>` identifier of the drawer DOM element. Passed to `SdLoadingService` so multiple simultaneous drawers do not clash. |

## Content projection (slots)
| Slot selector | Purpose |
| --- | --- |
| `[sdHeaderLeft]` | Replaces the default `title` text. Use for richer headers (icon + title, breadcrumb, ...). |
| `[sdHeaderRight]` | Header actions left of the close button (typically a "Save" or "Print" `<sd-button>`). |
| (default) | Drawer body content. Lives inside `.sd-side-drawer-content` (scrollable). |
| `[sdFooter]` | Sticky footer at the bottom of the drawer — typical action bar with "Cancel" / "Save". |

## Visual cues (helps agent map screenshots → component)
- Slides in from the **right edge** of the viewport (CSS class `sd-side-drawer-active` toggles transform)
- Width: `width` input (default 480px); height: full viewport
- Backdrop: semi-transparent dark overlay covering the rest of the viewport; clicking it closes (unless `disableBackdropClose`)
- Header: top bar with title on the left, action area on the right ending in a compact 32px rounded close button with a Material `close` icon
- Body: scrollable content area between header and footer
- Footer: separated from the body, holds projected `[sdFooter]` content (typically Cancel + primary CTA)
- Background body scroll is locked while the drawer is open; mouse-wheel and touchmove on the backdrop are blocked via `preventScroll`
- Loading overlay (when `startLoading()` called): covers the drawer body, keyed by the unique `id` (`I<uuid>`) so multiple drawers don't clash

## Examples

### 1. Create form drawer
```html
<sd-button title="Tạo mới" type="fill" color="primary" prefixIcon="add" (click)="drawer.open()"></sd-button>

<sd-side-drawer #drawer title="Tạo nhân viên mới" width="560px" (sdClosed)="resetForm()">
  <form [formGroup]="form">
    <sd-section-item label="Họ và tên"><sd-input formControlName="name"></sd-input></sd-section-item>
    <sd-section-item label="Email"><sd-input formControlName="email"></sd-input></sd-section-item>
  </form>

  <div sdFooter class="d-flex gap-8 justify-content-end">
    <sd-button type="outline" title="Hủy" (click)="drawer.close()"></sd-button>
    <sd-button type="fill" color="primary" title="Lưu" (click)="onSave(drawer)"></sd-button>
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
<sd-side-drawer #detail title="Chi tiết yêu cầu" width="640px" disableBackdropClose>
  <sd-section title="Thông tin chung">
    <sd-section-item label="Mã yêu cầu">{{ selected?.code }}</sd-section-item>
    <sd-section-item label="Người tạo">{{ selected?.creator }}</sd-section-item>
  </sd-section>
</sd-side-drawer>

<sd-button (click)="select(row); detail.open()" type="link" prefixIcon="visibility"></sd-button>
```

### 3. Filter panel with backdrop close
```html
<sd-side-drawer #filterDrawer title="Bộ lọc" width="420px">
  <sd-query-builder [group]="filter"></sd-query-builder>

  <div sdFooter class="d-flex justify-content-between">
    <sd-button type="link" title="Đặt lại" (click)="filter = empty()"></sd-button>
    <sd-button type="fill" color="primary" title="Áp dụng"
      (click)="apply(filter); filterDrawer.close()">
    </sd-button>
  </div>
</sd-side-drawer>
```

### 4. Full-width drawer on tablets
```html
<sd-side-drawer #drawer title="Báo cáo" width="100%" drawerClass="sd-report-drawer"></sd-side-drawer>
```

## Anti-patterns
- ❌ Stacking two `<sd-side-drawer>`s open at once — both attach to body, the second backdrop will sit on top of the first; UX is confusing
- ❌ Using inside `<sd-modal>` — modal already locks scroll; the drawer's scroll lock fights with it
- ❌ Forgetting to provide a `[sdFooter]` action bar for forms — users will hunt for the "Save" button (the default close `×` doesn't submit)
- ❌ `disableBackdropClose` without ALSO providing an explicit close path (button) — users get stuck
- ❌ Putting heavy content that isn't used → drawer renders content lazily ONLY when `isOpened` (uses `@if (isOpened)`); however, the host component is constructed eagerly, so do still put expensive subscriptions behind explicit `open()` triggers
- ❌ Calling `open()` repeatedly without checking state — safe but wasteful (re-locks body overflow)

## Accessibility
- The close button has `aria-label="Close"`
- Backdrop has `aria-hidden="true"` (decorative)
- Background body scroll is locked while open (good — prevents scroll-leak)
- No focus-trap is implemented — for forms with required focus management, manage focus manually after `open()`

## E2E test attributes

Rendered on the `.sd-side-drawer` root element (which lives at `document.body` via CdkPortal):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-side-drawer-<autoId>` | NEW input `autoId` |
| `data-opened` | `"true"` / `"false"` | `isOpened` signal |
| `data-loading` | `"true"` / `"false"` | `isLoading` signal |

> **BREAKING:** `isOpened` and `isLoading` are now `Signal<boolean>` (read with `drawer.isOpened()` / `drawer.isLoading()`) instead of plain booleans. Update any external consumer that reads them as properties.

## Related
- `<sd-modal>` — full-center overlay; use for short forms / confirmations
- `<sd-section>` — typical content wrapper inside drawer body
- `<sd-button>` — typical content of footer / header-right
- `SdLoadingService` — drives the in-drawer loading overlay

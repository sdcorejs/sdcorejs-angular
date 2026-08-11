# `<sd-anchor>`

**Type**: Component (composite — works with `<sd-anchor-item>` children)
**Selector**: `sd-anchor`
**Import path**: `@sdcorejs/angular/components/anchor` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAnchor`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Signal-based scroll-spy navigation (OnPush) — pairs a side TOC with the actual page sections so the active link auto-highlights as the user scrolls.

## When to use
- Long detail pages with multiple sections (employee profile, settings, complex forms)
- Multi-section forms where users need to jump between groups
- Content pages where a sticky TOC improves scannability
- New screens

## When NOT to use
- For app-level routing → use `routerLink` instead
- For tab-style content swapping (only one section visible at a time) → use `<sd-tab>`
- For breadcrumbs → use a dedicated breadcrumb component

## Inputs (`<sd-anchor>`)
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | E2E test hook. Computed prefix `components-anchor-{autoId}`. Each anchor item's clickable element gets `components-anchor-{autoId}-{item.key}` (requires `key` on `<sd-anchor-item>`). |
| `sidebarWidth` | `string` | `'200px'` | Flex-basis của TOC sidebar (cột phải). Content area chiếm flex-1 phần còn lại. Wrapper dùng `gap: 16px` giữa 2 cột — không cần subtract trong calc. |
| `ellipsis` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Truncates long titles in the TOC. |
| `overScroll` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. When false (default), adds `c-stop-scroll-propagation` class to prevent the body from scrolling when the inner panel hits its bounds. |
| `hideNav` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Cờ **ép ẩn thủ công**: `[hideNav]="true"` ẩn TOC ở mọi breakpoint. Không còn đọc UA lúc khởi tạo class. Khi hide, scroll-spy cũng bị disable, content chiếm 100% width. |
| `hideNavOnMobile` | `boolean` | `true` | `transform: booleanAttribute`. Auto-ẩn TOC khi viewport ở breakpoint `mobile` (`< 768px` theo `SD_VIEWPORT_BREAKPOINTS`). Trạng thái mobile lấy từ `SdViewportService` — SSR-safe và tự cập nhật khi resize. Đặt `false` để buộc hiện TOC cả trên mobile. |
| `color` | `Color` (`'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`) | `'primary'` | Màu highlight active nav — apply cho text, icon, vertical bar bên trái. Bind qua CSS var `--anchor-active-color` map sang token global `--sd-{color}`. Import `Color` từ `@sdcorejs/utils/models`. |

## Computed state (`<sd-anchor>`)
| Signal | Type | Description |
| --- | --- | --- |
| `navHidden` | `Signal<boolean>` | Trạng thái ẩn/hiện thực tế của TOC: `hideNav() || (hideNavOnMobile() && viewport.isMobile())`. Template và scroll-spy đều gate trên signal này. Read-only. |

## Outputs (`<sd-anchor>`)
None exposed on the host element.

> Internally `<anchor-nav>` emits `clickSection` which the host listens to and routes to `scrollSectionByClick()`. This is an implementation detail; consumers should never bind to it directly.

## State (`<sd-anchor>`)
| Signal | Type | Initial | Description |
| --- | --- | --- | --- |
| `activeSectionId` | `Signal<string>` | `''` | UUID of the currently visible / active section. Seeded to the first section's id whenever the scroll-spy observer is (re-)registered — immediately after first render, and again when the nav re-appears after a `navHidden()` → visible transition (e.g. a mobile → desktop resize) or when the projected sections change. Seeding only fills in a value that no longer points at a live section, so it never overrides the user's current selection. While `navHidden()` is true the observer is not registered and the signal stays `''`. Otherwise updated automatically by the scroll-spy listener and synchronously on `scrollSectionByClick()`. Read-only from the outside — do not mutate directly. |

## Inputs (`<sd-anchor-item>`)
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | (required) | Visible label in the TOC and used to identify the section. |
| `icon` | `string \| undefined` | `undefined` | Optional Material icon name shown before the title in the TOC. |
| `key` | `string \| undefined` | `undefined` | Stable key for E2E test hooks. Required when parent `<sd-anchor>` has `autoId` set, otherwise the per-item `data-autoId` won't render. |

> `<sd-anchor-item>` auto-generates a UUID as its public `id: string` property on construction — this id is what `activeSectionId` tracks. It is NOT an Angular input and cannot be overridden from the template. The component also removes the native `title` HTML attribute from its host element to prevent browser tooltips from conflicting with the `title` input signal.

## Content projection (slots)
- `<sd-anchor>` projects sections via `<ng-content>` (no named slots).
- Each section MUST be wrapped in an `<sd-anchor-item>`.

## Requirements
> **`<sd-anchor>` bắt buộc phải được bọc trong một thẻ cha có `height` xác định.** Component dùng `overflow-y: auto` và `height: 100%` nên nếu thẻ cha không có chiều cao cụ thể, scroll-spy sẽ không hoạt động và danh sách TOC không cuộn được.

```html
<!-- ✅ Đúng — thẻ cha có height xác định -->
<div style="height: 100vh">
  <sd-anchor>
    <sd-anchor-item title="Phần 1">…</sd-anchor-item>
  </sd-anchor>
</div>

<div style="height: 500px">
  <sd-anchor>
    <sd-anchor-item title="Phần 1">…</sd-anchor-item>
  </sd-anchor>
</div>

<!-- ❌ Sai — thẻ cha không có height, scroll-spy không hoạt động -->
<div>
  <sd-anchor>
    <sd-anchor-item title="Phần 1">…</sd-anchor-item>
  </sd-anchor>
</div>
```

## Internal components (không expose ra ngoài)
- **`<anchor-nav>`** (class `AnchorNav`, folder `components/anchor-nav/`) — TOC sidebar render danh sách items, emit `clickSection` lên parent. Đổi tên từ `SdAnchorVerticalList` / `<sd-anchor-vertical-list>` / `(sdClickSection)` cũ. Internal-only, không export, không dùng từ consumer code.

## Behavior notes
- **Initialisation**: `afterNextRender` fires once after the first browser paint. If `navHidden()` is false at that point, `activeSectionId` is set to the first section's id and the scroll-spy subscription is registered. If `navHidden()` is true, both steps are skipped and `activeSectionId` stays `''`.
- **Breakpoint reactivity**: `navHidden()` derives from `SdViewportService` (signal-based `SD_VIEWPORT` + `SD_VIEWPORT_BREAKPOINTS`), so crossing the mobile breakpoint at runtime registers or disconnects the `IntersectionObserver` without a re-mount. On the server `SD_VIEWPORT` is `null` → treated as desktop → the TOC renders, so client hydration matches.
- **Scroll spy**: The scroll listener uses `auditTime(50)` to throttle DOM reads. For each scroll event it reads each section's `offsetTop` / `offsetHeight` and sets `activeSectionId` to the first section whose range contains the current scroll position (adjusted for `padding-top` and `border-top-width`).
- **Click-to-scroll**: `scrollSectionByClick(id)` immediately sets `activeSectionId` to the target id and calls `wrapperEl.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' })`. The scroll-spy subscription is suspended for the duration of the animated scroll (detected via `auditTime(100) + debounceTime(200) + take(1)`) to prevent active-state flicker. A fallback `setTimeout(100ms)` re-registers the subscription if no scroll event is emitted (e.g. the target is already in view).
- **Active section detection** accounts for the wrapper's `padding-top` and `border-top-width` so sections inside padded containers are highlighted correctly.
- **Auto-cleanup**: `ngOnDestroy` disposes both scroll subscriptions and clears the pending setTimeout, preventing memory leaks when the component is destroyed.

## Visual cues
- **Vertical layout** (current — only supported mode): Two-column flex layout — scrollable content area trên trái (`flex: 1 1 auto`, `min-width: 0`); fixed-width TOC sidebar bên phải (`flex: 0 0 auto`, `flex-basis: sidebarWidth()`). Wrapper `gap: 16px` giữa 2 cột. Horizontal top-bar mode chưa được hỗ trợ.
- **TOC items**: Each row shows an optional leading Material icon and the section title. The active item receives an accent color/highlight to indicate the current scroll position.
- **Ellipsis**: Long titles wrap to multiple lines by default. When `ellipsis` is set, they truncate with `…` at the configured sidebar width.
- **Hidden sidebar (`navHidden()`)**: The TOC column is removed from the DOM (via `@if`) and the content area expands to full width. Scroll-spy is also disabled.
- **Scroll propagation**: By default (`overScroll="false"`), the `c-stop-scroll-propagation` CSS class is applied to the wrapper, trapping scroll within the panel and preventing the page body from scrolling when the panel reaches its bounds.

## Examples

### 1. Default vertical anchor with TOC sidebar
```html
<div style="height: 100vh">
  <sd-anchor sidebarWidth="220px">
    <sd-anchor-item title="Thông tin chung" icon="person">
      <!-- section content -->
    </sd-anchor-item>
    <sd-anchor-item title="Hợp đồng" icon="description">
      <!-- section content -->
    </sd-anchor-item>
    <sd-anchor-item title="Phân quyền" icon="lock">
      <!-- section content -->
    </sd-anchor-item>
  </sd-anchor>
</div>
```

### 2. Ellipsis on long titles
```html
<sd-anchor ellipsis sidebarWidth="180px">
  <sd-anchor-item title="Báo cáo doanh thu theo từng chi nhánh quý 4">…</sd-anchor-item>
  <sd-anchor-item title="Phân tích chi phí vận hành">…</sd-anchor-item>
</sd-anchor>
```

### 3. Allow scroll bleed-through to outer page
```html
<sd-anchor [overScroll]="true">
  <sd-anchor-item title="Phần 1">…</sd-anchor-item>
  <sd-anchor-item title="Phần 2">…</sd-anchor-item>
</sd-anchor>
```

### 4. Đổi màu highlight active nav
```html
<!-- Default: primary -->
<sd-anchor color="success">
  <sd-anchor-item title="Phần 1" icon="check_circle">…</sd-anchor-item>
  <sd-anchor-item title="Phần 2" icon="check_circle">…</sd-anchor-item>
</sd-anchor>

<!-- Các giá trị: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' -->
<sd-anchor color="error">…</sd-anchor>
```

### 5. Điều khiển hiển thị TOC theo breakpoint
```html
<!-- Mặc định: viewport mobile (< 768px) → ẩn TOC; tablet/desktop → hiện -->
<sd-anchor>
  <sd-anchor-item title="Thông tin chung">…</sd-anchor-item>
</sd-anchor>

<!-- Force hiện cả trên mobile -->
<sd-anchor [hideNavOnMobile]="false">
  <sd-anchor-item title="Thông tin chung">…</sd-anchor-item>
</sd-anchor>

<!-- Force ẩn ở mọi breakpoint -->
<sd-anchor [hideNav]="true">
  <sd-anchor-item title="Thông tin chung">…</sd-anchor-item>
</sd-anchor>
```

> **BREAKING (từ bản này):** `[hideNav]="false"` KHÔNG còn là cách ép hiện TOC trên mobile — `false` giờ là default nên component không phân biệt được "không set" và "set false". Dùng `[hideNavOnMobile]="false"`. Ngoài ra tiêu chí "mobile" đổi từ UA detection (`BrowserUtilities.isMobile()`) sang breakpoint chiều rộng viewport, nên desktop thu hẹp cửa sổ dưới 768px giờ cũng ẩn TOC.

## Anti-patterns
- **Not wrapping `<sd-anchor>` in a parent with explicit `height`** — the component uses `height: 100%` + `overflow-y: auto`; without a bounded parent, scroll-spy never fires
- Using `<sd-anchor>` for routing between pages — it only scrolls within the current page
- Putting `<sd-anchor-item>` outside an `<sd-anchor>` host — the parent is required for scroll-spy to work
- Adding `title="…"` as a native HTML attribute (browser tooltip) on `<sd-anchor-item>` — the component already binds via `input.required` and clears the native attribute
- Putting `<sd-anchor-item>` from a different component family inside `<sd-anchor>` — they use different services
- Defaulting `overScroll` on long pages — the default `false` traps scroll inside the panel, which is usually what you want for a TOC
- Trying to set `[id]="'my-id'"` on `<sd-anchor-item>` — `id` is an auto-generated UUID property, not an Angular input; the binding is silently ignored and scroll-spy uses the generated id

## Related
- `<sd-tab>` — when only one section should be visible at a time
- `<sd-page>` — page shell that often hosts an anchor in its main slot
- `<sd-button>` — for jump-to-section CTAs outside the anchor list

# `<sd-anchor>`

**Type**: Component (composite â€” works with `<sd-anchor-item>` children)
**Selector**: `sd-anchor`
**Import path**: `@sdcorejs/angular/components/anchor` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAnchor`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Signal-based scroll-spy navigation (OnPush) â€” pairs a side TOC with the actual page sections so the active link auto-highlights as the user scrolls.

## When to use
- Long detail pages with multiple sections (employee profile, settings, complex forms)
- Multi-section forms where users need to jump between groups
- Content pages where a sticky TOC improves scannability
- New screens

## When NOT to use
- For app-level routing â†’ use `routerLink` instead
- For tab-style content swapping (only one section visible at a time) â†’ use `<sd-tab>`
- For breadcrumbs â†’ use a dedicated breadcrumb component
- When you need a fully custom horizontal TOC bar â€” the `type` input is accepted but the current implementation renders the vertical sidebar layout regardless of its value; a true horizontal mode is not yet implemented

## Inputs (`<sd-anchor>`)
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | E2E test hook. Computed prefix `components-anchor-{autoId}`. Each anchor item's clickable element gets `components-anchor-{autoId}-{item.key}` (requires `key` on `<sd-anchor-item>`). |
| `type` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction. Vertical is the primary mode. |
| `sidebarWidth` | `string` | `'200px'` | CSS width of the right-hand TOC. Content width is computed as `calc(100% - sidebarWidth - 16px)`. |
| `ellipsis` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Truncates long titles in the TOC. |
| `isOverscroll` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. When false (default), adds `c-stop-scroll-propagation` class to prevent the body from scrolling when the inner panel hits its bounds. |
| `isHiddenAnchorList` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Hides the TOC sidebar entirely (and disables scroll-spy registration); content takes full width. |

## Outputs (`<sd-anchor>`)
None exposed on the host element.

> Internally `<sd-anchor-vertical-list>` emits `sdClickSection` which the host listens to and routes to `scrollSectionByClick()`. This is an implementation detail; consumers should never bind to it directly.

## State (`<sd-anchor>`)
| Signal | Type | Initial | Description |
| --- | --- | --- | --- |
| `activeSectionId` | `Signal<string>` | `''` | UUID of the currently visible / active section. Set to the first section's id immediately after first render (unless `isHiddenAnchorList` is true). Updated automatically by the scroll-spy listener and synchronously on `scrollSectionByClick()`. Read-only from the outside â€” do not mutate directly. |

## Inputs (`<sd-anchor-item>`)
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | (required) | Visible label in the TOC and used to identify the section. |
| `icon` | `string \| undefined` | `undefined` | Optional Material icon name shown before the title in the TOC. |
| `key` | `string \| undefined` | `undefined` | Stable key for E2E test hooks. Required when parent `<sd-anchor>` has `autoId` set, otherwise the per-item `data-autoId` won't render. |

> `<sd-anchor-item>` auto-generates a UUID as its public `id: string` property on construction â€” this id is what `activeSectionId` tracks. It is NOT an Angular input and cannot be overridden from the template. The component also removes the native `title` HTML attribute from its host element to prevent browser tooltips from conflicting with the `title` input signal.

## Content projection (slots)
- `<sd-anchor>` projects sections via `<ng-content>` (no named slots).
- Each section MUST be wrapped in an `<sd-anchor-item>`.

## Requirements
> **`<sd-anchor>` báº¯t buá»™c pháº£i Ä‘Æ°á»£c bá»c trong má»™t tháº» cha cÃ³ `height` xÃ¡c Ä‘á»‹nh.** Component dÃ¹ng `overflow-y: auto` vÃ  `height: 100%` nÃªn náº¿u tháº» cha khÃ´ng cÃ³ chiá»u cao cá»¥ thá»ƒ, scroll-spy sáº½ khÃ´ng hoáº¡t Ä‘á»™ng vÃ  danh sÃ¡ch TOC khÃ´ng cuá»™n Ä‘Æ°á»£c.

```html
<!-- âœ… ÄÃºng â€” tháº» cha cÃ³ height xÃ¡c Ä‘á»‹nh -->
<div style="height: 100vh">
  <sd-anchor>
    <sd-anchor-item title="Pháº§n 1">â€¦</sd-anchor-item>
  </sd-anchor>
</div>

<div style="height: 500px">
  <sd-anchor>
    <sd-anchor-item title="Pháº§n 1">â€¦</sd-anchor-item>
  </sd-anchor>
</div>

<!-- âŒ Sai â€” tháº» cha khÃ´ng cÃ³ height, scroll-spy khÃ´ng hoáº¡t Ä‘á»™ng -->
<div>
  <sd-anchor>
    <sd-anchor-item title="Pháº§n 1">â€¦</sd-anchor-item>
  </sd-anchor>
</div>
```

## Behavior notes
- **Initialisation**: `afterNextRender` fires once after the first browser paint. If `isHiddenAnchorList` is false at that point, `activeSectionId` is set to the first section's id and the scroll-spy subscription is registered. If `isHiddenAnchorList` is true, both steps are skipped and `activeSectionId` stays `''`.
- **Scroll spy**: The scroll listener uses `auditTime(50)` to throttle DOM reads. For each scroll event it reads each section's `offsetTop` / `offsetHeight` and sets `activeSectionId` to the first section whose range contains the current scroll position (adjusted for `padding-top` and `border-top-width`).
- **Click-to-scroll**: `scrollSectionByClick(id)` immediately sets `activeSectionId` to the target id and calls `wrapperEl.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' })`. The scroll-spy subscription is suspended for the duration of the animated scroll (detected via `auditTime(100) + debounceTime(200) + take(1)`) to prevent active-state flicker. A fallback `setTimeout(100ms)` re-registers the subscription if no scroll event is emitted (e.g. the target is already in view).
- **Active section detection** accounts for the wrapper's `padding-top` and `border-top-width` so sections inside padded containers are highlighted correctly.
- **Auto-cleanup**: `ngOnDestroy` disposes both scroll subscriptions and clears the pending setTimeout, preventing memory leaks when the component is destroyed.

## Visual cues
- **Vertical layout (default / `type="vertical"`)**: Two-column layout â€” scrollable content area on the left; fixed-width TOC sidebar on the right. The sidebar width is controlled by `sidebarWidth` (default `200px`); content width auto-fills the remainder via `calc(100% - sidebarWidth - 16px)`.
- **`type="horizontal"`**: The input is accepted (no error) but the current template always renders the vertical two-column layout regardless of the value. A dedicated horizontal top-bar mode is not yet implemented.
- **TOC items**: Each row shows an optional leading Material icon and the section title. The active item receives an accent color/highlight to indicate the current scroll position.
- **Ellipsis**: Long titles wrap to multiple lines by default. When `ellipsis` is set, they truncate with `â€¦` at the configured sidebar width.
- **Hidden sidebar (`isHiddenAnchorList`)**: The TOC column is removed from the DOM (via `@if`) and the content area expands to full width. Scroll-spy is also disabled.
- **Scroll propagation**: By default (`isOverscroll="false"`), the `c-stop-scroll-propagation` CSS class is applied to the wrapper, trapping scroll within the panel and preventing the page body from scrolling when the panel reaches its bounds.

## Examples

### 1. Default vertical anchor with TOC sidebar
```html
<div style="height: 100vh">
  <sd-anchor sidebarWidth="220px">
    <sd-anchor-item title="ThÃ´ng tin chung" icon="person">
      <!-- section content -->
    </sd-anchor-item>
    <sd-anchor-item title="Há»£p Ä‘á»“ng" icon="description">
      <!-- section content -->
    </sd-anchor-item>
    <sd-anchor-item title="PhÃ¢n quyá»n" icon="lock">
      <!-- section content -->
    </sd-anchor-item>
  </sd-anchor>
</div>
```

### 2. Ellipsis on long titles
```html
<sd-anchor ellipsis sidebarWidth="180px">
  <sd-anchor-item title="BÃ¡o cÃ¡o doanh thu theo tá»«ng chi nhÃ¡nh quÃ½ 4">â€¦</sd-anchor-item>
  <sd-anchor-item title="PhÃ¢n tÃ­ch chi phÃ­ váº­n hÃ nh">â€¦</sd-anchor-item>
</sd-anchor>
```

### 3. Allow scroll bleed-through to outer page
```html
<sd-anchor [isOverscroll]="true">
  <sd-anchor-item title="Pháº§n 1">â€¦</sd-anchor-item>
  <sd-anchor-item title="Pháº§n 2">â€¦</sd-anchor-item>
</sd-anchor>
```

### 4. Hide TOC conditionally (e.g. for read-only / mobile)
```html
<sd-anchor [isHiddenAnchorList]="isMobile()">
  <sd-anchor-item title="ThÃ´ng tin chung">â€¦</sd-anchor-item>
  <sd-anchor-item title="Lá»‹ch sá»­">â€¦</sd-anchor-item>
</sd-anchor>
```

## Anti-patterns
- **Not wrapping `<sd-anchor>` in a parent with explicit `height`** â€” the component uses `height: 100%` + `overflow-y: auto`; without a bounded parent, scroll-spy never fires
- Using `<sd-anchor>` for routing between pages â€” it only scrolls within the current page
- Putting `<sd-anchor-item>` outside an `<sd-anchor>` host â€” the parent is required for scroll-spy to work
- Adding `title="â€¦"` as a native HTML attribute (browser tooltip) on `<sd-anchor-item>` â€” the component already binds via `input.required` and clears the native attribute
- Putting `<sd-anchor-item>` from a different component family inside `<sd-anchor>` â€” they use different services
- Defaulting `isOverscroll` on long pages â€” the default `false` traps scroll inside the panel, which is usually what you want for a TOC
- Trying to set `[id]="'my-id'"` on `<sd-anchor-item>` â€” `id` is an auto-generated UUID property, not an Angular input; the binding is silently ignored and scroll-spy uses the generated id
- Relying on `type="horizontal"` for a horizontal TOC â€” the input exists but horizontal layout is not yet rendered; the sidebar always appears on the right regardless

## Related
- `<sd-tab>` â€” when only one section should be visible at a time
- `<sd-page>` â€” page shell that often hosts an anchor in its main slot
- `<sd-button>` â€” for jump-to-section CTAs outside the anchor list


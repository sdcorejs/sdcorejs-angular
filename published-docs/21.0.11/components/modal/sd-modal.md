# `<sd-modal>`

**Type**: Component
**Selector**: `sd-modal`
**Import path**: `@sdcorejs/angular/components/modal` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdModal`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Centered dialog (or mobile bottom-sheet) with optional title/header/footer slots, opened imperatively via a template reference and `open()` / `close()` methods.

## When to use
- Confirm a destructive action (delete, cancel approval) with title + footer buttons
- Render a form for create/edit of a single record without leaving the page
- Display details of a row when row navigation is overkill
- Wrap an `<sd-import-excel>` or `<sd-document-builder>` so it sits on top of the current screen
- Mobile-friendly: automatically converts to a bottom-sheet on phone-sized viewports (when `view` is left empty)

## When NOT to use
- For full-page workflows → use a routed `<sd-page>` instead
- For non-blocking inline notifications → use `SdNotifyService` (toasts)
- For side-panel / drawer style UIs → use `<sd-drawer>` (if available) or a fixed-position panel
- For tooltip/hover popovers → use `<sd-quick-action>` or Material tooltip

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | E2E test hook. Computed prefix `components-modal-{autoId}`. The close (X) button automatically gets `components-modal-{autoId}-close`. Footer/body buttons live inside `<ng-content>` — consumer must set their own `[attr.data-autoId]` on those. |
| `title` | `string` | `''` | Optional dialog title. When empty, the entire header row is hidden — use slots only. |
| `color` | `Color` | `'primary'` | Reserved for future header tinting. |
| `width` | `'sx' \| 'sm' \| 'md' \| 'lg' \| string` | `'md'` | Token → `sx`≈20vw, `sm`≈40vw, `lg`≈80vw, `md`≈60vw. Any CSS value (e.g. `'600px'`) passes through. On mobile, the raw value is used. |
| `height` | `string` | `'auto'` | CSS height. Reserved (Material dialog auto-sizes by default). |
| `view` | `'dialog' \| 'bottom-sheet' \| undefined` | `undefined` | `undefined` = auto (dialog on desktop, bottom-sheet on mobile). Force a mode by setting explicitly. |
| `modalClass` | `string \| string[] \| Record<string, boolean>` | `''` | Extra panel CSS class(es) for the underlying Material dialog/bottom-sheet. |
| `lazyLoadContent` | `boolean` | `true` | If `true`, projected content is rendered only after the first `open()` call. Saves work for modals that may never open. |
| `hideClose` | `boolean` | `false` | Hide the top-right close button. Bare attribute = true. |
| `disableBackdropClose` | `boolean` | `true` | If `true`, clicking the backdrop or pressing ESC does NOT close the modal. Default keeps users from losing form input. Bare attribute = true. |

> **Coerce note**: `lazyLoadContent`, `hideClose`, `disableBackdropClose` use `booleanAttribute` — bare attribute presence is treated as `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdClosed` | `void` | Fires once after the dialog (or bottom-sheet) finishes closing, regardless of cause (close button, backdrop, ESC, programmatic `close()`). |

## Public methods
- `open(): void` — opens the modal. No-op if already open.
- `close(): void` — closes the modal (dismisses both dialog and bottom-sheet refs).

These are typically called via a `#modal` template reference: `<sd-modal #modal> ... </sd-modal>` and `modal.open()`.

## Content projection (slots)
| Selector | Where it renders | Notes |
| --- | --- | --- |
| (default) | Body — scrollable, `max-height: 80vh` | Main content, forms, tables, etc. |
| `[sdHeaderLeft]` | Replaces the title cell | Only renders when `title` is non-empty. |
| `[sdHeaderRight]` / `[sdHeader]` | Right side of header, before close icon | For action buttons in the header. |
| `[sdFooterLeft]` | Bottom-left of footer | E.g. secondary action ("Tải lên"). |
| `[sdFooterRight]` / `[sdFooter]` | Bottom-right of footer | E.g. primary confirm + cancel buttons. |

> The header is only rendered when `title` is truthy. To use header slots without a title, pass `title=" "` (a space).

## Visual cues
- A centered rectangular dialog floating over a dimmed backdrop (desktop)
- On mobile (or `view="bottom-sheet"`), the panel slides up from the bottom and pins to the bottom edge
- Top row: title on the left, optional header-right actions, then a compact 32px rounded close button with a Material `close` icon
- Body: scrollable (caps at 80vh), `px-16` horizontal padding
- Footer: left-aligned and right-aligned action groups
- Width tokens map to viewport-relative widths so the modal grows on big screens

## Examples

### 1. Imperative open from a template reference
```html
<sd-button title="Mở chi tiết" type="fill" color="primary" (click)="modal.open()"></sd-button>

<sd-modal #modal title="Chi tiết khách hàng" width="md">
  <p>Thông tin chi tiết của khách hàng...</p>

  <sd-button sdFooterRight title="Đóng" (click)="modal.close()"></sd-button>
</sd-modal>
```

### 2. Confirm dialog with header + footer slots
```html
<sd-modal #confirm title="Xác nhận xóa" width="sm" (sdClosed)="onClosed()">
  <p>Bạn có chắc muốn xóa khách hàng <strong>{{ name }}</strong>?</p>

  <sd-button sdFooterLeft title="Hủy" type="outline" (click)="confirm.close()"></sd-button>
  <sd-button sdFooterRight title="Xóa" type="fill" color="error" (click)="onConfirmDelete()"></sd-button>
</sd-modal>
```

### 3. Force bottom-sheet view on all platforms
```html
<sd-modal #sheet title="Tùy chọn" view="bottom-sheet" width="100%">
  <ul>
    <li (click)="onEdit()">Chỉnh sửa</li>
    <li (click)="onShare()">Chia sẻ</li>
  </ul>
</sd-modal>
```

### 4. Custom header-right action
```html
<sd-modal #m title="Lịch sử thay đổi" width="lg">
  <sd-button sdHeaderRight type="link" prefixIcon="refresh" tooltip="Tải lại" (click)="reload()"></sd-button>

  <sd-history [items]="logs"></sd-history>
</sd-modal>
```

## Accessibility
- Always provide a meaningful `title` (or `[sdHeaderLeft]` slot) so screen readers announce the dialog name
- `disableBackdropClose` defaults to `true` — this prevents accidental data loss for forms; disable only for read-only modals where no input is at risk
- Add a visible "Đóng" / "Cancel" button in the footer so keyboard users can exit without relying on ESC; ESC is suppressed when `disableBackdropClose="true"`
- Do not place focus-trap-breaking elements (e.g. iframes without `tabindex`) inside the modal body — Angular CDK Dialog already manages focus trap automatically
- Avoid very long un-scrollable content; the body region caps at `max-height: 80vh` and is `overflow-auto`, but headings and landmarks inside should be meaningful

## Anti-patterns
- DON'T render `<sd-modal>` only when `*ngIf="open"` — keep it permanently in the template and toggle via `open()` / `close()` so animations and refs work
- DON'T use `[disableBackdropClose]="false"` when the body contains a form — users will lose input on accidental backdrop click
- DON'T nest two `<sd-modal>` for "wizard" flows — replace content inside one modal, or use a routed wizard
- DON'T put long-running async work inside `(sdClosed)` — by then the dialog ref is gone; do work BEFORE calling `close()`
- DON'T omit `title` AND header slots — users lose context for what the dialog is

## Related
- `<sd-import-excel>` — wraps `<sd-modal>` internally for the upload UI
- `<sd-button>` — typical content of the footer slots
- `<sd-history>` — common modal body for audit logs
- `SdNotifyService` — non-blocking toast/snackbar alternative

## E2E test attributes

Because `sd-modal` renders into a MatDialog overlay (mounted at `document.body`), the QA anchor lives on a `<div class="sd-modal-root">` wrapper added inside the template:

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-modal-<autoId>` | input `autoId` |
| `data-opened` | `"true"` while open; `"false"` while closed | `isOpened` signal |

Selector example:

```ts
await page.locator('.sd-modal-root[data-autoid="components-modal-confirm"][data-opened="true"]').waitFor();
```

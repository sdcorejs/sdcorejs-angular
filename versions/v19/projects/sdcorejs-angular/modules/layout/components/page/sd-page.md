# `<sd-page>` · `<sd-page-detail>` · `<sd-page-form>`

Page frame inside the application shell: a header with the title, an optional back link and badges, a scrolling body, an optional subheader, aside column and footer. Use it as the root of every routed screen.

One component, three selectors chosen by purpose. The selector only changes defaults:

| Selector         | Use for                         | `width` default | Main button (`headerRight`) |
| ---------------- | ------------------------------- | --------------- | --------------------------- |
| `sd-page`        | Any other screen, pattern base  | `full`          | Depends on the screen       |
| `sd-page-detail` | Viewing one record              | `wide`          | Cập nhật                    |
| `sd-page-form`   | Creating or updating one record | `medium`        | Huỷ · Lưu                   |

A list screen uses `sd-page-list` (its own component).

## Import

```ts
import { SdPageComponent, sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
```

- **Class:** `SdPageComponent`
- **Selectors:** `sd-page`, `sd-page-detail`, `sd-page-form`
- **Standalone:** yes
- **Change detection:** `OnPush`

## Inputs

| Name          | Type                                                | Default     | Notes                                                                                                                                                                           |
| ------------- | --------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `string`                                            | `''`        | Rendered in an `<h1 class="T20M">` when `[headerLeft]` / `[sdHeaderLeft]` is not projected.                                                                                    |
| `description` | `string`                                            | `''`        | Second line under the title (`T14R text-secondary`).                                                                                                                            |
| `noHeader`    | `boolean`                                           | `false`     | Hides the header and the subheader. Bare attribute = true.                                                                                                                      |
| `backLink`    | `SdPageBackLink \| null \| undefined`               | `undefined` | `string \| readonly unknown[]`: a URL or router commands, as `routerLink`. Shows a ← link before the title. The title, description and badges still come from the inputs.       |
| `badges`      | `readonly SdBadgeData[] \| null \| undefined`       | `undefined` | At most two badges next to the title, see *Badges*.                                                                                                                             |
| `width`       | `SdPageWidth \| null \| undefined`                  | `undefined` | `'full' \| 'wide' \| 'medium' \| 'narrow'`. Unset or `null` uses the default of the selector: `full` for `sd-page`, `wide` for `sd-page-detail`, `medium` for `sd-page-form`. See *Width*. |
| `aside`       | `SdPageAside \| null \| undefined`                  | `undefined` | `'end' \| 'start'`. Unset or `null` means `end`. `start` puts the aside column (or the table of contents) before the body. Below 1200px of viewport the aside always moves under the body. |
| `toc`         | `boolean`                                           | `false`     | Shows a table of contents in the aside column, see *Table of contents*. Bare attribute = true.                                                                                  |

`SdBadgeData` comes from `@sdcorejs/angular/components/badge` (see `sd-badge.md`, "Model").

## Slots

| Selector                            | Where it renders                                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[headerLeft]` / `[sdHeaderLeft]`   | Replaces the whole left part of the header: back link, title, badges and description. Use it only when the inputs are not enough. `backLink` is ignored then (dev-mode warning). |
| `[headerRight]` / `[sdHeaderRight]` | Right part of the header. Put the main action of the page here (Create, Update, Save).                                                                   |
| `[sdSubheader]`                     | Under the header row, inside the header block and outside the scroll area: tabs, a status bar. White, with a 1px top divider.                           |
| (default)                           | The body, inside the only scroll area of the page.                                                                                                       |
| `[sdAside]`                         | A 320px column after the body, sticky while the body scrolls and scrolling on its own. Below 1200px of viewport it moves under the body at full width. |
| `[sdFooterLeft]` / `[sdFooterRight]` | A footer pinned to the bottom, outside the scroll area. Hidden while both slots are empty. Use it for step buttons of a flow; a form page keeps its buttons in the header. |

`sdHeaderLeft` / `sdHeaderRight` are aliases with the same naming as `sd-section` and `sd-side-drawer`. `headerLeft` / `headerRight` keep working.

The subheader, aside and footer slots are projected without a wrapper. A page that uses none of them renders the same header and body DOM as before, plus one empty `<footer>` that stays hidden.

## Layout

```
sd-page (flex column, height 100%)
├─ header .c-page-header (white, shadow)
│   ├─ row: [← backLink] [title + badges / description] ……… [headerRight]
│   └─ [sdSubheader]
├─ .c-page-wrapper (flex 1, overflow-y auto) — the only scroll area
│   ├─ .c-page-content (default slot)
│   └─ [sdAside]
└─ footer .c-page-footer: [sdFooterLeft] ……… [sdFooterRight]
```

### Width

| `width`  | Column                                                      |
| -------- | ----------------------------------------------------------- |
| `full`   | No limit; the feature sets its own padding (as before P0).  |
| `wide`   | At most 1200px, centred, 16px / 24px padding.               |
| `medium` | At most 960px, centred, 16px / 24px padding.                |
| `narrow` | At most 720px, centred, 16px / 24px padding.                |

The limit includes the 24px side padding. The subheader and the footer use the same side padding, so their content lines up with the body. The host gets the class `sd-page--wide`, `sd-page--medium` or `sd-page--narrow`; `full` adds no class.

### Header with a back link and badges

```
[←] 40×40 · 12px · [Title T20M] 8px [badge md] 8px [badge md]
                    [description T14R text-secondary]
```

- The ← is a real link (`routerLink`), so middle-click and "open in a new tab" work. Its accessible name is `core.common.back` ("Quay lại" / "Back"); it shows the Core focus ring.
- With a back link or a badge the title stays on one line and is cut with an ellipsis; badges do not shrink. Without them the title wraps as before.

### Badges

- Rendered with `<sd-badge size="md">`; `type` defaults to `'round'`.
- The first badge is the status (`round`, or `solid` when it needs attention at once). The second is an attribute (`tag` or `pair`).
- A badge without `title` (`null`, `undefined` or `''`) is skipped; `0` is a title.
- In dev mode, more than two badges or two badges of the same `type` (counting the default `'round'`) log a `console.warn`. Production renders them and does not throw.

## `sd-page-detail`

- `width` defaults to `wide` (1200px).
- An `[sdAside]` makes a 320px column at the end; `aside="start"` puts it first. Without `[sdAside]` the page has one column.
- Header: ← back to the list, the title, at most two badges, the description as a meta line, and "Cập nhật" (`type="fill"`) as the main button in `headerRight`.
- Load the record with `detail(id)` in a resolver; tabs (`sd-tab` in `[sdSubheader]`) load their own data when opened.

## `sd-page-form`

- `width` defaults to `medium` (960px).
- The buttons are "Huỷ" (outline) and "Lưu" (fill, primary) in `headerRight`. There is no `actions` input and a form page does not use the footer, so the main button stays in place while the body scrolls.
- `toc` adds a table of contents (below).
- Protect the route with `sdPageFormLeaveGuard` (below).

### Table of contents

With `toc`, the aside column lists every `<sd-section>` of the body that has a `title` and is not inside another `sd-section`. Clicking an entry scrolls the page to that section; the entry of the section at the top of the scroll area is marked current (`aria-current="true"`). The list is a `<nav>` labelled `core.module.layout.page.toc` ("Mục lục"). Below 1200px of viewport the table of contents is hidden. Do not use `toc` together with `[sdAside]`: both would take an aside column.

### Leave guard

```ts
// routes
{ path: ':id/update', component: ProductUpdatePage, canDeactivate: [sdPageFormLeaveGuard] }

// ProductUpdatePage
readonly #unsaved = inject(SdUnsavedChangesService);
readonly #formRef = registerSdUnsavedChangesForm(this.#unsaved, this.form, { id: 'product-form', dirty: 'value' });

async save(): Promise<void> {
  const product = await this.api.update(this.id, this.form.getRawValue());
  this.#formRef.markPristine(); // before navigating, so the guard does not ask
  await this.router.navigate(['..', 'detail'], { relativeTo: this.route });
}
```

- `sdPageFormLeaveGuard` is a `CanDeactivateFn` over `SdUnsavedChangesService`. When a watcher is dirty it asks with the Core confirm dialog (`SdConfirmService`): "Rời trang khi chưa lưu?", "Thay đổi chưa lưu sẽ bị mất.", "Ở lại" / "Rời trang". The watcher's own `message` replaces the default text.
- The guard passes its own adapter for that one prompt, so the app-wide `SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER` (and `sdUnsavedChangesGuard`) keep their behaviour.
- `dirty: 'value'` counts the form as changed only while its value differs from the last saved value: a field typed back to what it was is no change.
- Closing the browser tab while dirty triggers the browser's `beforeunload` prompt (`SdUnsavedChangesService`).

## Accessibility

- The header title is the page's `<h1>`. A page that projects `[headerLeft]` renders its own heading (generic-list, generic-form-host and generic-configuration do).
- The footer is a `role="group"` labelled `core.module.layout.page.actions` ("Thao tác của trang" / "Page actions"); it is hidden from assistive technology while empty.
- No focus trap.

## Theming

| Token                         | Light     | Used for                                   |
| ----------------------------- | --------- | ------------------------------------------ |
| `--sd-page-bg`                | `#f9f9f9` | Page background                            |
| `--sd-page-shadow`            | 10% ink   | Header shadow                              |
| `--sd-page-divider`           | `#eceef2` | Subheader and footer top border            |
| `--sd-page-back-fg`           | `#44474e` | ← icon                                     |
| `--sd-page-back-hover-bg`     | `#eceef2` | ← hover background                         |

## Examples

### Detail with a back link and badges

```html
<sd-page
  [title]="'Đơn hàng ' + order.code"
  description="Tạo lúc 08:30 · Nguyễn An"
  backLink="/orders"
  width="wide"
  [badges]="[{ title: 'Chờ xác nhận', color: 'warning' }, { type: 'pair', label: 'Kênh', title: 'Online', color: 'info' }]">
  <sd-button headerRight title="Cập nhật" type="fill" (click)="update()"></sd-button>
  <sd-section title="Thông tin chung">…</sd-section>
  <div sdAside>Người phụ trách, lịch sử</div>
</sd-page>
```

### Detail with the aside first

```html
<sd-page-detail [title]="'Chi tiết sản phẩm #' + product.code" backLink=".." aside="start">
  <sd-button headerRight title="Cập nhật" type="fill" (click)="update()"></sd-button>
  <sd-section title="Thông tin chung">…</sd-section>
  <div sdAside>Người phụ trách, lịch sử</div>
</sd-page-detail>
```

### Form with a table of contents

```html
<sd-page-form title="Cập nhật sản phẩm" backLink="../detail" toc>
  <div headerRight class="d-flex gap-8">
    <sd-button title="Huỷ" type="outline" (click)="cancel()"></sd-button>
    <sd-button title="Lưu" type="fill" color="primary" [loading]="saving()" (click)="save()"></sd-button>
  </div>
  <sd-section title="Thông tin chung">…</sd-section>
  <sd-section title="Giá">…</sd-section>
</sd-page-form>
```

### Flow with step buttons in the footer

```html
<sd-page title="Nhập dữ liệu" backLink=".." width="narrow">
  <sd-stepper>…</sd-stepper>
  <sd-button sdFooterLeft title="Quay lại" (click)="previous()"></sd-button>
  <sd-button sdFooterRight title="Tiếp tục" type="fill" (click)="next()"></sd-button>
</sd-page>
```

## Related

- `modules/layout/sd-layout.md` — the application shell that hosts the page
- `<sd-section>`, `<sd-side-drawer>` — same `sdHeaderLeft` / `sdHeaderRight` / `sdFooterLeft` / `sdFooterRight` slot names
- `<sd-badge>` — `SdBadgeData`

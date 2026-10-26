# `<sd-page-list>`

List screen with an `sd-table`. It keeps the whole list on one screen: the body fits the viewport, the table takes the space left, and the paginator stays visible and still while rows, page size, loading, empty and error states change. It also hosts the detail as a child route and shrinks secondary areas when the viewport is short.

## Import

```ts
import { SD_PAGE_LIST, SdPageList } from '@sdcorejs/angular/modules/layout';
```

- **Class:** `SdPageList`
- **Selector:** `sd-page-list`
- **Standalone:** yes
- **Change detection:** `OnPush`

## Usage

```html
<sd-page-list title="Đơn hàng" description="Đơn bán lẻ từ mọi kênh." detail="drawer">
  <sd-button headerRight title="Tạo đơn hàng" prefixIcon="add" type="fill" (click)="create()"></sd-button>
  <sd-tab-group sdSubheader>…</sd-tab-group>        <!-- optional, outside the scroll area -->
  <app-order-summary></app-order-summary>           <!-- optional, as tall as its content -->
  <sd-table [option]="option"></sd-table>           <!-- takes the remaining height -->
</sd-page-list>
```

The feature writes no height class, no SCSS and no `h-full` wrapper.

## Inputs

| Name          | Type                                          | Default     | Notes                                                                                                                      |
| ------------- | --------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `string`                                      | `''`        | As `sd-page`.                                                                                                              |
| `description` | `string`                                      | `''`        | As `sd-page`.                                                                                                              |
| `backLink`    | `SdPageBackLink \| null \| undefined`         | `undefined` | As `sd-page`.                                                                                                              |
| `badges`      | `readonly SdBadgeData[] \| null \| undefined` | `undefined` | As `sd-page`.                                                                                                              |
| `width`       | `SdPageWidth \| null \| undefined`            | `undefined` | As `sd-page`; a list stays `full` by default.                                                                              |
| `detail`      | `SdPageListDetail`                            | `'page'`    | `'page' \| 'drawer'`: how the child route opens, see *Detail as a child route*.                                            |
| `autoCompact` | `boolean`                                     | `true`      | Shrinks secondary areas when the viewport is short, see *Short viewport*. Turn off to always show them in full; the body then scrolls when space runs out. |

## Slots

`[headerRight]` / `[sdHeaderRight]`, `[sdSubheader]`, `[sdFooterLeft]` and `[sdFooterRight]` are forwarded to the inner `sd-page`. Everything else is the body. `headerLeft` is not forwarded: use the inputs.

## Height chain (E1)

```
sd-page-list (flex column, height 100%)
└─ sd-page
   ├─ header + [sdSubheader]              not scrolling
   └─ body (.c-page-wrapper, padding 16px) the only scroll area
        └─ column (gap 12px)
           ├─ other content (score card, warning…)   as tall as their content
           └─ main sd-table                          the space left
                └─ data area (scrolls) → selection bar → footer (≥ 48px)
```

- **Main table:** the last `sd-table` that is a direct child of the body. A feature that wraps its table in its own component puts `sdPageListMain` on the wrapper; the `sd-table` must then be a direct child of that wrapper. Only one main.
- **Few rows:** the empty space stays inside the table; the footer does not move. Empty, error and loading states show inside the data area.
- **Selection:** the `selector.actions` bar appears above the footer, inside the table; the data area shrinks and the paginator does not move.
- **Minimum:** the data area keeps room for the table header and 5 one-line rows (36px each). Only when that does not fit does the page body scroll.
- The main table runs in fill mode through `SD_TABLE_LAYOUT` (`@sdcorejs/angular/components/table`); other tables on the page keep their own height.

## Short viewport

`compact()` is `true` while `autoCompact` is on and the viewport is lower than 720px. Then:

- The external filter of the main table starts collapsed. A user who opens it keeps it open until `compact()` changes. `filter.externalFilterCollapsed` on the table option wins over this default.
- Core has no shared score card: read `compact()` from `SD_PAGE_LIST` and switch your summary to one 36px line.

Secondary areas shrink first; only then does the body scroll to keep the 5-row minimum.

## `SD_PAGE_LIST`

```ts
export interface SdPageListContext {
  readonly compact: Signal<boolean>;
  readonly childActive: Signal<boolean>;
  readonly detail: Signal<SdPageListDetail>;
}
```

Injected by the body content and by child routes, for example `readonly list = inject(SD_PAGE_LIST)` in a score card.

## Detail as a child route

```ts
{
  path: 'order',
  component: OrderListPage,
  children: [
    { path: 'create', component: OrderCreatePage },
    { path: ':id/detail', component: OrderDetailPage },
    { path: ':id/update', component: OrderUpdatePage },
  ],
}
```

- `sd-page-list` renders the `<router-outlet>`; the feature does not.
- `detail="page"`: while a child route is open the list is hidden (not destroyed) and the child page takes the whole height. Coming back (browser Back or `backLink`) shows the list with its filters, page, selection and the scroll position of the data area as they were, and focus returns to the element that opened the child.
- `detail="drawer"`: the list stays on screen. The child component opens an `sd-side-drawer` (width per E9) and navigates back to the list on `sdClosed` — `router.navigate(['../..'], { relativeTo: route })` from an `:id/detail` route, because relative navigation climbs one URL segment per `..`; X, Esc, the backdrop and browser Back all close it, and focus returns to the cell that opened it. Refresh the list after a successful save.
- A split view (list and detail side by side) is a pattern: `sd-page-list` with `sd-splitter` in the body and the router outlet in the right panel.

## Live demo

`/demo/page-list` shows the list with its parts switched by `?cfg=` (tabs, score card, quick search, external filter, selection, record count, page size, loading/error, `autoCompact`, `detail`). The Playwright suite `showcase/e2e/page-list.e2e.ts` measures the height chain on it at 1440×960, 1440×800, 1280×768 and 1440×650.

## Related

- `modules/layout/components/page/sd-page.md` — the frame inside
- `components/table/sd-table.md` — `SD_TABLE_LAYOUT`, `filter.externalFilterCollapsed`

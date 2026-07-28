# `<sd-org-chart>`

**Type**: Component
**Selector**: `sd-org-chart`
**Import path**: `@sdcorejs/angular/components/org-chart` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdOrgChart`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Hiển thị dữ liệu phân cấp dạng organization chart: mỗi node là một người/nhóm/phòng ban, nối bằng đường cây ngang-dọc, có thể thu gọn/mở rộng và custom template cho từng item.

## When to use

- Sơ đồ tổ chức công ty, phòng ban, đội nhóm.
- Cây phân cấp quản trị: đơn vị, chi nhánh, nhóm quyền, tuyến báo cáo.
- Cần render card mặc định nhanh với `image`, `title`, `description`, `color`.
- Cần thay toàn bộ nội dung node bằng template riêng nhưng vẫn giữ layout tree + connector.

## When NOT to use

- Dữ liệu rất lớn cần virtual scroll hoặc pan/zoom chuyên dụng.
- Cây cần drag-drop, chỉnh sửa inline, hoặc layout ngang nhiều hướng.
- Quan hệ dạng graph nhiều cha/nhiều cạnh. Component này là tree: mỗi item có một parent trực tiếp.

## Inputs
New usage should bind only `[option]`, like `sd-table`. Put `autoId`, `items`, `itemTemplate`, `collapsible`, and `onToggle` inside `SdOrgChartOption`. The split inputs below remain as a migration bridge.

```html
<sd-org-chart [option]="orgChartOption"></sd-org-chart>
```

| Name           | Type                                                      | Default     | Notes                                                                                                       |
| -------------- | --------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `option`       | `SdOrgChartOption`                                       | `undefined` | Main option object for new usage.                                                                           |
| `items`        | `SdOrgChartItem[]`                                        | required    | Root nodes. Mỗi item có `id`, `title`, optional `image`, `description`, `color`, `children`, `expanded`.    |
| `itemTemplate` | `TemplateRef<SdOrgChartItemContext> \| null \| undefined` | `undefined` | TemplateRef input để custom toàn bộ node. Bị override bởi projected `sdOrgChartItemDef` nếu cả hai cùng có. |
| `collapsible`  | `boolean`                                                 | `true`      | Cho phép click nút chevron để ẩn/hiện children. Nếu `false`, mọi node có children luôn mở.                  |
| `autoId`       | `string \| undefined \| null`                             | `undefined` | Host emits `data-autoid="components-org-chart-<autoId>"`; child node parts emit stable ids too.             |

## Model

```ts
export interface SdOrgChartItem {
  id: string | number;
  image?: string | null;
  title: string;
  description?: string | null;
  color?: string | null;
  expanded?: boolean;
  children?: SdOrgChartItem[];
}
```

`color` được áp dụng vào CSS variable `--sd-org-node-color` của card. Bỏ trống `color` thì card nền trắng viền nhẹ; truyền màu pastel để ra layout giống ví dụ colored.

## Custom item template

### Directive projection

```html
<sd-org-chart [items]="items">
  <ng-template sdOrgChartItemDef let-item let-depth="depth" let-toggle="toggle">
    <button type="button" class="employee-card" (click)="toggle()">
      <img [src]="item.image" [alt]="item.title" />
      <strong>{{ item.title }}</strong>
      <span>{{ item.description }}</span>
      <small>Level {{ depth }}</small>
    </button>
  </ng-template>
</sd-org-chart>
```

### TemplateRef input

```html
<ng-template #node let-item let-hasChildren="hasChildren">
  <div class="node">
    {{ item.title }} @if (hasChildren) {
    <span>manager</span>
    }
  </div>
</ng-template>

<sd-org-chart [items]="items" [itemTemplate]="node"></sd-org-chart>
```

## Template context

| Name                 | Type                     | Notes                                            |
| -------------------- | ------------------------ | ------------------------------------------------ |
| `$implicit` / `item` | `SdOrgChartItem`         | Current node.                                    |
| `depth`              | `number`                 | Root = `0`.                                      |
| `parent`             | `SdOrgChartItem \| null` | Parent node, `null` at root.                     |
| `expanded`           | `boolean`                | Current expanded state after internal override.  |
| `hasChildren`        | `boolean`                | Whether `children` has at least one item.        |
| `isLeaf`             | `boolean`                | `!hasChildren`.                                  |
| `toggle`             | `() => void`             | Toggle current node if `collapsible` is enabled. |

## AutoId scheme

When `autoId="team"` is provided, the component emits:

| Element             | `data-autoid` pattern                        |
| ------------------- | -------------------------------------------- |
| Host                | `components-org-chart-team`                  |
| Node card           | `components-org-chart-team-node-<item.id>`   |
| Default image       | `components-org-chart-team-image-<item.id>`  |
| Default title       | `components-org-chart-team-title-<item.id>`  |
| Default description | `components-org-chart-team-description-<id>` |
| Toggle button       | `components-org-chart-team-toggle-<item.id>` |

`item.id` is sanitized for selector safety: characters outside `a-z`, `A-Z`, `0-9`, `_`, `-` become `-`.

With `sdOrgChartItemDef` or `[itemTemplate]`, the wrapper node card still receives `...-node-<id>`. Add your own `data-autoid` inside the custom template when QA needs more granular selectors.

## Examples

### Basic

```html
<sd-org-chart [items]="orgItems"></sd-org-chart>
```

```ts
const orgItems: SdOrgChartItem[] = [
  {
    id: 'ceo',
    image: '/assets/people/amy.png',
    title: 'Amy Elsner',
    description: 'CEO',
    children: [
      { id: 'cmo', title: 'Anna Fali', description: 'CMO' },
      { id: 'cto', title: 'Stephen Shaw', description: 'CTO' },
    ],
  },
];
```

### Colored cards

```ts
const orgItems: SdOrgChartItem[] = [
  {
    id: 'ceo',
    title: 'Amy Elsner',
    description: 'CEO',
    color: '#dfe6ff',
    children: [
      { id: 'sales', title: 'Sales', color: '#f1e2ff' },
      { id: 'dev', title: 'Development', color: '#c6f4eb' },
    ],
  },
];
```

## Visual cues

- Card radius `6px`, connector lines neutral `#d9e2ef`.
- Node có `image` render avatar tròn `44px`.
- Node không có `image` + không có `description` dùng compact card, hợp với leaf như `Sales`, `Marketing`.
- Chevron button nằm giữa card và connector, chỉ render khi node có children và `collapsible=true`.

## Anti-patterns

- Dùng index làm `id`; collapse state bám theo `id`, nên `id` phải ổn định.
- Trộn graph nhiều parent vào `children`; component không resolve cạnh graph.
- Custom template quá rộng mà không tự giới hạn text; card custom nên tự set `max-width` / `overflow-wrap`.

## Related

- `<sd-table>` tree mode: dùng khi dữ liệu phân cấp cần cột, sort, filter, paging.
- `<sd-avatar>`: dùng riêng cho avatar người dùng nếu không cần layout org chart.

# `<sd-org-chart>`

**Type**: Component
**Selector**: `sd-org-chart`
**Import path**: `@sdcorejs/angular/components/org-chart` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdOrgChart`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Hiá»ƒn thá»‹ dá»¯ liá»‡u phÃ¢n cáº¥p dáº¡ng organization chart: má»—i node lÃ  má»™t ngÆ°á»i/nhÃ³m/phÃ²ng ban, ná»‘i báº±ng Ä‘Æ°á»ng cÃ¢y ngang-dá»c, cÃ³ thá»ƒ thu gá»n/má»Ÿ rá»™ng vÃ  custom template cho tá»«ng item.

## When to use

- SÆ¡ Ä‘á»“ tá»• chá»©c cÃ´ng ty, phÃ²ng ban, Ä‘á»™i nhÃ³m.
- CÃ¢y phÃ¢n cáº¥p quáº£n trá»‹: Ä‘Æ¡n vá»‹, chi nhÃ¡nh, nhÃ³m quyá»n, tuyáº¿n bÃ¡o cÃ¡o.
- Cáº§n render card máº·c Ä‘á»‹nh nhanh vá»›i `image`, `title`, `description`, `color`.
- Cáº§n thay toÃ n bá»™ ná»™i dung node báº±ng template riÃªng nhÆ°ng váº«n giá»¯ layout tree + connector.

## When NOT to use

- Dá»¯ liá»‡u ráº¥t lá»›n cáº§n virtual scroll hoáº·c pan/zoom chuyÃªn dá»¥ng.
- CÃ¢y cáº§n drag-drop, chá»‰nh sá»­a inline, hoáº·c layout ngang nhiá»u hÆ°á»›ng.
- Quan há»‡ dáº¡ng graph nhiá»u cha/nhiá»u cáº¡nh. Component nÃ y lÃ  tree: má»—i item cÃ³ má»™t parent trá»±c tiáº¿p.

## Inputs
New usage should bind only `[option]`, like `sd-table`. Put `autoId`, `items`, `itemTemplate`, `collapsible`, and `onToggle` inside `SdOrgChartOption`. The split inputs below remain as a migration bridge.

```html
<sd-org-chart [option]="orgChartOption"></sd-org-chart>
```

| Name           | Type                                                      | Default     | Notes                                                                                                       |
| -------------- | --------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `option`       | `SdOrgChartOption`                                       | `undefined` | Main option object for new usage.                                                                           |
| `items`        | `SdOrgChartItem[]`                                        | required    | Root nodes. Má»—i item cÃ³ `id`, `title`, optional `image`, `description`, `color`, `children`, `expanded`.    |
| `itemTemplate` | `TemplateRef<SdOrgChartItemContext> \| null \| undefined` | `undefined` | TemplateRef input Ä‘á»ƒ custom toÃ n bá»™ node. Bá»‹ override bá»Ÿi projected `sdOrgChartItemDef` náº¿u cáº£ hai cÃ¹ng cÃ³. |
| `collapsible`  | `boolean`                                                 | `true`      | Cho phÃ©p click nÃºt chevron Ä‘á»ƒ áº©n/hiá»‡n children. Náº¿u `false`, má»i node cÃ³ children luÃ´n má»Ÿ.                  |
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

`color` Ä‘Æ°á»£c Ã¡p dá»¥ng vÃ o CSS variable `--sd-org-node-color` cá»§a card. Bá» trá»‘ng `color` thÃ¬ card ná»n tráº¯ng viá»n nháº¹; truyá»n mÃ u pastel Ä‘á»ƒ ra layout giá»‘ng vÃ­ dá»¥ colored.

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
- Node cÃ³ `image` render avatar trÃ²n `44px`.
- Node khÃ´ng cÃ³ `image` + khÃ´ng cÃ³ `description` dÃ¹ng compact card, há»£p vá»›i leaf nhÆ° `Sales`, `Marketing`.
- Chevron button náº±m giá»¯a card vÃ  connector, chá»‰ render khi node cÃ³ children vÃ  `collapsible=true`.

## Anti-patterns

- DÃ¹ng index lÃ m `id`; collapse state bÃ¡m theo `id`, nÃªn `id` pháº£i á»•n Ä‘á»‹nh.
- Trá»™n graph nhiá»u parent vÃ o `children`; component khÃ´ng resolve cáº¡nh graph.
- Custom template quÃ¡ rá»™ng mÃ  khÃ´ng tá»± giá»›i háº¡n text; card custom nÃªn tá»± set `max-width` / `overflow-wrap`.

## Related

- `<sd-table>` tree mode: dÃ¹ng khi dá»¯ liá»‡u phÃ¢n cáº¥p cáº§n cá»™t, sort, filter, paging.
- `<sd-avatar>`: dÃ¹ng riÃªng cho avatar ngÆ°á»i dÃ¹ng náº¿u khÃ´ng cáº§n layout org chart.

# `<sd-tree>`

**Type**: Component
**Selector**: `sd-tree`
**Import path**: `@sdcorejs/angular/components/tree`
**Class**: `SdTree`
**Standalone**: yes

## Purpose

Standalone hierarchical tree for folders, categories, organization units, or parent-child data. Supports static/lazy loading, loading state, multi-selection, row commands, custom item templates, manual reload, and Vietnamese accent-insensitive filtering.

## Main Option API

New usage should bind only `[option]`, following the same style as `sd-table`.

```html
<sd-tree [option]="option"></sd-tree>
```

```ts
interface Category {
  id: string;
  name: string;
  locked?: boolean;
}

const items: SdTreeItemStatic<Category>[] = [
  {
    id: 'finance',
    label: 'Finance',
    data: { id: 'finance', name: 'Finance' },
    children: [
      { id: 'payable', label: 'Payable', icon: 'description', data: { id: 'payable', name: 'Payable' } },
    ],
  },
];

const option: SdTreeComponentOption<Category> = {
  autoId: 'category',
  items,
  tree: {
    loadType: 'static',
    defaultExpanded: 1,
  },
  selectedItems,
  selector: {
    visible: true,
    message: items => `Đã chọn ${items.length} mục`,
    actions: [{ icon: 'archive', title: 'Lưu trữ', click: items => archive(items) }],
  },
  commands: [
    { key: 'edit', title: 'Sửa', icon: 'edit', click: item => edit(item) },
  ],
  onSelectedItemsChange: items => selectedItems = items,
  onSelect: event => onSelect(event),
  onExpand: event => onExpand(event),
  onCollapse: event => onCollapse(event),
};
```

Legacy split inputs (`items`, `tree`, `selectedItems`, `selector`, `commands`, `selectable`, `itemTemplate`, `autoId`) are still accepted as a migration bridge, but new examples should use only `[option]`.

## Option Shape

| Key | Type | Notes |
| --- | --- | --- |
| `autoId` | `string \| null` | Stable `data-autoid` prefix. |
| `items` | `SdTreeDataSource<SdTreeItemStatic<T>>` or `SdTreeDataSource<SdTreeItemLazy<T>>` | Root items as an array, signal, sync loader, or async loader. Item shape follows `tree.loadType`. |
| `tree` | `SdTreeOption<T>` | Static/lazy config. Defaults to static. |
| `selectedItems` | `T[] \| null` | Controlled selected raw data items. |
| `selector` | `SdTreeSelectorOption<T> \| null` | Checkbox/quick-action config. Checkbox renders only when `selector.visible === true`. |
| `commands` | `SdTreeCommand<T>[] \| null` | Trailing row menu commands. |
| `itemTemplate` | `TemplateRef<SdTreeItemContext<T>> \| null` | Custom item template; projected `sdTreeItemDef` wins. |
| `selectable` | `boolean` | Back-compat selection switch. Prefer `selector.visible`. |
| `onSelectedItemsChange` | `(items: T[]) => void` | Selection callback. |
| `onSelect` | `(event: SdTreeSelectionEvent<T>) => void` | Row selection callback. |
| `onExpand` | `(event: SdTreeToggleEvent<T>) => void` | Expand callback. |
| `onCollapse` | `(event: SdTreeToggleEvent<T>) => void` | Collapse callback. |

## Tree Item

`sd-tree` receives wrapped items so the tree has stable metadata and callbacks still work with raw consumer data. The item shape depends on `tree.loadType`.

```ts
interface SdTreeItemBase<T> {
  id: string;
  label: string;
  icon?: string | null;
  data: T;
  expanded?: boolean;
}

interface SdTreeItemStatic<T> extends SdTreeItemBase<T> {
  children?: SdTreeItemStatic<T>[];
}

interface SdTreeItemLazy<T> extends SdTreeItemBase<T> {
  hasChildren?: boolean;
}
```

Branch nodes without `icon` render the default `folder` / `folder_open` icons. Leaf nodes without `icon` render no icon. Use `icon` on any node when you want an explicit icon; there is no separate `leafIcon`.

Static mode uses `children`. Lazy mode uses `hasChildren` before loading and keeps loaded children in the component cache.

## Static Tree

```ts
const option: SdTreeComponentOption<Category> = {
  items,
  tree: { loadType: 'static', defaultExpanded: true },
};
```

Static children are read from `SdTreeItemStatic.children`.

## Lazy Tree

```ts
const option: SdTreeComponentOption<Category> = {
  items: [{ id: 'root', label: 'Root', data: root, hasChildren: true }],
  tree: {
    loadType: 'lazy',
    onExpandChildren: item => categoryApi.children(item.id),
  },
};
```

Lazy children are loaded on first expand and cached internally. Lazy items do not have a `children` field; the loader must return `SdTreeItemLazy<T>[]`.

## Data Source And Reload

`items` can be:

```ts
SdTreeItemStatic<T>[] | SdTreeItemLazy<T>[]
Signal<SdTreeItemStatic<T>[] | SdTreeItemLazy<T>[]>
() => SdTreeItemStatic<T>[] | SdTreeItemLazy<T>[]
() => Promise<SdTreeItemStatic<T>[] | SdTreeItemLazy<T>[]>
```

Use the public method to rerun loader sources:

```ts
tree.reload();
```

Signals update the tree reactively when their value changes.

## Commands

Commands render at the end of each row. The `more_vert` trigger only appears on row hover when at least one command is visible. Command text is kept separate from the label column, so two-line labels do not overlap the trigger.

Command menu icons default to `fontSet: 'material-icons-outlined'` and `color: 'secondary'`. Override `fontSet` or `color` per command when needed.

## Custom Item Template

```html
<sd-tree [option]="option">
  <ng-template sdTreeItemDef let-item let-treeItem="treeItem" let-level="level" let-toggle="toggle" let-selected="selected">
    <button type="button" (click)="toggle()">
      {{ level + 1 }}. {{ item.name }}
    </button>
  </ng-template>
</sd-tree>
```

Custom templates can grow row height; the tree row stretches instead of clipping taller item content.

## Public Methods

```ts
tree.filter(searchText);
tree.reload();
```

Filtering searches loaded items only. Text is normalized to Vietnamese without accents, so `ke toan` matches labels with Vietnamese accents.

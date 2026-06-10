# User Guide - `<sd-tree>`

## Import

```ts
import { SdTree, SdTreeComponentOption, SdTreeItemDefDirective, SdTreeItemLazy, SdTreeItemStatic } from '@sdcorejs/angular/components/tree';
```

## Basic Usage

Use one `[option]` input. Put items, static/lazy tree config, selection, commands, and callbacks in that object.

```html
<sd-tree [option]="option"></sd-tree>
```

```ts
interface Category {
  id: string;
  title: string;
}

const items: SdTreeItemStatic<Category>[] = [
  {
    id: 'finance',
    label: 'Phòng Kế toán',
    data: { id: 'finance', title: 'Phòng Kế toán' },
    children: [
      { id: 'payable', label: 'Công nợ phải trả', data: { id: 'payable', title: 'Công nợ phải trả' } },
    ],
  },
];

const option: SdTreeComponentOption<Category> = {
  autoId: 'category',
  items,
  tree: { loadType: 'static', defaultExpanded: 1 },
};
```

`SdTreeItemStatic` gives static trees stable metadata (`id`, `label`, optional `icon`, `children`) while events and commands still receive raw `data`.

Lazy trees use `SdTreeItemLazy` instead. Lazy items do not have `children`; they use `hasChildren` before the node is expanded.

## Lazy

```ts
const option: SdTreeComponentOption<Category> = {
  items: [{ id: 'root', label: 'Root', data: root, hasChildren: true }],
  tree: {
    loadType: 'lazy',
    onExpandChildren: item => api.children(item.id),
  },
  onExpand: event => console.log(event.item),
  onCollapse: event => console.log(event.item),
};
```

Lazy loaders return `SdTreeItemLazy<T>[]`. Loaded children are cached inside the component, not written to `treeItem.children`.

## Selection And Quick Action

```ts
const option: SdTreeComponentOption<Category> = {
  items,
  tree: { loadType: 'static' },
  selectedItems,
  selector: {
    visible: true,
    message: items => `Đã chọn ${items.length} mục`,
    actions: [{ icon: 'archive', title: 'Lưu trữ', click: items => archive(items) }],
  },
  onSelectedItemsChange: items => selectedItems = items,
  onSelect: event => onSelect(event),
};
```

Checkboxes are hidden unless `selector.visible === true`. Selecting rows opens the same quick-action pattern used by `sd-table`.

## Commands

```ts
const option: SdTreeComponentOption<Category> = {
  items,
  tree: { loadType: 'static' },
  commands: [
    { key: 'edit', title: 'Sửa', icon: 'edit', click: item => edit(item) },
    { key: 'delete', title: 'Xóa', icon: 'delete', disabled: item => item.locked, click: item => remove(item) },
  ],
};
```

Menu icons default to outline material icons and secondary color. Override `fontSet` or `color` per command if needed.

## Custom Item

```html
<sd-tree [option]="option">
  <ng-template sdTreeItemDef let-item let-treeItem="treeItem" let-level="level" let-toggle="toggle">
    <button type="button" (click)="toggle()">{{ level + 1 }} - {{ item.title }}</button>
  </ng-template>
</sd-tree>
```

## Data Source And Reload

`option.items` accepts an array, a signal, a sync loader, or an async loader:

```ts
items: SdTreeItemStatic<Category>[] // static
items: SdTreeItemLazy<Category>[] // lazy
items: Signal<SdTreeItemStatic<Category>[]> // static
items: Signal<SdTreeItemLazy<Category>[]> // lazy
items: () => SdTreeItemStatic<Category>[] | Promise<SdTreeItemStatic<Category>[]>
items: () => SdTreeItemLazy<Category>[] | Promise<SdTreeItemLazy<Category>[]>
```

Call `tree.reload()` to rerun loader sources manually.

## Filter

```ts
tree.filter('ke toan');
```

The filter is accent-insensitive for Vietnamese text and searches only loaded items.

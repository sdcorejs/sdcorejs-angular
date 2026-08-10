# `<sd-tree>`

**Type**: Component
**Selector**: `sd-tree`
**Import path**: `@sdcorejs/angular/components/tree`
**Class**: `SdTree`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Standalone hierarchical tree for folders, categories, organization units, or parent-child data. Supports static/lazy loading, race-safe loading and retry, keyboard navigation, single/multi/cascade selection, row commands, custom item templates, manual reload, and Vietnamese accent-insensitive filtering.

## When to use

- Hierarchical pickers or explorers: folders, categories, product groups, org units, permissions.
- Static trees where all nodes are already loaded and can be expanded/filter-searched client-side.
- Lazy trees where expanding a branch calls an API for children.
- Trees with checkbox selection and bulk actions.
- Trees with row commands such as edit, delete, view detail, or custom item templates.

## When NOT to use

- Flat tabular data → use `<sd-table>`.
- A small nested display with no expand/select/command behavior → plain nested markup is lighter.
- Tree rows that must be edited like spreadsheet cells → use a dedicated grid/tree-grid pattern.
- Route navigation menus → use `<sd-anchor>` / app shell navigation, not a data tree.
- Parent-detail rows inside a table → use `<sd-table>` tree or expand options instead.

## Inputs

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
    children: [{ id: 'payable', label: 'Payable', icon: 'description', data: { id: 'payable', name: 'Payable' } }],
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
  commands: [{ key: 'edit', title: 'Sửa', icon: 'edit', click: item => edit(item) }],
  onSelectedItemsChange: items => (selectedItems = items),
  onSelect: event => onSelect(event),
  onExpand: event => onExpand(event),
  onCollapse: event => onCollapse(event),
};
```

Legacy split inputs (`items`, `tree`, `selectedItems`, `selector`, `commands`, `selectable`, `itemTemplate`, `autoId`) are still accepted as a migration bridge, but new examples should use only `[option]`.

| Name            | Type                                        | Default                  | Notes                                                              |
| --------------- | ------------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `option`        | `SdTreeComponentOption<T>`                  | `undefined`              | Main option object for new usage.                                  |
| `autoId`        | `string \| null \| undefined`               | `undefined`              | Migration bridge. Prefer `option.autoId`.                          |
| `items`         | `SdTreeDataSource<SdTreeItem<T>>`           | `[]`                     | Migration bridge. Prefer `option.items`.                           |
| `tree`          | `SdTreeOption<T>`                           | `{ loadType: 'static' }` | Migration bridge. Prefer `option.tree`.                            |
| `selectedItems` | `T[] \| null \| undefined`                  | `undefined`              | Controlled selected raw data items. Prefer `option.selectedItems`. |
| `selector`      | `SdTreeSelectorOption<T> \| null`           | `undefined`              | Checkbox/action config. Prefer `option.selector`.                  |
| `commands`      | `SdTreeCommand<T>[] \| null`                | `[]`                     | Row command menu config. Prefer `option.commands`.                 |
| `selectable`    | `boolean`                                   | `true`                   | Back-compat selection switch. Prefer `selector.visible`.           |
| `itemTemplate`  | `TemplateRef<SdTreeItemContext<T>> \| null` | `undefined`              | Custom item template. Projected `sdTreeItemDef` wins.              |

## Outputs

| Name                  | Type                      | Notes                                                                                |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `selectedItemsChange` | `T[]`                     | Emits when selection changes. Also calls `option.onSelectedItemsChange`.             |
| `selectChange`        | `SdTreeSelectionEvent<T>` | Emits when a row is selected/unselected. Also calls `option.onSelect`.               |
| `expandChange`        | `SdTreeToggleEvent<T>`    | Emits when a branch expands. Also calls `option.onExpand`.                           |
| `collapseChange`      | `SdTreeToggleEvent<T>`    | Emits when a branch collapses. Also calls `option.onCollapse`.                       |
| `loadError`           | `SdTreeLoadErrorEvent<T>` | Emits `{ error }` for a root failure or `{ item, error }` for a lazy branch failure. |

## Option Shape

| Key                     | Type                                                                             | Notes                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `autoId`                | `string \| null`                                                                 | Stable `data-autoid` prefix.                                                                      |
| `items`                 | `SdTreeDataSource<SdTreeItemStatic<T>>` or `SdTreeDataSource<SdTreeItemLazy<T>>` | Root items as an array, signal, sync loader, or async loader. Item shape follows `tree.loadType`. |
| `tree`                  | `SdTreeOption<T>`                                                                | Static/lazy config. Defaults to static.                                                           |
| `selectedItems`         | `T[] \| null`                                                                    | Controlled selected raw data items.                                                               |
| `selector`              | `SdTreeSelectorOption<T> \| null`                                                | Checkbox/quick-action config. Checkbox renders only when `selector.visible === true`.             |
| `commands`              | `SdTreeCommand<T>[] \| null`                                                     | Trailing row menu commands.                                                                       |
| `itemTemplate`          | `TemplateRef<SdTreeItemContext<T>> \| null`                                      | Custom item template; projected `sdTreeItemDef` wins.                                             |
| `selectable`            | `boolean`                                                                        | Back-compat selection switch. Prefer `selector.visible`.                                          |
| `onSelectedItemsChange` | `(items: T[]) => void`                                                           | Selection callback.                                                                               |
| `onSelect`              | `(event: SdTreeSelectionEvent<T>) => void`                                       | Row selection callback.                                                                           |
| `onExpand`              | `(event: SdTreeToggleEvent<T>) => void`                                          | Expand callback.                                                                                  |
| `onCollapse`            | `(event: SdTreeToggleEvent<T>) => void`                                          | Collapse callback.                                                                                |

`selector.single` limits selection to one loaded node. `selector.cascade` accepts `independent` (default) or `descendants`. Descendant cascade selects loaded descendants and reconciles loaded ancestors; a partially selected branch exposes an indeterminate checkbox and `aria-checked="mixed"`.

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

## Tree Option

`option.tree` is a discriminated union on `loadType`. Both branches share `SdTreeBaseOption`:

| Key          | Type     | Default     | Notes                                                                          |
| ------------ | -------- | ----------- | ------------------------------------------------------------------------------ |
| `loadType`   | `'static' \| 'lazy'` | required | Selects the branch below.                                          |
| `maxDepth`   | `number` | `undefined` | Deepest rendered `level` (0-based). See "Depth limit".                         |
| `indentSize` | `number` | `20`        | Pixels of indentation per level.                                               |

| Key               | Type                  | Applies to | Notes                                                              |
| ----------------- | --------------------- | ---------- | ------------------------------------------------------------------ |
| `defaultExpanded` | `boolean \| number`   | `static`   | `true` all, `false` none, or a number = expand levels `< number`.  |
| `onExpandChildren`| `(item) => children`  | `lazy`     | Called once per node on first expand. Required for `loadType: 'lazy'`. |

### Depth limit (`maxDepth`)

```ts
const option: SdTreeComponentOption<Category> = {
  items,
  tree: { loadType: 'static', defaultExpanded: true, maxDepth: 1 },
};
```

`maxDepth` is the deepest **0-based** `level` the tree renders. With `maxDepth: 1` the tree renders root nodes (level 0) and their children (level 1); anything deeper is dropped.

A node sitting **at** `maxDepth` is rendered as a **leaf**, even when its data has children:

- `node.hasChildren` is `false` and `node.children` is empty.
- The toggle is disabled, the chevron is not drawn, and no default folder icon is used (an explicit `treeItem.icon` still renders).
- `aria-expanded` is omitted.
- `toggle()` is a no-op, so neither `expandChange` nor `collapseChange` fires, and a lazy tree never calls `onExpandChildren` for that node.

Omit `maxDepth` (the default) to render the full depth of the data.

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

Lazy children are loaded on first expand and cached internally. Lazy items do not have a `children` field; the loader must return `SdTreeItemLazy<T>[]`. A rejected branch remains local to that node and exposes a retry action instead of rejecting through the click handler.

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

Signals update the tree reactively when their value changes. Root and lazy requests carry internal generation IDs: a late promise from an obsolete source or replaced tree cannot overwrite current data. A root failure renders an alert with Retry; `retry()` reruns the root loader.

## Keyboard and focus

Rows use a roving tabindex. Arrow Up/Down move through visible nodes, Home/End jump to the first/last visible node, Arrow Right expands or enters a branch, Arrow Left collapses or moves to the parent, and Enter/Space toggles selection. Each row exposes `role="treeitem"`, `aria-level`, expansion state, and selection/indeterminate state.

The roving index is bound as `[attr.tabindex]`, not `[tabIndex]`. The camelCase form sets the DOM *property* only and emits no `tabindex` attribute, so every tool that reads markup (a11y lint, DOM snapshots, devtools inspection) saw the rows as non-focusable even though focus worked at runtime.

## Commands

Commands render at the end of each row. The `more_vert` trigger only appears on row hover when at least one command is visible. Command text is kept separate from the label column, so two-line labels do not overlap the trigger.

Command menu icons default to `fontSet: 'material-icons-outlined'` and `color: 'secondary'`. Override `fontSet` or `color` per command when needed.

## Custom Item Template

```html
<sd-tree [option]="option">
  <ng-template sdTreeItemDef let-item let-treeItem="treeItem" let-level="level" let-toggle="toggle" let-selected="selected">
    <button type="button" (click)="toggle()">{{ level + 1 }}. {{ item.name }}</button>
  </ng-template>
</sd-tree>
```

Custom templates can grow row height; the tree row stretches instead of clipping taller item content. The context also exposes `loadError` and `retry()` for a custom lazy-error presentation.

## Public API

```ts
tree.filter(searchText);
tree.reload();
tree.retry();
```

Filtering searches loaded items only. Text is normalized to Vietnamese without accents, so `ke toan` matches labels with Vietnamese accents.

## i18n

Every string the component renders itself goes through `I18nService`, so it follows the active language:

| What                                     | Key                                  | Notes                                                                     |
| ---------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| Retry button in the root error state     | `core.component.tree.retry`          | Template, via the `translate` pipe.                                       |
| Default selection message                | `core.component.tree.selected-count` | Interpolates `{count}`. Used only when `selector.message` is not supplied. |
| Toggle `aria-label`, collapsed node      | `core.component.tree.expand`         |                                                                           |
| Toggle `aria-label`, expanded node       | `core.component.tree.collapse`       |                                                                           |
| Toggle `aria-label`, node failed to load | `core.component.tree.retry-item`     |                                                                           |
| `errorMessage()` fallback                | `core.component.tree.load-error`     | Used only when the thrown value carries no message of its own.            |

`selector.message` (string or `(items) => string`) still wins over `core.component.tree.selected-count` — supply
it when the host wants its own wording. `errorMessage()` returns `error.message` verbatim for a real `Error`.

## Visual cues

- Vertical list of tree rows with indentation per level (`indentSize`, default 20px).
- Nodes at `tree.maxDepth` render as leaves — no chevron, no default folder icon, no expand event.
- Branch nodes show a toggle icon and default folder / folder-open icon when no explicit node icon is provided.
- Leaf nodes have no default icon unless `treeItem.icon` is set.
- Checkbox column appears only when `selector.visible === true`.
- Row command trigger appears at the end of a row only when visible commands exist, usually on hover.
- Loading spinner appears on a lazy node while `onExpandChildren` is resolving.

## Examples

### 1. Static selectable tree

```html
<sd-tree [option]="categoryTree"></sd-tree>
```

```ts
categoryTree: SdTreeComponentOption<Category> = {
  autoId: 'category',
  items: categories,
  tree: { loadType: 'static', defaultExpanded: 1 },
  selector: { visible: true },
  onSelectedItemsChange: items => this.selectedCategories.set(items),
};
```

### 2. Lazy tree with row commands

```ts
treeOption: SdTreeComponentOption<Category> = {
  autoId: 'category',
  items: [{ id: 'root', label: 'Tất cả', data: root, hasChildren: true }],
  tree: {
    loadType: 'lazy',
    onExpandChildren: item => this.api.children(item.id),
  },
  commands: [{ key: 'edit', icon: 'edit', title: 'Sửa', click: item => this.edit(item) }],
};
```

## Anti-patterns

- ❌ Mixing `[option]` and split inputs for the same concern — pick `[option]` for new code.
- ❌ Omitting stable `id` on tree items — selection, expansion, and autoId derivation depend on it.
- ❌ Expecting lazy children to be searched before they are loaded — filtering only searches loaded nodes.
- ❌ Using `selectedItems` with objects that cannot be matched by reference or `id` / `code` / `value` — controlled selection cannot resolve rows reliably.
- ❌ Rendering large expensive subtrees in a custom template without guarding heavy child components.
- ❌ Treating `maxDepth` as "collapse deeper levels" — deeper nodes are not rendered at all and the boundary node cannot be expanded.

## E2E test attributes

When `autoId: 'category'` is set, the host renders `data-autoid="components-tree-category"`.

| Element              | Derived value                                            |
| -------------------- | -------------------------------------------------------- |
| Row                  | `components-tree-<autoId>-row-<nodeId>`                  |
| Toggle               | `components-tree-<autoId>-toggle-<nodeId>`               |
| Checkbox             | `components-tree-<autoId>-checkbox-<nodeId>`             |
| Icon                 | `components-tree-<autoId>-icon-<nodeId>`                 |
| Label                | `components-tree-<autoId>-label-<nodeId>`                |
| Command menu trigger | `components-tree-<autoId>-command-<nodeId>`              |
| Command item         | `components-tree-<autoId>-command-<nodeId>-<commandKey>` |
| Selection action     | `components-tree-<autoId>-selection-action-<index>`      |
| Clear selection      | `components-tree-<autoId>-clear-selection`               |

`nodeId` and `commandKey` are sanitized to alphanumeric / `_` / `-`.

## Related

- `<sd-table>` — use for tabular data, including tree rows when data must stay table-shaped.
- `<sd-query-bar>` / `<sd-query-builder>` — filtering surfaces that may drive the tree's data source.
- `<sd-button>` / `<sd-quick-action>` — command/action controls used by the tree.

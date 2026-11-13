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
| `activeChange`        | `{ item: T; node: SdTreeNode<T> }` | Navigation mode: the user opened a node (also when it is already open). Also calls `option.onActivate`. |

### Models on the component

`activeId` and `expandedIds` are **models on the component**, not keys of `[option]`. They are the two pieces of
tree state a page binds both ways to the URL, so they need `[(…)]`; everything else stays in `[option]`.

| Name          | Type                              | Default     | Notes |
| ------------- | --------------------------------- | ----------- | ----- |
| `activeId`    | `string \| null`                  | `null`      | Id of the open node (`option.navigation`). Set from outside, the tree calls `reveal(id)`. An id that is not loaded is kept and paints nothing until the node arrives. |
| `expandedIds` | `readonly string[] \| undefined`  | `undefined` | Defined: the source of the open state, both ways (`expanded` and `defaultExpanded` no longer apply; changing `items` does not reset it; in lazy mode the listed nodes load their children). `undefined`: the tree manages the open state itself, as before. |

## Option Shape

| Key                     | Type                                                                             | Notes                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `autoId`                | `string \| null`                                                                 | Stable `data-autoid` prefix.                                                                      |
| `items`                 | `SdTreeDataSource<SdTreeItemStatic<T>>` or `SdTreeDataSource<SdTreeItemLazy<T>>` | Root items as an array, signal, sync loader, or async loader. Item shape follows `tree.loadType`. |
| `tree`                  | `SdTreeOption<T>`                                                                | Static/lazy config. Defaults to static.                                                           |
| `selectedItems`         | `T[] \| null`                                                                    | Controlled selected raw data items.                                                               |
| `selector`              | `SdTreeSelectorOption<T> \| null`                                                | Checkbox/selection-bar config. Checkbox renders only when `selector.visible === true`; the selection bar additionally needs at least one visible `actions` entry. |
| `commands`              | `SdTreeCommand<T>[] \| null`                                                     | Trailing row menu commands.                                                                       |
| `itemTemplate`          | `TemplateRef<SdTreeItemContext<T>> \| null`                                      | Custom item template; projected `sdTreeItemDef` wins.                                             |
| `selectable`            | `boolean`                                                                        | Back-compat selection switch. Prefer `selector.visible`.                                          |
| `onSelectedItemsChange` | `(items: T[]) => void`                                                           | Selection callback.                                                                               |
| `onSelect`              | `(event: SdTreeSelectionEvent<T>) => void`                                       | Row selection callback.                                                                           |
| `onExpand`              | `(event: SdTreeToggleEvent<T>) => void`                                          | Expand callback.                                                                                  |
| `onCollapse`            | `(event: SdTreeToggleEvent<T>) => void`                                          | Collapse callback.                                                                                |
| `navigation`            | `boolean`                                                                        | Default `false`. Navigation mode for a tree-detail screen, see "Navigation mode".                |
| `onActivate`            | `(event: { item: T; node: SdTreeNode<T> }) => void`                              | Navigation mode: the user opened a node.                                                          |

`selector.single` limits selection to one loaded node **and switches the per-row control to a radio** — a checkbox reads as "pick several", so the limit would only reveal itself after the user ticks a second node and watches the first clear. The radios are deliberately *not* wrapped in a `<mat-radio-group>`: a group binds Arrow Up/Down to moving the selection, and tree rows already use those two keys to navigate. Clicking the selected radio still clears it, same as the checkbox path.

`selector.cascade` accepts `independent` (default) or `descendants`. Descendant cascade selects loaded descendants and reconciles loaded ancestors; a partially selected branch exposes an indeterminate checkbox and `aria-checked="mixed"`. Indeterminate has no meaning under `single`, where the selection is one node.

Read the resolved mode from `selectionSingle()`.

## Tree Item

`sd-tree` receives wrapped items so the tree has stable metadata and callbacks still work with raw consumer data. The item shape depends on `tree.loadType`.

```ts
interface SdTreeItemBase<T> {
  id: string;
  label: string;
  icon?: string | null;
  data: T;
  expanded?: boolean;
  count?: number | null;
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

`count` (an integer ≥ 0) renders after the label, before the command trigger: 12/16, muted, tabular digits, grouped
by the active locale. The row is then announced as "{label}, {count}". `null` or a missing value draws nothing. The
command trigger always keeps its place, so the number does not move when the row is hovered.

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
| `onResolvePath`   | `(id, signal) => Promise<readonly string[]>` | `lazy` | Ids from the root down to the direct parent of `id`. Used by `reveal(id)` when the node is not loaded yet. |
| `onSearch`        | `(text, signal) => Promise<readonly { path: readonly SdTreeItemLazy<T>[] }[]>` | `lazy` | Server search. With it, `filter(text)` asks the server instead of filtering loaded nodes. See "Search". |

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

With `navigation: true` the keys change as follows; the arrow keys, Home and End stay the same and never open a node.

| Key | Navigation mode |
| --- | --- |
| Enter | Opens the node. |
| Space | Toggles the checkbox when a selector is visible; otherwise nothing. |
| Shift+F10, ContextMenu | Opens the command menu of the focused row. Closing the menu returns focus to the row. |

The roving index is bound as `[attr.tabindex]`, not `[tabIndex]`. The camelCase form sets the DOM *property* only and emits no `tabindex` attribute, so every tool that reads markup (a11y lint, DOM snapshots, devtools inspection) saw the rows as non-focusable even though focus worked at runtime.

## Row layout

Every leading control — chevron, checkbox, item icon and the command trigger — occupies one `--sd-tree-control-size` slot (28px) and aligns to the **first line of the label**, not to the middle of the text block. That matters for labels long enough to wrap: aligning to the block centre would drag the chevron and checkbox down with the second line while neighbouring rows stayed put. Single-line rows are unaffected — the row's 8px vertical padding makes the natural height match the 44px `min-height`, so first-line and centre alignment coincide.

The checkbox gets `--mdc-checkbox-state-layer-size` set to the slot size. Material sizes `.mdc-checkbox` as a content-box from that token (40px by default), so clamping only its `height` leaves the real box overflowing the slot and the whole column drifts.

The tick box itself is `--sd-tree-checkbox-size` (16px), down from Material's built-in 18px, which reads better next to the 14px label. Material hard-codes that 18px and derives both the `.mdc-checkbox` padding and the `.mdc-checkbox__background` offset from it, so the override sets all three together — resizing the box alone would push the glyph off the centre of the slot. The slot and Material's 48px touch target are unchanged, so only the painted glyph shrinks.

## Commands

Commands render at the end of each row. The `more_vert` trigger exists only when at least one command is visible. It shows on row hover, while the row or something inside it has focus, on the open node (navigation mode), and always on touch screens (`pointer: coarse`). Its accessible name is `core.component.tree.open-menu` ("Actions for {label}"). Command text is kept separate from the label column, so two-line labels do not overlap the trigger.

Command menu icons default to `fontSet: 'material-icons-outlined'` and `color: 'secondary'`. Override `fontSet` or `color` per command when needed.

## Custom Item Template

```html
<sd-tree [option]="option">
  <ng-template sdTreeItemDef let-item let-treeItem="treeItem" let-level="level" let-toggle="toggle" let-selected="selected">
    <button type="button" (click)="toggle()">{{ level + 1 }}. {{ item.name }}</button>
  </ng-template>
</sd-tree>
```

Angular's template checker cannot infer the generic parameter of a projected `sdTreeItemDef` directive from the
`SdTreeComponentOption<T>` bound to its parent `<sd-tree>` because the directive has no generic input of its own. To
keep the documented syntax above compatible with `strictTemplates`, `SdTreeItemDefDirective` defaults only its
projected context item to `any`. This is a compatibility fallback, not inferred `T`; the Tree models and options keep
their `unknown` defaults.

Custom templates can grow row height; the tree row stretches instead of clipping taller item content. The context also exposes `loadError` and `retry()` for a custom lazy-error presentation.

## Navigation mode

`option.navigation: true` turns the tree into the left side of a tree-detail screen. The default is `false` and the
tree then behaves as before.

- Clicking a row (not its chevron, checkbox/radio or command trigger) or pressing Enter opens the node:
  `activeId` becomes its id, and `activeChange` / `option.onActivate` fire. Opening the node that is already open
  fires again, so the page can reload the detail side.
- The open node has the selected-row background, a primary icon, a visible command trigger and
  `aria-selected="true"`; every other row has `aria-selected="false"`.
- A ticked checkbox does **not** paint the row in this mode; the checkbox shows the tick and `aria-checked`
  carries it.
- The chevron only expands and collapses.

```html
<sd-tree [option]="categoryTree" [(activeId)]="categoryId" [(expandedIds)]="openIds" />
```

```ts
categoryTree: SdTreeComponentOption<Category> = {
  autoId: 'category',
  navigation: true,
  items: () => this.api.roots(),
  tree: {
    loadType: 'lazy',
    onExpandChildren: item => this.api.children(item.id),
    onResolvePath: (id, signal) => this.api.ancestorIds(id, signal),
    onSearch: (text, signal) => this.api.search(text, signal),
  },
};
```

### Reveal

`reveal(id)` opens every ancestor of a node and scrolls to it. A static tree finds the path in `items`. A lazy tree
uses the loaded nodes when it can, otherwise `tree.onResolvePath(id)`, then loads each ancestor in order with
`onExpandChildren` (cached children are reused). It scrolls the nearest scroll area (the `sd-tree` host or an
ancestor with `overflow-y: auto | scroll`) through `scrollTop`, never `scrollIntoView`, and does not take focus.
It resolves `false` when the node is not found, when a newer `reveal` or a row click aborts it, or when a load
fails; a failed ancestor shows its usual error state and `loadError` fires.

Setting `activeId` from outside (not by the user clicking) calls `reveal` for you; a newer change aborts the one in
flight. A page that scrolls with the document, not with a container, is not scrolled.

### Operations by id

| Method | Notes |
| --- | --- |
| `reveal(id): Promise<boolean>` | See above. |
| `expand(id): Promise<boolean>` | `false` for an unknown id, a leaf, or a failed load. |
| `collapse(id): void` | |
| `reloadNode(id): Promise<void>` | Lazy: fetches the children of the node again and keeps it open. Only the direct children are replaced. Static: nothing. |
| `focusNode(id): boolean` | Moves the roving tabindex and focus to a visible node. |

Adding a child: `await tree.reloadNode(parentId); await tree.expand(parentId); activeId.set(newId);`

## Search

`tree.filter(text)` has two modes.

- **Loaded nodes** (static trees, and lazy trees without `onSearch`): filters at once over what is loaded. Text is
  normalized to Vietnamese without accents, so `ke toan` matches labels with Vietnamese accents. Matching ancestors
  stay visible.
- **Server** (lazy with `tree.onSearch`): waits 300ms after the last call, aborts the previous request, then shows
  the results **in place of the tree**: every node on the returned paths, merged by id, all open. A node that is
  only on the way to a match is muted. Clearing the text gives back the tree exactly as it was opened before the
  search, with the same `activeId`. A failed search fires `loadError` and leaves the tree alone.

Both modes wrap the matching part of the default label in `<mark>` (through `sd-highlight`, accent-insensitive).
A custom item template is not highlighted.

Selection survives a server search: nodes selected before the search stay selected while they are off screen, and
a node ticked inside the results stays selected after the text is cleared, even though it is not loaded in the
tree. With `cascade: 'descendants'`, ticking inside the results selects the node and its listed descendants but
does not tick ancestors, because the results do not show all of their children.

## Root states

| State | What renders |
| --- | --- |
| Loading | A 24px spinner in a block of at least 120px. |
| Error | An `error` icon, the text `core.component.tree.load-error` and an outline `sd-button` "Retry", inside `role="alert"`. The message of the thrown error is **never** shown; read it from `loadError` or `rootError()`. |
| Empty | `core.component.tree.empty`, centred and muted. |
| No match | `core.component.tree.no-match` with the text being searched. |

Replace the empty and no-match texts with a template:

```html
<sd-tree [option]="option">
  <ng-template sdTreeEmptyDef let-searching="searching" let-text="text">
    {{ searching ? 'No category matches ' + text : 'No category yet' }}
  </ng-template>
</sd-tree>
```

## Public API

```ts
tree.filter(searchText);
tree.reload();
tree.retry();
tree.reveal(id);
tree.expand(id);
tree.collapse(id);
tree.reloadNode(id);
tree.focusNode(id);

tree.selectionQuickActionOpened(); // Signal<boolean> — is the selection bar showing?
tree.searchPending(); // Signal<boolean> — a server search is waiting or running
```

`errorMessage(error)` is deprecated: the root error state no longer shows the message of the thrown error.

## Selection bar

When rows are selected the tree shows the same selection bar as `sd-table`: a framed bar with a primary icon cell,
`selector.message` (or `core.component.tree.selected-count`), up to two `selector.actions` as buttons, the others
under "More", and a clear-selection `×`. Buttons are `sd-button size="sm"` with `type="light"` unless the action
sets `type`; `color` follows `sd-button` when the action does not set it.

The bar sits **inside the tree host**, after the rows, with `position: sticky; bottom: 0` in the nearest scroll
area. It is part of the flow, so the host grows by the height of the bar and the last row is never covered. Below
600px of its own width (not of the viewport) the bar stacks: full-width 40px buttons and the `×` in the top right
corner.

It opens only when **both** conditions hold — something is selected **and** at least one action survives the `hidden` predicates:

```ts
selectionQuickActionOpened(); // selectedCount() > 0 && selectionActionViews().length > 0
```

A selector with no actions therefore keeps the bar closed. Such a bar would only restate what the checkboxes already show, with `×` as its single control; deselect through the checkboxes instead. This is what keeps the bar out of `<sd-tree-select>`, whose embedded tree declares no actions and whose Apply/Cancel already live in the modal footer.

## i18n

Every string the component renders itself goes through `I18nService`, so it follows the active language:

| What                                     | Key                                  | Notes                                                                     |
| ---------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| Retry button in the root error state     | `core.component.tree.retry`          | Template, via the `sdTranslate` pipe.                                       |
| Default selection message                | `core.component.tree.selected-count` | Interpolates `{count}`. Used only when `selector.message` is not supplied. |
| Toggle `aria-label`, collapsed node      | `core.component.tree.expand`         |                                                                           |
| Toggle `aria-label`, expanded node       | `core.component.tree.collapse`       |                                                                           |
| Toggle `aria-label`, node failed to load | `core.component.tree.retry-item`     |                                                                           |
| Root error text                          | `core.component.tree.load-error`     | Always this text; the message of the thrown error is not shown.           |
| Empty tree                               | `core.component.tree.empty`          | Replaced by `sdTreeEmptyDef`.                                             |
| No search match                          | `core.component.tree.no-match`       | Interpolates `{text}`. Replaced by `sdTreeEmptyDef`.                      |
| Command trigger `aria-label`             | `core.component.tree.open-menu`      | Interpolates `{label}`.                                                   |
| "More" and clear-selection in the bar    | `core.component.table.selector-action.more`, `core.component.table.clear-selection` | Shared with the selection bar of `sd-table`. |

`selector.message` (string or `(items) => string`) still wins over `core.component.tree.selected-count` — supply
it when the host wants its own wording.

## Visual cues

- Vertical list of tree rows with indentation per level (`indentSize`, default 20px).
- Nodes at `tree.maxDepth` render as leaves — no chevron, no default folder icon, no expand event.
- Branch nodes show a toggle icon and default folder / folder-open icon when no explicit node icon is provided.
- Leaf nodes have no default icon unless `treeItem.icon` is set.
- Selection control appears only when `selector.visible === true` — a checkbox, or a radio when `selector.single` is on.
- The selection bar appears inside the tree, after the rows, only when the selection resolves to at least one action — see "Selection bar".
- Row command trigger appears at the end of a row only when visible commands exist: on hover, on focus, on the open node, and always on touch screens.
- Navigation mode: the open node has the selected-row background and a primary icon; ticked rows are not painted.
- A count, when the item has one, sits after the label in muted 12px digits.
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
- ❌ Expecting lazy children to be searched before they are loaded — without `tree.onSearch`, filtering only searches loaded nodes.
- ❌ Reading `error.message` from the tree to show it to users — the root error state hides it on purpose; handle `loadError` if the page needs the detail.
- ❌ Putting `activeId` or `expandedIds` in `[option]` — they are models on the component.
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
| Selection action (button, the first two)   | `components-button-components-tree-<autoId>-selection-action-<index>` |
| Selection action (entry under "More")      | `components-tree-<autoId>-selection-action-<index>`                   |
| More selection actions                     | `components-button-components-tree-<autoId>-more-actions`             |
| Clear selection                            | `components-button-components-tree-<autoId>-clear-selection`          |

`nodeId` and `commandKey` are sanitized to alphanumeric / `_` / `-`.

The selection-bar controls are `sd-button`s, so their rendered value carries the `components-button-` prefix. From
the third action on, an action is an entry of the "More" menu: it has no prefix and exists in the DOM only while
the menu is open.

## Related

- `<sd-table>` — use for tabular data, including tree rows when data must stay table-shaped.
- `<sd-query-bar>` / `<sd-query-builder>` — filtering surfaces that may drive the tree's data source.
- `<sd-button>` / `<sd-quick-action>` — command/action controls used by the tree.

### Đường nối phân cấp

`showLines` là input boolean dùng `booleanAttribute`, mặc định `false`. Dùng `<sd-tree showLines [option]="option" />` để hiển thị đường nối cha/con; `showLines="false"` tắt. Có thể đặt `option.showLines` (ưu tiên hơn input trực tiếp, cùng quy ước với selectable).

Line dùng token `--sd-border`, bám theo `tree.indentSize`, kết thúc tại con cuối đang hiển thị và tự cập nhật khi filter, collapse hoặc lazy load. Không thay đổi khoảng thụt lề, vùng click hay layout command. Title mặc định của node cha đậm 600, node lá 400; custom template tự quyết định typography. Icon expand/collapse giữ màu trung tính; icon nội dung chỉ dùng primary khi node được chọn.

Menu command của tree dùng chung Action Popover của sd-button và sd-button-item. Trigger ba chấm không kèm chevron; giữ nguyên command API, autoId, disabled, color/fontSet và callback theo node. Menu hỗ trợ bàn phím và phục hồi focus về trigger sau khi đóng.

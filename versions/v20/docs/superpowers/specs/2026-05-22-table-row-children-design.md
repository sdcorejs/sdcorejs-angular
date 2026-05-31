# Table Row Children (Tree Rows) — Design Spec

**Date:** 2026-05-22  
**Component:** `@sd-angular/components/table` (SdTable)  
**Status:** Approved (awaiting user spec review → implementation plan)

## 1. Goal

Thêm tính năng **tree rows** cho `sd-table`: mỗi row có thể có danh sách child rows, render inline dưới parent với expand/collapse, hỗ trợ đệ quy nhiều cấp (giới hạn bởi `maxDepth`).

Yêu cầu đã xác nhận:

| Quyết định | Lựa chọn |
|---|---|
| Loại | Tree table — mỗi row có children |
| Key children | Cấu hình được, mặc định `"children"` |
| Độ sâu | `maxDepth` cấu hình được |
| Expand ban đầu | `defaultExpanded`: `boolean \| number` |
| Nguồn data | Embedded mặc định + lazy load qua callback |
| Pagination (server) | Chỉ paginate root rows; `total` = số root |

Docs hiện tại ghi rõ table **chưa** hỗ trợ recursive tree — spec này bổ sung capability đó.

## 2. Public API

### 2.1 `SdTableOptionTree<T>`

File mới: `projects/sdcorejs-angular/components/table/src/models/table-option-tree.model.ts`

```typescript
export interface SdTableOptionTree<T = any> {
  /**
   * Key trên object row chứa mảng children.
   * Mặc định: 'children'
   */
  childrenKey?: string;

  /**
   * Giới hạn độ sâu cây.
   * 1 = chỉ 1 cấp con trực tiếp.
   * undefined = không giới hạn.
   */
  maxDepth?: number;

  /**
   * Trạng thái expand ban đầu sau mỗi lần load/reload.
   * - false → thu gọn hết
   * - true → mở hết (trong phạm vi maxDepth)
   * - number → mở tới cấp N (0 = root only visible)
   */
  defaultExpanded?: boolean | number;

  /**
   * Lazy load children khi row chưa có data embedded tại childrenKey.
   * Kết quả được cache vào row[childrenKey] sau lần fetch đầu.
   */
  onExpandChildren?: (rowData: T) => Promise<T[]> | T[];

  /**
   * Pixel indent mỗi cấp depth trong cột sdTreeToggle.
   * Mặc định: 20
   */
  indentSize?: number;
}
```

### 2.2 Thêm vào `SdTableOption`

```typescript
// table-option.model.ts — SdTableBaseOption
tree?: SdTableOptionTree<T>;
```

### 2.3 Meta mở rộng trên `SdTableItem`

```typescript
// table-item.model.ts
export interface SdTableMetaTree {
  level: number;           // 0 = root
  hasChildren: boolean;
  isExpanded: boolean;
  isExpanding?: boolean;   // lazy load in progress
  parentId?: string;       // meta.id của parent row
}

export interface SdTableMeta<T> {
  // ...existing fields
  tree?: SdTableMetaTree;
}
```

`MapToSdTableItem` khởi tạo:

```typescript
tree: {
  level: 0,
  hasChildren: false,
  isExpanded: false,
  isExpanding: false,
}
```

### 2.4 Ví dụ sử dụng

**Embedded (mặc định):**

```typescript
option: SdTableOption<Department> = {
  type: 'local',
  tree: {
    childrenKey: 'children',
    maxDepth: 3,
    defaultExpanded: 1,
  },
  items: () => [
    {
      id: 1,
      name: 'Phòng IT',
      children: [
        { id: 11, name: 'Team Frontend' },
        {
          id: 12,
          name: 'Team Backend',
          children: [{ id: 121, name: 'Sub-team API' }],
        },
      ],
    },
  ],
  columns: [/* ... */],
};
```

**Lazy load:**

```typescript
tree: {
  onExpandChildren: (row) => this.api.getChildren(row.id),
}
```

**Server mode (paginate root only):**

```typescript
option: SdTableOption<OrgUnit> = {
  type: 'server',
  tree: { maxDepth: 2, defaultExpanded: false },
  items: async (filterReq, pagingReq) => {
    const res = await this.api.getOrgUnits(pagingReq);
    // res.items: root rows, mỗi row có thể embed children tại key 'children'
    return { items: res.items, total: res.total }; // total = root count
  },
  columns: [/* ... */],
};
```

## 3. Kiến trúc

### 3.1 Approach (đã chọn)

**Tree Pipe + cột toggle riêng (`sdTreeToggle`)** — theo pattern `sdGroup` pipe hiện có.

```
items (root SdTableItem[])
  → sdTree pipe (flatten theo expand state + maxDepth)
  → sdGroup pipe (nếu group enabled — xem §5.1)
  → mat-table dataSource
```

### 3.2 Luồng dữ liệu

```
#load / #render
  └─ items.set(rootItems)          // chỉ root rows từ server/local
  └─ initTreeMeta(rootItems)       // set level=0, hasChildren, defaultExpanded

Template
  └─ groupedItems = items | sdTree:treeOption | sdGroup:tableOption
  └─ mat-table [dataSource]="groupedItems"

onTreeToggle(row)
  └─ toggle row.meta.tree.isExpanded
  └─ nếu lazy && chưa có children → onExpandChildren → cache vào row.data[childrenKey]
  └─ trigger CD → sdTree pipe re-flatten
```

### 3.3 Tree utilities

File mới: `services/tree/tree.util.ts`

| Function | Mục đích |
|---|---|
| `getChildrenKey(option)` | Resolve key, default `'children'` |
| `getChildren(data, key)` | Đọc mảng children từ row data |
| `resolveDefaultExpanded(level, option)` | Tính isExpanded ban đầu theo `defaultExpanded` |
| `initTreeMeta(items, option, parent?)` | Walk root items, set meta.tree |
| `flattenTree(items, option, visited?)` | DFS flatten visible rows; guard circular ref bằng `Set<meta.id>` |
| `hasLazyChildren(row, option)` | Row không có embedded children nhưng có `onExpandChildren` |

### 3.4 SdTreePipe

File mới: `pipes/sd-tree.pipe.ts`

```typescript
@Pipe({ name: 'sdTree', pure: true })
export class SdTreePipe implements PipeTransform {
  transform(items: SdTableItem[], treeOption?: SdTableOptionTree): SdTableItem[] {
    if (!treeOption) return items;
    return flattenTree(items, treeOption);
  }
}
```

Pipe **pure** — re-run khi reference `items` signal thay đổi hoặc sau toggle (trigger bằng shallow copy / detectChanges sau mutate meta).

## 4. UI

### 4.1 Cột `sdTreeToggle`

Thêm vào `ConfigService` (special column, không resize):

```
[ reorder? ] [ selection? ] [ sdTreeToggle ] [ command-left? ] [ data columns... ] [ command-right? ] [ expand? ]
```

Chỉ inject khi `option.tree` được khai báo.

| Trạng thái | Hiển thị |
|---|---|
| `hasChildren === true` | `expand_more` / `expand_less`; spinner khi `isExpanding` |
| Leaf row | Spacer trống (giữ indent alignment) |
| Level N | `padding-left: level × indentSize` |

Click icon → `onTreeToggle(row)`.

Width cố định ~40px. Loại trừ khỏi column resize (cùng rule `sdSelection`, `reorder`, …).

### 4.2 Row CSS

```html
<tr mat-row
  class="c-row sd-tree-row"
  [class]="'sd-tree-level-' + row.meta.tree?.level">
```

`option.style.rowCss` — mở rộng backward-compatible, thêm tham số optional thứ 3:

```typescript
rowCss?: (row: T, index: number, ctx?: { level: number; hasChildren: boolean; isExpanded: boolean }) => Record<string, string>;
```

### 4.3 Lazy load UX

1. User click expand trên row chưa có embedded children
2. `isExpanding = true` → spinner trong toggle cell
3. `await onExpandChildren(row.data)`
4. Success → gán `row.data[childrenKey] = result`, `isExpanded = true`, init meta cho children
5. Fail → `isExpanding = false`, `SdNotifyService.warning(...)`, không expand

## 5. Tương tác với tính năng hiện có

| Tính năng | Hành vi v1 |
|---|---|
| `option.expand` (master-detail) | **Coexist** — tree toggle trái, expand detail phải |
| `option.group` | **Mutually exclusive** — nếu có `tree`, ignore `group`; `console.warn` dev |
| `rowReorder` | Chỉ level 0 reorder; child rows `cdkDragDisabled` |
| `selector` | Selection độc lập từng row; không cascade |
| `commands` | Hoạt động trên mọi row (root + child) |
| Column resize | `sdTreeToggle` excluded |
| Sort (local) | Sort **root rows only**; children giữ thứ tự trong mảng `children` |
| Filter (local) | Filter trên **root rows only** (v1); không deep-search trong children |
| Export | Flatten toàn bộ cây (mọi levels, bất kể expand state) |
| Pagination (server) | `total` và page size chỉ tính root rows |

### 5.1 Tree + Group

v1: không hỗ trợ kết hợp. `sdTree` chạy trước; nếu `tree` present thì `sdGroup` no-op.

### 5.2 Reload & expand state persistence

Sau `reload()`:
- Row có cùng `meta.id` (hash data) → giữ `isExpanded`
- Row mới → áp `defaultExpanded`
- Lazy-loaded children cache trên `row.data[childrenKey]` được giữ nếu row object còn tồn tại

## 6. Edge Cases

| Case | Xử lý |
|---|---|
| `children: []` | Leaf — không hiện toggle |
| `maxDepth` reached | Không descend dù data có children sâu hơn |
| Circular reference | `visited Set<meta.id>` khi flatten; skip node đã visit |
| `tree` + `group` | Ignore group, warn |
| Lazy load error | Warning notify, không expand |
| Empty `onExpandChildren` result | Treat as leaf sau fetch |
| `defaultExpanded: 0` | Chỉ hiện root, tất cả collapsed |

## 7. Files thay đổi

| File | Thay đổi |
|---|---|
| `models/table-option-tree.model.ts` | **Mới** |
| `models/table-item.model.ts` | `SdTableMetaTree`, init trong `MapToSdTableItem` |
| `models/table-option.model.ts` | `tree?: SdTableOptionTree<T>` |
| `models/index.ts` | Export |
| `pipes/sd-tree.pipe.ts` | **Mới** |
| `pipes/sd-tree.pipe.spec.ts` | **Mới** |
| `pipes/index.ts` | Export |
| `services/tree/tree.util.ts` | **Mới** |
| `services/config.service.ts` | Inject `sdTreeToggle` column |
| `table.component.ts` | `onTreeToggle`, `initTreeMeta`, imports |
| `table.component.html` | `sdTreeToggle` column, pipe chain, row classes |
| `table.component.scss` | Tree toggle + indent styles |
| `table.component.spec.ts` | Toggle + lazy tests |
| `sd-table.md` | Document `option.tree` |
| Demo page | Tab/section demo embedded + lazy |

## 8. Out of Scope v1

- Cascade selection parent ↔ children
- Drag reorder child rows
- `tree` + `group` combined
- Custom template per level (`sdTableTreeDef`)
- Server-side paginated children (load children page-by-page)
- Deep filter (search trong children + auto-expand matched branch)

## 9. Testing Plan

### Unit — `sd-tree.pipe.spec.ts`

- Flatten embedded 2 levels: collapsed vs expanded
- `maxDepth: 1` — chỉ 1 cấp con
- `defaultExpanded: 2` — mở đúng depth
- Circular reference guard
- Empty children array → leaf

### Unit — `tree.util.spec.ts`

- `resolveDefaultExpanded` với boolean / number
- `hasLazyChildren` detection

### Component — `table.component.spec.ts`

- Toggle expand/collapse → đúng số visible rows
- `onExpandChildren` Promise → children render
- Lazy fail → không expand, không crash

### Demo manual

- Local table: nested `children` 3 cấp, `maxDepth: 3`
- Lazy tab: expand parent → API fetch
- Server tab: verify paginator total = root count

### Build verification

```bash
cd vn-angular && npx ng build sdcorejs-angular && npx ng build demo
```

## 10. Decisions Log

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Loại feature | A — Tree table |
| 2 | Depth | C — `maxDepth` configurable |
| 3 | Default expand | C — `defaultExpanded: boolean \| number` |
| 4 | Data source | C — Embedded default + lazy callback |
| 5 | Pagination | A — Root only |
| 6 | UI approach | 1 — Tree pipe + `sdTreeToggle` column |

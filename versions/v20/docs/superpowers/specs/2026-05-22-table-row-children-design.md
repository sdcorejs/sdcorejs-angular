�# Table Row Children (Tree Rows) � Design Spec

**Date:** 2026-05-22  
**Component:** `@sd-angular/components/table` (SdTable)  
**Status:** Approved (awaiting user spec review �  implementation plan)

## 1. Goal

Thêm tính nĒng **tree rows** cho `sd-table`: m�i row có thỒ có danh sách child rows, render inline dư�:i parent v�:i expand/collapse, h� trợ ��! quy nhiều cấp (gi�:i hạn b�xi `maxDepth`).

Yêu cầu �ã xác nhận:

| Quyết ��9nh | Lựa chọn |
|---|---|
| Loại | Tree table � m�i row có children |
| Key children | Cấu hình �ược, mặc ��9nh `"children"` |
| Đ�" sâu | `maxDepth` cấu hình �ược |
| Expand ban �ầu | `defaultExpanded`: `boolean \| number` |
| Ngu�n data | Embedded mặc ��9nh + lazy load qua callback |
| Pagination (server) | Ch�0 paginate root rows; `total` = s� root |

Docs hi�!n tại ghi rõ table **chưa** h� trợ recursive tree � spec này b�" sung capability �ó.

## 2. Public API

### 2.1 `SdTableOptionTree<T>`

File m�:i: `projects/sdcorejs-angular/components/table/src/models/table-option-tree.model.ts`

```typescript
export interface SdTableOptionTree<T = any> {
  /**
   * Key trên object row chứa mảng children.
   * Mặc ��9nh: 'children'
   */
  childrenKey?: string;

  /**
   * Gi�:i hạn ��" sâu cây.
   * 1 = ch�0 1 cấp con trực tiếp.
   * undefined = không gi�:i hạn.
   */
  maxDepth?: number;

  /**
   * Trạng thái expand ban �ầu sau m�i lần load/reload.
   * - false �  thu gọn hết
   * - true �  m�x hết (trong phạm vi maxDepth)
   * - number �  m�x t�:i cấp N (0 = root only visible)
   */
  defaultExpanded?: boolean | number;

  /**
   * Lazy load children khi row chưa có data embedded tại childrenKey.
   * Kết quả �ược cache vào row[childrenKey] sau lần fetch �ầu.
   */
  onExpandChildren?: (rowData: T) => Promise<T[]> | T[];

  /**
   * Pixel indent m�i cấp depth trong c�"t sdTreeToggle.
   * Mặc ��9nh: 20
   */
  indentSize?: number;
}
```

### 2.2 Thêm vào `SdTableOption`

```typescript
// table-option.model.ts � SdTableBaseOption
tree?: SdTableOptionTree<T>;
```

### 2.3 Meta m�x r�"ng trên `SdTableItem`

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

`MapToSdTableItem` kh�xi tạo:

```typescript
tree: {
  level: 0,
  hasChildren: false,
  isExpanded: false,
  isExpanding: false,
}
```

### 2.4 Ví dụ sử dụng

**Embedded (mặc ��9nh):**

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
    // res.items: root rows, m�i row có thỒ embed children tại key 'children'
    return { items: res.items, total: res.total }; // total = root count
  },
  columns: [/* ... */],
};
```

## 3. Kiến trúc

### 3.1 Approach (�ã chọn)

**Tree Pipe + c�"t toggle riêng (`sdTreeToggle`)** � theo pattern `sdGroup` pipe hi�!n có.

```
items (root SdTableItem[])
  �  sdTree pipe (flatten theo expand state + maxDepth)
  �  sdGroup pipe (nếu group enabled � xem §5.1)
  �  mat-table dataSource
```

### 3.2 Lu�ng dữ li�!u

```
#load / #render
  ��� items.set(rootItems)          // ch�0 root rows từ server/local
  ��� initTreeMeta(rootItems)       // set level=0, hasChildren, defaultExpanded

Template
  ��� groupedItems = items | sdTree:treeOption | sdGroup:tableOption
  ��� mat-table [dataSource]="groupedItems"

onTreeToggle(row)
  ��� toggle row.meta.tree.isExpanded
  ��� nếu lazy && chưa có children �  onExpandChildren �  cache vào row.data[childrenKey]
  ��� trigger CD �  sdTree pipe re-flatten
```

### 3.3 Tree utilities

File m�:i: `services/tree/tree.util.ts`

| Function | Mục �ích |
|---|---|
| `getChildrenKey(option)` | Resolve key, default `'children'` |
| `getChildren(data, key)` | Đọc mảng children từ row data |
| `resolveDefaultExpanded(level, option)` | Tính isExpanded ban �ầu theo `defaultExpanded` |
| `initTreeMeta(items, option, parent?)` | Walk root items, set meta.tree |
| `flattenTree(items, option, visited?)` | DFS flatten visible rows; guard circular ref bằng `Set<meta.id>` |
| `hasLazyChildren(row, option)` | Row không có embedded children nhưng có `onExpandChildren` |

### 3.4 SdTreePipe

File m�:i: `pipes/sd-tree.pipe.ts`

```typescript
@Pipe({ name: 'sdTree', pure: true })
export class SdTreePipe implements PipeTransform {
  transform(items: SdTableItem[], treeOption?: SdTableOptionTree): SdTableItem[] {
    if (!treeOption) return items;
    return flattenTree(items, treeOption);
  }
}
```

Pipe **pure** � re-run khi reference `items` signal thay ��"i hoặc sau toggle (trigger bằng shallow copy / detectChanges sau mutate meta).

## 4. UI

### 4.1 C�"t `sdTreeToggle`

Thêm vào `ConfigService` (special column, không resize):

```
[ reorder? ] [ selection? ] [ sdTreeToggle ] [ command-left? ] [ data columns... ] [ command-right? ] [ expand? ]
```

Ch�0 inject khi `option.tree` �ược khai báo.

| Trạng thái | HiỒn th�9 |
|---|---|
| `hasChildren === true` | `expand_more` / `expand_less`; spinner khi `isExpanding` |
| Leaf row | Spacer tr�ng (giữ indent alignment) |
| Level N | `padding-left: level � indentSize` |

Click icon �  `onTreeToggle(row)`.

Width c� ��9nh ~40px. Loại trừ khỏi column resize (cùng rule `sdSelection`, `reorder`, ⬦).

### 4.2 Row CSS

```html
<tr mat-row
  class="c-row sd-tree-row"
  [class]="'sd-tree-level-' + row.meta.tree?.level">
```

`option.style.rowCss` � m�x r�"ng backward-compatible, thêm tham s� optional thứ 3:

```typescript
rowCss?: (row: T, index: number, ctx?: { level: number; hasChildren: boolean; isExpanded: boolean }) => Record<string, string>;
```

### 4.3 Lazy load UX

1. User click expand trên row chưa có embedded children
2. `isExpanding = true` �  spinner trong toggle cell
3. `await onExpandChildren(row.data)`
4. Success �  gán `row.data[childrenKey] = result`, `isExpanded = true`, init meta cho children
5. Fail �  `isExpanding = false`, `SdNotifyService.warning(...)`, không expand

## 5. Tương tác v�:i tính nĒng hi�!n có

| Tính nĒng | Hành vi v1 |
|---|---|
| `option.expand` (master-detail) | **Coexist** � tree toggle trái, expand detail phải |
| `option.group` | **Mutually exclusive** � nếu có `tree`, ignore `group`; `console.warn` dev |
| `rowReorder` | Ch�0 level 0 reorder; child rows `cdkDragDisabled` |
| `selector` | Selection ��"c lập từng row; không cascade |
| `commands` | Hoạt ��"ng trên mọi row (root + child) |
| Column resize | `sdTreeToggle` excluded |
| Sort (local) | Sort **root rows only**; children giữ thứ tự trong mảng `children` |
| Filter (local) | Filter trên **root rows only** (v1); không deep-search trong children |
| Export | Flatten toàn b�" cây (mọi levels, bất kỒ expand state) |
| Pagination (server) | `total` và page size ch�0 tính root rows |

### 5.1 Tree + Group

v1: không h� trợ kết hợp. `sdTree` chạy trư�:c; nếu `tree` present thì `sdGroup` no-op.

### 5.2 Reload & expand state persistence

Sau `reload()`:
- Row có cùng `meta.id` (hash data) �  giữ `isExpanded`
- Row m�:i �  áp `defaultExpanded`
- Lazy-loaded children cache trên `row.data[childrenKey]` �ược giữ nếu row object còn t�n tại

## 6. Edge Cases

| Case | Xử lý |
|---|---|
| `children: []` | Leaf � không hi�!n toggle |
| `maxDepth` reached | Không descend dù data có children sâu hơn |
| Circular reference | `visited Set<meta.id>` khi flatten; skip node �ã visit |
| `tree` + `group` | Ignore group, warn |
| Lazy load error | Warning notify, không expand |
| Empty `onExpandChildren` result | Treat as leaf sau fetch |
| `defaultExpanded: 0` | Ch�0 hi�!n root, tất cả collapsed |

## 7. Files thay ��"i

| File | Thay ��"i |
|---|---|
| `models/table-option-tree.model.ts` | **M�:i** |
| `models/table-item.model.ts` | `SdTableMetaTree`, init trong `MapToSdTableItem` |
| `models/table-option.model.ts` | `tree?: SdTableOptionTree<T>` |
| `models/index.ts` | Export |
| `pipes/sd-tree.pipe.ts` | **M�:i** |
| `pipes/sd-tree.pipe.spec.ts` | **M�:i** |
| `pipes/index.ts` | Export |
| `services/tree/tree.util.ts` | **M�:i** |
| `services/config.service.ts` | Inject `sdTreeToggle` column |
| `table.component.ts` | `onTreeToggle`, `initTreeMeta`, imports |
| `table.component.html` | `sdTreeToggle` column, pipe chain, row classes |
| `table.component.scss` | Tree toggle + indent styles |
| `table.component.spec.ts` | Toggle + lazy tests |
| `sd-table.md` | Document `option.tree` |
| Demo page | Tab/section demo embedded + lazy |

## 8. Out of Scope v1

- Cascade selection parent �  children
- Drag reorder child rows
- `tree` + `group` combined
- Custom template per level (`sdTableTreeDef`)
- Server-side paginated children (load children page-by-page)
- Deep filter (search trong children + auto-expand matched branch)

## 9. Testing Plan

### Unit � `sd-tree.pipe.spec.ts`

- Flatten embedded 2 levels: collapsed vs expanded
- `maxDepth: 1` � ch�0 1 cấp con
- `defaultExpanded: 2` � m�x �úng depth
- Circular reference guard
- Empty children array �  leaf

### Unit � `tree.util.spec.ts`

- `resolveDefaultExpanded` v�:i boolean / number
- `hasLazyChildren` detection

### Component � `table.component.spec.ts`

- Toggle expand/collapse �  �úng s� visible rows
- `onExpandChildren` Promise �  children render
- Lazy fail �  không expand, không crash

### Demo manual

- Local table: nested `children` 3 cấp, `maxDepth: 3`
- Lazy tab: expand parent �  API fetch
- Server tab: verify paginator total = root count

### Build verification

```bash
cd vn-angular && npx ng build sdcorejs-angular && npx ng build demo
```

## 10. Decisions Log

| # | Câu hỏi | Quyết ��9nh |
|---|---|---|
| 1 | Loại feature | A � Tree table |
| 2 | Depth | C � `maxDepth` configurable |
| 3 | Default expand | C � `defaultExpanded: boolean \| number` |
| 4 | Data source | C � Embedded default + lazy callback |
| 5 | Pagination | A � Root only |
| 6 | UI approach | 1 � Tree pipe + `sdTreeToggle` column |


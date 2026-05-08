# Row Reorder Feature â€” Design Spec

**Date:** 2026-04-25  
**Component:** `projects/sdcorejs-angular/components/table`  
**Branch:** `release/0.0.1`

---

## Overview

Add drag-and-drop row reordering to the `SdTable` component via the `rowReorder` option. Uses Angular CDK DragDrop (already present in the project). Reorder applies to the current page only. Works alongside sort and grouping.

---

## Configuration

```typescript
rowReorder?: {
  enabled?: boolean;
  onChange?: (newRows: T[], movedItem: T, fromIndex: number, toIndex: number) => void;
  icon?: string;       // default: 'drag_indicator'
  disabled?: (row: T, index: number) => boolean;
};
```

- `enabled` â€” activates the feature
- `onChange` â€” called after a successful drop; indices are relative to the current page
- `icon` â€” custom Material icon name for the drag handle
- `disabled` â€” per-row predicate; disables drag for that row (icon shown greyed out)

---

## Architecture

```
items() signal  â”€â”€â–º  cdkDropList (table)
                          â”‚
                    cdkDrag (mat-row)
                          â”‚
                    cdkDragHandle (reorder column cell)
                          â”‚
                  onReorderDrop()
                    â”œâ”€â”€ moveItemInArray on items()
                    â”œâ”€â”€ table.renderRows()
                    â””â”€â”€ onChange(newRows[], movedItem, fromIndex, toIndex)
```

---

## Constraints

| Constraint | Behaviour |
|---|---|
| Pagination | Reorder applies to current page only; indices are page-local |
| Sort active | Reorder still works; user is responsible for reconciling order with sort state |
| Grouping | Only within same group; crossing group boundaries is blocked via `cdkDropListSortPredicate` |
| Group header rows | Always `cdkDragDisabled = true`; cannot be dragged |
| `disabled` rows | Handle shown greyed out; `cdkDragDisabled = true` for that row |

---

## Files Changed

### 1. `config.service.ts`

When `rowReorder.enabled` is true, prepend `'reorder'` to `displayedColumns` and `firstHeaders`:

```typescript
if (option.rowReorder?.enabled) {
  result.displayedColumns.unshift('reorder');
  result.firstHeaders.unshift('reorder');
}
```

### 2. `table.component.ts`

**Imports to add:**
```typescript
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
```

**Add to component imports array:** `DragDropModule`

**Sort predicate** (arrow function to preserve `this`):
```typescript
reorderSortPredicate = (index: number, drag: CdkDrag<SdTableItem<T>>): boolean => {
  const opt = this.tableOption()?.rowReorder;
  if (!opt?.enabled) return false;
  if (!this.tableOption()?.group) return true;
  const allItems = this.items();
  return this.#sameGroup(drag.data, allItems[index], allItems);
};
```

**Drop handler:**
```typescript
onReorderDrop(event: CdkDragDrop<SdTableItem<T>[]>): void {
  const { previousIndex, currentIndex } = event;
  if (previousIndex === currentIndex) return;
  const current = [...this.items()];
  moveItemInArray(current, previousIndex, currentIndex);
  this.items.set(current);
  this.table()?.renderRows();
  this.tableOption()?.rowReorder?.onChange?.(
    current.map(i => i.data),
    event.item.data.data,
    previousIndex,
    currentIndex
  );
}
```

**Per-row disabled helper:**
```typescript
isReorderDisabled(item: SdTableItem<T>): boolean {
  const opt = this.tableOption()?.rowReorder;
  if (!opt?.disabled) return false;
  return opt.disabled(item.data, this.items().indexOf(item));
}
```

**Group boundary helper (private):**
```typescript
#sameGroup(a: SdTableItem<T>, b: SdTableItem<T>, allItems: SdTableItem<T>[]): boolean {
  // Group header rows block crossing
  if (b?.meta?.group != null) return false;
  // Find the group header each item belongs to
  const groupOf = (item: SdTableItem<T>): number => {
    let last = -1;
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].meta?.group != null) last = i;
      if (allItems[i] === item) return last;
    }
    return -1;
  };
  return groupOf(a) === groupOf(b);
}
```

### 3. `table.component.html`

**`<table mat-table>`** â€” add CDK drop list attributes:
```html
<table mat-table
  cdkDropList
  [cdkDropListDisabled]="!_tableOption.rowReorder?.enabled"
  [cdkDropListData]="items()"
  [cdkDropListSortPredicate]="reorderSortPredicate"
  (cdkDropListDropped)="onReorderDrop($event)"
  ...existing attrs...>
```

**New `'reorder'` column definition** â€” insert before all other `ng-container[matColumnDef]`:
```html
@if (_tableOption.rowReorder?.enabled) {
  <ng-container matColumnDef="reorder">
    <th mat-header-cell *matHeaderCellDef class="sd-reorder-header"></th>
    <td mat-cell *matCellDef="let row" class="sd-reorder-cell">
      <mat-icon
        cdkDragHandle
        [class.sd-reorder-disabled]="isReorderDisabled(row)"
        [cdkDragHandleDisabled]="isReorderDisabled(row)">
        {{ _tableOption.rowReorder?.icon || 'drag_indicator' }}
      </mat-icon>
    </td>
  </ng-container>
}
```

**Data `mat-row`** â€” add `cdkDrag`:
```html
<tr mat-row
  cdkDrag
  [cdkDragData]="row"
  [cdkDragDisabled]="!_tableOption.rowReorder?.enabled || isReorderDisabled(row)"
  *matRowDef="let row; columns: displayedColumns"
  ...>
```

**Group header `mat-row`** â€” always disabled:
```html
<tr mat-row
  cdkDrag
  [cdkDragDisabled]="true"
  *matRowDef="let row; when: isGroup; columns: groupColumns"
  ...>
```

### 4. Styling (`table.component.scss`)

```scss
.sd-reorder-header,
.sd-reorder-cell {
  width: 40px;
  min-width: 40px;
  padding: 0 4px;
}

.sd-reorder-cell mat-icon {
  cursor: grab;
  color: rgba(0, 0, 0, 0.38);

  &:active { cursor: grabbing; }
  &.sd-reorder-disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// CDK drag placeholder and preview
.cdk-drag-preview {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
}

.cdk-drag-placeholder { opacity: 0; }

.cdk-drop-list-dragging tr:not(.cdk-drag-placeholder) {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}
```

---

## Out of Scope

- Reorder across pages
- Touch device optimisation (CDK handles basic touch support natively)
- Persisting order to server (handled by consumer via `onChange`)


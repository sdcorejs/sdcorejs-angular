�# Row Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CDK DragDrop row reordering to `SdTable` via the `rowReorder` option already declared in `SdTableBaseOption<T>`.

**Architecture:** A `'reorder'` column is prepended to `displayedColumns` in `config.service` when `rowReorder.enabled` is true. `cdkDropList` is added to the `<table mat-table>` element and `cdkDrag` to each data row. A sort predicate prevents dragging across group boundaries. The drop handler converts DOM indices (which include group-header rows) to `items()` signal indices before calling `moveItemInArray`.

**Tech Stack:** Angular 17+, `@angular/cdk/drag-drop` (already in `package.json`, used in `config.component.ts`), Angular Signals.

---

## File Map

| File | Change |
|---|---|
| `projects/sdcorejs-angular/components/table/src/services/config.service.ts` | Prepend `'reorder'` to `displayedColumns`, `firstHeaders`, `displayedFooters` |
| `projects/sdcorejs-angular/components/table/src/table.component.ts` | Import `DragDropModule`; add `onReorderDrop`, `isReorderDisabled`, `reorderSortPredicate`, `#sameGroup` |
| `projects/sdcorejs-angular/components/table/src/table.component.html` | Add CDK attrs to `<table>`, add reorder column def, add `cdkDrag` to data rows |
| `projects/sdcorejs-angular/components/table/src/table.component.scss` | Add drag handle + CDK placeholder styles |

---

## Task 1: Register `'reorder'` column in config service

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/services/config.service.ts:150-153`

- [ ] **Step 1: Verify build passes before any changes**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 2: Add reorder column injection in `loadConfigurationResult`**

Find this block (around line 150�153):
```typescript
    result.multipleHeader = result.secondHeaders.length > 0;
    // Sub infomation không thỒ có footer
    result.displayedFooters = result.displayedColumns.filter(val => val !== this.#COLUMNS.SUBINFORMATION);
    return result;
```

Replace with:
```typescript
    result.multipleHeader = result.secondHeaders.length > 0;
    // Sub infomation không thỒ có footer
    result.displayedFooters = result.displayedColumns.filter(val => val !== this.#COLUMNS.SUBINFORMATION);
    if (option.rowReorder?.enabled) {
      result.displayedColumns.unshift('reorder');
      result.firstHeaders.unshift('reorder');
      result.displayedFooters.unshift('reorder');
    }
    return result;
```

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/services/config.service.ts
git commit -m "feat(table): register reorder column in config service"
```

---

## Task 2: Import `DragDropModule` in table component

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.ts:37` (import line)
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.ts:116-143` (imports array)

- [ ] **Step 1: Add import statement**

Find line 37:
```typescript
import { CdkColumnDef } from '@angular/cdk/table';
```

Add after it:
```typescript
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
```

- [ ] **Step 2: Add `DragDropModule` to the component's `imports` array**

Find the `imports` array in `@Component` decorator (around line 116). Add `DragDropModule` after `MatCheckboxModule`:
```typescript
    MatCheckboxModule,
    DragDropModule,
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.ts
git commit -m "feat(table): import DragDropModule for row reorder"
```

---

## Task 3: Add reorder logic methods to table component

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.ts`

- [ ] **Step 1: Add `isReorderDisabled` helper**

Find the `trackBy` method (around line 881):
```typescript
  trackBy = (index: number, item: SdTableItem) => {
    return item.meta.id;
  };
```

Add after `trackBy`:
```typescript
  isReorderDisabled(item: SdTableItem<T>): boolean {
    const opt = this.tableOption()?.rowReorder;
    if (!opt?.disabled || item.meta?.group?.items?.length) return false;
    return opt.disabled(item.data, this.items().indexOf(item));
  }
```

- [ ] **Step 2: Add `#sameGroup` private helper**

Add after `isReorderDisabled`:
```typescript
  #sameGroup(a: SdTableItem<T>, b: SdTableItem<T>, allItems: SdTableItem<T>[]): boolean {
    const groupOf = (item: SdTableItem<T>): number => {
      let lastGroupIdx = -1;
      for (let i = 0; i < allItems.length; i++) {
        if (allItems[i].meta?.group?.items?.length) lastGroupIdx = i;
        if (allItems[i] === item) return lastGroupIdx;
      }
      return -1;
    };
    return groupOf(a) === groupOf(b);
  }
```

- [ ] **Step 3: Add `reorderSortPredicate` arrow function**

Add after `#sameGroup`:
```typescript
  reorderSortPredicate = (index: number, drag: CdkDrag<SdTableItem<T>>, drop: CdkDropList<SdTableItem<T>[]>): boolean => {
    const opt = this.tableOption()?.rowReorder;
    if (!opt?.enabled) return false;
    const allItems = drop.data;
    const targetItem = allItems?.[index];
    if (!targetItem) return false;
    if (targetItem.meta?.group?.items?.length) return false;
    if (this.tableOption()?.group) {
      return this.#sameGroup(drag.data, targetItem, allItems);
    }
    return true;
  };
```

- [ ] **Step 4: Add `onReorderDrop` handler**

Add after `reorderSortPredicate`:
```typescript
  onReorderDrop(event: CdkDragDrop<SdTableItem<T>[]>): void {
    const { previousIndex, currentIndex } = event;
    if (previousIndex === currentIndex) return;
    const groupedItems = event.container.data;
    const toItemsIndex = (domIdx: number): number => {
      let count = 0;
      for (let i = 0; i < domIdx; i++) {
        if (!groupedItems[i]?.meta?.group?.items?.length) count++;
      }
      return count;
    };
    const fromIdx = toItemsIndex(previousIndex);
    const toIdx = toItemsIndex(currentIndex);
    const current = [...this.items()];
    moveItemInArray(current, fromIdx, toIdx);
    this.items.set(current);
    this.table()?.renderRows();
    this.tableOption()?.rowReorder?.onChange?.(
      current.map(i => i.data),
      event.item.data.data,
      fromIdx,
      toIdx
    );
  }
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.ts
git commit -m "feat(table): add row reorder handler and helpers"
```

---

## Task 4: Add reorder column definition and CDK attrs to template

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.html`

- [ ] **Step 1: Add CDK DragDrop attributes to `<table mat-table>`**

Find line 31 (the `<table mat-table ...>` opening tag):
```html
      <table mat-table [dataSource]="groupedItems" [trackBy]="trackBy" matSort [matSortDisabled]="!_tableOption.sort?.enable" multiTemplateDataRows>
```

Replace with:
```html
      <table mat-table [dataSource]="groupedItems" [trackBy]="trackBy" matSort [matSortDisabled]="!_tableOption.sort?.enable" multiTemplateDataRows
        cdkDropList
        [cdkDropListData]="groupedItems"
        [cdkDropListDisabled]="!_tableOption.rowReorder?.enabled"
        [cdkDropListSortPredicate]="reorderSortPredicate"
        (cdkDropListDropped)="onReorderDrop($event)">
```

- [ ] **Step 2: Add `'reorder'` column definition**

Find line 32 (the first `<ng-container>` inside `<table>`):
```html
        <ng-container matColumnDef="sdSubInformation" sticky>
```

Insert before it:
```html
        @if (_tableOption.rowReorder?.enabled) {
          <ng-container matColumnDef="reorder">
            <th mat-header-cell *matHeaderCellDef class="sd-reorder-header" [attr.rowspan]="_configuration.multipleHeader ? 2 : 1"></th>
            <td mat-cell *matCellDef="let row" class="sd-reorder-cell">
              <mat-icon
                cdkDragHandle
                [class.sd-reorder-disabled]="isReorderDisabled(row)"
                [cdkDragHandleDisabled]="isReorderDisabled(row)">
                {{ _tableOption.rowReorder?.icon || 'drag_indicator' }}
              </mat-icon>
            </td>
            <td mat-footer-cell *matFooterCellDef></td>
          </ng-container>
        }
```

- [ ] **Step 3: Add `cdkDrag` to the main data row**

Find lines 251�256 (the main data row definition):
```html
        <tr
          mat-row
          *matRowDef="let row; columns: _configuration.displayedColumns"
          matRipple
          class="c-row"
          [class.selected]="row.meta.selector.isSelected"></tr>
```

Replace with:
```html
        <tr
          mat-row
          cdkDrag
          [cdkDragData]="row"
          [cdkDragDisabled]="!_tableOption.rowReorder?.enabled || !!row.meta?.group?.items?.length || isReorderDisabled(row)"
          *matRowDef="let row; columns: _configuration.displayedColumns"
          matRipple
          class="c-row"
          [class.selected]="row.meta.selector.isSelected"></tr>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.html
git commit -m "feat(table): add reorder column def and cdkDrag to rows"
```

---

## Task 5: Add drag handle styles

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.scss`

- [ ] **Step 1: Append styles to `table.component.scss`**

Open `projects/sdcorejs-angular/components/table/src/table.component.scss` and append at the end of the `:host { ... }` block (before the final closing `}`):

```scss
  .sd-reorder-header,
  .sd-reorder-cell {
    width: 40px;
    min-width: 40px;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .sd-reorder-cell {
    mat-icon {
      cursor: grab;
      color: rgba(0, 0, 0, 0.38);
      display: flex;
      align-items: center;

      &:active {
        cursor: grabbing;
      }

      &.sd-reorder-disabled {
        opacity: 0.3;
        cursor: not-allowed;
        pointer-events: none;
      }
    }
  }
```

After the `:host` block (at root level of the file), append:

```scss
// CDK drag visual feedback
.cdk-drag-preview {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  display: table;
  width: 100%;

  td {
    padding: 0 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }
}

.cdk-drag-placeholder {
  opacity: 0;
}

.cdk-drop-list-dragging tr.c-row:not(.cdk-drag-placeholder) {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.scss
git commit -m "feat(table): add drag handle styles for row reorder"
```

---

## Task 6: Manual smoke test

- [ ] **Step 1: Set up a test table with `rowReorder` enabled**

In a consumer app/page, set up the table option:
```typescript
option: SdTableOption<YourType> = {
  type: 'local',
  items: () => this.yourData,
  columns: [...],
  rowReorder: {
    enabled: true,
    onChange: (newRows, movedItem, from, to) => {
      console.log('Reordered:', from, '->', to);
      console.log('New order:', newRows);
      this.yourData = newRows; // persist the new order
    },
  },
};
```

- [ ] **Step 2: Verify basic reorder**

1. Drag a row by its handle icon (left-most column)
2. Drop it at a new position
3. Verify console logs show correct `from`/`to` indices and `newRows` array
4. Verify table visually reflects the new order

- [ ] **Step 3: Verify `disabled` per row**

```typescript
rowReorder: {
  enabled: true,
  disabled: (row, index) => index === 0, // first row cannot be dragged
  onChange: ...,
}
```
Expected: first row's handle icon is greyed out and cannot be dragged.

- [ ] **Step 4: Verify custom icon**

```typescript
rowReorder: {
  enabled: true,
  icon: 'open_with',
  onChange: ...,
}
```
Expected: handle shows `open_with` icon instead of `drag_indicator`.

- [ ] **Step 5: Verify grouped table (if group option is used)**

Set up table with both `group` and `rowReorder` enabled. Verify that:
- Rows within the same group can be reordered
- Dragging a row past a group header is blocked (row snaps back)

- [ ] **Step 6: Verify table without `rowReorder` enabled**

Confirm a table that does NOT have `rowReorder.enabled` shows no drag handle column and rows are not draggable.

- [ ] **Step 7: Final commit if any fixes applied**

```bash
git add -p
git commit -m "fix(table): row reorder smoke test fixes"
```


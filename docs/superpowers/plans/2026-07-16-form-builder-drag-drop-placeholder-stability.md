# Form Builder Drag/Drop Placeholder Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make palette, field, and complete-row drag operations show exactly one current drop placeholder and never retain the first preview after the pointer moves.

**Architecture:** Keep Angular CDK as the placeholder authority for existing fields and complete rows. Replace the palette's three loosely coupled preview values with one discriminated target signal, hide the palette's native placeholder, render one target-driven preview, and make palette mutation consume the same target that the template displays.

**Tech Stack:** Angular 19/20/21, Angular CDK drag-drop, Angular signals and control flow, Jasmine/Karma, ChromeHeadless, SCSS, repository v19-first sync scripts.

---

## Source Contract

- Approved design: `docs/superpowers/specs/2026-07-16-form-builder-drag-drop-placeholder-design.md`
- Source of truth: `versions/v19`
- Derived workspaces: `versions/v20`, `versions/v21`
- Current focused baseline: 29 passing assertions from the component and layout specs when coverage is disabled.
- Preserve unrelated dirty paths: `.sdcorejs/summary.md`, `.sdcorejs/tasks/current-session.md`, `.superpowers/**`, and status-only generated Showcase sources.
- Do not change schema types, public exports, group drill-in, resize semantics, or placeholder appearance tokens.
- Current branch is `release/1.3`. Every commit step below is conditional on separate, explicit authorization to commit this fix on a release branch. Without that authorization, do not stage or commit; keep the verified feature diff in the working tree and continue to the next task. Push, tag, publish, and deployment are out of scope.

## File Map

- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts` — atomic palette target, pointer resolution, CDK enter/sort lifecycle, and palette drop placement.
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html` — one custom palette preview and CDK sort events.
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss` — hide only the palette-native placeholder and allow CDK transforms for field/row placeholders.
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts` — state-level RED/GREEN regression coverage.
- Create: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts` — rendered and real mouse-drag ChromeHeadless coverage.
- Mirror through root sync: the same five form-builder files under `versions/v20` and `versions/v21`, plus only sync metadata that the repository script intentionally updates.

### Task 1: Lock the atomic palette-target contract with RED tests

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts`

- [ ] **Step 1: Import fake-time helpers for drag-end cleanup**

Replace the testing import with:

```ts
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
```

- [ ] **Step 2: Add three state-level tests after the current palette-placeholder tests**

```ts
it('replaces the previous palette inline target atomically when another row is entered', () => {
  const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
  component.components = [
    { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
    { id: 'b', key: 'k_b', type: 'textfield', label: 'B', layout: { columns: '8' }, validate: {}, properties: {} },
    { id: 'c', key: 'k_c', type: 'textfield', label: 'C', layout: { columns: '6' }, validate: {}, properties: {} },
  ] as any;
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  component.onPaletteDragStarted(paletteTextfield);

  component.onRowItemsDropEntered(component.dragDropRows[0], { currentIndex: 1 } as any);
  expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 1, columns: '6' });

  component.onRowItemsDropEntered(component.dragDropRows[1], { currentIndex: 0 } as any);
  expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-b', index: 0, columns: '4' });
  expect(component.shouldShowInlinePalettePlaceholder(component.dragDropRows[0], 1)).toBeFalse();
  expect(component.shouldShowInlinePalettePlaceholder(component.dragDropRows[1], 0)).toBeTrue();
});

it('updates the atomic inline index from CDK sorting and clears it on row exit', () => {
  const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
  component.components = [
    { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '4' }, validate: {}, properties: {} },
    { id: 'b', key: 'k_b', type: 'textfield', label: 'B', layout: { columns: '4' }, validate: {}, properties: {} },
  ] as any;
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  const row = component.dragDropRows[0];
  component.onPaletteDragStarted(paletteTextfield);

  component.onRowItemsDropEntered(row, { currentIndex: 2 } as any);
  component.onRowItemsDropSorted(row, { currentIndex: 1 } as any);
  expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 1, columns: '4' });

  component.onRowItemsDropExited(row);
  expect(component.paletteDropTarget()).toBeUndefined();
});

it('clears the palette target and item after the deferred drag-end cleanup', fakeAsync(() => {
  const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
  component.components = [
    { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
  ] as any;
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  component.onPaletteDragStarted(paletteTextfield);
  component.onRowItemsDropEntered(component.dragDropRows[0], { currentIndex: 1 } as any);

  component.onAnyDragEnded();
  tick(0);

  expect(component.paletteDropTarget()).toBeUndefined();
  expect(component.draggedPaletteItem()).toBeUndefined();
  expect(component.dragSource()).toBeUndefined();
}));
```

- [ ] **Step 3: Run the focused command and prove RED**

Run:

```powershell
npm --prefix versions/v19 run ng -- test sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false `
  --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts `
  --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder-layout.spec.ts
```

Expected: compilation fails because `paletteDropTarget`, `onRowItemsDropSorted`, and `shouldShowInlinePalettePlaceholder` do not exist. No production file changes before this RED evidence is recorded.

### Task 2: Implement one atomic palette target and target-driven drop placement

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html`
- Test: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts`

- [ ] **Step 1: Add CDK enter/sort types and the discriminated target type**

Extend the drag-drop import with `CdkDragEnter` and `CdkDragSortEvent`, then add:

```ts
type RowInsertionEdge = 'before' | 'after';

type PaletteDropTarget =
  | { kind: 'empty' }
  | { kind: 'inline'; rowId: string; index: number; columns: string }
  | { kind: 'edge'; rowId: string; edge: RowInsertionEdge };
```

Keep the existing `RowInsertionEdge` declaration only once.

- [ ] **Step 2: Add one authoritative target while preserving the emitted class API**

Keep the existing `rowInsertionEdge` and `inlineDropTargetRow` as deprecated, one-way compatibility mirrors because both are already emitted as public `WritableSignal` members in the package declaration. Rendering and mutation must never read them. Add the authoritative target and one private setter that updates all three values atomically:

```ts
readonly draggedPaletteItem = signal<FormBuilderComponent | undefined>(undefined);
readonly paletteDropTarget = signal<PaletteDropTarget | undefined>(undefined);
/** @deprecated Internal drag-preview compatibility mirror; use no application code. */
readonly rowInsertionEdge = signal<RowInsertionEdge>('after');
/** @deprecated Internal drag-preview compatibility mirror; use no application code. */
readonly inlineDropTargetRow = signal<DragDropRowItem | undefined>(undefined);

#setPaletteDropTarget = (target: PaletteDropTarget | undefined) => {
  this.paletteDropTarget.set(target);
  this.rowInsertionEdge.set(target?.kind === 'edge' ? target.edge : 'after');
  this.inlineDropTargetRow.set(
    target?.kind === 'inline' ? this.dragDropRows.find(row => row.id === target.rowId) : undefined
  );
};
```

After the implementation, `rg` must show no production read of either compatibility mirror outside `#setPaletteDropTarget`; their writable type remains available for declaration compatibility, but the atomic target is the sole visual/drop authority.

Update palette start and deferred cleanup:

```ts
onPaletteDragStarted = (item?: FormBuilderComponent) => {
  this.draggedPaletteItem.set(item);
  this.#setPaletteDropTarget(undefined);
  this.targetItem = undefined;
  this.lastDragPointer = undefined;
  this.dragSource.set('palette');
  this.onAnyDragStarted();
};

onAnyDragEnded = () => {
  setTimeout(() => {
    this.isAnyDragging.set(false);
    this.dragSource.set(undefined);
    this.draggedPaletteItem.set(undefined);
    this.#setPaletteDropTarget(undefined);
    this.lastDragPointer = undefined;
    this.targetItem = undefined;
    this.#ref.markForCheck();
  }, 0);
};
```

- [ ] **Step 3: Replace palette enter/exit predicates with atomic handlers**

```ts
shouldShowRowInsertionPlaceholder = (row: DragDropRowItem, edge?: RowInsertionEdge): boolean => {
  const target = this.paletteDropTarget();
  const resolvedEdge = edge ?? (target?.kind === 'edge' ? target.edge : 'after');
  return target?.kind === 'edge' && target.rowId === row.id && target.edge === resolvedEdge;
};

shouldShowInlinePalettePlaceholder = (row: DragDropRowItem, index: number): boolean => {
  const target = this.paletteDropTarget();
  return target?.kind === 'inline' && target.rowId === row.id && target.index === index;
};

isPaletteEmptyDropTarget = (): boolean => this.paletteDropTarget()?.kind === 'empty';

palettePlaceholderColumnsFor = (row?: DragDropRowItem): number => {
  const target = this.paletteDropTarget();
  return target?.kind === 'inline' && (!row || target.rowId === row.id) ? +target.columns : 12;
};

onRowItemsDropEntered = (row: DragDropRowItem, event?: CdkDragEnter<any[]>) => {
  const paletteItem = this.draggedPaletteItem();
  if (this.dragSource() !== 'palette' || !paletteItem || paletteItem.type === 'break' || this.isRowInlineDropLocked(row)) return;

  this.#setPaletteDropTarget({
    kind: 'inline',
    rowId: row.id,
    index: Math.max(0, Math.min(event?.currentIndex ?? row.items.length, row.items.length)),
    columns: `${this.#availableColumns(row)}`,
  });
  this.#ref.markForCheck();
};

onRowItemsDropSorted = (row: DragDropRowItem, event: CdkDragSortEvent<any[]>) => {
  const target = this.paletteDropTarget();
  if (this.dragSource() !== 'palette' || target?.kind !== 'inline' || target.rowId !== row.id) return;

  this.#setPaletteDropTarget({
    ...target,
    index: Math.max(0, Math.min(event.currentIndex, row.items.length)),
  });
  this.#ref.markForCheck();
};

onRowItemsDropExited = (row: DragDropRowItem) => {
  const target = this.paletteDropTarget();
  if (target?.kind === 'inline' && target.rowId === row.id) {
    this.#setPaletteDropTarget(undefined);
    this.#ref.markForCheck();
  }
};
```

In the existing horizontal row list, pass the CDK enter event and add the sort event now. The event remains optional in the public handler signature for emitted declaration compatibility, while all internal template calls provide it:

```diff
-                (cdkDropListEntered)="onRowItemsDropEntered(row)"
+                (cdkDropListEntered)="onRowItemsDropEntered(row, $event)"
+                (cdkDropListSorted)="onRowItemsDropSorted(row, $event)"
                 (cdkDropListExited)="onRowItemsDropExited(row)"
```

- [ ] **Step 4: Prevent `break` from entering horizontal lists**

Replace the palette branch in `canEnterRowDropList` with:

```ts
if (this.#isPaletteComponent(data)) {
  return data.type !== 'break' && this.#availableColumns(row) >= 2;
}
```

- [ ] **Step 5: Make palette mutation consume the atomic target**

Replace the palette branch in `drop()` with:

```ts
const draggedData = this.#draggedDataFromDropEvent(event);
if (this.#isPaletteComponent(draggedData)) {
  const placement = this.#paletteDropPlacement(draggedData);
  this.#setPaletteDropTarget(undefined);
  if (!placement) return;
  this.addComponent(draggedData, placement.index, placement.columns);
} else {
  const movedItem = event.previousContainer.data[event.previousIndex] as SdFormGenericComponent | SdFormGenericGroup;
  const targetRow = this.#rowForItems(event.container.data);
  if (targetRow && !canPlaceInRow(targetRow, movedItem, movedItem.id)) {
    this.#notifyService.warning(this.#i18n.t('core.component.form-builder.row-overflow'));
    return;
  }

  transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  this.#syncRowsToComponents();
}
```

Replace `#paletteDropPlacement` with:

```ts
#paletteDropPlacement = (item: FormBuilderComponent): { index: number; columns?: string } | undefined => {
  const target = this.paletteDropTarget();
  if (!target) return undefined;

  if (target.kind === 'empty') {
    return { index: 0, columns: item.type === 'break' ? undefined : '12' };
  }

  const row = this.dragDropRows.find(candidate => candidate.id === target.rowId);
  if (!row) return undefined;

  if (target.kind === 'inline') {
    return {
      index: this.#scopeIndexFromDrop(row.items, target.index) ?? this.#scope().length,
      columns: item.type === 'break' ? undefined : target.columns,
    };
  }

  return {
    index: target.edge === 'before' ? this.#scopeIndexBeforeRow(row) : this.#scopeIndexAfterRow(row),
    columns: item.type === 'break' ? undefined : '12',
  };
};
```

- [ ] **Step 6: Keep pointer movement compilable until the bounded resolver lands in Task 3**

Replace the current palette branch in `onAnyDragMoved` with an early return, while preserving existing canvas/row tracking:

```ts
onAnyDragMoved = (event: CdkDragMove<any>) => {
  this.lastDragPointer = event.pointerPosition;
  if (this.dragSource() === 'palette') return;

  const hit = this.#rowHitFromPointer(event.pointerPosition);
  if (hit?.row && this.targetItem !== hit.row) {
    this.targetItem = hit.row;
    this.#ref.markForCheck();
  }
};
```

This is an intentional intermediate state: Task 3 replaces it with the canvas-bounded palette resolver. It ensures the deprecated compatibility mirrors are not read as drag authorities between tasks.

- [ ] **Step 7: Migrate existing palette tests to the atomic target**

Update all five existing palette `drop()` tests so they call `onPaletteDragStarted(draggedItem)` and set the destination that the preview would have shown before invoking `drop()`. Insert these exact setup blocks immediately before the relevant `drop()` call.

For `keeps palette drops in the indicated row...`:

```ts
component.onPaletteDragStarted(paletteTextfield);
component.paletteDropTarget.set({ kind: 'inline', rowId: 'row-a', index: 1, columns: '6' });
```

For `uses the dragged palette data...`, change the loop header and add target setup:

```ts
for (const [index, draggedItem] of [chipCalendar, upload].entries()) {
  component.onPaletteDragStarted(draggedItem);
  if (index === 0) {
    component.paletteDropTarget.set({ kind: 'inline', rowId: 'row-a', index: 1, columns: '6' });
  } else {
    component.paletteDropTarget.set({ kind: 'edge', rowId: 'row-a', edge: 'after' });
  }

  component.drop({
    previousContainer: { data: advancedPaletteItems },
    container: { data: index === 0 ? component.dragDropRows[0].items : component.dragDropRows },
    previousIndex: 0,
    currentIndex: index === 0 ? 1 : 0,
    isPointerOverContainer: true,
    item: {
      data: draggedItem,
      element: { nativeElement: { id: '' } },
    },
  } as any);
}
```

For `places palette drops after a full row...`:

```ts
component.onPaletteDragStarted(paletteTextfield);
component.paletteDropTarget.set({ kind: 'edge', rowId: 'row-a', edge: 'after' });
```

For `uses the hovered row as the insertion anchor...`:

```ts
component.onPaletteDragStarted(paletteTextfield);
component.paletteDropTarget.set({ kind: 'edge', rowId: component.dragDropRows[0].id, edge: 'after' });
```

For `uses the hovered row edge...`:

```ts
component.onPaletteDragStarted(paletteTextfield);
component.paletteDropTarget.set({ kind: 'edge', rowId: component.dragDropRows[1].id, edge: 'before' });
```

Replace the three old split-state placeholder tests with these three atomic tests. Add the helper inside the existing `describe` block:

```ts
function seedPaletteRows(): void {
  component.components = [
    { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
    { id: 'b', key: 'k_b', type: 'textfield', label: 'B', layout: { columns: '6' }, validate: {}, properties: {} },
    { id: 'c', key: 'k_c', type: 'textfield', label: 'C', layout: { columns: '6' }, validate: {}, properties: {} },
  ] as any;
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  component.onPaletteDragStarted(component.formBuilderComponents.find(item => item.type === 'textfield')!);
}

it('shows an edge placeholder for only the atomic target row', () => {
  seedPaletteRows();
  component.paletteDropTarget.set({ kind: 'edge', rowId: component.dragDropRows[0].id, edge: 'after' });

  expect(component.shouldShowRowInsertionPlaceholder(component.dragDropRows[0], 'after')).toBeTrue();
  expect(component.shouldShowRowInsertionPlaceholder(component.dragDropRows[1], 'after')).toBeFalse();

  component.paletteDropTarget.set({ kind: 'edge', rowId: component.dragDropRows[1].id, edge: 'after' });
  expect(component.shouldShowRowInsertionPlaceholder(component.dragDropRows[0], 'after')).toBeFalse();
  expect(component.shouldShowRowInsertionPlaceholder(component.dragDropRows[1], 'after')).toBeTrue();
});

it('moves the atomic edge target before and after the hovered row', () => {
  seedPaletteRows();
  const row = component.dragDropRows[1];

  component.paletteDropTarget.set({ kind: 'edge', rowId: row.id, edge: 'before' });
  expect(component.shouldShowRowInsertionPlaceholder(row, 'before')).toBeTrue();
  expect(component.shouldShowRowInsertionPlaceholder(row, 'after')).toBeFalse();

  component.paletteDropTarget.set({ kind: 'edge', rowId: row.id, edge: 'after' });
  expect(component.shouldShowRowInsertionPlaceholder(row, 'before')).toBeFalse();
  expect(component.shouldShowRowInsertionPlaceholder(row, 'after')).toBeTrue();
});

it('replaces an edge target with inline state and clears it on row exit', () => {
  seedPaletteRows();
  const row = component.dragDropRows[1];
  component.paletteDropTarget.set({ kind: 'edge', rowId: row.id, edge: 'before' });

  component.onRowItemsDropEntered(row, { currentIndex: 0 } as any);
  expect(component.shouldShowRowInsertionPlaceholder(row, 'before')).toBeFalse();
  expect(component.shouldShowInlinePalettePlaceholder(row, 0)).toBeTrue();

  component.onRowItemsDropExited(row);
  expect(component.paletteDropTarget()).toBeUndefined();
});
```

Do not retain direct references to `rowInsertionEdge` or `inlineDropTargetRow` anywhere in the spec.

- [ ] **Step 8: Run focused tests and prove GREEN**

Run the Task 1 command.

Expected: `TOTAL: 32 SUCCESS` and exit code 0.

- [ ] **Step 9: Commit the atomic state slice**

Run this step only after the release-branch commit guard in Source Contract has been explicitly approved:

```powershell
git add -- versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts
git commit -m "fix(form-generic): track one palette drop target"
```

### Task 3: Render one palette placeholder and clear stale pointer targets

**Files:**

- Create: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss`

- [ ] **Step 1: Create rendered RED tests for one custom palette placeholder**

Create the integration spec with this setup and four tests:

```ts
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLicenseService } from '@sdcorejs/angular/services/license';
import { buildFormBuilderRows } from './form-builder-layout';
import { SdFormBuilder } from './form-builder.component';

function field(id: string, columns: string): any {
  return { id, key: `key_${id}`, type: 'textfield', label: id, layout: { columns }, validate: {}, properties: {} };
}

describe('SdFormBuilder drag/drop placeholders', () => {
  let fixture: ComponentFixture<SdFormBuilder>;
  let component: SdFormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdFormBuilder, NoopAnimationsModule],
      providers: [{ provide: SdLicenseService, useValue: { enforceLicense: () => {} } }],
    });
    fixture = TestBed.createComponent(SdFormBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.components = [field('a', '6'), field('b', '8'), field('c', '6')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();
  });

  function palettePlaceholders(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll<HTMLElement>('.fb-palette-drop-placeholder')).filter(element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  }

  it('replaces the rendered inline palette placeholder instead of retaining the first row preview', () => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.onPaletteDragStarted(paletteTextfield);
    component.onRowItemsDropEntered(component.dragDropRows[0], { currentIndex: 1 } as any);
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);
    expect(palettePlaceholders()[0].closest('.fb-row')?.id).toBe('row-a');

    component.onRowItemsDropEntered(component.dragDropRows[1], { currentIndex: 0 } as any);
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);
    expect(palettePlaceholders()[0].closest('.fb-row')?.id).toBe('row-b');
  });

  it('renders and consumes one empty-canvas target', () => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.components = [];
    component.dragDropRows = [];
    component.onPaletteDragStarted(paletteTextfield);
    component.paletteDropTarget.set({ kind: 'empty' });
    fixture.detectChanges();

    expect(palettePlaceholders().length).toBe(1);
    expect(palettePlaceholders()[0].classList).toContain('fb-row-insert-placeholder');

    component.drop({
      previousContainer: { data: [paletteTextfield] },
      container: { data: component.dragDropRows },
      previousIndex: 0,
      currentIndex: 0,
      isPointerOverContainer: true,
      item: { data: paletteTextfield, element: { nativeElement: { id: '' } } },
    } as any);
    fixture.detectChanges();

    expect(component.components.length).toBe(1);
    expect(component.components[0].layout?.columns).toBe('12');
    expect(component.paletteDropTarget()).toBeUndefined();
  });

  it('clears the palette preview immediately when the pointer leaves the canvas', () => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    const canvas = fixture.nativeElement.querySelector<HTMLElement>('#frmComponent')!;
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 500,
      bottom: 500,
      width: 500,
      height: 500,
      toJSON: () => ({}),
    });
    component.onPaletteDragStarted(paletteTextfield);
    component.paletteDropTarget.set({ kind: 'inline', rowId: component.dragDropRows[0].id, index: 1, columns: '6' });
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);

    component.onAnyDragMoved({ pointerPosition: { x: 501, y: 501 } } as any);
    fixture.detectChanges();

    expect(component.paletteDropTarget()).toBeUndefined();
    expect(palettePlaceholders().length).toBe(0);
  });

  it('removes every custom palette placeholder after drag end', fakeAsync(() => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.onPaletteDragStarted(paletteTextfield);
    component.onRowItemsDropEntered(component.dragDropRows[0], { currentIndex: 1 } as any);
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);

    component.onAnyDragEnded();
    tick(0);
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(0);
  }));
});
```

- [ ] **Step 2: Run all three form-builder specs and prove RED**

Run:

```powershell
npm --prefix versions/v19 run ng -- test sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false `
  --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts `
  --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder-layout.spec.ts `
  --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts
```

Expected: the four new rendered tests fail because `.fb-palette-drop-placeholder` and bounded palette pointer cleanup are not implemented.

- [ ] **Step 3: Add a bounded canvas target and pointer resolver**

Declare the view child:

```ts
readonly #canvasDropZone = viewChild<ElementRef<HTMLElement>>('canvasDropZone');
```

Replace `onAnyDragMoved` and add the pointer helpers:

```ts
onAnyDragMoved = (event: CdkDragMove<any>) => {
  this.lastDragPointer = event.pointerPosition;
  if (this.dragSource() === 'palette') {
    this.#updatePaletteDropTargetFromPointer(event.pointerPosition);
    return;
  }

  if (!this.#isPointerInsideCanvas(event.pointerPosition)) {
    if (this.targetItem) {
      this.targetItem = undefined;
      this.#ref.markForCheck();
    }
    return;
  }

  const hit = this.#rowHitFromPointer(event.pointerPosition);
  if (hit?.row && this.targetItem !== hit.row) {
    this.targetItem = hit.row;
    this.#ref.markForCheck();
  }
};

#isPointerInsideCanvas = (pointer: { x: number; y: number }): boolean => {
  const rect = this.#canvasDropZone()?.nativeElement.getBoundingClientRect();
  return !!rect && pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
};

#updatePaletteDropTargetFromPointer = (pointer: { x: number; y: number }) => {
  if (!this.#isPointerInsideCanvas(pointer)) {
    this.#setPaletteDropTarget(undefined);
    this.#ref.markForCheck();
    return;
  }

  if (!this.dragDropRows.length) {
    this.#setPaletteDropTarget({ kind: 'empty' });
    this.#ref.markForCheck();
    return;
  }

  const hit = this.#rowHitFromPointer(pointer);
  if (!hit) {
    this.#setPaletteDropTarget(undefined);
    this.#ref.markForCheck();
    return;
  }

  const element = document.elementFromPoint(pointer.x, pointer.y);
  const rowItems = element?.closest('.fb-row__items');
  const rowElement = rowItems?.closest('.fb-row') as HTMLElement | null;
  const paletteItem = this.draggedPaletteItem();
  if (rowElement?.id === hit.row.id && paletteItem?.type !== 'break' && !this.isRowInlineDropLocked(hit.row)) {
    const current = this.paletteDropTarget();
    if (current?.kind === 'inline' && current.rowId === hit.row.id) return;
    this.#setPaletteDropTarget({
      kind: 'inline',
      rowId: hit.row.id,
      index: hit.row.items.length,
      columns: `${this.#availableColumns(hit.row)}`,
    });
  } else {
    this.#setPaletteDropTarget({ kind: 'edge', rowId: hit.row.id, edge: hit.edge });
  }
  this.#ref.markForCheck();
};
```

- [ ] **Step 4: Render the custom target in the template**

Add `#canvasDropZone` to `.fb-canvas__body`, so the hit region remains non-zero when the canvas has no rows:

```diff
-    <div class="fb-canvas__body" [class.is-preview]="isPreview()" id="frmComponent">
+    <div #canvasDropZone class="fb-canvas__body" [class.is-preview]="isPreview()" id="frmComponent">
```

Do not attach the reference only to the vertical row list; that list can have a zero-height rectangle on an empty canvas. Extend the empty illustration guard:

```diff
-        @if (!dragDropRows.length) {
+        @if (!dragDropRows.length && !isPaletteEmptyDropTarget()) {
```

Insert the empty target immediately inside the outer vertical `cdkDropList`, before its existing `@for (row...)`:

```diff
           aria-hidden="true">
+          @if (isPaletteEmptyDropTarget()) {
+            <div
+              class="fb-row-insert-placeholder fb-palette-drop-placeholder"
+              [style.--fb-placeholder-columns]="12"
+              aria-hidden="true">
+              <ng-container
+                *ngTemplateOutlet="dropPlaceholderTemplate; context: { $implicit: draggedPaletteItem() }"></ng-container>
+            </div>
+          }
           @for (row of dragDropRows; track row.id) {
```

Add `fb-palette-drop-placeholder` to both the existing before-row and after-row custom placeholders:

```diff
-                class="fb-row-insert-placeholder"
+                class="fb-row-insert-placeholder fb-palette-drop-placeholder"
```

Inside `.fb-row__items`, retain the enter/sort/exit bindings added in Task 2. Immediately after each `@for` opening, render the target index before the current item:

```diff
                 @for (item of row.items; track item.id; let i = $index) {
+                  @if (shouldShowInlinePalettePlaceholder(row, i)) {
+                    <div
+                      class="fb-drop-placeholder fb-palette-drop-placeholder"
+                      [style.--fb-placeholder-columns]="palettePlaceholderColumnsFor(row)"
+                      aria-hidden="true">
+                      <ng-container
+                        *ngTemplateOutlet="dropPlaceholderTemplate; context: { $implicit: draggedPaletteItem() }"></ng-container>
+                    </div>
+                  }
```

Immediately after that `@for` closes, add the end position:

```html
@if (shouldShowInlinePalettePlaceholder(row, row.items.length)) {
<div
  class="fb-drop-placeholder fb-palette-drop-placeholder"
  [style.--fb-placeholder-columns]="palettePlaceholderColumnsFor(row)"
  aria-hidden="true">
  <ng-container *ngTemplateOutlet="dropPlaceholderTemplate; context: { $implicit: draggedPaletteItem() }"></ng-container>
</div>
}
```

Replace the palette item's visible CDK placeholder template with a mechanics-only node:

```html
<div *cdkDragPlaceholder class="fb-palette-native-placeholder" aria-hidden="true"></div>
```

- [ ] **Step 5: Keep a measurable but invisible palette-native sentinel**

Add:

```scss
.fb-palette-native-placeholder {
  display: block !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 1px !important;
  min-width: 1px !important;
  height: 1px !important;
  min-height: 1px !important;
  flex: 0 0 1px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}
```

The non-zero sentinel keeps `CdkDrag.getVisibleElement().getBoundingClientRect()` measurable for CDK enter/sort calculations without painting a second preview or reserving a second field-sized gap. Do not use `display: none`, zero width, or zero height.

Do not remove the existing CDK transform override in this task; Task 4 proves and fixes internal field/row sorting separately.

- [ ] **Step 6: Run the three focused specs and prove GREEN**

Run the Task 3 command.

Expected: `TOTAL: 36 SUCCESS` and exit code 0.

- [ ] **Step 7: Commit the single palette-preview slice**

Run this step only after the release-branch commit guard in Source Contract has been explicitly approved:

```powershell
git add -- versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts
git commit -m "fix(form-generic): render one palette drop preview"
```

### Task 4: Restore live CDK placeholder movement for palette, field, and row drags

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss`

- [ ] **Step 1: Add mouse-drag helpers to the integration spec**

Insert these helpers inside the existing `describe('SdFormBuilder drag/drop placeholders', ...)` block, immediately after `palettePlaceholders()`. Do not append them after the describe's closing `});`, because they intentionally capture the describe-local `fixture`.

```ts
function center(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function dispatchMouse(target: EventTarget, type: string, point: { x: number; y: number }, buttons: number): void {
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: point.x,
      clientY: point.y,
      button: 0,
      buttons,
    })
  );
}

function startMouseDrag(source: Element): void {
  const start = center(source);
  dispatchMouse(source, 'mousedown', start, 1);
  dispatchMouse(document, 'mousemove', { x: start.x + 12, y: start.y + 12 }, 1);
  tick(20);
}

function moveMouseTo(element: Element): void {
  dispatchMouse(document, 'mousemove', center(element), 1);
  tick(20);
  fixture.detectChanges();
}

function moveMouseToPoint(point: { x: number; y: number }): void {
  dispatchMouse(document, 'mousemove', point, 1);
  tick(20);
  fixture.detectChanges();
}

function endMouseDrag(element: Element): void {
  dispatchMouse(document, 'mouseup', center(element), 0);
  tick(0);
  fixture.detectChanges();
}

function endMouseDragAtPoint(point: { x: number; y: number }): void {
  dispatchMouse(document, 'mouseup', point, 0);
  tick(0);
  fixture.detectChanges();
}

function visibleCdkPlaceholders(): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll<HTMLElement>('.cdk-drag-placeholder')).filter(element => {
    const style = getComputedStyle(element);
    return (
      !element.classList.contains('fb-palette-native-placeholder') &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  });
}

function visibleDropPlaceholders(): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll<HTMLElement>('.fb-palette-drop-placeholder, .cdk-drag-placeholder')).filter(
    element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }
  );
}

function placeholderPose(element: HTMLElement): string {
  const rect = element.getBoundingClientRect();
  return `${Math.round(rect.left)}:${Math.round(rect.top)}:${getComputedStyle(element).transform}`;
}
```

- [ ] **Step 2: Add real palette mouse-drag tests**

Insert this and the remaining Task 4 tests inside the same describe block, before its final closing `});`:

```ts
it('moves one palette preview from the first row to the second and drops once', fakeAsync(() => {
  component.components = [field('a', '4'), field('b', '4'), field('c', '8')];
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  fixture.detectChanges();
  const paletteItem = fixture.nativeElement.querySelector<HTMLElement>('.fb-palette-item')!;
  const firstRowItems = fixture.nativeElement.querySelector<HTMLElement>('#row-a .fb-row__items')!;
  const secondRowItems = fixture.nativeElement.querySelector<HTMLElement>('#row-c .fb-row__items')!;
  const firstRect = firstRowItems.getBoundingClientRect();
  const existingIds = new Set(component.components.map(item => item.id));

  startMouseDrag(paletteItem);
  moveMouseToPoint({ x: firstRect.left + 2, y: firstRect.top + firstRect.height / 2 });
  expect(palettePlaceholders().length).toBe(1);
  expect(visibleDropPlaceholders().length).toBe(1);
  const nativeSentinel = fixture.nativeElement.querySelector<HTMLElement>('.fb-palette-native-placeholder.cdk-drag-placeholder')!;
  const sentinelRect = nativeSentinel.getBoundingClientRect();
  expect(sentinelRect.width).toBeGreaterThan(0);
  expect(sentinelRect.height).toBeGreaterThan(0);
  expect(getComputedStyle(nativeSentinel).visibility).toBe('hidden');
  expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 0, columns: '4' });

  moveMouseToPoint({ x: firstRect.right - 2, y: firstRect.top + firstRect.height / 2 });
  expect(palettePlaceholders().length).toBe(1);
  expect(visibleDropPlaceholders().length).toBe(1);
  expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 2, columns: '4' });

  moveMouseTo(secondRowItems);
  expect(palettePlaceholders().length).toBe(1);
  expect(visibleDropPlaceholders().length).toBe(1);
  const target = component.paletteDropTarget();
  expect(target?.kind).toBe('inline');
  if (target?.kind !== 'inline') throw new Error('Expected the latest palette target to be inline.');
  expect(target.rowId).toBe('row-c');
  expect(target.columns).toBe('4');
  const targetRow = component.dragDropRows.find(row => row.id === target.rowId)!;
  const anchor = targetRow.items[target.index] ?? targetRow.items[targetRow.items.length - 1];
  if (!anchor) throw new Error('Expected the target row to contain an anchor item.');
  const anchorIndex = component.components.findIndex(item => item.id === anchor.id);
  const expectedIndex = target.index >= targetRow.items.length ? anchorIndex + 1 : anchorIndex;

  endMouseDrag(secondRowItems);
  const createdIndex = component.components.findIndex(item => !existingIds.has(item.id));
  const created = component.components[createdIndex];
  if (!created) throw new Error('Expected exactly one palette-created component.');
  expect(createdIndex).toBe(expectedIndex);
  expect(created.type).toBe('textfield');
  expect(created.layout?.columns).toBe('4');
  expect(palettePlaceholders().length).toBe(0);
  expect(visibleDropPlaceholders().length).toBe(0);
}));

it('drags a palette field into an empty canvas through the real CDK container', fakeAsync(() => {
  component.components = [];
  component.dragDropRows = [];
  fixture.detectChanges();
  const paletteItem = fixture.nativeElement.querySelector<HTMLElement>('.fb-palette-item')!;
  const canvas = fixture.nativeElement.querySelector<HTMLElement>('#frmComponent')!;

  startMouseDrag(paletteItem);
  moveMouseTo(canvas);
  expect(component.paletteDropTarget()).toEqual({ kind: 'empty' });
  expect(visibleDropPlaceholders().length).toBe(1);
  moveMouseTo(canvas);
  expect(visibleDropPlaceholders().length).toBe(1);

  endMouseDrag(canvas);
  expect(component.components.length).toBe(1);
  expect(component.components[0].layout?.columns).toBe('12');
  expect(visibleDropPlaceholders().length).toBe(0);
}));
```

- [ ] **Step 3: Add a real existing-field cross-row test**

```ts
it('lets the CDK placeholder follow an existing field into a row with capacity', fakeAsync(() => {
  component.components = [field('a', '4'), field('b', '4'), field('d', '6'), field('c', '4')];
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  fixture.detectChanges();
  const source = fixture.nativeElement.querySelector<HTMLElement>('#c')!;
  const target = fixture.nativeElement.querySelector<HTMLElement>('#row-a .fb-row__items')!;

  startMouseDrag(source);
  fixture.detectChanges();
  expect(visibleCdkPlaceholders().length).toBe(1);
  expect(visibleCdkPlaceholders()[0].closest('.fb-row')?.id).toBe('row-d');

  moveMouseTo(target);
  expect(visibleCdkPlaceholders().length).toBe(1);
  expect(visibleCdkPlaceholders()[0].closest('.fb-row')?.id).toBe('row-a');

  endMouseDrag(target);
  expect(component.components.map(item => item.id)).toEqual(['a', 'c', 'b', 'd']);
  expect(visibleCdkPlaceholders().length).toBe(0);
}));
```

- [ ] **Step 4: Add a real complete-row vertical test and CSS contract assertion**

```ts
it('lets the CDK row placeholder move down and back up before the final drop', fakeAsync(() => {
  component.components = [field('a', '12'), field('b', '12'), field('c', '12')];
  component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
  fixture.detectChanges();
  const rows = fixture.nativeElement.querySelectorAll<HTMLElement>('.fb-row');
  const handle = rows[0].querySelector<HTMLElement>('.fb-row__drag')!;

  startMouseDrag(handle);
  moveMouseTo(rows[2]);
  expect(visibleCdkPlaceholders().length).toBe(1);
  const downPose = placeholderPose(visibleCdkPlaceholders()[0]);
  const middleRow = fixture.nativeElement.querySelector<HTMLElement>('#row-b')!;
  const middleRect = middleRow.getBoundingClientRect();
  const middleDropPoint = { x: middleRect.left + middleRect.width / 2, y: middleRect.bottom - 2 };
  moveMouseToPoint(middleDropPoint);
  expect(visibleCdkPlaceholders().length).toBe(1);
  const upPose = placeholderPose(visibleCdkPlaceholders()[0]);
  expect(upPose).not.toBe(downPose);

  endMouseDragAtPoint(middleDropPoint);
  expect(visibleCdkPlaceholders().length).toBe(0);
  expect(component.components.map(item => item.id)).toEqual(['b', 'a', 'c']);
}));

it('does not override the inline transform used by CDK sorting', () => {
  const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');
  expect(styles).not.toMatch(/\.cdk-drag-placeholder\.fb-drop-placeholder[\s\S]*?transform:\s*none\s*!important/);
});
```

- [ ] **Step 5: Run the three focused specs and prove RED**

Run the Task 3 command.

Expected: the CSS contract and complete-row placeholder pose assertion fail while the stylesheet forces `transform: none !important`; the palette and field tests must still complete real CDK enter/sort/drop mechanics rather than fail during setup.

- [ ] **Step 6: Remove only the transform override from the placeholder rule**

Change this rule:

```scss
opacity: 1 !important;
animation: none !important;
position: relative;
```

The resulting rule must not declare `transform` for `.cdk-drag-placeholder.fb-drop-placeholder` or `.fb-drop-placeholder`.

- [ ] **Step 7: Re-run the focused command and prove GREEN**

Run the Task 3 command.

Expected: `TOTAL: 41 SUCCESS` and exit code 0. Require zero failures and confirm all twelve new regression cases by name.

If any pointer test remains red, stop this task and use `sdcorejs-debug` to capture the active `paletteDropTarget`, `targetItem`, CDK container, rendered placeholder count, and event order before changing code. Do not weaken assertions or add timing sleeps.

- [ ] **Step 8: Commit live placeholder movement**

Run this step only after the release-branch commit guard in Source Contract has been explicitly approved:

```powershell
git add -- versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts
git commit -m "fix(form-generic): follow live drag placeholder positions"
```

### Task 5: Run the Angular 19 regression gate

**Files:**

- Verify only; do not edit unrelated failures.

- [ ] **Step 1: Run focused form-builder tests without coverage thresholds**

Run the Task 3 command.

Expected: 41 focused assertions pass with zero failures.

- [ ] **Step 2: Run the full Core test suite with standard coverage**

```powershell
npm --prefix versions/v19 run test:ci
```

Expected: exit code 0, no failing specs, and the global coverage thresholds pass. The previous 109-test baseline plus twelve new cases yields 121 successful tests.

- [ ] **Step 3: Run Angular 19 lint and builds**

```powershell
npm --prefix versions/v19 run lint
npm --prefix versions/v19 run build
npm --prefix versions/v19 run build:showcase
```

Expected: all three commands exit 0. Treat a stale `dist/sdcorejs-angular` resolution failure using the existing project memory: rebuild the verified generated output, then rerun the same test; do not change unrelated source exports.

Verify the two compatibility members remain writable in the emitted declaration:

```powershell
rg -n "rowInsertionEdge:.*WritableSignal|inlineDropTargetRow:.*WritableSignal" `
  versions/v19/dist/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.d.ts
rg -n "shouldShowRowInsertionPlaceholder:.*edge\?|onRowItemsDropEntered:.*event\?" `
  versions/v19/dist/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.d.ts
$source = Get-Content -Raw -Encoding utf8 `
  versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts
if ($source -match 'rowInsertionEdge\(\)|inlineDropTargetRow\(\)') {
  throw 'Deprecated compatibility signal is still used as a drag authority.'
}
```

Expected: one `WritableSignal` declaration for each existing member, optional parameters remain in both existing handler declarations, and the source-authority guard throws no exception.

- [ ] **Step 4: Inspect the exact v19 diff**

```powershell
git diff --check 75db98a -- versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder
git diff --stat 75db98a -- versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder
```

Expected: only the five planned form-builder files differ; no trailing whitespace, focused/skipped tests, console calls, or debugger statements are introduced.

### Task 6: Roll out the verified fix to Angular 20 and 21

**Files:**

- Mirror: `versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts`
- Mirror: `versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html`
- Mirror: `versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss`
- Mirror: `versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts`
- Create mirror: `versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts`
- Mirror the same five paths under `versions/v21`.
- Modify only when produced by sync: `versions/v19/SYNC-STATUS.md`, `versions/v20/SYNC-STATUS.md`, `versions/v21/SYNC-STATUS.md`.

- [ ] **Step 1: Run root rollout and parity guard**

```powershell
npm run sync
npm run check:sync
```

Expected: sync exits 0 and the parity guard reports that v20 and v21 match v19.

- [ ] **Step 2: Run the same focused regressions on v20 and v21**

```powershell
foreach ($version in @('v20', 'v21')) {
  npm --prefix "versions/$version" run ng -- test sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false `
    --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts `
    --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder-layout.spec.ts `
    --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: both workspaces report 41 focused assertions with zero failures.

- [ ] **Step 3: Run release lint and derived builds**

```powershell
npm run lint:release
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Prove the five mirrored files are byte-identical**

```powershell
$suffixes = @(
  'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts',
  'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html',
  'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss',
  'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts',
  'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.drag-drop.integration.spec.ts'
)
foreach ($suffix in $suffixes) {
  $hashes = @('v19', 'v20', 'v21') | ForEach-Object {
    (Get-FileHash -Algorithm SHA256 "versions/$_/$suffix").Hash
  }
  if (@($hashes | Select-Object -Unique).Count -ne 1) {
    throw "Version mismatch: $suffix"
  }
}
```

Expected: no exception.

- [ ] **Step 5: Commit the mirrored rollout with explicit paths**

Run this step only after the release-branch commit guard in Source Contract has been explicitly approved. Stage only the ten v20/v21 form-builder files and sync-status files actually changed. Verify `git diff --cached --name-only` before committing.

```powershell
git commit -m "chore(angular): sync form-builder drag fix"
```

## Acceptance Evidence Map

- AC-001/AC-002: rendered and real palette tests assert one preview while moving from row A to row B.
- AC-003: the bounded-pointer test moves outside `#frmComponent` and asserts immediate target/DOM cleanup.
- AC-004: atomic drop unit tests and the real palette drop test assert one creation at the latest target.
- AC-005: the rendered empty-canvas mutation test plus the migrated full-row before/after tests cover empty, inline-locked, and both edge placements.
- AC-006: the existing-field cross-row mouse test asserts one CDK placeholder and final schema order.
- AC-007: the complete-row down/back-up mouse test asserts one CDK placeholder and final row order.
- AC-008: drag-end, row-exit, rendered cleanup, and mouseup tests assert no retained preview.
- AC-009: the full v19 suite, declaration compatibility checks, lint, library build, and Showcase build protect capacity/schema/group/resize/public behavior.
- AC-010: root parity, v20/v21 focused tests, builds, and SHA-256 equality prove rollout.

### Task 7: Final acceptance audit and handoff

**Files:**

- Verify the approved design and plan against the final diff.
- Update: `.sdcorejs/tasks/current-session.md` only as an unstaged workflow checkpoint unless the user explicitly includes it in a later commit.

- [ ] **Step 1: Re-run the final automated gate from the final working tree**

```powershell
npm run check:sync
npm run lint:release
npm --prefix versions/v19 run test:ci
npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
npm --prefix versions/v19 run build:showcase
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Audit acceptance criteria and staged hygiene**

Confirm all ten design acceptance criteria against tests and final source. Then run:

```powershell
git status --short
git diff --cached --check
git diff --cached --name-only
```

Expected: no accidental `.superpowers/**`, `.sdcorejs/summary.md`, generated Showcase EOL-only files, secrets, conflict markers, focused/skipped tests, console additions, or debugger statements are staged.

- [ ] **Step 3: Perform the UI check available in this environment**

Start Showcase only for the duration of the check and open:

```text
http://127.0.0.1:4300/v/latest/components/generic/examples
```

Load the interaction-gated live preview and repeat palette, field, and row drag flows with the seed and stress fixture. At every pointer move, query visible `.fb-palette-drop-placeholder` and `.cdk-drag-placeholder` nodes and require one active placeholder. After mouseup, require zero placeholder/preview nodes.

If `agent.browsers.list()` is empty, stop the server, record the browser smoke as unavailable, and rely on the fresh ChromeHeadless pointer integration tests. Do not claim a visual browser pass.

- [ ] **Step 4: Prepare the completion report without pushing**

Report:

- the root cause and the single-visible-placeholder model;
- focused/full test counts, lint, build, sync, and UI-check status;
- exact commits created during execution;
- any intentionally uncommitted workflow or unrelated paths;
- that no push, tag, package publish, or deployment occurred unless separately authorized.

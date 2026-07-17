# SdTable Disabled Select-All Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `subagent-driven-development` (recommended) or `executing-plans` to execute this plan task-by-task. Track every checkbox and apply TDD RED → GREEN in each repository before copying production behavior.

**Goal:** Ensure the header select-all control never selects rows whose selector checkbox is disabled, in both the legacy Angular repository and the versioned SDCoreJS Angular repository.

**Architecture:** Make `SdSelectionDisabledPipe` the single writer of `row.meta.selector.selectable` on every return path. Keep `SdTable.onSelectAll()` as the consumer of that eligibility flag, and make `resolveSelectAllState()` calculate the header state from selectable rows only. Implement first in the Angular 19 source of truth, roll it to Angular 20/21 with the repository sync command, then repeat RED → GREEN in the independent legacy repository.

**Tech Stack:** Angular standalone components, signals, Material checkbox/table, Jasmine, Karma, TypeScript, PowerShell rollout scripts.

**Version-control boundary:** Do not commit, push, reset, or discard files while executing this plan unless the user separately authorizes it. Preserve the existing unrelated form-builder work and all pre-existing dirty files.

---

### Task 0: Capture the dirty-worktree baseline before any implementation edit

- [ ] **Step 1: Record every tracked and untracked path in both repositories**

Run before adding tests:

```powershell
git -C C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular status --porcelain=v1 -uall
git -C C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular diff --binary -- .sdcorejs .superpowers versions
git -C C:\Users\Admin\Documents\lib-core-angular status --porcelain=v1 -uall
git -C C:\Users\Admin\Documents\lib-core-angular diff --binary -- vn-angular
```

Keep the output in the execution log. In particular, record the existing `.sdcorejs`, `.superpowers`, and generated showcase entries. Before `npm run sync`, refuse to run the mirror if v20/v21 contains a content-dirty or untracked path under a mirrored destination outside the planned set. After sync, compare status and content diffs and stop/report if a path outside this plan gains a content change; do not automatically reset, discard, or reconstruct it from the log. This guard is required because the rollout script mirrors directories and `git diff` alone does not report untracked files.

---

### Task 1: Add RED regressions to the Angular 19 source of truth

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/table/src/pipes/selection-disabled.pipe.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/table/src/services/table-selection/table-selection.util.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`

- [ ] **Step 1: Add the action-aware disabled-row pipe regression**

Add this import to `selection-disabled.pipe.spec.ts`:

```typescript
import { Utilities } from '@sdcorejs/utils/fns';
```

Add this test inside `describe('SdSelectionDisabledPipe', ...)`:

```typescript
it('marks an action-enabled row non-selectable when the disabled predicate matches', () => {
  const action = { title: 'Process', click: () => undefined };
  const disabledRow = row(2);
  disabledRow.meta.selector!.actions = [Utilities.hash(action)];
  const selector: SdTableOptionSelector<Row> = {
    actions: [action],
    disabled: current => current?.id === 2,
  };

  const result = pipe.transform([], disabledRow, selector);

  expect(result).toBeTrue();
  expect(disabledRow.meta.selector!.selectable).toBeFalse();
});
```

This reproduces the missing assignment in the `actions.length > 0` branch. The rendered checkbox is disabled today, but `selectable` incorrectly remains `true`.

- [ ] **Step 2: Add select-all header-state regressions**

Add these tests inside `describe('table-selection.util', ...)`:

```typescript
it('ignores non-selectable rows when resolving select-all state', () => {
  const selectable = item({ id: 1, name: 'selectable' });
  const disabled = item({ id: 2, name: 'disabled' });
  selectable.meta.selector!.isSelected = true;
  disabled.meta.selector!.selectable = false;

  expect(resolveSelectAllState([selectable, disabled])).toBeTrue();
});

it('does not report select-all when no row is selectable', () => {
  const disabled = item({ id: 1, name: 'disabled' });
  disabled.meta.selector!.selectable = false;

  expect(resolveSelectAllState([disabled])).toBeFalse();
});
```

- [ ] **Step 3: Add the component-level select-all regression**

Append this focused describe block to `table.component.spec.ts`:

```typescript
describe('Select all with disabled rows', () => {
  interface Row {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="tableOption()"></sd-table>`,
  })
  class HostComponent {
    readonly bulkAction = { title: 'Process', click: () => undefined };
    readonly onSelectAll = jasmine.createSpy('onSelectAll');
    readonly tableOption = signal<SdTableOption<Row>>({
      type: 'local',
      items: () => [
        { id: 1, name: 'Enabled' },
        { id: 2, name: 'Disabled' },
      ],
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
      selector: {
        visible: true,
        actions: [this.bulkAction],
        disabled: row => row?.id === 2,
        onSelectAll: this.onSelectAll,
      },
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('selects and emits only rows whose checkbox is enabled', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    const rows = table.items();

    expect(rows.length).toBe(2);
    expect(rows[0].meta.selector!.selectable).toBeTrue();
    expect(rows[1].meta.selector!.selectable).toBeFalse();

    table.isSelectAll.set(true);
    table.onSelectAll();

    expect(rows[0].meta.selector!.isSelected).toBeTrue();
    expect(rows[1].meta.selector!.isSelected).toBeFalse();
    expect(host.onSelectAll).toHaveBeenCalledOnceWith([rows[0].data]);
  }));

  it('reports select-all when every selectable row is default-selected', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.tableOption.update(option => ({
      ...option,
      selector: {
        ...option.selector!,
        defaultSelected: row => row.id === 1,
      },
    }));
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;

    expect(table.items()[0].meta.selector!.isSelected).toBeTrue();
    expect(table.items()[1].meta.selector!.selectable).toBeFalse();
    expect(table.isSelectAll()).toBeTrue();
  }));
});
```

The two stabilization turns match the proven table test setup on Angular 19/20/21. Do not set `selectable` manually because the integration regressions must execute the pipes through the rendered template.

- [ ] **Step 4: Run the focused Angular 19 tests and confirm RED**

Run from `C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular\versions\v19`:

```powershell
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/table/src/pipes/selection-disabled.pipe.spec.ts' --include='projects/sdcorejs-angular/components/table/src/services/table-selection/table-selection.util.spec.ts' --include='projects/sdcorejs-angular/components/table/src/table.component.spec.ts'
```

Expected: the action-aware pipe assertion observes `selectable === true`, the mixed header-state assertion sees the disabled row as unselected, the component regression shows the disabled row selected by select-all, and the default-selection header regression remains unchecked. The no-selectable-row case is an edge-invariant characterization and is already green. Existing tests remain green.

---

### Task 2: Implement the Angular 19 fix and document the contract

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/table/src/pipes/selection-disabled.pipe.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/table/src/services/table-selection/table-selection.util.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md`

- [ ] **Step 1: Make every pipe branch synchronize rendered disabled state and select-all eligibility**

Replace the `transform` implementation in `selection-disabled.pipe.ts` with:

```typescript
transform = <T>(selectedItems: SdTableItem<T>[], rowData: SdTableItem<T>, selection: SdTableOptionSelector<T>): boolean => {
  const { disabled, actions } = selection;
  const selectedData = selectedItems.map(item => item.data);
  const setDisabled = (isDisabled: boolean): boolean => {
    rowData.meta.selector!.selectable = !isDisabled;
    return isDisabled;
  };

  if (rowData.meta.selector!.isSelected) {
    return setDisabled(false);
  }

  if (disabled?.(rowData.data, selectedData)) {
    return setDisabled(true);
  }

  if (!actions?.length) {
    return setDisabled(false);
  }

  const availableActions = actions.filter(action => {
    if ('children' in action) {
      for (const childAction of action.children) {
        const key = Utilities.hash(childAction);
        if (selectedItems.every(item => item.meta.selector?.actions?.includes(key))) {
          return true;
        }
      }
      return false;
    }

    const key = Utilities.hash(action);
    return selectedItems.every(item => item.meta.selector?.actions?.includes(key));
  });

  for (const action of availableActions) {
    if ('children' in action) {
      for (const childAction of action.children) {
        if (rowData.meta.selector?.actions?.includes(Utilities.hash(childAction))) {
          return setDisabled(false);
        }
      }
    } else if (rowData.meta.selector?.actions?.includes(Utilities.hash(action))) {
      return setDisabled(false);
    }
  }

  return setDisabled(true);
};
```

The selected-row exception remains intact so a preserved selected row can still be deselected after reload. The key change is that the predicate-disabled and action-incompatible paths both write `selectable = false` before returning.

- [ ] **Step 2: Calculate header select-all state from eligible rows only**

Replace `resolveSelectAllState` in `table-selection.util.ts` with:

```typescript
export const resolveSelectAllState = <T>(visibleRows: SdTableItem<T>[]): boolean => {
  const selectableRows = visibleRows.filter(row => row.meta.selector?.selectable);
  return selectableRows.length > 0 && selectableRows.every(row => row.meta.selector?.isSelected);
};
```

- [ ] **Step 3: Recompute the header state after pipes have established eligibility**

In `table.component.ts`, replace the final selection calls inside `#render`:

```typescript
this.#syncSelectAllState();
this.#updateSelectedItems();
```

with:

```typescript
this.#updateSelectedItems();
this.#syncSelectAllState();
```

`MapToSdTableItem` initializes `selectable` to `false`. `#updateSelectedItems()` calls `detectChanges()`, which executes `selectionVisible` and `selectionDisabled`; only after that pass can `resolveSelectAllState()` distinguish selectable from disabled rows. User-triggered selection handlers already run after the rendered pipes have established these flags.

- [ ] **Step 4: Document select-all behavior**

In `sd-table.md`, update the `disabled` selector row and the selection-column behavior so they explicitly state:

```markdown
`disabled(rowData, selectedItems)` is authoritative for both the row checkbox and bulk selection. The header select-all action skips disabled or action-incompatible rows, and its checked state means every selectable visible row is selected. When no visible row is selectable, the header state is unchecked.
```

- [ ] **Step 5: Run the focused Angular 19 tests and confirm GREEN**

Run the same three-file command from Task 1.

Expected: all focused specs pass, including the three new regression cases, with no existing selection or preserve-selection failure.

---

### Task 3: Roll the Angular 19 source to Angular 20 and 21

**Files generated by rollout:**

- `versions/v20/projects/sdcorejs-angular/components/table/src/pipes/selection-disabled.pipe.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/src/pipes/selection-disabled.pipe.spec.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/src/services/table-selection/table-selection.util.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/src/services/table-selection/table-selection.util.spec.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/sd-table.md`
- Matching Angular 21 paths and repository sync-status files

- [ ] **Step 1: Re-check the Task 0 baseline immediately before rollout**

From the repository root, run:

```powershell
git status --porcelain=v1 -uall
git diff --binary -- .sdcorejs .superpowers versions
```

Compare all non-planned paths with the Task 0 output. Do not run the mirror if an unrelated file changed unexpectedly.

- [ ] **Step 2: Run the supported rollout**

```powershell
npm run sync
npm run check:sync
```

Expected: v20 and v21 common table files match v19. Re-run `git status --porcelain=v1 -uall` and the binary diff after sync; stop and report if any non-planned content changed, without automatically resetting or discarding it. Do not hand-edit generated common logic in those versions.

- [ ] **Step 3: Run the focused tests on Angular 20 and 21**

From each of `versions/v20` and `versions/v21`, run:

```powershell
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/table/src/pipes/selection-disabled.pipe.spec.ts' --include='projects/sdcorejs-angular/components/table/src/services/table-selection/table-selection.util.spec.ts' --include='projects/sdcorejs-angular/components/table/src/table.component.spec.ts'
```

Expected: all focused specs pass in both versions.

---

### Task 4: Reproduce and fix the independent legacy repository

**Files:**

- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\src\pipes\selection-disabled.pipe.spec.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\src\services\table-selection\table-selection.util.spec.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\src\table.component.spec.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\src\pipes\selection-disabled.pipe.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\src\services\table-selection\table-selection.util.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\src\table.component.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\table\sd-table.md`

- [ ] **Step 1: Add the same three regression groups without copying production changes yet**

Apply the exact pipe, utility, and component tests from Task 1 to the equivalent legacy files. The current model, helper functions, table test imports, and `@sdcorejs/utils/fns` import path are compatible.

- [ ] **Step 2: Run the legacy focused tests and confirm RED**

Run from `C:\Users\Admin\Documents\lib-core-angular\vn-angular`:

```powershell
npx ng test sd-angular --watch=false --browsers=ChromeHeadless --include='projects/sd-angular/components/table/src/pipes/selection-disabled.pipe.spec.ts' --include='projects/sd-angular/components/table/src/services/table-selection/table-selection.util.spec.ts' --include='projects/sd-angular/components/table/src/table.component.spec.ts'
```

Expected: the same new regressions fail for the same eligibility-state reasons.

- [ ] **Step 3: Apply the same production implementation, render ordering, and documentation contract**

Use the exact `transform`, `resolveSelectAllState`, and `#render` selection-call ordering from Task 2, then add the same documentation paragraph to the legacy `sd-table.md`.

- [ ] **Step 4: Re-run the legacy focused tests and confirm GREEN**

Run the Task 4 focused test command again.

Expected: all focused legacy table specs pass.

---

### Task 5: Verify builds, encoding, and scope

- [ ] **Step 1: Build all affected libraries**

Run:

Run from `C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular`:

```powershell
npm --prefix .\versions\v19 run build
npm --prefix .\versions\v20 run build
npm --prefix .\versions\v21 run build
npm --prefix C:\Users\Admin\Documents\lib-core-angular\vn-angular run build
```

Expected: every command exits `0` and each Angular package build completes.

- [ ] **Step 2: Verify sync and patch hygiene**

Run from the new repository root:

```powershell
npm run check:sync
git diff --check
git status --short
```

Run from `C:\Users\Admin\Documents\lib-core-angular`:

```powershell
git diff --check
git status --short
```

Expected: sync passes; diff checks emit no whitespace errors; status contains only pre-existing user changes plus the planned table/design/plan files.

- [ ] **Step 3: Scan touched UTF-8 text for mojibake markers**

Read every touched `.ts` and `.md` file explicitly as UTF-8 and fail if it contains the replacement character or common double-decoding sequences (`Ã`, `Â`, `â€`, `áº`, `á»`). Review any hit rather than mass-rewriting files.

- [ ] **Step 4: Inspect final diffs against the approved behavior**

Confirm all of the following:

- Disabled/action-incompatible rows have `selectable === false` after rendering.
- Select-all changes and emits only selectable rows.
- Header checked state ignores non-selectable rows and stays false when none are selectable.
- Preserved selected rows remain deselectable.
- No unrelated user file was overwritten.

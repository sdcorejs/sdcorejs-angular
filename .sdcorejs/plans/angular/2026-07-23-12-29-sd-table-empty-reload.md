---
name: sd-table-empty-reload
description: Execute the approved TDD fix that keeps SdTable reload enabled for empty results across Angular 19-21.
approvedAt: 2026-07-23T12:29:20+07:00
approvedBy: ghost.of.dark.peter@gmail.com
track: angular
sourceSpecPath: docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md
sourceSpecHash: 1d4a6e353987f8a4ae6e40473e82f7fdecaa85239749e81129787948823dc133
approvedContractHash: bff08cae46e555a053f6a125bc0799bdf737b5d73944ef6e8645315259ed249e
taskCount: 7
phaseCount: 4
---

# SdTable Empty-Result Reload - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# SdTable Empty-Result Reload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a configured `SdTable` reload action enabled and clickable when the current server result has no rows, without changing export or paginator behavior.

**Architecture:** Preserve the existing `reload()` pipeline and public options. Add a DOM-level regression in the canonical Angular 19 table spec, remove only the item-count disabled binding from the desktop reload button, document the behavior, and let the repository sync workflow generate Angular 20/21 mirrors.

**Tech Stack:** Angular 19-21 standalone components, Angular signals, Jasmine/Karma with ChromeHeadless, Angular Material paginator/button, PowerShell repository sync scripts, Markdown.

---

## Scope

Implement the approved design in
`docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md`
(SHA-256
`1d4a6e353987f8a4ae6e40473e82f7fdecaa85239749e81129787948823dc133`).
A reload action configured with `reload.visible: true` must remain rendered and
enabled for `{ items: [], total: 0 }`, and clicking it must call the existing
server data source again. Export visibility, paginator behavior, empty-state
layout, public types, and mobile controls remain unchanged.

## Execution Context

- Track: `angular`
- Target root: `C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular`
- Source of truth: `versions/v19`
- Coverage approach: `TDD`, with the empty-result DOM/click regression observed
  RED before the one-line template fix.
- Parallel candidates: cross-version focused tests and builds can run
  independently only after `npm run sync`; source edits and sync remain
  sequential because v20/v21 are generated mirrors.
- Dependency, environment, migration, version-bump, tag, publish, and deployment
  changes: none.
- Git delivery: implementation execution does not push. Commit/push requires a
  separate explicit delivery instruction after verification.

## File Structure

### Canonical files to modify

- `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
  — DOM and click regression for an empty server result.
- `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html`
  — remove the item-count disabled binding from the existing reload action.
- `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md`
  — document that a visible reload action stays available for empty results.
- `CHANGELOG.md`
  — record the fix under `Unreleased`, not the already dated `1.4` release.
- `versions/v19/projects/showcase/src/app/docs/generated/changelog.generated.ts`
  — generated from the root changelog through the repository generator.
- `.sdcorejs/tasks/current-session.md`
  — execution evidence and resumable task status.

### Generated files changed only by root sync

- `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.html`
- `versions/v20/projects/sdcorejs-angular/components/table/sd-table.md`
- `versions/v20/projects/showcase/src/app/docs/generated/changelog.generated.ts`
- `versions/v21/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- `versions/v21/projects/sdcorejs-angular/components/table/src/table.component.html`
- `versions/v21/projects/sdcorejs-angular/components/table/sd-table.md`
- `versions/v21/projects/showcase/src/app/docs/generated/changelog.generated.ts`
- `versions/v19/SYNC-STATUS.md`
- `versions/v20/SYNC-STATUS.md`
- `versions/v21/SYNC-STATUS.md`

### Protected files and behavior

- Do not edit `versions/v20` or `versions/v21` shared source by hand.
- Do not edit package manifests, lockfiles, release versions, `published-docs`,
  Showcase examples or registry source, export conditions, paginator
  conditions, mobile actions, or the public `SdTableOptionReload` type. The
  generated Showcase changelog is the only approved Showcase change.
- The approved design and approved-plan snapshot are immutable during execution.

## Tasks

### Phase 1 — Preflight and RED regression

#### Task 1: Verify the execution baseline

**Files:**

- Verify: `docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md`
- Verify: `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- Verify: `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html`
- Verify: `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md`
- Verify: `CHANGELOG.md`

- [ ] **Step 1: Record branch, HEAD, upstream, and working-tree state**

Run:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-list --left-right --count origin/chore/prepare-1.4...HEAD
```

Expected: branch `chore/prepare-1.4`; the only ahead commit before implementation
is the approved design snapshot; no uncommitted production file is present.

- [ ] **Step 2: Recheck the approved design hash and path contracts**

Run:

```powershell
(Get-FileHash -Algorithm SHA256 -LiteralPath `
  'docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md').Hash.ToLowerInvariant()

@(
  'versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts',
  'versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html',
  'versions/v19/projects/sdcorejs-angular/components/table/sd-table.md',
  'CHANGELOG.md'
) | ForEach-Object {
  if (-not (Test-Path -LiteralPath $_)) { throw "Missing planned EDIT path: $_" }
}
```

Expected: hash
`1d4a6e353987f8a4ae6e40473e82f7fdecaa85239749e81129787948823dc133`
and no missing-path exception.

#### Task 2: Add empty-result reload behavior tests

**Files:**

- Modify:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts:401`
- Test:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`

- [ ] **Step 1: Add a focused host and four behavior assertions**

Insert this block after the existing
`Filter commit (blur) vs filter change (enter / reload)` suite:

```typescript
describe('empty result reload action', () => {
  interface Row {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table autoId="empty-result" [option]="tableOption"></sd-table>`,
  })
  class EmptyResultReloadHostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    tableOption: SdTableOption<Row> = {
      type: 'server',
      items: this.itemsSpy,
      reload: { visible: true },
      export: { visible: 'ALL' },
      paginate: { pageSize: 20 },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyResultReloadHostComponent] });
  });

  function createLoadedFixture(): ComponentFixture<EmptyResultReloadHostComponent> {
    const fixture = TestBed.createComponent(EmptyResultReloadHostComponent);
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    return fixture;
  }

  function getReloadButton(fixture: ComponentFixture<EmptyResultReloadHostComponent>): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      'button[data-autoid="components-button-components-table-empty-result-reload"]'
    ) as HTMLButtonElement | null;
  }

  it('keeps reload enabled when the server returns no rows', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const reloadButton = getReloadButton(fixture);

    expect(reloadButton).withContext('reload action must remain rendered for an empty result').not.toBeNull();
    expect(reloadButton!.disabled).withContext('empty rows must not disable reload').toBeFalse();

    fixture.destroy();
  }));

  it('refetches an empty server result when reload is clicked', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const host = fixture.componentInstance;
    const reloadButton = getReloadButton(fixture)!;
    host.itemsSpy.calls.reset();

    reloadButton.click();
    tick();
    flush();

    expect(host.itemsSpy).toHaveBeenCalledTimes(1);

    fixture.destroy();
  }));

  it('keeps export hidden for an empty result', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const exportButton = fixture.nativeElement.querySelector(
      'button[data-autoid="components-button-components-table-empty-result-export"]'
    );

    expect(exportButton).toBeNull();

    fixture.destroy();
  }));

  it('keeps the paginator hidden when total is zero', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const paginator = fixture.nativeElement.querySelector('mat-paginator') as HTMLElement;

    expect(getComputedStyle(paginator).display).toBe('none');

    fixture.destroy();
  }));
});
```

- [ ] **Step 2: Run the focused Angular 19 table spec and observe RED**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular `
  --watch=false `
  --browsers=ChromeHeadless `
  --code-coverage=false `
  --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
```

Expected: the new enabled-state assertion fails because the native reload button
is disabled, and the click assertion receives zero data-source calls. Existing
table assertions and the new export/paginator assertions must not introduce an
unrelated compile or runtime failure.

### Phase 2 — Minimal GREEN implementation and documentation

#### Task 3: Remove only the empty-item disabled predicate

**Files:**

- Modify:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html:495-504`
- Test:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`

- [ ] **Step 1: Replace the reload button block with the minimal enabled version**

The resulting block must be:

```html
@if (_tableOption.reload?.visible) {
  <sd-button
    [autoId]="_autoId ? _autoId + '-reload' : null"
    class="mr-8"
    [title]="'core.component.table.reload' | translate"
    prefixIcon="refresh"
    (click)="reload()"
    type="text">
  </sd-button>
}
```

Do not change the surrounding `*sdDesktop` container, the immediately following
`@if (_export && _items.length)` block, or `hidePaginator`.

- [ ] **Step 2: Rerun the focused Angular 19 table spec and observe GREEN**

Run the same command from Task 2.

Expected: all assertions in `table.component.spec.ts` pass, including one
data-source invocation after clicking reload on the empty result.

- [ ] **Step 3: Prove the removed predicate has no generated replacement**

Run:

```powershell
rg -n '\[disabled\]="!_items\.length"|reload\?\.visible|_export && _items\.length|hidePaginator' `
  versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html
```

Expected: no reload disabled binding; reload visibility, export gating, and
paginator logic are still present.

#### Task 4: Update the public documentation and changelog

**Files:**

- Modify:
  `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md:52`
- Modify:
  `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md:214-220`
- Modify: `CHANGELOG.md:7`

- [ ] **Step 1: Clarify the top-level reload option contract**

Change the `reload` row note to:

```markdown
Show the reload button and run `onReload` after refresh. When visible, the
reload action stays enabled for empty results (`items.length === 0` or
`total === 0`) so users can retry.
```

Keep the Markdown table as one valid row after formatting.

- [ ] **Step 2: Add the empty-result rule beside the existing click semantics**

Add this bullet immediately after the existing `Click nút Reload` bullet:

```markdown
- **Empty result:** khi `reload.visible` là `true`, nút Reload vẫn enabled với
  `items.length === 0` hoặc `total === 0`; export và paginator vẫn giữ điều kiện
  hiển thị hiện tại.
```

- [ ] **Step 3: Record the fix in the unreleased changelog**

Make the beginning of `CHANGELOG.md` read:

```markdown
## [Unreleased]

### Fixed

- **`sd-table` empty-result reload** - kept a configured reload action enabled
  when the current items or total are zero, allowing users to retry without
  changing export or paginator behavior.

## [1.4] - 2026-07-23
```

- [ ] **Step 4: Regenerate and test the Showcase changelog**

Run:

```powershell
npm run generate:showcase-changelog
npm run test:showcase-changelog
```

Expected: the v19 generated changelog contains the new `Unreleased / Fixed`
entry and the generator suite exits zero. Do not hand-edit the generated
TypeScript file.

- [ ] **Step 5: Check documentation content and Markdown whitespace**

Run:

```powershell
rg -n 'empty-result reload|Empty result|items\.length === 0|total === 0' `
  CHANGELOG.md `
  versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
git diff --check
```

Expected: changelog and table documentation each describe the new behavior;
`git diff --check` exits zero.

### Phase 3 — Generated rollout and cross-version verification

#### Task 5: Synchronize Angular 20 and Angular 21 mirrors

**Files:**

- Generate:
  `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- Generate:
  `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.html`
- Generate:
  `versions/v20/projects/sdcorejs-angular/components/table/sd-table.md`
- Generate:
  `versions/v20/projects/showcase/src/app/docs/generated/changelog.generated.ts`
- Generate:
  `versions/v21/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- Generate:
  `versions/v21/projects/sdcorejs-angular/components/table/src/table.component.html`
- Generate:
  `versions/v21/projects/sdcorejs-angular/components/table/sd-table.md`
- Generate:
  `versions/v21/projects/showcase/src/app/docs/generated/changelog.generated.ts`
- Generate: `versions/v19/SYNC-STATUS.md`
- Generate: `versions/v20/SYNC-STATUS.md`
- Generate: `versions/v21/SYNC-STATUS.md`

- [ ] **Step 1: Run the canonical rollout**

Run:

```powershell
npm run sync
```

Expected: exit zero; v19 table source/test/docs and generated Showcase changelog
are mirrored into v20/v21, and only the sync-status metadata changes in addition
to the approved feature files.

- [ ] **Step 2: Review generated scope before further verification**

Run:

```powershell
git diff --name-status
git diff --stat
git status --short
```

Expected: no package manifest, lockfile, unrelated component, Showcase source,
published-doc, or release-version change. Only the generated Showcase changelog
is allowed under Showcase paths.

- [ ] **Step 3: Run the repository sync guard**

Run:

```powershell
npm run check:sync
```

Expected: exit zero with Angular 20/21 matching the canonical managed content.

#### Task 6: Verify behavior and builds across maintained Angular lines

**Files:**

- Test:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- Test:
  `versions/v20/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- Test:
  `versions/v21/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`

- [ ] **Step 1: Run the focused table spec in every workspace**

Run:

```powershell
foreach ($version in @('v19', 'v20', 'v21')) {
  npm --prefix "versions/$version" run test -- sdcorejs-angular `
    --watch=false `
    --browsers=ChromeHeadless `
    --code-coverage=false `
    --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts

  if ($LASTEXITCODE -ne 0) {
    throw "Focused table spec failed for $version"
  }
}
```

Expected: all three focused suites exit zero with the empty reload tests GREEN.

- [ ] **Step 2: Run release lint**

Run:

```powershell
npm run lint:release
```

Expected: exit zero for Angular 19, 20, and 21.

- [ ] **Step 3: Build the published library in every workspace**

Run:

```powershell
foreach ($version in @('v19', 'v20', 'v21')) {
  npm --prefix "versions/$version" run build
  if ($LASTEXITCODE -ne 0) {
    throw "Library build failed for $version"
  }
}
```

Expected: all three ng-packagr builds exit zero. Generated `dist/**` output is
verification-only and must not be staged.

- [ ] **Step 4: Build the v19 Showcase against the generated changelog**

Run:

```powershell
npm --prefix versions/v19 run build:showcase
```

Expected: the Showcase production build exits zero and its pre-generator does
not introduce an unapproved generated-file diff.

### Phase 4 — Review and branch readiness

#### Task 7: Complete the SDCoreJS finish tail

**Files:**

- Review: all changed files from Tasks 2-5
- Update: `.sdcorejs/tasks/current-session.md`

- [ ] **Step 1: Review the behavior diff against the approved design**

Run:

```powershell
git diff -- `
  versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts `
  versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html `
  versions/v19/projects/sdcorejs-angular/components/table/sd-table.md `
  CHANGELOG.md
```

Expected: one disabled binding removed, focused tests added, and only the
approved docs/changelog text changed. The export block and paginator predicate
remain semantically identical.

- [ ] **Step 2: Run final integrity checks**

Run:

```powershell
npm run check:sync
git diff --check
git status --short
git diff --stat
git diff --name-status
```

Expected: sync and whitespace checks pass; status contains only approved source,
test, docs, root/generated changelog, sync-status, and current-session paths.

- [ ] **Step 3: Perform the required review/repair/documentation gates**

Use `sdcorejs-test` to audit RED/GREEN evidence, `sdcorejs-review` for a
read-only code/UI/accessibility review, `sdcorejs-repair-loop` only for verified
findings, `sdcorejs-documentation` to confirm the table Markdown and changelog
are complete, and `sdcorejs-ship` verify-before-done followed by branch-ready.
Rerun the affected focused test and final integrity checks after any repair.

- [ ] **Step 4: Update the session checkpoint without publishing**

Record exact commands/results and final changed paths in
`.sdcorejs/tasks/current-session.md`. Do not push, tag, publish, deploy, or edit
after the final branch-ready check. Report the ready local changes and request a
separate Git delivery instruction if commit/push is desired.

## Acceptance Mapping

- AC-1, visible reload enabled when `items.length === 0` -> Tasks 2, 3, 5, 6
- AC-2, visible reload enabled when `total === 0` -> Tasks 2, 3, 5, 6
- AC-3, click invokes the existing refresh flow -> Tasks 2, 3, 6
- AC-4, reload remains hidden without `reload.visible` -> existing
  `hidden paginator footer height` regression plus Tasks 3 and 6
- AC-5, export and paginator behavior unchanged -> Tasks 2, 3, 7
- AC-6, Angular 19 canonical with Angular 20/21 synchronized -> Tasks 5, 6, 7
- AC-7, tests, documentation, and root/generated changelog updated -> Tasks 2,
  4, 5, 6, 7

## Verification Summary

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
npm run generate:showcase-changelog
npm run test:showcase-changelog
npm run sync
npm run check:sync
npm run lint:release

foreach ($version in @('v19', 'v20', 'v21')) {
  npm --prefix "versions/$version" run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
  npm --prefix "versions/$version" run build
}

npm --prefix versions/v19 run build:showcase
git diff --check
git status --short
git diff --name-status
```

Manual review: inspect the final v19 reload button block and generated v20/v21
mirrors side by side. Confirm the button is still desktop-only and
`reload.visible`-gated, while the export `&& _items.length` and paginator
`hidePaginator` conditions are unchanged.

## Path Conflicts and Execution Notes

- Every planned EDIT and generated-mirror path exists.
- The plan CREATE path did not exist before drafting.
- Baseline branch is `chore/prepare-1.4` at
  `e6ec1eb242e84dc6be34cd42eb617c1d002b612e`, one commit ahead of upstream
  because the approved design snapshot is local.
- The working tree was clean before this draft plan and checkpoint update.
- `CHANGELOG.md` has an empty `Unreleased` section, so the new fix belongs there
  rather than modifying the already dated `1.4` release.
- No new API, dependency, Showcase fixture, or mobile reload control is needed.

## Decisions captured during review

- User approved the plan as drafted on attempt 1.
- Self-review added deterministic Showcase changelog generation and verification
  before the approval gate.
- Implementation execution does not include commit, push, tag, publish, or
  deploy; Git delivery requires a separate explicit instruction.

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)

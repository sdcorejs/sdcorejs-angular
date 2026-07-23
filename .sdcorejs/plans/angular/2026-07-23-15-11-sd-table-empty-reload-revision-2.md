---
name: sd-table-empty-reload-revision-2
description: Repair the TypeScript 5.9 PDF test blocker and complete SdTable cross-version verification.
approvedAt: 2026-07-23T15:11:12+07:00
approvedBy: ghost.of.dark.peter@gmail.com
track: angular
sourceSpecPath: docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md
supersedes: .sdcorejs/plans/angular/2026-07-23-12-29-sd-table-empty-reload.md
approvedContractHash: bb9d62988ab0104bb77315ef649157dda885c7ce39b54f33d323a337bea9bd04
taskCount: 1
phaseCount: 1
changeControlRevision: 2
---

# SdTable Empty-Result Reload Verification Amendment - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# SdTable Empty-Result Reload Verification Amendment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this amendment sequentially. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the pre-existing Angular 21 PDF test typed-array incompatibility that blocks the approved `SdTable` cross-version verification.

**Architecture:** Infer the deferred byte type directly from `makeFakeDoc().getData()` so the same canonical test source compiles with TypeScript 5.7, 5.8, and 5.9. Change no PDF production code or behavior, sync the canonical v19 test to v20/v21, then rerun both PDF and table verification.

**Tech Stack:** TypeScript 5.7-5.9 typed arrays, Jasmine/Karma, Angular 19-21, PowerShell repository sync.

---

## Change Control

- Revision: 2
- Supersedes execution scope of:
  `.sdcorejs/plans/angular/2026-07-23-12-29-sd-table-empty-reload.md`
- Original approved plan remains authoritative except for the added verification
  repair below.
- Trigger: Angular 21 focused table runner fails during compilation in an
  untouched PDF spec before executing any table assertion.
- Current RED evidence: four `TS2322` assignment errors at lines 1289, 1308,
  2128, and 2150 because `Deferred<Uint8Array>` defaults to
  `Uint8Array<ArrayBufferLike>` under TypeScript 5.9 while the inferred fake
  document method returns `Uint8Array<ArrayBuffer>`.

## Scope

Add one portable type alias in the canonical v19 PDF component spec and use it
for the six deferred byte declarations that feed `doc.getData`. Root sync owns
the v20/v21 mirrors. Do not change PDF production code, runtime behavior,
package manifests, lockfiles, changelog, public docs, or the original table
feature contract.

## Files

- Modify:
  `versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts`
- Generate through root sync:
  `versions/v20/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts`
- Generate through root sync:
  `versions/v21/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts`
- Generate through root sync:
  `versions/v19/SYNC-STATUS.md`
- Generate through root sync:
  `versions/v20/SYNC-STATUS.md`
- Generate through root sync:
  `versions/v21/SYNC-STATUS.md`
- Update: `.sdcorejs/tasks/current-session.md`

## Tasks

### Phase 4A — Verification-blocker repair

#### Task 6A: Make deferred PDF bytes portable across TypeScript versions

- [ ] **Step 1: Add a type derived from the fake document contract**

Immediately after `makeFakeDoc`, add:

```typescript
type FakePdfData = Awaited<ReturnType<ReturnType<typeof makeFakeDoc>['getData']>>;
```

This resolves to plain `Uint8Array` under older TypeScript libraries and to the
exact backing-buffer specialization inferred by TypeScript 5.9.

- [ ] **Step 2: Replace all six incompatible deferred declarations**

Replace only these forms:

```typescript
const first = deferred<Uint8Array>();
const second = deferred<Uint8Array>();
const data = deferred<Uint8Array>();
```

with:

```typescript
const first = deferred<FakePdfData>();
const second = deferred<FakePdfData>();
const data = deferred<FakePdfData>();
```

There are two `first` declarations, two `second` declarations, and two `data`
declarations. Do not change the resolved byte values or test assertions.

- [ ] **Step 3: Verify the canonical v19 PDF spec**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular `
  --watch=false `
  --browsers=ChromeHeadless `
  --code-coverage=false `
  --include=projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts
```

Expected: the focused PDF suite compiles and passes with no behavior change.

- [ ] **Step 4: Sync the portable test to v20/v21**

Run:

```powershell
npm run sync
npm run check:sync
```

Expected: exit zero; the PDF spec mirror changes are identical apart from
existing Angular-major transforms, and no PDF production file changes.

- [ ] **Step 5: Verify PDF and table specs across maintained lines**

Run the focused PDF command from Step 3 for `versions/v20` and `versions/v21`.
Then rerun:

```powershell
npm --prefix versions/v21 run test -- sdcorejs-angular `
  --watch=false `
  --browsers=ChromeHeadless `
  --code-coverage=false `
  --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
```

Expected: v20/v21 PDF suites pass and the v21 table suite reports `58/58`
success without a TypeScript load error.

- [ ] **Step 6: Resume original Task 6 and Task 7**

Continue release lint, all three library builds, v19 Showcase build, final
review, documentation gates, and branch-readiness checks from the original
approved plan.

## Acceptance Mapping

- Existing PDF test compiles on TypeScript 5.7/5.8/5.9 -> Steps 1-5.
- Existing PDF runtime assertions remain unchanged and pass -> Steps 2, 3, 5.
- Angular 21 table verification reaches and passes all 58 assertions -> Step 5.
- No PDF production, package, changelog, or public-doc scope expansion -> Steps
  2, 4, 6.

## Verification

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts
npm run sync
npm run check:sync
npm --prefix versions/v20 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts
npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts
npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
git diff --check
```

## Path Conflicts

- All three PDF spec paths exist and currently match canonical sync content.
- The v21 PDF spec has no working-tree diff; its last change is the release
  commit `bda7779`.
- Exactly six `deferred<Uint8Array>()` declarations exist per workspace.
- The amendment draft path did not exist before authoring.

## Decisions captured during review

- User approved revision 2 on attempt 1.
- Scope is limited to portable typing in the PDF component spec; PDF production
  code and behavior remain protected.
- The original sequential execution mode remains active.

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)

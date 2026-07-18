---
name: remove-authom-hard-purge
description: Execute the approved repository-wide AuthOM hard purge across Core UI, Showcase, history, and published documentation archives.
approvedAt: 2026-07-15T22:57:15+07:00
approvedBy: ghost.of.dark.peter@gmail.com
track: angular
sourceSpecPath: .sdcorejs/specs/angular/2026-07-15-22-29-remove-authom-hard-purge.md
sourceDraftPath: .sdcorejs/docs/angular/2026-07-15-22-33-remove-authom-hard-purge-plan.md
sourceDraftHash: 4eeaac73f5dbf16275cd736a96b675f5debc41158378a786e433a8f225401b5c
approvedSpecHash: 873161010dab4ededa86c98c42b76977b4a3e2792e1c8f9714efec5054942e6c
taskCount: 14
phaseCount: 6
changeControlRevision: 1
---

# Gỡ toàn bộ AuthOM khỏi @sdcorejs/angular và Showcase - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Plan - Gỡ toàn bộ AuthOM khỏi @sdcorejs/angular và Showcase - 2026-07-15 22:33

## Scope

Thực thi breaking removal đã được duyệt trên toàn repository: xóa secondary
entrypoint khỏi Core UI, bỏ trang Showcase, làm sạch tài liệu hiện hành, xóa tám
hồ sơ tính năng cũ, làm sạch các nhắc chéo lịch sử và rewrite có kiểm soát 31
published-doc archive. Không giữ compatibility stub và không thay thế bằng một
identity provider khác.

v19 là source of truth cho source, test, docs và Showcase; `npm run sync` rollout
deletion sang v20/v21. Published archives được rewrite cơ học tại chỗ theo quyết
định hard-purge, rồi manifest/catalog được kiểm tra lại. Không commit, push, tag,
publish hoặc deploy trong execution.

## Execution context

- Track: `angular`
- Target root: `C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular`
- Source of truth: `versions/v19`
- Stack profile: `core-ui-angular`
- Coverage approach: structural `TDD` RED -> GREEN kết hợp focused Angular tests, published-doc integrity tests, sync guard và production builds.
- Parallel candidates: có. Sau baseline/RED, Core UI, Showcase, history và published archives là bốn lane không giao path; sau rollout, ba library build cũng có thể chạy độc lập. `npm run sync`, catalog regeneration và final residue scan vẫn tuần tự.
- Approved spec: `.sdcorejs/specs/angular/2026-07-15-22-29-remove-authom-hard-purge.md`
- Approved spec SHA-256: `873161010dab4ededa86c98c42b76977b4a3e2792e1c8f9714efec5054942e6c`
- Change control: first implementation plan for the approved hard-purge contract.

### Allowed paths

- `README.md`, `docs/npm-README.md`
- `docs/superpowers/specs/2026-05-05-authom-module-design.md`
- `docs/superpowers/plans/2026-05-06-authom-module.md`
- `versions/v19/projects/sdcorejs-angular/modules/authom/**`
- `versions/v19/projects/sdcorejs-angular/modules/index.ts`
- `versions/v19/projects/sdcorejs-angular/README.md`
- `versions/v19/projects/sdcorejs-angular/modules/{auth,keycloak,layout,permission}/sd-*.md`
- `versions/v19/README.md`
- `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts`
- `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.spec.ts`
- `versions/v19/projects/showcase/src/app/docs/shared/markdown-renderer.component.spec.ts`
- `versions/v19/docs/superpowers/specs/2026-05-05-authom-module-design.md`
- `versions/v19/docs/superpowers/plans/2026-05-06-authom-module.md`
- Năm hồ sơ nhắc chéo dưới `versions/v19/docs/superpowers/{specs,plans}/`: `2026-05-15-core-ui-test-coverage-design.md`, `2026-05-17-sd-angular-i18n-design.md`, `2026-05-19-core-ui-test-coverage-plan-5-design.md`, `2026-05-17-sd-angular-i18n.md`, `2026-05-18-core-ui-test-coverage-plan-5.md`
- Matching generated deletions/edits under `versions/v20/**` và `versions/v21/**` produced only by root sync
- `scripts/generate-showcase-example-sources.test.mjs`
- `published-docs/**`
- `versions/v19/SYNC-STATUS.md`, `versions/v20/SYNC-STATUS.md`, `versions/v21/SYNC-STATUS.md`
- New removal change-control artifacts under `.sdcorejs/docs/angular/**`, `.sdcorejs/specs/angular/**`, `.sdcorejs/plans/angular/**` và `.sdcorejs/tasks/current-session.md`

### Protected paths

- Untracked `.superpowers/**` companion files
- All unrelated `.sdcorejs` specs, plans, memories, summaries and task records
- All unrelated `docs/superpowers/**` history; only the two exact old feature records are deleted and the five exact v19 cross-reference records are text-cleaned
- `.github/**`, root/workspace `package.json`, lockfiles, dependency declarations and changesets
- Source outside the exact Core UI/Showcase/docs paths above
- Unrelated OneMount author/email attribution and generic package names that only contain the letters `om`
- Git history, npm registry state, release tags and deployed Pages/npm artifacts

### Generated/runtime artifacts

- `versions/v19|v20|v21/{dist,coverage,.angular}/**`
- Three `SYNC-STATUS.md` files written by root sync
- Temporary baseline inventories/hashes under `$env:TEMP`; never add them to Git
- Local Showcase server logs/PID state; never add them to Git

### Removal audit-trail allowlist

The final repository scan may contain the removed integration name only in:

- `docs/superpowers/specs/2026-07-15-remove-authom-hard-purge-design.md`
- `.sdcorejs/docs/angular/*remove-authom-hard-purge*.md`
- `.sdcorejs/specs/angular/*remove-authom-hard-purge*.md`
- `.sdcorejs/plans/angular/*remove-authom-hard-purge*.md`
- `.sdcorejs/tasks/current-session.md`

Finish-tail documentation, summaries and memories must avoid persisting the
identifier outside this allowlist unless the user explicitly approves a revised
spec.

## Tasks

### Phase 1 - Baseline protection and test-first RED

1. **VERIFY** repo root, branch, HEAD, upstream/local refs, tags, `git status --short`, approved-spec hash and every allowed/protected path - require production paths to match HEAD; preserve the existing planning artifacts and `.superpowers/**`; record exact baselines of 24 Core source files, six direct Showcase reference files, eight old feature records, 15 incidental history files, 31 archive module files, 31 index entries, 124 archive cross-docs and 187 direct-match archive files. Prove shared package dependencies remain used outside the deletion scope; capture hashes for every published-doc file outside the 188-file mutation allowlist; and capture canonical JSON/full text for every mutable index, manifest, catalog and cross-doc so task 8 can prove only the authorized semantic transformation occurred.

2. **RUN** one ephemeral PowerShell structural-absence assertion covering `versions/v19|v20|v21` source trees/barrels, active docs and READMEs, Showcase registry, exact historical records, all archive files/index entries/cross-links and forbidden identifiers - require the assertion to fail in the expected categories before any removal and save only its console evidence. Reuse the identical assertion in task 12; do not create a permanent keyword-bearing test/helper file.

3. **EDIT/RUN** `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.spec.ts` and `scripts/generate-showcase-example-sources.test.mjs` before implementation - change expected registry totals from 85 to 84, `modules-integrations` from 11 to 10 and navigation sizes to `[3, 31, 16, 6, 9, 10, 9]`, while preserving the example total 253; extend the existing published-doc integrity test to compare `catalog.json` with `versions.json` and every index. Run the catalog integrity test GREEN on the baseline, then run the focused registry spec and require RED because the registry still exposes one extra page.

### Phase 2 - Active product and repository-history removal

4. **DELETE/EDIT** `versions/v19/projects/sdcorejs-angular/modules/authom/**`, `modules/index.ts`, active Core docs/README files, root `README.md` and `docs/npm-README.md` - remove the secondary entrypoint, barrel export, symbols/imports/storage/silent-refresh claims and cross-links while preserving `src/public-api.ts`, Auth, Keycloak, Permission, Layout, Icon and all shared dependencies.

5. **EDIT/RUN** `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts` and `docs/shared/markdown-renderer.component.spec.ts` - remove the AuthOM registry seed and obsolete Markdown link expectation without changing generic routing/rendering or example manifests. Run the focused registry, Markdown renderer, route-guard and app-route specs to GREEN; retain existing generic invalid-legacy-route coverage, and defer the exact removed URL proof to browser smoke so no permanent source test reintroduces the identifier.

6. **DELETE/EDIT** the two exact root old feature records, their two v19 mirrors and the five exact v19 incidental history records listed in Allowed paths - delete only the dedicated feature design/plan, rewrite or remove only clauses that mention the removed module in the other five records, and retain all unrelated i18n/test-history content. Let root sync produce the four mirror deletions and ten mirror text cleanups in v20/v21, yielding exactly eight deleted old records and 15 cleaned incidental records overall.

### Phase 3 - Guarded published-doc archive rewrite

7. **EDIT/DELETE/RUN** `published-docs/{31 versions}/**` and `published-docs/versions.json` with a deterministic one-off bulk transform - for each manifest version, assert exactly one `modules/authom/sd-authom.md` and one matching index record; delete the Markdown file; remove only the exact index record; rewrite only `modules/{auth,keycloak,layout,permission}/sd-*.md`; set `index.count = index.docs.length`; assert the count decreased by exactly one; and copy that exact count into the matching manifest entry. Abort on any precondition/count mismatch rather than partially rewriting the corpus.

8. **RUN/VERIFY** catalog refresh and archive integrity - execute `npm run collect-docs -- --workspace v21 --version 21.1.2 --skip-existing` only after all indexes/manifest are consistent, then run the extended focused published-doc integrity test. Require 31 archives, unique IDs, valid files/URLs, registry/latest-index parity and `catalog.json` parity; require unchanged hashes outside the 188-file mutation allowlist; and compare mutable files semantically against the task-1 baseline: retained index records must be byte-for-byte canonical-equal, each cross-doc must equal the baseline after its exact approved replacement map, manifest entries may change only `count`, and catalog versions/docs may differ only by the removed record and derived counts.

### Phase 4 - Multi-version rollout

9. **RUN/VERIFY** root `npm run sync` followed by a scoped generated-diff review and `npm run check:sync` - mirror v19 source, Showcase, README and history changes into v20/v21, including directory deletions; allow only expected `SYNC-STATUS.md` timestamp updates and Angular-major shims; do not hand-edit derived shared logic or overwrite unrelated work.

### Phase 5 - Regression, build and structural GREEN

10. **RUN** focused/current automated tests and lint - execute the v19 Auth, Keycloak, Permission and Icon specs, the four focused Showcase specs from task 5, `npm run test:showcase-generators`, the focused published-doc integrity test and `npm run lint:release`; require zero failures and confirm no test/example count regression outside the one removed documentation page.

11. **RUN** clean production builds for `sdcorejs-angular` in v19, v20 and v21 plus the v19 Showcase build - before each library build, resolve and verify the generated `versions/v*/dist/sdcorejs-angular` target stays inside its intended workspace, remove only that generated output, then optionally fan out the three library builds after task 9. Require ng-packagr/Angular compilation exit 0, supported module entrypoints remain present, `dist/sdcorejs-angular/modules/authom` does not exist and rebuilt package metadata contains no removed secondary-entrypoint export.

12. **VERIFY** final repository invariants with the identical task-2 structural assertion, `npm run check:sync`, built-package entrypoint-directory/export inspection, archive semantic/hash checks, exact audit-trail allowlist, unrelated OneMount attribution comparison, `git diff --check`, scoped diff/status review and before/after branch/HEAD/upstream/tag comparison - require zero unexpected reference/path, zero stale `dist` entrypoint, zero protected-path change, zero staged change and unchanged refs, proving no commit, push, tag, publish or deploy occurred.

13. **RUN/MANUAL** local v19 Showcase smoke with lifecycle generators disabled - open navigation/search and verify no removed page is offered; open the legacy `/v/21.1.2/modules-integrations/authom/overview` URL and require the existing documentation not-found experience with no console/network error; then stop the local server and keep its runtime files outside Git.

### Phase 6 - Mandatory finish tail

14. **RUN** the mandatory SDCoreJS finish-tail order - `sdcorejs-test` evidence review; `sdcorejs-review`; `sdcorejs-repair-loop` for verified findings; automatic code-documentation; Angular UI-impact check; technical docs if separately approved; `sdcorejs-ship` verify-before-done; `sdcorejs-ship` branch-ready; auto-docs; user guide if separately approved; auto-task-tracker; relevant-memory review. Because the mandated tail can write after its first branch-ready audit, rerun the task-12 structural/diff checks and `sdcorejs-ship` branch-ready once more as the final read-only gate. Perform no write after that final recheck and no Git/release mutation without separate user authorization.

## Acceptance mapping

- AC-001 -> tasks 2, 4, 9, 11, 12
- AC-002 -> tasks 2, 4, 9, 12
- AC-003 -> tasks 3, 5, 9, 10, 13
- AC-004 -> tasks 1, 6, 9, 12
- AC-005 -> tasks 1, 7, 8, 12
- AC-006 -> tasks 3, 7, 8, 10, 12
- AC-007 -> tasks 4, 9, 10, 11, 12
- AC-008 -> tasks 1, 4, 12
- AC-009 -> tasks 2, 3, 5, 12
- AC-010 -> tasks 9, 12
- AC-011 -> tasks 5, 8, 10, 11
- AC-012 -> tasks 1, 2, 4, 5, 6, 7, 9, 12, 14
- AC-013 -> tasks 1, 12, 14

## Verification

### Structural RED -> GREEN

Copy and run this complete PowerShell assertion verbatim before and after
implementation. Baseline must exit non-zero with Core, old-record, archive and
reference categories represented; final execution of the identical block must
exit 0. It scans working-tree files rather than Git history, ignores generated
or unrelated temporary content and excludes only the five audit-trail patterns.

```powershell
$ErrorActionPreference = 'Stop'

$forbiddenPaths = @(
  'docs/superpowers/specs/2026-05-05-authom-module-design.md',
  'docs/superpowers/plans/2026-05-06-authom-module.md'
)

foreach ($major in @('v19', 'v20', 'v21')) {
  $forbiddenPaths += "versions/$major/projects/sdcorejs-angular/modules/authom"
  $forbiddenPaths += "versions/$major/docs/superpowers/specs/2026-05-05-authom-module-design.md"
  $forbiddenPaths += "versions/$major/docs/superpowers/plans/2026-05-06-authom-module.md"
}

$manifest = Get-Content -Raw -Encoding utf8 'published-docs/versions.json' | ConvertFrom-Json
foreach ($entry in $manifest.versions) {
  $forbiddenPaths += "published-docs/$($entry.version)/modules/authom/sd-authom.md"
}

$presentPaths = @($forbiddenPaths | Where-Object { Test-Path -LiteralPath $_ })
$referenceFiles = @(
  & rg --hidden -l -i 'auth[-_ ]?om' . `
    -g '!**/node_modules/**' `
    -g '!**/dist/**' `
    -g '!**/coverage/**' `
    -g '!**/.angular/**' `
    -g '!**/.git/**' `
    -g '!.superpowers/**'
)
$rgExit = $LASTEXITCODE
if ($rgExit -gt 1) { throw "Residue scan failed with exit code $rgExit" }

$referenceFiles = @($referenceFiles | ForEach-Object {
  ($_ -replace '\\', '/') -replace '^\./', ''
})

function Test-RemovalAuditTrail([string]$path) {
  return (
    $path -eq 'docs/superpowers/specs/2026-07-15-remove-authom-hard-purge-design.md' -or
    $path -like '.sdcorejs/docs/angular/*remove-authom-hard-purge*.md' -or
    $path -like '.sdcorejs/specs/angular/*remove-authom-hard-purge*.md' -or
    $path -like '.sdcorejs/plans/angular/*remove-authom-hard-purge*.md' -or
    $path -eq '.sdcorejs/tasks/current-session.md'
  )
}

$unexpectedReferences = @($referenceFiles | Where-Object { -not (Test-RemovalAuditTrail $_) })

if ($presentPaths.Count -gt 0 -or $unexpectedReferences.Count -gt 0) {
  Write-Output "Forbidden paths ($($presentPaths.Count)):"
  $presentPaths | Sort-Object | ForEach-Object { Write-Output "  $_" }
  Write-Output "Unexpected reference files ($($unexpectedReferences.Count)):"
  $unexpectedReferences | Sort-Object -Unique | ForEach-Object { Write-Output "  $_" }
  exit 1
}

Write-Output 'Structural absence assertion passed.'
```

The exact identifier pattern intentionally does not use a broad bare `om`
substring, which would match unrelated packages or attribution.

### Test-first Showcase and archive integrity

```powershell
node --test --test-name-pattern="checked-in published-doc manifests, indexes, registry mappings, and document files are consistent" scripts/generate-showcase-example-sources.test.mjs

npm --prefix versions/v19 run test:showcase -- `
  --include=projects/showcase/src/app/docs/core/documentation.registry.spec.ts `
  --include=projects/showcase/src/app/docs/shared/markdown-renderer.component.spec.ts `
  --include=projects/showcase/src/app/docs/core/docs-route.guards.spec.ts `
  --include=projects/showcase/src/app/app.routes.spec.ts
```

After changing only the registry expectations, the focused Showcase command
must be RED. After registry/link removal it must be GREEN. The Node integrity
test must be GREEN before and after the archive transform, with new catalog
assertions active.

### Supported-module regression tests

```powershell
npm --prefix versions/v19 run test:ci -- `
  --include=projects/sdcorejs-angular/modules/auth/**/*.spec.ts `
  --include=projects/sdcorejs-angular/modules/keycloak/**/*.spec.ts `
  --include=projects/sdcorejs-angular/modules/permission/**/*.spec.ts `
  --include=projects/sdcorejs-angular/modules/icon/**/*.spec.ts
```

Layout has no focused spec in the current tree; its continued export/compile is
proved by source barrel assertions and all three production library builds.

### Rollout, generators, lint and builds

```powershell
npm run sync
npm run check:sync
npm run test:showcase-generators
npm run lint:release

$repoRoot = (Resolve-Path '.').Path
foreach ($version in @('v19', 'v20', 'v21')) {
  $workspaceRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot "versions/$version"))
  $distRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot 'dist/sdcorejs-angular'))
  if (-not $distRoot.StartsWith($workspaceRoot + [IO.Path]::DirectorySeparatorChar)) {
    throw "Unsafe generated-output path: $distRoot"
  }
  if (Test-Path -LiteralPath $distRoot) {
    Remove-Item -LiteralPath $distRoot -Recurse -Force
  }
}

npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
npm --prefix versions/v19 run build:showcase
```

After the library builds, run:

```powershell
$requiredExports = @('./modules/auth', './modules/keycloak', './modules/permission', './modules/layout', './modules/icon')
foreach ($version in @('v19', 'v20', 'v21')) {
  $distRoot = "versions/$version/dist/sdcorejs-angular"
  if (Test-Path -LiteralPath "$distRoot/modules/authom") {
    throw "[$version] stale removed secondary-entrypoint directory"
  }

  $manifest = Get-Content -Raw -Encoding utf8 "$distRoot/package.json" | ConvertFrom-Json
  $exports = @($manifest.exports.PSObject.Properties.Name)
  if ($exports -contains './modules/authom') {
    throw "[$version] removed secondary entrypoint remains exported"
  }
  foreach ($required in $requiredExports) {
    if ($exports -notcontains $required) { throw "[$version] missing supported export $required" }
  }
}
```

Never edit `dist/**` manually; delete only the verified generated output root and
rebuild it.

### Archive integrity and mutation guard

```powershell
npm run collect-docs -- --workspace v21 --version 21.1.2 --skip-existing
node --test --test-name-pattern="checked-in published-doc manifests, indexes, registry mappings, and document files are consistent" scripts/generate-showcase-example-sources.test.mjs
```

For each of the 31 versions, assert:

- `index.count === index.docs.length`
- manifest count, index count and both catalog representations agree
- exactly one document was removed from the baseline
- no deleted document path remains in an index/catalog
- all retained document files exist
- all non-allowlisted published-doc hashes equal the baseline
- every retained `index.docs` record and non-count index field canonicalizes identically to the baseline
- each of the 124 cross-docs equals its baseline-derived expected output after applying an explicit per-file replacement map; validate the enumerated match count separately for every file/variant instead of assuming one global count
- every `versions.json` entry equals its baseline except for the one-step `count` reduction
- every catalog version/document equals the baseline projection minus the one removed record; only derived counts may differ

### Browser smoke

```powershell
npm --prefix versions/v19 --ignore-scripts run showcase -- --host 127.0.0.1 --port 4200
```

Open the current modules/navigation/search and the exact legacy URL from task 13.
Require no removed result, existing not-found behavior and no console/network
error. Stop the server after the check.

### Final repository integrity

```powershell
npm run check:sync
git diff --check
git status --short
git diff --stat
git diff --name-status
git rev-parse HEAD
```

Final review must confirm the content diff is limited to approved paths, the
temporary `.superpowers/**` files remain untouched/untracked, dependency files
are unchanged, all eight old feature records are deleted, all 15 incidental
history records are clean after sync, all 31 archives are consistent, and HEAD
still equals the execution baseline.

## Path conflicts and execution notes

- All explicit EDIT paths exist; all explicit DELETE paths exist.
- All 31 manifest versions currently contain the six required archive files: one module doc, one index and four cross-reference docs.
- The plan CREATE path did not exist before drafting.
- Current production paths match HEAD `fcdfdcdc96ee`; the only current task changes are the approved snapshot/checkpoint/plan, while `.superpowers/**` remains unrelated and untracked.
- The five v19 incidental history files are not dedicated AuthOM records; they must be surgically cleaned and preserved, then root sync mirrors them to v20/v21.
- Root sync uses `/MIR` from v19 and therefore owns v20/v21 deletion. It also updates `SYNC-STATUS.md`; review those generated timestamps separately from feature content.
- The checked-in published-doc integrity test already validates manifest/index/files/latest-registry parity but not catalog parity; task 3 closes that gap before archive mutation.
- Published cross-doc prose has release-dependent variants; derive the authorized replacement from each file's captured baseline and validate its own enumerated hit count rather than applying a global 31-match assumption.
- `collect-docs --skip-existing` refreshes only `catalog.json` from the already repaired manifest/index corpus. Do not use `--force` or `collect-release-docs`, which would rebuild historical releases from current source and overwrite unrelated archive content.
- No permanent structural test/helper is created because its own forbidden identifiers would violate the final residue contract.
- No commit, push, tag, publish or deploy is authorized by this plan.

## Decisions captured during review

- Người dùng duyệt plan ngay lần 1.
- Independent review findings về exact path allowlist, executable RED/GREEN assertion, archive semantic guards, clean dist verification, finish-tail order và release-dependent archive variants đã được sửa trước approval gate.
- Không có production edit, commit, push, tag, publish hoặc deploy được phê duyệt tại gate này.

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)

---
artifact_id: editor-tiptap-plan-r1
artifact_kind: execution-doc
change_ref: editor-minieditor-tiptap-oss
source_spec: .sdcorejs/docs/angular/2026-10-12-editor-tiptap-spec.md
source_plan: none
commit_policy: with-change
owner: core-editor-integration
status: technically-reviewed-contract
---

# Plan

Authority: user expressly requests implementation plus spec/plan review, not another permission to build. These are reviewable contract artifacts, not fabricated user-approved snapshots. Independent technical review must pass before implementation; new breaking choices outside listed engine migration transfer to parent.

## Allowed paths and ownership

- Integration owner: root CHANGELOG/README.npm if relevant, v19/package manifests/locks/library ng-package.json, Showcase package/lock and demos, canonical docs, sync-generated v20–v22, tests/evidence/bundle/packed consumers and Git/draft PR.
- Engine unit: `versions/v19/projects/sdcorejs-angular/components/editor-engine/index.ts`, `ng-package.json`, `src/engine/**`; explicitly excludes `src/toolbar/**` and `src/surface/**`; no manifests/i18n/other components.
- Adapter/upload unit: `.../components/editor/**`, `.../components/mini-editor/**`, component index exports; excludes parent-owned `sd-editor.md`/`sd-mini-editor.md`; no engine/UI/manifests.
- Toolbar unit: shared engine `src/toolbar/**`, `src/surface/**` after engine interface established; disjoint from engine worker paths.
- Integration owns sanitizer scoped changes, i18n, deprecated ckeditor-styles/shared styles and notices.
- Prohibited: AGENTS/CLAUDE, published-docs/pages, release workflows/contracts/version/tag, root docs/design/product/migrations, private env, code-editor/image-editor, unrelated styles/fonts, other worktrees.
- Workers: no commits/stage/push/PR or recursive agents. Shared manifests/locks/sync remain single writer. Heavy tests sequential; read-only reviews may overlap.

## Steps

1. Complete API/plugin/HTML corpus inventory and source-backed toolbar design; review spec/architecture/plan naming, data loss and safety decisions. [AC-001–016]
2. Integration installs exact OSS dependencies in new physical v19 node_modules; retain license metadata. Keep CK dependency during PoC solely for measured baseline, remove after replacement.
3. TDD engine: prove RED for basic edit vs unsupported loss; implement shared schema/import/export/lifecycle. Add focused corpus/image/table/mention/security/composition tests and real-browser PoC. Shared surface contract then unlocks adapters/toolbars. [AC-001–004,007–008,012–013]
4. TDD adapters: preserve Angular bindings/outputs/forms/timing; upload manager reuses safe standalone validation/batching utilities where independent of CK. Replace CK config/types honestly and add migration diagnostics. [AC-005–008,011–013]
5. TDD toolbar/surface: two CoreUI variants, accessible native semantics, responsive overflow/selection/focus; integration adds VI/EN keys. [AC-009–010]
6. Integration removes CK packages/global imports, maintains deprecated styles export, writes migration/docs/license notices and Unreleased breaking section; Showcase demos use same rich HTML corpus. [AC-014,016]
7. Unit Stage A contract review, then fresh Stage B quality/API/design/security review; scoped repair invalidates review/test fingerprint. Integration reads all diffs and verifies ownership. [AC-015]
8. Sync v19→v20/v21/v22 with official script, exact Node22.22.3/npm11.5.1, clean physical installs (legacy peer v19–21 only), real tests/builds, root sync/scripts/i18n, Showcase copy-built-library test/build, packed consumers. [AC-015]
9. Capture real Chromium desktop/mobile + composition/keyboard/form/SSR/cleanup probes; report Safari/manual IME limitations. Measure baseline/replacement same-toolchain bundles raw/gzip/brotli and license/package boundary. [AC-016]
10. Final exact-diff independent review + named-path Git closure, commit/push and draft PR only when gates sufficient under user authorization. No merge/tag/publish/deploy. [AC-015–016]

## Verification

Use discovered repository npm scripts (check:sync, test:scripts, check:i18n, test, build) and narrow `ng test --include` patterns with ChromeHeadless. Preserve valid behavior RED rather than missing dependency/compiler failure. TDD ledger references requirement, exact test, run/result and diff fingerprint. All test receipts state actual commands/runtime and limitations; do not treat test declarations/reviewer assertions as executed pass.

## Remaining evidence gates

Source corpus limited; PoC may reveal additional supported structures needed. Real Safari/native IME require available runtime/manual evidence and remain explicitly pending if unavailable. Raw CK plugin/config downstream migration cannot be auto-validated; document breaking scope. Bundle size has no target reduction promise.

## AC-to-test risk mapping before workers

| Criteria   | Observable tests/probes                                                                                                                                                   | Risk                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| AC-001–003 | real engine HTML corpus initial byte-preservation, edit in Mini with table/image/marks/caption, unknown tag/attr/style read-only and no emit                              | silent data loss                  |
| AC-004     | malicious raw-text/namespace/event/URL/CSS initial/paste/output; atomic reject and safe preview/getter error                                                              | active content or export bypass   |
| AC-005     | TestBed model/form registration/rebind/null/required/maxlength/disabled/readonly/FocusEvent + user edit                                                                   | form regression                   |
| AC-006     | TestBed ngModel/formControl/value writes before/after mount, blur touched, combined disable and event order                                                               | CVA regression                    |
| AC-007–008 | fakeAsync cadence, composition event suppression/final emission, echo caret/history, external replacement during composition, SSR/hydration/destroy listener/timer checks | lost text and leaks               |
| AC-009–010 | actual native pressed/label/disabled, keyboard roving/escape, popup bookmark, pointer/touch, desktop/mobile Chromium + axe                                                | focus/a11y/mobile regressions     |
| AC-011     | file validation/batch/concurrency/cardinality/URL/failure retry, removed image/new doc/destroy out-of-order results, URL revoke                                           | stale insert/upload unsafe        |
| AC-012–013 | mention identity/feeds/selection/delete/legacy HTML; HTML↔Markdown semantic-loss diagnostics                                                                              | corrupted mention or lossy format |
| AC-014–016 | dependency/license/import scan, real major build/test/packed consumer, sync/i18n/Showcase/bundle/screenshot receipts, exact-diff reviews                                  | package/release boundary          |

Planned files: engine owner `src/engine/editor-engine.spec.ts` (round-trip, no emission, loss/security, composition/echo/cleanup/isolation, mentions/Markdown); adapter owner existing `editor.component.spec.ts` and `mini-editor.component.spec.ts` (forms/IO/CVA/timing), plus `editor/src/upload-manager.spec.ts` (async file/result races); toolbar owner `src/toolbar/editor-toolbar.component.spec.ts` + `src/surface/editor-surface.component.spec.ts` (native semantics/focus/popups/SSR/init/IME delegation). Integration browser probes and bundle logs under task evidence only. Capture baseline first before production replacement; Node serialization is not Angular/browser acceptance.

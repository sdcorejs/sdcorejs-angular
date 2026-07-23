---
created_at: 2026-07-23T07:24:20+07:00
track: angular
branch: chore/prepare-1.4
baseline_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
status: verified_for_delivery
release_suffix: 1.4
---

# Production-ready 1.4 quality gate

## Outcome

Release `1.4` is implemented and verified in the working tree for all maintained Angular lines:

- Angular 19: `@sdcorejs/angular@19.1.4`
- Angular 20: `@sdcorejs/angular@20.1.4`
- Angular 21: `@sdcorejs/angular@21.1.4`

The authorized implementation and documentation scope is complete. Commit and branch push are authorized for this delivery; tag, GitHub release and npm publish remain outside the approved scope.

## Scope delivered

- Shared form lifecycle, time/time-range and input-mask foundation.
- API, loading, cache, storage and graph-persistence hardening.
- Completed PDF outline/search/thumbnail/continuous/print workflows.
- Signal viewport service and responsive Layout V1/V2/V3 compatibility.
- Breadcrumb, data-state, entity-picker, tree-select, unsaved-changes, task/job-progress and audit-diff public surfaces.
- Public entrypoints, Showcase pages/examples, API docs, migration guide, npm README and stable changelog.
- Canonical v19 implementation rolled out through the managed sync pipeline to v20/v21.

## Final review and repairs

The final audit found and repaired these release blockers:

1. Full-suite baseline defects and insufficient function coverage were repaired with behavior-focused tests; `NextDay` expression parsing now strips the correct token.
2. Version sync now fails closed when package/source versions or managed i18n scripts drift; the missing scripts are rolled out to v20/v21.
3. Changelog rendering now preserves multiple non-empty sections in the same standard group, including both `Changed (BREAKING for consumers)` and `Changed`.
4. The Layout Showcase now provides `SdViewportService` at the same component injector as its viewport adapter, so Desktop/Mobile controls switch the actual sidebar implementation.
5. Changelog tests now derive release counts, headings and package links from generated data instead of hard-coded `1.2` assumptions.
6. The release documentation audit repaired broken Layout links, expanded the Audit Diff and task/job-progress guides, and made canonical `docs/npm-README.md` parity a fail-closed workspace-sync contract.

No unresolved Critical, Important or Minor finding remains in the reviewed release scope.

## Automated verification

| Gate | Result |
| --- | --- |
| Full v19 source-only library suite | 3,814 passed, 9 skipped, 0 failed |
| Coverage | Statements 69.70% (16,738/24,013); branches 60.18% (6,578/10,929); functions 69.06% (3,174/4,596); lines 69.97% (15,030/21,478) |
| Showcase suite | 191/191 passed |
| Repaired Showcase slice | 6/6 passed |
| Showcase generators | 27/27 passed |
| Static branding tests | 3/3 passed |
| i18n parity, each of v19/v20/v21 | 517 keys × 5 locales |
| i18n hard-code baseline, each workspace | 255 legacy occurrences; no per-file increase |
| Release lint | v19, v20 and v21 passed |
| Production library builds | v19, v20 and v21 passed |
| Production Showcase build | v19 passed; 304 generated example entries |
| Workspace sync guard | v20/v21 match canonical v19 |
| Release Markdown audit | 113 files; no missing/broken local links, unbalanced fences, missing H1, replacement characters or NUL bytes |
| Release documentation contracts | 12/12 public surfaces have the required docs, demos and changelog/migration coverage |
| Touched-text encoding audit | 828 files; no mojibake or replacement-character matches |
| Whitespace/diff guard | `git diff --check` passed |

Source-only coverage was measured with generated `dist` temporarily moved out of module resolution. The directory was restored in a `finally` path and no hold directory remains.

## Package verification

| Workspace | Package/version | Files | Package size | Unpacked size | Exports | Manifests | Missing targets |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| v19 | `@sdcorejs/angular@19.1.4` | 851 | 3,318,398 B | 12,779,835 B | 95 | 94 | 0 |
| v20 | `@sdcorejs/angular@20.1.4` | 333 | 3,303,304 B | 12,918,833 B | 95 | 94 | 0 |
| v21 | `@sdcorejs/angular@21.1.4` | 333 | 3,303,240 B | 12,928,345 B | 95 | 94 | 0 |

These values came from `npm pack --dry-run --json --silent` inside each built package directory. No tarball was created and nothing was published.

## Browser smoke

The generated application was exercised in the in-app browser at desktop and `390×844` mobile viewport sizes.

- Time picker: spinbuttons, increment/decrement, confirm/cancel and Escape close.
- Input mask: displayed `0901 234 567` while the bound raw model remained `0901234567`.
- Entity picker and tree select: accessible dialogs, search/table or tree roles, pagination and close interactions.
- Data state and job progress: alert/action semantics and live `aria-valuenow` change from 45 to 55.
- Audit diff: semantic table, formatting and redacted token value.
- PDF preview: three rendered canvases, outline tree, tabs, toolbar, print/download/fullscreen and continuous mode.
- Mobile viewport: mobile breakpoint, no horizontal overflow, and navigation `aria-expanded` toggled correctly.
- Production docs artifact simulation: versioned client navigation completed without visible alert or console warning/error.
- Fresh production-root smoke: application reached `readyState: complete`, rendered the documentation heading and content landmark, and exposed 120 links plus 10 interactive buttons without a visible application failure.

## Repository hygiene and delivery boundary

- Branch: `chore/prepare-1.4`; baseline HEAD remains `cc31df58253569ad19b2c90bf4e34f1077c7d954`.
- The release unit is prepared as one intentional Conventional Commit and is pushed only to `origin/chore/prepare-1.4`.
- No tag, GitHub release or npm publish is part of this delivery.
- The delivery is verified after push by matching local `HEAD` to `git ls-remote`; that remote hash is reported in the session handoff rather than written into a follow-up commit.

## Recommended next action

Open and review a PR from `chore/prepare-1.4`. After merge approval, separately authorize the `v1.4` tag, published-doc generation and npm publication.

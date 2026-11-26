# Reviewed release snapshots

## Release 3.7

The [first Linux build](https://github.com/sdcorejs/sdcorejs-angular/actions/runs/45550147725)
produced all four tarballs from `3e8a1db0b300d834d6f33d01ba9728fb7c327e6d`
using Node `24.22.1` and npm `11.5.1`. Its package comparison detected the changed
file inventory and stopped the workflow before publication. Each artifact's SHA-256,
npm SHA-512 integrity, SHA-1 and file inventory were checked against its contents.
The published same-major `*.3.6` baselines matched the registry checksums and
all 16 candidate fingerprints from `3.6.json`.

| Angular candidate | SHA-256 of first Linux tarball | Files added / removed | Declarations added / removed / changed |
| --- | --- | --- | --- |
| 19.3.7 | `f1c40c95ed6f0722c93c44671e8ae02a65c564eb3825d1c001ed986272de3210` | 118 / 81 | 14 / 1 / 27 |
| 20.3.7 | `2e8371a5e9f7c92cb971c2cf36cdbe4d27cee371469825953ad2f36ce49def71` | 104 / 80 | 0 / 0 / 11 |
| 21.3.7 | `d0e1cdd19a68a10f295e5b055a95fa26b5cf1aeac3ad4f7ee7f495255c8f7ca2` | 104 / 80 | 0 / 0 / 11 |
| 22.3.7 | `535dc791861c4e5533752f520ce59f4ee0f786eae653cded299cc0097508a087` | 104 / 80 | 0 / 0 / 11 |

All four lines have the same dependencies, peer ranges, engines and export map
as their baselines. The 105 Angular Package Format entry points retain their
named runtime exports and add the public `sdTableQueryParams` helper and the
internal `ɵSdCalendarHeader` and `ɵsdPanelPositions` exports. Each line adds
19 authored sourcemap sources, removes the two old chip-calendar header sources
and changes 47 sources. The packed file changes include rebuilt lazy chunks,
the Record 360 pages and styles, and the shared date panel styles.

The [3.7 changelog](../../CHANGELOG.md#37---2026-11-25) documents migrations
for the removed `SdTime.menuTrigger` member, the three required custom
`I18nCatalog` messages, and explicit size limits on the shared Sass popover
panel. The release snapshot compares the actual declarations and authored
sources, including these member and stylesheet changes.

A separate read-only review reproduced all 32 baseline and candidate fingerprints
from the tarballs and checked their entry points. The unchanged strict Angular
consumer fixture compiled against each candidate on Windows with Node `24.22.1`
and npm `11.5.1` at the reviewed source commit. The tag workflow repeats the
four builds and the consumer compilation on Linux before publishing.

## Release 3.6

`3.6.json` compares all four candidates with their same-major published `*.3.5`
baseline. Candidates are the actual `19.3.6` / `20.3.6` / `21.3.6` / `22.3.6`
tarballs built on Linux by the `publish-npm.yml` run `45010981672` for the first
`v3.6` tag (source `969df63ca9fa020aa3e8e3211176d2ec12f667c5`, the squash of #160,
exact Node `24.22.1` and npm `11.5.1`), downloaded from that run's retained
artifacts. That run stopped at "Verify all four retained packages" and published
nothing. Artifact SHA-256, npm SHA-512 integrity and SHA-1 shasum were checked
before deriving the snapshot. The canonical surface fingerprint reader excludes
only `version` and `frameworkMajor`. Every baseline fingerprint equals the
candidate fingerprint recorded in `3.5.json`.

The fingerprints were derived on a Windows workstation with Node `26.13.0`,
because exact Node `24.22.1` was not installed there. They hash tarball content
and do not depend on the Node version, but
`release-package-contract.mjs --compile-consumers` was not run locally for this
snapshot. The "Verify all four retained packages" job of the re-tagged run, on
exact Node `24.22.1` and npm `11.5.1`, is the first check of this snapshot
against the artifacts and the strict consumers.

Dependencies, peers and engines are unchanged for each line. The export map
adds `./components/calendar`, `./components/scheduler`,
`./components/timeline` and `./services/query-params`, and removes
`./components/history`. Angular 19 adds 126 packed files and removes 100;
later lines add 89 and remove 96. Most of them are `modules/pattern` and
`modules/generic` FESM chunks that come back under new content hashes. The
rest are the four new entry points with their FESM bundles, the removed
`components/history` bundle, the new `assets/scss/core/_popover-panel.scss`
and the removed pattern source `features/category/entity.resolver.ts`.

Angular 19 adds 41 declaration files, removes five (the four of
`components/history` and the pattern `entity.resolver`) and changes 59. Later
lines add the four bundled declarations of the new entry points, remove the
`components/history` bundle and change 18. Each line adds 40 authored
sourcemap sources, changes 88 and removes five.

These changes cover `sd-calendar`, `sd-scheduler`, `sd-timeline` (which
replaces `sd-history`) and `syncQueryParams` with the `query-params` service;
the `sd-card` behaviors and layouts; the new `sd-kanban` API; the `sd-query-bar`
panels and saved filters; `sd-tree` navigation mode and the selection bar; path-only
tab identity in `sd-tab-router-outlet`; the confirm service; default table
operators and table configurations by key; and the fixes listed under 3.6 in the
changelog. The changelog documents the breaking changes and their migrations.
They must be independently reviewed with this snapshot; CI never regenerates
expectations.

## Release 3.5

`3.5.json` compares all four candidates with their same-major published `*.3.4`
baseline. Candidates are the actual `19.3.5` / `20.3.5` / `21.3.5` / `22.3.5`
tarballs built on Linux by the `publish-npm.yml` run `41944429877` for the first
`v3.5` tag (source `4bd4e43b7aa6a7c0760eb1c9bebe65b10e41d947`, the squash of #134,
exact Node `24.22.1` and npm `11.5.1`), downloaded from that run's retained
artifacts. That run stopped at "Verify all four retained packages" and published
nothing. Artifact SHA-256, npm SHA-512 integrity and SHA-1 shasum were checked
before deriving the snapshot. The canonical surface fingerprint reader excludes
only `version` and `frameworkMajor`. Every baseline fingerprint equals the
candidate fingerprint recorded in `3.4.json`.
The snapshot and these same artifacts passed
`release-package-contract.mjs --compile-consumers` on exact Node `24.22.1`
and npm `11.5.1` in the source commit's checkout.

The export map, dependencies, peers and engines are unchanged for each line.
Angular 19 adds 13 declaration files for the query-chip text helper, mobile
field/filter sheets, card data, sheet helpers, sorting, filter chips, tools,
pull refresh, mobile models and mobile view/filter utilities. No packed file
is removed. Later Angular lines retain their existing bundled declaration
inventory, and all four lines retain their existing FESM chunk paths.

Each line adds 18 authored sourcemap sources (12 runtime TypeScript files and
six templates), changes 26 existing sources and removes none. Angular 19
changes 16 existing declaration files; later lines change five declaration
bundles. These changes cover table mobile cards, filters, sorting, tools and
pull refresh; the filter-mode setting and inline query-bar default; typed Excel
date/time export and `SdExcelColumn.numFmt`; modal navigation and accessible
names; and the select/account-menu listener lifecycle. The changelog documents
the table defaults, XLSX cell types and mobile autoId migrations. They must be
independently reviewed with this snapshot; CI never regenerates expectations.

## Release 3.4

`3.4.json` compares all four candidates with their same-major published `*.3.3`
baseline. Candidates are the actual `19.3.4` / `20.3.4` / `21.3.4` / `22.3.4`
tarballs built on Linux by the `publish-npm.yml` run `40999588659` for the first
`v3.4` tag (source `e0789741f7a99aacf330c46fb51698f9f430a3c6`, the squash of #126, exact
Node `24.22.1`), downloaded from that run's retained artifacts. That run stopped at
"Verify all four retained packages" and published nothing. The snapshot was built in
an LF worktree of the source commit and checked there with
`release-package-contract.mjs --compile-consumers` against the same artifacts.
The canonical surface fingerprint reader excludes only `version` and `frameworkMajor`.
Every baseline fingerprint equals the candidate fingerprint recorded in `3.3.json`.

The export map, dependencies, peers and engines are unchanged for each line. Angular 19
adds 86 packed files and removes 78: the 78 `modules/pattern` FESM chunks (with maps)
come back under new content hashes, the order form adds `order-lines.ts` and
`lines-table-form.component.ts` to the pattern sources, and six internal deep-path
declarations are new (the table's `config-width.util`, `column-leaf.util`,
`config-custom.util` and `table-query-bar.util`, and the pattern `order-lines` and
`lines-table-form.component`), none of them an entry point. Later Angular lines add 80
files and remove the same 78 re-hashed chunks.

The source and declaration changes cover the table query-bar filter mode, the
redesigned table settings modal and its settings-button dot, the query bar options
(pinned, required and grouped fields, `applyOn`, `openField()`), grouped-header filters
and `values` lists, split filters after a reset, the configuration token rename with
deprecated `*_CONFIG` aliases, the pattern order form and the page table of contents.
They must be independently reviewed with this snapshot; CI never regenerates
expectations.

## Release 3.3

`3.3.json` compares all four candidates with their same-major published `*.3.2`
baseline. Candidates are the actual `19.3.3` / `20.3.3` / `21.3.3` / `22.3.3`
tarballs built on Linux by the `publish-npm.yml` run `40744078668` for the first
`v3.3` tag (source `166f16c79a266781d4aaac4d4ff2090da63d23c0`, the squash of #119, exact
Node `24.22.1`), downloaded from that run's retained artifacts. That run stopped at
"Verify all four retained packages" and published nothing. The snapshot was checked
with `release-package-contract.mjs --compile-consumers` against the same artifacts.
The canonical surface fingerprint reader excludes only `version` and `frameworkMajor`.
Every baseline fingerprint equals the candidate fingerprint recorded in `3.2.json`.

The export map adds `modules/pattern`; no export is removed. Dependencies, peers and
engines are unchanged for each line. Angular 19 adds 317 packed files: 110
`modules/pattern` declarations, 90 `modules/pattern` assets (the README, ten docs and
the feature sources), 98 `modules/pattern` FESM files, 11 declarations for badge,
section, table, upload file and the page layouts, and the four `modules/generic` chunks
(with maps) under new content hashes. It removes ten: the previous `modules/generic`
chunks and the chip `removable-chip.pipe` declarations (`SdRemovableChipPipe`, removed
as the changelog documents). Later Angular lines add 197 files, among them one bundled
declaration entry (`types/sdcorejs-angular-modules-pattern.d.ts`), and remove only the
eight re-hashed `modules/generic` files.

The source and declaration changes cover the page layouts (`sd-page`, `sd-page-list`,
`sd-page-detail`, `sd-page-form`), the pattern screens, the chip input experience and
API clean-up, tab router keyboard support and context menu, the upload file viewer,
field and inline variant, and the table loading layer. They must be independently
reviewed with this snapshot; CI never regenerates expectations.

## Release 3.2

`3.2.json` compares all four candidates with their same-major published `*.3.1`
baseline. Candidates are the actual `19.3.2` / `20.3.2` / `21.3.2` / `22.3.2`
tarballs built on Linux by the `publish-npm.yml` run `39852344872` for the first
`v3.2` tag (source `6aae0c722d9ca1e3b4ca04652bfde90f3510e627`, the squash of #97, exact
Node `22.22.3`), downloaded from that run's retained artifacts. That run stopped at
"Verify all four retained packages" and published nothing. The snapshot was checked
with `release-package-contract.mjs --compile-consumers` against the same artifacts.
The canonical surface fingerprint reader excludes only `version` and `frameworkMajor`.

The first snapshot came from a Windows `deploy.ps1 -DryRun` and matched every
section except the candidate `files` inventory. `modules/generic` is the first entry
point code-split by ng-packagr into content-hashed FESM chunks
(`…-generic-list.page-<hash>.mjs`). A CRLF checkout inlines `\r\n` into compiled
component templates, so a Windows build produces other chunk hashes, and therefore
other file names, than the Linux CI build. Dependencies, exports and the public
surface (declarations and LF-normalised sources) were identical.

The export map adds `./assets/*`, `components/editor-engine`, `components/window`,
`modules/generic` and `services/date-time`; no export is removed. Dependencies move
`@sdcorejs/utils` from `1.2.5` to `1.3.1`, drop `@ckeditor/ckeditor5-angular` and
`ckeditor5`, and add the Tiptap `3.31.4` packages, `@floating-ui/dom` `1.8.0` and
`parse5` `7.3.0`, as the changelog documents. Angular 19 adds 103 packed files and
drops six internal deep-path declarations (the old CKEditor image-upload plugin, the
modal-resizable registry and the chip-calendar removable pipe), none of them an entry
point; later Angular lines add 25 bundled declaration entries. Peers and engines are
unchanged for each line.

The source and declaration changes cover design handoff waves 1–3, Sidebar V4 and the
context switcher, the generic CRUD module, form-generic static elements and buttons,
the configured time zone, unknown-total table pagination, the Tiptap editor engine and
the chip calendar. They must be independently reviewed with this snapshot; CI never
regenerates expectations.

## Release 3.1

`3.1.json` compares all four candidates with their exact same-major published
`*.3.0` baseline. The reviewed source commit is recorded in the snapshot.
Inspectable inputs include independently verified registry baselines and actual
`19.3.1` / `20.3.1` / `21.3.1` / `22.3.1` tarballs built by the official dry-run
from repaired source `c9341724a53df65508f8f67fd14a0a7c4b14ecb1` with exact
Node `22.22.3` and npm `11.5.1`. Their retained SHA-256, npm SHA-512 integrity
and SHA-1 shasum were independently rechecked. The complete inventories,
declaration/source inputs, per-major deltas and all seven packed font hashes
are retained for independent review. The canonical surface fingerprint reader
excludes only `version` and `frameworkMajor`. Final immutable-head builds,
source binding, peers/engines/assets and strict consumers remain separate gates.

The only new export-map entries are `components/kanban` and `forms/segmented`;
no existing export, declaration file or packed path is removed. Angular 19 adds
15 declaration files; later Angular lines add two bundled declaration entries.
Changes cover Explorer typed data/columns, grouped capabilities, selection and
consumer-owned moves; Form multi-page navigation and validation; Section's
optional label/itemLeft slot; outline/confirm/compact UI behavior; Kanban and
Segmented. Runtime dependencies, same-line peers and engines are retained.
The changelog documents custom-catalog additions and the intentional actionless
picker migration. Explicit Form signal annotations preserve the same accepted values while making
Angular19 declaration text independent of inferred union ordering. The canceled
navigation poll checks ownership before reacquiring or touching new schema
controls; the actual action component accepts canonical and legacy definitions.
The source and declaration changes must be independently
reviewed with this snapshot; CI never regenerates expectations.

## Release 3.0

`3.0.json` explicitly binds all four targets to their same-major published
`*.2.15` baseline. Candidates were staged by `deploy.ps1 -DryRun -PatchVersion
3.0 -BaselineSuffix 2.15` from main
`445d18aaa27d30328b5b3fa40ab2c1b9b05b4271`, using each locked Angular toolchain,
Node `22.22.3` and npm `11.5.1`.

The export map adds `components/image-editor`, `components/highlight` and
`utilities/theme`, with no removed entry point. The documented form-generic
schema and component API migration removes the legacy builder/render internals;
Angular 19 drops 72 legacy form-generic declaration paths, while later Angular
lines keep their bundled declaration inventory. The direct `@sdcorejs/utils`
dependency moves from `1.1.4` to `1.2.5`, as documented in the changelog.
Other dependency, peer and engine contracts remain unchanged for each line.

The reviewed source/declaration changes also include theme tokens and modes,
table export limits, editor and resource URL filtering, virtual scrolling,
accessibility, file-explorer/upload integration and icon shapes. The snapshot
pins the complete retained surface rather than waiving these checks. Tarball
hashes, exact source binding, manifests, inventories and strict consumer
compilation remain independent release gates. CI rebuilds from the immutable
release tag and publishes only its verified retained artifacts.

## Release 2.7

`2.7.json` compares each candidate with the published `*.2.6` package from
the same Angular major. Candidates were built from main
`3e3b27989f899713285757013fd0d8c7c7ff5aca` with only package versions changed
to `*.2.7`, using the locked Angular/compiler/TypeScript toolchains, Node
`22.22.3` and npm pack `11.5.1`.

The export map is unchanged and no packed file, declaration file or authored
source is removed. Table declarations add the optional quick-search options,
request/cache values, validity flag and projected right-side directive; existing
call signatures remain compatible. i18n declarations add quick-search and
clear-search messages. Angular 19 adds four declaration files; later majors
include those declarations in their existing table bundle. The shared
`_read-state-panel.scss` file is the only other new packed path. Runtime/style
changes cover quick search, compact filters and commands, circular status icons,
Sidebar V1, centered read states, radio layout, badge alignment and selection
colors.

UI fixes merged after tag `v2.6` were moved from the root changelog's 2.6 section
to 2.7 after checking the actual npm baselines. Existing published archives and
2.5/2.6 snapshots remain unchanged. Integrity, manifest/dependency/engine checks,
source binding and strict consumer compilation still run independently.

## Release 2.6

`2.6.json` compares each candidate with its own published Angular-line baseline
(`19.2.5`, `20.2.5`, `21.2.5`, `22.2.5`). The Angular 21 baseline fallback applies
only to the inception release `22.2.5`.

The candidates were built locally from `4ce4d7fa9ca819ed82a1af26fffe690d37cd9481`
with package versions set to `*.2.6`, locked workspace dependencies, Node
`22.22.3`, and `npm pack` `11.5.1`. The only new export is
`./utilities/read-state`; no existing exports, declaration files or packed files
are removed. Declaration changes add read-state/retry APIs, upload appearance,
confirmation icon/input options, table selection helpers and Excel validation
helpers. The optional autocomplete blur event and optional paginator preserve
existing call sites. Authored-source changes correspond to the reviewed UI,
read-state, focus, date-control and notification changes since `v2.5`.

The snapshot must stay repository-owned and reviewed. The publisher still checks
retained tarball integrity, exact source SHA, peers, engines, dependencies and
strict consumer compilation independently; it never regenerates the snapshot.

## Release 2.5

The original 2.5 gate assumed that Angular 22 support was the only change since
2.4, requiring identical exports, declarations, packed paths and authored source.
Before tagging, PRs [33](https://github.com/sdcorejs/sdcorejs-angular/pull/33),
[34](https://github.com/sdcorejs/sdcorejs-angular/pull/34),
[35](https://github.com/sdcorejs/sdcorejs-angular/pull/35) and
[36](https://github.com/sdcorejs/sdcorejs-angular/pull/36) also added selectable
cards, mobile table cards, number paste normalization and local table sorting.
Exact equality to 2.4 therefore rejected the intended release.

`2.5.json` records SHA-256 fingerprints of both the published baseline and the
reviewed candidate for each Angular line. It was derived from the four retained
packages in the recorded Actions run at `reviewedSourceSha`, after inspecting
the export, declaration, inventory and source differences against npm 2.4.
The only new package entry point is `./components/card`. Additional declarations
cover cards, mobile table rendering and the local sort helper. The two removed
v19 selection-pipe declaration files were internal, absent from package exports;
their selection logic moved to shared helpers. Existing strict consumer fixtures
must still compile against every retained tarball.

The snapshot covers:

- `exports`: the complete package export map.
- `files`: all relative tarball file paths, sorted, without the `package/` prefix.
- `publicSurface`: the complete result of `readPublicSurface`, excluding only
  `version` and `frameworkMajor`. This includes every declaration and every
  authored source embedded in sourcemaps, with the reader's LF normalization.

`fingerprintReleaseValue` recursively sorts object keys, preserves array order,
serializes with `JSON.stringify`, and hashes the UTF-8 result. Both sides must
match their own recorded digest; the gate does not allow arbitrary additions or
changes to a listed component. Framework-specific source transformations are
already present in the per-line candidate snapshots.

Snapshots are loaded from this checkout, never from downloaded artifact metadata.
Unknown release suffixes retain the original exact-baseline checks. Changing a
snapshot requires inspecting the actual package differences and reviewing that
change with the release. Do not regenerate it automatically during CI or simply
replace a failing digest. Inspectable inputs can be recovered with `npm pack` for
the recorded baseline and the linked Actions artifacts (or a fresh build of the
recorded source using the locked toolchain).

Tarball SHA-256, npm integrity/shasum, extracted inventory, source commit binding,
dependency/peer/engine checks, strict consumer compilation and publication
transaction checks still run independently.

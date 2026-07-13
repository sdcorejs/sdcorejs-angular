---
title: Showcase Documentation Site
track: angular
status: implemented
updated_at: 2026-07-13
source_of_truth: versions/v19/projects/showcase
---

# Showcase Documentation Site

## Purpose

The Angular showcase is the public documentation application for `@sdcorejs/angular`. It combines versioned Markdown from released packages with interactive examples from the current workspace, while preserving stable URLs across Angular 19, 20, and 21.

## Source-of-truth model

- Author showcase code in `versions/v19/projects/showcase`.
- Run `npm run sync` from the repository root to mirror compatible source into v20 and v21.
- Run `npm run check:sync` after every synchronization or generated-source update. Do not hand-edit the mirrored showcase trees.
- `documentation.registry.ts` is the typed catalog used by routing, navigation, search, breadcrumbs, pagination, category pages, and example galleries.
- The registry currently contains 85 pages in seven groups: Guides, Components, Forms, Directives, Services, Modules & Integrations, and Pipes & Utilities.
- `published-docs/versions.json` and each version's `index.json` describe the immutable release archive. The generator integrity test verifies every declared archive, document count, unique ID, referenced Markdown file, and the bidirectional mapping between the latest index and the registry.

The main data paths are:

```text
documentation.registry.ts + generated example manifest/source
  -> routes, categories, search, pagination, live examples

published-docs/versions.json
  -> DocsVersionService
  -> selected version and archive metadata

published-docs/<version>/index.json + Markdown
  -> PublishedDocsService
  -> DocsPageComponent
  -> MarkdownRendererComponent
```

## Runtime content flow

1. `docsVersionGuard` resolves `latest` and validates concrete versions at the `/v/:version` parent route. Canonical redirects preserve the remaining path, query parameters, and fragment.
2. The registry resolves the requested category, page, tab, aliases, and adjacent pages.
3. Page availability moves from `unknown` to published documentation, current live demo, or unavailable for the selected historical version.
4. Published tabs fetch Markdown below the deployment base URI. When historical Markdown is missing but the page has a live example, navigation intentionally opens the Examples tab and labels it as a current live demo.
5. Generated example metadata lazily loads only the selected Angular scenario. Generated source records power View source without bundling every source string into the initial route.

## Public routes

| Route | Purpose |
| --- | --- |
| `/` | Documentation landing page |
| `/v/:version/getting-started` | Version-aware installation and setup |
| `/v/:version/:category` | Category overview |
| `/v/:version/:category/:slug/:tab` | Overview, Styling, API, or Examples for a page |
| `/v/:version/changelog` | Version-aware changelog |
| `/about` | Project information |

Legacy category/page paths are resolved through registry metadata and redirected to the canonical latest URL. Unknown categories, pages, tabs, and versions render or redirect to the documented not-found behavior instead of silently returning home.

If the version manifest cannot be loaded, the guard leaves local routes usable instead of turning an offline documentation session into a redirect loop. A resolved version selection is retained locally for the next visit.

## Search and internal links

- Global search indexes registry metadata and example metadata. The highest-ranking match owns the destination, so an exact example result opens Examples while a page-content result opens Overview.
- The search surface follows the combobox/listbox pattern, keeps options out of the tab sequence, announces result counts, traps focus while open, and restores focus only after the surrounding shell is interactive again.
- Same-route table-of-contents links update the fragment without stealing focus. Cross-route fragment navigation focuses the resolved heading after navigation.
- Markdown links resolve in this order: exact published ID, unique basename, then known category fallback such as Forms. Query strings and fragments are retained, same-site links use Angular navigation, and unresolved historical links fall back to their archive URL.

## Layout and accessibility contracts

- Desktop uses a persistent primary sidebar and an optional right-hand table of contents. Tablet and mobile collapse navigation without introducing horizontal page overflow.
- Wide examples, including Table, scroll inside their own content region and cannot render underneath the right-hand table of contents.
- Example action rows and grouped controls use shared gaps; icon-only controls have accessible names and minimum 44 px targets.
- Full-width examples render as modal dialogs with a real backdrop, initial focus, focus trapping, Escape handling, scroll locking, background `inert`, and restoration on close or destroy.
- Focus traps derive their boundaries from controls that are actually tabbable and rendered; disabled, hidden, inert, and CSS-invisible controls are excluded. The mobile drawer waits for the rendered sidebar to lose `inert` before moving focus.
- Source and navigation disclosures keep the `aria-controls` target in the DOM while collapsed and synchronize `aria-expanded` with the hidden state.
- Copy actions report success only after the clipboard promise resolves, report failures, cancel stale timers, and ignore stale async completions.
- The table of contents uses nested lists that preserve heading hierarchy. Rendered Markdown declares its content language explicitly.

## Installation guidance

Getting Started and the home-page command are generated from the selected documentation major. Core UI, Angular Material, and the date-fns adapter are pinned to compatible major ranges, and the setup includes Material Symbols and Roboto font assets.

## Generated artifacts

Do not edit these files manually:

- `docs/generated/changelog.generated.ts`
- `docs/generated/example-manifest.generated.ts`
- `docs/generated/example-sources.generated.ts`

Regenerate and validate them from the repository root:

```powershell
npm run generate:showcase
npm run test:showcase-generators
npm run sync
npm run check:sync
```

`npm run collect-docs` and `npm run collect-release-docs` belong to the release archive workflow. They are not substitutes for normal showcase generation and should not be used to rewrite an existing published version during page authoring.

## Adding or changing a documentation page

1. Update the v19 registry entry, including canonical category/slug, published document ID, aliases, keywords, tabs, and examples.
2. Add or update focused example components and stable section IDs when interactive demos are needed.
3. Regenerate showcase artifacts.
4. Add focused tests for routes, availability, search destination, renderer behavior, and accessibility when those contracts change.
5. Synchronize v20/v21 and verify parity.
6. Run the complete validation matrix below.

## Validation matrix

```powershell
npm run test:showcase-generators
npm --prefix versions/v19 run test:showcase
npm --prefix versions/v20 run test:showcase
npm --prefix versions/v21 run test:showcase
npm --prefix versions/v19 run build:showcase
npm --prefix versions/v20 run build:showcase
npm --prefix versions/v21 run build:showcase
npm run check:sync
git diff --check
```

For visual changes, also inspect representative routes at desktop, tablet, and 390 px mobile widths. Check page overflow, shell navigation, search focus, one `h1` per route, table/example containment, table-of-contents overlap, disclosure state, and full-width dialog focus/background isolation.

## Local production preview

The Angular build emits the application under `versions/<major>/dist/showcase/browser`. Released Markdown is deployed separately under `docs/`; a local static production preview therefore needs `published-docs` copied beneath the preview's `browser/docs` directory, plus a `latest` copy of the concrete version named by `published-docs/versions.json`.

## Key entry points

| File or service | Responsibility |
| --- | --- |
| `app.routes.ts` | Lazy public route tree and route titles |
| `docs/core/documentation.registry.ts` | Canonical page, alias, tab, keyword, and example metadata |
| `DocsVersionService` | Version manifest, selection, canonical version, and archive URLs |
| `PublishedDocsService` | Per-version index and Markdown retrieval |
| `docs-search.utils.ts` / `GlobalSearchComponent` | Search scoring, result grouping, keyboard interaction, and destination selection |
| `docs-page-availability.ts` | Published/live-demo/unavailable classification |
| `ShellComponent` | Responsive primary navigation, header, drawer, and page focus |
| `MarkdownRendererComponent` | Safe Markdown rendering, links, language, code, and copy behavior |
| `ExampleViewerComponent` | Lazy examples, source disclosure, copy behavior, and full-width dialog |
| `scripts/generate-showcase-*.mjs` | Changelog/example generation and freshness contracts |
| `published-docs/versions.json` | Public archive manifest and latest concrete version |

## Failure and maintenance behavior

- Invalid online versions canonicalize without losing their deep route, query, or fragment; unknown content reaches a real not-found page.
- Missing historical Markdown is not presented as current documentation. When a current compiled demo exists, it is explicitly labeled as a live demo.
- All document and asset URLs must remain base-href-safe because GitHub Pages hosts the application below a non-root path.
- Generator freshness, registry/archive equality, per-version counts, unique IDs, and referenced files are test-gated. A failing integrity test must be repaired at its source instead of bypassed with a new hard-coded count.

## Key decisions

- Keep one framework-free documentation application instead of adding another documentation runtime.
- Treat v19 as source of truth to prevent three independently drifting showcase implementations.
- Preserve released Markdown as immutable historical content while allowing the latest workspace's examples to remain useful from older version pages.
- Derive navigation and integrity checks from typed metadata rather than maintaining parallel hard-coded menus or counts.

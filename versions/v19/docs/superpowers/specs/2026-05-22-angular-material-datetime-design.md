# Design Spec — `@sdcorejs/angular-material-datetime`

- **Date**: 2026-05-22
- **Author**: anh.hoang10@onemount.com (Hoang Anh)
- **Status**: Approved (pending writing-plans phase)
- **Repo target**: new repo `github.com/sdcorejs/angular-material-datetime` (independent from `vn-angular`)

---

## 1. Problem & Goals

### Problem
The current `<sd-datetime>` component lives inside `projects/sdcorejs-angular/forms/datetime/` and is tightly coupled to SDCoreJS internals (`SdLabel`, `SdView`, `SdFormControl`, `I18nService`, `DateUtilities`, `SD_FORM_CONFIGURATION`). It cannot be reused outside the `@sdcorejs/angular` ecosystem. Angular Material itself does **not** ship a datetime picker, time-only picker, or date-range picker with time-of-day — leaving a real gap for the broader Angular OSS community.

### Goals
1. Ship an independent Angular library — **directive-first, no opinionated wrapper component** — that adds datetime, time-only, and date-range-with-time pickers to the Angular Material ecosystem.
2. Adapter-pluggable: developer picks the underlying date library (`native`, `date-fns`, `moment`) via a provider function — same DI pattern as Angular Material's stock adapters.
3. Idiomatic OSS API: standard `ControlValueAccessor`, generic value type `D` matching the adapter, no proprietary form patterns.
4. Compatibility with Angular **v19, v20, v21+** (signal APIs stable baseline).
5. Publishable on npm under `@sdcorejs/*` scope with provenance attestation.
6. Public GitHub Pages docs site with live examples and API reference.

### Non-goals (out of scope for v0.1)
- Luxon adapter (deferred to v0.2)
- `<sd-time-range-picker>` (time-only range)
- Quick-preset chips (`today` / `last 7 days` / etc.)
- Per-PR preview deploy (Netlify/Vercel)
- Migration shim inside `sd-angular` (separate task in `vn-angular` repo)
- Backwards compatibility with the existing `<sd-datetime>` selector / value format

---

## 2. Implementation strategy: clean-room rewrite

This library is a **clean-room rewrite** — NOT a fork of any existing OSS datetime picker library. The implementer must not read source code from third-party datetime picker libraries during implementation, to keep the codebase free of any derivative-work obligations.

### Permitted references (read freely)
- Angular Material source code (MIT, intended extension surface) — patterns for `MatDatepickerInput`, `MatCalendar`, `MatDateRangeInput`, value-accessor wiring
- The existing `<sd-datetime>` source in `projects/sdcorejs-angular/forms/datetime/` (owned codebase)
- Material 3 datepicker public design specs
- Public API documentation (READMEs, JSDoc on npm) of third-party datetime libs — interfaces are not copyrightable

### Forbidden references
- Source code (`.ts` / `.scss` / `.html`) of any third-party datetime picker library (do not clone their repo, do not read individual files)
- Test files of such libraries

### Leverage approach (reduces effort)
- Use Angular Material's `<mat-calendar>` directly for calendar UI — wrap, do not reimplement
- Use Material's `<mat-date-range-input>` and range-selection mode for the range picker shell
- Build `<sd-time-spinner>` from scratch (Material has no equivalent)
- Build input directives following the `MatDatepickerInput` pattern (study Material source, write fresh implementation for time-aware parsing)
- Overlay wrapper hosts `<mat-calendar>` + `<sd-time-spinner>` + actions slot

---

## 3. Repo & package structure

```
angular-material-datetime/
├── angular.json
├── package.json                       (workspace root, devDeps only)
├── tsconfig.json
├── README.md
├── LICENSE                            (MIT, "Copyright (c) 2026 SDCoreJS contributors")
├── projects/
│   ├── datetime/                      → npm: @sdcorejs/angular-material-datetime
│   │   ├── ng-package.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── datetime-picker/
│   │       │   ├── timepicker/
│   │       │   ├── date-range-picker/
│   │       │   ├── core/              (SdDateAdapter<D>, SD_DATE_FORMATS, tokens)
│   │       │   └── native/            (SdNativeDateAdapter + provideSdNativeDateAdapter)
│   │       └── public-api.ts
│   ├── moment-adapter/                → npm: @sdcorejs/angular-material-datetime-moment
│   ├── date-fns-adapter/              → npm: @sdcorejs/angular-material-datetime-date-fns
│   └── demo/                          (Angular app for GH Pages — not published)
├── docs/                              (markdown reference; copied into demo build)
├── compat-tests/
│   └── consumer-app/                  (small consumer app for cross-Angular-version matrix)
└── .github/workflows/
    ├── ci.yml
    ├── compat-matrix.yml
    └── release.yml + deploy-pages.yml
```

### Convention
- **Native adapter is bundled into the core package** (zero extra install for "just works")
- **Moment and date-fns adapters are separate npm packages** (developer installs only what they use)
- All three packages publish lockstep (same version)
- v0.x during pre-stable; bump to `19.0.0` aligned with Angular major when API stabilizes

### Naming
- Prefix `Sd*` for classes (`SdDatetimePicker`, `SdTimepicker`, `SdDateRangePicker`)
- Selector `sd-*` for components (`<sd-datetime-picker>`)
- Attribute selector `sd*` for directives (`[sdDatetimePicker]`)
- The `-picker` suffix differentiates from the existing `<sd-datetime>` in `vn-angular` → both libraries can coexist in the same Angular app without selector clash

---

## 4. `SdDateAdapter<D>` abstraction

Angular Material's stock `DateAdapter<D>` provides date operations (year/month/day) but lacks time-of-day operations needed for a datetime picker. The library introduces `SdDateAdapter<D>` extending `DateAdapter<D>` with time methods.

```ts
// projects/datetime/src/lib/core/date-adapter.ts
import { DateAdapter } from '@angular/material/core';

export abstract class SdDateAdapter<D> extends DateAdapter<D> {
  // Getters
  abstract getHour(date: D): number;
  abstract getMinute(date: D): number;
  abstract getSecond(date: D): number;

  // Immutable setters (return new D)
  abstract setHour(date: D, hour: number): D;
  abstract setMinute(date: D, minute: number): D;
  abstract setSecond(date: D, second: number): D;

  // Datetime constructor
  abstract createDatetime(
    year: number, month: number, date: number,
    hour: number, minute: number, second: number
  ): D;
}
```

### Format token (mirrors `MAT_DATE_FORMATS`)

```ts
// projects/datetime/src/lib/core/date-formats.ts
export interface SdDateFormats {
  parse:   { dateInput: string; datetimeInput: string; timeInput: string; };
  display: {
    dateInput: string;
    datetimeInput: string;
    timeInput: string;
    monthYearLabel: string;
    dateA11yLabel: string;
    monthYearA11yLabel: string;
    popupHeaderDateLabel: string;
  };
}
export const SD_DATE_FORMATS = new InjectionToken<SdDateFormats>('sd-date-formats');
```

### Wiring (consumer app)

```ts
import { provideSdNativeDateAdapter } from '@sdcorejs/angular-material-datetime';
// or:
import { provideSdMomentDateAdapter } from '@sdcorejs/angular-material-datetime-moment';
// or:
import { provideSdDateFnsAdapter } from '@sdcorejs/angular-material-datetime-date-fns';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSdDateFnsAdapter({
      parse:   { datetimeInput: 'dd/MM/yyyy HH:mm', /* ... */ },
      display: { datetimeInput: 'dd/MM/yyyy HH:mm', /* ... */ },
    }),
  ],
};
```

Each adapter package ships exactly: one `SdDateAdapter<D>` implementation + one `provideSd<Lib>DateAdapter()` provider function. Expected size: ~250-400 LOC per adapter.

---

## 5. Public API surface

### Core package `@sdcorejs/angular-material-datetime`

**Datetime picker**
| Symbol | Kind | Purpose |
|---|---|---|
| `<sd-datetime-picker>` | Component | Overlay container (calendar + time spinner) |
| `[sdDatetimePicker]` | Directive on `<input>` | Bind input ↔ picker, parse/format, validate |
| `[sdDatetimePickerToggle]` | Directive (button) | Toggle button that opens the picker |
| `<sd-datetime-picker-actions>` | Component | Slot for action buttons |
| `[sdDatetimePickerApply]` | Directive (button) | Confirm value, close popup |
| `[sdDatetimePickerCancel]` | Directive (button) | Discard, close popup |
| `[sdDatetimePickerClear]` | Directive (button) | Set null, close popup |

**Time-only picker**
| Symbol | Kind | Purpose |
|---|---|---|
| `<sd-timepicker>` | Component | Standalone HH:mm[:ss] spinner, implements CVA |
| `[sdTimepickerInput]` | Directive on `<input>` | Bind input ↔ timepicker (text-entry) |

**Date-range with time**
| Symbol | Kind | Purpose |
|---|---|---|
| `<sd-date-range-picker>` | Component | 2-pane calendar + dual time spinners |
| `[sdDateRangeStart]` | Directive on `<input>` | Start input |
| `[sdDateRangeEnd]` | Directive on `<input>` | End input |
| `[sdDateRangePickerToggle]` | Directive (button) | Toggle button |
| `<sd-date-range-picker-actions>` | Component | Actions slot |

**Core primitives** (exported for advanced consumers)
- `SdDateAdapter<D>` abstract class
- `SD_DATE_FORMATS` token + `SdDateFormats` interface
- `SdNativeDateAdapter` (bundled)
- `provideSdNativeDateAdapter()` provider function
- `SD_DATETIME_DEFAULT_OPTIONS` token for global defaults (`showSeconds`, `stepMinute`, `color`, `touchUi`)

### Adapter packages
- `@sdcorejs/angular-material-datetime-moment` → `SdMomentDateAdapter`, `provideSdMomentDateAdapter(formats?)`
- `@sdcorejs/angular-material-datetime-date-fns` → `SdDateFnsAdapter`, `provideSdDateFnsAdapter(formats?)`

### Form integration
- All input directives implement `ControlValueAccessor`
- Compatible with `[formControl]`, `formControlName`, `[(ngModel)]`
- Value type is the adapter's generic `D` — `Date` for native, `Moment` for moment-adapter, `Date` for date-fns-adapter

### Standalone-only
- All components and directives declared `standalone: true`
- **No NgModule exports** — clean v19+ approach

### Usage example

```ts
import {
  SdDatetimePicker, SdDatetimePickerInput, SdDatetimePickerToggle,
  SdDatetimePickerActions, SdDatetimePickerApply, SdDatetimePickerCancel,
  SdDatetimePickerClear,
} from '@sdcorejs/angular-material-datetime';

@Component({
  imports: [
    ReactiveFormsModule, MatInputModule, MatButtonModule,
    SdDatetimePicker, SdDatetimePickerInput, SdDatetimePickerToggle,
    SdDatetimePickerActions, SdDatetimePickerApply,
    SdDatetimePickerCancel, SdDatetimePickerClear,
  ],
  template: `
    <mat-form-field>
      <input matInput [sdDatetimePicker]="picker" [formControl]="ctrl">
      <button matSuffix [sdDatetimePickerToggle]="picker"></button>
      <sd-datetime-picker #picker [showSeconds]="true">
        <sd-datetime-picker-actions>
          <button sdDatetimePickerClear>Clear</button>
          <button sdDatetimePickerCancel>Cancel</button>
          <button sdDatetimePickerApply>Apply</button>
        </sd-datetime-picker-actions>
      </sd-datetime-picker>
    </mat-form-field>
  `,
})
export class DemoComponent {
  ctrl = new FormControl<Date | null>(null);
}
```

---

## 6. Build & CI matrix

### Build per package
- `ng build <project>` → `ng-packagr` → FESM2022 + `.d.ts` + sourcemaps
- `sideEffects: false` in each `package.json`
- Peer dependencies (datetime core):
  ```json
  {
    "@angular/cdk":      ">=19.0.0 <22.0.0",
    "@angular/common":   ">=19.0.0 <22.0.0",
    "@angular/core":     ">=19.0.0 <22.0.0",
    "@angular/material": ">=19.0.0 <22.0.0"
  }
  ```
- Adapter packages add `moment` or `date-fns` as peer deps with open-ended `>=` ranges
- Upper bound (`<22.0.0`) bumped each Angular major release after compat matrix passes

### Lint + unit test
- ESLint with two configs: strict for `projects/datetime`, `projects/moment-adapter`, `projects/date-fns-adapter`; loose for `projects/demo`
- **Unit test framework: Jest** (faster than Karma, better snapshots, modern OSS Angular norm via `jest-preset-angular`)
- Coverage targets: 80%+ overall, 95%+ for `SdDateAdapter` implementations
- Strict type check: `tsc --noEmit -p projects/<name>/tsconfig.lib.json`

### CI workflows

**`ci.yml`** — runs on every PR + push to main:
```yaml
jobs:
  lint-test-build:
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - npm ci
      - npm run lint
      - npm run test -- --coverage
      - npm run build:all
      - upload coverage to Codecov
```

**`compat-matrix.yml`** — runs nightly + before any release:
```yaml
jobs:
  angular-compat:
    strategy:
      fail-fast: false
      matrix:
        angular: ['^19.0.0', '^20.0.0', '^21.0.0']
    steps:
      - npm ci
      - npm run build:all
      - cd compat-tests/consumer-app
      - npm install
      - npm install @angular/core@${{ matrix.angular }} @angular/common@${{ matrix.angular }} @angular/material@${{ matrix.angular }} @angular/cdk@${{ matrix.angular }}
      - npm install ../../dist/datetime ../../dist/moment-adapter ../../dist/date-fns-adapter
      - ng build
      - ng test --watch=false
```

`compat-tests/consumer-app/` is a small Angular app that uses all three pickers and all three adapters, with ~10 smoke tests. This catches API breakage when Angular bumps major.

**`release.yml`** — runs when a git tag `v*` is pushed:
```yaml
permissions:
  id-token: write           # required for npm provenance
  contents: write           # required for GitHub release
jobs:
  publish:
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - npm ci
      - npm run build:all
      - echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > ~/.npmrc
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}     # existing GH secret
      - npm publish dist/datetime --provenance --access public
      - npm publish dist/moment-adapter --provenance --access public
      - npm publish dist/date-fns-adapter --provenance --access public
      - create GitHub release with auto-generated notes
```

Authentication uses the existing `NPM_TOKEN` secret. The `--provenance` flag adds cryptographic build attestation via the workflow's OIDC token — independent from auth.

### Versioning policy
- **Pre-1.0** (`0.x.y`): MINOR bump for breaking changes, PATCH for fixes
- **Post-1.0**: strict SemVer; major bump when peer Angular range changes (e.g., drop v19 → major bump)

---

## 7. Demo site + docs (GitHub Pages)

One Angular app at `projects/demo` builds a static SPA hosted on GitHub Pages at `https://sdcorejs.github.io/angular-material-datetime/`.

### Pages
```
projects/demo/src/app/pages/
├── home/                      (feature overview, install snippet)
├── getting-started/           (install, pick adapter, basic example)
├── datetime-picker/           (live demo + props/events tables)
├── timepicker/                (live demo)
├── date-range-picker/         (live demo)
├── adapters/                  (compare native vs moment vs date-fns)
└── api-reference/             (auto-generated from TypeDoc)
```

**Note**: no "migration from third-party lib" page. The library is presented as a standalone project with no external references.

### Docs content (`docs/` at repo root)
Plain markdown files:
```
docs/
├── getting-started.md
├── datetime-picker.md
├── timepicker.md
├── date-range-picker.md
├── adapters/
│   ├── native.md
│   ├── moment.md
│   └── date-fns.md
└── api-reference.md           (generated by TypeDoc, not committed)
```

Build step copies `docs/*` → `projects/demo/src/assets/docs/` before `ng build demo`. Demo app loads markdown at runtime via HTTP GET and renders with `marked`.

### API reference
- Generated by `typedoc` from JSDoc comments in source
- CI script `npm run docs:api` runs before demo build
- Output written to `docs/api-reference.md`

### Deploy workflow (`deploy-pages.yml`)
```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    permissions:
      pages: write
      id-token: write
    steps:
      - npm ci
      - npm run build:all
      - npm run docs:api
      - npx ng build demo --base-href "/angular-material-datetime/"
      - actions/upload-pages-artifact: { path: dist/demo/browser }
      - actions/deploy-pages
```

`404.html` redirect trick handles client-side SPA routing on GitHub Pages.

### Per-PR preview deploys
Explicitly skipped for v0.1 (no Netlify / Vercel integration).

---

## 8. Initial release path

### Milestones

| Phase | Deliverable | Effort |
|---|---|---|
| **M0 — Bootstrap** | Repo created, workspace scaffolded, CI skeleton, LICENSE (MIT) in place, GitHub repo settings (branch protection, required CI checks) | 1-2 days |
| **M1 — Core + native + datetime picker** | `SdDateAdapter<D>`, `SdNativeDateAdapter`, `<sd-time-spinner>`, `<sd-datetime-picker>` overlay wrapping `<mat-calendar>`, `[sdDatetimePicker]` input directive with CVA, all action directives (toggle/apply/cancel/clear), unit tests ≥80% coverage | 7-10 days |
| **M2 — Timepicker** | `<sd-timepicker>` standalone component (reuses `<sd-time-spinner>` from M1) + `[sdTimepickerInput]` + tests | 2-3 days |
| **M3 — Adapter packages** | `-moment` + `-date-fns` clean adapter implementations + per-adapter unit tests at 95% coverage | 3-4 days |
| **M4 — Date-range picker** | `<sd-date-range-picker>` wrapping `<mat-date-range-input>` + dual time spinners + range validators (`startBeforeEnd`) + tests | 7-10 days |
| **M5 — Demo + docs site** | Demo app pages for all three pickers + markdown docs + TypeDoc API ref + GH Pages deploy workflow | 3-5 days |
| **M6 — Compat matrix + release** | `compat-tests/consumer-app/` + nightly compat matrix CI + `release.yml` wired to `NPM_TOKEN` + tag `v0.1.0` → npm publish all three packages | 2-3 days |
| **Total** | First public release `v0.1.0` | **~25-35 days** of focused effort |

### `v0.1.0` README outline
- Title: "Angular Material Datetime / Timepicker / Date-range — adapter-pluggable"
- Quick-start: 4-line install + minimal example
- Adapter matrix table (native / moment / date-fns)
- Angular compatibility table (v19, v20, v21)
- Links to demo site
- Contributing + License (MIT)
- **No mention of any third-party datetime picker library**

### Deferred (post-v0.1, not in this spec)
- Luxon adapter package
- `<sd-time-range-picker>` (time-only range)
- Quick-preset chips
- Localization recipes (Vietnamese formats, `weekStartsOn`, etc.)
- E2E tests with Playwright
- Migration shim inside `sd-angular` for projects moving off `<sd-datetime>`

---

## 9. Risks & open questions

| Risk | Mitigation |
|---|---|
| `<mat-calendar>` internals change between Angular majors and break the overlay wrapper | Compat matrix catches early; pin to documented public Material API only |
| `<sd-time-spinner>` UX requires iteration to feel natural | Allocate buffer in M1; ship simple HH:MM spinner first, refine post-feedback |
| Bundle size of moment adapter is large (~70 KB unminified) due to moment.js itself | Document the cost; moment-adapter is opt-in via separate package install |
| `ControlValueAccessor` value type generic `D` may be awkward for consumers using `FormBuilder` | Provide TypeScript helper types (`SdFormDate<D>`) and example snippets in docs |
| Clean-room discipline — implementer accidentally reads third-party datetime picker source during research | Document the rule in `CONTRIBUTING.md`; rely on author self-discipline |

### Open questions (to resolve in writing-plans phase, not blocking this spec)
- Exact Jest configuration (preset, jsdom environment, snapshot serializers)
- Whether to use Angular's built-in control-flow (`@if` / `@for`) in component templates (yes by default — v19+ baseline)
- Naming for the time-spinner internal component (`<sd-time-spinner>` vs `<sd-time-input>`)
- Whether to expose a low-level `[sdDatetimeOverlay]` for power users wanting a custom calendar UI

---

## 10. Acceptance criteria for `v0.1.0`

The library is considered ready for `v0.1.0` release when:
- [ ] All three pickers (`<sd-datetime-picker>`, `<sd-timepicker>`, `<sd-date-range-picker>`) work with `[formControl]`, `formControlName`, and `[(ngModel)]`
- [ ] All three adapters (native bundled, moment, date-fns) compile and pass their unit tests
- [ ] `compat-matrix.yml` passes green for Angular `^19`, `^20`, `^21`
- [ ] Unit test coverage ≥ 80% overall, ≥ 95% for adapter classes
- [ ] Demo site is deployed and reachable at the public GitHub Pages URL with all picker examples working
- [ ] All three npm packages publish successfully with `--provenance` attestation visible on npmjs.com
- [ ] README contains install, quick-start, adapter matrix, compatibility table, and license — no mention of any third-party datetime picker library
- [ ] Repository contains no references to third-party datetime picker libraries in source, tests, docs, or commit messages

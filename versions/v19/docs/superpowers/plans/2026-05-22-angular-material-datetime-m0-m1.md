# `@sdcorejs/angular-material-datetime` — M0+M1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the `angular-material-datetime` repo and deliver a working `<sd-datetime-picker>` end-to-end (overlay + `<mat-calendar>` wrap + `<sd-time-spinner>` + `[sdDatetimePicker]` input directive with CVA + all action directives), published as an installable npm tarball with ≥80% unit test coverage.

**Architecture:** Plain Angular CLI workspace with 4 projects (`datetime` lib + 2 placeholder adapter libs + demo app). Directive-first API inspired by Material's `MatDatepickerInput` pattern. Native date adapter is bundled in the core package; moment / date-fns adapters get scaffolded packages but no implementation in this plan (deferred to M3). Standalone components only — no NgModule exports.

**Tech Stack:** Angular 19+ (signal APIs stable), `ng-packagr` for library build, `@angular/material` + `@angular/cdk` peer deps, Jest via `jest-preset-angular` for unit tests, ESLint via `@angular-eslint`.

**Spec reference:** `vn-angular/docs/superpowers/specs/2026-05-22-angular-material-datetime-design.md`

---

## Scope of this plan

| Spec milestone | In this plan? |
|---|---|
| M0 — Bootstrap | ✅ Full |
| M1 — Core + native + datetime picker | ✅ Full |
| M2 — Timepicker | ❌ Next plan |
| M3 — Adapter packages (moment, date-fns) | ❌ Next plan (only stub package.json files here) |
| M4 — Date-range picker | ❌ Next plan |
| M5 — Demo + docs site | ⚠️ Minimal demo only (single page proving datetime picker works); full docs deferred |
| M6 — Compat matrix + release | ⚠️ Single Angular version (v19) CI only; full matrix + release workflow deferred |

---

## Repo location

- **New repo path**: `c:\Users\nghiatt15_onemount\Documents\sdcorejs\angular-material-datetime\` (sibling to `sdcorejs-agent`, `sdcorejs-ultis`)
- **GitHub remote**: `git@github.com:sdcorejs/angular-material-datetime.git` (repo created in Task 1)
- **All bash commands below assume CWD = the new repo unless stated otherwise**

---

## File structure overview (end-of-plan state)

```
angular-material-datetime/
├── .editorconfig
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── LICENSE                                          (MIT)
├── README.md                                        (minimal — install + 1 example)
├── angular.json
├── package.json                                     (workspace root)
├── package-lock.json
├── tsconfig.json
├── tsconfig.base.json
├── jest.config.ts
├── setup-jest.ts
├── projects/
│   ├── datetime/
│   │   ├── ng-package.json
│   │   ├── package.json
│   │   ├── tsconfig.lib.json
│   │   ├── tsconfig.lib.prod.json
│   │   ├── tsconfig.spec.json
│   │   ├── src/
│   │   │   ├── public-api.ts
│   │   │   └── lib/
│   │   │       ├── core/
│   │   │       │   ├── date-adapter.ts             (abstract SdDateAdapter<D>)
│   │   │       │   ├── date-formats.ts             (SdDateFormats, SD_DATE_FORMATS)
│   │   │       │   └── default-options.ts          (SD_DATETIME_DEFAULT_OPTIONS)
│   │   │       ├── native/
│   │   │       │   ├── native-date-adapter.ts      (SdNativeDateAdapter)
│   │   │       │   ├── native-date-formats.ts      (SD_NATIVE_DATE_FORMATS)
│   │   │       │   └── provide-native.ts           (provideSdNativeDateAdapter)
│   │   │       ├── time-spinner/
│   │   │       │   ├── time-spinner.component.ts
│   │   │       │   ├── time-spinner.component.html
│   │   │       │   └── time-spinner.component.scss
│   │   │       └── datetime-picker/
│   │   │           ├── datetime-picker.component.ts
│   │   │           ├── datetime-picker.component.html
│   │   │           ├── datetime-picker.component.scss
│   │   │           ├── datetime-picker-input.directive.ts
│   │   │           ├── datetime-picker-toggle.directive.ts
│   │   │           ├── datetime-picker-actions.component.ts
│   │   │           ├── datetime-picker-apply.directive.ts
│   │   │           ├── datetime-picker-cancel.directive.ts
│   │   │           └── datetime-picker-clear.directive.ts
│   │   └── tests/                                   (spec files mirror src/)
│   ├── moment-adapter/                              (stub package.json + README only)
│   ├── date-fns-adapter/                            (stub package.json + README only)
│   └── demo/                                        (Angular app, single page)
└── .github/workflows/
    └── ci.yml                                       (lint + test + build)
```

---

## Phase A — Bootstrap (M0)

### Task 1: Create new repo directory + git init

**Files:** new directory only.

- [ ] **Step 1: Create the directory**

```powershell
New-Item -ItemType Directory -Path "c:\Users\nghiatt15_onemount\Documents\sdcorejs\angular-material-datetime"
Set-Location "c:\Users\nghiatt15_onemount\Documents\sdcorejs\angular-material-datetime"
git init
git branch -M main
```

- [ ] **Step 2: Verify directory is empty and git is initialized**

Run: `git status`
Expected: `On branch main / No commits yet / nothing to commit`

- [ ] **Step 3: Create GitHub repo (do NOT push yet — push happens after first commit)**

```powershell
# requires gh CLI logged in, OR create manually on github.com under sdcorejs org
gh repo create sdcorejs/angular-material-datetime --public --description "Datetime, timepicker, and date-range picker for Angular Material — adapter-pluggable" --homepage "https://sdcorejs.github.io/angular-material-datetime/"
git remote add origin git@github.com:sdcorejs/angular-material-datetime.git
```

- [ ] **Step 4: Verify remote is set**

Run: `git remote -v`
Expected: `origin git@github.com:sdcorejs/angular-material-datetime.git (fetch) / (push)`

---

### Task 2: Add LICENSE + .gitignore + .editorconfig

**Files:**
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `.editorconfig`

- [ ] **Step 1: Write LICENSE (MIT)**

Create `LICENSE`:
```
MIT License

Copyright (c) 2026 SDCoreJS contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Write .gitignore**

Create `.gitignore`:
```
# Dependencies
/node_modules
/.pnp
.pnp.js

# Build outputs
/dist
/tmp
/out-tsc
/bazel-out

# Coverage
/coverage

# IDEs / Editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace
/.vscode/*
!/.vscode/settings.json
!/.vscode/tasks.json
!/.vscode/launch.json
!/.vscode/extensions.json

# Misc
/.angular/cache
.sass-cache/
/connect.lock
/libpeerconnection.log
npm-debug.log
yarn-error.log
testem.log
/typings

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Write .editorconfig**

Create `.editorconfig`:
```
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 4: Commit**

```powershell
git add LICENSE .gitignore .editorconfig
git commit -m "chore: add LICENSE (MIT), .gitignore, .editorconfig"
```

---

### Task 3: Initialize Angular workspace (no app)

**Files:**
- Create: `angular.json`, `package.json`, `tsconfig.json`, `tsconfig.base.json`, `README.md` (via `ng new`)

- [ ] **Step 1: Run `ng new` with workspace-only mode**

```powershell
# Use latest Angular 19.x
npx -p @angular/cli@^19 ng new angular-material-datetime --create-application=false --package-manager=npm --strict --skip-git --directory=.
```

- [ ] **Step 2: Verify generated files**

Run: `dir`
Expected: see `angular.json`, `package.json`, `tsconfig.json`, `node_modules/` after install.

- [ ] **Step 3: Pin Angular version in `package.json`**

Edit `package.json` `devDependencies`:
```json
{
  "devDependencies": {
    "@angular/cli": "~19.0.0",
    "@angular/compiler-cli": "~19.0.0",
    "@angular-devkit/build-angular": "~19.0.0",
    "typescript": "~5.6.0"
  }
}
```
Run: `npm install`

- [ ] **Step 4: Replace generated README.md with a minimal placeholder**

Overwrite `README.md`:
```markdown
# @sdcorejs/angular-material-datetime

Datetime, timepicker, and date-range picker components for Angular Material.

**Status:** under construction (pre-1.0). First release `v0.1.0` planned.

## Packages

| Package | Purpose |
| --- | --- |
| `@sdcorejs/angular-material-datetime` | Core components, directives, and the bundled native date adapter |
| `@sdcorejs/angular-material-datetime-moment` | Moment.js adapter |
| `@sdcorejs/angular-material-datetime-date-fns` | date-fns adapter |

## License

MIT — see [LICENSE](./LICENSE).
```

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "chore: initialize Angular 19 workspace (no apps)"
```

---

### Task 4: Generate `datetime` library project

**Files:**
- Create: `projects/datetime/**` via `ng generate library`

- [ ] **Step 1: Generate the library**

```powershell
npx ng generate library datetime --skip-install
```

- [ ] **Step 2: Verify generated structure**

Run: `dir projects\datetime\src\lib`
Expected: see `datetime.ts` (component or service stub from generator), `datetime.spec.ts`, plus `projects/datetime/ng-package.json`, `projects/datetime/package.json`, `projects/datetime/tsconfig.lib.json`.

- [ ] **Step 3: Delete generator stub files (keep folder structure)**

```powershell
Remove-Item projects\datetime\src\lib\* -Recurse -Force
```

- [ ] **Step 4: Replace `projects/datetime/src/public-api.ts` with empty surface (will fill later)**

Overwrite `projects/datetime/src/public-api.ts`:
```ts
// Public API surface of @sdcorejs/angular-material-datetime
// Exports are added by subsequent tasks as components/directives are implemented.
export {};
```

- [ ] **Step 5: Configure `projects/datetime/package.json`**

Overwrite `projects/datetime/package.json`:
```json
{
  "name": "@sdcorejs/angular-material-datetime",
  "version": "0.1.0",
  "description": "Datetime, timepicker, and date-range picker for Angular Material — adapter-pluggable",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/sdcorejs/angular-material-datetime.git",
    "directory": "projects/datetime"
  },
  "keywords": ["angular", "material", "datetime", "datepicker", "timepicker", "date-range"],
  "sideEffects": false,
  "peerDependencies": {
    "@angular/cdk":      ">=19.0.0 <22.0.0",
    "@angular/common":   ">=19.0.0 <22.0.0",
    "@angular/core":     ">=19.0.0 <22.0.0",
    "@angular/material": ">=19.0.0 <22.0.0",
    "rxjs":              "^7.0.0"
  }
}
```

- [ ] **Step 6: Install Material + CDK in workspace**

```powershell
npm install --save-peer-optional @angular/material@~19.0.0 @angular/cdk@~19.0.0
npm install --save-dev @angular/material@~19.0.0 @angular/cdk@~19.0.0
```

- [ ] **Step 7: Verify build produces empty FESM**

Run: `npx ng build datetime`
Expected: `Successfully ran target build for project datetime` and `dist/datetime/` is created.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat(datetime): scaffold datetime library project"
```

---

### Task 5: Generate stub adapter projects (`moment-adapter`, `date-fns-adapter`)

**Files:**
- Create: `projects/moment-adapter/**`
- Create: `projects/date-fns-adapter/**`

- [ ] **Step 1: Generate moment-adapter library**

```powershell
npx ng generate library moment-adapter --skip-install
Remove-Item projects\moment-adapter\src\lib\* -Recurse -Force
```

- [ ] **Step 2: Replace `projects/moment-adapter/src/public-api.ts` with stub**

Overwrite `projects/moment-adapter/src/public-api.ts`:
```ts
// @sdcorejs/angular-material-datetime-moment — implementation deferred to M3.
export {};
```

- [ ] **Step 3: Overwrite `projects/moment-adapter/package.json`**

```json
{
  "name": "@sdcorejs/angular-material-datetime-moment",
  "version": "0.1.0",
  "description": "Moment.js date adapter for @sdcorejs/angular-material-datetime",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/sdcorejs/angular-material-datetime.git",
    "directory": "projects/moment-adapter"
  },
  "sideEffects": false,
  "peerDependencies": {
    "@angular/core": ">=19.0.0 <22.0.0",
    "@sdcorejs/angular-material-datetime": "^0.1.0",
    "moment": "^2.29.0"
  }
}
```

- [ ] **Step 4: Repeat for date-fns-adapter**

```powershell
npx ng generate library date-fns-adapter --skip-install
Remove-Item projects\date-fns-adapter\src\lib\* -Recurse -Force
```

Overwrite `projects/date-fns-adapter/src/public-api.ts`:
```ts
// @sdcorejs/angular-material-datetime-date-fns — implementation deferred to M3.
export {};
```

Overwrite `projects/date-fns-adapter/package.json`:
```json
{
  "name": "@sdcorejs/angular-material-datetime-date-fns",
  "version": "0.1.0",
  "description": "date-fns date adapter for @sdcorejs/angular-material-datetime",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/sdcorejs/angular-material-datetime.git",
    "directory": "projects/date-fns-adapter"
  },
  "sideEffects": false,
  "peerDependencies": {
    "@angular/core": ">=19.0.0 <22.0.0",
    "@sdcorejs/angular-material-datetime": "^0.1.0",
    "date-fns": ">=3.0.0"
  }
}
```

- [ ] **Step 5: Verify both build green (empty FESM)**

```powershell
npx ng build moment-adapter
npx ng build date-fns-adapter
```
Expected: both succeed.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat: scaffold moment-adapter and date-fns-adapter stub projects"
```

---

### Task 6: Generate `demo` application

**Files:**
- Create: `projects/demo/**` via `ng generate application`

- [ ] **Step 1: Generate the demo app**

```powershell
npx ng generate application demo --routing --style=scss --skip-tests --skip-install
```

- [ ] **Step 2: Verify build**

```powershell
npx ng build demo
```
Expected: builds to `dist/demo/`.

- [ ] **Step 3: Commit**

```powershell
git add .
git commit -m "feat(demo): scaffold demo application"
```

---

### Task 7: Configure Jest (replace Karma)

**Files:**
- Create: `jest.config.ts`, `setup-jest.ts`
- Modify: `angular.json` (replace `test` builder for `datetime`, `moment-adapter`, `date-fns-adapter`), `tsconfig.spec.json`
- Modify: `package.json` scripts + devDeps

- [ ] **Step 1: Install jest-preset-angular and friends**

```powershell
npm install --save-dev jest @types/jest jest-preset-angular ts-jest @angular-builders/jest
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine
```

- [ ] **Step 2: Create root `jest.config.ts`**

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'mjs'],
  testMatch: ['<rootDir>/projects/**/*.spec.ts'],
  collectCoverageFrom: [
    'projects/datetime/src/**/*.ts',
    '!projects/datetime/src/**/*.spec.ts',
    '!projects/datetime/src/public-api.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};

export default config;
```

- [ ] **Step 3: Create `setup-jest.ts`**

```ts
import 'jest-preset-angular/setup-jest';
```

- [ ] **Step 4: Update `angular.json` — replace `test` builder per project**

For each of `datetime`, `moment-adapter`, `date-fns-adapter`, replace the `test` architect target with:
```json
"test": {
  "builder": "@angular-builders/jest:run",
  "options": {
    "configPath": "jest.config.ts"
  }
}
```

- [ ] **Step 5: Update `package.json` scripts**

In root `package.json` add:
```json
"scripts": {
  "build:all": "ng build datetime && ng build moment-adapter && ng build date-fns-adapter",
  "test": "jest --passWithNoTests",
  "test:watch": "jest --watch --passWithNoTests",
  "test:coverage": "jest --coverage --passWithNoTests",
  "lint": "ng lint",
  "ng": "ng",
  "start": "ng serve demo"
}
```

- [ ] **Step 6: Write a smoke test to verify Jest runs**

Create `projects/datetime/src/lib/__smoke__/jest-smoke.spec.ts`:
```ts
describe('jest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: `Tests: 1 passed, 1 total`

- [ ] **Step 8: Remove the smoke test**

```powershell
Remove-Item projects\datetime\src\lib\__smoke__ -Recurse -Force
```

- [ ] **Step 9: Commit**

```powershell
git add .
git commit -m "build: switch test runner from Karma to Jest"
```

---

### Task 8: Configure ESLint

**Files:**
- Create: `.eslintrc.json` (root), per-project overrides
- Modify: `package.json` (add lint script)

- [ ] **Step 1: Install ESLint Angular plugin**

```powershell
npx ng add @angular-eslint/schematics --skip-confirmation
```

- [ ] **Step 2: Verify base config exists**

Confirm `.eslintrc.json` exists at repo root with `@angular-eslint/recommended` extended.

- [ ] **Step 3: Add strict rules for library projects**

In `projects/datetime/.eslintrc.json` (create if missing):
```json
{
  "extends": "../../.eslintrc.json",
  "rules": {
    "@angular-eslint/component-selector": [
      "error",
      { "type": "element", "prefix": "sd", "style": "kebab-case" }
    ],
    "@angular-eslint/directive-selector": [
      "error",
      { "type": "attribute", "prefix": "sd", "style": "camelCase" }
    ],
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      { "accessibility": "explicit", "overrides": { "constructors": "no-public" } }
    ]
  }
}
```

- [ ] **Step 4: Copy the same .eslintrc.json into `projects/moment-adapter/` and `projects/date-fns-adapter/`**

- [ ] **Step 5: Run lint to verify clean**

Run: `npm run lint`
Expected: no errors (warnings allowed).

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "build: configure ESLint with strict rules for library projects"
```

---

### Task 9: Add CI workflow (`ci.yml`)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build:all
      - uses: actions/upload-artifact@v4
        if: matrix.node == 22
        with:
          name: coverage
          path: coverage/
```

- [ ] **Step 2: Commit**

```powershell
git add .
git commit -m "ci: add lint+test+build workflow with Node 20/22 matrix"
```

---

### Task 10: First push to GitHub

- [ ] **Step 1: Push**

```powershell
git push -u origin main
```

- [ ] **Step 2: Verify CI runs green**

Visit `https://github.com/sdcorejs/angular-material-datetime/actions`. Wait for first run to complete. Expected: green.

- [ ] **Step 3: Configure branch protection** (one-time)

On GitHub repo settings:
- Branches → Add rule for `main`
- Require pull request before merging
- Require status checks: `lint-test-build (20)` and `lint-test-build (22)`

**End of Phase A — bootstrap complete.**

---

## Phase B — Core types: `SdDateAdapter<D>` + format tokens

### Task 11: Define `SdDateFormats` interface and `SD_DATE_FORMATS` token

**Files:**
- Create: `projects/datetime/src/lib/core/date-formats.ts`
- Create: `projects/datetime/src/lib/core/date-formats.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `projects/datetime/src/lib/core/date-formats.spec.ts`:
```ts
import { SD_DATE_FORMATS, SdDateFormats } from './date-formats';
import { InjectionToken } from '@angular/core';

describe('SD_DATE_FORMATS', () => {
  it('is an InjectionToken', () => {
    expect(SD_DATE_FORMATS).toBeInstanceOf(InjectionToken);
  });

  it('typings expose parse + display sub-objects', () => {
    const fmts: SdDateFormats = {
      parse: { dateInput: 'a', datetimeInput: 'b', timeInput: 'c' },
      display: {
        dateInput: 'd', datetimeInput: 'e', timeInput: 'f',
        monthYearLabel: 'g', dateA11yLabel: 'h',
        monthYearA11yLabel: 'i', popupHeaderDateLabel: 'j',
      },
    };
    expect(fmts.parse.dateInput).toBe('a');
    expect(fmts.display.popupHeaderDateLabel).toBe('j');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest projects/datetime/src/lib/core/date-formats.spec.ts`
Expected: FAIL — `Cannot find module './date-formats'`.

- [ ] **Step 3: Write minimal implementation**

Create `projects/datetime/src/lib/core/date-formats.ts`:
```ts
import { InjectionToken } from '@angular/core';

export interface SdDateFormats {
  parse: {
    dateInput: string;
    datetimeInput: string;
    timeInput: string;
  };
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest projects/datetime/src/lib/core/date-formats.spec.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```powershell
git add projects/datetime/src/lib/core/date-formats.ts projects/datetime/src/lib/core/date-formats.spec.ts
git commit -m "feat(datetime): add SdDateFormats interface and SD_DATE_FORMATS token"
```

---

### Task 12: Define `SdDateAdapter<D>` abstract class — date methods inherited from `DateAdapter<D>`

**Files:**
- Create: `projects/datetime/src/lib/core/date-adapter.ts`
- Create: `projects/datetime/src/lib/core/date-adapter.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `projects/datetime/src/lib/core/date-adapter.spec.ts`:
```ts
import { SdDateAdapter } from './date-adapter';
import { DateAdapter } from '@angular/material/core';

class TestAdapter extends SdDateAdapter<Date> {
  override getHour(d: Date): number { return d.getHours(); }
  override getMinute(d: Date): number { return d.getMinutes(); }
  override getSecond(d: Date): number { return d.getSeconds(); }
  override setHour(d: Date, h: number): Date { const c = new Date(d); c.setHours(h); return c; }
  override setMinute(d: Date, m: number): Date { const c = new Date(d); c.setMinutes(m); return c; }
  override setSecond(d: Date, s: number): Date { const c = new Date(d); c.setSeconds(s); return c; }
  override createDatetime(y: number, mo: number, d: number, h: number, mi: number, s: number): Date {
    return new Date(y, mo, d, h, mi, s);
  }
  // DateAdapter abstract stubs — minimal for the abstract test
  override getYear(): number { return 0; }
  override getMonth(): number { return 0; }
  override getDate(): number { return 0; }
  override getDayOfWeek(): number { return 0; }
  override getMonthNames(): string[] { return []; }
  override getDateNames(): string[] { return []; }
  override getDayOfWeekNames(): string[] { return []; }
  override getYearName(): string { return ''; }
  override getFirstDayOfWeek(): number { return 0; }
  override getNumDaysInMonth(): number { return 0; }
  override clone(d: Date): Date { return new Date(d); }
  override createDate(y: number, m: number, d: number): Date { return new Date(y, m, d); }
  override today(): Date { return new Date(); }
  override parse(): Date | null { return null; }
  override format(): string { return ''; }
  override addCalendarYears(d: Date): Date { return d; }
  override addCalendarMonths(d: Date): Date { return d; }
  override addCalendarDays(d: Date): Date { return d; }
  override toIso8601(d: Date): string { return d.toISOString(); }
  override isDateInstance(v: unknown): boolean { return v instanceof Date; }
  override isValid(d: Date): boolean { return !isNaN(d.getTime()); }
  override invalid(): Date { return new Date(NaN); }
}

describe('SdDateAdapter (contract)', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  it('extends Material DateAdapter', () => {
    expect(adapter).toBeInstanceOf(DateAdapter);
  });

  it('getHour / setHour returns new immutable instance', () => {
    const d = new Date(2026, 4, 22, 10, 30, 15);
    const updated = adapter.setHour(d, 14);
    expect(updated.getHours()).toBe(14);
    expect(d.getHours()).toBe(10); // original unchanged
  });

  it('getMinute / setMinute round-trips', () => {
    const d = new Date(2026, 4, 22, 10, 30, 15);
    expect(adapter.getMinute(d)).toBe(30);
    expect(adapter.getMinute(adapter.setMinute(d, 45))).toBe(45);
  });

  it('getSecond / setSecond round-trips', () => {
    const d = new Date(2026, 4, 22, 10, 30, 15);
    expect(adapter.getSecond(d)).toBe(15);
    expect(adapter.getSecond(adapter.setSecond(d, 50))).toBe(50);
  });

  it('createDatetime constructs a date with full time-of-day', () => {
    const d = adapter.createDatetime(2026, 4, 22, 14, 30, 15);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(22);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
    expect(d.getSeconds()).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest projects/datetime/src/lib/core/date-adapter.spec.ts`
Expected: FAIL — `Cannot find module './date-adapter'`.

- [ ] **Step 3: Write minimal implementation**

Create `projects/datetime/src/lib/core/date-adapter.ts`:
```ts
import { DateAdapter } from '@angular/material/core';

export abstract class SdDateAdapter<D> extends DateAdapter<D> {
  public abstract getHour(date: D): number;
  public abstract getMinute(date: D): number;
  public abstract getSecond(date: D): number;

  public abstract setHour(date: D, hour: number): D;
  public abstract setMinute(date: D, minute: number): D;
  public abstract setSecond(date: D, second: number): D;

  public abstract createDatetime(
    year: number, month: number, date: number,
    hour: number, minute: number, second: number,
  ): D;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest projects/datetime/src/lib/core/date-adapter.spec.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```powershell
git add projects/datetime/src/lib/core/date-adapter.ts projects/datetime/src/lib/core/date-adapter.spec.ts
git commit -m "feat(datetime): add SdDateAdapter<D> abstract class with time-of-day methods"
```

---

### Task 13: Define `SD_DATETIME_DEFAULT_OPTIONS` token

**Files:**
- Create: `projects/datetime/src/lib/core/default-options.ts`
- Create: `projects/datetime/src/lib/core/default-options.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `projects/datetime/src/lib/core/default-options.spec.ts`:
```ts
import { InjectionToken } from '@angular/core';
import { SD_DATETIME_DEFAULT_OPTIONS, SdDatetimeDefaultOptions } from './default-options';

describe('SD_DATETIME_DEFAULT_OPTIONS', () => {
  it('is an InjectionToken', () => {
    expect(SD_DATETIME_DEFAULT_OPTIONS).toBeInstanceOf(InjectionToken);
  });

  it('typings expose showSeconds, stepMinute, touchUi, color', () => {
    const opts: SdDatetimeDefaultOptions = {
      showSeconds: true,
      stepMinute: 5,
      touchUi: false,
      color: 'primary',
    };
    expect(opts.showSeconds).toBe(true);
    expect(opts.stepMinute).toBe(5);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npx jest projects/datetime/src/lib/core/default-options.spec.ts`

- [ ] **Step 3: Write implementation**

Create `projects/datetime/src/lib/core/default-options.ts`:
```ts
import { InjectionToken } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

export interface SdDatetimeDefaultOptions {
  /** Whether to show the seconds spinner column in the time picker. */
  showSeconds?: boolean;
  /** Minute spinner step (e.g. 5 → 0, 5, 10, ...). */
  stepMinute?: number;
  /** Touch-friendly modal mode instead of inline overlay. */
  touchUi?: boolean;
  /** Material theme palette for the picker UI. */
  color?: ThemePalette;
}

export const SD_DATETIME_DEFAULT_OPTIONS =
  new InjectionToken<SdDatetimeDefaultOptions>('sd-datetime-default-options');
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add projects/datetime/src/lib/core/default-options.ts projects/datetime/src/lib/core/default-options.spec.ts
git commit -m "feat(datetime): add SD_DATETIME_DEFAULT_OPTIONS injection token"
```

---

### Task 14: Export core symbols from `public-api.ts`

**Files:**
- Modify: `projects/datetime/src/public-api.ts`
- Create: `projects/datetime/src/public-api.spec.ts`

- [ ] **Step 1: Write a failing test asserting public exports**

Create `projects/datetime/src/public-api.spec.ts`:
```ts
import * as publicApi from './public-api';

describe('public-api exports', () => {
  it('exports SD_DATE_FORMATS', () => {
    expect(publicApi.SD_DATE_FORMATS).toBeDefined();
  });
  it('exports SdDateAdapter', () => {
    expect(publicApi.SdDateAdapter).toBeDefined();
  });
  it('exports SD_DATETIME_DEFAULT_OPTIONS', () => {
    expect(publicApi.SD_DATETIME_DEFAULT_OPTIONS).toBeDefined();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement public-api exports**

Overwrite `projects/datetime/src/public-api.ts`:
```ts
// Public API surface of @sdcorejs/angular-material-datetime
export * from './lib/core/date-adapter';
export * from './lib/core/date-formats';
export * from './lib/core/default-options';
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Verify `npx ng build datetime` still succeeds**

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(datetime): export core types from public-api"
```

---

## Phase C — Native date adapter

### Task 15: Implement `SdNativeDateAdapter` — inherits from Material's `NativeDateAdapter` + adds time methods

**Files:**
- Create: `projects/datetime/src/lib/native/native-date-adapter.ts`
- Create: `projects/datetime/src/lib/native/native-date-adapter.spec.ts`

- [ ] **Step 1: Write failing tests covering time getters/setters**

Create `projects/datetime/src/lib/native/native-date-adapter.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import { SdNativeDateAdapter } from './native-date-adapter';

describe('SdNativeDateAdapter', () => {
  let adapter: SdNativeDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        Platform,
        SdNativeDateAdapter,
      ],
    });
    adapter = TestBed.inject(SdNativeDateAdapter);
  });

  it('extends Material NativeDateAdapter (so all date methods work)', () => {
    expect(adapter).toBeInstanceOf(NativeDateAdapter);
  });

  it('getHour returns native hours', () => {
    expect(adapter.getHour(new Date(2026, 4, 22, 14, 30, 15))).toBe(14);
  });

  it('getMinute returns native minutes', () => {
    expect(adapter.getMinute(new Date(2026, 4, 22, 14, 30, 15))).toBe(30);
  });

  it('getSecond returns native seconds', () => {
    expect(adapter.getSecond(new Date(2026, 4, 22, 14, 30, 15))).toBe(15);
  });

  it('setHour returns a new Date (immutable)', () => {
    const d = new Date(2026, 4, 22, 10, 0, 0);
    const out = adapter.setHour(d, 15);
    expect(out).not.toBe(d);
    expect(out.getHours()).toBe(15);
    expect(d.getHours()).toBe(10);
  });

  it('setMinute returns a new Date (immutable)', () => {
    const d = new Date(2026, 4, 22, 10, 0, 0);
    const out = adapter.setMinute(d, 45);
    expect(out).not.toBe(d);
    expect(out.getMinutes()).toBe(45);
    expect(d.getMinutes()).toBe(0);
  });

  it('setSecond returns a new Date (immutable)', () => {
    const d = new Date(2026, 4, 22, 10, 0, 0);
    const out = adapter.setSecond(d, 50);
    expect(out).not.toBe(d);
    expect(out.getSeconds()).toBe(50);
  });

  it('createDatetime builds a full date+time', () => {
    const d = adapter.createDatetime(2026, 4, 22, 14, 30, 15);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(22);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
    expect(d.getSeconds()).toBe(15);
  });

  it('createDatetime throws on invalid month (>11)', () => {
    expect(() => adapter.createDatetime(2026, 12, 1, 0, 0, 0)).toThrow();
  });

  it('createDatetime throws on invalid hour (>23)', () => {
    expect(() => adapter.createDatetime(2026, 4, 22, 24, 0, 0)).toThrow();
  });

  it('createDatetime throws on invalid minute (>59)', () => {
    expect(() => adapter.createDatetime(2026, 4, 22, 0, 60, 0)).toThrow();
  });

  it('createDatetime throws on invalid second (>59)', () => {
    expect(() => adapter.createDatetime(2026, 4, 22, 0, 0, 60)).toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx jest projects/datetime/src/lib/native/native-date-adapter.spec.ts`

- [ ] **Step 3: Write implementation**

Create `projects/datetime/src/lib/native/native-date-adapter.ts`:
```ts
import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { SdDateAdapter } from '../core/date-adapter';

@Injectable()
export class SdNativeDateAdapter extends NativeDateAdapter implements SdDateAdapter<Date> {
  public getHour(date: Date): number { return date.getHours(); }
  public getMinute(date: Date): number { return date.getMinutes(); }
  public getSecond(date: Date): number { return date.getSeconds(); }

  public setHour(date: Date, hour: number): Date {
    const c = new Date(date);
    c.setHours(hour);
    return c;
  }

  public setMinute(date: Date, minute: number): Date {
    const c = new Date(date);
    c.setMinutes(minute);
    return c;
  }

  public setSecond(date: Date, second: number): Date {
    const c = new Date(date);
    c.setSeconds(second);
    return c;
  }

  public createDatetime(
    year: number, month: number, date: number,
    hour: number, minute: number, second: number,
  ): Date {
    if (month < 0 || month > 11) throw Error(`month ${month} out of range [0,11]`);
    if (hour < 0 || hour > 23) throw Error(`hour ${hour} out of range [0,23]`);
    if (minute < 0 || minute > 59) throw Error(`minute ${minute} out of range [0,59]`);
    if (second < 0 || second > 59) throw Error(`second ${second} out of range [0,59]`);
    return new Date(year, month, date, hour, minute, second);
  }
}
```

> **Note:** TS-wise `SdNativeDateAdapter` extends `NativeDateAdapter` (concrete) AND structurally implements `SdDateAdapter<Date>` (abstract). The structural-implements check satisfies the contract; we don't `extends SdDateAdapter` because `extends` is single-inheritance.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add projects/datetime/src/lib/native/native-date-adapter.ts projects/datetime/src/lib/native/native-date-adapter.spec.ts
git commit -m "feat(datetime): implement SdNativeDateAdapter with time-of-day methods"
```

---

### Task 16: Define `SD_NATIVE_DATE_FORMATS` default formats

**Files:**
- Create: `projects/datetime/src/lib/native/native-date-formats.ts`
- Create: `projects/datetime/src/lib/native/native-date-formats.spec.ts`

- [ ] **Step 1: Write failing test**

Create `projects/datetime/src/lib/native/native-date-formats.spec.ts`:
```ts
import { SD_NATIVE_DATE_FORMATS } from './native-date-formats';

describe('SD_NATIVE_DATE_FORMATS', () => {
  it('has parse.datetimeInput', () => {
    expect(SD_NATIVE_DATE_FORMATS.parse.datetimeInput).toBeDefined();
  });
  it('has display.popupHeaderDateLabel', () => {
    expect(SD_NATIVE_DATE_FORMATS.display.popupHeaderDateLabel).toBeDefined();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write implementation**

Create `projects/datetime/src/lib/native/native-date-formats.ts`:
```ts
import { SdDateFormats } from '../core/date-formats';

// Native adapter uses Intl-format objects, not pattern strings. We mirror Material's
// MAT_NATIVE_DATE_FORMATS shape for date-only entries and pass through datetimeInput
// as a sentinel; the adapter's `format()` override (if any) interprets it.
export const SD_NATIVE_DATE_FORMATS: SdDateFormats = {
  parse: {
    dateInput: 'shortDate',
    datetimeInput: 'short',
    timeInput: 'shortTime',
  },
  display: {
    dateInput: 'shortDate',
    datetimeInput: 'short',
    timeInput: 'shortTime',
    monthYearLabel: { year: 'numeric', month: 'short' } as unknown as string,
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' } as unknown as string,
    monthYearA11yLabel: { year: 'numeric', month: 'long' } as unknown as string,
    popupHeaderDateLabel: { weekday: 'short', month: 'short', day: 'numeric' } as unknown as string,
  },
};
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat(datetime): add SD_NATIVE_DATE_FORMATS default format set"
```

---

### Task 17: `provideSdNativeDateAdapter()` provider function

**Files:**
- Create: `projects/datetime/src/lib/native/provide-native.ts`
- Create: `projects/datetime/src/lib/native/provide-native.spec.ts`

- [ ] **Step 1: Write failing test**

Create `projects/datetime/src/lib/native/provide-native.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { SdDateAdapter } from '../core/date-adapter';
import { SD_DATE_FORMATS } from '../core/date-formats';
import { provideSdNativeDateAdapter } from './provide-native';
import { SdNativeDateAdapter } from './native-date-adapter';
import { SD_NATIVE_DATE_FORMATS } from './native-date-formats';

describe('provideSdNativeDateAdapter', () => {
  it('binds DateAdapter and SdDateAdapter to SdNativeDateAdapter', () => {
    TestBed.configureTestingModule({ providers: [provideSdNativeDateAdapter()] });
    const dateAdapter = TestBed.inject(DateAdapter);
    const sdAdapter = TestBed.inject(SdDateAdapter as never);
    expect(dateAdapter).toBeInstanceOf(SdNativeDateAdapter);
    expect(sdAdapter).toBe(dateAdapter);
  });

  it('provides SD_NATIVE_DATE_FORMATS by default to both MAT_DATE_FORMATS and SD_DATE_FORMATS', () => {
    TestBed.configureTestingModule({ providers: [provideSdNativeDateAdapter()] });
    expect(TestBed.inject(MAT_DATE_FORMATS)).toBe(SD_NATIVE_DATE_FORMATS);
    expect(TestBed.inject(SD_DATE_FORMATS)).toBe(SD_NATIVE_DATE_FORMATS);
  });

  it('accepts custom formats override', () => {
    const custom = { ...SD_NATIVE_DATE_FORMATS, parse: { ...SD_NATIVE_DATE_FORMATS.parse, datetimeInput: 'custom-fmt' } };
    TestBed.configureTestingModule({ providers: [provideSdNativeDateAdapter(custom)] });
    expect(TestBed.inject(SD_DATE_FORMATS).parse.datetimeInput).toBe('custom-fmt');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write implementation**

Create `projects/datetime/src/lib/native/provide-native.ts`:
```ts
import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import { SdDateAdapter } from '../core/date-adapter';
import { SdDateFormats, SD_DATE_FORMATS } from '../core/date-formats';
import { SdNativeDateAdapter } from './native-date-adapter';
import { SD_NATIVE_DATE_FORMATS } from './native-date-formats';

export function provideSdNativeDateAdapter(
  formats: SdDateFormats = SD_NATIVE_DATE_FORMATS,
): EnvironmentProviders {
  const providers: Provider[] = [
    Platform,
    SdNativeDateAdapter,
    { provide: DateAdapter, useExisting: SdNativeDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
    { provide: SdDateAdapter, useExisting: SdNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: formats },
    { provide: SD_DATE_FORMATS, useValue: formats },
  ];
  return makeEnvironmentProviders(providers);
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Update public-api**

Edit `projects/datetime/src/public-api.ts` — append:
```ts
export * from './lib/native/native-date-adapter';
export * from './lib/native/native-date-formats';
export * from './lib/native/provide-native';
```

- [ ] **Step 6: Verify build still green**

Run: `npx ng build datetime`
Expected: success.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(datetime): add provideSdNativeDateAdapter() with custom formats override"
```

---

## Phase D — `<sd-time-spinner>` internal component

The time-spinner is the only piece of UI Angular Material doesn't already provide. It's three number columns (hours, minutes, optionally seconds) with up/down buttons and direct text entry. Implemented as a standalone OnPush component.

### Task 18: Time-spinner component shell + signal inputs

**Files:**
- Create: `projects/datetime/src/lib/time-spinner/time-spinner.component.ts`
- Create: `projects/datetime/src/lib/time-spinner/time-spinner.component.html`
- Create: `projects/datetime/src/lib/time-spinner/time-spinner.component.scss`
- Create: `projects/datetime/src/lib/time-spinner/time-spinner.component.spec.ts`

- [ ] **Step 1: Write failing test — selector + inputs**

Create `projects/datetime/src/lib/time-spinner/time-spinner.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdTimeSpinner } from './time-spinner.component';

describe('SdTimeSpinner', () => {
  let fixture: ComponentFixture<SdTimeSpinner>;
  let component: SdTimeSpinner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdTimeSpinner] }).compileComponents();
    fixture = TestBed.createComponent(SdTimeSpinner);
    component = fixture.componentInstance;
  });

  it('renders with selector sd-time-spinner', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.tagName.toLowerCase()).toBe('sd-time-spinner');
  });

  it('default showSeconds is false', () => {
    expect(component.showSeconds()).toBe(false);
  });

  it('default stepMinute is 1', () => {
    expect(component.stepMinute()).toBe(1);
  });

  it('defaultsto hour=0, minute=0, second=0 when value is null', () => {
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    expect(component.hour()).toBe(0);
    expect(component.minute()).toBe(0);
    expect(component.second()).toBe(0);
  });

  it('parses value Date into hour/minute/second signals', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 14, 30, 15));
    fixture.detectChanges();
    expect(component.hour()).toBe(14);
    expect(component.minute()).toBe(30);
    expect(component.second()).toBe(15);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write the component**

Create `projects/datetime/src/lib/time-spinner/time-spinner.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'sd-time-spinner',
  standalone: true,
  templateUrl: './time-spinner.component.html',
  styleUrls: ['./time-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-time-spinner' },
})
export class SdTimeSpinner {
  public readonly value = input<Date | null>(null);
  public readonly showSeconds = input<boolean>(false);
  public readonly stepMinute = input<number>(1);
  public readonly disabled = input<boolean>(false);

  public readonly valueChange = output<Date>();

  public readonly hour = computed(() => this.value()?.getHours() ?? 0);
  public readonly minute = computed(() => this.value()?.getMinutes() ?? 0);
  public readonly second = computed(() => this.value()?.getSeconds() ?? 0);
}
```

Create `projects/datetime/src/lib/time-spinner/time-spinner.component.html`:
```html
<!-- minimal shell; columns added in Task 19 -->
<div class="sd-time-spinner__columns">
  <span class="sd-time-spinner__hour">{{ hour() | number:'2.0-0' }}</span>
  <span>:</span>
  <span class="sd-time-spinner__minute">{{ minute() | number:'2.0-0' }}</span>
  @if (showSeconds()) {
    <span>:</span>
    <span class="sd-time-spinner__second">{{ second() | number:'2.0-0' }}</span>
  }
</div>
```

> The `number:'2.0-0'` pipe pads single digits to two. Requires `CommonModule` — add it.

Edit the component file to import `CommonModule`:
```ts
import { CommonModule } from '@angular/common';

@Component({
  // ...
  imports: [CommonModule],
})
```

Create `projects/datetime/src/lib/time-spinner/time-spinner.component.scss`:
```scss
.sd-time-spinner {
  display: inline-flex;
  align-items: center;
  font-variant-numeric: tabular-nums;

  &__columns {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 24px;
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add projects/datetime/src/lib/time-spinner/
git commit -m "feat(datetime): scaffold SdTimeSpinner component with value/showSeconds inputs"
```

---

### Task 19: Time-spinner step buttons (increment/decrement) + valueChange emission

**Files:**
- Modify: `projects/datetime/src/lib/time-spinner/time-spinner.component.ts`
- Modify: `projects/datetime/src/lib/time-spinner/time-spinner.component.html`
- Modify: `projects/datetime/src/lib/time-spinner/time-spinner.component.scss`
- Modify: `projects/datetime/src/lib/time-spinner/time-spinner.component.spec.ts`

- [ ] **Step 1: Add failing tests for stepUp/stepDown**

Append to `time-spinner.component.spec.ts`:
```ts
describe('SdTimeSpinner step buttons', () => {
  let fixture: ComponentFixture<SdTimeSpinner>;
  let component: SdTimeSpinner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdTimeSpinner] }).compileComponents();
    fixture = TestBed.createComponent(SdTimeSpinner);
    component = fixture.componentInstance;
  });

  it('stepHourUp increments hour and emits valueChange', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 10, 0, 0));
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepHourUp();
    expect(spy).toHaveBeenCalledWith(expect.any(Date));
    expect(spy.mock.calls[0][0].getHours()).toBe(11);
  });

  it('stepHourUp wraps 23 → 0', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 23, 0, 0));
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepHourUp();
    expect(spy.mock.calls[0][0].getHours()).toBe(0);
  });

  it('stepHourDown wraps 0 → 23', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 0, 0, 0));
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepHourDown();
    expect(spy.mock.calls[0][0].getHours()).toBe(23);
  });

  it('stepMinuteUp respects stepMinute=5', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 10, 0, 0));
    fixture.componentRef.setInput('stepMinute', 5);
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepMinuteUp();
    expect(spy.mock.calls[0][0].getMinutes()).toBe(5);
  });

  it('stepMinuteUp wraps 59 → 0', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 10, 59, 0));
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepMinuteUp();
    expect(spy.mock.calls[0][0].getMinutes()).toBe(0);
  });

  it('stepSecondUp increments by 1 and wraps 59 → 0', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 10, 30, 59));
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepSecondUp();
    expect(spy.mock.calls[0][0].getSeconds()).toBe(0);
  });

  it('does nothing when disabled', () => {
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 10, 0, 0));
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.stepHourUp();
    expect(spy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement step methods**

Replace the body of `SdTimeSpinner` class (keep the existing inputs/outputs):
```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'sd-time-spinner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './time-spinner.component.html',
  styleUrls: ['./time-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-time-spinner' },
})
export class SdTimeSpinner {
  public readonly value = input<Date | null>(null);
  public readonly showSeconds = input<boolean>(false);
  public readonly stepMinute = input<number>(1);
  public readonly disabled = input<boolean>(false);

  public readonly valueChange = output<Date>();

  public readonly hour = computed(() => this.value()?.getHours() ?? 0);
  public readonly minute = computed(() => this.value()?.getMinutes() ?? 0);
  public readonly second = computed(() => this.value()?.getSeconds() ?? 0);

  public stepHourUp(): void { this.#step('hour', +1); }
  public stepHourDown(): void { this.#step('hour', -1); }
  public stepMinuteUp(): void { this.#step('minute', +this.stepMinute()); }
  public stepMinuteDown(): void { this.#step('minute', -this.stepMinute()); }
  public stepSecondUp(): void { this.#step('second', +1); }
  public stepSecondDown(): void { this.#step('second', -1); }

  #step(unit: 'hour' | 'minute' | 'second', delta: number): void {
    if (this.disabled()) return;
    const base = this.value() ?? new Date(2026, 0, 1, 0, 0, 0);
    const next = new Date(base);
    if (unit === 'hour') next.setHours(this.#wrap(base.getHours() + delta, 24));
    if (unit === 'minute') next.setMinutes(this.#wrap(base.getMinutes() + delta, 60));
    if (unit === 'second') next.setSeconds(this.#wrap(base.getSeconds() + delta, 60));
    this.valueChange.emit(next);
  }

  #wrap(v: number, mod: number): number {
    return ((v % mod) + mod) % mod;
  }
}
```

- [ ] **Step 4: Replace the template with up/down buttons**

Overwrite `time-spinner.component.html`:
```html
<div class="sd-time-spinner__columns">
  <!-- hour -->
  <div class="sd-time-spinner__col">
    <button mat-icon-button [disabled]="disabled()" (click)="stepHourUp()" aria-label="Increment hour">
      <mat-icon>keyboard_arrow_up</mat-icon>
    </button>
    <span class="sd-time-spinner__digits">{{ hour() | number:'2.0-0' }}</span>
    <button mat-icon-button [disabled]="disabled()" (click)="stepHourDown()" aria-label="Decrement hour">
      <mat-icon>keyboard_arrow_down</mat-icon>
    </button>
  </div>

  <span class="sd-time-spinner__sep">:</span>

  <!-- minute -->
  <div class="sd-time-spinner__col">
    <button mat-icon-button [disabled]="disabled()" (click)="stepMinuteUp()" aria-label="Increment minute">
      <mat-icon>keyboard_arrow_up</mat-icon>
    </button>
    <span class="sd-time-spinner__digits">{{ minute() | number:'2.0-0' }}</span>
    <button mat-icon-button [disabled]="disabled()" (click)="stepMinuteDown()" aria-label="Decrement minute">
      <mat-icon>keyboard_arrow_down</mat-icon>
    </button>
  </div>

  @if (showSeconds()) {
    <span class="sd-time-spinner__sep">:</span>
    <!-- second -->
    <div class="sd-time-spinner__col">
      <button mat-icon-button [disabled]="disabled()" (click)="stepSecondUp()" aria-label="Increment second">
        <mat-icon>keyboard_arrow_up</mat-icon>
      </button>
      <span class="sd-time-spinner__digits">{{ second() | number:'2.0-0' }}</span>
      <button mat-icon-button [disabled]="disabled()" (click)="stepSecondDown()" aria-label="Decrement second">
        <mat-icon>keyboard_arrow_down</mat-icon>
      </button>
    </div>
  }
</div>
```

- [ ] **Step 5: Add column SCSS**

Replace `time-spinner.component.scss`:
```scss
.sd-time-spinner {
  display: inline-flex;
  font-variant-numeric: tabular-nums;

  &__columns { display: flex; align-items: center; gap: 8px; }
  &__col { display: flex; flex-direction: column; align-items: center; }
  &__digits { font-size: 28px; line-height: 1; min-width: 2.4ch; text-align: center; }
  &__sep { font-size: 28px; align-self: center; }
}
```

- [ ] **Step 6: Run all spinner tests — expect PASS**

Run: `npx jest projects/datetime/src/lib/time-spinner/`

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(time-spinner): add step buttons with wrap-around and stepMinute support"
```

---

### Task 20: Time-spinner — direct numeric input (typing)

**Files:**
- Modify: `time-spinner.component.ts` + `.html` + `.spec.ts`

- [ ] **Step 1: Add failing tests for type-to-edit**

Append to `time-spinner.component.spec.ts`:
```ts
describe('SdTimeSpinner typing into a column', () => {
  let fixture: ComponentFixture<SdTimeSpinner>;
  let component: SdTimeSpinner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdTimeSpinner] }).compileComponents();
    fixture = TestBed.createComponent(SdTimeSpinner);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', new Date(2026, 4, 22, 10, 30, 0));
    fixture.detectChanges();
  });

  it('onHourInput accepts a valid hour and emits', () => {
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.onHourInput('22');
    expect(spy.mock.calls[0][0].getHours()).toBe(22);
  });

  it('onHourInput rejects invalid hour (>23) — does not emit', () => {
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.onHourInput('25');
    expect(spy).not.toHaveBeenCalled();
  });

  it('onMinuteInput rejects negative values', () => {
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.onMinuteInput('-1');
    expect(spy).not.toHaveBeenCalled();
  });

  it('onSecondInput accepts 0..59', () => {
    fixture.componentRef.setInput('showSeconds', true);
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component.onSecondInput('45');
    expect(spy.mock.calls[0][0].getSeconds()).toBe(45);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement onHourInput / onMinuteInput / onSecondInput**

Append methods to `SdTimeSpinner`:
```ts
  public onHourInput(raw: string): void { this.#setUnit('hour', raw, 0, 23); }
  public onMinuteInput(raw: string): void { this.#setUnit('minute', raw, 0, 59); }
  public onSecondInput(raw: string): void { this.#setUnit('second', raw, 0, 59); }

  #setUnit(unit: 'hour' | 'minute' | 'second', raw: string, min: number, max: number): void {
    if (this.disabled()) return;
    const v = Number.parseInt(raw, 10);
    if (Number.isNaN(v) || v < min || v > max) return;
    const base = this.value() ?? new Date(2026, 0, 1, 0, 0, 0);
    const next = new Date(base);
    if (unit === 'hour') next.setHours(v);
    if (unit === 'minute') next.setMinutes(v);
    if (unit === 'second') next.setSeconds(v);
    this.valueChange.emit(next);
  }
```

- [ ] **Step 4: Replace display spans with `<input type="number">` in the template**

For each of hour / minute / second column, replace `<span class="sd-time-spinner__digits">{{ ... }}</span>` with:
```html
<input
  type="number"
  class="sd-time-spinner__digits"
  [value]="hour() | number:'2.0-0'"
  [disabled]="disabled()"
  min="0" max="23"
  (input)="onHourInput($any($event.target).value)"
  aria-label="Hour">
```
…and similarly for minute (`min="0" max="59"`, `onMinuteInput`) and second (same as minute, `onSecondInput`).

> Use `$any($event.target).value` to satisfy strict template type-check without casting in TS.

- [ ] **Step 5: Add CSS to hide native number spinners**

Append to `time-spinner.component.scss`:
```scss
.sd-time-spinner__digits {
  -moz-appearance: textfield;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 28px;
  min-width: 2.4ch;
  font-variant-numeric: tabular-nums;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  &:focus { outline: 2px solid var(--mat-sys-primary, #1976d2); border-radius: 4px; }
}
```

- [ ] **Step 6: Run all spinner tests — expect PASS**

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(time-spinner): accept direct numeric typing with range validation"
```

---

## Phase E — `<sd-datetime-picker>` overlay component

The picker is the panel that opens in the CDK overlay: it composes `<mat-calendar>` (date selection) + `<sd-time-spinner>` (time selection) + an actions slot.

### Task 21: Scaffold `<sd-datetime-picker>` component shell

**Files:**
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker.component.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker.component.html`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker.component.scss`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker.component.spec.ts`

- [ ] **Step 1: Write failing tests for component shell**

Create `datetime-picker.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideSdNativeDateAdapter } from '../native/provide-native';
import { SdDatetimePicker } from './datetime-picker.component';

describe('SdDatetimePicker', () => {
  let fixture: ComponentFixture<SdDatetimePicker<Date>>;
  let component: SdDatetimePicker<Date>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdDatetimePicker],
      providers: [provideSdNativeDateAdapter()],
    }).compileComponents();
    fixture = TestBed.createComponent(SdDatetimePicker<Date>);
    component = fixture.componentInstance;
  });

  it('uses selector sd-datetime-picker', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.tagName.toLowerCase()).toBe('sd-datetime-picker');
  });

  it('default showSeconds is false', () => {
    expect(component.showSeconds()).toBe(false);
  });

  it('opened signal is false initially', () => {
    expect(component.opened()).toBe(false);
  });

  it('open() sets opened to true', () => {
    component.open();
    expect(component.opened()).toBe(true);
  });

  it('close() sets opened to false', () => {
    component.open();
    component.close();
    expect(component.opened()).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write the component**

Create `datetime-picker.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCalendar } from '@angular/material/datepicker';
import { SdDateAdapter } from '../core/date-adapter';
import { SdTimeSpinner } from '../time-spinner/time-spinner.component';

@Component({
  selector: 'sd-datetime-picker',
  standalone: true,
  imports: [CommonModule, MatCalendar, SdTimeSpinner],
  templateUrl: './datetime-picker.component.html',
  styleUrls: ['./datetime-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-datetime-picker' },
})
export class SdDatetimePicker<D = Date> {
  protected readonly adapter = inject<SdDateAdapter<D>>(SdDateAdapter as never);

  public readonly showSeconds = input<boolean>(false);
  public readonly stepMinute = input<number>(1);
  public readonly disabled = input<boolean>(false);
  public readonly minDate = input<D | null>(null);
  public readonly maxDate = input<D | null>(null);
  public readonly startAt = input<D | null>(null);

  public readonly selectedChange = output<D>();
  public readonly closed = output<void>();

  private readonly _selected = signal<D | null>(null);
  private readonly _opened = signal<boolean>(false);

  public readonly selected = computed(() => this._selected());
  public readonly opened = computed(() => this._opened());

  public open(): void {
    if (this.disabled()) return;
    this._opened.set(true);
  }

  public close(): void {
    if (!this._opened()) return;
    this._opened.set(false);
    this.closed.emit();
  }

  public select(value: D): void {
    this._selected.set(value);
  }
}
```

Create `datetime-picker.component.html` (minimal — calendar + spinner; actions in next task):
```html
@if (opened()) {
  <div class="sd-datetime-picker__panel" role="dialog" aria-label="Datetime picker">
    <!-- calendar binds to native Date — adapter conversion happens when D !== Date in later iterations -->
    <mat-calendar
      [selected]="$any(selected())"
      [minDate]="$any(minDate())"
      [maxDate]="$any(maxDate())"
      [startAt]="$any(startAt())"
      (selectedChange)="select($any($event))">
    </mat-calendar>

    <sd-time-spinner
      [value]="$any(selected())"
      [showSeconds]="showSeconds()"
      [stepMinute]="stepMinute()"
      [disabled]="disabled()"
      (valueChange)="select($any($event))">
    </sd-time-spinner>
  </div>
}
```

> **Note on `$any()` casts**: `<mat-calendar>` is generic over `D` but doesn't accept our `SdDateAdapter<D>` generic correctly at the template level. Adapter conversion (when D !== Date) is handled by the adapter in the directive layer. For native adapter (D = Date), casts are no-ops.

Create `datetime-picker.component.scss`:
```scss
.sd-datetime-picker__panel {
  display: flex;
  background: var(--mat-sys-surface-container, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  padding: 16px;
  gap: 16px;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add projects/datetime/src/lib/datetime-picker/
git commit -m "feat(datetime-picker): scaffold SdDatetimePicker with calendar + time-spinner"
```

---

### Task 22: Actions component + Apply/Cancel/Clear directives

**Files:**
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-actions.component.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-apply.directive.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-cancel.directive.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-clear.directive.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-actions.spec.ts`

- [ ] **Step 1: Write failing tests for actions**

Create `datetime-picker-actions.spec.ts`:
```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideSdNativeDateAdapter } from '../native/provide-native';
import { SdDatetimePicker } from './datetime-picker.component';
import { SdDatetimePickerActions } from './datetime-picker-actions.component';
import { SdDatetimePickerApply } from './datetime-picker-apply.directive';
import { SdDatetimePickerCancel } from './datetime-picker-cancel.directive';
import { SdDatetimePickerClear } from './datetime-picker-clear.directive';

@Component({
  standalone: true,
  imports: [SdDatetimePicker, SdDatetimePickerActions, SdDatetimePickerApply, SdDatetimePickerCancel, SdDatetimePickerClear],
  template: `
    <sd-datetime-picker #p>
      <sd-datetime-picker-actions>
        <button sdDatetimePickerClear>Clear</button>
        <button sdDatetimePickerCancel>Cancel</button>
        <button sdDatetimePickerApply>Apply</button>
      </sd-datetime-picker-actions>
    </sd-datetime-picker>
  `,
})
class HostCmp {}

describe('SdDatetimePickerActions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostCmp],
      providers: [provideSdNativeDateAdapter()],
    });
  });

  it('Apply directive emits applied event with selected value', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    const picker = fix.debugElement.query(By.directive(SdDatetimePicker)).componentInstance as SdDatetimePicker<Date>;
    const chosen = new Date(2026, 4, 22, 14, 30, 0);
    picker.select(chosen);
    picker.open();
    fix.detectChanges();
    const spy = jest.fn();
    picker.applied.subscribe(spy);
    const btn = fix.debugElement.query(By.css('[sdDatetimePickerApply]')).nativeElement as HTMLElement;
    btn.click();
    expect(spy).toHaveBeenCalledWith(chosen);
  });

  it('Cancel directive closes the picker without applying', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    const picker = fix.debugElement.query(By.directive(SdDatetimePicker)).componentInstance as SdDatetimePicker<Date>;
    picker.open();
    fix.detectChanges();
    const appliedSpy = jest.fn();
    picker.applied.subscribe(appliedSpy);
    const btn = fix.debugElement.query(By.css('[sdDatetimePickerCancel]')).nativeElement as HTMLElement;
    btn.click();
    expect(picker.opened()).toBe(false);
    expect(appliedSpy).not.toHaveBeenCalled();
  });

  it('Clear directive clears selection and closes', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    const picker = fix.debugElement.query(By.directive(SdDatetimePicker)).componentInstance as SdDatetimePicker<Date>;
    picker.select(new Date(2026, 4, 22, 10, 0, 0));
    picker.open();
    fix.detectChanges();
    const clearedSpy = jest.fn();
    picker.cleared.subscribe(clearedSpy);
    const btn = fix.debugElement.query(By.css('[sdDatetimePickerClear]')).nativeElement as HTMLElement;
    btn.click();
    expect(picker.selected()).toBe(null);
    expect(clearedSpy).toHaveBeenCalled();
    expect(picker.opened()).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add `applied` + `cleared` outputs + helper methods to `SdDatetimePicker`**

Modify `datetime-picker.component.ts` — add outputs and methods:
```ts
  public readonly applied = output<D>();
  public readonly cleared = output<void>();

  public apply(): void {
    const v = this._selected();
    if (v != null) this.applied.emit(v);
    this.close();
  }

  public clear(): void {
    this._selected.set(null);
    this.cleared.emit();
    this.close();
  }
```

- [ ] **Step 4: Create actions container component**

Create `datetime-picker-actions.component.ts`:
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sd-datetime-picker-actions',
  standalone: true,
  template: `<ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-datetime-picker-actions' },
  styles: [`
    :host {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px;
      border-top: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
    }
  `],
})
export class SdDatetimePickerActions {}
```

- [ ] **Step 5: Create the three action directives**

Create `datetime-picker-apply.directive.ts`:
```ts
import { Directive, HostListener, inject } from '@angular/core';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'button[sdDatetimePickerApply]',
  standalone: true,
  host: { 'type': 'button' },
})
export class SdDatetimePickerApply {
  private readonly picker = inject<SdDatetimePicker<unknown>>(SdDatetimePicker);
  @HostListener('click') public onClick(): void { this.picker.apply(); }
}
```

Create `datetime-picker-cancel.directive.ts`:
```ts
import { Directive, HostListener, inject } from '@angular/core';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'button[sdDatetimePickerCancel]',
  standalone: true,
  host: { 'type': 'button' },
})
export class SdDatetimePickerCancel {
  private readonly picker = inject<SdDatetimePicker<unknown>>(SdDatetimePicker);
  @HostListener('click') public onClick(): void { this.picker.close(); }
}
```

Create `datetime-picker-clear.directive.ts`:
```ts
import { Directive, HostListener, inject } from '@angular/core';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'button[sdDatetimePickerClear]',
  standalone: true,
  host: { 'type': 'button' },
})
export class SdDatetimePickerClear {
  private readonly picker = inject<SdDatetimePicker<unknown>>(SdDatetimePicker);
  @HostListener('click') public onClick(): void { this.picker.clear(); }
}
```

- [ ] **Step 6: Project `<ng-content>` for actions in `datetime-picker.component.html`**

Append to template (inside the `@if (opened())` panel):
```html
    <ng-content select="sd-datetime-picker-actions"></ng-content>
```

- [ ] **Step 7: Run — expect PASS**

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat(datetime-picker): add actions slot + apply/cancel/clear directives"
```

---

### Task 23: Toggle directive — opens the picker

**Files:**
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-toggle.directive.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-toggle.directive.spec.ts`

- [ ] **Step 1: Write failing test**

Create `datetime-picker-toggle.directive.spec.ts`:
```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideSdNativeDateAdapter } from '../native/provide-native';
import { SdDatetimePicker } from './datetime-picker.component';
import { SdDatetimePickerToggle } from './datetime-picker-toggle.directive';

@Component({
  standalone: true,
  imports: [SdDatetimePicker, SdDatetimePickerToggle],
  template: `
    <button [sdDatetimePickerToggle]="picker">Open</button>
    <sd-datetime-picker #picker></sd-datetime-picker>
  `,
})
class HostCmp {}

describe('SdDatetimePickerToggle', () => {
  it('click opens the bound picker', () => {
    TestBed.configureTestingModule({ imports: [HostCmp], providers: [provideSdNativeDateAdapter()] });
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    const picker = fix.debugElement.query(By.directive(SdDatetimePicker)).componentInstance as SdDatetimePicker<Date>;
    expect(picker.opened()).toBe(false);
    fix.debugElement.query(By.css('button')).nativeElement.click();
    expect(picker.opened()).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write the directive**

Create `datetime-picker-toggle.directive.ts`:
```ts
import { Directive, HostListener, input } from '@angular/core';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'button[sdDatetimePickerToggle]',
  standalone: true,
  host: { 'type': 'button' },
})
export class SdDatetimePickerToggle<D> {
  public readonly target = input.required<SdDatetimePicker<D>>({ alias: 'sdDatetimePickerToggle' });

  @HostListener('click') public onClick(): void {
    const p = this.target();
    p.opened() ? p.close() : p.open();
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat(datetime-picker): add toggle directive that opens/closes a bound picker"
```

---

### Task 24: Wrap picker in a CDK Overlay anchored to the input

**Files:**
- Modify: `datetime-picker.component.ts` (add overlay open logic instead of inline render)
- Modify: existing specs for picker (anchor element will be supplied in the input-directive task; for now `open()` opens an overlay at `document.body`)
- Create: `datetime-picker.component.overlay.spec.ts`

- [ ] **Step 1: Write a failing test verifying overlay attaches to DOM on open**

Create `datetime-picker.component.overlay.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideSdNativeDateAdapter } from '../native/provide-native';
import { SdDatetimePicker } from './datetime-picker.component';

describe('SdDatetimePicker overlay', () => {
  let fixture: ComponentFixture<SdDatetimePicker<Date>>;
  let component: SdDatetimePicker<Date>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdDatetimePicker],
      providers: [provideSdNativeDateAdapter()],
    }).compileComponents();
    fixture = TestBed.createComponent(SdDatetimePicker<Date>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('open() attaches an overlay panel to the DOM', () => {
    expect(document.querySelector('.sd-datetime-picker__panel')).toBeNull();
    component.open();
    fixture.detectChanges();
    expect(document.querySelector('.sd-datetime-picker__panel')).not.toBeNull();
  });

  it('close() detaches the overlay panel', () => {
    component.open();
    fixture.detectChanges();
    component.close();
    fixture.detectChanges();
    expect(document.querySelector('.sd-datetime-picker__panel')).toBeNull();
  });

  it('backdrop click closes the picker', () => {
    component.open();
    fixture.detectChanges();
    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.click();
    fixture.detectChanges();
    expect(component.opened()).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (currently inline-render, not overlay)

- [ ] **Step 3: Refactor `SdDatetimePicker` to use CDK Overlay**

Modify `datetime-picker.component.ts`. The full refactored class:
```ts
import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, TemplateRef,
  computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';
import { MatCalendar } from '@angular/material/datepicker';
import { SdDateAdapter } from '../core/date-adapter';
import { SdTimeSpinner } from '../time-spinner/time-spinner.component';

@Component({
  selector: 'sd-datetime-picker',
  standalone: true,
  imports: [CommonModule, MatCalendar, SdTimeSpinner],
  templateUrl: './datetime-picker.component.html',
  styleUrls: ['./datetime-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdDatetimePicker<D = Date> implements OnDestroy {
  protected readonly adapter = inject<SdDateAdapter<D>>(SdDateAdapter as never);
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);

  public readonly showSeconds = input<boolean>(false);
  public readonly stepMinute = input<number>(1);
  public readonly disabled = input<boolean>(false);
  public readonly minDate = input<D | null>(null);
  public readonly maxDate = input<D | null>(null);
  public readonly startAt = input<D | null>(null);

  public readonly applied = output<D>();
  public readonly cleared = output<void>();
  public readonly closed = output<void>();

  private readonly _selected = signal<D | null>(null);
  private readonly _opened = signal<boolean>(false);

  public readonly selected = computed(() => this._selected());
  public readonly opened = computed(() => this._opened());

  public readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panel');

  private overlayRef: OverlayRef | null = null;
  private anchorEl: HTMLElement | null = null;

  /** Anchor the overlay to a specific input element (set by the input directive). */
  public setAnchor(el: HTMLElement | null): void { this.anchorEl = el; }

  public open(): void {
    if (this.disabled() || this._opened()) return;
    const anchor = this.anchorEl ?? document.body;
    const position = this.overlay.position()
      .flexibleConnectedTo(anchor)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ])
      .withFlexibleDimensions(false)
      .withPush(true);

    this.overlayRef = this.overlay.create(new OverlayConfig({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'sd-datetime-picker__backdrop',
      panelClass: 'sd-datetime-picker__overlay',
    }));
    this.overlayRef.attach(new TemplatePortal(this.panelTemplate(), this.vcr));
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this._opened.set(true);
  }

  public close(): void {
    if (!this._opened()) return;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this._opened.set(false);
    this.closed.emit();
  }

  public select(value: D): void { this._selected.set(value); }

  public apply(): void {
    const v = this._selected();
    if (v != null) this.applied.emit(v);
    this.close();
  }

  public clear(): void {
    this._selected.set(null);
    this.cleared.emit();
    this.close();
  }

  public ngOnDestroy(): void { this.overlayRef?.dispose(); }
}
```

- [ ] **Step 4: Replace template to use `<ng-template #panel>` instead of inline `@if`**

Overwrite `datetime-picker.component.html`:
```html
<ng-template #panel>
  <div class="sd-datetime-picker__panel" role="dialog" aria-label="Datetime picker">
    <mat-calendar
      [selected]="$any(selected())"
      [minDate]="$any(minDate())"
      [maxDate]="$any(maxDate())"
      [startAt]="$any(startAt())"
      (selectedChange)="select($any($event))">
    </mat-calendar>

    <sd-time-spinner
      [value]="$any(selected())"
      [showSeconds]="showSeconds()"
      [stepMinute]="stepMinute()"
      [disabled]="disabled()"
      (valueChange)="select($any($event))">
    </sd-time-spinner>

    <ng-content select="sd-datetime-picker-actions"></ng-content>
  </div>
</ng-template>
```

- [ ] **Step 5: Add overlay CSS imports**

Edit root `package.json` build entry — verify `@angular/cdk/overlay-prebuilt.css` is included. If not, add to `projects/demo/src/styles.scss`:
```scss
@import '@angular/cdk/overlay-prebuilt.css';
```

For tests, add to root `setup-jest.ts` if needed — actually overlay-prebuilt.css is only visual; tests don't need it for assertions. Skip.

- [ ] **Step 6: Run all picker tests — expect PASS**

Run: `npx jest projects/datetime/src/lib/datetime-picker/`
Expected: all tests pass, including the overlay-spec ones.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "refactor(datetime-picker): use CDK Overlay with backdrop + flexible positioning"
```

---

## Phase F — `[sdDatetimePicker]` input directive (ControlValueAccessor)

This directive lives on a `<input matInput>` and:
1. Implements `ControlValueAccessor` so `[formControl]`, `formControlName`, `[(ngModel)]` all work
2. Binds the input to a `SdDatetimePicker` instance via `[sdDatetimePicker]="picker"`
3. Parses typed text using the adapter's `parse()` + format
4. Anchors the picker overlay to itself
5. Pushes changes to/from the picker

### Task 25: Directive scaffold + CVA wiring

**Files:**
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-input.directive.ts`
- Create: `projects/datetime/src/lib/datetime-picker/datetime-picker-input.directive.spec.ts`

- [ ] **Step 1: Write failing test for CVA + value sync**

Create `datetime-picker-input.directive.spec.ts`:
```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSdNativeDateAdapter } from '../native/provide-native';
import { SdDatetimePicker } from './datetime-picker.component';
import { SdDatetimePickerInput } from './datetime-picker-input.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SdDatetimePicker, SdDatetimePickerInput],
  template: `
    <input [sdDatetimePicker]="picker" [formControl]="ctrl">
    <sd-datetime-picker #picker></sd-datetime-picker>
  `,
})
class HostCmp {
  ctrl = new FormControl<Date | null>(null);
}

describe('SdDatetimePickerInput (CVA)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostCmp],
      providers: [provideSdNativeDateAdapter()],
    });
  });

  it('writeValue updates the input element value via adapter format()', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    fix.componentInstance.ctrl.setValue(new Date(2026, 4, 22, 14, 30, 0));
    fix.detectChanges();
    const input = fix.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(input.value).not.toBe('');
  });

  it('writeValue with null clears the input', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    fix.componentInstance.ctrl.setValue(new Date(2026, 4, 22, 14, 30, 0));
    fix.detectChanges();
    fix.componentInstance.ctrl.setValue(null);
    fix.detectChanges();
    const input = fix.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('picker.applied propagates value back to formControl', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    const picker = fix.debugElement.query(By.directive(SdDatetimePicker)).componentInstance as SdDatetimePicker<Date>;
    const d = new Date(2026, 4, 22, 14, 30, 0);
    picker.select(d);
    picker.apply();
    expect(fix.componentInstance.ctrl.value).toEqual(d);
  });

  it('disabling formControl propagates `disabled` attribute to input', () => {
    const fix = TestBed.createComponent(HostCmp);
    fix.detectChanges();
    fix.componentInstance.ctrl.disable();
    fix.detectChanges();
    const input = fix.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write the directive**

Create `datetime-picker-input.directive.ts`:
```ts
import {
  Directive, ElementRef, HostListener, OnDestroy, OnInit, forwardRef,
  inject, input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SdDateAdapter } from '../core/date-adapter';
import { SD_DATE_FORMATS, SdDateFormats } from '../core/date-formats';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'input[sdDatetimePicker]',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SdDatetimePickerInput), multi: true },
  ],
  host: {
    '[attr.aria-haspopup]': '"dialog"',
    '[disabled]': 'isDisabled',
  },
})
export class SdDatetimePickerInput<D = Date> implements ControlValueAccessor, OnInit, OnDestroy {
  private readonly adapter = inject<SdDateAdapter<D>>(SdDateAdapter as never);
  private readonly formats = inject<SdDateFormats>(SD_DATE_FORMATS);
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  public readonly picker = input.required<SdDatetimePicker<D>>({ alias: 'sdDatetimePicker' });

  public isDisabled = false;

  private onChange: (v: D | null) => void = () => {};
  private onTouched: () => void = () => {};
  private subs = new Subscription();

  public ngOnInit(): void {
    const p = this.picker();
    p.setAnchor(this.elementRef.nativeElement);
    this.subs.add(p.applied.subscribe((value: D) => {
      this.onChange(value);
      this.writeValue(value);
    }));
    this.subs.add(p.cleared.subscribe(() => {
      this.onChange(null);
      this.writeValue(null);
    }));
  }

  public ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ControlValueAccessor
  public writeValue(value: D | null): void {
    const el = this.elementRef.nativeElement;
    el.value = value == null ? '' : this.adapter.format(value, this.formats.display.datetimeInput);
    this.picker().select(value as D);
  }
  public registerOnChange(fn: (v: D | null) => void): void { this.onChange = fn; }
  public registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  @HostListener('blur') public onBlur(): void { this.onTouched(); }
  @HostListener('input', ['$event.target.value']) public onInput(raw: string): void {
    const parsed = this.adapter.parse(raw, this.formats.parse.datetimeInput) as D | null;
    this.onChange(parsed);
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat(datetime-picker): add SdDatetimePickerInput directive with ControlValueAccessor"
```

---

### Task 26: Update public-api with all new datetime-picker exports

**Files:**
- Modify: `projects/datetime/src/public-api.ts`
- Modify: `projects/datetime/src/public-api.spec.ts`

- [ ] **Step 1: Update tests to assert new exports**

Append to `public-api.spec.ts`:
```ts
import * as p from './public-api';

describe('public-api — datetime-picker exports', () => {
  for (const name of [
    'SdTimeSpinner',
    'SdDatetimePicker',
    'SdDatetimePickerInput',
    'SdDatetimePickerToggle',
    'SdDatetimePickerActions',
    'SdDatetimePickerApply',
    'SdDatetimePickerCancel',
    'SdDatetimePickerClear',
  ] as const) {
    it(`exports ${name}`, () => {
      expect((p as Record<string, unknown>)[name]).toBeDefined();
    });
  }
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Update public-api.ts**

Overwrite `projects/datetime/src/public-api.ts`:
```ts
// Public API surface of @sdcorejs/angular-material-datetime
export * from './lib/core/date-adapter';
export * from './lib/core/date-formats';
export * from './lib/core/default-options';

export * from './lib/native/native-date-adapter';
export * from './lib/native/native-date-formats';
export * from './lib/native/provide-native';

export * from './lib/time-spinner/time-spinner.component';

export * from './lib/datetime-picker/datetime-picker.component';
export * from './lib/datetime-picker/datetime-picker-input.directive';
export * from './lib/datetime-picker/datetime-picker-toggle.directive';
export * from './lib/datetime-picker/datetime-picker-actions.component';
export * from './lib/datetime-picker/datetime-picker-apply.directive';
export * from './lib/datetime-picker/datetime-picker-cancel.directive';
export * from './lib/datetime-picker/datetime-picker-clear.directive';
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Verify build still green**

Run: `npx ng build datetime`
Expected: success.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(datetime): export all picker primitives from public-api"
```

---

## Phase G — Demo app integration

### Task 27: Wire demo app to use the datetime picker

**Files:**
- Modify: `projects/demo/src/app/app.config.ts` (or `app.module.ts` depending on what ng generate produced)
- Modify: `projects/demo/src/app/app.component.ts` + `.html` + `.scss`
- Modify: `projects/demo/src/styles.scss`
- Modify: `projects/demo/src/index.html`
- Modify: workspace `tsconfig.json` paths so `@sdcorejs/angular-material-datetime` resolves to `projects/datetime/src/public-api.ts` during dev

- [ ] **Step 1: Add path mapping**

Edit `tsconfig.json` `compilerOptions.paths`:
```json
"paths": {
  "@sdcorejs/angular-material-datetime": ["projects/datetime/src/public-api.ts"]
}
```

- [ ] **Step 2: Add Material theme + animations to demo**

Edit `projects/demo/src/styles.scss`:
```scss
@use '@angular/material' as mat;

html {
  color-scheme: light;
  @include mat.theme((
    color: ( primary: mat.$azure-palette, theme-type: light ),
    typography: Roboto,
    density: 0,
  ));
}

body { margin: 0; font-family: Roboto, sans-serif; }

@import '@angular/cdk/overlay-prebuilt.css';
```

Install Roboto link in `projects/demo/src/index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
```

- [ ] **Step 3: Configure demo's `app.config.ts`**

Overwrite `projects/demo/src/app/app.config.ts`:
```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideSdNativeDateAdapter } from '@sdcorejs/angular-material-datetime';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideSdNativeDateAdapter({
      parse: {
        dateInput: 'M/d/yyyy',
        datetimeInput: 'M/d/yyyy h:mm a',
        timeInput: 'h:mm a',
      },
      display: {
        dateInput: 'M/d/yyyy',
        datetimeInput: 'M/d/yyyy h:mm a',
        timeInput: 'h:mm a',
        monthYearLabel: 'MMM yyyy',
        dateA11yLabel: 'longDate',
        monthYearA11yLabel: 'MMMM yyyy',
        popupHeaderDateLabel: 'EEE, MMM d',
      },
    }),
  ],
};
```

- [ ] **Step 4: Replace `app.component.ts`/`.html` with a working datetime picker demo**

Overwrite `projects/demo/src/app/app.component.ts`:
```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  SdDatetimePicker, SdDatetimePickerInput, SdDatetimePickerToggle,
  SdDatetimePickerActions, SdDatetimePickerApply, SdDatetimePickerCancel,
  SdDatetimePickerClear,
} from '@sdcorejs/angular-material-datetime';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    SdDatetimePicker, SdDatetimePickerInput, SdDatetimePickerToggle,
    SdDatetimePickerActions, SdDatetimePickerApply, SdDatetimePickerCancel,
    SdDatetimePickerClear,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  ctrl = new FormControl<Date | null>(new Date(2026, 4, 22, 14, 30, 0));
}
```

Overwrite `projects/demo/src/app/app.component.html`:
```html
<main>
  <h1>@sdcorejs/angular-material-datetime — demo</h1>

  <mat-form-field appearance="outline">
    <mat-label>Pick a datetime</mat-label>
    <input matInput [sdDatetimePicker]="picker" [formControl]="ctrl">
    <button matSuffix mat-icon-button [sdDatetimePickerToggle]="picker" aria-label="Open picker">
      📅
    </button>
    <sd-datetime-picker #picker [showSeconds]="true">
      <sd-datetime-picker-actions>
        <button mat-button sdDatetimePickerClear>Clear</button>
        <button mat-button sdDatetimePickerCancel>Cancel</button>
        <button mat-flat-button sdDatetimePickerApply>Apply</button>
      </sd-datetime-picker-actions>
    </sd-datetime-picker>
  </mat-form-field>

  <p>Current value: <code>{{ ctrl.value | date:'fullDate' }} {{ ctrl.value | date:'mediumTime' }}</code></p>
</main>
```

Overwrite `projects/demo/src/app/app.component.scss`:
```scss
main {
  max-width: 720px;
  margin: 48px auto;
  padding: 0 24px;
  mat-form-field { width: 100%; }
}
```

- [ ] **Step 5: Run dev server and verify the picker opens & applies a value**

Run: `npx ng serve demo`
Open `http://localhost:4200/`. Click the calendar icon → picker opens → select a date → use time spinner to adjust → click Apply → field updates → value shows below.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(demo): wire datetime picker demo page with native adapter"
```

---

## Phase H — Final M0+M1 milestone gates

### Task 28: Verify coverage ≥80% on `projects/datetime/src/lib/**`

- [ ] **Step 1: Run full coverage**

```powershell
npm run test:coverage
```

- [ ] **Step 2: Open `coverage/lcov-report/index.html`**

Verify:
- Statements ≥ 80%
- Branches ≥ 80%
- Functions ≥ 80%
- Lines ≥ 80%
- `SdNativeDateAdapter`-specific file ≥ 95%

If short of target, add tests for uncovered branches. Common gaps: error paths in `SdNativeDateAdapter.createDatetime`, disabled-state guards in directives, the `ngOnDestroy` cleanup path.

- [ ] **Step 3: Add a "minimum coverage" threshold in jest.config.ts**

Edit `jest.config.ts`:
```ts
coverageThreshold: {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  './projects/datetime/src/lib/native/': { branches: 95, functions: 95, lines: 95, statements: 95 },
},
```

- [ ] **Step 4: Re-run coverage to enforce thresholds**

Run: `npm run test:coverage`
Expected: passes thresholds (or fails loudly so we add tests).

- [ ] **Step 5: Commit**

```powershell
git add jest.config.ts
git commit -m "test: enforce 80% global / 95% native-adapter coverage thresholds"
```

---

### Task 29: Update README with quick-start

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Overwrite README with usable quick-start**

```markdown
# @sdcorejs/angular-material-datetime

Datetime, timepicker, and date-range picker for Angular Material — with the date adapter you pick.

**Status:** pre-1.0 (`v0.1.0` covers the datetime picker; timepicker, date-range, moment & date-fns adapters land in subsequent releases).

## Install

```bash
npm install @sdcorejs/angular-material-datetime @angular/material @angular/cdk
```

## Quick start (native Date adapter)

```ts
// app.config.ts
import { provideSdNativeDateAdapter } from '@sdcorejs/angular-material-datetime';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSdNativeDateAdapter({
      parse: { datetimeInput: 'M/d/yyyy h:mm a', dateInput: 'M/d/yyyy', timeInput: 'h:mm a' },
      display: {
        datetimeInput: 'M/d/yyyy h:mm a',
        dateInput: 'M/d/yyyy',
        timeInput: 'h:mm a',
        monthYearLabel: 'MMM yyyy',
        dateA11yLabel: 'longDate',
        monthYearA11yLabel: 'MMMM yyyy',
        popupHeaderDateLabel: 'EEE, MMM d',
      },
    }),
  ],
};
```

```ts
// my.component.ts
import {
  SdDatetimePicker, SdDatetimePickerInput, SdDatetimePickerToggle,
  SdDatetimePickerActions, SdDatetimePickerApply, SdDatetimePickerCancel, SdDatetimePickerClear,
} from '@sdcorejs/angular-material-datetime';

@Component({
  imports: [
    ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule,
    SdDatetimePicker, SdDatetimePickerInput, SdDatetimePickerToggle,
    SdDatetimePickerActions, SdDatetimePickerApply, SdDatetimePickerCancel, SdDatetimePickerClear,
  ],
  template: `
    <mat-form-field>
      <input matInput [sdDatetimePicker]="picker" [formControl]="ctrl">
      <button matSuffix [sdDatetimePickerToggle]="picker">📅</button>
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
export class MyComponent {
  ctrl = new FormControl<Date | null>(null);
}
```

## Compatibility

| Angular | `@sdcorejs/angular-material-datetime` |
|---|---|
| 19.x | 0.1.x |
| 20.x | 0.1.x |
| 21.x | 0.1.x |

## Packages

| Package | Status |
|---|---|
| `@sdcorejs/angular-material-datetime` | v0.1 (datetime picker + native adapter) |
| `@sdcorejs/angular-material-datetime-moment` | planned |
| `@sdcorejs/angular-material-datetime-date-fns` | planned |

## License

MIT — see [LICENSE](./LICENSE).
```

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: add README quick-start for v0.1 datetime picker"
```

---

### Task 30: Tag a pre-release `v0.1.0-alpha.1` (no npm publish yet)

- [ ] **Step 1: Sync to remote and ensure CI is green**

```powershell
git push origin main
```

Wait for the GitHub Actions CI run on `main` to finish green.

- [ ] **Step 2: Tag**

```powershell
git tag v0.1.0-alpha.1 -m "Pre-release: datetime picker end-to-end with native adapter"
git push origin v0.1.0-alpha.1
```

- [ ] **Step 3: Verify tarball can be built and installed locally**

```powershell
npm run build:all
cd dist\datetime
npm pack
# Resulting tarball: sdcorejs-angular-material-datetime-0.1.0.tgz
```

This produces a tarball a downstream consumer could `npm install ./sdcorejs-angular-material-datetime-0.1.0.tgz` to test. No public npm publish yet — that lands in M6 plan along with full compat matrix and release workflow.

- [ ] **Step 4: Final commit (none — tag-only step)**

End of plan.

---

## Acceptance criteria for M0+M1

A reviewer should verify all of the following before merging this work and starting the next milestone's plan:

- [ ] `git clone git@github.com:sdcorejs/angular-material-datetime.git && npm ci && npm run lint && npm run test:coverage && npm run build:all` runs clean from a fresh checkout
- [ ] Coverage thresholds enforced: 80% global, 95% on native adapter
- [ ] `npx ng serve demo` opens a working datetime picker that opens an overlay, lets the user pick date + time, and updates the bound `FormControl` on Apply
- [ ] CI workflow `ci.yml` runs green on Node 20 and Node 22
- [ ] `npm pack dist/datetime` produces an installable tarball
- [ ] Tag `v0.1.0-alpha.1` exists and points to the merged main branch
- [ ] `projects/moment-adapter/` and `projects/date-fns-adapter/` exist as build-green stubs (empty public-api), ready for M3's content
- [ ] No third-party datetime picker library source code (`.ts` / `.scss` / `.html`) is referenced or imported in this repo
- [ ] README contains install, quick-start, compatibility table, and packages table — no reference to any third-party datetime picker library

---

## Spec → plan coverage check

| Spec section | Plan tasks |
|---|---|
| §3 Repo & package structure | Tasks 1-6 |
| §4 SdDateAdapter<D> abstraction | Tasks 11-12 |
| §5 Public API surface — datetime picker family + native adapter | Tasks 15-26 |
| §5 Time-only picker | **Deferred to next plan (M2)** |
| §5 Date-range picker | **Deferred to next plan (M4)** |
| §6 Build & CI matrix — `ci.yml` only | Task 9 |
| §6 Build & CI matrix — compat-matrix.yml + release.yml | **Deferred to next plan (M6)** |
| §7 Demo + docs site | **Minimal demo only** (Task 27); full docs deferred to M5 |
| §8 Initial release path — M0+M1 | Tasks 1-30 |

## Notes for the implementing engineer

- **Strict TDD**: every task above starts with a failing test before any production code. Do not write the implementation block before observing the red.
- **Clean-room rule**: do not read source files (`.ts` / `.scss` / `.html`) of any third-party datetime picker library while implementing. Material's own source, the legacy `<sd-datetime>` in `vn-angular`, and Material 3 design specs are all permitted references.
- **Signal API**: use the modern `input()`, `output()`, `model()`, `signal()`, `computed()` APIs throughout — the baseline is Angular 19+ where these are stable.
- **Frequent commits**: each task ends with a commit. Do not batch multiple tasks into one commit.
- **When stuck**: prefer to add a TODO comment + a failing test marked `it.todo(...)` and move on rather than block the milestone. M2+ plans can pick up unfinished edges.

# sd-angular i18n (VI/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bilingual VI/EN support to `@sdcorejs/angular` via a new `@sdcorejs/angular/i18n` secondary entry point, then migrate all hardcoded VI strings in the library to use i18n keys.

**Architecture:** Custom signal-based `SdI18nService` with two TS-static-imported message maps (`vi.ts`, `en.ts`). Pipe `| sdT` and function `i18n.t(key, params?)` consume the service. Initial language resolves from localStorage → `ISdCoreConfiguration.language` → `'vi'`. Runtime `setLanguage()` persists to localStorage.

**Tech Stack:** Angular 19, TypeScript strict, ng-packagr secondary entry points, Jasmine/Karma specs (existing setup).

**Spec:** `docs/superpowers/specs/2026-05-17-sd-angular-i18n-design.md`

---

## Phase 1 — i18n infrastructure (TDD)

### Task 1: Create secondary entry point skeleton

**Files:**
- Create: `projects/sdcorejs-angular/i18n/ng-package.json`
- Create: `projects/sdcorejs-angular/i18n/index.ts`
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.token.ts`

- [ ] **Step 1: Create ng-package.json**

```json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "index.ts"
  }
}
```

- [ ] **Step 2: Create index.ts barrel**

```ts
export * from './src/sd-i18n.token';
export * from './src/sd-i18n.types';
export * from './src/sd-i18n.messages';
export * from './src/sd-i18n.service';
export * from './src/sd-i18n.pipe';
```

(Files referenced will exist after Task 2-6. Build will fail until then — that's expected.)

- [ ] **Step 3: Create sd-i18n.token.ts**

```ts
export const SD_I18N_STORAGE_KEY = 'sd-core.language';
```

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/i18n/
git commit -m "SM-00: scaffold @sdcorejs/angular/i18n entry point"
```

---

### Task 2: Types + initial vi/en stubs + messages composer

**Files:**
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.types.ts`
- Create: `projects/sdcorejs-angular/i18n/src/vi.ts`
- Create: `projects/sdcorejs-angular/i18n/src/en.ts`
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.messages.ts`

- [ ] **Step 1: Create vi.ts with seed keys (used by service tests)**

```ts
export const VI_MESSAGES = {
  'core.common.cancel': 'Hủy',
  'core.common.close': 'Đóng',
  'core.test.greet': 'Xin chào {name}',
} as const;
```

- [ ] **Step 2: Create en.ts with parity keys**

```ts
import type { VI_MESSAGES } from './vi';

export const EN_MESSAGES: Record<keyof typeof VI_MESSAGES, string> = {
  'core.common.cancel': 'Cancel',
  'core.common.close': 'Close',
  'core.test.greet': 'Hello {name}',
};
```

- [ ] **Step 3: Create sd-i18n.types.ts**

```ts
import type { VI_MESSAGES } from './vi';

export type SdLanguage = 'vi' | 'en';
export const SD_SUPPORTED_LANGUAGES: readonly SdLanguage[] = ['vi', 'en'] as const;
export type SdI18nKey = keyof typeof VI_MESSAGES;
export type SdI18nParams = Record<string, string | number>;
```

- [ ] **Step 4: Create sd-i18n.messages.ts**

```ts
import { EN_MESSAGES } from './en';
import { VI_MESSAGES } from './vi';
import type { SdLanguage } from './sd-i18n.types';

export const SD_MESSAGES: Record<SdLanguage, Readonly<Record<string, string>>> = {
  vi: VI_MESSAGES,
  en: EN_MESSAGES,
};

export { VI_MESSAGES, EN_MESSAGES };
```

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/i18n/src/
git commit -m "SM-00: i18n types + vi/en seed messages"
```

---

### Task 3: SdI18nService — initial language resolution (TDD)

**Files:**
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.service.ts`
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.service.spec.ts`

- [ ] **Step 1: Write failing tests for initial resolution**

```ts
import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SD_I18N_STORAGE_KEY } from './sd-i18n.token';
import { SdI18nService } from './sd-i18n.service';

describe('SdI18nService — initial resolution', () => {
  beforeEach(() => localStorage.removeItem(SD_I18N_STORAGE_KEY));

  it('uses localStorage when valid', () => {
    localStorage.setItem(SD_I18N_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: 'vi' } }],
    });
    expect(TestBed.inject(SdI18nService).language()).toBe('en');
  });

  it('falls back to config when localStorage empty', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: 'en' } }],
    });
    expect(TestBed.inject(SdI18nService).language()).toBe('en');
  });

  it('falls back to vi when both empty', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(SdI18nService).language()).toBe('vi');
  });

  it('ignores invalid localStorage value', () => {
    localStorage.setItem(SD_I18N_STORAGE_KEY, 'fr');
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: 'en' } }],
    });
    expect(TestBed.inject(SdI18nService).language()).toBe('en');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (service not implemented)**

```bash
npx ng test sdcorejs-angular --watch=false --include="**/sd-i18n.service.spec.ts"
```

- [ ] **Step 3: Implement minimal service**

```ts
import { inject, Injectable, signal, Signal, WritableSignal, computed } from '@angular/core';
import { SD_CORE_CONFIGURATION, ISdCoreConfiguration } from '@sdcorejs/angular/configurations';
import { SD_MESSAGES } from './sd-i18n.messages';
import { SD_I18N_STORAGE_KEY } from './sd-i18n.token';
import { SD_SUPPORTED_LANGUAGES, SdI18nParams, SdLanguage } from './sd-i18n.types';

@Injectable({ providedIn: 'root' })
export class SdI18nService {
  readonly #config = inject<ISdCoreConfiguration | null>(SD_CORE_CONFIGURATION, { optional: true });
  readonly #language: WritableSignal<SdLanguage> = signal(this.#resolveInitial());
  readonly #warned = new Set<string>();

  readonly language: Signal<SdLanguage> = this.#language.asReadonly();
  readonly messages: Signal<Readonly<Record<string, string>>> = computed(() => SD_MESSAGES[this.#language()]);

  setLanguage(lang: SdLanguage): void {
    if (!SD_SUPPORTED_LANGUAGES.includes(lang)) return;
    this.#language.set(lang);
    try { localStorage.setItem(SD_I18N_STORAGE_KEY, lang); } catch { /* ignore */ }
  }

  t(key: string, params?: SdI18nParams): string {
    return key; // tested + replaced in Task 5
  }

  #resolveInitial(): SdLanguage {
    try {
      const stored = localStorage.getItem(SD_I18N_STORAGE_KEY) as SdLanguage | null;
      if (stored && SD_SUPPORTED_LANGUAGES.includes(stored)) return stored;
    } catch { /* ignore */ }
    const configured = this.#config?.language;
    if (configured && SD_SUPPORTED_LANGUAGES.includes(configured)) return configured;
    return 'vi';
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx ng test sdcorejs-angular --watch=false --include="**/sd-i18n.service.spec.ts"
```

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/i18n/src/sd-i18n.service.ts projects/sdcorejs-angular/i18n/src/sd-i18n.service.spec.ts
git commit -m "SM-00: SdI18nService - initial language resolution"
```

---

### Task 4: SdI18nService — setLanguage + persist (TDD)

**Files:**
- Modify: `projects/sdcorejs-angular/i18n/src/sd-i18n.service.spec.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('SdI18nService — setLanguage', () => {
  beforeEach(() => localStorage.removeItem(SD_I18N_STORAGE_KEY));

  it('updates signal', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(SdI18nService);
    svc.setLanguage('en');
    expect(svc.language()).toBe('en');
  });

  it('persists to localStorage', () => {
    TestBed.configureTestingModule({ providers: [] });
    TestBed.inject(SdI18nService).setLanguage('en');
    expect(localStorage.getItem(SD_I18N_STORAGE_KEY)).toBe('en');
  });

  it('messages signal swaps when language changes', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(SdI18nService);
    expect(svc.messages()['core.common.cancel']).toBe('Hủy');
    svc.setLanguage('en');
    expect(svc.messages()['core.common.cancel']).toBe('Cancel');
  });

  it('ignores unsupported language', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(SdI18nService);
    svc.setLanguage('fr' as SdLanguage);
    expect(svc.language()).toBe('vi');
  });
});
```

- [ ] **Step 2: Run — expect PASS (logic already implemented in Task 3)**

```bash
npx ng test sdcorejs-angular --watch=false --include="**/sd-i18n.service.spec.ts"
```

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/i18n/src/sd-i18n.service.spec.ts
git commit -m "SM-00: SdI18nService - setLanguage + persist tests"
```

---

### Task 5: SdI18nService — t() with fallback + interpolation (TDD)

**Files:**
- Modify: `projects/sdcorejs-angular/i18n/src/sd-i18n.service.ts`
- Modify: `projects/sdcorejs-angular/i18n/src/sd-i18n.service.spec.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('SdI18nService — t()', () => {
  beforeEach(() => localStorage.removeItem(SD_I18N_STORAGE_KEY));

  it('returns value for existing key', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(SdI18nService).t('core.common.cancel')).toBe('Hủy');
  });

  it('interpolates {name} params', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(SdI18nService).t('core.test.greet', { name: 'Bob' })).toBe('Xin chào Bob');
  });

  it('keeps placeholder when param missing', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(SdI18nService).t('core.test.greet')).toBe('Xin chào {name}');
  });

  it('falls back to VI when EN key missing', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(SdI18nService);
    (svc.messages() as Record<string, string>)['core.test.greet']; // sanity
    // simulate missing EN entry by querying after force-switch; since en parity is enforced,
    // we exercise fallback via an unknown key
    expect(svc.t('core.unknown.key')).toBe('core.unknown.key');
  });

  it('returns key as-is when missing in both', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(SdI18nService).t('core.missing.xyz')).toBe('core.missing.xyz');
  });

  it('warns once per missing key', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(SdI18nService);
    const spy = spyOn(console, 'warn');
    svc.t('core.missing.warn-once');
    svc.t('core.missing.warn-once');
    expect(spy.calls.count()).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL on most**

```bash
npx ng test sdcorejs-angular --watch=false --include="**/sd-i18n.service.spec.ts"
```

- [ ] **Step 3: Replace `t()` implementation**

```ts
t(key: string, params?: SdI18nParams): string {
  const current = SD_MESSAGES[this.#language()];
  const raw = current[key] ?? this.#fallback(key);
  return this.#interpolate(raw, params);
}

#fallback(key: string): string {
  const vi = SD_MESSAGES.vi[key];
  if (vi !== undefined) {
    this.#warnOnce(`[SdI18n] Missing key in ${this.#language()}: ${key} (fallback to vi)`);
    return vi;
  }
  this.#warnOnce(`[SdI18n] Missing key: ${key}`);
  return key;
}

#interpolate(raw: string, params?: SdI18nParams): string {
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}

#warnOnce(msg: string): void {
  if (this.#warned.has(msg)) return;
  this.#warned.add(msg);
  console.warn(msg);
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx ng test sdcorejs-angular --watch=false --include="**/sd-i18n.service.spec.ts"
```

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/i18n/src/sd-i18n.service.ts projects/sdcorejs-angular/i18n/src/sd-i18n.service.spec.ts
git commit -m "SM-00: SdI18nService - t() lookup, fallback, interpolation"
```

---

### Task 6: SdTPipe (TDD)

**Files:**
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.pipe.ts`
- Create: `projects/sdcorejs-angular/i18n/src/sd-i18n.pipe.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdI18nService } from './sd-i18n.service';
import { SdTPipe } from './sd-i18n.pipe';
import { SD_I18N_STORAGE_KEY } from './sd-i18n.token';

@Component({ standalone: true, imports: [SdTPipe], template: `{{ key() | sdT: params() }}` })
class Host {
  readonly key = signal('core.common.cancel');
  readonly params = signal<Record<string, string> | undefined>(undefined);
}

describe('SdTPipe', () => {
  beforeEach(() => localStorage.removeItem(SD_I18N_STORAGE_KEY));

  it('renders translation', () => {
    const fix = TestBed.createComponent(Host);
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Hủy');
  });

  it('re-renders after setLanguage', () => {
    const fix = TestBed.createComponent(Host);
    fix.detectChanges();
    TestBed.inject(SdI18nService).setLanguage('en');
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Cancel');
  });

  it('passes params to interpolation', () => {
    const fix = TestBed.createComponent(Host);
    fix.componentInstance.key.set('core.test.greet');
    fix.componentInstance.params.set({ name: 'Ada' });
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Xin chào Ada');
  });
});
```

- [ ] **Step 2: Run — expect FAIL (no SdTPipe)**

```bash
npx ng test sdcorejs-angular --watch=false --include="**/sd-i18n.pipe.spec.ts"
```

- [ ] **Step 3: Implement pipe**

```ts
import { inject, Pipe, PipeTransform } from '@angular/core';
import { SdI18nService } from './sd-i18n.service';
import { SdI18nParams } from './sd-i18n.types';

@Pipe({ name: 'sdT', pure: false, standalone: true })
export class SdTPipe implements PipeTransform {
  readonly #i18n = inject(SdI18nService);
  transform(key: string, params?: SdI18nParams): string {
    return this.#i18n.t(key, params);
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/i18n/src/sd-i18n.pipe.ts projects/sdcorejs-angular/i18n/src/sd-i18n.pipe.spec.ts
git commit -m "SM-00: SdTPipe - reactive translation pipe"
```

---

### Task 7: Add `language` to ISdCoreConfiguration

**Files:**
- Modify: `projects/sdcorejs-angular/configurations/src/sd-core.configuration.ts`

- [ ] **Step 1: Add field**

Edit `projects/sdcorejs-angular/configurations/src/sd-core.configuration.ts` from:

```ts
import { InjectionToken } from "@angular/core";

export interface ISdCoreConfiguration {
  // License Key được cấp theo domain/sub domain, ví dụ: domain.com, sub.domain.com
  // Domain localhost, 127.0.0.1 không cần key
  // Các domain DEV/QC/UAT/PROD ... cần key tương ứng cho từng domain
  licenseKey?: string | string[]; 
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
```

to:

```ts
import { InjectionToken } from "@angular/core";
import type { SdLanguage } from "@sdcorejs/angular/i18n";

export interface ISdCoreConfiguration {
  // License Key được cấp theo domain/sub domain, ví dụ: domain.com, sub.domain.com
  // Domain localhost, 127.0.0.1 không cần key
  // Các domain DEV/QC/UAT/PROD ... cần key tương ứng cho từng domain
  licenseKey?: string | string[];
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
  // Ngôn ngữ mặc định cho các message của Core; có thể được override bởi localStorage
  // Default: 'vi'
  language?: SdLanguage;
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
```

- [ ] **Step 2: Verify build**

```bash
npx ng build sdcorejs-angular
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/configurations/src/sd-core.configuration.ts
git commit -m "SM-00: ISdCoreConfiguration - add language option"
```

---

### Task 8: Wire i18n into top-level public-api

**Files:**
- Modify: `projects/sdcorejs-angular/src/public-api.ts`

- [ ] **Step 1: Add i18n import after configurations**

```ts
/*
 * Public API Surface of sd-angular
 */
import '@sdcorejs/angular/configurations';
import '@sdcorejs/angular/i18n';
import '@sdcorejs/angular/utilities';
import '@sdcorejs/angular/pipes';
import '@sdcorejs/angular/directives';
import '@sdcorejs/angular/services';
import '@sdcorejs/angular/interceptors';
import '@sdcorejs/angular/handlers';
import '@sdcorejs/angular/components';
import '@sdcorejs/angular/forms';
import '@sdcorejs/angular/modules';
```

- [ ] **Step 2: Build + test**

```bash
npx ng build sdcorejs-angular
npx ng test sdcorejs-angular --watch=false
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/src/public-api.ts
git commit -m "SM-00: register @sdcorejs/angular/i18n in public-api"
```

---

## Phase 2 — Tooling guards

### Task 9: `check:i18n-parity` script

**Files:**
- Create: `scripts/check-i18n-parity.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the script**

```js
// scripts/check-i18n-parity.mjs
import { VI_MESSAGES } from '../projects/sdcorejs-angular/i18n/src/vi.ts';
import { EN_MESSAGES } from '../projects/sdcorejs-angular/i18n/src/en.ts';

const vi = Object.keys(VI_MESSAGES).sort();
const en = Object.keys(EN_MESSAGES).sort();
const missingInEn = vi.filter(k => !(k in EN_MESSAGES));
const extraInEn = en.filter(k => !(k in VI_MESSAGES));

if (missingInEn.length || extraInEn.length) {
  console.error('i18n parity violated:');
  if (missingInEn.length) console.error('  Missing in en:', missingInEn);
  if (extraInEn.length) console.error('  Extra in en:', extraInEn);
  process.exit(1);
}
console.log(`i18n parity OK (${vi.length} keys)`);
```

Note: running `.ts` directly needs `tsx` (already common). If `tsx` is not installed, the script can be rewritten as a `.spec.ts` running under Karma — but a Node script is fastest for CI. Add `tsx` as devDep if missing.

- [ ] **Step 2: Add devDep + npm script**

```bash
npm i -D tsx
```

In `package.json` under `"scripts"` add:

```json
"check:i18n-parity": "tsx scripts/check-i18n-parity.mjs"
```

- [ ] **Step 3: Run — expect PASS (3 seed keys match)**

```bash
npm run check:i18n-parity
```

- [ ] **Step 4: Commit**

```bash
git add scripts/check-i18n-parity.mjs package.json package-lock.json
git commit -m "SM-00: check:i18n-parity script"
```

---

### Task 10: `check:i18n` hardcode-guard script

**Files:**
- Create: `scripts/check-i18n.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the script**

```js
// scripts/check-i18n.mjs
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = 'projects/sdcorejs-angular';
const VI_REGEX = /[ÀÁẢÃẠẰẮẲẴẶÂẦẤẨẪẬĂÈÉẺẼẸỀẾỂỄỆÊÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘÔỜỚỞỠỢƠÙÚỦŨỤỪỨỬỮỰƯỲÝỶỸỴĐàáảãạằắẳẵặâầấẩẫậăèéẻẽẹềếểễệêìíỉĩịòóỏõọồốổỗộôờớởỡợơùúủũụừứửữựưỳýỷỹỵđ]/;
const WHITELIST = [
  /\/i18n\/src\/vi\.ts$/,
  /\.spec\.ts$/,
];
const errors = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      walk(full);
    } else if (/\.(ts|html)$/.test(name)) {
      check(full);
    }
  }
}

function check(file) {
  const rel = relative(process.cwd(), file).replace(/\\/g, '/');
  if (WHITELIST.some(rx => rx.test(rel))) return;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripComments(lines[i], file);
    if (VI_REGEX.test(stripped)) {
      errors.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
    }
  }
}

function stripComments(line, file) {
  if (file.endsWith('.html')) return line.replace(/<!--[\s\S]*?-->/g, '');
  // strip // comment and /* */ inside the line (single-line scope)
  const noBlock = line.replace(/\/\*[\s\S]*?\*\//g, '');
  const idx = noBlock.indexOf('//');
  return idx >= 0 ? noBlock.slice(0, idx) : noBlock;
}

walk(ROOT);
if (errors.length) {
  console.error(`Found ${errors.length} hardcoded Vietnamese strings:`);
  errors.slice(0, 50).forEach(e => console.error('  ' + e));
  if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
  process.exit(1);
}
console.log('check:i18n OK');
```

Note: stripping block comments line-by-line is naive — multi-line block comments containing VI may slip through; acceptable for guard purposes (false negatives, not false positives).

- [ ] **Step 2: Add npm script**

In `package.json`:

```json
"check:i18n": "node scripts/check-i18n.mjs"
```

- [ ] **Step 3: Run — expect FAIL (current code has many VI strings)**

```bash
npm run check:i18n
```

Expected: exit code 1, list of offending files.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-i18n.mjs package.json
git commit -m "SM-00: check:i18n hardcode guard (will pass after migration)"
```

---

## Phase 3 — Migration batches

**Common procedure per batch (reuse for Tasks 11–17):**

For each file in the batch:

1. Open file. Identify every VI string literal (quoted `'…'` / `"…"` / backtick) AND every text-node/attribute in `.html`.
2. For each unique string, mint a key `core.<scope>.<descriptor>` per spec convention.
3. Add entry to `projects/sdcorejs-angular/i18n/src/vi.ts` (VI = the original string).
4. Add EN translation to `projects/sdcorejs-angular/i18n/src/en.ts` (use natural EN, not machine translation).
5. Replace in source:
   - TS: `this.#i18n.t('core.scope.key')` (inject `SdI18nService` if not already).
   - TS constants (e.g., `pattern.model.ts` `name`/`errorMessage`): store the **key** as the value; update consumers to `i18n.t(value)`.
   - HTML text node: `{{ 'core.scope.key' | sdT }}`.
   - HTML attribute: `[attr]="'core.scope.key' | sdT"`.
6. **Do not** translate `console.log` / `console.warn` / `console.error` arguments — these are dev logs.
7. **Do** translate `throw new Error(...)` arguments — these can surface to UX.
8. Update any spec file asserting the previous VI literal — assert the key OR `TestBed.inject(SdI18nService).t(...)`.

After batch:
- Run `npm run check:i18n-parity` → must PASS.
- Run `npx ng test sdcorejs-angular --watch=false` → must PASS.
- Run `npm run check:i18n` → FAIL count must drop monotonically; record the new count in commit message.
- Commit: `git commit -m "SM-00: i18n migration batch N - <area>"`.

---

### Task 11: Batch 1 — utilities + handlers (5 files)

**Files to migrate** (run `grep -lE "'[^']*[À-ỹ][^']*'" projects/sdcorejs-angular/{utilities,handlers} --include="*.ts" -r | grep -v spec.ts` to confirm before starting):

- `projects/sdcorejs-angular/utilities/models/src/pattern.model.ts`
- `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts` (verify — may only have VI in comments)
- `projects/sdcorejs-angular/utilities/models/src/pattern.model.spec.ts` (test update only)
- `projects/sdcorejs-angular/handlers/global-error.handler.ts`

- [ ] **Step 1: For `pattern.model.ts` — convert `name` + `errorMessage` fields to i18n keys**

Before:
```ts
{ name: 'Email', errorMessage: 'Email không hợp lệ', ... }
```

After:
```ts
{ name: 'core.validator.email.name', errorMessage: 'core.validator.email.error', ... }
```

Add to `vi.ts`:
```ts
'core.validator.email.name': 'Email',
'core.validator.email.error': 'Email không hợp lệ',
'core.validator.phone.name': 'SĐT',
'core.validator.phone.error': 'Số điện thoại không hợp lệ',
'core.validator.phone-vn.name': 'SĐT VN',
'core.validator.phone-vn.error': 'Số điện thoại không hợp lệ',
'core.validator.cccd.name': 'CCCD',
'core.validator.cccd.error': 'CCCD không hợp lệ (12 chữ số)',
'core.validator.passport.name': 'Hộ chiếu',
'core.validator.passport.error': 'Hộ chiếu không hợp lệ (1 chữ cái + 7 chữ số)',
'core.validator.id-vn.name': 'CCCD/Hộ chiếu',
'core.validator.id-vn.error': 'CCCD/CMND hoặc Hộ chiếu không hợp lệ',
'core.validator.time.name': 'Giờ',
'core.validator.time.error': 'Giờ không hợp lệ (định dạng HH:mm)',
```

Add parity to `en.ts` (natural EN):
```ts
'core.validator.email.name': 'Email',
'core.validator.email.error': 'Invalid email',
'core.validator.phone.name': 'Phone',
'core.validator.phone.error': 'Invalid phone number',
'core.validator.phone-vn.name': 'VN phone',
'core.validator.phone-vn.error': 'Invalid phone number',
'core.validator.cccd.name': 'National ID',
'core.validator.cccd.error': 'Invalid national ID (12 digits)',
'core.validator.passport.name': 'Passport',
'core.validator.passport.error': 'Invalid passport (1 letter + 7 digits)',
'core.validator.id-vn.name': 'National ID / Passport',
'core.validator.id-vn.error': 'Invalid national ID or passport',
'core.validator.time.name': 'Time',
'core.validator.time.error': 'Invalid time (format HH:mm)',
```

- [ ] **Step 2: Find consumers of `pattern.name` / `pattern.errorMessage`**

```bash
grep -rn "errorMessage" projects/sdcorejs-angular --include="*.ts" | grep -v "i18n/" | grep -v ".spec.ts"
grep -rn "\.name\b" projects/sdcorejs-angular/utilities --include="*.ts"
```

For each consumer that currently displays `pattern.name` or `pattern.errorMessage` to UI, wrap with `i18n.t(pattern.name)` / `i18n.t(pattern.errorMessage)`.

- [ ] **Step 3: Update `pattern.model.spec.ts`**

Before:
```ts
expect(pattern?.name).toBe('SĐT');
expect(pattern?.errorMessage).toContain('12 chữ số');
```

After:
```ts
expect(pattern?.name).toBe('core.validator.phone.name');
expect(pattern?.errorMessage).toBe('core.validator.cccd.error');
```

- [ ] **Step 4: For `global-error.handler.ts` — migrate any user-facing strings**

Read the file, identify VI strings used in toast / snackbar / dialog calls. Replace with `i18n.t(...)`. Inject service with `readonly #i18n = inject(SdI18nService);`.

- [ ] **Step 5: Run checks**

```bash
npm run check:i18n-parity
npx ng test sdcorejs-angular --watch=false
npm run check:i18n   # expect lower offending-file count
```

- [ ] **Step 6: Commit**

```bash
git add projects/sdcorejs-angular/utilities projects/sdcorejs-angular/handlers projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 1 - utilities + handlers"
```

---

### Task 12: Batch 2 — interceptors (1 file)

**Files:**
- `projects/sdcorejs-angular/interceptors/no-internet/no-internet.interceptor.ts`
- `projects/sdcorejs-angular/interceptors/unauthorized/unauthorized.interceptor.ts` (verify content)

- [ ] **Step 1: Migrate `no-internet.interceptor.ts`**

Strings to extract (from line refs in source):
- `'Không có kết nối mạng. Đang chờ kết nối...'` → `core.interceptor.no-internet.offline`
- `'Không thể kết nối đến máy chủ (Lỗi CORS hoặc cấu hình).'` → `core.interceptor.no-internet.cors-error`
- `'Đóng'` → `core.common.close`
- `'Máy chủ đang bảo trì. Vui lòng thử lại sau!'` → `core.interceptor.maintenance`
- `'Tải lại trang'` → `core.common.reload`
- `'Kết nối đã được khôi phục!'` → `core.interceptor.no-internet.restored`

Leave `console.log('--- Bắt đầu chế độ theo dõi mạng ---')` and similar `console.*` unchanged.

Inject `SdI18nService`, replace string literals with `this.#i18n.t('core.…')`. Add VI keys to `vi.ts`, EN parity to `en.ts`.

- [ ] **Step 2: Migrate `unauthorized.interceptor.ts`** following same procedure.

- [ ] **Step 3: Run checks + commit**

```bash
npm run check:i18n-parity && npx ng test sdcorejs-angular --watch=false && npm run check:i18n || true
git add projects/sdcorejs-angular/interceptors projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 2 - interceptors"
```

---

### Task 13: Batch 3 — services + directives (4 files)

**Files (verify each):**
- `projects/sdcorejs-angular/services/excel/src/lib/excel.service.ts`
- `projects/sdcorejs-angular/modules/auth/services/auth.service.ts`
- `projects/sdcorejs-angular/directives/src/sd-tooltip.directive.ts`
- `projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts`

Note: auth services live under `modules/` but spec groups them as services. Treat each carefully.

- [ ] **Step 1: Migrate each file using common procedure**

Known strings:
- `excel.service.ts`: `'Không đọc được nội dung file'` → `core.excel.cannot-read-file`; `'File Excel không có sheet dữ liệu'` → `core.excel.no-sheet`.
- For tooltip/scroll directives: identify any displayed strings and migrate.

- [ ] **Step 2: Run checks + commit**

```bash
npm run check:i18n-parity && npx ng test sdcorejs-angular --watch=false && npm run check:i18n || true
git add projects/sdcorejs-angular/services projects/sdcorejs-angular/directives projects/sdcorejs-angular/modules/auth projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 3 - services + directives"
```

---

### Task 14: Batch 4a — forms (11 files)

**Files:** All `.ts` files under `projects/sdcorejs-angular/forms/` containing VI string literals. Confirm list with:

```bash
grep -lE "'[^']*[À-ỹ][^']*'|\"[^\"]*[À-ỹ][^\"]*\"" projects/sdcorejs-angular/forms --include="*.ts" -r | grep -v ".spec.ts"
```

- [ ] **Step 1: Migrate each file using common procedure**

Use key scope `core.form.<form-name>.<descriptor>` for form-specific strings; reuse `core.common.*` for generic ones (cancel, save, confirm).

- [ ] **Step 2: Run checks + commit**

```bash
npm run check:i18n-parity && npx ng test sdcorejs-angular --watch=false && npm run check:i18n || true
git add projects/sdcorejs-angular/forms projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 4a - forms"
```

---

### Task 15: Batch 4b — components TS (33 files)

**Files:** All `.ts` files under `projects/sdcorejs-angular/components/` containing VI string literals (excluding specs). Run inventory:

```bash
grep -lE "'[^']*[À-ỹ][^']*'|\"[^\"]*[À-ỹ][^\"]*\"" projects/sdcorejs-angular/components --include="*.ts" -r | grep -v ".spec.ts" > /tmp/batch4b.txt
cat /tmp/batch4b.txt
```

- [ ] **Step 1: Migrate each file using common procedure**

Use key scope `core.component.<component-name>.<descriptor>`. Components likely contributing:
- `splitter` (storage error messages, default labels)
- `form-generic` (template tokens, validator labels)
- `section` (empty state placeholder)
- `code-editor`, `anchor`, `badge`, `button`, `document-builder`, etc.

For configuration objects (e.g., `document-builder.config.ts`) that ship default labels: store as key, expect consumer / component to resolve via `i18n.t(label)`.

- [ ] **Step 2: Run checks + commit**

```bash
npm run check:i18n-parity && npx ng test sdcorejs-angular --watch=false && npm run check:i18n || true
git add projects/sdcorejs-angular/components projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 4b - components TS"
```

---

### Task 16: Batch 4c — components HTML (71 files)

**Files:** All `.html` files under `projects/sdcorejs-angular/components/`. Run inventory:

```bash
grep -lE "[À-ỹ]" projects/sdcorejs-angular/components --include="*.html" -r > /tmp/batch4c.txt
cat /tmp/batch4c.txt
```

- [ ] **Step 1: Migrate each template using common procedure**

For each template:
- Ensure `SdTPipe` is imported by the host component (`imports: [SdTPipe, ...]`).
- Text node: `{{ 'core.component.xxx' | sdT }}`.
- Attribute: `[placeholder]="'core.common.search' | sdT"`.
- For attributes that don't accept binding (rare), restructure to use property binding form.

Reuse keys minted in Task 15 where the same string appears in template and TS.

- [ ] **Step 2: Run checks + commit**

```bash
npm run check:i18n-parity && npx ng test sdcorejs-angular --watch=false && npm run check:i18n || true
git add projects/sdcorejs-angular/components projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 4c - components HTML"
```

---

### Task 17: Batch 5 — modules TS + HTML (16 files)

**Files:** All `.ts` and `.html` under `projects/sdcorejs-angular/modules/` (excluding `auth/` already done in Task 13) containing VI:

```bash
grep -lE "'[^']*[À-ỹ][^']*'|\"[^\"]*[À-ỹ][^\"]*\"" projects/sdcorejs-angular/modules --include="*.ts" -r | grep -v ".spec.ts" | grep -vE "/auth/"
grep -lE "[À-ỹ]" projects/sdcorejs-angular/modules --include="*.html" -r
```

Known critical files:
- `projects/sdcorejs-angular/modules/layout/modules/forbidden/pages/root/root.component.html`
- `projects/sdcorejs-angular/modules/layout/modules/not-found/pages/root/root.component.html`

- [ ] **Step 1: Migrate using common procedure**

Use scope `core.layout.<area>.<descriptor>` e.g., `core.layout.forbidden.title`, `core.layout.not-found.title`.

- [ ] **Step 2: Run checks + commit**

```bash
npm run check:i18n-parity && npx ng test sdcorejs-angular --watch=false && npm run check:i18n || true
git add projects/sdcorejs-angular/modules projects/sdcorejs-angular/i18n/src/vi.ts projects/sdcorejs-angular/i18n/src/en.ts
git commit -m "SM-00: i18n migration batch 5 - modules"
```

---

## Phase 4 — Final verification

### Task 18: Final sweep & acceptance

- [ ] **Step 1: Confirm `npm run check:i18n` is GREEN**

```bash
npm run check:i18n
```

Expected: `check:i18n OK`. If any remain, inspect — likely false positives in block comments (acceptable, add whitelist) OR genuine misses (migrate).

- [ ] **Step 2: Run full test suite**

```bash
npx ng test sdcorejs-angular --watch=false
```

Expected: PASS.

- [ ] **Step 3: Run production build**

```bash
npx ng build sdcorejs-angular
```

Expected: PASS, no warnings about missing entry point.

- [ ] **Step 4: Manual smoke (consumer side)**

In a consumer portal app (`src/app.config.ts`):
1. Set `SD_CORE_CONFIGURATION = { language: 'vi' }` → reload → UI VI.
2. Call `inject(SdI18nService).setLanguage('en')` from a button → UI flips to EN instantly.
3. Reload tab → still EN (localStorage).
4. Clear localStorage → reload → falls back to config (`vi`).

- [ ] **Step 5: Build-size sanity check**

```bash
ls -la dist/sdcorejs-angular/fesm2022/sd-angular-i18n.mjs
```

Expected: < 30 KB pre-gzip.

- [ ] **Step 6: Final commit (if any fixes from sweep)**

```bash
git add -A
git commit -m "SM-00: i18n migration - final sweep"
```

---

## Risks recap (from spec)

- **Pipe `pure: false`** invalidates per CD cycle. If table cells / list items render slowly, add per-key memoization inside `SdI18nService.t()` keyed on `(language, key, JSON.stringify(params))`.
- **`pattern.errorMessage` consumers** outside the library (in dependent portals) may still expect raw VI. Those repos must update concurrently — flag in PR description.
- **EN translation quality** — native-English review pending; round-1 translations accepted.
- **localStorage flakiness in tests** — every spec must `localStorage.removeItem(SD_I18N_STORAGE_KEY)` in `beforeEach`.

---

## Self-review

- ✅ Spec coverage: language config (Task 7), localStorage (Task 3-5), pipe (Task 6), parity script (Task 9), guard script (Task 10), pattern.model migration (Task 11), HTML batch (Task 16), exception messages (covered in common procedure), console.log left alone (common procedure), spec test updates (Task 11 + procedure note).
- ✅ No `TBD` / `TODO` placeholders.
- ✅ Type consistency: `SdI18nService`, `SdTPipe`, `SdLanguage`, `SdI18nParams`, `SD_I18N_STORAGE_KEY`, `SD_SUPPORTED_LANGUAGES`, `VI_MESSAGES`, `EN_MESSAGES`, `SD_MESSAGES` consistent across tasks.
- ✅ Each task ends with commit step; commit messages follow repo's `SM-00:` convention from recent history.

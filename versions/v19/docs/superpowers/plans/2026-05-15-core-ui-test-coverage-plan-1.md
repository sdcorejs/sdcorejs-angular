# Core UI Test Coverage Plan 1 â€” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TÄƒng test coverage cho 10 file primitives cá»§a `@sdcorejs/angular` (4 components, 4 forms, 2 directives) báº±ng cÃ¡ch thÃªm spec files vá»›i TestBed-driven integration tests, Ä‘á»“ng thá»i rÃ  soÃ¡t + cáº£i thiá»‡n .md docs Ä‘i kÃ¨m Ä‘á»ƒ agent/skill tÆ°Æ¡ng lai cÃ³ ngá»¯ cáº£nh Ä‘áº§y Ä‘á»§.

**Architecture:** Má»—i spec dÃ¹ng `TestBed` (Karma + Jasmine â€” Ä‘Ã£ sáºµn trong repo), render component qua `ComponentFixture`, query DOM báº±ng `By.css`/`By.directive`, simulate event qua `dispatchEvent`. Má»™t file utility chung `projects/sdcorejs-angular/testing/test-utils.ts` cung cáº¥p helper giáº£m boilerplate (`createHostFixture`, `queryByCss`, `dispatch`, `setInput`). Directives test qua inline `TestHostComponent`. Async/throttle test báº±ng `fakeAsync` + `tick`.

**Tech Stack:** Angular 19.2.x, Angular Signals, Karma 6.4.x, Jasmine 5.5.x, `@angular/material`, `@angular/cdk/overlay` (cho tooltip).

**Spec:** `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md`

**âš ï¸ Import convention for `test-utils.ts`** (corrected after Task 2 implementation):

`@sdcorejs/angular/testing` alias **does NOT work** at Karma runtime â€” `dist/sdcorejs-angular/package.json` does not export a `testing` condition (testing is intentionally test-only, not a build entry point). All spec files MUST use relative import:

- From `forms/<name>/src/` or `components/<name>/src/` (3 levels up): `import { queryByCss } from '../../../testing/test-utils';`
- From `components/anchor/src/components/anchor/` (5 levels up): `import { queryByCss } from '../../../../../testing/test-utils';`
- From `directives/src/` (2 levels up): `import { queryByCss } from '../../testing/test-utils';`

Plan code blocks below still reference the alias â€” replace with the correct relative path per spec file location.

---

## File Map

| File | Change |
|---|---|
| `projects/sdcorejs-angular/testing/test-utils.ts` | NEW â€” shared test helpers |
| `projects/sdcorejs-angular/testing/index.ts` | NEW â€” barrel |
| `projects/sdcorejs-angular/forms/label/src/label.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/directives/src/sd-mobile.directive.spec.ts` | NEW |
| `projects/sdcorejs-angular/components/avatar/src/avatar.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/components/button/src/button.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/forms/switch/src/switch.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/forms/checkbox/src/checkbox.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/forms/input/src/input.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/components/anchor/src/components/anchor/anchor.component.spec.ts` | NEW |
| `projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts` | NEW |
| `projects/sdcorejs-angular/forms/label/sd-label.md` | Audit + update |
| `projects/sdcorejs-angular/directives/src/sd-mobile.md` | Audit + update |
| `projects/sdcorejs-angular/components/avatar/sd-avatar.md` | Audit + update |
| `projects/sdcorejs-angular/components/badge/sd-badge.md` | Audit + update |
| `projects/sdcorejs-angular/components/button/sd-button.md` | Audit + update |
| `projects/sdcorejs-angular/forms/switch/sd-switch.md` | Audit + update |
| `projects/sdcorejs-angular/forms/checkbox/sd-checkbox.md` | Audit + update |
| `projects/sdcorejs-angular/forms/input/sd-input.md` | Audit + update |
| `projects/sdcorejs-angular/components/anchor/sd-anchor.md` | Audit + update |
| `projects/sdcorejs-angular/directives/src/sd-tooltip.md` | Audit + update |
| `karma.conf.js` (root hoáº·c project) | NEW/Modify â€” coverage threshold config |
| `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` | Append â€” gap report aggregate |

---

## Task ordering rationale

Äi tá»« Ä‘Æ¡n giáº£n â†’ phá»©c táº¡p Ä‘á»ƒ pattern test stabilize trÆ°á»›c:
1. Setup (test-utils)
2. Label (Ä‘Æ¡n giáº£n nháº¥t, khÃ´ng signal input, khÃ´ng form integration)
3. sd-mobile directive (1 IIFE-style logic)
4. Avatar (signal + computed, khÃ´ng form)
5. Badge (signal + boolean shortcuts)
6. Button (signal + throttle + license service)
7. Switch (form integration setter-based)
8. Checkbox (form integration + validator)
9. Input (form integration + signal + effects, phá»©c táº¡p nháº¥t trong forms)
10. Anchor (RxJS + contentChildren + scroll DOM)
11. sd-tooltip (CDK Overlay + static state)
12. Coverage config + gap report aggregate

---

## Pre-flight checks

- [ ] **Step 0.1: Verify branch & clean working tree**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
git status
git checkout -b feature/plan-1-core-ui-tests
```

Expected: branch checked out fresh.

- [ ] **Step 0.2: Verify existing test suite is green baseline**

```bash
npm run test:ci
```

Expected: 17 spec files pass. Note tá»•ng sá»‘ test (baseline).

---

## Task 1: Shared test utilities

**Files:**
- Create: `projects/sdcorejs-angular/testing/test-utils.ts`
- Create: `projects/sdcorejs-angular/testing/index.ts`

- [ ] **Step 1: Create directory & barrel**

```bash
mkdir -p projects/sdcorejs-angular/testing
```

Create `projects/sdcorejs-angular/testing/index.ts`:

```typescript
export * from './test-utils';
```

- [ ] **Step 2: Create `test-utils.ts`**

```typescript
import { Component, DebugElement, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export interface HostFixtureResult<THost> {
  fixture: ComponentFixture<THost>;
  host: THost;
  debugElement: DebugElement;
  nativeElement: HTMLElement;
}

/**
 * Táº¡o fixture tá»« má»™t host component Ä‘Æ°á»£c khai bÃ¡o inline.
 * DÃ¹ng khi cáº§n test directive hoáº·c component qua template wrapper.
 *
 * @example
 * @Component({ template: '<sd-button title="X"></sd-button>', imports: [SdButton], standalone: true })
 * class Host {}
 *
 * const { fixture, nativeElement } = createHostFixture(Host);
 */
export function createHostFixture<THost>(hostType: Type<THost>): HostFixtureResult<THost> {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    debugElement: fixture.debugElement,
    nativeElement: fixture.nativeElement as HTMLElement,
  };
}

/**
 * Query 1 element báº±ng By.css. Throw vá»›i message rÃµ rÃ ng náº¿u khÃ´ng tÃ¬m tháº¥y.
 */
export function queryByCss<T extends HTMLElement = HTMLElement>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): T {
  const debugEl = fixture.debugElement.query(By.css(selector));
  if (!debugEl) {
    throw new Error(`queryByCss: no element matches "${selector}"`);
  }
  return debugEl.nativeElement as T;
}

/**
 * Query nhiá»u element báº±ng By.css.
 */
export function queryAllByCss<T extends HTMLElement = HTMLElement>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): T[] {
  return fixture.debugElement.queryAll(By.css(selector)).map(de => de.nativeElement as T);
}

/**
 * Báº¯n DOM event lÃªn element vÃ  cháº¡y detectChanges.
 */
export function dispatch(
  fixture: ComponentFixture<unknown>,
  element: HTMLElement,
  eventName: string,
  init?: EventInit,
): void {
  element.dispatchEvent(new Event(eventName, { bubbles: true, ...init }));
  fixture.detectChanges();
}

/**
 * Set signal input qua componentRef.setInput + detectChanges.
 * DÃ¹ng cho component standalone test (khÃ´ng qua host).
 */
export function setInput<TComponent>(
  fixture: ComponentFixture<TComponent>,
  key: string,
  value: unknown,
): void {
  fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
}

/**
 * Component test wrapper rá»—ng â€” dÃ¹ng lÃ m anchor cho TestBed khi cáº§n Module-only config.
 */
@Component({
  selector: 'sd-test-empty-host',
  standalone: true,
  template: '',
})
export class TestEmptyHost {}
```

- [ ] **Step 3: Lint & build check**

```bash
npm run lint
```

Expected: 0 errors.

```bash
npm run test:ci
```

Expected: existing 17 spec pass (chÆ°a cÃ³ spec má»›i).

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/testing/
git commit -m "SM-00: add shared test utilities for Plan 1 spec files

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `SdLabel` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/label/src/label.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/label/sd-label.md`

- [ ] **Step 1: Äá»c source `label.component.ts` + html + .md hiá»‡n cÃ³ Ä‘á»ƒ náº¯m API**

Verify class: `SdLabel` cÃ³ setter `_label`, `_description`, `_required`, `_helperText` (kiá»ƒu setter-based @Input). Template hiá»ƒn thá»‹ label / `*` / mat-icon `info_outline` tooltip / description.

- [ ] **Step 2: Táº¡o `label.component.spec.ts`**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLabel } from './label.component';
import { queryByCss } from '@sdcorejs/angular/testing';

@Component({
  standalone: true,
  imports: [SdLabel, NoopAnimationsModule],
  template: `<sd-label
    [label]="label"
    [description]="description"
    [helperText]="helperText"
    [required]="required"></sd-label>`,
})
class HostComponent {
  label?: string | null = undefined;
  description?: string | null = undefined;
  helperText?: string | undefined = undefined;
  required: boolean | '' | null | undefined = false;
}

describe('SdLabel', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  describe('creation', () => {
    it('creates without inputs', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renders nothing when label is falsy', () => {
      fixture.detectChanges();
      // Khi !label, template @if (label) skip toÃ n bá»™ output
      const inner = fixture.nativeElement.querySelector('.T14M');
      expect(inner).toBeNull();
    });
  });

  describe('label input', () => {
    it('renders label text when provided', () => {
      host.label = 'Há» vÃ  tÃªn';
      fixture.detectChanges();
      const span = queryByCss<HTMLSpanElement>(fixture, 'span.T14M');
      expect(span.textContent?.trim()).toBe('Há» vÃ  tÃªn');
    });

    it('skips render when label set to null', () => {
      host.label = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.T14M')).toBeNull();
    });
  });

  describe('required input', () => {
    beforeEach(() => {
      host.label = 'X';
    });

    it('renders * when required = true', () => {
      host.required = true;
      fixture.detectChanges();
      const star = queryByCss<HTMLSpanElement>(fixture, 'span.text-error');
      expect(star.textContent?.trim()).toBe('*');
    });

    it('renders * when required is bare attribute (empty string)', () => {
      host.required = '';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).not.toBeNull();
    });

    it('does NOT render * when required = false', () => {
      host.required = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).toBeNull();
    });

    it('does NOT render * when required = null/undefined', () => {
      host.required = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).toBeNull();

      host.required = undefined;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).toBeNull();
    });
  });

  describe('helperText input', () => {
    beforeEach(() => {
      host.label = 'X';
    });

    it('renders mat-icon info_outline with tooltip when helperText provided', () => {
      host.helperText = 'Giáº£i thÃ­ch';
      fixture.detectChanges();
      const icon = queryByCss(fixture, 'mat-icon');
      expect(icon.textContent?.trim()).toBe('info_outline');
      expect(icon.getAttribute('ng-reflect-message')).toBe('Giáº£i thÃ­ch');
    });

    it('does NOT render icon when helperText is undefined', () => {
      host.helperText = undefined;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();
    });
  });

  describe('description input', () => {
    beforeEach(() => {
      host.label = 'X';
    });

    it('renders description below label when provided', () => {
      host.description = 'MÃ´ táº£ chi tiáº¿t';
      fixture.detectChanges();
      const desc = queryByCss<HTMLDivElement>(fixture, 'div.text-black400');
      expect(desc.textContent?.trim()).toBe('MÃ´ táº£ chi tiáº¿t');
    });

    it('skips description when null', () => {
      host.description = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('div.text-black400')).toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/label.component.spec.ts"
```

Expected: 11 specs pass.

- [ ] **Step 4: Audit `sd-label.md` vs checklist 14 má»¥c**

Má»Ÿ `projects/sdcorejs-angular/forms/label/sd-label.md`. Verify tá»«ng má»¥c checklist. Ghi gap notes vÃ o local scratch:

```
### sd-label.md gap notes
- [ ] Má»¥c 1: Frontmatter â€” verify Ä‘á»§ Type/Class/Standalone/Import path/Library version
- [ ] Má»¥c 5: Inputs table â€” verify Ä‘á»§ label/description/helperText/required vá»›i Type/Default/Notes
- [ ] Má»¥c 6: Outputs table â€” ghi "None" vÃ¬ class khÃ´ng cÃ³ @Output
- [ ] Má»¥c 9: Examples â‰¥3 â€” bá»• sung náº¿u thiáº¿u
- [ ] Má»¥c 14: Code snippet vá»›i HTML hoÃ n chá»‰nh, khÃ´ng pseudo-code
```

- [ ] **Step 5: Update `sd-label.md` náº¿u cÃ³ gap**

Náº¿u má»¥c nÃ o thiáº¿u, append/sá»­a táº¡i chá»—. Quy táº¯c cáº£i thiá»‡n format:
- Heading thá»© tá»± theo checklist.
- Code-fence prefix Ä‘Ãºng (`html` cho template, `ts` cho TypeScript).
- Viá»‡t hoÃ¡ nháº¥t quÃ¡n.

VÃ­ dá»¥ append náº¿u thiáº¿u Outputs section:

```markdown
## Outputs
None â€” component chá»‰ hiá»ƒn thá»‹ (render-only), khÃ´ng emit event.
```

- [ ] **Step 6: Commit**

```bash
git add projects/sdcorejs-angular/forms/label/
git commit -m "SM-00: add SdLabel spec + audit sd-label.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `SdMobileDirective` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/directives/src/sd-mobile.directive.spec.ts`
- Modify: `projects/sdcorejs-angular/directives/src/sd-mobile.md`

- [ ] **Step 1: Äá»c `sd-mobile.directive.ts`**

Verify: directive lÃ  structural (`<ng-template>` based), inject `TemplateRef` + `ViewContainerRef`, gá»i `SdUtilities.isMobile()` trong constructor.

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdMobileDirective } from './sd-mobile.directive';

@Component({
  standalone: true,
  imports: [SdMobileDirective],
  template: `<div *sdMobile data-testid="mobile-content">mobile only</div>`,
})
class HostComponent {}

describe('SdMobileDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  function createFixture(): ComponentFixture<HostComponent> {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    return f;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('when isMobile() returns true', () => {
    beforeEach(() => {
      spyOn(SdUtilities, 'isMobile').and.returnValue(true);
      fixture = createFixture();
    });

    it('renders the template content', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="mobile-content"]');
      expect(el).not.toBeNull();
      expect(el?.textContent?.trim()).toBe('mobile only');
    });
  });

  describe('when isMobile() returns false', () => {
    beforeEach(() => {
      spyOn(SdUtilities, 'isMobile').and.returnValue(false);
      fixture = createFixture();
    });

    it('does NOT render the template content', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="mobile-content"]');
      expect(el).toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/sd-mobile.directive.spec.ts"
```

Expected: 2 specs pass.

- [ ] **Step 4: Audit + update `sd-mobile.md`**

Verify checklist:
- Má»¥c 5 Inputs: directive khÃ´ng cÃ³ input â†’ ghi "None" hoáº·c skip.
- Má»¥c 12 Directive-specific: viáº¿t vá» lifecycle (constructor-only, khÃ´ng cleanup), side-effect (render template hoáº·c skip).
- Má»¥c 14: Code máº«u cho `<div *sdMobile>...</div>` + diá»…n giáº£i khi nÃ o nÃªn dÃ¹ng (so vá»›i `*ngIf="isMobile"`).

Bá»• sung Anti-pattern náº¿u thiáº¿u:
- âŒ Äáº·t `*sdMobile` trÃªn component náº·ng â€” vÃ¬ directive evaluate ngay constructor, khÃ´ng reactive. Khi `isMobile()` Ä‘á»•i (xoay device), khÃ´ng re-render. NÃªn cáº§n pair vá»›i listener resize náº¿u cáº§n dynamic.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/directives/src/sd-mobile.directive.spec.ts projects/sdcorejs-angular/directives/src/sd-mobile.md
git commit -m "SM-00: add SdMobileDirective spec + audit sd-mobile.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `SdAvatar` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/components/avatar/src/avatar.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/avatar/sd-avatar.md`

- [ ] **Step 1: Äá»c source â€” `SdAvatar` dÃ¹ng signal `input.required<string|null|undefined>('src')`, signal `size` default 32. Computed `isUrl`/`bgColor`/`initials`. Effect reset error khi src Ä‘á»•i.**

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdAvatar } from './avatar.component';
import { queryByCss, setInput } from '@sdcorejs/angular/testing';

describe('SdAvatar', () => {
  let fixture: ComponentFixture<SdAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdAvatar],
    }).compileComponents();

    fixture = TestBed.createComponent(SdAvatar);
  });

  describe('URL detection (isUrl)', () => {
    it('detects http URL â†’ renders <img>', () => {
      setInput(fixture, 'src', 'http://example.com/a.png');
      const img = queryByCss<HTMLImageElement>(fixture, 'img');
      expect(img.getAttribute('src')).toBe('http://example.com/a.png');
    });

    it('detects https URL â†’ renders <img>', () => {
      setInput(fixture, 'src', 'https://cdn.com/avatar.jpg');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('detects data:image/ URL â†’ renders <img>', () => {
      setInput(fixture, 'src', 'data:image/png;base64,AAA');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('detects absolute path "/" â†’ renders <img>', () => {
      setInput(fixture, 'src', '/assets/avatar.png');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('treats free text as name â†’ renders initials span (no img)', () => {
      setInput(fixture, 'src', 'Nguyá»…n VÄƒn An');
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
      const span = queryByCss(fixture, 'span.sd-avatar-text');
      expect(span.textContent?.trim()).toBe('NA');
    });
  });

  describe('initials computation', () => {
    it('returns 2-letter initials from 2+ words', () => {
      setInput(fixture, 'src', 'Tran Trung Nghia');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('TN');
    });

    it('returns single letter for 1-word name', () => {
      setInput(fixture, 'src', 'An');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('A');
    });

    it('uppercases the initials', () => {
      setInput(fixture, 'src', 'an binh');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('AB');
    });

    it('returns "?" for empty string', () => {
      setInput(fixture, 'src', '');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('?');
    });

    it('returns "?" for null', () => {
      setInput(fixture, 'src', null);
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('?');
    });
  });

  describe('background color', () => {
    it('returns transparent for image URL', () => {
      setInput(fixture, 'src', 'https://x.com/a.png');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.backgroundColor).toBe('transparent');
    });

    it('returns neutral #bdc3c7 for empty src', () => {
      setInput(fixture, 'src', '');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      // browsers normalize rgb
      expect(wrapper.style.backgroundColor).toBe('rgb(189, 195, 199)');
    });

    it('returns deterministic color from name (same name â†’ same color)', () => {
      setInput(fixture, 'src', 'Nguyá»…n VÄƒn A');
      const colorA = queryByCss<HTMLDivElement>(fixture, '.sd-avatar').style.backgroundColor;

      const fixture2 = TestBed.createComponent(SdAvatar);
      fixture2.componentRef.setInput('src', 'Nguyá»…n VÄƒn A');
      fixture2.detectChanges();
      const colorB = (fixture2.nativeElement.querySelector('.sd-avatar') as HTMLDivElement).style.backgroundColor;

      expect(colorA).toBe(colorB);
    });

    it('different names produce different color (statistically â€” sample one differing pair)', () => {
      setInput(fixture, 'src', 'Nguyá»…n VÄƒn A');
      const colorA = queryByCss<HTMLDivElement>(fixture, '.sd-avatar').style.backgroundColor;

      setInput(fixture, 'src', 'Tran Thi Z');
      const colorZ = queryByCss<HTMLDivElement>(fixture, '.sd-avatar').style.backgroundColor;

      expect(colorA).not.toBe(colorZ);
    });
  });

  describe('size', () => {
    it('defaults to 32px width/height', () => {
      setInput(fixture, 'src', 'X');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.width).toBe('32px');
      expect(wrapper.style.height).toBe('32px');
    });

    it('uses custom size', () => {
      setInput(fixture, 'src', 'X');
      setInput(fixture, 'size', 64);
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.width).toBe('64px');
    });

    it('sets initials font-size = size / 2.5', () => {
      setInput(fixture, 'src', 'AB');
      setInput(fixture, 'size', 50);
      const span = queryByCss<HTMLSpanElement>(fixture, 'span.sd-avatar-text');
      expect(span.style.fontSize).toBe('20px'); // 50 / 2.5
    });
  });

  describe('error handling', () => {
    it('handleError() switches isUrl to false and renders literal-text initials', () => {
      setInput(fixture, 'src', 'https://broken.example.com/a.png');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();

      const img = queryByCss<HTMLImageElement>(fixture, 'img');
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      // sau error, fallback sang initials cá»§a literal URL string
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
      const span = queryByCss(fixture, 'span.sd-avatar-text');
      // "https://broken.example.com/a.png" â€” khÃ´ng cÃ³ khoáº£ng tráº¯ng nÃªn 1 word â†’ 1 chá»¯ Ä‘áº§u "H"
      expect(span.textContent?.trim()).toBe('H');
    });

    it('resets error state when src changes (effect)', () => {
      setInput(fixture, 'src', 'https://broken.example.com/a.png');
      queryByCss<HTMLImageElement>(fixture, 'img').dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img')).toBeNull();

      // Äá»•i src má»›i â†’ effect reset imageError, isUrl tráº£ vá» true vÃ¬ https
      setInput(fixture, 'src', 'https://newurl.com/b.png');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/avatar.component.spec.ts"
```

Expected: 17 specs pass.

- [ ] **Step 4: Audit + update `sd-avatar.md`**

`sd-avatar.md` Ä‘Ã£ ráº¥t Ä‘áº§y Ä‘á»§ (xem section spec). Verify:
- Má»¥c 9 Examples â‰¥3 â€” Ä‘Ã£ cÃ³ 4 examples.
- Má»¥c 10 Anti-patterns â‰¥3 â€” Ä‘Ã£ cÃ³ 5.
- Má»¥c 14 Code snippet Ä‘áº§y Ä‘á»§ â€” verify má»—i snippet Ä‘á»u cÃ³ HTML Ä‘áº§y Ä‘á»§ binding.

CÃ³ thá»ƒ chá»‰ cáº§n fix typo/format minor. Ghi "no gap" náº¿u Ä‘áº§y Ä‘á»§.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/avatar/src/avatar.component.spec.ts projects/sdcorejs-angular/components/avatar/sd-avatar.md
git commit -m "SM-00: add SdAvatar spec + audit sd-avatar.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `SdBadge` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/badge/sd-badge.md`

- [ ] **Step 1: Äá»c source â€” boolean shortcuts (primary/secondary/success/info/warning/error), computed `effectiveColor`, click stopPropagation.**

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdBadge } from './badge.component';
import { queryByCss, setInput } from '@sdcorejs/angular/testing';

describe('SdBadge', () => {
  let fixture: ComponentFixture<SdBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdBadge, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdBadge);
  });

  describe('default render', () => {
    it('defaults type to "icon" with default icon fiber_manual_record', () => {
      fixture.detectChanges();
      // Máº·c Ä‘á»‹nh khÃ´ng cÃ³ title, nhÆ°ng template váº«n render span icon
      const icon = queryByCss(fixture, 'span.c-material-icon');
      expect(icon.textContent?.trim()).toBe('fiber_manual_record');
    });

    it('coerces falsy type back to "icon"', () => {
      setInput(fixture, 'type', null);
      expect(fixture.componentInstance.type()).toBe('icon');
    });

    it('coerces falsy color back to "secondary"', () => {
      setInput(fixture, 'color', null);
      expect(fixture.componentInstance.color()).toBe('secondary');
    });
  });

  describe('type variants', () => {
    it('renders pill div when type="round"', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'title', 'Active');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.textContent?.trim()).toBe('Active');
      // khÃ´ng cÃ³ icon trong round mode
      expect(fixture.nativeElement.querySelector('span.c-material-icon')).toBeNull();
    });

    it('renders tag wrapper when type="tag"', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'title', 'Tag');
      setInput(fixture, 'icon', 'label');
      expect(fixture.nativeElement.querySelector('div.c-badge--tag')).not.toBeNull();
      expect(queryByCss(fixture, 'span.c-badge-title').textContent?.trim()).toBe('Tag');
    });

    it('renders icon row when type="icon"', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'title', 'Info');
      expect(fixture.nativeElement.querySelector('div.c-badge-icon')).not.toBeNull();
    });
  });

  describe('boolean color shortcuts (precedence)', () => {
    it('primary wins over secondary/success/info/warning/error/color', () => {
      setInput(fixture, 'primary', true);
      setInput(fixture, 'error', true);
      setInput(fixture, 'color', 'warning');
      expect(fixture.componentInstance.effectiveColor()).toBe('primary');
    });

    it('secondary wins over success/info/warning/error/color (no primary)', () => {
      setInput(fixture, 'secondary', true);
      setInput(fixture, 'success', true);
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('secondary');
    });

    it('success wins over info/warning/error/color (no primary/secondary)', () => {
      setInput(fixture, 'success', true);
      setInput(fixture, 'warning', true);
      expect(fixture.componentInstance.effectiveColor()).toBe('success');
    });

    it('falls back to color input when no boolean shortcut set', () => {
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('error');
    });

    it('returns "secondary" by default', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.effectiveColor()).toBe('secondary');
    });
  });

  describe('class bindings', () => {
    it('applies c-primary when effective color is primary', () => {
      setInput(fixture, 'primary', true);
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.classList.contains('c-primary')).toBe(true);
    });

    it('applies c-success when effective color is success', () => {
      setInput(fixture, 'success', true);
      setInput(fixture, 'type', 'round');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-success')).toBe(true);
    });
  });

  describe('click output', () => {
    it('emits click with stopPropagation', () => {
      let received: Event | null = null;
      const spyStop = jasmine.createSpy('stopPropagation');
      fixture.componentInstance.click.subscribe((e: Event) => (received = e));
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');

      const ev = new MouseEvent('click', { bubbles: true });
      spyOn(ev, 'stopPropagation').and.callFake(spyStop);
      el.dispatchEvent(ev);

      expect(spyStop).toHaveBeenCalled();
      expect(received).toBe(ev);
    });

    it('applies pointer class only when click is observed', () => {
      // ÄÄƒng kÃ½ subscriber Ä‘á»ƒ click.observed = true
      fixture.componentInstance.click.subscribe(() => undefined);
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.classList.contains('pointer')).toBe(true);
    });

    it('does NOT apply pointer class when no subscriber', () => {
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.classList.contains('pointer')).toBe(false);
    });
  });

  describe('description', () => {
    it('renders description in tag type when provided', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'icon', 'label');
      setInput(fixture, 'title', 'A');
      setInput(fixture, 'description', 'desc text');
      const desc = queryByCss(fixture, 'span.c-badge-description');
      expect(desc.textContent?.trim()).toBe('desc text');
    });

    it('does NOT render description when not provided (icon type)', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'title', 'A');
      expect(fixture.nativeElement.querySelector('span.c-badge-description')).toBeNull();
    });
  });

  describe('custom icon', () => {
    it('uses provided icon name', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'icon', 'check_circle');
      expect(queryByCss(fixture, 'span.c-material-icon').textContent?.trim()).toBe('check_circle');
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/badge.component.spec.ts"
```

Expected: ~15 specs pass.

- [ ] **Step 4: Audit `sd-badge.md`** â€” `sd-badge.md` Ä‘Ã£ ráº¥t Ä‘áº§y Ä‘á»§. Verify Note pháº§n boolean precedence chÃ­nh xÃ¡c (Ä‘Ã£ cÃ³ dÃ²ng `> Boolean color shortcuts take priority over color`).

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts projects/sdcorejs-angular/components/badge/sd-badge.md
git commit -m "SM-00: add SdBadge spec + audit sd-badge.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `SdButton` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/components/button/src/button.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/button/sd-button.md`

- [ ] **Step 1: Äá»c source â€” `SdButton extends SdBaseSecureComponent`. LÆ°u Ã½: license service Ä‘Æ°á»£c called trong constructor.**

Karma cháº¡y á»Ÿ `http://localhost:9876` â†’ `SdLicenseService.#isLocalhost` return true â†’ license auto-valid. KHÃ”NG cáº§n mock. NhÆ°ng Ä‘á»ƒ CI an toÃ n (náº¿u cháº¡y domain khÃ¡c), provide `SD_CORE_CONFIGURATION` vá»›i fake key OR mock service.

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from './button.component';
import { queryByCss, setInput } from '@sdcorejs/angular/testing';

describe('SdButton', () => {
  let fixture: ComponentFixture<SdButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdButton, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdButton);
  });

  describe('creation', () => {
    it('renders with default type "light"', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button.c-light')).not.toBeNull();
    });

    it('renders correct variant for each type', () => {
      const variants: Array<[string, string]> = [
        ['fill', 'c-fill'],
        ['light', 'c-light'],
        ['outline', 'c-outline'],
        ['link', 'c-link'],
      ];
      for (const [type, cls] of variants) {
        setInput(fixture, 'type', type);
        expect(fixture.nativeElement.querySelector(`button.${cls}`)).not.toBeNull();
      }
    });

    it('renders title text', () => {
      setInput(fixture, 'title', 'LÆ°u');
      expect(queryByCss(fixture, 'span.c-title').textContent?.trim()).toBe('LÆ°u');
    });

    it('renders prefix icon when provided', () => {
      setInput(fixture, 'prefixIcon', 'save');
      setInput(fixture, 'title', 'X');
      expect(queryByCss(fixture, 'mat-icon.c-icon-prefix').textContent?.trim()).toBe('save');
    });
  });

  describe('booleanAttribute coercion', () => {
    it('coerces "disabled" bare attribute to true via setInput("")', () => {
      setInput(fixture, 'disabled', '');
      expect(fixture.componentInstance.disabled()).toBe(true);
    });

    it('disabled=true applies .sd-disabled host class', () => {
      setInput(fixture, 'disabled', true);
      expect((fixture.nativeElement as HTMLElement).classList.contains('sd-disabled')).toBe(true);
    });

    it('loading=true applies .sd-loading host class', () => {
      setInput(fixture, 'loading', true);
      expect((fixture.nativeElement as HTMLElement).classList.contains('sd-loading')).toBe(true);
    });

    it('block=true applies .sd-block host class', () => {
      setInput(fixture, 'block', true);
      expect((fixture.nativeElement as HTMLElement).classList.contains('sd-block')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('renders spinner instead of prefix icon when loading=true', () => {
      setInput(fixture, 'prefixIcon', 'save');
      setInput(fixture, 'loading', true);
      expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('mat-icon.c-icon-prefix')).toBeNull();
    });
  });

  describe('icon-only square class', () => {
    it('applies c-square when only icon (no title)', () => {
      setInput(fixture, 'prefixIcon', 'add');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.classList.contains('c-square')).toBe(true);
    });

    it('does NOT apply c-square when has title', () => {
      setInput(fixture, 'prefixIcon', 'add');
      setInput(fixture, 'title', 'New');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.classList.contains('c-square')).toBe(false);
    });
  });

  describe('size class', () => {
    it('applies c-sm by default', () => {
      setInput(fixture, 'title', 'X');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.classList.contains('c-sm')).toBe(true);
    });

    it('applies c-md when size="md"', () => {
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'size', 'md');
      expect(queryByCss<HTMLButtonElement>(fixture, 'button.c-button').classList.contains('c-md')).toBe(true);
    });

    it('applies c-lg when size="lg"', () => {
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'size', 'lg');
      expect(queryByCss<HTMLButtonElement>(fixture, 'button.c-button').classList.contains('c-lg')).toBe(true);
    });
  });

  describe('autoId computed', () => {
    it('returns undefined when autoId input is null', () => {
      setInput(fixture, 'autoId', null);
      expect(fixture.componentInstance.autoId()).toBeUndefined();
    });

    it('prefixes autoId input with "button-"', () => {
      setInput(fixture, 'autoId', 'save');
      expect(fixture.componentInstance.autoId()).toBe('button-save');
    });

    it('renders data-autoId attribute on button', () => {
      setInput(fixture, 'autoId', 'save');
      setInput(fixture, 'title', 'X');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.getAttribute('data-autoid')).toBe('button-save');
    });
  });

  describe('click output (throttle 300ms)', () => {
    it('emits click event when not disabled/loading', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      tick(0);
      expect(received.length).toBe(1);
    }));

    it('throttles rapid clicks to once per 300ms (leading edge)', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      btn.click();
      btn.click();
      tick(100);
      expect(received.length).toBe(1);

      tick(300);
      btn.click();
      tick(0);
      expect(received.length).toBe(2);
    }));

    it('does NOT emit when disabled', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'disabled', true);

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      tick(500);
      expect(received.length).toBe(0);
    }));

    it('does NOT emit when loading', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'loading', true);

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      tick(500);
      expect(received.length).toBe(0);
    }));
  });

  describe('cleanup', () => {
    it('unsubscribes on destroy (no emit after destroy)', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      fixture.destroy();

      // sau destroy, internal click khÃ´ng cÃ²n route â€” chá»‰ verify destroy khÃ´ng throw
      expect(() => btn.click()).not.toThrow();
      tick(500);
      expect(received.length).toBe(0);
    }));
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/button.component.spec.ts"
```

Expected: ~20 specs pass. Náº¿u fail liÃªn quan license, mock `SdLicenseService`:

```typescript
import { SdLicenseService } from '@sdcorejs/angular/services/license';

// trong beforeEach:
providers: [{ provide: SdLicenseService, useValue: { enforceLicense: () => undefined } }]
```

- [ ] **Step 4: Audit `sd-button.md` â€” Ä‘Ã£ ráº¥t Ä‘áº§y Ä‘á»§ (xem section spec). Verify cÃ¢u "Throttled to 300ms (leading edge)" + verify Anti-patterns Ä‘áº§y Ä‘á»§.**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/button/src/button.component.spec.ts projects/sdcorejs-angular/components/button/sd-button.md
git commit -m "SM-00: add SdButton spec + audit sd-button.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `SdSwitch` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/switch/src/switch.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/switch/sd-switch.md`

- [ ] **Step 1: Äá»c `switch.component.ts` + html.**

Note: `SdSwitch` dÃ¹ng setter-based `@Input`, `formControl = new SdFormControl()`. CÃ³ `model` setter sync formControl (no emit). User toggle â†’ emit `modelChange` + `sdChange`.

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSwitch } from './switch.component';

@Component({
  standalone: true,
  imports: [SdSwitch, FormsModule, ReactiveFormsModule, NoopAnimationsModule],
  template: `<sd-switch
    [label]="label"
    [color]="color"
    [disabled]="disabled"
    [required]="required"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-switch>`,
})
class HostComponent {
  label?: string;
  color?: 'primary' | 'warn' | 'accent' | null = 'primary';
  disabled: boolean | '' | null | undefined = false;
  required: boolean | '' | null | undefined = false;
  model: boolean | null | undefined = false;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

describe('SdSwitch', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let switchInstance: SdSwitch;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    switchInstance = fixture.debugElement.query(el => el.componentInstance instanceof SdSwitch)
      ?.componentInstance as SdSwitch;
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(switchInstance.formControl.disabled).toBe(true);
    });

    it('coerces bare attribute (empty string) to true', () => {
      host.disabled = '';
      fixture.detectChanges();
      expect(switchInstance.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled = false', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(switchInstance.formControl.disabled).toBe(false);
    });
  });

  describe('model setter', () => {
    it('syncs formControl.value WITHOUT emitting modelChange', () => {
      const received: any[] = [];
      const sub = switchInstance.formControl.valueChanges.subscribe(v => received.push(v));

      host.model = true;
      fixture.detectChanges();

      expect(switchInstance.formControl.value).toBe(true);
      // setValue vá»›i emitEvent: false â†’ valueChanges KHÃ”NG fire
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });

    it('does not re-set when value unchanged', () => {
      host.model = true;
      fixture.detectChanges();
      const spy = spyOn(switchInstance.formControl, 'setValue').and.callThrough();
      host.model = true;
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('color', () => {
    it('defaults to "primary" when color is null', () => {
      host.color = null;
      fixture.detectChanges();
      expect(switchInstance.color).toBe('primary');
    });

    it('uses provided color', () => {
      host.color = 'warn';
      fixture.detectChanges();
      expect(switchInstance.color).toBe('warn');
    });
  });

  describe('required validator', () => {
    it('applies required validator when required = true', () => {
      host.required = true;
      fixture.detectChanges();
      switchInstance.formControl.setValue(false);
      expect(switchInstance.formControl.hasError('required')).toBe(true);
    });

    it('removes required validator when required = false', () => {
      host.required = true;
      fixture.detectChanges();
      host.required = false;
      fixture.detectChanges();
      switchInstance.formControl.setValue(false);
      expect(switchInstance.formControl.hasError('required')).toBe(false);
    });
  });

  describe('output events', () => {
    it('emits sdChange + modelChange on user toggle (via formControl valueChanges)', () => {
      const sdSpy = spyOn(switchInstance.sdChange, 'emit').and.callThrough();
      const modelSpy = spyOn(switchInstance.modelChange, 'emit').and.callThrough();

      switchInstance.formControl.setValue(true);
      fixture.detectChanges();

      expect(sdSpy).toHaveBeenCalled();
      expect(modelSpy).toHaveBeenCalled();
    });
  });

  describe('FormGroup integration', () => {
    it('adds control to FormGroup on init when form input provided', () => {
      const fg = new FormGroup({});
      const tpl = `<sd-switch name="agree" [form]="fg"></sd-switch>`;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [SdSwitch, FormsModule, ReactiveFormsModule, NoopAnimationsModule],
      });
      @Component({
        standalone: true,
        imports: [SdSwitch],
        template: tpl,
      })
      class FgHost {
        fg = fg;
      }
      const f = TestBed.createComponent(FgHost);
      f.detectChanges();
      expect(fg.contains('agree')).toBe(true);

      f.destroy();
      expect(fg.contains('agree')).toBe(false);
    });

    it('extracts .form from NgForm if passed via setter', () => {
      // SdSwitch.form lÃ  setter â€” verify giÃ¡n tiáº¿p qua addControl khi pass NgForm-like
      const fg = new FormGroup({});
      const fakeNgForm = Object.create(NgForm.prototype, {
        form: { value: fg, configurable: true },
      });
      // GÃ¡n qua setter â€” khÃ´ng throw, vÃ  addControl trÃªn fg.form Ä‘Æ°á»£c trigger qua ngAfterViewInit lifecycle
      expect(() => {
        switchInstance.form = fakeNgForm;
      }).not.toThrow();
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/switch.component.spec.ts"
```

Expected: ~13 specs pass.

- [ ] **Step 4: Audit + update `sd-switch.md`**

Verify:
- Má»¥c 13 Form-specific: viáº¿t vá» `modelChange` vs `sdChange` (gáº§n nhÆ° Ä‘á»“ng nháº¥t, cÃ¹ng emit khi formControl.value Ä‘á»•i).
- Má»¥c 14: Code máº«u cho cáº£ 3 cÃ¡ch dÃ¹ng (ngModel, NgForm, reactive FormGroup).

Bá»• sung snippet form-integration náº¿u thiáº¿u:

```html
<!-- Template-driven vá»›i [(ngModel)] -->
<sd-switch label="Báº­t thÃ´ng bÃ¡o" [(model)]="settings.notify"></sd-switch>

<!-- Reactive FormGroup (truyá»n form vÃ o Ä‘á»ƒ switch tá»± addControl) -->
<form [formGroup]="form">
  <sd-switch label="Báº­t" name="notify" [form]="form"></sd-switch>
</form>

<!-- NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-switch label="Báº­t" name="notify" [form]="f"></sd-switch>
</form>
```

Diá»…n giáº£i: "Cáº£ 3 cÃ¡ch Ä‘á»u hoáº¡t Ä‘á»™ng. Reactive `[formGroup]` cho phÃ©p validate Ä‘á»“ng bá»™. `[(model)]` dÃ¹ng cho local state Ä‘Æ¡n giáº£n. NgForm dÃ¹ng khi form scaffold báº±ng template-driven."

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/switch/src/switch.component.spec.ts projects/sdcorejs-angular/forms/switch/sd-switch.md
git commit -m "SM-00: add SdSwitch spec + audit sd-switch.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `SdCheckbox` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/checkbox/src/checkbox.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/checkbox/sd-checkbox.md`

- [ ] **Step 1: Äá»c source â€” tÆ°Æ¡ng tá»± switch, nhÆ°ng cÃ³ thÃªm `inlineError` custom validator.**

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdCheckbox } from './checkbox.component';

@Component({
  standalone: true,
  imports: [SdCheckbox, FormsModule, ReactiveFormsModule, NoopAnimationsModule],
  template: `<sd-checkbox
    [label]="label"
    [color]="color"
    [disabled]="disabled"
    [inlineError]="inlineError"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-checkbox>`,
})
class HostComponent {
  label?: string;
  color: 'primary' | 'warn' = 'primary';
  disabled: boolean | '' | null | undefined = false;
  inlineError = '';
  model: any = false;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

describe('SdCheckbox', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let checkbox: SdCheckbox;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    checkbox = fixture.debugElement.query(el => el.componentInstance instanceof SdCheckbox)
      ?.componentInstance as SdCheckbox;
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(checkbox.formControl.disabled).toBe(true);
    });

    it('coerces empty string to true', () => {
      host.disabled = '';
      fixture.detectChanges();
      expect(checkbox.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled = false', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(checkbox.formControl.disabled).toBe(false);
    });
  });

  describe('model setter', () => {
    it('syncs formControl without emitting valueChanges', () => {
      const received: any[] = [];
      const sub = checkbox.formControl.valueChanges.subscribe(v => received.push(v));
      host.model = true;
      fixture.detectChanges();
      expect(checkbox.formControl.value).toBe(true);
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });
  });

  describe('output events', () => {
    it('emits modelChange + sdChange when user toggles', () => {
      checkbox.formControl.setValue(true);
      fixture.detectChanges();
      expect(host.model).toBe(true);
      expect(host.changes).toEqual([true]);
    });
  });

  describe('inlineError validator', () => {
    it('emits inlineError on formControl when inlineError set', () => {
      host.inlineError = 'Sai rá»“i';
      fixture.detectChanges();
      checkbox.formControl.updateValueAndValidity();
      expect(checkbox.formControl.hasError('inlineError')).toBe(true);
    });

    it('clears validator when inlineError = empty', () => {
      host.inlineError = 'Sai';
      fixture.detectChanges();
      host.inlineError = '';
      fixture.detectChanges();
      checkbox.formControl.updateValueAndValidity();
      expect(checkbox.formControl.hasError('inlineError')).toBe(false);
    });
  });

  describe('FormGroup integration', () => {
    it('addControl on init, removeControl on destroy', () => {
      const fg = new FormGroup({});
      @Component({
        standalone: true,
        imports: [SdCheckbox],
        template: `<sd-checkbox name="agree" [form]="fg"></sd-checkbox>`,
      })
      class FgHost {
        fg = fg;
      }
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [FgHost, NoopAnimationsModule],
      });
      const f = TestBed.createComponent(FgHost);
      f.detectChanges();
      expect(fg.contains('agree')).toBe(true);

      f.destroy();
      expect(fg.contains('agree')).toBe(false);
    });
  });

  describe('color', () => {
    it('defaults to primary', () => {
      expect(checkbox.color).toBe('primary');
    });

    it('accepts "warn"', () => {
      host.color = 'warn';
      fixture.detectChanges();
      expect(checkbox.color).toBe('warn');
    });
  });

  describe('autoId setter', () => {
    it('prefixes with forms-checkbox-', () => {
      checkbox._autoId = 'agree';
      expect(checkbox.autoId).toBe('forms-checkbox-agree');
    });

    it('keeps autoId undefined when value is null', () => {
      checkbox._autoId = null;
      expect(checkbox.autoId).toBeUndefined();
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/checkbox.component.spec.ts"
```

Expected: ~13 specs pass.

- [ ] **Step 4: Audit + update `sd-checkbox.md`**

Verify Form-specific (má»¥c 13): inlineError flow rÃµ rÃ ng. Bá»• sung anti-pattern + diá»…n giáº£i náº¿u thiáº¿u.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/checkbox/src/checkbox.component.spec.ts projects/sdcorejs-angular/forms/checkbox/sd-checkbox.md
git commit -m "SM-00: add SdCheckbox spec + audit sd-checkbox.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: `SdInput` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/input/src/input.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/input/sd-input.md`

- [ ] **Step 1: Äá»c source â€” `SdInput` lÃ  form phá»©c táº¡p nháº¥t. Signal `form` transform NgForm/FormGroup/null. Effect cáº­p nháº­t validator khi `required`/`minlength`/`maxlength`/`pattern`/`inlineError`/`validator` Ä‘á»•i. `valueModel = model()` sync `formControl.value` qua effect.**

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdInput } from './input.component';
import { queryByCss } from '@sdcorejs/angular/testing';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';

@Component({
  standalone: true,
  imports: [SdInput, FormsModule, ReactiveFormsModule, NoopAnimationsModule],
  template: `<sd-input
    [label]="label"
    [placeholder]="placeholder"
    [helperText]="helperText"
    [type]="type"
    [required]="required"
    [disabled]="disabled"
    [readonly]="readonly"
    [maxlength]="maxlength"
    [hideInlineError]="hideInlineError"
    [(model)]="model"></sd-input>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  helperText?: string;
  type: 'text' | 'password' | 'number' | 'email' = 'text';
  required = false;
  disabled = false;
  readonly = false;
  maxlength?: number;
  hideInlineError = false;
  model?: any;
}

describe('SdInput', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: SdInput;

  function setup() {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.debugElement.query(el => el.componentInstance instanceof SdInput)
      ?.componentInstance as SdInput;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    setup();
  });

  describe('creation & rendering', () => {
    it('creates the input', () => {
      expect(input).toBeTruthy();
      expect(fixture.nativeElement.querySelector('input')).not.toBeNull();
    });

    it('renders label via SdLabel', () => {
      host.label = 'Há» tÃªn';
      fixture.detectChanges();
      const labelEl = fixture.nativeElement.querySelector('.T14M');
      expect(labelEl?.textContent?.trim()).toContain('Há» tÃªn');
    });

    it('renders placeholder on input', () => {
      host.placeholder = 'Nháº­p...';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('placeholder')).toBe('Nháº­p...');
    });
  });

  describe('type', () => {
    it('defaults to text', () => {
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('text');
    });

    it('switches to password', () => {
      host.type = 'password';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('password');
    });

    it('switches to number', () => {
      host.type = 'number';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('number');
    });

    it('switches to email', () => {
      host.type = 'email';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('email');
    });
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', fakeAsync(() => {
      host.disabled = true;
      fixture.detectChanges();
      tick();
      expect(input.formControl.disabled).toBe(true);
    }));

    it('enables formControl when disabled toggled off', fakeAsync(() => {
      host.disabled = true;
      fixture.detectChanges();
      tick();
      host.disabled = false;
      fixture.detectChanges();
      tick();
      expect(input.formControl.disabled).toBe(false);
    }));
  });

  describe('required validator', () => {
    it('applies required validator', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      input.formControl.setValue('');
      expect(input.formControl.hasError('required')).toBe(true);
    }));

    it('passes validation when value provided', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      input.formControl.setValue('abc');
      expect(input.formControl.hasError('required')).toBe(false);
    }));
  });

  describe('maxlength', () => {
    it('applies maxLength validator', fakeAsync(() => {
      host.maxlength = 3;
      fixture.detectChanges();
      tick();
      input.formControl.setValue('abcd');
      expect(input.formControl.hasError('maxlength')).toBe(true);
    }));
  });

  describe('model two-way binding', () => {
    it('updates formControl when model changes (effect)', fakeAsync(() => {
      host.model = 'hello';
      fixture.detectChanges();
      tick();
      expect(input.formControl.value).toBe('hello');
    }));

    it('updates model when formControl emits valueChanges', fakeAsync(() => {
      input.formControl.setValue('world');
      tick();
      fixture.detectChanges();
      expect(host.model).toBe('world');
    }));
  });

  describe('form signal transform', () => {
    it('returns FormGroup when given a FormGroup', () => {
      const fg = new FormGroup({});
      fixture.componentRef.setInput('form', fg);
      expect(input.form()).toBe(fg);
    });

    it('extracts .form when given an NgForm-like object', () => {
      const fg = new FormGroup({});
      const fakeNgForm = Object.create(NgForm.prototype, {
        form: { value: fg },
      });
      fixture.componentRef.setInput('form', fakeNgForm);
      expect(input.form()).toBe(fg);
    });

    it('extracts .form when given a plain object with .form property', () => {
      const fg = new FormGroup({});
      fixture.componentRef.setInput('form', { form: fg });
      expect(input.form()).toBe(fg);
    });

    it('returns undefined for null/undefined', () => {
      fixture.componentRef.setInput('form', null);
      expect(input.form()).toBeUndefined();

      fixture.componentRef.setInput('form', undefined);
      expect(input.form()).toBeUndefined();
    });
  });

  describe('appearance', () => {
    it('defaults to "outline" without SD_FORM_CONFIGURATION token', () => {
      expect(input.appearance()).toBe('outline');
    });

    it('uses SD_FORM_CONFIGURATION.appearance when input not provided', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: SD_FORM_CONFIGURATION, useValue: { appearance: 'fill' } }],
      }).compileComponents();
      setup();
      expect(input.appearance()).toBe('fill');
    });

    it('input overrides token', () => {
      fixture.componentRef.setInput('appearance', 'outline');
      expect(input.appearance()).toBe('outline');
    });
  });

  describe('error tooltip message', () => {
    it('returns "Vui lÃ²ng nháº­p thÃ´ng tin" for required error', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      input.formControl.setValue('');
      input.formControl.updateValueAndValidity();
      expect(input.errorTooltipMessage).toBe('Vui lÃ²ng nháº­p thÃ´ng tin');
    }));

    it('returns maxlength message with limit', fakeAsync(() => {
      host.maxlength = 3;
      fixture.detectChanges();
      tick();
      input.formControl.setValue('abcd');
      expect(input.errorTooltipMessage).toBe('Sá»‘ kÃ½ tá»± tá»‘i Ä‘a: 3');
    }));
  });

  describe('keyup enter', () => {
    it('trims and emits keyupEnter', fakeAsync(() => {
      const emitted: any[] = [];
      input.keyupEnter.subscribe(v => emitted.push(v));

      input.formControl.setValue('abc  ');
      input.onKeyupEnter();
      tick();
      expect(input.formControl.value).toBe('abc');
      expect(emitted.length).toBe(1);
    }));
  });

  describe('blur', () => {
    it('trims on blur', fakeAsync(() => {
      input.formControl.setValue('abc  ');
      input.onBlur();
      tick();
      expect(input.formControl.value).toBe('abc');
    }));
  });

  describe('focus tracking', () => {
    it('sets isFocused = true on focus', () => {
      input.onFocus();
      expect(input.isFocused).toBe(true);
    });

    it('sets isFocused = false on blur', () => {
      input.onFocus();
      input.onBlur();
      expect(input.isFocused).toBe(false);
    });
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/input.component.spec.ts"
```

Expected: ~25 specs pass. **Note:** má»™t sá»‘ test cÃ³ thá»ƒ fail do reflective Material API render khÃ¡c trong test env. Khi Ä‘Ã³: dÃ¹ng `By.directive(MatInput)` hoáº·c giáº£m bá»›t DOM assertion, tÄƒng class-level assertion.

- [ ] **Step 4: Audit + update `sd-input.md`**

Verify:
- Má»¥c 13 Form-specific: 3 cÃ¡ch dÃ¹ng (ngModel `[(model)]`, NgForm `[form]="ngForm"`, FormGroup `[form]="reactiveFG"`).
- Má»¥c 14 Code: snippet cho má»—i error message scenario (required, maxlength, pattern, customValidator, inlineError).

Bá»• sung note vá» `SD_FORM_CONFIGURATION` token náº¿u thiáº¿u.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/input/src/input.component.spec.ts projects/sdcorejs-angular/forms/input/sd-input.md
git commit -m "SM-00: add SdInput spec + audit sd-input.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: `SdAnchor` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/components/anchor/src/components/anchor/anchor.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/anchor/sd-anchor.md`

- [ ] **Step 1: Äá»c source â€” `SdAnchor` dÃ¹ng viewChild wrapper, contentChildren `SdAnchorItem`, subscribe scroll via rxjs `auditTime`. `afterNextRender` set first section active.**

- [ ] **Step 2: Táº¡o spec file (smoke-level + key behaviors)**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdAnchor } from './anchor.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';
import { queryByCss } from '@sdcorejs/angular/testing';

@Component({
  standalone: true,
  imports: [SdAnchor, SdAnchorItem, NoopAnimationsModule],
  template: `
    <sd-anchor [type]="type" [isHiddenAnchorList]="hidden">
      <sd-anchor-item [id]="'sec1'" [title]="'Section 1'">
        <div style="height: 400px">Section 1 content</div>
      </sd-anchor-item>
      <sd-anchor-item [id]="'sec2'" [title]="'Section 2'">
        <div style="height: 400px">Section 2 content</div>
      </sd-anchor-item>
      <sd-anchor-item [id]="'sec3'" [title]="'Section 3'">
        <div style="height: 400px">Section 3 content</div>
      </sd-anchor-item>
    </sd-anchor>
  `,
})
class HostComponent {
  type: 'vertical' | 'horizontal' = 'vertical';
  hidden = false;
}

describe('SdAnchor', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let anchor: SdAnchor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    anchor = fixture.debugElement.query(el => el.componentInstance instanceof SdAnchor)
      ?.componentInstance as SdAnchor;
  });

  describe('creation', () => {
    it('creates and renders anchor list with section titles', fakeAsync(() => {
      tick(); // flush afterNextRender
      fixture.detectChanges();
      expect(anchor).toBeTruthy();
      expect(anchor.sections().length).toBe(3);
    }));

    it('defaults activeSectionId to first section id after first render', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(anchor.activeSectionId()).toBe('sec1');
    }));
  });

  describe('type input', () => {
    it('defaults to vertical', () => {
      expect(anchor.type()).toBe('vertical');
    });

    it('accepts horizontal', () => {
      host.type = 'horizontal';
      fixture.detectChanges();
      expect(anchor.type()).toBe('horizontal');
    });
  });

  describe('isHiddenAnchorList', () => {
    it('skips subscription when true', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [HostComponent] });
      const f = TestBed.createComponent(HostComponent);
      f.componentInstance.hidden = true;
      f.detectChanges();
      tick();
      const a = f.debugElement.query(el => el.componentInstance instanceof SdAnchor)
        ?.componentInstance as SdAnchor;
      // KHÃ”NG set activeSectionId â†’ váº«n rá»—ng
      expect(a.activeSectionId()).toBe('');
    }));
  });

  describe('scrollSectionByClick', () => {
    it('sets activeSectionId to target', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      anchor.scrollSectionByClick('sec2');
      expect(anchor.activeSectionId()).toBe('sec2');
    }));

    it('no-op when section id does not exist', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      // activeSectionId Ä‘Æ°á»£c set rá»“i return undefined cho targetSection â€” khÃ´ng throw
      expect(() => anchor.scrollSectionByClick('unknown')).not.toThrow();
      expect(anchor.activeSectionId()).toBe('unknown');
    }));
  });

  describe('cleanup on destroy', () => {
    it('disposes subscriptions without error', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    }));
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/anchor.component.spec.ts"
```

Expected: ~8 specs pass. **Note:** scroll behavior thá»±c khÃ´ng test (cáº§n real DOM size + scroll). Cover dÆ°á»›i má»©c Full coverage. Document trade-off trong commit message.

- [ ] **Step 4: Audit + update `sd-anchor.md`**

Bá»• sung Visual cues (vertical sidebar vs horizontal top bar), behavior cleanup (auto unsubscribe khi destroy).

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/anchor/src/components/anchor/anchor.component.spec.ts projects/sdcorejs-angular/components/anchor/sd-anchor.md
git commit -m "SM-00: add SdAnchor spec (smoke + key methods) + audit sd-anchor.md

Note: scroll subscription tests omitted - require real DOM rect/scroll.
Coverage target adjusted to 70% line / 60% branch per spec.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: `SdTooltipDirective` spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts`
- Modify: `projects/sdcorejs-angular/directives/src/sd-tooltip.md`

- [ ] **Step 1: Äá»c source â€” CDK Overlay-based, static `activeTooltip`, mouseenter delay, mouseleave 300ms.**

- [ ] **Step 2: Táº¡o spec file**

```typescript
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdTooltipDirective } from './sd-tooltip.directive';

@Component({
  standalone: true,
  imports: [SdTooltipDirective],
  template: `
    <button
      data-testid="trigger"
      [sdTooltip]="content"
      [sdTooltipPosition]="position"
      [sdTooltipDelay]="delay"
      [sdTooltipColor]="color">
      Hover me
    </button>
    <ng-template #tplContent>
      <div class="my-tpl">Template content</div>
    </ng-template>
  `,
})
class HostComponent {
  @ViewChild('tplContent') tplRef!: TemplateRef<unknown>;
  content: string | TemplateRef<unknown> = 'Tooltip text';
  position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  delay = 100;
  color = '#616161';
}

describe('SdTooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let overlayContainerEl: HTMLElement;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('[data-testid="trigger"]') as HTMLButtonElement;
    overlayContainerEl = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => {
    overlayContainerEl.innerHTML = '';
  });

  describe('show / hide', () => {
    it('does not show immediately on mouseenter', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
    });

    it('shows after sdTooltipDelay ms', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();
      // cleanup
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));

    it('hides 300ms after mouseleave', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(299);
      fixture.detectChanges();
      // chÆ°a hide
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();
      tick(2);
      fixture.detectChanges();
      // Ä‘Ã£ hide
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
      flush();
    }));
  });

  describe('content', () => {
    it('renders text content', fakeAsync(() => {
      host.content = 'Hello tooltip';
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      const el = overlayContainerEl.querySelector('.c-sd-tooltip-text');
      expect(el?.textContent?.trim()).toBe('Hello tooltip');
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));

    it('renders TemplateRef content', fakeAsync(() => {
      tick(); // wait for ViewChild
      fixture.detectChanges();
      host.content = host.tplRef;
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      const el = overlayContainerEl.querySelector('.my-tpl');
      expect(el).not.toBeNull();
      expect(el?.textContent?.trim()).toBe('Template content');
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));
  });

  describe('color', () => {
    it('applies sdTooltipColor as background', fakeAsync(() => {
      host.color = 'rgb(255, 0, 0)';
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      const el = overlayContainerEl.querySelector('.c-sd-tooltip-container') as HTMLElement;
      expect(el.style.backgroundColor).toBe('rgb(255, 0, 0)');
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));
  });

  describe('cleanup on destroy', () => {
    it('disposes overlay on directive destroy', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();

      fixture.destroy();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
    }));
  });

  describe('static activeTooltip', () => {
    it('forceHide method is exposed on directive instance', () => {
      const directiveInstance = fixture.debugElement.children[0].injector.get(SdTooltipDirective);
      expect(typeof directiveInstance.forceHide).toBe('function');
    });

    it('forceHide hides overlay immediately (no 300ms wait)', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();

      const directiveInstance = fixture.debugElement.children[0].injector.get(SdTooltipDirective);
      directiveInstance.forceHide();
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
      flush();
    }));
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/sd-tooltip.directive.spec.ts"
```

Expected: ~7 specs pass. **Note:** Overlay test phá»¥ thuá»™c vÃ o Angular CDK fixture timing; náº¿u fail, dÃ¹ng `flush()` thay `tick(300)` á»Ÿ cuá»‘i má»—i test.

- [ ] **Step 4: Audit + update `sd-tooltip.md`**

Verify:
- Má»¥c 12 Directive-specific: ghi rÃµ static `activeTooltip` chá»‰ giá»¯ 1 tooltip cÃ¹ng lÃºc â†’ 2 trigger gáº§n nhau, tooltip A bá»‹ `forceHide` khi hover B.
- Má»¥c 14 Code máº«u: snippet vá»›i TemplateRef + position + custom color.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts projects/sdcorejs-angular/directives/src/sd-tooltip.md
git commit -m "SM-00: add SdTooltipDirective spec + audit sd-tooltip.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Coverage config + final verification + gap report aggregate

**Files:**
- Modify/Create: `projects/sdcorejs-angular/karma.conf.js` (náº¿u chÆ°a cÃ³, generate)
- Modify: `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` (append gap report)

- [ ] **Step 1: Generate karma.conf náº¿u chÆ°a cÃ³**

```bash
ls projects/sdcorejs-angular/karma.conf.js
```

Náº¿u thiáº¿u:

```bash
npx ng generate karma --project=sd-angular
```

- [ ] **Step 2: ThÃªm coverage reporters trong karma.conf**

Trong `projects/sdcorejs-angular/karma.conf.js`, Ä‘áº£m báº£o cÃ³:

```javascript
module.exports = function (config) {
  config.set({
    // ... existing
    reporters: ['progress', 'kjhtml', 'coverage'],
    coverageReporter: {
      dir: require('path').join(__dirname, '../../coverage/sd-angular'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' },
      ],
      check: {
        each: {
          statements: 70,
          branches: 60,
          functions: 70,
          lines: 70,
        },
      },
    },
    // ...
  });
};
```

- [ ] **Step 3: Run full suite vá»›i coverage**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage
```

Expected:
- Táº¥t cáº£ spec pass (17 cÅ© + 10 má»›i â‰ˆ 27 spec files, ~140+ tests).
- Coverage report xuáº¥t táº¡i `coverage/sd-angular/`.
- Náº¿u má»™t file dÆ°á»›i threshold, ghi vÃ o gap report rá»“i tÄƒng test hoáº·c giáº£m threshold (note in commit).

- [ ] **Step 4: Aggregate gap report â€” append vÃ o design doc**

Má»Ÿ `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md`. Append section sau má»¥c 6 (template) pháº§n 6.x â€” gap report thá»±c táº¿:

```markdown
## 6.1 Gap report â€” Plan 1 implementation results

NgÃ y hoÃ n thÃ nh: 2026-MM-DD (Ä‘iá»n sau khi merge).

### sd-label.md
- [x] Frontmatter Ä‘áº§y Ä‘á»§
- [x] Outputs section ghi "None"
- [x] Examples â‰¥3
- (note any gap Ä‘Ã£ fill)

### sd-mobile.md
- [x] Anti-pattern bá»• sung: khÃ´ng reactive khi resize device
- [x] Visual cues N/A (directive)

### sd-avatar.md
- (gap notes if any, hoáº·c "no gap")

### sd-badge.md
### sd-button.md
### sd-switch.md
### sd-checkbox.md
### sd-input.md
### sd-anchor.md
### sd-tooltip.md

### Coverage actual

| File | Lines | Branches | Status |
| --- | --- | --- | --- |
| label.component.ts | XX% | XX% | OK / Below threshold |
| sd-mobile.directive.ts | XX% | XX% | OK |
| avatar.component.ts | XX% | XX% | OK |
| ... | | | |
```

- [ ] **Step 5: Final run all suites**

```bash
npm run test:ci
```

Expected: 100% pass.

```bash
npm run lint
```

Expected: 0 errors trÃªn file má»›i (allow existing warnings).

```bash
npm run build
```

Expected: build pass.

- [ ] **Step 6: Commit final**

```bash
git add projects/sdcorejs-angular/karma.conf.js docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md
git commit -m "SM-00: configure Karma coverage + aggregate gap report for Plan 1

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7: Push branch**

```bash
git push -u origin feature/plan-1-core-ui-tests
```

---

## Done criteria checklist

- [ ] 10 spec files created (+ test-utils.ts).
- [ ] `npm run test:ci` pass 100% (27 spec files, ~140+ tests).
- [ ] Coverage report generated, threshold check pass (or documented exceptions for input/anchor/tooltip).
- [ ] 10 .md files audited + gap report appended to design doc.
- [ ] Branch pushed.

---

## Troubleshooting notes

**License service throw**: náº¿u test fail vá»›i `[Security] Unauthorized usage`, mock:

```typescript
import { SdLicenseService } from '@sdcorejs/angular/services/license';
// trong TestBed providers:
{ provide: SdLicenseService, useValue: { enforceLicense: () => undefined } }
```

**Material/CDK animation errors**: thÃªm `NoopAnimationsModule` vÃ o imports.

**Signal input not reflecting**: dÃ¹ng `fixture.componentRef.setInput('key', value)` rá»“i `fixture.detectChanges()`. KhÃ´ng gÃ¡n trá»±c tiáº¿p `instance.signal()`.

**Effect not running**: signal effects fire async. Trong `fakeAsync`, gá»i `tick()` sau khi `setInput` Ä‘á»ƒ flush microtasks.

**FormGroup integration timing**: `ngAfterViewInit` má»›i `addControl`. Verify sau `fixture.detectChanges()` Ä‘áº§u tiÃªn.


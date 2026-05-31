�# sd-operator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `sd-operator` component (collapsed icon + tooltip, `matMenu` of icon/label/code rows, two-way `[(model)]` of `Operator`) and adopt it in `column-filter` and `query-bar`, removing the duplicated operator-icon logic.

**Architecture:** New standalone OnPush component at its own secondary entry point `@sdcorejs/angular/components/operator`. It maps an allowed `Operator[]` to `OPERATORS` entries for icon (SVG via `DomSanitizer`) + i18n label. Consumers pass the allowed list and bind the current operator two-way.

**Tech Stack:** Angular 19 (standalone, signals: `model`/`input`/`computed`), Angular Material `MatMenuModule` + `MatTooltipModule`, `@sdcorejs/utils` `OPERATORS`/`Operator`, `@sdcorejs/angular/i18n`, Karma/Jasmine.

---

## Conventions

**Targeted test command** (used throughout � adjust `--include` per task):

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec-path>'
```

**Lib typecheck build:**

```bash
npm run build
```

## File Structure

- Create: `projects/sdcorejs-angular/components/operator/ng-package.json` � entry-point manifest.
- Create: `projects/sdcorejs-angular/components/operator/index.ts` � public export.
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.ts` � component logic.
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.html` � template.
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.scss` � styles.
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts` � tests.
- Create: `projects/sdcorejs-angular/components/operator/sd-operator.md` � usage doc.
- Modify: `projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.ts` / `.html` / `.scss` / `.spec.ts`.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` / `.html` / `.spec.ts`.

---

## Task 1: Scaffold entry point + component shell (creates)

**Files:**
- Create: `projects/sdcorejs-angular/components/operator/ng-package.json`
- Create: `projects/sdcorejs-angular/components/operator/index.ts`
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.ts`
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.html`
- Create: `projects/sdcorejs-angular/components/operator/src/operator.component.scss`
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test**

`projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`:

```ts
import { SecurityContext } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OPERATORS } from '@sdcorejs/utils/constants';

import { SdOperator } from './operator.component';

/** Unwrap a SafeHtml produced via bypassSecurityTrustHtml back to its raw string. */
function html(sanitizer: DomSanitizer, safe: unknown): string {
  return sanitizer.sanitize(SecurityContext.HTML, safe as any) ?? '';
}

describe('SdOperator', () => {
  let fixture: ComponentFixture<SdOperator>;
  let component: SdOperator;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdOperator, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdOperator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: FAIL � cannot find module `./operator.component` / `SdOperator` not exported.

- [ ] **Step 3: Write the entry-point files + minimal component**

`projects/sdcorejs-angular/components/operator/ng-package.json`:

```json
{
  "$schema": "../../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "index.ts"
  }
}
```

`projects/sdcorejs-angular/components/operator/index.ts`:

```ts
export * from './src/operator.component';
```

`projects/sdcorejs-angular/components/operator/src/operator.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, model } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OPERATORS } from '@sdcorejs/utils/constants';
import { Operator } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';

interface OperatorItem {
  value: Operator;
  icon: SafeHtml;
  display: string;
}

@Component({
  selector: 'sd-operator',
  templateUrl: './operator.component.html',
  styleUrls: ['./operator.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatTooltipModule],
})
export class SdOperator {
  // Inner SVG markup (hình ph�&u) dùng khi chưa chọn operator.
  static readonly FALLBACK_ICON = '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5z"/>';

  readonly #i18n = inject(I18nService);
  readonly #sanitizer = inject(DomSanitizer);

  /** Operator hi�!n tại � binding hai chiều [(model)]. */
  model = model<Operator | undefined>();

  /** Danh sách operator cho phép, giữ nguyên thứ tự truyền vào. */
  operators = input<Operator[]>([]);

  /** Vô hi�!u hóa trigger (không m�x �ược menu). */
  disabled = input(false, { transform: booleanAttribute });

  /** data-autoId cho e2e selector. */
  autoId = input<string>();

  /** Allowed operators map sang { value, icon, display } theo thứ tự input. */
  readonly items = computed<OperatorItem[]>(() => {
    const out: OperatorItem[] = [];
    for (const value of this.operators()) {
      const entry = OPERATORS.find((o) => o.value === value);
      if (!entry) continue;
      out.push({ value, icon: this.#svg(entry.icon), display: this.#i18n.t(entry.display) });
    }
    return out;
  });

  /** Icon SVG �x trigger � fallback ph�&u khi model chưa set / không tìm thấy. */
  readonly currentIcon = computed<SafeHtml>(() => {
    const entry = OPERATORS.find((o) => o.value === this.model());
    return this.#svg(entry?.icon ?? SdOperator.FALLBACK_ICON);
  });

  /** Tooltip = i18n label của operator hi�!n tại ('' khi chưa chọn). */
  readonly currentLabel = computed<string>(() => {
    const entry = OPERATORS.find((o) => o.value === this.model());
    return entry ? this.#i18n.t(entry.display) : '';
  });

  // why: OPERATORS.icon là inner SVG (path/line/rect). Bọc <svg> + bypass sanitizer
  // (ngu�n là hằng s� n�"i b�", không phải input người dùng) �Ồ Angular không strip svg con.
  #svg(inner: string): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`,
    );
  }

  /** Chọn operator từ menu. */
  select(value: Operator): void {
    this.model.set(value);
  }
}
```

`projects/sdcorejs-angular/components/operator/src/operator.component.html`:

```html
@let _current = model();

<button
  type="button"
  class="c-op-trigger"
  [disabled]="disabled()"
  [matMenuTriggerFor]="menu"
  [matTooltip]="currentLabel()"
  matTooltipPosition="above"
  [attr.data-autoId]="autoId() ?? null">
  <span class="c-op-icon" [innerHTML]="currentIcon()"></span>
</button>

<mat-menu #menu="matMenu" class="c-op-menu">
  @for (item of items(); track item.value) {
    <button
      type="button"
      mat-menu-item
      class="c-op-row"
      [class.c-op-active]="item.value === _current"
      (click)="select(item.value)">
      <span class="c-op-icon" [innerHTML]="item.icon"></span>
      <span class="c-op-label">{{ item.display }}</span>
      <span class="c-op-code">{{ item.value }}</span>
    </button>
  }
</mat-menu>
```

`projects/sdcorejs-angular/components/operator/src/operator.component.scss`:

```scss
.c-op-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--sd-primary, #0f766e);
  cursor: pointer;
  border-radius: 4px;

  &:hover:not([disabled]) { background: rgba(0, 0, 0, 0.04); }
  &[disabled] { color: rgba(0, 0, 0, 0.26); cursor: default; }
}

.c-op-icon {
  display: inline-flex;
  align-items: center;

  svg { display: block; }
}

.c-op-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-op-label { flex: 1; }

.c-op-code {
  margin-left: 16px;
  color: var(--sd-text-muted, #7a7a7a);
  font-size: 11px;
  font-family: monospace;
}

.c-op-active { background: var(--sd-primary-light, rgba(15, 118, 110, 0.08)); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS � `creates the component`.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/operator
git commit -m "feat(operator): scaffold sd-operator entry point + shell"
```

---

## Task 2: `items()` maps allowed operators to icon + label

**Files:**
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append inside the `describe`)

```ts
  describe('items()', () => {
    it('maps each allowed operator to value + svg icon + i18n display, preserving order', () => {
      fixture.componentRef.setInput('operators', ['CONTAIN', 'EQUAL']);
      fixture.detectChanges();
      const sanitizer = TestBed.inject(DomSanitizer);

      const items = component.items();
      expect(items.map((i) => i.value)).toEqual(['CONTAIN', 'EQUAL']);

      const containEntry = OPERATORS.find((o) => o.value === 'CONTAIN')!;
      expect(html(sanitizer, items[0].icon)).toContain('<svg');
      expect(html(sanitizer, items[0].icon)).toContain(containEntry.icon.slice(0, 12));
      expect(items[0].display).toBeTruthy();
    });

    it('skips operators not present in OPERATORS', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'NOT_A_REAL_OP' as any]);
      fixture.detectChanges();
      expect(component.items().map((i) => i.value)).toEqual(['EQUAL']);
    });
  });
```

- [ ] **Step 2: Run test to verify it passes** (logic already implemented in Task 1)

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS.

> Note: `items()` was implemented in Task 1's component. These tests lock the contract. If they fail, fix the component before continuing.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts
git commit -m "test(operator): cover items() mapping + ordering"
```

---

## Task 3: `currentIcon` + `currentLabel` reflect model

**Files:**
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
  describe('currentIcon / currentLabel', () => {
    it('uses the selected operator icon + label', () => {
      fixture.componentRef.setInput('operators', ['EQUAL']);
      fixture.componentRef.setInput('model', 'EQUAL');
      fixture.detectChanges();
      const sanitizer = TestBed.inject(DomSanitizer);

      const equal = OPERATORS.find((o) => o.value === 'EQUAL')!;
      expect(html(sanitizer, component.currentIcon())).toContain(equal.icon.slice(0, 12));
      expect(component.currentLabel()).toBe(component.items()[0].display);
    });

    it('falls back to the funnel icon and empty label when model is undefined', () => {
      const sanitizer = TestBed.inject(DomSanitizer);
      expect(html(sanitizer, component.currentIcon())).toContain(SdOperator.FALLBACK_ICON.slice(0, 12));
      expect(component.currentLabel()).toBe('');
    });
  });
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts
git commit -m "test(operator): cover currentIcon/currentLabel + fallback"
```

---

## Task 4: `select()` updates model two-way

**Files:**
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
  describe('select()', () => {
    it('sets model and emits modelChange', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      const spy = jasmine.createSpy('modelChange');
      component.model.subscribe(spy);

      component.select('CONTAIN');

      expect(component.model()).toBe('CONTAIN');
      expect(spy).toHaveBeenCalledWith('CONTAIN');
    });
  });
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts
git commit -m "test(operator): cover select() two-way model"
```

---

## Task 5: Trigger DOM � icon rendered, tooltip bound, disabled honored

**Files:**
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
  describe('trigger DOM', () => {
    it('renders the current icon svg inside the trigger button', () => {
      fixture.componentRef.setInput('operators', ['EQUAL']);
      fixture.componentRef.setInput('model', 'EQUAL');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('.c-op-trigger .c-op-icon svg');
      expect(svg).not.toBeNull();
    });

    it('disables the trigger button when [disabled] is set', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.c-op-trigger') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts
git commit -m "test(operator): cover trigger icon render + disabled"
```

---

## Task 6: Menu rows render on open (count, code column, active highlight, click selects)

**Files:**
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append; add `OverlayContainer` cleanup)

Add this import at the top of the spec file:

```ts
import { OverlayContainer } from '@angular/cdk/overlay';
```

Append the describe:

```ts
  describe('menu (opened)', () => {
    let overlayContainer: OverlayContainer;

    function openMenu(): HTMLElement {
      const trigger = fixture.nativeElement.querySelector('.c-op-trigger') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      overlayContainer = TestBed.inject(OverlayContainer);
      return overlayContainer.getContainerElement();
    }

    afterEach(() => {
      overlayContainer?.getContainerElement().remove();
    });

    it('lists exactly the allowed operators in order, each with label + code', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'NOT_EQUAL', 'CONTAIN']);
      fixture.detectChanges();

      const panel = openMenu();
      const rows = panel.querySelectorAll('.c-op-row');
      expect(rows.length).toBe(3);

      const codes = Array.from(panel.querySelectorAll('.c-op-code')).map((n) => n.textContent?.trim());
      expect(codes).toEqual(['EQUAL', 'NOT_EQUAL', 'CONTAIN']);
    });

    it('marks the row matching model as active', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      fixture.componentRef.setInput('model', 'CONTAIN');
      fixture.detectChanges();

      const panel = openMenu();
      const active = panel.querySelectorAll('.c-op-row.c-op-active');
      expect(active.length).toBe(1);
      expect(active[0].querySelector('.c-op-code')?.textContent?.trim()).toBe('CONTAIN');
    });

    it('clicking a row sets the model', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      fixture.detectChanges();

      const panel = openMenu();
      const rows = panel.querySelectorAll('.c-op-row');
      (rows[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.model()).toBe('CONTAIN');
    });
  });
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS (template/markup from Task 1 already supports this).

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts
git commit -m "test(operator): cover menu rows render/active/select"
```

---

## Task 7: Usage doc

**Files:**
- Create: `projects/sdcorejs-angular/components/operator/sd-operator.md`

- [ ] **Step 1: Write the doc**

`projects/sdcorejs-angular/components/operator/sd-operator.md`:

```markdown
# sd-operator

Compact operator picker. Collapsed it shows only the current operator's icon with a tooltip;
clicking opens a `matMenu` listing the allowed operators (icon + label + raw code).

## API

| Input        | Type                     | Default | Notes                                              |
| ------------ | ------------------------ | ------- | -------------------------------------------------- |
| `[(model)]`  | `Operator \| undefined`  | �       | Two-way bound current operator.                    |
| `operators`  | `Operator[]`             | `[]`    | Allowed operators, in display order.               |
| `disabled`   | `boolean`                | `false` | Disables the trigger (menu cannot open).           |
| `autoId`     | `string`                 | �       | Emitted as `data-autoId` for e2e selectors.        |

Icons and labels are resolved from the canonical `OPERATORS` table in `@sdcorejs/utils`
(icon = inline SVG, label = i18n key via `I18nService`). Operators not found in `OPERATORS`
are skipped.

## Usage

```html
<sd-operator [(model)]="operator" [operators]="['EQUAL', 'CONTAIN', 'NULL']" />
```
```

- [ ] **Step 2: Commit**

```bash
git add projects/sdcorejs-angular/components/operator/sd-operator.md
git commit -m "docs(operator): add sd-operator usage doc"
```

---

## Task 8: Adopt sd-operator in column-filter

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.html`
- Modify: `projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.scss`
- Test: `projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts`

- [ ] **Step 1: Update the spec (failing) � replace the icon describes**

In `column-filter.component.spec.ts`:

1. Remove the top-of-file `html()` helper and the imports `SecurityContext`, `DomSanitizer`, `OPERATORS` added previously (no longer needed here). Keep `By`.
2. Delete the entire `describe('computed inlineIcon', ⬦)` and `describe('operatorIcon', ⬦)` blocks.
3. In `describe('onChangeOperator', ⬦)`, the `onChangeOperator` method is being removed, so delete that whole describe block too.
4. Add a new describe:

```ts
  describe('sd-operator integration', () => {
    it('renders <sd-operator> with the allowed operator values when operators exist', () => {
      bootstrap({
        field: 'name',
        type: 'string',
        filter: { operator: { enable: true, list: ['EQUAL', 'CONTAIN'] } },
      } as unknown as SdTableColumn);

      const opEl = fixture.nativeElement.querySelector('sd-operator');
      expect(opEl).not.toBeNull();
      expect(component.operatorValues()).toEqual(['EQUAL', 'CONTAIN']);
    });

    it('does NOT render <sd-operator> when no operators configured', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn);
      expect(fixture.nativeElement.querySelector('sd-operator')).toBeNull();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts'`
Expected: FAIL � `operatorValues` not a function / `sd-operator` not rendered.

- [ ] **Step 3: Update the component TS**

In `column-filter.component.ts`:

1. Remove imports no longer used: `inject`, `DomSanitizer`, `SafeHtml`. Add `SdOperator` import.

Replace:

```ts
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
```

with:

```ts
import { SdOperator } from '@sdcorejs/angular/components/operator';
```

And remove `inject` from the `@angular/core` import list (verify it is unused elsewhere first; it is only used by `#sanitizer`).

2. Add `SdOperator` to the component `imports` array (and remove `MatMenuModule` if the menu is gone � keep it only if still referenced; after this task it is not, so remove it).

3. Delete the block:

```ts
  // Inner SVG markup dùng khi operator chưa chọn � hình ph�&u (funnel) trung tính.
  static readonly FALLBACK_ICON =
    '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5z"/>';

  readonly #sanitizer = inject(DomSanitizer);

  // why: OPERATORS.icon là inner SVG (path/line/rect), không phải ligature. Bọc bằng
  // <svg> viewBox 0 0 24 24 + stroke=currentColor r�i bypass sanitizer (ngu�n là hằng
  // s� n�"i b�", không phải input người dùng) �Ồ Angular không strip thẻ svg con.
  #svg(inner: string): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`,
    );
  }
```

4. Delete `inlineIcon` and `operatorIcon`:

```ts
  // SVG icon của operator �ang chọn (fallback hình ph�&u khi chưa chọn).
  inlineIcon = computed<SafeHtml>(() => {
    const op = this.operator();
    const inner = OPERATORS.find(e => e.value === op)?.icon ?? ColumnFilterComponent.FALLBACK_ICON;
    return this.#svg(inner);
  });

  // SVG icon cho m�"t operator bất kỳ trong menu.
  operatorIcon(op: { icon: string }): SafeHtml {
    return this.#svg(op.icon);
  }
```

5. Add a computed exposing the allowed operator values (place right after the existing `operators` computed):

```ts
  // Ch�0 các Operator value cho phép � truyền vào <sd-operator [operators]>.
  operatorValues = computed(() => this.operators().map(o => o.value));
```

6. Delete the handler:

```ts
  onChangeOperator = (operator: { value: Operator; icon: string; display: string } | undefined) => {
    this.operator.set(operator?.value);
  };
```

- [ ] **Step 4: Update the template**

In `column-filter.component.html`:

1. Replace the `@let _inlineIcon = inlineIcon();` line � delete it.
2. Replace the whole operator block:

```html
      <div class="d-flex align-items-center">
        <button
          type="button"
          class="c-op-trigger {{ _column.type === 'number' ? 'mb-4 mr-2 ' : 'mr-2 ' }}"
          [matMenuTriggerFor]="menu">
          <span class="c-op-icon" [innerHTML]="_inlineIcon"></span>
        </button>
        <mat-menu #menu="matMenu">
          @for (operator of _operators; track operator.value) {
            <button (click)="onChangeOperator(operator)" mat-menu-item type="button">
              <span class="c-op-icon" [innerHTML]="operatorIcon(operator)"></span>
              <span class="c-op-label"> {{ operator.display }}</span>
            </button>
          }
        </mat-menu>
      </div>
```

with:

```html
      <div class="d-flex align-items-center {{ _column.type === 'number' ? 'mb-4 mr-2 ' : 'mr-2 ' }}">
        <sd-operator [(model)]="operator" [operators]="operatorValues()" />
      </div>
```

> Note: `_operators` (the `operators()` computed) may now be unused in the template. Leave the
> `@let _operators = operators();` line only if still referenced elsewhere; otherwise delete it.
> Verify by searching the template for `_operators` after the edit.

- [ ] **Step 5: Update the scss**

In `column-filter.component.scss`, delete the `.c-op-trigger`, `.c-op-icon`, `.c-op-label` blocks added previously (now owned by `sd-operator`). Keep the original `:host ::ng-deep .c-inline-column` block.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/components/filter/column-filter
git commit -m "refactor(column-filter): use sd-operator for operator picker"
```

---

## Task 9: Adopt sd-operator in query-bar

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Update the spec (failing) � replace the icon describe**

In `query-bar.component.spec.ts`:

1. Remove the `describe('operator icons (OPERATORS.icon)', ⬦)` block added previously.
2. Remove now-unused imports `SecurityContext`, `DomSanitizer`, and the `html()` helper. Keep `OPERATORS` and `SdQueryField` (used below).
3. Add:

```ts
  describe('sd-operator integration (inline mode)', () => {
    it('renders <sd-operator> for a field that exposes operators', () => {
      const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      fixture.componentRef.setInput('mode', 'inline');
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: '' } as any]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('sd-operator')).not.toBeNull();
    });

    it('exposes the allowed operators for a field as Operator[]', () => {
      const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;
      expect(component.allowedOperatorsFor(field).length).toBeGreaterThan(0);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � no `<sd-operator>` rendered (still `<sd-select>`).

- [ ] **Step 3: Update the component TS**

In `query-bar.component.ts`:

1. Remove the import `import { DomSanitizer, SafeHtml } from '@angular/platform-browser';`.
2. Remove the import `import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';`.
3. Add `import { SdOperator } from '@sdcorejs/angular/components/operator';`.
4. In the `imports` array, remove `SdItemDefDefDirective`, add `SdOperator`. Keep `SdSelect` (still used by value editors).
5. Delete the sanitizer + icon helpers:

```ts
  readonly #sanitizer = inject(DomSanitizer);

  // why: OPERATORS.icon là inner SVG (path/line/rect), không phải ligature. Bọc bằng
  // <svg> + bypass sanitizer (ngu�n là hằng s� n�"i b�", không phải input người dùng).
  #svg(inner: string): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`,
    );
  }

  /** SVG icon cho m�"t operator option (�ã kèm sẵn `icon` trong items). */
  operatorIcon(op: { icon: string }): SafeHtml {
    return this.#svg(op.icon);
  }
```

6. Revert `editingOperatorItems` to drop the `icon` field:

```ts
  readonly editingOperatorItems = computed(() => {
    const allowed = new Set<Operator>(this.editingAllowedOperators());
    return OPERATORS
      .filter((op) => allowed.has(op.value))
      .map((op) => ({ value: op.value, display: this.#i18n.t(op.display) }));
  });
```

7. Revert `#operatorItemsByKey` + `operatorItemsFor` to drop `icon`:

```ts
  readonly #operatorItemsByKey = computed<Record<string, { value: Operator; display: string }[]>>(() => {
    const map: Record<string, { value: Operator; display: string }[]> = {};
    for (const field of this.fields()) {
      const allowed = new Set<Operator>(sdQueryAllowedOperators(field));
      map[field.key as string] = OPERATORS.filter((op) => allowed.has(op.value)).map((op) => ({
        value: op.value,
        display: this.#i18n.t(op.display),
      }));
    }
    return map;
  });
```

```ts
  operatorItemsFor(field: SdQueryField): { value: Operator; display: string }[] {
    return this.#operatorItemsByKey()[field.key as string] ?? EMPTY_ARRAY;
  }
```

> `editingOperatorItems` / `operatorItemsFor` stay (they may still feed nothing after the
> template switch). After Step 4, search the template + TS for remaining references; if none,
> delete `editingOperatorItems`, `#operatorItemsByKey`, and `operatorItemsFor` in a follow-up
> step within this task and re-run the spec.

- [ ] **Step 4: Update the template � replace both operator selects**

In `query-bar.component.html`:

Popover edit mode (the `<sd-select>` fed by `editingOperatorItems()`), replace:

```html
              <sd-select size="sm"
                [autoId]="chipAutoId('operator')"
                [items]="editingOperatorItems()"
                valueField="value"
                displayField="display"
                [model]="_editOp"
                (sdChange)="onEditingOperatorChange($any($event))">
                <ng-template sdItemDef let-item="item">
                  <span class="c-op-opt">
                    <span class="c-op-icon" [innerHTML]="operatorIcon(item)"></span>
                    <span>{{ item.display }}</span>
                  </span>
                </ng-template>
              </sd-select>
```

with:

```html
              <sd-operator
                [autoId]="chipAutoId('operator')"
                [operators]="editingAllowedOperators()"
                [model]="_editOp"
                (modelChange)="onEditingOperatorChange($any($event))" />
```

Inline mode (the `<sd-select>` fed by `operatorItemsFor(_field)`), replace:

```html
            <sd-select size="sm"
              class="c-inline-operator"
              [autoId]="inlineAutoId(i, 'operator')"
              [items]="operatorItemsFor(_field)"
              valueField="value"
              displayField="display"
              [model]="_op"
              (sdChange)="setFilterOperator(i, $any($event))">
              <ng-template sdItemDef let-item="item">
                <span class="c-op-opt">
                  <span class="c-op-icon" [innerHTML]="operatorIcon(item)"></span>
                  <span>{{ item.display }}</span>
                </span>
              </ng-template>
            </sd-select>
```

with:

```html
            <sd-operator
              class="c-inline-operator"
              [autoId]="inlineAutoId(i, 'operator')"
              [operators]="allowedOperatorsFor(_field)"
              [model]="_op"
              (modelChange)="setFilterOperator(i, $any($event))" />
```

- [ ] **Step 5: Remove dead operator-item code (if unused)**

Search for remaining references:

```bash
grep -rn "editingOperatorItems\|operatorItemsFor\|#operatorItemsByKey" projects/sdcorejs-angular/components/query-bar/src
```

If only their own definitions remain (no template/other usage), delete `editingOperatorItems`,
`#operatorItemsByKey`, and `operatorItemsFor` from `query-bar.component.ts`.

- [ ] **Step 6: Remove dead scss**

In `query-bar.component.scss`, delete the `.c-op-opt` and `.c-op-icon` blocks added previously
(operator icon styling now lives in `sd-operator`). Keep `.c-inline-operator { min-width: 96px; }`.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "refactor(query-bar): use sd-operator for operator picker"
```

---

## Task 10: Full lib build + combined test sweep

**Files:** none (verification only)

- [ ] **Step 1: Lib typecheck build**

Run: `npm run build`
Expected: `Built Angular Package` with no errors (operator, table, query-bar all compile).

- [ ] **Step 2: Combined targeted test run**

Run:

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'
```

Expected: TOTAL all SUCCESS.

- [ ] **Step 3: Commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "test(operator): green build + combined sweep for sd-operator adoption"
```

---

## Self-Review notes

- **Spec coverage:** entry point (Task 1), API model/operators/disabled/autoId (Tasks 1,4,5), icon+i18n mapping (Task 2), fallback (Task 3), menu rows + code column + active + select (Task 6), doc (Task 7), column-filter adoption + cleanup (Task 8), query-bar adoption + cleanup (Task 9), build+test verification (Task 10). All spec sections covered.
- **Type consistency:** `operators: Operator[]`, `model: Operator | undefined`, `select(value: Operator)`, `operatorValues()` �  `Operator[]`, `items(): OperatorItem[]` � consistent across tasks and consumers.
- **Consumer bindings:** column-filter uses `[(model)]` (two-way, signal model). query-bar uses `[model]` + `(modelChange)` (per-iteration `_editOp` / `_op` are not writable signals). Both valid.
```


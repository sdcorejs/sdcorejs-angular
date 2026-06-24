# SdSelectFooterActionDirective — `when()` Function Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở rộng `SdSelectFooterActionDirective.when` để nhận function (sync hoặc async), bổ sung `filteredItems`/`selectedItems` vào context, bỏ input `pattern`, và cập nhật demo.

**Architecture:** Thêm type `SdSelectFooterActionWhenFn` vào directive; mở rộng `SdSelectFooterActionContext`; thêm signal `#footerFnVisibility` + effect trong `SdSelect` để evaluate function khi `searchText`/`filteredItems`/`selectedItems` thay đổi; `shouldRenderFooterAction` đọc signal đó khi `when` là function; string-based `when` giữ nguyên logic cũ (không còn `pattern`).

**Tech Stack:** Angular 19 signals, TypeScript, Karma/Jasmine

## Global Constraints

- Angular 19, standalone, signals-first — `signal()`, `computed()`, `effect()`, `input()`
- OnPush everywhere — mọi update phải trigger `markForCheck()`
- TDD: viết test fail trước, sau đó implement
- Signal read ≥ 2 lần trong template → cache bằng `@let _x = x();`
- Không commit tự động — chờ user confirm sau mỗi task
- Test command: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts'`

---

## File Map

| File | Thay đổi |
|------|----------|
| `projects/sdcorejs-angular/forms/select/src/select-footer-action.directive.ts` | Bỏ `pattern`, thêm types, mở rộng context |
| `projects/sdcorejs-angular/forms/select/src/select.component.ts` | Cập nhật `footerActionContext`, thêm signal + effect, cập nhật `shouldRenderFooterAction` |
| `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts` | Thay `PatternFooterHost` test, thêm 4 test cho function `when` |
| `projects/demo/src/app/pages/sd-select/sd-select-demo.component.ts` | Thêm `emailWhen` / `emailWhenAsync`, xóa `emailPattern` khỏi template binding |
| `projects/demo/src/app/pages/sd-select/sd-select-demo.component.html` | Bỏ `[pattern]`, đổi `when="empty"` → `[when]="emailWhen"`, thêm section async demo |
| `projects/sdcorejs-angular/forms/select/sd-select.md` | Cập nhật tài liệu `sdSelectFooterAction` |

---

### Task 1: Cập nhật directive — bỏ `pattern`, thêm function types, mở rộng context

**Files:**
- Modify: `projects/sdcorejs-angular/forms/select/src/select-footer-action.directive.ts`

**Interfaces:**
- Produces: `SdSelectFooterActionWhenFn`, `SdSelectFooterActionWhen`, `SdSelectFooterActionContext` (updated) — consumed by Task 2 và Task 3

- [ ] **Step 1: Viết test fail — verify `pattern` input không còn tồn tại**

Thêm test vào cuối describe block `SdSelect (sdSelectFooterAction)` trong `select.component.spec.ts` (sau dòng 1201):

```typescript
it('SdSelectFooterActionDirective does not have a pattern input', () => {
  // why: đảm bảo breaking change được enforce — pattern đã bị xóa
  const dir = new SdSelectFooterActionDirective();
  expect((dir as any).pattern).toBeUndefined();
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts'
```

Expected: FAIL — `SdSelectFooterActionDirective does not have a pattern input` (hiện tại `dir.pattern` là một `InputSignal`, không phải `undefined`).

- [ ] **Step 3: Thay thế toàn bộ nội dung `select-footer-action.directive.ts`**

```typescript
import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface SdSelectFooterActionContext {
  searchText: string;
  filteredItems: unknown[];
  selectedItems: unknown[];
}

export type SdSelectFooterActionWhenFn = (ctx: SdSelectFooterActionContext) => boolean | Promise<boolean>;
export type SdSelectFooterActionWhen = 'always' | 'empty' | 'has-result' | SdSelectFooterActionWhenFn;

@Directive({
  selector: 'ng-template[sdSelectFooterAction]',
  standalone: true,
})
export class SdSelectFooterActionDirective {
  readonly templateRef = inject(TemplateRef<SdSelectFooterActionContext>);
  readonly when = input<SdSelectFooterActionWhen>('always');
}
```

- [ ] **Step 4: Chạy lại test — xác nhận test mới PASS, không có regression**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts'
```

Expected: Test mới PASS. Nhưng test cũ `pattern input gates empty footer action` sẽ FAIL vì `[pattern]` không còn là input hợp lệ — đây là expected: sẽ xử lý ở Task 3.

---

### Task 2: Viết các failing tests cho function `when`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts`

**Interfaces:**
- Consumes: `SdSelectFooterActionWhenFn`, `SdSelectFooterActionContext` từ Task 1

- [ ] **Step 1: Thêm import `SdSelectFooterActionContext` vào đầu spec file**

Tìm dòng:
```typescript
import { SdSelectFooterActionDirective } from './select-footer-action.directive';
```

Thay bằng:
```typescript
import { SdSelectFooterActionContext, SdSelectFooterActionDirective } from './select-footer-action.directive';
```

- [ ] **Step 2: Thêm 4 host components + 4 tests mới vào describe `SdSelect (sdSelectFooterAction)`**

Thêm vào trước dòng đóng `});` cuối cùng của describe block (sau test `pattern input gates...`), nhưng **TRƯỚC khi xóa** `PatternFooterHost` test (sẽ xóa ở Task 3):

```typescript
  // -----------------------------------------------------------------------
  // when() as function (sync + async)
  // -----------------------------------------------------------------------

  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction [when]="whenFn">
          <button type="button" class="footer-action fn-true">Fn True</button>
        </ng-template>
      </sd-select>
    `,
  })
  class FnTrueHost {
    items = FRUIT_ITEMS;
    readonly whenFn = (): boolean => true;
  }

  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction [when]="whenFn">
          <button type="button" class="footer-action fn-false">Fn False</button>
        </ng-template>
      </sd-select>
    `,
  })
  class FnFalseHost {
    items = FRUIT_ITEMS;
    readonly whenFn = (): boolean => false;
  }

  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction [when]="whenFn">
          <button type="button" class="footer-action fn-async">Fn Async</button>
        </ng-template>
      </sd-select>
    `,
  })
  class FnAsyncHost {
    items = FRUIT_ITEMS;
    readonly whenFn = async (): Promise<boolean> => true;
  }

  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction [when]="whenFn">
          <button type="button" class="footer-action fn-ctx">Ctx Check</button>
        </ng-template>
      </sd-select>
    `,
  })
  class FnContextHost {
    items = FRUIT_ITEMS;
    capturedCtx: SdSelectFooterActionContext | null = null;
    whenFn = (ctx: SdSelectFooterActionContext): boolean => {
      this.capturedCtx = ctx;
      return true;
    };
  }

  it('renders footer action when sync when() function returns true', fakeAsync(() => {
    const fixture = TestBed.createComponent(FnTrueHost);
    openFooterSelect(fixture);
    flushMicrotasks();
    fixture.detectChanges();
    expect(footerActions().some(el => el.classList.contains('fn-true'))).toBe(true);
  }));

  it('hides footer action when sync when() function returns false', fakeAsync(() => {
    const fixture = TestBed.createComponent(FnFalseHost);
    openFooterSelect(fixture);
    flushMicrotasks();
    fixture.detectChanges();
    expect(footerActions().some(el => el.classList.contains('fn-false'))).toBe(false);
  }));

  it('renders footer action when async when() function resolves to true', fakeAsync(() => {
    const fixture = TestBed.createComponent(FnAsyncHost);
    openFooterSelect(fixture);
    flushMicrotasks();
    fixture.detectChanges();
    expect(footerActions().some(el => el.classList.contains('fn-async'))).toBe(true);
  }));

  it('passes filteredItems and selectedItems in context to when() function', fakeAsync(() => {
    const fixture = TestBed.createComponent(FnContextHost);
    const host = fixture.componentInstance;
    openFooterSelect(fixture);
    flushMicrotasks();
    fixture.detectChanges();
    expect(host.capturedCtx).not.toBeNull();
    expect(Array.isArray(host.capturedCtx!.filteredItems)).toBe(true);
    expect(Array.isArray(host.capturedCtx!.selectedItems)).toBe(true);
  }));
```

Cũng thêm `flushMicrotasks` vào import ở đầu file spec:
```typescript
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
```

- [ ] **Step 3: Chạy test để xác nhận các test mới FAIL**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts'
```

Expected: 4 tests mới FAIL (function `when` chưa được xử lý trong component). Test `pattern...` vẫn FAIL từ Task 1.

---

### Task 3: Implement component — signal + effect + shouldRenderFooterAction

**Files:**
- Modify: `projects/sdcorejs-angular/forms/select/src/select.component.ts`
- Modify: `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts` (xóa PatternFooterHost test)

**Interfaces:**
- Consumes: `SdSelectFooterActionWhen`, `SdSelectFooterActionWhenFn`, `SdSelectFooterActionContext` từ Task 1

- [ ] **Step 1: Cập nhật import `SdSelectFooterActionWhenFn` trong `select.component.ts`**

Tìm dòng:
```typescript
import { SdSelectFooterActionDirective } from './select-footer-action.directive';
```

Thay bằng:
```typescript
import { SdSelectFooterActionDirective, SdSelectFooterActionWhenFn } from './select-footer-action.directive';
```

- [ ] **Step 2: Cập nhật `footerActionContext` computed để thêm `filteredItems` + `selectedItems`**

Tìm đoạn:
```typescript
readonly footerActionContext = computed(() => ({ searchText: this.searchText() }));
```

Thay bằng:
```typescript
readonly footerActionContext = computed(() => ({
  searchText: this.searchText(),
  filteredItems: this.filteredItems() as unknown[],
  selectedItems: this.selectedItems() as unknown[],
}));
```

- [ ] **Step 3: Thêm signal `#footerFnVisibility` vào class (sau `readonly footerActionContext`)**

```typescript
readonly #footerFnVisibility = signal<WeakMap<SdSelectFooterActionDirective, boolean>>(new WeakMap());
```

- [ ] **Step 4: Thêm effect xử lý async function `when` vào constructor (sau các effect hiện có)**

Trong `constructor()`, thêm effect sau các effect đã có:

```typescript
effect(() => {
  const actions = this.footerActions();
  const context = this.footerActionContext();

  const fnActions: Array<{ action: SdSelectFooterActionDirective; fn: SdSelectFooterActionWhenFn }> = [];
  for (const action of actions) {
    const when = action.when();
    if (typeof when === 'function') fnActions.push({ action, fn: when });
  }

  if (!fnActions.length) return;

  // why: Promise.all chạy ngoài reactive context — không tạo circular dependency
  Promise.all(
    fnActions.map(async ({ action, fn }) => ({
      action,
      result: await Promise.resolve(fn(context)),
    }))
  ).then(results => {
    const map = new WeakMap<SdSelectFooterActionDirective, boolean>();
    results.forEach(({ action, result }) => map.set(action, result));
    this.#footerFnVisibility.set(map);
    this.#ref.markForCheck();
  });
});
```

- [ ] **Step 5: Thay thế toàn bộ method `shouldRenderFooterAction` (bỏ pattern)**

Tìm method:
```typescript
shouldRenderFooterAction(action: SdSelectFooterActionDirective): boolean {
  const when = action.when();
  let visible = false;
  if (when === 'always') {
    visible = true;
  } else if (when === 'empty') {
    visible = this.searchText().length > 0 && this.filteredItems().every(item => this.itemValue(item) !== this.searchText().trim());
  } else if (when === 'has-result') {
    visible = this.filteredItems().length > 0;
  }

  if (!visible) return false;

  const pattern = action.pattern();
  if (!pattern) return true;

  const text = this.searchText().trim();
  if (!text) return false;

  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return regex.test(text);
}
```

Thay bằng:
```typescript
shouldRenderFooterAction(action: SdSelectFooterActionDirective): boolean {
  const when = action.when();

  if (typeof when === 'function') {
    return this.#footerFnVisibility().get(action) ?? false;
  }

  if (when === 'always') return true;
  if (when === 'empty') {
    return this.searchText().length > 0 && this.filteredItems().every(item => this.itemValue(item) !== this.searchText().trim());
  }
  if (when === 'has-result') return this.filteredItems().length > 0;
  return false;
}
```

- [ ] **Step 6: Xóa test `PatternFooterHost` và host component cũ, thay bằng test function**

Trong `select.component.spec.ts`, tìm và XÓA toàn bộ đoạn từ `@Component({ ... class PatternFooterHost` đến hết test `pattern input gates empty footer action...`:

```typescript
  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction when="empty" [pattern]="emailPattern" let-searchText="searchText">
          <button type="button" class="footer-action pattern-match">Add {{ searchText }}</button>
        </ng-template>
      </sd-select>
    `,
  })
  class PatternFooterHost {
    items = LARGE_ITEMS;
    readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  }

  it('pattern input gates empty footer action without re-rendering consumer template', fakeAsync(() => {
    const fixture = TestBed.createComponent(PatternFooterHost);
    const sd = openFooterSelect(fixture);

    sd.inputControl.setValue('invalid');
    tick(600);
    fixture.detectChanges();
    expect(footerActions().find(el => el.classList.contains('pattern-match'))).toBeUndefined();

    sd.inputControl.setValue('new.user@example.com');
    tick(600);
    fixture.detectChanges();
    expect(footerActions().find(el => el.classList.contains('pattern-match'))?.textContent).toContain('new.user@example.com');
  }));
```

Thêm vào vị trí đó host component mới thay thế — test function `when` kết hợp email:

```typescript
  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction [when]="emailWhen" let-searchText="searchText">
          <button type="button" class="footer-action email-fn">Add {{ searchText }}</button>
        </ng-template>
      </sd-select>
    `,
  })
  class FnEmailHost {
    items = LARGE_ITEMS;
    readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    readonly emailWhen = (ctx: SdSelectFooterActionContext): boolean =>
      ctx.searchText.trim().length > 0 &&
      this.emailPattern.test(ctx.searchText.trim()) &&
      (ctx.filteredItems as { id: number; name: string }[]).length === 0;
  }

  it('when() function replaces pattern — gates action by email format + no matching results', fakeAsync(() => {
    const fixture = TestBed.createComponent(FnEmailHost);
    const sd = openFooterSelect(fixture);

    sd.inputControl.setValue('invalid');
    tick(600);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    expect(footerActions().find(el => el.classList.contains('email-fn'))).toBeUndefined();

    sd.inputControl.setValue('new.user@example.com');
    tick(600);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    expect(footerActions().find(el => el.classList.contains('email-fn'))?.textContent).toContain('new.user@example.com');
  }));
```

- [ ] **Step 7: Chạy test để xác nhận tất cả PASS**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts'
```

Expected: Tất cả tests PASS (5 tests mới + không có regression).

---

### Task 4: Cập nhật demo

**Files:**
- Modify: `projects/demo/src/app/pages/sd-select/sd-select-demo.component.ts`
- Modify: `projects/demo/src/app/pages/sd-select/sd-select-demo.component.html`

**Interfaces:**
- Consumes: `SdSelectFooterActionContext` từ Task 1

- [ ] **Step 1: Cập nhật `sd-select-demo.component.ts` — thêm `emailWhen` + `emailWhenAsync`**

Tìm property `readonly emailPattern`:
```typescript
readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
```

Thêm ngay sau nó:

```typescript
/** Sync when() — thay thế cho when="empty" + [pattern]="emailPattern" cũ */
readonly emailWhen = (ctx: SdSelectFooterActionContext): boolean => {
  const text = ctx.searchText.trim();
  return text.length > 0 &&
    this.emailPattern.test(text) &&
    (ctx.filteredItems as EmailOption[]).every(item => item.value !== text.toLowerCase());
};

/** Async when() — demo hỗ trợ Promise */
readonly emailWhenAsync = async (ctx: SdSelectFooterActionContext): Promise<boolean> => {
  const text = ctx.searchText.trim();
  if (!this.emailPattern.test(text)) return false;
  // Simulate async check (e.g. server-side duplicate check)
  await new Promise<void>(r => setTimeout(r, 300));
  return (this.emailItems as EmailOption[]).every(item => item.value !== text.toLowerCase());
};
```

Thêm import `SdSelectFooterActionContext` vào đầu file:

```typescript
import { SdAutocomplete, SdSelect, SdSelectFooterActionDirective } from '@sdcorejs/angular/forms';
import { SdSelectFooterActionContext } from '@sdcorejs/angular/forms/select';
import { SdSearch } from '@sdcorejs/angular/forms/models';
```

- [ ] **Step 2: Cập nhật `sd-select-demo.component.html` — section 4 (single)**

Tìm đoạn footer action trong section single (dòng 204):
```html
        <ng-template sdSelectFooterAction when="empty" [pattern]="emailPattern" let-searchText="searchText">
```
Thay bằng:
```html
        <ng-template sdSelectFooterAction [when]="emailWhen" let-searchText="searchText">
```

- [ ] **Step 3: Cập nhật `sd-select-demo.component.html` — section 4 (multiple)**

Tìm đoạn footer action trong section multiple (dòng 233):
```html
        <ng-template sdSelectFooterAction when="empty" [pattern]="emailPattern" let-searchText="searchText">
```
Thay bằng:
```html
        <ng-template sdSelectFooterAction [when]="emailWhen" let-searchText="searchText">
```

- [ ] **Step 4: Thêm section 5 (async demo) vào cuối `sd-select-demo.component.html`**

Tìm đoạn `<hr style="margin-bottom: 40px" />` (trước `<!-- sd-autocomplete -->`):

```html
  <hr style="margin-bottom: 40px" />
```

Chèn TRƯỚC nó:

```html
  <h2>5. Async when() — sdSelectFooterAction với Promise</h2>
  <p style="color: #666; margin-bottom: 16px">
    Khi gõ email hợp lệ, footer action xuất hiện sau 300ms (mô phỏng kiểm tra server).
  </p>
  <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 60px">
    <div style="width: 360px">
      <sd-select
        #emailSelectAsync
        [items]="searchEmails"
        valueField="value"
        displayField="display"
        label="Email (async when)"
        placeholder="Gõ email để kiểm tra..."
        minWidthPanel="360px"
        [(model)]="creatableEmailAsync"
        [form]="formCreatableEmailAsync">
        <ng-template sdSelectFooterAction [when]="emailWhenAsync" let-searchText="searchText">
          <div style="padding: 8px 12px; border-top: 1px solid #e0e0e0">
            <button mat-stroked-button color="primary" type="button"
              (click)="addEmail(searchText); emailSelectAsync.clearSearch()">
              Thêm (async) "{{ searchText }}"
            </button>
          </div>
        </ng-template>
      </sd-select>
      <div style="font-size: 12px; color: #666; margin-top: 8px">
        Đang chọn: <b>{{ creatableEmailAsync || '(trống)' }}</b>
      </div>
    </div>
  </div>

```

- [ ] **Step 5: Thêm state cho async demo vào `sd-select-demo.component.ts`**

Thêm sau `formCreatableEmails = new FormGroup({});`:
```typescript
formCreatableEmailAsync = new FormGroup({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
creatableEmailAsync: any;
```

---

### Task 5: Cập nhật tài liệu `sd-select.md`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/select/sd-select.md`

- [ ] **Step 1: Tìm và cập nhật mô tả `sdSelectFooterAction`**

Tìm đoạn (khoảng dòng 89):
```markdown
- `<ng-template sdSelectFooterAction>` — sticky footer action below the option list (`SdSelectFooterActionDirective`). Inputs on the template: `when` (`'always' \| 'empty' \| 'has-result'`, default `'always'`), optional `pattern` (`RegExp \| string` — gates visibility after `when`; evaluated inside `visibleFooterActions` computed, **not** in the consumer template). Context: `let-searchText="searchText"`. Import `SdSelectFooterActionDirective` alongside `SdSelect` in standalone hosts. **Do not** call parent component methods inside the footer template to gate visibility — that re-runs on every `sd-select` change-detection tick (search debounce, loading, filtered items). Use `when` + `pattern` instead.
```

Thay bằng:
```markdown
- `<ng-template sdSelectFooterAction>` — sticky footer action below the option list (`SdSelectFooterActionDirective`). Input on the template: `when` (`'always' | 'empty' | 'has-result' | (ctx: SdSelectFooterActionContext) => boolean | Promise<boolean>`, default `'always'`). String values: `always` = always render; `empty` = searchText non-empty AND no item value exactly matches searchText; `has-result` = ≥1 filtered item visible. Function value: called with `{ searchText, filteredItems, selectedItems }` context on every change — supports both sync and async (the result is cached in a signal until the Promise resolves, initial value is `false`). Context: `let-searchText="searchText"` / `let-filteredItems="filteredItems"` / `let-selectedItems="selectedItems"`. Import `SdSelectFooterActionDirective` alongside `SdSelect` in standalone hosts. Use the function form instead of the old `pattern` input (which has been removed) to gate visibility by regexp or any custom logic. **Do not** call parent component methods inside the template *expression* to gate visibility — use `[when]="myFn"` instead.
```

- [ ] **Step 2: Tìm và xóa dòng anti-pattern về `data-pattern`**

Tìm dòng:
```markdown
> **Note**: `sd-select` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.
```

Thay bằng:
```markdown
> **Note**: `sd-select` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted. The `pattern` input on `SdSelectFooterActionDirective` has been removed — use a function `[when]` instead.
```

---

## Self-Review

**Spec coverage:**
- ✅ `pattern` bị xóa khỏi directive
- ✅ `when` nhận function (sync + async)
- ✅ `shouldRenderFooterAction` xử lý function type
- ✅ `SdSelectFooterActionContext` mở rộng với `filteredItems` + `selectedItems`
- ✅ Demo cập nhật (cả single + multiple), thêm async demo section
- ✅ Docs cập nhật

**Placeholder scan:** Không có TBD / TODO.

**Type consistency:**
- `SdSelectFooterActionWhenFn` định nghĩa ở Task 1, dùng trong Task 3 — nhất quán.
- `SdSelectFooterActionContext` định nghĩa ở Task 1, import trong Task 2 (spec) và Task 4 (demo) — nhất quán.
- `#footerFnVisibility` signal dùng `WeakMap<SdSelectFooterActionDirective, boolean>` — new instance mỗi lần `.set()` để trigger reactivity — nhất quán.

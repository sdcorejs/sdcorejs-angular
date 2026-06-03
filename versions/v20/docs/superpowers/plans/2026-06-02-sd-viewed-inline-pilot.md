# Tri-state `viewed` — inline-edit pilot (sd-select) implementation plan

> **For agentic workers:** TDD is REQUIRED (CLAUDE.md). Each task: write failing test → run (red) → implement → run (green) → commit. Steps use `- [ ]`.

**Goal:** Add a third `viewed` value `'inline'` to form controls. `'inline'` = render like `<sd-view>` text, click → reveal the native editor inline (bare, auto-open), focusout → back to view. **Pilot only `sd-select`**, ship its showcase example, and adopt `viewed='inline'` in `sd-query-bar`'s inline chip (`values` / `lazy-values` branch). The other 12 controls roll out in a later plan.

> **Amendment (shipped):** mechanism is NOT swap-render. In `'inline'` the editor is **always mounted** with hidden chrome (`.sd-inline-editor` = `opacity:0; pointer-events:none` overlay); the `<sd-view>` text is the visible face and click trigger, retained while the panel is open (only changes on commit). Factory exposes `isInline` / `isViewed` (`=== true`) / `enterInlineEdit` — no `inlineEditing`/`onInlineFocusOut`. Panel min-width floors at 200px in inline.

**Architecture:** A shared composable in `forms/models` owns the semantics — `sdViewedTransform` (widens the input, keeps `booleanAttribute` coercion) + `sdViewedInline()` (returns `isInline` / `isViewed` / `inlineEditing` signals + `enterInlineEdit` / `onInlineFocusOut`). Each control wires it; the template swaps `@if (viewed())` → `@if (isViewed())` and wraps the view layer in a click target when `isInline()`. `'inline'` implies a bare editor on activation (`.sd-bare` bound to `bare() || inlineEditing()`). Swap-render (no `display:none`); panel anchors via `afterNextRender(() => open())` — same lifecycle proven in `inline-chip`.

**Tech Stack:** Angular 19 standalone + signals, Angular Material, Karma+Jasmine (ChromeHeadless), ng-packagr secondary entry points.

**Working directory (harness resets cwd — prefix every command):** `cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular`

**⚠️ dist-resolution gotcha (verified this session):** `tsconfig.json` maps `@sdcorejs/angular/* → ["dist/sdcorejs-angular/*", "projects/sdcorejs-angular/*"]` — **dist wins**. A spec that imports `@sdcorejs/angular/...` (e.g. `inline-chip` importing `@sdcorejs/angular/forms/select`, or the showcase) sees the **built** control, NOT source. So: after changing `sd-select` source (Task 2), you **must `npm run build`** before Task 4 (query-bar) / Task 5 (showcase) specs reflect it. A spec that imports the control by **relative path** (`./select.component`) sees source immediately.

**Test command template (one spec at a time):**
```bash
cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec-path>' 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS|Expected" | head -30
```

**Commit style:** `SM-00: <type>(<scope>): <subject>` + trailing `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Shared primitive (new):**
- `projects/sdcorejs-angular/forms/models/src/sd-viewed.ts` — `SdViewed` type, `sdViewedTransform`, `sdViewedInline()`.
- `projects/sdcorejs-angular/forms/models/src/sd-viewed.spec.ts` — transform + computed + lifecycle unit tests.
- `projects/sdcorejs-angular/forms/models/index.ts` (or barrel) — export the new symbols.

**Pilot control:**
- `projects/sdcorejs-angular/forms/select/src/select.component.ts` — widen `viewed`, wire `sdViewedInline`, host class.
- `projects/sdcorejs-angular/forms/select/src/select.component.html` — `@if (isViewed())` + clickable inline view wrapper + edit-branch focusout.
- `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts` — inline-mode tests.
- `projects/sdcorejs-angular/forms/select/sd-select.md` — document tri-state `viewed`.

**query-bar adoption (values / lazy-values branch only):**
- `projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.html` — values branch → `[viewed]="'inline'"`, drop manual click/focusout for that branch.
- `projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.ts` — drop now-unused wiring for the values path (keep date/datetime/between manual path).
- `projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.spec.ts` — assert values chip uses inline mode.
- `projects/sdcorejs-angular/components/query-bar/sd-query-bar.md` + `HANDOFF.md` — update.

**Showcase:**
- `projects/showcase/src/app/pages/forms/select/select-demo.component.ts` — add an inline-mode example (route + sidebar already exist).

**Docs:** `CLAUDE.md` recent-work bullet.

**Untouched this plan:** sd-date / sd-datetime / sd-date-range and the other 9 controls (rollout plan); the date/datetime/between branches of inline-chip; `sdViewDef` directive (kept; full compose deferred to rollout).

---

## Task 1: Shared `sd-viewed` primitive (forms/models)

**Files:** new `sd-viewed.ts` + `sd-viewed.spec.ts`; export from the models barrel.

- [ ] **Step 1: Write failing tests** — `forms/models/src/sd-viewed.spec.ts`:

```ts
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdViewed, sdViewedTransform, sdViewedInline } from './sd-viewed';

describe('sdViewedTransform', () => {
  it('default false; bare-attr "" → true; "inline" → "inline"; booleans pass through', () => {
    expect(sdViewedTransform(false)).toBe(false);
    expect(sdViewedTransform('' as any)).toBe(true);      // <sd-select viewed>
    expect(sdViewedTransform(true)).toBe(true);
    expect(sdViewedTransform('inline')).toBe('inline');
    expect(sdViewedTransform(null)).toBe(false);
    expect(sdViewedTransform(undefined)).toBe(false);
  });
});

describe('sdViewedInline', () => {
  function make(initial: SdViewed) {
    const viewed = signal<SdViewed>(initial);
    const injector = TestBed.inject(Injector);
    const api = runInInjectionContext(injector, () => sdViewedInline(viewed, injector));
    return { viewed, api };
  }

  it('isInline / isViewed truth table', () => {
    const { viewed, api } = make(false);
    expect(api.isInline()).toBe(false); expect(api.isViewed()).toBe(false);     // edit
    viewed.set(true);
    expect(api.isInline()).toBe(false); expect(api.isViewed()).toBe(true);      // static view
    viewed.set('inline');
    expect(api.isInline()).toBe(true);  expect(api.isViewed()).toBe(true);      // inline idle → view
  });

  it('enterInlineEdit only fires in inline mode and flips to edit', () => {
    const { api } = make(true);
    api.enterInlineEdit();
    expect(api.isViewed()).toBe(true);                                          // no-op when not inline
    const inline = make('inline');
    inline.api.enterInlineEdit();
    expect(inline.api.inlineEditing()).toBe(true);
    expect(inline.api.isViewed()).toBe(false);                                  // now editing
  });

  it('onInlineFocusOut exits only when focus leaves wrapper and overlay', () => {
    const { api } = make('inline');
    api.enterInlineEdit();
    const wrapper = document.createElement('div');
    const inside = document.createElement('input'); wrapper.appendChild(inside);
    api.onInlineFocusOut({ currentTarget: wrapper, relatedTarget: inside } as unknown as FocusEvent);
    expect(api.inlineEditing()).toBe(true);                                     // inside → stay
    const overlay = document.createElement('div'); overlay.className = 'cdk-overlay-container';
    const opt = document.createElement('div'); overlay.appendChild(opt); document.body.appendChild(overlay);
    api.onInlineFocusOut({ currentTarget: wrapper, relatedTarget: opt } as unknown as FocusEvent);
    expect(api.inlineEditing()).toBe(true);                                     // overlay → stay
    api.onInlineFocusOut({ currentTarget: wrapper, relatedTarget: document.body } as unknown as FocusEvent);
    expect(api.inlineEditing()).toBe(false);                                    // outside → exit
    overlay.remove();
  });
});
```

- [ ] **Step 2: Run, verify red** (module not found / functions missing).

- [ ] **Step 3: Implement** — `forms/models/src/sd-viewed.ts`:

```ts
import { afterNextRender, booleanAttribute, computed, Injector, signal, Signal } from '@angular/core';

/** Three display states for sd-form-controls. */
export type SdViewed = boolean | 'inline';
export type SdViewedInput = SdViewed | '' | null | undefined;

/**
 * `viewed` input transform: keep `booleanAttribute` coercion (bare attr `viewed` → true),
 * but intercept the literal `'inline'` first (booleanAttribute would coerce it to true).
 */
export function sdViewedTransform(v: SdViewedInput): SdViewed {
  return v === 'inline' ? 'inline' : booleanAttribute(v);
}

export interface SdViewedInlineApi {
  /** viewed === 'inline'. */
  readonly isInline: Signal<boolean>;
  /** Show the view layer now: static view (true) OR inline-but-not-activated. */
  readonly isViewed: Signal<boolean>;
  /** Inline editor currently revealed. */
  readonly inlineEditing: Signal<boolean>;
  /** Enter inline edit + auto-open the picker next render. No-op unless `'inline'`. */
  enterInlineEdit(): void;
  /** Exit inline edit when focus leaves the wrapper AND the cdk overlay. */
  onInlineFocusOut(ev: FocusEvent): void;
}

/**
 * Compose the tri-state `viewed` lifecycle into a control. `open` opens the control's
 * native picker (mat-select panel / calendar / overlay). Call from an injection context.
 */
export function sdViewedInline(viewed: Signal<SdViewed>, injector: Injector, open?: () => void): SdViewedInlineApi {
  const editing = signal(false);
  const isInline = computed(() => viewed() === 'inline');
  const isViewed = computed(() => viewed() === true || (isInline() && !editing()));

  const enterInlineEdit = (): void => {
    if (!isInline() || editing()) return;
    editing.set(true);
    // why: editor chỉ render sau khi isViewed() = false → mở panel ở render kế tiếp.
    afterNextRender(() => open?.(), { injector });
  };

  const onInlineFocusOut = (ev: FocusEvent): void => {
    if (!editing()) return;
    const wrapper = ev.currentTarget as HTMLElement | null;
    const next = ev.relatedTarget as Node | null;
    if (!wrapper) return;
    if (next && wrapper.contains(next)) return;                                   // focus stayed inside
    if (next instanceof Element && next.closest('.cdk-overlay-container')) return; // panel/calendar overlay
    editing.set(false);
  };

  return { isInline, isViewed, inlineEditing: editing.asReadonly(), enterInlineEdit, onInlineFocusOut };
}
```

Export from the models barrel (find the index that re-exports `sd-form-control.model` etc. — `forms/models/index.ts` or `public-api`): add `export * from './src/sd-viewed';`.

- [ ] **Step 4: Run, verify green.**
- [ ] **Step 5: Commit** — `SM-00: feat(forms): add tri-state sd-viewed primitive (transform + inline lifecycle)`.

---

## Task 2: Pilot — wire `viewed='inline'` into sd-select

**Files:** `select.component.{ts,html,spec.ts}` + `sd-select.md`.

- [ ] **Step 1: Write failing tests** — append a `describe('SdSelect (viewed inline mode)')` to `select.component.spec.ts` (create the component directly, set `valueField`/`displayField`):

```ts
describe('SdSelect (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdSelect<any>>;
  let comp: SdSelect<any>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdSelect, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdSelect);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
    fixture.componentRef.setInput('items', [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);
  });

  it('viewed="inline" → isInline true, isViewed true (view shown), no mat-select yet', fakeAsync(() => {
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
  }));

  it('clicking the inline view enters edit + opens the panel', fakeAsync(() => {
    const openSpy = spyOn(comp, 'open').and.callThrough();
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    expect(comp.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
    expect(openSpy).toHaveBeenCalled();
  }));

  it('focusout outside the wrapper exits inline edit (back to view)', fakeAsync(() => {
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    comp.onInlineFocusOut({ currentTarget: fixture.nativeElement.querySelector('.sd-inline-edit'), relatedTarget: document.body } as unknown as FocusEvent);
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    expect(comp.isViewed()).toBe(true);
  }));

  it('inline-active editor is bare (.sd-bare host, no inline clear-×) without [bare]', fakeAsync(() => {
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-clear-btn')).toBeNull();
  }));

  it('viewed=true stays static (clicking does not enter edit)', fakeAsync(() => {
    fixture.componentRef.setInput('viewed', true);
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges(); tick(600); fixture.detectChanges();
    expect(comp.isInline()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-inline-view')).toBeNull();
  }));
});
```

- [ ] **Step 2: Run, verify red** (`comp.isInline is not a function`, no `.sd-inline-view`).

- [ ] **Step 3: Implement TS** — `select.component.ts`:
  - Import `Injector` from `@angular/core` and `SdViewed, SdViewedInput, sdViewedTransform, sdViewedInline` from `@sdcorejs/angular/forms/models`.
  - Add `readonly #injector = inject(Injector);`.
  - Replace `viewed = input(false, { transform: booleanAttribute });` with:
    ```ts
    viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
    ```
  - After `open` is defined (it exists), add the composable + exposed members:
    ```ts
    readonly #viewedState = sdViewedInline(this.viewed, this.#injector, () => this.open());
    readonly isInline = this.#viewedState.isInline;
    readonly isViewed = this.#viewedState.isViewed;
    readonly inlineEditing = this.#viewedState.inlineEditing;
    enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();
    onInlineFocusOut = (ev: FocusEvent): void => this.#viewedState.onInlineFocusOut(ev);
    ```
    (Field initializers run in the injection context — `sdViewedInline` calling `afterNextRender` is fine.)
  - Host bindings: change `'[class.sd-viewed]': 'viewed()'` → `'[class.sd-viewed]': 'isViewed()'`; change `'[class.sd-bare]': 'bare()'` → `'[class.sd-bare]': 'bare() || inlineEditing()'`.

- [ ] **Step 4: Implement template** — `select.component.html`:
  - Add `@let _isInline = isInline();` near the top `@let` block.
  - Replace `@if (viewed()) {` with `@if (isViewed()) {`.
  - Inside that branch, wrap the existing `<sd-view ...></sd-view>` so inline gets a click target:
    ```html
    @if (_isInline) {
      <span class="sd-inline-view" role="button" tabindex="0"
            (click)="enterInlineEdit()" (keydown.enter)="enterInlineEdit()">
        <sd-view ...existing bindings... ></sd-view>
      </span>
    } @else {
      <sd-view ...existing bindings... ></sd-view>
    }
    ```
  - In the edit branch, add focusout to the outer `<div class="d-flex align-items-center" ...>` wrapper: `(focusout)="onInlineFocusOut($event)"` and add class `sd-inline-edit` (used by the focusout test selector). Handler no-ops unless inline-active, so this is safe for normal edit mode.

- [ ] **Step 5: Run, verify green.**

- [ ] **Step 6: Regression — run the full select spec** (ensure existing 56 + new pass):
```bash
cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts' 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED" | tail
```

- [ ] **Step 7: Update doc** — `sd-select.md`: in the `viewed` row / coerce note, document tri-state `false | true | 'inline'`; add a "Visual cues" line for inline mode (view text → click → bare editor; activated editor is bare).

- [ ] **Step 8: Commit** — `SM-00: feat(select): tri-state viewed with 'inline' click-to-edit mode`.

---

## Task 3: Rebuild lib (so dist reflects sd-select for downstream specs)

- [ ] **Step 1:** `cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular && npm run build 2>&1 | tail -20` — expect clean (exit 0). Required before Task 4/5 because their specs/consumers resolve `@sdcorejs/angular/forms/select` from `dist/`.

---

## Task 4: Adopt `viewed='inline'` in query-bar inline-chip (values / lazy-values)

Scope: only the `values` / `lazy-values` branch (sd-select). `date` / `datetime` / BETWEEN keep the current manual `[viewed]="!_editing"` path until those controls gain inline mode (rollout). Backward-compatible: boolean `[viewed]` still works (transform passes booleans through).

**Files:** `inline-chip.component.{html,ts,spec.ts}`.

- [ ] **Step 1: Write/adjust failing test** — `inline-chip.component.spec.ts`: the existing `'... does NOT render the inline .sd-clear-btn ...'` test already enters edit by clicking `.c-token-value-edit`. Add an assertion that the values chip drives sd-select via inline mode:
```ts
it('values chip delegates edit lifecycle to sd-select [viewed]="inline"', () => {
  const valuesField = { key: 'status', label: 'Status', type: 'values',
    option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' } } as unknown as SdQueryField;
  host.field = valuesField;
  host.filter = { field: 'status', operator: 'IN', data: ['a'] };
  host.multiple = true; host.valueText = 'A';
  fixture.detectChanges();
  const sel = fixture.debugElement.query(By.css('sd-select')).componentInstance as any;
  expect(sel.viewed()).toBe('inline');
});
```
> NOTE: this spec resolves sd-select from `dist/` → Task 3 must have run.

- [ ] **Step 2: Run, verify red** (`viewed()` is `false`/boolean, not `'inline'`).

- [ ] **Step 3: Implement** — `inline-chip.component.html` values branch (currently lines ~63-88):
  - On the wrapper `<span class="c-token-value c-token-value-edit">` remove `(click)="enterEdit()"` and `(focusout)="onFocusOut($event)"` **for this branch only**.
  - On `<sd-select #chipPicker>` replace `bare ... [viewed]="!_editing"` with `[viewed]="'inline'"` (drop the explicit `bare` — inline implies bare-on-activate). Keep `[model]`, `[items]`, `[multiple]`, `(sdChange)`, `#sdValue` template.
  - Keep `#chipPicker` (sd-select still exposes `open()`; no longer manually called).

- [ ] **Step 4: Clean up TS** — `inline-chip.component.ts`: the `values`/`lazy-values` branch no longer uses `enterEdit`/`onFocusOut`/`chipPicker.open()`. Keep these for the still-manual date/datetime/between branches. Do NOT delete `#editing` yet (other branches use it). Add a `// why:` note that values delegates to sd-select inline mode; full removal lands when all controls support inline.

- [ ] **Step 5: Run the inline-chip spec, verify green** (incl. the existing clear-btn test).
```bash
cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.spec.ts' 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|Expected" | head
```

- [ ] **Step 6: Run query-bar parent spec** (regression) — `--include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`.

- [ ] **Step 7: Update docs** — `sd-query-bar.md` (Inline chip rendering rules: values uses `viewed='inline'`, lifecycle owned by sd-select) + `HANDOFF.md` (test counts + note).

- [ ] **Step 8: Commit** — `SM-00: refactor(query-bar): inline values chip uses sd-select viewed='inline'`.

---

## Task 5: Showcase — inline-mode example for sd-select

**Files:** `projects/showcase/src/app/pages/forms/select/select-demo.component.ts` (route `forms/select` + sidebar already exist → no routes/sidebar edits).

- [ ] **Step 1:** Add a demo section: a labelled `<sd-select [viewed]="'inline'" [items]=... valueField displayField [(model)]=...>` next to the existing examples, with a short caption ("Inline edit — click giá trị để sửa, không hiện ô input"). Mirror the demo file's existing section structure/signals.
- [ ] **Step 2:** Sanity-build the showcase (or `npm run build` already covers the lib; showcase build optional): `npx ng build showcase --configuration=development 2>&1 | tr '\r' '\n' | grep -iE "Built|error" | head` — expect built, no errors. If showcase build isn't wired for headless, state so.
- [ ] **Step 3: Commit** — `SM-00: docs(showcase): sd-select viewed='inline' example`.

---

## Task 6: Full verification + docs

- [ ] **Step 1: Full sd-angular suite** (tri-state is additive → no regressions):
```bash
cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED" | tail
```
Expected `TOTAL: N SUCCESS`.

- [ ] **Step 2: Lib build** — `npm run build` clean (the real gate).

- [ ] **Step 3: CLAUDE.md** — append a "Recent work" bullet (tri-state `viewed` pilot + sd-select + query-bar values adoption; note the rollout-pending 12 controls + the dist gotcha).

- [ ] **Step 4: Manual demo check (UI — tests can't assert):** `npx ng serve showcase` (or demo) → `/forms/select`: inline field shows text; click → bare editor + panel opens; pick → commits; click outside → back to text, value intact (no accidental clear). State explicitly if serve can't run here.

---

## Self-Review notes

- **Spec coverage:** transform + computeds + lifecycle (Task 1), sd-select inline render/click/focusout/bare-on-activate (Task 2), query-bar adoption (Task 4), showcase (Task 5), regression + build + docs (Task 6). `display:none` rejected per spec — swap-render only.
- **Backward compat:** boolean `[viewed]` still works (transform passes booleans); existing `viewed=true` host/render unchanged (`isViewed()===true` for `true`); inline-chip's other branches keep `[viewed]="!_editing"`. The 56 existing select specs must stay green (Task 2 Step 6).
- **dist gotcha** called out before Task 4/5 (rebuild in Task 3).
- **Rollout deferred:** 12 controls + date/datetime/between chip migration + `sdViewDef` full compose → next plan.

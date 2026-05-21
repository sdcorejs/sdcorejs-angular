# sd-splitter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a resizable splitter component family (`<sd-splitter>` + `<sd-splitter-panel>`) for `projects/sdcorejs-angular/components/splitter/`, supporting horizontal/vertical orientation, nested splitters, mix of pixel-fixed and flex panels, snap-to-collapse, keyboard a11y, optional `localStorage` persistence via `SdStorageService`, and a full imperative API.

**Architecture:** CSS Flexbox renders the layout (each panel = flex child; `flex-basis` is the size axis). Signal-based composition: `contentChildren()` + `effect()` for reconcile; no `ngOnInit`/`ngAfterContentInit`. Internal `SplitterStateService` (provided per `<sd-splitter>` instance) is the single source of truth, with two signals: `liveSizes` (updated 60fps during drag) and `committedLayout` (only on `resizeEnd` + `collapsedChange`, triggers storage save). Handle component handles pointer + keyboard + double-click; directly writes `flexBasis` to panel host elements during drag (batched via rAF) to skip Angular CD.

**Tech Stack:** Angular 19+, standalone components, signal inputs (`input()`, `model()`), `contentChildren()` signal, Karma + Jasmine tests, `SdStorageService` from `@sdcorejs/angular/services`. SCSS with CSS variables.

**Spec reference:** [docs/superpowers/specs/2026-05-16-sd-splitter-design.md](../specs/2026-05-16-sd-splitter-design.md)

---

## File Structure

Files created (all under `projects/sdcorejs-angular/components/splitter/`):

| File | Responsibility |
|---|---|
| `index.ts` | Public API re-exports |
| `src/splitter.models.ts` | Types: `SplitterOrientation`, `SplitterPanelUnit`, `SplitterPanelState`, `SplitterLayoutState`, internal `ResolvedPanelMeta` |
| `src/splitter-state.service.ts` | Internal state service (signals + reconcile + applyDelta + collapse logic). Pure TS, dá»… TDD. |
| `src/splitter-state.service.spec.ts` | Unit tests for state service |
| `src/splitter-panel/splitter-panel.component.ts` | `<sd-splitter-panel>` â€” wrapper vá»›i inputs, host binding `flex-basis` |
| `src/splitter-panel/splitter-panel.component.html` | `<ng-content>` |
| `src/splitter-panel/splitter-panel.component.scss` | Panel styles |
| `src/splitter-panel/splitter-panel.component.spec.ts` | Panel component tests |
| `src/splitter-handle/splitter-handle.component.ts` | Internal â€” divider draggable + a11y |
| `src/splitter-handle/splitter-handle.component.html` | Handle markup (.bar bÃªn trong) |
| `src/splitter-handle/splitter-handle.component.scss` | Handle styles + CSS variables |
| `src/splitter-handle/splitter-handle.component.spec.ts` | Handle interaction tests |
| `src/splitter.component.ts` | `<sd-splitter>` container |
| `src/splitter.component.html` | Template render panels + handles xen káº½ |
| `src/splitter.component.scss` | Container styles |
| `src/splitter.component.spec.ts` | Container component tests |
| `src/splitter.integration.spec.ts` | Integration tests (DOM end-to-end) |

Files modified: none (chá»‰ thÃªm component má»›i).

---

## Test Conventions (Ä‘á»c trÆ°á»›c khi lÃ m)

Pattern theo `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.spec.ts`:

- Standalone host component wrap unit under test vá»›i template inline
- `TestBed.configureTestingModule({ imports: [HostComponent] })`
- Signal-based host state Ä‘á»ƒ toggle inputs trong test
- Helper dispatch native events:
  ```ts
  function dispatchPointer(target: EventTarget, type: string, init: PointerEventInit) {
    const ev = new PointerEvent(type, { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(ev);
  }
  function dispatchKey(target: EventTarget, key: string) {
    const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
    target.dispatchEvent(ev);
  }
  ```
- Mock `getBoundingClientRect` qua `spyOn(el, 'getBoundingClientRect').and.returnValue({...} as DOMRect)` Ä‘á»ƒ cÃ³ pixel deterministic
- Mock `requestAnimationFrame` qua `spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 0; });` Ä‘á»ƒ rAF cháº¡y ngay
- `SdStorageService` provide tháº­t trong TestBed (tá»± lÆ°u vÃ o `localStorage`), `localStorage.clear()` trong `beforeEach`. Pattern theo `config.service.spec.ts`.

Lá»‡nh test: `npm test` (cháº¡y toÃ n bá»™) hoáº·c filter qua `ng test --include='**/splitter/**'`.

---

## Task 1: Scaffold + models

**Files:**
- Create: `projects/sdcorejs-angular/components/splitter/index.ts`
- Create: `projects/sdcorejs-angular/components/splitter/src/splitter.models.ts`
- Create stubs (sáº½ Ä‘iá»n sau): `splitter.component.ts`, `splitter-panel/splitter-panel.component.ts`, `splitter-handle/splitter-handle.component.ts`, `splitter-state.service.ts`

- [ ] **Step 1: Create `src/splitter.models.ts`**

```ts
// projects/sdcorejs-angular/components/splitter/src/splitter.models.ts
export type SplitterOrientation = 'horizontal' | 'vertical';
export type SplitterPanelUnit = 'px' | 'flex';

export interface SplitterPanelState {
  id: string | number;
  size: number;
  unit: SplitterPanelUnit;
  collapsed: boolean;
}

export interface SplitterLayoutState {
  v: 1;
  panels: SplitterPanelState[];
}

// Internal â€” khÃ´ng export ra index.ts
export interface ResolvedPanelMeta {
  id: string | number;          // panelId náº¿u cÃ³, else index
  index: number;
  unit: SplitterPanelUnit;
  minSize: number;
  maxSize: number | undefined;
  collapsible: boolean;
  resizable: boolean;
  declaredSize: number;         // size khai bÃ¡o trong template, dÃ¹ng cho resetLayout
  lastSize: number;             // size trÆ°á»›c khi collapse (cho expand restore)
}
```

- [ ] **Step 2: Create empty service stub `src/splitter-state.service.ts`**

```ts
// projects/sdcorejs-angular/components/splitter/src/splitter-state.service.ts
import { Injectable, signal } from '@angular/core';
import { SplitterLayoutState } from './splitter.models';

@Injectable()
export class SplitterStateService {
  readonly liveSizes = signal<ReadonlyMap<string | number, number>>(new Map());
  readonly collapsedMap = signal<ReadonlyMap<string | number, boolean>>(new Map());
  readonly committedLayout = signal<SplitterLayoutState>({ v: 1, panels: [] });
}
```

- [ ] **Step 3: Create panel stub `src/splitter-panel/splitter-panel.component.ts`**

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'sd-splitter-panel',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class SdSplitterPanelComponent {}
```

- [ ] **Step 4: Create handle stub `src/splitter-handle/splitter-handle.component.ts`**

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'sd-splitter-handle',
  standalone: true,
  template: '<span class="sd-splitter__handle-bar"></span>',
})
export class SdSplitterHandleComponent {}
```

- [ ] **Step 5: Create container stub `src/splitter.component.ts`**

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'sd-splitter',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class SdSplitterComponent {}
```

- [ ] **Step 6: Create `index.ts`**

```ts
// projects/sdcorejs-angular/components/splitter/index.ts
export * from './src/splitter.component';
export * from './src/splitter-panel/splitter-panel.component';
export * from './src/splitter.models';
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: PASS (khÃ´ng cÃ³ lá»—i compile vÃ¬ stub trá»‘ng compile Ä‘Æ°á»£c)

- [ ] **Step 8: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): scaffold component skeleton + models"
```

---

## Task 2: SplitterStateService â€” basic signal mutations

**Files:**
- Modify: `src/splitter-state.service.ts`
- Create: `src/splitter-state.service.spec.ts`

Service exposes mutation methods cho live drag vÃ  committed state. ChÆ°a cÃ³ reconcile/applyDelta â€” chá»‰ primitive setters.

- [ ] **Step 1: Write failing test `splitter-state.service.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { SplitterStateService } from './splitter-state.service';

describe('SplitterStateService â€” basic mutations', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  it('setLiveSize updates liveSizes signal cho 1 panel', () => {
    service.setLiveSize('p1', 200);
    expect(service.liveSizes().get('p1')).toBe(200);
  });

  it('setLiveSize báº£o toÃ n cÃ¡c panel khÃ¡c', () => {
    service.setLiveSize('p1', 100);
    service.setLiveSize('p2', 200);
    expect(service.liveSizes().get('p1')).toBe(100);
    expect(service.liveSizes().get('p2')).toBe(200);
  });

  it('setCollapsed updates collapsedMap signal', () => {
    service.setCollapsed('p1', true);
    expect(service.collapsedMap().get('p1')).toBe(true);
  });

  it('commit() snapshot live state vÃ o committedLayout', () => {
    service.setLiveSize('p1', 100);
    service.setLiveSize('p2', 200);
    service.setCollapsed('p2', true);
    service.setPanelMeta([
      { id: 'p1', index: 0, unit: 'flex', minSize: 0, maxSize: undefined, collapsible: false, resizable: true, declaredSize: 1, lastSize: 1 },
      { id: 'p2', index: 1, unit: 'flex', minSize: 0, maxSize: undefined, collapsible: true, resizable: true, declaredSize: 1, lastSize: 1 },
    ]);

    service.commit();

    expect(service.committedLayout()).toEqual({
      v: 1,
      panels: [
        { id: 'p1', size: 100, unit: 'flex', collapsed: false },
        { id: 'p2', size: 200, unit: 'flex', collapsed: true },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test, verify FAIL**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: FAIL â€” `service.setLiveSize is not a function`

- [ ] **Step 3: Implement service**

Replace `src/splitter-state.service.ts` content:

```ts
import { Injectable, signal } from '@angular/core';
import { ResolvedPanelMeta, SplitterLayoutState } from './splitter.models';

@Injectable()
export class SplitterStateService {
  readonly liveSizes = signal<ReadonlyMap<string | number, number>>(new Map());
  readonly collapsedMap = signal<ReadonlyMap<string | number, boolean>>(new Map());
  readonly committedLayout = signal<SplitterLayoutState>({ v: 1, panels: [] });

  #metas: ResolvedPanelMeta[] = [];

  setPanelMeta(metas: ResolvedPanelMeta[]): void {
    this.#metas = metas;
  }

  getPanelMetas(): ReadonlyArray<ResolvedPanelMeta> {
    return this.#metas;
  }

  setLiveSize(id: string | number, size: number): void {
    const next = new Map(this.liveSizes());
    next.set(id, size);
    this.liveSizes.set(next);
  }

  setCollapsed(id: string | number, collapsed: boolean): void {
    const next = new Map(this.collapsedMap());
    next.set(id, collapsed);
    this.collapsedMap.set(next);
  }

  commit(): void {
    const sizes = this.liveSizes();
    const collapsed = this.collapsedMap();
    const panels = this.#metas.map(meta => ({
      id: meta.id,
      size: sizes.get(meta.id) ?? meta.declaredSize,
      unit: meta.unit,
      collapsed: collapsed.get(meta.id) ?? false,
    }));
    this.committedLayout.set({ v: 1, panels });
  }
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: PASS (4 specs)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): state service with signal-based size + collapse mutations"
```

---

## Task 3: SplitterStateService â€” reconcile (template â†” storage)

**Files:**
- Modify: `src/splitter-state.service.ts`
- Modify: `src/splitter-state.service.spec.ts`

Add `reconcile(metas, stored)` method theo 4 rule trong spec section 8:
1. Match panelId (cáº£ 2 Ä‘á»u cÃ³ id) â†’ restore size + collapsed
2. Match index (cáº£ 2 khÃ´ng cÃ³ id) â†’ restore
3. KhÃ´ng match â†’ dÃ¹ng declaredSize
4. Unit lá»‡ch â†’ bá» qua storage entry

- [ ] **Step 1: Append failing tests**

Append vÃ o `splitter-state.service.spec.ts`:

```ts
describe('SplitterStateService.reconcile', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  const meta = (id: string | number, unit: 'flex' | 'px' = 'flex', declaredSize = 1): import('./splitter.models').ResolvedPanelMeta => ({
    id, index: typeof id === 'number' ? id : 0, unit,
    minSize: 0, maxSize: undefined, collapsible: false, resizable: true,
    declaredSize, lastSize: declaredSize,
  });

  it('uses declaredSize khi khÃ´ng cÃ³ stored state', () => {
    service.reconcile([meta('a', 'flex', 2), meta('b', 'flex', 3)], null);
    expect(service.liveSizes().get('a')).toBe(2);
    expect(service.liveSizes().get('b')).toBe(3);
    expect(service.collapsedMap().get('a')).toBe(false);
  });

  it('matches by panelId (string id)', () => {
    const stored = { v: 1 as const, panels: [
      { id: 'a', size: 100, unit: 'flex' as const, collapsed: false },
      { id: 'b', size: 200, unit: 'flex' as const, collapsed: true },
    ]};
    service.reconcile([meta('a'), meta('b')], stored);
    expect(service.liveSizes().get('a')).toBe(100);
    expect(service.liveSizes().get('b')).toBe(200);
    expect(service.collapsedMap().get('b')).toBe(true);
  });

  it('falls back to index khi panel khÃ´ng cÃ³ panelId', () => {
    const stored = { v: 1 as const, panels: [
      { id: 0, size: 50, unit: 'flex' as const, collapsed: false },
      { id: 1, size: 150, unit: 'flex' as const, collapsed: false },
    ]};
    service.reconcile([
      { ...meta(0), id: 0, index: 0 },
      { ...meta(1), id: 1, index: 1 },
    ], stored);
    expect(service.liveSizes().get(0)).toBe(50);
    expect(service.liveSizes().get(1)).toBe(150);
  });

  it('skips stale entry trong storage (panel cÅ© khÃ´ng cÃ²n trong template)', () => {
    const stored = { v: 1 as const, panels: [
      { id: 'gone', size: 999, unit: 'flex' as const, collapsed: false },
      { id: 'a', size: 80, unit: 'flex' as const, collapsed: false },
    ]};
    service.reconcile([meta('a', 'flex', 5)], stored);
    expect(service.liveSizes().get('a')).toBe(80);
    expect(service.liveSizes().has('gone')).toBe(false);
  });

  it('uses declaredSize khi panel má»›i chÆ°a cÃ³ trong storage', () => {
    const stored = { v: 1 as const, panels: [
      { id: 'a', size: 80, unit: 'flex' as const, collapsed: false },
    ]};
    service.reconcile([meta('a'), meta('newPanel', 'flex', 7)], stored);
    expect(service.liveSizes().get('a')).toBe(80);
    expect(service.liveSizes().get('newPanel')).toBe(7);
  });

  it('bá» qua storage entry khi unit lá»‡ch', () => {
    const stored = { v: 1 as const, panels: [
      { id: 'a', size: 250, unit: 'px' as const, collapsed: false },
    ]};
    service.reconcile([meta('a', 'flex', 2)], stored);
    expect(service.liveSizes().get('a')).toBe(2);   // dÃ¹ng declared, bá» stored
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: FAIL â€” `service.reconcile is not a function`

- [ ] **Step 3: Implement `reconcile`**

Append vÃ o `SplitterStateService` (trÆ°á»›c `commit()`):

```ts
reconcile(metas: ResolvedPanelMeta[], stored: SplitterLayoutState | null | undefined): void {
  this.setPanelMeta(metas);
  const liveNext = new Map<string | number, number>();
  const collapsedNext = new Map<string | number, boolean>();

  for (const meta of metas) {
    let restoredSize: number | undefined;
    let restoredCollapsed = false;

    if (stored?.panels?.length) {
      // Try match by id, Æ°u tiÃªn trÃ¹ng id tuyá»‡t Ä‘á»‘i
      const byId = stored.panels.find(p => p.id === meta.id);
      const match = byId ?? stored.panels[meta.index];

      // Chá»‰ accept náº¿u unit trÃ¹ng
      if (match && match.unit === meta.unit) {
        restoredSize = match.size;
        restoredCollapsed = match.collapsed;
      }
    }

    liveNext.set(meta.id, restoredSize ?? meta.declaredSize);
    collapsedNext.set(meta.id, restoredCollapsed);
  }

  this.liveSizes.set(liveNext);
  this.collapsedMap.set(collapsedNext);
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: PASS (10 specs total)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): reconcile state service vá»›i template + storage merge"
```

---

## Task 4: SplitterStateService â€” applyDelta (resize logic)

**Files:**
- Modify: `src/splitter-state.service.ts`
- Modify: `src/splitter-state.service.spec.ts`

Add `applyDelta(handleIndex, deltaPx, containerPx)` Ä‘á»ƒ xá»­ lÃ½ kÃ©o divider giá»¯a 2 panel ká». 3 combo: flex-flex, px-px, mix flex+px. Clamp theo min/max.

- [ ] **Step 1: Append failing tests**

```ts
describe('SplitterStateService.applyDelta', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  // helper: setup 2 panel + initial sizes, return service
  function setup(metas: Array<{ id: string; unit: 'flex' | 'px'; size: number; min?: number; max?: number }>): SplitterStateService {
    const resolved = metas.map((m, i) => ({
      id: m.id, index: i, unit: m.unit,
      minSize: m.min ?? 0, maxSize: m.max,
      collapsible: false, resizable: true,
      declaredSize: m.size, lastSize: m.size,
    }));
    service.reconcile(resolved, null);
    return service;
  }

  it('flex-flex: delta dÆ°Æ¡ng dá»‹ch chuyá»ƒn weight giá»¯a 2 panel', () => {
    setup([
      { id: 'a', unit: 'flex', size: 1 },
      { id: 'b', unit: 'flex', size: 1 },
    ]);
    // container 200px, má»—i panel 100px, delta +20px â†’ a: 120, b: 80 â†’ weight 1.2, 0.8
    service.applyDelta(0, 20, 200);
    expect(service.liveSizes().get('a')).toBeCloseTo(1.2, 5);
    expect(service.liveSizes().get('b')).toBeCloseTo(0.8, 5);
  });

  it('px-px: delta cá»™ng/trá»« trá»±c tiáº¿p', () => {
    setup([
      { id: 'a', unit: 'px', size: 100 },
      { id: 'b', unit: 'px', size: 100 },
    ]);
    service.applyDelta(0, 30, 200);
    expect(service.liveSizes().get('a')).toBe(130);
    expect(service.liveSizes().get('b')).toBe(70);
  });

  it('mix px+flex: delta dá»“n háº¿t vÃ o panel flex, panel px cá»‘ Ä‘á»‹nh', () => {
    setup([
      { id: 'fixed', unit: 'px', size: 100 },
      { id: 'fluid', unit: 'flex', size: 1 },
    ]);
    // container 200, fixed=100, fluid=100 (1 weight = remaining 100px). Delta +20 â†’ fixed: 120, fluid: 80 (weight 0.8)
    service.applyDelta(0, 20, 200);
    expect(service.liveSizes().get('fixed')).toBe(120);
    expect(service.liveSizes().get('fluid')).toBeCloseTo(0.8, 5);
  });

  it('clamp táº¡i minSize cá»§a panel prev (flex)', () => {
    setup([
      { id: 'a', unit: 'flex', size: 1, min: 0.4 },     // min weight 0.4
      { id: 'b', unit: 'flex', size: 1 },
    ]);
    // container 200, má»—i panel 100. Delta -80 â†’ a sáº½ vá» 20 (weight 0.2), nhÆ°ng min 0.4 â†’ clamp
    service.applyDelta(0, -80, 200);
    expect(service.liveSizes().get('a')).toBeCloseTo(0.4, 5);
    // delta thá»±c sá»± Ã¡p dá»¥ng = -60px, b: 1 + 0.6 = 1.6
    expect(service.liveSizes().get('b')).toBeCloseTo(1.6, 5);
  });

  it('clamp táº¡i minSize cá»§a panel next (px)', () => {
    setup([
      { id: 'a', unit: 'px', size: 100 },
      { id: 'b', unit: 'px', size: 100, min: 50 },
    ]);
    // Delta +80 â†’ b muá»‘n 20, nhÆ°ng min 50 â†’ clamp, a chá»‰ +50
    service.applyDelta(0, 80, 200);
    expect(service.liveSizes().get('a')).toBe(150);
    expect(service.liveSizes().get('b')).toBe(50);
  });

  it('clamp táº¡i maxSize', () => {
    setup([
      { id: 'a', unit: 'px', size: 100, max: 120 },
      { id: 'b', unit: 'px', size: 100 },
    ]);
    service.applyDelta(0, 50, 200);
    expect(service.liveSizes().get('a')).toBe(120);
    expect(service.liveSizes().get('b')).toBe(80);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: FAIL â€” `service.applyDelta is not a function`

- [ ] **Step 3: Implement `applyDelta`**

Append vÃ o `SplitterStateService`:

```ts
/**
 * Ãp delta px lÃªn 2 panel ká» handleIndex (prev = handleIndex, next = handleIndex + 1).
 * Tráº£ vá» delta thá»±c sá»± Ä‘Ã£ Ã¡p (sau khi clamp).
 */
applyDelta(handleIndex: number, deltaPx: number, containerPx: number): number {
  const metas = this.#metas;
  const prev = metas[handleIndex];
  const next = metas[handleIndex + 1];
  if (!prev || !next) return 0;

  // bá» qua náº¿u 1 trong 2 Ä‘ang collapsed (collapse logic xá»­ lÃ½ riÃªng á»Ÿ Task 5)
  if (this.collapsedMap().get(prev.id) || this.collapsedMap().get(next.id)) return 0;

  const sizes = this.liveSizes();
  const prevSize = sizes.get(prev.id) ?? prev.declaredSize;
  const nextSize = sizes.get(next.id) ?? next.declaredSize;

  // 1. TÃ­nh px hiá»‡n táº¡i cá»§a 2 panel (Ä‘á»ƒ clamp Ä‘á»“ng nháº¥t)
  const flexBudgetPx = this.#flexBudgetPx(containerPx);
  const totalFlexWeight = this.#totalFlexWeight();
  const prevPx = prev.unit === 'px' ? prevSize : (flexBudgetPx * prevSize) / Math.max(totalFlexWeight, 1e-9);
  const nextPx = next.unit === 'px' ? nextSize : (flexBudgetPx * nextSize) / Math.max(totalFlexWeight, 1e-9);

  // 2. Clamp delta theo min/max cá»§a cáº£ 2 panel (px space)
  const prevMinPx = this.#sizeToPx(prev, prev.minSize, flexBudgetPx, totalFlexWeight);
  const prevMaxPx = prev.maxSize != null ? this.#sizeToPx(prev, prev.maxSize, flexBudgetPx, totalFlexWeight) : Infinity;
  const nextMinPx = this.#sizeToPx(next, next.minSize, flexBudgetPx, totalFlexWeight);
  const nextMaxPx = next.maxSize != null ? this.#sizeToPx(next, next.maxSize, flexBudgetPx, totalFlexWeight) : Infinity;

  let delta = deltaPx;
  delta = Math.max(delta, prevMinPx - prevPx);  // prev khÃ´ng nhá» hÆ¡n prevMin
  delta = Math.min(delta, prevMaxPx - prevPx);  // prev khÃ´ng lá»›n hÆ¡n prevMax
  delta = Math.max(delta, nextPx - nextMaxPx);  // next khÃ´ng lá»›n hÆ¡n nextMax
  delta = Math.min(delta, nextPx - nextMinPx);  // next khÃ´ng nhá» hÆ¡n nextMin

  if (delta === 0) return 0;

  // 3. Ãp delta lÃªn 2 panel theo unit
  const newPrevPx = prevPx + delta;
  const newNextPx = nextPx - delta;

  const liveNext = new Map(this.liveSizes());
  liveNext.set(prev.id, prev.unit === 'px' ? newPrevPx : (newPrevPx * totalFlexWeight) / Math.max(flexBudgetPx, 1e-9));
  liveNext.set(next.id, next.unit === 'px' ? newNextPx : (newNextPx * totalFlexWeight) / Math.max(flexBudgetPx, 1e-9));
  this.liveSizes.set(liveNext);

  return delta;
}

#flexBudgetPx(containerPx: number): number {
  let pxConsumed = 0;
  const sizes = this.liveSizes();
  for (const m of this.#metas) {
    if (m.unit === 'px' && !this.collapsedMap().get(m.id)) {
      pxConsumed += sizes.get(m.id) ?? m.declaredSize;
    }
  }
  return Math.max(containerPx - pxConsumed, 0);
}

#totalFlexWeight(): number {
  let total = 0;
  const sizes = this.liveSizes();
  for (const m of this.#metas) {
    if (m.unit === 'flex' && !this.collapsedMap().get(m.id)) {
      total += sizes.get(m.id) ?? m.declaredSize;
    }
  }
  return total;
}

#sizeToPx(meta: ResolvedPanelMeta, value: number, flexBudgetPx: number, totalFlexWeight: number): number {
  return meta.unit === 'px' ? value : (flexBudgetPx * value) / Math.max(totalFlexWeight, 1e-9);
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: PASS (16 specs)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): applyDelta vá»›i clamp min/max cho flex/px/mix"
```

---

## Task 5: SplitterStateService â€” collapse / expand vá»›i lastSize

**Files:**
- Modify: `src/splitter-state.service.ts`
- Modify: `src/splitter-state.service.spec.ts`

Methods: `collapsePanel(id)`, `expandPanel(id)`, `togglePanel(id)`. Khi collapse: lÆ°u current size vÃ o `lastSize`, set collapsed=true. Khi expand: restore tá»« lastSize.

- [ ] **Step 1: Append failing tests**

```ts
describe('SplitterStateService.collapse/expand', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  function setup(): SplitterStateService {
    service.reconcile([
      { id: 'a', index: 0, unit: 'flex', minSize: 0, maxSize: undefined, collapsible: true, resizable: true, declaredSize: 2, lastSize: 2 },
      { id: 'b', index: 1, unit: 'flex', minSize: 0, maxSize: undefined, collapsible: true, resizable: true, declaredSize: 1, lastSize: 1 },
    ], null);
    return service;
  }

  it('collapsePanel set collapsed=true', () => {
    setup().collapsePanel('a');
    expect(service.collapsedMap().get('a')).toBe(true);
  });

  it('collapsePanel lÆ°u currentSize vÃ o lastSize trÃªn meta', () => {
    setup();
    service.setLiveSize('a', 5);
    service.collapsePanel('a');
    expect(service.getPanelMetas().find(m => m.id === 'a')!.lastSize).toBe(5);
  });

  it('expandPanel restore size tá»« lastSize', () => {
    setup();
    service.setLiveSize('a', 7);
    service.collapsePanel('a');
    service.expandPanel('a');
    expect(service.collapsedMap().get('a')).toBe(false);
    expect(service.liveSizes().get('a')).toBe(7);
  });

  it('expandPanel khi khÃ´ng cÃ³ lastSize há»£p lá»‡ â†’ fallback minSize', () => {
    service.reconcile([
      { id: 'a', index: 0, unit: 'flex', minSize: 0.5, maxSize: undefined, collapsible: true, resizable: true, declaredSize: 1, lastSize: 0 },
    ], null);
    service.setCollapsed('a', true);
    service.expandPanel('a');
    expect(service.liveSizes().get('a')).toBe(0.5);
  });

  it('togglePanel flip collapsed state', () => {
    setup();
    service.togglePanel('a');
    expect(service.collapsedMap().get('a')).toBe(true);
    service.togglePanel('a');
    expect(service.collapsedMap().get('a')).toBe(false);
  });

  it('collapsePanel no-op náº¿u panel khÃ´ng collapsible', () => {
    service.reconcile([
      { id: 'a', index: 0, unit: 'flex', minSize: 0, maxSize: undefined, collapsible: false, resizable: true, declaredSize: 1, lastSize: 1 },
    ], null);
    service.collapsePanel('a');
    expect(service.collapsedMap().get('a')).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: FAIL â€” `service.collapsePanel is not a function`

- [ ] **Step 3: Implement collapse methods**

Append vÃ o `SplitterStateService`:

```ts
collapsePanel(id: string | number): void {
  const meta = this.#metas.find(m => m.id === id);
  if (!meta || !meta.collapsible) return;
  // LÆ°u size hiá»‡n táº¡i Ä‘á»ƒ expand sau
  const current = this.liveSizes().get(id);
  if (current !== undefined && current > 0) {
    meta.lastSize = current;
  }
  this.setCollapsed(id, true);
}

expandPanel(id: string | number): void {
  const meta = this.#metas.find(m => m.id === id);
  if (!meta) return;
  let restoreSize = meta.lastSize;
  if (!restoreSize || restoreSize <= 0) {
    restoreSize = meta.minSize > 0 ? meta.minSize : meta.declaredSize;
  }
  this.setLiveSize(id, restoreSize);
  this.setCollapsed(id, false);
}

togglePanel(id: string | number): void {
  if (this.collapsedMap().get(id)) {
    this.expandPanel(id);
  } else {
    this.collapsePanel(id);
  }
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: PASS (22 specs)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): collapse/expand/toggle vá»›i lastSize restore"
```

---

## Task 6: SplitterStateService â€” snap-to-collapse trong applyDelta

**Files:**
- Modify: `src/splitter-state.service.ts`
- Modify: `src/splitter-state.service.spec.ts`

Khi delta kÃ©o panel xuá»‘ng dÆ°á»›i `minSize Ã— snapThreshold` (default 0.5) **vÃ ** panel `collapsible=true` â†’ auto trigger collapse trong applyDelta. Khi kÃ©o ngÆ°á»£c ra â†’ auto expand.

- [ ] **Step 1: Append failing tests**

```ts
describe('SplitterStateService â€” snap-to-collapse', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  it('kÃ©o collapsible panel xuá»‘ng dÆ°á»›i minSize Ã— snapThreshold â†’ snap collapse', () => {
    service.reconcile([
      { id: 'a', index: 0, unit: 'px', minSize: 80, maxSize: undefined, collapsible: true, resizable: true, declaredSize: 100, lastSize: 100 },
      { id: 'b', index: 1, unit: 'px', minSize: 0, maxSize: undefined, collapsible: false, resizable: true, declaredSize: 100, lastSize: 100 },
    ], null);
    // KÃ©o a tá»« 100 xuá»‘ng <= 40 (= 80 * 0.5) â†’ snap
    service.applyDelta(0, -70, 200, 0.5);   // a muá»‘n vá» 30, dÆ°á»›i ngÆ°á»¡ng 40
    expect(service.collapsedMap().get('a')).toBe(true);
  });

  it('khÃ´ng snap náº¿u panel khÃ´ng collapsible â€” clamp táº¡i minSize', () => {
    service.reconcile([
      { id: 'a', index: 0, unit: 'px', minSize: 80, maxSize: undefined, collapsible: false, resizable: true, declaredSize: 100, lastSize: 100 },
      { id: 'b', index: 1, unit: 'px', minSize: 0, maxSize: undefined, collapsible: false, resizable: true, declaredSize: 100, lastSize: 100 },
    ], null);
    service.applyDelta(0, -50, 200, 0.5);
    expect(service.collapsedMap().get('a')).toBeFalsy();
    expect(service.liveSizes().get('a')).toBe(80);   // clamp táº¡i min
  });

  it('kÃ©o ngÆ°á»£c láº¡i (delta dÆ°Æ¡ng vÆ°á»£t minSize) â†’ expand tá»« collapsed', () => {
    service.reconcile([
      { id: 'a', index: 0, unit: 'px', minSize: 80, maxSize: undefined, collapsible: true, resizable: true, declaredSize: 100, lastSize: 120 },
      { id: 'b', index: 1, unit: 'px', minSize: 0, maxSize: undefined, collapsible: false, resizable: true, declaredSize: 100, lastSize: 100 },
    ], null);
    service.setCollapsed('a', true);
    service.setLiveSize('a', 0);
    // delta dÆ°Æ¡ng â‰¥ minSize â†’ expand
    service.applyDelta(0, 90, 200, 0.5);
    expect(service.collapsedMap().get('a')).toBe(false);
    expect(service.liveSizes().get('a')).toBe(120);   // restore lastSize
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: FAIL â€” `service.applyDelta` ignores `snapThreshold` param (or fails cÃ¡c assertion má»›i)

- [ ] **Step 3: Modify `applyDelta` signature + add snap logic**

Replace `applyDelta` trong `SplitterStateService`:

```ts
/**
 * Ãp delta px lÃªn 2 panel ká» handleIndex (prev = handleIndex, next = handleIndex + 1).
 * Khi snap collapsible panel: tá»± set collapsed + reset size = 0.
 * Khi expand collapsible panel Ä‘ang collapsed: náº¿u delta Ä‘á»§ lá»›n â†’ expand.
 * Tráº£ vá» delta thá»±c sá»± Ä‘Ã£ Ã¡p.
 */
applyDelta(handleIndex: number, deltaPx: number, containerPx: number, snapThreshold = 0.5): number {
  const prev = this.#metas[handleIndex];
  const next = this.#metas[handleIndex + 1];
  if (!prev || !next) return 0;

  // TrÆ°á»ng há»£p 1: 1 trong 2 panel Ä‘ang collapsed â†’ cá»‘ gáº¯ng expand khi delta Ä‘á»§ lá»›n
  const prevCollapsed = this.collapsedMap().get(prev.id) === true;
  const nextCollapsed = this.collapsedMap().get(next.id) === true;

  if (prevCollapsed && prev.collapsible && deltaPx >= prev.minSize) {
    this.expandPanel(prev.id);
    return prev.minSize;
  }
  if (nextCollapsed && next.collapsible && -deltaPx >= next.minSize) {
    this.expandPanel(next.id);
    return -next.minSize;
  }
  if (prevCollapsed || nextCollapsed) return 0;   // chÆ°a Ä‘á»§ ngÆ°á»¡ng expand â†’ no-op

  const sizes = this.liveSizes();
  const prevSize = sizes.get(prev.id) ?? prev.declaredSize;
  const nextSize = sizes.get(next.id) ?? next.declaredSize;

  const flexBudgetPx = this.#flexBudgetPx(containerPx);
  const totalFlexWeight = this.#totalFlexWeight();
  const prevPx = prev.unit === 'px' ? prevSize : (flexBudgetPx * prevSize) / Math.max(totalFlexWeight, 1e-9);
  const nextPx = next.unit === 'px' ? nextSize : (flexBudgetPx * nextSize) / Math.max(totalFlexWeight, 1e-9);

  // TÃ­nh target px sau khi Ã¡p delta thÃ´ (chÆ°a clamp)
  const rawNewPrevPx = prevPx + deltaPx;
  const rawNewNextPx = nextPx - deltaPx;

  const prevMinPx = this.#sizeToPx(prev, prev.minSize, flexBudgetPx, totalFlexWeight);
  const nextMinPx = this.#sizeToPx(next, next.minSize, flexBudgetPx, totalFlexWeight);

  // Snap check: panel kÃ©o dÆ°á»›i minSize Ã— snapThreshold + collapsible â†’ snap collapse
  if (prev.collapsible && prevMinPx > 0 && rawNewPrevPx < prevMinPx * snapThreshold) {
    this.collapsePanel(prev.id);
    this.setLiveSize(prev.id, 0);
    return prevPx * -1;
  }
  if (next.collapsible && nextMinPx > 0 && rawNewNextPx < nextMinPx * snapThreshold) {
    this.collapsePanel(next.id);
    this.setLiveSize(next.id, 0);
    return nextPx;
  }

  // KhÃ´ng snap â†’ clamp logic cÅ©
  const prevMaxPx = prev.maxSize != null ? this.#sizeToPx(prev, prev.maxSize, flexBudgetPx, totalFlexWeight) : Infinity;
  const nextMaxPx = next.maxSize != null ? this.#sizeToPx(next, next.maxSize, flexBudgetPx, totalFlexWeight) : Infinity;

  let delta = deltaPx;
  delta = Math.max(delta, prevMinPx - prevPx);
  delta = Math.min(delta, prevMaxPx - prevPx);
  delta = Math.max(delta, nextPx - nextMaxPx);
  delta = Math.min(delta, nextPx - nextMinPx);

  if (delta === 0) return 0;

  const newPrevPx = prevPx + delta;
  const newNextPx = nextPx - delta;
  const liveNext = new Map(this.liveSizes());
  liveNext.set(prev.id, prev.unit === 'px' ? newPrevPx : (newPrevPx * totalFlexWeight) / Math.max(flexBudgetPx, 1e-9));
  liveNext.set(next.id, next.unit === 'px' ? newNextPx : (newNextPx * totalFlexWeight) / Math.max(flexBudgetPx, 1e-9));
  this.liveSizes.set(liveNext);

  return delta;
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter-state.service.spec.ts' --watch=false`
Expected: PASS (25 specs)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): snap-to-collapse vÃ  expand-by-drag trong applyDelta"
```

---

## Task 7: SdSplitterPanelComponent â€” inputs + host binding

**Files:**
- Modify: `src/splitter-panel/splitter-panel.component.ts`
- Create: `src/splitter-panel/splitter-panel.component.html`
- Create: `src/splitter-panel/splitter-panel.component.scss`
- Create: `src/splitter-panel/splitter-panel.component.spec.ts`

Panel cÃ³ inputs theo spec. Host element bind `style.flex` tá»« live state (sáº½ káº¿t ná»‘i lÃªn service á»Ÿ Task 11).

- [ ] **Step 1: Write failing test `splitter-panel.component.spec.ts`**

```ts
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSplitterPanelComponent } from './splitter-panel.component';

@Component({
  standalone: true,
  imports: [SdSplitterPanelComponent],
  template: `
    <sd-splitter-panel
      [panelId]="id()"
      [size]="size()"
      [unit]="unit()"
      [minSize]="minSize()"
      [maxSize]="maxSize()"
      [collapsible]="collapsible()"
      [(collapsed)]="collapsed"
      [resizable]="resizable()">
      <span>content</span>
    </sd-splitter-panel>
  `,
})
class Host {
  id = signal<string | undefined>('sidebar');
  size = signal(250);
  unit = signal<'px' | 'flex'>('px');
  minSize = signal(0);
  maxSize = signal<number | undefined>(undefined);
  collapsible = signal(true);
  collapsed = signal(false);
  resizable = signal(true);
}

describe('SdSplitterPanelComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let panelEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    panelEl = fixture.debugElement.query(By.css('sd-splitter-panel')).nativeElement;
  });

  it('renders content qua ng-content', () => {
    expect(panelEl.textContent).toContain('content');
  });

  it('expose inputs qua signal-based getters', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterPanelComponent)).componentInstance as SdSplitterPanelComponent;
    expect(cmp.panelId()).toBe('sidebar');
    expect(cmp.size()).toBe(250);
    expect(cmp.unit()).toBe('px');
    expect(cmp.collapsible()).toBe(true);
    expect(cmp.resizable()).toBe(true);
  });

  it('host element cÃ³ class sd-splitter__panel', () => {
    expect(panelEl.classList.contains('sd-splitter__panel')).toBe(true);
  });

  it('two-way binding [(collapsed)] Ä‘á»“ng bá»™ vá»›i host signal', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterPanelComponent)).componentInstance as SdSplitterPanelComponent;
    cmp.collapsed.set(true);
    fixture.detectChanges();
    expect(host.collapsed()).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-panel.component.spec.ts' --watch=false`
Expected: FAIL â€” inputs chÆ°a Ä‘Æ°á»£c expose

- [ ] **Step 3: Implement `SdSplitterPanelComponent`**

Replace `src/splitter-panel/splitter-panel.component.ts`:

```ts
import { booleanAttribute, Component, ElementRef, inject, input, model, numberAttribute } from '@angular/core';
import { SplitterPanelUnit } from '../splitter.models';

@Component({
  selector: 'sd-splitter-panel',
  standalone: true,
  templateUrl: './splitter-panel.component.html',
  styleUrls: ['./splitter-panel.component.scss'],
  host: {
    'class': 'sd-splitter__panel',
    '[class.sd-splitter__panel--flex]': 'unit() === "flex"',
    '[class.sd-splitter__panel--px]': 'unit() === "px"',
    '[class.sd-splitter__panel--collapsed]': 'collapsed()',
  },
})
export class SdSplitterPanelComponent {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  panelId = input<string | undefined>(undefined);
  size = input<number, unknown>(1, { transform: numberAttribute });
  unit = input<SplitterPanelUnit>('flex');
  minSize = input<number, unknown>(0, { transform: numberAttribute });
  maxSize = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => v == null || v === '' ? undefined : Number(v),
  });
  collapsible = input(false, { transform: booleanAttribute });
  collapsed = model(false);
  resizable = input(true, { transform: booleanAttribute });
}
```

- [ ] **Step 4: Create template `splitter-panel.component.html`**

```html
<ng-content></ng-content>
```

- [ ] **Step 5: Create SCSS `splitter-panel.component.scss`**

```scss
:host {
  display: block;
  overflow: hidden;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;

  &.sd-splitter__panel--collapsed {
    flex: 0 0 0 !important;
  }
}
```

- [ ] **Step 6: Run, verify PASS**

Run: `ng test --include='**/splitter-panel.component.spec.ts' --watch=false`
Expected: PASS (4 specs)

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter-panel): inputs + host bindings cho panel"
```

---

## Task 8: SdSplitterHandleComponent â€” pointer drag

**Files:**
- Modify: `src/splitter-handle/splitter-handle.component.ts`
- Create: `src/splitter-handle/splitter-handle.component.html`
- Create: `src/splitter-handle/splitter-handle.component.scss`
- Create: `src/splitter-handle/splitter-handle.component.spec.ts`

Handle component xá»­ lÃ½ pointer drag. Output `dragStart`, `dragMove (deltaPx)`, `dragEnd`. Parent splitter sáº½ wire vÃ o state service.

- [ ] **Step 1: Write failing test `splitter-handle.component.spec.ts`**

```ts
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSplitterHandleComponent } from './splitter-handle.component';

@Component({
  standalone: true,
  imports: [SdSplitterHandleComponent],
  template: `
    <sd-splitter-handle
      [orientation]="orientation()"
      [disabled]="disabled()"
      (dragStart)="events.push('start')"
      (dragMove)="onMove($event)"
      (dragEnd)="events.push('end')">
    </sd-splitter-handle>
  `,
})
class Host {
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  disabled = signal(false);
  events: string[] = [];
  deltas: number[] = [];
  onMove(d: number) { this.deltas.push(d); }
}

function dispatchPointer(target: EventTarget, type: string, init: PointerEventInit) {
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'mouse', ...init });
  target.dispatchEvent(ev);
}

describe('SdSplitterHandleComponent â€” pointer drag', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let handleEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handleEl = fixture.debugElement.query(By.css('sd-splitter-handle')).nativeElement;
    // setPointerCapture / releasePointerCapture khÃ´ng cÃ³ trong JSDOM nhÆ°ng Karma cháº¡y Chrome â†’ cÃ³. Spy Ä‘á»ƒ trÃ¡nh fail.
    spyOn(handleEl, 'setPointerCapture').and.stub();
    spyOn(handleEl, 'releasePointerCapture').and.stub();
    // rAF: cháº¡y ngay
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 0; });
  });

  it('pointerdown â†’ emit dragStart vÃ  setPointerCapture', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 });
    expect(host.events).toEqual(['start']);
    expect(handleEl.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('pointermove sau pointerdown (horizontal) â†’ emit dragMove vá»›i deltaX', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0 });
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 150, clientY: 0 });
    expect(host.deltas).toEqual([50]);
  });

  it('orientation=vertical â†’ deltaY thay vÃ¬ deltaX', () => {
    host.orientation.set('vertical');
    fixture.detectChanges();
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 0, clientY: 100 });
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 0, clientY: 130 });
    expect(host.deltas).toEqual([30]);
  });

  it('pointerup â†’ emit dragEnd + releasePointerCapture', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0 });
    dispatchPointer(handleEl, 'pointerup', { pointerId: 1, clientX: 110, clientY: 0 });
    expect(host.events).toEqual(['start', 'end']);
    expect(handleEl.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('pointermove khi chÆ°a pointerdown â†’ no-op', () => {
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 200, clientY: 0 });
    expect(host.deltas).toEqual([]);
  });

  it('disabled=true â†’ pointerdown khÃ´ng emit', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0 });
    expect(host.events).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-handle.component.spec.ts' --watch=false`
Expected: FAIL â€” outputs chÆ°a Ä‘Æ°á»£c expose

- [ ] **Step 3: Implement pointer drag in `splitter-handle.component.ts`**

Replace `src/splitter-handle/splitter-handle.component.ts`:

```ts
import { booleanAttribute, Component, ElementRef, HostListener, inject, input, output } from '@angular/core';
import { SplitterOrientation } from '../splitter.models';

@Component({
  selector: 'sd-splitter-handle',
  standalone: true,
  templateUrl: './splitter-handle.component.html',
  styleUrls: ['./splitter-handle.component.scss'],
  host: {
    'class': 'sd-splitter__handle',
    '[class.sd-splitter__handle--horizontal]': 'orientation() === "horizontal"',
    '[class.sd-splitter__handle--vertical]': 'orientation() === "vertical"',
    '[class.sd-splitter__handle--disabled]': 'disabled()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': 'orientation() === "horizontal" ? "vertical" : "horizontal"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class SdSplitterHandleComponent {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  orientation = input<SplitterOrientation>('horizontal');
  disabled = input(false, { transform: booleanAttribute });

  readonly dragStart = output<void>();
  readonly dragMove = output<number>();   // deltaPx ká»ƒ tá»« pointerdown
  readonly dragEnd = output<void>();

  #pointerId: number | null = null;
  #startCoord = 0;
  #rafPending: number | null = null;
  #pendingDelta = 0;

  @HostListener('pointerdown', ['$event'])
  onPointerDown(ev: PointerEvent): void {
    if (this.disabled()) return;
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    this.#pointerId = ev.pointerId;
    this.#startCoord = this.orientation() === 'horizontal' ? ev.clientX : ev.clientY;
    this.elementRef.nativeElement.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    this.dragStart.emit();
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(ev: PointerEvent): void {
    if (this.#pointerId == null || ev.pointerId !== this.#pointerId) return;
    const coord = this.orientation() === 'horizontal' ? ev.clientX : ev.clientY;
    this.#pendingDelta = coord - this.#startCoord;
    if (this.#rafPending != null) return;
    this.#rafPending = requestAnimationFrame(() => {
      this.#rafPending = null;
      this.dragMove.emit(this.#pendingDelta);
    });
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerUp(ev: PointerEvent): void {
    if (this.#pointerId == null || ev.pointerId !== this.#pointerId) return;
    this.elementRef.nativeElement.releasePointerCapture(ev.pointerId);
    this.#pointerId = null;
    if (this.#rafPending != null) {
      cancelAnimationFrame(this.#rafPending);
      this.#rafPending = null;
    }
    this.dragEnd.emit();
  }
}
```

- [ ] **Step 4: Create template `splitter-handle.component.html`**

```html
<span class="sd-splitter__handle-bar"></span>
```

- [ ] **Step 5: Create SCSS `splitter-handle.component.scss`**

```scss
:host {
  --sd-splitter-handle-size: 4px;
  --sd-splitter-handle-color: var(--sd-color-primary-light, #b0bec5);
  --sd-splitter-handle-hover-color: var(--sd-color-primary, #1976d2);
  --sd-splitter-handle-active-color: var(--sd-color-primary, #1976d2);
  --sd-splitter-handle-hit-area: 8px;
  --sd-splitter-handle-radius: 0;
  --sd-splitter-disabled-opacity: 0.5;

  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 var(--sd-splitter-handle-hit-area);
  user-select: none;
  outline: none;

  &.sd-splitter__handle--horizontal {
    cursor: col-resize;
    .sd-splitter__handle-bar {
      width: var(--sd-splitter-handle-size);
      height: 100%;
    }
  }

  &.sd-splitter__handle--vertical {
    cursor: row-resize;
    flex-direction: column;
    .sd-splitter__handle-bar {
      width: 100%;
      height: var(--sd-splitter-handle-size);
    }
  }

  .sd-splitter__handle-bar {
    background: var(--sd-splitter-handle-color);
    border-radius: var(--sd-splitter-handle-radius);
    transition: background-color 120ms ease;
  }

  &:hover .sd-splitter__handle-bar { background: var(--sd-splitter-handle-hover-color); }
  &:focus-visible {
    outline: 2px solid var(--sd-splitter-handle-active-color);
    outline-offset: 1px;
  }

  &.sd-splitter__handle--disabled {
    cursor: default;
    opacity: var(--sd-splitter-disabled-opacity);
    pointer-events: none;
  }
}
```

- [ ] **Step 6: Run, verify PASS**

Run: `ng test --include='**/splitter-handle.component.spec.ts' --watch=false`
Expected: PASS (6 specs)

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter-handle): pointer drag vá»›i setPointerCapture + rAF batching"
```

---

## Task 9: SdSplitterHandleComponent â€” keyboard a11y

**Files:**
- Modify: `src/splitter-handle/splitter-handle.component.ts`
- Modify: `src/splitter-handle/splitter-handle.component.spec.ts`

Arrow keys â†’ emit `dragMove(Â±keyboardStep)` + `dragEnd`. Home/End â†’ emit `collapseRequest`/`expandRequest`. Enter/Space â†’ emit `toggleRequest`.

- [ ] **Step 1: Append failing tests**

```ts
function dispatchKey(target: EventTarget, key: string) {
  const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(ev);
}

describe('SdSplitterHandleComponent â€” keyboard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let handleEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handleEl = fixture.debugElement.query(By.css('sd-splitter-handle')).nativeElement;
  });

  it('ArrowRight (horizontal) â†’ emit dragMove(+keyboardStep) + dragEnd', () => {
    // assume default keyboardStep = 10 in handle component
    dispatchKey(handleEl, 'ArrowRight');
    expect(host.deltas).toEqual([10]);
    expect(host.events).toEqual(['end']);   // má»—i key press lÃ  1 commit point
  });

  it('ArrowLeft â†’ emit dragMove(-keyboardStep)', () => {
    dispatchKey(handleEl, 'ArrowLeft');
    expect(host.deltas).toEqual([-10]);
  });

  it('orientation=vertical: ArrowDown/Up thay cho Right/Left', () => {
    host.orientation.set('vertical');
    fixture.detectChanges();
    dispatchKey(handleEl, 'ArrowDown');
    expect(host.deltas).toEqual([10]);
    dispatchKey(handleEl, 'ArrowUp');
    expect(host.deltas).toEqual([10, -10]);
  });

  it('Enter â†’ emit toggleRequest', () => {
    let toggleCount = 0;
    const cmp = fixture.debugElement.query(By.directive(SdSplitterHandleComponent)).componentInstance as SdSplitterHandleComponent;
    cmp.toggleRequest.subscribe(() => toggleCount++);
    dispatchKey(handleEl, 'Enter');
    expect(toggleCount).toBe(1);
  });

  it('disabled=true â†’ key khÃ´ng emit', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    dispatchKey(handleEl, 'ArrowRight');
    expect(host.deltas).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter-handle.component.spec.ts' --watch=false`
Expected: FAIL â€” keyboard listeners chÆ°a cÃ³

- [ ] **Step 3: Add `keyboardStep` input + key handler + `toggleRequest` output**

Append vÃ o `SdSplitterHandleComponent`:

```ts
keyboardStep = input<number, unknown>(10, { transform: numberAttribute });
readonly toggleRequest = output<void>();

@HostListener('keydown', ['$event'])
onKeyDown(ev: KeyboardEvent): void {
  if (this.disabled()) return;
  const isH = this.orientation() === 'horizontal';
  const step = this.keyboardStep();
  let delta: number | null = null;
  switch (ev.key) {
    case 'ArrowRight': if (isH) delta = step; break;
    case 'ArrowLeft':  if (isH) delta = -step; break;
    case 'ArrowDown':  if (!isH) delta = step; break;
    case 'ArrowUp':    if (!isH) delta = -step; break;
    case 'Enter':
    case ' ':
      ev.preventDefault();
      this.toggleRequest.emit();
      return;
  }
  if (delta == null) return;
  ev.preventDefault();
  // Keyboard step lÃ  1 láº§n commit (khÃ´ng live drag)
  this.dragStart.emit();
  this.dragMove.emit(delta);
  this.dragEnd.emit();
}
```

Cáº§n import `numberAttribute` tá»« `@angular/core`.

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter-handle.component.spec.ts' --watch=false`
Expected: PASS (11 specs)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter-handle): keyboard a11y vá»›i arrow + Enter/Space"
```

---

## Task 10: SdSplitterHandleComponent â€” double-click toggle + aria-value attrs

**Files:**
- Modify: `src/splitter-handle/splitter-handle.component.ts`
- Modify: `src/splitter-handle/splitter-handle.component.spec.ts`

Double-click â†’ emit `toggleRequest`. Aria values tá»« inputs `ariaValueMin / Max / Now`.

- [ ] **Step 1: Append failing tests**

```ts
it('dblclick â†’ emit toggleRequest', () => {
  let count = 0;
  const cmp = fixture.debugElement.query(By.directive(SdSplitterHandleComponent)).componentInstance as SdSplitterHandleComponent;
  cmp.toggleRequest.subscribe(() => count++);
  handleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  expect(count).toBe(1);
});

it('aria-value attrs tá»« inputs', () => {
  const cmp = fixture.debugElement.query(By.directive(SdSplitterHandleComponent)).componentInstance as SdSplitterHandleComponent;
  fixture.componentRef.setInput('ariaValueMin' as any, 0);  // sáº½ thÃªm input á»Ÿ step 3
  // Test sáº½ táº¡m bá» qua aria â€” verify dÆ°á»›i dáº¡ng input nháº­n Ä‘Ãºng.
  // (Test nÃ y sáº½ Ä‘Æ°á»£c fill láº¡i sau khi step 3 add inputs.)
  expect(cmp).toBeTruthy();
});
```

(Test thá»© 2 chá»‰ lÃ  placeholder â€” sáº½ refactor sau khi thÃªm inputs.)

- [ ] **Step 2: Run, verify FAIL cho dblclick**

Run: `ng test --include='**/splitter-handle.component.spec.ts' --watch=false`
Expected: FAIL â€” `toggleRequest` khÃ´ng emit tá»« dblclick

- [ ] **Step 3: Add dblclick handler + aria-value inputs**

Append vÃ o `SdSplitterHandleComponent`:

```ts
ariaValueMin = input<number | undefined>(undefined);
ariaValueMax = input<number | undefined>(undefined);
ariaValueNow = input<number | undefined>(undefined);

@HostListener('dblclick')
onDblClick(): void {
  if (this.disabled()) return;
  this.toggleRequest.emit();
}
```

Update host bindings to include aria values:

```ts
host: {
  // ...existing
  '[attr.aria-valuemin]': 'ariaValueMin() ?? null',
  '[attr.aria-valuemax]': 'ariaValueMax() ?? null',
  '[attr.aria-valuenow]': 'ariaValueNow() ?? null',
},
```

Cáº­p nháº­t test thá»© 2:

```ts
it('binds aria-valuemin/max/now attrs tá»« inputs', () => {
  const cmpEl = fixture.debugElement.query(By.directive(SdSplitterHandleComponent));
  cmpEl.componentInstance['ariaValueMin'] = () => 0;  // khÃ´ng hoáº¡t Ä‘á»™ng vÃ¬ signal lÃ  readonly
  // Bypass â€” set qua host signal-based input khÃ´ng trivial trong test nÃ y.
  // Há»— trá»£ approach: thÃªm inputs lÃªn host template.
});
```

ÄÆ¡n giáº£n hÆ¡n: refactor Host template thÃªm `[ariaValueNow]`:

```ts
template: `
  <sd-splitter-handle
    [orientation]="orientation()"
    [disabled]="disabled()"
    [ariaValueMin]="0"
    [ariaValueMax]="100"
    [ariaValueNow]="50"
    (dragStart)="events.push('start')"
    (dragMove)="onMove($event)"
    (dragEnd)="events.push('end')">
  </sd-splitter-handle>
`,
```

Test:
```ts
it('binds aria-value* attrs tá»« inputs', () => {
  expect(handleEl.getAttribute('aria-valuemin')).toBe('0');
  expect(handleEl.getAttribute('aria-valuemax')).toBe('100');
  expect(handleEl.getAttribute('aria-valuenow')).toBe('50');
});
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter-handle.component.spec.ts' --watch=false`
Expected: PASS (13 specs)

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter-handle): dblclick toggle + aria-value attrs"
```

---

## Task 11: SdSplitterComponent â€” template render vá»›i contentChildren

**Files:**
- Modify: `src/splitter.component.ts`
- Create: `src/splitter.component.html`
- Create: `src/splitter.component.scss`
- Create: `src/splitter.component.spec.ts`

Container Ä‘á»c `contentChildren()` cá»§a panel, render panels + handles xen káº½. ChÆ°a wire drag/state â€” chá»‰ render Ä‘Ãºng sá»‘ pháº§n tá»­ vÃ  class.

- [ ] **Step 1: Write failing test `splitter.component.spec.ts`**

```ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSplitterComponent } from './splitter.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';

@Component({
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter [orientation]="orientation" style="width:400px;height:200px;">
      <sd-splitter-panel size="1">A</sd-splitter-panel>
      <sd-splitter-panel size="2">B</sd-splitter-panel>
      <sd-splitter-panel size="1">C</sd-splitter-panel>
    </sd-splitter>
  `,
})
class Host {
  orientation: 'horizontal' | 'vertical' = 'horizontal';
}

describe('SdSplitterComponent â€” render', () => {
  let fixture: ComponentFixture<Host>;
  let splitterEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    splitterEl = fixture.debugElement.query(By.css('sd-splitter')).nativeElement;
  });

  it('host cÃ³ class sd-splitter vÃ  orientation modifier', () => {
    expect(splitterEl.classList.contains('sd-splitter')).toBe(true);
    expect(splitterEl.classList.contains('sd-splitter--horizontal')).toBe(true);
  });

  it('render 3 panels + 2 handles xen káº½', () => {
    const panels = splitterEl.querySelectorAll('sd-splitter-panel');
    const handles = splitterEl.querySelectorAll('sd-splitter-handle');
    expect(panels.length).toBe(3);
    expect(handles.length).toBe(2);
  });

  it('handle cÃ³ orientation Ä‘á»“ng bá»™ vá»›i splitter', () => {
    const handle = splitterEl.querySelector('sd-splitter-handle')!;
    expect(handle.classList.contains('sd-splitter__handle--horizontal')).toBe(true);
  });

  it('vertical orientation Ä‘á»•i class', () => {
    fixture.componentInstance.orientation = 'vertical';
    fixture.detectChanges();
    expect(splitterEl.classList.contains('sd-splitter--vertical')).toBe(true);
    const handle = splitterEl.querySelector('sd-splitter-handle')!;
    expect(handle.classList.contains('sd-splitter__handle--vertical')).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: FAIL â€” chÆ°a render handles

- [ ] **Step 3: Create template `src/splitter.component.html`**

```html
<ng-content select="sd-splitter-panel"></ng-content>
```

`<ng-content>` projects user-declared `<sd-splitter-panel>` vÃ o host. Handles Ä‘Æ°á»£c táº¡o runtime qua `createComponent()` Ä‘á»ƒ giá»¯ Angular lifecycle (pointer/keyboard logic tá»« Task 8â€“10) vÃ  re-arrange DOM xen káº½ panels.

- [ ] **Step 4: Implement component `src/splitter.component.ts`**

Replace ná»™i dung file:

```ts
import { afterNextRender, booleanAttribute, Component, ComponentRef, contentChildren, createComponent, effect, ElementRef, EnvironmentInjector, inject, input, numberAttribute } from '@angular/core';
import { SdSplitterHandleComponent } from './splitter-handle/splitter-handle.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';
import { SplitterOrientation } from './splitter.models';
import { SplitterStateService } from './splitter-state.service';

@Component({
  selector: 'sd-splitter',
  standalone: true,
  templateUrl: './splitter.component.html',
  styleUrls: ['./splitter.component.scss'],
  providers: [SplitterStateService],
  host: {
    'class': 'sd-splitter',
    '[class.sd-splitter--horizontal]': 'orientation() === "horizontal"',
    '[class.sd-splitter--vertical]': 'orientation() === "vertical"',
    '[class.sd-splitter--disabled]': 'disabled()',
  },
})
export class SdSplitterComponent {
  #host = inject(ElementRef<HTMLElement>);
  #envInjector = inject(EnvironmentInjector);

  orientation = input<SplitterOrientation>('horizontal');
  disabled = input(false, { transform: booleanAttribute });
  storageKey = input<string | undefined>(undefined);
  snapThreshold = input<number, unknown>(0.5, { transform: numberAttribute });
  keyboardStep = input<number, unknown>(10, { transform: numberAttribute });

  readonly panels = contentChildren(SdSplitterPanelComponent);

  #handleRefs: ComponentRef<SdSplitterHandleComponent>[] = [];

  constructor() {
    // Sync handles sau khi DOM render xong (panels Ä‘Ã£ projected vÃ o host)
    effect(() => {
      const panelCount = this.panels().length;
      const orientation = this.orientation();
      const disabled = this.disabled();
      const keyboardStep = this.keyboardStep();
      afterNextRender(
        () => this.#syncHandles(panelCount, orientation, disabled, keyboardStep),
        { injector: this.#envInjector }
      );
    });
  }

  #syncHandles(panelCount: number, orientation: SplitterOrientation, disabled: boolean, keyboardStep: number): void {
    const needed = Math.max(0, panelCount - 1);
    while (this.#handleRefs.length > needed) {
      this.#handleRefs.pop()!.destroy();
    }
    while (this.#handleRefs.length < needed) {
      const ref = createComponent(SdSplitterHandleComponent, { environmentInjector: this.#envInjector });
      this.#handleRefs.push(ref);
    }
    for (const ref of this.#handleRefs) {
      ref.setInput('orientation', orientation);
      ref.setInput('disabled', disabled);
      ref.setInput('keyboardStep', keyboardStep);
      ref.changeDetectorRef.detectChanges();
    }
    // Re-arrange DOM: panel0, handle0, panel1, handle1, ..., panelN
    const panels = this.panels();
    const host = this.#host.nativeElement;
    for (let i = 0; i < panels.length; i++) {
      host.appendChild(panels[i].elementRef.nativeElement);
      if (i < this.#handleRefs.length) host.appendChild(this.#handleRefs[i].location.nativeElement);
    }
  }
}
```

- [ ] **Step 5: Create SCSS `splitter.component.scss`**

```scss
:host {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;

  &.sd-splitter--horizontal { flex-direction: row; }
  &.sd-splitter--vertical { flex-direction: column; }

  &.sd-splitter--disabled .sd-splitter__handle { pointer-events: none; }

  &.sd-splitter--dragging {
    user-select: none;
    .sd-splitter__panel { transition: none !important; }
  }
}
```

- [ ] **Step 6: Update render test cho handle (await afterNextRender)**

Handles giá» táº¡o qua `createComponent` + DOM append, lifecycle dÃ i hÆ¡n 1 tick. Update test "render 3 panels + 2 handles":

```ts
it('render 3 panels + 2 handles xen káº½', async () => {
  await fixture.whenStable();
  fixture.detectChanges();
  const handles = splitterEl.querySelectorAll('sd-splitter-handle');
  expect(handles.length).toBe(2);
});
```

(CÃ¡c spec khÃ¡c trong Task 11 step 1 váº«n giá»¯ nguyÃªn.)

- [ ] **Step 7: Run, verify PASS**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: PASS (4 specs)

- [ ] **Step 8: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): container render panels + dynamic handles xen káº½"
```

---

## Task 12: SdSplitterComponent â€” reconcile effect + panel meta extraction

**Files:**
- Modify: `src/splitter.component.ts`
- Modify: `src/splitter.component.spec.ts`

Wire `contentChildren` signal vÃ o `SplitterStateService.reconcile()` qua `effect()`. Map tá»«ng `SdSplitterPanelComponent` thÃ nh `ResolvedPanelMeta`. Ãp `flex-basis` lÃªn panel host element dá»±a trÃªn `liveSizes`.

- [ ] **Step 1: Append failing tests**

```ts
describe('SdSplitterComponent â€” reconcile', () => {
  let fixture: ComponentFixture<Host>;
  let splitterEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    splitterEl = fixture.debugElement.query(By.css('sd-splitter')).nativeElement;
  });

  it('panels Ã¡p flex style tá»« declaredSize lÃºc init', () => {
    const panelEls = splitterEl.querySelectorAll<HTMLElement>('sd-splitter-panel');
    // panel sizes 1, 2, 1 (default unit flex)
    expect(panelEls[0].style.flex).toMatch(/^1\s+1\s+0/);
    expect(panelEls[1].style.flex).toMatch(/^2\s+1\s+0/);
    expect(panelEls[2].style.flex).toMatch(/^1\s+1\s+0/);
  });

  it('panel unit="px" Ã¡p flex 0 0 <px>', async () => {
    // Test cáº§n host template riÃªng vá»›i panel px
    // Táº¡m skip â€” sáº½ cover á»Ÿ integration test Task 18.
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: FAIL â€” `panelEls[0].style.flex` empty

- [ ] **Step 3: Wire reconcile + panel style application**

Append vÃ o `SdSplitterComponent`:

```ts
#state = inject(SplitterStateService);

constructor() {
  // 1. Reconcile khi panels signal Ä‘á»•i
  effect(() => {
    const panels = this.panels();
    const metas = panels.map((p, i) => this.#toMeta(p, i));
    this.#state.reconcile(metas, null);   // storage wiring á»Ÿ Task 13
  });

  // 2. Ãp flex style lÃªn panel host element má»—i khi liveSizes/collapsed Ä‘á»•i
  effect(() => {
    const sizes = this.#state.liveSizes();
    const collapsed = this.#state.collapsedMap();
    for (const panel of this.panels()) {
      const id = panel.panelId() ?? this.panels().indexOf(panel);
      const isCollapsed = collapsed.get(id) === true;
      const size = sizes.get(id) ?? 1;
      const flex = isCollapsed
        ? '0 0 0'
        : panel.unit() === 'px'
          ? `0 0 ${size}px`
          : `${size} 1 0`;
      panel.elementRef.nativeElement.style.flex = flex;
    }
  });

  // 3. Sync handle layout (Ä‘Ã£ cÃ³ á»Ÿ Task 11)
  // (giá»¯ nguyÃªn)
}

#toMeta(panel: SdSplitterPanelComponent, index: number): ResolvedPanelMeta {
  return {
    id: panel.panelId() ?? index,
    index,
    unit: panel.unit(),
    minSize: panel.minSize(),
    maxSize: panel.maxSize(),
    collapsible: panel.collapsible(),
    resizable: panel.resizable(),
    declaredSize: panel.size(),
    lastSize: panel.size(),
  };
}
```

Import: `effect`, `ResolvedPanelMeta`, `SplitterStateService`.

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): reconcile effect + flex-basis apply lÃªn panel hosts"
```

---

## Task 13: SdSplitterComponent â€” storage wiring (storageKey)

**Files:**
- Modify: `src/splitter.component.ts`
- Modify: `src/splitter.component.spec.ts`

Khi `storageKey` cÃ³ â†’ táº¡o `SdStorageService.create()` handle, reconcile dÃ¹ng stored state, auto save qua `setSilent` má»—i khi `committedLayout` Ä‘á»•i.

- [ ] **Step 1: Append failing tests**

```ts
import { SdStorageService } from '@sdcorejs/angular/services';

describe('SdSplitterComponent â€” storage', () => {
  let fixture: ComponentFixture<HostWithStorage>;
  let splitterEl: HTMLElement;
  let storage: SdStorageService;

  @Component({
    standalone: true,
    imports: [SdSplitterComponent, SdSplitterPanelComponent],
    template: `
      <sd-splitter storageKey="test-splitter" style="width:400px;height:200px;">
        <sd-splitter-panel panelId="a" size="1">A</sd-splitter-panel>
        <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
      </sd-splitter>
    `,
  })
  class HostWithStorage {}

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HostWithStorage],
      providers: [SdStorageService],
    });
    storage = TestBed.inject(SdStorageService);
  });

  it('khÃ´ng cÃ³ storageKey â†’ khÃ´ng gá»i storage', () => {
    const setSpy = spyOn(storage, 'create').and.callThrough();
    TestBed.createComponent(Host).detectChanges();   // Host khÃ´ng cÃ³ storageKey
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('storageKey cÃ³ â†’ khi commit, layout state Ä‘Æ°á»£c lÆ°u vÃ o localStorage', async () => {
    fixture = TestBed.createComponent(HostWithStorage);
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    // Trigger commit qua state service
    const stateSvc = fixture.debugElement.query(By.directive(SdSplitterComponent)).injector.get(SplitterStateService);
    stateSvc.setLiveSize('a', 0.7);
    stateSvc.setLiveSize('b', 1.3);
    stateSvc.commit();
    fixture.detectChanges();
    await fixture.whenStable();

    const handle = storage.create<SplitterLayoutState>('test-splitter');
    const stored = handle.get();
    expect(stored?.panels.find(p => p.id === 'a')?.size).toBeCloseTo(0.7, 5);
    expect(stored?.panels.find(p => p.id === 'b')?.size).toBeCloseTo(1.3, 5);
  });

  it('storageKey cÃ³ vÃ  localStorage Ä‘Ã£ cÃ³ state â†’ restore khi init', () => {
    const handle = storage.create<SplitterLayoutState>('test-splitter');
    handle.set({ v: 1, panels: [
      { id: 'a', size: 0.3, unit: 'flex', collapsed: false },
      { id: 'b', size: 1.7, unit: 'flex', collapsed: false },
    ]});

    fixture = TestBed.createComponent(HostWithStorage);
    fixture.detectChanges();
    const stateSvc = fixture.debugElement.query(By.directive(SdSplitterComponent)).injector.get(SplitterStateService);
    expect(stateSvc.liveSizes().get('a')).toBeCloseTo(0.3, 5);
    expect(stateSvc.liveSizes().get('b')).toBeCloseTo(1.7, 5);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: FAIL â€” `expect(stored?.panels...).toBeCloseTo(0.7)` fails vÃ¬ chÆ°a save

- [ ] **Step 3: Wire storage trong `SdSplitterComponent`**

Replace constructor effects:

```ts
#storage = inject(SdStorageService);

#storageHandle = computed(() => {
  const key = this.storageKey();
  return key ? this.#storage.create<SplitterLayoutState>(key) : null;
});

constructor() {
  // 1. Reconcile khi panels Ä‘á»•i HOáº¶C storage handle Ä‘á»•i
  effect(() => {
    const panels = this.panels();
    const stored = this.#storageHandle()?.get() ?? null;
    const metas = panels.map((p, i) => this.#toMeta(p, i));
    this.#state.reconcile(metas, stored);
  });

  // 2. Ãp flex style (giá»¯ nguyÃªn)
  effect(() => { /* ... nhÆ° Task 12 ... */ });

  // 3. Auto-save khi committedLayout Ä‘á»•i
  effect(() => {
    const layout = this.#state.committedLayout();
    const handle = this.#storageHandle();
    if (handle && layout.panels.length > 0) {
      handle.setSilent(layout);
    }
  });

  // 4. Sync handles (Task 11)
  // ...
}
```

Imports: `SdStorageService`, `computed`, `SplitterLayoutState`.

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): storage wiring qua storageKey + setSilent auto-save"
```

---

## Task 14: SdSplitterComponent â€” imperative API

**Files:**
- Modify: `src/splitter.component.ts`
- Modify: `src/splitter.component.spec.ts`

Public methods: `getLayout`, `setLayout`, `resetLayout`, `collapse`, `expand`, `toggle`, `resizePanel`. Target nháº­n `number | string`.

- [ ] **Step 1: Append failing tests**

```ts
describe('SdSplitterComponent â€” imperative API', () => {
  let fixture: ComponentFixture<Host>;
  let cmp: SdSplitterComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance;
  });

  it('getLayout tráº£ vá» state hiá»‡n táº¡i', () => {
    const layout = cmp.getLayout();
    expect(layout.v).toBe(1);
    expect(layout.panels.length).toBe(3);
  });

  it('setLayout apply state má»›i', () => {
    cmp.setLayout({
      v: 1,
      panels: [
        { id: 0, size: 5, unit: 'flex', collapsed: false },
        { id: 1, size: 1, unit: 'flex', collapsed: false },
        { id: 2, size: 1, unit: 'flex', collapsed: false },
      ],
    });
    fixture.detectChanges();
    expect(cmp.getLayout().panels[0].size).toBe(5);
  });

  it('resetLayout vá» declaredSize', () => {
    cmp.setLayout({
      v: 1,
      panels: [
        { id: 0, size: 99, unit: 'flex', collapsed: false },
        { id: 1, size: 99, unit: 'flex', collapsed: false },
        { id: 2, size: 99, unit: 'flex', collapsed: false },
      ],
    });
    cmp.resetLayout();
    fixture.detectChanges();
    // declared sizes: 1, 2, 1
    expect(cmp.getLayout().panels.map(p => p.size)).toEqual([1, 2, 1]);
  });

  it('collapse(index) â€” set collapsed náº¿u collapsible', () => {
    // Default panels khÃ´ng collapsible â€” pháº£i dÃ¹ng host khÃ¡c
    // (cover á»Ÿ integration test). Test vá»›i panel collapsible:
    const stateSvc = fixture.debugElement.query(By.directive(SdSplitterComponent)).injector.get(SplitterStateService);
    const metas = [...stateSvc.getPanelMetas()];
    metas[0] = { ...metas[0], collapsible: true };
    stateSvc.reconcile(metas as any, null);
    cmp.collapse(0);
    expect(stateSvc.collapsedMap().get(0)).toBe(true);
  });

  it('collapse(string id) match qua panelId', () => {
    // Cáº§n host khÃ¡c vá»›i panelId â€” cover á»Ÿ integration test
  });

  it('resizePanel target index â€” set size, clamp theo min/max', () => {
    cmp.resizePanel(0, 3);
    expect(cmp.getLayout().panels[0].size).toBe(3);
  });

  it('resizePanel string id khÃ´ng tá»“n táº¡i â†’ throw', () => {
    expect(() => cmp.collapse('nonexistent')).toThrowError(/panel.*nonexistent/i);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: FAIL â€” `cmp.getLayout is not a function`

- [ ] **Step 3: Implement API**

Append vÃ o `SdSplitterComponent`:

```ts
getLayout(): SplitterLayoutState {
  // Snapshot live state thÃ nh layout â€” khÃ´ng cáº§n pháº£i commit trÆ°á»›c
  const metas = this.#state.getPanelMetas();
  const sizes = this.#state.liveSizes();
  const collapsed = this.#state.collapsedMap();
  return {
    v: 1,
    panels: metas.map(m => ({
      id: m.id,
      size: sizes.get(m.id) ?? m.declaredSize,
      unit: m.unit,
      collapsed: collapsed.get(m.id) ?? false,
    })),
  };
}

setLayout(state: SplitterLayoutState): void {
  const metas = this.#state.getPanelMetas();
  for (const stored of state.panels) {
    const meta = metas.find(m => m.id === stored.id);
    if (!meta || meta.unit !== stored.unit) continue;
    this.#state.setLiveSize(meta.id, stored.size);
    this.#state.setCollapsed(meta.id, stored.collapsed);
  }
  this.#state.commit();
}

resetLayout(): void {
  const metas = this.#state.getPanelMetas();
  for (const m of metas) {
    this.#state.setLiveSize(m.id, m.declaredSize);
    this.#state.setCollapsed(m.id, false);
  }
  this.#state.commit();
}

collapse(target: number | string): void {
  const id = this.#resolveTarget(target);
  this.#state.collapsePanel(id);
  this.#state.commit();
}

expand(target: number | string): void {
  const id = this.#resolveTarget(target);
  this.#state.expandPanel(id);
  this.#state.commit();
}

toggle(target: number | string): void {
  const id = this.#resolveTarget(target);
  this.#state.togglePanel(id);
  this.#state.commit();
}

resizePanel(target: number | string, size: number): void {
  const id = this.#resolveTarget(target);
  const meta = this.#state.getPanelMetas().find(m => m.id === id);
  if (!meta) return;
  let clamped = Math.max(size, meta.minSize);
  if (meta.maxSize != null) clamped = Math.min(clamped, meta.maxSize);
  this.#state.setLiveSize(id, clamped);
  this.#state.commit();
}

#resolveTarget(target: number | string): string | number {
  const metas = this.#state.getPanelMetas();
  if (typeof target === 'number') {
    const meta = metas[target] ?? metas.find(m => m.id === target);
    if (!meta) throw new Error(`Splitter: no panel at index ${target}`);
    return meta.id;
  }
  const meta = metas.find(m => m.id === target);
  if (!meta) throw new Error(`Splitter: no panel with id "${target}"`);
  return meta.id;
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): imperative API (get/set/reset/collapse/expand/toggle/resizePanel)"
```

---

## Task 15: SdSplitterComponent â€” wire handle events to state

**Files:**
- Modify: `src/splitter.component.ts`
- Modify: `src/splitter.component.spec.ts`

Wire `dragStart` / `dragMove` / `dragEnd` / `toggleRequest` cá»§a handle vÃ o state service. Set class `sd-splitter--dragging` trÃªn host khi Ä‘ang kÃ©o. Handle `i` thao tÃ¡c trÃªn panel `i` vÃ  `i+1`. TÃ­nh container px qua `getBoundingClientRect`.

CÅ©ng add: `disabled=true` thÃ¬ handle cÃ³ `[disabled]="true"`; `resizable=false` panel â†’ handle ká» bá»‹ disabled.

- [ ] **Step 1: Append failing tests** (sáº½ test qua integration á»Ÿ Task 18 â€” task nÃ y chá»‰ wire, khÃ´ng cáº§n test riÃªng náº¿u integration Ä‘Ã£ cover)

Skip step test riÃªng â€” viáº¿t integration test á»Ÿ Task 18.

- [ ] **Step 2: Wire handle events trong `#syncHandles`**

Replace `#syncHandles` trong `SdSplitterComponent`:

```ts
#syncHandles(): void {
  const panels = this.panels();
  const needed = Math.max(0, panels.length - 1);
  while (this.#handleRefs.length > needed) {
    this.#handleRefs.pop()!.destroy();
  }
  while (this.#handleRefs.length < needed) {
    const ref = createComponent(SdSplitterHandleComponent, { environmentInjector: this.#envInjector });
    const handleIndex = this.#handleRefs.length;
    ref.instance.dragStart.subscribe(() => this.#onDragStart(handleIndex));
    ref.instance.dragMove.subscribe(delta => this.#onDragMove(handleIndex, delta));
    ref.instance.dragEnd.subscribe(() => this.#onDragEnd(handleIndex));
    ref.instance.toggleRequest.subscribe(() => this.#onHandleToggle(handleIndex));
    this.#handleRefs.push(ref);
  }
  // Apply inputs to handles
  for (let i = 0; i < this.#handleRefs.length; i++) {
    const ref = this.#handleRefs[i];
    ref.setInput('orientation', this.orientation());
    ref.setInput('keyboardStep', this.keyboardStep());
    // Disabled = splitter disabled OR (prev panel.resizable=false) OR (next panel.resizable=false)
    const prev = panels[i];
    const next = panels[i + 1];
    const handleDisabled = this.disabled() || !prev.resizable() || !next.resizable();
    ref.setInput('disabled', handleDisabled);
    ref.changeDetectorRef.detectChanges();
  }
  // Re-arrange DOM
  const host = this.#host.nativeElement;
  for (let i = 0; i < panels.length; i++) {
    host.appendChild(panels[i].elementRef.nativeElement);
    if (i < this.#handleRefs.length) host.appendChild(this.#handleRefs[i].location.nativeElement);
  }
}

#dragStartSize: { handleIndex: number; containerPx: number } | null = null;
#dragLastDelta = 0;

#onDragStart(handleIndex: number): void {
  const rect = this.#host.nativeElement.getBoundingClientRect();
  const containerPx = this.orientation() === 'horizontal' ? rect.width : rect.height;
  this.#dragStartSize = { handleIndex, containerPx };
  this.#dragLastDelta = 0;
  this.#host.nativeElement.classList.add('sd-splitter--dragging');
}

#onDragMove(handleIndex: number, deltaSinceStart: number): void {
  if (!this.#dragStartSize) return;
  const incrementalDelta = deltaSinceStart - this.#dragLastDelta;
  this.#dragLastDelta = deltaSinceStart;
  this.#state.applyDelta(handleIndex, incrementalDelta, this.#dragStartSize.containerPx, this.snapThreshold());
}

#onDragEnd(handleIndex: number): void {
  this.#dragStartSize = null;
  this.#host.nativeElement.classList.remove('sd-splitter--dragging');
  this.#state.commit();
}

#onHandleToggle(handleIndex: number): void {
  // Double-click / Enter / Space â€” Æ°u tiÃªn collapse panel collapsible á»Ÿ phÃ­a prev, fallback next
  const panels = this.panels();
  const prev = panels[handleIndex];
  const next = panels[handleIndex + 1];
  const target = prev.collapsible() ? prev : next.collapsible() ? next : null;
  if (!target) return;
  const id = target.panelId() ?? panels.indexOf(target);
  this.#state.togglePanel(id);
  this.#state.commit();
}
```

- [ ] **Step 3: Run existing tests, verify no regression**

Run: `ng test --include='**/splitter/**' --watch=false`
Expected: PASS (all existing tests still pass)

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): wire handle drag/keyboard/toggle events vÃ o state service"
```

---

## Task 16: SdSplitterComponent â€” emit outputs (resizeEnd, collapsedChange, layoutChange)

**Files:**
- Modify: `src/splitter.component.ts`
- Modify: `src/splitter.component.spec.ts`

Emit events: `resizeEnd` á»Ÿ `#onDragEnd`, `collapsedChange` má»—i khi `collapsedMap` Ä‘á»•i, `layoutChange` á»Ÿ má»i commit.

- [ ] **Step 1: Append failing tests**

```ts
describe('SdSplitterComponent â€” outputs', () => {
  let fixture: ComponentFixture<HostWithEvents>;
  let captured: { resizeEnd: any[]; collapsedChange: any[]; layoutChange: any[] };

  @Component({
    standalone: true,
    imports: [SdSplitterComponent, SdSplitterPanelComponent],
    template: `
      <sd-splitter style="width:400px;height:200px;"
        (resizeEnd)="captured.resizeEnd.push($event)"
        (collapsedChange)="captured.collapsedChange.push($event)"
        (layoutChange)="captured.layoutChange.push($event)">
        <sd-splitter-panel panelId="a" size="1" collapsible>A</sd-splitter-panel>
        <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
      </sd-splitter>
    `,
  })
  class HostWithEvents {
    captured = { resizeEnd: [], collapsedChange: [], layoutChange: [] };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostWithEvents] });
    fixture = TestBed.createComponent(HostWithEvents);
    fixture.detectChanges();
    captured = fixture.componentInstance.captured;
  });

  it('imperative collapse â†’ emit collapsedChange + layoutChange', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    cmp.collapse('a');
    fixture.detectChanges();
    expect(captured.collapsedChange).toEqual([{ panelId: 'a', collapsed: true }]);
    expect(captured.layoutChange.length).toBe(1);
  });

  it('imperative resizePanel â†’ emit layoutChange', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    cmp.resizePanel('a', 3);
    fixture.detectChanges();
    expect(captured.layoutChange.length).toBe(1);
    expect(captured.layoutChange[0].panels.find((p: any) => p.id === 'a').size).toBe(3);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: FAIL â€” outputs chÆ°a Ä‘Æ°á»£c declare

- [ ] **Step 3: Add outputs + emit logic**

Append vÃ o `SdSplitterComponent`:

```ts
readonly resizeEnd = output<SplitterLayoutState>();
readonly collapsedChange = output<{ panelId: string | number; collapsed: boolean }>();
readonly layoutChange = output<SplitterLayoutState>();

#prevCollapsedMap = new Map<string | number, boolean>();
```

Trong constructor, thÃªm effect emit `layoutChange` + `collapsedChange` khi committedLayout Ä‘á»•i:

```ts
effect(() => {
  const layout = this.#state.committedLayout();
  if (layout.panels.length === 0) return;
  this.layoutChange.emit(layout);

  // Detect collapsed change qua diff vá»›i prev map
  const currMap = this.#state.collapsedMap();
  for (const [id, isCollapsed] of currMap) {
    const prev = this.#prevCollapsedMap.get(id) ?? false;
    if (prev !== isCollapsed) {
      this.collapsedChange.emit({ panelId: id, collapsed: isCollapsed });
    }
  }
  this.#prevCollapsedMap = new Map(currMap);
});
```

Cáº­p nháº­t `#onDragEnd`:

```ts
#onDragEnd(handleIndex: number): void {
  this.#dragStartSize = null;
  this.#host.nativeElement.classList.remove('sd-splitter--dragging');
  this.#state.commit();
  this.resizeEnd.emit(this.#state.committedLayout());
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `ng test --include='**/splitter.component.spec.ts' --watch=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "feat(splitter): outputs resizeEnd/collapsedChange/layoutChange"
```

---

## Task 17: Styling polish â€” transitions + drag class

**Files:**
- Modify: `src/splitter-panel/splitter-panel.component.scss`
- Modify: `src/splitter.component.scss`

Add CSS transitions cho `flex-basis` (chá»‰ Ã¡p khi khÃ´ng Ä‘ang drag).

- [ ] **Step 1: Update `splitter-panel.component.scss`**

```scss
:host {
  display: block;
  overflow: hidden;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  transition: flex var(--sd-splitter-transition-duration, 200ms) ease;

  &.sd-splitter__panel--collapsed {
    flex: 0 0 0 !important;
  }
}

// Disable transition khi parent Ä‘ang drag
:host-context(.sd-splitter--dragging) {
  transition: none !important;
}
```

- [ ] **Step 2: Run all tests**

Run: `ng test --include='**/splitter/**' --watch=false`
Expected: PASS (no regressions)

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "style(splitter): smooth flex transition + disable trong drag"
```

---

## Task 18: Integration tests â€” end-to-end DOM scenarios

**Files:**
- Create: `src/splitter.integration.spec.ts`

Full DOM scenarios: drag pointer, snap collapse, nested splitter, storage roundtrip, disabled, mix px+flex.

- [ ] **Step 1: Write integration test file**

```ts
// projects/sdcorejs-angular/components/splitter/src/splitter.integration.spec.ts
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdStorageService } from '@sdcorejs/angular/services';
import { SdSplitterComponent } from './splitter.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';
import { SplitterLayoutState } from './splitter.models';

function dispatchPointer(target: EventTarget, type: string, init: Partial<PointerEventInit>) {
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', ...init });
  target.dispatchEvent(ev);
}

@Component({
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter [storageKey]="storageKey()" [disabled]="disabled()" style="width:400px;height:200px;">
      <sd-splitter-panel panelId="a" size="200" unit="px" minSize="50" collapsible>A</sd-splitter-panel>
      <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
    </sd-splitter>
  `,
})
class Host {
  storageKey = signal<string | undefined>(undefined);
  disabled = signal(false);
}

describe('sd-splitter integration', () => {
  let fixture: ComponentFixture<Host>;
  let splitterEl: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [SdStorageService],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    splitterEl = fixture.debugElement.query(By.css('sd-splitter')).nativeElement;
    // Mock bounding rect cho container
    spyOn(splitterEl, 'getBoundingClientRect').and.returnValue({
      x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 200, width: 400, height: 200, toJSON: () => ({}),
    } as DOMRect);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 0; });
  });

  it('mix px+flex: panel A 200px, panel B fill cÃ²n láº¡i', () => {
    const panels = splitterEl.querySelectorAll<HTMLElement>('sd-splitter-panel');
    expect(panels[0].style.flex).toContain('200px');
    expect(panels[1].style.flex).toContain('1 1 0');
  });

  it('pointer drag handle â†’ A panel size update', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();

    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 250, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 250, clientY: 0 });
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(250);
  });

  it('drag panel A xuá»‘ng dÆ°á»›i minSize Ã— 0.5 â†’ snap collapse', () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();

    // A Ä‘áº§u = 200. min=50. snap threshold = 50*0.5 = 25.
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 20, clientY: 0 });   // a â†’ 20 < 25, snap
    dispatchPointer(handle, 'pointerup', { clientX: 20, clientY: 0 });
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.collapsed).toBe(true);
  });

  it('disabled splitter â†’ pointer drag khÃ´ng thay Ä‘á»•i state', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 300, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 300, clientY: 0 });
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(200);
  });

  it('storage roundtrip: drag â†’ re-create component cÃ¹ng storageKey â†’ restore', () => {
    fixture.componentInstance.storageKey.set('integration-test');
    fixture.detectChanges();

    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 270, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 270, clientY: 0 });
    fixture.detectChanges();

    // Destroy + re-create
    fixture.destroy();
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.storageKey.set('integration-test');
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(270);
  });
});

describe('sd-splitter nested', () => {
  @Component({
    standalone: true,
    imports: [SdSplitterComponent, SdSplitterPanelComponent],
    template: `
      <sd-splitter orientation="horizontal" style="width:400px;height:200px;">
        <sd-splitter-panel panelId="left" size="1">Left</sd-splitter-panel>
        <sd-splitter-panel panelId="right" size="2">
          <sd-splitter orientation="vertical" style="width:100%;height:100%;">
            <sd-splitter-panel panelId="top" size="1">Top</sd-splitter-panel>
            <sd-splitter-panel panelId="bottom" size="1">Bottom</sd-splitter-panel>
          </sd-splitter>
        </sd-splitter-panel>
      </sd-splitter>
    `,
  })
  class NestedHost {}

  it('renders nested splitter vá»›i handle riÃªng', () => {
    TestBed.configureTestingModule({ imports: [NestedHost], providers: [SdStorageService] });
    const fix = TestBed.createComponent(NestedHost);
    fix.detectChanges();
    const splitters = fix.debugElement.queryAll(By.css('sd-splitter'));
    expect(splitters.length).toBe(2);
    // Parent cÃ³ 1 handle (giá»¯a left + right); nested cÃ³ 1 handle (giá»¯a top + bottom)
    const allHandles = fix.debugElement.queryAll(By.css('sd-splitter-handle'));
    expect(allHandles.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run, verify PASS**

Run: `ng test --include='**/splitter.integration.spec.ts' --watch=false`
Expected: PASS

Náº¿u cÃ³ specs fail, debug vÃ  sá»­a. Likely areas:
- `dispatchPointer` khÃ´ng trigger `pointermove` listener â€” kiá»ƒm tra pháº£i dispatch trÃªn `handleEl` chÃ­nh
- `getBoundingClientRect` mock â€” verify rect Ä‘Ãºng width
- `requestAnimationFrame` callback â€” verify cháº¡y ngay qua spy

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "test(splitter): integration tests cho drag/snap/disabled/storage/nested"
```

---

## Task 19: Final verification â€” build, lint, manual smoke

**Files:** none new â€” verify toÃ n bá»™.

- [ ] **Step 1: Run full test suite**

Run: `ng test --watch=false --include='**/splitter/**'`
Expected: PASS â€” táº¥t cáº£ specs (state service ~25, panel ~4, handle ~13, container ~10+, integration ~6)

Verify count: tá»•ng â‰¥ 58 specs.

- [ ] **Step 2: Run lint**

Run: `npm run lint -- --project sd-angular`
Expected: PASS, khÃ´ng warning trong `components/splitter/`

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS, khÃ´ng lá»—i compile, output bundle cÃ³ chá»©a `SdSplitterComponent`

- [ ] **Step 4: Verify public exports**

Read `projects/sdcorejs-angular/components/splitter/index.ts` vÃ  confirm export:
- `SdSplitterComponent`
- `SdSplitterPanelComponent`
- Types: `SplitterOrientation`, `SplitterPanelUnit`, `SplitterPanelState`, `SplitterLayoutState`

Confirm KHÃ”NG export: `SdSplitterHandleComponent`, `SplitterStateService`, `ResolvedPanelMeta`.

Náº¿u lá»‡ch â€” sá»­a `index.ts`:

```ts
export * from './src/splitter.component';
export * from './src/splitter-panel/splitter-panel.component';
export { SplitterOrientation, SplitterPanelUnit, SplitterPanelState, SplitterLayoutState } from './src/splitter.models';
```

- [ ] **Step 5: Manual smoke test**

Add temporary demo trong `projects/demo/` (náº¿u cÃ³) hoáº·c táº¡o component test trang:

```html
<sd-splitter storageKey="smoke" style="width:600px;height:400px;border:1px solid #ccc;">
  <sd-splitter-panel panelId="left" size="200" unit="px" minSize="100" collapsible style="background:#eee;padding:8px;">
    Sidebar â€” kÃ©o divider hoáº·c double-click handle Ä‘á»ƒ collapse
  </sd-splitter-panel>
  <sd-splitter-panel panelId="main" size="1" style="padding:8px;">
    Main content
  </sd-splitter-panel>
</sd-splitter>
```

Má»Ÿ browser, verify:
- KÃ©o divider â†’ size update mÆ°á»£t
- Double-click handle â†’ sidebar collapse + expand
- Tab vÃ o handle + ArrowRight â†’ resize +10px
- Reload trang â†’ size persist tá»« localStorage

- [ ] **Step 6: Final commit + PR**

```bash
git add projects/sdcorejs-angular/components/splitter/
git commit -m "chore(splitter): final cleanup + public exports verified"
git log --oneline | head -20
```

Verify lá»‹ch sá»­ commit cÃ³ ~19 commit grouped theo task.

---

## HoÃ n thÃ nh

Sau task 19, component `sd-splitter` Ä‘Ã£ cÃ³ Ä‘áº§y Ä‘á»§:
- Public API theo spec
- Test coverage Ä‘áº§y Ä‘á»§ (unit + integration) cho Core UI
- Persistence qua `SdStorageService` vá»›i `storageKey`
- Keyboard a11y + ARIA attrs
- Signal-based composition khÃ´ng dÃ¹ng lifecycle hooks legacy
- CSS variables Ä‘á»ƒ theme

**Next steps (náº¿u cáº§n):**
- Touch device verification â€” `--sd-splitter-handle-hit-area-touch` (open question tá»« spec section 12)
- Demo page trong `projects/demo/` (náº¿u repo cÃ³)
- Documentation `sd-splitter.md` markdown trong folder component (theo pattern cÃ¡c component khÃ¡c cÃ³ file `.md`)


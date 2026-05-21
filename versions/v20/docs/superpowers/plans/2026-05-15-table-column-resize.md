# Table Column Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phÃ©p ngÆ°á»i dÃ¹ng kÃ©o border pháº£i header Ä‘á»ƒ resize cá»™t; lÆ°u width vÃ o `ConfiguredColumn.width` qua `ConfigService` mÃ  KHÃ”NG trigger reload data.

**Architecture:** Má»™t `SdColumnResizeDirective` Ä‘áº·t trÃªn `<th>` header tá»± inject má»™t handle 6px á»Ÿ mÃ©p pháº£i; mousedown/mousemove update inline width trá»±c tiáº¿p qua Renderer2 (ngoÃ i Angular zone, khÃ´ng trigger CD); mouseup emit `(resizeEnd)` â†’ `SdTable.onColumnResize` â†’ `ConfigService.persistColumnWidth` ghi storage báº±ng method má»›i `SdStorage.setSilent` + phÃ¡t qua `widthChange$` subject. `SdTable` subscribe `widthChange$` vÃ  chá»‰ mutate `configuration()` signal â€” khÃ´ng gá»i `loadValues`/`#loadFilterRegister`/`#reload`.

**Tech Stack:** Angular 19+, Angular Signals, Renderer2, RxJS Subject, Karma + Jasmine.

**Spec:** `docs/superpowers/specs/2026-05-15-table-column-resize-design.md`

---

## File Map

| File | Change |
|---|---|
| `projects/sdcorejs-angular/services/storage/src/storage.model.ts` | ThÃªm `setSilent` vÃ o `SdStorage<T>` interface |
| `projects/sdcorejs-angular/services/storage/src/storage.service.ts` | Implement `setSilent` trong `create()` |
| `projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts` | NEW â€” test `setSilent` khÃ´ng emit subject |
| `projects/sdcorejs-angular/components/table/src/services/config.service.ts` | LÆ°u storage reference, thÃªm `persistColumnWidth` + `widthChange$` |
| `projects/sdcorejs-angular/components/table/src/services/config.service.spec.ts` | NEW â€” test `persistColumnWidth` |
| `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.ts` | NEW â€” directive resize |
| `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.spec.ts` | NEW â€” test directive |
| `projects/sdcorejs-angular/components/table/src/directives/index.ts` | Export directive má»›i |
| `projects/sdcorejs-angular/components/table/src/table.component.ts` | Import directive, subscribe `widthChange$`, thÃªm `onColumnResize` |
| `projects/sdcorejs-angular/components/table/src/table.component.html` | ThÃªm `[sdColumnResize]`, `(resizeEnd)` lÃªn `<th>` cá»§a loop firstColumns |
| `projects/sdcorejs-angular/components/table/src/table.component.scss` | Style cho `.sd-col-resize-host`, `.sd-col-resize-handle`, `.sd-resizing` |

---

## Task 1: Extend `SdStorage` interface vá»›i `setSilent`

**Files:**
- Modify: `projects/sdcorejs-angular/services/storage/src/storage.model.ts`

- [ ] **Step 1: Verify build/tests pass before changes**

```bash
npm run build
```
Expected: build succeeds, no errors.

- [ ] **Step 2: Add `setSilent` to `SdStorage` interface**

Open `projects/sdcorejs-angular/services/storage/src/storage.model.ts` vÃ  thay block sau:

```typescript
export interface SdStorage<T = any> {
  get: () => T;
  set: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  subject: BehaviorSubject<T>;
  observer: Observable<T>;
}
```

Báº±ng:

```typescript
export interface SdStorage<T = any> {
  get: () => T;
  set: (data: T) => void;
  // Ghi vÃ o storage nhÆ°ng KHÃ”NG emit subject. DÃ¹ng cho thay Ä‘á»•i UI-only
  // (vd: column width) Ä‘á»ƒ trÃ¡nh re-trigger cÃ¡c subscriber gÃ¢y reload data.
  setSilent: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  subject: BehaviorSubject<T>;
  observer: Observable<T>;
}
```

- [ ] **Step 3: Build to confirm interface change compiles**

```bash
npm run build
```
Expected: build FAILS vá»›i error "Property 'setSilent' is missing" trong `storage.service.ts` (implementation chÆ°a cÃ³). ÄÃ¢y lÃ  ká»³ vá»ng.

- [ ] **Step 4: Commit interface change**

```bash
git add projects/sdcorejs-angular/services/storage/src/storage.model.ts
git commit -m "SM-00: add setSilent to SdStorage interface"
```

---

## Task 2: Implement `setSilent` trong `SdStorageService`

**Files:**
- Modify: `projects/sdcorejs-angular/services/storage/src/storage.service.ts:55-90`

- [ ] **Step 1: Add `setSilent` trong `create()`**

Trong file `storage.service.ts`, sau block `set` (khoáº£ng line 59-62):

```typescript
const set = (data: T) => {
  this.#internalSet(hashKey, data, option);
  subject.next(data);
};
```

ThÃªm:

```typescript
const setSilent = (data: T) => {
  this.#internalSet(hashKey, data, option);
  // Cá»‘ tÃ¬nh KHÃ”NG gá»i subject.next â€” consumer dÃ¹ng kÃªnh riÃªng Ä‘á»ƒ thÃ´ng bÃ¡o
};
```

- [ ] **Step 2: Expose `setSilent` trong return**

TÃ¬m block return (khoáº£ng line 80-89):

```typescript
return {
  get,
  set,
  has,
  remove,
  // @ts-ignore: Bá»• sung vÃ o interface náº¿u cáº§n
  destroy,
  subject: subject,
  observer: subject.asObservable().pipe(map(() => get())),
};
```

Sá»­a thÃ nh:

```typescript
return {
  get,
  set,
  setSilent,
  has,
  remove,
  // @ts-ignore: Bá»• sung vÃ o interface náº¿u cáº§n
  destroy,
  subject: subject,
  observer: subject.asObservable().pipe(map(() => get())),
};
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit implementation**

```bash
git add projects/sdcorejs-angular/services/storage/src/storage.service.ts
git commit -m "SM-00: implement setSilent in SdStorageService"
```

---

## Task 3: Test cho `SdStorage.setSilent`

**Files:**
- Create: `projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts`

- [ ] **Step 1: Write spec file**

Create `projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { SdStorageService } from './storage.service';

describe('SdStorageService', () => {
  let service: SdStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdStorageService);
  });

  it('set() persists value AND emits subject', () => {
    const storage = service.create<{ v: number }>('test-key-1');
    const emissions: any[] = [];
    storage.subject.subscribe(val => emissions.push(val));

    storage.set({ v: 10 });

    expect(storage.get()).toEqual({ v: 10 });
    // emissions[0] lÃ  initial undefined, emissions[1] lÃ  { v: 10 }
    expect(emissions.length).toBe(2);
    expect(emissions[1]).toEqual({ v: 10 });
  });

  it('setSilent() persists value but does NOT emit subject', () => {
    const storage = service.create<{ v: number }>('test-key-2');
    const emissions: any[] = [];
    storage.subject.subscribe(val => emissions.push(val));

    storage.setSilent({ v: 20 });

    expect(storage.get()).toEqual({ v: 20 });
    // chá»‰ cÃ³ 1 emission ban Ä‘áº§u (undefined) â€” khÃ´ng cÃ³ emission cho setSilent
    expect(emissions.length).toBe(1);
  });

  it('setSilent() ghi localStorage giá»‘ng set()', () => {
    const storage = service.create<{ v: number }>('test-key-3');
    storage.setSilent({ v: 30 });

    const raw = localStorage.getItem('test-key-3');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.data).toEqual({ v: 30 });
  });
});
```

- [ ] **Step 2: Run test**

```bash
npm run test:ci -- --include='**/storage.service.spec.ts'
```

Note: Náº¿u `--include` khÃ´ng filter Ä‘Æ°á»£c, cháº¡y full suite:
```bash
npm run test:ci
```
Expected: `SdStorageService` 3 tests PASS.

- [ ] **Step 3: Commit test**

```bash
git add projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts
git commit -m "SM-00: test SdStorage.setSilent does not emit subject"
```

---

## Task 4: ThÃªm `persistColumnWidth` + `widthChange$` vÃ o `ConfigService`

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/services/config.service.ts`

- [ ] **Step 1: Add imports + properties + giá»¯ reference storage**

Trong file `config.service.ts`:

(a) Thay Ä‘oáº¡n import (line 1-6):
```typescript
import { Inject, Injectable, Optional } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from '../configurations';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
```

ThÃ nh:
```typescript
import { Inject, Injectable, Optional } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { Subject } from 'rxjs';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from '../configurations';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
```

(b) Trong class `ConfigService`, ngay sau dÃ²ng `#prefix = 'TABLE_CONFIG';` (line 17) thÃªm:

```typescript
  #storage?: SdStorage<ConfiguredTable>;
  #widthChange = new Subject<{ field: string; width: string }>();
  widthChange$ = this.#widthChange.asObservable();
```

- [ ] **Step 2: Sá»­a `init` Ä‘á»ƒ lÆ°u storage reference**

TÃ¬m block (line 164-166):

```typescript
  init = (tableOption: SdTableOption) => {
    return this.#loadConfiguredTable(tableOption);
  };
```

Sá»­a thÃ nh:

```typescript
  init = (tableOption: SdTableOption) => {
    this.#storage = this.#loadConfiguredTable(tableOption);
    return this.#storage;
  };
```

- [ ] **Step 3: Add `persistColumnWidth` method**

Ngay trÆ°á»›c `#default` (line ~168), thÃªm:

```typescript
  persistColumnWidth = (field: string, width: string) => {
    if (!this.#storage) return;
    const current = this.#storage.get();
    const columns = current?.columns ? [...current.columns] : [];
    const idx = columns.findIndex(c => c.origin.field === field);
    if (idx < 0) {
      // Cá»™t chÆ°a cÃ³ trong storage (vd cá»™t má»›i thÃªm vÃ o option) â€” bá» qua;
      // sáº½ Ä‘Æ°á»£c pick up qua flow loadConfigurationResult bÃ¬nh thÆ°á»ng.
      return;
    }
    columns[idx] = { ...columns[idx], width };
    this.#storage.setSilent({ ...current, columns });
    this.#widthChange.next({ field, width });
  };
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/services/config.service.ts
git commit -m "SM-00: add persistColumnWidth and widthChange\$ to ConfigService"
```

---

## Task 5: Test cho `ConfigService.persistColumnWidth`

**Files:**
- Create: `projects/sdcorejs-angular/components/table/src/services/config.service.spec.ts`

- [ ] **Step 1: Write spec file**

Create `projects/sdcorejs-angular/components/table/src/services/config.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { SdStorageService } from '@sdcorejs/angular/services';
import { SD_TABLE_CONFIGURATION } from '../configurations';
import { SdTableOption } from '../models/table-option.model';
import { ConfigService } from './config.service';

describe('ConfigService.persistColumnWidth', () => {
  let service: ConfigService;

  const option: SdTableOption = {
    key: 'test-table',
    type: 'local',
    items: () => [],
    columns: [
      { field: 'name', title: 'Name', type: 'string', width: '120px' },
      { field: 'age', title: 'Age', type: 'number', width: '80px' },
    ],
  } as any;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        SdStorageService,
        { provide: SD_TABLE_CONFIGURATION, useValue: null },
      ],
    });
    service = TestBed.inject(ConfigService);
  });

  it('does nothing if init() chÆ°a Ä‘Æ°á»£c gá»i', () => {
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));
    service.persistColumnWidth('name', '200px');
    expect(emitted).toBeNull();
  });

  it('cáº­p nháº­t width cá»§a Ä‘Ãºng field vÃ  emit widthChange\$', () => {
    const storage = service.init(option);
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));

    service.persistColumnWidth('name', '200px');

    const stored = storage.get();
    expect(stored.columns!.find(c => c.origin.field === 'name')!.width).toBe('200px');
    expect(stored.columns!.find(c => c.origin.field === 'age')!.width).toBe('80px');
    expect(emitted).toEqual({ field: 'name', width: '200px' });
  });

  it('KHÃ”NG emit qua storage.subject (silent)', () => {
    const storage = service.init(option);
    const emissions: any[] = [];
    storage.subject.subscribe(v => emissions.push(v));
    const baseline = emissions.length;

    service.persistColumnWidth('name', '180px');

    // emissions.length giá»¯ nguyÃªn: setSilent khÃ´ng trigger subject
    expect(emissions.length).toBe(baseline);
  });

  it('bá» qua field khÃ´ng tá»“n táº¡i trong storage', () => {
    service.init(option);
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));

    service.persistColumnWidth('nonexistent', '300px');

    expect(emitted).toBeNull();
  });
});
```

- [ ] **Step 2: Run test**

```bash
npm run test:ci
```
Expected: `ConfigService.persistColumnWidth` 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/services/config.service.spec.ts
git commit -m "SM-00: test ConfigService.persistColumnWidth"
```

---

## Task 6: Create `SdColumnResizeDirective`

**Files:**
- Create: `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.ts`

- [ ] **Step 1: Write directive**

Create `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.ts`:

```typescript
import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

@Directive({
  selector: '[sdColumnResize]',
  standalone: true,
})
export class SdColumnResizeDirective implements OnDestroy {
  // Báº­t/táº¯t resize cho cell nÃ y
  sdColumnResize = input.required<boolean>();
  // min/max width tÃ¹y chá»n (chuá»—i 'NNpx'); náº¿u khÃ´ng pháº£i px sáº½ bá» qua
  minWidth = input<string | undefined>();
  maxWidth = input<string | undefined>();
  // Emit width cuá»‘i cÃ¹ng dáº¡ng 'NNpx' khi mouseup
  resizeEnd = output<string>();

  #el = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #zone = inject(NgZone);

  #handle?: HTMLElement;
  #unlistenMousedown?: () => void;
  #unlistenMove?: () => void;
  #unlistenUp?: () => void;
  #unlistenBlur?: () => void;

  #startX = 0;
  #startWidth = 0;
  #currentWidth = 0;

  constructor() {
    effect(() => {
      const enabled = this.sdColumnResize();
      if (enabled) {
        this.#enable();
      } else {
        this.#disable();
      }
    });
  }

  ngOnDestroy() {
    this.#disable();
  }

  #enable() {
    if (this.#handle) return;
    const th = this.#el.nativeElement;
    this.#renderer.addClass(th, 'sd-col-resize-host');

    const handle = this.#renderer.createElement('span');
    this.#renderer.addClass(handle, 'sd-col-resize-handle');
    this.#renderer.appendChild(th, handle);
    this.#handle = handle;

    // mousedown listen ngoÃ i Angular zone â€” drag khÃ´ng trigger CD
    this.#zone.runOutsideAngular(() => {
      this.#unlistenMousedown = this.#renderer.listen(handle, 'mousedown', (e: MouseEvent) =>
        this.#onMousedown(e)
      );
    });
  }

  #disable() {
    this.#cleanupDrag();
    this.#unlistenMousedown?.();
    this.#unlistenMousedown = undefined;
    if (this.#handle) {
      this.#renderer.removeChild(this.#el.nativeElement, this.#handle);
      this.#handle = undefined;
    }
    this.#renderer.removeClass(this.#el.nativeElement, 'sd-col-resize-host');
  }

  #onMousedown = (event: MouseEvent) => {
    event.preventDefault();
    // stopPropagation Ä‘á»ƒ khÃ´ng trigger mat-sort khi click vÃ o handle
    event.stopPropagation();

    const th = this.#el.nativeElement;
    this.#startX = event.clientX;
    this.#startWidth = th.getBoundingClientRect().width;
    this.#currentWidth = this.#startWidth;

    this.#renderer.setStyle(document.body, 'cursor', 'col-resize');
    this.#renderer.addClass(th, 'sd-resizing');

    this.#zone.runOutsideAngular(() => {
      this.#unlistenMove = this.#renderer.listen('document', 'mousemove', (e: MouseEvent) =>
        this.#onMousemove(e)
      );
      this.#unlistenUp = this.#renderer.listen('document', 'mouseup', () => this.#onMouseup());
      // Náº¿u user kÃ©o ra ngoÃ i window: cleanup an toÃ n
      this.#unlistenBlur = this.#renderer.listen('window', 'blur', () => this.#onMouseup());
    });
  };

  #onMousemove = (event: MouseEvent) => {
    const delta = event.clientX - this.#startX;
    const minPx = this.#parsePx(this.minWidth()) ?? 40;
    const maxPx = this.#parsePx(this.maxWidth()) ?? Number.POSITIVE_INFINITY;
    const w = Math.min(maxPx, Math.max(minPx, this.#startWidth + delta));
    this.#currentWidth = w;

    const th = this.#el.nativeElement;
    const px = `${w}px`;
    this.#renderer.setStyle(th, 'width', px);
    this.#renderer.setStyle(th, 'min-width', px);
    this.#renderer.setStyle(th, 'max-width', px);
  };

  #onMouseup = () => {
    const finalPx = `${Math.round(this.#currentWidth)}px`;
    this.#cleanupDrag();
    // emit trong Angular zone Ä‘á»ƒ consumer cháº¡y CD bÃ¬nh thÆ°á»ng
    this.#zone.run(() => this.resizeEnd.emit(finalPx));
  };

  #cleanupDrag() {
    this.#unlistenMove?.();
    this.#unlistenMove = undefined;
    this.#unlistenUp?.();
    this.#unlistenUp = undefined;
    this.#unlistenBlur?.();
    this.#unlistenBlur = undefined;
    this.#renderer.removeStyle(document.body, 'cursor');
    if (this.#el?.nativeElement) {
      this.#renderer.removeClass(this.#el.nativeElement, 'sd-resizing');
    }
  }

  #parsePx(value?: string): number | null {
    if (!value) return null;
    const m = /^(\d+(?:\.\d+)?)px$/i.exec(value.trim());
    return m ? parseFloat(m[1]) : null;
  }
}
```

- [ ] **Step 2: Export tá»« directives index**

Sá»­a `projects/sdcorejs-angular/components/table/src/directives/index.ts`:

```typescript
export * from './sd-table-column-filter-def.directive';
export * from './sticky-shadow.directive';
export * from './sd-table-title-def.directive';
export * from './sd-table-cell-def.directive';
```

ThÃªm dÃ²ng:
```typescript
export * from './sd-column-resize.directive';
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.ts projects/sdcorejs-angular/components/table/src/directives/index.ts
git commit -m "SM-00: add SdColumnResizeDirective"
```

---

## Task 7: Test cho `SdColumnResizeDirective`

**Files:**
- Create: `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.spec.ts`

- [ ] **Step 1: Write directive test**

Create `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.spec.ts`:

```typescript
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdColumnResizeDirective } from './sd-column-resize.directive';

@Component({
  standalone: true,
  imports: [SdColumnResizeDirective],
  template: `
    <table>
      <thead>
        <tr>
          <th
            #th
            style="width: 100px;"
            [sdColumnResize]="enabled()"
            [minWidth]="minWidth()"
            [maxWidth]="maxWidth()"
            (resizeEnd)="onResizeEnd($event)">
            Header
          </th>
        </tr>
      </thead>
    </table>
  `,
})
class HostComponent {
  enabled = signal(true);
  minWidth = signal<string | undefined>(undefined);
  maxWidth = signal<string | undefined>(undefined);
  lastWidth: string | null = null;
  onResizeEnd(w: string) {
    this.lastWidth = w;
  }
}

function dispatchMouse(target: EventTarget, type: string, clientX: number) {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientX });
  target.dispatchEvent(ev);
}

describe('SdColumnResizeDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let thEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    thEl = fixture.debugElement.query(By.css('th')).nativeElement;
    // bbox cá»‘ Ä‘á»‹nh cho test: stub getBoundingClientRect width = 100
    spyOn(thEl, 'getBoundingClientRect').and.returnValue({
      x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 40,
      width: 100, height: 40, toJSON: () => ({}),
    } as DOMRect);
  });

  it('injects handle khi enabled = true', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle');
    expect(handle).toBeTruthy();
    expect(thEl.classList.contains('sd-col-resize-host')).toBe(true);
  });

  it('remove handle khi enabled chuyá»ƒn sang false', () => {
    host.enabled.set(false);
    fixture.detectChanges();
    expect(thEl.querySelector('.sd-col-resize-handle')).toBeNull();
    expect(thEl.classList.contains('sd-col-resize-host')).toBe(false);
  });

  it('mousedown + mousemove + mouseup â†’ emit width má»›i', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 150);  // delta +50
    dispatchMouse(document, 'mouseup', 150);

    expect(host.lastWidth).toBe('150px');
  });

  it('clamp width vá» minWidth (default 40px)', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 0);    // delta -100 â†’ 100-100=0 â†’ clamp 40
    dispatchMouse(document, 'mouseup', 0);

    expect(host.lastWidth).toBe('40px');
  });

  it('clamp width vá» column.maxWidth náº¿u cÃ³', () => {
    host.maxWidth.set('120px');
    fixture.detectChanges();
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 300); // delta +200 â†’ 300 â†’ clamp 120
    dispatchMouse(document, 'mouseup', 300);

    expect(host.lastWidth).toBe('120px');
  });

  it('clamp width vá» column.minWidth náº¿u cÃ³ (lá»›n hÆ¡n default 40)', () => {
    host.minWidth.set('60px');
    fixture.detectChanges();
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 30);  // delta -70 â†’ 30 â†’ clamp 60
    dispatchMouse(document, 'mouseup', 30);

    expect(host.lastWidth).toBe('60px');
  });

  it('mousedown stopPropagation Ä‘á»ƒ khÃ´ng trigger sort', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    const thClickSpy = jasmine.createSpy('th-mousedown');
    thEl.addEventListener('mousedown', thClickSpy);

    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100 });
    handle.dispatchEvent(ev);

    expect(thClickSpy).not.toHaveBeenCalled();
  });

  it('update inline width cá»§a TH trong khi kÃ©o', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 180); // â†’ 180px

    expect(thEl.style.width).toBe('180px');
    expect(thEl.style.minWidth).toBe('180px');
    expect(thEl.style.maxWidth).toBe('180px');

    dispatchMouse(document, 'mouseup', 180);
  });

  it('cleanup khi destroy giá»¯a drag', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    fixture.destroy();
    expect(document.body.style.cursor).toBe('');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm run test:ci
```
Expected: 9 tests PASS trong `SdColumnResizeDirective`.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.spec.ts
git commit -m "SM-00: test SdColumnResizeDirective drag/clamp/cleanup"
```

---

## Task 8: SCSS styles cho handle

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.scss`

- [ ] **Step 1: Add resize styles trong nesting `.c-th`**

Open `projects/sdcorejs-angular/components/table/src/table.component.scss`. TÃ¬m block `.c-th` hiá»‡n cÃ³ (line ~85-91):

```scss
      .c-th {
        vertical-align: middle;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        color: #212121;
      }
```

Sá»­a thÃ nh:

```scss
      .c-th {
        vertical-align: middle;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        color: #212121;

        &.sd-col-resize-host {
          position: relative;
        }

        &.sd-resizing {
          user-select: none;
        }

        .sd-col-resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          user-select: none;
          z-index: 2;

          &:hover {
            background: rgba(0, 0, 0, 0.08);
          }
        }
      }
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.scss
git commit -m "SM-00: scss for column resize handle"
```

---

## Task 9: Wire up `SdColumnResizeDirective` trong `SdTable`

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.html`

- [ ] **Step 1: Import directive vÃ o component imports**

Trong `table.component.ts`:

(a) TÃ¬m dÃ²ng import directives hiá»‡n cÃ³ (line 63):
```typescript
import { StickyShadowDirective } from './directives';
```
Sá»­a thÃ nh:
```typescript
import { SdColumnResizeDirective, StickyShadowDirective } from './directives';
```

(b) TÃ¬m máº£ng `imports:` cá»§a `@Component` decorator (line 118-147). ThÃªm `SdColumnResizeDirective` vÃ o cuá»‘i máº£ng (trÆ°á»›c dáº¥u `]`):
```typescript
    SelectorActionComponent,
    StickyShadowDirective,
    SdColumnResizeDirective,
  ],
```

- [ ] **Step 2: Add `onColumnResize` method**

Trong class `SdTable`, tÃ¬m method `detectChanges` hiá»‡n cÃ³ (line ~901):
```typescript
  detectChanges = () => this.#ref.detectChanges();
```

ThÃªm method ngay sau:
```typescript
  onColumnResize = (field: string, width: string) => {
    // persistColumnWidth ghi storage (silent) vÃ  emit widthChange$;
    // subscriber trong constructor Ä‘Ã£ update configuration() signal Ä‘á»“ng bá»™.
    this.#configService.persistColumnWidth(field, width);

    const onResize = this.tableOption()?.config?.onResize;
    if (!onResize) return;
    const columnMap = this.configuration()?.column ?? {};
    const columnWidth: Record<string, string> = {};
    for (const key of Object.keys(columnMap)) {
      const w = columnMap[key]?.width;
      if (w) columnWidth[key] = w;
    }
    onResize(field, width, columnWidth);
  };
```

- [ ] **Step 3: Subscribe `widthChange$` trong constructor**

Trong `constructor()`, sau effect cuá»‘i cÃ¹ng (effect cho `items` line 310-314):

```typescript
    effect(() => {
      const items = this.items();
      this.#itemIndexMap = new WeakMap();
      items.forEach((item, idx) => this.#itemIndexMap.set(item, idx));
    });
```

ThÃªm subscription táº¡i cuá»‘i constructor (trÆ°á»›c `}` Ä‘Ã³ng constructor, line ~315):

```typescript
    this.#subscription.add(
      this.#configService.widthChange$.subscribe(({ field, width }) => {
        // Update configuration signal local â€” KHÃ”NG gá»i loadValues/reload
        const conf = this.configuration();
        if (!conf) return;
        const firstColumns = conf.firstColumns.map(c =>
          c.field === field ? { ...c, width } : c
        );
        const column = { ...conf.column };
        if (column[field]) {
          column[field] = { ...column[field], width };
        }
        const fixedColumn = { ...conf.fixedColumn };
        if (fixedColumn[field]) {
          fixedColumn[field] = { ...fixedColumn[field], width };
        }
        this.configuration.set({ ...conf, firstColumns, column, fixedColumn });
      })
    );
```

- [ ] **Step 4: Wire directive vÃ o template**

Trong `table.component.html`, tÃ¬m block (line 148-158):

```html
        @for (column of _configuration.firstColumns; track column.field) {
          <ng-container [matColumnDef]="column.field" [sticky]="_configuration.fixedColumn[column.field]">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="px-8 py-8 c-th"
              [style.width]="column.width"
              [style.min-width]="column.minWidth || column.width"
              [style.max-width]="column.maxWidth"
              [attr.rowspan]="_configuration.multipleHeader && column.type !== 'children' ? 2 : 1"
              [attr.colspan]="column.type === 'children' ? column.children.length : 1">
```

Sá»­a thÃ nh:

```html
        @for (column of _configuration.firstColumns; track column.field) {
          <ng-container [matColumnDef]="column.field" [sticky]="_configuration.fixedColumn[column.field]">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="px-8 py-8 c-th"
              [sdColumnResize]="!!_tableOption.config?.resizable && column.type !== 'children'"
              [minWidth]="column.minWidth"
              [maxWidth]="column.maxWidth"
              (resizeEnd)="onColumnResize(column.field, $event)"
              [style.width]="column.width"
              [style.min-width]="column.minWidth || column.width"
              [style.max-width]="column.maxWidth"
              [attr.rowspan]="_configuration.multipleHeader && column.type !== 'children' ? 2 : 1"
              [attr.colspan]="column.type === 'children' ? column.children.length : 1">
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 6: Run full test suite**

```bash
npm run test:ci
```
Expected: táº¥t cáº£ tests PASS (storage + config + directive).

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.ts projects/sdcorejs-angular/components/table/src/table.component.html
git commit -m "SM-00: wire SdColumnResizeDirective into SdTable"
```

---

## Task 10: Manual smoke test trong app demo

**Files:** khÃ´ng sá»­a, chá»‰ verify

- [ ] **Step 1: TÃ¬m app demo dÃ¹ng `sd-table`**

```bash
grep -rl "sd-table" projects --include="*.html" | head -5
```

Má»Ÿ 1 app demo cÃ³ `sd-table` (vÃ­ dá»¥ `projects/<demo-app>`).

- [ ] **Step 2: Báº­t `config.resizable = true` trÃªn 1 table cÃ³ `key`**

Trong file ts cá»§a 1 component demo, sá»­a option:
```typescript
option: SdTableOption = {
  key: 'demo-table-resize',
  config: { resizable: true, visible: true },
  // ... columns, items
};
```

- [ ] **Step 3: Cháº¡y dev server**

```bash
npm run start
```

Hoáº·c lá»‡nh start app cá»¥ thá»ƒ cá»§a demo app Ä‘Ã³.

- [ ] **Step 4: Test thá»§ cÃ´ng trÃªn browser**

Má»Ÿ app, kiá»ƒm tra checklist:
1. Hover vÃ o mÃ©p pháº£i header cá»™t data â†’ cursor `col-resize`
2. KÃ©o trÃ¡i/pháº£i â†’ cá»™t thay Ä‘á»•i width mÆ°á»£t, khÃ´ng tháº¥y reload data (spinner khÃ´ng hiá»‡n)
3. Nháº£ chuá»™t â†’ width giá»¯ nguyÃªn
4. Refresh page (F5) â†’ width váº«n Ä‘Æ°á»£c giá»¯
5. Hover mÃ©p pháº£i cá»™t `sdSelection` / `sdCommand` â†’ KHÃ”NG cÃ³ cursor `col-resize`
6. Cá»™t cÃ³ `type: 'children'` â†’ handle KHÃ”NG xuáº¥t hiá»‡n trÃªn cha; cá»™t con khÃ´ng cÃ³ handle (out of scope)
7. Má»Ÿ config dialog â†’ Reset â†’ width quay vá» máº·c Ä‘á»‹nh
8. Báº­t/táº¯t `config.resizable` runtime â†’ handle add/remove Ä‘Ãºng
9. Set `option.columns[i].minWidth = '80px'`/`maxWidth = '300px'` â†’ kÃ©o bá»‹ clamp

- [ ] **Step 5: Rollback demo changes**

```bash
git checkout -- projects/<demo-app>
```

- [ ] **Step 6: Final build verify**

```bash
npm run build
```
Expected: build succeeds vá»›i toÃ n bá»™ thay Ä‘á»•i.

---

## Definition of Done

- [x] `TableOptionConfig.resizable?: boolean` Ä‘Ã£ cÃ³ (user thÃªm trÆ°á»›c task nÃ y)
- [ ] `SdStorage.setSilent` implement + test pass
- [ ] `ConfigService.persistColumnWidth` + `widthChange$` implement + test pass
- [ ] `SdColumnResizeDirective` implement + 9 tests pass
- [ ] SCSS handle styled
- [ ] Template gáº¯n directive vÃ o `<th>` cá»§a firstColumns (non-children only)
- [ ] `SdTable` subscribe `widthChange$` cáº­p nháº­t configuration signal mÃ  KHÃ”NG trigger reload
- [ ] Manual smoke test pass full checklist
- [ ] `npm run build` succeeds
- [ ] `npm run test:ci` toÃ n bá»™ pass


�# Table Column Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép người dùng kéo border phải header �Ồ resize c�"t; lưu width vào `ConfiguredColumn.width` qua `ConfigService` mà KH�NG trigger reload data.

**Architecture:** M�"t `SdColumnResizeDirective` �ặt trên `<th>` header tự inject m�"t handle 6px �x mép phải; mousedown/mousemove update inline width trực tiếp qua Renderer2 (ngoài Angular zone, không trigger CD); mouseup emit `(resizeEnd)` �  `SdTable.onColumnResize` �  `ConfigService.persistColumnWidth` ghi storage bằng method m�:i `SdStorage.setSilent` + phát qua `widthChange$` subject. `SdTable` subscribe `widthChange$` và ch�0 mutate `configuration()` signal � không gọi `loadValues`/`#loadFilterRegister`/`#reload`.

**Tech Stack:** Angular 19+, Angular Signals, Renderer2, RxJS Subject, Karma + Jasmine.

**Spec:** `docs/superpowers/specs/2026-05-15-table-column-resize-design.md`

---

## File Map

| File | Change |
|---|---|
| `projects/sdcorejs-angular/services/storage/src/storage.model.ts` | Thêm `setSilent` vào `SdStorage<T>` interface |
| `projects/sdcorejs-angular/services/storage/src/storage.service.ts` | Implement `setSilent` trong `create()` |
| `projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts` | NEW � test `setSilent` không emit subject |
| `projects/sdcorejs-angular/components/table/src/services/config.service.ts` | Lưu storage reference, thêm `persistColumnWidth` + `widthChange$` |
| `projects/sdcorejs-angular/components/table/src/services/config.service.spec.ts` | NEW � test `persistColumnWidth` |
| `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.ts` | NEW � directive resize |
| `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.spec.ts` | NEW � test directive |
| `projects/sdcorejs-angular/components/table/src/directives/index.ts` | Export directive m�:i |
| `projects/sdcorejs-angular/components/table/src/table.component.ts` | Import directive, subscribe `widthChange$`, thêm `onColumnResize` |
| `projects/sdcorejs-angular/components/table/src/table.component.html` | Thêm `[sdColumnResize]`, `(resizeEnd)` lên `<th>` của loop firstColumns |
| `projects/sdcorejs-angular/components/table/src/table.component.scss` | Style cho `.sd-col-resize-host`, `.sd-col-resize-handle`, `.sd-resizing` |

---

## Task 1: Extend `SdStorage` interface v�:i `setSilent`

**Files:**
- Modify: `projects/sdcorejs-angular/services/storage/src/storage.model.ts`

- [ ] **Step 1: Verify build/tests pass before changes**

```bash
npm run build
```
Expected: build succeeds, no errors.

- [ ] **Step 2: Add `setSilent` to `SdStorage` interface**

Open `projects/sdcorejs-angular/services/storage/src/storage.model.ts` và thay block sau:

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

Bằng:

```typescript
export interface SdStorage<T = any> {
  get: () => T;
  set: (data: T) => void;
  // Ghi vào storage nhưng KH�NG emit subject. Dùng cho thay ��"i UI-only
  // (vd: column width) �Ồ tránh re-trigger các subscriber gây reload data.
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
Expected: build FAILS v�:i error "Property 'setSilent' is missing" trong `storage.service.ts` (implementation chưa có). Đây là kỳ vọng.

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

Trong file `storage.service.ts`, sau block `set` (khoảng line 59-62):

```typescript
const set = (data: T) => {
  this.#internalSet(hashKey, data, option);
  subject.next(data);
};
```

Thêm:

```typescript
const setSilent = (data: T) => {
  this.#internalSet(hashKey, data, option);
  // C� tình KH�NG gọi subject.next � consumer dùng kênh riêng �Ồ thông báo
};
```

- [ ] **Step 2: Expose `setSilent` trong return**

Tìm block return (khoảng line 80-89):

```typescript
return {
  get,
  set,
  has,
  remove,
  // @ts-ignore: B�" sung vào interface nếu cần
  destroy,
  subject: subject,
  observer: subject.asObservable().pipe(map(() => get())),
};
```

Sửa thành:

```typescript
return {
  get,
  set,
  setSilent,
  has,
  remove,
  // @ts-ignore: B�" sung vào interface nếu cần
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
    // emissions[0] là initial undefined, emissions[1] là { v: 10 }
    expect(emissions.length).toBe(2);
    expect(emissions[1]).toEqual({ v: 10 });
  });

  it('setSilent() persists value but does NOT emit subject', () => {
    const storage = service.create<{ v: number }>('test-key-2');
    const emissions: any[] = [];
    storage.subject.subscribe(val => emissions.push(val));

    storage.setSilent({ v: 20 });

    expect(storage.get()).toEqual({ v: 20 });
    // ch�0 có 1 emission ban �ầu (undefined) � không có emission cho setSilent
    expect(emissions.length).toBe(1);
  });

  it('setSilent() ghi localStorage gi�ng set()', () => {
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

Note: Nếu `--include` không filter �ược, chạy full suite:
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

## Task 4: Thêm `persistColumnWidth` + `widthChange$` vào `ConfigService`

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/services/config.service.ts`

- [ ] **Step 1: Add imports + properties + giữ reference storage**

Trong file `config.service.ts`:

(a) Thay �oạn import (line 1-6):
```typescript
import { Inject, Injectable, Optional } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from '../configurations';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
```

Thành:
```typescript
import { Inject, Injectable, Optional } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { Subject } from 'rxjs';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from '../configurations';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
```

(b) Trong class `ConfigService`, ngay sau dòng `#prefix = 'TABLE_CONFIG';` (line 17) thêm:

```typescript
  #storage?: SdStorage<ConfiguredTable>;
  #widthChange = new Subject<{ field: string; width: string }>();
  widthChange$ = this.#widthChange.asObservable();
```

- [ ] **Step 2: Sửa `init` �Ồ lưu storage reference**

Tìm block (line 164-166):

```typescript
  init = (tableOption: SdTableOption) => {
    return this.#loadConfiguredTable(tableOption);
  };
```

Sửa thành:

```typescript
  init = (tableOption: SdTableOption) => {
    this.#storage = this.#loadConfiguredTable(tableOption);
    return this.#storage;
  };
```

- [ ] **Step 3: Add `persistColumnWidth` method**

Ngay trư�:c `#default` (line ~168), thêm:

```typescript
  persistColumnWidth = (field: string, width: string) => {
    if (!this.#storage) return;
    const current = this.#storage.get();
    const columns = current?.columns ? [...current.columns] : [];
    const idx = columns.findIndex(c => c.origin.field === field);
    if (idx < 0) {
      // C�"t chưa có trong storage (vd c�"t m�:i thêm vào option) � bỏ qua;
      // sẽ �ược pick up qua flow loadConfigurationResult bình thường.
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

  it('does nothing if init() chưa �ược gọi', () => {
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));
    service.persistColumnWidth('name', '200px');
    expect(emitted).toBeNull();
  });

  it('cập nhật width của �úng field và emit widthChange\$', () => {
    const storage = service.init(option);
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));

    service.persistColumnWidth('name', '200px');

    const stored = storage.get();
    expect(stored.columns!.find(c => c.origin.field === 'name')!.width).toBe('200px');
    expect(stored.columns!.find(c => c.origin.field === 'age')!.width).toBe('80px');
    expect(emitted).toEqual({ field: 'name', width: '200px' });
  });

  it('KH�NG emit qua storage.subject (silent)', () => {
    const storage = service.init(option);
    const emissions: any[] = [];
    storage.subject.subscribe(v => emissions.push(v));
    const baseline = emissions.length;

    service.persistColumnWidth('name', '180px');

    // emissions.length giữ nguyên: setSilent không trigger subject
    expect(emissions.length).toBe(baseline);
  });

  it('bỏ qua field không t�n tại trong storage', () => {
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
  // Bật/tắt resize cho cell này
  sdColumnResize = input.required<boolean>();
  // min/max width tùy chọn (chu�i 'NNpx'); nếu không phải px sẽ bỏ qua
  minWidth = input<string | undefined>();
  maxWidth = input<string | undefined>();
  // Emit width cu�i cùng dạng 'NNpx' khi mouseup
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

    // mousedown listen ngoài Angular zone � drag không trigger CD
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
    // stopPropagation �Ồ không trigger mat-sort khi click vào handle
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
      // Nếu user kéo ra ngoài window: cleanup an toàn
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
    // emit trong Angular zone �Ồ consumer chạy CD bình thường
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

- [ ] **Step 2: Export từ directives index**

Sửa `projects/sdcorejs-angular/components/table/src/directives/index.ts`:

```typescript
export * from './sd-table-column-filter-def.directive';
export * from './sticky-shadow.directive';
export * from './sd-table-title-def.directive';
export * from './sd-table-cell-def.directive';
```

Thêm dòng:
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
    // bbox c� ��9nh cho test: stub getBoundingClientRect width = 100
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

  it('remove handle khi enabled chuyỒn sang false', () => {
    host.enabled.set(false);
    fixture.detectChanges();
    expect(thEl.querySelector('.sd-col-resize-handle')).toBeNull();
    expect(thEl.classList.contains('sd-col-resize-host')).toBe(false);
  });

  it('mousedown + mousemove + mouseup �  emit width m�:i', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 150);  // delta +50
    dispatchMouse(document, 'mouseup', 150);

    expect(host.lastWidth).toBe('150px');
  });

  it('clamp width về minWidth (default 40px)', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 0);    // delta -100 �  100-100=0 �  clamp 40
    dispatchMouse(document, 'mouseup', 0);

    expect(host.lastWidth).toBe('40px');
  });

  it('clamp width về column.maxWidth nếu có', () => {
    host.maxWidth.set('120px');
    fixture.detectChanges();
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 300); // delta +200 �  300 �  clamp 120
    dispatchMouse(document, 'mouseup', 300);

    expect(host.lastWidth).toBe('120px');
  });

  it('clamp width về column.minWidth nếu có (l�:n hơn default 40)', () => {
    host.minWidth.set('60px');
    fixture.detectChanges();
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 30);  // delta -70 �  30 �  clamp 60
    dispatchMouse(document, 'mouseup', 30);

    expect(host.lastWidth).toBe('60px');
  });

  it('mousedown stopPropagation �Ồ không trigger sort', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    const thClickSpy = jasmine.createSpy('th-mousedown');
    thEl.addEventListener('mousedown', thClickSpy);

    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100 });
    handle.dispatchEvent(ev);

    expect(thClickSpy).not.toHaveBeenCalled();
  });

  it('update inline width của TH trong khi kéo', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 180); // �  180px

    expect(thEl.style.width).toBe('180px');
    expect(thEl.style.minWidth).toBe('180px');
    expect(thEl.style.maxWidth).toBe('180px');

    dispatchMouse(document, 'mouseup', 180);
  });

  it('cleanup khi destroy giữa drag', () => {
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

Open `projects/sdcorejs-angular/components/table/src/table.component.scss`. Tìm block `.c-th` hi�!n có (line ~85-91):

```scss
      .c-th {
        vertical-align: middle;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        color: #212121;
      }
```

Sửa thành:

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

- [ ] **Step 1: Import directive vào component imports**

Trong `table.component.ts`:

(a) Tìm dòng import directives hi�!n có (line 63):
```typescript
import { StickyShadowDirective } from './directives';
```
Sửa thành:
```typescript
import { SdColumnResizeDirective, StickyShadowDirective } from './directives';
```

(b) Tìm mảng `imports:` của `@Component` decorator (line 118-147). Thêm `SdColumnResizeDirective` vào cu�i mảng (trư�:c dấu `]`):
```typescript
    SelectorActionComponent,
    StickyShadowDirective,
    SdColumnResizeDirective,
  ],
```

- [ ] **Step 2: Add `onColumnResize` method**

Trong class `SdTable`, tìm method `detectChanges` hi�!n có (line ~901):
```typescript
  detectChanges = () => this.#ref.detectChanges();
```

Thêm method ngay sau:
```typescript
  onColumnResize = (field: string, width: string) => {
    // persistColumnWidth ghi storage (silent) và emit widthChange$;
    // subscriber trong constructor �ã update configuration() signal ��ng b�".
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

Trong `constructor()`, sau effect cu�i cùng (effect cho `items` line 310-314):

```typescript
    effect(() => {
      const items = this.items();
      this.#itemIndexMap = new WeakMap();
      items.forEach((item, idx) => this.#itemIndexMap.set(item, idx));
    });
```

Thêm subscription tại cu�i constructor (trư�:c `}` �óng constructor, line ~315):

```typescript
    this.#subscription.add(
      this.#configService.widthChange$.subscribe(({ field, width }) => {
        // Update configuration signal local � KH�NG gọi loadValues/reload
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

- [ ] **Step 4: Wire directive vào template**

Trong `table.component.html`, tìm block (line 148-158):

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

Sửa thành:

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
Expected: tất cả tests PASS (storage + config + directive).

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/table/src/table.component.ts projects/sdcorejs-angular/components/table/src/table.component.html
git commit -m "SM-00: wire SdColumnResizeDirective into SdTable"
```

---

## Task 10: Manual smoke test trong app demo

**Files:** không sửa, ch�0 verify

- [ ] **Step 1: Tìm app demo dùng `sd-table`**

```bash
grep -rl "sd-table" projects --include="*.html" | head -5
```

M�x 1 app demo có `sd-table` (ví dụ `projects/<demo-app>`).

- [ ] **Step 2: Bật `config.resizable = true` trên 1 table có `key`**

Trong file ts của 1 component demo, sửa option:
```typescript
option: SdTableOption = {
  key: 'demo-table-resize',
  config: { resizable: true, visible: true },
  // ... columns, items
};
```

- [ ] **Step 3: Chạy dev server**

```bash
npm run start
```

Hoặc l�!nh start app cụ thỒ của demo app �ó.

- [ ] **Step 4: Test thủ công trên browser**

M�x app, kiỒm tra checklist:
1. Hover vào mép phải header c�"t data �  cursor `col-resize`
2. Kéo trái/phải �  c�"t thay ��"i width mượt, không thấy reload data (spinner không hi�!n)
3. Nhả chu�"t �  width giữ nguyên
4. Refresh page (F5) �  width vẫn �ược giữ
5. Hover mép phải c�"t `sdSelection` / `sdCommand` �  KH�NG có cursor `col-resize`
6. C�"t có `type: 'children'` �  handle KH�NG xuất hi�!n trên cha; c�"t con không có handle (out of scope)
7. M�x config dialog �  Reset �  width quay về mặc ��9nh
8. Bật/tắt `config.resizable` runtime �  handle add/remove �úng
9. Set `option.columns[i].minWidth = '80px'`/`maxWidth = '300px'` �  kéo b�9 clamp

- [ ] **Step 5: Rollback demo changes**

```bash
git checkout -- projects/<demo-app>
```

- [ ] **Step 6: Final build verify**

```bash
npm run build
```
Expected: build succeeds v�:i toàn b�" thay ��"i.

---

## Definition of Done

- [x] `TableOptionConfig.resizable?: boolean` �ã có (user thêm trư�:c task này)
- [ ] `SdStorage.setSilent` implement + test pass
- [ ] `ConfigService.persistColumnWidth` + `widthChange$` implement + test pass
- [ ] `SdColumnResizeDirective` implement + 9 tests pass
- [ ] SCSS handle styled
- [ ] Template gắn directive vào `<th>` của firstColumns (non-children only)
- [ ] `SdTable` subscribe `widthChange$` cập nhật configuration signal mà KH�NG trigger reload
- [ ] Manual smoke test pass full checklist
- [ ] `npm run build` succeeds
- [ ] `npm run test:ci` toàn b�" pass


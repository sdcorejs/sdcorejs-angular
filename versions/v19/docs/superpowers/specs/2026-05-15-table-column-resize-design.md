# Table Column Resize — Design Spec

**Date:** 2026-05-15
**Component:** `@sd-angular/components/table` (SdTable)
**Status:** Approved (awaiting implementation plan)

## 1. Goal

Cho phép người dùng thay đổi width của các cột bằng cách kéo thả border phải header. Width sau khi kéo được persist vào `ConfiguredColumn.width` để khi mở lại table giữ nguyên kích thước.

Yêu cầu UX:
- Mượt mà, không lag (không trigger reload data, không re-fetch values)
- Cursor `col-resize` chỉ hiện khi hover vào border phải header — không thêm decoration làm rối UI
- Không cho resize các cột đặc biệt: `sdSelection`, `sdCommand`, `sdGroup`, `sdSubInformation`, `sdSubInformationAction`, `reorder`
- Không cho resize cột cha `type === 'children'` (cột nhóm header) — chỉ cho phép resize cột data thực sự

## 2. Public API

Thêm các property mới vào `TableOptionConfig`:

```typescript
// projects/sdcorejs-angular/components/table/src/models/table-option-config.model.ts
export interface TableOptionConfig {
  visible?: boolean;
  resizable?: boolean;  // NEW — bật/tắt drag-to-resize cho table
  // NEW — callback sau mỗi lần resize xong (mouseup).
  // - field: cột vừa resize
  // - width: width mới của cột đó (vd '220px')
  // - columnWidth: snapshot Record<field, width> toàn bộ cột data có width
  onResize?: (field: string, width: string, columnWidth: Record<string, string>) => void;
}
```

Sử dụng:
```typescript
option: SdTableOption = {
  ...,
  config: {
    visible: true,
    resizable: true,
    onResize: (field, width, columnWidth) => {
      console.log(`Cột ${field} → ${width}`, columnWidth);
    },
  },
};
```

## 3. Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│ SdTable (table.component.ts)                                │
│  - imports SdColumnResizeDirective                          │
│  - subscribes ConfigService.widthChange$                    │
│  - method onColumnResize(field, width)                      │
└──────────────┬──────────────────────────────────────────────┘
               │ template binding
               ▼
┌─────────────────────────────────────────────────────────────┐
│ <th [sdColumnResize]                                        │
│      [minWidth] [maxWidth]                                  │
│      (resizeEnd)>                                           │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ SdColumnResizeDirective                                     │
│  - inject handle <span> vào host TH                         │
│  - mousedown → start drag (lưu startX, startWidth)          │
│  - document mousemove → set inline width trên TH (Renderer2)│
│  - document mouseup → emit (resizeEnd)                      │
└──────────────┬──────────────────────────────────────────────┘
               │ resizeEnd: 'NNpx'
               ▼
┌─────────────────────────────────────────────────────────────┐
│ ConfigService                                               │
│  - persistColumnWidth(field, width)                         │
│      └─ storage.setSilent(newConfig)  ← KHÔNG trigger reload│
│      └─ widthChange$.next({field, width})                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼ SdTable subscriber chỉ mutate configuration signal
                  (KHÔNG gọi loadValues / loadFilterRegister / #reload)
```

## 4. Component & file changes

### 4.1 `SdStorage` — thêm `setSilent`

**File:** `projects/sdcorejs-angular/services/storage/src/storage.model.ts`

```typescript
export interface SdStorage<T = any> {
  get: () => T;
  set: (data: T) => void;
  setSilent: (data: T) => void;   // NEW — ghi storage không emit subject
  has: () => boolean;
  remove: () => void;
  subject: BehaviorSubject<T>;
  observer: Observable<T>;
}
```

**File:** `projects/sdcorejs-angular/services/storage/src/storage.service.ts`

Trong `create<T>(...)`, thêm:
```typescript
const setSilent = (data: T) => {
  this.#internalSet(hashKey, data, option);
  // KHÔNG gọi subject.next(data) — đây là điểm khác biệt duy nhất so với set()
};

return {
  get,
  set,
  setSilent,
  has,
  remove,
  // ...
};
```

### 4.2 `ConfigService` — thêm `persistColumnWidth` + `widthChange$`

**File:** `projects/sdcorejs-angular/components/table/src/services/config.service.ts`

```typescript
import { Subject } from 'rxjs';

@Injectable()
export class ConfigService {
  // ... existing code

  #storage?: SdStorage<ConfiguredTable>;
  #widthChange = new Subject<{ field: string; width: string }>();
  widthChange$ = this.#widthChange.asObservable();

  init = (tableOption: SdTableOption) => {
    this.#storage = this.#loadConfiguredTable(tableOption);
    return this.#storage;
  };

  persistColumnWidth = (field: string, width: string) => {
    if (!this.#storage) return;
    const current = this.#storage.get();
    const columns = current.columns ? [...current.columns] : [];
    const idx = columns.findIndex(c => c.origin.field === field);
    if (idx < 0) return;  // cột mới chưa có trong storage — bỏ qua

    columns[idx] = { ...columns[idx], width };
    this.#storage.setSilent({ ...current, columns });
    this.#widthChange.next({ field, width });
  };
}
```

Lưu ý: `init` hiện trả về `this.#loadConfiguredTable(tableOption)` — sửa để lưu reference vào `#storage` rồi return.

### 4.3 `SdColumnResizeDirective` — NEW

**File:** `projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.ts`

```typescript
import {
  Directive, ElementRef, NgZone, OnDestroy, Renderer2,
  effect, inject, input, output,
} from '@angular/core';

@Directive({
  selector: '[sdColumnResize]',
  standalone: true,
})
export class SdColumnResizeDirective implements OnDestroy {
  sdColumnResize = input.required<boolean>();   // bật/tắt
  minWidth = input<string | undefined>();
  maxWidth = input<string | undefined>();
  resizeEnd = output<string>();                  // emit 'NNpx'

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
      if (enabled) this.#enable();
      else this.#disable();
    });
  }

  ngOnDestroy() { this.#disable(); }

  #enable() {
    if (this.#handle) return;
    const th = this.#el.nativeElement;
    this.#renderer.addClass(th, 'sd-col-resize-host');  // CSS: position: relative

    const handle = this.#renderer.createElement('span');
    this.#renderer.addClass(handle, 'sd-col-resize-handle');
    this.#renderer.appendChild(th, handle);
    this.#handle = handle;

    // Bind ngoài Angular zone — không trigger CD trong khi kéo
    this.#zone.runOutsideAngular(() => {
      this.#unlistenMousedown = this.#renderer.listen(handle, 'mousedown', e => this.#onMousedown(e));
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
    event.stopPropagation();   // tránh trigger mat-sort
    const th = this.#el.nativeElement;
    this.#startX = event.clientX;
    this.#startWidth = th.getBoundingClientRect().width;
    this.#currentWidth = this.#startWidth;

    this.#renderer.setStyle(document.body, 'cursor', 'col-resize');
    this.#renderer.addClass(th, 'sd-resizing');

    this.#zone.runOutsideAngular(() => {
      this.#unlistenMove = this.#renderer.listen('document', 'mousemove', e => this.#onMousemove(e));
      this.#unlistenUp   = this.#renderer.listen('document', 'mouseup',   () => this.#onMouseup());
      this.#unlistenBlur = this.#renderer.listen('window',  'blur',       () => this.#onMouseup());
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
    // Emit vào Angular zone để consumer (SdTable) chạy bình thường
    this.#zone.run(() => this.resizeEnd.emit(finalPx));
  };

  #cleanupDrag() {
    this.#unlistenMove?.(); this.#unlistenMove = undefined;
    this.#unlistenUp?.();   this.#unlistenUp = undefined;
    this.#unlistenBlur?.(); this.#unlistenBlur = undefined;
    this.#renderer.removeStyle(document.body, 'cursor');
    if (this.#handle) {
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

Export từ `projects/sdcorejs-angular/components/table/src/directives/index.ts`.

### 4.4 `SdTable` — wire up

**File:** `projects/sdcorejs-angular/components/table/src/table.component.ts`

Imports: thêm `SdColumnResizeDirective` vào component `imports[]`.

Constructor: thêm subscription tới `#configService.widthChange$`:
```typescript
this.#subscription.add(
  this.#configService.widthChange$.subscribe(({ field, width }) => {
    const conf = this.configuration();
    if (!conf) return;
    // Mutate firstColumns + secondColumns + column map width (immutable update)
    const firstColumns = conf.firstColumns.map(c =>
      c.field === field ? { ...c, width } : c
    );
    const column = { ...conf.column };
    if (column[field]) column[field] = { ...column[field], width };
    const fixedColumn = { ...conf.fixedColumn };
    if (fixedColumn[field]) fixedColumn[field] = { ...fixedColumn[field], width };
    this.configuration.set({ ...conf, firstColumns, column, fixedColumn });
  })
);
```

Method:
```typescript
onColumnResize = (field: string, width: string) => {
  // persistColumnWidth ghi storage (silent) + emit widthChange$;
  // subscriber trong constructor đã update configuration() signal đồng bộ.
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

**Template** (`table.component.html` line 148-220) — thêm directive vào `<th>` của loop `firstColumns`:
```html
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
  ...>
```

(Loop `secondColumns` line 221-276 KHÔNG thêm directive — cột con không trong scope giai đoạn này.)

### 4.5 SCSS

**File:** `projects/sdcorejs-angular/components/table/src/table.component.scss`

Phải đặt trong cùng nesting với `.c-th` hiện có (`:host > .c-container > .c-table`):

```scss
:host {
  .c-container {
    .c-table {
      .c-th {
        // existing styles
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
    }
  }
}
```

Lý do đặt trong host: handle là child của TH (`c-th`) — selector cần khớp scope view-encapsulated của SdTable component.

## 5. Phạm vi cột

| Loại cột | Resize? | Ghi chú |
|---|---|---|
| Cột data thường (firstColumns, type !== 'children') | ✓ | Có handle, persist vào `ConfiguredColumn.width` |
| Cột cha 'children' (firstColumns, type === 'children') | ✗ | Tắt vì cha gộp header không có ý nghĩa resize |
| Cột con (secondColumns) | ✗ | Ngoài scope — chưa có model lưu width cho children |
| `sdSelection` | ✗ | Render riêng, không qua loop firstColumns |
| `sdCommand` | ✗ | Render riêng |
| `sdGroup` | ✗ | Render riêng |
| `sdSubInformation` / `sdSubInformationAction` | ✗ | Render riêng |
| `reorder` | ✗ | Render riêng |

## 6. Width constraints

- **min** = `parsePx(column.minWidth)` ?? `40` (default 40px)
- **max** = `parsePx(column.maxWidth)` ?? Infinity
- Width lưu dạng `"NNpx"` (chuỗi) — tương thích với `column.width: string` hiện có
- `parsePx` chỉ chấp nhận `/^\d+(\.\d+)?px$/i` — các đơn vị khác (`%`, `rem`, ...) trả null

## 7. Persist timing

- Trong khi kéo: chỉ update inline style trên TH qua Renderer2 (KHÔNG signal, KHÔNG storage)
- Khi `mouseup`: emit `resizeEnd(finalPx)` 1 lần → SdTable gọi `ConfigService.persistColumnWidth` → `storage.setSilent` + `widthChange$.next`
- `SdTable` subscriber cập nhật `configuration()` signal local → template re-bind `[style.width]` (đồng nhất với inline đã set trong drag — không flicker)

## 8. Edge cases

- **Chuột rời window khi đang kéo**: `window:blur` listener trigger `onMouseup` → cleanup an toàn
- **Component/directive destroy giữa drag**: `ngOnDestroy → #disable → #cleanupDrag` gỡ tất cả listeners + reset body cursor
- **Toggle `resizable` runtime**: effect trong directive add/remove handle phù hợp
- **Reset config (`onReset` của ConfigComponent)**: `storage.remove()` → subject emit undefined → effect hiện có tải lại default → width quay về `column.width` gốc trong option
- **Cột mới thêm vào option nhưng chưa có trong storage**: `persistColumnWidth` `return` sớm. Cột mới được pick up vào storage qua flow `loadConfigurationResult` đã có (cuối hàm chèn cột chưa configured).
- **Storage không có key (session, hash)**: vẫn hoạt động — `SdStorage.setSilent` hoạt động giống nhau với session/local storage

## 9. Testing

Theo pattern hiện có trong repo (xem `8b56e76`):

- **`SdColumnResizeDirective.spec.ts`**:
  - Mount TH có directive với `sdColumnResize = true` → handle được inject
  - Toggle về `false` → handle bị remove
  - Mousedown → mousemove → mouseup flow: emit `resizeEnd` với width đã clamp
  - Clamp min (default 40px khi không có column.minWidth)
  - Clamp max khi có column.maxWidth
  - `stopPropagation` trên mousedown để không trigger sort
  - Cleanup listeners trên `ngOnDestroy`

- **`config.service.spec.ts`** (bổ sung):
  - `persistColumnWidth` cập nhật đúng `ConfiguredColumn.width`
  - `widthChange$` emit đúng payload
  - Không gọi `storage.subject.next` (gián tiếp: spy `set` vs `setSilent`)

- **`storage.service.spec.ts`** (bổ sung):
  - `setSilent` ghi localStorage đúng nhưng `subject` không emit
  - `set` vẫn emit như cũ (regression)

## 10. Backward compatibility

- `resizable?: boolean` optional, default `undefined`/`false` → behavior cũ không đổi
- `SdStorage.setSilent` là method MỚI — không ảnh hưởng consumer hiện có
- Template chỉ thêm directive ở loop firstColumns; các loop khác giữ nguyên
- `ConfigService.init` signature không đổi (chỉ thêm internal storage reference)

## 11. Out of scope (tương lai nếu cần)

- Resize cột con `secondColumns` (children) — cần extend `ConfiguredColumn` model
- Resize cột đặc biệt (`sdSelection`, `sdCommand`, ...) — cần infra cấu hình riêng
- Double-click handle để auto-fit theo content
- Lưu width tính theo % của container thay vì px tuyệt đối

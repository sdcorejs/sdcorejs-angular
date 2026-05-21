# Table Column Resize â€” Design Spec

**Date:** 2026-05-15
**Component:** `@sd-angular/components/table` (SdTable)
**Status:** Approved (awaiting implementation plan)

## 1. Goal

Cho phÃ©p ngÆ°á»i dÃ¹ng thay Ä‘á»•i width cá»§a cÃ¡c cá»™t báº±ng cÃ¡ch kÃ©o tháº£ border pháº£i header. Width sau khi kÃ©o Ä‘Æ°á»£c persist vÃ o `ConfiguredColumn.width` Ä‘á»ƒ khi má»Ÿ láº¡i table giá»¯ nguyÃªn kÃ­ch thÆ°á»›c.

YÃªu cáº§u UX:
- MÆ°á»£t mÃ , khÃ´ng lag (khÃ´ng trigger reload data, khÃ´ng re-fetch values)
- Cursor `col-resize` chá»‰ hiá»‡n khi hover vÃ o border pháº£i header â€” khÃ´ng thÃªm decoration lÃ m rá»‘i UI
- KhÃ´ng cho resize cÃ¡c cá»™t Ä‘áº·c biá»‡t: `sdSelection`, `sdCommand`, `sdGroup`, `sdSubInformation`, `sdSubInformationAction`, `reorder`
- KhÃ´ng cho resize cá»™t cha `type === 'children'` (cá»™t nhÃ³m header) â€” chá»‰ cho phÃ©p resize cá»™t data thá»±c sá»±

## 2. Public API

ThÃªm cÃ¡c property má»›i vÃ o `TableOptionConfig`:

```typescript
// projects/sdcorejs-angular/components/table/src/models/table-option-config.model.ts
export interface TableOptionConfig {
  visible?: boolean;
  resizable?: boolean;  // NEW â€” báº­t/táº¯t drag-to-resize cho table
  // NEW â€” callback sau má»—i láº§n resize xong (mouseup).
  // - field: cá»™t vá»«a resize
  // - width: width má»›i cá»§a cá»™t Ä‘Ã³ (vd '220px')
  // - columnWidth: snapshot Record<field, width> toÃ n bá»™ cá»™t data cÃ³ width
  onResize?: (field: string, width: string, columnWidth: Record<string, string>) => void;
}
```

Sá»­ dá»¥ng:
```typescript
option: SdTableOption = {
  ...,
  config: {
    visible: true,
    resizable: true,
    onResize: (field, width, columnWidth) => {
      console.log(`Cá»™t ${field} â†’ ${width}`, columnWidth);
    },
  },
};
```

## 3. Kiáº¿n trÃºc

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ SdTable (table.component.ts)                                â”‚
â”‚  - imports SdColumnResizeDirective                          â”‚
â”‚  - subscribes ConfigService.widthChange$                    â”‚
â”‚  - method onColumnResize(field, width)                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚ template binding
               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ <th [sdColumnResize]                                        â”‚
â”‚      [minWidth] [maxWidth]                                  â”‚
â”‚      (resizeEnd)>                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚
               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ SdColumnResizeDirective                                     â”‚
â”‚  - inject handle <span> vÃ o host TH                         â”‚
â”‚  - mousedown â†’ start drag (lÆ°u startX, startWidth)          â”‚
â”‚  - document mousemove â†’ set inline width trÃªn TH (Renderer2)â”‚
â”‚  - document mouseup â†’ emit (resizeEnd)                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚ resizeEnd: 'NNpx'
               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ConfigService                                               â”‚
â”‚  - persistColumnWidth(field, width)                         â”‚
â”‚      â””â”€ storage.setSilent(newConfig)  â† KHÃ”NG trigger reloadâ”‚
â”‚      â””â”€ widthChange$.next({field, width})                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚
               â–¼ SdTable subscriber chá»‰ mutate configuration signal
                  (KHÃ”NG gá»i loadValues / loadFilterRegister / #reload)
```

## 4. Component & file changes

### 4.1 `SdStorage` â€” thÃªm `setSilent`

**File:** `projects/sdcorejs-angular/services/storage/src/storage.model.ts`

```typescript
export interface SdStorage<T = any> {
  get: () => T;
  set: (data: T) => void;
  setSilent: (data: T) => void;   // NEW â€” ghi storage khÃ´ng emit subject
  has: () => boolean;
  remove: () => void;
  subject: BehaviorSubject<T>;
  observer: Observable<T>;
}
```

**File:** `projects/sdcorejs-angular/services/storage/src/storage.service.ts`

Trong `create<T>(...)`, thÃªm:
```typescript
const setSilent = (data: T) => {
  this.#internalSet(hashKey, data, option);
  // KHÃ”NG gá»i subject.next(data) â€” Ä‘Ã¢y lÃ  Ä‘iá»ƒm khÃ¡c biá»‡t duy nháº¥t so vá»›i set()
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

### 4.2 `ConfigService` â€” thÃªm `persistColumnWidth` + `widthChange$`

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
    if (idx < 0) return;  // cá»™t má»›i chÆ°a cÃ³ trong storage â€” bá» qua

    columns[idx] = { ...columns[idx], width };
    this.#storage.setSilent({ ...current, columns });
    this.#widthChange.next({ field, width });
  };
}
```

LÆ°u Ã½: `init` hiá»‡n tráº£ vá» `this.#loadConfiguredTable(tableOption)` â€” sá»­a Ä‘á»ƒ lÆ°u reference vÃ o `#storage` rá»“i return.

### 4.3 `SdColumnResizeDirective` â€” NEW

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
  sdColumnResize = input.required<boolean>();   // báº­t/táº¯t
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

    // Bind ngoÃ i Angular zone â€” khÃ´ng trigger CD trong khi kÃ©o
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
    event.stopPropagation();   // trÃ¡nh trigger mat-sort
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
    // Emit vÃ o Angular zone Ä‘á»ƒ consumer (SdTable) cháº¡y bÃ¬nh thÆ°á»ng
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

Export tá»« `projects/sdcorejs-angular/components/table/src/directives/index.ts`.

### 4.4 `SdTable` â€” wire up

**File:** `projects/sdcorejs-angular/components/table/src/table.component.ts`

Imports: thÃªm `SdColumnResizeDirective` vÃ o component `imports[]`.

Constructor: thÃªm subscription tá»›i `#configService.widthChange$`:
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

**Template** (`table.component.html` line 148-220) â€” thÃªm directive vÃ o `<th>` cá»§a loop `firstColumns`:
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

(Loop `secondColumns` line 221-276 KHÃ”NG thÃªm directive â€” cá»™t con khÃ´ng trong scope giai Ä‘oáº¡n nÃ y.)

### 4.5 SCSS

**File:** `projects/sdcorejs-angular/components/table/src/table.component.scss`

Pháº£i Ä‘áº·t trong cÃ¹ng nesting vá»›i `.c-th` hiá»‡n cÃ³ (`:host > .c-container > .c-table`):

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

LÃ½ do Ä‘áº·t trong host: handle lÃ  child cá»§a TH (`c-th`) â€” selector cáº§n khá»›p scope view-encapsulated cá»§a SdTable component.

## 5. Pháº¡m vi cá»™t

| Loáº¡i cá»™t | Resize? | Ghi chÃº |
|---|---|---|
| Cá»™t data thÆ°á»ng (firstColumns, type !== 'children') | âœ“ | CÃ³ handle, persist vÃ o `ConfiguredColumn.width` |
| Cá»™t cha 'children' (firstColumns, type === 'children') | âœ— | Táº¯t vÃ¬ cha gá»™p header khÃ´ng cÃ³ Ã½ nghÄ©a resize |
| Cá»™t con (secondColumns) | âœ— | NgoÃ i scope â€” chÆ°a cÃ³ model lÆ°u width cho children |
| `sdSelection` | âœ— | Render riÃªng, khÃ´ng qua loop firstColumns |
| `sdCommand` | âœ— | Render riÃªng |
| `sdGroup` | âœ— | Render riÃªng |
| `sdSubInformation` / `sdSubInformationAction` | âœ— | Render riÃªng |
| `reorder` | âœ— | Render riÃªng |

## 6. Width constraints

- **min** = `parsePx(column.minWidth)` ?? `40` (default 40px)
- **max** = `parsePx(column.maxWidth)` ?? Infinity
- Width lÆ°u dáº¡ng `"NNpx"` (chuá»—i) â€” tÆ°Æ¡ng thÃ­ch vá»›i `column.width: string` hiá»‡n cÃ³
- `parsePx` chá»‰ cháº¥p nháº­n `/^\d+(\.\d+)?px$/i` â€” cÃ¡c Ä‘Æ¡n vá»‹ khÃ¡c (`%`, `rem`, ...) tráº£ null

## 7. Persist timing

- Trong khi kÃ©o: chá»‰ update inline style trÃªn TH qua Renderer2 (KHÃ”NG signal, KHÃ”NG storage)
- Khi `mouseup`: emit `resizeEnd(finalPx)` 1 láº§n â†’ SdTable gá»i `ConfigService.persistColumnWidth` â†’ `storage.setSilent` + `widthChange$.next`
- `SdTable` subscriber cáº­p nháº­t `configuration()` signal local â†’ template re-bind `[style.width]` (Ä‘á»“ng nháº¥t vá»›i inline Ä‘Ã£ set trong drag â€” khÃ´ng flicker)

## 8. Edge cases

- **Chuá»™t rá»i window khi Ä‘ang kÃ©o**: `window:blur` listener trigger `onMouseup` â†’ cleanup an toÃ n
- **Component/directive destroy giá»¯a drag**: `ngOnDestroy â†’ #disable â†’ #cleanupDrag` gá»¡ táº¥t cáº£ listeners + reset body cursor
- **Toggle `resizable` runtime**: effect trong directive add/remove handle phÃ¹ há»£p
- **Reset config (`onReset` cá»§a ConfigComponent)**: `storage.remove()` â†’ subject emit undefined â†’ effect hiá»‡n cÃ³ táº£i láº¡i default â†’ width quay vá» `column.width` gá»‘c trong option
- **Cá»™t má»›i thÃªm vÃ o option nhÆ°ng chÆ°a cÃ³ trong storage**: `persistColumnWidth` `return` sá»›m. Cá»™t má»›i Ä‘Æ°á»£c pick up vÃ o storage qua flow `loadConfigurationResult` Ä‘Ã£ cÃ³ (cuá»‘i hÃ m chÃ¨n cá»™t chÆ°a configured).
- **Storage khÃ´ng cÃ³ key (session, hash)**: váº«n hoáº¡t Ä‘á»™ng â€” `SdStorage.setSilent` hoáº¡t Ä‘á»™ng giá»‘ng nhau vá»›i session/local storage

## 9. Testing

Theo pattern hiá»‡n cÃ³ trong repo (xem `8b56e76`):

- **`SdColumnResizeDirective.spec.ts`**:
  - Mount TH cÃ³ directive vá»›i `sdColumnResize = true` â†’ handle Ä‘Æ°á»£c inject
  - Toggle vá» `false` â†’ handle bá»‹ remove
  - Mousedown â†’ mousemove â†’ mouseup flow: emit `resizeEnd` vá»›i width Ä‘Ã£ clamp
  - Clamp min (default 40px khi khÃ´ng cÃ³ column.minWidth)
  - Clamp max khi cÃ³ column.maxWidth
  - `stopPropagation` trÃªn mousedown Ä‘á»ƒ khÃ´ng trigger sort
  - Cleanup listeners trÃªn `ngOnDestroy`

- **`config.service.spec.ts`** (bá»• sung):
  - `persistColumnWidth` cáº­p nháº­t Ä‘Ãºng `ConfiguredColumn.width`
  - `widthChange$` emit Ä‘Ãºng payload
  - KhÃ´ng gá»i `storage.subject.next` (giÃ¡n tiáº¿p: spy `set` vs `setSilent`)

- **`storage.service.spec.ts`** (bá»• sung):
  - `setSilent` ghi localStorage Ä‘Ãºng nhÆ°ng `subject` khÃ´ng emit
  - `set` váº«n emit nhÆ° cÅ© (regression)

## 10. Backward compatibility

- `resizable?: boolean` optional, default `undefined`/`false` â†’ behavior cÅ© khÃ´ng Ä‘á»•i
- `SdStorage.setSilent` lÃ  method Má»šI â€” khÃ´ng áº£nh hÆ°á»Ÿng consumer hiá»‡n cÃ³
- Template chá»‰ thÃªm directive á»Ÿ loop firstColumns; cÃ¡c loop khÃ¡c giá»¯ nguyÃªn
- `ConfigService.init` signature khÃ´ng Ä‘á»•i (chá»‰ thÃªm internal storage reference)

## 11. Out of scope (tÆ°Æ¡ng lai náº¿u cáº§n)

- Resize cá»™t con `secondColumns` (children) â€” cáº§n extend `ConfiguredColumn` model
- Resize cá»™t Ä‘áº·c biá»‡t (`sdSelection`, `sdCommand`, ...) â€” cáº§n infra cáº¥u hÃ¬nh riÃªng
- Double-click handle Ä‘á»ƒ auto-fit theo content
- LÆ°u width tÃ­nh theo % cá»§a container thay vÃ¬ px tuyá»‡t Ä‘á»‘i


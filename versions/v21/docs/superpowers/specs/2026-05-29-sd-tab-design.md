�# sd-tab � Tab Group Component

**Date:** 2026-05-29
**Status:** Spec � pending implementation
**Owner:** anh.hoang10@onemount.com

## 1. Mục tiêu

Cung cấp cặp component `<sd-tab-group>` + `<sd-tab>` cho `@sdcorejs/angular` � wrapper khai báo (declarative content projection) trên `MatTabsModule` của Angular Material. Mục tiêu là cho ứng dụng tạo tab UI thuần (không gắn route) v�:i API gần `mat-tab-group` nhưng ��ng nhất convention `sd-*`: signals-first, OnPush, slot projection, `autoId`, i18n-bằng-string-thuần.

Đây là component thu�"c **Core UI** (`projects/sdcorejs-angular/components/tab/`) � yêu cầu test coverage �ầy �ủ (TDD: red �  green �  refactor).

`<sd-tab-router>` �ã t�n tại nhưng phục vụ tab gắn v�:i Angular Router (m�i tab = m�"t route). `<sd-tab-group>` phục vụ trường hợp tab n�"i b�" m�"t trang: chuyỒn n�"i dung trong cùng route, không thao tác URL.

## 2. Phạm vi

**In scope**
- `<sd-tab-group>` container + `<sd-tab>` child khai báo qua content projection
- Tab label string thuần + icon prefix (Material icon name) + badge / count
- Disabled state per tab
- Two-way `[(selectedIndex)]` (index-based selection model)
- Lazy load: n�"i dung tab ch�0 render khi tab active lần �ầu (matTabContent pattern)
- Closable tab: hiỒn th�9 X icon, emit `(closed)` event per tab
- Forward các knob layout của `mat-tab-group` (giữ default Material): `alignTabs`, `animationDuration`, `headerPosition`, `disableRipple`, `dynamicHeight`
- `autoId` input emit `data-autoId` cho e2e
- CSS variables �Ồ theme

**Out of scope (vòng 1)**
- Drag-and-drop reorder tabs (gi�ng editor tab)
- Add tab "+" button bên cạnh tab cu�i (dynamic add)
- Scrollable tabs override (giữ logic mặc ��9nh của mat-tab-group khi tabs tràn)
- i18n key input � caller tự d�9ch trư�:c khi truyền vào `[label]`
- Routing tích hợp � �ã thu�"c `<sd-tab-router>`
- Two-way bằng `selectedKey` / `selectedTab` reference (vòng 1 ch�0 `selectedIndex`)
- Vertical tabs (mat-tab-nav-bar / mat-tab-nav-panel pattern); ch�0 horizontal + `headerPosition`

## 3. Public API

### `<sd-tab-group>` (container)

**Selector:** `sd-tab-group`
**Class:** `SdTabGroup extends SdBaseSecureComponent`
**Standalone:** yes
**Change detection:** default (signals-driven)
**Import path:** `@sdcorejs/angular/components/tab`

**Inputs**

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `selectedIndex` | `number` (model � two-way) | `0` | Index tab �ang active. Two-way `[(selectedIndex)]`. Khi giá tr�9 vượt phạm vi �  clamp về `0` |
| `headerPosition` | `'above' \| 'below'` | `'above'` | Forward `mat-tab-group.headerPosition` |
| `alignTabs` | `'start' \| 'center' \| 'end'` | `'start'` | Forward `mat-tab-group.alignTabs` |
| `animationDuration` | `string` | `'500ms'` | Forward `mat-tab-group.animationDuration` (��9nh dạng CSS time) |
| `disableRipple` | `boolean` | `false` | Forward `mat-tab-group.disableRipple` |
| `dynamicHeight` | `boolean` | `false` | Forward `mat-tab-group.dynamicHeight` |
| `autoId` | `string \| undefined` | `undefined` | Emit `data-autoId` / `data-autoid` cho e2e |

**Outputs**

| Output | Payload | Mô tả |
|---|---|---|
| `selectedIndexChange` | `number` | Emit khi user click tab khác hoặc API set `selectedIndex` |
| `tabClosed` | `{ index: number; tab: SdTab }` | Emit khi user click nút close trên 1 tab `[closable]` |

**Public API (methods)**

```ts
selectTab(index: number): void;       // set selectedIndex + emit change
realignInkBar(): void;                 // forward mat-tab-group.realignInkBar() cho khi container resize thủ công
```

### `<sd-tab>` (child)

**Selector:** `sd-tab`
**Class:** `SdTab`
**Standalone:** yes
**Change detection:** OnPush

**Inputs**

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `label` | `string` (REQUIRED) | � | Nhãn tab. Caller tự d�9ch i18n trư�:c khi truyền |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name hiỒn th�9 bên trái label |
| `badge` | `string \| number \| null \| undefined` | `undefined` | Badge hiỒn th�9 bên phải label. Number `0` hi�!n ra, `null`/`undefined` ẩn |
| `disabled` | `boolean` | `false` | `booleanAttribute` transform. Disable tab � không click �ược, opacity giảm |
| `closable` | `boolean` | `false` | `booleanAttribute` transform. HiỒn th�9 nút X bên phải label; click X emit `(close)` |

**Outputs**

| Output | Payload | Mô tả |
|---|---|---|
| `close` | `void` | Emit khi user click nút X trên tab này (ch�0 khi `closable=true`). Parent tự xử lý remove tab khỏi data source nếu mu�n |

**Content projection**

| Slot | Mục �ích |
|---|---|
| (default) | N�"i dung của tab. Wrap trong `<ng-template matTabContent>` �Ồ lazy render � ch�0 tạo DOM khi tab �ược active lần �ầu |

## 4. Cấu trúc file

```
projects/sdcorejs-angular/components/tab/
�S���� index.ts                              # re-export public API
�S���� ng-package.json                       # secondary entry point
�S���� sd-tab.md                             # doc (mục 16)
����� src/
    �S���� tab-group.component.ts            # <sd-tab-group>
    �S���� tab-group.component.html
    �S���� tab-group.component.scss
    �S���� tab-group.component.spec.ts
    �S���� tab.component.ts                  # <sd-tab>
    �S���� tab.component.html                # template label (icon + label + badge + close)
    �S���� tab.component.scss
    ����� tab.component.spec.ts
```

**Trách nhi�!m:**

- **`SdTabGroup`** � render `<mat-tab-group>` shell, �ọc `contentChildren(SdTab)` �Ồ biết list tab. V�:i m�i `SdTab`, render 1 `<mat-tab>` truyền `[disabled]` + label template + lazy content template. Forward `selectedIndex` two-way + các knob layout xu�ng `mat-tab-group`. Render close button trong label template khi `tab.closable()` = true. Emit `tabClosed` khi user click X.
- **`SdTab`** � không tự render gì hiỒn th�9. Là 1 "config holder" chứa các signal input (`label`, `icon`, `badge`, `disabled`, `closable`) + `output close` + `ng-content` lưu vào `viewChild`/`contentChild` template ref �Ồ `SdTabGroup` �ọc qua `contentChildren`. Pattern này tương tự cách `<mat-tab>` hoạt ��"ng (không render trực tiếp � `mat-tab-group` �ọc list).

**`index.ts` export:**
```ts
export * from './src/tab-group.component';
export * from './src/tab.component';
```

**`ng-package.json`** gi�ng các component khác � entry file `index.ts`.

## 5. Data shape

Không có model interface phức tạp � toàn b�" public surface là signal inputs/outputs. Type chia sẻ:

```ts
// trong tab-group.component.ts (export gián tiếp)
export interface SdTabClosedEvent {
  index: number;
  tab: SdTab;
}
```

## 6. Architecture � pattern tab-list discovery

Mat-tab-group native dùng `@ContentChildren(MatTab)` �Ồ tự build list. Ta �i cùng pattern nhưng v�:i signal API:

```ts
@Component({
  selector: 'sd-tab-group',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, NgTemplateOutlet],
  templateUrl: './tab-group.component.html',
  // ...
})
export class SdTabGroup extends SdBaseSecureComponent {
  tabs = contentChildren(SdTab);             // signal � auto re-run khi @for thêm/b�:t tab

  selectedIndex = model<number>(0);
  headerPosition = input<'above' | 'below'>('above');
  // ... các knob khác

  tabClosed = output<SdTabClosedEvent>();

  protected onMatSelectedIndexChange(idx: number): void {
    this.selectedIndex.set(idx);
  }

  protected onClose(tab: SdTab, index: number): void {
    this.tabClosed.emit({ index, tab });
  }
}
```

Template:

```html
<mat-tab-group
  [(selectedIndex)]="selectedIndex"
  [headerPosition]="headerPosition()"
  [alignTabs]="alignTabs()"
  [animationDuration]="animationDuration()"
  [disableRipple]="disableRipple()"
  [dynamicHeight]="dynamicHeight()">
  @for (tab of tabs(); track tab; let i = $index) {
    <mat-tab [disabled]="tab.disabled()">
      <ng-template mat-tab-label>
        @if (tab.icon(); as ic) {
          <mat-icon class="mr-4">{{ ic }}</mat-icon>
        }
        <span>{{ tab.label() }}</span>
        @let _badge = tab.badge();
        @if (_badge !== null && _badge !== undefined) {
          <span class="sd-tab__badge">{{ _badge }}</span>
        }
        @if (tab.closable()) {
          <mat-icon
            class="sd-tab__close ml-4"
            (click)="$event.stopPropagation(); onClose(tab, i)">
            close
          </mat-icon>
        }
      </ng-template>

      <ng-template matTabContent>
        <ng-container [ngTemplateOutlet]="tab.bodyTpl()"></ng-container>
      </ng-template>
    </mat-tab>
  }
</mat-tab-group>
```

`SdTab` khai báo body template:

```ts
@Component({
  selector: 'sd-tab',
  standalone: true,
  template: `<ng-template #body><ng-content></ng-content></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTab {
  label = input.required<string>();
  icon = input<string | null | undefined>(undefined);
  badge = input<string | number | null | undefined>(undefined);
  disabled = input(false, { transform: booleanAttribute });
  closable = input(false, { transform: booleanAttribute });

  close = output<void>();

  bodyTpl = viewChild.required<TemplateRef<unknown>>('body');
}
```

**Lý do dùng `viewChild` + template ref:** mat-tab cần truy cập template, nhưng nếu projecting raw `<ng-content>` vào `mat-tab` content slot, mat-tab sẽ render ngay (không lazy). Pattern template ref + `matTabContent` + `ngTemplateOutlet` �ảm bảo lazy � Angular ch�0 instantiate template khi mat-tab active lần �ầu.

## 7. Lifecycle v�:i signal + effect

- `contentChildren(SdTab)` là signal � `@for` template sẽ tự re-run khi user `@if` thêm/b�:t `<sd-tab>` runtime
- `selectedIndex` là `model<number>` � two-way binding xuôi xu�ng `mat-tab-group [(selectedIndex)]`; Angular tự sync
- Effect clamp: nếu `selectedIndex()` vượt `tabs().length - 1` �  set về `0`. Áp dụng khi user remove tab cu�i �ang active

```ts
constructor() {
  super();
  effect(() => {
    const len = this.tabs().length;
    const cur = this.selectedIndex();
    if (len > 0 && cur >= len) {
      this.selectedIndex.set(Math.max(0, len - 1));
    }
  });
}
```

Không dùng `ngOnInit` / `ngAfterContentInit`.

## 8. Behavior details

### 8a. Selection
- Click tab �  `mat-tab-group` emit `selectedIndexChange` �  forward ra `selectedIndex` model
- API `selectTab(i)` �  set `selectedIndex` (clamp 0..len-1)
- Click tab `disabled` �  mat-tab-group block, không emit change
- Click X close button �  `$event.stopPropagation()` �Ồ không trigger tab select r�i emit `tabClosed`

### 8b. Lazy content
- `<ng-template matTabContent>` + `ngTemplateOutlet`: tab content ch�0 tạo DOM khi tab �ược active **lần �ầu**. Sau �ó giữ trong DOM (default mat-tab behavior, tránh re-mount m�i lần switch)
- Side-effect: ngOnInit của child component trong tab ch�0 chạy lần �ầu user m�x tab �ó

### 8c. Disabled
- `<sd-tab disabled>` �  mat-tab disabled, ripple/click b�9 chặn, opacity giảm (mat default styling)

### 8d. Closable
- `closable=true` �  render `<mat-icon>close</mat-icon>` bên phải label, cursor pointer
- Click X: stop propagation (không select tab), emit `(close)` trên `SdTab` + emit `tabClosed` trên `SdTabGroup`
- Component **không tự remove tab khỏi DOM** � parent tự xử lý `*ngIf` / state �Ồ remove. Lý do: parent quản state thật của tab list, �ặc bi�!t khi tabs render từ array dynamic

### 8e. Badge
- `badge=5` �  render span `sd-tab__badge` chứa text "5"
- `badge=null` / `undefined` �  không render
- `badge=0` �  vẫn render (s� 0 có ý nghĩa hợp l�!). Nếu caller mu�n ẩn 0 �  tự convert sang `null`

### 8f. Icon
- `icon="info"` �  render `<mat-icon>info</mat-icon>` bên trái label
- Dùng Material icons font (Material Icons hoặc Material Symbols, theo cấu hình project)

### 8g. Bounds clamp
- Effect �x mục 7 clamp `selectedIndex` khi `tabs().length` giảm
- Không emit `selectedIndexChange` thủ công � `model.set()` tự lo

## 9. Styling

### CSS variables (�ặt trên `.sd-tab-group`)
```scss
.sd-tab-group {
  --sd-tab-label-color: var(--sd-text-primary, #1a1a1a);
  --sd-tab-label-active-color: var(--sd-color-primary);
  --sd-tab-indicator-color: var(--sd-color-primary);
  --sd-tab-disabled-opacity: 0.5;
  --sd-tab-badge-bg: var(--sd-color-primary-light, #e8f0ff);
  --sd-tab-badge-color: var(--sd-color-primary);
  --sd-tab-badge-radius: 10px;
  --sd-tab-badge-padding: 0 6px;
  --sd-tab-badge-min-width: 18px;
  --sd-tab-close-color: var(--sd-text-secondary);
  --sd-tab-close-hover-color: var(--sd-color-error);
}
```

### DOM structure (tham khảo)
```html
<sd-tab-group class="sd-tab-group" data-autoId="userTabs">
  <mat-tab-group>
    <mat-tab>
      <ng-template mat-tab-label>
        <mat-icon class="mr-4">info</mat-icon>
        <span>Thông tin</span>
        <span class="sd-tab__badge">3</span>
        <mat-icon class="sd-tab__close ml-4">close</mat-icon>
      </ng-template>
      ⬦
    </mat-tab>
  </mat-tab-group>
</sd-tab-group>
```

### Style rules
- Label container `display: inline-flex; align-items: center; gap: 4px` � icon + label + badge + close align hàng ngang
- `.sd-tab__badge`: min-width `--sd-tab-badge-min-width`, height 18px, line-height 18px, font-size 11px, font-weight 500, bo tròn `--sd-tab-badge-radius`, background/color theo CSS vars
- `.sd-tab__close`: font-size 16px, opacity 0.6, hover �  opacity 1 + `--sd-tab-close-hover-color`, cursor pointer
- Disabled tab: opacity `--sd-tab-disabled-opacity`, pointer-events: none (mat-tab-group �ã set sẵn)
- Active tab indicator: forward mat-tab native bar; override color qua `::ng-deep .mat-mdc-tab .mdc-tab-indicator__content--underline { border-color: var(--sd-tab-indicator-color); }` nếu mat default l�!ch theme

## 10. Testing strategy (TDD)

Yêu cầu test �x 3 cấp:

### 10a. `SdTab` unit tests (`tab.component.spec.ts`)
- `label` required �  omit throw NG0950
- `icon`, `badge`, `disabled`, `closable` default �úng
- `badge=0` không b�9 coi là falsy (test render path)
- `disabled` boolean attribute coerce: `disabled`, `disabled="true"`, `[disabled]="false"`
- `close` output emit khi gọi tay (qua test host)
- `bodyTpl` viewChild lookup ra `TemplateRef`

### 10b. `SdTabGroup` unit tests (`tab-group.component.spec.ts` � phần logic)
- `tabs` signal cập nhật khi `@for` add/remove
- Default `selectedIndex = 0`
- Click tab N �  `selectedIndex` set thành N, emit `selectedIndexChange`
- API `selectTab(2)` set �úng + clamp khi out of range
- `selectTab(-1)` �  clamp về 0
- `selectTab(99)` �  clamp về `tabs().length - 1`
- Effect clamp khi tab cu�i active b�9 remove
- `onClose(tab, i)` emit `tabClosed` v�:i payload `{ index: i, tab }`
- Forward inputs: `headerPosition`, `alignTabs`, `animationDuration`, `disableRipple`, `dynamicHeight` set �úng trên `mat-tab-group` instance

### 10c. `SdTabGroup` integration tests (`tab-group.component.spec.ts` � phần DOM)
- Render 3 tab v�:i label "A" / "B" / "C" �  3 mat-tab-label �úng text
- Tab có `icon="info"` �  render `<mat-icon>info</mat-icon>` trong label
- Tab có `badge=5` �  render span `.sd-tab__badge` chứa "5"
- Tab `badge=0` �  vẫn render "0"
- Tab `badge=null` �  không có `.sd-tab__badge`
- Tab `disabled` �  mat-tab có `mat-mdc-tab-disabled` class, click không ��"i `selectedIndex`
- Tab `closable` �  render `.sd-tab__close`; click �  `tabClosed` emit + `selectedIndexChange` KH�NG emit (stopPropagation)
- Lazy content: tab 2 chưa �ược active �  DOM body tab 2 chưa t�n tại; click tab 2 �  DOM xuất hi�!n
- `selectedIndex` two-way: set từ parent �  mat-tab-group active �úng tab; click tab �  parent variable cập nhật
- Bounds clamp: 3 tabs, `selectedIndex=2`, parent remove tab cu�i �  `selectedIndex` clamp về 1
- `autoId="userTabs"` �  host element có `data-autoId="userTabs"`

### Test infra
- Pattern theo các spec hi�!n có trong `projects/sdcorejs-angular/components/section/section.component.spec.ts` (Jasmine + Angular TestBed, ChromeHeadless)
- Test host component khai báo `<sd-tab-group>` + `<sd-tab>` v�:i input bindings + @ViewChild ref �Ồ gọi imperative API
- Chạy: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/tab/**/*.spec.ts'`

## 11. Demo page

Thêm `projects/demo/src/app/pages/sd-tab/sd-tab-demo.component.ts` + route, theo mẫu `sd-section.component.ts`. Demo bao phủ:

1. Tab �ơn giản � 3 tab text-only
2. Tab có icon + badge + disabled
3. Tab closable � parent xử lý remove (array `signal<string[]>` + splice trong handler)
4. Lazy content � tab 2/3 chứa component "heavy" log `console.log('mounted')` �Ồ chứng minh mount tr�&
5. Two-way `[(selectedIndex)]` v�:i 2 control button "Prev" / "Next" + display index
6. Layout knobs � `headerPosition='below'`, `alignTabs='center'`, `animationDuration='0ms'`

## 12. Doc (`sd-tab.md`)

Theo template `sd-section.md`. Sections:
- Selector, import path, class, standalone, change detection
- One-line purpose
- When to use / NOT to use (link `<sd-tab-router>` cho route-driven case)
- Inputs / Outputs / Public API tables
- Content projection slot
- Visual cues
- Behaviors / quirks (lazy load, closable không tự remove, bounds clamp, badge=0)
- Examples (lấy từ demo page)
- Anti-patterns

## 13. Risks & mitigations

- **Risk:** lazy content + `ngTemplateOutlet` không tự destroy khi tab b�9 remove �  memory leak.
  **Mitigation:** mat-tab-group native �ã handle (destroy view trong `mat-tab` destroy hook); ta ch�0 forward template, không lấn quyền lifecycle.

- **Risk:** override màu indicator qua `::ng-deep` có thỒ vỡ khi Angular Material 19 ��"i class name.
  **Mitigation:** pin class hi�!n tại trong `tab-group.component.scss`, kèm `// why:` comment ch�0 rõ phiên bản mat �ang dựa vào; nếu break �x major bump, sửa trong 1 ch�.

- **Risk:** caller render `@for` over array dynamic; identity tab thay ��"i giữa các tick (no track key) �  `contentChildren` mất �"n ��9nh.
  **Mitigation:** doc bắt bu�"c dùng `track tab.id` hoặc `track $index` �x phía caller; demo gương mẫu.

- **Risk:** `closable=true` + parent quên xử lý �  click X không có hi�!u ứng visible.
  **Mitigation:** doc nêu rõ "component không tự remove"; demo show pattern remove qua signal array.

- **Risk:** click vùng X trên tab disabled vẫn emit `(close)` mặc dù tab không tương tác �ược.
  **Mitigation:** trong template, gate `(click)` bằng `!tab.disabled()`; test cover case này.

## 14. Out of scope (deferred)

- **Vertical tabs / tab-nav-bar** � defer �ến khi có yêu cầu cụ thỒ từ m�"t consumer
- **Add "+" button** � defer �ến khi có editor-like use case
- **Drag reorder** � defer �ến khi tab list dài + cần reorder thường xuyên
- **i18n key input** � defer; nếu nhiều caller phàn nàn boilerplate `i18n.t()`, sẽ thêm `[i18nKey]` optional �x v2
- **`selectedKey` / `selectedTab` ref two-way** � defer �ến khi có use case index không �"n ��9nh
- **Scrollable header tùy biến** (chevron tay) � defer; mat default �ã có pagination khi overflow

## 15. Acceptance criteria

Spec coi như �ạt khi:

1. �S& Build `npm run build` xanh (typecheck + ng-packagr) � entry m�:i �x `@sdcorejs/angular/components/tab` xuất bản OK
2. �S& Tất cả test trong `projects/sdcorejs-angular/components/tab/src/*.spec.ts` xanh �x `ChromeHeadless`
3. �S& Demo page `/sd-tab` m�x �ược, 6 scenario �x mục 11 hiỒn th�9 �úng visual
4. �S& Two-way `[(selectedIndex)]` hoạt ��"ng cả chiều xuôi và ngược
5. �S& Lazy content xác nhận qua `console.log('mounted')` ch�0 in khi tab tương ứng �ược active lần �ầu
6. �S& Closable tab: click X �  `tabClosed` emit + `selectedIndexChange` không emit; parent splice array �  tab biến mất, `selectedIndex` clamp tự ��"ng
7. �S& Disabled tab: click không ��"i `selectedIndex`; nếu disabled tab cũng `closable`, click X không emit `(close)`
8. �S& Bounds clamp: remove tab cu�i �ang active �  `selectedIndex` lùi về index hợp l�!, không l�i runtime
9. �S& `autoId="x"` �  host có `data-autoId="x"` (e2e selector)
10. �S& `sd-tab.md` kh�:p hoàn toàn v�:i public API hi�!n tại (mọi input/output/method có trong code �ều có trong doc, và ngược lại)

## 16. Open questions (giải quyết trư�:c plan)

- Có cần expose `(animationDone)` từ mat-tab-group ra ngoài không? � hi�!n không, defer
- Tab có cần `[selected]` input riêng (true/false) thay vì ch�0 index? � hi�!n không, defer (sẽ kéo theo bài toán "2 tab cùng selected"); ch�t API ch�0 qua `selectedIndex`
- Có project `<sd-badge>` component thay vì span thô cho badge không? � ch�t span thô vì nhẹ và badge �x �ây ch�0 là count/text 1 dòng, không cần variant color của `<sd-badge>`. Có thỒ ��"i sau.


# sd-tree điều hướng, thanh chọn nhiều dùng chung, bỏ mat-menu còn lại của sd-table · thông số

Nguồn chính của gói. HTML (`SD Tree Review.dc.html`) là minh hoạ; khi khác nhau, theo file này. Đọc trên `main` ngày 09/11/2026: `components/tree/**`, `components/table/src/components/selector-action/*`, `components/table/src/components/command/desktop-command.*`, `components/table/src/components/filter/external-filter/*`, `components/table/src/components/filter/mobile-filter/mobile-filter-field.*`, `components/button/src/action-popover.*`.

Mã: R1–R8 (sd-tree), Q1–Q8 (mục 07 của HTML, đã chốt), SB (thanh chọn), MM (mat-menu).

Độc lập với gói `design-query-bar-panels` đang làm. Hai gói không sửa cùng file, trừ khả năng cùng chạm `table.component.html` (vị trí thanh chọn): rebase khi gói kia merge trước.

## 0. Phạm vi

Làm:
1. **sd-tree chế độ điều hướng** (R1–R7), sau cờ `navigation`; mặc định cây chạy như hiện tại.
2. **Trạng thái gốc** của sd-tree (R8), áp cho mọi cây.
3. **Thanh chọn nhiều dùng chung** (SB): tách `selector-action` của sd-table thành component nội bộ; sd-tree dùng thay `sd-quick-action` nổi; ô icon đổi sang primary ở cả hai.
4. **Bỏ `mat-menu` còn lại của sd-table** (MM): menu thiết lập của external filter, menu toán tử của trang lọc mobile → `sd-button` + `sd-button-item`.

Không làm: drag để chuyển nút cây, chỉnh sửa tên ngay trên hàng, virtual scroll, đổi `sd-tree-select`, đổi giao diện menu lệnh trên hàng (đã là Action Popover, Q8).

## 1. File
```
versions/v19/projects/sdcorejs-angular/
  components/tree/sd-tree.md
  components/tree/src/tree.model.ts | tree.component.{ts,html,scss,spec.ts} | tree-empty-def.directive.ts (mới)
  components/table/src/components/selector-action/*   → chuyển nội dung sang component dùng chung, giữ selector cũ bọc lại
  <chỗ dùng chung do Bước 0 đề xuất>/selection-bar/*  // ví dụ components/quick-action/src/selection-bar/ (nội bộ ɵ)
  components/table/src/components/filter/external-filter/*
  components/table/src/components/filter/mobile-filter/mobile-filter-field.*
  components/table/sd-table.md
i18n/src/{vi,en,ja,ko,zh}.ts
showcase: trang sd-tree (ví dụ tree-detail), trang sd-table (chọn nhiều)
CHANGELOG.md
```

## 2. sd-tree: model và API (cộng thêm)

```ts
// SdTreeItemBase
count?: number | null;                                   // R3

// SdTreeComponentOptionBase
navigation?: boolean;                                    // R1, mặc định false
onActivate?: (event: { item: T; node: SdTreeNode<T> }) => void;

// SdTreeLazyOption
onResolvePath?: (id: string, signal: AbortSignal) => Promise<readonly string[]>;   // R2: id từ gốc tới cha trực tiếp
onSearch?: (text: string, signal: AbortSignal) => Promise<readonly { path: readonly SdTreeItemLazy<T>[] }[]>;  // R6

// SdTree
readonly activeId = model<string | null>(null);                 // R1, Q1: model trên component
readonly expandedIds = model<readonly string[] | undefined>();  // R7, undefined: cây tự quản lý như hiện tại
readonly activeChange = output<{ item: T; node: SdTreeNode<T> }>();
reveal(id: string): Promise<boolean>;      // R2
reloadNode(id: string): Promise<void>;     // R5
expand(id: string): Promise<boolean>;
collapse(id: string): void;
focusNode(id: string): boolean;

// Template
<ng-template sdTreeEmptyDef let-searching="searching" let-text="text">…</ng-template>   // R8
```
Ghi ngoại lệ trong `sd-tree.md`: `activeId`, `expandedIds` là model trên component (hai chiều với URL), phần còn lại dùng `[option]`.

## 3. R1: nút đang mở
- `navigation: true`: bấm vào hàng (trừ chevron, checkbox/radio, ⋯) hoặc Enter trên hàng → `activeId = node.id`, phát `activeChange` và `onActivate`. Bấm lại nút đang mở: vẫn phát (consumer có thể tải lại bên phải).
- Bấm chevron: chỉ mở/đóng, không đổi nút đang mở.
- Giao diện hàng đang mở: nền `--sd-tree-selected-bg`, icon `primary`, ⋯ luôn hiện. Khi `navigation` bật, checkbox đã tick **không** tô nền hàng (Q2); checkbox tự thể hiện trạng thái.
- `aria-selected="true"` cho nút đang mở, các nút khác `false`; checkbox dùng `aria-checked` (Q3). Không bật `navigation`: giữ như hiện tại.
- `activeId` trỏ tới id không có trong cây đã tải: giữ giá trị, không tô gì; khi nút được tải (lazy) thì tô.

## 4. R2: mở tới nút theo id
- `reveal(id)`: static tìm đường đi trong `items`; lazy gọi `onResolvePath(id)` rồi lần lượt `onExpandChildren` cho từng nút trên đường (dùng cache nếu đã tải). Mở các nút cha, cuộn tới nút trong vùng cuộn gần nhất của cây bằng `scrollTop` (không `scrollIntoView`), không lấy focus. Trả `false` khi không tìm thấy, bị huỷ, hoặc lỗi tải.
- `activeId` đổi từ ngoài (không do người dùng bấm): tự gọi `reveal`. Lần đổi mới huỷ lần trước (`AbortSignal`).
- Lỗi tải một nút trên đường: nút đó hiện trạng thái lỗi như hiện tại, `reveal` trả `false`, phát `loadError`.

## 5. R3: số đếm
`count` (số nguyên ≥ 0) hiển thị sau nhãn, trước ⋯: `padding-top: 6px; padding-left: 8px`, 12/16, `--sd-tree-muted`, `tabular-nums`, định dạng nghìn theo locale. Chỗ của ⋯ luôn được giữ (đang dùng `opacity`), nên số không nhảy. Tên đọc của hàng: “{label}, {count}”. `null`/không có: không vẽ.

## 6. R4: ⋯ dùng được bằng bàn phím
- ⋯ hiện khi: hover hàng (như cũ), hàng có focus (`:focus-within` hoặc hàng là phần tử focus), nút đang mở, `pointer: coarse` (luôn hiện).
- Shift+F10 hoặc phím ContextMenu trên hàng đang focus: mở menu ⋯ của hàng đó (Action Popover hiện có). Đóng menu: focus về hàng.
- `aria-label` của ⋯: `core.component.tree.open-menu` với `{label}` (mới).

## 7. R5: thao tác theo id
`reloadNode(id)`: lazy xoá cache con của nút, gọi lại `onExpandChildren`, giữ trạng thái mở; static: không làm gì. `expand(id)` trả `false` khi không tìm thấy hoặc là lá. `focusNode(id)` đặt roving tabindex và focus. Luồng thêm nút con trong showcase: `reloadNode(cha)` → `expand(cha)` → `activeId = mới`.

## 8. R6: tìm trên server
- `onSearch` có (lazy): `filter(text)` gọi `onSearch` (debounce theo cách quick search của sd-table, Q4; huỷ lần trước). Kết quả hiển thị thay cây: mọi nút trên các `path`, gộp nút trùng id, mở hết; nút khớp chữ thường, nút chỉ là cha giữ lại chữ `--sd-tree-muted`.
- Tô phần khớp (cả static và lazy): `<mark>` nền `--sd-warning-container`, bo 2px, chữ giữ màu; khớp không dấu như `normalizeText` hiện có.
- Xoá chữ: trả cây về trạng thái mở ngay trước khi tìm, giữ `activeId`.
- Không có `onSearch`: giữ `filter()` hiện tại (chỉ nút đã tải), thêm tô phần khớp.

## 9. R7: giữ trạng thái mở
`expandedIds` có giá trị thì là nguồn của trạng thái mở (hai chiều); mở/đóng phát `expandedIdsChange`. `undefined`: như hiện tại (`expanded`, `defaultExpanded`). Đổi `items` không reset `expandedIds`.

## 10. R8: trạng thái gốc (mọi cây)
| Trạng thái | Hiện tại | Mới |
| --- | --- | --- |
| Đang tải | spinner 24px, khối ≥ 120px | Giữ. |
| Lỗi | `errorMessage()` hiện `error.message` nguyên văn; cả khối màu lỗi; nút tự vẽ 36px viền `currentColor` | Icon `error` 24px `--sd-error`; chữ `core.component.tree.load-error` (không hiện exception, SC-16) màu `--sd-text`; nút `sd-button` outline size sm “Thử lại”. Giữ `role="alert"`, `retry()`, `loadError`. `errorMessage()` không còn dùng cho UI (giữ public nếu đã export, đánh dấu deprecated). |
| Rỗng | role="tree" trống | Chữ `core.component.tree.empty` (“Chưa có mục nào”), 14px `--sd-tree-muted`, giữa khối ≥ 120px. |
| Không khớp tìm | role="tree" trống | `core.component.tree.no-match` với `{text}`. |
| Template | — | `sdTreeEmptyDef` thay cả hai, context `{ searching: boolean; text: string }`. |

## 11. Bàn phím (navigation bật)
| Phím | Hành vi |
| --- | --- |
| Enter | Mở nút (R1). |
| Space | Đổi lựa chọn checkbox khi có selector; không có thì không làm gì. |
| ↑ ↓ Home End | Như hiện tại, không mở nút. |
| ← → | Như hiện tại. |
| Shift+F10, ContextMenu | Mở menu ⋯ (R4). |
Navigation tắt: không đổi.

## 12. SB: thanh chọn nhiều dùng chung
- Tách nội dung `components/table/src/components/selector-action/*` (template, style, `action-filter.pipe.ts` chia nút trực tiếp và “Thêm”) thành component nội bộ `ɵSdSelectionBar` (Bước 0 chọn chỗ đặt). Bảng dùng lại, không đổi giao diện trừ ô icon.
- Giao diện (giữ từ bảng): `<sd-quick-action opened contained>`, host `padding-inline: 8px`; khung `padding: 10px 12px; margin: 8px 0; border: 1px solid var(--sd-border); border-radius: var(--sd-radius-10, 10px); box-shadow: none; gap: 16px`; message 13/20 gap 8px; nút `sd-button size="sm"` mặc định `type="light"`; nút “Thêm” `suffixIcon="more_horiz"`, `color="secondary"`, `type="light"`; nút xoá chọn 32px bo 8px, hover `--sd-surface-variant`.
- **Ô icon** (Q7): 28px bo 8px, nền `--sd-primary-light`, icon `check_circle_outline` 18px `--sd-primary`, ở cả bảng và cây (bảng đang dùng `--sd-success-light` / `--sd-success-dark`).
- Hẹp: theo bề rộng host < 600px bằng `ResizeObserver` (có kiểm tra tồn tại), thay `@media (max-width: 600px)`: khung xuống dòng gap 8px, nút giãn đủ hàng cao 40px, nút xoá chọn 40px ở góc trên phải, message `padding-right: 36px`.
- **sd-tree**: thay `<sd-quick-action [opened]>` nổi bằng `ɵSdSelectionBar`, đặt sau các hàng trong host, `position: sticky; bottom: 0` trong vùng cuộn gần nhất, nền `--sd-surface`. Khi thanh mở, host thêm `padding-bottom` bằng chiều cao thanh để không che hàng cuối. Message: `selector.message` hoặc `core.component.tree.selected-count`. Actions: `selector.actions` giữ shape (`icon`, `title`, `tooltip`, `color`, `type`, `fontSet`, `hidden`, `click`); ánh xạ sang input của thanh. Điều kiện mở giữ: có mục chọn và ít nhất một action không hidden (`sd-tree-select` không có thanh). Bỏ style `.c-bg-length`, `.c-length`, `.c-message`, `.sd-tree__qa-*`.
- autoId giữ: `components-tree-<autoId>-selection-action-<index>`, `components-tree-<autoId>-clear-selection`; bảng giữ autoId hiện có.

## 13. MM: bỏ mat-menu còn lại của sd-table
| Chỗ | Hiện tại | Mới |
| --- | --- | --- |
| `external-filter.component.html` menu `sd-custom-panel-filter-configuration` (`setting-menu`) | `mat-menu` + `mat-menu-item` | Trigger là `sd-button` (giữ icon, tooltip, autoId hiện có), mục là `sd-button-item`. Giữ nguyên các mục, thứ tự, hành vi và autoId của từng mục. |
| `mobile-filter-field.component.html` menu toán tử `sd-table-mobile-operator-menu` | nút chữ + `mat-menu` | Trigger `sd-button` type text (giữ nhãn toán tử đang chọn), mục `sd-button-item`; toán tử đang chọn có `suffixIcon="check"`. Panel cảm ứng: hàng 44px (Action Popover đã có). |
Bỏ `MatMenuModule` khỏi hai component; style `.sd-custom-panel-filter-configuration`, `.sd-table-mobile-operator-menu` chuyển hoặc bỏ. Spec đang tìm `[mat-menu-item]` đổi sang `.sd-action-item`.

## 14. i18n (`core.component.tree.*`, 5 locale)
| Key | vi | en |
| --- | --- | --- |
| `empty` | Chưa có mục nào | Nothing here yet |
| `no-match` | Không tìm thấy mục khớp “{text}” | No items match “{text}” |
| `open-menu` | Thao tác với {label} | Actions for {label} |
| `load-error` | (giữ key, đổi chữ) Không tải được danh sách. | The list couldn't be loaded. |

## 15. Test (RED trước, tên test có mã)
| Mã | Nội dung |
| --- | --- |
| TR-01 | navigation tắt: hành vi bấm, Enter, aria như hiện tại (hồi quy). |
| TR-02 | navigation bật: bấm hàng, Enter → activeId, activeChange, onActivate; bấm chevron/checkbox/⋯ không đổi. |
| TR-03 | Nền và icon của nút đang mở; checkbox tick không tô nền khi navigation bật; aria-selected/aria-checked đúng. |
| TR-04 | reveal static, lazy (onResolvePath), id không có, huỷ khi activeId đổi tiếp, lỗi tải giữa đường. |
| TR-05 | activeId đổi từ ngoài tự reveal, không lấy focus; cuộn bằng scrollTop (spy scrollIntoView không được gọi). |
| TR-06 | count: hiển thị, định dạng, null không vẽ, tên đọc có số. |
| TR-07 | ⋯ hiện khi focus, nút đang mở, coarse; Shift+F10 mở menu, đóng trả focus về hàng. |
| TR-08 | reloadNode, expand, collapse, focusNode theo id. |
| TR-09 | onSearch: debounce, huỷ lần trước, gộp path, nút cha muted, tô phần khớp, xoá tìm trả trạng thái mở cũ. |
| TR-10 | expandedIds hai chiều; đổi items không reset. |
| TR-11 | Trạng thái gốc: lỗi không hiện chuỗi exception (throw `new Error('SECRET')`), nút sd-button, rỗng, không khớp, sdTreeEmptyDef. |
| SB-01 | Bảng: thanh như cũ, ô icon primary; autoId giữ. |
| SB-02 | Cây: thanh trong host, sticky, padding-bottom khi mở; không có action → không có thanh (sd-tree-select). |
| SB-03 | Hẹp theo host < 600px (FakeResizeObserver); không ResizeObserver không throw. |
| SB-04 | Nút “Thêm” gom action theo cùng quy tắc ở bảng và cây. |
| MM-01 | external filter: menu thiết lập là Action Popover, đủ mục, autoId giữ, hành vi giữ. |
| MM-02 | mobile filter: menu toán tử là Action Popover, toán tử đang chọn có check, chọn đổi toán tử. |
| MM-03 | Grep: không còn `MatMenu`, `mat-menu`, `matMenuTriggerFor` trong `components/table` và `components/tree`. |
E2E showcase: tree-detail (bấm nút, mở trang có `?category=` → reveal, tìm, thêm nút con), chọn nhiều trong cây ở 640px và 360px, external filter và mobile filter. Ảnh chụp so với HTML mục 01–05 ở light, dark, RTL.

Coverage file đã sửa: statements ≥ 90%, branches ≥ 85%.

## 16. Review độc lập
- R1 sau checkpoint 3: phiên Claude Code mới, không có lịch sử, không sửa code. Kiểm mục 2–9, TR-01…TR-10. Thử phá: bỏ huỷ reveal cũ; cho checkbox tô nền khi navigation bật; bỏ giữ chỗ ⋯ → phải có test đỏ.
- R2 sau checkpoint cuối: toàn bộ file, lệnh đầy đủ. Thử phá: hiện lại error.message; bỏ sticky của thanh; để lại một mat-menu → phải có test đỏ (MM-03).
- Báo cáo `.sdcorejs/handoff/design-tree-selection/reviews/R1.md`, `R2.md`.

## 17. Checkpoint (mỗi checkpoint một commit)
1. Model, API, R1, R3, R4 (TR-01…03, 06, 07).
2. R2, R5, R7 (TR-04, 05, 08, 10).
3. R6 và tô phần khớp (TR-09). **R1.**
4. R8 trạng thái gốc (TR-11).
5. SB: tách thanh chọn, bảng dùng lại, ô icon primary, cây dùng thanh (SB-01…04).
6. MM (MM-01…03); `sd-tree.md`, `sd-table.md`, i18n, showcase, `CHANGELOG.md`, `npm run sync`, `check:sync`. **R2.**

## 18. Câu hỏi cho Bước 0
1. Chỗ đặt `ɵSdSelectionBar` (quick-action, table, hay một entry nội bộ mới) để cả table và tree import mà không tạo phụ thuộc vòng.
2. Vùng cuộn của cây: `reveal` và sticky dùng phần tử cuộn gần nhất hay cây tự có vùng cuộn; showcase tree-detail đặt cuộn ở đâu.
3. Lazy `reveal`: `onExpandChildren` hiện có chạy tuần tự được cho cả đường đi không, có cần giới hạn số mức.
4. `filter()` hiện có trả về nút cha của kết quả chưa (để tô muted cho cả static).
5. Danh sách mục trong menu thiết lập của external filter và các autoId để giữ.
6. `errorMessage()` có được export public không, có nơi nào ngoài cây dùng không.

# sd-table · Modal Thiết lập và đánh dấu nút Thiết lập

Nguồn chính của đợt này. Bản mẫu: `Table Settings Spec.dc.html` (3a: tab Cột, 3b: nút Thiết lập).

Đọc trên `sdcorejs/sdcorejs-angular@main` (69e2d24):
- `components/table/src/components/config/config.component.{html,ts,scss}`;
- `services/config.service.ts`, `models/table-option-config.model.ts`;
- `table.component.html` (footer);
- `components/button/sd-button.md` (indicator), `forms/input/sd-input.md`, `components/modal/sd-modal.md`.

## Tóm tắt
- Tab Cột của modal Thiết lập đổi từ bảng 5 cột (2 ô nhập + 3 checkbox mỗi dòng) sang danh sách. Mỗi dòng gồm: nút kéo ⠿, ô Hiện, tên cột và tóm tắt. Bấm dòng để mở phần sửa tiêu đề, độ rộng, cố định, rút gọn.
- Thêm ô tìm cột (khi hơn 8 cột), số cột đang hiện, nút Hiện tất cả, đổi thứ tự bằng bàn phím.
- Input dùng `sd-input size="sm"` có float label. Nút dùng `sd-button size="sm"` dáng M3 mặc định. Khôi phục mặc định chuyển sang `sdFooterLeft`.
- Nút Thiết lập ở footer bảng có chấm primary khi người dùng đã có thiết lập khác mặc định. Dùng `indicator` sẵn có của sd-button.
- Không đổi dữ liệu lưu, storage key, `loadConfigurationResult`, autoId footer.

## Hiện trạng
| Chỗ | Hiện nay | Đợt này |
| --- | --- | --- |
| `config.component.html` | `sd-modal width="sm"`, gợi ý kéo thả, `mat-table` 5 cột: Hiển thị (handle + checkbox), Tiêu đề cột, Độ rộng (`sd-input size="sm"` không label), Cố định, Giới hạn ký tự | danh sách `cdkDropList`, phần chi tiết mở theo dòng |
| `config.component.ts` | kéo chỉ bật qua `handleMouseDown` / `dragDisabled`; `isRowDisabled` khoá dòng ẩn | `cdkDragHandle`, kéo bằng phím, giữ quy tắc khoá |
| Footer modal | Bỏ qua · Mặc định (primary viền) · Áp dụng, cùng `sdFooterRight` | Khôi phục mặc định ở `sdFooterLeft` |
| `table.component.html` nút `-config` | `sd-button type="text" prefixIcon="settings"`, không có indicator | thêm `indicator` |
| Tab Bộ lọc (đợt query bar, nếu đã có) | | không đổi nội dung; dùng khung và footer mới |

Áp dụng cho mọi bảng có `config.visible`, không phụ thuộc mode lọc. Không đổi:
- `ConfiguredColumn`, `ConfiguredTable`;
- storage và `ConfigService`;
- `loadConfigurationResult`.

### Khung modal
- `sd-modal width="sm"` giữ nguyên.
- Footer, mọi nút đều `size="sm"` và giữ dáng mặc định của sd-button (không override radius):
  - `sdFooterLeft`: `sd-button type="text" color="primary" prefixIcon="restart_alt"`, nhãn `config.reset`, autoId `-config-reset`. Vẫn hỏi xác nhận như cũ.
  - `sdFooterRight`: Bỏ qua (`type="outline"`) và Áp dụng (`type="fill" color="primary"`).

### Thanh công cụ
- **Ô tìm**: `sd-input size="sm" hideInlineError`, icon search, rộng 220px, placeholder `config.find-column`.
  - Chỉ hiện khi có hơn 8 cột.
  - Lọc theo cả tiêu đề hiện tại lẫn tiêu đề gốc, không dấu, không phân biệt hoa thường.
  - Khi đang tìm thì tắt kéo thả và thay dòng gợi ý bằng `config.drag-disabled-search`.
- **Bên phải**: dòng "Hiện {shown}/{total} cột" (`config.shown-count`) và nút "Hiện tất cả" (`sd-button type="text" size="sm"`). Nút tắt khi mọi cột đã hiện.
- **Gợi ý kéo thả**: `config.drag-hint` đổi nội dung (mục i18n bên dưới).

### Dòng
- Bỏ mat-table, thay bằng danh sách dọc `cdkDropList`, mỗi dòng là `cdkDrag`, kéo bằng `cdkDragHandle`.
  - Preview và khe rơi giữ style hiện có, chỉ đổi selector từ `.mat-mdc-cell` sang dòng.
  - `dragDisabled`, `handleMouseDown`, `handleMouseUp` bỏ nếu `cdkDragHandle` đã đủ.
- Dòng cao 44px, đệm `0 8px 0 12px`, gap 10px. Thứ tự từ trái sang:
  1. Handle ⠿: là `button`, icon 20px, màu `--sd-text-disabled`.
  2. `sd-checkbox` Hiện: không bao giờ bị khoá.
  3. Nút mở dòng, chiếm phần còn lại, gồm:
     - tiêu đề 14px, cắt "…"; cột ẩn thì màu `--sd-text-disabled`;
     - icon `push_pin` 16px màu primary nếu cột cố định;
     - icon `short_text` 16px màu chữ phụ nếu cột rút gọn;
     - độ rộng tóm tắt, 12px chữ phụ, số tabular: "120 px" / "Tự động" / "Đang ẩn";
     - chevron `expand_more` / `expand_less`.
- Nút mở dòng có `aria-expanded` và `aria-controls`. Mỗi lúc chỉ mở một dòng.
- Cột ẩn vẫn mở được dòng, nhưng các ô trong phần chi tiết bị khoá (như `isRowDisabled` hiện nay).
- Dòng đang mở có nền `--sd-surface`. Các dòng ngăn nhau bằng viền `--sd-border`.

### Phần chi tiết
- Đệm `8px 16px 14px 62px` để thẳng hàng với tiêu đề.
- **Hàng 1**: grid `minmax(0,1fr) minmax(0,112px)`, gap 12px.
  - **Tiêu đề**: `sd-input size="sm" hideInlineError`, label `core.component.table.column-header`, placeholder là tiêu đề gốc.
    - Khi khác tiêu đề gốc, dưới ô hiện dòng 12px: "Gốc: {title} · Khôi phục" (`config.origin`, `config.restore`).
    - Bấm Khôi phục thì xoá `title`.
  - **Độ rộng**: `sd-input size="sm" hideInlineError type="number"`, label `core.component.table.width`, hậu tố "px" qua `sdSuffixDef`, placeholder `config.width-auto`.
    - Lưu thành `${n}px`; để rỗng thì lưu `undefined` (dùng độ rộng gốc hoặc tự động).
    - Kẹp về `minWidth` / `maxWidth` của cột khi lưu.
    - Giá trị đang có không phải px (%, rem…): hiện nguyên văn dạng text, không có hậu tố. Người dùng nhập số thì chuyển sang px.
- **Hàng 2**: flex wrap, gap 8px 24px, gồm hai `sd-checkbox`:
  - `config.fixed-label`;
  - `config.truncate-label`, có hint `config.truncate-hint`.
- Không xoá key cũ `core.component.table.fixed` / `char-limit`.

### Bàn phím
- Handle nhận focus.
  - Space hoặc Enter: nhấc dòng.
  - ↑ / ↓: di chuyển (`moveItemInArray`).
  - Space hoặc Enter: thả.
  - Esc: huỷ, về vị trí cũ.
- Vùng live báo từng bước: `config.reorder-picked`, `-moved`, `-dropped`, `-cancelled`.
- Thứ tự Tab:
  1. ô tìm, rồi Hiện tất cả;
  2. từng dòng: handle → checkbox → nút mở;
  3. khi dòng đang mở: Tiêu đề → Khôi phục → Độ rộng → 2 checkbox;
  4. footer.

### Đánh dấu nút Thiết lập
- Nút `-config` trong `table.component.html` thêm:
  - `[indicator]="hasCustomSetup()"`;
  - `indicatorColor="primary"`;
  - `[indicatorLabel]="'core.component.table.config.customized' | sdTranslate"`.
- Chỉ desktop; nút Công cụ trên mobile không đổi.
- `hasCustomSetup()` là true khi có ít nhất một điều sau:
  - Cấu hình cột đã lưu khác `#default(option)` ở thứ tự, `invisible`, `title`, `width`, `fixed` hoặc `truncate`. So sánh sau khi bỏ cột không còn trong option và cột mới chưa có trong storage.
  - Độ rộng đã đổi bằng kéo trên bảng (`persistColumnWidth`). Giá trị này nằm trong storage nên tự được tính ở điều trên.
  - Có `TableFilterConfiguration.mode` (chỉ khi `modeSelectable`).
  - `inlineExternal` khác giá trị khởi tạo.
- Không có `option.key`: tính theo storage phiên.
- Khôi phục mặc định: false ngay.

### Spec
- `config.component.spec.ts`:
  - ô tìm chỉ hiện khi hơn 8 cột; tìm theo tiêu đề gốc và hiện tại, không dấu;
  - đang tìm thì không kéo được;
  - Hiện tất cả và số đếm;
  - mở một dòng thì đóng dòng khác;
  - cột ẩn khoá phần chi tiết nhưng ô Hiện vẫn bấm được;
  - Khôi phục tiêu đề;
  - độ rộng: số → `px`, rỗng → `undefined`, `%` giữ nguyên, kẹp min/max;
  - đổi thứ tự bằng phím và Esc; vùng live báo đúng;
  - autoId của footer giữ nguyên.
- Bảng, chấm trên nút Thiết lập:
  - mặc định tắt;
  - bật sau khi Áp dụng có thay đổi;
  - bật sau khi kéo đổi độ rộng;
  - tắt sau Khôi phục mặc định;
  - thêm cột mới vào option không làm chấm bật;
  - mobile không có chấm.

### i18n
| Key | vi | en | ja | ko | zh |
| --- | --- | --- | --- | --- | --- |
| `core.component.table.config.reset` | Khôi phục mặc định | Restore defaults | デフォルトに戻す | 기본값으로 복원 | 恢复默认 |
| `core.component.table.config.find-column` | Tìm cột | Find column | 列を検索 | 열 찾기 | 查找列 |
| `core.component.table.config.shown-count` | Hiện {shown}/{total} cột | {shown}/{total} columns shown | {total}列中{shown}列を表示 | {total}개 중 {shown}개 열 표시 | 显示 {shown}/{total} 列 |
| `core.component.table.config.show-all` | Hiện tất cả | Show all | すべて表示 | 모두 표시 | 全部显示 |
| `core.component.table.config.drag-hint` (đổi) | Kéo ⠿, hoặc chọn ⠿ rồi dùng ↑ ↓ để đổi thứ tự. | Drag ⠿, or focus ⠿ and use ↑ ↓ to reorder. | ⠿ をドラッグするか、⠿ を選択して ↑ ↓ で並べ替えます。 | ⠿을 드래그하거나 ⠿을 선택하고 ↑ ↓로 순서를 바꾸세요. | 拖动 ⠿，或选中 ⠿ 后用 ↑ ↓ 调整顺序。 |
| `core.component.table.config.drag-disabled-search` | Xoá ô tìm để đổi thứ tự. | Clear the search to reorder. | 並べ替えるには検索をクリアしてください。 | 순서를 바꾸려면 검색을 지우세요. | 清除搜索后可调整顺序。 |
| `core.component.table.config.width-auto` | Tự động | Auto | 自動 | 자동 | 自动 |
| `core.component.table.config.hidden` | Đang ẩn | Hidden | 非表示 | 숨김 | 已隐藏 |
| `core.component.table.config.origin` | Gốc: {title} | Original: {title} | 元: {title} | 원래: {title} | 原始：{title} |
| `core.component.table.config.restore` | Khôi phục | Restore | 戻す | 복원 | 恢复 |
| `core.component.table.config.fixed-label` | Cố định khi cuộn ngang | Keep visible when scrolling horizontally | 横スクロール時に固定 | 가로 스크롤 시 고정 | 横向滚动时固定 |
| `core.component.table.config.truncate-label` | Rút gọn nội dung dài | Shorten long content | 長い内容を省略 | 긴 내용 줄이기 | 缩短长内容 |
| `core.component.table.config.truncate-hint` | Cắt bằng "…", rê chuột để xem đủ. | Cut with "…"; hover to see it all. | 「…」で省略し、ホバーで全体を表示します。 | "…"로 줄이고 마우스를 올리면 전체가 보입니다. | 以"…"截断，悬停可查看全部。 |
| `core.component.table.config.customized` | Đang dùng thiết lập riêng | Using custom settings | カスタム設定を使用中 | 사용자 설정 사용 중 | 正在使用自定义设置 |
| `core.component.table.config.reorder-picked` | Đã nhấc {title}, vị trí {index}/{total}. | Picked up {title}, position {index} of {total}. | {title}を選択しました。位置 {index}/{total}。 | {title}을(를) 선택했습니다. 위치 {index}/{total}. | 已选中{title}，位置 {index}/{total}。 |
| `core.component.table.config.reorder-moved` | {title}: vị trí {index}/{total}. | {title}: position {index} of {total}. | {title}: 位置 {index}/{total}。 | {title}: 위치 {index}/{total}. | {title}：位置 {index}/{total}。 |
| `core.component.table.config.reorder-dropped` | Đã chuyển {title} tới vị trí {index}. | Moved {title} to position {index}. | {title}を位置 {index} に移動しました。 | {title}을(를) {index} 위치로 옮겼습니다. | 已将{title}移到位置 {index}。 |
| `core.component.table.config.reorder-cancelled` | Đã huỷ đổi thứ tự. | Reorder cancelled. | 並べ替えをキャンセルしました。 | 순서 변경을 취소했습니다. | 已取消调整顺序。 |

## Cần duyệt trong kế hoạch
1. **Đổi thứ tự bằng phím**: CDK không có sẵn. Cài trên `cdkDropList` thế nào, quản lý focus sau mỗi lần di chuyển, đọc vùng live.
2. **`hasCustomSetup`**: nguồn phát (storage cột, `persistColumnWidth`, `TableFilterConfiguration` nếu có), cách chuẩn hoá trước khi so sánh, chi phí khi bảng nhiều cột.
3. **Chuyển khỏi mat-table**: style preview và khe rơi hiện gắn với `.mat-mdc-cell` / `display: table`; cách giữ hình thức đó trên danh sách.
4. **Độ rộng**: cách nhận diện giá trị không phải px, cách kẹp `minWidth` / `maxWidth` khi những giá trị đó cũng là chuỗi CSS.
5. **Ô tìm**: khi đang tìm thì tắt kéo; có cần giữ dòng đang mở khi nó bị lọc khỏi danh sách không (đề xuất: đóng).

## Giữ nguyên
- `ConfiguredColumn`, `ConfiguredTable`, `ConfiguredTableResult`, `ConfigService`, storage key `TABLE_CONFIG` + `option.key` (không key thì theo phiên).
- `open()`, `close()`, `onSave()`, `onReset()` và hộp xác nhận `config.confirm-reset`.
- autoId `-config-skip`, `-config-reset`, `-config-apply`, `-config`.
- Ô Hiện không bao giờ khoá; dòng ẩn khoá các thuộc tính khác.
- Placeholder là giá trị gốc từ `option`.
- Tab Bộ lọc và `modeSelectable` (nếu đã có): không đổi hành vi.
- Mobile: nút Công cụ không có chấm.

## Kiểm tra trên showcase
- Bảng 5 cột (không có ô tìm) và bảng 12+ cột (có ô tìm, danh sách cuộn trong modal).
- Đổi thứ tự bằng chuột và bằng phím; Esc huỷ; trình đọc màn hình đọc vùng live.
- Mở từng dòng; sửa tiêu đề rồi Khôi phục; độ rộng: số, rỗng, giá trị `%` từ option; cột có `minWidth` / `maxWidth`.
- Áp dụng → chấm bật; kéo đổi độ rộng trên bảng (`config.resizable`) → chấm bật; Khôi phục mặc định → chấm tắt; reload trang với `option.key` → chấm giữ đúng.
- Light, dark, preset default và graphite, forced-colors (chấm vẫn thấy), `prefers-reduced-motion`.
- Màn 1280px (modal sm = 40vw, khoảng 512px) và 1920px.

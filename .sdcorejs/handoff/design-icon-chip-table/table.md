# sd-table · header nhóm, kéo thả sắp xếp cột, loading

Nguồn chính cho nhóm việc TB (`@sdcorejs/angular/components/table`). Khi file HTML và file này khác nhau, theo file này. Mã mục (H1, L1…) khớp với phần 3 của `Icon Chip Table Review.dc.html` (bảng 3.01–3.05).

Review dựa trên `table.component.html` (header, lớp phủ, lỗi, rỗng), `table.component.scss`, `table-header-layout.spec.ts`, `config.component`, `config.service.ts` và đường lưu cấu hình trong `table.component.ts`, tại `main @ 769f9ca`.

## 0. Phạm vi

Trong đợt này:
- Header nhóm mới: mọi tên cột lá cùng một hàng, một màu nền, tên nhóm nhỏ căn trái có gạch dưới, đường chia ở mép nhóm (H1–H5, H8).
- Lưu thứ tự cột không tải lại dữ liệu; modal cài đặt hiện cột con (H6, H7).
- Kéo thả sắp xếp cột ngay trên header, directive `sdColumnReorder` (tuỳ chọn, mặc định tắt).
- Loading: khung xương, thanh tiến trình có độ trễ, bỏ lớp phủ chặn, một giao diện lỗi, thông báo khi xong (L1–L8).

Ngoài phạm vi:
- Kéo cột con ra khỏi nhóm, đổi cấu trúc nhóm.
- Ghim hoặc bỏ ghim bằng kéo thả (vẫn làm trong modal).
- Thay đổi logic đọc dữ liệu (debounce, bỏ response cũ, khoá paginator, thử lại đúng snapshot): giữ nguyên.

Giữ nguyên: hàng filter riêng luôn thẳng hàng (đã có spec), ba hàng header sticky, tổng hợp theo cột với header nhóm, resize có min/max và lưu im lặng, tay nắm kéo thả trong modal có nhãn truy cập.

## 1. Header nhóm: vấn đề

Hiện trạng: nền header `#f2f3f4`, ô nhóm pha 18% màu viền (ra `#eaebed`) với đường kẻ trong ở đáy, hàng 1 cao 32px, hàng 2 cao 40px, filter ở hàng thứ ba. Bản dựng ở 3.01 theo source, chưa đối chiếu ảnh chụp showcase.

| Mã | Vị trí | Vấn đề | Sửa | PR |
|---|---|---|---|---|
| H1 | `scss:82–95` | Hai nhóm cạnh nhau dính thành một dải; header không có đường chia dọc. | Đường chia dọc 1px ở mép mỗi nhóm, suốt header; tuỳ chọn kéo xuống thân bảng. | TB1 |
| H2 | `scss:57–61`, `html:426` | Tên cột ở ba độ cao: cột đứng riêng gộp hai hàng và căn giữa, cột con ở hàng 2, tên nhóm ở hàng 1. | Mọi tên cột lá cùng hàng dưới; ô đứng riêng vẫn gộp hai hàng nhưng canh đáy. | TB1 |
| H3 | `scss:82–94` | Hai màu nền, hai kiểu căn: dải nhóm đậm hơn, tên nhóm 600 căn giữa. | Một màu nền. Tên nhóm 12px, chữ phụ, căn trái, gạch dưới mảnh ôm đúng các cột con. | TB1 |
| H4 | `scss:48–80` | 32 + 40 + filter khoảng 44 ≈ 116px trước dòng đầu. | Hàng nhóm 28px, hàng tên cột 36px (64px cho hai tầng, giảm 8px); filter giữ nguyên. | TB1 |
| H5 | `html:489–498`, `sd-table.md:326` | Ô cột con không gắn `sdColumnResize`. | Gắn `sdColumnResize` và `(resizeEnd)` cho ô cột con như cột cấp 1. | TB1 |
| H6 | `config.service.ts:232–254`, `config.component.html` | Cấu hình lưu một dòng mỗi cột cấp 1; không ẩn, đổi tên, đổi thứ tự, lưu độ rộng từng cột con. | `ConfiguredColumn.children`; modal hiện cột con thụt vào dưới nhóm, kéo trong phạm vi nhóm. | TB2 |
| H7 | `config.component.ts:101–106`, `table.component.ts:1009–1036` | Lưu modal → storage đổi → hydrate lại → `#requestReload(true)`: đổi thứ tự là một lần gọi API thừa. | `persistColumnOrder` theo mẫu `persistColumnWidth`: ghi im lặng, tính lại bố cục, không tải lại. | TB2 |
| H8 | `html:418` | Ô nhóm dùng `scope="colgroup"` nhưng mat-table không render `<colgroup>`. | Ô nhóm có `id`; ô cột con và ô dữ liệu bên dưới có `headers="<id nhóm> <id cột>"`. | TB1 |

## 2. Header nhóm: thông số

Hàng nhóm · 28px
- Chữ 12px/16px, 600, `--sd-text-secondary`, căn trái, padding `6px 8px 0`.
- Gạch dưới 1px `--sd-table-group-rule` (minh hoạ `#c9ccd4`), lùi 8px hai đầu để hai nhóm liền nhau vẫn tách.
- Tên dài cắt ellipsis, tooltip tên đầy đủ.
- Nền giữ `--sd-table-header-bg`, bỏ lớp pha 18%.

Hàng tên cột · 36px
- Mọi tên cột lá cùng một đường: cột con ở hàng 2; cột đứng riêng `rowspan=2`, `vertical-align: bottom`, padding đáy 8px.
- Chữ 14px/20px, 500. Cột số căn phải.
- Mũi tên sort và tay nắm resize ở hàng này, cho cả cột con (H5).

Đường chia nhóm
- 1px `--sd-table-group-divider` (minh hoạ `#d8dae1`) ở mép trái cột đầu mỗi nhóm và cột ngay sau nhóm, suốt ba hàng header.
- Chỉ vẽ một cạnh mỗi chỗ, hai nhóm liền nhau không bị đường đôi.
- `style.groupDivider`: `'header'` (mặc định) | `'all'` (kéo xuống thân bảng, màu nhạt hơn, minh hoạ `#ecedf1`) | `'none'`.

Sửa `table-header-layout.spec.ts`: ô đứng riêng canh đáy thay vì căn giữa; ô nhóm cao tối đa 28px thay vì 32px.

## 3. Kéo thả sắp xếp cột

### 3.1 Cách dùng
```ts
option: SdTableOption<Order> = {
  key: 'sales.orders',            // cần để thứ tự cột được lưu bền
  config: {
    visible: true,
    resizable: true,
    reorderable: true,            // mới: kéo bằng cả ô tiêu đề
    onReorder: (change, order) => this.profile.saveColumns(order),
  },
  style: { groupDivider: 'header' }, // mới: 'header' | 'all' | 'none'
  columns: [
    { field: 'code', title: 'Mã đơn', type: 'string', fixed: true },
    { field: 'qty', title: 'Số lượng', type: 'children', children: [ … ] },
  ],
};
```

### 3.2 API thêm
| Tên | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `config.reorderable` | `boolean` | `false` | Kéo bằng cả ô tiêu đề, không icon hay vạch gợi ý. Không áp dụng cho cột chọn, STT, lệnh, mở rộng, kéo dòng, filler. |
| `config.onReorder` | `(change, order) => void` | | `change = { field, from, to, parent? }`; `order` là cây field sau khi đổi. Gọi sau khi đã lưu, cũng gọi khi đổi trong modal. |
| `column.reorderable` | `boolean` | `true` | `false`: cột không kéo được, nhưng cột khác vẫn thả được hai bên nó. |
| `style.groupDivider` | `'header' \| 'all' \| 'none'` | `'header'` | Mục 2. |
| `ConfiguredColumn.children` | `ConfiguredColumn[]` | | Lưu thứ tự, ẩn hiện, tên, độ rộng từng cột con. Dữ liệu cũ không có trường này thì lấy theo option; cột con mới chưa có trong storage thêm vào cuối nhóm, như luật cột cấp 1 (`config.service.ts:162–181`). |

### 3.3 Lưu không tải lại dữ liệu
- `ConfigService.persistColumnOrder(order)` ghi bằng `setSilent` rồi phát `orderChange$`, như `persistColumnWidth`.
- Bảng nghe `orderChange$`, chạy lại `loadConfigurationResult` trên cấu hình đã lưu rồi `configuration.set(...)`. Không qua `#hydrateConfiguration`, nên không gọi `#requestReload`.
- Modal cài đặt đi đường này khi chỉ đổi thứ tự, tên hoặc độ rộng. Chỉ khi bật thêm một cột đang ẩn mới hydrate lại (cột đó có thể cần nạp danh sách giá trị).

### 3.4 Vì sao không dùng CDK drag-drop cho header
- `<table>` đã là `cdkDropList` dọc cho kéo dòng; thêm danh sách ngang lồng trong đó dễ đụng nhau.
- CDK di chuyển phần tử thật khi kéo; với rowspan/colspan và cột sticky, bảng nhảy bố cục và tính lại offset liên tục.
- Directive riêng `sdColumnReorder` đặt cạnh `sdColumnResize`: đo vị trí các ô lúc bắt đầu kéo, chỉ vẽ vạch thả và tô màu cột đang kéo, đổi thứ tự một lần khi thả. Demo 3.03 làm đúng như vậy.

### 3.5 Quy tắc
Phạm vi
- Ô nhóm kéo cả nhóm, đổi chỗ với cột cấp 1 khác.
- Cột con chỉ đổi chỗ trong nhóm của nó.
- Cột `fixed` chỉ đổi chỗ với cột `fixed`; cột thường không thả vào vùng cố định.
- Cột hệ thống đứng yên. Hàng filter đi theo cột; sort giữ nguyên.

Chuột và cảm ứng
- Cầm cả ô tiêu đề: nhấn giữ rồi kéo quá 4px là kéo cột; bấm thả tại chỗ vẫn là sort.
- Con trỏ `grab` trên ô nhóm, `pointer` trên cột sort được, `grabbing` khi đang kéo. Tính năng được giới thiệu qua dòng gợi ý trong modal cài đặt và câu `aria-describedby`.
- Ô filter và tay nắm resize ở mép phải không bao giờ khởi động kéo.
- Đang kéo: vạch thả 2px primary cao hết bảng, cột đang kéo tô nền nhạt (minh hoạ `#eef3fb`), nhãn tên đi theo con trỏ. Gần mép thì tự cuộn ngang. Esc huỷ.
- Thả đúng chỗ cũ thì không lưu, không phát sự kiện.

Bàn phím và trình đọc màn hình
- Focus nút tên cột, Ctrl+Shift+← → (Mac: ⌘+Shift) đổi chỗ từng bước; focus vẫn ở tên cột đó. Câu hướng dẫn gắn qua `aria-describedby`.
- Mỗi bước đọc qua `aria-live`: vị trí mới (“Vị trí {pos} trên {total}”, kèm tên nhóm với cột con), chạm biên vùng (“Đã ở đầu nhóm”), huỷ khi kéo chuột.

Lưu ý: bản review gốc còn sót vài chỗ của phương án tay nắm trước khi chốt mục 7.5 (chú thích “tay nắm trên header”, spec “Space, →, Space”, key `reorder.help` “Space để nhấc…”). Theo mục 7.5: không có tay nắm riêng, không có chế độ nhấc bằng Space. File này đã sửa các chỗ đó.

## 4. Loading

### 4.1 Vấn đề
| Mã | Vị trí | Vấn đề |
|---|---|---|
| L1 | `html:168–171` | `<mat-spinner>` không đặt `diameter` nên 100px; lớp phủ hiện ngay, không độ trễ: sort hay đổi trang 100ms cũng làm cả bảng tối rồi sáng. |
| L2 | `scss:197–208` | Lớp phủ trải từ đỉnh vùng bảng: không gõ filter khác, không sort cột khác, không cuộn được. Lịch đọc đã hỗ trợ huỷ request cũ, chỉ lớp phủ đang chặn. |
| L3 | `scss:201` | `bottom: 56px` đoán chiều cao paginator; paginator khác cao, có thanh thao tác chọn dòng, hoặc không có paginator thì hở hoặc đè. |
| L4 | `html:630–633`, `scss:31` | Lần tải đầu chỉ có header và khoảng trống; bảng không có chiều cao cố định thì spinner tràn ra ngoài và bảng nhảy chiều cao khi dữ liệu về. |
| L5 | `scss:281–318`, `html:100, 268` | `.lds-ring` `#cceeff` trên nền trắng, tương phản khoảng 1,2:1 (< 3:1); spinner CSS riêng, ở tree thu nhỏ `scale(0.45)`. |
| L6 | `scss:203` | `rgba(0, 0, 0, 0.15)` đặt cứng, không theo theme; dark mode gần như không thấy. |
| L7 | `html:635`, `:644–650`, `ts:1250–1260` | Bảng server lỗi dùng `sd-data-state` có Thử lại; bảng local lỗi bật thông báo rồi hiện khối chữ “Có lỗi” với nút Tải lại, kiểu khác hẳn. |
| L8 | `html:169` | `role="status"` chỉ tồn tại khi đang tải: trình đọc nghe “Đang tải” nhưng không nghe kết quả. |

### 4.2 Đề xuất theo tình huống
- **Lần tải đầu**: dòng khung xương theo đúng các cột, `min(pageSize, 8)` dòng, thanh 12px bo 4px, độ dài theo kiểu cột (chữ dài ngắn xen kẽ, số căn phải, trạng thái là viên tròn). Header, quick search, filter vẫn dùng được. Bảng không nhảy chiều cao khi dữ liệu về.
- **Sort, filter, đổi trang, tải lại**: giữ dòng cũ. 300ms đầu không đổi gì; quá 300ms hiện thanh tiến trình 2px dưới header và làm mờ thân bảng còn 55%. Đã hiện thì giữ tối thiểu 400ms. Header, filter, thanh cuộn ngang không bị chặn; paginator vẫn khoá như hiện nay.
- **Mở rộng dòng, nạp con trong tree**: bỏ `.lds-ring`, một spinner 16px màu `--sd-primary` và một khối khung xương cho vùng chi tiết. Nút mở rộng giữ chỗ, không đổi kích thước dòng.
- **Lỗi**: bảng local dùng `sd-data-state` lỗi có Thử lại như bảng server. Giữ luật: dữ liệu và lỗi không cùng hiện, Thử lại gửi đúng request đã lỗi. Copy: “Không tải được dữ liệu” / “Kiểm tra kết nối rồi thử lại. Bộ lọc và trang hiện tại được giữ nguyên.”
- **Trình đọc màn hình**: một vùng `aria-live="polite"` luôn có mặt: “Đang tải dữ liệu” khi thanh tiến trình hiện, “Đã tải {n} dòng” khi xong, “Không tải được dữ liệu” khi lỗi. Giữ `aria-busy` trên vùng bảng.

### 4.3 Cấu hình
```ts
option.loading?: {
  skeletonRows?: number;   // mặc định min(pageSize, 8)
  showDelay?: number;      // 300
  minDuration?: number;    // 400
  overlay?: boolean;       // false; true giữ kiểu chặn cũ cho màn cần khoá thao tác
}
```
Mặc định chung qua `SD_TABLE_CONFIGURATION`. Bỏ `bottom: 56px`.

## 5. Token và i18n

Token mới trong `_component-tokens.scss`, có bản dark, cập nhật `THEME.md`:
| Token | Dùng cho | Minh hoạ light |
|---|---|---|
| `--sd-table-group-divider` | đường chia mép nhóm | `#d8dae1` |
| `--sd-table-group-rule` | gạch dưới tên nhóm | `#c9ccd4` |
| `--sd-table-drop-indicator` | vạch thả | `--sd-primary` |
| `--sd-table-drag-column-bg` | nền cột đang kéo | `#eef3fb` |
| `--sd-table-skeleton` | thanh khung xương | `#eceef2` |
| `--sd-table-progress` | thanh tiến trình | `--sd-primary` |
| `--sd-table-busy-opacity` | độ mờ thân bảng khi tải lại | `0.55` |

Nền đường chia khi `groupDivider: 'all'` (minh hoạ `#ecedf1`): dùng token có sẵn nếu khớp, nếu không thì đề xuất trong kế hoạch.

i18n · đủ vi, en, ja, ko, zh:
| Key | vi |
|---|---|
| `core.component.table.reorder.hint` | Kéo để đổi vị trí, hoặc Ctrl+Shift+mũi tên |
| `….reorder.moved` | Vị trí {pos} trên {total} |
| `….reorder.cancelled` | Đã huỷ |
| `….reorder.edge` | Đã ở đầu nhóm |
| `core.component.table.loading` · `….loaded` · `….loadError` | Đang tải dữ liệu · Đã tải {n} dòng · Không tải được dữ liệu |

Kiểm key có sẵn cho “Đang tải”, “Thử lại” trước khi thêm.

## 6. Spec cần viết

Header nhóm và cấu hình
- tên cột đứng riêng và cột con cùng đáy (±1px)
- hai nhóm liền nhau có đúng một đường chia
- cột con có tay nắm resize và lưu độ rộng
- ô cột con có `headers` trỏ id ô nhóm
- `persistColumnOrder` không gọi read lần hai
- storage cũ không có `children` vẫn đọc đúng

Kéo thả
- kéo nhóm: cả ba cột con đi cùng
- cột con không ra khỏi nhóm
- cột thường không vào vùng fixed
- Ctrl+Shift+→: đổi chỗ, focus ở tên cột, aria-live đúng câu
- Esc khi đang kéo: huỷ, không lưu, không phát `onReorder`
- bấm tại chỗ thì sort, kéo quá 4px thì không sort
- nhấn trong ô filter không khởi động kéo

Loading
- tải lại dưới 300ms không hiện thanh tiến trình
- đã hiện thì giữ ít nhất 400ms
- lần tải đầu render khung xương `min(pageSize, 8)` dòng
- đang tải lại vẫn gõ được filter và bấm sort
- bảng local lỗi render `sd-data-state` có Thử lại
- vùng `aria-live` đọc “Đã tải {n} dòng” khi xong

## 7. Lộ trình và quyết định

| PR | Nội dung | Mục | Công sức |
|---|---|---|---|
| TB1 | Header nhóm | H1–H5, H8. SCSS mới, `vertical-align: bottom`, `style.groupDivider`, resize cột con, `headers`, token. Sửa `table-header-layout.spec.ts`. | ~2 ngày |
| TB2 | Lưu cấu hình | H6, H7. `persistColumnOrder` + `orderChange$`, `ConfiguredColumn.children` có chuyển đổi dữ liệu cũ, modal hiện cột con và kéo trong nhóm. | ~3 ngày |
| TB3 | Kéo thả trên header | `sdColumnReorder` (ngưỡng 4px, không chặn sort), Ctrl+Shift+← →, aria-live, `config.reorderable`, `onReorder`, `column.reorderable`, i18n, `sd-table.md`, showcase. Cần TB2. | ~3–4 ngày |
| TB4 | Loading | L1–L8. Khung xương, thanh tiến trình trễ 300ms giữ 400ms, bỏ lớp phủ và `bottom: 56px`, spinner 16px thay `.lds-ring`, một giao diện lỗi, thông báo khi xong. Độc lập. | ~2–3 ngày |

Đã chốt (22/10/2026):
1. **`config.reorderable` mặc định false.** Bật tay như `resizable`. Docs khuyên bật kèm `option.key`.
2. **Cột con không ra khỏi nhóm**, cả trên header lẫn trong modal.
3. **Đường chia mặc định chỉ ở header.** `'all'` cho bảng nhiều nhóm số liệu, `'none'` để tắt.
4. **Kéo không ghim, không bỏ ghim.** Ghim vẫn làm trong modal.
5. **Cầm cả ô tiêu đề, không icon.** Kéo quá 4px là kéo cột, bấm tại chỗ là sort. Bỏ icon trước tiêu đề và vạch gợi ý mép trên. Bàn phím Ctrl+Shift+← →.

## 8. Ghi chú về bản bấm thử

- 3.02: nút so sánh hiện tại/đề xuất, hàng filter, chia nhóm xuống thân bảng.
- 3.03: thanh input bên trái và khung “Lưu & sự kiện” không thuộc thiết kế. Demo làm đúng biến thể đã chốt ở mục 7.5 (cầm cả ô).
- 3.05: chọn phiên bản (hiện tại/đề xuất), tốc độ mạng, rồi một thao tác để xem dòng thời gian.

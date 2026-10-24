# sd-chip · thông số cải tiến

Nguồn chính cho nhóm việc CH (`@sdcorejs/angular/forms/chip`). Khi file HTML và file này khác nhau, theo file này. Mã mục (A1, B3…) khớp với phần 2 của `Icon Chip Table Review.dc.html` (bảng 2.01–2.04).

Review dựa trên `chip.component.ts`, `.html`, `.scss`, `sd-chip.md` và 839 dòng spec tại `main @ 769f9ca`. Số dòng theo v19; v20–v22 giống hệt. Phần lớn lỗi nhóm A đã được sửa ở sd-chip-calendar trong đợt handoff trước (`.sdcorejs/handoff/design-chip-calendar/`); hai component dùng gần như cùng template nên áp lại bản sửa.

## 0. Phạm vi

Trong đợt này: 23 vấn đề ở mục 1, input mới ở mục 2, thang chip ở mục 3, mixin `sd-chip-row()` dùng chung với sd-chip-calendar.

Ngoài phạm vi:
- Gợi ý (`[suggestions]`) và autocomplete. Để thành tính năng riêng khi có nhu cầu.
- Directive `sdChipRow` dùng chung logic aria/khoá. Để khi có component chip thứ ba.

Giữ nguyên: signal input chuẩn hoá tại boundary, OnPush, mỗi lần đổi tạo mảng mới, validator thêm/bớt qua connector, timer theo DestroyRef, thuộc tính `data-*` cho E2E.

## 1. Vấn đề

Công sức: S dưới nửa ngày, M một đến hai ngày, đã tính spec. “chip-calendar” nghĩa là bản sửa đã có ở sd-chip-calendar.

### A · Lỗi hành vi và a11y (CH1, sửa trước)
| Mã | Vị trí | Vấn đề | Sửa | Nguồn | |
|---|---|---|---|---|---|
| A1 | `html:58`, `ts:332` | Predicate `[removable]` truyền thẳng vào `mat-chip-row`, luôn truthy. Backspace/Delete trên chip (hoặc Backspace hai lần từ ô trống) vẫn xoá chip khoá; `#remove` không kiểm tra lại. | `@let _itemRemovable = item \| sdRemovableChip: _removable` cho cả `[removable]` và nút ✕; guard trong `#remove`. | chip-calendar A1 | S |
| A2 | `html:53–54` | `@if (item)` bỏ mọi giá trị falsy: chip `0` không hiện nhưng vẫn được đếm. `track $index` dựng lại mọi chip sau chip vừa xoá, focus nhảy. | `computed chips()` chỉ lọc `null`/`undefined`/`''`; `track item`. | chip-calendar A2 | S |
| A3 | `ts:307–309` | Chặn trùng không tính kiểu: model `[1, 2]`, gõ “1” thành `[1, 2, '1']`. | So bằng khoá chuẩn hoá `String(v)`, qua cùng hàm `chipTransform` (B4). | | S |
| A4 | `ts:233–238` | Gán model về `null` không xoá chip; formControl giữ mảng cũ và gửi đi. | `setValue(Array.isArray(v) ? v : [])`; spec cho `null` và `undefined`. | | S |
| A5 | `ts:64`, `html:92–100` | Viền đỏ theo `invalid && (dirty \|\| touched \|\| submitted)`, chữ lỗi theo `touched`. Submit khi chưa chạm: đỏ mà không có lý do. | Một `isErrorShown() = invalid && (touched \|\| submitted)` cho matcher, `<mat-error>`, icon lỗi, `aria-invalid`. | chip-calendar A4 | M |
| A6 | `html:64` | `<sd-icon matChipRemove>` không có `ariaLabel`; sd-icon gắn `aria-hidden` lên phần tử có `role="button"`. | `[ariaLabel]` = `core.form.chip.remove` “Xoá {value}”. Icon `cancel` → `close`. | chip-calendar A6 | S |
| A7 | `html:31–38` | Wrapper `div[tabindex=0]` không role, không tên, luôn trong thứ tự Tab, kể cả disabled. | Wrapper chỉ để bố cục. Có `sdViewDef` thì phần tử view nhận `role="button"`, `tabindex="0"`, Enter/Space. | chip-calendar view-trigger | S |
| A8 | `html:95–97`, `sd-chip.md:176` | `hideInlineError`: span lỗi ẩn không có id, ô nhập không có `aria-describedby`. | `[id]="errorId"` trên span và `<mat-error>`, `[attr.aria-describedby]` trên ô nhập. Gộp hai khối `@if` trùng. | chip-calendar | S |

### B · Trải nghiệm nhập (CH2)
| Mã | Vị trí | Vấn đề | Sửa | Nguồn | |
|---|---|---|---|---|---|
| B1 | `ts:366–385` | `#onFocus`/`#onBlur` xoá chữ đang gõ; Tab sang ô khác là mất. | `addOnBlur` (mặc định true) nối `matChipInputAddOnBlur`. Giá trị sai giữ lại trong ô kèm lỗi. | | S |
| B2 | `html:69–90` | Dán “an@x.vn, binh@x.vn; chi@x.vn” thành một chip. | Bắt `(paste)`, tách theo `separators` + xuống dòng + tab, bỏ trùng, chạy `chipValidator`, báo “Đã thêm 3 · bỏ 1 trùng”. | | M |
| B3 | `ts:309`, `sd-chip.md:88` | Trùng bị bỏ im lặng; quá max vẫn thêm rồi mới báo lỗi; `addable=false` vẫn cho gõ. | Trùng: nháy chip đã có, aria-live ““x” đã có”. Đủ `maxCount`: không thêm, bộ đếm n/max, placeholder “Đã đủ {n}”. `addable=false`: không render ô nhập. | chip-calendar A5 | M |
| B4 | `sd-chip.md:191–199` | Không kiểm tra từng chip (ví dụ email nhận “abc”). | `chipTransform(raw)` chuẩn hoá; `chipValidator(v)` trả key i18n hoặc null. Giá trị sai không thành chip. | | M |
| B5 | `html:73` | `placeholder() \|\| _label` lặp lại label. | Placeholder mặc định i18n `core.form.chip.placeholder` “Nhập rồi nhấn Enter”. | chip-calendar B1 | S |
| B6 | `ts:406`, `sd-chip.md:130` | Docs mô tả nút ✕ bỏ hết, `onClear` có nhưng template không gọi. | `clearable` (mặc định false) dùng `.sd-clear-btn` như sd-date, luôn giữ chỗ, giữ chip khoá, phát change một lần. | chip-calendar clearable | S |
| B7 | `sd-chip.md:134–166` | Trong ô sd-table, mười tag hoặc URL dài làm dòng cao gấp ba. | `maxVisible` gộp phần dư thành “+N” khi không focus. Chip `max-width` 240px, ellipsis, tooltip. | chip-calendar maxVisible | M |

### C · Hình ảnh (CH3)
| Mã | Vị trí | Vấn đề | Sửa | Nguồn | |
|---|---|---|---|---|---|
| C1 | `scss:49–69` | Chỉ sm đặt chiều cao chip. md dùng chip 32px + `margin-top: 10px`, cao hơn control khác. lg không có style. | Thang ở mục 3. Bỏ `margin-top`, thêm `.sd-lg`. | chip-calendar C2 | M |
| C2 | `chip.component.scss` | sd-chip dùng chip Material mặc định, khác chip riêng của sd-chip-calendar. | Mixin `sd-chip-row()` trong `assets/scss/core/form.scss`, hai component dùng chung. | | M |
| C3 | `html:63–65` | Chip khoá chỉ thiếu ✕, không nhận ra được. | Nền `--sd-surface-muted`, icon `lock` có tooltip “Không xoá được”, aria-label nối “, không xoá được”. | chip-calendar locked | S |
| C4 | `scss:24–53` | `mat-form-field.c-md`, `.no-padding-wrapper`, `.mat-mdc-chip-row.sd-md {}` không bao giờ khớp. | Xoá cả ba khi làm C1. | | S |

### D · Code, docs, test
| Mã | Vị trí | Vấn đề | Sửa | PR | |
|---|---|---|---|---|---|
| D1 | `ts`, `html:24–28` | `onSelect` + `MatAutocompleteModule` không dùng; `MatProgressSpinnerModule`, `selectable` không dùng. Effect gán `#name` thừa. `#subscription` + `ngOnDestroy`. `isFocused` là field thường, phải `detectChanges()`. `!_appearance` không bao giờ đúng nên `#sdLabel`/`sdLabelDef` bị bỏ qua khi label nổi. | Xoá code thừa (onSelect là breaking). `takeUntilDestroyed`. `isFocused` thành signal. Sửa điều kiện slot label hoặc ghi rõ chỉ dùng với `labelPlacement="top"`. | CH3 | S |
| D2 | `sd-chip.md` | `helperText` (dòng 37) và nút bỏ hết (130) không có trong code; bảng E2E ghi `data-invalid` (không render), thiếu `data-count`; autoId ghi “no auto-prefix” nhưng code thêm `forms-chip-`; `model` ghi one-way nhưng là `model()`; `size: lg`, “Loading state” không có. | Sửa cùng PR với code. Docs là nguồn cho agent sinh code. | CH3 | S |
| D3 | `ts:171–176` | `min`/`max` trùng nghĩa với ngày ở sd-date. | `minCount`/`maxCount`; `min`/`max` thành alias `@deprecated`, cảnh báo một lần ở dev mode. | CH2 | S |
| D4 | `chip.component.spec.ts` | Spec gọi thẳng `onAdd`/`onRemove` với event giả nên A1–A8 lọt. Test “renders label via sd-label when appearance is not set” thật ra kiểm `mat-label`. | Spec RED cho từng mục A qua keydown, blur, paste thật (mục 5). Đổi tên test sai. | CH1 | M |

## 2. API

### Input mới
| Input | Kiểu | Mặc định | Ghi chú | Mục |
|---|---|---|---|---|
| `minCount` | `number` | `0` | Thay `min`. > 0 thì thêm `Validators.minLength`. | D3 |
| `maxCount` | `number` | `0` | Thay `max`. `Validators.maxLength` (cho model gán từ ngoài) và chặn thêm khi đủ, có bộ đếm n/max. | B3 D3 |
| `addOnBlur` | `boolean` | `true` | Rời ô thì thêm chữ đang gõ thành chip. `booleanAttribute`. | B1 |
| `separators` | `string[]` | `['Enter', ',']` | Phím tách chip, giữ như hiện nay. Khi dán tách thêm theo xuống dòng và tab. Demo dùng thêm `';'` cho email. | B2 |
| `chipTransform` | `(raw: string) => string \| number \| null` | trim | Chuẩn hoá trước khi so trùng và lưu. Trả `null` thì bỏ. | A3 B4 |
| `chipValidator` | `(v) => string \| null` | `null` | Trả key i18n khi sai. Giá trị sai không thành chip, chữ giữ lại trong ô, lỗi dưới field. | B4 |
| `clearable` | `boolean` | `false` | Nút bỏ hết `.sd-clear-btn`, hiện khi hover/focus, giữ chip khoá. Cùng tên và mặc định với sd-date. Luôn giữ chỗ: ẩn bằng visibility/opacity, không bằng `@if`. | B6 |
| `maxVisible` | `number \| null` | `null` | Gộp phần dư thành nút “+N” khi không focus. Khuyên 2 trong sd-table. | B7 |

### Input có sẵn đổi hành vi
- `removable`: kiểu giữ nguyên. Predicate áp cho mọi đường xoá: nút ✕, Backspace/Delete, nút bỏ hết. Chip trả false có icon khoá.
- `min` · `max`: alias `@deprecated` của `minCount`/`maxCount`. Cả hai cùng có thì tên mới thắng. Dev mode cảnh báo một lần mỗi instance.
- `model` (**thay đổi hành vi**): `null`/`undefined` đưa về `[]` và xoá chip.
- `addOnBlur` mặc định (**thay đổi hành vi**): rời ô giờ thêm chip thay vì xoá chữ. Kiểu cũ: `[addOnBlur]="false"`.
- `addable` · `placeholder`: `addable=false` không render ô nhập. Placeholder mặc định i18n, không lấy lại label.
- `size` · `#sdLabel`: thêm style cho lg. Slot label chạy cả khi label nổi, hoặc docs ghi rõ chỉ dùng với `labelPlacement="top"`.
- `onSelect`: xoá ở CH3 (**breaking**, đang có trong bảng Public API của `sd-chip.md`).

## 3. Thông số chip, dùng chung với chip-calendar

| | sm | md | lg |
|---|---|---|---|
| Cao field một dòng | 32 (`--sd-control-height-sm`) | 40 | 48 |
| Cao chip | 20 | 24 | 28 |
| Chữ chip | 12 | 13 | 14 |
| Padding block vùng chip | 5 | 7 | 9 |
| Padding inline-start chip | 8 | 8 | 10 |
| Icon ✕ / khoá | 14 | 16 | 18 |
| Nút bỏ hết · icon | 24 · 16 | 28 · 18 | 32 · 20 |

Padding block = (control − 2 − chip) / 2.

- Chip: bo `--sd-radius-6`, viền 1px `--sd-border`, nền `--sd-surface`, chữ `--sd-text`, `tabular-nums`, tối đa 240px rồi ellipsis.
- Chip khoá: nền `--sd-surface-muted`, icon `lock`.
- Trùng: nền và viền warning trong 1,4 giây; tắt hiệu ứng khi `prefers-reduced-motion`.
- `pointer: coarse`: vùng bấm ✕ tối thiểu 24×24 bằng pseudo-element.
- Token mới (nếu cần) trong `_component-tokens.scss`, có bản dark. Không hex trong SCSS.

## 4. i18n · đủ vi, en, ja, ko, zh

| Key | vi |
|---|---|
| `core.form.chip.remove` | Xoá {value} |
| `core.form.chip.placeholder` | Nhập rồi nhấn Enter |
| `core.form.chip.locked` | Không xoá được |
| `core.form.chip.duplicate` | “{value}” đã có |
| `core.form.chip.full` | Đã đủ {max} giá trị |
| `core.form.chip.added` | Đã thêm {count} |
| `core.form.chip.more` | Xem thêm {count} |
| `core.form.chip.clear` | Xoá tất cả |

Nếu chip-calendar đã có key cùng nghĩa (`locked`, `more`, `clear`), đề xuất gom vào `core.form.chips.*` thay vì nhân đôi. Nêu trong kế hoạch trước khi làm.

## 5. Spec cần viết trước (RED)

Từ review:
- A1 · Delete trên chip có predicate false không phát `modelChange`
- A1 · Backspace hai lần từ ô trống không xoá chip khoá
- A2 · model `[0]` render một `mat-chip-row`
- A3 · model `[1]` + gõ “1” không thêm chip
- A4 · model đổi sang `null` thì `formControl.value` là `[]`
- A5 · submit khi chưa chạm: có `mat-error` và `aria-invalid`
- A6 · nút ✕ có accessible name “Xoá {value}”
- A7 · không `sdViewDef` thì wrapper không có `tabindex`
- A8 · `hideInlineError`: input `aria-describedby` trỏ span lỗi
- B1 · gõ rồi blur thì thêm chip (`addOnBlur`)
- B2 · paste “a, b\nc” thêm 3 chip, phát change một lần
- B3 · đã đủ `maxCount` thì Enter không thêm

Bổ sung cho các mục còn lại:
- B4 · `chipValidator` trả lỗi: không thêm chip, chữ còn trong ô, lỗi hiện
- B6 · bỏ hết giữ chip khoá, phát change một lần; nút giữ chỗ khi ẩn
- B7 · `maxVisible` 2 khi không focus: 2 chip + “+N”; focus thì hiện hết
- D3 · `min` alias cảnh báo một lần; có cả `min` và `minCount` thì `minCount` thắng

## 6. Lộ trình

| PR | Nội dung | Mục | Công sức |
|---|---|---|---|
| CH1 | Sửa lỗi | A1–A8, D4 (spec cho A). Không đổi API. Áp lại từ chip-calendar: `isErrorShown()`, `errorId` + `aria-describedby`, view-trigger, `[removable]` theo từng chip, tên cho ✕. Phát hành dạng patch được. | ~2 ngày |
| CH2 | Trải nghiệm nhập | B1–B7, D3. Input mới, alias `min`/`max`, i18n, aria-live. Hai thay đổi hành vi ghi vào `## [Unreleased]`. | ~3 ngày |
| CH3 | Giao diện và dọn dẹp | C1–C4, D1, D2. Mixin chip chung trong `form.scss`, chip-calendar dùng lại mixin, token có bản dark. Xoá code và CSS thừa, gồm `onSelect` (breaking). Viết lại `sd-chip.md`, `THEME.md`. | ~2 ngày |

Rà API consistency với sd-chip-calendar, sd-date, sd-select theo “Review bắt buộc” trong `CLAUDE.md`, ghi kết quả vào PR description. Hover chỉ là lớp bổ sung: nút bỏ hết tới được bằng bàn phím và dùng được với `pointer: coarse`.

## 7. Đã chốt (22/10/2026)

1. **`addOnBlur` mặc định true.** Bật ngay ở CH2, ghi CHANGELOG là thay đổi hành vi.
2. **Xoá `onSelect` và autocomplete** ở CH3 cùng `MatAutocompleteModule`, ghi CHANGELOG là breaking.
3. **So trùng phân biệt hoa thường.** “Tag” và “tag” là hai chip. `sd-chip.md` thêm ví dụ email dùng `chipTransform` chuyển chữ thường.
4. **Chỉ tách mixin SCSS.** `sd-chip-row()` lo kích thước, màu, chip khoá; chip-calendar chuyển sang mixin ở CH3. Logic aria và khoá vẫn trong từng component.

## 8. Ghi chú

- Hành vi phím của `mat-chip-row` (A1, A7) suy ra từ mã nguồn Angular Material, chưa chạy thử trên showcase. Xác nhận bằng spec RED trước khi sửa.
- Bảng 2.03 là bản minh hoạ bằng HTML. Thanh “Input của sd-chip” bên trái và khung “modelChange · sdChange” không thuộc thiết kế.

---
title: Time-only controls và input masking architecture
track: angular
status: implemented-in-v19
updated_at: 2026-07-23
source_of_truth: versions/v19/projects/sdcorejs-angular/forms
---

# Time-only controls và input masking architecture

## Mục đích

Task 6 bổ sung `SdTime`, `SdTimeRange` và masking architecture cho `SdInput` mà không thay đổi model contract mặc định của các input hiện có. `versions/v19` là source of truth; rollout sang v20/v21 được thực hiện bằng sync ở Task 14, không sửa tay logic chung trong các workspace derived.

## Public entrypoints

| Entrypoint                           | Public surface                                                         |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `@sdcorejs/angular/forms/time`       | `SdTime`, parser/normalizer/validator time-only, `SdTimePickerAdapter` |
| `@sdcorejs/angular/forms/time-range` | `SdTimeRange`, `SdTimeRangeValue`, normalize/validate range            |
| `@sdcorejs/angular/forms/input`      | `SdInput`, `SdInputMaskAdapter`, `sdCreateInputMask`, `SD_INPUT_MASKS` |
| `@sdcorejs/angular/forms`            | Barrel và `SdFormsModule` cho ba surface trên                          |

Không có dependency runtime mới. Picker tái sử dụng `SdTimeSpinner` và date adapter từ `@sdcorejs/angular-material-datetime`; `Date` chỉ tồn tại bên trong picker adapter.

## Contract time-only

`SdTime` dùng public model `string | null | undefined`. Giá trị hợp lệ được emit dạng canonical `HH:mm`.

```text
typed/picker value
  -> sdParseTime
  -> sdNormalizeTime
  -> SdFormControlConnector
  -> model + sdChange (HH:mm)
```

- Parser nhận `9:05`, `09:05` và từ chối giờ/phút ngoài biên, thiếu phút hoặc có seconds.
- `min` và `max` là inclusive.
- `step` tính theo phút, anchor vào `min` nếu có, nếu không dùng midnight.
- Invalid typed text giữ nguyên trong control. `controlToModel` trả valid model trước đó cho đến khi input hợp lệ trở lại.
- Picker adapter dùng fixed local anchor `2000-01-01` và chỉ chuyển giờ/phút; calendar và timezone không đi vào public model.
- Arrow Up/Down thay đổi theo `step` và clamp trong boundary.

## Contract range

```ts
export interface SdTimeRangeValue {
  readonly from?: string | null;
  readonly to?: string | null;
}
```

`SdTimeRange` gồm một aggregate `SdFormControl` và hai `SdTime` child controls có tên nội bộ ổn định. Aggregate chịu trách nhiệm model `{ from, to }`, ordering và open-ended policy; child controls giữ invalid text và endpoint validation trong parent FormGroup.

```text
from SdTime ----\
                 -> aggregate control -> normalized range model
to SdTime ------/
```

Rules:

- `required=true` luôn yêu cầu cả hai endpoint.
- Optional range chỉ có một endpoint tạo `incomplete`, trừ khi `allowOpenEnded=true`.
- `from > to` tạo `range`.
- `min`, `max`, `step` áp dụng cho mỗi endpoint.
- Endpoint invalid được tổng hợp vào group `data-invalid`, `aria-invalid` và error message dù aggregate model vẫn giữ giá trị hợp lệ cuối.
- `clear()` gọi clear trên cả hai child để xóa cả raw invalid text, sau đó commit `{ from: null, to: null }`.
- `viewed='inline'` được truyền xuống cả hai `SdTime`; `viewed=true` render một `SdView` aggregate.

## Mask adapter và raw/display flow

`SdInputMaskAdapter` là seam public để formatter/parser tùy biến trả về:

```ts
interface SdInputMaskResult {
  raw: string;
  display: string;
  status: 'empty' | 'incomplete' | 'valid' | 'invalid';
  selectionStart: number;
  selectionEnd: number;
}
```

Khi có mask, `SdInput` dùng hai controls:

```text
native input <-> displayControl
                     |
                     v
             SdInputMaskAdapter.parse
                     |
                     v
registered FormGroup control / model / sdChange (raw)
```

Khi không có mask, native input tiếp tục bind trực tiếp vào control gốc. Vì vậy masking là opt-in và không thay đổi behavior hiện tại.

Default tokens:

| Token      | Ý nghĩa                                 |
| ---------- | --------------------------------------- |
| `#` / `9`  | digit bắt buộc / tùy chọn               |
| `A` / `a`  | letter bắt buộc / tùy chọn              |
| `*` / `?`  | alphanumeric bắt buộc / tùy chọn        |
| ký tự khác | display literal, không đi vào raw model |

Parser duyệt theo pattern cursor. Literal chỉ được consume tại vị trí pattern tương ứng; cách này giữ đúng raw digit cho prefix số như `+84 ####`. Ký tự vượt quá toàn bộ slots tạo trạng thái `invalid` thay vì bị bỏ im lặng.

## Caret, paste, IME và mobile

- Mỗi accepted raw character giữ source index và target unit index để ánh xạ selection về display sau format.
- Insert/delete giữa chuỗi và paste qua selection đều chạy qua cùng parser.
- Trong composition, parse được hoãn đến `compositionend` để không phá IME draft.
- Mask cung cấp `inputMode`; các preset số dùng `numeric` hoặc `tel` trong khi HTML input type giữ `text`.
- `maxDisplayLength` chặn display dài hơn pattern ở native input; parser vẫn đánh dấu overflow invalid để bảo vệ custom/programmatic input.

## Form, validation và state metadata

- Registered control và `model` luôn mang raw value.
- `displayControl` chỉ tồn tại như presentation control và đồng bộ disabled state.
- `maskIncomplete` và `maskInvalid` là hai validation errors riêng, có i18n message.
- Time/time-range dùng shared `ÉµsdFormControlConnector`, `sdFormControlState`, `data-autoId`, disabled/invalid/empty/value/required/error metadata.
- `SdTimeRange` đăng ký aggregate control và child controls vào parent FormGroup; malformed endpoint do đó làm parent form invalid mà không làm mất model hợp lệ.

## I18n và accessibility

Các key time, time-range và mask có parity trong `en`, `vi`, `ja`, `ko`, `zh`. `SdTime` có numeric inputmode, label riêng cho input/picker/clear; `SdTimeRange` dùng `role="group"`, label group và label phân biệt cho `from`/`to`.

## Source files chính

| Path                                                                                 | Trách nhiệm                                        |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `versions/v19/projects/sdcorejs-angular/forms/time/src/time-value.ts`                | Parse, normalize, minute conversion và constraints |
| `versions/v19/projects/sdcorejs-angular/forms/time/src/time-picker.adapter.ts`       | Fixed-anchor Date seam                             |
| `versions/v19/projects/sdcorejs-angular/forms/time/src/time.component.*`             | Form control, picker, UI, a11y                     |
| `versions/v19/projects/sdcorejs-angular/forms/time-range/src/time-range-value.ts`    | Pure range rules                                   |
| `versions/v19/projects/sdcorejs-angular/forms/time-range/src/time-range.component.*` | Composite range control                            |
| `versions/v19/projects/sdcorejs-angular/forms/input/src/input-mask.ts`               | Mask API, parser/formatter, presets                |
| `versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.*`           | Raw/display integration và IME handling            |

## Verification

Focused regression command:

```powershell
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include projects/sdcorejs-angular/forms/time/**/*.spec.ts `
  --include projects/sdcorejs-angular/forms/time-range/**/*.spec.ts `
  --include projects/sdcorejs-angular/forms/input/src/input-mask.spec.ts `
  --include projects/sdcorejs-angular/forms/input/src/input-mask.integration.spec.ts `
  --include projects/sdcorejs-angular/forms/input/src/input.component.spec.ts `
  --include projects/sdcorejs-angular/src/public-api.spec.ts
```

Evidence ngày 2026-07-23:

- focused regression: `157 SUCCESS` sau review/repair loop;
- `npm run lint`: pass;
- `npm run build`: pass, gồm entrypoints `forms/time` và `forms/time-range`;
- `npm run build:showcase`: pass sau khi generator tạo 265 example entries.
- full source-only `npm run test:ci -- --reporters=dots --progress=false`: `15 FAILED / 3593 SUCCESS / 9 skipped`; không có failure trong Task 6, nhưng function coverage `67,86%` thấp hơn threshold `69%`, nên đây chưa phải branch-ready evidence.

Các lệnh gate:

```powershell
npm run lint
npm run build
npm run build:showcase
```

I18n parity được kiểm tra độc lập trên năm locale và đều có 470 keys. Hai package scripts `check:i18n` và `check:i18n-parity` hiện trỏ tới các file script không tồn tại trong baseline; đây là hạ tầng verification cần sửa ở quality gate sau, không phải lỗi parity của Task 6.

## Trạng thái rollout và open items

- Chỉ v19 đã được sửa trong Task 6, đúng policy source-of-truth.
- v20/v21, package versions `20.1.4`/`21.1.4` và published Showcase doc IDs được cập nhật ở Task 14.
- Browser visual smoke cho time picker, responsive range và masked caret nằm trong final release smoke Task 15.
- Full source-only Karma còn 15 failures ngoài focused Task 6 slice ở Chip, ChipCalendar, QuerySavedFiltersMenu, AnchorNav, Cache, Inform và Loading; final repair/gate Task 15 phải xử lý và không được dùng focused suite để che baseline.

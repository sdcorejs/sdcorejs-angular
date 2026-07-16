---
title: Clearable form controls và table filters
track: angular
status: implemented
updated_at: 2026-07-16
source_of_truth: versions/v19/projects/sdcorejs-angular
---

# Clearable form controls và table filters

## Mục đích

Các form control `SdInput`, `SdInputNumber`, `SdInputColor`, `SdDate` và `SdDatetime` dùng chung contract `clearable` để consumer quyết định có hiển thị nút xóa giá trị hay không. Giá trị mặc định là `false`; consumer phải opt in bằng `[clearable]="true"` hoặc bare attribute `clearable`.

`SdTable` chủ động opt in cho inline column filters và external filters phù hợp, vì thao tác xóa nhanh là một phần của trải nghiệm lọc dữ liệu.

## Public contract

| Component       | Input                | Mặc định | Điều kiện hiển thị thêm                                                   |
| --------------- | -------------------- | -------: | ------------------------------------------------------------------------- |
| `SdInput`       | `clearable: boolean` |  `false` | Có giá trị; không `required`, `disabled` hoặc `readonly`                  |
| `SdInputNumber` | `clearable: boolean` |  `false` | Có giá trị; không `required`, `disabled` hoặc `readonly`                  |
| `SdInputColor`  | `clearable: boolean` |  `false` | Forward sang `SdInput`; áp dụng các điều kiện của input bên trong         |
| `SdDate`        | `clearable: boolean` |  `false` | Có giá trị; không `required` hoặc `disabled`; edit mode không phải `bare` |
| `SdDatetime`    | `clearable: boolean` |  `false` | Có giá trị; không `required` hoặc `disabled`; edit mode không phải `bare` |

Tất cả năm input dùng `booleanAttribute`, nên hai cách sau tương đương:

```html
<sd-input clearable></sd-input> <sd-input [clearable]="true"></sd-input>
```

Khi `clearable=false`, public method `clear()` vẫn tồn tại và có thể được gọi chủ động; option này chỉ kiểm soát affordance xóa được render trong edit/inline UI.

## Luồng render

```text
consumer clearable
  -> component signal input (default false)
  -> kiểm tra value + required/disabled/readonly/bare
  -> render hoặc ẩn nút clear
  -> click clear
  -> model về null + output thay đổi hiện có
```

`SdInputColor` không tự render nút clear. Component forward `clearable()` sang `SdInput`, nhờ đó giữ cùng markup, hover behavior, event normalization và vị trí trước color swatch.

Trong `viewed=true`, component tiếp tục render static view và không hiển thị nút clear. Trong `viewed='inline'`, nút clear chỉ xuất hiện khi `clearable=true` và các điều kiện editability còn lại thỏa mãn.

## Tích hợp với `SdTable`

### Inline column filter

`ColumnFilterComponent` gán bare attribute `clearable` cho:

- string filter dùng `SdInput`;
- number filter dùng `SdInputNumber`;
- date filter dùng `SdDate`;
- cả hai đầu `from`/`to` của split-number và split-date.

String và number filter giữ output `cleared` hiện có để commit filter ngay khi người dùng bấm nút xóa. Date filter tiếp tục dùng `sdChange` hiện có.

### External filter

`ExternalFilterComponent` gán `clearable` cho các filter type:

- `string`;
- `number`;
- `date`;
- `datetime`.

Các loại filter khác không bị thay đổi. Nếu external filter được đánh dấu `required`, component form control vẫn ẩn nút clear theo contract chung.

## Tương thích và migration

Đây là thay đổi opt-in có chủ đích:

- `SdInput`, `SdInputNumber` và `SdInputColor` trước đây không có public input `clearable`; sau thay đổi, nút clear mặc định không render.
- `SdDate` và `SdDatetime` đổi default `clearable` từ `true` thành `false` cho cả edit và inline mode.
- Consumer cần giữ nút clear phải thêm bare attribute `clearable` hoặc binding boolean.
- Built-in filters của `SdTable` đã được cập nhật để giữ affordance xóa filter.

`versions/v19` là source of truth. Root command `npm run sync` mirror cùng contract, templates, tests và component references sang v20/v21; không sửa tay logic dùng chung ở hai workspace derived.

## Test coverage

Focused component specs kiểm tra:

- default `clearable=false` không render nút clear;
- opt-in render nút clear khi có giá trị;
- required/disabled/readonly/empty/bare tiếp tục ẩn nút theo từng component;
- inline mode forward/gate đúng option;
- `SdInputColor` forward option sang inner `SdInput`;
- column filters opt in cho string, number, date và các split controls;
- external filters opt in cho string, number, date và datetime.

Chạy focused suite sau khi build v19 để path mapping dùng dist hiện hành:

```powershell
npm --prefix versions/v19 run build

& '.\versions\v19\node_modules\.bin\ng.cmd' test sdcorejs-angular `
  --watch=false `
  --browsers=ChromeHeadless `
  --code-coverage=false `
  --progress=false `
  --include='projects/sdcorejs-angular/forms/input/src/input.component.spec.ts' `
  --include='projects/sdcorejs-angular/forms/input-number/src/input-number.component.spec.ts' `
  --include='projects/sdcorejs-angular/forms/input-color/src/input-color.component.spec.ts' `
  --include='projects/sdcorejs-angular/forms/date/src/date.component.spec.ts' `
  --include='projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts' `
  --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts' `
  --include='projects/sdcorejs-angular/components/table/src/components/filter/external-filter/external-filter.component.spec.ts'

npm run check:sync
git diff --check
```

`tsconfig.json` của workspace ưu tiên `dist/sdcorejs-angular` trước source cho package subpath imports. Vì vậy, composite specs như `SdInputColor` và table filters cần một build hiện hành; dist cũ có thể làm test runtime không nhận ra public input mới.

## Entry points liên quan

| Path                                                                                                                           | Trách nhiệm                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.ts`                                                    | Public input và điều kiện clear của text input   |
| `versions/v19/projects/sdcorejs-angular/forms/input-number/src/input-number.component.ts`                                      | Public input và điều kiện clear của number input |
| `versions/v19/projects/sdcorejs-angular/forms/input-color/src/input-color.component.html`                                      | Forward `clearable` sang inner `SdInput`         |
| `versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.html`                                                    | Gate clear button ở edit và inline date UI       |
| `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.html`                                            | Gate clear button ở edit và inline datetime UI   |
| `versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.html`     | Opt-in cho inline column filters                 |
| `versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/external-filter/external-filter.component.html` | Opt-in cho external filters                      |
| `scripts/sync-multi-version-workspaces.ps1`                                                                                    | Mirror v19 sang v20/v21                          |
| `scripts/check-version-sync.mjs`                                                                                               | Kiểm tra parity giữa ba workspaces               |

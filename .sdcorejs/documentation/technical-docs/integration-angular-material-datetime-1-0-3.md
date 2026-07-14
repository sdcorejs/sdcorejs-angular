---
title: Tích hợp angular-material-datetime 1.0.3
track: angular
status: implemented
updated_at: 2026-07-15
source_of_truth: versions/v19/projects/sdcorejs-angular/forms/datetime
---

# Tích hợp `@sdcorejs/angular-material-datetime@1.0.3`

## Mục đích

`SdDatetime` của `@sdcorejs/angular` dùng picker công khai từ `@sdcorejs/angular-material-datetime@1.0.3` thay cho bản source được vendored trong từng workspace. Tích hợp giữ nguyên public entrypoint `@sdcorejs/angular/forms/datetime`, model string và API hiện có của `<sd-datetime>`.

## Phạm vi tương thích

| Workspace | Angular major | Dependency |
| --- | ---: | --- |
| `versions/v19` | 19 | `@sdcorejs/angular-material-datetime: 1.0.3` |
| `versions/v20` | 20 | `@sdcorejs/angular-material-datetime: 1.0.3` |
| `versions/v21` | 21 | `@sdcorejs/angular-material-datetime: 1.0.3` |

Package `1.0.3` công bố peer range `>=19.0.0 <22.0.0` cho Angular Core, Common, Forms, CDK và Material. Package sử dụng Angular partial compilation và public root export; wrapper không import deep/private path.

## Kiến trúc và ownership

- `versions/v19` là source of truth của component, test và component reference.
- Root command `npm run sync` sinh phần tương thích cho v20/v21; không sửa tay logic dùng chung ở hai workspace derived.
- `SdDatetime` import các primitive sau từ public package root:
  - `SdDatetimePicker`
  - `SdDatetimePickerActions`
  - `SdDatetimePickerApply`
  - `SdDatetimePickerCancel`
  - `SdDatetimePickerNow`
  - `SdNativeDateAdapter`
  - `SdDateAdapter`, `SD_DATE_FORMATS`, `SD_NATIVE_DATE_FORMATS`
- Mỗi workspace khai báo exact dependency trong workspace manifest/lockfile và library manifest. `ng-package.json` cho phép dependency này được giữ lại trong package output.
- Thư mục `forms/datetime/src/material-datetime` không còn tồn tại; package ngoài là implementation owner duy nhất của calendar, time spinner và overlay.

## Provider boundary

`SdDatetime` cung cấp adapter và format token ở component scope:

```text
SdNativeDateAdapter
  -> Angular Material DateAdapter
  -> package SdDateAdapter

SD_NATIVE_DATE_FORMATS
  -> MAT_DATE_FORMATS
  -> package SD_DATE_FORMATS
```

Consumer không cần cấu hình adapter ở application root chỉ để dùng `<sd-datetime>`. Provider scope cục bộ cũng tránh làm thay đổi date adapter của component khác trong ứng dụng.

## Luồng mở và commit picker

```text
model hiện tại
  -> SdDatetime.#currentValueAsDate()
  -> picker.setValue(...)
  -> picker.open()
  -> draft selection trong overlay
  -> Apply
  -> onPickerConfirm(Date)
  -> yyyy/MM/dd HH:mm:ss hoặc yyyy/MM/dd HH:mm:00
  -> model + sdChange
```

Thứ tự `setValue()` trước `open()` là bắt buộc. `open()` của package dựng lại draft từ committed state; dùng `select()` trước `open()` sẽ làm mất model hiện tại hoặc khôi phục committed value cũ sau một external model update.

Các action được project từ wrapper:

| Action | Hành vi |
| --- | --- |
| `Bây giờ` | Cập nhật draft bằng thời điểm hiện tại, chưa emit model |
| `Hủy` | Đóng overlay và bỏ draft |
| `Xác nhận` | Commit draft, đóng overlay và gọi `onPickerConfirm` |

`showSeconds=false` chuẩn hóa giây về `00`; `showSeconds=true` giữ giây đã chọn. `min`/`max`, disabled state và `startAt` được truyền trực tiếp sang package picker.

## Public contract được giữ nguyên

- Selector: `sd-datetime`.
- Import path: `@sdcorejs/angular/forms/datetime` hoặc barrel `@sdcorejs/angular/forms`.
- Model: `string | number | Date | null | undefined`; giá trị emit được chuẩn hóa thành string.
- Outputs: `sdChange`, `sdFocus`.
- Public methods: `open()`, `close()`, `clear()`, `focus()`, `blur()` và `focusInputElement()`.
- Các mode `disabled`, `viewed=true` và `viewed='inline'` không đổi.

Component reference đầy đủ nằm tại `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md` và được sync sang v20/v21.

## Test coverage của integration seam

Focused spec kiểm tra:

- resolve đúng `SdDatetimePicker` từ package;
- overlay render `mat-calendar`, `sd-time-spinner` và action tiếng Việt;
- forward `showSeconds`, `min` và `max`;
- model hiện tại được seed vào package khi mở;
- external model update ghi đè committed state cũ;
- Apply, Cancel và Now giữ đúng staged/committed semantics;
- normalize seconds;
- disabled không mở picker;
- destroy component dispose overlay.

Chạy focused suite:

```powershell
npm --prefix versions/v19 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
npm --prefix versions/v20 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
npm --prefix versions/v21 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
```

Kỳ vọng hiện tại: `66 SUCCESS` ở mỗi workspace.

## Build và metadata verification

```powershell
npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build

npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime@1.0.3 --depth=0
npm --prefix versions/v20 ls @sdcorejs/angular-material-datetime@1.0.3 --depth=0
npm --prefix versions/v21 ls @sdcorejs/angular-material-datetime@1.0.3 --depth=0

npm run check:sync
git diff --check
```

Sau build, kiểm tra `versions/<major>/dist/sdcorejs-angular/package.json` vẫn khai báo exact `1.0.3` và FESM của datetime import từ `@sdcorejs/angular-material-datetime`.

## Quy trình nâng version sau này

1. Kiểm tra package metadata, peer range, public exports và APF của version mới.
2. Tạo regression test RED tại seam thay đổi nếu contract package khác.
3. Cập nhật exact dependency và lockfile ở v19.
4. Chạy focused v19 suite và build.
5. Chạy `npm run sync`, sau đó cài exact version để cập nhật lockfile riêng của v20/v21 khi cần.
6. Chạy focused suites, builds, exact-version checks và `npm run check:sync` trên cả ba major.
7. Xác nhận không xuất hiện lại vendored source hoặc deep import.

## Lưu ý verification hiện tại

Tại ngày 2026-07-15:

- Focused datetime suites và production builds pass trên v19/v20/v21.
- Full library suite có cùng 18 failure ngoài phạm vi datetime ở cả ba workspace, tập trung tại icon/layout của `SdChip`, `SdChipCalendar`, `SdInput`, `SdInputNumber`, `SdInform`, `AnchorNav` và `SdQuerySavedFiltersMenu`.
- Deep `npm ls` của v20 báo peer-minor mismatch đã tồn tại giữa các Angular package trong HEAD; exact package check và lock assertion vẫn xác nhận đúng Angular major 20.
- Showcase route `/forms/datetime` trả HTTP 200, nhưng môi trường kiểm tra không có browser backend để thực hiện visual/click smoke. Không xem HTTP-only smoke là bằng chứng visual.
- Nếu focused test đọc icon/source cũ, build workspace trước: test tsconfig có thể resolve `dist` trước source và một dist stale có thể che source hiện tại.

## Entry points liên quan

| Path | Trách nhiệm |
| --- | --- |
| `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts` | Wrapper, provider boundary và model conversion |
| `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.html` | Package picker, projected actions và field UI |
| `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts` | Integration/regression coverage |
| `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md` | Component reference cho consumer |
| `versions/v19/projects/sdcorejs-angular/package.json` | Published library dependency |
| `versions/v19/projects/sdcorejs-angular/ng-package.json` | Allowed non-peer dependency |
| `scripts/sync-multi-version-workspaces.ps1` | Rollout v19 sang v20/v21 |
| `scripts/check-version-sync.mjs` | Sync parity gate |

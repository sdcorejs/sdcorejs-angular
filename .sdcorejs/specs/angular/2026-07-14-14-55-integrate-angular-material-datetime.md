---
name: integrate-angular-material-datetime
description: Replace the vendored SdDatetime picker implementation with the published package while preserving the wrapper contract.
contract_id: datetime-material-package-1
requirement_id: datetime-external-package
approvedAt: 2026-07-14T14:55:13+07:00
approvedBy: session-user
approval_source: explicit-user-choice
track: angular
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/angular/2026-07-14-14-47-integrate-angular-material-datetime-spec.md
approved_spec_hash: 4f49f83227b30cb83202f5dea999f9e64c157051a81c49aec67e913ee24eeaa9
acceptance_criteria_count: 10
manual_criteria_count: 0
redaction_applied: false
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
---

# Tích hợp angular-material-datetime vào sd-datetime - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Tích hợp angular-material-datetime vào sd-datetime - 2026-07-14 14:47

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: datetime-material-package-1
  requirement_id: datetime-external-package
  approved_spec_path: .sdcorejs/specs/angular/2026-07-14-14-55-integrate-angular-material-datetime.md
  approved_spec_hash: 4f49f83227b30cb83202f5dea999f9e64c157051a81c49aec67e913ee24eeaa9
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: datetime-external-package
  acceptance_criteria_count: 10
  manual_criteria_count: 0
  non_goals:
    - Thay đổi public API hoặc UX của sd-datetime
    - Chuyển wrapper sang ControlValueAccessor của package ngoài
    - Yêu cầu ứng dụng consumer tự đăng ký provider ở app.config.ts
    - Thay đổi hoặc phát hành package angular-material-datetime
  risks:
    - Token DI bị tách instance nếu trộn import local và package ngoài
    - Lockfile của v20 và v21 không được script sync cập nhật tự động
    - Worktree đang chứa thay đổi showcase và branding không thuộc phạm vi này
  assumptions:
    - Phiên bản npm 1.0.2 là baseline đã duyệt và tương thích Angular 19 đến 21
    - Bản picker vendored hiện tại tương đương mã nguồn đã publish của phiên bản 1.0.2
    - v19 tiếp tục là source of truth và v20/v21 là các workspace rollout
  redaction_applied: false
  approval:
    approved: true
    approved_at: 2026-07-14T14:55:13+07:00
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

`SdDatetime` hiện nhúng một bản sao mã nguồn của `@sdcorejs/angular-material-datetime` trong secondary entrypoint `forms/datetime`. Cách này làm trùng trách nhiệm bảo trì và khiến sửa lỗi ở package độc lập không tự trở thành dependency có thể nâng cấp của `@sdcorejs/angular`.

Mục tiêu là để `SdDatetime` sử dụng trực tiếp `@sdcorejs/angular-material-datetime@1.0.2`, xóa bản sao nội bộ và giữ nguyên contract của wrapper SDCoreJS. Thành công nghĩa là consumer tiếp tục dùng `SdDatetime`, `[(model)]`, `[form]`, định dạng giá trị, validation, i18n, `viewed`, overlay và action tiếng Việt như trước mà không phải cấu hình thêm provider.

## Non-goals

- Không đổi selector, class, entrypoint, input, output, public method hoặc kiểu model của `SdDatetime`.
- Không thay input hiện tại bằng `SdDatetimePickerInput`/CVA của package ngoài.
- Không chuyển provider native adapter lên application root.
- Không thay đổi giao diện, theme, định dạng hiển thị hoặc định dạng giá trị phát ra.
- Không sửa source, manifest hoặc release của repository `angular-material-datetime`.
- Không nâng dependency Angular, Material, CDK, RxJS hoặc package SDCoreJS khác.

## Architecture

`@sdcorejs/angular/forms/datetime` vẫn là wrapper SDCoreJS cấp cao. Wrapper tiếp tục sở hữu form integration, model normalization, direct text parsing, validation, i18n, read-only/inline presentation và localized action row. Package ngoài chỉ sở hữu picker overlay, time spinner, native adapter và các action directives.

Toàn bộ `SdDatetimePicker`, `SdDateAdapter`, `SdNativeDateAdapter`, `SD_DATE_FORMATS`, `SD_NATIVE_DATE_FORMATS` và action declarations phải đến từ cùng một package import để giữ đúng identity của Angular DI token. Component-scoped providers hiện có được giữ lại để `SdDatetime` tự hoạt động; `provideSdNativeDateAdapter()` không trở thành yêu cầu đối với consumer.

`@sdcorejs/angular-material-datetime` là runtime implementation dependency của `@sdcorejs/angular`, không phải peer dependency bắt buộc người dùng cài thủ công. Dependency được pin ở `1.0.2` và được ng-packagr cho phép rõ ràng. v19 là source of truth; source và manifest tương thích được mirror sang v20/v21, còn lockfile được cập nhật riêng theo từng workspace.

## Stack profile and technology assumptions

- Track: `angular`
- Stack profile: `core-ui-angular`
- Profile evidence: Angular workspaces v19/v20/v21; thư viện `@sdcorejs/angular`; standalone `SdDatetime`; Angular Material/CDK đã là dependency; npm lockfile theo từng workspace.
- Package baseline: `@sdcorejs/angular-material-datetime@1.0.2`, peer range Angular/CDK/Material `>=19.0.0 <22.0.0`, RxJS `^7.0.0`.
- Compatibility evidence: 18 implementation files vendored trùng nội dung với git commit được publish của npm; barrel còn lại chỉ khác comment đầu file.
- Coverage approach: regression post-hoc tại seam giữa wrapper và package ngoài; package ngoài tiếp tục chịu trách nhiệm cho unit test nội bộ của picker.

## Functional requirements

- `SdDatetime` resolve picker, adapter và action declarations từ package npm.
- `SdDatetime` giữ component-scoped native adapter providers với cùng token identity của package npm.
- Mở, đóng, Apply, Cancel, Now, disabled state, min/max và `showSeconds` tiếp tục hoạt động qua template hiện tại.
- Apply tiếp tục phát `yyyy/MM/dd HH:mm:ss`; khi ẩn giây, phần giây được chuẩn hóa thành `00`.
- `viewed=true`, `viewed='inline'`, clear, direct text entry, validation, `sdChange` và `sdFocus` không đổi.
- Source vendored `src/material-datetime` không còn tồn tại và không còn deep import nội bộ tới nó.

## Dependency, API, data and security implications

- Published metadata của `@sdcorejs/angular` khai báo dependency runtime chính xác `1.0.2`.
- Workspace manifests và lockfiles v19/v20/v21 resolve cùng package version, phù hợp Angular major tương ứng.
- Public API của `@sdcorejs/angular/forms/datetime` vẫn chỉ export `SdDatetime`; không re-export API package ngoài trong thay đổi này.
- Không có API backend, persistence, permission hoặc dữ liệu nhạy cảm bị tác động.
- Package ngoài có `sideEffects: false`; việc thay source không được làm xuất hiện mã động, network call hoặc quyền mới.

## UI/UX constraints

- Popup, calendar, time spinner, action row tiếng Việt và vị trí overlay phải giữ nguyên về chức năng.
- Không yêu cầu visual redesign hoặc screenshot approval vì source picker npm 1.0.2 tương đương source vendored.
- Styling của overlay phải tiếp tục được đóng gói và nạp từ component của package ngoài.

## File structure

- `versions/v19/package.json` - khai báo dependency phục vụ build workspace.
- `versions/v19/package-lock.json` - khóa dependency npm đã duyệt.
- `versions/v19/projects/sdcorejs-angular/package.json` - khai báo runtime dependency trong package được publish.
- `versions/v19/projects/sdcorejs-angular/ng-package.json` - cho phép dependency không phải peer khi đóng gói.
- `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts` - chuyển toàn bộ picker/adapter/token import sang package npm và giữ wrapper contract.
- `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts` - bao phủ seam wrapper/package và các regression quan trọng.
- `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md` - mô tả đúng dependency/native adapter mà component sử dụng.
- `versions/v19/projects/sdcorejs-angular/forms/datetime/src/material-datetime/` - xóa bản sao implementation không còn được dùng.
- `versions/v20/**` và `versions/v21/**` tương ứng - mirror source/manifest từ v19 và cập nhật lockfile riêng cho mỗi Angular major.

## Acceptance criteria

- AC-001 - `SdDatetime` chỉ import các symbol picker/adapter/token từ `@sdcorejs/angular-material-datetime`; không còn import từ `./material-datetime`.
- AC-002 - Thư mục vendored `forms/datetime/src/material-datetime` bị xóa ở v19/v20/v21 và không còn reference tới đường dẫn này trong source buildable.
- AC-003 - `@sdcorejs/angular-material-datetime` được pin ở `1.0.2` trong published library dependency, workspace manifests và lockfiles của cả ba workspace; ng-packagr chấp nhận dependency này.
- AC-004 - Public API `SdDatetime` không đổi: selector, entrypoint, class, inputs, outputs, public methods, `[(model)]`, `[form]` và định dạng emitted value được giữ nguyên.
- AC-005 - Consumer dùng `SdDatetime` không phải thêm `provideSdNativeDateAdapter()` vào `app.config.ts`; component khởi tạo không phát sinh lỗi DI.
- AC-006 - Picker mở khi enabled, không mở khi disabled, đóng sạch khi component bị destroy và `pickerOpened` phản ánh trạng thái overlay.
- AC-007 - Apply/Cancel/Now hoạt động qua custom localized action row; Apply cập nhật `model`/`sdChange`, Cancel không mutate model, và seconds được giữ hoặc chuẩn hóa theo `showSeconds`.
- AC-008 - `minDate`, `maxDate`, `viewed`, inline mode, clear, parsing và validation hiện hữu không bị regression; focused integration tests bao phủ seam package ngoài.
- AC-009 - Tài liệu `sd-datetime.md` mô tả đúng native adapter/package dependency, không còn tuyên bố component đang dùng `provideDateFnsAdapter`.
- AC-010 - Targeted datetime tests, full library production build trên v19/v20/v21 và repository sync check đều kết thúc exit code 0; diff cuối không làm thay đổi các file showcase/branding ngoài tác động tất yếu của rollout đã được rà soát.

## Test and verification expectations

- Focused Karma coverage cho `datetime.component.spec.ts`, bao gồm component resolution, enabled/disabled open, apply/cancel/now, seconds normalization, min/max binding và overlay cleanup.
- Full `sdcorejs-angular` production build ở v19, v20 và v21 để kiểm tra package resolution và ng-packagr metadata.
- `npm run check:sync` tại repo root để xác nhận source/library parity.
- Kiểm tra dependency tree/lockfile từng workspace resolve `1.0.2` và không tạo duplicate Angular major.
- `git diff --check` và rà `git status` theo path để bảo vệ các thay đổi showcase/branding có sẵn.

## Risks & mitigations

- **Risk:** Trộn token/class local với package npm gây `NullInjectorError`. -> **Mitigation:** chuyển toàn bộ import block picker/adapter/token trong một thay đổi và có component creation test.
- **Risk:** Khai báo package ngoài là peer làm consumer cũ phải cài thêm dependency. -> **Mitigation:** dùng runtime dependency và allow-list ng-packagr.
- **Risk:** Script sync bỏ qua lockfile v20/v21. -> **Mitigation:** cập nhật và xác minh lockfile riêng cho từng workspace.
- **Risk:** Full sync ghi đè thay đổi chưa commit ở showcase. -> **Mitigation:** parity hiện tại đã pass; so sánh status/diff trước và sau rollout, không sửa checkpoint hay file ngoài scope.
- **Risk:** Package ngoài hiện chưa khai báo `@angular/forms` trong peer metadata dù directive CVA import Forms. -> **Mitigation:** ba workspace đã cài Forms; giữ việc sửa manifest package ngoài thành follow-up riêng.
- **Risk:** GitHub `main` của package có thể khác npm `1.0.2`. -> **Mitigation:** đối chiếu và pin theo npm gitHead của `1.0.2`, không theo HEAD mới hơn.

## Out of scope (deferred)

- Nâng lên release mới hơn `1.0.2` - chỉ thực hiện sau một dependency-update review riêng.
- Re-export picker primitives từ `@sdcorejs/angular` - chỉ thực hiện khi có yêu cầu public API rõ ràng.
- Chuyển `SdDatetime` sang CVA/formControlName - cần một migration spec riêng vì sẽ đổi contract.
- Sửa peer dependency `@angular/forms` của package ngoài - thực hiện tại repository `angular-material-datetime` và phát hành bản mới trước khi bump ở đây.
- Visual redesign hoặc thay localized actions bằng default actions tiếng Anh - không thuộc mục tiêu dependency refactor.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)


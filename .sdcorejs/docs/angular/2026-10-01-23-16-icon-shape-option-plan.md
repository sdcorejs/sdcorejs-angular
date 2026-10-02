# Plan - Tuỳ chọn hình nền icon (iconShape) (bản sửa 4) - 2026-10-01 23:16

## Change control

- Thay `plan-icon-shape-option-r3` (`.sdcorejs/plans/angular/2026-10-01-18-04-icon-shape-option.md`).
- r4 (chỉ cấu trúc truy vết, không đổi phạm vi code): dry-run convergence (`sdcorejs-convergence:v1`, mode feature) báo BLOCKED vì (1) TASK-009 chỉ khai SYNC-STATUS trong khi sync ghi 102 file mirror ở v20/v21/v22 — nay TASK-009 khai đúng từng file đó; (2) validation map chỉ có một row mỗi AC — nay có một row cho mỗi cặp (R, AC) mà AC khai (13 row); (3) EVIDENCE-007 (doc) không gắn invariant — TASK-007 nay chịu INV-001 (sửa đúng phạm vi), bằng chứng là lệnh kiểm phạm vi `git diff` phủ cả file doc. Decision coverage lên revision 4 (cùng ID).
- r3: thay r2, vốn thay r1.
- r3: 5 demo-section mới làm số demo khai cứng lệch, nên TASK-008 thêm `showcase/src/app/docs/core/documentation.registry.ts` (`demoSectionCount` +1 cho section, inform, data-state, notify, confirm), `documentation.registry.spec.ts` (tổng 391 → 396, data-state 7 → 8) và `data-state-demo.component.spec.ts` (7 → 8 demo-section); thêm lệnh test showcase cho các spec này.
- Lý do: thêm demo-section "Icon shape" ở năm trang showcase làm `npm run generate:showcase-examples` ghi cả `showcase/src/app/docs/generated/example-manifest.generated.ts`; r1 bỏ sót file sinh này (r2). Mọi thứ khác giữ nguyên. TASK-001…007 đã thực thi theo r1 và nằm nguyên trong phạm vi r3.

## Scope

Thêm `SdIconShape = 'square' | 'circle' | 'none'` cho ô icon trang trí của `sd-section` header, `sd-inform`, `sd-data-state`, toast của notify và dialog confirm. Mặc định `square` bo `var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`; app đổi mặc định bằng `provideSdIcon({ defaultShape })`; từng instance ghi đè bằng `iconShape`. Nguồn: spec `spec-icon-shape-option-r1` (`sha256:v1:4cab266043…`), architecture `architecture-icon-shape-option-r2` (`sha256:v1:2ae8f0d6d6…`).

## Execution context

- Track: angular
- Target root kind: target-project
- Stack profile: core-ui-angular
- Coverage approach: TDD (spec trước, RED, rồi code, GREEN)
- Parallel candidates: không — TASK-002…006 độc lập về file nhưng dùng chung Karma/node_modules/CPU; chạy tuần tự.
- Dependency/env/migration: không. `npm ci` chỉ cài theo lockfile có sẵn, không sửa manifest.

## Preflight trước khi sửa

Chạy `git status --short`, staged/unstaged diffstat, file untracked, branch, HEAD. Đối chiếu với allowed_paths/prohibited_paths trong plan_context. Nếu có file bẩn ngoài phạm vi thì hỏi: (1) tiếp tục, chỉ sửa file trong plan; (2) cho phép chạm file bẩn đã chọn; (3) dừng để dọn. Tree hiện chỉ có artifact .sdcorejs của contract này (untracked).

## Tasks

### Phase 1 - Cấu hình icon

1. TASK-001 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts`
   - `versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts`
   - Cấu hình icon: SdIconShape + defaultShape (TDD). Phụ thuộc: không. Bằng chứng: EVIDENCE-001.

### Phase 2 - Năm consumer (TDD, tuần tự)

2. TASK-002 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts`
   - `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html`
   - `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss`
   - sd-section: input iconShape + SCSS shape (TDD). Phụ thuộc: TASK-001. Bằng chứng: EVIDENCE-002.

3. TASK-003 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.ts`
   - `versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.html`
   - `versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss`
   - sd-inform: input iconShape + SCSS shape, tip giữ trong suốt (TDD). Phụ thuộc: TASK-001. Bằng chứng: EVIDENCE-003.

4. TASK-004 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts`
   - `versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.html`
   - `versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss`
   - sd-data-state: input iconShape + SCSS shape thắng rule state (TDD). Phụ thuộc: TASK-001. Bằng chứng: EVIDENCE-004.

5. TASK-005 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/notify.model.ts`
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts`
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts`
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html`
   - `versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss`
   - Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD). Phụ thuộc: TASK-001. Bằng chứng: EVIDENCE-005.

6. TASK-006 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts`
   - `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts`
   - `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts`
   - `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html`
   - `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss`
   - Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD). Phụ thuộc: TASK-001. Bằng chứng: EVIDENCE-006.

### Phase 3 - Tài liệu và showcase

7. TASK-007 EDIT sdcorejs-angular:
   - `versions/v19/projects/sdcorejs-angular/modules/icon/sd-icon.md`
   - `versions/v19/projects/sdcorejs-angular/components/section/sd-section.md`
   - `versions/v19/projects/sdcorejs-angular/components/inform/sd-inform.md`
   - `versions/v19/projects/sdcorejs-angular/components/data-state/sd-data-state.md`
   - `versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md`
   - `versions/v19/projects/sdcorejs-angular/services/confirm/sd-confirm.md`
   - `CHANGELOG.md`
   - Tài liệu sáu component/service + CHANGELOG [Unreleased]. Phụ thuộc: TASK-002, TASK-003, TASK-004, TASK-005, TASK-006. Bằng chứng: EVIDENCE-007.

8. TASK-008 EDIT sdcorejs-angular:
   - `showcase/src/app/pages/components/section/section-demo.component.ts`
   - `showcase/src/app/pages/components/inform/inform-demo.component.ts`
   - `showcase/src/app/pages/components/data-state/data-state-demo.component.ts`
   - `showcase/src/app/pages/services/notify/notify-demo.component.ts`
   - `showcase/src/app/pages/services/confirm/confirm-demo.component.ts`
   - `showcase/src/app/docs/generated/example-sources.generated.ts`
   - `showcase/src/app/docs/generated/example-manifest.generated.ts`
   - `showcase/src/app/docs/core/documentation.registry.ts`
   - `showcase/src/app/docs/core/documentation.registry.spec.ts`
   - `showcase/src/app/pages/components/data-state/data-state-demo.component.spec.ts`
   - Showcase: demo ba shape ở năm trang + sinh lại example sources. Phụ thuộc: TASK-007. Bằng chứng: EVIDENCE-008.

### Phase 4 - Rollout và kiểm chứng cuối

9. TASK-009 EDIT sdcorejs-angular:
   - `versions/v19/SYNC-STATUS.md`
   - `versions/v20/SYNC-STATUS.md`
   - `versions/v20/projects/sdcorejs-angular/components/data-state/sd-data-state.md`
   - `versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.html`
   - `versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss`
   - `versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts`
   - `versions/v20/projects/sdcorejs-angular/components/inform/sd-inform.md`
   - `versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.html`
   - `versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.scss`
   - `versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.ts`
   - `versions/v20/projects/sdcorejs-angular/components/section/sd-section.md`
   - `versions/v20/projects/sdcorejs-angular/components/section/src/section.component.html`
   - `versions/v20/projects/sdcorejs-angular/components/section/src/section.component.scss`
   - `versions/v20/projects/sdcorejs-angular/components/section/src/section.component.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/components/section/src/section.component.ts`
   - `versions/v20/projects/sdcorejs-angular/modules/icon/sd-icon.md`
   - `versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.model.ts`
   - `versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/sd-confirm.md`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts`
   - `versions/v20/projects/sdcorejs-angular/services/notify/sd-notify.md`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/notify.model.ts`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts`
   - `versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.ts`
   - `versions/v21/SYNC-STATUS.md`
   - `versions/v21/projects/sdcorejs-angular/components/data-state/sd-data-state.md`
   - `versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.html`
   - `versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss`
   - `versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts`
   - `versions/v21/projects/sdcorejs-angular/components/inform/sd-inform.md`
   - `versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.html`
   - `versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.scss`
   - `versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.ts`
   - `versions/v21/projects/sdcorejs-angular/components/section/sd-section.md`
   - `versions/v21/projects/sdcorejs-angular/components/section/src/section.component.html`
   - `versions/v21/projects/sdcorejs-angular/components/section/src/section.component.scss`
   - `versions/v21/projects/sdcorejs-angular/components/section/src/section.component.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/components/section/src/section.component.ts`
   - `versions/v21/projects/sdcorejs-angular/modules/icon/sd-icon.md`
   - `versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.model.ts`
   - `versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/sd-confirm.md`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts`
   - `versions/v21/projects/sdcorejs-angular/services/notify/sd-notify.md`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/notify.model.ts`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts`
   - `versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.ts`
   - `versions/v22/SYNC-STATUS.md`
   - `versions/v22/projects/sdcorejs-angular/components/data-state/sd-data-state.md`
   - `versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.html`
   - `versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss`
   - `versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts`
   - `versions/v22/projects/sdcorejs-angular/components/inform/sd-inform.md`
   - `versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.html`
   - `versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.scss`
   - `versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.ts`
   - `versions/v22/projects/sdcorejs-angular/components/section/sd-section.md`
   - `versions/v22/projects/sdcorejs-angular/components/section/src/section.component.html`
   - `versions/v22/projects/sdcorejs-angular/components/section/src/section.component.scss`
   - `versions/v22/projects/sdcorejs-angular/components/section/src/section.component.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/components/section/src/section.component.ts`
   - `versions/v22/projects/sdcorejs-angular/modules/icon/sd-icon.md`
   - `versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.model.ts`
   - `versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/sd-confirm.md`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts`
   - `versions/v22/projects/sdcorejs-angular/services/notify/sd-notify.md`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/notify.model.ts`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts`
   - `versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.ts`
   - Rollout v19 → v20/v21/v22 bằng npm run sync, kiểm chứng cuối. Phụ thuộc: TASK-008. Bằng chứng: EVIDENCE-009.

## Ghi chú thực thi

- **TASK-001:** `SdIconShape` cạnh `SdIconSet` trong `icon.model.ts`; `defaultShape?: SdIconShape` trong `ISdIconConfiguration`; `SD_ICON_DEFAULT_CONFIG.defaultShape = 'square'`; `resolveSdIconConfig` trả `config.defaultShape ?? SD_ICON_DEFAULT_CONFIG.defaultShape`. Spec mới `icon.provider.spec.ts` (AC-001).
- **TASK-002…004:** `iconShape = input<SdIconShape | null | undefined>()`; `computed` = `iconShape() ?? inject(SD_ICON_CONFIGURATION).defaultShape`; `[attr.data-icon-shape]` trên ô. SCSS: rule gốc của ô đổi 50% thành radius token; thêm rule `circle`/`none` **sau** vòng `@each` tone/state và đủ mạnh: data-state cần selector có `.sd-data-state[data-state]` (thắng `(0,5,0)`); inform để tip `.c-inform.c-inform-tip .c-inform-icon-tile` vẫn thắng.
- **TASK-005:** `NotifyOption.iconShape?`, `ToastData.iconShape?`; `#addImmediate` và `#flushBuffer` chép `option?.iconShape`. `ToastComponent` resolve trong getter (data là `@Input`). SCSS: rule shape dạng `:host([data-type]) .sd-toast__icon[data-icon-shape=…]` để thắng `:host([data-type=x]) .sd-toast__icon`.
- **TASK-006:** `iconShape?: SdIconShape` trong option của `confirm`, `withInput`, `withRadio`, `withSelect`, `withDate`, `withDatetime`; mỗi method đặt `data.iconShape`. `DialogData.iconShape?`; dialog resolve như D-007. SCSS sau vòng `[data-tone]`.
- **TASK-007:** sáu doc thêm mục option; `sd-icon.md` mô tả `SdIconShape`, `defaultShape`, token `--sd-icon-shape-radius`, attribute `data-icon-shape`. CHANGELOG `## [Unreleased]`: `### Added` (option, type, token) và `### Changed` (mặc định tròn → vuông 8px, dòng `provideSdIcon({ defaultShape: 'circle' })` để giữ kiểu cũ; nhắc `ISdIconResolvedConfiguration` có thêm `defaultShape`, dùng `resolveSdIconConfig`).
- **TASK-008:** mỗi demo thêm ví dụ ba shape; chạy `npm run generate:showcase-examples` để sinh lại `example-sources.generated.ts`.
- **TASK-009:** `npm run sync`; trên checkout CRLF, sync có thể đánh dấu hàng loạt file v22 — checkout lại file chỉ khác EOL, giữ LF cho file thật sự đổi; rồi `npm run check:sync` và các lệnh kiểm cuối.

## Acceptance mapping

- AC-001 -> TASK-001
- AC-002 -> TASK-002
- AC-003 -> TASK-003
- AC-004 -> TASK-004
- AC-005 -> TASK-005
- AC-006 -> TASK-006
- AC-007 -> TASK-002, TASK-003, TASK-004, TASK-005, TASK-006
- AC-008 -> TASK-007, TASK-008, TASK-009

## Invariant enforcement

- INV-001 -> task TASK-007, TASK-009; evidence EVIDENCE-007, EVIDENCE-009
- INV-002 -> task TASK-002, TASK-003, TASK-004, TASK-005, TASK-006; evidence EVIDENCE-002, EVIDENCE-003, EVIDENCE-004, EVIDENCE-005, EVIDENCE-006
- INV-003 -> task TASK-008, TASK-009; evidence EVIDENCE-008, EVIDENCE-009
- INV-004 -> task TASK-009; evidence EVIDENCE-009
- INV-005 -> task TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006; evidence EVIDENCE-001, EVIDENCE-002, EVIDENCE-003, EVIDENCE-004, EVIDENCE-005, EVIDENCE-006
- INV-006 -> task TASK-002, TASK-003, TASK-004, TASK-005, TASK-006; evidence EVIDENCE-002, EVIDENCE-003, EVIDENCE-004, EVIDENCE-005, EVIDENCE-006

## Validation map

| AC | Invariant | Lệnh | Bằng chứng mong đợi |
| --- | --- | --- | --- |
| AC-001 | INV-005 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/modules/icon/**/*.spec.ts"` (cwd `versions/v19`) | resolveSdIconConfig và SD_ICON_CONFIGURATION trả square; truyền circle trả circle. |
| AC-002 | INV-003, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/section/**/*.spec.ts"` (cwd `versions/v19`) | data-icon-shape = square / circle / none theo ba trường hợp. |
| AC-002 | INV-001, INV-002, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/section/**/*.spec.ts"` (cwd `versions/v19`) | data-icon-shape = square / circle / none theo ba trường hợp. |
| AC-003 | INV-003, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/inform/**/*.spec.ts"` (cwd `versions/v19`) | data-icon-shape theo ba trường hợp; tip có nền trong suốt. |
| AC-003 | INV-001, INV-002, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/inform/**/*.spec.ts"` (cwd `versions/v19`) | data-icon-shape theo ba trường hợp; tip có nền trong suốt. |
| AC-004 | INV-003, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/data-state/**/*.spec.ts"` (cwd `versions/v19`) | data-icon-shape theo ba trường hợp ở cả hai layout. |
| AC-004 | INV-001, INV-002, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/data-state/**/*.spec.ts"` (cwd `versions/v19`) | data-icon-shape theo ba trường hợp ở cả hai layout. |
| AC-005 | INV-003, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/notify/**/*.spec.ts"` (cwd `versions/v19`) | circle / square / none cho success option, info mặc định, error qua buffer. |
| AC-005 | INV-001, INV-002, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/notify/**/*.spec.ts"` (cwd `versions/v19`) | circle / square / none cho success option, info mặc định, error qua buffer. |
| AC-006 | INV-003, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/confirm/**/*.spec.ts"` (cwd `versions/v19`) | Sáu method chuyển iconShape; dialog có data-icon-shape circle khi truyền, square khi không. |
| AC-006 | INV-001, INV-002, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/confirm/**/*.spec.ts"` (cwd `versions/v19`) | Sáu method chuyển iconShape; dialog có data-icon-shape circle khi truyền, square khi không. |
| AC-007 | INV-001, INV-002, INV-006 | `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/section/**/*.spec.ts" --include="**/components/inform/**/*.spec.ts" --include="**/components/data-state/**/*.spec.ts" --include="**/services/notify/**/*.spec.ts" --include="**/services/confirm/**/*.spec.ts"` (cwd `versions/v19`) | getComputedStyle: square 8px (4px khi đặt token), circle 50%, none trong suốt cùng kích thước ở mọi tone/state. |
| AC-008 | INV-004 | `npm run check:sync` (cwd `.`) | check:sync exit 0; grep doc/CHANGELOG khớp; build lib + showcase exit 0; git diff --name-only nằm trong allowed_paths. |

Ranh giới `none` (D-010): không có xác thực/quyền, mọi AC tự động.

## Verification

- `fnm exec --using=22.22.3 npm.cmd ci --legacy-peer-deps` — cwd `versions/v19`. Worktree chưa có node_modules; cài đúng lockfile, không đổi manifest.
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/modules/icon/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-001 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/section/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-002 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/section/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-002 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/inform/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-003 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/inform/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-003 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/data-state/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-004 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/data-state/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-004 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/notify/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-005 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/notify/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-005 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/confirm/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-006 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/services/confirm/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-006 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/components/section/**/*.spec.ts" --include="**/components/inform/**/*.spec.ts" --include="**/components/data-state/**/*.spec.ts" --include="**/services/notify/**/*.spec.ts" --include="**/services/confirm/**/*.spec.ts"` — cwd `versions/v19`. Spec focused cho AC-007 (RED trước khi sửa code, GREEN sau).
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` — cwd `versions/v19`. Full suite v19 có coverage threshold (INV-003, release gate).
- `fnm exec --using=22.22.3 npm.cmd run lint -- sdcorejs-angular` — cwd `versions/v19`. ESLint (@angular-eslint) cho code đã sửa.
- `fnm exec --using=22.22.3 npm.cmd run build` — cwd `versions/v19`. Build lib cho showcase và kiểm public API compile (INV-003).
- `npm run generate:showcase-examples` — cwd `.`. Sinh lại example-sources.generated.ts sau khi sửa demo.
- `npm run test:showcase-examples` — cwd `.`. Guard generator showcase (file sinh phải mới).
- `fnm exec --using=22.22.3 npm.cmd ci --legacy-peer-deps` — cwd `showcase`. Cài showcase trong worktree.
- `npm run link:library` — cwd `showcase`. Copy lib đã build vào showcase/node_modules trước khi test showcase.
- `fnm exec --using=22.22.3 npm.cmd test -- --include=src/app/docs/core/documentation.registry.spec.ts --include=src/app/pages/components/data-state/data-state-demo.component.spec.ts` — cwd `showcase`. Registry demo counts và số demo-section của data-state (AC-008, INV-003).
- `fnm exec --using=22.22.3 npm.cmd run build` — cwd `showcase`. prebuild chạy link:library; build exit 0 (AC-008, INV-003).
- `npm run sync` — cwd `.`. Rollout v19 → v20/v21/v22 (INV-004).
- `npm run check:sync` — cwd `.`. Release guard read-only (AC-008, INV-004).
- `git diff --name-only HEAD` — cwd `.`. Mọi file đổi nằm trong allowed_paths (INV-001).
- `git grep -n "iconShape" -- "versions/v19/projects/sdcorejs-angular/**/sd-*.md" CHANGELOG.md` — cwd `.`. Doc và CHANGELOG nhắc option mới (AC-008).
- `git grep -nE "\?\? *'(square|circle|none)'" -- "versions/v19/projects/sdcorejs-angular/components/section" "versions/v19/projects/sdcorejs-angular/components/inform" "versions/v19/projects/sdcorejs-angular/components/data-state" "versions/v19/projects/sdcorejs-angular/services/notify" "versions/v19/projects/sdcorejs-angular/services/confirm"` — cwd `.`. Không có fallback shape hardcode trong consumer; phải không có kết quả (INV-005).
- Manual: không có tiêu chí thủ công (D-006). Xem showcase bằng mắt là UAT tuỳ chọn ngoài gate.

## Frontend architecture plan

- Không thêm component, directive, service, store hay entrypoint. Năm ô icon giữ markup hiện có, thêm `[attr.data-icon-shape]`.
- Resolve: `iconShape ?? SD_ICON_CONFIGURATION.defaultShape` trong từng consumer (D-007, INV-005).
- Public export mới duy nhất: `SdIconShape` (qua `export *` sẵn có của `icon.model.ts`).
- Test ở spec sẵn có của từng component; thêm `icon.provider.spec.ts`.

## Rủi ro và cách xử lý

- Specificity SCSS (review kiến trúc) → test AC-007 kiểm `none` ở mọi tone/state.
- Worktree chưa có node_modules → `npm ci` đúng lockfile trước khi test (không đổi manifest).
- Sync CRLF v22 → checkout lại file chỉ khác EOL.
- Máy dev quá tải làm Karma timeout → chạy focused theo task, full suite cuối; spec image-editor đã biết là flaky (rerun trước khi debug).

## Self-review

- Decision coverage revision 3 qua stage `plan`; goal-backward round 1 không blocker; validation map qua với coverage đã duyệt trong bộ nhớ; `validateArchitectureDraftPlanHandoff` qua.
- CREATE/EDIT tính so với HEAD 23857013: `icon.provider.spec.ts` (v19, và ba bản mirror do sync sinh) là file mới, chưa track; mọi EDIT đã tồn tại ở HEAD.
- Dry-run convergence (feature mode, evidence mô phỏng PASSED) trả `CONVERGED`: 13 row, 9 task, 151 file đổi, 0 path ngoài plan.
- Không có bước ghi sau branch-ready; không đổi package.json/lockfile/env.

## Appendix — plan_context (machine-readable)

<details><summary>plan_context JSON</summary>

```json
{
 "schema_version": 2,
 "source": "sdcorejs-plan",
 "architecture_gate": {
  "valid": true,
  "required": true,
  "status": "required",
  "signals": [
   "public-api-contract"
  ],
  "bypass": null,
  "rationale": "Thêm type export, field cấu hình app-level, input trên ba component và field option trên hai service công khai của @sdcorejs/angular, cộng một CSS custom property công khai."
 },
 "architecture_context": {
  "schema_version": 1,
  "source": "sdcorejs-architecture",
  "contract_id": "icon-shape-option",
  "requirement_id": "R-001",
  "approved_spec_reference": {
   "repository_id": "sdcorejs-angular",
   "artifact_id": "spec-icon-shape-option-r1",
   "artifact_kind": "spec",
   "revision": "23857013381215b07f497842427e03477365536d",
   "approval_hash": "sha256:v1:4cab2660432a0991011bca189113a28dc10ed796c29f63b380faed7e1dc140ef"
  },
  "approved_architecture_path": ".sdcorejs/architecture/angular/2026-10-01-16-44-icon-shape-option.md",
  "approved_architecture_hash": "sha256:v1:2ae8f0d6d65f5a34b62b776d1cd5f1e880d917c0fe642a0fd97084b746cf5555",
  "owner_repository_id": "sdcorejs-angular",
  "owner_module_id": null,
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "trigger": {
   "required": true,
   "signals": [
    "public-api-contract"
   ],
   "rationale": "Thêm type export, field cấu hình app-level, input trên ba component và field option trên hai service công khai của @sdcorejs/angular, cộng một CSS custom property công khai."
  },
  "invariants": [
   {
    "id": "INV-001",
    "statement": "Không đổi `sd-button`, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer, home-page demo, autoid-inspector.",
    "scope": "Mọi component ngoài năm ô icon trong phạm vi",
    "owner": "sdcorejs-angular",
    "rationale": "User giới hạn phạm vi ở icon tile, không đụng sd-button.",
    "verification_method": "Lệnh tự động: `git diff --name-only` của nhánh chỉ chứa file trong danh sách plan; không file nào thuộc button, avatar, stepper, modal, side-drawer, tab-router, file-explorer, autoid-inspector, home-page.",
    "requirement_refs": [
     "R-007"
    ],
    "decision_refs": [
     "D-005"
    ]
   },
   {
    "id": "INV-002",
    "statement": "`circle` render giống hệt giao diện trước thay đổi (radius 50%, cùng màu nền).",
    "scope": "SCSS ô icon của năm consumer",
    "owner": "sdcorejs-angular",
    "rationale": "Consumer chọn `circle` phải lấy lại đúng giao diện cũ.",
    "verification_method": "Test getComputedStyle: `circle` có border-radius 50% và cùng background-color với `square` của cùng tone.",
    "requirement_refs": [
     "R-007"
    ],
    "decision_refs": [
     "D-002",
     "D-008"
    ]
   },
   {
    "id": "INV-003",
    "statement": "API cũ tương thích ngược: không input/option nào bị đổi tên hay xoá; code không truyền `iconShape` vẫn compile.",
    "scope": "Public API của section, inform, data-state, notify, confirm, icon",
    "owner": "sdcorejs-angular",
    "rationale": "Thêm option không được phá code consumer đang có.",
    "verification_method": "Spec hiện có giữ nguyên vẫn xanh; build lib và showcase (demo cũ không truyền iconShape) exit 0.",
    "requirement_refs": [
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006"
    ],
    "decision_refs": [
     "D-001"
    ]
   },
   {
    "id": "INV-004",
    "statement": "v20/v21/v22 chỉ thay đổi qua `npm run sync`; `npm run check:sync` xanh.",
    "scope": "versions/v20, versions/v21, versions/v22",
    "owner": "sdcorejs-angular",
    "rationale": "Luật rollout của repo.",
    "verification_method": "`npm run check:sync` exit 0.",
    "requirement_refs": [
     "R-008"
    ],
    "decision_refs": [
     "D-001"
    ]
   },
   {
    "id": "INV-005",
    "statement": "Chỉ `resolveSdIconConfig` định nghĩa mặc định `square`; không consumer nào hardcode shape mặc định, và thứ tự ưu tiên luôn là instance > `SD_ICON_CONFIGURATION.defaultShape`.",
    "scope": "modules/icon và năm consumer",
    "owner": "sdcorejs-angular",
    "rationale": "Một nguồn duy nhất cho giá trị mặc định.",
    "verification_method": "Test AC-001; test mỗi consumer không provider ra `square`, provider `circle` ra `circle`; lệnh grep không có literal `square`/`circle` làm fallback trong TS của năm consumer.",
    "requirement_refs": [
     "R-001"
    ],
    "decision_refs": [
     "D-003",
     "D-007"
    ]
   },
   {
    "id": "INV-006",
    "statement": "Mọi ô icon trong phạm vi luôn có `data-icon-shape` với đúng một trong ba giá trị `square`, `circle`, `none`.",
    "scope": "Template ô icon của năm consumer",
    "owner": "sdcorejs-angular",
    "rationale": "Hook DOM ổn định cho CSS, test và consumer.",
    "verification_method": "Test AC-002…AC-006 đọc `data-icon-shape` trên từng ô.",
    "requirement_refs": [
     "R-007"
    ],
    "decision_refs": [
     "D-008"
    ]
   }
  ],
  "boundaries": [
   {
    "id": "B-001",
    "statement": "Chỉ sửa code ở versions/v19 và showcase; v20–v22 qua npm run sync.",
    "invariant_refs": [
     "INV-004"
    ]
   },
   {
    "id": "B-002",
    "statement": "Chỉ năm ô icon (section header, inform, data-state symbol, toast icon, confirm icon) đọc shape; không component nào khác dùng SdIconShape.",
    "invariant_refs": [
     "INV-001",
     "INV-006"
    ]
   }
  ],
  "dependency_directions": [
   {
    "from": "components/section, components/inform, components/data-state",
    "to": "modules/icon (SdIconShape, SD_ICON_CONFIGURATION)",
    "rationale": "Ba component đã import SdIcon từ entrypoint này; không thêm entrypoint mới.",
    "invariant_refs": [
     "INV-005"
    ]
   },
   {
    "from": "services/notify, services/confirm",
    "to": "modules/icon (SdIconShape, SD_ICON_CONFIGURATION)",
    "rationale": "Toast và dialog resolve shape; confirm đã import SdIcon.",
    "invariant_refs": [
     "INV-005"
    ]
   }
  ],
  "data_state_owners": [
   {
    "subject": "Shape mặc định toàn app",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "SD_ICON_CONFIGURATION (resolveSdIconConfig, provideSdIcon)",
    "invariant_refs": [
     "INV-005"
    ]
   },
   {
    "subject": "Shape của một instance",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "Input iconShape của component, hoặc option của lời gọi notify/confirm",
    "invariant_refs": [
     "INV-005",
     "INV-006"
    ]
   }
  ],
  "public_contracts": [
   {
    "id": "C-001",
    "kind": "api",
    "statement": "`SdIconShape` type; `ISdIconConfiguration.defaultShape?: SdIconShape`; `resolveSdIconConfig` trả `defaultShape` (mặc định `square`).",
    "owner": "sdcorejs-angular/modules/icon",
    "compatibility": "Bổ sung. `ISdIconResolvedConfiguration` có thêm field bắt buộc `defaultShape`: object dựng tay không qua `resolveSdIconConfig` phải thêm field (doc và showcase chỉ dùng `resolveSdIconConfig`).",
    "migration": "Không cần; changelog nhắc dùng `resolveSdIconConfig` khi tự provide token.",
    "invariant_refs": [
     "INV-003",
     "INV-005"
    ]
   },
   {
    "id": "C-002",
    "kind": "api",
    "statement": "Input `iconShape: SdIconShape | null | undefined` trên `sd-section`, `sd-inform`, `sd-data-state`.",
    "owner": "sdcorejs-angular",
    "compatibility": "Bổ sung, tuỳ chọn.",
    "migration": "Không cần.",
    "invariant_refs": [
     "INV-003",
     "INV-006"
    ]
   },
   {
    "id": "C-003",
    "kind": "api",
    "statement": "`NotifyOption.iconShape?: SdIconShape`; `iconShape?: SdIconShape` trong option của sáu method `SdConfirmService`.",
    "owner": "sdcorejs-angular",
    "compatibility": "Bổ sung, tuỳ chọn.",
    "migration": "Không cần.",
    "invariant_refs": [
     "INV-003",
     "INV-006"
    ]
   },
   {
    "id": "C-004",
    "kind": "api",
    "statement": "Styling hook: attribute `data-icon-shape` trên ô icon và CSS custom property `--sd-icon-shape-radius` (mặc định `var(--sd-radius-8, 8px)`).",
    "owner": "sdcorejs-angular",
    "compatibility": "Mặc định đổi từ tròn sang vuông bo 8px (thay đổi giao diện, không đổi API).",
    "migration": "`provideSdIcon({ defaultShape: 'circle' })` để giữ kiểu tròn.",
    "invariant_refs": [
     "INV-002",
     "INV-006"
    ]
   }
  ],
  "security_trust_boundaries": [],
  "cross_repository_integration": [],
  "adopted_decision_refs": [
   "D-001",
   "D-002",
   "D-003",
   "D-004",
   "D-005",
   "D-006",
   "D-007",
   "D-008",
   "D-009"
  ],
  "deferred_decision_refs": [],
  "assumption_refs": [
   "A-001",
   "A-002"
  ],
  "validation_obligations": [
   {
    "id": "VAL-001",
    "expected_proof": "Test resolveSdIconConfig/SD_ICON_CONFIGURATION và test mỗi consumer theo ba trường hợp ưu tiên; lệnh grep không có fallback hardcode trong consumer.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": [
     "INV-005",
     "INV-006"
    ],
    "acceptance_criterion_refs": [
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006"
    ]
   },
   {
    "id": "VAL-002",
    "expected_proof": "Test getComputedStyle cho ba shape ở từng ô, token radius, tip của inform trong suốt; `none` trong suốt ở mọi tone/state: section 6 tone, inform 6 tone, data-state error/forbidden/loading, toast 4 type, confirm 5 tone.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": [
     "INV-002"
    ],
    "acceptance_criterion_refs": [
     "AC-003",
     "AC-007"
    ]
   },
   {
    "id": "VAL-003",
    "expected_proof": "Full suite v19 xanh, build lib + showcase exit 0, `git diff --name-only` khớp danh sách plan.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": [
     "INV-001",
     "INV-003"
    ],
    "acceptance_criterion_refs": [
     "AC-008"
    ]
   },
   {
    "id": "VAL-004",
    "expected_proof": "`npm run check:sync` exit 0; grep doc và CHANGELOG theo AC-008.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": [
     "INV-004"
    ],
    "acceptance_criterion_refs": [
     "AC-008"
    ]
   }
  ],
  "profile_sections": {
   "frontend_architecture_ref": {
    "reference": "plan_context.frontend_architecture",
    "conformance_invariant_refs": [
     "INV-005",
     "INV-006"
    ]
   },
   "agent_architecture_ref": null
  },
  "change_control": {
   "revision": 2,
   "supersedes": "architecture-icon-shape-option-r1",
   "change_reason": "Trigger rationale chép đúng nguyên văn architecture_gate.rationale của spec đã duyệt (r1 diễn đạt lại nên validateArchitecturePrePlanHandoff báo TRIGGER_IDENTITY_MISMATCH). Nội dung kiến trúc không đổi."
  }
 },
 "decision_coverage": {
  "schema_version": 1,
  "revision": 4,
  "records": [
   {
    "id": "R-001",
    "type": "requirement",
    "statement": "`@sdcorejs/angular/modules/icon` export type `SdIconShape = 'square' | 'circle' | 'none'`; `ISdIconConfiguration` có field tuỳ chọn `defaultShape?: SdIconShape`, `resolveSdIconConfig` resolve field này với mặc định `'square'`, nên `provideSdIcon({ defaultShape })` đổi mặc định toàn app.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "modules/icon",
    "task_refs": [
     "TASK-001"
    ]
   },
   {
    "id": "R-002",
    "type": "requirement",
    "statement": "`sd-section` có input `iconShape: SdIconShape | null | undefined`; ô icon header render theo shape đã resolve (instance > app default > 'square').",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/section",
    "task_refs": [
     "TASK-002"
    ]
   },
   {
    "id": "R-003",
    "type": "requirement",
    "statement": "`sd-inform` có input `iconShape`; ô icon render theo shape đã resolve. Variant `tip` vẫn không có nền như hiện tại, bất kể shape.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/inform",
    "task_refs": [
     "TASK-003"
    ]
   },
   {
    "id": "R-004",
    "type": "requirement",
    "statement": "`sd-data-state` có input `iconShape`; ô symbol render theo shape đã resolve ở cả layout thường và `compact`.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/data-state",
    "task_refs": [
     "TASK-004"
    ]
   },
   {
    "id": "R-005",
    "type": "requirement",
    "statement": "`NotifyOption` có field `iconShape?: SdIconShape`; `success`, `info`, `warning`, `error` của `SdNotifyService` truyền shape xuống toast, kể cả nhánh buffer của `warning`/`error`; ô icon toast render theo shape đã resolve.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "services/notify",
    "task_refs": [
     "TASK-005"
    ]
   },
   {
    "id": "R-006",
    "type": "requirement",
    "statement": "Option của cả sáu method `SdConfirmService` (`confirm`, `withInput`, `withRadio`, `withSelect`, `withDate`, `withDatetime`) có field `iconShape?: SdIconShape`; ô icon của dialog confirm render theo shape đã resolve.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "services/confirm",
    "task_refs": [
     "TASK-006"
    ]
   },
   {
    "id": "R-007",
    "type": "requirement",
    "statement": "Hiển thị: `square` giữ màu nền, `border-radius: var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`; `circle` giữ đúng giao diện hiện tại (50%); `none` bỏ nền, icon giữ màu, kích thước ô không đổi. Mỗi ô icon mang attribute `data-icon-shape` bằng shape đã resolve.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ]
   },
   {
    "id": "R-008",
    "type": "requirement",
    "statement": "Tài liệu `sd-icon.md`, `sd-section.md`, `sd-inform.md`, `sd-data-state.md`, `sd-notify.md`, `sd-confirm.md` mô tả option mới; root `CHANGELOG.md` có mục `## [Unreleased]` ghi đổi mặc định và cách lấy lại kiểu tròn; showcase có demo ba shape; v20/v21/v22 dẫn xuất bằng `npm run sync`.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-007",
     "TASK-008",
     "TASK-009"
    ]
   },
   {
    "id": "AC-001",
    "type": "acceptance-criterion",
    "statement": "Cấu hình icon resolve `defaultShape` đúng.",
    "behavior": "Gọi `resolveSdIconConfig()` và `resolveSdIconConfig({ defaultShape: 'circle' })`.",
    "expected_result": "Lần đầu trả `defaultShape: 'square'`; lần sau trả `'circle'`; `SD_ICON_CONFIGURATION` không provider cũng trả `'square'`.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-001"
    ],
    "task_refs": [
     "TASK-001"
    ]
   },
   {
    "id": "AC-002",
    "type": "acceptance-criterion",
    "statement": "Ô icon header của `sd-section` theo thứ tự ưu tiên shape.",
    "behavior": "Render `sd-section` có `icon` với (a) không input, không provider; (b) provider `defaultShape: 'circle'`; (c) provider `'circle'` và input `iconShape=\"none\"`.",
    "expected_result": "`.sd-section-header-icon` có `data-icon-shape` lần lượt `square`, `circle`, `none`.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-002",
     "R-007"
    ],
    "task_refs": [
     "TASK-002"
    ]
   },
   {
    "id": "AC-003",
    "type": "acceptance-criterion",
    "statement": "Ô icon của `sd-inform` theo thứ tự ưu tiên shape; tip không có nền.",
    "behavior": "Render `sd-inform` với ba trường hợp như AC-002, rồi render `sd-inform` variant tip với `iconShape=\"square\"`.",
    "expected_result": "`.c-inform-icon-tile` có `data-icon-shape` lần lượt `square`, `circle`, `none`; ở tip, computed `background-color` của ô là trong suốt.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-003",
     "R-007"
    ],
    "task_refs": [
     "TASK-003"
    ]
   },
   {
    "id": "AC-004",
    "type": "acceptance-criterion",
    "statement": "Ô symbol của `sd-data-state` theo thứ tự ưu tiên shape ở cả hai layout.",
    "behavior": "Render `sd-data-state` với ba trường hợp như AC-002, mỗi trường hợp có và không có `compact`.",
    "expected_result": "`.sd-data-state__symbol` có `data-icon-shape` lần lượt `square`, `circle`, `none` ở cả hai layout.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-004",
     "R-007"
    ],
    "task_refs": [
     "TASK-004"
    ]
   },
   {
    "id": "AC-005",
    "type": "acceptance-criterion",
    "statement": "Toast nhận `iconShape` từ option hoặc app default.",
    "behavior": "Gọi `success('x', { iconShape: 'circle' })`, `info('x')` và `error('x', { iconShape: 'none' })` (chờ hết debounce buffer) trên service có provider `defaultShape` mặc định.",
    "expected_result": "`.sd-toast__icon` của từng toast có `data-icon-shape` lần lượt `circle`, `square`, `none`.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-005",
     "R-007"
    ],
    "task_refs": [
     "TASK-005"
    ]
   },
   {
    "id": "AC-006",
    "type": "acceptance-criterion",
    "statement": "Dialog confirm nhận `iconShape` từ mọi method.",
    "behavior": "Mở dialog qua từng method trong sáu method với `iconShape: 'circle'`, và mở `confirm` không có `iconShape`.",
    "expected_result": "`data` của dialog chứa đúng `iconShape`; `.sd-dialog-confirm__icon` có `data-icon-shape=\"circle\"` khi truyền và `\"square\"` khi không truyền.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-006",
     "R-007"
    ],
    "task_refs": [
     "TASK-006"
    ]
   },
   {
    "id": "AC-007",
    "type": "acceptance-criterion",
    "statement": "Ba shape hiển thị đúng hình học và nền.",
    "behavior": "Trong Karma (Chrome thật), đọc `getComputedStyle` của ô icon từng component ở `square`, `circle`, `none`.",
    "expected_result": "`square` có `border-radius` 8px và nền khác trong suốt; `circle` có `border-radius` 50% và nền như hiện tại; `none` có nền trong suốt, `width`/`height` bằng `square`; đặt `--sd-icon-shape-radius: 4px` thì `square` có radius 4px.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-007"
    ],
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ]
   },
   {
    "id": "AC-008",
    "type": "acceptance-criterion",
    "statement": "Tài liệu, changelog, showcase và rollout đồng bộ.",
    "behavior": "Grep sáu file doc và `CHANGELOG.md`; chạy `npm run check:sync`; build showcase sau khi build lib.",
    "expected_result": "Sáu doc nhắc `iconShape` (doc icon nhắc `defaultShape` và `SdIconShape`); `## [Unreleased]` có mục đổi mặc định kèm `provideSdIcon({ defaultShape: 'circle' })`; `check:sync` exit 0; showcase build exit 0 và có demo dùng cả ba shape.",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-008"
    ],
    "task_refs": [
     "TASK-007",
     "TASK-008",
     "TASK-009"
    ]
   },
   {
    "id": "A-001",
    "type": "assumption",
    "statement": "Đổi mặc định từ tròn sang vuông là thay đổi giao diện, không phá API: không input nào bị đổi tên hay xoá, nên release suffix bump minor và changelog ghi ở `### Changed`, không phải `### Changed (BREAKING for consumers)`.",
    "source": "explicit",
    "confidence": "high",
    "status": "confirmed",
    "blocking": false,
    "evidence_refs": [
     "user-answer-2026-10-01-default-square"
    ],
    "consequence_if_wrong": "Consumer nâng cấp ngạc nhiên vì giao diện đổi mà không có cảnh báo breaking.",
    "validation_method": "Changelog nêu rõ đổi mặc định và một dòng cấu hình để lấy lại kiểu tròn.",
    "owner": "sdcorejs-angular maintainer",
    "rationale": "User chọn mặc định vuông và chấp nhận đổi giao diện cho mọi consumer.",
    "impacted_refs": [
     "R-001",
     "R-008"
    ]
   },
   {
    "id": "A-002",
    "type": "assumption",
    "statement": "Toast vẽ icon bằng SVG inline chứ không dùng `sd-icon`; option vẫn áp cho ô nền bao SVG đó.",
    "source": "explicit",
    "confidence": "high",
    "status": "confirmed",
    "blocking": false,
    "evidence_refs": [
     "services/notify/src/components/toast/toast.component.html"
    ],
    "consequence_if_wrong": "Toast lệch shape so với các component còn lại.",
    "validation_method": "AC-005 và AC-007 kiểm tra trên `.sd-toast__icon`.",
    "owner": "sdcorejs-angular maintainer",
    "rationale": "User nêu đích danh sd notify trong phạm vi.",
    "impacted_refs": [
     "R-005"
    ]
   },
   {
    "id": "D-001",
    "type": "decision",
    "statement": "Đặt tên API là `iconShape`, `SdIconShape`, `defaultShape`.",
    "question": "Tên thuộc tính và type cho hình nền icon?",
    "selected_value": "Input/option `iconShape`; type `SdIconShape`; field app-level `defaultShape` trong `provideSdIcon`.",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Khớp cặp `icon`/`iconColor` sẵn có ở `sd-section` và `defaultFontSet` của `provideSdIcon`.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": true,
     "category": "naming"
    },
    "downstream_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006"
    ],
    "task_refs": [
     "TASK-001",
     "TASK-007"
    ]
   },
   {
    "id": "D-002",
    "type": "decision",
    "statement": "Mặc định là `square` với radius 8px, chỉnh được qua `--sd-icon-shape-radius`.",
    "question": "Shape và radius mặc định?",
    "selected_value": "'square', radius var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "User chọn 8px và muốn đồng nhất bo vuông nhẹ.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-001",
     "R-007",
     "AC-001",
     "AC-007"
    ],
    "task_refs": [
     "TASK-001"
    ]
   },
   {
    "id": "D-003",
    "type": "decision",
    "statement": "Thứ tự ưu tiên là instance > app default > 'square'.",
    "question": "Khi nhiều nguồn cùng đặt shape, nguồn nào thắng?",
    "selected_value": "instance (`iconShape`) > `provideSdIcon({ defaultShape })` > `'square'`",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Cho phép đổi một chỗ toàn app mà vẫn ghi đè từng instance.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006"
    ],
    "task_refs": [
     "TASK-001"
    ]
   },
   {
    "id": "D-004",
    "type": "decision",
    "statement": "`none` giữ nguyên kích thước ô.",
    "question": "Shape `none` có thu nhỏ ô icon không?",
    "selected_value": "Giữ width/height, chỉ bỏ nền.",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Đổi shape không làm xê dịch title/message bên cạnh.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-007",
     "AC-007"
    ],
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ]
   },
   {
    "id": "D-005",
    "type": "decision",
    "statement": "Phạm vi chỉ gồm năm ô icon trang trí.",
    "question": "Component nào nhận option?",
    "selected_value": "sd-section header, sd-inform, sd-data-state, toast của notify, dialog confirm.",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "User giới hạn ở icon hiển thị kiểu sd-icon tile; không đụng sd-button.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "INV-001"
    ],
    "task_refs": [
     "TASK-009"
    ]
   },
   {
    "id": "D-006",
    "type": "decision",
    "statement": "Mọi tiêu chí kiểm chứng tự động; xem showcase bằng mắt là UAT tuỳ chọn ngoài gate.",
    "question": "Kiểm chứng giao diện thế nào?",
    "selected_value": "Karma + getComputedStyle; manual_criteria_count = 0.",
    "source": "approved-spec",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Delivery convergence không nhận evidence thủ công.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "AC-007",
     "AC-008"
    ],
    "task_refs": [
     "TASK-009"
    ]
   },
   {
    "id": "D-007",
    "type": "decision",
    "statement": "Mỗi consumer tự resolve shape bằng `iconShape ?? SD_ICON_CONFIGURATION.defaultShape`; không thêm helper, directive hay component dùng chung.",
    "question": "Logic chọn shape đặt ở đâu?",
    "selected_value": "Inline trong từng component; `resolveSdIconConfig` là nơi duy nhất giữ giá trị mặc định `square`.",
    "source": "approved-spec",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Biểu thức một dòng; helper dùng chung từ entrypoint icon sẽ thành public API thừa.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-001",
     "AC-001",
     "INV-005"
    ],
    "task_refs": [
     "TASK-001"
    ]
   },
   {
    "id": "D-008",
    "type": "decision",
    "statement": "Hợp đồng DOM/CSS: ô icon mang `data-icon-shape=\"square|circle|none\"`; SCSS chọn theo attribute; radius `square` đọc `--sd-icon-shape-radius`.",
    "question": "Giao diện từng shape gắn vào DOM thế nào?",
    "selected_value": "Attribute `data-icon-shape` trên ô icon; rule gốc là `square`, override cho `circle` và `none`. Rule shape đặt sau rule tone/state và có specificity không thấp hơn rule tone/state mạnh nhất của cùng ô, để `none` luôn trong suốt ở mọi tone/state.",
    "source": "approved-spec",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Một hook ổn định cho test, SCSS và consumer muốn chỉnh thêm; không đổi class sẵn có.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-007",
     "AC-007",
     "INV-006"
    ],
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ]
   },
   {
    "id": "D-009",
    "type": "decision",
    "statement": "Notify và confirm chuyển nguyên `iconShape` của option vào `ToastData`/`DialogData`; toast và dialog tự resolve với `SD_ICON_CONFIGURATION`.",
    "question": "Service hay component resolve shape cho toast và dialog?",
    "selected_value": "Component resolve; service chỉ chuyển option. Nhánh buffer dùng option của lời gọi cuối (luật hiện có của `title`/`duration`); lời gọi cuối không có `iconShape` thì dùng app default.",
    "source": "approved-spec",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Service không cần inject cấu hình icon; luật resolve giống ba component còn lại.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-005",
     "R-006",
     "AC-005",
     "AC-006"
    ],
    "task_refs": [
     "TASK-005",
     "TASK-006"
    ]
   },
   {
    "id": "D-010",
    "type": "decision",
    "statement": "Ranh giới kiểm chứng của validation map là `none`.",
    "question": "Ranh giới kiểm chứng của validation map?",
    "selected_value": "kind none — thay đổi chỉ là UI thư viện, không xác thực người dùng, không gọi HTTP; mọi AC chứng minh bằng Karma, script repo hoặc lệnh ghi nguyên văn trong plan; không có bằng chứng thủ công (D-006).",
    "source": "approved-plan",
    "status": "proposed",
    "blocking": false,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Không có ranh giới phân quyền nên không cần bằng chứng từ chối ở API.",
    "supersedes": null,
    "revisit_condition": "Khi thay đổi đụng tới xác thực, quyền hoặc dữ liệu phía server.",
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ],
    "task_refs": [
     "TASK-009"
    ],
    "validation_boundary": {
     "kind": "none",
     "source_refs": [
      "R-001",
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006",
      "R-007",
      "R-008",
      "AC-001",
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006",
      "AC-007",
      "AC-008",
      "INV-001",
      "INV-002",
      "INV-003",
      "INV-004",
      "INV-005",
      "INV-006"
     ]
    }
   },
   {
    "id": "INV-001",
    "type": "invariant",
    "statement": "Không đổi `sd-button`, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer, home-page demo, autoid-inspector.",
    "protected_refs": [
     "R-007",
     "D-005"
    ],
    "task_refs": [
     "TASK-007",
     "TASK-009"
    ],
    "evidence_refs": [
     "EVIDENCE-007",
     "EVIDENCE-009"
    ]
   },
   {
    "id": "INV-002",
    "type": "invariant",
    "statement": "`circle` render giống hệt giao diện trước thay đổi (radius 50%, cùng màu nền).",
    "protected_refs": [
     "R-007",
     "AC-007"
    ],
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ],
    "evidence_refs": [
     "EVIDENCE-002",
     "EVIDENCE-003",
     "EVIDENCE-004",
     "EVIDENCE-005",
     "EVIDENCE-006"
    ]
   },
   {
    "id": "INV-003",
    "type": "invariant",
    "statement": "API cũ tương thích ngược: không input/option nào bị đổi tên hay xoá; code không truyền `iconShape` vẫn compile.",
    "protected_refs": [
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "A-001"
    ],
    "task_refs": [
     "TASK-008",
     "TASK-009"
    ],
    "evidence_refs": [
     "EVIDENCE-008",
     "EVIDENCE-009"
    ]
   },
   {
    "id": "INV-004",
    "type": "invariant",
    "statement": "v20/v21/v22 chỉ thay đổi qua `npm run sync`; `npm run check:sync` xanh.",
    "protected_refs": [
     "R-008",
     "AC-008"
    ],
    "task_refs": [
     "TASK-009"
    ],
    "evidence_refs": [
     "EVIDENCE-009"
    ]
   },
   {
    "id": "INV-005",
    "type": "invariant",
    "statement": "Chỉ `resolveSdIconConfig` định nghĩa mặc định `square`; không consumer nào hardcode shape mặc định, và thứ tự ưu tiên luôn là instance > `SD_ICON_CONFIGURATION.defaultShape`.",
    "protected_refs": [
     "R-001",
     "AC-001",
     "D-003",
     "D-007"
    ],
    "task_refs": [
     "TASK-001",
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ],
    "evidence_refs": [
     "EVIDENCE-001",
     "EVIDENCE-002",
     "EVIDENCE-003",
     "EVIDENCE-004",
     "EVIDENCE-005",
     "EVIDENCE-006"
    ]
   },
   {
    "id": "INV-006",
    "type": "invariant",
    "statement": "Mọi ô icon trong phạm vi luôn có `data-icon-shape` với đúng một trong ba giá trị `square`, `circle`, `none`.",
    "protected_refs": [
     "R-007",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "D-008"
    ],
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ],
    "evidence_refs": [
     "EVIDENCE-002",
     "EVIDENCE-003",
     "EVIDENCE-004",
     "EVIDENCE-005",
     "EVIDENCE-006"
    ]
   }
  ],
  "history": [
   {
    "revision": 1,
    "active": [
     {
      "id": "R-001",
      "type": "requirement"
     },
     {
      "id": "R-002",
      "type": "requirement"
     },
     {
      "id": "R-003",
      "type": "requirement"
     },
     {
      "id": "R-004",
      "type": "requirement"
     },
     {
      "id": "R-005",
      "type": "requirement"
     },
     {
      "id": "R-006",
      "type": "requirement"
     },
     {
      "id": "R-007",
      "type": "requirement"
     },
     {
      "id": "R-008",
      "type": "requirement"
     },
     {
      "id": "AC-001",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-002",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-003",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-004",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-005",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-006",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-007",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-008",
      "type": "acceptance-criterion"
     },
     {
      "id": "A-001",
      "type": "assumption"
     },
     {
      "id": "A-002",
      "type": "assumption"
     },
     {
      "id": "D-001",
      "type": "decision"
     },
     {
      "id": "D-002",
      "type": "decision"
     },
     {
      "id": "D-003",
      "type": "decision"
     },
     {
      "id": "D-004",
      "type": "decision"
     },
     {
      "id": "D-005",
      "type": "decision"
     },
     {
      "id": "D-006",
      "type": "decision"
     },
     {
      "id": "INV-001",
      "type": "invariant"
     },
     {
      "id": "INV-002",
      "type": "invariant"
     },
     {
      "id": "INV-003",
      "type": "invariant"
     },
     {
      "id": "INV-004",
      "type": "invariant"
     }
    ],
    "tombstones": []
   },
   {
    "revision": 2,
    "active": [
     {
      "id": "R-001",
      "type": "requirement"
     },
     {
      "id": "R-002",
      "type": "requirement"
     },
     {
      "id": "R-003",
      "type": "requirement"
     },
     {
      "id": "R-004",
      "type": "requirement"
     },
     {
      "id": "R-005",
      "type": "requirement"
     },
     {
      "id": "R-006",
      "type": "requirement"
     },
     {
      "id": "R-007",
      "type": "requirement"
     },
     {
      "id": "R-008",
      "type": "requirement"
     },
     {
      "id": "AC-001",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-002",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-003",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-004",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-005",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-006",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-007",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-008",
      "type": "acceptance-criterion"
     },
     {
      "id": "A-001",
      "type": "assumption"
     },
     {
      "id": "A-002",
      "type": "assumption"
     },
     {
      "id": "D-001",
      "type": "decision"
     },
     {
      "id": "D-002",
      "type": "decision"
     },
     {
      "id": "D-003",
      "type": "decision"
     },
     {
      "id": "D-004",
      "type": "decision"
     },
     {
      "id": "D-005",
      "type": "decision"
     },
     {
      "id": "D-006",
      "type": "decision"
     },
     {
      "id": "D-007",
      "type": "decision"
     },
     {
      "id": "D-008",
      "type": "decision"
     },
     {
      "id": "D-009",
      "type": "decision"
     },
     {
      "id": "INV-001",
      "type": "invariant"
     },
     {
      "id": "INV-002",
      "type": "invariant"
     },
     {
      "id": "INV-003",
      "type": "invariant"
     },
     {
      "id": "INV-004",
      "type": "invariant"
     },
     {
      "id": "INV-005",
      "type": "invariant"
     },
     {
      "id": "INV-006",
      "type": "invariant"
     }
    ],
    "tombstones": []
   },
   {
    "revision": 3,
    "active": [
     {
      "id": "R-001",
      "type": "requirement"
     },
     {
      "id": "R-002",
      "type": "requirement"
     },
     {
      "id": "R-003",
      "type": "requirement"
     },
     {
      "id": "R-004",
      "type": "requirement"
     },
     {
      "id": "R-005",
      "type": "requirement"
     },
     {
      "id": "R-006",
      "type": "requirement"
     },
     {
      "id": "R-007",
      "type": "requirement"
     },
     {
      "id": "R-008",
      "type": "requirement"
     },
     {
      "id": "AC-001",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-002",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-003",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-004",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-005",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-006",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-007",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-008",
      "type": "acceptance-criterion"
     },
     {
      "id": "A-001",
      "type": "assumption"
     },
     {
      "id": "A-002",
      "type": "assumption"
     },
     {
      "id": "D-001",
      "type": "decision"
     },
     {
      "id": "D-002",
      "type": "decision"
     },
     {
      "id": "D-003",
      "type": "decision"
     },
     {
      "id": "D-004",
      "type": "decision"
     },
     {
      "id": "D-005",
      "type": "decision"
     },
     {
      "id": "D-006",
      "type": "decision"
     },
     {
      "id": "D-007",
      "type": "decision"
     },
     {
      "id": "D-008",
      "type": "decision"
     },
     {
      "id": "D-009",
      "type": "decision"
     },
     {
      "id": "D-010",
      "type": "decision"
     },
     {
      "id": "INV-001",
      "type": "invariant"
     },
     {
      "id": "INV-002",
      "type": "invariant"
     },
     {
      "id": "INV-003",
      "type": "invariant"
     },
     {
      "id": "INV-004",
      "type": "invariant"
     },
     {
      "id": "INV-005",
      "type": "invariant"
     },
     {
      "id": "INV-006",
      "type": "invariant"
     }
    ],
    "tombstones": []
   },
   {
    "revision": 4,
    "active": [
     {
      "id": "R-001",
      "type": "requirement"
     },
     {
      "id": "R-002",
      "type": "requirement"
     },
     {
      "id": "R-003",
      "type": "requirement"
     },
     {
      "id": "R-004",
      "type": "requirement"
     },
     {
      "id": "R-005",
      "type": "requirement"
     },
     {
      "id": "R-006",
      "type": "requirement"
     },
     {
      "id": "R-007",
      "type": "requirement"
     },
     {
      "id": "R-008",
      "type": "requirement"
     },
     {
      "id": "AC-001",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-002",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-003",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-004",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-005",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-006",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-007",
      "type": "acceptance-criterion"
     },
     {
      "id": "AC-008",
      "type": "acceptance-criterion"
     },
     {
      "id": "A-001",
      "type": "assumption"
     },
     {
      "id": "A-002",
      "type": "assumption"
     },
     {
      "id": "D-001",
      "type": "decision"
     },
     {
      "id": "D-002",
      "type": "decision"
     },
     {
      "id": "D-003",
      "type": "decision"
     },
     {
      "id": "D-004",
      "type": "decision"
     },
     {
      "id": "D-005",
      "type": "decision"
     },
     {
      "id": "D-006",
      "type": "decision"
     },
     {
      "id": "D-007",
      "type": "decision"
     },
     {
      "id": "D-008",
      "type": "decision"
     },
     {
      "id": "D-009",
      "type": "decision"
     },
     {
      "id": "D-010",
      "type": "decision"
     },
     {
      "id": "INV-001",
      "type": "invariant"
     },
     {
      "id": "INV-002",
      "type": "invariant"
     },
     {
      "id": "INV-003",
      "type": "invariant"
     },
     {
      "id": "INV-004",
      "type": "invariant"
     },
     {
      "id": "INV-005",
      "type": "invariant"
     },
     {
      "id": "INV-006",
      "type": "invariant"
     }
    ],
    "tombstones": []
   }
  ]
 },
 "goal_backward_review": {
  "schema_version": 1,
  "mode": "sdcorejs-plan:goal-backward",
  "decision_coverage": {
   "schema_version": 1,
   "revision": 4,
   "records": [
    {
     "id": "R-001",
     "type": "requirement",
     "statement": "`@sdcorejs/angular/modules/icon` export type `SdIconShape = 'square' | 'circle' | 'none'`; `ISdIconConfiguration` có field tuỳ chọn `defaultShape?: SdIconShape`, `resolveSdIconConfig` resolve field này với mặc định `'square'`, nên `provideSdIcon({ defaultShape })` đổi mặc định toàn app.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "modules/icon",
     "task_refs": [
      "TASK-001"
     ]
    },
    {
     "id": "R-002",
     "type": "requirement",
     "statement": "`sd-section` có input `iconShape: SdIconShape | null | undefined`; ô icon header render theo shape đã resolve (instance > app default > 'square').",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/section",
     "task_refs": [
      "TASK-002"
     ]
    },
    {
     "id": "R-003",
     "type": "requirement",
     "statement": "`sd-inform` có input `iconShape`; ô icon render theo shape đã resolve. Variant `tip` vẫn không có nền như hiện tại, bất kể shape.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/inform",
     "task_refs": [
      "TASK-003"
     ]
    },
    {
     "id": "R-004",
     "type": "requirement",
     "statement": "`sd-data-state` có input `iconShape`; ô symbol render theo shape đã resolve ở cả layout thường và `compact`.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/data-state",
     "task_refs": [
      "TASK-004"
     ]
    },
    {
     "id": "R-005",
     "type": "requirement",
     "statement": "`NotifyOption` có field `iconShape?: SdIconShape`; `success`, `info`, `warning`, `error` của `SdNotifyService` truyền shape xuống toast, kể cả nhánh buffer của `warning`/`error`; ô icon toast render theo shape đã resolve.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "services/notify",
     "task_refs": [
      "TASK-005"
     ]
    },
    {
     "id": "R-006",
     "type": "requirement",
     "statement": "Option của cả sáu method `SdConfirmService` (`confirm`, `withInput`, `withRadio`, `withSelect`, `withDate`, `withDatetime`) có field `iconShape?: SdIconShape`; ô icon của dialog confirm render theo shape đã resolve.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "services/confirm",
     "task_refs": [
      "TASK-006"
     ]
    },
    {
     "id": "R-007",
     "type": "requirement",
     "statement": "Hiển thị: `square` giữ màu nền, `border-radius: var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`; `circle` giữ đúng giao diện hiện tại (50%); `none` bỏ nền, icon giữ màu, kích thước ô không đổi. Mỗi ô icon mang attribute `data-icon-shape` bằng shape đã resolve.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ]
    },
    {
     "id": "R-008",
     "type": "requirement",
     "statement": "Tài liệu `sd-icon.md`, `sd-section.md`, `sd-inform.md`, `sd-data-state.md`, `sd-notify.md`, `sd-confirm.md` mô tả option mới; root `CHANGELOG.md` có mục `## [Unreleased]` ghi đổi mặc định và cách lấy lại kiểu tròn; showcase có demo ba shape; v20/v21/v22 dẫn xuất bằng `npm run sync`.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-007",
      "TASK-008",
      "TASK-009"
     ]
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion",
     "statement": "Cấu hình icon resolve `defaultShape` đúng.",
     "behavior": "Gọi `resolveSdIconConfig()` và `resolveSdIconConfig({ defaultShape: 'circle' })`.",
     "expected_result": "Lần đầu trả `defaultShape: 'square'`; lần sau trả `'circle'`; `SD_ICON_CONFIGURATION` không provider cũng trả `'square'`.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-001"
     ],
     "task_refs": [
      "TASK-001"
     ]
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion",
     "statement": "Ô icon header của `sd-section` theo thứ tự ưu tiên shape.",
     "behavior": "Render `sd-section` có `icon` với (a) không input, không provider; (b) provider `defaultShape: 'circle'`; (c) provider `'circle'` và input `iconShape=\"none\"`.",
     "expected_result": "`.sd-section-header-icon` có `data-icon-shape` lần lượt `square`, `circle`, `none`.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-002",
      "R-007"
     ],
     "task_refs": [
      "TASK-002"
     ]
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion",
     "statement": "Ô icon của `sd-inform` theo thứ tự ưu tiên shape; tip không có nền.",
     "behavior": "Render `sd-inform` với ba trường hợp như AC-002, rồi render `sd-inform` variant tip với `iconShape=\"square\"`.",
     "expected_result": "`.c-inform-icon-tile` có `data-icon-shape` lần lượt `square`, `circle`, `none`; ở tip, computed `background-color` của ô là trong suốt.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-003",
      "R-007"
     ],
     "task_refs": [
      "TASK-003"
     ]
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion",
     "statement": "Ô symbol của `sd-data-state` theo thứ tự ưu tiên shape ở cả hai layout.",
     "behavior": "Render `sd-data-state` với ba trường hợp như AC-002, mỗi trường hợp có và không có `compact`.",
     "expected_result": "`.sd-data-state__symbol` có `data-icon-shape` lần lượt `square`, `circle`, `none` ở cả hai layout.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-004",
      "R-007"
     ],
     "task_refs": [
      "TASK-004"
     ]
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion",
     "statement": "Toast nhận `iconShape` từ option hoặc app default.",
     "behavior": "Gọi `success('x', { iconShape: 'circle' })`, `info('x')` và `error('x', { iconShape: 'none' })` (chờ hết debounce buffer) trên service có provider `defaultShape` mặc định.",
     "expected_result": "`.sd-toast__icon` của từng toast có `data-icon-shape` lần lượt `circle`, `square`, `none`.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-005",
      "R-007"
     ],
     "task_refs": [
      "TASK-005"
     ]
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion",
     "statement": "Dialog confirm nhận `iconShape` từ mọi method.",
     "behavior": "Mở dialog qua từng method trong sáu method với `iconShape: 'circle'`, và mở `confirm` không có `iconShape`.",
     "expected_result": "`data` của dialog chứa đúng `iconShape`; `.sd-dialog-confirm__icon` có `data-icon-shape=\"circle\"` khi truyền và `\"square\"` khi không truyền.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-006",
      "R-007"
     ],
     "task_refs": [
      "TASK-006"
     ]
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion",
     "statement": "Ba shape hiển thị đúng hình học và nền.",
     "behavior": "Trong Karma (Chrome thật), đọc `getComputedStyle` của ô icon từng component ở `square`, `circle`, `none`.",
     "expected_result": "`square` có `border-radius` 8px và nền khác trong suốt; `circle` có `border-radius` 50% và nền như hiện tại; `none` có nền trong suốt, `width`/`height` bằng `square`; đặt `--sd-icon-shape-radius: 4px` thì `square` có radius 4px.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-007"
     ],
     "task_refs": [
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ]
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion",
     "statement": "Tài liệu, changelog, showcase và rollout đồng bộ.",
     "behavior": "Grep sáu file doc và `CHANGELOG.md`; chạy `npm run check:sync`; build showcase sau khi build lib.",
     "expected_result": "Sáu doc nhắc `iconShape` (doc icon nhắc `defaultShape` và `SdIconShape`); `## [Unreleased]` có mục đổi mặc định kèm `provideSdIcon({ defaultShape: 'circle' })`; `check:sync` exit 0; showcase build exit 0 và có demo dùng cả ba shape.",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-008"
     ],
     "task_refs": [
      "TASK-007",
      "TASK-008",
      "TASK-009"
     ]
    },
    {
     "id": "A-001",
     "type": "assumption",
     "statement": "Đổi mặc định từ tròn sang vuông là thay đổi giao diện, không phá API: không input nào bị đổi tên hay xoá, nên release suffix bump minor và changelog ghi ở `### Changed`, không phải `### Changed (BREAKING for consumers)`.",
     "source": "explicit",
     "confidence": "high",
     "status": "confirmed",
     "blocking": false,
     "evidence_refs": [
      "user-answer-2026-10-01-default-square"
     ],
     "consequence_if_wrong": "Consumer nâng cấp ngạc nhiên vì giao diện đổi mà không có cảnh báo breaking.",
     "validation_method": "Changelog nêu rõ đổi mặc định và một dòng cấu hình để lấy lại kiểu tròn.",
     "owner": "sdcorejs-angular maintainer",
     "rationale": "User chọn mặc định vuông và chấp nhận đổi giao diện cho mọi consumer.",
     "impacted_refs": [
      "R-001",
      "R-008"
     ]
    },
    {
     "id": "A-002",
     "type": "assumption",
     "statement": "Toast vẽ icon bằng SVG inline chứ không dùng `sd-icon`; option vẫn áp cho ô nền bao SVG đó.",
     "source": "explicit",
     "confidence": "high",
     "status": "confirmed",
     "blocking": false,
     "evidence_refs": [
      "services/notify/src/components/toast/toast.component.html"
     ],
     "consequence_if_wrong": "Toast lệch shape so với các component còn lại.",
     "validation_method": "AC-005 và AC-007 kiểm tra trên `.sd-toast__icon`.",
     "owner": "sdcorejs-angular maintainer",
     "rationale": "User nêu đích danh sd notify trong phạm vi.",
     "impacted_refs": [
      "R-005"
     ]
    },
    {
     "id": "D-001",
     "type": "decision",
     "statement": "Đặt tên API là `iconShape`, `SdIconShape`, `defaultShape`.",
     "question": "Tên thuộc tính và type cho hình nền icon?",
     "selected_value": "Input/option `iconShape`; type `SdIconShape`; field app-level `defaultShape` trong `provideSdIcon`.",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Khớp cặp `icon`/`iconColor` sẵn có ở `sd-section` và `defaultFontSet` của `provideSdIcon`.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": true,
      "category": "naming"
     },
     "downstream_refs": [
      "R-001",
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006"
     ],
     "task_refs": [
      "TASK-001",
      "TASK-007"
     ]
    },
    {
     "id": "D-002",
     "type": "decision",
     "statement": "Mặc định là `square` với radius 8px, chỉnh được qua `--sd-icon-shape-radius`.",
     "question": "Shape và radius mặc định?",
     "selected_value": "'square', radius var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "User chọn 8px và muốn đồng nhất bo vuông nhẹ.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-001",
      "R-007",
      "AC-001",
      "AC-007"
     ],
     "task_refs": [
      "TASK-001"
     ]
    },
    {
     "id": "D-003",
     "type": "decision",
     "statement": "Thứ tự ưu tiên là instance > app default > 'square'.",
     "question": "Khi nhiều nguồn cùng đặt shape, nguồn nào thắng?",
     "selected_value": "instance (`iconShape`) > `provideSdIcon({ defaultShape })` > `'square'`",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Cho phép đổi một chỗ toàn app mà vẫn ghi đè từng instance.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006"
     ],
     "task_refs": [
      "TASK-001"
     ]
    },
    {
     "id": "D-004",
     "type": "decision",
     "statement": "`none` giữ nguyên kích thước ô.",
     "question": "Shape `none` có thu nhỏ ô icon không?",
     "selected_value": "Giữ width/height, chỉ bỏ nền.",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Đổi shape không làm xê dịch title/message bên cạnh.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-007",
      "AC-007"
     ],
     "task_refs": [
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ]
    },
    {
     "id": "D-005",
     "type": "decision",
     "statement": "Phạm vi chỉ gồm năm ô icon trang trí.",
     "question": "Component nào nhận option?",
     "selected_value": "sd-section header, sd-inform, sd-data-state, toast của notify, dialog confirm.",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "User giới hạn ở icon hiển thị kiểu sd-icon tile; không đụng sd-button.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006",
      "INV-001"
     ],
     "task_refs": [
      "TASK-009"
     ]
    },
    {
     "id": "D-006",
     "type": "decision",
     "statement": "Mọi tiêu chí kiểm chứng tự động; xem showcase bằng mắt là UAT tuỳ chọn ngoài gate.",
     "question": "Kiểm chứng giao diện thế nào?",
     "selected_value": "Karma + getComputedStyle; manual_criteria_count = 0.",
     "source": "approved-spec",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Delivery convergence không nhận evidence thủ công.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "AC-007",
      "AC-008"
     ],
     "task_refs": [
      "TASK-009"
     ]
    },
    {
     "id": "D-007",
     "type": "decision",
     "statement": "Mỗi consumer tự resolve shape bằng `iconShape ?? SD_ICON_CONFIGURATION.defaultShape`; không thêm helper, directive hay component dùng chung.",
     "question": "Logic chọn shape đặt ở đâu?",
     "selected_value": "Inline trong từng component; `resolveSdIconConfig` là nơi duy nhất giữ giá trị mặc định `square`.",
     "source": "approved-spec",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Biểu thức một dòng; helper dùng chung từ entrypoint icon sẽ thành public API thừa.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-001",
      "AC-001",
      "INV-005"
     ],
     "task_refs": [
      "TASK-001"
     ]
    },
    {
     "id": "D-008",
     "type": "decision",
     "statement": "Hợp đồng DOM/CSS: ô icon mang `data-icon-shape=\"square|circle|none\"`; SCSS chọn theo attribute; radius `square` đọc `--sd-icon-shape-radius`.",
     "question": "Giao diện từng shape gắn vào DOM thế nào?",
     "selected_value": "Attribute `data-icon-shape` trên ô icon; rule gốc là `square`, override cho `circle` và `none`. Rule shape đặt sau rule tone/state và có specificity không thấp hơn rule tone/state mạnh nhất của cùng ô, để `none` luôn trong suốt ở mọi tone/state.",
     "source": "approved-spec",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Một hook ổn định cho test, SCSS và consumer muốn chỉnh thêm; không đổi class sẵn có.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-007",
      "AC-007",
      "INV-006"
     ],
     "task_refs": [
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ]
    },
    {
     "id": "D-009",
     "type": "decision",
     "statement": "Notify và confirm chuyển nguyên `iconShape` của option vào `ToastData`/`DialogData`; toast và dialog tự resolve với `SD_ICON_CONFIGURATION`.",
     "question": "Service hay component resolve shape cho toast và dialog?",
     "selected_value": "Component resolve; service chỉ chuyển option. Nhánh buffer dùng option của lời gọi cuối (luật hiện có của `title`/`duration`); lời gọi cuối không có `iconShape` thì dùng app default.",
     "source": "approved-spec",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Service không cần inject cấu hình icon; luật resolve giống ba component còn lại.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-005",
      "R-006",
      "AC-005",
      "AC-006"
     ],
     "task_refs": [
      "TASK-005",
      "TASK-006"
     ]
    },
    {
     "id": "D-010",
     "type": "decision",
     "statement": "Ranh giới kiểm chứng của validation map là `none`.",
     "question": "Ranh giới kiểm chứng của validation map?",
     "selected_value": "kind none — thay đổi chỉ là UI thư viện, không xác thực người dùng, không gọi HTTP; mọi AC chứng minh bằng Karma, script repo hoặc lệnh ghi nguyên văn trong plan; không có bằng chứng thủ công (D-006).",
     "source": "approved-plan",
     "status": "proposed",
     "blocking": false,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Không có ranh giới phân quyền nên không cần bằng chứng từ chối ở API.",
     "supersedes": null,
     "revisit_condition": "Khi thay đổi đụng tới xác thực, quyền hoặc dữ liệu phía server.",
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-001",
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006",
      "R-007",
      "R-008",
      "AC-001",
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006",
      "AC-007",
      "AC-008",
      "INV-001",
      "INV-002",
      "INV-003",
      "INV-004",
      "INV-005",
      "INV-006"
     ],
     "task_refs": [
      "TASK-009"
     ],
     "validation_boundary": {
      "kind": "none",
      "source_refs": [
       "R-001",
       "R-002",
       "R-003",
       "R-004",
       "R-005",
       "R-006",
       "R-007",
       "R-008",
       "AC-001",
       "AC-002",
       "AC-003",
       "AC-004",
       "AC-005",
       "AC-006",
       "AC-007",
       "AC-008",
       "INV-001",
       "INV-002",
       "INV-003",
       "INV-004",
       "INV-005",
       "INV-006"
      ]
     }
    },
    {
     "id": "INV-001",
     "type": "invariant",
     "statement": "Không đổi `sd-button`, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer, home-page demo, autoid-inspector.",
     "protected_refs": [
      "R-007",
      "D-005"
     ],
     "task_refs": [
      "TASK-007",
      "TASK-009"
     ],
     "evidence_refs": [
      "EVIDENCE-007",
      "EVIDENCE-009"
     ]
    },
    {
     "id": "INV-002",
     "type": "invariant",
     "statement": "`circle` render giống hệt giao diện trước thay đổi (radius 50%, cùng màu nền).",
     "protected_refs": [
      "R-007",
      "AC-007"
     ],
     "task_refs": [
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ],
     "evidence_refs": [
      "EVIDENCE-002",
      "EVIDENCE-003",
      "EVIDENCE-004",
      "EVIDENCE-005",
      "EVIDENCE-006"
     ]
    },
    {
     "id": "INV-003",
     "type": "invariant",
     "statement": "API cũ tương thích ngược: không input/option nào bị đổi tên hay xoá; code không truyền `iconShape` vẫn compile.",
     "protected_refs": [
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006",
      "A-001"
     ],
     "task_refs": [
      "TASK-008",
      "TASK-009"
     ],
     "evidence_refs": [
      "EVIDENCE-008",
      "EVIDENCE-009"
     ]
    },
    {
     "id": "INV-004",
     "type": "invariant",
     "statement": "v20/v21/v22 chỉ thay đổi qua `npm run sync`; `npm run check:sync` xanh.",
     "protected_refs": [
      "R-008",
      "AC-008"
     ],
     "task_refs": [
      "TASK-009"
     ],
     "evidence_refs": [
      "EVIDENCE-009"
     ]
    },
    {
     "id": "INV-005",
     "type": "invariant",
     "statement": "Chỉ `resolveSdIconConfig` định nghĩa mặc định `square`; không consumer nào hardcode shape mặc định, và thứ tự ưu tiên luôn là instance > `SD_ICON_CONFIGURATION.defaultShape`.",
     "protected_refs": [
      "R-001",
      "AC-001",
      "D-003",
      "D-007"
     ],
     "task_refs": [
      "TASK-001",
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ],
     "evidence_refs": [
      "EVIDENCE-001",
      "EVIDENCE-002",
      "EVIDENCE-003",
      "EVIDENCE-004",
      "EVIDENCE-005",
      "EVIDENCE-006"
     ]
    },
    {
     "id": "INV-006",
     "type": "invariant",
     "statement": "Mọi ô icon trong phạm vi luôn có `data-icon-shape` với đúng một trong ba giá trị `square`, `circle`, `none`.",
     "protected_refs": [
      "R-007",
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006",
      "D-008"
     ],
     "task_refs": [
      "TASK-002",
      "TASK-003",
      "TASK-004",
      "TASK-005",
      "TASK-006"
     ],
     "evidence_refs": [
      "EVIDENCE-002",
      "EVIDENCE-003",
      "EVIDENCE-004",
      "EVIDENCE-005",
      "EVIDENCE-006"
     ]
    }
   ],
   "history": [
    {
     "revision": 1,
     "active": [
      {
       "id": "R-001",
       "type": "requirement"
      },
      {
       "id": "R-002",
       "type": "requirement"
      },
      {
       "id": "R-003",
       "type": "requirement"
      },
      {
       "id": "R-004",
       "type": "requirement"
      },
      {
       "id": "R-005",
       "type": "requirement"
      },
      {
       "id": "R-006",
       "type": "requirement"
      },
      {
       "id": "R-007",
       "type": "requirement"
      },
      {
       "id": "R-008",
       "type": "requirement"
      },
      {
       "id": "AC-001",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-002",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-003",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-004",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-005",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-006",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-007",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-008",
       "type": "acceptance-criterion"
      },
      {
       "id": "A-001",
       "type": "assumption"
      },
      {
       "id": "A-002",
       "type": "assumption"
      },
      {
       "id": "D-001",
       "type": "decision"
      },
      {
       "id": "D-002",
       "type": "decision"
      },
      {
       "id": "D-003",
       "type": "decision"
      },
      {
       "id": "D-004",
       "type": "decision"
      },
      {
       "id": "D-005",
       "type": "decision"
      },
      {
       "id": "D-006",
       "type": "decision"
      },
      {
       "id": "INV-001",
       "type": "invariant"
      },
      {
       "id": "INV-002",
       "type": "invariant"
      },
      {
       "id": "INV-003",
       "type": "invariant"
      },
      {
       "id": "INV-004",
       "type": "invariant"
      }
     ],
     "tombstones": []
    },
    {
     "revision": 2,
     "active": [
      {
       "id": "R-001",
       "type": "requirement"
      },
      {
       "id": "R-002",
       "type": "requirement"
      },
      {
       "id": "R-003",
       "type": "requirement"
      },
      {
       "id": "R-004",
       "type": "requirement"
      },
      {
       "id": "R-005",
       "type": "requirement"
      },
      {
       "id": "R-006",
       "type": "requirement"
      },
      {
       "id": "R-007",
       "type": "requirement"
      },
      {
       "id": "R-008",
       "type": "requirement"
      },
      {
       "id": "AC-001",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-002",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-003",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-004",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-005",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-006",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-007",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-008",
       "type": "acceptance-criterion"
      },
      {
       "id": "A-001",
       "type": "assumption"
      },
      {
       "id": "A-002",
       "type": "assumption"
      },
      {
       "id": "D-001",
       "type": "decision"
      },
      {
       "id": "D-002",
       "type": "decision"
      },
      {
       "id": "D-003",
       "type": "decision"
      },
      {
       "id": "D-004",
       "type": "decision"
      },
      {
       "id": "D-005",
       "type": "decision"
      },
      {
       "id": "D-006",
       "type": "decision"
      },
      {
       "id": "D-007",
       "type": "decision"
      },
      {
       "id": "D-008",
       "type": "decision"
      },
      {
       "id": "D-009",
       "type": "decision"
      },
      {
       "id": "INV-001",
       "type": "invariant"
      },
      {
       "id": "INV-002",
       "type": "invariant"
      },
      {
       "id": "INV-003",
       "type": "invariant"
      },
      {
       "id": "INV-004",
       "type": "invariant"
      },
      {
       "id": "INV-005",
       "type": "invariant"
      },
      {
       "id": "INV-006",
       "type": "invariant"
      }
     ],
     "tombstones": []
    },
    {
     "revision": 3,
     "active": [
      {
       "id": "R-001",
       "type": "requirement"
      },
      {
       "id": "R-002",
       "type": "requirement"
      },
      {
       "id": "R-003",
       "type": "requirement"
      },
      {
       "id": "R-004",
       "type": "requirement"
      },
      {
       "id": "R-005",
       "type": "requirement"
      },
      {
       "id": "R-006",
       "type": "requirement"
      },
      {
       "id": "R-007",
       "type": "requirement"
      },
      {
       "id": "R-008",
       "type": "requirement"
      },
      {
       "id": "AC-001",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-002",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-003",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-004",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-005",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-006",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-007",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-008",
       "type": "acceptance-criterion"
      },
      {
       "id": "A-001",
       "type": "assumption"
      },
      {
       "id": "A-002",
       "type": "assumption"
      },
      {
       "id": "D-001",
       "type": "decision"
      },
      {
       "id": "D-002",
       "type": "decision"
      },
      {
       "id": "D-003",
       "type": "decision"
      },
      {
       "id": "D-004",
       "type": "decision"
      },
      {
       "id": "D-005",
       "type": "decision"
      },
      {
       "id": "D-006",
       "type": "decision"
      },
      {
       "id": "D-007",
       "type": "decision"
      },
      {
       "id": "D-008",
       "type": "decision"
      },
      {
       "id": "D-009",
       "type": "decision"
      },
      {
       "id": "D-010",
       "type": "decision"
      },
      {
       "id": "INV-001",
       "type": "invariant"
      },
      {
       "id": "INV-002",
       "type": "invariant"
      },
      {
       "id": "INV-003",
       "type": "invariant"
      },
      {
       "id": "INV-004",
       "type": "invariant"
      },
      {
       "id": "INV-005",
       "type": "invariant"
      },
      {
       "id": "INV-006",
       "type": "invariant"
      }
     ],
     "tombstones": []
    },
    {
     "revision": 4,
     "active": [
      {
       "id": "R-001",
       "type": "requirement"
      },
      {
       "id": "R-002",
       "type": "requirement"
      },
      {
       "id": "R-003",
       "type": "requirement"
      },
      {
       "id": "R-004",
       "type": "requirement"
      },
      {
       "id": "R-005",
       "type": "requirement"
      },
      {
       "id": "R-006",
       "type": "requirement"
      },
      {
       "id": "R-007",
       "type": "requirement"
      },
      {
       "id": "R-008",
       "type": "requirement"
      },
      {
       "id": "AC-001",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-002",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-003",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-004",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-005",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-006",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-007",
       "type": "acceptance-criterion"
      },
      {
       "id": "AC-008",
       "type": "acceptance-criterion"
      },
      {
       "id": "A-001",
       "type": "assumption"
      },
      {
       "id": "A-002",
       "type": "assumption"
      },
      {
       "id": "D-001",
       "type": "decision"
      },
      {
       "id": "D-002",
       "type": "decision"
      },
      {
       "id": "D-003",
       "type": "decision"
      },
      {
       "id": "D-004",
       "type": "decision"
      },
      {
       "id": "D-005",
       "type": "decision"
      },
      {
       "id": "D-006",
       "type": "decision"
      },
      {
       "id": "D-007",
       "type": "decision"
      },
      {
       "id": "D-008",
       "type": "decision"
      },
      {
       "id": "D-009",
       "type": "decision"
      },
      {
       "id": "D-010",
       "type": "decision"
      },
      {
       "id": "INV-001",
       "type": "invariant"
      },
      {
       "id": "INV-002",
       "type": "invariant"
      },
      {
       "id": "INV-003",
       "type": "invariant"
      },
      {
       "id": "INV-004",
       "type": "invariant"
      },
      {
       "id": "INV-005",
       "type": "invariant"
      },
      {
       "id": "INV-006",
       "type": "invariant"
      }
     ],
     "tombstones": []
    }
   ]
  },
  "goals": [
   {
    "id": "G-001",
    "statement": "Ô icon của năm consumer mặc định vuông bo 8px, chọn được square/circle/none theo instance hoặc app.",
    "task_refs": [
     "TASK-001",
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ]
   },
   {
    "id": "G-002",
    "statement": "Tài liệu, changelog, showcase và rollout v20–v22 phản ánh option mới; release guard xanh.",
    "task_refs": [
     "TASK-007",
     "TASK-008",
     "TASK-009"
    ]
   }
  ],
  "tasks": [
   {
    "id": "TASK-001",
    "title": "Cấu hình icon: SdIconShape + defaultShape (TDD)",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-001",
      "record_refs": [
       "R-001",
       "AC-001",
       "D-001",
       "D-002",
       "D-003",
       "D-007",
       "INV-005"
      ]
     }
    ],
    "justification_refs": [
     "R-001",
     "D-001",
     "D-002",
     "D-003",
     "D-007"
    ],
    "enforces_invariant_refs": [
     "INV-005"
    ]
   },
   {
    "id": "TASK-002",
    "title": "sd-section: input iconShape + SCSS shape (TDD)",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-002",
      "record_refs": [
       "R-002",
       "R-007",
       "AC-002",
       "AC-007",
       "D-004",
       "D-008",
       "INV-002",
       "INV-005",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-002",
     "R-007",
     "D-004",
     "D-008"
    ],
    "enforces_invariant_refs": [
     "INV-002",
     "INV-005",
     "INV-006"
    ]
   },
   {
    "id": "TASK-003",
    "title": "sd-inform: input iconShape + SCSS shape, tip giữ trong suốt (TDD)",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-003",
      "record_refs": [
       "R-003",
       "R-007",
       "AC-003",
       "AC-007",
       "D-004",
       "D-008",
       "INV-002",
       "INV-005",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-003",
     "R-007",
     "D-004",
     "D-008"
    ],
    "enforces_invariant_refs": [
     "INV-002",
     "INV-005",
     "INV-006"
    ]
   },
   {
    "id": "TASK-004",
    "title": "sd-data-state: input iconShape + SCSS shape thắng rule state (TDD)",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-004",
      "record_refs": [
       "R-004",
       "R-007",
       "AC-004",
       "AC-007",
       "D-004",
       "D-008",
       "INV-002",
       "INV-005",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-004",
     "R-007",
     "D-004",
     "D-008"
    ],
    "enforces_invariant_refs": [
     "INV-002",
     "INV-005",
     "INV-006"
    ]
   },
   {
    "id": "TASK-005",
    "title": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-005",
      "record_refs": [
       "R-005",
       "R-007",
       "AC-005",
       "AC-007",
       "A-002",
       "D-004",
       "D-008",
       "D-009",
       "INV-002",
       "INV-005",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-005",
     "R-007",
     "D-008",
     "D-009"
    ],
    "enforces_invariant_refs": [
     "INV-002",
     "INV-005",
     "INV-006"
    ]
   },
   {
    "id": "TASK-006",
    "title": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-006",
      "record_refs": [
       "R-006",
       "R-007",
       "AC-006",
       "AC-007",
       "D-004",
       "D-008",
       "D-009",
       "INV-002",
       "INV-005",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-006",
     "R-007",
     "D-008",
     "D-009"
    ],
    "enforces_invariant_refs": [
     "INV-002",
     "INV-005",
     "INV-006"
    ]
   },
   {
    "id": "TASK-007",
    "title": "Tài liệu sáu component/service + CHANGELOG [Unreleased]",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v19/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v19/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v19/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v19/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "CHANGELOG.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-007",
      "record_refs": [
       "R-008",
       "AC-008",
       "A-001",
       "INV-001"
      ]
     }
    ],
    "justification_refs": [
     "R-008",
     "D-001"
    ],
    "enforces_invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "TASK-008",
    "title": "Showcase: demo ba shape ở năm trang + sinh lại example sources",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-007"
    ],
    "planned_paths": [
     "showcase/src/app/pages/components/section/section-demo.component.ts",
     "showcase/src/app/pages/components/inform/inform-demo.component.ts",
     "showcase/src/app/pages/components/data-state/data-state-demo.component.ts",
     "showcase/src/app/pages/services/notify/notify-demo.component.ts",
     "showcase/src/app/pages/services/confirm/confirm-demo.component.ts",
     "showcase/src/app/docs/generated/example-sources.generated.ts",
     "showcase/src/app/docs/generated/example-manifest.generated.ts",
     "showcase/src/app/docs/core/documentation.registry.ts",
     "showcase/src/app/docs/core/documentation.registry.spec.ts",
     "showcase/src/app/pages/components/data-state/data-state-demo.component.spec.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-008",
      "record_refs": [
       "R-008",
       "AC-008",
       "INV-003"
      ]
     }
    ],
    "justification_refs": [
     "R-008"
    ],
    "enforces_invariant_refs": [
     "INV-003"
    ]
   },
   {
    "id": "TASK-009",
    "title": "Rollout v19 → v20/v21/v22 bằng npm run sync, kiểm chứng cuối",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-008"
    ],
    "planned_paths": [
     "versions/v19/SYNC-STATUS.md",
     "versions/v20/SYNC-STATUS.md",
     "versions/v20/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v20/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v20/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v20/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v21/SYNC-STATUS.md",
     "versions/v21/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v21/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v21/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v21/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v22/SYNC-STATUS.md",
     "versions/v22/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v22/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v22/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v22/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-009",
      "record_refs": [
       "R-008",
       "AC-008",
       "D-005",
       "D-006",
       "INV-001",
       "INV-003",
       "INV-004"
      ]
     }
    ],
    "justification_refs": [
     "R-008",
     "D-005",
     "D-006"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-003",
     "INV-004"
    ]
   }
  ],
  "repository_inventory": {
   "repositories": [
    {
     "repository_id": "sdcorejs-angular",
     "existing_paths": [
      "CHANGELOG.md",
      "showcase/src/app/docs/core/documentation.registry.spec.ts",
      "showcase/src/app/docs/core/documentation.registry.ts",
      "showcase/src/app/docs/generated/example-manifest.generated.ts",
      "showcase/src/app/docs/generated/example-sources.generated.ts",
      "showcase/src/app/pages/components/data-state/data-state-demo.component.spec.ts",
      "showcase/src/app/pages/components/data-state/data-state-demo.component.ts",
      "showcase/src/app/pages/components/inform/inform-demo.component.ts",
      "showcase/src/app/pages/components/section/section-demo.component.ts",
      "showcase/src/app/pages/services/confirm/confirm-demo.component.ts",
      "showcase/src/app/pages/services/notify/notify-demo.component.ts",
      "versions/v19/SYNC-STATUS.md",
      "versions/v19/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
      "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
      "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/inform/sd-inform.md",
      "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.html",
      "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/section/sd-section.md",
      "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html",
      "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts",
      "versions/v19/projects/sdcorejs-angular/modules/icon/sd-icon.md",
      "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
      "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
      "versions/v19/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
      "versions/v20/SYNC-STATUS.md",
      "versions/v20/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
      "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
      "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
      "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
      "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
      "versions/v20/projects/sdcorejs-angular/components/inform/sd-inform.md",
      "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.html",
      "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
      "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
      "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
      "versions/v20/projects/sdcorejs-angular/components/section/sd-section.md",
      "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.html",
      "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.scss",
      "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
      "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.ts",
      "versions/v20/projects/sdcorejs-angular/modules/icon/sd-icon.md",
      "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
      "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
      "versions/v20/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
      "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
      "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
      "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
      "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
      "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
      "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
      "versions/v20/projects/sdcorejs-angular/services/notify/sd-notify.md",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
      "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
      "versions/v21/SYNC-STATUS.md",
      "versions/v21/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
      "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
      "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
      "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
      "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
      "versions/v21/projects/sdcorejs-angular/components/inform/sd-inform.md",
      "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.html",
      "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
      "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
      "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
      "versions/v21/projects/sdcorejs-angular/components/section/sd-section.md",
      "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.html",
      "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.scss",
      "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
      "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.ts",
      "versions/v21/projects/sdcorejs-angular/modules/icon/sd-icon.md",
      "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
      "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
      "versions/v21/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
      "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
      "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
      "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
      "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
      "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
      "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
      "versions/v21/projects/sdcorejs-angular/services/notify/sd-notify.md",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
      "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
      "versions/v22/SYNC-STATUS.md",
      "versions/v22/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
      "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
      "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
      "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
      "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
      "versions/v22/projects/sdcorejs-angular/components/inform/sd-inform.md",
      "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.html",
      "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
      "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
      "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
      "versions/v22/projects/sdcorejs-angular/components/section/sd-section.md",
      "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.html",
      "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.scss",
      "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
      "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.ts",
      "versions/v22/projects/sdcorejs-angular/modules/icon/sd-icon.md",
      "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
      "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
      "versions/v22/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
      "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
      "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
      "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
      "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
      "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
      "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
      "versions/v22/projects/sdcorejs-angular/services/notify/sd-notify.md",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
      "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.ts"
     ],
     "intended_new_paths": [
      {
       "path": "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
       "owner_task_id": "TASK-001"
      },
      {
       "path": "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
       "owner_task_id": "TASK-009"
      },
      {
       "path": "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
       "owner_task_id": "TASK-009"
      },
      {
       "path": "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
       "owner_task_id": "TASK-009"
      }
     ]
    }
   ]
  },
  "critique_history": [
   {
    "round": 1,
    "checker_version": "sdcorejs-plan:goal-backward:v1",
    "blockers": [],
    "resolved_blockers": [],
    "unresolved_blockers": []
   }
  ]
 },
 "validation_map": [
  {
   "requirement_id": "R-001",
   "acceptance_criterion_id": "AC-001",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "Mặc định shape sai hoặc provider không đổi được mặc định.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac001-resolve-default-shape"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/modules/icon/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "resolveSdIconConfig và SD_ICON_CONFIGURATION trả square; truyền circle trả circle.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-001",
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-002",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "Header section không theo thứ tự ưu tiên shape.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac002-section-shape-precedence"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/section/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "data-icon-shape = square / circle / none theo ba trường hợp.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-008",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-002",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-006"
   ],
   "risk": "Header section không theo thứ tự ưu tiên shape.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac002-section-shape-precedence-r-007"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/section/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "data-icon-shape = square / circle / none theo ba trường hợp.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-003",
   "acceptance_criterion_id": "AC-003",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "Inform không theo ưu tiên hoặc tip có nền.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac003-inform-shape-precedence",
    "case-ac003-inform-tip-transparent"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/inform/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "data-icon-shape theo ba trường hợp; tip có nền trong suốt.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-008",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-003",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-006"
   ],
   "risk": "Inform không theo ưu tiên hoặc tip có nền.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac003-inform-shape-precedence-r-007",
    "case-ac003-inform-tip-transparent-r-007"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/inform/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "data-icon-shape theo ba trường hợp; tip có nền trong suốt.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-004",
   "acceptance_criterion_id": "AC-004",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "Data-state không theo ưu tiên ở layout thường hoặc compact.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac004-data-state-shape-precedence"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/data-state/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "data-icon-shape theo ba trường hợp ở cả hai layout.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-008",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-004",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-006"
   ],
   "risk": "Data-state không theo ưu tiên ở layout thường hoặc compact.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac004-data-state-shape-precedence-r-007"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/data-state/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "data-icon-shape theo ba trường hợp ở cả hai layout.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-005",
   "acceptance_criterion_id": "AC-005",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "Toast mất iconShape, nhất là qua buffer.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac005-toast-shape-option",
    "case-ac005-toast-shape-buffered"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/notify/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "circle / square / none cho success option, info mặc định, error qua buffer.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-008",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-005",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-006"
   ],
   "risk": "Toast mất iconShape, nhất là qua buffer.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac005-toast-shape-option-r-007",
    "case-ac005-toast-shape-buffered-r-007"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/notify/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "circle / square / none cho success option, info mặc định, error qua buffer.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-006",
   "acceptance_criterion_id": "AC-006",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "Một method confirm không chuyển iconShape.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac006-confirm-shape-all-methods",
    "case-ac006-dialog-shape-default"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/confirm/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Sáu method chuyển iconShape; dialog có data-icon-shape circle khi truyền, square khi không.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-008",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-006",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-006"
   ],
   "risk": "Một method confirm không chuyển iconShape.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac006-confirm-shape-all-methods-r-007",
    "case-ac006-dialog-shape-default-r-007"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/confirm/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Sáu method chuyển iconShape; dialog có data-icon-shape circle khi truyền, square khi không.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-007",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-006"
   ],
   "risk": "`none` thua specificity của rule tone/state, hoặc `circle` lệch giao diện cũ.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac007-section-geometry",
    "case-ac007-inform-geometry",
    "case-ac007-data-state-geometry",
    "case-ac007-toast-geometry",
    "case-ac007-confirm-geometry"
   ],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/section/**/*.spec.ts\" --include=\"**/components/inform/**/*.spec.ts\" --include=\"**/components/data-state/**/*.spec.ts\" --include=\"**/services/notify/**/*.spec.ts\" --include=\"**/services/confirm/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "getComputedStyle: square 8px (4px khi đặt token), circle 50%, none trong suốt cùng kích thước ở mọi tone/state.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-008",
   "invariant_refs": [
    "INV-004"
   ],
   "risk": "Doc/changelog thiếu, rollout lệch, hoặc diff chạm file ngoài phạm vi.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-010",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006"
    ]
   },
   "authorization_boundary": false,
   "levels": [
    "unit",
    "component"
   ],
   "case_ids": [
    "case-ac008-check-sync",
    "case-ac008-docs-changelog-grep",
    "case-ac008-showcase-build",
    "case-ac008-diff-scope"
   ],
   "planned_command": "npm run check:sync",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "check:sync exit 0; grep doc/CHANGELOG khớp; build lib + showcase exit 0; git diff --name-only nằm trong allowed_paths.",
   "status": "covered",
   "evidence_refs": [
    "EVIDENCE-009"
   ],
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  }
 ],
 "contract_id": "icon-shape-option",
 "requirement_id": "icon-shape-option",
 "approved_spec_path": ".sdcorejs/specs/angular/2026-10-01-15-39-icon-shape-option.md",
 "approved_spec_hash": "sha256:v1:4cab2660432a0991011bca189113a28dc10ed796c29f63b380faed7e1dc140ef",
 "approved_spec_reference": {
  "immutable_identity": {
   "repository_id": "sdcorejs-angular",
   "repository_relative_path": ".sdcorejs/specs/angular/2026-10-01-15-39-icon-shape-option.md",
   "artifact_id": "spec-icon-shape-option-r1",
   "revision": "23857013381215b07f497842427e03477365536d",
   "approval_hash": "sha256:v1:4cab2660432a0991011bca189113a28dc10ed796c29f63b380faed7e1dc140ef"
  }
 },
 "approved_architecture_path": ".sdcorejs/architecture/angular/2026-10-01-16-44-icon-shape-option.md",
 "approved_architecture_hash": "sha256:v1:2ae8f0d6d65f5a34b62b776d1cd5f1e880d917c0fe642a0fd97084b746cf5555",
 "approved_architecture_reference": {
  "immutable_identity": {
   "repository_id": "sdcorejs-angular",
   "repository_relative_path": ".sdcorejs/architecture/angular/2026-10-01-16-44-icon-shape-option.md",
   "artifact_id": "architecture-icon-shape-option-r2",
   "revision": "23857013381215b07f497842427e03477365536d",
   "approval_hash": "sha256:v1:2ae8f0d6d65f5a34b62b776d1cd5f1e880d917c0fe642a0fd97084b746cf5555"
  }
 },
 "approved_plan_path": "",
 "approved_plan_hash": "",
 "supersedes": ".sdcorejs/plans/angular/2026-10-01-18-04-icon-shape-option.md",
 "target_root": ".",
 "target_root_kind": "target-project",
 "owner_repository_id": "sdcorejs-angular",
 "owner_repository_role": "library",
 "owner_module_id": null,
 "execution_host_repository_id": "sdcorejs-angular",
 "integration_owner_repository_id": "sdcorejs-angular",
 "dependency_order": [
  "modules/icon",
  "components/section",
  "components/inform",
  "components/data-state",
  "services/notify",
  "services/confirm",
  "docs",
  "showcase",
  "rollout"
 ],
 "gitlink_updates_in_scope": false,
 "track": "angular",
 "stack_profile": "core-ui-angular",
 "task_count": 9,
 "phase_count": 4,
 "allowed_paths": [
  "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
  "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
  "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
  "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html",
  "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.html",
  "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
  "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/icon/sd-icon.md",
  "versions/v19/projects/sdcorejs-angular/components/section/sd-section.md",
  "versions/v19/projects/sdcorejs-angular/components/inform/sd-inform.md",
  "versions/v19/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
  "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
  "versions/v19/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
  "CHANGELOG.md",
  "showcase/src/app/pages/components/section/section-demo.component.ts",
  "showcase/src/app/pages/components/inform/inform-demo.component.ts",
  "showcase/src/app/pages/components/data-state/data-state-demo.component.ts",
  "showcase/src/app/pages/services/notify/notify-demo.component.ts",
  "showcase/src/app/pages/services/confirm/confirm-demo.component.ts",
  "showcase/src/app/docs/generated/example-sources.generated.ts",
  "showcase/src/app/docs/generated/example-manifest.generated.ts",
  "showcase/src/app/docs/core/documentation.registry.ts",
  "showcase/src/app/docs/core/documentation.registry.spec.ts",
  "showcase/src/app/pages/components/data-state/data-state-demo.component.spec.ts",
  "versions/v19/SYNC-STATUS.md",
  "versions/v20/SYNC-STATUS.md",
  "versions/v20/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
  "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
  "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
  "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
  "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
  "versions/v20/projects/sdcorejs-angular/components/inform/sd-inform.md",
  "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.html",
  "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
  "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
  "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
  "versions/v20/projects/sdcorejs-angular/components/section/sd-section.md",
  "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.html",
  "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.scss",
  "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
  "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.ts",
  "versions/v20/projects/sdcorejs-angular/modules/icon/sd-icon.md",
  "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
  "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
  "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
  "versions/v20/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
  "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
  "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
  "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
  "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
  "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
  "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
  "versions/v20/projects/sdcorejs-angular/services/notify/sd-notify.md",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
  "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
  "versions/v21/SYNC-STATUS.md",
  "versions/v21/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
  "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
  "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
  "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
  "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
  "versions/v21/projects/sdcorejs-angular/components/inform/sd-inform.md",
  "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.html",
  "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
  "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
  "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
  "versions/v21/projects/sdcorejs-angular/components/section/sd-section.md",
  "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.html",
  "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.scss",
  "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
  "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.ts",
  "versions/v21/projects/sdcorejs-angular/modules/icon/sd-icon.md",
  "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
  "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
  "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
  "versions/v21/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
  "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
  "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
  "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
  "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
  "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
  "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
  "versions/v21/projects/sdcorejs-angular/services/notify/sd-notify.md",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
  "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
  "versions/v22/SYNC-STATUS.md",
  "versions/v22/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
  "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
  "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
  "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
  "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
  "versions/v22/projects/sdcorejs-angular/components/inform/sd-inform.md",
  "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.html",
  "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
  "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
  "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
  "versions/v22/projects/sdcorejs-angular/components/section/sd-section.md",
  "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.html",
  "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.scss",
  "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
  "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.ts",
  "versions/v22/projects/sdcorejs-angular/modules/icon/sd-icon.md",
  "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
  "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
  "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
  "versions/v22/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
  "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
  "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
  "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
  "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
  "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
  "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
  "versions/v22/projects/sdcorejs-angular/services/notify/sd-notify.md",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
  "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
  "versions/v20/**",
  "versions/v21/**",
  "versions/v22/**",
  ".sdcorejs/docs/angular/2026-10-01-23-16-icon-shape-option-plan.md",
  ".sdcorejs/plans/angular/*-icon-shape-option.md"
 ],
 "prohibited_paths": [
  "**/package.json",
  "**/package-lock.json",
  ".github/**",
  "scripts/**",
  "published-pages/**",
  "published-docs/**",
  "README.md",
  "README.npm.md",
  "product/**",
  "design/**",
  "docs/**",
  "**/.env*",
  "**/node_modules/**",
  "**/dist/**",
  ".sdcorejs/specs/**",
  ".sdcorejs/architecture/**",
  "versions/v19/projects/sdcorejs-angular/components/button/**",
  "versions/v19/projects/sdcorejs-angular/components/avatar/**",
  "versions/v19/projects/sdcorejs-angular/components/stepper/**",
  "versions/v19/projects/sdcorejs-angular/components/modal/**",
  "versions/v19/projects/sdcorejs-angular/components/side-drawer/**",
  "versions/v19/projects/sdcorejs-angular/components/tab-router/**",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/**",
  "versions/v19/projects/sdcorejs-angular/components/autoid-inspector/**",
  "versions/v19/projects/sdcorejs-angular/modules/layout/**"
 ],
 "write_rules": [
  "versions/v20/**, versions/v21/**, versions/v22/** chỉ đổi bằng `npm run sync`; v22 giữ LF (checkout lại file chỉ khác EOL).",
  "Mỗi task TDD: viết/sửa spec trước, chạy lệnh focused thấy đỏ, rồi mới sửa code cho xanh.",
  "Rule SCSS shape đặt sau rule tone/state và có specificity không thấp hơn rule mạnh nhất của cùng ô (D-008).",
  ".sdcorejs/specs/** và .sdcorejs/architecture/** là snapshot đã duyệt, bất biến."
 ],
 "generated_artifacts": [
  "showcase/src/app/docs/generated/example-sources.generated.ts",
  "showcase/src/app/docs/generated/example-manifest.generated.ts",
  "versions/v20/**",
  "versions/v21/**",
  "versions/v22/**",
  "versions/v19/SYNC-STATUS.md"
 ],
 "docs_artifacts": [
  "versions/v19/projects/sdcorejs-angular/modules/icon/sd-icon.md",
  "versions/v19/projects/sdcorejs-angular/components/section/sd-section.md",
  "versions/v19/projects/sdcorejs-angular/components/inform/sd-inform.md",
  "versions/v19/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
  "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
  "versions/v19/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
  "CHANGELOG.md"
 ],
 "dependency_changes": {
  "required": false,
  "packages": [],
  "approval_required": false
 },
 "env_changes": {
  "required": false,
  "files": [],
  "approval_required": false
 },
 "migration_changes": {
  "required": false,
  "description": null,
  "approval_required": false
 },
 "frontend_architecture": {
  "required": true,
  "conformance_invariant_refs": [
   "INV-005",
   "INV-006"
  ],
  "not_applicable_reason": null,
  "project_conventions": {
   "component_style": "Angular 19 standalone, OnPush, signal input()/computed(); ToastComponent còn @Input data thường.",
   "folder_convention": "Secondary entry point mỗi thư mục (components/*, services/*, modules/icon) có index.ts + ng-package.json; src/ chứa component, spec đặt cạnh.",
   "state_convention": "Signal input + computed trong component; không store.",
   "service_data_access_convention": "Không HTTP; cấu hình qua InjectionToken có factory providedIn root (SD_ICON_CONFIGURATION).",
   "registration_provider_convention": "provideSdIcon trả EnvironmentProviders; component-level override bằng { provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig(...) }.",
   "public_api_barrel_convention": "modules/icon/src/index.ts export * từ icon.model, nên SdIconShape tự public; không thêm barrel.",
   "test_convention": "Karma + Jasmine, TestBed, ChromeHeadlessCI; spec cạnh file; coverage threshold trong karma.conf.js.",
   "evidence_inspected": [
    "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
    "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
    "versions/v19/projects/sdcorejs-angular/modules/icon/src/index.ts",
    "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html",
    "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
    "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
    "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
    "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
    "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
    "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts"
   ]
  },
  "component_tree": [
   "sd-section → .sd-section-header-icon",
   "sd-inform → .c-inform-icon-tile",
   "sd-data-state → .sd-data-state__symbol",
   "ToastContainerComponent → ToastComponent → .sd-toast__icon",
   "MatDialog → DialogConfirmComponent → .sd-dialog-confirm__icon"
  ],
  "reuse_decisions": [
   {
    "need": "Mặc định toàn app",
    "candidate": "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts#resolveSdIconConfig",
    "decision": "extend",
    "reason": "Đã là nơi resolve defaultFontSet."
   },
   {
    "need": "Ô icon",
    "candidate": "phần tử tile sẵn có của từng component",
    "decision": "extend",
    "reason": "Thêm attribute, không thêm wrapper (D-007, D-008)."
   }
  ],
  "file_decisions": [
   {
    "path": "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
    "decision": "create",
    "symbols": [],
    "reason": "Cấu hình icon: SdIconShape + defaultShape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Cấu hình icon: SdIconShape + defaultShape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Cấu hình icon: SdIconShape + defaultShape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-section: input iconShape + SCSS shape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-section: input iconShape + SCSS shape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-section: input iconShape + SCSS shape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-section: input iconShape + SCSS shape (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-inform: input iconShape + SCSS shape, tip giữ trong suốt (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-inform: input iconShape + SCSS shape, tip giữ trong suốt (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.html",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-inform: input iconShape + SCSS shape, tip giữ trong suốt (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-inform: input iconShape + SCSS shape, tip giữ trong suốt (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-data-state: input iconShape + SCSS shape thắng rule state (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-data-state: input iconShape + SCSS shape thắng rule state (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-data-state: input iconShape + SCSS shape thắng rule state (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
    "decision": "edit",
    "symbols": [],
    "reason": "sd-data-state: input iconShape + SCSS shape thắng rule state (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
    "decision": "edit",
    "symbols": [],
    "reason": "Notify: NotifyOption.iconShape → ToastData → toast resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
    "decision": "edit",
    "symbols": [],
    "reason": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
    "decision": "edit",
    "symbols": [],
    "reason": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)"
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
    "decision": "edit",
    "symbols": [],
    "reason": "Confirm: iconShape trong option sáu method → DialogData → dialog resolve + SCSS (TDD)"
   }
  ],
  "state_owners": [
   {
    "symbol": "SD_ICON_CONFIGURATION.defaultShape",
    "state": "Shape mặc định toàn app"
   },
   {
    "symbol": "iconShape (input/option)",
    "state": "Shape từng instance"
   }
  ],
  "service_boundaries": [
   {
    "symbol": "SdNotifyService",
    "scope": "app"
   },
   {
    "symbol": "SdConfirmService",
    "scope": "app"
   },
   {
    "symbol": "resolveSdIconConfig",
    "scope": "pure_function"
   }
  ],
  "data_flow": [
   "option.iconShape → ToastData.iconShape → ToastComponent resolve → [attr.data-icon-shape]",
   "option.iconShape → DialogData.iconShape → DialogConfirmComponent resolve → [attr.data-icon-shape]",
   "input iconShape → computed resolve → [attr.data-icon-shape]"
  ],
  "declarations_and_registration": [
   {
    "symbol": "SdIconShape",
    "mechanism": "export type trong icon.model.ts"
   },
   {
    "symbol": "defaultShape",
    "mechanism": "field trong ISdIconConfiguration, resolve bởi resolveSdIconConfig"
   }
  ],
  "public_exports": [
   {
    "symbol": "SdIconShape",
    "reason": "C-001"
   },
   {
    "symbol": "none khác",
    "reason": "Input/option mới đi theo component/interface sẵn có (C-002, C-003)."
   }
  ],
  "remaining_contract": "Không thêm component, directive, service hay store. Mỗi consumer giữ markup tile hiện có, thêm [attr.data-icon-shape] và rule SCSS. Test ở spec sẵn có của từng component (trừ icon.provider.spec.ts mới)."
 },
 "agent_architecture": {
  "required": false,
  "conformance_invariant_refs": [],
  "not_applicable_reason": "Không phải track ai-agent.",
  "contract": null
 },
 "verification_strategy": {
  "package_manager": "npm",
  "package_manager_evidence": [
   "package-lock.json",
   "versions/v19/package-lock.json",
   "showcase/package-lock.json",
   "không có field packageManager"
  ],
  "runtime": "Node 22.22.3 qua fnm (`fnm exec --using=22.22.3 npm.cmd …`) cho install/build/test Angular; script root chạy bằng Node hệ thống.",
  "commands_planned": [
   {
    "command": "fnm exec --using=22.22.3 npm.cmd ci --legacy-peer-deps",
    "cwd": "versions/v19",
    "reason": "Worktree chưa có node_modules; cài đúng lockfile, không đổi manifest."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/modules/icon/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-001 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/section/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-002 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/section/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-002 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/inform/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-003 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/inform/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-003 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/data-state/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-004 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/data-state/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-004 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/notify/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-005 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/notify/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-005 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/confirm/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-006 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/services/confirm/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-006 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/components/section/**/*.spec.ts\" --include=\"**/components/inform/**/*.spec.ts\" --include=\"**/components/data-state/**/*.spec.ts\" --include=\"**/services/notify/**/*.spec.ts\" --include=\"**/services/confirm/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Spec focused cho AC-007 (RED trước khi sửa code, GREEN sau)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage",
    "cwd": "versions/v19",
    "reason": "Full suite v19 có coverage threshold (INV-003, release gate)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd run lint -- sdcorejs-angular",
    "cwd": "versions/v19",
    "reason": "ESLint (@angular-eslint) cho code đã sửa."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd run build",
    "cwd": "versions/v19",
    "reason": "Build lib cho showcase và kiểm public API compile (INV-003)."
   },
   {
    "command": "npm run generate:showcase-examples",
    "cwd": ".",
    "reason": "Sinh lại example-sources.generated.ts sau khi sửa demo."
   },
   {
    "command": "npm run test:showcase-examples",
    "cwd": ".",
    "reason": "Guard generator showcase (file sinh phải mới)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd ci --legacy-peer-deps",
    "cwd": "showcase",
    "reason": "Cài showcase trong worktree."
   },
   {
    "command": "npm run link:library",
    "cwd": "showcase",
    "reason": "Copy lib đã build vào showcase/node_modules trước khi test showcase."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- --include=src/app/docs/core/documentation.registry.spec.ts --include=src/app/pages/components/data-state/data-state-demo.component.spec.ts",
    "cwd": "showcase",
    "reason": "Registry demo counts và số demo-section của data-state (AC-008, INV-003)."
   },
   {
    "command": "fnm exec --using=22.22.3 npm.cmd run build",
    "cwd": "showcase",
    "reason": "prebuild chạy link:library; build exit 0 (AC-008, INV-003)."
   },
   {
    "command": "npm run sync",
    "cwd": ".",
    "reason": "Rollout v19 → v20/v21/v22 (INV-004)."
   },
   {
    "command": "npm run check:sync",
    "cwd": ".",
    "reason": "Release guard read-only (AC-008, INV-004)."
   },
   {
    "command": "git diff --name-only HEAD",
    "cwd": ".",
    "reason": "Mọi file đổi nằm trong allowed_paths (INV-001)."
   },
   {
    "command": "git grep -n \"iconShape\" -- \"versions/v19/projects/sdcorejs-angular/**/sd-*.md\" CHANGELOG.md",
    "cwd": ".",
    "reason": "Doc và CHANGELOG nhắc option mới (AC-008)."
   },
   {
    "command": "git grep -nE \"\\?\\? *'(square|circle|none)'\" -- \"versions/v19/projects/sdcorejs-angular/components/section\" \"versions/v19/projects/sdcorejs-angular/components/inform\" \"versions/v19/projects/sdcorejs-angular/components/data-state\" \"versions/v19/projects/sdcorejs-angular/services/notify\" \"versions/v19/projects/sdcorejs-angular/services/confirm\"",
    "cwd": ".",
    "reason": "Không có fallback shape hardcode trong consumer; phải không có kết quả (INV-005)."
   }
  ],
  "commands_skipped": [
   {
    "candidate": "npm run test:scripts",
    "reason": "Không đổi scripts/**; test:showcase-examples được chạy riêng."
   }
  ],
  "checks": "Focused Karma theo từng task (RED → GREEN), full suite v19 có coverage, build lib + showcase, generator showcase, sync + check:sync, git diff/grep scope."
 },
 "parallel_candidates": {
  "allowed": false,
  "contract": "Tuần tự: TASK-002…006 độc lập về file nhưng dùng chung node_modules, Karma và CPU máy dev (đã từng quá tải); làm nối tiếp.",
  "shared_files": [
   {
    "path": "CHANGELOG.md",
    "owner": "TASK-007",
    "strategy": "chỉ mục [Unreleased]"
   },
   {
    "path": "versions/v20|v21|v22/**",
    "owner": "TASK-009",
    "strategy": "chỉ qua npm run sync"
   },
   {
    "path": "showcase/src/app/docs/generated/example-*.generated.ts",
    "owner": "TASK-008",
    "strategy": "chỉ qua npm run generate:showcase-examples"
   }
  ]
 },
 "repository_plan": {
  "schema_version": 1,
  "integration_owner_repository_id": "sdcorejs-angular",
  "dependency_order": [
   "library"
  ],
  "gitlink_updates_in_scope": false,
  "repositories": [
   {
    "repository_id": "sdcorejs-angular",
    "role": "library",
    "module_id": null,
    "available": true,
    "writable": true
   }
  ],
  "steps": [
   {
    "id": "TASK-001",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts"
    ]
   },
   {
    "id": "TASK-002",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss"
    ]
   },
   {
    "id": "TASK-003",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss"
    ]
   },
   {
    "id": "TASK-004",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss"
    ]
   },
   {
    "id": "TASK-005",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss"
    ]
   },
   {
    "id": "TASK-006",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss"
    ]
   },
   {
    "id": "TASK-007",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v19/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v19/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v19/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v19/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "CHANGELOG.md"
    ]
   },
   {
    "id": "TASK-008",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "showcase/src/app/pages/components/section/section-demo.component.ts",
     "showcase/src/app/pages/components/inform/inform-demo.component.ts",
     "showcase/src/app/pages/components/data-state/data-state-demo.component.ts",
     "showcase/src/app/pages/services/notify/notify-demo.component.ts",
     "showcase/src/app/pages/services/confirm/confirm-demo.component.ts",
     "showcase/src/app/docs/generated/example-sources.generated.ts",
     "showcase/src/app/docs/generated/example-manifest.generated.ts",
     "showcase/src/app/docs/core/documentation.registry.ts",
     "showcase/src/app/docs/core/documentation.registry.spec.ts",
     "showcase/src/app/pages/components/data-state/data-state-demo.component.spec.ts"
    ]
   },
   {
    "id": "TASK-009",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "semantic_scope": "library",
    "allowed_paths": [
     "versions/v19/SYNC-STATUS.md",
     "versions/v20/SYNC-STATUS.md",
     "versions/v20/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v20/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v20/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v20/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v20/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v20/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v21/SYNC-STATUS.md",
     "versions/v21/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v21/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v21/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v21/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v21/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v21/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v22/SYNC-STATUS.md",
     "versions/v22/projects/sdcorejs-angular/components/data-state/sd-data-state.md",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.html",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/components/data-state/src/data-state.component.ts",
     "versions/v22/projects/sdcorejs-angular/components/inform/sd-inform.md",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.html",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/components/inform/src/inform.component.ts",
     "versions/v22/projects/sdcorejs-angular/components/section/sd-section.md",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.html",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/components/section/src/section.component.ts",
     "versions/v22/projects/sdcorejs-angular/modules/icon/sd-icon.md",
     "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.model.ts",
     "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.spec.ts",
     "versions/v22/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/sd-confirm.md",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.html",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/sd-notify.md",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.model.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v22/projects/sdcorejs-angular/services/notify/src/notify.service.ts"
    ]
   }
  ]
 },
 "finish_tail": {
  "contract": {
   "docs_before_final_branch_ready": "TASK-007 (docs, CHANGELOG) và TASK-008 (showcase) xong trước TASK-009; không ghi docs sau kiểm chứng cuối.",
   "verify_before_done": "Chạy mọi lệnh của validation map trên tree cuối và dựng test_evidence.",
   "branch_ready_final_gate": "Sau verify-before-done, branch-ready chỉ đọc; không commit/push/tag/publish trừ khi người dùng yêu cầu.",
   "no_writes_after_branch_ready": true
  }
 },
 "approval": {
  "approved": false,
  "approved_at": null
 },
 "change_control": {
  "revision": 4,
  "supersedes": ".sdcorejs/plans/angular/2026-10-01-18-04-icon-shape-option.md",
  "change_reason": "Convergence feature mode: TASK-009 khai đúng 102 file mirror do sync ghi; validation map một row mỗi cặp (R, AC); TASK-007 chịu INV-001 để EVIDENCE-007 gắn invariant. Không đổi phạm vi code."
 }
}
```

</details>

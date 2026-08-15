# Execution record — sd-select "Tất cả" (showSelectAll) port sang @sdcorejs/angular

- **Date:** 2026-08-12
- **Contract:** `sd-select-select-all-2026-08-11`
- **Approved spec:** `.sdcorejs/specs/angular/2026-08-11-14-54-sd-select-select-all.md` (`sha256:v1:818fd410…96a17`)
- **Approved plan:** `.sdcorejs/plans/angular/2026-08-11-15-01-sd-select-select-all.md` (`sha256:v1:b717e19b…c16d`)
- **Branch:** `fix/full-scan-review`
- **Coverage:** TDD (specs port từ implementation đã verify ở `lib-core-angular`)

## Deviation so với plan r1 (có chủ đích, user đã nghiệm thu trực quan)

Plan r1 mô tả row select-all dùng `div + <mat-checkbox>` + i18n label "Chọn tất cả". Bản đã ship ở `@sd-angular/core` (`19.0.17`, MR !185) khác 3 điểm sau khi review UI thực tế:

1. **`<mat-pseudo-checkbox class="mat-mdc-option-pseudo-checkbox">` thay `<mat-checkbox>`** — `mat-checkbox` MDC có touch-target 40px + label box riêng nên không bao giờ khớp cột với option (option render pseudo-checkbox + `.mdc-list-item__primary-text`), và ăn màu `accent` của theme thay vì `mat-primary` mà panel mang. Dùng đúng element của option thì scale/margin (rule `.sd-select-panel.sd-multiple .mat-pseudo-checkbox` đã có sẵn) và màu tự khớp — không cần override biến nào.
2. **Row mang semantics** — pseudo-checkbox là decorative + `aria-hidden`, nên `role="checkbox"` / `aria-checked` (`mixed` khi indeterminate) / `tabindex="0"` / Enter+Space nằm trên chính div.
3. **Label "Tất cả"** thay "Chọn tất cả" (5 locale) — chữ "Chọn" đã có trong placeholder của field.

AC-001…AC-009 của spec không đổi; chỉ chi tiết implementation của row đổi. `MatCheckboxModule` (import thừa từ trước) được thay bằng `MatPseudoCheckbox`.

## Khác biệt có chủ đích so với bản lib-core

| Điểm | lib-core (`@sd-angular/core`) | repo này (`@sdcorejs/angular`) | Lý do |
| --- | --- | --- | --- |
| Label i18n | computed `selectAllLabel` gọi `#i18n.t()` | pipe `'core.form.select.selectAll' \| sdTranslate` | template repo này đã dùng `SdTranslatePipe` (search aria-label), giữ nhất quán |
| `toggleSelectAll` setValue | `setValue(next, { emitEvent: false })` | `if (formControl.value !== next) setValue(next)` — CÓ event | repo này đã fix bug-class #24/#26: setValue im lặng nuốt event của async `[validator]` → `#state` không tick → message stale. Đi cùng đường `onSelectionChange` hiện hành |
| `valueField`/`displayField` | phải bỏ `input.required` (fix NG0950 kèm theo) | đã default `''` từ trước | repo này fix rồi |
| Icon | `mat-icon` | `sd-icon` | convention repo |

## Thay đổi

| File | Nội dung |
| --- | --- |
| `forms/select/src/select.component.ts` | Input `showSelectAll`; computed `selectAllScope` / `selectAllVisible` / `selectAllState`; method `toggleSelectAll()`; `MatCheckboxModule` → `MatPseudoCheckbox` |
| `forms/select/src/select.component.html` | Row `.sd-select-all-row` (pseudo-checkbox + primary-text) nhánh multiple, dưới search box; alias `@let _autoId` (thay 2 chỗ đọc `autoId()` inline theo convention `@let`) |
| `forms/select/src/select.component.scss` | `.sd-select-all-row` lặp box model của option (36px / `8px 12px`), hover + focus-visible |
| `forms/select/src/select.component.spec.ts` | +17 specs suite `SdSelect (select all)` |
| `i18n/src/{vi,en,zh,ja,ko}.ts` | Key `core.form.select.selectAll` |
| `forms/select/sd-select.md` | Input mới + section "Select all" + `toggleSelectAll()` |
| `CHANGELOG.md` (root) | Entry Unreleased → Added |
| `showcase .../select-demo.component.ts` | Demo section "Chọn nhiều với dòng Tất cả" (có item disabled) |
| `showcase .../documentation.registry.ts` | `demoSectionCount` 10 → 11 + keyword `select all` (guard `test:showcase-examples` bắt buộc) |
| `showcase .../generated/*.generated.ts` | Regen qua `npm run generate:showcase-examples` |
| `versions/v20`, `versions/v21` | Rollout qua `npm run sync` (không sửa tay) |

## Verification

- `npm run build` (v19, ng-packagr) → clean
- `npx ng test sdcorejs-angular --include='**/select/src/select.component.spec.ts'` → **124/124 SUCCESS**
- `npm run check:i18n-parity` (v19) → OK (600 keys × 5 languages)
- `npm run generate:showcase-examples` + `npm run test:showcase-examples` → **16/16 pass** (đỏ 1 lần vì registry `demoSectionCount` chưa cập nhật — guard hoạt động đúng)
- `npm run sync` + `npm run check:sync` → v20/v21 match v19
- AC-M01 (visual showcase) — đã nghiệm thu ở `lib-core-angular` với cùng markup/scss; showcase repo này chưa mở bằng mắt

## Ghi chú

Bản `@sd-angular/core` đã lên MR !185 (`feat/sd-select-all-polish` → `master`, release `19.0.17`, publish manual). Port này đi kèm branch `fix/full-scan-review` của repo này.

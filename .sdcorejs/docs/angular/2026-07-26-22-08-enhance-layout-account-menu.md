# Hoàn thiện Layout account menu — 2026-07-26 22:08

## What was requested

Nâng cấp user profile V1 và thống nhất V1/V2/V3 với role, các action
`updateProfile`, `setting`, `notification`, reactive notification count và
mobile/desktop behavior đã mô tả; tiếp tục đến khi Showcase có thể kiểm tra.

## What was changed

- EDIT `modules/layout/configurations/layout.configuration.ts` — typed role,
  semantic account actions và number/Signal/Observable notification contract.
- EDIT `modules/layout/components/shared/user-menu/*` — shared
  desktop/mobile identity, action order, badge normalization, keyboard/focus và
  Observable cleanup.
- EDIT `modules/layout/components/sidebar-v1/**/user/*` — V1 dùng shared
  presentation, giữ legacy outputs/rail toggle và thêm localized accessible name.
- EDIT `i18n/src/{en,vi,ja,ko,zh}.ts` — account labels và sidebar toggle parity.
- EDIT `projects/showcase/**/layout-demo.component.*` — ba independent live
  showcases, rich menu, responsive controls, role/actions/reactive badge.
- EDIT `modules/layout/sd-layout.md` — public configuration và integration
  example compile-safe.
- SYNC `versions/v20/**`, `versions/v21/**` từ source v19.
- UPDATE user/technical docs, screenshot capture metadata và product
  traceability cho `layout-account-menu`.

## Decisions made

- Public fields giữ đúng tên `updateProfile`, `setting`, `notification`.
- Role là optional identity metadata trong `SdLayoutUserInfo`.
- Consumer sở hữu navigation/drawer và notification source; Layout chỉ gọi callback.
- Mobile luôn đặt profile + signout cùng hàng; optional actions ở dưới.
- Không thêm generic `userActions[]`.
- Finish gate: standard tests, cập nhật cả user guide + technical doc, review và repair loop.

## Open questions / follow-ups

- Không có gap trong approved account-menu scope.
- Dev Showcase `:4200` còn entity-picker compile overlay ngoài scope; built
  Showcase `:4300` đã được dùng cho visual UAT.

## Product traceability

- Ledger: `.sdcorejs/docs/product/2026-07-26-22-04-layout-account-menu.md`
- Status: verified — 15/15 AC có implementation/test/UAT evidence.

## Next suggested action

- Mở built Showcase tại `http://127.0.0.1:4300/`, vào Layout Module để PO/QC
  kiểm tra trực tiếp ba version.
- Khi cần delivery, push `feat/layout-navigation-polish` và mở PR sau khi được
  user cho phép riêng.

## Skill provenance

Skills invoked: `sdcorejs-using-skills` → `sdcorejs-explore` →
`sdcorejs-brainstorming` → `sdcorejs-spec` → `sdcorejs-plan` →
`sdcorejs-execute-plan` → `sdcorejs-angular` → `sdcorejs-test` →
`sdcorejs-debug` → `sdcorejs-review` → `sdcorejs-repair-loop` →
`sdcorejs-documentation` → `sdcorejs-product`.

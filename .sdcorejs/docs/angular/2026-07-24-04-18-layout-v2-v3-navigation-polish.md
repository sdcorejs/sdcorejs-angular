# Layout V2/V3 Navigation Polish - 2026-07-24 04:18

## What was requested

Polish Layout V2/V3: bỏ icon thừa cạnh avatar, ẩn icon `apps` khi V3 collapsed,
và styling lại menu search thành Soft-pill nền xám, bo tròn.

## What was changed

- EDIT `modules/layout/components/shared/user-menu` - compact trigger chỉ còn
  avatar căn giữa, vẫn có accessible name và giữ expanded/mobile behavior.
- EDIT `modules/layout/components/sidebar-v3` - collapsed header ẩn brand/apps,
  căn giữa expand control và compact account.
- CREATE `modules/layout/components/shared/search-field` - internal standalone
  OnPush Soft-pill presentation cho menu search.
- EDIT bốn V2/V3 desktop/mobile sidebar - dùng shared search presentation nhưng
  giữ placeholder, `autoId`, filtering và signal flow.
- EDIT `modules/layout/sd-layout.md`, `CHANGELOG.md` và generated changelog -
  ghi nhận behavior mới; sync canonical v19 sang v20/v21.
- CREATE `product/**/layout-v2-v3-navigation-polish.md` và product ledger -
  nối 10 acceptance criteria với implementation, test và UAT.

## Decisions made

- Chọn Soft-pill nền token xám, radius pill, leading search icon và primary
  focus ring.
- Search component là implementation detail, không thêm public export.
- Compact account giữ full hit target; tên hiển thị được dùng làm accessible
  name khi phần identity bị ẩn.
- Finding `SdInput aria-hidden` toàn cục được giữ ngoài scope và đưa vào TODO
  riêng vì có blast radius lớn hơn Layout.

## Open questions / follow-ups

- Audit/fix riêng editable `SdInput` đang kế thừa `aria-hidden="true"` từ
  container semantics.
- Optional: giảm coupling test search icon với Material renderer và tăng
  integration assertion cho filter/Escape.
- Push branch và tạo PR chỉ khi có yêu cầu delivery rõ ràng.

## Product traceability

- Ledger:
  `.sdcorejs/docs/product/2026-07-24-04-18-layout-v2-v3-navigation-polish.md`
- Status: verified - 10/10 acceptance criteria có implementation và evidence.

## Next suggested action

- Khi được yêu cầu, push `feat/layout-navigation-polish` và mở PR vào `main`.
- Xử lý audit `SdInput aria-hidden` trong một task Forms độc lập.

## Verification

- Layout tests trên v19/v20/v21: mỗi workspace `84/84 SUCCESS`.
- `npm run lint:release`, `npm run check:sync`, `git diff --check`: pass.
- Library build v19/v20/v21 và Showcase v19 production build: pass.
- Browser V2/V3 desktop/mobile: layout, filter, focus, Escape và body-scroll
  cleanup pass; console `0` error, `0` warning.
- Final review: `0 BLOCKER`, `0 REQUIRED`; accessibility repair commit
  `2391516`.

## Skill provenance

Skills invoked: `sdcorejs-execute-plan` -> `subagent-driven-development` ->
`sdcorejs-angular` -> `sdcorejs-test` -> `sdcorejs-documentation` ->
`sdcorejs-review` -> `sdcorejs-repair-loop` -> `sdcorejs-product` ->
`sdcorejs-ship`.

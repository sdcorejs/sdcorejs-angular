# Căn hàng V2 account và khôi phục avatar V1 — 2026-07-25 12:49

## What was requested

Đặt nút đăng xuất V2 mobile cùng hàng với thông tin người dùng như V3, đồng
thời bảo đảm avatar account V1 desktop nhìn thấy và có thể tương tác trong
Showcase.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html` — dùng presentation mobile inline đã có.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts` — kiểm tra profile/sign-out cùng hàng và action trực tiếp.
- EDIT `versions/v19/projects/showcase/src/app/pages/modules/layout/layout-demo.component.ts` — giới hạn legacy V1 viewport-height trong live preview.
- EDIT `versions/v19/projects/showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts` — kiểm tra avatar V1 nằm trong preview.
- SYNC `versions/v20`, `versions/v21` — đồng bộ canonical Angular 19.

## Decisions made

- Tái sử dụng `mobile-inline` của `SdLayoutUserMenuComponent`; không tạo thêm
  component hoặc public API.
- Chỉ giới hạn `100vh` của V1 trong fixture Showcase để không thay đổi layout
  runtime của ứng dụng tích hợp.
- Test coverage giữ mức standard theo lựa chọn trước đó; review + repair không
  có finding chặn.

## Open questions / follow-ups

- Không có blocker mới trong phạm vi Layout.
- Full release lint vẫn có baseline formatting của generated changelog ngoài
  phạm vi refinement này.

## Product traceability

- Ledger: `.sdcorejs/docs/product/2026-07-24-04-18-layout-v2-v3-navigation-polish.md`
- Status: verified — AC11 và AC16 có unit/browser evidence.

## Next suggested action

- Khi được yêu cầu delivery, push `feat/layout-navigation-polish` và mở PR vào
  `main`.

## Skill provenance

Skills invoked this session: `sdcorejs-using-skills` -> `sdcorejs-debug` ->
`sdcorejs-angular` -> `sdcorejs-review` -> `sdcorejs-documentation` ->
`sdcorejs-product` -> `sdcorejs-ship`.

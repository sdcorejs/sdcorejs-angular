# Tinh chỉnh điều hướng mobile Layout — 2026-07-25 11:49

## What was requested

Tinh chỉnh tiếp V1/V2/V3: V3 mobile đặt đăng xuất cùng hàng profile; pin desktop
chỉ hiện sau một khoảng hover còn mobile luôn hiện; sticky search V3 không để
menu lọt phía dưới; V1 dùng custom logo hoặc fallback icon đồng nhất.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree` — thêm hover-delay 300ms, chế độ luôn hiện trên mobile và glyph `push_pin`.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu` — thêm presentation `mobile-inline` cho profile/action V3.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2` — luôn hiện pin trên mobile.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3` — account row inline, pin luôn hiện và sticky search có nền kín/offset đúng.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1` — custom logo theo input, fallback icon `apps` và accessible home link.
- EDIT các Layout specs — khóa regression cho hover-delay, mobile pin, profile/logout, sticky search và logo V1.
- SYNC `versions/v20`, `versions/v21` — mirror canonical Angular 19.
- EDIT product traceability — cập nhật PRD, stories, AC, UAT, decisions và feature ledger.

## Decisions made

- Desktop dùng hover-delay 300ms để giữ menu gọn; `:focus-visible` vẫn làm pin hiện cho keyboard.
- Mobile không phụ thuộc hover và luôn hiển thị pin/unpin.
- Dùng `push_pin` thay icon không có trong Material Icon version hiện tại.
- V3 dùng `mobile-inline`; V2 giữ layout account dạng dọc hiện tại.
- Search sticky dùng nền trắng opaque và `top: -12px` để che cả vùng padding của scroller.
- Chỉ sửa canonical v19 rồi dùng repository sync cho v20/v21.
- Code documentation ở mức simple: không thêm comment lặp lại code; timer cleanup và workaround sticky đã rõ trong cấu trúc/test.

## Open questions / follow-ups

- Full release lint vẫn gặp formatting của generated `projects/showcase/src/app/docs/generated/changelog.generated.ts`, ngoài phạm vi refinement này; targeted Layout ESLint đã pass.
- Local Showcase vẫn có 404 `/docs/versions.json` do registry published-docs chưa có trong dev server; không ảnh hưởng runtime Layout.

## Product traceability

- Ledger: `.sdcorejs/docs/product/2026-07-24-04-18-layout-v2-v3-navigation-polish.md`
- Status: verified cho 15 acceptance criteria; full release lint baseline được ghi rõ là follow-up.

## Next suggested action

- Mở Showcase local và xác nhận cảm giác hover/pin trên thiết bị thật.
- Khi được yêu cầu delivery, push `feat/layout-navigation-polish` và mở PR vào `main`.
- Xử lý formatting generated changelog trong task hygiene riêng nếu cần full release lint xanh.

## Verification

- Layout Angular 19: `94/94 SUCCESS`.
- `npm run check:sync`: pass.
- Library build Angular 19/20/21: pass.
- Showcase production build: pass.
- Browser UAT desktop/mobile: pass cho pin delay, pin mobile, V3 inline sign-out, sticky search và V1 fallback.
- Targeted Layout ESLint: pass; full release lint bị chặn bởi generated changelog ngoài scope.

## Skill provenance

Skills invoked: `sdcorejs-using-skills` -> `sdcorejs-debug` ->
`sdcorejs-angular` -> `sdcorejs-test` -> `sdcorejs-review` ->
`sdcorejs-repair-loop` -> `sdcorejs-documentation` -> `sdcorejs-product` ->
`sdcorejs-ship`.

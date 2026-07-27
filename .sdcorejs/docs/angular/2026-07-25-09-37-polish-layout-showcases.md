# Hoàn thiện Layout V1/V2/V3 Showcase — 2026-07-25 09:37

## What was requested

Sửa trải nghiệm Layout V1/V2/V3: đơn giản hóa tài khoản mobile và nút đăng xuất, làm rõ hover, khôi phục collapse V1, thêm logo mặc định, hiển thị search với nhiều menu, tách mỗi version thành một Showcase và port bản sửa resize/collapse từ `vn-angular`.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/` — bổ sung mobile user summary tĩnh, direct sign-out, hover token fallback và focus ring search 1px.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/` — giữ desktop drawer mounted ở rail 60px, ẩn title/tree khi collapse, dùng logo SDCoreJS mặc định và đếm menu lồng nhau cho điều kiện search.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2|v3/` — dùng presentation mobile không disclosure cho thông tin tài khoản.
- EDIT `versions/v19/projects/showcase/src/app/pages/modules/layout/` — tách V1/V2/V3 thành ba Showcase độc lập, thêm fixture hơn 10 menu và thay icon `insights` bằng `bar_chart`.
- EDIT `versions/v19/projects/showcase/src/app/docs/` — cập nhật registry và generated example manifest/source từ 1 lên 3 Layout examples.
- EDIT `versions/v19/projects/**/*.spec.ts` — thêm regression coverage cho collapse, logo fallback, mobile sign-out, focus ring và focused Showcase.
- SYNC `versions/v20`, `versions/v21` — mirror canonical v19 sang Angular 20/21.

## Decisions made

- Mobile V2/V3 chỉ hiển thị avatar, tên, email và một nút Đăng xuất trực tiếp; change-password/disclosure vẫn giữ cho desktop.
- Desktop V1 không đóng `MatSidenav`; collapse chỉ đổi chiều rộng từ 290px xuống 60px để tránh lỗi resize/zoom và mất rail.
- Layout search chỉ có một focus ring 1px: V1 đặt trực tiếp trên input, V2/V3 đặt trên Soft-pill wrapper.
- Test coverage: standard; user guide và technical doc được bỏ qua theo lựa chọn của user.
- Review findings về focused guard, generated examples và AOT export đã được repair trước khi handoff.

## Open questions / follow-ups

- Không có blocker chức năng còn lại.
- Delivery (commit/push/PR) chưa thực hiện vì user chưa yêu cầu.

## Product traceability

- Không tạo ledger product riêng; đây là refinement của component/library và Showcase hiện có.
- Status: complete trong phạm vi implementation và verification.

## Next suggested action

- Mở `http://127.0.0.1:4200/v/latest/modules-integrations/layout/examples` để review trực quan ba Layout Showcase.
- Khi cần delivery, push `feat/layout-navigation-polish` và mở PR vào `main`.

## Skill provenance

Skills invoked this session: `sdcorejs-using-skills` -> `sdcorejs-explore` -> `sdcorejs-angular` -> `sdcorejs-debug` -> `sdcorejs-test` -> `sdcorejs-review` -> `sdcorejs-repair-loop` -> `sdcorejs-documentation`.

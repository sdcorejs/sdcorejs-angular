# PRD - Layout account menu

## Vấn đề

Account profile của V1 không đồng nhất với V2/V3, có lúc hiển thị raw i18n key,
thiếu role và không có extension points rõ ràng cho hồ sơ, thiết lập hoặc thông
báo.

## Mục tiêu

V1/V2/V3 dùng cùng một presentation và typed configuration cho identity, role,
account actions và reactive notification badge trên desktop/mobile.

## Người dùng

- Người dùng portal - xem nhanh danh tính, vai trò, thông báo và mở tác vụ tài khoản.
- Consumer developer - nối callback vào drawer, dialog hoặc route của ứng dụng host.
- QC/PO - kiểm tra riêng từng layout version ở desktop và mobile.

## Phạm vi

- Role tùy chọn với `text`, `icon`, `color`.
- Semantic actions `updateProfile`, `setting`, `notification`.
- Notification count hỗ trợ number, Signal và Observable.
- Shared identity/action presentation cho V1/V2/V3.
- I18n, keyboard navigation, focus restoration và Observable cleanup.
- Independent Showcase cho cả ba version.

## Ngoài phạm vi

- Generic `userActions[]`.
- Fetch/poll/websocket notification.
- Profile/settings/notification pages hoặc side drawer cụ thể.
- Authorization cho account actions.

## Tiêu chí thành công

- 15/15 acceptance criteria có implementation và verification evidence.
- V1/V2/V3 không hiển thị raw translation key.
- Mobile 390px không overflow; profile và signout nằm cùng hàng.
- Source v20/v21 đồng bộ với v19.

# RX · phản hồi của tác giả
Review chéo [`cross-RX.md`](cross-RX.md) ở `958cfae06`: 0 Chặn, 5 Nên sửa, 18 Ghi chú (6 cần PD chốt). Sửa trên nhánh của PR scheduler (#146, `feat/sd-scheduler`), vì #141 và #142 đã merge và phần dùng chung (`calendar-move.ts`) đang đổi ở PR này.

| Mục | Xử lý | Test |
| --- | --- | --- |
| #1 Vùng chạm calendar khi hẹp | `.sd-calendar--compact`: nút của dải và nút thanh hỏi phạm vi `min-height: var(--sd-control-height-coarse, 44px)`, như scheduler. Nút "+N" của hàng cả ngày (22px) để PD chốt cùng #7: phóng vùng chạm sẽ đè lên hàng kế. | Karma calendar 192 + 2; E2E calendar xanh |
| #2 `request.source` của `Alt` + `Shift` + mũi tên | PD 11/11: `'resize'` ở cả hai. Calendar đổi trên #146. | `[CAL-C-12]` |
| #3 Chữ "Bỏ qua" của kanban | `core.component.kanban.dismiss`: vi "Bỏ qua", zh "忽略" (như calendar, scheduler; en, ja, ko đã khớp). | Ảnh `kanban-screens/card-failed.png` chụp lại |
| #4 SC-30, focus ra ngoài rồi về `body` | `ɵSdCalendarFocusKeeper.track(origin)` nghe `focusin` trong lúc chờ: focus người dùng đặt ngoài `origin` và thanh hỏi phạm vi làm item mất quyền giữ focus, kể cả khi chỗ đó sau đó mất focus về `body` (như kanban `#trackFocus`). Runner luôn dừng theo dõi (`finally`). Calendar và scheduler dùng chung. | `[CAL-SC-30]` (`calendar.shared.spec.ts`), `[SCH-B-49]` |
| #5 Helper E2E chép ba lần | `showcase/e2e/components/schedule.support.ts`: `axe`, `screenshots(folder)` (`shot`, `shotAround`), `button`, `cycle`, khai báo `Window`. Ba file E2E dùng chung. | E2E calendar + kanban + scheduler, hai project: 104 passed, 10 skipped |
| #6 | PD 11/11: focus đang ở chính item thì đi theo item, mọi `source` (như kanban); focus ở chỗ khác không bị lấy. `ɵSdCalendarFocusKeeper.holds(id)`, #146. | `[CAL-SC-31]` ×2, `[SCH-SC-31]` |
| #7 | PD 11/11: 44px theo `pointer: coarse` ở mọi bề rộng, bố cục hẹp theo host; kanban 40 → 44px. #147. | `[CAL-SC-36]`, `[SCH-SC-36]`, `[KAN-SC-36]` |
| #8 | PD 11/11: token của component có fallback, token lõi không cần; giữ code. Ghi ở SC-43. | — |
| #9 | PD 11/11: chấp nhận. Opt-out của `sd-data-state` là việc tuỳ chọn, chưa làm. Ghi ở SC-33. | — |
| #10 | PD 11/11: `core.common.retry`, `core.common.dismiss`; `core.component.kanban.dismiss` deprecated. #147. | Karma ba component |
| #11 | PD 11/11: kanban "Đang lưu {title}", "Đã huỷ thay đổi"; giữ động từ theo miền. #147. | Karma kanban |
| Ghi chú còn lại | Không đổi. | — |

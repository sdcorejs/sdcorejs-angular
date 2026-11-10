# RX · phản hồi của tác giả
Review chéo [`cross-RX.md`](cross-RX.md) ở `958cfae06`: 0 Chặn, 5 Nên sửa, 18 Ghi chú (6 cần PD chốt). Sửa trên nhánh của PR scheduler (#146, `feat/sd-scheduler`), vì #141 và #142 đã merge và phần dùng chung (`calendar-move.ts`) đang đổi ở PR này.

| Mục | Xử lý | Test |
| --- | --- | --- |
| #1 Vùng chạm calendar khi hẹp | `.sd-calendar--compact`: nút của dải và nút thanh hỏi phạm vi `min-height: var(--sd-control-height-coarse, 44px)`, như scheduler. Nút "+N" của hàng cả ngày (22px) để PD chốt cùng #7: phóng vùng chạm sẽ đè lên hàng kế. | Karma calendar 192 + 2; E2E calendar xanh |
| #2 `request.source` của `Alt` + `Shift` + mũi tên | **Cần PD chốt**: calendar `'keyboard'`, scheduler `'resize'`. Không đổi. | — |
| #3 Chữ "Bỏ qua" của kanban | `core.component.kanban.dismiss`: vi "Bỏ qua", zh "忽略" (như calendar, scheduler; en, ja, ko đã khớp). | Ảnh `kanban-screens/card-failed.png` chụp lại |
| #4 SC-30, focus ra ngoài rồi về `body` | `ɵSdCalendarFocusKeeper.track(origin)` nghe `focusin` trong lúc chờ: focus người dùng đặt ngoài `origin` và thanh hỏi phạm vi làm item mất quyền giữ focus, kể cả khi chỗ đó sau đó mất focus về `body` (như kanban `#trackFocus`). Runner luôn dừng theo dõi (`finally`). Calendar và scheduler dùng chung. | `[CAL-SC-30]` (`calendar.shared.spec.ts`), `[SCH-B-49]` |
| #5 Helper E2E chép ba lần | `showcase/e2e/components/schedule.support.ts`: `axe`, `screenshots(folder)` (`shot`, `shotAround`), `button`, `cycle`, khai báo `Window`. Ba file E2E dùng chung. | E2E calendar + kanban + scheduler, hai project: 104 passed, 10 skipped |
| #6–#11 | **Cần PD chốt**, ghi ở `PROGRESS.md`. | — |
| Ghi chú còn lại | Không đổi. | — |

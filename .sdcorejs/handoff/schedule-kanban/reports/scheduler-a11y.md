# sd-scheduler · trợ năng (TESTING.md §8)
Nhánh `feat/scheduler`. Showcase không có `@axe-core/playwright`; axe-core của `versions/v19/node_modules` được nạp bằng `page.addScriptTag` như calendar và kanban, không thêm dependency.

| Mục | Cách kiểm | Kết quả |
| --- | --- | --- |
| Tự động | axe-core trong E2E: Đặt phòng sau khi tạo một lịch (SCH-E-01), Nghỉ phép tháng có avatar (SCH-E-04), Chấm công có template ô (SCH-E-06), Xe giao hàng ở `forcedColors: 'active'` + `reducedMotion: 'reduce'` với một khối đang chọn | 0 vi phạm serious/critical |
| Cấu trúc lưới | Karma SCH-C-16: `role="grid"` > `rowgroup` > `row` > `rowheader` + `gridcell`; ô tài nguyên có `id`, khối `aria-describedby` trỏ tới ô tài nguyên và hướng dẫn phím; hàng nhóm có nút `aria-expanded`, `aria-label` “{nhóm}, {n} tài nguyên” | Đạt |
| Chỉ bàn phím | Lưới là một tab stop với `aria-activedescendant` trỏ tới vùng giờ của hàng có con trỏ, ô của template ô, hoặc tiêu đề nhóm thu gọn (SCH-C-14, SCH-C-13, SCH-C-16). Mũi tên hai trục, Home/End theo giờ làm của tài nguyên, Ctrl+Home/End, PageUp/PageDown, T, Enter/Space tạo, Alt+Enter thu gọn. Trên khối: Enter/Space chọn, Esc về lưới, Alt+←→ dời giờ, Alt+Shift+←→ đổi giờ kết thúc, Alt+↑↓ sang tài nguyên gần nhất `droppable` cho, kể cả nhóm thu gọn (SCH-C-09, SCH-SC-08). E2E SCH-E-05: Alt+↓ vào Tầng 5 đang thu gọn, nhóm mở, focus ở lại khối. | Đạt. Không bẫy focus: thanh hỏi phạm vi lấy focus ở nút đầu, Esc là Huỷ, focus về khối (SCH-SC-29, SCH-SC-30). |
| Live region | Một vùng `role="status"` polite, atomic. Chuỗi đọc: con trỏ (“{tài nguyên}, {thứ} {ngày}, {giờ}”), tiêu đề sau điều hướng, đang lưu, đã dời, đã chuyển sang tài nguyên, đã đổi giờ kết thúc, đã huỷ, từ chối, lỗi, “Không chuyển sang {tài nguyên} được”, ngoài khoảng cho phép, lỗi tải (SCH-SC-09…13, SCH-SC-08, SCH-SC-17, SCH-C-16) | Đạt |
| Hàng bị từ chối khi kéo | Karma SCH-C-07, E2E SCH-E-03: hàng có `data-drop="blocked"`, sọc, ô tài nguyên mờ, con trỏ `not-allowed`; thả vào không gọi `onMove` và đọc lý do | Đạt. Lớp phủ và nhãn nổi `aria-hidden`; người dùng bàn phím nghe lý do khi Alt+↑↓ hết hàng hợp lệ. |
| forced-colors | Karma SCH-SC-35; ảnh `vehicles-forced-colors.png` | Khung `CanvasText`; khối chọn viền `Highlight`; khối chờ `Highlight`; vạch giờ hiện tại `Highlight` |
| reduced motion | Karma SCH-SC-34; ảnh cùng lúc với forced-colors | Không transition khối, không quay icon đồng bộ, không chạy thanh tiến trình |
| Cảm ứng | E2E SCH-E-11 (390px, `hasTouch`): cột tài nguyên 120px, chạm tạo một ô, giữ 400ms rồi kéo sang hàng khác. Karma SCH-C-15 (`cdkDragStartDelay` touch 400, chuột 0; không quét trên touch), SCH-SC-36 (tay nắm 24px khi `pointer: coarse`, chỉ ở khối đang chọn) | Đạt |
| RTL | Karma SCH-C-14 (←→ đảo chiều), ảnh `day-1200-rtl.png` | Đạt |
| Phóng to 200% | Chưa làm tay | **Chờ** |
| VoiceOver + Safari / NVDA + Firefox | Không chạy được trong môi trường này (Windows, không có trình đọc màn hình) | **Chờ PD**: đọc nhãn khối có tên tài nguyên, con trỏ lưới, tiêu đề nhóm thu gọn, thanh hỏi phạm vi, đang lưu, đã chuyển sang tài nguyên, hàng bị từ chối, lỗi tải |

Điểm đang chờ PD chốt (`reviews/scheduler-R1-author.md` #10): `aria-label` hiện đặt trên `role="grid"` (“{ariaLabel}, {tiêu đề khoảng}”), vùng cuộn không có nhãn riêng; spec §14 ghi nhãn trên vùng cuộn.

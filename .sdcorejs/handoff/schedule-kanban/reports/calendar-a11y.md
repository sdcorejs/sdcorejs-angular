# sd-calendar · trợ năng (TESTING.md §8)
Commit: 676e8380

| Mục | Cách kiểm | Kết quả |
| --- | --- | --- |
| Tự động | axe-core 4.13.0 trong E2E (tuần light, forced-colors) | 0 serious/critical |
| Chỉ bàn phím | E2E CAL-E-10 (Tab vào lưới, mũi tên, Enter tạo, Tab tới sự kiện, Alt+→ qua mép tuần, focus theo khối), CAL-E-11 (Tháng roving, Enter), CAL-E-06 (thanh hỏi phạm vi: focus "Chỉ lần này", Esc), CAL-E-07 (focus giữ sau từ chối); Karma CAL-C-14, CAL-C-19, CAL-SC-29…31 | Đạt, không bẫy focus (thanh hỏi là alertdialog không modal, Esc đóng) |
| Live region | Karma CAL-SC-33 (một vùng polite, atomic), thông báo cho con trỏ, đang lưu, đã dời, đã huỷ, từ chối, lỗi, ngoài giới hạn, lỗi tải; lặp cùng chuỗi được đọc lại (R1-G9) | Đạt |
| forced-colors | Ảnh `week-forced-colors.png` (Chromium `forcedColors: 'active'`), Karma CAL-SC-35 | Khung CanvasText, chọn/chờ/giờ hiện tại Highlight |
| reduced motion | Karma CAL-SC-34; ảnh cùng lúc | Không transition, icon sync đứng yên; thanh tiến trình giữ |
| Phóng to 200% | Chưa làm tay | **Chờ** |
| VoiceOver + Safari / NVDA + Firefox | Không chạy được trong môi trường này | **Chờ PD** (con trỏ lưới, nhãn khối, thông báo dời/từ chối/huỷ/lỗi tải, thanh hỏi phạm vi) |

# @sdcorejs/angular 19.2.6

Release tag `v2.6`, published 2026-09-08.

Release suffix `2.6` publishes `19.2.6`, `20.2.6`, `21.2.6`, and `22.2.6`.

### Added

- Select, autocomplete và server table có `readState`, `sdReadStateChange`, `retryRead()`, `hideReadError` và template `sdDataStateTemplate`. VALUE/SEARCH độc lập; retry dùng snapshot request đã lỗi, giữ model và dữ liệu thành công, bỏ qua response cũ. Public entry point `utilities/read-state` tách biệt với `utilities/data-state`.

### Changed

- Button cải thiện màu outline/disabled theo theme, khoảng cách icon và focus bàn phím; giữ bo tròn M3 và các kích thước 32/40/48px. Table gom thao tác chọn hàng trong QuickAction; Import Excel cải thiện bước chọn file, lọc và hiển thị lỗi, kể cả trên mobile.
- Inform dùng icon nền nhẹ và SdButton nhỏ; Upload thêm appearance dropzone/compact và thao tác bàn phím; Stepper dùng icon trong chỉ báo và phân biệt bước hoàn tất. Modal/Drawer thống nhất khoảng cách, bo góc và mobile; Drawer giữ và khôi phục focus bằng CDK.
- Confirm dùng layout gọn với icon nền nhẹ luôn hiển thị, tiêu đề 18px và nút SdButton nhỏ. Các phương thức hỗ trợ icon tùy chỉnh hoặc mặc định theo context; withInput thêm label/placeholder. Giữ các biến thể và kết quả Promise hiện có, cải thiện focus và bố cục mobile.
- Data-state dùng icon nền nhẹ, loading primary, empty warning, compact căn ngang và nút retry/action `SdButton size="sm"`. Loading ưu tiên hiển thị so với lỗi khi VALUE/SEARCH đọc xen kẽ; giảm chuyển động tiếp tục tắt animation.
- Notify dùng icon SVG nét trong ô nền nhạt theo màu trạng thái, đồng nhất với data-state; giữ timing/grouping/action và cơ chế sanitize HTML.

### Fixed

- Button chỉ hiển thị một icon khi dùng suffix mà không truyền icon đầu. SideDrawer nhận focus ngay khi mở, giữ hiệu ứng đóng và thiết lập giảm chuyển động.
- Date-range áp dụng đúng `clearable`, required và disabled cho nút xóa; datetime dùng icon picker đồng nhất. Multiple-select hiển thị số lượng đã chọn và tooltip với mỗi lựa chọn trên một dòng. Sidebar dùng hết chiều cao khả dụng để cuộn menu dài.
- Release `2.6` dùng bản đối chiếu `22.2.5` cho Angular 22; pipeline pin đúng tag, artifact và quy tắc giữ năm trang release gần nhất.
- **Showcase release pages resolve library styles from the installed package.** Global Core UI SCSS now loads from `showcase/node_modules/@sdcorejs/angular`, so Angular Material resolves from Showcase's own dependencies when postpublish materializes a tarball without installing the v19 workspace.

## Compare with the previous release

- Previous documented release: [19.2.5](https://sdcorejs.github.io/sdcorejs-angular/docs/19.2.5/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.5...v2.6

# @sdcorejs/angular 21.2.7

Release tag `v2.7`, published 2026-09-09.

Release suffix `2.7` publishes `19.2.7`, `20.2.7`, `21.2.7`, and `22.2.7`.

### Added

- Table supports an optional `filter.quickSearch` row: Enter commits the keyword, `containFields` and `equalFields` generate an OR group, and `values`/`lazy-values` dropdowns apply immediately. Dropdowns support signal defaults, reactive visibility/disabled state, required values and user-only `onChange`. The applied `{ term, filters }` is available in `filterReq.quickSearch` even without search fields. `sdTableQuickSearchRightDef` lets consumers project optional UI on the right.

### Changed

- Sidebar V1 dùng nền sáng, tổng chiều rộng 304px với thanh module 56px, tiêu đề đậm, khoảng cách gọn và Material Icons Outlined. Menu 1–3 cấp phân biệt nhánh cha với mục đang chọn; avatar và nút thu gọn nhỏ nằm ở cuối thanh module. Giữ nguyên API, dữ liệu menu, routing, phân quyền, tìm kiếm và expand/collapse; không thêm vùng trống cho description.
- Table external filters use small controls with inline errors hidden and a padded section body. Desktop tables use subtle 6px outer corners while retaining their existing scroll and sticky behavior.
- Confirm, Notify, Inform and Data-state now use circular status icon backgrounds, including compact Data-state. Existing icon sizes, semantic colors, layouts and interactions are preserved.
- Section header icons use a 32px circular soft background with a centered 20px glyph, matching `iconColor` across all six color tokens. Custom header slots and collapse behavior are preserved.

### Fixed

- Error state của select/autocomplete căn giữa, nằm dưới dữ liệu đang giữ lại; panel hẹp giảm khoảng đệm, icon và cho phép xuống dòng.
- Confirm `withRadio` loại bỏ scroll dọc dư do baseline và vùng bấm M3 tràn khỏi hàng radio; giữ vùng bấm 48px, khả năng cuộn danh sách dài và wrap lựa chọn trên mobile.
- Badge `type="icon"` giữ đúng kích thước icon, căn giữa với phần chữ và không co icon khi nội dung dài.
- Chỉ báo selection của table dùng màu success, gồm icon desktop và số lượng đã chọn trên mobile.
- Local release staging selects the previous package from the same Angular major; the Angular 21 baseline fallback is limited to the Angular 22 inception release `22.2.5`.
- Disabled table row-command icons use the button's muted disabled color instead of retaining the active icon color.
- Table desktop command touch targets stay within each button, preventing adjacent commands from intercepting clicks.
- Sidebar V1 search uses a compact light native input with a leading icon and a single thin focus border. Keep existing search matching and IME buffering; make clear accessible by keyboard and restore input focus after clearing.

## Compare with the previous release

- Previous documented release: [21.2.6](https://sdcorejs.github.io/sdcorejs-angular/docs/21.2.6/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.6...v2.7

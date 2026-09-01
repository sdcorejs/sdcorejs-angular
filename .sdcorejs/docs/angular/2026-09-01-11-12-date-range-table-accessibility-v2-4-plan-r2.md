# Kế hoạch sửa review accessibility SdDateRange và SdTable v2.4 — revision 2

Revision này thay thế plan revision 1 sau independent review. Contract sản phẩm, public API, release suffix và phạm vi repository không đổi.

## Scope delta

- Thêm `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts` vào write scope. Test cũ phải đổi assertion từ “sort omitted có aria-sort” sang contract mới “sort omitted không instantiate sort control và không có aria-sort”.
- Bỏ hai event handler `stopPropagation()` mới thêm trên inline filter vì filter đã là sibling của title-only sort control; giữ regression test chứng minh filter không kích hoạt sort.
- Mở rộng regression suite để custom title và resize chạy với cả `sort.enable=false` và sort omitted.
- Thay real-time wait 850 ms trong Axe fixture bằng fakeAsync/tick/flush deterministic.

## Allowed paths

- Các path đã duyệt trong `.sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md`.
- `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`.
- Revision artifacts này và `.sdcorejs/plans/angular/2026-09-01-11-12-date-range-table-accessibility-v2-4-r2.md`.

## Prohibited paths

- `enterprise-portal/**`
- `node_modules/**` và mọi node_modules patch
- `versions/v20/package-lock.json`, `versions/v21/package-lock.json`
- public barrels, `.github/**`, `scripts/**`, `published-docs/**`

## Tasks

1. EDIT canonical v19 table template/specs theo bốn finding đã xác minh.
2. VERIFY focused table accessibility suite.
3. GENERATE v20/v21 chỉ bằng `npm run sync`; chạy sync parity.
4. VERIFY focused date/table matrix trên v19/v20/v21.
5. VERIFY lại full test release, lint, build, script/page và tarball gates bị invalidated.
6. Chạy independent re-review; sau đó quay lại ship/branch-ready trước commit/PR/tag.

## Approval

User đã chọn `1` sau khi duyệt yêu cầu “test phần này cực kỳ đầy đủ”; lựa chọn đó được áp dụng cho toàn bộ nhóm review hardening nêu trên. Không có product/API decision mới.

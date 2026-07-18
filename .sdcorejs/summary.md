---
generated_at: 2026-07-15T21:28:00+07:00
git_head: 5602da4c2e853a18216a3c21ab4ac9e01e1892ac
branch: release/1.3
tracks: [angular, design, node]
generator: sdcorejs-explore
target_root: C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular
target_root_kind: target-project
dirty: true
relevant_dirty_paths:
  - .sdcorejs/persona.md
  - .sdcorejs/summary.md
  - .sdcorejs/tasks/current-session.md
  - .sdcorejs/docs/design
  - design
  - docs/superpowers/specs/2026-07-15-sd-table-settings-compact-density-design.md
stack_profiles: [core-ui-angular, node-general]
profile_confidence: high
package_manager: npm
summary_scope: table settings dialog visual-density design
---

# Project Summary - sdcorejs-angular

## What this project is

- Repository nguồn của package npm `@sdcorejs/angular`, duy trì đồng thời các line Angular 19, 20 và 21.
- `versions/v19` là source of truth; root `npm run sync` rollout thay đổi tương thích sang v20/v21 và `npm run check:sync` kiểm tra parity.
- Showcase v19 là tài liệu tương tác và môi trường smoke-test cho các component của library.

## Stack & track

- Track chính: Angular library/component; track hiện tại: design handoff cho dialog cấu hình bảng.
- Angular Material/CDK, standalone components, signals, SCSS utilities và ng-packagr.
- Persona dự án: `tech`.

## Architecture map

- Library source: `versions/v19/projects/sdcorejs-angular`.
- Table config dialog: `components/table/src/components/config/config.component.{html,scss,ts}`.
- Shared modal footer: `components/modal/src/modal.component.scss`; right action group đã có `gap: 8px`.
- Showcase table demo: `versions/v19/projects/showcase/src/app/pages/components/table/table-demo.component.ts`.
- Rollout scripts: root `scripts/sync-multi-version-workspaces.ps1` và `scripts/check-version-sync.mjs`.

## Reusable building blocks

- `SdModal` sở hữu header/body/footer layout, footer padding `16px` và action gap `8px`.
- `SdButton` mặc định size `sm`, cao `32px`; chỉ primary action nên dùng fill trong một action group.
- `SdInput` hỗ trợ size `sm` cao `32px`, phù hợp vùng table/dense.
- Spacing utilities theo bội số `4px`; ưu tiên gap của layout container thay vì margin riêng trên từng child.

## Conventions detected

- Chỉnh shared logic ở v19 trước, sau đó chạy sync sang v20/v21.
- Không thay global modal spacing cho một dialog riêng.
- Dùng shared component/token/utility trước khi tạo CSS cục bộ.
- Giữ button order `Bỏ qua` → `Mặc định` → `Áp dụng`, và chỉ `Áp dụng` là primary fill.

## Reuse cheatsheet

- Footer chuẩn: bỏ margin child dư thừa và dùng `SdModal` gap `8px` làm single source of truth.
- Dense table control: ưu tiên `size="sm"` thay vì CSS height tùy biến.
- Rollout/check: `npm run sync`, sau đó `npm run check:sync`.
- Showcase route liên quan: `/components/table` theo documentation registry hiện tại.

## Open context

- Design polish cho dialog “Thiết lập bảng” đang được thực hiện; yêu cầu rõ nhất là giảm khoảng cách giữa các button.
- Nguyên nhân hiện tại: hai nút đầu có `mr-8` trong khi footer đã có flex gap `8px`, tạo khoảng cách hiệu dụng `16px`.
- Yêu cầu ban đầu chỉ nêu button spacing và switch nhỏ hơn; các chi tiết density còn lại đã được người dùng duyệt qua visual companion và technical contract ngày 2026-07-15.
- Chưa có focused component test cho layout/footer của `ConfigComponent`.
- Tích hợp datetime `1.0.3` trước đó đã được ship lên `release/1.3`; các known gap ngoài task design nằm trong `.sdcorejs/tasks/angular.md`.

## Freshness

- Summary phản ánh branch `release/1.3` tại HEAD `5602da4c2e853a18216a3c21ab4ac9e01e1892ac`.
- Source evidence được kiểm tra ngày 2026-07-15; working tree có design handoff và context artifacts của phiên hiện tại, không có production path bị sửa.

---
updated_at: 2026-07-15T22:24:20+07:00
status: in_progress
track: angular
active_skill: sdcorejs-spec
branch: release/1.3
---

# Current Session Checkpoint

## User Request

Gỡ hoàn toàn AuthOM khỏi Core UI và demo vì người dùng không muốn thư viện liên quan đến OM; người dùng chọn purge cả repository history.

## Tasks

- [x] Map AuthOM trong Core UI/public API và ba Angular version
- [x] Map AuthOM trong Showcase, docs và release archives
- [x] Chốt hard-purge và acceptance direction
- [x] Viết draft spec + design record, rồi self-review
- [ ] Xin duyệt written spec và tạo approved snapshot
- [ ] Lập implementation plan trước khi xóa code
- [ ] Thực thi removal, sync và verification

## Current State

- Last completed: Đã tạo và kiểm tra planning-only commit gồm đúng ba artifact tài liệu.
- In progress: Chờ người dùng duyệt written spec để tạo immutable approved snapshot trước khi lập implementation plan.
- Blocked/skipped: Production source chưa thay đổi; không push, tag, publish hoặc deploy.

## Artifacts Touched

- ADD `.sdcorejs/docs/angular/2026-07-15-22-03-remove-authom-hard-purge-spec.md` - editable draft spec.
- ADD `docs/superpowers/specs/2026-07-15-remove-authom-hard-purge-design.md` - approved design record.
- EDIT `.sdcorejs/tasks/current-session.md` - resume checkpoint cho removal workflow.

## Verification

- Read-only Core UI/Showcase audits - complete; no production edits.
- Inventory proof - pass: 31 archives, 187 direct-match files, 8 old feature records, 24 Core UI module files và 6 Showcase reference files.
- Prettier, required sections, 13 acceptance criteria, placeholder scan và `git diff --check` - pass.
- Git scope check - pass; không có path `versions/**` bị sửa trong spec stage.
- Planning commit - pass: `docs(angular): specify AuthOM hard purge`; đúng ba path, không có production source hoặc `.superpowers/**`.

## Resume From Here

Trình written spec approval gate; nếu được duyệt, tạo immutable approved snapshot rồi chuyển sang implementation planning.

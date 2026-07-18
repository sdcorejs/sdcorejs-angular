# Gỡ AuthOM toàn repository — 2026-07-16 03:39

## What was requested

Người dùng yêu cầu bỏ hoàn toàn AuthOM khỏi Core UI và demo vì không muốn thư viện liên quan đến OM, đồng thời chọn hard-purge source hiện hành, hồ sơ lịch sử trong working tree và 31 published-doc archives. Không tạo compatibility stub và không thực hiện release/Git mutation nếu chưa được cho phép riêng.

## What was changed

- DELETE `versions/{v19,v20,v21}/projects/sdcorejs-angular/modules/authom/**` — bỏ secondary entrypoint, source, package config và module doc.
- EDIT `versions/{v19,v20,v21}/projects/sdcorejs-angular/modules/index.ts` cùng README/module docs — bỏ export và cross-link, giữ Auth, Keycloak, Permission, Layout và Icon.
- EDIT `versions/{v19,v20,v21}/projects/showcase/src/app/docs/**` — bỏ registry page và legacy Markdown expectation; giữ tổng 253 live examples.
- DELETE/EDIT `docs/superpowers/**` và các mirror version — xóa đúng tám feature records cũ, làm sạch 15 incidental-history records.
- DELETE/EDIT `published-docs/**` — xóa 31 module documents, sửa 31 indexes, 124 direct cross-docs, manifest và catalog trong allowlist 188 path.
- EDIT `scripts/generate-showcase-example-sources.test.mjs` và `scripts/generate-showcase-route-shells.test.mjs` — bổ sung catalog parity và cập nhật invariant 84 pages, 10 module pages, 1.291 routes.
- EDIT 24 Core UI file tại v19, rồi sync sang v20/v21 — sửa 25 Prettier/EOL findings, xóa một stale ESLint disable và đổi `ISdIconResolvedConfiguration` từ empty interface sang type alias cùng structural shape.
- EDIT `.sdcorejs/tasks/current-session.md` — lưu các gate, lựa chọn và bằng chứng tiếp tục.

## Decisions made

- v19 là source of truth; v20/v21 chỉ nhận thay đổi qua root sync.
- Browser UI proof của legacy documentation URL được người dùng defer vì cả in-app browser và Chrome discovery đều không có backend; HTTP/route tests vẫn là bằng chứng tự động.
- Người dùng chọn mở rộng scope để sửa toàn bộ baseline lint debt; `lint:release` hiện pass cả ba workspace.
- Người dùng duyệt bổ sung route-shell invariant test dù path chưa được ghi tường minh trong allowlist plan ban đầu.
- Documentation gate và independent review đều được người dùng chọn skip.
- Không commit, push, tag, publish hoặc deploy trong session này.

## Verification

- Core focused tests: 109/109 pass.
- Showcase focused tests: 21/21 pass; generator suite: 25/25 pass; published-doc integrity: 1/1 pass.
- Library production builds v19/v20/v21 và v19 Showcase production build: exit 0.
- `lint:release`, `check:sync`, structural absence, dist export guard và `git diff --check`: exit 0.
- 31 archives/124 cross-docs: zero semantic errors; 2.423 protected hashes unchanged.
- Protected OneMount comparison: 224/224 occurrences unchanged.
- Branch references remain unchanged; staged files remain zero.

## Open questions / follow-ups

- Browser UI not-found và console/network smoke cho legacy documentation URL vẫn manual pending đến khi browser backend khả dụng.
- Pre-commit hygiene remains blocked by unstaged/uncommitted changes; future staging must exclude the unrelated `.superpowers/**` files and nine status-only generated Showcase files.

## Product traceability

- Không có product ledger riêng; approved spec là `.sdcorejs/specs/angular/2026-07-15-22-29-remove-authom-hard-purge.md`.
- Status: implementation verified; one explicitly deferred manual browser criterion.

## Next suggested action

- Khi người dùng cho phép commit, stage bằng allowlist; không dùng `git add -A` và không đưa `.superpowers/**` hoặc status-only generated files vào commit.
- Khi browser backend khả dụng, chạy lại legacy documentation not-found UI và console/network smoke.

## Skill provenance

Skills invoked this session: `sdcorejs-using-skills` -> `sdcorejs-brainstorming` -> `sdcorejs-spec` -> `sdcorejs-plan` -> `sdcorejs-execute-plan` -> `sdcorejs-test` -> `sdcorejs-documentation` -> `sdcorejs-repair-loop` -> `sdcorejs-ship`; browser control fallback was attempted and unavailable.

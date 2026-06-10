# Published Docs Tag Workflow — 2026-06-10 00:14

## What was requested
Người dùng muốn `published-docs` của `@sdcorejs/angular` không còn generate thủ công cho version đã publish như `19.0.4`, mà phải chạy theo hook/tag release. Khi đánh tag release như `v0.5`, workflow phải sinh docs tương ứng sau khi publish npm và sinh đồng thời cho `19.x`, `20.x`, `21.x`.

## What was changed
- EDIT `.github/workflows/publish-npm.yml` — thêm preflight tag phải trỏ `origin/main`, validate patch, và thêm job `publish-docs` chạy sau matrix publish thành công.
- EDIT `.github/workflows/deploy-pages.yml` — mở path trigger thành `scripts/collect-*.mjs`.
- EDIT `scripts/collect-docs.mjs` — collector nhận `--workspace v19|v20|v21`, validate major/version, hỗ trợ `--out-root`, `--skip-existing`, `--force`, và không overwrite archive đã có mặc định.
- CREATE `scripts/collect-release-docs.mjs` — wrapper release patch sinh docs đủ `19.<patch>`, `20.<patch>`, `21.<patch>`.
- EDIT `package.json` — thêm script `collect-release-docs`.
- EDIT `README.md` — ghi rõ docs được sinh từ tag publish workflow sau khi npm publish thành công.
- EDIT `CLAUDE.md` — cập nhật release ritual, generator docs, trạng thái npm publish hiện tại.

## Decisions made
- Không generate hoặc overwrite `published-docs/19.0.4` trong phiên này vì version đó đã publish trước đó.
- `published-docs` public được buộc vào tag flow; `workflow_dispatch` vẫn publish/debug thủ công nhưng không tự tạo docs public.
- Tag release phải đang trỏ đúng `origin/main` trước khi publish để tránh npm/docs lệch source.
- Archive docs chỉ được commit về `main` sau khi cả ba package `19/20/21` publish thành công.

## Verification
- `npm view @sdcorejs/angular versions --json` xác nhận npm đã có `19.0.4`, `20.0.4`, `21.0.4`.
- `node --check scripts/collect-docs.mjs` và `node --check scripts/collect-release-docs.mjs` passed.
- `npm run collect-docs -- --workspace v19 --version 19.0.4 --skip-existing` skipped archive cũ, không overwrite.
- `npm run collect-release-docs -- --patch 0.5 --date 2026-06-10 --out-root .tmp/published-docs-test --skip-existing` tạo thử đủ `19.0.5`, `20.0.5`, `21.0.5`, mỗi version 79 docs, `latest=21.0.5`.
- `.tmp` đã được xoá sau khi verify; `published-docs/**` thật không bị chỉnh.
- `git diff --check` passed, chỉ có cảnh báo line ending CRLF/LF của Git trên Windows.

## Open questions / follow-ups
- Khi tag thật `v0.5` chạy trên GitHub Actions, cần quan sát job `publish-docs` có quyền push commit về `main` không; branch protection có thể cần allow GitHub Actions bot.
- Cần quyết định riêng có xoá/regenerate artifact `published-docs/19.0.4` hiện có hay giữ lại cho tới release kế tiếp.

## Next suggested action
- Push một release tag mới như `v0.5` sau khi changelog/sync sẵn sàng, rồi kiểm tra workflow tạo commit `docs: publish API docs for v0.5`.
- Sau khi Pages deploy, mở `/docs/versions.json` để kiểm tra có đủ `19.0.5`, `20.0.5`, `21.0.5`.

## Skill provenance
Skills invoked this session: `sdcorejs-debug` (maintenance/root-cause flow) → `sdcorejs-auto-docs` → `sdcorejs-auto-task-tracker`.

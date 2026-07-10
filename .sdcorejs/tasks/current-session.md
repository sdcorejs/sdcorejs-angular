---
updated_at: 2026-07-10T11:22:23+07:00
status: complete
track: angular
active_skill: sdcorejs-documentation
branch: docs/release-1.0-prep
---

# Current Session Checkpoint

## User Request
Cap nhat docs/release text de chuan bi release suffix `1.0` publish `19.1.0`, `20.1.0`, `21.1.0`, roi kiem tra duong merge vao `main`.

## Tasks
- [x] Xac dinh pham vi docs/version prep va trang thai git hien tai
- [x] Cap nhat docs/release text can thiet cho cac version `19.1.0`, `20.1.0`, `21.1.0`
- [x] Chay kiem tra phu hop cho thay doi docs
- [x] Kiem tra readiness truoc khi merge/PR vao `main`
- [x] Tong ket thay doi, verification, va phan con lai neu bi chan

## Current State
- Last completed: Docs/release verification passed; moved the dirty release-prep diff onto safe branch `docs/release-1.0-prep`.
- In progress: None.
- Blocked/skipped: Direct merge into `main` is not performed locally; use PR/merge after commit and push.

## Artifacts Touched
- EDIT `.sdcorejs/tasks/current-session.md` - current task checkpoint.
- EDIT `README.md`, `versions/v19/README.md`, `versions/v20/README.md`, `versions/v21/README.md` - document `v1.0` publish mapping.
- EDIT `CHANGELOG.md` - add release `1.0` entry.
- EDIT `CLAUDE.md` - update release ritual wording from patch to release suffix.
- EDIT `.github/workflows/publish-npm.yml` - update release-facing comments and dispatch help text.
- EDIT `scripts/collect-docs.mjs`, `scripts/collect-release-docs.mjs`, `scripts/deploy.ps1` - update release suffix examples/help text only.
- EDIT `versions/v19|v20|v21/projects/sdcorejs-angular/services/confirm/sd-confirm.md` - repair default button label mojibake before docs collection.

## Verification
- PASS: `git diff --check`
- PASS: stale wording grep for `v<patch>`, `19.<patch>`, old `0.5` examples, and `CÃ³`/`KhÃ´ng`
- PASS: `node --check scripts/collect-docs.mjs`
- PASS: `node --check scripts/collect-release-docs.mjs`
- PASS: PowerShell parser check for `scripts/deploy.ps1`
- PASS: `node scripts/collect-release-docs.mjs --patch 1.0 --out-root <temp> --skip-existing` generated `19.1.0`, `20.1.0`, `21.1.0`

## Resume From Here
Ready to create a safe commit/PR path for these docs, or move the diff to a non-protected branch before merge into `main`.

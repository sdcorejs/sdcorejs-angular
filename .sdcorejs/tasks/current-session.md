---
updated_at: 2026-07-15T01:35:58+07:00
status: complete
track: angular
active_skill: sdcorejs-ship
branch: release/1.3
---

# Current Session Checkpoint

## User Request

Tích hợp `@sdcorejs/angular-material-datetime@1.0.3` vào `sd-datetime` của `@sdcorejs/angular` trên Angular 19-21, rồi commit và push lên nhánh `release/1.3`.

## Tasks

- [x] Khảo sát package, code hiện tại và duyệt spec/plan `1.0.3`
- [x] Chốt chế độ thực thi song song an toàn
- [x] Chứng minh RED trước khi đổi dependency
- [x] Pin `1.0.3` ở v19 và xác nhận GREEN
- [x] Sync sang v20/v21 và cập nhật lockfile riêng
- [x] Kiểm chứng song song focused test/build/dependency cho 3 Angular major
- [x] Kiểm tra invariant, UI smoke trong khả năng môi trường và protected paths
- [x] Chạy Full tests và phân loại 18 lỗi baseline ngoài datetime diff
- [x] Hoàn tất review/repair, technical doc, user guide, memory và task tracker
- [x] Chạy verify-before-done và lập ma trận acceptance
- [x] Người dùng yêu cầu ship sau khi đã được công bố AC-7, AC-8, strict AC-9 và full-suite baseline; giữ các gap ở trạng thái deferred/known
- [x] Xác định target mới `release/1.3` và dry-run push thành công
- [x] Repair lint line-ending cho datetime source/spec và sync lại v20/v21; scoped lint pass cả ba workspace
- [x] Chạy fresh acceptance verification cho ship-with-known-gaps
- [x] Stage 74 path đúng phạm vi và chạy branch hygiene read-only; không có secret/conflict/debug/focused-test/binary blocker
- [x] Commit và push không force lên `origin/release/1.3`; remote feature SHA khớp `f66de9c288e696cda26947bff0984b6f4185215a`

## Current State

- Last completed: feature commit `f66de9c` đã push lên `origin/release/1.3`; local/remote SHA khớp và working tree sạch.
- Passing evidence: focused datetime `66/66` và production build đạt trên v19-v21; sync, exact `1.0.3`, dist metadata, vendored-source removal, diff và protected-path assertions đều đạt.
- Blocked: AC-7 chưa đạt hoàn toàn vì deep `npm ls` v20 exit 1 do Angular peer-minor mismatch đã tồn tại trong HEAD; AC-8 chưa chạy visual/click smoke vì không có browser khả dụng.
- Baseline gate: full library suite của cả ba workspace cùng có `3156 pass, 18 fail, 9 skip`; 18 lỗi thuộc Chip/ChipCalendar/Input/InputNumber/Inform/AnchorNav/QuerySavedFiltersMenu, không thuộc datetime diff. v19-v21 cũng không đạt coverage thresholds toàn cục.
- Ship status: delivered as ship-with-known-gaps theo yêu cầu người dùng; không tag, publish npm, tạo GitHub Release hoặc force-push.
- Scope note: screenshot capture script và root memory index là finish-tail artifacts do documentation/memory workflow yêu cầu nhưng nằm ngoài literal allow-list của approved plan; approved snapshots giữ nguyên và production migration scope không mở rộng.

## Artifacts Touched

- ADD `.sdcorejs/docs/angular/2026-07-14-23-23-integrate-angular-material-datetime-1-0-3-spec.md` - draft change-control.
- ADD `.sdcorejs/specs/angular/2026-07-14-23-27-integrate-angular-material-datetime-1-0-3.md` - approved immutable snapshot.
- ADD `.sdcorejs/docs/angular/2026-07-14-23-29-integrate-angular-material-datetime-1-0-3-plan.md` - approved plan source.
- ADD `.sdcorejs/plans/angular/2026-07-14-23-46-integrate-angular-material-datetime-1-0-3.md` - approved immutable plan snapshot.
- EDIT `.sdcorejs/summary.md` - refreshed project context.
- EDIT `.sdcorejs/tasks/current-session.md` - execution checkpoint.
- ADD `.sdcorejs/docs/angular/2026-07-15-00-37-integrate-angular-material-datetime-1-0-3.md` - session auto-doc.
- ADD `.sdcorejs/documentation/technical-docs/integration-angular-material-datetime-1-0-3.md` - technical integration guide.
- ADD `.sdcorejs/documentation/user-guides/datetime.md` - user guide và acceptance coverage.
- ADD `.sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs` - optional screenshot capture script.
- ADD `.sdcorejs/memories/angular/test-dist-can-shadow-source.md` và EDIT `.sdcorejs/memories/MEMORY.md` - durable test-resolution note.
- EDIT `.sdcorejs/tasks/angular.md` - follow-up work cho baseline tests, Angular 20 dependency tree và browser smoke.

## Verification

- `npm view @sdcorejs/angular-material-datetime@1.0.3 ...` - registry metadata/APF/peer range đã xác nhận trong planning.
- `npm run check:sync` - pre-plan expected RED chỉ ở datetime/package drift v20/v21.
- `npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime@1.0.3 --depth=0` - expected RED, exit 1.
- Focused v19 `datetime.component.spec.ts` - expected RED, không resolve được external package trước install.
- `npm --prefix versions/v19 install @sdcorejs/angular-material-datetime@1.0.3 --save-exact --legacy-peer-deps` - pass.
- Focused v19 `datetime.component.spec.ts` - GREEN trước rollout.
- `npm run sync` - pass; v20/v21 nhận wrapper/tests/docs và xóa vendored picker.
- Exact install v20/v21 - pass; mỗi workspace resolve `1.0.3`.
- `npm run check:sync` - pass sau rollout.
- Focused datetime tests v19/v20/v21 sau repair - `66/66` mỗi workspace, exit 0.
- Production builds v19/v20/v21 sau repair - exit 0.
- Full library tests v19/v20/v21 - mỗi workspace `3156 success, 18 failed, 9 skipped`, exit 1; cùng 18 lỗi ngoài datetime diff và coverage threshold failures.
- Deep dependency tree v19/v21 - pass; v20 exact package resolve pass nhưng deep tree exit 1 do baseline Angular peer-minor mismatch.
- Dist/workspace/library/lock metadata assertions - pass, exact `1.0.3` trên cả ba version.
- Vendored-source, entrypoint, sync, diff, scope và protected-path assertions - pass.
- Showcase `/forms/datetime` - serve/HTTP 200 ở lần smoke trước; fresh browser discovery trả `No browser is available`, nên visual/click smoke chưa chạy.
- Independent code review - finding High ban đầu về draft value đã repair bằng `setValue(...)` trước `open()`; review cuối Critical/High/Medium/Low đều 0.
- `npm run check:sync`, `git diff --check`, exact metadata 15/15 và vendored-source assertions - fresh pass sau repair/docs.
- Scoped ESLint cho `datetime.component.ts` và `datetime.component.spec.ts` - pass trên v19/v20/v21 sau Prettier + sync; full release lint vẫn cần phân loại baseline ngoài scope.
- Fresh focused datetime tests - v19/v20/v21 đều `66/66`, exit 0.
- Fresh production builds - v19/v20/v21 đều exit 0; dist metadata exact `1.0.3` và FESM có `setValue()` trước `open()`.
- Fresh full library suites - mỗi workspace `3156 success, 18 failed, 9 skipped`, cùng danh sách lỗi ngoài datetime và coverage thresholds; không có datetime failure.
- Fresh full release lint - exit 1 với 27 vấn đề ở v19, tất cả file đều ngoài commit; approved plan ghi full lint không phải gate riêng. Scoped datetime lint pass.
- Fresh deep dependency tree - v19/v21 exit 0; v20 exit 1 do peer-minor mismatch đã công bố.
- Fresh browser discovery - `No browser is available`; AC-8 giữ deferred.
- Fresh `check:sync`, `git diff --check`, exact metadata 15/15, dist FESM, vendored scan và protected-path assertions - pass.
- `git commit` - feature commit `f66de9c288e696cda26947bff0984b6f4185215a` tạo thành công, 74 files.
- `git push -u origin release/1.3` - pass; remote feature SHA khớp local và upstream là `origin/release/1.3`.
- Finish Gate tests - user chọn `full`.
- Documentation Gate - user chọn tạo cả `user-guide` và `technical-doc`.
- Finish Gate review - user chọn chạy review + repair loop.

## Resume From Here

Không còn bước active. Các known gaps vẫn nằm trong `.sdcorejs/tasks/angular.md`; xử lý ở task riêng trước khi merge/release production nếu cần.

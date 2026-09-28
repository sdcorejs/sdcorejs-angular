---
artifact_id: evidence-angular-core-3-0-release-20260925-baseline
artifact_kind: execution-doc
schema_version: 1
owner: sdcorejs-execute-plan
contract_id: angular-core-3-0-release-20260925
change_ref: angular-core-3-0-release-20260925
source_spec: .sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md
source_architecture: .sdcorejs/architecture/angular/2026-09-25-18-30-core-3-0-release.md
source_plan: .sdcorejs/plans/angular/2026-09-25-19-05-core-3-0-release.md
task: TASK-001
commit_policy: with-change
created_at: 2026-09-25T22:50:00+07:00
---

# Baseline — Core UI release 3.0

Biên bản baseline của TASK-001 (plan r3). Ghi lại trạng thái **trước khi sửa code**, để phân biệt lỗi có sẵn với lỗi do release 3.0 gây ra. Không sửa lỗi nào ở bước này.

## Preflight

| Mục | Giá trị |
|---|---|
| Worktree | `C:/wt/core-3.0` |
| Branch | `release/3.0` (tạo từ `origin/main`) |
| HEAD | `726df9964721a10740cb7bdd6e100a03307ef39a` |
| Staged / unstaged | không có |
| Untracked | chỉ artifact `.sdcorejs/**` của chính workflow này (spec, kiến trúc, plan và bản nháp) |
| File ngoài plan đang bẩn | không có |
| Toolchain | Node 22.22.3, npm 10.9.8 (qua fnm) |
| Cài đặt | root `npm ci`; `versions/v19` và `showcase` `npm ci --legacy-peer-deps`. Tất cả exit 0, không đổi `package-lock.json` nào |

## Kết quả

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| v19 `npm run lint` | pass | "All files pass linting." |
| v19 `npm run build` | pass | Build mất ~77 phút vì máy quá tải (CPU 100%, phần lớn là tiến trình `System`). |
| v19 `npm run test:ci` | **không chạy được (môi trường)** | Chrome Headless bị ngắt 3 lần ("no message in 180000 ms"), 0/5638 spec được chạy, exit 1. Không phải lỗi code. Xem mục bên dưới. |
| root `npm run test:scripts` | pass | 12 suite, 168 test, 0 fail |
| root `npm run test:theme` | pass | 14 test, 0 fail |
| root `npm run check:sync` | pass | v20, v21, v22 khớp v19 |
| showcase `npm run build` | pass | 480 s. Chỉ có cảnh báo CommonJS có sẵn (`prismjs`, `exceljs`, `fuzzysort`, `extend`). |

## Unit test v19 chạy lại

Lần chạy `test:ci` thất bại vì bundle có coverage quá nặng so với máy đang quá tải, nên Chrome bị coi là chết trước khi chạy spec đầu tiên. Chạy lại cùng suite với:

- `ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --source-map=false`, không bật coverage;
- một file Karma config tạm (ngoài repo) chỉ `require` config của repo rồi nới timeout của trình duyệt. Không sửa file nào trong repo.

Kết quả lần chạy lại: **pass — 5638/5638 spec, 0 fail, 0 skip** (2 phút 41 giây chạy trong Chrome; seed Jasmine `410857`). Không có lỗi unit test nào có sẵn.

Hệ quả cho các bước sau: chạy unit test (tập trung hoặc toàn bộ) dùng cùng cách này. Riêng số coverage của `test:ci` chưa đo được trên máy này; TASK-030 sẽ thử lại, nếu vẫn không được thì ghi rõ là bỏ qua vì môi trường.

## Cách dùng biên bản này

- Mọi lệnh ở trên pass (hoặc chạy lại pass) là mốc so sánh cho TASK-030.
- Nếu full suite ở TASK-030 có spec đỏ, đối chiếu với lần chạy lại ở đây. Spec đỏ ở cả hai là lỗi có sẵn, được ghi lại chứ không sửa trong release này.

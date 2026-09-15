---
artifact_id: 2026-09-15-inform-verification
artifact_kind: execution-doc
change_ref: inform-2.13
source_spec: none
source_plan: .sdcorejs/plans/angular/2026-09-15-inform-tip.md
commit_policy: with-change
owner: angular-integration
---

# SdInform: outline icons, content projection và title alignment

## Phạm vi và kết quả

- Cập nhật `main` bằng fast-forward đến `47a45e4ff815559dd3c56d1a1cd9fa913d25e94e`; working tree ban đầu sạch.
- Sửa source canonical v19 và dùng `npm run sync` cho v20/v21/v22.
- Warning/error dùng glyph outline `warning_amber` / `report_gmailerrorred`. Bổ sung alias Lucide cho glyph error; giữ provider và input override của consumer.
- Default `ng-content` thay vùng title/description/toggle/action. Icon và close vẫn thuộc khung ngoài. Không có default content thì giữ inputs và slot `sdInformAction` như trước.
- Title không có description có chiều cao tối thiểu bằng icon tile 32px và căn giữa, kể cả khi có action.
- Showcase thêm hai nhóm examples; registry và generated example sources cập nhật từ 5 lên 7 nhóm.

## Root cause ledger

| ID | Bằng chứng | Kết luận |
| --- | --- | --- |
| H1 | Map dùng `warning` / `error`; kiểm tra glyph trong font bundled | Các glyph này hiển thị fill; dùng glyph outline rõ ràng. |
| H2 | Template chỉ có projection selector `sdInformAction` | Nội dung tổng quát không được render. Dùng native projection fallback cho vùng nội dung. |
| H3 | Title 20px, icon tile 32px, flex-start | Repro đo được lệch tâm 6px. Sau sửa đo được 0px. |

## Verification

Runtime test/build: Node 22.22.3, npm, Windows, Chrome Headless 153.

| Kiểm tra | Kết quả |
| --- | --- |
| Regression trước sửa | 5 fail / 1 pass: projection, 2 glyphs, 2 alignment cases |
| Focused inform suite sau sửa | 58 pass, gồm Material và consumer Lucide provider |
| `npm test -- --watch=false --browsers=ChromeHeadless` tại v19 | 5.455 pass; sau đó bổ sung 2 Lucide cases và chạy lại focused suite 58 pass |
| `npm run build` tại v19 | Pass |
| `npm run build` tại showcase | Pass; có warning CommonJS dependencies hiện hữu |
| `npm run test:scripts` | Pass; sửa registry demo count sau lần đầu phát hiện 7 examples nhưng khai báo 5 |
| `npm run check:sync` | Pass cho v20/v21/v22 |
| ESLint trên inform component/template/regression spec và icon model | Pass |
| Browser desktop 1280px và mobile 390px | Ba title-only cases lệch tâm icon 0px; mobile không tràn ngang |
| Browser custom content | Nội dung fallback không hiển thị; custom action tăng counter; close dismiss banner |
| `git diff --check`, mojibake scan | Pass |

## Debug / ship context

- `source`: sdcorejs-debug; `debug_mode`: wrong-behavior; `bug_class`: unknown (presentation/projection); `stack_profile`: core-ui-angular.
- `repro_status`: local-confirmed; `root_hypothesis_id`: H1/H2/H3; `confidence`: high.
- `environment`: local; `package_manager`: npm; `secret_redaction`: không đưa secrets hoặc dữ liệu production vào evidence.
- `files_touched`: inform source/spec/docs, icon alias/docs, showcase demo/registry/generated sources, version mirrors.
- `diagnostic_instrumentation`: không còn instrumentation trong production code.
- `verification_mode`: bugfix-verification; scope theo yêu cầu trực tiếp của user.
- Không chạy release/publish hay build từng major dẫn xuất; đây là bản sửa local, chưa commit/push.
- Local static preview phục vụ live examples; published-docs endpoints không được mount trong preview server nên phần archive báo lỗi tải, không ảnh hưởng việc kiểm tra live component.

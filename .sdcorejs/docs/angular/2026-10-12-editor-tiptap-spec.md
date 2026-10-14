---
artifact_id: editor-tiptap-spec-r1
artifact_kind: execution-doc
change_ref: editor-minieditor-tiptap-oss
source_spec: none
source_plan: none
commit_policy: with-change
owner: core-editor-integration
status: technically-reviewed-contract
source_revision: 7ef19d2115e949f1fa6ff6a3afbd4fc5ee9a8eca
---

# Editor và MiniEditor dùng Tiptap OSS

## Authority và phạm vi

User đã yêu cầu xây Editor và MiniEditor trước, dùng Tiptap OSS, chung engine/schema và hai toolbar CoreUI; DocumentEditor bàn sau. Handoff tiếp theo yêu cầu tiếp tục implementation, không hỏi lại quyền xây, với inventory, spec/plan được review, TDD và independent review. Đây là contract triển khai dựa trên chỉ dẫn đó, không phải snapshot được user duyệt riêng tại gate của skill. Không tạo approval hash hoặc giả lập approval. Áp dụng quy trình spec/plan/design/review; chỉ dẫn trực tiếp tiếp tục xây có ưu tiên hơn gate hỏi lại quyền trong skill.

Owner: `sdcorejs/sdcorejs-angular`, role library, track angular, profile core-ui-angular. Source of truth `versions/v19/projects/sdcorejs-angular`; v20–v22 chỉ sinh bằng sync. Nhánh `feat/editor-minieditor-tiptap-oss`, base ở frontmatter. AGENTS/CLAUDE thuộc docs owner, không sửa.

## Problem và goals

Thay engine CKEditor bằng Tiptap OSS với adapter Angular do Core sở hữu. Hai component giữ contract binding phổ biến; MiniEditor có toolbar gọn nhưng phải đọc/ghi được cùng rich document. Import không được tự âm thầm làm mất node/thuộc tính hoặc ghi lại dữ liệu cũ. Tiptap schema không phải sanitizer.

## Requirements

- R-001 (explicit): cùng schema/engine cho cả hai component, hai toolbar phù hợp CoreUI.
- R-002 (source contract): giữ selectors/entrypoints, Editor model/modelChange + sdChange/sdFocus/sdBlur + form/name/validation và Mini value/valueChange/contentChange + CVA/focus/blur/common methods.
- R-003 (explicit): HTML làm giá trị chính. Mini Markdown là chế độ compatibility hiện có; conversion phải có chẩn đoán khi không thể biểu diễn rich HTML.
- R-004 (explicit): giữ HTML chưa edit byte-for-byte trong giá trị; import unsupported giữ nguồn, hiển thị cảnh báo và khóa edit. Không tự emit normalization từ initial/external write.
- R-005 (explicit): input/paste/output, link/image URL, upload result đều qua boundary an toàn. Không trusted HTML bypass, không embed active content.
- R-006 (source contract): Editor upload deferred/immediate, token/key/callback/result metadata/validation/batch/concurrency giữ được; callback chưa hỗ trợ cancellation thật thì chỉ bỏ kết quả stale.
- R-007 (explicit): SSR/hydration, cleanup, forms/OnPush/zoneless, VI/EN, keyboard/focus/a11y, composition và responsive.
- R-008 (explicit): CK-specific constructor/config/plugin/instance/types phải migration/deprecation thật; không tạo CK facade giả.
- R-009 (explicit): demos, migration guide, OSS notices, đo bundle thật, bốn Angular major và packed consumers.

## Decisions

- D-001 (user): Tiptap OSS; exclude Pro, Pages, conversion service, collaboration, tracked changes, DOCX/DocumentEditor.
- D-002 (user): adapter Angular owned by Core; không thêm React/Vue wrapper.
- D-003 (implementation default, review required): unsupported safe HTML giữ nguồn và read-only với diagnostics; không thêm nút tự động chuyển đổi mất dữ liệu. Pasted unsupported HTML bị từ chối nguyên thao tác và báo lý do.
- D-004 (implementation default, review required): canonicalization chỉ phát sau user edit; serializer giữ attrs được hỗ trợ. Semantically changed/unsupported attrs phải được phát hiện trước cho edit.
- D-005 (source-informed): sửa Mini CVA touched/disabled và external value sync theo contract Angular; giữ Editor là form/name connector, không đổi sang CVA ngoài yêu cầu.
- D-006 (source-informed): các CK config public surfaces được thay bằng Core-owned types + migration notes; không mang `ckeditor5` vào type/public build để giả tương thích.
- D-007 (source-informed): `sd-ckeditor-styles` giữ export/selector compatibility nhưng deprecated, chỉ nạp shared content styles; tên mới không bắt buộc consumer đổi ngay.
- D-008 (source-informed): giữ contract character counter hiện có: UTF-16 text length, bỏ img và toàn bộ figure; không âm thầm đổi validator/count semantics trong engine migration. Ghi rõ limitation table/caption trong figure không được đếm.
- D-009 (implementation default): Mini effective disabled là `disabled input || CVA disabled`; readonly input không được tự thêm. External write hủy pending emission cũ và giữ caret/history nếu là echo cùng giá trị.

## Assumptions và risks

- A-001: không có production HTML corpus được cấp. Tests dùng fixture hiện có và corpus tổng hợp có provenance rõ; không tuyên bố migration toàn bộ dữ liệu downstream đã pass.
- A-002: Chromium có thể chạy; Safari/iOS và Telex/VNI người dùng thật có thể không có trong máy này. Synthetic composition/mobile viewport ghi rõ giới hạn; không giả manual pass.
- A-003: raw CK plugin/config consumption không tìm thấy trong bounded Portal checkout nhưng downstream khác có thể có; migration là breaking và cần public docs/changelog.
- A-004: bundle không chắc nhỏ hơn. Đo build baseline và replacement cùng fixture/config; report raw/gzip/brotli cùng toolchain.

## Architecture gate

Required: thay dependency/engine, trust boundary và public migration. Shared adapter, schema/import/export và upload ownership phải review trước production writes. Technical architecture ở artifact cạnh spec; không ghi user-approved immutable snapshot khi chưa có approval riêng.

## Acceptance criteria

- AC-001: cả hai mount cùng extension schema; Mini edit basic text không xóa table/image/caption/marks được hỗ trợ.
- AC-002: paragraphs, six headings, strong/em/u/strike/code/sub/sup, nested lists, ordered start/type, links, alignment, font/color/size, tables colspan/rowspan, image figure/caption và mention fixtures round-trip có kiểm chứng.
- AC-003: safe attrs/data/aria/styles đã hỗ trợ giữ semantics; unsupported tags/attrs được chẩn đoán trước edit. Không tự emit initial/external writes; source HTML unchanged đến user edit.
- AC-004: unsafe HTML/URL/CSS không được mount active hoặc phát ra; unsupported paste atomic reject, plain text paste hoạt động.
- AC-005: Editor model/form/name rebinding, required/maxlength/custom/inline validation, disabled/readonly và FocusEvent outputs đúng.
- AC-006: Mini direct value/CVA writes sync trước/sau mount, touched khi blur, setDisabledState + disabled input kết hợp, outputs/callbacks đúng.
- AC-007: Editor debounce 100ms; Mini throttle 500ms leading/trailing, composition không phát giữa IME và external echoes không reset caret/history.
- AC-008: shared engine destroy idempotent, listeners/timers/object URLs dọn sạch; browser-only creation, SSR không tham chiếu DOM lúc import/init.
- AC-009: CoreUI toolbar semantics thực ở native controls, pressed/mixed/disabled đúng, keyboard navigation, focus/selection giữ khi dùng popup; VI/EN labels.
- AC-010: mobile toolbar responsive và touch target bằng Core token; không che caret ở viewport đã thử.
- AC-011: upload immediate/deferred có validation, bounded batches/concurrency, cardinality/result URL checks, metadata, failure retry, remove/replacement/destroy races và cleanup.
- AC-012: Mini mentions insert/get/delete/feeds có library-owned contracts; unsupported renderer/config migration báo rõ.
- AC-013: Markdown compatibility HTML boundary safe; rich unsupported markdown conversion không silently emit loss.
- AC-014: no CK package imports/runtime/styles remain except deprecated compatibility name/docs; license notices verify actual installed OSS dependencies.
- AC-015: focused TDD RED→GREEN evidence, four-major build/test, sync/scripts/i18n, Showcase + packed consumers; independent API/design/security/correctness review exact diff.
- AC-016: screenshots thật và bundle receipt; Safari/manual IME unavailable ghi pending. Draft PR only sau gates đủ, không merge/tag/publish/deploy.

## Non-goals

DocumentEditor, DOCX import/export, Pro/paid APIs, release suffix/version changes, published archives/pages, AGENTS/CLAUDE/conventions/summary rewrites, code-editor/image-editor refactor.

## Migration

Breaking engine-specific public types/methods được liệt kê trong migration guide và Unreleased changelog. Common Angular selectors/binding/IO/upload token giữ tên. Không hứa tương thích với CK plugins/config/ClassicEditor instance. Unsupported input phải có đường giữ nguyên dữ liệu và diagnostics trước rollout.

Review repair acceptance for AC-007/013: successful format conversion preserves the latest live document in CVA/outputs at the retained cadence deadline. Unsupported conversion pauses export and retains HTML; restoring a supported format delivers the pending edit. An authoritative value plus format update imports atomically and remains silent. Initial/external imports cannot be undone into a superseded source.

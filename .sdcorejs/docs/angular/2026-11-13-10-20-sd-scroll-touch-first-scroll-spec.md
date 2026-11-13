---
artifact_id: "draft-spec-sd-scroll-touch-first-scroll-core-ui-r1"
artifact_kind: "execution-doc"
change_ref: "sd-scroll-touch-first-scroll-core-ui"
commit_policy: "with-change"
owner: "sdcorejs-spec"
owner_module_id: "directives/sd-scroll"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
repository_relative_path: ".sdcorejs/docs/angular/2026-11-13-10-20-sd-scroll-touch-first-scroll-spec.md"
schema_version: 1
source_plan: "none"
source_revision: "184e557f1245b762557119cc806f9ce0477f0a2c"
source_spec: "none"
stack_profile: "core-ui-angular"
status: "draft"
track: "angular"
---

# Spec - sdScroll cuộn ngang được ngay lần chạm đầu (Core UI) - 2026-11-13 10:20

- contract_id: `sd-scroll-touch-first-scroll-core-ui`
- Track / profile: angular / core-ui-angular (độ tin cậy cao: `versions/v19/projects/sdcorejs-angular`, import `@sdcorejs/angular/directives` trong `components/table`, `AGENTS.md` (v19 là nguồn, v20-v22 dẫn xuất))
- Chủ sở hữu: repo `sdcorejs-angular`, module `directives/sd-scroll`
- Bản Core Legacy (`@sd-angular/core`) có spec riêng trong repo `lib-core-angular` (contract `sd-scroll-touch-first-scroll`), cùng quyết định và tiêu chí.
- Bản đầy đủ của `decision_coverage` (đã qua kiểm tra ở stage `spec`) nằm ở phụ lục.

```yaml
spec_context: {
  "source": "sdcorejs-spec",
  "architecture_gate": {
    "valid": true,
    "required": false,
    "status": "not-applicable",
    "signals": [],
    "bypass": {
      "kind": "bounded-bug-fix",
      "rationale": "Sửa lỗi trong một directive: không đổi API công khai, ranh giới module, dữ liệu lưu trữ hay dependency; service mới là nội bộ và không export."
    },
    "rationale": "Sửa lỗi trong một directive: không đổi API công khai, ranh giới module, dữ liệu lưu trữ hay dependency; service mới là nội bộ và không export."
  },
  "contract_id": "sd-scroll-touch-first-scroll-core-ui",
  "requirement_id": "R-001",
  "approved_spec_path": "",
  "approved_spec_hash": "",
  "supersedes": null,
  "target_root": "sdcorejs-angular",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "directives/sd-scroll",
  "execution_host_repository_id": "sdcorejs-workspace",
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "profile_confidence": "high",
  "source_requirement_context": "Hội thoại 2026-11-13: brainstorming chọn phương án 1 kèm yêu cầu dọn listener; người dùng duyệt yêu cầu bằng \"Duyệt, viết spec\".",
  "acceptance_criteria_count": 8,
  "manual_criteria_count": 1,
  "redaction_applied": false,
  "approval": {
    "approved": false,
    "approved_at": null,
    "approval_source": null,
    "instruction_reference": null,
    "document_review_performed": false
  },
  "change_control": {
    "revision": 1,
    "supersedes": null,
    "change_reason": null
  },
  "goal_backward_review": {
    "schema_version": 1,
    "mode": "sdcorejs-plan:goal-backward",
    "stage": "spec",
    "future_gaps": "task_refs và evidence_refs của R/AC/D/INV chờ plan gán (17 mục)"
  }
}
```

## Problem & Goals

Trên điện thoại, muốn cuộn ngang `sd-table` phải chạm vào bảng một lần rồi mới vuốt được. Nguyên nhân nằm ở directive `sdScroll` gắn trên vùng cuộn của bảng (`.c-table`): nó đặt `overflow-x: hidden` khi khởi tạo và chỉ đổi sang `auto` khi nhận `mouseover`. Màn hình cảm ứng không có chuột; trình duyệt chỉ giả lập `mouseover` sau khi một lần chạm kết thúc, nên lần vuốt đầu gặp `hidden`.

Ngoài ra `@HostListener('mouseover'/'mouseout')` nhận sự kiện lan lên từ mọi ô bảng. App dùng zone.js, nên mỗi lần rê chuột qua một ô sẽ chạy change detection toàn ứng dụng hai lần và ghi style hai lần.

Mục tiêu:
- Trên thiết bị cảm ứng, vuốt ngang được ngay lần đầu.
- Trên máy có chuột, giữ hành vi ẩn thanh cuộn ngang khi nghỉ.
- Mọi listener và timer được dọn khi không còn cần; cả ứng dụng chỉ có một listener media query, dù có bao nhiêu `sdScroll`.
- Không đổi API công khai.

## Requirements

- **R-001** - Trên thiết bị khớp media query "(hover: none), (any-pointer: coarse)", host của sdScroll có overflow-x: auto ngay từ lần render đầu và không gắn listener chuột nào.
- **R-002** - Trên thiết bị có chuột, overflow-x là hidden khi nghỉ và là auto khi con trỏ nằm trong host, giống hành vi hiện tại.
- **R-003** - Cả ứng dụng chỉ có đúng một listener change của MediaQueryList, bất kể số instance sdScroll; khi media query đổi lúc chạy, mọi instance còn sống chuyển đúng chế độ.
- **R-004** - Listener chuột chạy ngoài NgZone, mỗi instance gắn tối đa một lần, được gỡ khi chuyển sang chế độ cảm ứng và khi directive bị huỷ; style chỉ được ghi khi giá trị đổi; timeout đang chờ của scrollTop() bị huỷ khi gọi lại và khi directive bị huỷ.
- **R-005** - Khi môi trường không có window.matchMedia (SSR, test), directive giữ hành vi cũ: hidden khi nghỉ, auto khi rê chuột.
- **R-006** - API công khai không đổi: selector [sdScroll], class SdScrollDirective, method scrollTop(), overflow-y: auto và gợi ý translate3d; service dùng chung là nội bộ, không export.
- **R-007** - Core UI: sửa ở versions/v19 rồi rollout bằng npm run sync; cập nhật sd-scroll.md và CHANGELOG.md mục [Unreleased] > Fixed; full test có coverage, build v19, check:sync và test:scripts pass; lint không có finding trên dòng thêm hoặc sửa.

Nguồn của mọi yêu cầu: người dùng (phương án 1 cộng yêu cầu dọn listener). Chủ: `directives/sd-scroll`.

## Decisions

- **D-001** - Nhận diện thiết bị cảm ứng thế nào? **Media query "(hover: none), (any-pointer: coarse)"; khớp thì luôn overflow-x: auto và không gắn listener chuột.** Lý do: Quyết định tĩnh lúc khởi tạo chắc chắn hơn đổi overflow giữa lúc chạm, vì trình duyệt chọn phần tử cuộn ngay khi cử chỉ bắt đầu.
- **D-002** - Theo dõi media query bằng bao nhiêu listener? **Một service nội bộ providedIn root giữ trạng thái bằng signal và một listener change duy nhất, gỡ khi root injector bị huỷ; directive đọc signal và tự dọn theo vòng đời của mình.** Lý do: Người dùng yêu cầu tránh nhiều listener làm chậm trang.
- **D-003** - Bắt sự kiện chuột thế nào? **mouseenter/mouseleave gắn bằng Renderer2.listen bên trong NgZone.runOutsideAngular; chỉ ghi style khi giá trị đổi.** Lý do: mouseover/mouseout lan từ mọi ô con và chạy change detection toàn ứng dụng mỗi lần.
- **D-004** - Dọn listener và timer ra sao? **Gắn listener idempotent; gỡ khi chuyển sang cảm ứng và trong DestroyRef.onDestroy; huỷ timeout cũ của scrollTop() khi gọi lại và khi huỷ.** Lý do: Người dùng yêu cầu mọi listener đều phải được huỷ.
- **D-005** - Khi không có matchMedia thì sao? **Giữ hành vi cũ (hidden + hover).** Lý do: An toàn cho SSR và test, không đổi kết quả hiện có.
- **D-006** - API công khai có đổi không? **Không đổi; chỉ đổi loại sự kiện chuột bên trong và cập nhật test tương ứng.** Lý do: Directive công khai có tài liệu, tránh breaking.

Tất cả ở trạng thái approved, nguồn là lựa chọn của người dùng trong hội thoại 2026-11-13.

## Assumptions

- **A-001** - Laptop có màn hình cảm ứng khớp any-pointer: coarse nên luôn hiện thanh cuộn ngang; người dùng chấp nhận đánh đổi này. Nguồn: explicit; trạng thái: confirmed; không chặn. Nếu sai: Người dùng laptop cảm ứng thấy thanh cuộn ngang khi nghỉ. Kiểm chứng: Đã được người dùng chấp nhận khi chọn phương án 1.
- **A-002** - Trình duyệt di động hiển thị thanh cuộn dạng overlay, nên để overflow-x: auto ngay từ đầu không làm đổi bố cục sd-table. Nguồn: inferred; trạng thái: proposed; không chặn. Nếu sai: Bảng trên di động có thể hụt vài pixel chiều cao do thanh cuộn chiếm chỗ. Kiểm chứng: Kiểm tra thủ công theo AC-008.

## Invariants

- **INV-001** - Trên thiết bị có chuột, người dùng thấy hành vi như cũ (ẩn thanh cuộn ngang khi nghỉ, hiện khi rê chuột), và public API của sdScroll cùng cách sd-table gọi scrollTop() không đổi.

## Architecture gate classification

- Status: not-applicable.
- Signals: không có.
- Bypass: `bounded-bug-fix` - Sửa lỗi trong một directive: không đổi API công khai, ranh giới module, dữ liệu lưu trữ hay dependency; service mới là nội bộ và không export.

## Non-goals

- Không đổi `sd-table` (template, SCSS, chế độ thẻ trên điện thoại) hay `stickyShadow`.
- Không thêm toggle overflow cho bàn phím (focus); hành vi bàn phím giữ như hiện tại.
- Không thêm input hay option công khai mới cho `sdScroll`; không export service nội bộ.
- Không thêm dependency.
- Không sửa tay `versions/v20`, `v21`, `v22`; không đổi `showcase/`, `published-docs/`, `published-pages/`.
- Không cắt release: không đổi heading `[Unreleased]`, không commit, push, tag hay publish trong phạm vi spec này.

## Architecture

`SdScrollDirective` vẫn là directive standalone duy nhất người dùng thấy. Một service nội bộ `providedIn: 'root'` sở hữu một `MediaQueryList` cho `(hover: none), (any-pointer: coarse)` và một listener `change` duy nhất, đưa trạng thái ra dưới dạng signal chỉ đọc; listener được gỡ khi root injector bị huỷ. Khi không có `window.matchMedia`, service báo chế độ chuột và không gắn gì.

Directive:
- Lúc khởi tạo vẫn đặt `translate3d` và `overflow-y: auto`, rồi đặt `overflow-x` theo chế độ hiện tại ngay, không chờ vòng change detection sau.
- Chế độ cảm ứng: `overflow-x: auto`, không có listener chuột.
- Chế độ chuột: `overflow-x: hidden`; gắn `mouseenter`/`mouseleave` bằng `Renderer2.listen` trong `NgZone.runOutsideAngular`; giữ hàm gỡ của chúng; gắn lại chỉ khi chưa gắn.
- Khi chế độ đổi: gỡ hoặc gắn listener và đặt lại `overflow-x` tương ứng.
- Chỉ ghi `overflow-x` khi giá trị khác giá trị đã ghi lần trước.
- `scrollTop()` giữ hành vi (đặt `scrollTop = 0` sau `setTimeout` 1ms), nhưng huỷ timeout cũ trước khi đặt cái mới.
- `DestroyRef.onDestroy`: gỡ listener chuột, huỷ timeout đang chờ, ngừng theo dõi chế độ.

Cách directive theo dõi signal (`effect` hay cơ chế khác) do plan chốt, miễn đạt R-003 và R-004.

## Stack profile and technology assumptions

- Track: angular. Stack profile: core-ui-angular.
- Evidence: `versions/v19/projects/sdcorejs-angular`, import `@sdcorejs/angular/directives` trong `components/table`, `AGENTS.md` (v19 là nguồn, v20-v22 dẫn xuất).
- Công cụ: Node đúng `24.22.1` (AGENTS.md); Karma `ChromeHeadlessCI` với `--code-coverage`; `npm run sync`, `npm run check:sync`, `npm run test:scripts`.
- Không đổi công nghệ: chỉ dùng API Angular có sẵn (`inject`, `DestroyRef`, `NgZone`, `Renderer2`, signal) và `window.matchMedia`.

## File structure

- `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts` - sửa.
- `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts` - sửa (thay test mouseover/mouseout, thêm test cho chế độ cảm ứng, listener dùng chung, dọn dẹp, NgZone, SSR).
- `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts` - tạo (service nội bộ, không export từ `directives/index.ts`); tên file do plan chốt.
- `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.md` - sửa (mục Behavior, Accessibility, Anti-patterns, Change history).
- `CHANGELOG.md` (root) - sửa (mục `[Unreleased]`, nhóm Fixed, `#### sdScroll`).
- Các file tương ứng trong `versions/v20`, `v21`, `v22` và `SYNC-STATUS.md` của chúng - chỉ qua `npm run sync`, không sửa tay.

## Acceptance criteria

- **AC-001** (tự động, R-001) - Khởi tạo sdScroll khi media query cảm ứng khớp, rồi phát mouseenter và mouseleave: overflow-x là auto ngay sau khởi tạo và không đổi sau các sự kiện chuột; không có listener chuột nào được gắn.
- **AC-002** (tự động, R-002, R-004) - Khởi tạo sdScroll khi media query cảm ứng không khớp, rồi phát mouseenter, mouseover/mouseout giữa các phần tử con, và mouseleave: overflow-x là hidden lúc đầu, auto sau mouseenter, không bị ghi lại khi di chuyển giữa các phần tử con, hidden sau mouseleave.
- **AC-003** (tự động, R-003) - Tạo nhiều instance sdScroll rồi phát sự kiện change của media query theo cả hai chiều: matchMedia và addEventListener("change") chỉ được gọi một lần cho cả ứng dụng; mọi instance còn sống chuyển đúng chế độ sau mỗi lần đổi.
- **AC-004** (tự động, R-003, R-004) - Huỷ directive (kể cả khi đang có scrollTop() chờ), và chuyển chế độ chuột -> cảm ứng -> chuột trên instance còn sống: sau khi huỷ, sự kiện chuột không đổi style và timeout không ghi scrollTop; chuyển chế độ nhiều lần không làm gắn trùng listener chuột.
- **AC-005** (tự động, R-004) - Phát mouseenter và mouseleave trên host trong chế độ chuột: handler chạy ngoài Angular zone và không kích hoạt change detection của ứng dụng.
- **AC-006** (tự động, R-005) - Khởi tạo sdScroll khi window.matchMedia không tồn tại: hành vi giống hiện tại (hidden khi nghỉ, auto khi rê chuột) và không ném lỗi.
- **AC-007** (tự động, R-006, R-007) - Chạy full test suite, build, lint và kiểm tra public surface của entry point directives: test và build pass; lint không có finding trên dòng thêm hoặc sửa; public surface không đổi và không có symbol mới được export.
- **AC-008** (thủ công, R-001) - Trên điện thoại thật hoặc chế độ thiết bị di động của Chrome DevTools, vuốt ngang một sd-table có nhiều cột ngay lần đầu: bảng cuộn ngang ngay lần vuốt đầu tiên, không cần chạm trước.

## Risks & mitigations

- **Risk:** Chuyển từ `mouseover`/`mouseout` sang `mouseenter`/`mouseleave` làm đổi hành vi với code bên ngoài tự phát `mouseover` lên host. -> **Mitigation:** không có call site nào trong thư viện làm vậy; ghi trong CHANGELOG và `sd-scroll.md`.
- **Risk:** Laptop cảm ứng luôn hiện thanh cuộn ngang. -> **Mitigation:** đánh đổi đã được chấp nhận (A-001); ghi trong `sd-scroll.md`.
- **Risk:** Listener dùng chung giữ tham chiếu tới directive đã huỷ, gây rò bộ nhớ. -> **Mitigation:** directive chỉ đọc signal và ngừng theo dõi khi huỷ; AC-004 kiểm tra.
- **Risk:** v20-v22 lệch v19. -> **Mitigation:** chỉ rollout bằng `npm run sync`; `npm run check:sync` là guard.
- **Risk:** Chỉ build và test v19 trong phiên này. -> **Mitigation:** ghi rõ trong execution record; release ritual của repo build đủ bốn dòng.
- **Risk:** Branch hiện tại là `feat/confirm-mobile-bottom-sheet`, đang chứa thay đổi khác. -> **Mitigation:** plan chốt branch làm việc trước khi sửa code.

## Out of scope (deferred)

- Hiện thanh cuộn ngang khi focus bằng bàn phím - khi có yêu cầu về accessibility cho bảng.
- Gỡ hẳn chế độ ẩn thanh cuộn khi nghỉ (chuyển sang CSS thuần, phương án 2) - khi có lý do đổi API của `sdScroll`.

## Phụ lục - decision_coverage

```json
{
 "schema_version": 1,
 "revision": 1,
 "records": [
  {
   "id": "R-001",
   "type": "requirement",
   "statement": "Trên thiết bị khớp media query \"(hover: none), (any-pointer: coarse)\", host của sdScroll có overflow-x: auto ngay từ lần render đầu và không gắn listener chuột nào.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "R-002",
   "type": "requirement",
   "statement": "Trên thiết bị có chuột, overflow-x là hidden khi nghỉ và là auto khi con trỏ nằm trong host, giống hành vi hiện tại.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "R-003",
   "type": "requirement",
   "statement": "Cả ứng dụng chỉ có đúng một listener change của MediaQueryList, bất kể số instance sdScroll; khi media query đổi lúc chạy, mọi instance còn sống chuyển đúng chế độ.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "R-004",
   "type": "requirement",
   "statement": "Listener chuột chạy ngoài NgZone, mỗi instance gắn tối đa một lần, được gỡ khi chuyển sang chế độ cảm ứng và khi directive bị huỷ; style chỉ được ghi khi giá trị đổi; timeout đang chờ của scrollTop() bị huỷ khi gọi lại và khi directive bị huỷ.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "R-005",
   "type": "requirement",
   "statement": "Khi môi trường không có window.matchMedia (SSR, test), directive giữ hành vi cũ: hidden khi nghỉ, auto khi rê chuột.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "R-006",
   "type": "requirement",
   "statement": "API công khai không đổi: selector [sdScroll], class SdScrollDirective, method scrollTop(), overflow-y: auto và gợi ý translate3d; service dùng chung là nội bộ, không export.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "R-007",
   "type": "requirement",
   "statement": "Core UI: sửa ở versions/v19 rồi rollout bằng npm run sync; cập nhật sd-scroll.md và CHANGELOG.md mục [Unreleased] > Fixed; full test có coverage, build v19, check:sync và test:scripts pass; lint không có finding trên dòng thêm hoặc sửa.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "directives/sd-scroll",
   "task_refs": []
  },
  {
   "id": "AC-001",
   "type": "acceptance-criterion",
   "statement": "Khởi tạo sdScroll khi media query cảm ứng khớp, rồi phát mouseenter và mouseleave -> overflow-x là auto ngay sau khởi tạo và không đổi sau các sự kiện chuột; không có listener chuột nào được gắn",
   "behavior": "Khởi tạo sdScroll khi media query cảm ứng khớp, rồi phát mouseenter và mouseleave",
   "expected_result": "overflow-x là auto ngay sau khởi tạo và không đổi sau các sự kiện chuột; không có listener chuột nào được gắn",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "AC-002",
   "type": "acceptance-criterion",
   "statement": "Khởi tạo sdScroll khi media query cảm ứng không khớp, rồi phát mouseenter, mouseover/mouseout giữa các phần tử con, và mouseleave -> overflow-x là hidden lúc đầu, auto sau mouseenter, không bị ghi lại khi di chuyển giữa các phần tử con, hidden sau mouseleave",
   "behavior": "Khởi tạo sdScroll khi media query cảm ứng không khớp, rồi phát mouseenter, mouseover/mouseout giữa các phần tử con, và mouseleave",
   "expected_result": "overflow-x là hidden lúc đầu, auto sau mouseenter, không bị ghi lại khi di chuyển giữa các phần tử con, hidden sau mouseleave",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002",
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-003",
   "type": "acceptance-criterion",
   "statement": "Tạo nhiều instance sdScroll rồi phát sự kiện change của media query theo cả hai chiều -> matchMedia và addEventListener(\"change\") chỉ được gọi một lần cho cả ứng dụng; mọi instance còn sống chuyển đúng chế độ sau mỗi lần đổi",
   "behavior": "Tạo nhiều instance sdScroll rồi phát sự kiện change của media query theo cả hai chiều",
   "expected_result": "matchMedia và addEventListener(\"change\") chỉ được gọi một lần cho cả ứng dụng; mọi instance còn sống chuyển đúng chế độ sau mỗi lần đổi",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003"
   ],
   "task_refs": []
  },
  {
   "id": "AC-004",
   "type": "acceptance-criterion",
   "statement": "Huỷ directive (kể cả khi đang có scrollTop() chờ), và chuyển chế độ chuột -> cảm ứng -> chuột trên instance còn sống -> sau khi huỷ, sự kiện chuột không đổi style và timeout không ghi scrollTop; chuyển chế độ nhiều lần không làm gắn trùng listener chuột",
   "behavior": "Huỷ directive (kể cả khi đang có scrollTop() chờ), và chuyển chế độ chuột -> cảm ứng -> chuột trên instance còn sống",
   "expected_result": "sau khi huỷ, sự kiện chuột không đổi style và timeout không ghi scrollTop; chuyển chế độ nhiều lần không làm gắn trùng listener chuột",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003",
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-005",
   "type": "acceptance-criterion",
   "statement": "Phát mouseenter và mouseleave trên host trong chế độ chuột -> handler chạy ngoài Angular zone và không kích hoạt change detection của ứng dụng",
   "behavior": "Phát mouseenter và mouseleave trên host trong chế độ chuột",
   "expected_result": "handler chạy ngoài Angular zone và không kích hoạt change detection của ứng dụng",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-006",
   "type": "acceptance-criterion",
   "statement": "Khởi tạo sdScroll khi window.matchMedia không tồn tại -> hành vi giống hiện tại (hidden khi nghỉ, auto khi rê chuột) và không ném lỗi",
   "behavior": "Khởi tạo sdScroll khi window.matchMedia không tồn tại",
   "expected_result": "hành vi giống hiện tại (hidden khi nghỉ, auto khi rê chuột) và không ném lỗi",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-005"
   ],
   "task_refs": []
  },
  {
   "id": "AC-007",
   "type": "acceptance-criterion",
   "statement": "Chạy full test suite, build, lint và kiểm tra public surface của entry point directives -> test và build pass; lint không có finding trên dòng thêm hoặc sửa; public surface không đổi và không có symbol mới được export",
   "behavior": "Chạy full test suite, build, lint và kiểm tra public surface của entry point directives",
   "expected_result": "test và build pass; lint không có finding trên dòng thêm hoặc sửa; public surface không đổi và không có symbol mới được export",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-006",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-008",
   "type": "acceptance-criterion",
   "statement": "Trên điện thoại thật hoặc chế độ thiết bị di động của Chrome DevTools, vuốt ngang một sd-table có nhiều cột ngay lần đầu -> bảng cuộn ngang ngay lần vuốt đầu tiên, không cần chạm trước",
   "behavior": "Trên điện thoại thật hoặc chế độ thiết bị di động của Chrome DevTools, vuốt ngang một sd-table có nhiều cột ngay lần đầu",
   "expected_result": "bảng cuộn ngang ngay lần vuốt đầu tiên, không cần chạm trước",
   "verification_kind": "manual",
   "blocking": true,
   "requirement_refs": [
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "A-001",
   "type": "assumption",
   "statement": "Laptop có màn hình cảm ứng khớp any-pointer: coarse nên luôn hiện thanh cuộn ngang; người dùng chấp nhận đánh đổi này.",
   "source": "explicit",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "brainstorming-option-1"
   ],
   "consequence_if_wrong": "Người dùng laptop cảm ứng thấy thanh cuộn ngang khi nghỉ",
   "validation_method": "Đã được người dùng chấp nhận khi chọn phương án 1",
   "owner": "user",
   "rationale": "Đánh đổi đã nêu trong phương án 1",
   "impacted_refs": [
    "R-001"
   ]
  },
  {
   "id": "A-002",
   "type": "assumption",
   "statement": "Trình duyệt di động hiển thị thanh cuộn dạng overlay, nên để overflow-x: auto ngay từ đầu không làm đổi bố cục sd-table.",
   "source": "inferred",
   "confidence": "high",
   "status": "proposed",
   "blocking": false,
   "evidence_refs": [
    "mobile-overlay-scrollbar-behavior"
   ],
   "consequence_if_wrong": "Bảng trên di động có thể hụt vài pixel chiều cao do thanh cuộn chiếm chỗ",
   "validation_method": "Kiểm tra thủ công theo AC-008",
   "owner": "implementer",
   "rationale": "Hành vi mặc định của iOS Safari và Chrome Android",
   "impacted_refs": [
    "R-001"
   ]
  },
  {
   "id": "D-001",
   "type": "decision",
   "statement": "Media query \"(hover: none), (any-pointer: coarse)\"; khớp thì luôn overflow-x: auto và không gắn listener chuột",
   "question": "Nhận diện thiết bị cảm ứng thế nào?",
   "selected_value": "Media query \"(hover: none), (any-pointer: coarse)\"; khớp thì luôn overflow-x: auto và không gắn listener chuột",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Quyết định tĩnh lúc khởi tạo chắc chắn hơn đổi overflow giữa lúc chạm, vì trình duyệt chọn phần tử cuộn ngay khi cử chỉ bắt đầu",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001",
    "A-001"
   ],
   "task_refs": []
  },
  {
   "id": "D-002",
   "type": "decision",
   "statement": "Một service nội bộ providedIn root giữ trạng thái bằng signal và một listener change duy nhất, gỡ khi root injector bị huỷ; directive đọc signal và tự dọn theo vòng đời của mình",
   "question": "Theo dõi media query bằng bao nhiêu listener?",
   "selected_value": "Một service nội bộ providedIn root giữ trạng thái bằng signal và một listener change duy nhất, gỡ khi root injector bị huỷ; directive đọc signal và tự dọn theo vòng đời của mình",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Người dùng yêu cầu tránh nhiều listener làm chậm trang",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-003",
    "AC-003"
   ],
   "task_refs": []
  },
  {
   "id": "D-003",
   "type": "decision",
   "statement": "mouseenter/mouseleave gắn bằng Renderer2.listen bên trong NgZone.runOutsideAngular; chỉ ghi style khi giá trị đổi",
   "question": "Bắt sự kiện chuột thế nào?",
   "selected_value": "mouseenter/mouseleave gắn bằng Renderer2.listen bên trong NgZone.runOutsideAngular; chỉ ghi style khi giá trị đổi",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "mouseover/mouseout lan từ mọi ô con và chạy change detection toàn ứng dụng mỗi lần",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-002",
    "R-004",
    "AC-002",
    "AC-005"
   ],
   "task_refs": []
  },
  {
   "id": "D-004",
   "type": "decision",
   "statement": "Gắn listener idempotent; gỡ khi chuyển sang cảm ứng và trong DestroyRef.onDestroy; huỷ timeout cũ của scrollTop() khi gọi lại và khi huỷ",
   "question": "Dọn listener và timer ra sao?",
   "selected_value": "Gắn listener idempotent; gỡ khi chuyển sang cảm ứng và trong DestroyRef.onDestroy; huỷ timeout cũ của scrollTop() khi gọi lại và khi huỷ",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Người dùng yêu cầu mọi listener đều phải được huỷ",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-004",
    "AC-004"
   ],
   "task_refs": []
  },
  {
   "id": "D-005",
   "type": "decision",
   "statement": "Giữ hành vi cũ (hidden + hover)",
   "question": "Khi không có matchMedia thì sao?",
   "selected_value": "Giữ hành vi cũ (hidden + hover)",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "An toàn cho SSR và test, không đổi kết quả hiện có",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-005",
    "AC-006"
   ],
   "task_refs": []
  },
  {
   "id": "D-006",
   "type": "decision",
   "statement": "Không đổi; chỉ đổi loại sự kiện chuột bên trong và cập nhật test tương ứng",
   "question": "API công khai có đổi không?",
   "selected_value": "Không đổi; chỉ đổi loại sự kiện chuột bên trong và cập nhật test tương ứng",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Directive công khai có tài liệu, tránh breaking",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-006",
    "AC-007",
    "INV-001"
   ],
   "task_refs": []
  },
  {
   "id": "INV-001",
   "type": "invariant",
   "statement": "Trên thiết bị có chuột, người dùng thấy hành vi như cũ (ẩn thanh cuộn ngang khi nghỉ, hiện khi rê chuột), và public API của sdScroll cùng cách sd-table gọi scrollTop() không đổi.",
   "protected_refs": [
    "R-002",
    "R-006",
    "AC-002",
    "AC-007"
   ],
   "task_refs": [],
   "evidence_refs": []
  }
 ],
 "history": [
  {
   "revision": 1,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "INV-001",
     "type": "invariant"
    }
   ],
   "tombstones": []
  }
 ]
}
```

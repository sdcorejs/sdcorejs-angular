---
artifact_id: "draft-plan-sd-scroll-touch-first-scroll-core-ui-r1"
artifact_kind: "execution-doc"
change_ref: "sd-scroll-touch-first-scroll-core-ui"
commit_policy: "with-change"
owner: "sdcorejs-plan"
owner_module_id: "directives/sd-scroll"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
repository_relative_path: ".sdcorejs/docs/angular/2026-11-13-10-40-sd-scroll-touch-first-scroll-plan.md"
schema_version: 1
source_plan: "none"
source_revision: "184e557f1245b762557119cc806f9ce0477f0a2c"
source_spec: ".sdcorejs/specs/angular/2026-11-13-10-26-sd-scroll-touch-first-scroll.md"
stack_profile: "core-ui-angular"
status: "draft"
track: "angular"
---

# Plan - sdScroll cuộn ngang được ngay lần chạm đầu (Core UI) - 2026-11-13 10:40

## Scope

Thực hiện spec đã duyệt `.sdcorejs/specs/angular/2026-11-13-10-26-sd-scroll-touch-first-scroll.md` (`sha256:v1:82b5789a4acbf603b43929222d517ca594248b7ffd6e618e1208f250b2c091de`). Sửa `sdScroll` để thiết bị cảm ứng có `overflow-x: auto` ngay từ đầu, máy có chuột giữ ẩn-khi-nghỉ bằng `mouseenter`/`mouseleave` ngoài NgZone, một listener media query dùng chung, và dọn mọi listener/timer khi huỷ. Không đổi API công khai, không đổi `sd-table`.

## Execution context

- Track: angular. Target root kind: target-project. Stack profile: core-ui-angular.
- Coverage approach: TDD (TASK-001 viết test và thấy RED trước khi sửa code).
- Parallel candidates: không; các task phụ thuộc tuần tự trong cùng một thư mục.
- Architecture gate: not-applicable (`bounded-bug-fix`), `architecture_context: null`.
- Node: Node v24.22.1 bản portable có sẵn từ phiên trước (`C:/Users/NGHIAT~1/AppData/Local/Temp/claude/c15db6cea2a7c996/58251a85-4e6a-44cd-8443-deda5d4cf66e/scratchpad/node24/node-v24.22.1-win-x64`), đặt lên đầu PATH chỉ cho lệnh của repo này; Node mặc định v26.13.0 không bị đổi. Nếu thư mục không còn thì dừng và hỏi trước khi tải lại.
- Plan của repo còn lại là plan riêng, cùng nội dung; hai plan không phụ thuộc nhau.

## Preflight và branch (trước mọi thao tác ghi)

1. Chạy `git status --short`, diffstat staged/unstaged, liệt kê file untracked, ghi lại branch và HEAD. Lúc lập plan: branch `feat/confirm-mobile-bottom-sheet`, HEAD `184e557f1245b762557119cc806f9ce0477f0a2c`, chỉ có 2 file untracked là spec draft và spec đã duyệt dưới `.sdcorejs/`.
2. `git fetch origin`, rồi `git switch -c fix/sd-scroll-touch-first-scroll origin/main`. Branch hiện tại chứa commit confirm `184e557f` chưa merge vào `main`; tách branch từ `origin/main` để PR này độc lập. Thư mục `directives` giống hệt giữa hai bên; chỉ `CHANGELOG.md` khác (có thể phải gộp mục `[Unreleased]` khi merge sau). File untracked dưới `.sdcorejs/` đi theo sang branch mới.
3. Nếu có file bẩn khác chồng lên `allowed_paths`, dừng và hỏi (giới hạn trong file của plan / cho phép file chọn lọc / dừng để dọn).
4. Ghi danh sách export hiện tại của entry point `directives` (từ build trước thay đổi, hoặc từ `directives/index.ts` cùng các file nó re-export) để so ở bước cuối.

```yaml
plan_context: {
  "schema_version": 2,
  "source": "sdcorejs-plan",
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
  "architecture_context": null,
  "contract_id": "sd-scroll-touch-first-scroll-core-ui",
  "requirement_id": "R-001",
  "approved_spec_path": ".sdcorejs/specs/angular/2026-11-13-10-26-sd-scroll-touch-first-scroll.md",
  "approved_spec_hash": "sha256:v1:82b5789a4acbf603b43929222d517ca594248b7ffd6e618e1208f250b2c091de",
  "approved_spec_reference": {
    "immutable_identity": {
      "repository_id": "sdcorejs-angular",
      "repository_relative_path": ".sdcorejs/specs/angular/2026-11-13-10-26-sd-scroll-touch-first-scroll.md",
      "artifact_id": "spec-sd-scroll-touch-first-scroll-core-ui-r1",
      "revision": "184e557f1245b762557119cc806f9ce0477f0a2c",
      "approval_hash": "sha256:v1:82b5789a4acbf603b43929222d517ca594248b7ffd6e618e1208f250b2c091de"
    }
  },
  "approved_plan_path": "",
  "approved_plan_hash": "",
  "supersedes": null,
  "target_root": "sdcorejs-angular",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "directives/sd-scroll",
  "execution_host_repository_id": "sdcorejs-workspace",
  "integration_owner_repository_id": "sdcorejs-angular",
  "dependency_order": [
    "sdcorejs-angular"
  ],
  "gitlink_updates_in_scope": false,
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "task_count": 7,
  "phase_count": 5,
  "working_branch": {
    "name": "fix/sd-scroll-touch-first-scroll",
    "base": "origin/main",
    "create": true,
    "current_branch_at_planning": "feat/confirm-mobile-bottom-sheet"
  },
  "allowed_paths": [
    "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "CHANGELOG.md",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v20/SYNC-STATUS.md",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v21/SYNC-STATUS.md",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v22/SYNC-STATUS.md",
    ".sdcorejs/docs/angular/2026-11-13-sd-scroll-touch-first-scroll-execution.md"
  ],
  "prohibited_paths": [
    "package.json",
    "package-lock.json",
    "**/package.json",
    "**/package-lock.json",
    "node_modules/**",
    "dist/**",
    "**/dist/**",
    ".env*",
    "showcase/**",
    "published-docs/**",
    "published-pages/**",
    "components/table/**",
    "**/components/table/**"
  ],
  "generated_artifacts": [
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v20/SYNC-STATUS.md",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v21/SYNC-STATUS.md",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
    "versions/v22/SYNC-STATUS.md"
  ],
  "docs_artifacts": [
    "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.md",
    "CHANGELOG.md",
    ".sdcorejs/docs/angular/2026-11-13-sd-scroll-touch-first-scroll-execution.md",
    ".sdcorejs/docs/angular/2026-11-13-10-40-sd-scroll-touch-first-scroll-plan.md"
  ],
  "dependency_changes": {
    "required": false,
    "packages": [],
    "approval_required": false
  },
  "env_changes": {
    "required": false,
    "files": [],
    "approval_required": false
  },
  "migration_changes": {
    "required": false,
    "description": null,
    "approval_required": false
  },
  "frontend_architecture": {
    "required": false,
    "conformance_invariant_refs": [],
    "not_applicable_reason": "Sửa lỗi một attribute directive của thư viện: không có route, page hay cây component; chỉ thêm một service nội bộ providedIn root cho chính directive này, không export."
  },
  "agent_architecture": {
    "required": false,
    "conformance_invariant_refs": [],
    "not_applicable_reason": "Không phải track ai-agent."
  },
  "verification_strategy": {
    "package_manager": "npm",
    "package_manager_evidence": [
      "versions/v19/package-lock.json",
      "versions/v19/package.json scripts test/test:ci/build/lint"
    ],
    "node": "Node v24.22.1 bản portable có sẵn từ phiên trước (`C:/Users/NGHIAT~1/AppData/Local/Temp/claude/c15db6cea2a7c996/58251a85-4e6a-44cd-8443-deda5d4cf66e/scratchpad/node24/node-v24.22.1-win-x64`), đặt lên đầu PATH chỉ cho lệnh của repo này; Node mặc định v26.13.0 không bị đổi. Nếu thư mục không còn thì dừng và hỏi trước khi tải lại.",
    "commands_planned": [
      "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts (cwd: versions/v19) - RED ở TASK-001, GREEN ở TASK-003",
      "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage (cwd: versions/v19) - full suite có coverage",
      "npm run build (cwd: versions/v19) - build thư viện",
      "npx eslint projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts (cwd: versions/v19) - lint file đã sửa",
      "So danh sách export trong versions/v19/dist/sdcorejs-angular/directives/index.d.ts trước và sau thay đổi - public surface",
      "`npm run sync` (cwd: root repo) - TASK-006",
      "`npm run check:sync` (cwd: root repo)",
      "`npm run test:scripts` (cwd: root repo)"
    ],
    "commands_skipped": [
      "Build/test v20, v21, v22 và showcase - thuộc release ritual của repo",
      "`npm run lint` toàn repo - thay bằng ESLint trên file đã sửa"
    ]
  },
  "execution_policy": "sequential",
  "parallel_candidates": {
    "allowed": false,
    "units": [],
    "shared_files": [],
    "reason": "Các task phụ thuộc tuần tự (RED -> service -> directive -> docs -> verify) và cùng một thư mục."
  },
  "repository_plan": {
    "schema_version": 1,
    "integration_owner_repository_id": "sdcorejs-angular",
    "dependency_order": [
      "sdcorejs-angular"
    ],
    "contract": "Một repo, mọi bước ghi nằm trong Git root sdcorejs-angular. Plan của repo kia là plan riêng, không phụ thuộc."
  },
  "finish_tail": {
    "contract": "Docs (TASK-004, TASK-005, execution record) trước verify-before-done; branch-ready là gate cuối; không ghi gì sau branch-ready. Không commit, push, tạo PR/MR trong plan này."
  },
  "approval": {
    "approved": false,
    "approved_at": null
  },
  "change_control": {
    "revision": 1,
    "supersedes": null,
    "change_reason": null
  },
  "decision_coverage": {
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
        "task_refs": [
          "TASK-001",
          "TASK-003",
          "TASK-007"
        ]
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "Trên thiết bị có chuột, overflow-x là hidden khi nghỉ và là auto khi con trỏ nằm trong host, giống hành vi hiện tại.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "directives/sd-scroll",
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "Cả ứng dụng chỉ có đúng một listener change của MediaQueryList, bất kể số instance sdScroll; khi media query đổi lúc chạy, mọi instance còn sống chuyển đúng chế độ.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "directives/sd-scroll",
        "task_refs": [
          "TASK-001",
          "TASK-002",
          "TASK-003"
        ]
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "Listener chuột chạy ngoài NgZone, mỗi instance gắn tối đa một lần, được gỡ khi chuyển sang chế độ cảm ứng và khi directive bị huỷ; style chỉ được ghi khi giá trị đổi; timeout đang chờ của scrollTop() bị huỷ khi gọi lại và khi directive bị huỷ.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "directives/sd-scroll",
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "Khi môi trường không có window.matchMedia (SSR, test), directive giữ hành vi cũ: hidden khi nghỉ, auto khi rê chuột.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "directives/sd-scroll",
        "task_refs": [
          "TASK-001",
          "TASK-002",
          "TASK-003"
        ]
      },
      {
        "id": "R-006",
        "type": "requirement",
        "statement": "API công khai không đổi: selector [sdScroll], class SdScrollDirective, method scrollTop(), overflow-y: auto và gợi ý translate3d; service dùng chung là nội bộ, không export.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "directives/sd-scroll",
        "task_refs": [
          "TASK-003",
          "TASK-004",
          "TASK-007"
        ]
      },
      {
        "id": "R-007",
        "type": "requirement",
        "statement": "Core UI: sửa ở versions/v19 rồi rollout bằng npm run sync; cập nhật sd-scroll.md và CHANGELOG.md mục [Unreleased] > Fixed; full test có coverage, build v19, check:sync và test:scripts pass; lint không có finding trên dòng thêm hoặc sửa.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "directives/sd-scroll",
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ]
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
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
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
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
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
        "task_refs": [
          "TASK-001",
          "TASK-002",
          "TASK-003"
        ]
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
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
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
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
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
        "task_refs": [
          "TASK-001",
          "TASK-002",
          "TASK-003"
        ]
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
        "task_refs": [
          "TASK-007"
        ]
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
        "task_refs": [
          "TASK-007"
        ]
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
          "mobile-overlay-scrollbar-behavior",
          "EVIDENCE-009"
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
          "A-001",
          "AC-008"
        ],
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-001",
            "AC-001",
            "A-001",
            "AC-008"
          ]
        }
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
        "task_refs": [
          "TASK-001",
          "TASK-002"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-003",
            "AC-003"
          ]
        }
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
          "AC-005",
          "INV-001"
        ],
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-002",
            "R-004",
            "AC-002",
            "AC-005",
            "INV-001"
          ]
        }
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
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-004",
            "AC-004"
          ]
        }
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
        "task_refs": [
          "TASK-001",
          "TASK-002",
          "TASK-003"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-005",
            "AC-006"
          ]
        }
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
          "INV-001",
          "R-007"
        ],
        "task_refs": [
          "TASK-003",
          "TASK-004",
          "TASK-006",
          "TASK-007"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-006",
            "AC-007",
            "INV-001",
            "R-007"
          ]
        }
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
        "task_refs": [
          "TASK-003",
          "TASK-007"
        ],
        "evidence_refs": [
          "EVIDENCE-003",
          "EVIDENCE-008"
        ]
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
  },
  "goal_backward_review": {
    "schema_version": 1,
    "mode": "sdcorejs-plan:goal-backward",
    "decision_coverage": {
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
          "task_refs": [
            "TASK-001",
            "TASK-003",
            "TASK-007"
          ]
        },
        {
          "id": "R-002",
          "type": "requirement",
          "statement": "Trên thiết bị có chuột, overflow-x là hidden khi nghỉ và là auto khi con trỏ nằm trong host, giống hành vi hiện tại.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "directives/sd-scroll",
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ]
        },
        {
          "id": "R-003",
          "type": "requirement",
          "statement": "Cả ứng dụng chỉ có đúng một listener change của MediaQueryList, bất kể số instance sdScroll; khi media query đổi lúc chạy, mọi instance còn sống chuyển đúng chế độ.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "directives/sd-scroll",
          "task_refs": [
            "TASK-001",
            "TASK-002",
            "TASK-003"
          ]
        },
        {
          "id": "R-004",
          "type": "requirement",
          "statement": "Listener chuột chạy ngoài NgZone, mỗi instance gắn tối đa một lần, được gỡ khi chuyển sang chế độ cảm ứng và khi directive bị huỷ; style chỉ được ghi khi giá trị đổi; timeout đang chờ của scrollTop() bị huỷ khi gọi lại và khi directive bị huỷ.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "directives/sd-scroll",
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ]
        },
        {
          "id": "R-005",
          "type": "requirement",
          "statement": "Khi môi trường không có window.matchMedia (SSR, test), directive giữ hành vi cũ: hidden khi nghỉ, auto khi rê chuột.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "directives/sd-scroll",
          "task_refs": [
            "TASK-001",
            "TASK-002",
            "TASK-003"
          ]
        },
        {
          "id": "R-006",
          "type": "requirement",
          "statement": "API công khai không đổi: selector [sdScroll], class SdScrollDirective, method scrollTop(), overflow-y: auto và gợi ý translate3d; service dùng chung là nội bộ, không export.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "directives/sd-scroll",
          "task_refs": [
            "TASK-003",
            "TASK-004",
            "TASK-007"
          ]
        },
        {
          "id": "R-007",
          "type": "requirement",
          "statement": "Core UI: sửa ở versions/v19 rồi rollout bằng npm run sync; cập nhật sd-scroll.md và CHANGELOG.md mục [Unreleased] > Fixed; full test có coverage, build v19, check:sync và test:scripts pass; lint không có finding trên dòng thêm hoặc sửa.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "directives/sd-scroll",
          "task_refs": [
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007"
          ]
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
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ]
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
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ]
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
          "task_refs": [
            "TASK-001",
            "TASK-002",
            "TASK-003"
          ]
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
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ]
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
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ]
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
          "task_refs": [
            "TASK-001",
            "TASK-002",
            "TASK-003"
          ]
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
          "task_refs": [
            "TASK-007"
          ]
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
          "task_refs": [
            "TASK-007"
          ]
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
            "mobile-overlay-scrollbar-behavior",
            "EVIDENCE-009"
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
            "A-001",
            "AC-008"
          ],
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-001",
              "AC-001",
              "A-001",
              "AC-008"
            ]
          }
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
          "task_refs": [
            "TASK-001",
            "TASK-002"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-003",
              "AC-003"
            ]
          }
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
            "AC-005",
            "INV-001"
          ],
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-002",
              "R-004",
              "AC-002",
              "AC-005",
              "INV-001"
            ]
          }
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
          "task_refs": [
            "TASK-001",
            "TASK-003"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-004",
              "AC-004"
            ]
          }
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
          "task_refs": [
            "TASK-001",
            "TASK-002",
            "TASK-003"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-005",
              "AC-006"
            ]
          }
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
            "INV-001",
            "R-007"
          ],
          "task_refs": [
            "TASK-003",
            "TASK-004",
            "TASK-006",
            "TASK-007"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-006",
              "AC-007",
              "INV-001",
              "R-007"
            ]
          }
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
          "task_refs": [
            "TASK-003",
            "TASK-007"
          ],
          "evidence_refs": [
            "EVIDENCE-003",
            "EVIDENCE-008"
          ]
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
    },
    "goals": [
      {
        "id": "G-001",
        "statement": "Trên thiết bị cảm ứng, sdScroll (và sd-table) cuộn ngang được ngay lần vuốt đầu.",
        "task_refs": [
          "TASK-001",
          "TASK-003"
        ]
      },
      {
        "id": "G-002",
        "statement": "Một listener media query cho cả ứng dụng; mọi listener và timer của directive được dọn khi không còn cần; handler chuột không chạy change detection.",
        "task_refs": [
          "TASK-002",
          "TASK-003"
        ]
      },
      {
        "id": "G-003",
        "statement": "Thay đổi được ghi tài liệu, dẫn xuất sang v20-v22 và kiểm chứng bằng test, build, lint và kiểm tra thủ công.",
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ]
      }
    ],
    "tasks": [
      {
        "id": "TASK-001",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-001",
            "record_refs": [
              "R-001",
              "R-003",
              "R-004",
              "R-005"
            ]
          }
        ],
        "justification_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "D-001",
          "D-002",
          "D-003",
          "D-004",
          "D-005"
        ],
        "enforces_invariant_refs": []
      },
      {
        "id": "TASK-002",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-001"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-002",
            "record_refs": [
              "R-003",
              "R-005",
              "AC-003",
              "AC-006"
            ]
          }
        ],
        "justification_refs": [
          "R-003",
          "R-005",
          "D-002",
          "D-005"
        ],
        "enforces_invariant_refs": []
      },
      {
        "id": "TASK-003",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-002"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-003",
            "record_refs": [
              "R-001",
              "R-002",
              "R-003",
              "R-004",
              "R-005",
              "AC-001",
              "AC-002",
              "AC-003",
              "AC-004",
              "AC-005",
              "AC-006",
              "INV-001"
            ]
          }
        ],
        "justification_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "D-001",
          "D-003",
          "D-004",
          "D-005",
          "D-006"
        ],
        "enforces_invariant_refs": [
          "INV-001"
        ]
      },
      {
        "id": "TASK-004",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-003"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-004",
            "record_refs": [
              "R-006",
              "R-007"
            ]
          }
        ],
        "justification_refs": [
          "R-006",
          "R-007",
          "D-006"
        ],
        "enforces_invariant_refs": []
      },
      {
        "id": "TASK-005",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-003"
        ],
        "planned_paths": [
          "CHANGELOG.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-005",
            "record_refs": [
              "R-007"
            ]
          }
        ],
        "justification_refs": [
          "R-007"
        ],
        "enforces_invariant_refs": []
      },
      {
        "id": "TASK-006",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-003",
          "TASK-004",
          "TASK-005"
        ],
        "planned_paths": [
          "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
          "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
          "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.md",
          "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
          "versions/v20/SYNC-STATUS.md",
          "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
          "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
          "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.md",
          "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
          "versions/v21/SYNC-STATUS.md",
          "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
          "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
          "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.md",
          "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
          "versions/v22/SYNC-STATUS.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-006",
            "record_refs": [
              "R-007"
            ]
          }
        ],
        "justification_refs": [
          "R-007",
          "D-006"
        ],
        "enforces_invariant_refs": []
      },
      {
        "id": "TASK-007",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-001",
          "TASK-002",
          "TASK-003",
          "TASK-004",
          "TASK-005",
          "TASK-006"
        ],
        "planned_paths": [
          ".sdcorejs/docs/angular/2026-11-13-sd-scroll-touch-first-scroll-execution.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-008",
            "record_refs": [
              "R-006",
              "R-007",
              "AC-007",
              "INV-001"
            ]
          },
          {
            "id": "EVIDENCE-009",
            "record_refs": [
              "R-001",
              "AC-008"
            ]
          }
        ],
        "justification_refs": [
          "R-006",
          "R-007",
          "D-006"
        ],
        "enforces_invariant_refs": [
          "INV-001"
        ]
      }
    ],
    "repository_inventory": {
      "repositories": [
        {
          "repository_id": "sdcorejs-angular",
          "existing_paths": [
            "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
            "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
            "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.md",
            "CHANGELOG.md",
            "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
            "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
            "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll.md",
            "versions/v20/SYNC-STATUS.md",
            "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
            "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
            "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll.md",
            "versions/v21/SYNC-STATUS.md",
            "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts",
            "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
            "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll.md",
            "versions/v22/SYNC-STATUS.md"
          ],
          "intended_new_paths": [
            {
              "path": "versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
              "owner_task_id": "TASK-002"
            },
            {
              "path": ".sdcorejs/docs/angular/2026-11-13-sd-scroll-touch-first-scroll-execution.md",
              "owner_task_id": "TASK-007"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts",
              "owner_task_id": "TASK-006"
            }
          ]
        }
      ]
    },
    "critique_history": [
      {
        "round": 1,
        "checker_version": "sdcorejs-plan:goal-backward:v1",
        "blockers": [],
        "resolved_blockers": [],
        "unresolved_blockers": []
      }
    ]
  },
  "validation_map": [
    {
      "requirement_id": "R-001",
      "acceptance_criterion_id": "AC-001",
      "invariant_refs": [],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-001",
        "source_refs": [
          "R-001",
          "AC-001",
          "A-001",
          "AC-008"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-core-ui-sd-scroll-touch-auto-on-init"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Chế độ cảm ứng: overflow-x là auto ngay sau khởi tạo, không đổi theo sự kiện chuột, không có listener chuột.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-002",
      "acceptance_criterion_id": "AC-002",
      "invariant_refs": [
        "INV-001"
      ],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-003",
        "source_refs": [
          "R-002",
          "R-004",
          "AC-002",
          "AC-005",
          "INV-001"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-core-ui-sd-scroll-mouse-enter-leave"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Chế độ chuột: hidden -> auto -> hidden theo mouseenter/mouseleave; không ghi style khi di chuyển giữa phần tử con.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003",
        "EVIDENCE-008"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-003",
      "acceptance_criterion_id": "AC-003",
      "invariant_refs": [],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-002",
        "source_refs": [
          "R-003",
          "AC-003"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-core-ui-sd-scroll-single-media-listener"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Nhiều instance chỉ tạo một MediaQueryList và một listener change; đổi chế độ cập nhật mọi instance.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-004",
      "acceptance_criterion_id": "AC-004",
      "invariant_refs": [],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-004",
        "source_refs": [
          "R-004",
          "AC-004"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-core-ui-sd-scroll-cleanup-on-destroy",
        "case-core-ui-sd-scroll-no-duplicate-listeners"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Sau khi huỷ không còn phản ứng với chuột và timeout không ghi; chuyển chế độ nhiều lần không gắn trùng.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-004",
      "acceptance_criterion_id": "AC-005",
      "invariant_refs": [],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-003",
        "source_refs": [
          "R-002",
          "R-004",
          "AC-002",
          "AC-005",
          "INV-001"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-core-ui-sd-scroll-outside-zone"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Handler chuột chạy ngoài Angular zone và ApplicationRef.tick không bị gọi.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-005",
      "acceptance_criterion_id": "AC-006",
      "invariant_refs": [],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-005",
        "source_refs": [
          "R-005",
          "AC-006"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-core-ui-sd-scroll-no-matchmedia"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Không có matchMedia: hành vi cũ, không ném lỗi.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-007",
      "acceptance_criterion_id": "AC-007",
      "invariant_refs": [
        "INV-001"
      ],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-006",
        "source_refs": [
          "R-006",
          "AC-007",
          "INV-001",
          "R-007"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit",
        "integration"
      ],
      "case_ids": [
        "case-core-ui-full-suite-build-lint-surface"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage",
      "command_source": "package.json",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "Full suite có coverage và build pass; ESLint không có finding trên file đã sửa; public surface của entry point directives không đổi.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003",
        "EVIDENCE-008"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-001",
      "acceptance_criterion_id": "AC-008",
      "invariant_refs": [],
      "risk": "behavior",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-001",
        "source_refs": [
          "R-001",
          "AC-001",
          "A-001",
          "AC-008"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "uat"
      ],
      "case_ids": [
        "case-core-ui-manual-first-swipe"
      ],
      "planned_command": null,
      "command_source": "manual",
      "cwd": "versions/v19",
      "evidence_class": "SUPPLEMENTAL_SMOKE",
      "automation": "manual",
      "expected_proof": "Trên điện thoại thật hoặc chế độ thiết bị di động của DevTools, sd-table nhiều cột cuộn ngang ngay lần vuốt đầu.",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-009"
      ],
      "rationale": "Cử chỉ chạm thật không tái hiện được trong Karma; cần quan sát trên thiết bị hoặc trình duyệt giả lập.",
      "owner": "user",
      "acknowledgement_required": true,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    }
  ]
}
```

## Tasks

### Phase 1 - RED
- **TASK-001** EDIT `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts` - Viết lại spec của directive theo AC-001..AC-006 (giả lập matchMedia, đếm listener, NgZone, huỷ, SSR) và chạy để thấy RED trước khi sửa code.

### Phase 2 - GREEN
- **TASK-002** CREATE `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts` - Tạo service nội bộ providedIn root: một MediaQueryList cho "(hover: none), (any-pointer: coarse)", một listener change, signal chỉ đọc, gỡ listener khi root injector bị huỷ, chế độ chuột khi không có matchMedia. (sau TASK-001)
- **TASK-003** EDIT `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts` - Sửa directive: đặt overflow-x theo chế độ ngay khi khởi tạo; chế độ chuột gắn mouseenter/mouseleave qua Renderer2.listen trong runOutsideAngular, idempotent, chỉ ghi khi đổi; chuyển chế độ gỡ/gắn listener; scrollTop() huỷ timeout cũ; DestroyRef gỡ hết. Chạy lại spec để thấy GREEN. (sau TASK-002)

### Phase 3 - Tài liệu
- **TASK-004** EDIT `versions/v19/projects/sdcorejs-angular/directives/src/sd-scroll.md` - Cập nhật sd-scroll.md: Behavior (chế độ cảm ứng/chuột, mouseenter/mouseleave, dọn dẹp), Accessibility, Anti-patterns, Change history; ghi đánh đổi laptop cảm ứng. (sau TASK-003)
- **TASK-005** EDIT `CHANGELOG.md` - Thêm mục Fixed cho sdScroll vào [Unreleased] theo template của CHANGELOG.md, không đổi heading release. (sau TASK-003)

### Phase 4 - Dẫn xuất v20-v22
- **TASK-006** EDIT 15 file dẫn xuất (xem `generated_artifacts`) - Chạy `npm run sync` ở root repo để dẫn xuất thay đổi v19 sang v20, v21, v22 (không sửa tay); rồi `npm run check:sync`. (sau TASK-003, TASK-004, TASK-005)

### Phase 5 - Kiểm chứng và execution record
- **TASK-007** CREATE `.sdcorejs/docs/angular/2026-11-13-sd-scroll-touch-first-scroll-execution.md` - Chạy kiểm tra cuối (full suite có coverage, build, ESLint trên file đã sửa, so public surface của entry point directives trước/sau), kiểm tra thủ công AC-008, rồi ghi execution record. (sau TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006)

### Ghi chú cho TASK-001 (test)

- Giả lập `window.matchMedia` bằng `spyOn(window, 'matchMedia')` trả về MediaQueryList giả có `matches`, `addEventListener`/`removeEventListener` là spy và hàm phát `change`. Mỗi test TestBed tạo root injector mới, nên service được tạo lại; `TestBed.resetTestingModule()` huỷ root injector để kiểm tra listener được gỡ.
- AC-003: hai hoặc ba host `sdScroll` trong một component; `matchMedia` được gọi một lần, `addEventListener('change')` một lần.
- AC-002, AC-004: spy `addEventListener`/`removeEventListener` trên phần tử host để đếm listener `mouseenter`/`mouseleave`; spy `Renderer2.setStyle` hoặc đọc `style.overflowX` để kiểm tra không ghi lại khi phát `mouseover`/`mouseout` từ phần tử con.
- AC-005: trong handler, ghi lại `NgZone.isInAngularZone()` (ví dụ qua spy `setStyle`), mong đợi `false`.
- AC-004 phần timer: `fakeAsync`, gọi `scrollTop()`, huỷ fixture, `tick(1)`, `scrollTop` của phần tử không bị ghi.
- AC-006: `window.matchMedia` trả về `undefined` (đặt tạm thuộc tính về `undefined` rồi khôi phục).
- Bỏ các test dựa trên `mouseover`/`mouseout`, giữ test `translate3d`, `overflow-y` và `scrollTop()`.

## Acceptance mapping

- AC-001 -> TASK-001, TASK-003 (tự động)
- AC-002 -> TASK-001, TASK-003 (tự động)
- AC-003 -> TASK-001, TASK-002, TASK-003 (tự động)
- AC-004 -> TASK-001, TASK-003 (tự động)
- AC-005 -> TASK-001, TASK-003 (tự động)
- AC-006 -> TASK-001, TASK-002, TASK-003 (tự động)
- AC-007 -> TASK-007 (tự động)
- AC-008 -> TASK-007 (thủ công)

Validation map (8 dòng) nằm trong `plan_context.validation_map`; AC-008 là dòng thủ công, chủ sở hữu là người dùng, cần xác nhận.

## Verification

- npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts (cwd: versions/v19) - RED ở TASK-001, GREEN ở TASK-003
- npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage (cwd: versions/v19) - full suite có coverage
- npm run build (cwd: versions/v19) - build thư viện
- npx eslint projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts projects/sdcorejs-angular/directives/src/sd-scroll-pointer.service.ts projects/sdcorejs-angular/directives/src/sd-scroll.directive.ts (cwd: versions/v19) - lint file đã sửa
- So danh sách export trong versions/v19/dist/sdcorejs-angular/directives/index.d.ts trước và sau thay đổi - public surface
- `npm run sync` (cwd: root repo) - TASK-006
- `npm run check:sync` (cwd: root repo)
- `npm run test:scripts` (cwd: root repo)
- Thủ công (AC-008): mở trang có `sd-table` nhiều cột ở chế độ thiết bị di động của Chrome DevTools (hoặc điện thoại thật) và vuốt ngang ngay lần đầu. Agent làm bước smoke trên trình duyệt nếu môi trường cho phép; xác nhận cuối là của người dùng.
- Bỏ qua: Build/test v20, v21, v22 và showcase - thuộc release ritual của repo; `npm run lint` toàn repo - thay bằng ESLint trên file đã sửa.

## Write scope

- Được ghi: các file trong `allowed_paths`; file dẫn xuất v20-v22 chỉ qua `npm run sync`.
- Không ghi: `package.json`, lockfile, `node_modules`, `dist`, env, `components/table`, `showcase/`, `published-docs/`, `published-pages/`.
- Không thêm dependency, env hay migration. Không commit, push, tạo PR/MR, tag hay publish.

## Self-review

- Decision coverage hợp lệ ở stage plan; goal-backward không có blocker (1 vòng); validation map approval-ready; architecture draft-plan handoff hợp lệ.
- Đường dẫn: mọi file EDIT tồn tại, mọi file CREATE chưa tồn tại (đã kiểm tra trên đĩa).
- Coverage approach TDD: test trước code.

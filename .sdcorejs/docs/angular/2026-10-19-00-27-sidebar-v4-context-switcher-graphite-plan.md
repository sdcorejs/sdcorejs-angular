# Plan - Sidebar V4, Context Switcher và preset graphite - 2026-10-19 00:27

## Scope

Thực thi spec `spec-sidebar-v4-context-switcher-graphite-v1-r1` (`sha256:v1:fb1ff4a6…`) theo architecture r2 (`architecture-sidebar-v4-context-switcher-graphite-v1-r2`). Gồm: Sidebar V4 desktop và mobile, Context Switcher dùng chung cho V1–V4 cùng `SdLayoutContextService`, `SdStorage.refresh()`, preset `graphite` có override component token, docs, Showcase và rollout v20/v21/v22.

## Execution context

- Track: angular
- Target root kind: target-project
- Stack profile: core-ui-angular
- Coverage approach: TDD trong từng task (viết spec trước, rồi code), theo D-013
- Parallel candidates: không. Một runner Karma v19, barrel và catalog i18n dùng chung, chuỗi phụ thuộc chặt (context trước V4 và trước các mount).
- Owner: `sdcorejs-angular` (library); module `modules/layout`; nguồn v19, mirror qua `npm run sync`.
- Môi trường: Node `22.22.3` (`fnm exec --using=22.22.3 npm.cmd …`); worktree đã `npm ci` cho v19 và showcase.

## Tasks

### Phase 1 - Nền: i18n, model menu, config, storage
1. TASK-001 EDIT sdcorejs-angular: `LIB/i18n/src/en.ts`, `LIB/i18n/src/vi.ts`, `LIB/i18n/src/ja.ts`, `LIB/i18n/src/ko.ts`, `LIB/i18n/src/zh.ts` - Thêm khoá i18n `core.module.layout.*` cho search V4, Soon, nhãn badge, More, context switcher (kể cả lỗi chuyển và thông báo tab khác) ở cả 5 catalog. (R-013; AC-023; INV-010)
2. TASK-002 EDIT sdcorejs-angular: `LIB/modules/layout/services/menu/menu.model.ts`, `LIB/modules/layout/services/menu/menu.utils.ts`, `LIB/modules/layout/services/menu/menu.utils.spec.ts` - RED rồi GREEN: thêm `section`, `badge`, `status`, `comingSoon` vào `SdLayoutMenu`, bỏ comment `notify`; helper mới lọc `comingSoon` và nhóm section cho V4. `searchMenuLeaves` giữ nguyên. (R-003; AC-004, AC-007; INV-006)
3. TASK-003 EDIT sdcorejs-angular: `LIB/modules/layout/configurations/layout.configuration.ts`, `LIB/modules/layout/configurations/layout.configuration.spec.ts` - RED rồi GREEN: `SdLayoutContext`, `SdLayoutContextConfiguration`, `context` trên `SidebarConfigurationBase`, `SidebarConfigurationV4` (`version: 4`), union và overload `normalizeSidebarConfiguration` cho V4. (R-004; AC-012; INV-012)
4. TASK-004 EDIT sdcorejs-angular: `LIB/services/storage/src/storage.model.ts`, `LIB/services/storage/src/storage.service.ts`, `LIB/services/storage/src/storage.service.spec.ts`, `LIB/services/storage/sd-storage.md` - RED rồi GREEN: thêm `refresh()` vào `SdStorage`/`SdStorageWithDefault` (hydrate lại từ storage, broadcast khi đổi); ghi vào `sd-storage.md`. (R-007; AC-017; INV-002, INV-003, INV-004, INV-009, INV-010)
5. TASK-005 EDIT sdcorejs-angular: `LIB/modules/layout/services/storage/storage.service.ts`, `LIB/modules/layout/services/storage/storage.service.spec.ts` - RED rồi GREEN: handle `currentContext` (UUID cố định, namespace, trong `clear()`), `refreshCurrentContext()` và namespace đã resolve trong `SdLayoutStorageService`. (R-007; AC-016; INV-002, INV-003, INV-004, INV-009, INV-010)

### Phase 2 - Context: service, runtime, switcher
6. TASK-006 CREATE+EDIT sdcorejs-angular: `LIB/modules/layout/services/context/context.model.ts`, `LIB/modules/layout/services/context/context.runtime.ts`, `LIB/modules/layout/services/context/context.service.ts`, `LIB/modules/layout/services/context/context.service.spec.ts`, `LIB/modules/layout/services/context/index.ts`, `LIB/modules/layout/services/index.ts` - RED rồi GREEN: `SdLayoutContextService` (snapshot lúc load, `setCurrentContext`, `syncItems` theo D-025, listener `storage` lazy, cờ `switching`/`error`/`changedElsewhere`), `SD_LAYOUT_CONTEXT_RUNTIME` + factory mặc định; export qua `services/index.ts`. (R-007, R-008, R-009; AC-016, AC-017, AC-019; INV-001, INV-002, INV-003, INV-004, INV-009, INV-010)
7. TASK-007 CREATE sdcorejs-angular: `LIB/modules/layout/components/shared/context-switcher/context-switcher.component.ts`, `LIB/modules/layout/components/shared/context-switcher/context-switcher.component.html`, `LIB/modules/layout/components/shared/context-switcher/context-switcher.component.scss`, `LIB/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts` - RED rồi GREEN: `sd-layout-context-switcher` (trigger header/rail, popover CDK, search > 7 mục, trạng thái đang chuyển, lỗi inline, bottom sheet mobile, thông báo tab khác); chuyển `items` vào `syncItems`. (R-006, R-007; AC-014, AC-015, AC-018; INV-001, INV-002, INV-003, INV-004, INV-009, INV-010, INV-013)

### Phase 3 - Sidebar V4 desktop và mobile
8. TASK-008 CREATE sdcorejs-angular: `LIB/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts`, `LIB/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html`, `LIB/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss`, `LIB/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts` - RED rồi GREEN: cây menu nội bộ của V4 (dòng pill, icon chỉ ở root, branch rail và marker, chấm group active, section heading, trailing slot theo D-015, flyout cho rail thu gọn, mode mobile 44px). (R-001, R-003; AC-001, AC-006, AC-007; INV-005, INV-006)
9. TASK-009 CREATE sdcorejs-angular: `LIB/modules/layout/components/sidebar-v4/main.component.ts`, `LIB/modules/layout/components/sidebar-v4/main.component.html`, `LIB/modules/layout/components/sidebar-v4/main.component.scss`, `LIB/modules/layout/components/sidebar-v4/main.component.spec.ts` - RED rồi GREEN: `sd-sidebar-v4` (header, switcher, search Ctrl+K/⌘K, Pinned/Recent, collapse qua `versionState(3)`, rail 72px, flyout/expand, token kích thước trên host, width `var(--sd-sidebar-v4-width)`). (R-001, R-005, R-008; AC-002, AC-003, AC-004, AC-005, AC-008, AC-018; INV-001, INV-005, INV-006, INV-007)
10. TASK-010 CREATE sdcorejs-angular: `LIB/modules/layout/components/sidebar-mobile-v4/main.component.ts`, `LIB/modules/layout/components/sidebar-mobile-v4/main.component.html`, `LIB/modules/layout/components/sidebar-mobile-v4/main.component.scss`, `LIB/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts` - RED rồi GREEN: `sd-sidebar-mobile-v4` (app bar 56px, drawer V4 mode mobile, focus trap và trả focus, xoá query khi đóng, bottom bar opt-in, switcher trong header drawer). (R-002, R-008; AC-009, AC-010, AC-018; INV-001, INV-011)
11. TASK-011 EDIT sdcorejs-angular: `LIB/modules/layout/components/layout-main/layout-main.component.ts`, `LIB/modules/layout/components/layout-main/layout-main.component.html`, `LIB/modules/layout/components/layout-main/layout-main.component.spec.ts`, `LIB/modules/layout/components/index.ts` - RED rồi GREEN: nhánh `version: 4` trong `sd-layout` (desktop/mobile theo breakpoint); export V4 desktop, mobile và switcher từ `components/index.ts` (cây V4 không export). (R-004; AC-012; INV-012)

### Phase 4 - Gắn switcher vào V1–V3 và mobile V1–V3
12. TASK-012 EDIT sdcorejs-angular: `LIB/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts`, `LIB/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html`, `LIB/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss`, `LIB/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts` - RED rồi GREEN: gắn switcher vào header V1 (dưới tiêu đề; avatar ở rail khi đóng), chỉ khi có `context`. (R-008; AC-011, AC-018; INV-001, INV-006)
13. TASK-013 EDIT sdcorejs-angular: `LIB/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts`, `LIB/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html`, `LIB/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss`, `LIB/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts` - RED rồi GREEN: gắn trigger switcher vào header drawer của mobile V1, chỉ khi có `context`. (R-008; AC-011, AC-018; INV-001, INV-006)
14. TASK-014 EDIT sdcorejs-angular: `LIB/modules/layout/components/sidebar-v2/main.component.ts`, `LIB/modules/layout/components/sidebar-v2/main.component.html`, `LIB/modules/layout/components/sidebar-v2/main.component.scss`, `LIB/modules/layout/components/sidebar-v2/main.component.spec.ts`, `LIB/modules/layout/components/sidebar-mobile-v2/main.component.ts`, `LIB/modules/layout/components/sidebar-mobile-v2/main.component.html`, `LIB/modules/layout/components/sidebar-mobile-v2/main.component.scss`, `LIB/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts` - RED rồi GREEN: V2 có avatar context dưới logo ở rail; mobile V2 có trigger ở dòng đầu của sheet menu; chỉ khi có `context`. (R-008; AC-011, AC-018; INV-001, INV-006)
15. TASK-015 EDIT sdcorejs-angular: `LIB/modules/layout/components/sidebar-v3/main.component.ts`, `LIB/modules/layout/components/sidebar-v3/main.component.html`, `LIB/modules/layout/components/sidebar-v3/main.component.scss`, `LIB/modules/layout/components/sidebar-v3/main.component.spec.ts`, `LIB/modules/layout/components/sidebar-mobile-v3/main.component.ts`, `LIB/modules/layout/components/sidebar-mobile-v3/main.component.html`, `LIB/modules/layout/components/sidebar-mobile-v3/main.component.scss`, `LIB/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts` - RED rồi GREEN: V3 có switcher dưới tên app (avatar ở đầu rail khi thu gọn); mobile V3 có trigger trong header drawer; chỉ khi có `context`. (R-003, R-008; AC-011, AC-018; INV-001, INV-006)

### Phase 5 - Preset graphite và token
16. TASK-016 EDIT sdcorejs-angular: `LIB/assets/scss/themes/_component-tokens.scss`, `LIB/assets/scss/themes/_presets.scss`, `LIB/assets/scss/themes/default.scss`, `scripts/core-theme.test.mjs`, `scripts/theme-contrast.test.mjs` - RED rồi GREEN: token màu `sidebar-v4-*`, hàm kiểm và tham số override cho `emit`, preset `graphite` kèm map `components`, mixin tách override; test theme phủ graphite, override, key lạ và parity. (R-005, R-010, R-011; AC-013, AC-020, AC-021; INV-006, INV-007, INV-008)

### Phase 6 - Docs, Showcase, rollout và kiểm chứng
17. TASK-017 EDIT sdcorejs-angular: `LIB/modules/layout/sd-layout.md`, `LIB/assets/STYLE-GUIDE.md`, `LIB/assets/THEME.md`, `CHANGELOG.md` - Docs: `sd-layout.md` (V4, field menu, API context, luật bootstrap, runtime), `THEME.md`/`STYLE-GUIDE.md` (chín preset, graphite, `components`, giới hạn link), mục Unreleased trong `CHANGELOG.md`. (R-012, R-013; AC-022; INV-010, INV-014)
18. TASK-018 EDIT sdcorejs-angular: `showcase/src/app/pages/modules/layout/layout-demo.component.ts`, `showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts`, `showcase/src/styles.scss`, `showcase/src/app/docs/core/documentation.registry.ts`, `showcase/src/app/docs/core/documentation.registry.spec.ts`, `showcase/src/app/docs/generated/example-sources.generated.ts`, `showcase/src/app/docs/generated/example-manifest.generated.ts`, `showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts` - Showcase: 2 section mới ("Sidebar V4", "Sidebar V4 - graphite"), context chung cho mọi version với runtime giả, scope `graphite` trong `styles.scss`, số đếm registry 3→5 và 414→416, sinh lại manifest/sources, ghi chú 9 preset. (R-013; AC-023; INV-010)
19. TASK-019 EDIT sdcorejs-angular:versions/v20|v21|v22/** - Rollout: `npm run sync` sang v20/v21/v22, đưa file v22 về LF, `npm run check:sync`; mirror đúng các file v19 ở trên và SYNC-STATUS.md. (219 path; danh sách đầy đủ trong `plan_context`)

Ghi chú:
- `LIB/` = `versions/v19/projects/sdcorejs-angular/`.
- Trong mỗi task có spec, chạy spec đỏ trước rồi mới code. Lệnh của từng task nằm trong `validation_map`.
- TASK-019 chỉ chạy sau khi các task khác xanh. Sau `npm run sync`, đưa file v22 về LF và bỏ các file chỉ đổi EOL, theo memory `sync-v22-crlf-rewrite`.

## Acceptance mapping

- AC-001 -> TASK-008
- AC-002 -> TASK-009
- AC-003 -> TASK-009
- AC-004 -> TASK-002, TASK-009
- AC-005 -> TASK-009
- AC-006 -> TASK-008
- AC-007 -> TASK-002, TASK-008
- AC-008 -> TASK-009
- AC-009 -> TASK-010
- AC-010 -> TASK-010
- AC-011 -> TASK-012, TASK-013, TASK-014, TASK-015
- AC-012 -> TASK-003, TASK-011
- AC-013 -> TASK-016
- AC-014 -> TASK-007
- AC-015 -> TASK-007
- AC-016 -> TASK-005, TASK-006
- AC-017 -> TASK-004, TASK-006
- AC-018 -> TASK-007, TASK-009, TASK-010, TASK-012, TASK-013, TASK-014, TASK-015
- AC-019 -> TASK-006
- AC-020 -> TASK-016
- AC-021 -> TASK-016
- AC-022 -> TASK-017
- AC-023 -> TASK-001, TASK-018, TASK-019

## Verification

- Từng task: lệnh trong `validation_map` (Karma `--include` theo spec của task, cwd `versions/v19`).
- `npm run check:i18n-parity && npm run check:i18n` (cwd `versions/v19`).
- `npm run lint`, `npm run build`, rồi full suite `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (cwd `versions/v19`).
- `npm run test:theme && npm run check:scss-hex` (cwd root).
- Grep VAL-002/VAL-010 trong `services/context`; `git diff` trống dưới `shared/menu-tree` (VAL-006).
- `npm run generate:showcase-examples && npm run test:showcase-examples`; `npm --prefix showcase run link:library && npm --prefix showcase test`; `npm --prefix showcase run build`.
- `npm run sync` → sửa LF cho v22 → `npm run check:sync`; `npm run test:scripts` (cwd root).
- Lệnh assertion docs của TASK-017.
- Không có bước manual. Ảnh chụp Showcase chỉ là UAT tuỳ chọn, ngoài gate.

## Decisions captured in planning

- Task partition gắn mỗi task với đúng các dòng (R, AC) mà spec của nó chứng minh. Invariant của task là hợp các invariant của những dòng đó, theo luật reciprocity của convergence.
- Bỏ AC-013 khỏi TASK-009 vì dòng đó trộn lệnh Karma và lệnh script. AC-013 do TASK-016 chứng minh (`test:theme` + `check:scss-hex`), còn "V3 vẫn 304px" do spec V3 ở TASK-015 giữ.
- TASK-003 chỉ còn R-004 (`context` trên Base được biện minh bằng D-008). R-008 đi qua TASK-006 (đối chiếu `items`), các task mount và V4. TASK-015 thêm R-003 để có dòng (R-003, AC-011). TASK-007 thêm AC-018.
- Cần architecture r2 (thêm INV-011…INV-014 và `validation_boundary` trên D-013), để mọi dòng validation có invariant và một boundary đã duyệt.
- `layout.service.ts` và `components/shared/menu-tree/**` nằm trong `prohibited_paths` (D-021, INV-006).
- Showcase thêm 2 section: layout `demoSectionCount` 3→5, tổng registry 414→416 (2 chỗ), assertion layout 3→5.
- Dry-run convergence đầy đủ chưa chạy ở bước plan, vì input cần evidence thật. Graph đã qua `validateDecisionCoverage` (plan), `validateGoalBackwardPlan` và `validateValidationMap`. Projection lúc ship phải đặt `task.evidence_refs` bằng hợp evidence của các dòng liên quan.

## Appendix — plan_context (machine-readable)

```yaml
plan_context: {
  "schema_version": 2,
  "source": "sdcorejs-plan",
  "architecture_gate": {
    "valid": true,
    "required": true,
    "status": "required",
    "signals": [
      "persisted-data-model-contract",
      "public-api-contract",
      "state-data-ownership"
    ],
    "bypass": null,
    "rationale": "Adds public layout API (sd-sidebar-v4, sd-sidebar-mobile-v4, sd-layout-context-switcher, SdLayoutContextService, SidebarConfigurationV4, new SdLayoutMenu fields) and a public preset components key; makes Core the owner of the current-context state (bootstrap read, reconcile, reload); and introduces a persisted client-side context snapshot in localStorage that survives reloads and is shared across tabs."
  },
  "architecture_context": {
    "schema_version": 1,
    "source": "sdcorejs-architecture",
    "contract_id": "sidebar-v4-context-switcher-graphite-v1",
    "requirement_id": "R-007",
    "approved_spec_reference": {
      "repository_id": "sdcorejs-angular",
      "artifact_id": "spec-sidebar-v4-context-switcher-graphite-v1-r1",
      "artifact_kind": "spec",
      "revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
      "approval_hash": "sha256:v1:fb1ff4a6da2a5e03d4675ef5fb9451f356298bb96efaa1cc387b280ad035a131"
    },
    "approved_architecture_path": ".sdcorejs/architecture/angular/2026-10-18-11-40-sidebar-v4-context-switcher-graphite-r2.md",
    "approved_architecture_hash": "sha256:v1:508833610265333520d5d819797db8adf7f98bc87376c4edf1771817741da4fa",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "modules/layout",
    "execution_host_repository_id": "sdcorejs-angular",
    "integration_owner_repository_id": "sdcorejs-angular",
    "trigger": {
      "required": true,
      "signals": [
        "persisted-data-model-contract",
        "public-api-contract",
        "state-data-ownership"
      ],
      "rationale": "Adds public layout API (sd-sidebar-v4, sd-sidebar-mobile-v4, sd-layout-context-switcher, SdLayoutContextService, SidebarConfigurationV4, new SdLayoutMenu fields) and a public preset components key; makes Core the owner of the current-context state (bootstrap read, reconcile, reload); and introduces a persisted client-side context snapshot in localStorage that survives reloads and is shared across tabs."
    },
    "invariants": [
      {
        "id": "INV-001",
        "statement": "Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.",
        "scope": "sidebar V1-V3 and mobile V1-V3 templates and the context handle",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "Apps that do not configure context must see no change.",
        "verification_method": "VAL-001",
        "requirement_refs": [
          "R-008"
        ],
        "decision_refs": [
          "D-005",
          "D-010"
        ]
      },
      {
        "id": "INV-002",
        "statement": "Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.",
        "scope": "modules/layout/services/context and its callers",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "One owner for the current-context state; SdLayoutService throws without configuration and must not be pulled in at bootstrap.",
        "verification_method": "VAL-002",
        "requirement_refs": [
          "R-007"
        ],
        "decision_refs": [
          "D-008",
          "D-009",
          "D-021",
          "D-024"
        ]
      },
      {
        "id": "INV-003",
        "statement": "A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.",
        "scope": "SdLayoutContextService.setCurrentContext and syncItems",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "Prevents reload loops from failed writes, late namespaces, custom adapters or changing items.",
        "verification_method": "VAL-003",
        "requirement_refs": [
          "R-007"
        ],
        "decision_refs": [
          "D-008",
          "D-018",
          "D-019",
          "D-025"
        ]
      },
      {
        "id": "INV-004",
        "statement": "Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.",
        "scope": "SdLayoutContextService state and the storage listener",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "Consumers load permissions once per page; a tab must not silently switch context.",
        "verification_method": "VAL-004",
        "requirement_refs": [
          "R-007",
          "R-009"
        ],
        "decision_refs": [
          "D-008",
          "D-011",
          "D-020",
          "D-025"
        ]
      },
      {
        "id": "INV-005",
        "statement": "V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.",
        "scope": "sd-sidebar-v4 collapse persistence and new storage records",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "Keeps the V3 storage key as required and preserves the user's preference when an app moves from V3 to V4.",
        "verification_method": "VAL-005",
        "requirement_refs": [
          "R-001"
        ],
        "decision_refs": [
          "D-004",
          "D-024",
          "D-025"
        ]
      },
      {
        "id": "INV-006",
        "statement": "components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.",
        "scope": "modules/layout shared tree, menu utils, V1/V3 styles and the V4 tree",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "V2, V3 and mobile sidebars depend on the shared tree; isolating V4 removes regression risk.",
        "verification_method": "VAL-006",
        "requirement_refs": [
          "R-001",
          "R-003"
        ],
        "decision_refs": [
          "D-005",
          "D-014",
          "D-023"
        ]
      },
      {
        "id": "INV-007",
        "statement": "V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.",
        "scope": "sidebar-v4 and sidebar-mobile-v4 stylesheets, _component-tokens.scss",
        "owner": "sdcorejs-angular/assets/scss/themes",
        "rationale": "Dark mode and presets must apply without component code; the sidebar has no colour input.",
        "verification_method": "VAL-007",
        "requirement_refs": [
          "R-005"
        ],
        "decision_refs": [
          "D-006"
        ]
      },
      {
        "id": "INV-008",
        "statement": "A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.",
        "scope": "assets/scss/themes default.scss, _presets.scss, _component-tokens.scss",
        "owner": "sdcorejs-angular/assets/scss/themes",
        "rationale": "A generic, validated override path instead of a graphite special case; keeps light-only presets.",
        "verification_method": "VAL-008",
        "requirement_refs": [
          "R-010",
          "R-011"
        ],
        "decision_refs": [
          "D-007",
          "D-029"
        ]
      },
      {
        "id": "INV-009",
        "statement": "SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.",
        "scope": "services/storage SdStorage handles",
        "owner": "sdcorejs-angular/services/storage",
        "rationale": "refresh() is a new public method; existing consumers of SdStorage must see no behaviour change.",
        "verification_method": "VAL-009",
        "requirement_refs": [
          "R-007"
        ],
        "decision_refs": [
          "D-019"
        ]
      },
      {
        "id": "INV-010",
        "statement": "Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.",
        "scope": "modules/layout/services/context, its specs and the Showcase layout demo",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "A real reload aborts Karma and reloads the docs site; the seam keeps every path testable.",
        "verification_method": "VAL-010",
        "requirement_refs": [
          "R-007",
          "R-009",
          "R-013"
        ],
        "decision_refs": [
          "D-022",
          "D-030"
        ]
      },
      {
        "id": "INV-011",
        "statement": "Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.",
        "scope": "sd-sidebar-mobile-v4 drawer and bottom bar",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "Mobile V4 must share V4 rendering and keep the V3 drawer accessibility contract.",
        "verification_method": "VAL-011",
        "requirement_refs": [
          "R-002"
        ],
        "decision_refs": [
          "D-002",
          "D-023"
        ]
      },
      {
        "id": "INV-012",
        "statement": "V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.",
        "scope": "normalizeSidebarConfiguration and sd-layout version selection",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "One place for defaults keeps desktop, mobile and docs consistent.",
        "verification_method": "VAL-012",
        "requirement_refs": [
          "R-004"
        ],
        "decision_refs": [
          "D-002"
        ]
      },
      {
        "id": "INV-013",
        "statement": "The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.",
        "scope": "sd-layout-context-switcher rendering",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "The switcher is shared by four sidebars and must behave the same everywhere.",
        "verification_method": "VAL-013",
        "requirement_refs": [
          "R-006"
        ],
        "decision_refs": [
          "D-017",
          "D-028"
        ]
      },
      {
        "id": "INV-014",
        "statement": "Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.",
        "scope": "sd-layout.md, THEME.md, STYLE-GUIDE.md and CHANGELOG.md",
        "owner": "sdcorejs-angular/modules/layout",
        "rationale": "Docs are published per version to consumers and AI agents; they must match the shipped API.",
        "verification_method": "VAL-014",
        "requirement_refs": [
          "R-012",
          "R-013"
        ],
        "decision_refs": [
          "D-016"
        ]
      }
    ],
    "boundaries": [
      {
        "id": "B-001",
        "statement": "SdLayoutContextService is the only owner of the current context and its snapshot; sidebars, the switcher and consumers go through its public methods and signals.",
        "invariant_refs": [
          "INV-002",
          "INV-003",
          "INV-004"
        ]
      },
      {
        "id": "B-002",
        "statement": "The V4 tree is private to the V4 desktop and mobile components; the shared menu tree keeps serving V2, V3 and mobile V1-V3 unchanged.",
        "invariant_refs": [
          "INV-006"
        ]
      },
      {
        "id": "B-003",
        "statement": "Presets reach component tokens only through the validated components map; component styles read tokens and never branch on a preset.",
        "invariant_refs": [
          "INV-007",
          "INV-008"
        ]
      },
      {
        "id": "B-004",
        "statement": "Browser effects of the context feature (reload, storage events, session marker) cross into the app only through SD_LAYOUT_CONTEXT_RUNTIME.",
        "invariant_refs": [
          "INV-010"
        ]
      }
    ],
    "dependency_directions": [
      {
        "from": "sd-sidebar-v1..v4 and sd-sidebar-mobile-v1..v4",
        "to": "sd-layout-context-switcher",
        "rationale": "Each sidebar mounts the shared switcher only when context is configured.",
        "invariant_refs": [
          "INV-001"
        ]
      },
      {
        "from": "sd-layout-context-switcher",
        "to": "SdLayoutContextService",
        "rationale": "Forwards items to syncItems; reads current, switching, error and changedElsewhere; calls setCurrentContext.",
        "invariant_refs": [
          "INV-002"
        ]
      },
      {
        "from": "SdLayoutContextService",
        "to": "SdLayoutStorageService",
        "rationale": "New: snapshot persistence, refreshCurrentContext() and the resolved namespace.",
        "invariant_refs": [
          "INV-002",
          "INV-003"
        ]
      },
      {
        "from": "SdLayoutStorageService",
        "to": "SdStorage.refresh() in @sdcorejs/angular/services",
        "rationale": "New additive storage API used for confirmed writes and cross-tab reads.",
        "invariant_refs": [
          "INV-003",
          "INV-009"
        ]
      },
      {
        "from": "SdLayoutContextService",
        "to": "SD_LAYOUT_CONTEXT_RUNTIME",
        "rationale": "New: reload, storage-event subscription and the session marker.",
        "invariant_refs": [
          "INV-010"
        ]
      },
      {
        "from": "sd-sidebar-v4 and sd-sidebar-mobile-v4",
        "to": "components/sidebar-v4/menu-tree",
        "rationale": "Private V4 tree; neither imports components/shared/menu-tree.",
        "invariant_refs": [
          "INV-006"
        ]
      },
      {
        "from": "assets/scss/themes/default.scss",
        "to": "_presets.scss components map and _component-tokens.scss validation and emit",
        "rationale": "The theme mixin extracts preset component overrides, validates them and passes them to the emitter.",
        "invariant_refs": [
          "INV-008"
        ]
      }
    ],
    "data_state_owners": [
      {
        "subject": "Current context (load-time id, refreshed metadata, switching, error and changed-elsewhere flags)",
        "owner_repository_id": "sdcorejs-angular",
        "invariant_refs": [
          "INV-002",
          "INV-004"
        ]
      },
      {
        "subject": "Persisted context snapshot { id, title, subtitle?, avatar? } in the currentContext handle",
        "owner_repository_id": "sdcorejs-angular",
        "invariant_refs": [
          "INV-002",
          "INV-003"
        ]
      },
      {
        "subject": "Session reconcile marker (last reload target id, sessionStorage via the runtime)",
        "owner_repository_id": "sdcorejs-angular",
        "invariant_refs": [
          "INV-003",
          "INV-005"
        ]
      },
      {
        "subject": "Context items list (consumer sidebar configuration, forwarded by the switcher)",
        "owner_repository_id": "sdcorejs-angular",
        "invariant_refs": [
          "INV-003"
        ]
      },
      {
        "subject": "V4 collapsed state (versionStates entry 3)",
        "owner_repository_id": "sdcorejs-angular",
        "invariant_refs": [
          "INV-005"
        ]
      },
      {
        "subject": "--sd-sidebar-v4-* colour tokens and preset overrides",
        "owner_repository_id": "sdcorejs-angular",
        "invariant_refs": [
          "INV-007",
          "INV-008"
        ]
      }
    ],
    "public_contracts": [
      {
        "id": "PC-001",
        "kind": "api",
        "owner": "sdcorejs-angular/modules/layout",
        "statement": "@sdcorejs/angular/modules/layout exports SdSidebarV4, SdSidebarMobileV4, SdLayoutContextSwitcher, SdLayoutContextService, SdLayoutContext, SdLayoutContextConfiguration, SidebarConfigurationV4, SD_LAYOUT_CONTEXT_RUNTIME and SdLayoutContextRuntime; ISdSidebarConfiguration accepts version 4; SidebarConfigurationBase gains context; SdLayoutStorageService gains refreshCurrentContext() and the resolved namespace.",
        "compatibility": "Additive. Existing V1-V3 configurations compile and behave unchanged.",
        "migration": "Opt in with version: 4 and/or context; call getCurrentContext() in provideAppInitializer after the storage namespace can resolve.",
        "invariant_refs": [
          "INV-001",
          "INV-002",
          "INV-010"
        ]
      },
      {
        "id": "PC-002",
        "kind": "api",
        "owner": "sdcorejs-angular/modules/layout",
        "statement": "SdLayoutMenu gains optional section, badge, status and comingSoon; the commented notify field is removed.",
        "compatibility": "Additive; only V4 renders the fields, V1-V3 ignore them.",
        "migration": "None.",
        "invariant_refs": [
          "INV-006"
        ]
      },
      {
        "id": "PC-003",
        "kind": "api",
        "owner": "sdcorejs-angular/assets/scss/themes",
        "statement": "sd.theme accepts $preset: 'graphite'; a named preset map may carry a components map of single-value component-token overrides validated against $component-tokens.",
        "compatibility": "Additive; existing presets and $theme overrides are unchanged; graphite with dark/auto fails like other named presets.",
        "migration": "Backoffice consoles use @include sd.theme($preset: 'graphite').",
        "invariant_refs": [
          "INV-007",
          "INV-008"
        ]
      },
      {
        "id": "PC-004",
        "kind": "persisted-data-model",
        "owner": "sdcorejs-angular/modules/layout",
        "statement": "A new SdLayoutStorageService handle currentContext stores { id, title, subtitle?, avatar? }, namespaced by SD_LAYOUT_STORAGE_NAMESPACE and removed by clear(); a per-tab sessionStorage marker stores the last reconcile reload target id.",
        "compatibility": "New records; no existing key changes. A stale or unknown id falls back to items[0] with at most one reload per tab session.",
        "migration": "None. Apps that namespace layout storage per user must let the namespace resolve before calling getCurrentContext().",
        "invariant_refs": [
          "INV-002",
          "INV-003",
          "INV-005"
        ]
      },
      {
        "id": "PC-005",
        "kind": "api",
        "owner": "sdcorejs-angular/i18n",
        "statement": "The five built-in catalogs gain core.module.layout keys for V4 search, the Soon chip, badge labels, the More destination and the context switcher (including the switch error).",
        "compatibility": "Additive for apps using built-in catalogs; a hand-written typed catalog must add the keys.",
        "migration": "Copy the new keys from the built-in catalog.",
        "invariant_refs": [
          "INV-001"
        ]
      },
      {
        "id": "PC-006",
        "kind": "api",
        "owner": "sdcorejs-angular/services/storage",
        "statement": "SdStorage<T> and SdStorageWithDefault<T> gain refresh(), which re-reads the entry from storage, broadcasts to live handles when it changed and returns the current value.",
        "compatibility": "Additive for callers; code that implements the SdStorage interface by hand must add the method.",
        "migration": "None for callers.",
        "invariant_refs": [
          "INV-009"
        ]
      }
    ],
    "security_trust_boundaries": [],
    "cross_repository_integration": [],
    "adopted_decision_refs": [
      "D-001",
      "D-002",
      "D-003",
      "D-004",
      "D-005",
      "D-006",
      "D-007",
      "D-008",
      "D-009",
      "D-010",
      "D-011",
      "D-012",
      "D-013",
      "D-014",
      "D-015",
      "D-016",
      "D-017",
      "D-018",
      "D-019",
      "D-020",
      "D-021",
      "D-022",
      "D-023",
      "D-024",
      "D-025",
      "D-026",
      "D-027",
      "D-028",
      "D-029",
      "D-030"
    ],
    "deferred_decision_refs": [],
    "assumption_refs": [
      "A-001",
      "A-002",
      "A-003",
      "A-004"
    ],
    "validation_obligations": [
      {
        "id": "VAL-001",
        "expected_proof": "Existing V1, V2, V3 and mobile V1-V3 specs pass unchanged with menus carrying the new fields and no context; a spec asserts no switcher element and no write to the context handle.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-001"
        ],
        "acceptance_criterion_refs": [
          "AC-011",
          "AC-018"
        ]
      },
      {
        "id": "VAL-002",
        "expected_proof": "Service specs drive get/set through SdLayoutStorageService over a storage adapter; a grep proves SdLayoutContextService and SdLayoutService do not import each other and no component touches the context handle; getCurrentContext works without SD_LAYOUT_CONFIGURATION.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-002"
        ],
        "acceptance_criterion_refs": [
          "AC-016"
        ]
      },
      {
        "id": "VAL-003",
        "expected_proof": "Service specs with a fake runtime prove: one reload after a confirmed write; no reload for the active id, an unknown id, empty items, an unconfirmed write, or when the marker already holds the target; a namespace that resolves after getCurrentContext produces at most one reload per session plus a warning; a second load with a valid id does not reload.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-003"
        ],
        "acceptance_criterion_refs": [
          "AC-015",
          "AC-017"
        ]
      },
      {
        "id": "VAL-004",
        "expected_proof": "Specs emit storage events through the fake runtime: a different stored id in the same namespace raises changedElsewhere while getCurrentContext keeps the load-time id; a removed snapshot, an unrelated change or a namespace change raises nothing; Reload calls the runtime only on click.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-004"
        ],
        "acceptance_criterion_refs": [
          "AC-016",
          "AC-019"
        ]
      },
      {
        "id": "VAL-005",
        "expected_proof": "V4 spec toggles collapse and asserts patchVersionState(3, ...) and restoration from versionState(3); a storage-key listing equals the V3 listing.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-005"
        ],
        "acceptance_criterion_refs": [
          "AC-003"
        ]
      },
      {
        "id": "VAL-006",
        "expected_proof": "git diff shows no change under components/shared/menu-tree and to searchMenuLeaves; V3 spec still measures 304px; the public components index does not export the V4 tree.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-006"
        ],
        "acceptance_criterion_refs": [
          "AC-011",
          "AC-013"
        ]
      },
      {
        "id": "VAL-007",
        "expected_proof": "A script test compiles light and dark themes and every named preset and asserts each --sd-sidebar-v4-* colour token is present; a scan of V4 SCSS finds no hex literal and no 304px.",
        "owner": "sdcorejs-angular/assets/scss/themes",
        "invariant_refs": [
          "INV-007"
        ],
        "acceptance_criterion_refs": [
          "AC-013",
          "AC-021"
        ]
      },
      {
        "id": "VAL-008",
        "expected_proof": "core-theme and theme-contrast tests cover graphite: exact palette, override values only under graphite with the full box-shadow, identical --sd-* key sets across presets, @error from component-tokens.emit for an unknown key, and the light-only error for dark/auto.",
        "owner": "sdcorejs-angular/assets/scss/themes",
        "invariant_refs": [
          "INV-008"
        ],
        "acceptance_criterion_refs": [
          "AC-020",
          "AC-021"
        ]
      },
      {
        "id": "VAL-009",
        "expected_proof": "SdStorageService specs: refresh() returns what another writer put in storage, returns undefined after a failed write, broadcasts only on change, and the existing storage specs pass unchanged.",
        "owner": "sdcorejs-angular/services/storage",
        "invariant_refs": [
          "INV-009"
        ],
        "acceptance_criterion_refs": [
          "AC-017",
          "AC-019"
        ]
      },
      {
        "id": "VAL-010",
        "expected_proof": "A grep finds no location.reload, window.addEventListener or sessionStorage use in modules/layout/services/context outside the default runtime factory; every context spec and the Showcase layout demo provide a fake runtime and the Karma and Showcase runs finish without a page reload.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-010"
        ],
        "acceptance_criterion_refs": [
          "AC-016",
          "AC-023"
        ]
      },
      {
        "id": "VAL-011",
        "expected_proof": "Mobile V4 spec: drawer renders the V4 tree with 44px rows, each close path (backdrop, Esc, menu selection) clears the query and returns focus; bottom bar keeps at most four valid ids plus More and is absent without the setting.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-011"
        ],
        "acceptance_criterion_refs": [
          "AC-009",
          "AC-010"
        ]
      },
      {
        "id": "VAL-012",
        "expected_proof": "Configuration spec covers V4 normalization defaults and bottomBar sanitising; layout-main spec renders V4 only for version 4 and switches desktop/mobile live.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-012"
        ],
        "acceptance_criterion_refs": [
          "AC-012"
        ]
      },
      {
        "id": "VAL-013",
        "expected_proof": "Switcher spec covers 0, 1, 7 and 8 items, searchable true/false, accent-insensitive filtering, image and initial avatars, and the active row from the service current id.",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-013"
        ],
        "acceptance_criterion_refs": [
          "AC-014"
        ]
      },
      {
        "id": "VAL-014",
        "expected_proof": "A node -e assertion checks sd-layout.md, THEME.md, STYLE-GUIDE.md and CHANGELOG.md for the planned statements (nine presets, graphite values, link limitation, SidebarConfigurationV4, menu fields, getCurrentContext bootstrap rule, Unreleased entry).",
        "owner": "sdcorejs-angular/modules/layout",
        "invariant_refs": [
          "INV-014"
        ],
        "acceptance_criterion_refs": [
          "AC-022"
        ]
      }
    ],
    "profile_sections": {
      "frontend_architecture_ref": {
        "reference": "plan_context.frontend_architecture",
        "conformance_invariant_refs": [
          "INV-001",
          "INV-006",
          "INV-007",
          "INV-010"
        ]
      },
      "agent_architecture_ref": null
    },
    "change_control": {
      "revision": 2,
      "supersedes": "architecture-sidebar-v4-context-switcher-graphite-v1-r1"
    }
  },
  "decision_coverage": {
    "schema_version": 1,
    "revision": 4,
    "records": [
      {
        "id": "R-001",
        "type": "requirement",
        "statement": "A desktop sd-sidebar-v4 component, forked from sd-sidebar-v3, renders the README D1-D4 frames: header (logo, app name, context slot, collapse button), pill search with Ctrl+K/Cmd+K focus and Up/Down/Enter/Esc result navigation, flat accent-insensitive search results with match highlight, Pinned and Recent shortcut sections, menu sections from menu.section, root/group/child rows with pill active state and child marker, a dot on a closed group that contains the active route, the trailing slot, the account footer, the 72px collapsed rail with separators and mini badges, and the collapsed-group flyout. It keeps V3 routing, navigation side effects, the collapse storage entry and the V3 accessibility rules.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-008",
          "TASK-009"
        ]
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "A mobile sd-sidebar-mobile-v4 component, forked from sd-sidebar-mobile-v3, renders the README M1-M3 frames: a 56px app bar, a drawer of min(88vw, 360px) with the V4 tree in mobile mode (44px rows, 44px search, close button), closing on backdrop, menu selection or Esc with a focus trap and focus return, clearing the query on close, and an opt-in bottom bar built from mobile.bottomBar (at most 4 menu ids plus More).",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-010"
        ]
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "SdLayoutMenu gains optional fields section, badge { value, tone }, status { label, tone, live } and comingSoon, replacing the commented notify field. Existing menus compile and behave unchanged. Only V4 desktop and mobile render the new fields; a comingSoon item is aria-disabled, never navigates and is excluded from V4 search. searchMenuLeaves keeps its current behavior.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-002",
          "TASK-008",
          "TASK-015"
        ]
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "SidebarConfigurationV4 (version: 4) extends SidebarConfigurationV3 with itemShape, density, collapsedGroup and mobile.bottomBar. It joins ISdSidebarConfiguration, normalizeSidebarConfiguration fills its defaults, and the sd-layout component renders V4 desktop or mobile by breakpoint. V4 ignores brandColor and brandLightColor.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-003",
          "TASK-011"
        ]
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "Every V4 colour goes through --sd-* tokens: the --sd-sidebar-v4-* colour tokens of the README table live in the theme component-token map with light and dark values, and the size tokens (width 280px, rail width 72px, item and child height, item radius) are declared on the .sd-sidebar-v4 host. V4 has no colour input and no hard-coded hex or 304px; its offsets use var(--sd-sidebar-v4-width) and var(--sd-sidebar-v4-rail-width). V1 and V3 keep their 304px layout.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-009",
          "TASK-016"
        ]
      },
      {
        "id": "R-006",
        "type": "requirement",
        "statement": "A shared sd-layout-context-switcher component in components/shared/context-switcher renders the README CS1-CS3 states: header trigger, desktop popover with optional accent-insensitive search (auto above 7 items, forced by searchable), label and count, rows with image or initial avatar and an active check, the switching state that locks the list, and the mobile bottom sheet. One item shows the name only and cannot open; no configuration renders nothing. On a collapsed rail it shows the context avatar and opens to the right.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-007"
        ]
      },
      {
        "id": "R-007",
        "type": "requirement",
        "statement": "SdLayoutContextService (providedIn root) exposes getCurrentContext(): SdLayoutContext | null and setCurrentContext(id): void. Core persists a context snapshot through SdLayoutStorageService, reloads the page after a switch, emits no change event, ignores a re-selection of the active context, and reconciles the stored snapshot with the configured items so that a missing or stale id falls back to items[0] with at most one reload.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ]
      },
      {
        "id": "R-008",
        "type": "requirement",
        "statement": "SidebarConfigurationBase gains context?: SdLayoutContextConfiguration shared by V1-V4. The switcher is mounted in the headers of sidebar V1, V2, V3 and V4 and in the drawer header of mobile V1-V4 at the agreed positions. Without context every sidebar renders exactly as before.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-006",
          "TASK-009",
          "TASK-010",
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ]
      },
      {
        "id": "R-009",
        "type": "requirement",
        "statement": "When another tab changes the stored context, an open tab shows a notice that the context changed elsewhere with a Reload action, and never reloads by itself.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "R-010",
        "type": "requirement",
        "statement": "A ninth named preset 'graphite' is added to the theme presets with the README palette values. It is light-only like the other named presets, inherits the semantic state colours and keeps primary-contrast white.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "assets/scss/themes",
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "R-011",
        "type": "requirement",
        "statement": "A named preset can override component tokens through an optional components sub-map that the theme mixin forwards to the component-token emitter; unknown keys fail compilation. 'graphite' overrides --sd-sidebar-v4-active-bg and --sd-sidebar-v4-active-shadow so the active V4 item is a raised surface.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "assets/scss/themes",
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "R-012",
        "type": "requirement",
        "statement": "The audit of components that colour links or text buttons with --sd-primary is recorded, no new token is created, and the theme docs state that under graphite those elements share the text colour.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "assets/scss/themes",
        "task_refs": [
          "TASK-017"
        ]
      },
      {
        "id": "R-013",
        "type": "requirement",
        "statement": "Documentation, Showcase, i18n, tests and release notes follow the change: STYLE-GUIDE.md and THEME.md list nine presets, sd-layout.md documents V4, the new menu fields and the context API, the Showcase layout page gains V4 and context demos with matching counts, the five i18n catalogs get the new keys, theme scripts cover graphite, CHANGELOG.md gets an Unreleased entry, and v20/v21/v22 are produced by npm run sync.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout",
        "task_refs": [
          "TASK-001",
          "TASK-017",
          "TASK-018",
          "TASK-019"
        ]
      },
      {
        "id": "AC-001",
        "type": "acceptance-criterion",
        "statement": "Render sd-sidebar-v4 with a nested menu on an active child route -> root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
        "behavior": "Render sd-sidebar-v4 with a nested menu on an active child route",
        "expected_result": "root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ],
        "task_refs": [
          "TASK-008"
        ]
      },
      {
        "id": "AC-002",
        "type": "acceptance-criterion",
        "statement": "Click root, child and external-URL items in V4, then change the route -> internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
        "behavior": "Click root, child and external-URL items in V4, then change the route",
        "expected_result": "internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ],
        "task_refs": [
          "TASK-009"
        ]
      },
      {
        "id": "AC-003",
        "type": "acceptance-criterion",
        "statement": "Toggle collapse in V4, recreate the component, and list the storage keys written -> the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
        "behavior": "Toggle collapse in V4, recreate the component, and list the storage keys written",
        "expected_result": "the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-005"
        ],
        "task_refs": [
          "TASK-009"
        ]
      },
      {
        "id": "AC-004",
        "type": "acceptance-criterion",
        "statement": "Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc -> the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
        "behavior": "Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc",
        "expected_result": "the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-003"
        ],
        "task_refs": [
          "TASK-002",
          "TASK-009"
        ]
      },
      {
        "id": "AC-005",
        "type": "acceptance-criterion",
        "statement": "Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand' -> 'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
        "behavior": "Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand'",
        "expected_result": "'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ],
        "task_refs": [
          "TASK-009"
        ]
      },
      {
        "id": "AC-006",
        "type": "acceptance-criterion",
        "statement": "Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon -> a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
        "behavior": "Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon",
        "expected_result": "a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-003"
        ],
        "task_refs": [
          "TASK-008"
        ]
      },
      {
        "id": "AC-007",
        "type": "acceptance-criterion",
        "statement": "Render V4 with sectioned items, unsectioned items, pinned items and recent items -> items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
        "behavior": "Render V4 with sectioned items, unsectioned items, pinned items and recent items",
        "expected_result": "items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-003"
        ],
        "task_refs": [
          "TASK-002",
          "TASK-008"
        ]
      },
      {
        "id": "AC-008",
        "type": "acceptance-criterion",
        "statement": "Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer -> the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
        "behavior": "Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer",
        "expected_result": "the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-005"
        ],
        "task_refs": [
          "TASK-009"
        ]
      },
      {
        "id": "AC-009",
        "type": "acceptance-criterion",
        "statement": "Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection -> the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
        "behavior": "Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection",
        "expected_result": "the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ],
        "task_refs": [
          "TASK-010"
        ]
      },
      {
        "id": "AC-010",
        "type": "acceptance-criterion",
        "statement": "Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar -> the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
        "behavior": "Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar",
        "expected_result": "the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ],
        "task_refs": [
          "TASK-010"
        ]
      },
      {
        "id": "AC-011",
        "type": "acceptance-criterion",
        "statement": "Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context -> all existing specs pass unchanged and V3 renders no badge, status or section markup",
        "behavior": "Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context",
        "expected_result": "all existing specs pass unchanged and V3 renders no badge, status or section markup",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-003",
          "R-008"
        ],
        "task_refs": [
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ]
      },
      {
        "id": "AC-012",
        "type": "acceptance-criterion",
        "statement": "Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration -> sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
        "behavior": "Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration",
        "expected_result": "sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-004"
        ],
        "task_refs": [
          "TASK-003",
          "TASK-011"
        ]
      },
      {
        "id": "AC-013",
        "type": "acceptance-criterion",
        "statement": "Compile the default theme in light and dark, and scan the V4 stylesheets -> every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
        "behavior": "Compile the default theme in light and dark, and scan the V4 stylesheets",
        "expected_result": "every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ],
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "AC-014",
        "type": "acceptance-criterion",
        "statement": "Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images -> search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
        "behavior": "Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images",
        "expected_result": "search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-006"
        ],
        "task_refs": [
          "TASK-007"
        ]
      },
      {
        "id": "AC-015",
        "type": "acceptance-criterion",
        "statement": "Select a different context, then reopen and select the active context -> the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
        "behavior": "Select a different context, then reopen and select the active context",
        "expected_result": "the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
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
        "id": "AC-016",
        "type": "acceptance-criterion",
        "statement": "Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id -> getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
        "behavior": "Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id",
        "expected_result": "getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-007"
        ],
        "task_refs": [
          "TASK-005",
          "TASK-006"
        ]
      },
      {
        "id": "AC-017",
        "type": "acceptance-criterion",
        "statement": "Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail -> a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
        "behavior": "Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail",
        "expected_result": "a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-007",
          "R-008"
        ],
        "task_refs": [
          "TASK-004",
          "TASK-006"
        ]
      },
      {
        "id": "AC-018",
        "type": "acceptance-criterion",
        "statement": "Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4 -> each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
        "behavior": "Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4",
        "expected_result": "each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-006",
          "R-008"
        ],
        "task_refs": [
          "TASK-007",
          "TASK-009",
          "TASK-010",
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ]
      },
      {
        "id": "AC-019",
        "type": "acceptance-criterion",
        "statement": "Dispatch a storage event for the context key with another id, then one for an unrelated key -> the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
        "behavior": "Dispatch a storage event for the context key with another id, then one for an unrelated key",
        "expected_result": "the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-009"
        ],
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "AC-020",
        "type": "acceptance-criterion",
        "statement": "Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto -> the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
        "behavior": "Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto",
        "expected_result": "the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-010"
        ],
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "AC-021",
        "type": "acceptance-criterion",
        "statement": "Compile graphite, another named preset, and a preset whose components map has an unknown key -> graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
        "behavior": "Compile graphite, another named preset, and a preset whose components map has an unknown key",
        "expected_result": "graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-011"
        ],
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "AC-022",
        "type": "acceptance-criterion",
        "statement": "Search the theme and layout documentation and CHANGELOG.md -> STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
        "behavior": "Search the theme and layout documentation and CHANGELOG.md",
        "expected_result": "STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-012",
          "R-013"
        ],
        "task_refs": [
          "TASK-017"
        ]
      },
      {
        "id": "AC-023",
        "type": "acceptance-criterion",
        "statement": "Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts -> the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
        "behavior": "Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts",
        "expected_result": "the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-013"
        ],
        "task_refs": [
          "TASK-001",
          "TASK-018",
          "TASK-019"
        ]
      },
      {
        "id": "A-001",
        "type": "assumption",
        "statement": "Reloading the page after a context switch, with no change event, is acceptable to consuming apps.",
        "blocking": false,
        "evidence_refs": [],
        "owner": "sdcorejs-angular maintainers",
        "source": "explicit",
        "confidence": "high",
        "status": "confirmed",
        "consequence_if_wrong": "Apps needing an in-place switch would need a different API.",
        "validation_method": "README states the behaviour was agreed with the product owner.",
        "rationale": "Agreed with the product owner per the design handoff README.",
        "impacted_refs": [
          "R-007"
        ]
      },
      {
        "id": "A-002",
        "type": "assumption",
        "statement": "The bundled Material Symbols font is the static v29 regular cut, so the FILL axis is unavailable and some chrome glyphs may be missing.",
        "blocking": false,
        "evidence_refs": [],
        "owner": "sdcorejs-angular maintainers",
        "source": "inferred",
        "confidence": "medium",
        "status": "proposed",
        "consequence_if_wrong": "Active icons could use the Symbols FILL axis directly instead of the Material Icons filled set.",
        "validation_method": "Check the font file and render each chrome glyph in the Showcase during planning.",
        "rationale": "fonts.scss loads material-symbols-v29-latin-regular.woff2.",
        "impacted_refs": [
          "R-001",
          "R-006"
        ]
      },
      {
        "id": "A-003",
        "type": "assumption",
        "statement": "No layout outside sidebar V1 and V3 hard-codes the 304px sidebar width or a sidebar-dependent fixed offset.",
        "blocking": false,
        "evidence_refs": [],
        "owner": "sdcorejs-angular maintainers",
        "source": "inferred",
        "confidence": "high",
        "status": "validated",
        "consequence_if_wrong": "Pages next to V4 would keep a 304px offset.",
        "validation_method": "Repository grep for 304px, rail widths and calc(100vw - ...) in the library and Showcase.",
        "rationale": "The grep found only V1, V3 and its spec.",
        "impacted_refs": [
          "R-005"
        ]
      },
      {
        "id": "A-004",
        "type": "assumption",
        "statement": "Consumers read the context through getCurrentContext(), which serves one snapshot per page load, so a tab stays internally consistent after another tab switches.",
        "blocking": false,
        "evidence_refs": [],
        "owner": "sdcorejs-angular maintainers",
        "source": "inferred",
        "confidence": "medium",
        "status": "proposed",
        "consequence_if_wrong": "A consumer reading localStorage directly could mix contexts across tabs.",
        "validation_method": "Document the rule in sd-layout.md and cover the snapshot behaviour in service specs.",
        "rationale": "README forbids consumers from reading the key directly.",
        "impacted_refs": [
          "R-007",
          "R-009"
        ]
      },
      {
        "id": "D-001",
        "type": "decision",
        "statement": "Which repositories this round covers: Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request",
        "question": "Which repositories this round covers",
        "selected_value": "Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The user asked to build the feature on Core UI.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-006",
          "R-010"
        ],
        "task_refs": [
          "TASK-017",
          "TASK-019"
        ]
      },
      {
        "id": "D-002",
        "type": "decision",
        "statement": "V4 scope: The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI",
        "question": "V4 scope",
        "selected_value": "The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The handoff is high fidelity and the brief points to the README.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-002",
          "R-004"
        ],
        "task_refs": [
          "TASK-009",
          "TASK-010",
          "TASK-011"
        ]
      },
      {
        "id": "D-003",
        "type": "decision",
        "statement": "V4 section layout: Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings",
        "question": "V4 section layout",
        "selected_value": "Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Keeps V3 recent behaviour while adopting README sections.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-007"
        ],
        "task_refs": [
          "TASK-009"
        ]
      },
      {
        "id": "D-004",
        "type": "decision",
        "statement": "Where V4 stores its collapsed state: Share the version 3 entry of versionStates; no new storage key",
        "question": "Where V4 stores its collapsed state",
        "selected_value": "Share the version 3 entry of versionStates; no new storage key",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Matches 'keep the V3 storage key' and keeps the preference when an app moves from V3 to V4.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-003"
        ],
        "task_refs": [
          "TASK-009"
        ]
      },
      {
        "id": "D-005",
        "type": "decision",
        "statement": "Which sidebars render the new menu fields: Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged",
        "question": "Which sidebars render the new menu fields",
        "selected_value": "Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Backward compatible with no V1-V3 behaviour change.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-003",
          "AC-011"
        ],
        "task_refs": [
          "TASK-002"
        ]
      },
      {
        "id": "D-006",
        "type": "decision",
        "statement": "Where V4 tokens are declared: Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host",
        "question": "Where V4 tokens are declared",
        "selected_value": "Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Colours follow the theme tiers and dark mode; sizes vary with density, itemShape and pointer.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-005",
          "AC-008",
          "AC-013"
        ],
        "task_refs": [
          "TASK-009",
          "TASK-016"
        ]
      },
      {
        "id": "D-007",
        "type": "decision",
        "statement": "How a preset overrides component tokens: An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error",
        "question": "How a preset overrides component tokens",
        "selected_value": "An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Generic and validated instead of a graphite special case in the mixin.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-011",
          "AC-021"
        ],
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "D-008",
        "type": "decision",
        "statement": "How the current context is resolved at bootstrap: context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once",
        "question": "How the current context is resolved at bootstrap",
        "selected_value": "context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The sidebar configuration may resolve after APP_INITIALIZER, so items are not known when consumers first read the context.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "R-008",
          "AC-016",
          "AC-017"
        ],
        "task_refs": [
          "TASK-003",
          "TASK-006"
        ]
      },
      {
        "id": "D-009",
        "type": "decision",
        "statement": "Where the context snapshot is stored: Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout",
        "question": "Where the context snapshot is stored",
        "selected_value": "Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Same privacy model as pinned and recent menus.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "AC-016"
        ],
        "task_refs": [
          "TASK-005"
        ]
      },
      {
        "id": "D-010",
        "type": "decision",
        "statement": "Where the switcher is mounted: V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header",
        "question": "Where the switcher is mounted",
        "selected_value": "V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "V2 has no app-name header; collapsed rails have no room for text.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-008",
          "AC-018"
        ],
        "task_refs": [
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ]
      },
      {
        "id": "D-011",
        "type": "decision",
        "statement": "Multi-tab synchronisation: Listen to the storage event and show a notice with a Reload action; never auto-reload",
        "question": "Multi-tab synchronisation",
        "selected_value": "Listen to the storage event and show a notice with a Reload action; never auto-reload",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Prevents silent work in a stale context without surprising the user.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-009",
          "AC-019"
        ],
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "D-012",
        "type": "decision",
        "statement": "Icon strategy: Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph",
        "question": "Icon strategy",
        "selected_value": "Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The bundled Symbols font has no FILL axis.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-006"
        ],
        "task_refs": [
          "TASK-008",
          "TASK-009"
        ]
      },
      {
        "id": "D-013",
        "type": "decision",
        "statement": "Coverage approach: TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts",
        "question": "Coverage approach",
        "selected_value": "TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Repository rules require tests; logic is test-first and UI specs follow the V3 pattern.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-013",
          "AC-023",
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ],
        "validation_boundary": {
          "kind": "none",
          "source_refs": [
            "R-001",
            "R-002",
            "R-003",
            "R-004",
            "R-005",
            "R-006",
            "R-007",
            "R-008",
            "R-009",
            "R-010",
            "R-011",
            "R-012",
            "R-013",
            "AC-001",
            "AC-002",
            "AC-003",
            "AC-004",
            "AC-005",
            "AC-006",
            "AC-007",
            "AC-008",
            "AC-009",
            "AC-010",
            "AC-011",
            "AC-012",
            "AC-013",
            "AC-014",
            "AC-015",
            "AC-016",
            "AC-017",
            "AC-018",
            "AC-019",
            "AC-020",
            "AC-021",
            "AC-022",
            "AC-023",
            "INV-001",
            "INV-002",
            "INV-003",
            "INV-004",
            "INV-005",
            "INV-006",
            "INV-007",
            "INV-008",
            "INV-009",
            "INV-010",
            "INV-011",
            "INV-012",
            "INV-013",
            "INV-014"
          ]
        },
        "task_refs": [
          "TASK-001",
          "TASK-006",
          "TASK-016"
        ]
      },
      {
        "id": "D-014",
        "type": "decision",
        "statement": "Which menu tree V4 uses: A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified",
        "question": "Which menu tree V4 uses",
        "selected_value": "A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "V2, V3 and the mobile sidebars depend on the shared tree; a separate tree removes regression risk.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-011"
        ],
        "task_refs": [
          "TASK-008"
        ]
      },
      {
        "id": "D-015",
        "type": "decision",
        "statement": "Trailing slot precedence and badge tones: One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills",
        "question": "Trailing slot precedence and badge tones",
        "selected_value": "One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "README allows one trailing type and defines neutral badges as plain counts.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-006"
        ],
        "task_refs": [
          "TASK-002",
          "TASK-008"
        ]
      },
      {
        "id": "D-016",
        "type": "decision",
        "statement": "How the link/text-button audit is handled: Report it and document the graphite limitation; create no token and change no component in this round",
        "question": "How the link/text-button audit is handled",
        "selected_value": "Report it and document the graphite limitation; create no token and change no component in this round",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The brief asks to report and not to create tokens.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-012",
          "AC-022"
        ],
        "task_refs": [
          "TASK-017"
        ]
      },
      {
        "id": "D-017",
        "type": "decision",
        "statement": "Public names of the context API: SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace",
        "question": "Public names of the context API",
        "selected_value": "SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Repository convention names consumer-configured shapes '*Configuration' (SdLayoutNotificationConfiguration, SidebarConfigurationV3); 'branch' already names the tree rail.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-006",
          "R-007",
          "R-008"
        ],
        "task_refs": [
          "TASK-003",
          "TASK-007"
        ]
      },
      {
        "id": "D-018",
        "type": "decision",
        "statement": "setCurrentContext with an id that is not in the configured items: Ignore it: no write and no reload",
        "question": "setCurrentContext with an id that is not in the configured items",
        "selected_value": "Ignore it: no write and no reload",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Prevents storing an id that would immediately fall back on the next load.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "AC-016"
        ],
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "D-019",
        "type": "decision",
        "statement": "How the context snapshot is read back from storage: An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it",
        "question": "How the context snapshot is read back from storage",
        "selected_value": "An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Handles share one in-memory entry per key and set() updates memory even when persistence fails; destroy/recreate is not fresh while another handle (for example a component-level SdLayoutStorageService) is alive.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "R-009",
          "AC-017",
          "AC-019"
        ],
        "task_refs": [
          "TASK-004",
          "TASK-005"
        ]
      },
      {
        "id": "D-020",
        "type": "decision",
        "statement": "Which storage events raise the changed-elsewhere notice: On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing",
        "question": "Which storage events raise the changed-elsewhere notice",
        "selected_value": "On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "SdStorage keys are digests, so event keys cannot be matched; comparing ids within one namespace filters unrelated events and login/logout partition switches.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-009",
          "AC-019"
        ],
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "D-021",
        "type": "decision",
        "statement": "Who triggers reconciliation with the configured items: sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call",
        "question": "Who triggers reconciliation with the configured items",
        "selected_value": "sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Covers sidebars used outside sd-layout, keeps the service and its listener lazy for apps without context, and keeps the service usable from provideAppInitializer.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "R-008",
          "AC-017",
          "AC-018"
        ],
        "task_refs": [
          "TASK-006",
          "TASK-007"
        ]
      },
      {
        "id": "D-022",
        "type": "decision",
        "statement": "How reload, window events and the session marker are reached: Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake",
        "question": "How reload, window events and the session marker are reached",
        "selected_value": "Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "location.reload cannot be spied in Chrome and a real reload aborts Karma and the docs site; SD_VIEWPORT is the precedent for an injectable browser seam.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "R-009",
          "AC-016",
          "AC-023"
        ],
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "D-023",
        "type": "decision",
        "statement": "Where the V4 tree lives and who may import it: components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index",
        "question": "Where the V4 tree lives and who may import it",
        "selected_value": "components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Mobile V4 renders the same tree in mobile mode; keeping it private leaves room to change it without a public contract.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-002",
          "AC-009"
        ],
        "task_refs": [
          "TASK-008",
          "TASK-010"
        ]
      },
      {
        "id": "D-024",
        "type": "decision",
        "statement": "Storage identity of the context snapshot: A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes",
        "question": "Storage identity of the context snapshot",
        "selected_value": "A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Follows the existing handle pattern so namespace and signout behaviour come for free.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "AC-016"
        ],
        "task_refs": [
          "TASK-005"
        ]
      },
      {
        "id": "D-025",
        "type": "decision",
        "statement": "Reconciliation algorithm: syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning",
        "question": "Reconciliation algorithm",
        "selected_value": "syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "A user namespace that resolves after getCurrentContext() would otherwise reload on every load; the marker bounds that case to one reload per tab session while the warning surfaces the misconfiguration.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "AC-017"
        ],
        "task_refs": [
          "TASK-006"
        ]
      },
      {
        "id": "D-026",
        "type": "decision",
        "statement": "Outcome when a switch cannot be confirmed: setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads",
        "question": "Outcome when a switch cannot be confirmed",
        "selected_value": "setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Otherwise the busy row and the locked list would stay stuck.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-006",
          "R-007",
          "AC-015"
        ],
        "task_refs": [
          "TASK-001",
          "TASK-006",
          "TASK-007"
        ]
      },
      {
        "id": "D-027",
        "type": "decision",
        "statement": "Mobile placement and stacking of the context sheet: Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger",
        "question": "Mobile placement and stacking of the context sheet",
        "selected_value": "Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Mobile V2 is a bottom bar plus sheets; stacked aria-modal surfaces must not both react to Escape.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-006",
          "R-008",
          "AC-018"
        ],
        "task_refs": [
          "TASK-007",
          "TASK-010",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ]
      },
      {
        "id": "D-028",
        "type": "decision",
        "statement": "Colours of the shared switcher in V1-V4: Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor",
        "question": "Colours of the shared switcher in V1-V4",
        "selected_value": "Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The switcher is shared and has no colour input, like the V4 sidebar.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-006",
          "AC-014"
        ],
        "task_refs": [
          "TASK-007",
          "TASK-012"
        ]
      },
      {
        "id": "D-029",
        "type": "decision",
        "statement": "Shape and validation of preset component overrides: Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation",
        "question": "Shape and validation of preset component overrides",
        "selected_value": "Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "A (light, dark) pair would emit only the first part of a comma-separated box-shadow; tests cannot inject a preset into the non-default $presets map.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-011",
          "AC-021"
        ],
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "D-030",
        "type": "decision",
        "statement": "How the Showcase demo hosts the context switcher: The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading",
        "question": "How the Showcase demo hosts the context switcher",
        "selected_value": "The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading",
        "source": "approved-architecture",
        "status": "approved",
        "blocking": true,
        "scope": "module",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The demo already provides SdLayoutService and SdLayoutStorageService at component level; a real reload would reload the docs site.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-013",
          "AC-023"
        ],
        "task_refs": [
          "TASK-018"
        ]
      },
      {
        "id": "INV-001",
        "type": "invariant",
        "statement": "Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.",
        "protected_refs": [
          "R-008",
          "AC-011",
          "AC-018"
        ],
        "task_refs": [
          "TASK-006",
          "TASK-007",
          "TASK-009",
          "TASK-010",
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ],
        "evidence_refs": [
          "EVIDENCE-006",
          "EVIDENCE-007",
          "EVIDENCE-009",
          "EVIDENCE-010",
          "EVIDENCE-012",
          "EVIDENCE-013",
          "EVIDENCE-014",
          "EVIDENCE-015"
        ]
      },
      {
        "id": "INV-002",
        "type": "invariant",
        "statement": "Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.",
        "protected_refs": [
          "R-007",
          "AC-016"
        ],
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ],
        "evidence_refs": [
          "EVIDENCE-004",
          "EVIDENCE-005",
          "EVIDENCE-006",
          "EVIDENCE-007"
        ]
      },
      {
        "id": "INV-003",
        "type": "invariant",
        "statement": "A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.",
        "protected_refs": [
          "R-007",
          "AC-015",
          "AC-017"
        ],
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ],
        "evidence_refs": [
          "EVIDENCE-004",
          "EVIDENCE-005",
          "EVIDENCE-006",
          "EVIDENCE-007"
        ]
      },
      {
        "id": "INV-004",
        "type": "invariant",
        "statement": "Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.",
        "protected_refs": [
          "R-007",
          "R-009",
          "AC-016",
          "AC-019"
        ],
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ],
        "evidence_refs": [
          "EVIDENCE-004",
          "EVIDENCE-005",
          "EVIDENCE-006",
          "EVIDENCE-007"
        ]
      },
      {
        "id": "INV-005",
        "type": "invariant",
        "statement": "V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.",
        "protected_refs": [
          "R-001",
          "AC-003"
        ],
        "task_refs": [
          "TASK-008",
          "TASK-009"
        ],
        "evidence_refs": [
          "EVIDENCE-008",
          "EVIDENCE-009"
        ]
      },
      {
        "id": "INV-006",
        "type": "invariant",
        "statement": "components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.",
        "protected_refs": [
          "R-001",
          "R-003",
          "AC-011",
          "AC-013"
        ],
        "task_refs": [
          "TASK-002",
          "TASK-008",
          "TASK-009",
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015",
          "TASK-016"
        ],
        "evidence_refs": [
          "EVIDENCE-002",
          "EVIDENCE-008",
          "EVIDENCE-009",
          "EVIDENCE-012",
          "EVIDENCE-013",
          "EVIDENCE-014",
          "EVIDENCE-015",
          "EVIDENCE-016"
        ]
      },
      {
        "id": "INV-007",
        "type": "invariant",
        "statement": "V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.",
        "protected_refs": [
          "R-005",
          "AC-013",
          "AC-021"
        ],
        "task_refs": [
          "TASK-009",
          "TASK-016"
        ],
        "evidence_refs": [
          "EVIDENCE-009",
          "EVIDENCE-016"
        ]
      },
      {
        "id": "INV-008",
        "type": "invariant",
        "statement": "A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.",
        "protected_refs": [
          "R-010",
          "R-011",
          "AC-020",
          "AC-021"
        ],
        "task_refs": [
          "TASK-016"
        ],
        "evidence_refs": [
          "EVIDENCE-016"
        ]
      },
      {
        "id": "INV-009",
        "type": "invariant",
        "statement": "SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.",
        "protected_refs": [
          "R-007",
          "AC-017"
        ],
        "task_refs": [
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007"
        ],
        "evidence_refs": [
          "EVIDENCE-004",
          "EVIDENCE-005",
          "EVIDENCE-006",
          "EVIDENCE-007"
        ]
      },
      {
        "id": "INV-010",
        "type": "invariant",
        "statement": "Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.",
        "protected_refs": [
          "R-007",
          "R-009",
          "R-013",
          "AC-016",
          "AC-023"
        ],
        "task_refs": [
          "TASK-001",
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007",
          "TASK-017",
          "TASK-018",
          "TASK-019"
        ],
        "evidence_refs": [
          "EVIDENCE-001",
          "EVIDENCE-004",
          "EVIDENCE-005",
          "EVIDENCE-006",
          "EVIDENCE-007",
          "EVIDENCE-017",
          "EVIDENCE-018",
          "EVIDENCE-019"
        ]
      },
      {
        "id": "INV-011",
        "type": "invariant",
        "statement": "Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.",
        "protected_refs": [
          "R-002",
          "AC-009",
          "AC-010"
        ],
        "task_refs": [
          "TASK-010"
        ],
        "evidence_refs": [
          "EVIDENCE-010"
        ]
      },
      {
        "id": "INV-012",
        "type": "invariant",
        "statement": "V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.",
        "protected_refs": [
          "R-004",
          "AC-012"
        ],
        "task_refs": [
          "TASK-003",
          "TASK-011"
        ],
        "evidence_refs": [
          "EVIDENCE-003",
          "EVIDENCE-011"
        ]
      },
      {
        "id": "INV-013",
        "type": "invariant",
        "statement": "The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.",
        "protected_refs": [
          "R-006",
          "AC-014"
        ],
        "task_refs": [
          "TASK-007"
        ],
        "evidence_refs": [
          "EVIDENCE-007"
        ]
      },
      {
        "id": "INV-014",
        "type": "invariant",
        "statement": "Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.",
        "protected_refs": [
          "R-012",
          "AC-022"
        ],
        "task_refs": [
          "TASK-017"
        ],
        "evidence_refs": [
          "EVIDENCE-017"
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
            "id": "R-008",
            "type": "requirement"
          },
          {
            "id": "R-009",
            "type": "requirement"
          },
          {
            "id": "R-010",
            "type": "requirement"
          },
          {
            "id": "R-011",
            "type": "requirement"
          },
          {
            "id": "R-012",
            "type": "requirement"
          },
          {
            "id": "R-013",
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
            "id": "AC-009",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-010",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-011",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-012",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-013",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-014",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-015",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-016",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-017",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-018",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-019",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-020",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-021",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-022",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-023",
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
            "id": "A-003",
            "type": "assumption"
          },
          {
            "id": "A-004",
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
            "id": "D-007",
            "type": "decision"
          },
          {
            "id": "D-008",
            "type": "decision"
          },
          {
            "id": "D-009",
            "type": "decision"
          },
          {
            "id": "D-010",
            "type": "decision"
          },
          {
            "id": "D-011",
            "type": "decision"
          },
          {
            "id": "D-012",
            "type": "decision"
          },
          {
            "id": "D-013",
            "type": "decision"
          },
          {
            "id": "D-014",
            "type": "decision"
          },
          {
            "id": "D-015",
            "type": "decision"
          },
          {
            "id": "D-016",
            "type": "decision"
          },
          {
            "id": "D-017",
            "type": "decision"
          },
          {
            "id": "D-018",
            "type": "decision"
          }
        ],
        "tombstones": []
      },
      {
        "revision": 2,
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
            "id": "R-008",
            "type": "requirement"
          },
          {
            "id": "R-009",
            "type": "requirement"
          },
          {
            "id": "R-010",
            "type": "requirement"
          },
          {
            "id": "R-011",
            "type": "requirement"
          },
          {
            "id": "R-012",
            "type": "requirement"
          },
          {
            "id": "R-013",
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
            "id": "AC-009",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-010",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-011",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-012",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-013",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-014",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-015",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-016",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-017",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-018",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-019",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-020",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-021",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-022",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-023",
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
            "id": "A-003",
            "type": "assumption"
          },
          {
            "id": "A-004",
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
            "id": "D-007",
            "type": "decision"
          },
          {
            "id": "D-008",
            "type": "decision"
          },
          {
            "id": "D-009",
            "type": "decision"
          },
          {
            "id": "D-010",
            "type": "decision"
          },
          {
            "id": "D-011",
            "type": "decision"
          },
          {
            "id": "D-012",
            "type": "decision"
          },
          {
            "id": "D-013",
            "type": "decision"
          },
          {
            "id": "D-014",
            "type": "decision"
          },
          {
            "id": "D-015",
            "type": "decision"
          },
          {
            "id": "D-016",
            "type": "decision"
          },
          {
            "id": "D-017",
            "type": "decision"
          },
          {
            "id": "D-018",
            "type": "decision"
          },
          {
            "id": "D-019",
            "type": "decision"
          },
          {
            "id": "D-020",
            "type": "decision"
          },
          {
            "id": "D-021",
            "type": "decision"
          },
          {
            "id": "D-022",
            "type": "decision"
          },
          {
            "id": "D-023",
            "type": "decision"
          },
          {
            "id": "D-024",
            "type": "decision"
          },
          {
            "id": "D-025",
            "type": "decision"
          },
          {
            "id": "D-026",
            "type": "decision"
          },
          {
            "id": "D-027",
            "type": "decision"
          },
          {
            "id": "D-028",
            "type": "decision"
          },
          {
            "id": "D-029",
            "type": "decision"
          },
          {
            "id": "D-030",
            "type": "decision"
          },
          {
            "id": "INV-001",
            "type": "invariant"
          },
          {
            "id": "INV-002",
            "type": "invariant"
          },
          {
            "id": "INV-003",
            "type": "invariant"
          },
          {
            "id": "INV-004",
            "type": "invariant"
          },
          {
            "id": "INV-005",
            "type": "invariant"
          },
          {
            "id": "INV-006",
            "type": "invariant"
          },
          {
            "id": "INV-007",
            "type": "invariant"
          },
          {
            "id": "INV-008",
            "type": "invariant"
          },
          {
            "id": "INV-009",
            "type": "invariant"
          },
          {
            "id": "INV-010",
            "type": "invariant"
          }
        ],
        "tombstones": []
      },
      {
        "revision": 3,
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
            "id": "R-008",
            "type": "requirement"
          },
          {
            "id": "R-009",
            "type": "requirement"
          },
          {
            "id": "R-010",
            "type": "requirement"
          },
          {
            "id": "R-011",
            "type": "requirement"
          },
          {
            "id": "R-012",
            "type": "requirement"
          },
          {
            "id": "R-013",
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
            "id": "AC-009",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-010",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-011",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-012",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-013",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-014",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-015",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-016",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-017",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-018",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-019",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-020",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-021",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-022",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-023",
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
            "id": "A-003",
            "type": "assumption"
          },
          {
            "id": "A-004",
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
            "id": "D-007",
            "type": "decision"
          },
          {
            "id": "D-008",
            "type": "decision"
          },
          {
            "id": "D-009",
            "type": "decision"
          },
          {
            "id": "D-010",
            "type": "decision"
          },
          {
            "id": "D-011",
            "type": "decision"
          },
          {
            "id": "D-012",
            "type": "decision"
          },
          {
            "id": "D-013",
            "type": "decision"
          },
          {
            "id": "D-014",
            "type": "decision"
          },
          {
            "id": "D-015",
            "type": "decision"
          },
          {
            "id": "D-016",
            "type": "decision"
          },
          {
            "id": "D-017",
            "type": "decision"
          },
          {
            "id": "D-018",
            "type": "decision"
          },
          {
            "id": "D-019",
            "type": "decision"
          },
          {
            "id": "D-020",
            "type": "decision"
          },
          {
            "id": "D-021",
            "type": "decision"
          },
          {
            "id": "D-022",
            "type": "decision"
          },
          {
            "id": "D-023",
            "type": "decision"
          },
          {
            "id": "D-024",
            "type": "decision"
          },
          {
            "id": "D-025",
            "type": "decision"
          },
          {
            "id": "D-026",
            "type": "decision"
          },
          {
            "id": "D-027",
            "type": "decision"
          },
          {
            "id": "D-028",
            "type": "decision"
          },
          {
            "id": "D-029",
            "type": "decision"
          },
          {
            "id": "D-030",
            "type": "decision"
          },
          {
            "id": "INV-001",
            "type": "invariant"
          },
          {
            "id": "INV-002",
            "type": "invariant"
          },
          {
            "id": "INV-003",
            "type": "invariant"
          },
          {
            "id": "INV-004",
            "type": "invariant"
          },
          {
            "id": "INV-005",
            "type": "invariant"
          },
          {
            "id": "INV-006",
            "type": "invariant"
          },
          {
            "id": "INV-007",
            "type": "invariant"
          },
          {
            "id": "INV-008",
            "type": "invariant"
          },
          {
            "id": "INV-009",
            "type": "invariant"
          },
          {
            "id": "INV-010",
            "type": "invariant"
          },
          {
            "id": "INV-011",
            "type": "invariant"
          },
          {
            "id": "INV-012",
            "type": "invariant"
          },
          {
            "id": "INV-013",
            "type": "invariant"
          },
          {
            "id": "INV-014",
            "type": "invariant"
          }
        ],
        "tombstones": []
      },
      {
        "revision": 4,
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
            "id": "R-008",
            "type": "requirement"
          },
          {
            "id": "R-009",
            "type": "requirement"
          },
          {
            "id": "R-010",
            "type": "requirement"
          },
          {
            "id": "R-011",
            "type": "requirement"
          },
          {
            "id": "R-012",
            "type": "requirement"
          },
          {
            "id": "R-013",
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
            "id": "AC-009",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-010",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-011",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-012",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-013",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-014",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-015",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-016",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-017",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-018",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-019",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-020",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-021",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-022",
            "type": "acceptance-criterion"
          },
          {
            "id": "AC-023",
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
            "id": "A-003",
            "type": "assumption"
          },
          {
            "id": "A-004",
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
            "id": "D-007",
            "type": "decision"
          },
          {
            "id": "D-008",
            "type": "decision"
          },
          {
            "id": "D-009",
            "type": "decision"
          },
          {
            "id": "D-010",
            "type": "decision"
          },
          {
            "id": "D-011",
            "type": "decision"
          },
          {
            "id": "D-012",
            "type": "decision"
          },
          {
            "id": "D-013",
            "type": "decision"
          },
          {
            "id": "D-014",
            "type": "decision"
          },
          {
            "id": "D-015",
            "type": "decision"
          },
          {
            "id": "D-016",
            "type": "decision"
          },
          {
            "id": "D-017",
            "type": "decision"
          },
          {
            "id": "D-018",
            "type": "decision"
          },
          {
            "id": "D-019",
            "type": "decision"
          },
          {
            "id": "D-020",
            "type": "decision"
          },
          {
            "id": "D-021",
            "type": "decision"
          },
          {
            "id": "D-022",
            "type": "decision"
          },
          {
            "id": "D-023",
            "type": "decision"
          },
          {
            "id": "D-024",
            "type": "decision"
          },
          {
            "id": "D-025",
            "type": "decision"
          },
          {
            "id": "D-026",
            "type": "decision"
          },
          {
            "id": "D-027",
            "type": "decision"
          },
          {
            "id": "D-028",
            "type": "decision"
          },
          {
            "id": "D-029",
            "type": "decision"
          },
          {
            "id": "D-030",
            "type": "decision"
          },
          {
            "id": "INV-001",
            "type": "invariant"
          },
          {
            "id": "INV-002",
            "type": "invariant"
          },
          {
            "id": "INV-003",
            "type": "invariant"
          },
          {
            "id": "INV-004",
            "type": "invariant"
          },
          {
            "id": "INV-005",
            "type": "invariant"
          },
          {
            "id": "INV-006",
            "type": "invariant"
          },
          {
            "id": "INV-007",
            "type": "invariant"
          },
          {
            "id": "INV-008",
            "type": "invariant"
          },
          {
            "id": "INV-009",
            "type": "invariant"
          },
          {
            "id": "INV-010",
            "type": "invariant"
          },
          {
            "id": "INV-011",
            "type": "invariant"
          },
          {
            "id": "INV-012",
            "type": "invariant"
          },
          {
            "id": "INV-013",
            "type": "invariant"
          },
          {
            "id": "INV-014",
            "type": "invariant"
          }
        ],
        "tombstones": []
      }
    ],
    "approved_artifact": {
      "metadata": {
        "allowed_paths": [
          "**"
        ],
        "approval_source": "user-approved-decision-coverage",
        "approved_at": "2026-08-09T00:00:00.000Z",
        "approved_by": "user",
        "artifact_id": "decision-coverage-r4",
        "artifact_kind": "plan",
        "change_ref": "sidebar-v4-context-switcher-graphite-v1",
        "contract_id": "decision-coverage:v1",
        "owner_module_id": null,
        "owner_repository_id": "sdcorejs-angular",
        "owner_repository_role": "standalone",
        "parent_references": [],
        "parent_repository_id": null,
        "prohibited_paths": [],
        "repository_relative_path": ".sdcorejs/plans/angular/2026-10-19-00-27-sidebar-v4-context-switcher-graphite.md",
        "requirement_id": "decision-coverage",
        "schema_version": 1,
        "source_revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
        "stack_profile": "markdown-skill-pack",
        "supersedes": null,
        "track": "workflow",
        "approval_hash": "sha256:v1:649696b8b22faec38b178a8239618ca7f44d164d4006182c9df5672b8bfe0a77"
      },
      "body": "{\"history\":[{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"}],\"revision\":1,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"},{\"id\":\"INV-009\",\"type\":\"invariant\"},{\"id\":\"INV-010\",\"type\":\"invariant\"}],\"revision\":2,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"},{\"id\":\"INV-009\",\"type\":\"invariant\"},{\"id\":\"INV-010\",\"type\":\"invariant\"},{\"id\":\"INV-011\",\"type\":\"invariant\"},{\"id\":\"INV-012\",\"type\":\"invariant\"},{\"id\":\"INV-013\",\"type\":\"invariant\"},{\"id\":\"INV-014\",\"type\":\"invariant\"}],\"revision\":3,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"},{\"id\":\"INV-009\",\"type\":\"invariant\"},{\"id\":\"INV-010\",\"type\":\"invariant\"},{\"id\":\"INV-011\",\"type\":\"invariant\"},{\"id\":\"INV-012\",\"type\":\"invariant\"},{\"id\":\"INV-013\",\"type\":\"invariant\"},{\"id\":\"INV-014\",\"type\":\"invariant\"}],\"revision\":4,\"tombstones\":[]}],\"records\":[{\"id\":\"R-001\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A desktop sd-sidebar-v4 component, forked from sd-sidebar-v3, renders the README D1-D4 frames: header (logo, app name, context slot, collapse button), pill search with Ctrl+K/Cmd+K focus and Up/Down/Enter/Esc result navigation, flat accent-insensitive search results with match highlight, Pinned and Recent shortcut sections, menu sections from menu.section, root/group/child rows with pill active state and child marker, a dot on a closed group that contains the active route, the trailing slot, the account footer, the 72px collapsed rail with separators and mini badges, and the collapsed-group flyout. It keeps V3 routing, navigation side effects, the collapse storage entry and the V3 accessibility rules.\",\"status\":\"active\",\"task_refs\":[\"TASK-008\",\"TASK-009\"],\"type\":\"requirement\"},{\"id\":\"R-002\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A mobile sd-sidebar-mobile-v4 component, forked from sd-sidebar-mobile-v3, renders the README M1-M3 frames: a 56px app bar, a drawer of min(88vw, 360px) with the V4 tree in mobile mode (44px rows, 44px search, close button), closing on backdrop, menu selection or Esc with a focus trap and focus return, clearing the query on close, and an opt-in bottom bar built from mobile.bottomBar (at most 4 menu ids plus More).\",\"status\":\"active\",\"task_refs\":[\"TASK-010\"],\"type\":\"requirement\"},{\"id\":\"R-003\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SdLayoutMenu gains optional fields section, badge { value, tone }, status { label, tone, live } and comingSoon, replacing the commented notify field. Existing menus compile and behave unchanged. Only V4 desktop and mobile render the new fields; a comingSoon item is aria-disabled, never navigates and is excluded from V4 search. searchMenuLeaves keeps its current behavior.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-008\",\"TASK-015\"],\"type\":\"requirement\"},{\"id\":\"R-004\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SidebarConfigurationV4 (version: 4) extends SidebarConfigurationV3 with itemShape, density, collapsedGroup and mobile.bottomBar. It joins ISdSidebarConfiguration, normalizeSidebarConfiguration fills its defaults, and the sd-layout component renders V4 desktop or mobile by breakpoint. V4 ignores brandColor and brandLightColor.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"requirement\"},{\"id\":\"R-005\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Every V4 colour goes through --sd-* tokens: the --sd-sidebar-v4-* colour tokens of the README table live in the theme component-token map with light and dark values, and the size tokens (width 280px, rail width 72px, item and child height, item radius) are declared on the .sd-sidebar-v4 host. V4 has no colour input and no hard-coded hex or 304px; its offsets use var(--sd-sidebar-v4-width) and var(--sd-sidebar-v4-rail-width). V1 and V3 keep their 304px layout.\",\"status\":\"active\",\"task_refs\":[\"TASK-009\",\"TASK-016\"],\"type\":\"requirement\"},{\"id\":\"R-006\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A shared sd-layout-context-switcher component in components/shared/context-switcher renders the README CS1-CS3 states: header trigger, desktop popover with optional accent-insensitive search (auto above 7 items, forced by searchable), label and count, rows with image or initial avatar and an active check, the switching state that locks the list, and the mobile bottom sheet. One item shows the name only and cannot open; no configuration renders nothing. On a collapsed rail it shows the context avatar and opens to the right.\",\"status\":\"active\",\"task_refs\":[\"TASK-007\"],\"type\":\"requirement\"},{\"id\":\"R-007\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SdLayoutContextService (providedIn root) exposes getCurrentContext(): SdLayoutContext | null and setCurrentContext(id): void. Core persists a context snapshot through SdLayoutStorageService, reloads the page after a switch, emits no change event, ignores a re-selection of the active context, and reconciles the stored snapshot with the configured items so that a missing or stale id falls back to items[0] with at most one reload.\",\"status\":\"active\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"requirement\"},{\"id\":\"R-008\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SidebarConfigurationBase gains context?: SdLayoutContextConfiguration shared by V1-V4. The switcher is mounted in the headers of sidebar V1, V2, V3 and V4 and in the drawer header of mobile V1-V4 at the agreed positions. Without context every sidebar renders exactly as before.\",\"status\":\"active\",\"task_refs\":[\"TASK-006\",\"TASK-009\",\"TASK-010\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"requirement\"},{\"id\":\"R-009\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"When another tab changes the stored context, an open tab shows a notice that the context changed elsewhere with a Reload action, and never reloads by itself.\",\"status\":\"active\",\"task_refs\":[\"TASK-006\"],\"type\":\"requirement\"},{\"id\":\"R-010\",\"owner_module_id\":\"assets/scss/themes\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A ninth named preset 'graphite' is added to the theme presets with the README palette values. It is light-only like the other named presets, inherits the semantic state colours and keeps primary-contrast white.\",\"status\":\"active\",\"task_refs\":[\"TASK-016\"],\"type\":\"requirement\"},{\"id\":\"R-011\",\"owner_module_id\":\"assets/scss/themes\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A named preset can override component tokens through an optional components sub-map that the theme mixin forwards to the component-token emitter; unknown keys fail compilation. 'graphite' overrides --sd-sidebar-v4-active-bg and --sd-sidebar-v4-active-shadow so the active V4 item is a raised surface.\",\"status\":\"active\",\"task_refs\":[\"TASK-016\"],\"type\":\"requirement\"},{\"id\":\"R-012\",\"owner_module_id\":\"assets/scss/themes\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"The audit of components that colour links or text buttons with --sd-primary is recorded, no new token is created, and the theme docs state that under graphite those elements share the text colour.\",\"status\":\"active\",\"task_refs\":[\"TASK-017\"],\"type\":\"requirement\"},{\"id\":\"R-013\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Documentation, Showcase, i18n, tests and release notes follow the change: STYLE-GUIDE.md and THEME.md list nine presets, sd-layout.md documents V4, the new menu fields and the context API, the Showcase layout page gains V4 and context demos with matching counts, the five i18n catalogs get the new keys, theme scripts cover graphite, CHANGELOG.md gets an Unreleased entry, and v20/v21/v22 are produced by npm run sync.\",\"status\":\"active\",\"task_refs\":[\"TASK-001\",\"TASK-017\",\"TASK-018\",\"TASK-019\"],\"type\":\"requirement\"},{\"behavior\":\"Render sd-sidebar-v4 with a nested menu on an active child route\",\"blocking\":true,\"expected_result\":\"root rows carry icons and child rows do not; the active row has aria-current=\\\"page\\\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot\",\"id\":\"AC-001\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Render sd-sidebar-v4 with a nested menu on an active child route -> root rows carry icons and child rows do not; the active row has aria-current=\\\"page\\\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot\",\"task_refs\":[\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Click root, child and external-URL items in V4, then change the route\",\"blocking\":true,\"expected_result\":\"internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes\",\"id\":\"AC-002\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Click root, child and external-URL items in V4, then change the route -> internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Toggle collapse in V4, recreate the component, and list the storage keys written\",\"blocking\":true,\"expected_result\":\"the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3\",\"id\":\"AC-003\",\"requirement_refs\":[\"R-001\",\"R-005\"],\"statement\":\"Toggle collapse in V4, recreate the component, and list the storage keys written -> the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc\",\"blocking\":true,\"expected_result\":\"the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render\",\"id\":\"AC-004\",\"requirement_refs\":[\"R-001\",\"R-003\"],\"statement\":\"Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc -> the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render\",\"task_refs\":[\"TASK-002\",\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand'\",\"blocking\":true,\"expected_result\":\"'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items\",\"id\":\"AC-005\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand' -> 'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon\",\"blocking\":true,\"expected_result\":\"a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\\\"true\\\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status\",\"id\":\"AC-006\",\"requirement_refs\":[\"R-001\",\"R-003\"],\"statement\":\"Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon -> a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\\\"true\\\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status\",\"task_refs\":[\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render V4 with sectioned items, unsectioned items, pinned items and recent items\",\"blocking\":true,\"expected_result\":\"items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration\",\"id\":\"AC-007\",\"requirement_refs\":[\"R-001\",\"R-003\"],\"statement\":\"Render V4 with sectioned items, unsectioned items, pinned items and recent items -> items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration\",\"task_refs\":[\"TASK-002\",\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer\",\"blocking\":true,\"expected_result\":\"the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px\",\"id\":\"AC-008\",\"requirement_refs\":[\"R-001\",\"R-005\"],\"statement\":\"Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer -> the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection\",\"blocking\":true,\"expected_result\":\"the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger\",\"id\":\"AC-009\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection -> the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger\",\"task_refs\":[\"TASK-010\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar\",\"blocking\":true,\"expected_result\":\"the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders\",\"id\":\"AC-010\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar -> the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders\",\"task_refs\":[\"TASK-010\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context\",\"blocking\":true,\"expected_result\":\"all existing specs pass unchanged and V3 renders no badge, status or section markup\",\"id\":\"AC-011\",\"requirement_refs\":[\"R-003\",\"R-008\"],\"statement\":\"Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context -> all existing specs pass unchanged and V3 renders no badge, status or section markup\",\"task_refs\":[\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration\",\"blocking\":true,\"expected_result\":\"sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids\",\"id\":\"AC-012\",\"requirement_refs\":[\"R-004\"],\"statement\":\"Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration -> sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids\",\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compile the default theme in light and dark, and scan the V4 stylesheets\",\"blocking\":true,\"expected_result\":\"every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px\",\"id\":\"AC-013\",\"requirement_refs\":[\"R-005\"],\"statement\":\"Compile the default theme in light and dark, and scan the V4 stylesheets -> every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px\",\"task_refs\":[\"TASK-016\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images\",\"blocking\":true,\"expected_result\":\"search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders\",\"id\":\"AC-014\",\"requirement_refs\":[\"R-006\"],\"statement\":\"Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images -> search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders\",\"task_refs\":[\"TASK-007\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Select a different context, then reopen and select the active context\",\"blocking\":true,\"expected_result\":\"the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload\",\"id\":\"AC-015\",\"requirement_refs\":[\"R-006\",\"R-007\"],\"statement\":\"Select a different context, then reopen and select the active context -> the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload\",\"task_refs\":[\"TASK-007\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id\",\"blocking\":true,\"expected_result\":\"getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload\",\"id\":\"AC-016\",\"requirement_refs\":[\"R-007\"],\"statement\":\"Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id -> getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload\",\"task_refs\":[\"TASK-005\",\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail\",\"blocking\":true,\"expected_result\":\"a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads\",\"id\":\"AC-017\",\"requirement_refs\":[\"R-007\",\"R-008\"],\"statement\":\"Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail -> a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads\",\"task_refs\":[\"TASK-004\",\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4\",\"blocking\":true,\"expected_result\":\"each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet\",\"id\":\"AC-018\",\"requirement_refs\":[\"R-006\",\"R-008\"],\"statement\":\"Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4 -> each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet\",\"task_refs\":[\"TASK-007\",\"TASK-009\",\"TASK-010\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Dispatch a storage event for the context key with another id, then one for an unrelated key\",\"blocking\":true,\"expected_result\":\"the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing\",\"id\":\"AC-019\",\"requirement_refs\":[\"R-009\"],\"statement\":\"Dispatch a storage event for the context key with another id, then one for an unrelated key -> the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto\",\"blocking\":true,\"expected_result\":\"the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'\",\"id\":\"AC-020\",\"requirement_refs\":[\"R-010\"],\"statement\":\"Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto -> the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'\",\"task_refs\":[\"TASK-016\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compile graphite, another named preset, and a preset whose components map has an unknown key\",\"blocking\":true,\"expected_result\":\"graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error\",\"id\":\"AC-021\",\"requirement_refs\":[\"R-011\"],\"statement\":\"Compile graphite, another named preset, and a preset whose components map has an unknown key -> graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error\",\"task_refs\":[\"TASK-016\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Search the theme and layout documentation and CHANGELOG.md\",\"blocking\":true,\"expected_result\":\"STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry\",\"id\":\"AC-022\",\"requirement_refs\":[\"R-012\",\"R-013\"],\"statement\":\"Search the theme and layout documentation and CHANGELOG.md -> STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry\",\"task_refs\":[\"TASK-017\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts\",\"blocking\":true,\"expected_result\":\"the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass\",\"id\":\"AC-023\",\"requirement_refs\":[\"R-013\"],\"statement\":\"Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts -> the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass\",\"task_refs\":[\"TASK-001\",\"TASK-018\",\"TASK-019\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Apps needing an in-place switch would need a different API.\",\"evidence_refs\":[],\"id\":\"A-001\",\"impacted_refs\":[\"R-007\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"Agreed with the product owner per the design handoff README.\",\"source\":\"explicit\",\"statement\":\"Reloading the page after a context switch, with no change event, is acceptable to consuming apps.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"README states the behaviour was agreed with the product owner.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"Active icons could use the Symbols FILL axis directly instead of the Material Icons filled set.\",\"evidence_refs\":[],\"id\":\"A-002\",\"impacted_refs\":[\"R-001\",\"R-006\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"fonts.scss loads material-symbols-v29-latin-regular.woff2.\",\"source\":\"inferred\",\"statement\":\"The bundled Material Symbols font is the static v29 regular cut, so the FILL axis is unavailable and some chrome glyphs may be missing.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"Check the font file and render each chrome glyph in the Showcase during planning.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Pages next to V4 would keep a 304px offset.\",\"evidence_refs\":[],\"id\":\"A-003\",\"impacted_refs\":[\"R-005\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"The grep found only V1, V3 and its spec.\",\"source\":\"inferred\",\"statement\":\"No layout outside sidebar V1 and V3 hard-codes the 304px sidebar width or a sidebar-dependent fixed offset.\",\"status\":\"validated\",\"type\":\"assumption\",\"validation_method\":\"Repository grep for 304px, rail widths and calc(100vw - ...) in the library and Showcase.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"A consumer reading localStorage directly could mix contexts across tabs.\",\"evidence_refs\":[],\"id\":\"A-004\",\"impacted_refs\":[\"R-007\",\"R-009\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"README forbids consumers from reading the key directly.\",\"source\":\"inferred\",\"statement\":\"Consumers read the context through getCurrentContext(), which serves one snapshot per page load, so a tab stays internally consistent after another tab switches.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"Document the rule in sd-layout.md and cover the snapshot behaviour in service specs.\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-006\",\"R-010\"],\"id\":\"D-001\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which repositories this round covers\",\"rationale\":\"The user asked to build the feature on Core UI.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request\",\"source\":\"explicit-user\",\"statement\":\"Which repositories this round covers: Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\",\"TASK-019\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-002\",\"R-004\"],\"id\":\"D-002\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"V4 scope\",\"rationale\":\"The handoff is high fidelity and the brief points to the README.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI\",\"source\":\"explicit-user\",\"statement\":\"V4 scope: The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\",\"TASK-010\",\"TASK-011\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-007\"],\"id\":\"D-003\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"V4 section layout\",\"rationale\":\"Keeps V3 recent behaviour while adopting README sections.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings\",\"source\":\"explicit-user\",\"statement\":\"V4 section layout: Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-003\"],\"id\":\"D-004\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where V4 stores its collapsed state\",\"rationale\":\"Matches 'keep the V3 storage key' and keeps the preference when an app moves from V3 to V4.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Share the version 3 entry of versionStates; no new storage key\",\"source\":\"explicit-user\",\"statement\":\"Where V4 stores its collapsed state: Share the version 3 entry of versionStates; no new storage key\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-003\",\"AC-011\"],\"id\":\"D-005\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which sidebars render the new menu fields\",\"rationale\":\"Backward compatible with no V1-V3 behaviour change.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged\",\"source\":\"explicit-user\",\"statement\":\"Which sidebars render the new menu fields: Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-005\",\"AC-008\",\"AC-013\"],\"id\":\"D-006\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where V4 tokens are declared\",\"rationale\":\"Colours follow the theme tiers and dark mode; sizes vary with density, itemShape and pointer.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host\",\"source\":\"explicit-user\",\"statement\":\"Where V4 tokens are declared: Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\",\"TASK-016\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-011\",\"AC-021\"],\"id\":\"D-007\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How a preset overrides component tokens\",\"rationale\":\"Generic and validated instead of a graphite special case in the mixin.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error\",\"source\":\"explicit-user\",\"statement\":\"How a preset overrides component tokens: An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-016\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-008\",\"AC-016\",\"AC-017\"],\"id\":\"D-008\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the current context is resolved at bootstrap\",\"rationale\":\"The sidebar configuration may resolve after APP_INITIALIZER, so items are not known when consumers first read the context.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once\",\"source\":\"explicit-user\",\"statement\":\"How the current context is resolved at bootstrap: context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-016\"],\"id\":\"D-009\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where the context snapshot is stored\",\"rationale\":\"Same privacy model as pinned and recent menus.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout\",\"source\":\"explicit-user\",\"statement\":\"Where the context snapshot is stored: Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-008\",\"AC-018\"],\"id\":\"D-010\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where the switcher is mounted\",\"rationale\":\"V2 has no app-name header; collapsed rails have no room for text.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header\",\"source\":\"explicit-user\",\"statement\":\"Where the switcher is mounted: V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-009\",\"AC-019\"],\"id\":\"D-011\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Multi-tab synchronisation\",\"rationale\":\"Prevents silent work in a stale context without surprising the user.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Listen to the storage event and show a notice with a Reload action; never auto-reload\",\"source\":\"explicit-user\",\"statement\":\"Multi-tab synchronisation: Listen to the storage event and show a notice with a Reload action; never auto-reload\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-006\"],\"id\":\"D-012\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Icon strategy\",\"rationale\":\"The bundled Symbols font has no FILL axis.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph\",\"source\":\"explicit-user\",\"statement\":\"Icon strategy: Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\",\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"AC-023\",\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-012\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\",\"INV-009\",\"INV-010\",\"INV-011\",\"INV-012\",\"INV-013\",\"INV-014\"],\"id\":\"D-013\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Coverage approach\",\"rationale\":\"Repository rules require tests; logic is test-first and UI specs follow the V3 pattern.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts\",\"source\":\"explicit-user\",\"statement\":\"Coverage approach: TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-006\",\"TASK-016\"],\"type\":\"decision\",\"validation_boundary\":{\"kind\":\"none\",\"source_refs\":[\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-012\",\"R-013\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"AC-023\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\",\"INV-009\",\"INV-010\",\"INV-011\",\"INV-012\",\"INV-013\",\"INV-014\"]}},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-011\"],\"id\":\"D-014\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which menu tree V4 uses\",\"rationale\":\"V2, V3 and the mobile sidebars depend on the shared tree; a separate tree removes regression risk.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified\",\"source\":\"approved-spec\",\"statement\":\"Which menu tree V4 uses: A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-006\"],\"id\":\"D-015\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Trailing slot precedence and badge tones\",\"rationale\":\"README allows one trailing type and defines neutral badges as plain counts.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills\",\"source\":\"approved-spec\",\"statement\":\"Trailing slot precedence and badge tones: One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-012\",\"AC-022\"],\"id\":\"D-016\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the link/text-button audit is handled\",\"rationale\":\"The brief asks to report and not to create tokens.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Report it and document the graphite limitation; create no token and change no component in this round\",\"source\":\"approved-spec\",\"statement\":\"How the link/text-button audit is handled: Report it and document the graphite limitation; create no token and change no component in this round\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"R-007\",\"R-008\"],\"id\":\"D-017\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Public names of the context API\",\"rationale\":\"Repository convention names consumer-configured shapes '*Configuration' (SdLayoutNotificationConfiguration, SidebarConfigurationV3); 'branch' already names the tree rail.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace\",\"source\":\"approved-spec\",\"statement\":\"Public names of the context API: SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-016\"],\"id\":\"D-018\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"setCurrentContext with an id that is not in the configured items\",\"rationale\":\"Prevents storing an id that would immediately fall back on the next load.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Ignore it: no write and no reload\",\"source\":\"approved-spec\",\"statement\":\"setCurrentContext with an id that is not in the configured items: Ignore it: no write and no reload\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-009\",\"AC-017\",\"AC-019\"],\"id\":\"D-019\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the context snapshot is read back from storage\",\"rationale\":\"Handles share one in-memory entry per key and set() updates memory even when persistence fails; destroy/recreate is not fresh while another handle (for example a component-level SdLayoutStorageService) is alive.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it\",\"source\":\"approved-architecture\",\"statement\":\"How the context snapshot is read back from storage: An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-004\",\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-009\",\"AC-019\"],\"id\":\"D-020\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which storage events raise the changed-elsewhere notice\",\"rationale\":\"SdStorage keys are digests, so event keys cannot be matched; comparing ids within one namespace filters unrelated events and login/logout partition switches.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing\",\"source\":\"approved-architecture\",\"statement\":\"Which storage events raise the changed-elsewhere notice: On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-008\",\"AC-017\",\"AC-018\"],\"id\":\"D-021\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Who triggers reconciliation with the configured items\",\"rationale\":\"Covers sidebars used outside sd-layout, keeps the service and its listener lazy for apps without context, and keeps the service usable from provideAppInitializer.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call\",\"source\":\"approved-architecture\",\"statement\":\"Who triggers reconciliation with the configured items: sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-009\",\"AC-016\",\"AC-023\"],\"id\":\"D-022\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How reload, window events and the session marker are reached\",\"rationale\":\"location.reload cannot be spied in Chrome and a real reload aborts Karma and the docs site; SD_VIEWPORT is the precedent for an injectable browser seam.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake\",\"source\":\"approved-architecture\",\"statement\":\"How reload, window events and the session marker are reached: Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-002\",\"AC-009\"],\"id\":\"D-023\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where the V4 tree lives and who may import it\",\"rationale\":\"Mobile V4 renders the same tree in mobile mode; keeping it private leaves room to change it without a public contract.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index\",\"source\":\"approved-architecture\",\"statement\":\"Where the V4 tree lives and who may import it: components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\",\"TASK-010\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-016\"],\"id\":\"D-024\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Storage identity of the context snapshot\",\"rationale\":\"Follows the existing handle pattern so namespace and signout behaviour come for free.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes\",\"source\":\"approved-architecture\",\"statement\":\"Storage identity of the context snapshot: A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-017\"],\"id\":\"D-025\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Reconciliation algorithm\",\"rationale\":\"A user namespace that resolves after getCurrentContext() would otherwise reload on every load; the marker bounds that case to one reload per tab session while the warning surfaces the misconfiguration.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning\",\"source\":\"approved-architecture\",\"statement\":\"Reconciliation algorithm: syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"R-007\",\"AC-015\"],\"id\":\"D-026\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Outcome when a switch cannot be confirmed\",\"rationale\":\"Otherwise the busy row and the locked list would stay stuck.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads\",\"source\":\"approved-architecture\",\"statement\":\"Outcome when a switch cannot be confirmed: setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-006\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"R-008\",\"AC-018\"],\"id\":\"D-027\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Mobile placement and stacking of the context sheet\",\"rationale\":\"Mobile V2 is a bottom bar plus sheets; stacked aria-modal surfaces must not both react to Escape.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger\",\"source\":\"approved-architecture\",\"statement\":\"Mobile placement and stacking of the context sheet: Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-007\",\"TASK-010\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"AC-014\"],\"id\":\"D-028\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Colours of the shared switcher in V1-V4\",\"rationale\":\"The switcher is shared and has no colour input, like the V4 sidebar.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor\",\"source\":\"approved-architecture\",\"statement\":\"Colours of the shared switcher in V1-V4: Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-007\",\"TASK-012\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-011\",\"AC-021\"],\"id\":\"D-029\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Shape and validation of preset component overrides\",\"rationale\":\"A (light, dark) pair would emit only the first part of a comma-separated box-shadow; tests cannot inject a preset into the non-default $presets map.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation\",\"source\":\"approved-architecture\",\"statement\":\"Shape and validation of preset component overrides: Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-016\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"AC-023\"],\"id\":\"D-030\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the Showcase demo hosts the context switcher\",\"rationale\":\"The demo already provides SdLayoutService and SdLayoutStorageService at component level; a real reload would reload the docs site.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading\",\"source\":\"approved-architecture\",\"statement\":\"How the Showcase demo hosts the context switcher: The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-018\"],\"type\":\"decision\"},{\"evidence_refs\":[\"EVIDENCE-006\",\"EVIDENCE-007\",\"EVIDENCE-009\",\"EVIDENCE-010\",\"EVIDENCE-012\",\"EVIDENCE-013\",\"EVIDENCE-014\",\"EVIDENCE-015\"],\"id\":\"INV-001\",\"protected_refs\":[\"R-008\",\"AC-011\",\"AC-018\"],\"statement\":\"Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.\",\"task_refs\":[\"TASK-006\",\"TASK-007\",\"TASK-009\",\"TASK-010\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-002\",\"protected_refs\":[\"R-007\",\"AC-016\"],\"statement\":\"Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-003\",\"protected_refs\":[\"R-007\",\"AC-015\",\"AC-017\"],\"statement\":\"A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-004\",\"protected_refs\":[\"R-007\",\"R-009\",\"AC-016\",\"AC-019\"],\"statement\":\"Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-008\",\"EVIDENCE-009\"],\"id\":\"INV-005\",\"protected_refs\":[\"R-001\",\"AC-003\"],\"statement\":\"V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.\",\"task_refs\":[\"TASK-008\",\"TASK-009\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-002\",\"EVIDENCE-008\",\"EVIDENCE-009\",\"EVIDENCE-012\",\"EVIDENCE-013\",\"EVIDENCE-014\",\"EVIDENCE-015\",\"EVIDENCE-016\"],\"id\":\"INV-006\",\"protected_refs\":[\"R-001\",\"R-003\",\"AC-011\",\"AC-013\"],\"statement\":\"components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.\",\"task_refs\":[\"TASK-002\",\"TASK-008\",\"TASK-009\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\",\"TASK-016\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-009\",\"EVIDENCE-016\"],\"id\":\"INV-007\",\"protected_refs\":[\"R-005\",\"AC-013\",\"AC-021\"],\"statement\":\"V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.\",\"task_refs\":[\"TASK-009\",\"TASK-016\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-016\"],\"id\":\"INV-008\",\"protected_refs\":[\"R-010\",\"R-011\",\"AC-020\",\"AC-021\"],\"statement\":\"A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.\",\"task_refs\":[\"TASK-016\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-009\",\"protected_refs\":[\"R-007\",\"AC-017\"],\"statement\":\"SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-001\",\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\"],\"id\":\"INV-010\",\"protected_refs\":[\"R-007\",\"R-009\",\"R-013\",\"AC-016\",\"AC-023\"],\"statement\":\"Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.\",\"task_refs\":[\"TASK-001\",\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\",\"TASK-017\",\"TASK-018\",\"TASK-019\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-010\"],\"id\":\"INV-011\",\"protected_refs\":[\"R-002\",\"AC-009\",\"AC-010\"],\"statement\":\"Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.\",\"task_refs\":[\"TASK-010\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-011\"],\"id\":\"INV-012\",\"protected_refs\":[\"R-004\",\"AC-012\"],\"statement\":\"V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.\",\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-007\"],\"id\":\"INV-013\",\"protected_refs\":[\"R-006\",\"AC-014\"],\"statement\":\"The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.\",\"task_refs\":[\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-017\"],\"id\":\"INV-014\",\"protected_refs\":[\"R-012\",\"AC-022\"],\"statement\":\"Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.\",\"task_refs\":[\"TASK-017\"],\"type\":\"invariant\"}],\"revision\":4,\"schema_version\":1}\n"
    }
  },
  "goal_backward_review": {
    "schema_version": 1,
    "mode": "sdcorejs-plan:goal-backward",
    "decision_coverage": {
      "schema_version": 1,
      "revision": 4,
      "records": [
        {
          "id": "R-001",
          "type": "requirement",
          "statement": "A desktop sd-sidebar-v4 component, forked from sd-sidebar-v3, renders the README D1-D4 frames: header (logo, app name, context slot, collapse button), pill search with Ctrl+K/Cmd+K focus and Up/Down/Enter/Esc result navigation, flat accent-insensitive search results with match highlight, Pinned and Recent shortcut sections, menu sections from menu.section, root/group/child rows with pill active state and child marker, a dot on a closed group that contains the active route, the trailing slot, the account footer, the 72px collapsed rail with separators and mini badges, and the collapsed-group flyout. It keeps V3 routing, navigation side effects, the collapse storage entry and the V3 accessibility rules.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-008",
            "TASK-009"
          ]
        },
        {
          "id": "R-002",
          "type": "requirement",
          "statement": "A mobile sd-sidebar-mobile-v4 component, forked from sd-sidebar-mobile-v3, renders the README M1-M3 frames: a 56px app bar, a drawer of min(88vw, 360px) with the V4 tree in mobile mode (44px rows, 44px search, close button), closing on backdrop, menu selection or Esc with a focus trap and focus return, clearing the query on close, and an opt-in bottom bar built from mobile.bottomBar (at most 4 menu ids plus More).",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-010"
          ]
        },
        {
          "id": "R-003",
          "type": "requirement",
          "statement": "SdLayoutMenu gains optional fields section, badge { value, tone }, status { label, tone, live } and comingSoon, replacing the commented notify field. Existing menus compile and behave unchanged. Only V4 desktop and mobile render the new fields; a comingSoon item is aria-disabled, never navigates and is excluded from V4 search. searchMenuLeaves keeps its current behavior.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-002",
            "TASK-008",
            "TASK-015"
          ]
        },
        {
          "id": "R-004",
          "type": "requirement",
          "statement": "SidebarConfigurationV4 (version: 4) extends SidebarConfigurationV3 with itemShape, density, collapsedGroup and mobile.bottomBar. It joins ISdSidebarConfiguration, normalizeSidebarConfiguration fills its defaults, and the sd-layout component renders V4 desktop or mobile by breakpoint. V4 ignores brandColor and brandLightColor.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-003",
            "TASK-011"
          ]
        },
        {
          "id": "R-005",
          "type": "requirement",
          "statement": "Every V4 colour goes through --sd-* tokens: the --sd-sidebar-v4-* colour tokens of the README table live in the theme component-token map with light and dark values, and the size tokens (width 280px, rail width 72px, item and child height, item radius) are declared on the .sd-sidebar-v4 host. V4 has no colour input and no hard-coded hex or 304px; its offsets use var(--sd-sidebar-v4-width) and var(--sd-sidebar-v4-rail-width). V1 and V3 keep their 304px layout.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-009",
            "TASK-016"
          ]
        },
        {
          "id": "R-006",
          "type": "requirement",
          "statement": "A shared sd-layout-context-switcher component in components/shared/context-switcher renders the README CS1-CS3 states: header trigger, desktop popover with optional accent-insensitive search (auto above 7 items, forced by searchable), label and count, rows with image or initial avatar and an active check, the switching state that locks the list, and the mobile bottom sheet. One item shows the name only and cannot open; no configuration renders nothing. On a collapsed rail it shows the context avatar and opens to the right.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-007"
          ]
        },
        {
          "id": "R-007",
          "type": "requirement",
          "statement": "SdLayoutContextService (providedIn root) exposes getCurrentContext(): SdLayoutContext | null and setCurrentContext(id): void. Core persists a context snapshot through SdLayoutStorageService, reloads the page after a switch, emits no change event, ignores a re-selection of the active context, and reconciles the stored snapshot with the configured items so that a missing or stale id falls back to items[0] with at most one reload.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007"
          ]
        },
        {
          "id": "R-008",
          "type": "requirement",
          "statement": "SidebarConfigurationBase gains context?: SdLayoutContextConfiguration shared by V1-V4. The switcher is mounted in the headers of sidebar V1, V2, V3 and V4 and in the drawer header of mobile V1-V4 at the agreed positions. Without context every sidebar renders exactly as before.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-006",
            "TASK-009",
            "TASK-010",
            "TASK-012",
            "TASK-013",
            "TASK-014",
            "TASK-015"
          ]
        },
        {
          "id": "R-009",
          "type": "requirement",
          "statement": "When another tab changes the stored context, an open tab shows a notice that the context changed elsewhere with a Reload action, and never reloads by itself.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "R-010",
          "type": "requirement",
          "statement": "A ninth named preset 'graphite' is added to the theme presets with the README palette values. It is light-only like the other named presets, inherits the semantic state colours and keeps primary-contrast white.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "assets/scss/themes",
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "R-011",
          "type": "requirement",
          "statement": "A named preset can override component tokens through an optional components sub-map that the theme mixin forwards to the component-token emitter; unknown keys fail compilation. 'graphite' overrides --sd-sidebar-v4-active-bg and --sd-sidebar-v4-active-shadow so the active V4 item is a raised surface.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "assets/scss/themes",
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "R-012",
          "type": "requirement",
          "statement": "The audit of components that colour links or text buttons with --sd-primary is recorded, no new token is created, and the theme docs state that under graphite those elements share the text colour.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "assets/scss/themes",
          "task_refs": [
            "TASK-017"
          ]
        },
        {
          "id": "R-013",
          "type": "requirement",
          "statement": "Documentation, Showcase, i18n, tests and release notes follow the change: STYLE-GUIDE.md and THEME.md list nine presets, sd-layout.md documents V4, the new menu fields and the context API, the Showcase layout page gains V4 and context demos with matching counts, the five i18n catalogs get the new keys, theme scripts cover graphite, CHANGELOG.md gets an Unreleased entry, and v20/v21/v22 are produced by npm run sync.",
          "source": "explicit-user",
          "status": "active",
          "owner_repository_id": "sdcorejs-angular",
          "owner_module_id": "modules/layout",
          "task_refs": [
            "TASK-001",
            "TASK-017",
            "TASK-018",
            "TASK-019"
          ]
        },
        {
          "id": "AC-001",
          "type": "acceptance-criterion",
          "statement": "Render sd-sidebar-v4 with a nested menu on an active child route -> root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
          "behavior": "Render sd-sidebar-v4 with a nested menu on an active child route",
          "expected_result": "root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001"
          ],
          "task_refs": [
            "TASK-008"
          ]
        },
        {
          "id": "AC-002",
          "type": "acceptance-criterion",
          "statement": "Click root, child and external-URL items in V4, then change the route -> internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
          "behavior": "Click root, child and external-URL items in V4, then change the route",
          "expected_result": "internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001"
          ],
          "task_refs": [
            "TASK-009"
          ]
        },
        {
          "id": "AC-003",
          "type": "acceptance-criterion",
          "statement": "Toggle collapse in V4, recreate the component, and list the storage keys written -> the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
          "behavior": "Toggle collapse in V4, recreate the component, and list the storage keys written",
          "expected_result": "the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001",
            "R-005"
          ],
          "task_refs": [
            "TASK-009"
          ]
        },
        {
          "id": "AC-004",
          "type": "acceptance-criterion",
          "statement": "Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc -> the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
          "behavior": "Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc",
          "expected_result": "the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001",
            "R-003"
          ],
          "task_refs": [
            "TASK-002",
            "TASK-009"
          ]
        },
        {
          "id": "AC-005",
          "type": "acceptance-criterion",
          "statement": "Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand' -> 'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
          "behavior": "Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand'",
          "expected_result": "'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001"
          ],
          "task_refs": [
            "TASK-009"
          ]
        },
        {
          "id": "AC-006",
          "type": "acceptance-criterion",
          "statement": "Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon -> a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
          "behavior": "Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon",
          "expected_result": "a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001",
            "R-003"
          ],
          "task_refs": [
            "TASK-008"
          ]
        },
        {
          "id": "AC-007",
          "type": "acceptance-criterion",
          "statement": "Render V4 with sectioned items, unsectioned items, pinned items and recent items -> items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
          "behavior": "Render V4 with sectioned items, unsectioned items, pinned items and recent items",
          "expected_result": "items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001",
            "R-003"
          ],
          "task_refs": [
            "TASK-002",
            "TASK-008"
          ]
        },
        {
          "id": "AC-008",
          "type": "acceptance-criterion",
          "statement": "Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer -> the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
          "behavior": "Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer",
          "expected_result": "the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-001",
            "R-005"
          ],
          "task_refs": [
            "TASK-009"
          ]
        },
        {
          "id": "AC-009",
          "type": "acceptance-criterion",
          "statement": "Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection -> the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
          "behavior": "Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection",
          "expected_result": "the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-002"
          ],
          "task_refs": [
            "TASK-010"
          ]
        },
        {
          "id": "AC-010",
          "type": "acceptance-criterion",
          "statement": "Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar -> the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
          "behavior": "Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar",
          "expected_result": "the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-002"
          ],
          "task_refs": [
            "TASK-010"
          ]
        },
        {
          "id": "AC-011",
          "type": "acceptance-criterion",
          "statement": "Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context -> all existing specs pass unchanged and V3 renders no badge, status or section markup",
          "behavior": "Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context",
          "expected_result": "all existing specs pass unchanged and V3 renders no badge, status or section markup",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-003",
            "R-008"
          ],
          "task_refs": [
            "TASK-012",
            "TASK-013",
            "TASK-014",
            "TASK-015"
          ]
        },
        {
          "id": "AC-012",
          "type": "acceptance-criterion",
          "statement": "Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration -> sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
          "behavior": "Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration",
          "expected_result": "sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-004"
          ],
          "task_refs": [
            "TASK-003",
            "TASK-011"
          ]
        },
        {
          "id": "AC-013",
          "type": "acceptance-criterion",
          "statement": "Compile the default theme in light and dark, and scan the V4 stylesheets -> every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
          "behavior": "Compile the default theme in light and dark, and scan the V4 stylesheets",
          "expected_result": "every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-005"
          ],
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "AC-014",
          "type": "acceptance-criterion",
          "statement": "Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images -> search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
          "behavior": "Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images",
          "expected_result": "search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-006"
          ],
          "task_refs": [
            "TASK-007"
          ]
        },
        {
          "id": "AC-015",
          "type": "acceptance-criterion",
          "statement": "Select a different context, then reopen and select the active context -> the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
          "behavior": "Select a different context, then reopen and select the active context",
          "expected_result": "the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
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
          "id": "AC-016",
          "type": "acceptance-criterion",
          "statement": "Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id -> getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
          "behavior": "Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id",
          "expected_result": "getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-007"
          ],
          "task_refs": [
            "TASK-005",
            "TASK-006"
          ]
        },
        {
          "id": "AC-017",
          "type": "acceptance-criterion",
          "statement": "Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail -> a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
          "behavior": "Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail",
          "expected_result": "a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-007",
            "R-008"
          ],
          "task_refs": [
            "TASK-004",
            "TASK-006"
          ]
        },
        {
          "id": "AC-018",
          "type": "acceptance-criterion",
          "statement": "Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4 -> each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
          "behavior": "Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4",
          "expected_result": "each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-006",
            "R-008"
          ],
          "task_refs": [
            "TASK-007",
            "TASK-009",
            "TASK-010",
            "TASK-012",
            "TASK-013",
            "TASK-014",
            "TASK-015"
          ]
        },
        {
          "id": "AC-019",
          "type": "acceptance-criterion",
          "statement": "Dispatch a storage event for the context key with another id, then one for an unrelated key -> the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
          "behavior": "Dispatch a storage event for the context key with another id, then one for an unrelated key",
          "expected_result": "the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-009"
          ],
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "AC-020",
          "type": "acceptance-criterion",
          "statement": "Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto -> the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
          "behavior": "Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto",
          "expected_result": "the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-010"
          ],
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "AC-021",
          "type": "acceptance-criterion",
          "statement": "Compile graphite, another named preset, and a preset whose components map has an unknown key -> graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
          "behavior": "Compile graphite, another named preset, and a preset whose components map has an unknown key",
          "expected_result": "graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-011"
          ],
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "AC-022",
          "type": "acceptance-criterion",
          "statement": "Search the theme and layout documentation and CHANGELOG.md -> STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
          "behavior": "Search the theme and layout documentation and CHANGELOG.md",
          "expected_result": "STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-012",
            "R-013"
          ],
          "task_refs": [
            "TASK-017"
          ]
        },
        {
          "id": "AC-023",
          "type": "acceptance-criterion",
          "statement": "Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts -> the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
          "behavior": "Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts",
          "expected_result": "the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
          "verification_kind": "automated",
          "blocking": true,
          "requirement_refs": [
            "R-013"
          ],
          "task_refs": [
            "TASK-001",
            "TASK-018",
            "TASK-019"
          ]
        },
        {
          "id": "A-001",
          "type": "assumption",
          "statement": "Reloading the page after a context switch, with no change event, is acceptable to consuming apps.",
          "blocking": false,
          "evidence_refs": [],
          "owner": "sdcorejs-angular maintainers",
          "source": "explicit",
          "confidence": "high",
          "status": "confirmed",
          "consequence_if_wrong": "Apps needing an in-place switch would need a different API.",
          "validation_method": "README states the behaviour was agreed with the product owner.",
          "rationale": "Agreed with the product owner per the design handoff README.",
          "impacted_refs": [
            "R-007"
          ]
        },
        {
          "id": "A-002",
          "type": "assumption",
          "statement": "The bundled Material Symbols font is the static v29 regular cut, so the FILL axis is unavailable and some chrome glyphs may be missing.",
          "blocking": false,
          "evidence_refs": [],
          "owner": "sdcorejs-angular maintainers",
          "source": "inferred",
          "confidence": "medium",
          "status": "proposed",
          "consequence_if_wrong": "Active icons could use the Symbols FILL axis directly instead of the Material Icons filled set.",
          "validation_method": "Check the font file and render each chrome glyph in the Showcase during planning.",
          "rationale": "fonts.scss loads material-symbols-v29-latin-regular.woff2.",
          "impacted_refs": [
            "R-001",
            "R-006"
          ]
        },
        {
          "id": "A-003",
          "type": "assumption",
          "statement": "No layout outside sidebar V1 and V3 hard-codes the 304px sidebar width or a sidebar-dependent fixed offset.",
          "blocking": false,
          "evidence_refs": [],
          "owner": "sdcorejs-angular maintainers",
          "source": "inferred",
          "confidence": "high",
          "status": "validated",
          "consequence_if_wrong": "Pages next to V4 would keep a 304px offset.",
          "validation_method": "Repository grep for 304px, rail widths and calc(100vw - ...) in the library and Showcase.",
          "rationale": "The grep found only V1, V3 and its spec.",
          "impacted_refs": [
            "R-005"
          ]
        },
        {
          "id": "A-004",
          "type": "assumption",
          "statement": "Consumers read the context through getCurrentContext(), which serves one snapshot per page load, so a tab stays internally consistent after another tab switches.",
          "blocking": false,
          "evidence_refs": [],
          "owner": "sdcorejs-angular maintainers",
          "source": "inferred",
          "confidence": "medium",
          "status": "proposed",
          "consequence_if_wrong": "A consumer reading localStorage directly could mix contexts across tabs.",
          "validation_method": "Document the rule in sd-layout.md and cover the snapshot behaviour in service specs.",
          "rationale": "README forbids consumers from reading the key directly.",
          "impacted_refs": [
            "R-007",
            "R-009"
          ]
        },
        {
          "id": "D-001",
          "type": "decision",
          "statement": "Which repositories this round covers: Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request",
          "question": "Which repositories this round covers",
          "selected_value": "Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "repository",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The user asked to build the feature on Core UI.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "R-006",
            "R-010"
          ],
          "task_refs": [
            "TASK-017",
            "TASK-019"
          ]
        },
        {
          "id": "D-002",
          "type": "decision",
          "statement": "V4 scope: The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI",
          "question": "V4 scope",
          "selected_value": "The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The handoff is high fidelity and the brief points to the README.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "R-002",
            "R-004"
          ],
          "task_refs": [
            "TASK-009",
            "TASK-010",
            "TASK-011"
          ]
        },
        {
          "id": "D-003",
          "type": "decision",
          "statement": "V4 section layout: Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings",
          "question": "V4 section layout",
          "selected_value": "Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Keeps V3 recent behaviour while adopting README sections.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "AC-007"
          ],
          "task_refs": [
            "TASK-009"
          ]
        },
        {
          "id": "D-004",
          "type": "decision",
          "statement": "Where V4 stores its collapsed state: Share the version 3 entry of versionStates; no new storage key",
          "question": "Where V4 stores its collapsed state",
          "selected_value": "Share the version 3 entry of versionStates; no new storage key",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Matches 'keep the V3 storage key' and keeps the preference when an app moves from V3 to V4.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "AC-003"
          ],
          "task_refs": [
            "TASK-009"
          ]
        },
        {
          "id": "D-005",
          "type": "decision",
          "statement": "Which sidebars render the new menu fields: Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged",
          "question": "Which sidebars render the new menu fields",
          "selected_value": "Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Backward compatible with no V1-V3 behaviour change.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-003",
            "AC-011"
          ],
          "task_refs": [
            "TASK-002"
          ]
        },
        {
          "id": "D-006",
          "type": "decision",
          "statement": "Where V4 tokens are declared: Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host",
          "question": "Where V4 tokens are declared",
          "selected_value": "Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Colours follow the theme tiers and dark mode; sizes vary with density, itemShape and pointer.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-005",
            "AC-008",
            "AC-013"
          ],
          "task_refs": [
            "TASK-009",
            "TASK-016"
          ]
        },
        {
          "id": "D-007",
          "type": "decision",
          "statement": "How a preset overrides component tokens: An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error",
          "question": "How a preset overrides component tokens",
          "selected_value": "An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Generic and validated instead of a graphite special case in the mixin.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-011",
            "AC-021"
          ],
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "D-008",
          "type": "decision",
          "statement": "How the current context is resolved at bootstrap: context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once",
          "question": "How the current context is resolved at bootstrap",
          "selected_value": "context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The sidebar configuration may resolve after APP_INITIALIZER, so items are not known when consumers first read the context.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "R-008",
            "AC-016",
            "AC-017"
          ],
          "task_refs": [
            "TASK-003",
            "TASK-006"
          ]
        },
        {
          "id": "D-009",
          "type": "decision",
          "statement": "Where the context snapshot is stored: Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout",
          "question": "Where the context snapshot is stored",
          "selected_value": "Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Same privacy model as pinned and recent menus.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "AC-016"
          ],
          "task_refs": [
            "TASK-005"
          ]
        },
        {
          "id": "D-010",
          "type": "decision",
          "statement": "Where the switcher is mounted: V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header",
          "question": "Where the switcher is mounted",
          "selected_value": "V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "V2 has no app-name header; collapsed rails have no room for text.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-008",
            "AC-018"
          ],
          "task_refs": [
            "TASK-012",
            "TASK-013",
            "TASK-014",
            "TASK-015"
          ]
        },
        {
          "id": "D-011",
          "type": "decision",
          "statement": "Multi-tab synchronisation: Listen to the storage event and show a notice with a Reload action; never auto-reload",
          "question": "Multi-tab synchronisation",
          "selected_value": "Listen to the storage event and show a notice with a Reload action; never auto-reload",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Prevents silent work in a stale context without surprising the user.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-009",
            "AC-019"
          ],
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "D-012",
          "type": "decision",
          "statement": "Icon strategy: Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph",
          "question": "Icon strategy",
          "selected_value": "Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The bundled Symbols font has no FILL axis.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "R-006"
          ],
          "task_refs": [
            "TASK-008",
            "TASK-009"
          ]
        },
        {
          "id": "D-013",
          "type": "decision",
          "statement": "Coverage approach: TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts",
          "question": "Coverage approach",
          "selected_value": "TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts",
          "source": "explicit-user",
          "status": "approved",
          "blocking": true,
          "scope": "repository",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Repository rules require tests; logic is test-first and UI specs follow the V3 pattern.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-013",
            "AC-023",
            "R-001",
            "R-002",
            "R-003",
            "R-004",
            "R-005",
            "R-006",
            "R-007",
            "R-008",
            "R-009",
            "R-010",
            "R-011",
            "R-012",
            "AC-001",
            "AC-002",
            "AC-003",
            "AC-004",
            "AC-005",
            "AC-006",
            "AC-007",
            "AC-008",
            "AC-009",
            "AC-010",
            "AC-011",
            "AC-012",
            "AC-013",
            "AC-014",
            "AC-015",
            "AC-016",
            "AC-017",
            "AC-018",
            "AC-019",
            "AC-020",
            "AC-021",
            "AC-022",
            "INV-001",
            "INV-002",
            "INV-003",
            "INV-004",
            "INV-005",
            "INV-006",
            "INV-007",
            "INV-008",
            "INV-009",
            "INV-010",
            "INV-011",
            "INV-012",
            "INV-013",
            "INV-014"
          ],
          "validation_boundary": {
            "kind": "none",
            "source_refs": [
              "R-001",
              "R-002",
              "R-003",
              "R-004",
              "R-005",
              "R-006",
              "R-007",
              "R-008",
              "R-009",
              "R-010",
              "R-011",
              "R-012",
              "R-013",
              "AC-001",
              "AC-002",
              "AC-003",
              "AC-004",
              "AC-005",
              "AC-006",
              "AC-007",
              "AC-008",
              "AC-009",
              "AC-010",
              "AC-011",
              "AC-012",
              "AC-013",
              "AC-014",
              "AC-015",
              "AC-016",
              "AC-017",
              "AC-018",
              "AC-019",
              "AC-020",
              "AC-021",
              "AC-022",
              "AC-023",
              "INV-001",
              "INV-002",
              "INV-003",
              "INV-004",
              "INV-005",
              "INV-006",
              "INV-007",
              "INV-008",
              "INV-009",
              "INV-010",
              "INV-011",
              "INV-012",
              "INV-013",
              "INV-014"
            ]
          },
          "task_refs": [
            "TASK-001",
            "TASK-006",
            "TASK-016"
          ]
        },
        {
          "id": "D-014",
          "type": "decision",
          "statement": "Which menu tree V4 uses: A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified",
          "question": "Which menu tree V4 uses",
          "selected_value": "A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified",
          "source": "approved-spec",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "V2, V3 and the mobile sidebars depend on the shared tree; a separate tree removes regression risk.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "AC-011"
          ],
          "task_refs": [
            "TASK-008"
          ]
        },
        {
          "id": "D-015",
          "type": "decision",
          "statement": "Trailing slot precedence and badge tones: One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills",
          "question": "Trailing slot precedence and badge tones",
          "selected_value": "One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills",
          "source": "approved-spec",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "README allows one trailing type and defines neutral badges as plain counts.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "AC-006"
          ],
          "task_refs": [
            "TASK-002",
            "TASK-008"
          ]
        },
        {
          "id": "D-016",
          "type": "decision",
          "statement": "How the link/text-button audit is handled: Report it and document the graphite limitation; create no token and change no component in this round",
          "question": "How the link/text-button audit is handled",
          "selected_value": "Report it and document the graphite limitation; create no token and change no component in this round",
          "source": "approved-spec",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The brief asks to report and not to create tokens.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-012",
            "AC-022"
          ],
          "task_refs": [
            "TASK-017"
          ]
        },
        {
          "id": "D-017",
          "type": "decision",
          "statement": "Public names of the context API: SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace",
          "question": "Public names of the context API",
          "selected_value": "SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace",
          "source": "approved-spec",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Repository convention names consumer-configured shapes '*Configuration' (SdLayoutNotificationConfiguration, SidebarConfigurationV3); 'branch' already names the tree rail.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-006",
            "R-007",
            "R-008"
          ],
          "task_refs": [
            "TASK-003",
            "TASK-007"
          ]
        },
        {
          "id": "D-018",
          "type": "decision",
          "statement": "setCurrentContext with an id that is not in the configured items: Ignore it: no write and no reload",
          "question": "setCurrentContext with an id that is not in the configured items",
          "selected_value": "Ignore it: no write and no reload",
          "source": "approved-spec",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Prevents storing an id that would immediately fall back on the next load.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "AC-016"
          ],
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "D-019",
          "type": "decision",
          "statement": "How the context snapshot is read back from storage: An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it",
          "question": "How the context snapshot is read back from storage",
          "selected_value": "An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Handles share one in-memory entry per key and set() updates memory even when persistence fails; destroy/recreate is not fresh while another handle (for example a component-level SdLayoutStorageService) is alive.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "R-009",
            "AC-017",
            "AC-019"
          ],
          "task_refs": [
            "TASK-004",
            "TASK-005"
          ]
        },
        {
          "id": "D-020",
          "type": "decision",
          "statement": "Which storage events raise the changed-elsewhere notice: On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing",
          "question": "Which storage events raise the changed-elsewhere notice",
          "selected_value": "On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "SdStorage keys are digests, so event keys cannot be matched; comparing ids within one namespace filters unrelated events and login/logout partition switches.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-009",
            "AC-019"
          ],
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "D-021",
          "type": "decision",
          "statement": "Who triggers reconciliation with the configured items: sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call",
          "question": "Who triggers reconciliation with the configured items",
          "selected_value": "sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Covers sidebars used outside sd-layout, keeps the service and its listener lazy for apps without context, and keeps the service usable from provideAppInitializer.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "R-008",
            "AC-017",
            "AC-018"
          ],
          "task_refs": [
            "TASK-006",
            "TASK-007"
          ]
        },
        {
          "id": "D-022",
          "type": "decision",
          "statement": "How reload, window events and the session marker are reached: Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake",
          "question": "How reload, window events and the session marker are reached",
          "selected_value": "Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "location.reload cannot be spied in Chrome and a real reload aborts Karma and the docs site; SD_VIEWPORT is the precedent for an injectable browser seam.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "R-009",
            "AC-016",
            "AC-023"
          ],
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "D-023",
          "type": "decision",
          "statement": "Where the V4 tree lives and who may import it: components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index",
          "question": "Where the V4 tree lives and who may import it",
          "selected_value": "components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Mobile V4 renders the same tree in mobile mode; keeping it private leaves room to change it without a public contract.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-001",
            "R-002",
            "AC-009"
          ],
          "task_refs": [
            "TASK-008",
            "TASK-010"
          ]
        },
        {
          "id": "D-024",
          "type": "decision",
          "statement": "Storage identity of the context snapshot: A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes",
          "question": "Storage identity of the context snapshot",
          "selected_value": "A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Follows the existing handle pattern so namespace and signout behaviour come for free.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "AC-016"
          ],
          "task_refs": [
            "TASK-005"
          ]
        },
        {
          "id": "D-025",
          "type": "decision",
          "statement": "Reconciliation algorithm: syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning",
          "question": "Reconciliation algorithm",
          "selected_value": "syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "public-contract",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "A user namespace that resolves after getCurrentContext() would otherwise reload on every load; the marker bounds that case to one reload per tab session while the warning surfaces the misconfiguration.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-007",
            "AC-017"
          ],
          "task_refs": [
            "TASK-006"
          ]
        },
        {
          "id": "D-026",
          "type": "decision",
          "statement": "Outcome when a switch cannot be confirmed: setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads",
          "question": "Outcome when a switch cannot be confirmed",
          "selected_value": "setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Otherwise the busy row and the locked list would stay stuck.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-006",
            "R-007",
            "AC-015"
          ],
          "task_refs": [
            "TASK-001",
            "TASK-006",
            "TASK-007"
          ]
        },
        {
          "id": "D-027",
          "type": "decision",
          "statement": "Mobile placement and stacking of the context sheet: Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger",
          "question": "Mobile placement and stacking of the context sheet",
          "selected_value": "Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "Mobile V2 is a bottom bar plus sheets; stacked aria-modal surfaces must not both react to Escape.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-006",
            "R-008",
            "AC-018"
          ],
          "task_refs": [
            "TASK-007",
            "TASK-010",
            "TASK-013",
            "TASK-014",
            "TASK-015"
          ]
        },
        {
          "id": "D-028",
          "type": "decision",
          "statement": "Colours of the shared switcher in V1-V4: Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor",
          "question": "Colours of the shared switcher in V1-V4",
          "selected_value": "Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The switcher is shared and has no colour input, like the V4 sidebar.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-006",
            "AC-014"
          ],
          "task_refs": [
            "TASK-007",
            "TASK-012"
          ]
        },
        {
          "id": "D-029",
          "type": "decision",
          "statement": "Shape and validation of preset component overrides: Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation",
          "question": "Shape and validation of preset component overrides",
          "selected_value": "Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "A (light, dark) pair would emit only the first part of a comma-separated box-shadow; tests cannot inject a preset into the non-default $presets map.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-011",
            "AC-021"
          ],
          "task_refs": [
            "TASK-016"
          ]
        },
        {
          "id": "D-030",
          "type": "decision",
          "statement": "How the Showcase demo hosts the context switcher: The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading",
          "question": "How the Showcase demo hosts the context switcher",
          "selected_value": "The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading",
          "source": "approved-architecture",
          "status": "approved",
          "blocking": true,
          "scope": "module",
          "owner_repository_id": "sdcorejs-angular",
          "rationale": "The demo already provides SdLayoutService and SdLayoutStorageService at component level; a real reload would reload the docs site.",
          "supersedes": null,
          "revisit_condition": null,
          "convention_impact": {
            "candidate": false,
            "category": null
          },
          "downstream_refs": [
            "R-013",
            "AC-023"
          ],
          "task_refs": [
            "TASK-018"
          ]
        },
        {
          "id": "INV-001",
          "type": "invariant",
          "statement": "Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.",
          "protected_refs": [
            "R-008",
            "AC-011",
            "AC-018"
          ],
          "task_refs": [
            "TASK-006",
            "TASK-007",
            "TASK-009",
            "TASK-010",
            "TASK-012",
            "TASK-013",
            "TASK-014",
            "TASK-015"
          ],
          "evidence_refs": [
            "EVIDENCE-006",
            "EVIDENCE-007",
            "EVIDENCE-009",
            "EVIDENCE-010",
            "EVIDENCE-012",
            "EVIDENCE-013",
            "EVIDENCE-014",
            "EVIDENCE-015"
          ]
        },
        {
          "id": "INV-002",
          "type": "invariant",
          "statement": "Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.",
          "protected_refs": [
            "R-007",
            "AC-016"
          ],
          "task_refs": [
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007"
          ],
          "evidence_refs": [
            "EVIDENCE-004",
            "EVIDENCE-005",
            "EVIDENCE-006",
            "EVIDENCE-007"
          ]
        },
        {
          "id": "INV-003",
          "type": "invariant",
          "statement": "A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.",
          "protected_refs": [
            "R-007",
            "AC-015",
            "AC-017"
          ],
          "task_refs": [
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007"
          ],
          "evidence_refs": [
            "EVIDENCE-004",
            "EVIDENCE-005",
            "EVIDENCE-006",
            "EVIDENCE-007"
          ]
        },
        {
          "id": "INV-004",
          "type": "invariant",
          "statement": "Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.",
          "protected_refs": [
            "R-007",
            "R-009",
            "AC-016",
            "AC-019"
          ],
          "task_refs": [
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007"
          ],
          "evidence_refs": [
            "EVIDENCE-004",
            "EVIDENCE-005",
            "EVIDENCE-006",
            "EVIDENCE-007"
          ]
        },
        {
          "id": "INV-005",
          "type": "invariant",
          "statement": "V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.",
          "protected_refs": [
            "R-001",
            "AC-003"
          ],
          "task_refs": [
            "TASK-008",
            "TASK-009"
          ],
          "evidence_refs": [
            "EVIDENCE-008",
            "EVIDENCE-009"
          ]
        },
        {
          "id": "INV-006",
          "type": "invariant",
          "statement": "components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.",
          "protected_refs": [
            "R-001",
            "R-003",
            "AC-011",
            "AC-013"
          ],
          "task_refs": [
            "TASK-002",
            "TASK-008",
            "TASK-009",
            "TASK-012",
            "TASK-013",
            "TASK-014",
            "TASK-015",
            "TASK-016"
          ],
          "evidence_refs": [
            "EVIDENCE-002",
            "EVIDENCE-008",
            "EVIDENCE-009",
            "EVIDENCE-012",
            "EVIDENCE-013",
            "EVIDENCE-014",
            "EVIDENCE-015",
            "EVIDENCE-016"
          ]
        },
        {
          "id": "INV-007",
          "type": "invariant",
          "statement": "V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.",
          "protected_refs": [
            "R-005",
            "AC-013",
            "AC-021"
          ],
          "task_refs": [
            "TASK-009",
            "TASK-016"
          ],
          "evidence_refs": [
            "EVIDENCE-009",
            "EVIDENCE-016"
          ]
        },
        {
          "id": "INV-008",
          "type": "invariant",
          "statement": "A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.",
          "protected_refs": [
            "R-010",
            "R-011",
            "AC-020",
            "AC-021"
          ],
          "task_refs": [
            "TASK-016"
          ],
          "evidence_refs": [
            "EVIDENCE-016"
          ]
        },
        {
          "id": "INV-009",
          "type": "invariant",
          "statement": "SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.",
          "protected_refs": [
            "R-007",
            "AC-017"
          ],
          "task_refs": [
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007"
          ],
          "evidence_refs": [
            "EVIDENCE-004",
            "EVIDENCE-005",
            "EVIDENCE-006",
            "EVIDENCE-007"
          ]
        },
        {
          "id": "INV-010",
          "type": "invariant",
          "statement": "Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.",
          "protected_refs": [
            "R-007",
            "R-009",
            "R-013",
            "AC-016",
            "AC-023"
          ],
          "task_refs": [
            "TASK-001",
            "TASK-004",
            "TASK-005",
            "TASK-006",
            "TASK-007",
            "TASK-017",
            "TASK-018",
            "TASK-019"
          ],
          "evidence_refs": [
            "EVIDENCE-001",
            "EVIDENCE-004",
            "EVIDENCE-005",
            "EVIDENCE-006",
            "EVIDENCE-007",
            "EVIDENCE-017",
            "EVIDENCE-018",
            "EVIDENCE-019"
          ]
        },
        {
          "id": "INV-011",
          "type": "invariant",
          "statement": "Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.",
          "protected_refs": [
            "R-002",
            "AC-009",
            "AC-010"
          ],
          "task_refs": [
            "TASK-010"
          ],
          "evidence_refs": [
            "EVIDENCE-010"
          ]
        },
        {
          "id": "INV-012",
          "type": "invariant",
          "statement": "V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.",
          "protected_refs": [
            "R-004",
            "AC-012"
          ],
          "task_refs": [
            "TASK-003",
            "TASK-011"
          ],
          "evidence_refs": [
            "EVIDENCE-003",
            "EVIDENCE-011"
          ]
        },
        {
          "id": "INV-013",
          "type": "invariant",
          "statement": "The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.",
          "protected_refs": [
            "R-006",
            "AC-014"
          ],
          "task_refs": [
            "TASK-007"
          ],
          "evidence_refs": [
            "EVIDENCE-007"
          ]
        },
        {
          "id": "INV-014",
          "type": "invariant",
          "statement": "Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.",
          "protected_refs": [
            "R-012",
            "AC-022"
          ],
          "task_refs": [
            "TASK-017"
          ],
          "evidence_refs": [
            "EVIDENCE-017"
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
              "id": "R-008",
              "type": "requirement"
            },
            {
              "id": "R-009",
              "type": "requirement"
            },
            {
              "id": "R-010",
              "type": "requirement"
            },
            {
              "id": "R-011",
              "type": "requirement"
            },
            {
              "id": "R-012",
              "type": "requirement"
            },
            {
              "id": "R-013",
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
              "id": "AC-009",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-010",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-011",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-012",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-013",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-014",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-015",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-016",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-017",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-018",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-019",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-020",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-021",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-022",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-023",
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
              "id": "A-003",
              "type": "assumption"
            },
            {
              "id": "A-004",
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
              "id": "D-007",
              "type": "decision"
            },
            {
              "id": "D-008",
              "type": "decision"
            },
            {
              "id": "D-009",
              "type": "decision"
            },
            {
              "id": "D-010",
              "type": "decision"
            },
            {
              "id": "D-011",
              "type": "decision"
            },
            {
              "id": "D-012",
              "type": "decision"
            },
            {
              "id": "D-013",
              "type": "decision"
            },
            {
              "id": "D-014",
              "type": "decision"
            },
            {
              "id": "D-015",
              "type": "decision"
            },
            {
              "id": "D-016",
              "type": "decision"
            },
            {
              "id": "D-017",
              "type": "decision"
            },
            {
              "id": "D-018",
              "type": "decision"
            }
          ],
          "tombstones": []
        },
        {
          "revision": 2,
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
              "id": "R-008",
              "type": "requirement"
            },
            {
              "id": "R-009",
              "type": "requirement"
            },
            {
              "id": "R-010",
              "type": "requirement"
            },
            {
              "id": "R-011",
              "type": "requirement"
            },
            {
              "id": "R-012",
              "type": "requirement"
            },
            {
              "id": "R-013",
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
              "id": "AC-009",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-010",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-011",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-012",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-013",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-014",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-015",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-016",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-017",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-018",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-019",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-020",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-021",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-022",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-023",
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
              "id": "A-003",
              "type": "assumption"
            },
            {
              "id": "A-004",
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
              "id": "D-007",
              "type": "decision"
            },
            {
              "id": "D-008",
              "type": "decision"
            },
            {
              "id": "D-009",
              "type": "decision"
            },
            {
              "id": "D-010",
              "type": "decision"
            },
            {
              "id": "D-011",
              "type": "decision"
            },
            {
              "id": "D-012",
              "type": "decision"
            },
            {
              "id": "D-013",
              "type": "decision"
            },
            {
              "id": "D-014",
              "type": "decision"
            },
            {
              "id": "D-015",
              "type": "decision"
            },
            {
              "id": "D-016",
              "type": "decision"
            },
            {
              "id": "D-017",
              "type": "decision"
            },
            {
              "id": "D-018",
              "type": "decision"
            },
            {
              "id": "D-019",
              "type": "decision"
            },
            {
              "id": "D-020",
              "type": "decision"
            },
            {
              "id": "D-021",
              "type": "decision"
            },
            {
              "id": "D-022",
              "type": "decision"
            },
            {
              "id": "D-023",
              "type": "decision"
            },
            {
              "id": "D-024",
              "type": "decision"
            },
            {
              "id": "D-025",
              "type": "decision"
            },
            {
              "id": "D-026",
              "type": "decision"
            },
            {
              "id": "D-027",
              "type": "decision"
            },
            {
              "id": "D-028",
              "type": "decision"
            },
            {
              "id": "D-029",
              "type": "decision"
            },
            {
              "id": "D-030",
              "type": "decision"
            },
            {
              "id": "INV-001",
              "type": "invariant"
            },
            {
              "id": "INV-002",
              "type": "invariant"
            },
            {
              "id": "INV-003",
              "type": "invariant"
            },
            {
              "id": "INV-004",
              "type": "invariant"
            },
            {
              "id": "INV-005",
              "type": "invariant"
            },
            {
              "id": "INV-006",
              "type": "invariant"
            },
            {
              "id": "INV-007",
              "type": "invariant"
            },
            {
              "id": "INV-008",
              "type": "invariant"
            },
            {
              "id": "INV-009",
              "type": "invariant"
            },
            {
              "id": "INV-010",
              "type": "invariant"
            }
          ],
          "tombstones": []
        },
        {
          "revision": 3,
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
              "id": "R-008",
              "type": "requirement"
            },
            {
              "id": "R-009",
              "type": "requirement"
            },
            {
              "id": "R-010",
              "type": "requirement"
            },
            {
              "id": "R-011",
              "type": "requirement"
            },
            {
              "id": "R-012",
              "type": "requirement"
            },
            {
              "id": "R-013",
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
              "id": "AC-009",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-010",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-011",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-012",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-013",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-014",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-015",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-016",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-017",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-018",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-019",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-020",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-021",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-022",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-023",
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
              "id": "A-003",
              "type": "assumption"
            },
            {
              "id": "A-004",
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
              "id": "D-007",
              "type": "decision"
            },
            {
              "id": "D-008",
              "type": "decision"
            },
            {
              "id": "D-009",
              "type": "decision"
            },
            {
              "id": "D-010",
              "type": "decision"
            },
            {
              "id": "D-011",
              "type": "decision"
            },
            {
              "id": "D-012",
              "type": "decision"
            },
            {
              "id": "D-013",
              "type": "decision"
            },
            {
              "id": "D-014",
              "type": "decision"
            },
            {
              "id": "D-015",
              "type": "decision"
            },
            {
              "id": "D-016",
              "type": "decision"
            },
            {
              "id": "D-017",
              "type": "decision"
            },
            {
              "id": "D-018",
              "type": "decision"
            },
            {
              "id": "D-019",
              "type": "decision"
            },
            {
              "id": "D-020",
              "type": "decision"
            },
            {
              "id": "D-021",
              "type": "decision"
            },
            {
              "id": "D-022",
              "type": "decision"
            },
            {
              "id": "D-023",
              "type": "decision"
            },
            {
              "id": "D-024",
              "type": "decision"
            },
            {
              "id": "D-025",
              "type": "decision"
            },
            {
              "id": "D-026",
              "type": "decision"
            },
            {
              "id": "D-027",
              "type": "decision"
            },
            {
              "id": "D-028",
              "type": "decision"
            },
            {
              "id": "D-029",
              "type": "decision"
            },
            {
              "id": "D-030",
              "type": "decision"
            },
            {
              "id": "INV-001",
              "type": "invariant"
            },
            {
              "id": "INV-002",
              "type": "invariant"
            },
            {
              "id": "INV-003",
              "type": "invariant"
            },
            {
              "id": "INV-004",
              "type": "invariant"
            },
            {
              "id": "INV-005",
              "type": "invariant"
            },
            {
              "id": "INV-006",
              "type": "invariant"
            },
            {
              "id": "INV-007",
              "type": "invariant"
            },
            {
              "id": "INV-008",
              "type": "invariant"
            },
            {
              "id": "INV-009",
              "type": "invariant"
            },
            {
              "id": "INV-010",
              "type": "invariant"
            },
            {
              "id": "INV-011",
              "type": "invariant"
            },
            {
              "id": "INV-012",
              "type": "invariant"
            },
            {
              "id": "INV-013",
              "type": "invariant"
            },
            {
              "id": "INV-014",
              "type": "invariant"
            }
          ],
          "tombstones": []
        },
        {
          "revision": 4,
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
              "id": "R-008",
              "type": "requirement"
            },
            {
              "id": "R-009",
              "type": "requirement"
            },
            {
              "id": "R-010",
              "type": "requirement"
            },
            {
              "id": "R-011",
              "type": "requirement"
            },
            {
              "id": "R-012",
              "type": "requirement"
            },
            {
              "id": "R-013",
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
              "id": "AC-009",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-010",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-011",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-012",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-013",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-014",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-015",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-016",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-017",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-018",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-019",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-020",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-021",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-022",
              "type": "acceptance-criterion"
            },
            {
              "id": "AC-023",
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
              "id": "A-003",
              "type": "assumption"
            },
            {
              "id": "A-004",
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
              "id": "D-007",
              "type": "decision"
            },
            {
              "id": "D-008",
              "type": "decision"
            },
            {
              "id": "D-009",
              "type": "decision"
            },
            {
              "id": "D-010",
              "type": "decision"
            },
            {
              "id": "D-011",
              "type": "decision"
            },
            {
              "id": "D-012",
              "type": "decision"
            },
            {
              "id": "D-013",
              "type": "decision"
            },
            {
              "id": "D-014",
              "type": "decision"
            },
            {
              "id": "D-015",
              "type": "decision"
            },
            {
              "id": "D-016",
              "type": "decision"
            },
            {
              "id": "D-017",
              "type": "decision"
            },
            {
              "id": "D-018",
              "type": "decision"
            },
            {
              "id": "D-019",
              "type": "decision"
            },
            {
              "id": "D-020",
              "type": "decision"
            },
            {
              "id": "D-021",
              "type": "decision"
            },
            {
              "id": "D-022",
              "type": "decision"
            },
            {
              "id": "D-023",
              "type": "decision"
            },
            {
              "id": "D-024",
              "type": "decision"
            },
            {
              "id": "D-025",
              "type": "decision"
            },
            {
              "id": "D-026",
              "type": "decision"
            },
            {
              "id": "D-027",
              "type": "decision"
            },
            {
              "id": "D-028",
              "type": "decision"
            },
            {
              "id": "D-029",
              "type": "decision"
            },
            {
              "id": "D-030",
              "type": "decision"
            },
            {
              "id": "INV-001",
              "type": "invariant"
            },
            {
              "id": "INV-002",
              "type": "invariant"
            },
            {
              "id": "INV-003",
              "type": "invariant"
            },
            {
              "id": "INV-004",
              "type": "invariant"
            },
            {
              "id": "INV-005",
              "type": "invariant"
            },
            {
              "id": "INV-006",
              "type": "invariant"
            },
            {
              "id": "INV-007",
              "type": "invariant"
            },
            {
              "id": "INV-008",
              "type": "invariant"
            },
            {
              "id": "INV-009",
              "type": "invariant"
            },
            {
              "id": "INV-010",
              "type": "invariant"
            },
            {
              "id": "INV-011",
              "type": "invariant"
            },
            {
              "id": "INV-012",
              "type": "invariant"
            },
            {
              "id": "INV-013",
              "type": "invariant"
            },
            {
              "id": "INV-014",
              "type": "invariant"
            }
          ],
          "tombstones": []
        }
      ],
      "approved_artifact": {
        "metadata": {
          "allowed_paths": [
            "**"
          ],
          "approval_source": "user-approved-decision-coverage",
          "approved_at": "2026-08-09T00:00:00.000Z",
          "approved_by": "user",
          "artifact_id": "decision-coverage-r4",
          "artifact_kind": "plan",
          "change_ref": "sidebar-v4-context-switcher-graphite-v1",
          "contract_id": "decision-coverage:v1",
          "owner_module_id": null,
          "owner_repository_id": "sdcorejs-angular",
          "owner_repository_role": "standalone",
          "parent_references": [],
          "parent_repository_id": null,
          "prohibited_paths": [],
          "repository_relative_path": ".sdcorejs/plans/angular/2026-10-19-00-27-sidebar-v4-context-switcher-graphite.md",
          "requirement_id": "decision-coverage",
          "schema_version": 1,
          "source_revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
          "stack_profile": "markdown-skill-pack",
          "supersedes": null,
          "track": "workflow",
          "approval_hash": "sha256:v1:649696b8b22faec38b178a8239618ca7f44d164d4006182c9df5672b8bfe0a77"
        },
        "body": "{\"history\":[{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"}],\"revision\":1,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"},{\"id\":\"INV-009\",\"type\":\"invariant\"},{\"id\":\"INV-010\",\"type\":\"invariant\"}],\"revision\":2,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"},{\"id\":\"INV-009\",\"type\":\"invariant\"},{\"id\":\"INV-010\",\"type\":\"invariant\"},{\"id\":\"INV-011\",\"type\":\"invariant\"},{\"id\":\"INV-012\",\"type\":\"invariant\"},{\"id\":\"INV-013\",\"type\":\"invariant\"},{\"id\":\"INV-014\",\"type\":\"invariant\"}],\"revision\":3,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"},{\"id\":\"INV-009\",\"type\":\"invariant\"},{\"id\":\"INV-010\",\"type\":\"invariant\"},{\"id\":\"INV-011\",\"type\":\"invariant\"},{\"id\":\"INV-012\",\"type\":\"invariant\"},{\"id\":\"INV-013\",\"type\":\"invariant\"},{\"id\":\"INV-014\",\"type\":\"invariant\"}],\"revision\":4,\"tombstones\":[]}],\"records\":[{\"id\":\"R-001\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A desktop sd-sidebar-v4 component, forked from sd-sidebar-v3, renders the README D1-D4 frames: header (logo, app name, context slot, collapse button), pill search with Ctrl+K/Cmd+K focus and Up/Down/Enter/Esc result navigation, flat accent-insensitive search results with match highlight, Pinned and Recent shortcut sections, menu sections from menu.section, root/group/child rows with pill active state and child marker, a dot on a closed group that contains the active route, the trailing slot, the account footer, the 72px collapsed rail with separators and mini badges, and the collapsed-group flyout. It keeps V3 routing, navigation side effects, the collapse storage entry and the V3 accessibility rules.\",\"status\":\"active\",\"task_refs\":[\"TASK-008\",\"TASK-009\"],\"type\":\"requirement\"},{\"id\":\"R-002\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A mobile sd-sidebar-mobile-v4 component, forked from sd-sidebar-mobile-v3, renders the README M1-M3 frames: a 56px app bar, a drawer of min(88vw, 360px) with the V4 tree in mobile mode (44px rows, 44px search, close button), closing on backdrop, menu selection or Esc with a focus trap and focus return, clearing the query on close, and an opt-in bottom bar built from mobile.bottomBar (at most 4 menu ids plus More).\",\"status\":\"active\",\"task_refs\":[\"TASK-010\"],\"type\":\"requirement\"},{\"id\":\"R-003\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SdLayoutMenu gains optional fields section, badge { value, tone }, status { label, tone, live } and comingSoon, replacing the commented notify field. Existing menus compile and behave unchanged. Only V4 desktop and mobile render the new fields; a comingSoon item is aria-disabled, never navigates and is excluded from V4 search. searchMenuLeaves keeps its current behavior.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-008\",\"TASK-015\"],\"type\":\"requirement\"},{\"id\":\"R-004\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SidebarConfigurationV4 (version: 4) extends SidebarConfigurationV3 with itemShape, density, collapsedGroup and mobile.bottomBar. It joins ISdSidebarConfiguration, normalizeSidebarConfiguration fills its defaults, and the sd-layout component renders V4 desktop or mobile by breakpoint. V4 ignores brandColor and brandLightColor.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"requirement\"},{\"id\":\"R-005\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Every V4 colour goes through --sd-* tokens: the --sd-sidebar-v4-* colour tokens of the README table live in the theme component-token map with light and dark values, and the size tokens (width 280px, rail width 72px, item and child height, item radius) are declared on the .sd-sidebar-v4 host. V4 has no colour input and no hard-coded hex or 304px; its offsets use var(--sd-sidebar-v4-width) and var(--sd-sidebar-v4-rail-width). V1 and V3 keep their 304px layout.\",\"status\":\"active\",\"task_refs\":[\"TASK-009\",\"TASK-016\"],\"type\":\"requirement\"},{\"id\":\"R-006\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A shared sd-layout-context-switcher component in components/shared/context-switcher renders the README CS1-CS3 states: header trigger, desktop popover with optional accent-insensitive search (auto above 7 items, forced by searchable), label and count, rows with image or initial avatar and an active check, the switching state that locks the list, and the mobile bottom sheet. One item shows the name only and cannot open; no configuration renders nothing. On a collapsed rail it shows the context avatar and opens to the right.\",\"status\":\"active\",\"task_refs\":[\"TASK-007\"],\"type\":\"requirement\"},{\"id\":\"R-007\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SdLayoutContextService (providedIn root) exposes getCurrentContext(): SdLayoutContext | null and setCurrentContext(id): void. Core persists a context snapshot through SdLayoutStorageService, reloads the page after a switch, emits no change event, ignores a re-selection of the active context, and reconciles the stored snapshot with the configured items so that a missing or stale id falls back to items[0] with at most one reload.\",\"status\":\"active\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"requirement\"},{\"id\":\"R-008\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"SidebarConfigurationBase gains context?: SdLayoutContextConfiguration shared by V1-V4. The switcher is mounted in the headers of sidebar V1, V2, V3 and V4 and in the drawer header of mobile V1-V4 at the agreed positions. Without context every sidebar renders exactly as before.\",\"status\":\"active\",\"task_refs\":[\"TASK-006\",\"TASK-009\",\"TASK-010\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"requirement\"},{\"id\":\"R-009\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"When another tab changes the stored context, an open tab shows a notice that the context changed elsewhere with a Reload action, and never reloads by itself.\",\"status\":\"active\",\"task_refs\":[\"TASK-006\"],\"type\":\"requirement\"},{\"id\":\"R-010\",\"owner_module_id\":\"assets/scss/themes\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A ninth named preset 'graphite' is added to the theme presets with the README palette values. It is light-only like the other named presets, inherits the semantic state colours and keeps primary-contrast white.\",\"status\":\"active\",\"task_refs\":[\"TASK-016\"],\"type\":\"requirement\"},{\"id\":\"R-011\",\"owner_module_id\":\"assets/scss/themes\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A named preset can override component tokens through an optional components sub-map that the theme mixin forwards to the component-token emitter; unknown keys fail compilation. 'graphite' overrides --sd-sidebar-v4-active-bg and --sd-sidebar-v4-active-shadow so the active V4 item is a raised surface.\",\"status\":\"active\",\"task_refs\":[\"TASK-016\"],\"type\":\"requirement\"},{\"id\":\"R-012\",\"owner_module_id\":\"assets/scss/themes\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"The audit of components that colour links or text buttons with --sd-primary is recorded, no new token is created, and the theme docs state that under graphite those elements share the text colour.\",\"status\":\"active\",\"task_refs\":[\"TASK-017\"],\"type\":\"requirement\"},{\"id\":\"R-013\",\"owner_module_id\":\"modules/layout\",\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Documentation, Showcase, i18n, tests and release notes follow the change: STYLE-GUIDE.md and THEME.md list nine presets, sd-layout.md documents V4, the new menu fields and the context API, the Showcase layout page gains V4 and context demos with matching counts, the five i18n catalogs get the new keys, theme scripts cover graphite, CHANGELOG.md gets an Unreleased entry, and v20/v21/v22 are produced by npm run sync.\",\"status\":\"active\",\"task_refs\":[\"TASK-001\",\"TASK-017\",\"TASK-018\",\"TASK-019\"],\"type\":\"requirement\"},{\"behavior\":\"Render sd-sidebar-v4 with a nested menu on an active child route\",\"blocking\":true,\"expected_result\":\"root rows carry icons and child rows do not; the active row has aria-current=\\\"page\\\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot\",\"id\":\"AC-001\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Render sd-sidebar-v4 with a nested menu on an active child route -> root rows carry icons and child rows do not; the active row has aria-current=\\\"page\\\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot\",\"task_refs\":[\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Click root, child and external-URL items in V4, then change the route\",\"blocking\":true,\"expected_result\":\"internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes\",\"id\":\"AC-002\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Click root, child and external-URL items in V4, then change the route -> internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Toggle collapse in V4, recreate the component, and list the storage keys written\",\"blocking\":true,\"expected_result\":\"the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3\",\"id\":\"AC-003\",\"requirement_refs\":[\"R-001\",\"R-005\"],\"statement\":\"Toggle collapse in V4, recreate the component, and list the storage keys written -> the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc\",\"blocking\":true,\"expected_result\":\"the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render\",\"id\":\"AC-004\",\"requirement_refs\":[\"R-001\",\"R-003\"],\"statement\":\"Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc -> the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render\",\"task_refs\":[\"TASK-002\",\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand'\",\"blocking\":true,\"expected_result\":\"'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items\",\"id\":\"AC-005\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand' -> 'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon\",\"blocking\":true,\"expected_result\":\"a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\\\"true\\\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status\",\"id\":\"AC-006\",\"requirement_refs\":[\"R-001\",\"R-003\"],\"statement\":\"Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon -> a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\\\"true\\\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status\",\"task_refs\":[\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render V4 with sectioned items, unsectioned items, pinned items and recent items\",\"blocking\":true,\"expected_result\":\"items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration\",\"id\":\"AC-007\",\"requirement_refs\":[\"R-001\",\"R-003\"],\"statement\":\"Render V4 with sectioned items, unsectioned items, pinned items and recent items -> items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration\",\"task_refs\":[\"TASK-002\",\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer\",\"blocking\":true,\"expected_result\":\"the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px\",\"id\":\"AC-008\",\"requirement_refs\":[\"R-001\",\"R-005\"],\"statement\":\"Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer -> the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection\",\"blocking\":true,\"expected_result\":\"the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger\",\"id\":\"AC-009\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection -> the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger\",\"task_refs\":[\"TASK-010\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar\",\"blocking\":true,\"expected_result\":\"the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders\",\"id\":\"AC-010\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar -> the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders\",\"task_refs\":[\"TASK-010\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context\",\"blocking\":true,\"expected_result\":\"all existing specs pass unchanged and V3 renders no badge, status or section markup\",\"id\":\"AC-011\",\"requirement_refs\":[\"R-003\",\"R-008\"],\"statement\":\"Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context -> all existing specs pass unchanged and V3 renders no badge, status or section markup\",\"task_refs\":[\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration\",\"blocking\":true,\"expected_result\":\"sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids\",\"id\":\"AC-012\",\"requirement_refs\":[\"R-004\"],\"statement\":\"Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration -> sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids\",\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compile the default theme in light and dark, and scan the V4 stylesheets\",\"blocking\":true,\"expected_result\":\"every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px\",\"id\":\"AC-013\",\"requirement_refs\":[\"R-005\"],\"statement\":\"Compile the default theme in light and dark, and scan the V4 stylesheets -> every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px\",\"task_refs\":[\"TASK-016\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images\",\"blocking\":true,\"expected_result\":\"search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders\",\"id\":\"AC-014\",\"requirement_refs\":[\"R-006\"],\"statement\":\"Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images -> search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders\",\"task_refs\":[\"TASK-007\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Select a different context, then reopen and select the active context\",\"blocking\":true,\"expected_result\":\"the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload\",\"id\":\"AC-015\",\"requirement_refs\":[\"R-006\",\"R-007\"],\"statement\":\"Select a different context, then reopen and select the active context -> the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload\",\"task_refs\":[\"TASK-007\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id\",\"blocking\":true,\"expected_result\":\"getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload\",\"id\":\"AC-016\",\"requirement_refs\":[\"R-007\"],\"statement\":\"Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id -> getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload\",\"task_refs\":[\"TASK-005\",\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail\",\"blocking\":true,\"expected_result\":\"a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads\",\"id\":\"AC-017\",\"requirement_refs\":[\"R-007\",\"R-008\"],\"statement\":\"Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail -> a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads\",\"task_refs\":[\"TASK-004\",\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4\",\"blocking\":true,\"expected_result\":\"each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet\",\"id\":\"AC-018\",\"requirement_refs\":[\"R-006\",\"R-008\"],\"statement\":\"Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4 -> each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet\",\"task_refs\":[\"TASK-007\",\"TASK-009\",\"TASK-010\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Dispatch a storage event for the context key with another id, then one for an unrelated key\",\"blocking\":true,\"expected_result\":\"the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing\",\"id\":\"AC-019\",\"requirement_refs\":[\"R-009\"],\"statement\":\"Dispatch a storage event for the context key with another id, then one for an unrelated key -> the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto\",\"blocking\":true,\"expected_result\":\"the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'\",\"id\":\"AC-020\",\"requirement_refs\":[\"R-010\"],\"statement\":\"Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto -> the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'\",\"task_refs\":[\"TASK-016\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compile graphite, another named preset, and a preset whose components map has an unknown key\",\"blocking\":true,\"expected_result\":\"graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error\",\"id\":\"AC-021\",\"requirement_refs\":[\"R-011\"],\"statement\":\"Compile graphite, another named preset, and a preset whose components map has an unknown key -> graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error\",\"task_refs\":[\"TASK-016\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Search the theme and layout documentation and CHANGELOG.md\",\"blocking\":true,\"expected_result\":\"STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry\",\"id\":\"AC-022\",\"requirement_refs\":[\"R-012\",\"R-013\"],\"statement\":\"Search the theme and layout documentation and CHANGELOG.md -> STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry\",\"task_refs\":[\"TASK-017\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts\",\"blocking\":true,\"expected_result\":\"the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass\",\"id\":\"AC-023\",\"requirement_refs\":[\"R-013\"],\"statement\":\"Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts -> the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass\",\"task_refs\":[\"TASK-001\",\"TASK-018\",\"TASK-019\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Apps needing an in-place switch would need a different API.\",\"evidence_refs\":[],\"id\":\"A-001\",\"impacted_refs\":[\"R-007\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"Agreed with the product owner per the design handoff README.\",\"source\":\"explicit\",\"statement\":\"Reloading the page after a context switch, with no change event, is acceptable to consuming apps.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"README states the behaviour was agreed with the product owner.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"Active icons could use the Symbols FILL axis directly instead of the Material Icons filled set.\",\"evidence_refs\":[],\"id\":\"A-002\",\"impacted_refs\":[\"R-001\",\"R-006\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"fonts.scss loads material-symbols-v29-latin-regular.woff2.\",\"source\":\"inferred\",\"statement\":\"The bundled Material Symbols font is the static v29 regular cut, so the FILL axis is unavailable and some chrome glyphs may be missing.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"Check the font file and render each chrome glyph in the Showcase during planning.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Pages next to V4 would keep a 304px offset.\",\"evidence_refs\":[],\"id\":\"A-003\",\"impacted_refs\":[\"R-005\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"The grep found only V1, V3 and its spec.\",\"source\":\"inferred\",\"statement\":\"No layout outside sidebar V1 and V3 hard-codes the 304px sidebar width or a sidebar-dependent fixed offset.\",\"status\":\"validated\",\"type\":\"assumption\",\"validation_method\":\"Repository grep for 304px, rail widths and calc(100vw - ...) in the library and Showcase.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"A consumer reading localStorage directly could mix contexts across tabs.\",\"evidence_refs\":[],\"id\":\"A-004\",\"impacted_refs\":[\"R-007\",\"R-009\"],\"owner\":\"sdcorejs-angular maintainers\",\"rationale\":\"README forbids consumers from reading the key directly.\",\"source\":\"inferred\",\"statement\":\"Consumers read the context through getCurrentContext(), which serves one snapshot per page load, so a tab stays internally consistent after another tab switches.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"Document the rule in sd-layout.md and cover the snapshot behaviour in service specs.\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-006\",\"R-010\"],\"id\":\"D-001\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which repositories this round covers\",\"rationale\":\"The user asked to build the feature on Core UI.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request\",\"source\":\"explicit-user\",\"statement\":\"Which repositories this round covers: Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\",\"TASK-019\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-002\",\"R-004\"],\"id\":\"D-002\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"V4 scope\",\"rationale\":\"The handoff is high fidelity and the brief points to the README.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI\",\"source\":\"explicit-user\",\"statement\":\"V4 scope: The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\",\"TASK-010\",\"TASK-011\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-007\"],\"id\":\"D-003\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"V4 section layout\",\"rationale\":\"Keeps V3 recent behaviour while adopting README sections.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings\",\"source\":\"explicit-user\",\"statement\":\"V4 section layout: Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-003\"],\"id\":\"D-004\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where V4 stores its collapsed state\",\"rationale\":\"Matches 'keep the V3 storage key' and keeps the preference when an app moves from V3 to V4.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Share the version 3 entry of versionStates; no new storage key\",\"source\":\"explicit-user\",\"statement\":\"Where V4 stores its collapsed state: Share the version 3 entry of versionStates; no new storage key\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-003\",\"AC-011\"],\"id\":\"D-005\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which sidebars render the new menu fields\",\"rationale\":\"Backward compatible with no V1-V3 behaviour change.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged\",\"source\":\"explicit-user\",\"statement\":\"Which sidebars render the new menu fields: Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-005\",\"AC-008\",\"AC-013\"],\"id\":\"D-006\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where V4 tokens are declared\",\"rationale\":\"Colours follow the theme tiers and dark mode; sizes vary with density, itemShape and pointer.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host\",\"source\":\"explicit-user\",\"statement\":\"Where V4 tokens are declared: Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\",\"TASK-016\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-011\",\"AC-021\"],\"id\":\"D-007\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How a preset overrides component tokens\",\"rationale\":\"Generic and validated instead of a graphite special case in the mixin.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error\",\"source\":\"explicit-user\",\"statement\":\"How a preset overrides component tokens: An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-016\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-008\",\"AC-016\",\"AC-017\"],\"id\":\"D-008\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the current context is resolved at bootstrap\",\"rationale\":\"The sidebar configuration may resolve after APP_INITIALIZER, so items are not known when consumers first read the context.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once\",\"source\":\"explicit-user\",\"statement\":\"How the current context is resolved at bootstrap: context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-016\"],\"id\":\"D-009\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where the context snapshot is stored\",\"rationale\":\"Same privacy model as pinned and recent menus.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout\",\"source\":\"explicit-user\",\"statement\":\"Where the context snapshot is stored: Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-008\",\"AC-018\"],\"id\":\"D-010\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where the switcher is mounted\",\"rationale\":\"V2 has no app-name header; collapsed rails have no room for text.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header\",\"source\":\"explicit-user\",\"statement\":\"Where the switcher is mounted: V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-009\",\"AC-019\"],\"id\":\"D-011\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Multi-tab synchronisation\",\"rationale\":\"Prevents silent work in a stale context without surprising the user.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Listen to the storage event and show a notice with a Reload action; never auto-reload\",\"source\":\"explicit-user\",\"statement\":\"Multi-tab synchronisation: Listen to the storage event and show a notice with a Reload action; never auto-reload\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-006\"],\"id\":\"D-012\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Icon strategy\",\"rationale\":\"The bundled Symbols font has no FILL axis.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph\",\"source\":\"explicit-user\",\"statement\":\"Icon strategy: Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\",\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"AC-023\",\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-012\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\",\"INV-009\",\"INV-010\",\"INV-011\",\"INV-012\",\"INV-013\",\"INV-014\"],\"id\":\"D-013\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Coverage approach\",\"rationale\":\"Repository rules require tests; logic is test-first and UI specs follow the V3 pattern.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts\",\"source\":\"explicit-user\",\"statement\":\"Coverage approach: TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-006\",\"TASK-016\"],\"type\":\"decision\",\"validation_boundary\":{\"kind\":\"none\",\"source_refs\":[\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-012\",\"R-013\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"AC-023\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\",\"INV-009\",\"INV-010\",\"INV-011\",\"INV-012\",\"INV-013\",\"INV-014\"]}},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-011\"],\"id\":\"D-014\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which menu tree V4 uses\",\"rationale\":\"V2, V3 and the mobile sidebars depend on the shared tree; a separate tree removes regression risk.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified\",\"source\":\"approved-spec\",\"statement\":\"Which menu tree V4 uses: A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-006\"],\"id\":\"D-015\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Trailing slot precedence and badge tones\",\"rationale\":\"README allows one trailing type and defines neutral badges as plain counts.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills\",\"source\":\"approved-spec\",\"statement\":\"Trailing slot precedence and badge tones: One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-012\",\"AC-022\"],\"id\":\"D-016\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the link/text-button audit is handled\",\"rationale\":\"The brief asks to report and not to create tokens.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Report it and document the graphite limitation; create no token and change no component in this round\",\"source\":\"approved-spec\",\"statement\":\"How the link/text-button audit is handled: Report it and document the graphite limitation; create no token and change no component in this round\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"R-007\",\"R-008\"],\"id\":\"D-017\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Public names of the context API\",\"rationale\":\"Repository convention names consumer-configured shapes '*Configuration' (SdLayoutNotificationConfiguration, SidebarConfigurationV3); 'branch' already names the tree rail.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace\",\"source\":\"approved-spec\",\"statement\":\"Public names of the context API: SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-016\"],\"id\":\"D-018\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"setCurrentContext with an id that is not in the configured items\",\"rationale\":\"Prevents storing an id that would immediately fall back on the next load.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Ignore it: no write and no reload\",\"source\":\"approved-spec\",\"statement\":\"setCurrentContext with an id that is not in the configured items: Ignore it: no write and no reload\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-009\",\"AC-017\",\"AC-019\"],\"id\":\"D-019\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the context snapshot is read back from storage\",\"rationale\":\"Handles share one in-memory entry per key and set() updates memory even when persistence fails; destroy/recreate is not fresh while another handle (for example a component-level SdLayoutStorageService) is alive.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it\",\"source\":\"approved-architecture\",\"statement\":\"How the context snapshot is read back from storage: An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-004\",\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-009\",\"AC-019\"],\"id\":\"D-020\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Which storage events raise the changed-elsewhere notice\",\"rationale\":\"SdStorage keys are digests, so event keys cannot be matched; comparing ids within one namespace filters unrelated events and login/logout partition switches.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing\",\"source\":\"approved-architecture\",\"statement\":\"Which storage events raise the changed-elsewhere notice: On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-008\",\"AC-017\",\"AC-018\"],\"id\":\"D-021\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Who triggers reconciliation with the configured items\",\"rationale\":\"Covers sidebars used outside sd-layout, keeps the service and its listener lazy for apps without context, and keeps the service usable from provideAppInitializer.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call\",\"source\":\"approved-architecture\",\"statement\":\"Who triggers reconciliation with the configured items: sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"R-009\",\"AC-016\",\"AC-023\"],\"id\":\"D-022\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How reload, window events and the session marker are reached\",\"rationale\":\"location.reload cannot be spied in Chrome and a real reload aborts Karma and the docs site; SD_VIEWPORT is the precedent for an injectable browser seam.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake\",\"source\":\"approved-architecture\",\"statement\":\"How reload, window events and the session marker are reached: Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-002\",\"AC-009\"],\"id\":\"D-023\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Where the V4 tree lives and who may import it\",\"rationale\":\"Mobile V4 renders the same tree in mobile mode; keeping it private leaves room to change it without a public contract.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index\",\"source\":\"approved-architecture\",\"statement\":\"Where the V4 tree lives and who may import it: components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\",\"TASK-010\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-016\"],\"id\":\"D-024\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Storage identity of the context snapshot\",\"rationale\":\"Follows the existing handle pattern so namespace and signout behaviour come for free.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes\",\"source\":\"approved-architecture\",\"statement\":\"Storage identity of the context snapshot: A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-017\"],\"id\":\"D-025\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Reconciliation algorithm\",\"rationale\":\"A user namespace that resolves after getCurrentContext() would otherwise reload on every load; the marker bounds that case to one reload per tab session while the warning surfaces the misconfiguration.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning\",\"source\":\"approved-architecture\",\"statement\":\"Reconciliation algorithm: syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"R-007\",\"AC-015\"],\"id\":\"D-026\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Outcome when a switch cannot be confirmed\",\"rationale\":\"Otherwise the busy row and the locked list would stay stuck.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads\",\"source\":\"approved-architecture\",\"statement\":\"Outcome when a switch cannot be confirmed: setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-006\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"R-008\",\"AC-018\"],\"id\":\"D-027\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Mobile placement and stacking of the context sheet\",\"rationale\":\"Mobile V2 is a bottom bar plus sheets; stacked aria-modal surfaces must not both react to Escape.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger\",\"source\":\"approved-architecture\",\"statement\":\"Mobile placement and stacking of the context sheet: Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-007\",\"TASK-010\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"AC-014\"],\"id\":\"D-028\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Colours of the shared switcher in V1-V4\",\"rationale\":\"The switcher is shared and has no colour input, like the V4 sidebar.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor\",\"source\":\"approved-architecture\",\"statement\":\"Colours of the shared switcher in V1-V4: Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-007\",\"TASK-012\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-011\",\"AC-021\"],\"id\":\"D-029\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Shape and validation of preset component overrides\",\"rationale\":\"A (light, dark) pair would emit only the first part of a comma-separated box-shadow; tests cannot inject a preset into the non-default $presets map.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation\",\"source\":\"approved-architecture\",\"statement\":\"Shape and validation of preset component overrides: Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-016\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"AC-023\"],\"id\":\"D-030\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"How the Showcase demo hosts the context switcher\",\"rationale\":\"The demo already provides SdLayoutService and SdLayoutStorageService at component level; a real reload would reload the docs site.\",\"revisit_condition\":null,\"scope\":\"module\",\"selected_value\":\"The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading\",\"source\":\"approved-architecture\",\"statement\":\"How the Showcase demo hosts the context switcher: The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-018\"],\"type\":\"decision\"},{\"evidence_refs\":[\"EVIDENCE-006\",\"EVIDENCE-007\",\"EVIDENCE-009\",\"EVIDENCE-010\",\"EVIDENCE-012\",\"EVIDENCE-013\",\"EVIDENCE-014\",\"EVIDENCE-015\"],\"id\":\"INV-001\",\"protected_refs\":[\"R-008\",\"AC-011\",\"AC-018\"],\"statement\":\"Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.\",\"task_refs\":[\"TASK-006\",\"TASK-007\",\"TASK-009\",\"TASK-010\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-002\",\"protected_refs\":[\"R-007\",\"AC-016\"],\"statement\":\"Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-003\",\"protected_refs\":[\"R-007\",\"AC-015\",\"AC-017\"],\"statement\":\"A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-004\",\"protected_refs\":[\"R-007\",\"R-009\",\"AC-016\",\"AC-019\"],\"statement\":\"Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-008\",\"EVIDENCE-009\"],\"id\":\"INV-005\",\"protected_refs\":[\"R-001\",\"AC-003\"],\"statement\":\"V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.\",\"task_refs\":[\"TASK-008\",\"TASK-009\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-002\",\"EVIDENCE-008\",\"EVIDENCE-009\",\"EVIDENCE-012\",\"EVIDENCE-013\",\"EVIDENCE-014\",\"EVIDENCE-015\",\"EVIDENCE-016\"],\"id\":\"INV-006\",\"protected_refs\":[\"R-001\",\"R-003\",\"AC-011\",\"AC-013\"],\"statement\":\"components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.\",\"task_refs\":[\"TASK-002\",\"TASK-008\",\"TASK-009\",\"TASK-012\",\"TASK-013\",\"TASK-014\",\"TASK-015\",\"TASK-016\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-009\",\"EVIDENCE-016\"],\"id\":\"INV-007\",\"protected_refs\":[\"R-005\",\"AC-013\",\"AC-021\"],\"statement\":\"V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.\",\"task_refs\":[\"TASK-009\",\"TASK-016\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-016\"],\"id\":\"INV-008\",\"protected_refs\":[\"R-010\",\"R-011\",\"AC-020\",\"AC-021\"],\"statement\":\"A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.\",\"task_refs\":[\"TASK-016\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\"],\"id\":\"INV-009\",\"protected_refs\":[\"R-007\",\"AC-017\"],\"statement\":\"SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.\",\"task_refs\":[\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-001\",\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-006\",\"EVIDENCE-007\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\"],\"id\":\"INV-010\",\"protected_refs\":[\"R-007\",\"R-009\",\"R-013\",\"AC-016\",\"AC-023\"],\"statement\":\"Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.\",\"task_refs\":[\"TASK-001\",\"TASK-004\",\"TASK-005\",\"TASK-006\",\"TASK-007\",\"TASK-017\",\"TASK-018\",\"TASK-019\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-010\"],\"id\":\"INV-011\",\"protected_refs\":[\"R-002\",\"AC-009\",\"AC-010\"],\"statement\":\"Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.\",\"task_refs\":[\"TASK-010\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-011\"],\"id\":\"INV-012\",\"protected_refs\":[\"R-004\",\"AC-012\"],\"statement\":\"V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.\",\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-007\"],\"id\":\"INV-013\",\"protected_refs\":[\"R-006\",\"AC-014\"],\"statement\":\"The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.\",\"task_refs\":[\"TASK-007\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-017\"],\"id\":\"INV-014\",\"protected_refs\":[\"R-012\",\"AC-022\"],\"statement\":\"Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.\",\"task_refs\":[\"TASK-017\"],\"type\":\"invariant\"}],\"revision\":4,\"schema_version\":1}\n"
      }
    },
    "goals": [
      {
        "id": "G-001",
        "statement": "Apps that choose version 4 get the V4 desktop and mobile sidebars of the design handoff with V3 routing, storage and accessibility preserved.",
        "task_refs": [
          "TASK-002",
          "TASK-003",
          "TASK-008",
          "TASK-009",
          "TASK-010",
          "TASK-011"
        ]
      },
      {
        "id": "G-002",
        "statement": "Configuring context.items gives the same Context Switcher on sidebars V1-V4, with Core owning persistence, reconciliation and reload.",
        "task_refs": [
          "TASK-003",
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007",
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015"
        ]
      },
      {
        "id": "G-003",
        "statement": "The graphite preset ships light-only and raises the active V4 item through validated preset component-token overrides.",
        "task_refs": [
          "TASK-016"
        ]
      },
      {
        "id": "G-004",
        "statement": "i18n, documentation, Showcase and the v20/v21/v22 mirrors match the shipped behaviour.",
        "task_refs": [
          "TASK-001",
          "TASK-017",
          "TASK-018",
          "TASK-019"
        ]
      }
    ],
    "tasks": [
      {
        "id": "TASK-001",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-001",
            "record_refs": [
              "R-013",
              "AC-023",
              "INV-010"
            ]
          }
        ],
        "justification_refs": [
          "R-013",
          "D-013",
          "D-026"
        ],
        "enforces_invariant_refs": [
          "INV-010"
        ]
      },
      {
        "id": "TASK-002",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-002",
            "record_refs": [
              "R-003",
              "AC-004",
              "AC-007",
              "INV-006"
            ]
          }
        ],
        "justification_refs": [
          "R-003",
          "D-005",
          "D-015"
        ],
        "enforces_invariant_refs": [
          "INV-006"
        ]
      },
      {
        "id": "TASK-003",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-003",
            "record_refs": [
              "R-004",
              "AC-012",
              "INV-012"
            ]
          }
        ],
        "justification_refs": [
          "R-004",
          "D-008",
          "D-017"
        ],
        "enforces_invariant_refs": [
          "INV-012"
        ]
      },
      {
        "id": "TASK-004",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v19/projects/sdcorejs-angular/services/storage/sd-storage.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-004",
            "record_refs": [
              "R-007",
              "AC-017",
              "INV-002",
              "INV-003",
              "INV-004",
              "INV-009",
              "INV-010"
            ]
          }
        ],
        "justification_refs": [
          "R-007",
          "D-019"
        ],
        "enforces_invariant_refs": [
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-009",
          "INV-010"
        ]
      },
      {
        "id": "TASK-005",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-004"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-005",
            "record_refs": [
              "R-007",
              "AC-016",
              "INV-002",
              "INV-003",
              "INV-004",
              "INV-009",
              "INV-010"
            ]
          }
        ],
        "justification_refs": [
          "R-007",
          "D-009",
          "D-019",
          "D-024"
        ],
        "enforces_invariant_refs": [
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-009",
          "INV-010"
        ]
      },
      {
        "id": "TASK-006",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-003",
          "TASK-005"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/index.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-006",
            "record_refs": [
              "R-007",
              "R-008",
              "R-009",
              "AC-016",
              "AC-017",
              "AC-019",
              "INV-001",
              "INV-002",
              "INV-003",
              "INV-004",
              "INV-009",
              "INV-010"
            ]
          }
        ],
        "justification_refs": [
          "R-007",
          "R-008",
          "R-009",
          "D-008",
          "D-011",
          "D-013",
          "D-018",
          "D-020",
          "D-021",
          "D-022",
          "D-025",
          "D-026"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-009",
          "INV-010"
        ]
      },
      {
        "id": "TASK-007",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-001",
          "TASK-006"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-007",
            "record_refs": [
              "R-006",
              "R-007",
              "AC-014",
              "AC-015",
              "AC-018",
              "INV-001",
              "INV-002",
              "INV-003",
              "INV-004",
              "INV-009",
              "INV-010",
              "INV-013"
            ]
          }
        ],
        "justification_refs": [
          "R-006",
          "R-007",
          "D-017",
          "D-021",
          "D-026",
          "D-027",
          "D-028"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-009",
          "INV-010",
          "INV-013"
        ]
      },
      {
        "id": "TASK-008",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-001",
          "TASK-002"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-008",
            "record_refs": [
              "R-001",
              "R-003",
              "AC-001",
              "AC-006",
              "AC-007",
              "INV-005",
              "INV-006"
            ]
          }
        ],
        "justification_refs": [
          "R-001",
          "R-003",
          "D-012",
          "D-014",
          "D-015",
          "D-023"
        ],
        "enforces_invariant_refs": [
          "INV-005",
          "INV-006"
        ]
      },
      {
        "id": "TASK-009",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-003",
          "TASK-007",
          "TASK-008"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-009",
            "record_refs": [
              "R-001",
              "R-005",
              "R-008",
              "AC-002",
              "AC-003",
              "AC-004",
              "AC-005",
              "AC-008",
              "AC-018",
              "INV-001",
              "INV-005",
              "INV-006",
              "INV-007"
            ]
          }
        ],
        "justification_refs": [
          "R-001",
          "R-005",
          "R-008",
          "D-002",
          "D-003",
          "D-004",
          "D-006",
          "D-012"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-005",
          "INV-006",
          "INV-007"
        ]
      },
      {
        "id": "TASK-010",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-009"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-010",
            "record_refs": [
              "R-002",
              "R-008",
              "AC-009",
              "AC-010",
              "AC-018",
              "INV-001",
              "INV-011"
            ]
          }
        ],
        "justification_refs": [
          "R-002",
          "R-008",
          "D-002",
          "D-023",
          "D-027"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-011"
        ]
      },
      {
        "id": "TASK-011",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-009",
          "TASK-010"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/index.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-011",
            "record_refs": [
              "R-004",
              "AC-012",
              "INV-012"
            ]
          }
        ],
        "justification_refs": [
          "R-004",
          "D-002"
        ],
        "enforces_invariant_refs": [
          "INV-012"
        ]
      },
      {
        "id": "TASK-012",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-007"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-012",
            "record_refs": [
              "R-008",
              "AC-011",
              "AC-018",
              "INV-001",
              "INV-006"
            ]
          }
        ],
        "justification_refs": [
          "R-008",
          "D-010",
          "D-028"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-006"
        ]
      },
      {
        "id": "TASK-013",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-007"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-013",
            "record_refs": [
              "R-008",
              "AC-011",
              "AC-018",
              "INV-001",
              "INV-006"
            ]
          }
        ],
        "justification_refs": [
          "R-008",
          "D-010",
          "D-027"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-006"
        ]
      },
      {
        "id": "TASK-014",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-007"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-014",
            "record_refs": [
              "R-008",
              "AC-011",
              "AC-018",
              "INV-001",
              "INV-006"
            ]
          }
        ],
        "justification_refs": [
          "R-008",
          "D-010",
          "D-027"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-006"
        ]
      },
      {
        "id": "TASK-015",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-007"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-015",
            "record_refs": [
              "R-003",
              "R-008",
              "AC-011",
              "AC-018",
              "INV-001",
              "INV-006"
            ]
          }
        ],
        "justification_refs": [
          "R-003",
          "R-008",
          "D-010",
          "D-027"
        ],
        "enforces_invariant_refs": [
          "INV-001",
          "INV-006"
        ]
      },
      {
        "id": "TASK-016",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "scripts/core-theme.test.mjs",
          "scripts/theme-contrast.test.mjs"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-016",
            "record_refs": [
              "R-005",
              "R-010",
              "R-011",
              "AC-013",
              "AC-020",
              "AC-021",
              "INV-006",
              "INV-007",
              "INV-008"
            ]
          }
        ],
        "justification_refs": [
          "R-005",
          "R-010",
          "R-011",
          "D-006",
          "D-007",
          "D-013",
          "D-029"
        ],
        "enforces_invariant_refs": [
          "INV-006",
          "INV-007",
          "INV-008"
        ]
      },
      {
        "id": "TASK-017",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-011",
          "TASK-016"
        ],
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
          "CHANGELOG.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-017",
            "record_refs": [
              "R-012",
              "R-013",
              "AC-022",
              "INV-010",
              "INV-014"
            ]
          }
        ],
        "justification_refs": [
          "R-012",
          "R-013",
          "D-001",
          "D-016"
        ],
        "enforces_invariant_refs": [
          "INV-010",
          "INV-014"
        ]
      },
      {
        "id": "TASK-018",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-011",
          "TASK-016"
        ],
        "planned_paths": [
          "showcase/src/app/pages/modules/layout/layout-demo.component.ts",
          "showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts",
          "showcase/src/styles.scss",
          "showcase/src/app/docs/core/documentation.registry.ts",
          "showcase/src/app/docs/core/documentation.registry.spec.ts",
          "showcase/src/app/docs/generated/example-sources.generated.ts",
          "showcase/src/app/docs/generated/example-manifest.generated.ts",
          "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-018",
            "record_refs": [
              "R-013",
              "AC-023",
              "INV-010"
            ]
          }
        ],
        "justification_refs": [
          "R-013",
          "D-030"
        ],
        "enforces_invariant_refs": [
          "INV-010"
        ]
      },
      {
        "id": "TASK-019",
        "owner_repository_id": "sdcorejs-angular",
        "dependencies": [
          "TASK-001",
          "TASK-002",
          "TASK-003",
          "TASK-004",
          "TASK-005",
          "TASK-006",
          "TASK-007",
          "TASK-008",
          "TASK-009",
          "TASK-010",
          "TASK-011",
          "TASK-012",
          "TASK-013",
          "TASK-014",
          "TASK-015",
          "TASK-016",
          "TASK-017"
        ],
        "planned_paths": [
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/sd-storage.md",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/index.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/index.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v20/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v20/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v20/projects/sdcorejs-angular/assets/THEME.md",
          "versions/v20/SYNC-STATUS.md",
          "versions/v21/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/sd-storage.md",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/index.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/index.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v21/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v21/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v21/projects/sdcorejs-angular/assets/THEME.md",
          "versions/v21/SYNC-STATUS.md",
          "versions/v22/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/sd-storage.md",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/index.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/index.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v22/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v22/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v22/projects/sdcorejs-angular/assets/THEME.md",
          "versions/v22/SYNC-STATUS.md"
        ],
        "planned_evidence": [
          {
            "id": "EVIDENCE-019",
            "record_refs": [
              "R-013",
              "AC-023",
              "INV-010"
            ]
          }
        ],
        "justification_refs": [
          "R-013",
          "D-001"
        ],
        "enforces_invariant_refs": [
          "INV-010"
        ]
      }
    ],
    "repository_inventory": {
      "repositories": [
        {
          "repository_id": "sdcorejs-angular",
          "existing_paths": [
            "CHANGELOG.md",
            "scripts/core-theme.test.mjs",
            "scripts/theme-contrast.test.mjs",
            "showcase/src/app/docs/core/documentation.registry.spec.ts",
            "showcase/src/app/docs/core/documentation.registry.ts",
            "showcase/src/app/docs/generated/example-manifest.generated.ts",
            "showcase/src/app/docs/generated/example-sources.generated.ts",
            "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
            "showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts",
            "showcase/src/app/pages/modules/layout/layout-demo.component.ts",
            "showcase/src/styles.scss",
            "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
            "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
            "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
            "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
            "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
            "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
            "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
            "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
            "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
            "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/index.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md",
            "versions/v19/projects/sdcorejs-angular/modules/layout/services/index.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
            "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
            "versions/v19/projects/sdcorejs-angular/services/storage/sd-storage.md",
            "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
            "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
            "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
            "versions/v20/SYNC-STATUS.md",
            "versions/v20/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
            "versions/v20/projects/sdcorejs-angular/assets/THEME.md",
            "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
            "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
            "versions/v20/projects/sdcorejs-angular/assets/scss/themes/default.scss",
            "versions/v20/projects/sdcorejs-angular/i18n/src/en.ts",
            "versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts",
            "versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts",
            "versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts",
            "versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/index.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md",
            "versions/v20/projects/sdcorejs-angular/modules/layout/services/index.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
            "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
            "versions/v20/projects/sdcorejs-angular/services/storage/sd-storage.md",
            "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
            "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
            "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
            "versions/v21/SYNC-STATUS.md",
            "versions/v21/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
            "versions/v21/projects/sdcorejs-angular/assets/THEME.md",
            "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
            "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
            "versions/v21/projects/sdcorejs-angular/assets/scss/themes/default.scss",
            "versions/v21/projects/sdcorejs-angular/i18n/src/en.ts",
            "versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts",
            "versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts",
            "versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts",
            "versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/index.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md",
            "versions/v21/projects/sdcorejs-angular/modules/layout/services/index.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
            "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
            "versions/v21/projects/sdcorejs-angular/services/storage/sd-storage.md",
            "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
            "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
            "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
            "versions/v22/SYNC-STATUS.md",
            "versions/v22/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
            "versions/v22/projects/sdcorejs-angular/assets/THEME.md",
            "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
            "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
            "versions/v22/projects/sdcorejs-angular/assets/scss/themes/default.scss",
            "versions/v22/projects/sdcorejs-angular/i18n/src/en.ts",
            "versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts",
            "versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts",
            "versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts",
            "versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/index.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/sd-layout.md",
            "versions/v22/projects/sdcorejs-angular/modules/layout/services/index.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
            "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
            "versions/v22/projects/sdcorejs-angular/services/storage/sd-storage.md",
            "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
            "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
            "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.ts"
          ],
          "intended_new_paths": [
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
              "owner_task_id": "TASK-006"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
              "owner_task_id": "TASK-007"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
              "owner_task_id": "TASK-007"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
              "owner_task_id": "TASK-007"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
              "owner_task_id": "TASK-007"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
              "owner_task_id": "TASK-008"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
              "owner_task_id": "TASK-008"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
              "owner_task_id": "TASK-008"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
              "owner_task_id": "TASK-008"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
              "owner_task_id": "TASK-009"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
              "owner_task_id": "TASK-009"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
              "owner_task_id": "TASK-009"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
              "owner_task_id": "TASK-009"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
              "owner_task_id": "TASK-010"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
              "owner_task_id": "TASK-010"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
              "owner_task_id": "TASK-010"
            },
            {
              "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
              "owner_task_id": "TASK-010"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
              "owner_task_id": "TASK-019"
            },
            {
              "path": "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
              "owner_task_id": "TASK-019"
            }
          ]
        }
      ]
    },
    "critique_history": [
      {
        "round": 1,
        "checker_version": "sdcorejs-plan:goal-backward:v1",
        "blockers": [
          "AC_ROW_TASK_MISSING R-003/AC-011",
          "AC_ROW_TASK_MISSING R-006/AC-018",
          "AC_ROW_TASK_MISSING R-008/AC-017",
          "MIXED_COMMAND_ROW R-005/AC-013",
          "PROTECTED_EVIDENCE_MISSING validation_map",
          "ROW_INVARIANT_MISSING R-002/AC-009",
          "ROW_INVARIANT_MISSING R-002/AC-010",
          "ROW_INVARIANT_MISSING R-004/AC-012",
          "ROW_INVARIANT_MISSING R-006/AC-014",
          "ROW_INVARIANT_MISSING R-012/AC-022",
          "TASK_REQUIREMENT_UNBOUND TASK-003 R-008"
        ],
        "resolved_blockers": [
          "AC_ROW_TASK_MISSING R-003/AC-011",
          "AC_ROW_TASK_MISSING R-006/AC-018",
          "AC_ROW_TASK_MISSING R-008/AC-017",
          "MIXED_COMMAND_ROW R-005/AC-013",
          "PROTECTED_EVIDENCE_MISSING validation_map",
          "ROW_INVARIANT_MISSING R-002/AC-009",
          "ROW_INVARIANT_MISSING R-002/AC-010",
          "ROW_INVARIANT_MISSING R-004/AC-012",
          "ROW_INVARIANT_MISSING R-006/AC-014",
          "ROW_INVARIANT_MISSING R-012/AC-022",
          "TASK_REQUIREMENT_UNBOUND TASK-003 R-008"
        ],
        "unresolved_blockers": []
      }
    ]
  },
  "validation_map": [
    {
      "requirement_id": "R-001",
      "acceptance_criterion_id": "AC-001",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-hierarchy-active-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-002",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-navigation-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-003",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-collapse-storage-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-003",
      "invariant_refs": [
        "INV-005",
        "INV-007"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-collapse-storage-r-005"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-004",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-search-keyboard-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-004",
      "invariant_refs": [
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-v4-search-keyboard-r-003"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-005",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-rail-flyout-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-006",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-trailing-slot-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-006",
      "invariant_refs": [
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-trailing-slot-r-003"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-007",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-sections-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-007",
      "invariant_refs": [
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-sections-r-003"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-shape-density-r-001"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-008",
      "invariant_refs": [
        "INV-007"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-shape-density-r-005"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-009",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-009",
      "invariant_refs": [
        "INV-011"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-mobile-v4-drawer-r-002"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-010"
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
      "acceptance_criterion_id": "AC-010",
      "invariant_refs": [
        "INV-011"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-mobile-v4-bottom-bar-r-002"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-010"
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
      "acceptance_criterion_id": "AC-011",
      "invariant_refs": [
        "INV-001",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v1-v3-unchanged-r-003"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "all existing specs pass unchanged and V3 renders no badge, status or section markup",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-010",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-008",
      "acceptance_criterion_id": "AC-011",
      "invariant_refs": [
        "INV-001",
        "INV-006"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v1-v3-unchanged-r-008"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "all existing specs pass unchanged and V3 renders no badge, status or section markup",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-010",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
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
      "acceptance_criterion_id": "AC-012",
      "invariant_refs": [
        "INV-012"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-v4-config-layout-r-004"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-003",
        "EVIDENCE-011"
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
      "acceptance_criterion_id": "AC-013",
      "invariant_refs": [
        "INV-006",
        "INV-007"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-v4-tokens-width-r-005"
      ],
      "planned_command": "npm run test:theme && npm run check:scss-hex",
      "command_source": "package.json",
      "cwd": ".",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-002",
        "EVIDENCE-008",
        "EVIDENCE-009",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015",
        "EVIDENCE-016"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-006",
      "acceptance_criterion_id": "AC-014",
      "invariant_refs": [
        "INV-013"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-switcher-rendering-r-006"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-007"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-006",
      "acceptance_criterion_id": "AC-015",
      "invariant_refs": [
        "INV-003",
        "INV-013"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-switcher-switching-r-006"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007"
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
      "acceptance_criterion_id": "AC-015",
      "invariant_refs": [
        "INV-002",
        "INV-003",
        "INV-004",
        "INV-009",
        "INV-010"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-switcher-switching-r-007"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-001",
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-017",
        "EVIDENCE-018",
        "EVIDENCE-019"
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
      "acceptance_criterion_id": "AC-016",
      "invariant_refs": [
        "INV-002",
        "INV-003",
        "INV-004",
        "INV-009",
        "INV-010"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-context-get-set-r-007"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts --include=projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-001",
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-017",
        "EVIDENCE-018",
        "EVIDENCE-019"
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
      "acceptance_criterion_id": "AC-017",
      "invariant_refs": [
        "INV-002",
        "INV-003",
        "INV-004",
        "INV-009",
        "INV-010"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-context-reconcile-r-007"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts --include=projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-001",
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-017",
        "EVIDENCE-018",
        "EVIDENCE-019"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-008",
      "acceptance_criterion_id": "AC-017",
      "invariant_refs": [
        "INV-001",
        "INV-003",
        "INV-009"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-context-reconcile-r-008"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-009",
        "EVIDENCE-010",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-006",
      "acceptance_criterion_id": "AC-018",
      "invariant_refs": [
        "INV-001",
        "INV-013"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-switcher-mounts-r-006"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-009",
        "EVIDENCE-010",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-008",
      "acceptance_criterion_id": "AC-018",
      "invariant_refs": [
        "INV-001"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "component"
      ],
      "case_ids": [
        "case-switcher-mounts-r-008"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts --include=projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-009",
        "EVIDENCE-010",
        "EVIDENCE-012",
        "EVIDENCE-013",
        "EVIDENCE-014",
        "EVIDENCE-015"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-009",
      "acceptance_criterion_id": "AC-019",
      "invariant_refs": [
        "INV-004",
        "INV-010"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-context-other-tab-r-009"
      ],
      "planned_command": "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
      "command_source": "project-doc",
      "cwd": "versions/v19",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-001",
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-017",
        "EVIDENCE-018",
        "EVIDENCE-019"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-010",
      "acceptance_criterion_id": "AC-020",
      "invariant_refs": [
        "INV-008"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-graphite-palette-r-010"
      ],
      "planned_command": "npm run test:theme && npm run check:scss-hex",
      "command_source": "package.json",
      "cwd": ".",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-016"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-011",
      "acceptance_criterion_id": "AC-021",
      "invariant_refs": [
        "INV-007",
        "INV-008"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-preset-component-override-r-011"
      ],
      "planned_command": "npm run test:theme && npm run check:scss-hex",
      "command_source": "package.json",
      "cwd": ".",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-009",
        "EVIDENCE-016"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-012",
      "acceptance_criterion_id": "AC-022",
      "invariant_refs": [
        "INV-014"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-docs-statements-r-012"
      ],
      "planned_command": "node -e \"const f=require('fs');const r=p=>f.readFileSync(p,'utf8');const L='versions/v19/projects/sdcorejs-angular/';const need=[[L+'assets/THEME.md','graphite'],[L+'assets/THEME.md','nine named presets'],[L+'assets/STYLE-GUIDE.md','graphite'],[L+'assets/STYLE-GUIDE.md','#16181d'],[L+'assets/THEME.md','--sd-link'],[L+'modules/layout/sd-layout.md','SidebarConfigurationV4'],[L+'modules/layout/sd-layout.md','comingSoon'],[L+'modules/layout/sd-layout.md','getCurrentContext'],[L+'modules/layout/sd-layout.md','provideAppInitializer'],[L+'modules/layout/sd-layout.md','SD_LAYOUT_CONTEXT_RUNTIME'],['CHANGELOG.md','Sidebar V4']];for(const [p,s] of need){if(!r(p).includes(s))throw new Error(p+' missing '+s)}const u=r('CHANGELOG.md');if(u.indexOf('Sidebar V4')>u.indexOf('## [3.1]'))throw new Error('entry not under Unreleased');console.log('docs ok')\"",
      "command_source": "project-doc",
      "cwd": ".",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-017"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-013",
      "acceptance_criterion_id": "AC-022",
      "invariant_refs": [
        "INV-010",
        "INV-014"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "unit"
      ],
      "case_ids": [
        "case-docs-statements-r-013"
      ],
      "planned_command": "node -e \"const f=require('fs');const r=p=>f.readFileSync(p,'utf8');const L='versions/v19/projects/sdcorejs-angular/';const need=[[L+'assets/THEME.md','graphite'],[L+'assets/THEME.md','nine named presets'],[L+'assets/STYLE-GUIDE.md','graphite'],[L+'assets/STYLE-GUIDE.md','#16181d'],[L+'assets/THEME.md','--sd-link'],[L+'modules/layout/sd-layout.md','SidebarConfigurationV4'],[L+'modules/layout/sd-layout.md','comingSoon'],[L+'modules/layout/sd-layout.md','getCurrentContext'],[L+'modules/layout/sd-layout.md','provideAppInitializer'],[L+'modules/layout/sd-layout.md','SD_LAYOUT_CONTEXT_RUNTIME'],['CHANGELOG.md','Sidebar V4']];for(const [p,s] of need){if(!r(p).includes(s))throw new Error(p+' missing '+s)}const u=r('CHANGELOG.md');if(u.indexOf('Sidebar V4')>u.indexOf('## [3.1]'))throw new Error('entry not under Unreleased');console.log('docs ok')\"",
      "command_source": "project-doc",
      "cwd": ".",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-001",
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-017",
        "EVIDENCE-018",
        "EVIDENCE-019"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    },
    {
      "requirement_id": "R-013",
      "acceptance_criterion_id": "AC-023",
      "invariant_refs": [
        "INV-010"
      ],
      "risk": "regression",
      "boundary": {
        "kind": "none",
        "approval_ref": "D-013",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      },
      "authorization_boundary": false,
      "levels": [
        "integration"
      ],
      "case_ids": [
        "case-showcase-i18n-rollout-r-013"
      ],
      "planned_command": "npm --prefix versions/v19 run check:i18n-parity && npm --prefix versions/v19 run check:i18n && npm run test:showcase-examples && npm --prefix showcase test -- --include=src/app/pages/modules/layout/layout-demo.component.spec.ts --include=src/app/docs/core/documentation.registry.spec.ts && npm run check:sync && npm run test:scripts",
      "command_source": "project-doc",
      "cwd": ".",
      "evidence_class": "UNIT",
      "automation": "automated",
      "expected_proof": "the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
      "status": "covered",
      "evidence_refs": [
        "EVIDENCE-001",
        "EVIDENCE-004",
        "EVIDENCE-005",
        "EVIDENCE-006",
        "EVIDENCE-007",
        "EVIDENCE-017",
        "EVIDENCE-018",
        "EVIDENCE-019"
      ],
      "rationale": null,
      "owner": null,
      "acknowledgement_required": false,
      "module_e2e": false,
      "module_id": null,
      "owner_repository_id": null
    }
  ],
  "contract_id": "sidebar-v4-context-switcher-graphite-v1",
  "requirement_id": "sidebar-v4-context-switcher-graphite-v1",
  "approved_spec_path": ".sdcorejs/specs/angular/2026-10-18-11-28-sidebar-v4-context-switcher-graphite.md",
  "approved_spec_hash": "sha256:v1:fb1ff4a6da2a5e03d4675ef5fb9451f356298bb96efaa1cc387b280ad035a131",
  "approved_spec_reference": {
    "immutable_identity": {
      "repository_id": "sdcorejs-angular",
      "artifact_id": "spec-sidebar-v4-context-switcher-graphite-v1-r1",
      "artifact_kind": "spec",
      "revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
      "approval_hash": "sha256:v1:fb1ff4a6da2a5e03d4675ef5fb9451f356298bb96efaa1cc387b280ad035a131",
      "repository_relative_path": ".sdcorejs/specs/angular/2026-10-18-11-28-sidebar-v4-context-switcher-graphite.md"
    }
  },
  "approved_architecture_path": ".sdcorejs/architecture/angular/2026-10-18-11-40-sidebar-v4-context-switcher-graphite-r2.md",
  "approved_architecture_hash": "sha256:v1:508833610265333520d5d819797db8adf7f98bc87376c4edf1771817741da4fa",
  "approved_plan_path": "",
  "approved_plan_hash": "",
  "supersedes": null,
  "target_root": ".",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "modules/layout",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "dependency_order": [
    "sdcorejs-angular"
  ],
  "gitlink_updates_in_scope": false,
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "task_count": 19,
  "phase_count": 6,
  "allowed_paths": [
    "CHANGELOG.md",
    "scripts/core-theme.test.mjs",
    "scripts/theme-contrast.test.mjs",
    "showcase/src/app/docs/core/documentation.registry.spec.ts",
    "showcase/src/app/docs/core/documentation.registry.ts",
    "showcase/src/app/docs/generated/example-manifest.generated.ts",
    "showcase/src/app/docs/generated/example-sources.generated.ts",
    "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
    "showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts",
    "showcase/src/app/pages/modules/layout/layout-demo.component.ts",
    "showcase/src/styles.scss",
    "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
    "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
    "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
    "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
    "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
    "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
    "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
    "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
    "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
    "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/index.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/index.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
    "versions/v19/projects/sdcorejs-angular/services/storage/sd-storage.md",
    "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
    "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
    "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
    "versions/v20/SYNC-STATUS.md",
    "versions/v20/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
    "versions/v20/projects/sdcorejs-angular/assets/THEME.md",
    "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
    "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
    "versions/v20/projects/sdcorejs-angular/assets/scss/themes/default.scss",
    "versions/v20/projects/sdcorejs-angular/i18n/src/en.ts",
    "versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts",
    "versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts",
    "versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts",
    "versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/index.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/index.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
    "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
    "versions/v20/projects/sdcorejs-angular/services/storage/sd-storage.md",
    "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
    "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
    "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
    "versions/v21/SYNC-STATUS.md",
    "versions/v21/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
    "versions/v21/projects/sdcorejs-angular/assets/THEME.md",
    "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
    "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
    "versions/v21/projects/sdcorejs-angular/assets/scss/themes/default.scss",
    "versions/v21/projects/sdcorejs-angular/i18n/src/en.ts",
    "versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts",
    "versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts",
    "versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts",
    "versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/index.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/index.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
    "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
    "versions/v21/projects/sdcorejs-angular/services/storage/sd-storage.md",
    "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
    "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
    "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
    "versions/v22/SYNC-STATUS.md",
    "versions/v22/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
    "versions/v22/projects/sdcorejs-angular/assets/THEME.md",
    "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
    "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
    "versions/v22/projects/sdcorejs-angular/assets/scss/themes/default.scss",
    "versions/v22/projects/sdcorejs-angular/i18n/src/en.ts",
    "versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts",
    "versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts",
    "versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts",
    "versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/index.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/sd-layout.md",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/index.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
    "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
    "versions/v22/projects/sdcorejs-angular/services/storage/sd-storage.md",
    "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
    "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
    "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.ts"
  ],
  "prohibited_paths": [
    "**/package.json",
    "**/package-lock.json",
    "**/.env*",
    "published-docs/**",
    "published-pages/**",
    "versions/*/dist/**",
    "**/node_modules/**",
    "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
    "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
  ],
  "generated_artifacts": [
    "versions/v20/**",
    "versions/v21/**",
    "versions/v22/**",
    "versions/*/SYNC-STATUS.md",
    "showcase/src/app/docs/generated/example-manifest.generated.ts",
    "showcase/src/app/docs/generated/example-sources.generated.ts"
  ],
  "docs_artifacts": [
    "versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md",
    "versions/v19/projects/sdcorejs-angular/services/storage/sd-storage.md",
    "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
    "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
    "CHANGELOG.md"
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
    "required": true,
    "conformance_invariant_refs": [
      "INV-001",
      "INV-006",
      "INV-007",
      "INV-010"
    ],
    "not_applicable_reason": null,
    "project_conventions": {
      "component_style": "standalone, ChangeDetectionStrategy.OnPush, signal input()/output()/model()/computed(), @if/@for control flow, SdTranslatePipe for copy",
      "folder_convention": "modules/layout/components/<sidebar-version>/main.component.{ts,html,scss,spec.ts}; shared pieces in components/shared/<name>/<name>.component.*; services in modules/layout/services/<area>/",
      "state_convention": "component-local signals for UI state; root services (providedIn root) for cross-sidebar state (SdLayoutNavigationStateService pattern)",
      "service_data_access_convention": "SdLayoutStorageService is the only owner of layout storage handles over SdStorageService; components never touch storage",
      "registration_provider_convention": "no NgModule registration; standalone imports; root services; public injection tokens with default factories (SD_VIEWPORT precedent)",
      "public_api_barrel_convention": "components/index.ts and services/index.ts re-export public symbols; modules/layout/index.ts re-exports the barrels; private V4 tree not exported",
      "test_convention": "Karma + Jasmine specs next to sources; TestBed with stubs for router and storage; V3 spec style (data-* hooks, getBoundingClientRect for sizes)",
      "evidence_inspected": [
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
        "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.ts",
        "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
        "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
        "versions/v19/projects/sdcorejs-angular/modules/layout/services/navigation-state/navigation-state.service.ts",
        "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts",
        "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
        "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
        "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
        "showcase/src/app/pages/modules/layout/layout-demo.component.ts"
      ]
    },
    "component_tree": [
      "SdLayout (sd-layout) -> version 4: SdSidebarV4 (desktop) | SdSidebarMobileV4 (mobile)",
      "SdSidebarV4 -> header (logo, title, SdLayoutContextSwitcher appearance=header|rail, collapse) -> SdLayoutSearchFieldComponent -> SdSidebarV4MenuTree (shortcuts: pinned, recent; hierarchy with sections) -> SdLayoutUserMenuComponent footer -> projected content",
      "SdSidebarV4MenuTree -> rows (root, group, child, coming soon) -> trailing slot -> collapsed-rail flyout panel (CDK overlay)",
      "SdSidebarMobileV4 -> app bar -> drawer (cdkTrapFocus) -> header (title, SdLayoutContextSwitcher appearance=sheet, close) -> search -> SdSidebarV4MenuTree mode mobile -> bottom bar (optional)",
      "SdLayoutContextSwitcher -> trigger -> popover (CDK overlay: search, rows, switching, error) | bottom sheet (CDK overlay, own focus trap) -> changed-elsewhere notice",
      "Sidebars V1/V2/V3 and mobile V1/V2/V3 -> SdLayoutContextSwitcher only when sidebar().context"
    ],
    "reuse_decisions": [
      {
        "need": "search input",
        "candidate": "SdLayoutSearchFieldComponent (components/shared/search-field)",
        "decision": "reuse",
        "reason": "Same input and composition handling as V3; V4 styles the pill through its host."
      },
      {
        "need": "account footer",
        "candidate": "SdLayoutUserMenuComponent (components/shared/user-menu)",
        "decision": "reuse",
        "reason": "Unchanged account actions and notification badge."
      },
      {
        "need": "menu tree",
        "candidate": "SdLayoutMenuTreeComponent (components/shared/menu-tree)",
        "decision": "feature-local creation",
        "reason": "D-014/INV-006: shared tree serves V2, V3 and mobile; V4 needs different rows, trailing slot and flyout."
      },
      {
        "need": "navigation and pinned/recent state",
        "candidate": "SdLayoutNavigationStateService",
        "decision": "reuse",
        "reason": "Same storage keys and version state entry 3 (D-004)."
      },
      {
        "need": "accent-insensitive search",
        "candidate": "StringUtilities.aliasIncludes (@sdcorejs/utils/fns)",
        "decision": "reuse",
        "reason": "Already used by searchMenuLeaves."
      },
      {
        "need": "overlays and focus trap",
        "candidate": "@angular/cdk overlay and a11y",
        "decision": "reuse",
        "reason": "Already a library dependency; no new package."
      },
      {
        "need": "icons",
        "candidate": "SdIcon (modules/icon)",
        "decision": "reuse",
        "reason": "Material Icons outlined/filled and Material Symbols per D-012."
      }
    ],
    "file_decisions": [
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-006: R-007, R-008, R-009"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-006: R-007, R-008, R-009"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-006: R-007, R-008, R-009"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-006: R-007, R-008, R-009"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-006: R-007, R-008, R-009"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-007: R-006, R-007"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-007: R-006, R-007"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-007: R-006, R-007"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-007: R-006, R-007"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-008: R-001, R-003"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-008: R-001, R-003"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-008: R-001, R-003"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-008: R-001, R-003"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-009: R-001, R-005, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-009: R-001, R-005, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-009: R-001, R-005, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-009: R-001, R-005, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-010: R-002, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-010: R-002, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-010: R-002, R-008"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
        "decision": "create",
        "symbols": [],
        "reason": "TASK-010: R-002, R-008"
      }
    ],
    "state_owners": [
      {
        "symbol": "SdSidebarV4",
        "owns": "collapsed, collapsed group keys, search text, focused result index, flyout group, active path"
      },
      {
        "symbol": "SdSidebarMobileV4",
        "owns": "drawer open state, mobile search text, active bottom-bar destination"
      },
      {
        "symbol": "SdLayoutContextService",
        "owns": "load-time context id, refreshed metadata, switching, error, changedElsewhere"
      },
      {
        "symbol": "SdLayoutContextSwitcher",
        "owns": "popover/sheet open state and query"
      }
    ],
    "service_boundaries": [
      {
        "symbol": "SdLayoutContextService",
        "scope": "app"
      },
      {
        "symbol": "SD_LAYOUT_CONTEXT_RUNTIME",
        "scope": "app"
      },
      {
        "symbol": "SdLayoutStorageService",
        "scope": "app"
      },
      {
        "symbol": "SdLayoutNavigationStateService",
        "scope": "app"
      },
      {
        "symbol": "normalizeSidebarConfiguration",
        "scope": "pure_function"
      },
      {
        "symbol": "V4 menu helpers in menu.utils.ts",
        "scope": "pure_function"
      }
    ],
    "data_flow": [
      "SD_LAYOUT_CONFIGURATION.sidebar -> SdLayoutService.sidebar signal -> SdLayout computed sidebarV4 -> SdSidebarV4/SdSidebarMobileV4 inputs (normalized V4 configuration)",
      "menus input -> V4 helpers (sections, comingSoon filter, search) -> SdSidebarV4MenuTree view model -> navigateMenu (router.navigate or sdOpenExternal) -> SdLayoutNavigationStateService.recordRecent",
      "sidebar().context.items -> SdLayoutContextSwitcher effect -> SdLayoutContextService.syncItems -> SdLayoutStorageService.refreshCurrentContext/currentContext -> reload through SD_LAYOUT_CONTEXT_RUNTIME when D-025 requires",
      "provideAppInitializer -> SdLayoutContextService.getCurrentContext() -> consumer loads permissions/menus"
    ],
    "declarations_and_registration": [
      {
        "symbol": "SdSidebarV4, SdSidebarMobileV4",
        "mechanism": "standalone imports in SdLayout (layout-main)"
      },
      {
        "symbol": "SdSidebarV4MenuTree",
        "mechanism": "standalone import in SdSidebarV4 and SdSidebarMobileV4 only"
      },
      {
        "symbol": "SdLayoutContextSwitcher",
        "mechanism": "standalone import in the eight sidebar components"
      },
      {
        "symbol": "SdLayoutContextService, SD_LAYOUT_CONTEXT_RUNTIME",
        "mechanism": "providedIn root / token factory; Showcase and specs override at component or TestBed level"
      }
    ],
    "public_exports": [
      {
        "symbol": "SdSidebarV4, SdSidebarMobileV4, SdLayoutContextSwitcher",
        "entry_point": "@sdcorejs/angular/modules/layout (components/index.ts)"
      },
      {
        "symbol": "SdLayoutContextService, SD_LAYOUT_CONTEXT_RUNTIME, SdLayoutContextRuntime",
        "entry_point": "@sdcorejs/angular/modules/layout (services/index.ts)"
      },
      {
        "symbol": "SdLayoutContext, SdLayoutContextConfiguration, SidebarConfigurationV4",
        "entry_point": "@sdcorejs/angular/modules/layout (configurations)"
      },
      {
        "symbol": "SdStorage.refresh()",
        "entry_point": "@sdcorejs/angular/services"
      },
      {
        "symbol": "SdSidebarV4MenuTree",
        "entry_point": "none: private to V4 (INV-006)"
      }
    ],
    "remaining_contract": "Sidebars stay presentational over services; the switcher is the only syncItems caller; no component touches storage or window; TDD inside every component/service task (spec first, then implementation); V4 SCSS token-only (check:scss-hex)."
  },
  "agent_architecture": {
    "required": false,
    "conformance_invariant_refs": [],
    "not_applicable_reason": "Not an AI-agent change.",
    "contract": null
  },
  "verification_strategy": {
    "package_manager": "npm (package-lock.json in root, versions/v19 and showcase; v19/v20/v21 install with --legacy-peer-deps, v22 plain npm ci; exact Node 22.22.3 via fnm exec --using=22.22.3 npm.cmd)",
    "commands_planned": [
      "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=<spec of the task>  (cwd versions/v19; spec first, then implementation, per task)",
      "npm run check:i18n-parity && npm run check:i18n  (cwd versions/v19)",
      "npm run lint  (cwd versions/v19; on CRLF checkout lint changed files as LF, see memory legacy-karma-lint-gotchas)",
      "npm run build  (cwd versions/v19)",
      "npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage  (cwd versions/v19; full suite with coverage thresholds)",
      "npm run test:theme && npm run check:scss-hex  (cwd root)",
      "git grep -n -E \"SdLayoutService|location\\.reload|addEventListener|sessionStorage\" -- versions/v19/projects/sdcorejs-angular/modules/layout/services/context  (VAL-002/VAL-010: only the default runtime factory may match the browser APIs; SdLayoutService never)",
      "git diff --stat HEAD -- versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree  (VAL-006: expect empty)",
      "npm run generate:showcase-examples && npm run test:showcase-examples  (cwd root)",
      "npm --prefix showcase run link:library && npm --prefix showcase test  (after the v19 build; delete showcase/.angular/cache when the linked lib changes)",
      "npm --prefix showcase run build",
      "npm run sync && v22 CRLF->LF fix && npm run check:sync  (cwd root; memory sync-v22-crlf-rewrite)",
      "npm run test:scripts  (cwd root)",
      "docs assertion node -e command of TASK-017 (cwd root)"
    ],
    "commands_skipped": [
      {
        "command": "v20/v21/v22 full Karma suites locally",
        "reason": "Mirrors are byte copies checked by check:sync; CI publish/verify jobs run the per-line builds on Node 22.22.3."
      },
      {
        "command": "npx --yes or browser installs",
        "reason": "Not needed; ChromeHeadlessCI launcher is configured in karma.conf.js."
      }
    ],
    "checks": "Focused spec per task (spec first), i18n parity, theme scripts and SCSS hex guard, lint, build, full v19 coverage, Showcase examples and specs, sync/check:sync, root script tests, docs assertion."
  },
  "execution_policy": "sequential",
  "parallel_candidates": {
    "allowed": false,
    "units": [],
    "shared_files": [
      {
        "path": "versions/v19/projects/sdcorejs-angular/i18n/src/*.ts",
        "owner": "TASK-001",
        "strategy": "single owner"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/components/index.ts",
        "owner": "TASK-011",
        "strategy": "single owner"
      },
      {
        "path": "versions/v19/projects/sdcorejs-angular/modules/layout/services/index.ts",
        "owner": "TASK-006",
        "strategy": "single owner"
      }
    ],
    "contract": "Sequential: one v19 Karma runner, shared barrels and i18n catalogs, and a strict dependency chain (context before V4 and mounts)."
  },
  "repository_plan": {
    "schema_version": 1,
    "integration_owner_repository_id": "sdcorejs-angular",
    "dependency_order": [
      "sdcorejs-angular"
    ],
    "contract": "Single repository; every mutable step owns one Git root (repo root) and carries the plan-level prohibited_paths. Mirrors v20/v21/v22 change only through npm run sync (TASK-019).",
    "steps": [
      {
        "task_id": "TASK-001",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-002",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-003",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-004",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v19/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v19/projects/sdcorejs-angular/services/storage/sd-storage.md"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-005",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-006",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/index.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-007",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-008",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-009",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-010",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-011",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/index.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-012",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-013",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-014",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-015",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-016",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "scripts/core-theme.test.mjs",
          "scripts/theme-contrast.test.mjs"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-017",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
          "CHANGELOG.md"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-018",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "showcase/src/app/pages/modules/layout/layout-demo.component.ts",
          "showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts",
          "showcase/src/styles.scss",
          "showcase/src/app/docs/core/documentation.registry.ts",
          "showcase/src/app/docs/core/documentation.registry.spec.ts",
          "showcase/src/app/docs/generated/example-sources.generated.ts",
          "showcase/src/app/docs/generated/example-manifest.generated.ts",
          "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      },
      {
        "task_id": "TASK-019",
        "owner_repository_id": "sdcorejs-angular",
        "git_root": ".",
        "planned_paths": [
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.model.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.runtime.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/context.service.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/context/index.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/shared/context-switcher/context-switcher.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/menu-tree/sidebar-v4-menu-tree.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v4/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v4/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v20/projects/sdcorejs-angular/services/storage/sd-storage.md",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/services/index.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/index.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
          "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v20/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v20/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v20/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v20/projects/sdcorejs-angular/assets/THEME.md",
          "versions/v20/SYNC-STATUS.md",
          "versions/v21/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v21/projects/sdcorejs-angular/services/storage/sd-storage.md",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/services/index.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/index.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
          "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v21/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v21/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v21/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v21/projects/sdcorejs-angular/assets/THEME.md",
          "versions/v21/SYNC-STATUS.md",
          "versions/v22/projects/sdcorejs-angular/i18n/src/en.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts",
          "versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.model.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/menu/menu.utils.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.spec.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.model.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts",
          "versions/v22/projects/sdcorejs-angular/services/storage/sd-storage.md",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/storage/storage.service.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/services/index.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/layout-main/layout-main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/index.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts",
          "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
          "versions/v22/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
          "versions/v22/projects/sdcorejs-angular/assets/scss/themes/default.scss",
          "versions/v22/projects/sdcorejs-angular/modules/layout/sd-layout.md",
          "versions/v22/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
          "versions/v22/projects/sdcorejs-angular/assets/THEME.md",
          "versions/v22/SYNC-STATUS.md"
        ],
        "prohibited_paths": [
          "**/package.json",
          "**/package-lock.json",
          "**/.env*",
          "published-docs/**",
          "published-pages/**",
          "versions/*/dist/**",
          "**/node_modules/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/**",
          "versions/v19/projects/sdcorejs-angular/modules/layout/services/layout.service.ts"
        ]
      }
    ]
  },
  "finish_tail": {
    "contract": "docs_before_final_branch_ready: TASK-017 and TASK-018 before TASK-019; verify_before_done: full verification after TASK-019; branch_ready_final_gate: sdcorejs-ship branch-ready after verification; no_writes_after_branch_ready: true"
  },
  "approval": {
    "approved": false,
    "approved_at": null
  },
  "change_control": {
    "revision": 1,
    "supersedes": null,
    "change_reason": null
  }
}
```

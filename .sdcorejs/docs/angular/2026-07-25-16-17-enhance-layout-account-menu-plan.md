# Plan - Nâng cấp Layout Account Menu - 2026-07-25 16:17

## Scope

Thực thi approved spec cho account identity/action thống nhất trên V1/V2/V3.
Mở rộng typed public configuration bằng `role`, `updateProfile`, `setting` và
reactive `notification`; giữ tương thích `signout`/`changePassword`, sửa i18n
V1 và cập nhật Showcase. Canonical source là v19; v20/v21 chỉ được sinh qua
root sync.

## Execution context

- Track: `angular`.
- Target root kind: `target-project`.
- Stack profile: `core-ui-angular`.
- Coverage approach: `TDD` RED-first, standard coverage.
- Parallel candidates: không; source/shared specs/sync phụ thuộc tuần tự và
  ChromeHeadless từng có contention khi chạy đồng thời.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: sdcorejs-angular-layout-account-menu-v2
  requirement_id: layout-account-menu-20260725
  approved_spec_path: .sdcorejs/specs/angular/2026-07-25-16-14-enhance-layout-account-menu.md
  approved_spec_hash: 7104ac488b22c4a7968e149ae11851df3eacc8cde1cd18a4fd789b0e30a44e37
  approved_plan_path: .sdcorejs/plans/angular/2026-07-26-04-57-enhance-layout-account-menu.md
  approved_plan_hash: 96de5b6a4fd674731b475dc062480b28236eb0333533592a0800f6075755c6a6
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  track: angular
  stack_profile: core-ui-angular
  task_count: 10
  phase_count: 5
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/modules/layout/**
    - versions/v19/projects/sdcorejs-angular/i18n/src/{vi,en,ja,ko,zh}.ts
    - versions/v19/projects/showcase/src/app/pages/modules/layout/**
    - versions/v19/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/**
    - versions/v21/**
    - product/**/layout-v2-v3-navigation-polish.md
    - .sdcorejs/docs/angular/**
    - .sdcorejs/docs/product/*layout-v2-v3-navigation-polish.md
    - .sdcorejs/tasks/**
    - .sdcorejs/summary.md
  prohibited_paths:
    - package.json
    - package-lock.json
    - versions/*/package.json
    - versions/*/package-lock.json
    - dist/**
    - published-docs/**
    - CHANGELOG.md
    - versions/v19/projects/sdcorejs-angular/modules/{auth,keycloak,permission}/**
  generated_artifacts:
    - versions/v19/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/**
    - versions/v21/**
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - product/**/layout-v2-v3-navigation-polish.md
    - .sdcorejs/docs/angular/**
    - .sdcorejs/docs/product/*layout-v2-v3-navigation-polish.md
    - .sdcorejs/tasks/**
    - .sdcorejs/summary.md
  dependency_changes:
    required: false
    packages: []
    approval_required: false
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: false
    description: null
    approval_required: false
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - name: test
      - name: test:showcase
      - name: lint
      - name: build
      - name: build:showcase
      - name: sync
      - name: check:sync
    commands_planned:
      - command_or_script: npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts
        reason: prove each RED/GREEN account-menu contract
      - command_or_script: npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/modules/layout/**/*.spec.ts
        reason: full canonical Layout regression
      - command_or_script: npm --prefix versions/v19 run test:showcase -- --include=projects/showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts
        reason: verify Showcase fixture and independent V1/V2/V3 examples
      - command_or_script: npm --prefix versions/v19 run build
        reason: compile and package canonical public contract
      - command_or_script: npm --prefix versions/v19 run build:showcase
        reason: verify AOT Showcase integration and regenerate example source
      - command_or_script: npm run sync && npm run check:sync
        reason: generate and prove Angular 20/21 parity
      - command_or_script: npm --prefix versions/v20 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts
        reason: compile and verify the new API on Angular 20
      - command_or_script: npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts
        reason: compile and verify the new API on Angular 21
      - command_or_script: git diff --check
        reason: whitespace and conflict hygiene
    commands_skipped:
      - command_or_probe: dependency install/audit
        reason: no package or lockfile change
    focused_checks:
      - configuration type contract and backward compatibility
      - shared user-menu actions, role and reactive count lifecycle
      - V1 desktop/mobile wrapper alignment and legacy outputs
      - Showcase i18n labels and 390px geometry
    broad_checks:
      - full v19 Layout test suite
      - v19 library and Showcase production builds
      - Angular 19/20/21 sync parity
      - desktop/mobile browser UAT for all versions
  parallel_candidates:
    allowed: false
    units: []
    shared_files:
      - path: versions/v19/projects/sdcorejs-angular/modules/layout/**
        coordination_strategy: sequential
      - path: versions/v20/**
        coordination_strategy: generated-after-v19
      - path: versions/v21/**
        coordination_strategy: generated-after-v19
    conflict_risks:
      - Concurrent Karma/ChromeHeadless runners contend on local browser ports
      - Sync must run after all canonical v19 edits
  finish_tail:
    docs_before_final_branch_ready: true
    branch_ready_final_gate: true
  approval:
    approved: true
    approved_at: 2026-07-26T04:57:46+07:00
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Tasks

### Phase 1 - Preflight và RED contract

1. **VERIFY working tree và approved scope** - ghi branch/HEAD, staged/unstaged/
   untracked, xác nhận approved spec hash, phân loại 106 dirty entries hiện có
   và chỉ tiếp tục trên các path Layout đã được duyệt; không sửa file ngoài
   `allowed_paths`.

2. **EDIT `layout.configuration.spec.ts` và
   `shared/user-menu/user-menu.component.spec.ts`** - viết RED tests cho typed
   `role`, conditional `updateProfile`/`setting`/`notification`, thứ tự action,
   i18n labels, count number/Signal/Observable, normalize badge, lifecycle
   unsubscribe, keyboard navigation và legacy compatibility.

3. **CREATE hai V1 wrapper specs và EDIT Showcase Layout spec** - tạo:
   - `sidebar-v1/components/user/user.component.spec.ts`;
   - `sidebar-mobile-v1/components/user/user.component.spec.ts`;
     đồng thời mở rộng `layout-demo.component.spec.ts` để RED trên identity ngang,
     signout icon/error, role/actions/count và không còn raw translation key.

### Phase 2 - GREEN public contract và shared presentation

4. **EDIT `configurations/layout.configuration.ts`** - thêm exported typed
   `SdLayoutUserRole`, `SdLayoutNotificationConfiguration`, reactive count
   source và optional fields `updateProfile`, `setting`, `notification`; không
   đổi field hiện có.

5. **EDIT `components/shared/user-menu/**`** - normalize role/count, quản lý
Observable cleanup, render shared identity/action order, badge `0/1-99/99+`,
   i18n, semantic buttons, focus/keyboard behavior và token-based responsive
   styling cho desktop/mobile.

6. **EDIT V1 desktop/mobile user wrappers** - thay legacy MatMenu/accordion
   account markup bằng shared `SdLayoutUserMenuComponent`, giữ nguyên
   toggle/collapse outputs và browser geometry của V1; loại bỏ import/style
   legacy không còn dùng.

### Phase 3 - I18n, Showcase và public docs

7. **EDIT năm locale files và Showcase Layout fixture/spec** - thêm nhãn
   `update-profile`, `setting`, `notification`, dùng fixture role có icon/color,
   signal notification count và ba callback; mock i18n trả nhãn đọc được.

8. **EDIT `modules/layout/sd-layout.md`** - tài liệu hóa public types, example
   callbacks, reactive notification sources, zero/99+ behavior và ownership của
   consumer đối với drawer/route.

### Phase 4 - Sync và verification

9. **RUN canonical/cross-version verification** - chạy focused GREEN specs,
   full Layout v19, Showcase Layout, targeted ESLint, library/Showcase builds;
   sau đó root sync/check và chạy focused specs tuần tự trên v20/v21. Restart
   Showcase và UAT sáu desktop/mobile variants, gồm V1 expanded/collapsed và
   notification updates.

### Phase 5 - Review và mandatory tail

10. **UPDATE traceability và hoàn tất tail** - review code/accessibility/
    lifecycle, repair findings đã chọn, code documentation, product AC/UAT/
    ledger, session auto-docs, living task tracker và summary; cuối cùng chạy
    verify-before-done rồi branch-ready read-only. Không ghi file sau
    branch-ready.

## Acceptance mapping

- AC-001, AC-002, AC-003 -> tasks 3, 5, 6, 7, 9.
- AC-004, AC-005 -> tasks 2, 4, 5, 7, 9.
- AC-006, AC-007, AC-008 -> tasks 2, 4, 5, 7, 9.
- AC-009, AC-010, AC-011 -> tasks 2, 4, 5, 9.
- AC-012, AC-013 -> tasks 2, 3, 5, 6, 9.
- AC-014 -> tasks 2, 4, 5, 6, 9.
- AC-015 -> tasks 3, 7, 9.

## Verification

- Focused v19 configuration/shared/V1/Showcase specs: RED trước production
  edits, GREEN sau từng task.
- Full canonical Layout: `npm --prefix versions/v19 run test --
sdcorejs-angular --watch=false --browsers=ChromeHeadless
--code-coverage=false
--include=projects/sdcorejs-angular/modules/layout/**/*.spec.ts`.
- Build: `npm --prefix versions/v19 run build` và
  `npm --prefix versions/v19 run build:showcase`.
- Rollout: `npm run sync`, `npm run check:sync`, focused v20/v21 tuần tự.
- Static hygiene: targeted ESLint và `git diff --check`.
- Manual: mở Showcase Layout, kiểm tra V1/V2/V3 desktop/mobile ở 390px,
  activate từng action và cập nhật notification count.

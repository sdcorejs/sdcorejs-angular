# Plan - E2E Playwright cho múi giờ cố định trên Showcase - 2026-10-17 15:55

## Scope

Thực thi spec đã duyệt `.sdcorejs/specs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e.md` (`sha256:v1:89b50fdb03f43085778713e3637ee0741ff33be6a5cd18bf87221926fd848eef`): bộ e2e Playwright trong `showcase/` chạy trên hai múi giờ trình duyệt, param `?timeZone=` lúc bootstrap, demo ở trang `services/date-time`, job CI. Commit lên nhánh của PR #84. Không đổi code thư viện.

## Execution context

- Track: test
- Target root kind: target-project
- Stack profile: core-ui-angular
- Coverage approach: TDD (e2e + unit đỏ trước)
- Parallel candidates: không — e2e phụ thuộc param và demo; chung `showcase/package.json`, registry và dev server.
- Gate kiến trúc: not-applicable (`test-only`).

## Tasks

### Phase 1 - RED: e2e Playwright và unit spec của param

- **TASK-001** (không phụ thuộc): RED: cài @playwright/test 1.63.0 (devDependency, script e2e), playwright.config.ts (project Asia/Bangkok và UTC, webServer npm run start cổng riêng), e2e/time-zone.e2e.ts cho AC-001…AC-007; bỏ qua test-results/ và playwright-report/. Chạy e2e: phải đỏ vì Showcase chưa có param và demo.
  - CREATE `showcase/playwright.config.ts`
  - CREATE `showcase/e2e/time-zone.e2e.ts`
  - EDIT `showcase/package.json`
  - EDIT `showcase/package-lock.json`
  - EDIT `showcase/.gitignore`
  - Bằng chứng EVIDENCE-001: `npm --prefix showcase run e2e`
- **TASK-002** (không phụ thuộc): RED: unit spec cho hàm đọc param timeZone (hợp lệ, local, không có, offset số, id lạ + console.warn).
  - CREATE `showcase/src/app/showcase-time-zone.spec.ts`
  - Bằng chứng EVIDENCE-002: `NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts --include=src/app/docs/core/documentati…`

### Phase 2 - GREEN: param timeZone và demo date-time

- **TASK-003** (sau TASK-002): GREEN: showcase-time-zone.ts đọc location.search một lần, kiểm DateUtilities.isValidTimeZone, cảnh báo khi sai; app.config.ts dựng SD_CORE_CONFIGURATION từ đó.
  - CREATE `showcase/src/app/showcase-time-zone.ts`
  - EDIT `showcase/src/app/app.config.ts`
  - Bằng chứng EVIDENCE-003: `NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts --include=src/app/docs/core/documentati…`
  - Bằng chứng EVIDENCE-004: `npm --prefix showcase run e2e`
- **TASK-004** (sau TASK-001, TASK-003): GREEN: demo date-time (nhãn zone, form 5 control + JSON form.value, sd-table server có dòng 1960 và external filter daterange + JSON pagingReq.filters, data-e2e); registry chuyển sang defineDocPage có loadComponent và demoSectionCount; sinh lại manifest/sources; cập nhật tổng demo trong registry spec.
  - CREATE `showcase/src/app/pages/services/date-time/date-time-demo.component.ts`
  - EDIT `showcase/src/app/docs/core/documentation.registry.ts`
  - EDIT `showcase/src/app/docs/core/documentation.registry.spec.ts`
  - EDIT `showcase/src/app/docs/generated/example-manifest.generated.ts`
  - EDIT `showcase/src/app/docs/generated/example-sources.generated.ts`
  - Bằng chứng EVIDENCE-005: `npm --prefix showcase run e2e`
  - Bằng chứng EVIDENCE-006: `NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts --include=src/app/docs/core/documentati…`

### Phase 3 - Docs, rollout và CI

- **TASK-005** (sau TASK-004): Docs: một dòng "thử trên Showcase với ?timeZone=" trong sd-date-time.md (v19), rồi npm run sync sang v20/v21/v22 (v22 giữ LF).
  - EDIT `versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md`
  - EDIT `versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md`
  - EDIT `versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md`
  - EDIT `versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md`
  - EDIT `versions/v19/SYNC-STATUS.md`
  - EDIT `versions/v20/SYNC-STATUS.md`
  - EDIT `versions/v21/SYNC-STATUS.md`
  - EDIT `versions/v22/SYNC-STATUS.md`
  - Bằng chứng EVIDENCE-007: `NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts --include=src/app/docs/core/documentati…`
  - Bằng chứng EVIDENCE-008: `node -e "const out=require('child_process').execSync('git diff --name-only 1ff112849923d0f63b518a3f6773acfa531b1235 -- versions').toString().split(String.fro…`
- **TASK-006** (sau TASK-001): CI: job e2e trong ci.yml (Node 22.22.3, v19 npm ci + build, showcase npm ci --legacy-peer-deps, npx playwright install --with-deps chromium, npm run e2e với CI=true, upload playwright-report khi lỗi).
  - EDIT `.github/workflows/ci.yml`
  - Bằng chứng EVIDENCE-009: `node -e "const y=require('./versions/v19/node_modules/js-yaml');const j=y.load(require('fs').readFileSync('.github/workflows/ci.yml','utf8')).jobs.e2e;const …`

## Acceptance mapping

- AC-001 → TASK-001, TASK-003, TASK-004
- AC-002 → TASK-001, TASK-004
- AC-003 → TASK-001, TASK-004
- AC-004 → TASK-001, TASK-004
- AC-005 → TASK-001, TASK-004
- AC-006 → TASK-001, TASK-003, TASK-004
- AC-007 → TASK-001, TASK-003
- AC-008 → TASK-001
- AC-009 → TASK-002, TASK-003, TASK-004, TASK-005
- AC-010 → TASK-006

## Verification

- `npm --prefix showcase run e2e` (AC-001…AC-008, hai project)
- `NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts --include=src/app/docs/core/documentation.registry.spec.ts && npm run test:showcas…` (AC-009)
- `node -e "const y=require('./versions/v19/node_modules/js-yaml');const j=y.load(require('fs').readFileSync('.github/workf…` (AC-010, cấu trúc job; lần chạy thật trên PR #84)
- `npm --prefix showcase run build`, `npm run test:scripts`, quét INV-003
- Ghi chú: `npm --prefix showcase run test` cần `NODE_OPTIONS=--max-old-space-size=8192` (Node từng hết heap 4 GB khi kết thúc Karma).

```yaml
plan_context:
  schema_version: 2
  source: sdcorejs-plan
  architecture_gate:
    valid: true
    required: false
    status: not-applicable
    signals: []
    bypass:
      kind: test-only
      rationale: >-
        Only the unpublished Showcase app, its e2e suite and CI change; no library code, public API, data model or @sdcorejs/angular dependency changes, and
        Playwright is a Showcase devDependency.
    rationale: >-
      Only the unpublished Showcase app, its e2e suite and CI change; no library code, public API, data model or @sdcorejs/angular dependency changes, and
      Playwright is a Showcase devDependency.
  architecture_context: null
  decision_coverage:
    schema_version: 1
    revision: 2
    records:
      - id: R-001
        type: requirement
        statement: >-
          The Showcase reads the timeZone query parameter once at bootstrap: a valid IANA id (or 'local') becomes SD_CORE_CONFIGURATION.timeZone; no parameter
          keeps 'local'; an invalid value (numeric offset such as +07:00, unknown id) is ignored, the app runs in 'local' and logs a console.warn naming the
          value, and the page still renders.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: showcase
        task_refs:
          - TASK-002
          - TASK-003
      - id: R-002
        type: requirement
        statement: >-
          The Examples tab of the services/date-time doc page has a live demo: the active zone label; a form with sd-date, sd-date with transform ISOString,
          sd-datetime, sd-datetime with transform ISOString and sd-date-range plus a live form.value JSON; a server sd-table with date and datetime columns, a
          row holding the instant 1960-05-19T16:00:00Z and a daterange external filter, plus the pagingReq.filters JSON of the last load; every value read by
          the e2e has a stable selector.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: showcase
        task_refs:
          - TASK-004
      - id: R-003
        type: requirement
        statement: >-
          A Playwright e2e suite in showcase/: @playwright/test pinned exactly, playwright.config.ts with two Chromium projects emulating the browser zones
          Asia/Bangkok and UTC, a webServer running the Showcase and an npm script e2e; e2e files stay out of Karma and tsconfig.app.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: showcase
        task_refs:
          - TASK-001
      - id: R-004
        type: requirement
        statement: >-
          The .github/workflows/ci.yml workflow has an e2e job on the existing triggers: Node 22.22.3, install and build the v19 library, install the Showcase
          and run link:library, install Playwright Chromium, run npm run e2e and upload the report as an artifact on failure.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: null
        task_refs:
          - TASK-006
      - id: R-005
        type: requirement
        statement: >-
          The Showcase registry turns services/date-time into a page with a demo (demo section count, generated manifest, registry spec totals); sd-date-time.md
          has one line on trying the feature in the Showcase with ?timeZone=; every Showcase guard and check:sync stay green.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: null
        task_refs:
          - TASK-004
          - TASK-005
      - id: AC-001
        type: acceptance-criterion
        statement: >-
          Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString -> the
          field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads Asia/Ho_Chi_Minh
        behavior: Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString
        expected_result: >-
          the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
          Asia/Ho_Chi_Minh
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
          - R-002
        task_refs:
          - TASK-001
          - TASK-003
          - TASK-004
      - id: AC-002
        type: acceptance-criterion
        statement: >-
          Type 20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString -> form.value is '1960/05/20 08:00:00'; the ISOString variant gives
          '1960-05-20T00:00:00.000Z'
        behavior: Type 20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString
        expected_result: form.value is '1960/05/20 08:00:00'; the ISOString variant gives '1960-05-20T00:00:00.000Z'
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-001
          - TASK-004
      - id: AC-003
        type: acceptance-criterion
        statement: >-
          Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter -> form.value is { from: '1975/06/12', to:
          '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN '1975-06-12T17:00:00.000Z'
        behavior: Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter
        expected_result: >-
          form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN
          '1975-06-12T17:00:00.000Z'
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-001
          - TASK-004
      - id: AC-004
        type: acceptance-criterion
        statement: Read the table row holding the instant 1960-05-19T16:00:00Z -> the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00
        behavior: Read the table row holding the instant 1960-05-19T16:00:00Z
        expected_result: the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-001
          - TASK-004
      - id: AC-005
        type: acceptance-criterion
        statement: >-
          Fix the page clock at 2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker -> the picker marks day 15 of 08/2026 as
          today; Now fills 15/08/2026 00:30
        behavior: Fix the page clock at 2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker
        expected_result: the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026 00:30
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-001
          - TASK-004
      - id: AC-006
        type: acceptance-criterion
        statement: >-
          Open the demo without ?timeZone -> the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under
          Asia/Bangkok and 16:00:00 under UTC
        behavior: Open the demo without ?timeZone
        expected_result: >-
          the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under
          UTC
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
          - R-002
        task_refs:
          - TASK-001
          - TASK-003
          - TASK-004
      - id: AC-007
        type: acceptance-criterion
        statement: Open the demo with ?timeZone=%2B07:00 -> the page renders, the zone label reads local and the console has a warning containing +07:00
        behavior: Open the demo with ?timeZone=%2B07:00
        expected_result: the page renders, the zone label reads local and the console has a warning containing +07:00
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
        task_refs:
          - TASK-001
          - TASK-003
      - id: AC-008
        type: acceptance-criterion
        statement: >-
          Run npm run e2e in showcase -> every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations
          in both, AC-006 gives each project its own values
        behavior: Run npm run e2e in showcase
        expected_result: >-
          every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each
          project its own values
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-003
        task_refs:
          - TASK-001
      - id: AC-009
        type: acceptance-criterion
        statement: >-
          Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync -> all pass
          and sd-date-time.md has the ?timeZone= line
        behavior: Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync
        expected_result: all pass and sd-date-time.md has the ?timeZone= line
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
          - R-005
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-004
          - TASK-005
      - id: AC-010
        type: acceptance-criterion
        statement: 'Push to PR #84 -> the ci.yml e2e job installs Chromium, runs npm run e2e and passes'
        behavior: 'Push to PR #84'
        expected_result: the ci.yml e2e job installs Chromium, runs npm run e2e and passes
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-004
        task_refs:
          - TASK-006
      - id: A-001
        type: assumption
        statement: Playwright timezoneId (CDP Emulation.setTimezoneOverride) makes Date and Intl in Chromium behave like a host in that zone.
        source: inferred
        confidence: high
        status: confirmed
        blocking: false
        evidence_refs: []
        consequence_if_wrong: Both projects would agree even with wrong code, hiding host-zone bugs.
        validation_method: 'AC-006: without the parameter the two projects must show different datetime cells.'
        owner: sdcorejs-angular maintainers
        rationale: Documented Playwright context option backed by the CDP override.
        impacted_refs:
          - R-003
          - AC-006
          - AC-008
      - id: A-002
        type: assumption
        statement: page.clock.setFixedTime fixes Date.now()/new Date() for the app without blocking Angular timers, which is enough for TODAY and Now.
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        evidence_refs: []
        consequence_if_wrong: AC-005 would show the wrong day or hang.
        validation_method: AC-005 itself.
        owner: sdcorejs-angular maintainers
        rationale: setFixedTime keeps timers running (Playwright clock API).
        impacted_refs:
          - AC-005
      - id: A-003
        type: assumption
        statement: The Showcase dev server starts within the webServer timeout (5 minutes) on a GitHub runner.
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        evidence_refs: []
        consequence_if_wrong: The CI job times out before the tests run.
        validation_method: The first CI run of AC-010.
        owner: sdcorejs-angular maintainers
        rationale: ng serve of the Showcase takes about 1-2 minutes locally.
        impacted_refs:
          - R-004
          - AC-010
      - id: A-004
        type: assumption
        statement: ubuntu-latest runners install Playwright Chromium with npx playwright install --with-deps chromium.
        source: inferred
        confidence: high
        status: confirmed
        blocking: false
        evidence_refs: []
        consequence_if_wrong: The CI job fails before running tests.
        validation_method: The first CI run of AC-010.
        owner: sdcorejs-angular maintainers
        rationale: Standard Playwright CI setup.
        impacted_refs:
          - R-004
          - AC-010
      - id: D-001
        type: decision
        statement: 'E2E framework and location: Playwright inside showcase/, running against the Showcase app'
        question: E2E framework and location
        selected_value: Playwright inside showcase/, running against the Showcase app
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Uses the real doc page, which readers can also try by hand; no extra app to maintain.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - AC-008
        task_refs:
          - TASK-001
      - id: D-002
        type: decision
        statement: >-
          How a test selects the configured zone: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls
          back to 'local' with a console.warn
        question: How a test selects the configured zone
        selected_value: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a console.warn
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: SdDateTimeService reads the root injector once, so the zone must exist before bootstrap; a bad value must not break the docs site.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-001
          - AC-006
          - AC-007
        task_refs:
          - TASK-002
          - TASK-003
      - id: D-003
        type: decision
        statement: 'Demo location: The Examples tab of the services/date-time doc page'
        question: Demo location
        selected_value: The Examples tab of the services/date-time doc page
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: The feature already has its reference page there.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-005
        task_refs:
          - TASK-004
          - TASK-005
      - id: D-004
        type: decision
        statement: 'Browser zones and browsers: Two Playwright projects with timezoneId ''Asia/Bangkok'' and ''UTC''; Chromium only'
        question: Browser zones and browsers
        selected_value: Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium only
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: They are the developer and CI zones and give different 1960 results when the code is wrong.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - AC-008
        task_refs:
          - TASK-001
      - id: D-005
        type: decision
        statement: 'Where the e2e runs: A new job in .github/workflows/ci.yml'
        question: Where the e2e runs
        selected_value: A new job in .github/workflows/ci.yml
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Every later PR keeps the proof.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-004
          - AC-010
        task_refs:
          - TASK-006
      - id: D-006
        type: decision
        statement: 'Branch and PR: Commits on claude/core-ui-fixed-timezone (PR #84)'
        question: Branch and PR
        selected_value: 'Commits on claude/core-ui-fixed-timezone (PR #84)'
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: The e2e checks the feature before it merges.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-004
          - AC-010
        task_refs:
          - TASK-006
      - id: D-007
        type: decision
        statement: 'Coverage approach: TDD: the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it pass'
        question: Coverage approach
        selected_value: 'TDD: the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it pass'
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Proves the tests can fail.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - AC-008
        task_refs:
          - TASK-001
          - TASK-002
      - id: D-008
        type: decision
        statement: 'Playwright version: @playwright/test 1.63.0, pinned exactly in the Showcase devDependencies'
        question: Playwright version
        selected_value: '@playwright/test 1.63.0, pinned exactly in the Showcase devDependencies'
        source: approved-spec
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Newest stable release older than two weeks (1.64.0 is 10 days old); the repo pins dependencies exactly.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
        task_refs:
          - TASK-001
      - id: D-009
        type: decision
        statement: >-
          Server for the e2e: Playwright webServer runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a
          running server locally
        question: Server for the e2e
        selected_value: Playwright webServer runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a running server locally
        source: approved-spec
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: No new static server; a dev build is enough for the e2e.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - R-004
        task_refs:
          - TASK-001
      - id: D-010
        type: decision
        statement: >-
          Selectors and file layout: Demo outputs carry data-e2e attributes; pickers are driven through Material roles and aria labels; e2e files are
          showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and tsconfig.app
        question: Selectors and file layout
        selected_value: >-
          Demo outputs carry data-e2e attributes; pickers are driven through Material roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of
          Karma (*.spec.ts) and tsconfig.app
        source: approved-spec
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Stable locators and no clash with the existing Karma setup.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-003
        task_refs:
          - TASK-001
          - TASK-004
      - id: D-011
        type: decision
        statement: 'Ranh giới kiểm chứng nào áp dụng? → none: chỉ Showcase nội bộ, bộ e2e và CI; không có quyền hay API server trong phạm vi'
        question: Ranh giới kiểm chứng nào áp dụng?
        selected_value: none
        source: approved-plan
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Mọi bằng chứng là test tự động trên trình duyệt và guard của repo.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
        validation_boundary:
          kind: none
          source_refs:
            - R-001
            - R-002
            - R-003
            - R-004
            - R-005
            - AC-001
            - AC-002
            - AC-003
            - AC-004
            - AC-005
            - AC-006
            - AC-007
            - AC-008
            - AC-009
            - AC-010
            - INV-001
            - INV-002
            - INV-003
            - INV-004
        task_refs:
          - TASK-001
          - TASK-002
          - TASK-003
          - TASK-004
          - TASK-005
          - TASK-006
      - id: INV-001
        type: invariant
        statement: >-
          Với cùng ?timeZone=Asia/Ho_Chi_Minh, mọi giá trị e2e đọc (ô, form.value, payload filter, today/Now) giống hệt nhau khi trình duyệt ở Asia/Bangkok và ở
          UTC.
        protected_refs:
          - R-002
          - R-003
          - D-004
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-008
        task_refs:
          - TASK-001
          - TASK-004
        evidence_refs:
          - EVIDENCE-001
          - EVIDENCE-005
      - id: INV-002
        type: invariant
        statement: 'Param timeZone không bao giờ làm Showcase lỗi bootstrap: giá trị sai cho ''local'' kèm console.warn, không có param cho ''local''.'
        protected_refs:
          - R-001
          - D-002
          - AC-006
          - AC-007
          - AC-009
        task_refs:
          - TASK-002
          - TASK-003
        evidence_refs:
          - EVIDENCE-002
          - EVIDENCE-003
          - EVIDENCE-004
      - id: INV-003
        type: invariant
        statement: 'Contract này không đổi code thư viện: ngoài sd-date-time.md và SYNC-STATUS.md, không file nào dưới versions/ khác bản 1ff112849.'
        protected_refs:
          - R-005
          - AC-009
        task_refs:
          - TASK-004
          - TASK-005
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-008
      - id: INV-004
        type: invariant
        statement: CI chạy bộ e2e trên mọi push và pull request của workflow ci.yml.
        protected_refs:
          - R-004
          - D-005
          - AC-010
        task_refs:
          - TASK-006
        evidence_refs:
          - EVIDENCE-009
    history:
      - revision: 1
        active:
          - id: R-001
            type: requirement
          - id: R-002
            type: requirement
          - id: R-003
            type: requirement
          - id: R-004
            type: requirement
          - id: R-005
            type: requirement
          - id: AC-001
            type: acceptance-criterion
          - id: AC-002
            type: acceptance-criterion
          - id: AC-003
            type: acceptance-criterion
          - id: AC-004
            type: acceptance-criterion
          - id: AC-005
            type: acceptance-criterion
          - id: AC-006
            type: acceptance-criterion
          - id: AC-007
            type: acceptance-criterion
          - id: AC-008
            type: acceptance-criterion
          - id: AC-009
            type: acceptance-criterion
          - id: AC-010
            type: acceptance-criterion
          - id: A-001
            type: assumption
          - id: A-002
            type: assumption
          - id: A-003
            type: assumption
          - id: A-004
            type: assumption
          - id: D-001
            type: decision
          - id: D-002
            type: decision
          - id: D-003
            type: decision
          - id: D-004
            type: decision
          - id: D-005
            type: decision
          - id: D-006
            type: decision
          - id: D-007
            type: decision
          - id: D-008
            type: decision
          - id: D-009
            type: decision
          - id: D-010
            type: decision
        tombstones: []
      - revision: 2
        active:
          - id: R-001
            type: requirement
          - id: R-002
            type: requirement
          - id: R-003
            type: requirement
          - id: R-004
            type: requirement
          - id: R-005
            type: requirement
          - id: AC-001
            type: acceptance-criterion
          - id: AC-002
            type: acceptance-criterion
          - id: AC-003
            type: acceptance-criterion
          - id: AC-004
            type: acceptance-criterion
          - id: AC-005
            type: acceptance-criterion
          - id: AC-006
            type: acceptance-criterion
          - id: AC-007
            type: acceptance-criterion
          - id: AC-008
            type: acceptance-criterion
          - id: AC-009
            type: acceptance-criterion
          - id: AC-010
            type: acceptance-criterion
          - id: A-001
            type: assumption
          - id: A-002
            type: assumption
          - id: A-003
            type: assumption
          - id: A-004
            type: assumption
          - id: D-001
            type: decision
          - id: D-002
            type: decision
          - id: D-003
            type: decision
          - id: D-004
            type: decision
          - id: D-005
            type: decision
          - id: D-006
            type: decision
          - id: D-007
            type: decision
          - id: D-008
            type: decision
          - id: D-009
            type: decision
          - id: D-010
            type: decision
          - id: D-011
            type: decision
          - id: INV-001
            type: invariant
          - id: INV-002
            type: invariant
          - id: INV-003
            type: invariant
          - id: INV-004
            type: invariant
        tombstones: []
    approved_artifact:
      metadata:
        allowed_paths:
          - '**'
        approval_source: user-approved-decision-coverage
        approved_at: '2026-08-09T00:00:00.000Z'
        approved_by: user
        artifact_id: decision-coverage-r2
        artifact_kind: plan
        change_ref: core-ui-fixed-timezone-e2e
        contract_id: decision-coverage:v1
        owner_module_id: null
        owner_repository_id: sdcorejs-angular
        owner_repository_role: standalone
        parent_references: []
        parent_repository_id: null
        prohibited_paths: []
        repository_relative_path: .sdcorejs/plans/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e.md
        requirement_id: decision-coverage
        schema_version: 1
        source_revision: 1ff112849923d0f63b518a3f6773acfa531b1235
        stack_profile: markdown-skill-pack
        supersedes: null
        track: workflow
        approval_hash: sha256:v1:1481d7a944c6d8c1eb7ea91c922d7f2355fb9bd26799e59efaf792b9147df29b
      body: >
        {"history":[{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"}],"revision":1,"tombstones":[]},{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"}],"revision":2,"tombstones":[]}],"records":[{"id":"R-001","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
        Showcase reads the timeZone query parameter once at bootstrap: a valid IANA id (or 'local') becomes SD_CORE_CONFIGURATION.timeZone; no parameter keeps
        'local'; an invalid value (numeric offset such as +07:00, unknown id) is ignored, the app runs in 'local' and logs a console.warn naming the value, and
        the page still
        renders.","status":"active","task_refs":["TASK-002","TASK-003"],"type":"requirement"},{"id":"R-002","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
        Examples tab of the services/date-time doc page has a live demo: the active zone label; a form with sd-date, sd-date with transform ISOString,
        sd-datetime, sd-datetime with transform ISOString and sd-date-range plus a live form.value JSON; a server sd-table with date and datetime columns, a row
        holding the instant 1960-05-19T16:00:00Z and a daterange external filter, plus the pagingReq.filters JSON of the last load; every value read by the e2e
        has a stable
        selector.","status":"active","task_refs":["TASK-004"],"type":"requirement"},{"id":"R-003","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"A
        Playwright e2e suite in showcase/: @playwright/test pinned exactly, playwright.config.ts with two Chromium projects emulating the browser zones
        Asia/Bangkok and UTC, a webServer running the Showcase and an npm script e2e; e2e files stay out of Karma and
        tsconfig.app.","status":"active","task_refs":["TASK-001"],"type":"requirement"},{"id":"R-004","owner_module_id":null,"owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
        .github/workflows/ci.yml workflow has an e2e job on the existing triggers: Node 22.22.3, install and build the v19 library, install the Showcase and run
        link:library, install Playwright Chromium, run npm run e2e and upload the report as an artifact on
        failure.","status":"active","task_refs":["TASK-006"],"type":"requirement"},{"id":"R-005","owner_module_id":null,"owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
        Showcase registry turns services/date-time into a page with a demo (demo section count, generated manifest, registry spec totals); sd-date-time.md has
        one line on trying the feature in the Showcase with ?timeZone=; every Showcase guard and check:sync stay
        green.","status":"active","task_refs":["TASK-004","TASK-005"],"type":"requirement"},{"behavior":"Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh
        and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString","blocking":true,"expected_result":"the field shows 20/05/1960;
        its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
        Asia/Ho_Chi_Minh","id":"AC-001","requirement_refs":["R-001","R-002"],"statement":"Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick
        20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString -> the field shows 20/05/1960; its form.value is '1960/05/20'; the
        ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
        Asia/Ho_Chi_Minh","task_refs":["TASK-001","TASK-003","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Type
        20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString","blocking":true,"expected_result":"form.value is '1960/05/20 08:00:00'; the
        ISOString variant gives '1960-05-20T00:00:00.000Z'","id":"AC-002","requirement_refs":["R-002"],"statement":"Type 20/05/1960 08:00 in sd-datetime and in
        sd-datetime with transform ISOString -> form.value is '1960/05/20 08:00:00'; the ISOString variant gives
        '1960-05-20T00:00:00.000Z'","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Pick
        12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter","blocking":true,"expected_result":"form.value is {
        from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN
        '1975-06-12T17:00:00.000Z'","id":"AC-003","requirement_refs":["R-002"],"statement":"Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the
        sd-table daterange external filter -> form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL
        '1975-06-11T16:00:00.000Z' and LESS_THAN
        '1975-06-12T17:00:00.000Z'","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Read the
        table row holding the instant 1960-05-19T16:00:00Z","blocking":true,"expected_result":"the date cell shows 20/05/1960 and the datetime cell shows
        20/05/1960 with 00:00:00","id":"AC-004","requirement_refs":["R-002"],"statement":"Read the table row holding the instant 1960-05-19T16:00:00Z -> the
        date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with
        00:00:00","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Fix the page clock at
        2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker","blocking":true,"expected_result":"the picker marks day 15 of
        08/2026 as today; Now fills 15/08/2026 00:30","id":"AC-005","requirement_refs":["R-002"],"statement":"Fix the page clock at 2026-08-14T17:30:00Z, open
        the sd-date picker and press Now in the sd-datetime picker -> the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026
        00:30","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Open the demo without
        ?timeZone","blocking":true,"expected_result":"the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows
        23:00:00 under Asia/Bangkok and 16:00:00 under UTC","id":"AC-006","requirement_refs":["R-001","R-002"],"statement":"Open the demo without ?timeZone ->
        the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under
        UTC","task_refs":["TASK-001","TASK-003","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Open the demo with
        ?timeZone=%2B07:00","blocking":true,"expected_result":"the page renders, the zone label reads local and the console has a warning containing
        +07:00","id":"AC-007","requirement_refs":["R-001"],"statement":"Open the demo with ?timeZone=%2B07:00 -> the page renders, the zone label reads local
        and the console has a warning containing
        +07:00","task_refs":["TASK-001","TASK-003"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Run npm run e2e in
        showcase","blocking":true,"expected_result":"every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same
        expectations in both, AC-006 gives each project its own values","id":"AC-008","requirement_refs":["R-003"],"statement":"Run npm run e2e in showcase ->
        every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each project
        its own values","task_refs":["TASK-001"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Run the showcase-time-zone unit
        spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync","blocking":true,"expected_result":"all pass
        and sd-date-time.md has the ?timeZone= line","id":"AC-009","requirement_refs":["R-001","R-005"],"statement":"Run the showcase-time-zone unit spec,
        documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync -> all pass and sd-date-time.md has the ?timeZone=
        line","task_refs":["TASK-002","TASK-003","TASK-004","TASK-005"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Push to PR
        #84","blocking":true,"expected_result":"the ci.yml e2e job installs Chromium, runs npm run e2e and
        passes","id":"AC-010","requirement_refs":["R-004"],"statement":"Push to PR #84 -> the ci.yml e2e job installs Chromium, runs npm run e2e and
        passes","task_refs":["TASK-006"],"type":"acceptance-criterion","verification_kind":"automated"},{"blocking":false,"confidence":"high","consequence_if_wrong":"Both
        projects would agree even with wrong code, hiding host-zone
        bugs.","evidence_refs":[],"id":"A-001","impacted_refs":["R-003","AC-006","AC-008"],"owner":"sdcorejs-angular maintainers","rationale":"Documented
        Playwright context option backed by the CDP override.","source":"inferred","statement":"Playwright timezoneId (CDP Emulation.setTimezoneOverride) makes
        Date and Intl in Chromium behave like a host in that zone.","status":"confirmed","type":"assumption","validation_method":"AC-006: without the parameter
        the two projects must show different datetime cells."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"AC-005 would show the wrong day
        or hang.","evidence_refs":[],"id":"A-002","impacted_refs":["AC-005"],"owner":"sdcorejs-angular maintainers","rationale":"setFixedTime keeps timers
        running (Playwright clock API).","source":"inferred","statement":"page.clock.setFixedTime fixes Date.now()/new Date() for the app without blocking
        Angular timers, which is enough for TODAY and Now.","status":"proposed","type":"assumption","validation_method":"AC-005
        itself."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"The CI job times out before the tests
        run.","evidence_refs":[],"id":"A-003","impacted_refs":["R-004","AC-010"],"owner":"sdcorejs-angular maintainers","rationale":"ng serve of the Showcase
        takes about 1-2 minutes locally.","source":"inferred","statement":"The Showcase dev server starts within the webServer timeout (5 minutes) on a GitHub
        runner.","status":"proposed","type":"assumption","validation_method":"The first CI run of
        AC-010."},{"blocking":false,"confidence":"high","consequence_if_wrong":"The CI job fails before running
        tests.","evidence_refs":[],"id":"A-004","impacted_refs":["R-004","AC-010"],"owner":"sdcorejs-angular maintainers","rationale":"Standard Playwright CI
        setup.","source":"inferred","statement":"ubuntu-latest runners install Playwright Chromium with npx playwright install --with-deps
        chromium.","status":"confirmed","type":"assumption","validation_method":"The first CI run of
        AC-010."},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-008"],"id":"D-001","owner_repository_id":"sdcorejs-angular","question":"E2E
        framework and location","rationale":"Uses the real doc page, which readers can also try by hand; no extra app to
        maintain.","revisit_condition":null,"scope":"repository","selected_value":"Playwright inside showcase/, running against the Showcase
        app","source":"explicit-user","statement":"E2E framework and location: Playwright inside showcase/, running against the Showcase
        app","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","AC-001","AC-006","AC-007"],"id":"D-002","owner_repository_id":"sdcorejs-angular","question":"How
        a test selects the configured zone","rationale":"SdDateTimeService reads the root injector once, so the zone must exist before bootstrap; a bad value
        must not break the docs site.","revisit_condition":null,"scope":"repository","selected_value":"The ?timeZone=<IANA> query parameter is read at bootstrap
        into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a console.warn","source":"explicit-user","statement":"How a test selects the
        configured zone: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a
        console.warn","status":"approved","supersedes":null,"task_refs":["TASK-002","TASK-003"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-005"],"id":"D-003","owner_repository_id":"sdcorejs-angular","question":"Demo
        location","rationale":"The feature already has its reference page there.","revisit_condition":null,"scope":"repository","selected_value":"The Examples
        tab of the services/date-time doc page","source":"explicit-user","statement":"Demo location: The Examples tab of the services/date-time doc
        page","status":"approved","supersedes":null,"task_refs":["TASK-004","TASK-005"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-008"],"id":"D-004","owner_repository_id":"sdcorejs-angular","question":"Browser
        zones and browsers","rationale":"They are the developer and CI zones and give different 1960 results when the code is
        wrong.","revisit_condition":null,"scope":"repository","selected_value":"Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium
        only","source":"explicit-user","statement":"Browser zones and browsers: Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium
        only","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","AC-010"],"id":"D-005","owner_repository_id":"sdcorejs-angular","question":"Where
        the e2e runs","rationale":"Every later PR keeps the proof.","revisit_condition":null,"scope":"repository","selected_value":"A new job in
        .github/workflows/ci.yml","source":"explicit-user","statement":"Where the e2e runs: A new job in
        .github/workflows/ci.yml","status":"approved","supersedes":null,"task_refs":["TASK-006"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","AC-010"],"id":"D-006","owner_repository_id":"sdcorejs-angular","question":"Branch
        and PR","rationale":"The e2e checks the feature before it merges.","revisit_condition":null,"scope":"repository","selected_value":"Commits on
        claude/core-ui-fixed-timezone (PR #84)","source":"explicit-user","statement":"Branch and PR: Commits on claude/core-ui-fixed-timezone (PR
        #84)","status":"approved","supersedes":null,"task_refs":["TASK-006"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["AC-008"],"id":"D-007","owner_repository_id":"sdcorejs-angular","question":"Coverage
        approach","rationale":"Proves the tests can fail.","revisit_condition":null,"scope":"repository","selected_value":"TDD: the e2e is written first and
        must fail against the current Showcase, then the parameter and the demo make it pass","source":"explicit-user","statement":"Coverage approach: TDD: the
        e2e is written first and must fail against the current Showcase, then the parameter and the demo make it
        pass","status":"approved","supersedes":null,"task_refs":["TASK-001","TASK-002"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003"],"id":"D-008","owner_repository_id":"sdcorejs-angular","question":"Playwright
        version","rationale":"Newest stable release older than two weeks (1.64.0 is 10 days old); the repo pins dependencies
        exactly.","revisit_condition":null,"scope":"repository","selected_value":"@playwright/test 1.63.0, pinned exactly in the Showcase
        devDependencies","source":"approved-spec","statement":"Playwright version: @playwright/test 1.63.0, pinned exactly in the Showcase
        devDependencies","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","R-004"],"id":"D-009","owner_repository_id":"sdcorejs-angular","question":"Server
        for the e2e","rationale":"No new static server; a dev build is enough for the
        e2e.","revisit_condition":null,"scope":"repository","selected_value":"Playwright webServer runs the Showcase npm run start (its prestart already runs
        link:library) on a dedicated port and reuses a running server locally","source":"approved-spec","statement":"Server for the e2e: Playwright webServer
        runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a running server
        locally","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-003"],"id":"D-010","owner_repository_id":"sdcorejs-angular","question":"Selectors
        and file layout","rationale":"Stable locators and no clash with the existing Karma
        setup.","revisit_condition":null,"scope":"repository","selected_value":"Demo outputs carry data-e2e attributes; pickers are driven through Material
        roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and
        tsconfig.app","source":"approved-spec","statement":"Selectors and file layout: Demo outputs carry data-e2e attributes; pickers are driven through
        Material roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and
        tsconfig.app","status":"approved","supersedes":null,"task_refs":["TASK-001","TASK-004"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","R-003","R-004","R-005","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","INV-001","INV-002","INV-003","INV-004"],"id":"D-011","owner_repository_id":"sdcorejs-angular","question":"Ranh
        giới kiểm chứng nào áp dụng?","rationale":"Mọi bằng chứng là test tự động trên trình duyệt và guard của
        repo.","revisit_condition":null,"scope":"repository","selected_value":"none","source":"approved-plan","statement":"Ranh giới kiểm chứng nào áp dụng? →
        none: chỉ Showcase nội bộ, bộ e2e và CI; không có quyền hay API server trong phạm
        vi","status":"approved","supersedes":null,"task_refs":["TASK-001","TASK-002","TASK-003","TASK-004","TASK-005","TASK-006"],"type":"decision","validation_boundary":{"kind":"none","source_refs":["R-001","R-002","R-003","R-004","R-005","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","INV-001","INV-002","INV-003","INV-004"]}},{"evidence_refs":["EVIDENCE-001","EVIDENCE-005"],"id":"INV-001","protected_refs":["R-002","R-003","D-004","AC-001","AC-002","AC-003","AC-004","AC-005","AC-008"],"statement":"Với
        cùng ?timeZone=Asia/Ho_Chi_Minh, mọi giá trị e2e đọc (ô, form.value, payload filter, today/Now) giống hệt nhau khi trình duyệt ở Asia/Bangkok và ở
        UTC.","task_refs":["TASK-001","TASK-004"],"type":"invariant"},{"evidence_refs":["EVIDENCE-002","EVIDENCE-003","EVIDENCE-004"],"id":"INV-002","protected_refs":["R-001","D-002","AC-006","AC-007","AC-009"],"statement":"Param
        timeZone không bao giờ làm Showcase lỗi bootstrap: giá trị sai cho 'local' kèm console.warn, không có param cho
        'local'.","task_refs":["TASK-002","TASK-003"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008"],"id":"INV-003","protected_refs":["R-005","AC-009"],"statement":"Contract
        này không đổi code thư viện: ngoài sd-date-time.md và SYNC-STATUS.md, không file nào dưới versions/ khác bản
        1ff112849.","task_refs":["TASK-004","TASK-005"],"type":"invariant"},{"evidence_refs":["EVIDENCE-009"],"id":"INV-004","protected_refs":["R-004","D-005","AC-010"],"statement":"CI
        chạy bộ e2e trên mọi push và pull request của workflow ci.yml.","task_refs":["TASK-006"],"type":"invariant"}],"revision":2,"schema_version":1}
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    decision_coverage:
      schema_version: 1
      revision: 2
      records:
        - id: R-001
          type: requirement
          statement: >-
            The Showcase reads the timeZone query parameter once at bootstrap: a valid IANA id (or 'local') becomes SD_CORE_CONFIGURATION.timeZone; no parameter
            keeps 'local'; an invalid value (numeric offset such as +07:00, unknown id) is ignored, the app runs in 'local' and logs a console.warn naming the
            value, and the page still renders.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: showcase
          task_refs:
            - TASK-002
            - TASK-003
        - id: R-002
          type: requirement
          statement: >-
            The Examples tab of the services/date-time doc page has a live demo: the active zone label; a form with sd-date, sd-date with transform ISOString,
            sd-datetime, sd-datetime with transform ISOString and sd-date-range plus a live form.value JSON; a server sd-table with date and datetime columns, a
            row holding the instant 1960-05-19T16:00:00Z and a daterange external filter, plus the pagingReq.filters JSON of the last load; every value read by
            the e2e has a stable selector.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: showcase
          task_refs:
            - TASK-004
        - id: R-003
          type: requirement
          statement: >-
            A Playwright e2e suite in showcase/: @playwright/test pinned exactly, playwright.config.ts with two Chromium projects emulating the browser zones
            Asia/Bangkok and UTC, a webServer running the Showcase and an npm script e2e; e2e files stay out of Karma and tsconfig.app.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: showcase
          task_refs:
            - TASK-001
        - id: R-004
          type: requirement
          statement: >-
            The .github/workflows/ci.yml workflow has an e2e job on the existing triggers: Node 22.22.3, install and build the v19 library, install the Showcase
            and run link:library, install Playwright Chromium, run npm run e2e and upload the report as an artifact on failure.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: null
          task_refs:
            - TASK-006
        - id: R-005
          type: requirement
          statement: >-
            The Showcase registry turns services/date-time into a page with a demo (demo section count, generated manifest, registry spec totals);
            sd-date-time.md has one line on trying the feature in the Showcase with ?timeZone=; every Showcase guard and check:sync stay green.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: null
          task_refs:
            - TASK-004
            - TASK-005
        - id: AC-001
          type: acceptance-criterion
          statement: >-
            Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString ->
            the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
            Asia/Ho_Chi_Minh
          behavior: Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString
          expected_result: >-
            the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
            Asia/Ho_Chi_Minh
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-001
            - R-002
          task_refs:
            - TASK-001
            - TASK-003
            - TASK-004
        - id: AC-002
          type: acceptance-criterion
          statement: >-
            Type 20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString -> form.value is '1960/05/20 08:00:00'; the ISOString variant gives
            '1960-05-20T00:00:00.000Z'
          behavior: Type 20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString
          expected_result: form.value is '1960/05/20 08:00:00'; the ISOString variant gives '1960-05-20T00:00:00.000Z'
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-002
          task_refs:
            - TASK-001
            - TASK-004
        - id: AC-003
          type: acceptance-criterion
          statement: >-
            Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter -> form.value is { from: '1975/06/12', to:
            '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN '1975-06-12T17:00:00.000Z'
          behavior: Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter
          expected_result: >-
            form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN
            '1975-06-12T17:00:00.000Z'
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-002
          task_refs:
            - TASK-001
            - TASK-004
        - id: AC-004
          type: acceptance-criterion
          statement: Read the table row holding the instant 1960-05-19T16:00:00Z -> the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00
          behavior: Read the table row holding the instant 1960-05-19T16:00:00Z
          expected_result: the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-002
          task_refs:
            - TASK-001
            - TASK-004
        - id: AC-005
          type: acceptance-criterion
          statement: >-
            Fix the page clock at 2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker -> the picker marks day 15 of 08/2026 as
            today; Now fills 15/08/2026 00:30
          behavior: Fix the page clock at 2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker
          expected_result: the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026 00:30
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-002
          task_refs:
            - TASK-001
            - TASK-004
        - id: AC-006
          type: acceptance-criterion
          statement: >-
            Open the demo without ?timeZone -> the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00
            under Asia/Bangkok and 16:00:00 under UTC
          behavior: Open the demo without ?timeZone
          expected_result: >-
            the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under
            UTC
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-001
            - R-002
          task_refs:
            - TASK-001
            - TASK-003
            - TASK-004
        - id: AC-007
          type: acceptance-criterion
          statement: Open the demo with ?timeZone=%2B07:00 -> the page renders, the zone label reads local and the console has a warning containing +07:00
          behavior: Open the demo with ?timeZone=%2B07:00
          expected_result: the page renders, the zone label reads local and the console has a warning containing +07:00
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-001
          task_refs:
            - TASK-001
            - TASK-003
        - id: AC-008
          type: acceptance-criterion
          statement: >-
            Run npm run e2e in showcase -> every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations
            in both, AC-006 gives each project its own values
          behavior: Run npm run e2e in showcase
          expected_result: >-
            every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each
            project its own values
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-003
          task_refs:
            - TASK-001
        - id: AC-009
          type: acceptance-criterion
          statement: >-
            Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync -> all
            pass and sd-date-time.md has the ?timeZone= line
          behavior: Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync
          expected_result: all pass and sd-date-time.md has the ?timeZone= line
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-001
            - R-005
          task_refs:
            - TASK-002
            - TASK-003
            - TASK-004
            - TASK-005
        - id: AC-010
          type: acceptance-criterion
          statement: 'Push to PR #84 -> the ci.yml e2e job installs Chromium, runs npm run e2e and passes'
          behavior: 'Push to PR #84'
          expected_result: the ci.yml e2e job installs Chromium, runs npm run e2e and passes
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-004
          task_refs:
            - TASK-006
        - id: A-001
          type: assumption
          statement: Playwright timezoneId (CDP Emulation.setTimezoneOverride) makes Date and Intl in Chromium behave like a host in that zone.
          source: inferred
          confidence: high
          status: confirmed
          blocking: false
          evidence_refs: []
          consequence_if_wrong: Both projects would agree even with wrong code, hiding host-zone bugs.
          validation_method: 'AC-006: without the parameter the two projects must show different datetime cells.'
          owner: sdcorejs-angular maintainers
          rationale: Documented Playwright context option backed by the CDP override.
          impacted_refs:
            - R-003
            - AC-006
            - AC-008
        - id: A-002
          type: assumption
          statement: page.clock.setFixedTime fixes Date.now()/new Date() for the app without blocking Angular timers, which is enough for TODAY and Now.
          source: inferred
          confidence: medium
          status: proposed
          blocking: false
          evidence_refs: []
          consequence_if_wrong: AC-005 would show the wrong day or hang.
          validation_method: AC-005 itself.
          owner: sdcorejs-angular maintainers
          rationale: setFixedTime keeps timers running (Playwright clock API).
          impacted_refs:
            - AC-005
        - id: A-003
          type: assumption
          statement: The Showcase dev server starts within the webServer timeout (5 minutes) on a GitHub runner.
          source: inferred
          confidence: medium
          status: proposed
          blocking: false
          evidence_refs: []
          consequence_if_wrong: The CI job times out before the tests run.
          validation_method: The first CI run of AC-010.
          owner: sdcorejs-angular maintainers
          rationale: ng serve of the Showcase takes about 1-2 minutes locally.
          impacted_refs:
            - R-004
            - AC-010
        - id: A-004
          type: assumption
          statement: ubuntu-latest runners install Playwright Chromium with npx playwright install --with-deps chromium.
          source: inferred
          confidence: high
          status: confirmed
          blocking: false
          evidence_refs: []
          consequence_if_wrong: The CI job fails before running tests.
          validation_method: The first CI run of AC-010.
          owner: sdcorejs-angular maintainers
          rationale: Standard Playwright CI setup.
          impacted_refs:
            - R-004
            - AC-010
        - id: D-001
          type: decision
          statement: 'E2E framework and location: Playwright inside showcase/, running against the Showcase app'
          question: E2E framework and location
          selected_value: Playwright inside showcase/, running against the Showcase app
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Uses the real doc page, which readers can also try by hand; no extra app to maintain.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-003
            - AC-008
          task_refs:
            - TASK-001
        - id: D-002
          type: decision
          statement: >-
            How a test selects the configured zone: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls
            back to 'local' with a console.warn
          question: How a test selects the configured zone
          selected_value: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a console.warn
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: SdDateTimeService reads the root injector once, so the zone must exist before bootstrap; a bad value must not break the docs site.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-001
            - AC-001
            - AC-006
            - AC-007
          task_refs:
            - TASK-002
            - TASK-003
        - id: D-003
          type: decision
          statement: 'Demo location: The Examples tab of the services/date-time doc page'
          question: Demo location
          selected_value: The Examples tab of the services/date-time doc page
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: The feature already has its reference page there.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-002
            - R-005
          task_refs:
            - TASK-004
            - TASK-005
        - id: D-004
          type: decision
          statement: 'Browser zones and browsers: Two Playwright projects with timezoneId ''Asia/Bangkok'' and ''UTC''; Chromium only'
          question: Browser zones and browsers
          selected_value: Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium only
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: They are the developer and CI zones and give different 1960 results when the code is wrong.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-003
            - AC-008
          task_refs:
            - TASK-001
        - id: D-005
          type: decision
          statement: 'Where the e2e runs: A new job in .github/workflows/ci.yml'
          question: Where the e2e runs
          selected_value: A new job in .github/workflows/ci.yml
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Every later PR keeps the proof.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-004
            - AC-010
          task_refs:
            - TASK-006
        - id: D-006
          type: decision
          statement: 'Branch and PR: Commits on claude/core-ui-fixed-timezone (PR #84)'
          question: Branch and PR
          selected_value: 'Commits on claude/core-ui-fixed-timezone (PR #84)'
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: The e2e checks the feature before it merges.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-004
            - AC-010
          task_refs:
            - TASK-006
        - id: D-007
          type: decision
          statement: 'Coverage approach: TDD: the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it pass'
          question: Coverage approach
          selected_value: 'TDD: the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it pass'
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Proves the tests can fail.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - AC-008
          task_refs:
            - TASK-001
            - TASK-002
        - id: D-008
          type: decision
          statement: 'Playwright version: @playwright/test 1.63.0, pinned exactly in the Showcase devDependencies'
          question: Playwright version
          selected_value: '@playwright/test 1.63.0, pinned exactly in the Showcase devDependencies'
          source: approved-spec
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Newest stable release older than two weeks (1.64.0 is 10 days old); the repo pins dependencies exactly.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-003
          task_refs:
            - TASK-001
        - id: D-009
          type: decision
          statement: >-
            Server for the e2e: Playwright webServer runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a
            running server locally
          question: Server for the e2e
          selected_value: >-
            Playwright webServer runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a running server
            locally
          source: approved-spec
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: No new static server; a dev build is enough for the e2e.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-003
            - R-004
          task_refs:
            - TASK-001
        - id: D-010
          type: decision
          statement: >-
            Selectors and file layout: Demo outputs carry data-e2e attributes; pickers are driven through Material roles and aria labels; e2e files are
            showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and tsconfig.app
          question: Selectors and file layout
          selected_value: >-
            Demo outputs carry data-e2e attributes; pickers are driven through Material roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out
            of Karma (*.spec.ts) and tsconfig.app
          source: approved-spec
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Stable locators and no clash with the existing Karma setup.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-002
            - R-003
          task_refs:
            - TASK-001
            - TASK-004
        - id: D-011
          type: decision
          statement: 'Ranh giới kiểm chứng nào áp dụng? → none: chỉ Showcase nội bộ, bộ e2e và CI; không có quyền hay API server trong phạm vi'
          question: Ranh giới kiểm chứng nào áp dụng?
          selected_value: none
          source: approved-plan
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Mọi bằng chứng là test tự động trên trình duyệt và guard của repo.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-001
            - R-002
            - R-003
            - R-004
            - R-005
            - AC-001
            - AC-002
            - AC-003
            - AC-004
            - AC-005
            - AC-006
            - AC-007
            - AC-008
            - AC-009
            - AC-010
            - INV-001
            - INV-002
            - INV-003
            - INV-004
          validation_boundary:
            kind: none
            source_refs:
              - R-001
              - R-002
              - R-003
              - R-004
              - R-005
              - AC-001
              - AC-002
              - AC-003
              - AC-004
              - AC-005
              - AC-006
              - AC-007
              - AC-008
              - AC-009
              - AC-010
              - INV-001
              - INV-002
              - INV-003
              - INV-004
          task_refs:
            - TASK-001
            - TASK-002
            - TASK-003
            - TASK-004
            - TASK-005
            - TASK-006
        - id: INV-001
          type: invariant
          statement: >-
            Với cùng ?timeZone=Asia/Ho_Chi_Minh, mọi giá trị e2e đọc (ô, form.value, payload filter, today/Now) giống hệt nhau khi trình duyệt ở Asia/Bangkok và
            ở UTC.
          protected_refs:
            - R-002
            - R-003
            - D-004
            - AC-001
            - AC-002
            - AC-003
            - AC-004
            - AC-005
            - AC-008
          task_refs:
            - TASK-001
            - TASK-004
          evidence_refs:
            - EVIDENCE-001
            - EVIDENCE-005
        - id: INV-002
          type: invariant
          statement: 'Param timeZone không bao giờ làm Showcase lỗi bootstrap: giá trị sai cho ''local'' kèm console.warn, không có param cho ''local''.'
          protected_refs:
            - R-001
            - D-002
            - AC-006
            - AC-007
            - AC-009
          task_refs:
            - TASK-002
            - TASK-003
          evidence_refs:
            - EVIDENCE-002
            - EVIDENCE-003
            - EVIDENCE-004
        - id: INV-003
          type: invariant
          statement: 'Contract này không đổi code thư viện: ngoài sd-date-time.md và SYNC-STATUS.md, không file nào dưới versions/ khác bản 1ff112849.'
          protected_refs:
            - R-005
            - AC-009
          task_refs:
            - TASK-004
            - TASK-005
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-008
        - id: INV-004
          type: invariant
          statement: CI chạy bộ e2e trên mọi push và pull request của workflow ci.yml.
          protected_refs:
            - R-004
            - D-005
            - AC-010
          task_refs:
            - TASK-006
          evidence_refs:
            - EVIDENCE-009
      history:
        - revision: 1
          active:
            - id: R-001
              type: requirement
            - id: R-002
              type: requirement
            - id: R-003
              type: requirement
            - id: R-004
              type: requirement
            - id: R-005
              type: requirement
            - id: AC-001
              type: acceptance-criterion
            - id: AC-002
              type: acceptance-criterion
            - id: AC-003
              type: acceptance-criterion
            - id: AC-004
              type: acceptance-criterion
            - id: AC-005
              type: acceptance-criterion
            - id: AC-006
              type: acceptance-criterion
            - id: AC-007
              type: acceptance-criterion
            - id: AC-008
              type: acceptance-criterion
            - id: AC-009
              type: acceptance-criterion
            - id: AC-010
              type: acceptance-criterion
            - id: A-001
              type: assumption
            - id: A-002
              type: assumption
            - id: A-003
              type: assumption
            - id: A-004
              type: assumption
            - id: D-001
              type: decision
            - id: D-002
              type: decision
            - id: D-003
              type: decision
            - id: D-004
              type: decision
            - id: D-005
              type: decision
            - id: D-006
              type: decision
            - id: D-007
              type: decision
            - id: D-008
              type: decision
            - id: D-009
              type: decision
            - id: D-010
              type: decision
          tombstones: []
        - revision: 2
          active:
            - id: R-001
              type: requirement
            - id: R-002
              type: requirement
            - id: R-003
              type: requirement
            - id: R-004
              type: requirement
            - id: R-005
              type: requirement
            - id: AC-001
              type: acceptance-criterion
            - id: AC-002
              type: acceptance-criterion
            - id: AC-003
              type: acceptance-criterion
            - id: AC-004
              type: acceptance-criterion
            - id: AC-005
              type: acceptance-criterion
            - id: AC-006
              type: acceptance-criterion
            - id: AC-007
              type: acceptance-criterion
            - id: AC-008
              type: acceptance-criterion
            - id: AC-009
              type: acceptance-criterion
            - id: AC-010
              type: acceptance-criterion
            - id: A-001
              type: assumption
            - id: A-002
              type: assumption
            - id: A-003
              type: assumption
            - id: A-004
              type: assumption
            - id: D-001
              type: decision
            - id: D-002
              type: decision
            - id: D-003
              type: decision
            - id: D-004
              type: decision
            - id: D-005
              type: decision
            - id: D-006
              type: decision
            - id: D-007
              type: decision
            - id: D-008
              type: decision
            - id: D-009
              type: decision
            - id: D-010
              type: decision
            - id: D-011
              type: decision
            - id: INV-001
              type: invariant
            - id: INV-002
              type: invariant
            - id: INV-003
              type: invariant
            - id: INV-004
              type: invariant
          tombstones: []
      approved_artifact:
        metadata:
          allowed_paths:
            - '**'
          approval_source: user-approved-decision-coverage
          approved_at: '2026-08-09T00:00:00.000Z'
          approved_by: user
          artifact_id: decision-coverage-r2
          artifact_kind: plan
          change_ref: core-ui-fixed-timezone-e2e
          contract_id: decision-coverage:v1
          owner_module_id: null
          owner_repository_id: sdcorejs-angular
          owner_repository_role: standalone
          parent_references: []
          parent_repository_id: null
          prohibited_paths: []
          repository_relative_path: .sdcorejs/plans/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e.md
          requirement_id: decision-coverage
          schema_version: 1
          source_revision: 1ff112849923d0f63b518a3f6773acfa531b1235
          stack_profile: markdown-skill-pack
          supersedes: null
          track: workflow
          approval_hash: sha256:v1:1481d7a944c6d8c1eb7ea91c922d7f2355fb9bd26799e59efaf792b9147df29b
        body: >
          {"history":[{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"}],"revision":1,"tombstones":[]},{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"}],"revision":2,"tombstones":[]}],"records":[{"id":"R-001","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
          Showcase reads the timeZone query parameter once at bootstrap: a valid IANA id (or 'local') becomes SD_CORE_CONFIGURATION.timeZone; no parameter keeps
          'local'; an invalid value (numeric offset such as +07:00, unknown id) is ignored, the app runs in 'local' and logs a console.warn naming the value,
          and the page still
          renders.","status":"active","task_refs":["TASK-002","TASK-003"],"type":"requirement"},{"id":"R-002","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
          Examples tab of the services/date-time doc page has a live demo: the active zone label; a form with sd-date, sd-date with transform ISOString,
          sd-datetime, sd-datetime with transform ISOString and sd-date-range plus a live form.value JSON; a server sd-table with date and datetime columns, a
          row holding the instant 1960-05-19T16:00:00Z and a daterange external filter, plus the pagingReq.filters JSON of the last load; every value read by
          the e2e has a stable
          selector.","status":"active","task_refs":["TASK-004"],"type":"requirement"},{"id":"R-003","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"A
          Playwright e2e suite in showcase/: @playwright/test pinned exactly, playwright.config.ts with two Chromium projects emulating the browser zones
          Asia/Bangkok and UTC, a webServer running the Showcase and an npm script e2e; e2e files stay out of Karma and
          tsconfig.app.","status":"active","task_refs":["TASK-001"],"type":"requirement"},{"id":"R-004","owner_module_id":null,"owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
          .github/workflows/ci.yml workflow has an e2e job on the existing triggers: Node 22.22.3, install and build the v19 library, install the Showcase and
          run link:library, install Playwright Chromium, run npm run e2e and upload the report as an artifact on
          failure.","status":"active","task_refs":["TASK-006"],"type":"requirement"},{"id":"R-005","owner_module_id":null,"owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"The
          Showcase registry turns services/date-time into a page with a demo (demo section count, generated manifest, registry spec totals); sd-date-time.md has
          one line on trying the feature in the Showcase with ?timeZone=; every Showcase guard and check:sync stay
          green.","status":"active","task_refs":["TASK-004","TASK-005"],"type":"requirement"},{"behavior":"Open the date-time demo with
          ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform
          ISOString","blocking":true,"expected_result":"the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives
          '1960-05-19T16:00:00.000Z'; the zone label reads Asia/Ho_Chi_Minh","id":"AC-001","requirement_refs":["R-001","R-002"],"statement":"Open the date-time
          demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString -> the field shows
          20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
          Asia/Ho_Chi_Minh","task_refs":["TASK-001","TASK-003","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Type
          20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString","blocking":true,"expected_result":"form.value is '1960/05/20 08:00:00';
          the ISOString variant gives '1960-05-20T00:00:00.000Z'","id":"AC-002","requirement_refs":["R-002"],"statement":"Type 20/05/1960 08:00 in sd-datetime
          and in sd-datetime with transform ISOString -> form.value is '1960/05/20 08:00:00'; the ISOString variant gives
          '1960-05-20T00:00:00.000Z'","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Pick
          12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter","blocking":true,"expected_result":"form.value is {
          from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN
          '1975-06-12T17:00:00.000Z'","id":"AC-003","requirement_refs":["R-002"],"statement":"Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the
          sd-table daterange external filter -> form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL
          '1975-06-11T16:00:00.000Z' and LESS_THAN
          '1975-06-12T17:00:00.000Z'","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Read the
          table row holding the instant 1960-05-19T16:00:00Z","blocking":true,"expected_result":"the date cell shows 20/05/1960 and the datetime cell shows
          20/05/1960 with 00:00:00","id":"AC-004","requirement_refs":["R-002"],"statement":"Read the table row holding the instant 1960-05-19T16:00:00Z -> the
          date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with
          00:00:00","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Fix the page clock at
          2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker","blocking":true,"expected_result":"the picker marks day 15 of
          08/2026 as today; Now fills 15/08/2026 00:30","id":"AC-005","requirement_refs":["R-002"],"statement":"Fix the page clock at 2026-08-14T17:30:00Z, open
          the sd-date picker and press Now in the sd-datetime picker -> the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026
          00:30","task_refs":["TASK-001","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Open the demo without
          ?timeZone","blocking":true,"expected_result":"the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows
          23:00:00 under Asia/Bangkok and 16:00:00 under UTC","id":"AC-006","requirement_refs":["R-001","R-002"],"statement":"Open the demo without ?timeZone ->
          the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under
          UTC","task_refs":["TASK-001","TASK-003","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Open the demo with
          ?timeZone=%2B07:00","blocking":true,"expected_result":"the page renders, the zone label reads local and the console has a warning containing
          +07:00","id":"AC-007","requirement_refs":["R-001"],"statement":"Open the demo with ?timeZone=%2B07:00 -> the page renders, the zone label reads local
          and the console has a warning containing
          +07:00","task_refs":["TASK-001","TASK-003"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Run npm run e2e in
          showcase","blocking":true,"expected_result":"every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same
          expectations in both, AC-006 gives each project its own values","id":"AC-008","requirement_refs":["R-003"],"statement":"Run npm run e2e in showcase ->
          every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each
          project its own values","task_refs":["TASK-001"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Run the
          showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run
          check:sync","blocking":true,"expected_result":"all pass and sd-date-time.md has the ?timeZone=
          line","id":"AC-009","requirement_refs":["R-001","R-005"],"statement":"Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run
          test:showcase-examples, npm run sync and npm run check:sync -> all pass and sd-date-time.md has the ?timeZone=
          line","task_refs":["TASK-002","TASK-003","TASK-004","TASK-005"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Push to PR
          #84","blocking":true,"expected_result":"the ci.yml e2e job installs Chromium, runs npm run e2e and
          passes","id":"AC-010","requirement_refs":["R-004"],"statement":"Push to PR #84 -> the ci.yml e2e job installs Chromium, runs npm run e2e and
          passes","task_refs":["TASK-006"],"type":"acceptance-criterion","verification_kind":"automated"},{"blocking":false,"confidence":"high","consequence_if_wrong":"Both
          projects would agree even with wrong code, hiding host-zone
          bugs.","evidence_refs":[],"id":"A-001","impacted_refs":["R-003","AC-006","AC-008"],"owner":"sdcorejs-angular maintainers","rationale":"Documented
          Playwright context option backed by the CDP override.","source":"inferred","statement":"Playwright timezoneId (CDP Emulation.setTimezoneOverride)
          makes Date and Intl in Chromium behave like a host in that zone.","status":"confirmed","type":"assumption","validation_method":"AC-006: without the
          parameter the two projects must show different datetime cells."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"AC-005 would show the
          wrong day or hang.","evidence_refs":[],"id":"A-002","impacted_refs":["AC-005"],"owner":"sdcorejs-angular maintainers","rationale":"setFixedTime keeps
          timers running (Playwright clock API).","source":"inferred","statement":"page.clock.setFixedTime fixes Date.now()/new Date() for the app without
          blocking Angular timers, which is enough for TODAY and Now.","status":"proposed","type":"assumption","validation_method":"AC-005
          itself."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"The CI job times out before the tests
          run.","evidence_refs":[],"id":"A-003","impacted_refs":["R-004","AC-010"],"owner":"sdcorejs-angular maintainers","rationale":"ng serve of the Showcase
          takes about 1-2 minutes locally.","source":"inferred","statement":"The Showcase dev server starts within the webServer timeout (5 minutes) on a GitHub
          runner.","status":"proposed","type":"assumption","validation_method":"The first CI run of
          AC-010."},{"blocking":false,"confidence":"high","consequence_if_wrong":"The CI job fails before running
          tests.","evidence_refs":[],"id":"A-004","impacted_refs":["R-004","AC-010"],"owner":"sdcorejs-angular maintainers","rationale":"Standard Playwright CI
          setup.","source":"inferred","statement":"ubuntu-latest runners install Playwright Chromium with npx playwright install --with-deps
          chromium.","status":"confirmed","type":"assumption","validation_method":"The first CI run of
          AC-010."},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-008"],"id":"D-001","owner_repository_id":"sdcorejs-angular","question":"E2E
          framework and location","rationale":"Uses the real doc page, which readers can also try by hand; no extra app to
          maintain.","revisit_condition":null,"scope":"repository","selected_value":"Playwright inside showcase/, running against the Showcase
          app","source":"explicit-user","statement":"E2E framework and location: Playwright inside showcase/, running against the Showcase
          app","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","AC-001","AC-006","AC-007"],"id":"D-002","owner_repository_id":"sdcorejs-angular","question":"How
          a test selects the configured zone","rationale":"SdDateTimeService reads the root injector once, so the zone must exist before bootstrap; a bad value
          must not break the docs site.","revisit_condition":null,"scope":"repository","selected_value":"The ?timeZone=<IANA> query parameter is read at
          bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a console.warn","source":"explicit-user","statement":"How a test
          selects the configured zone: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to
          'local' with a
          console.warn","status":"approved","supersedes":null,"task_refs":["TASK-002","TASK-003"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-005"],"id":"D-003","owner_repository_id":"sdcorejs-angular","question":"Demo
          location","rationale":"The feature already has its reference page there.","revisit_condition":null,"scope":"repository","selected_value":"The Examples
          tab of the services/date-time doc page","source":"explicit-user","statement":"Demo location: The Examples tab of the services/date-time doc
          page","status":"approved","supersedes":null,"task_refs":["TASK-004","TASK-005"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-008"],"id":"D-004","owner_repository_id":"sdcorejs-angular","question":"Browser
          zones and browsers","rationale":"They are the developer and CI zones and give different 1960 results when the code is
          wrong.","revisit_condition":null,"scope":"repository","selected_value":"Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium
          only","source":"explicit-user","statement":"Browser zones and browsers: Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium
          only","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","AC-010"],"id":"D-005","owner_repository_id":"sdcorejs-angular","question":"Where
          the e2e runs","rationale":"Every later PR keeps the proof.","revisit_condition":null,"scope":"repository","selected_value":"A new job in
          .github/workflows/ci.yml","source":"explicit-user","statement":"Where the e2e runs: A new job in
          .github/workflows/ci.yml","status":"approved","supersedes":null,"task_refs":["TASK-006"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","AC-010"],"id":"D-006","owner_repository_id":"sdcorejs-angular","question":"Branch
          and PR","rationale":"The e2e checks the feature before it merges.","revisit_condition":null,"scope":"repository","selected_value":"Commits on
          claude/core-ui-fixed-timezone (PR #84)","source":"explicit-user","statement":"Branch and PR: Commits on claude/core-ui-fixed-timezone (PR
          #84)","status":"approved","supersedes":null,"task_refs":["TASK-006"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["AC-008"],"id":"D-007","owner_repository_id":"sdcorejs-angular","question":"Coverage
          approach","rationale":"Proves the tests can fail.","revisit_condition":null,"scope":"repository","selected_value":"TDD: the e2e is written first and
          must fail against the current Showcase, then the parameter and the demo make it pass","source":"explicit-user","statement":"Coverage approach: TDD:
          the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it
          pass","status":"approved","supersedes":null,"task_refs":["TASK-001","TASK-002"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003"],"id":"D-008","owner_repository_id":"sdcorejs-angular","question":"Playwright
          version","rationale":"Newest stable release older than two weeks (1.64.0 is 10 days old); the repo pins dependencies
          exactly.","revisit_condition":null,"scope":"repository","selected_value":"@playwright/test 1.63.0, pinned exactly in the Showcase
          devDependencies","source":"approved-spec","statement":"Playwright version: @playwright/test 1.63.0, pinned exactly in the Showcase
          devDependencies","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","R-004"],"id":"D-009","owner_repository_id":"sdcorejs-angular","question":"Server
          for the e2e","rationale":"No new static server; a dev build is enough for the
          e2e.","revisit_condition":null,"scope":"repository","selected_value":"Playwright webServer runs the Showcase npm run start (its prestart already runs
          link:library) on a dedicated port and reuses a running server locally","source":"approved-spec","statement":"Server for the e2e: Playwright webServer
          runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a running server
          locally","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-003"],"id":"D-010","owner_repository_id":"sdcorejs-angular","question":"Selectors
          and file layout","rationale":"Stable locators and no clash with the existing Karma
          setup.","revisit_condition":null,"scope":"repository","selected_value":"Demo outputs carry data-e2e attributes; pickers are driven through Material
          roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and
          tsconfig.app","source":"approved-spec","statement":"Selectors and file layout: Demo outputs carry data-e2e attributes; pickers are driven through
          Material roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and
          tsconfig.app","status":"approved","supersedes":null,"task_refs":["TASK-001","TASK-004"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","R-003","R-004","R-005","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","INV-001","INV-002","INV-003","INV-004"],"id":"D-011","owner_repository_id":"sdcorejs-angular","question":"Ranh
          giới kiểm chứng nào áp dụng?","rationale":"Mọi bằng chứng là test tự động trên trình duyệt và guard của
          repo.","revisit_condition":null,"scope":"repository","selected_value":"none","source":"approved-plan","statement":"Ranh giới kiểm chứng nào áp dụng? →
          none: chỉ Showcase nội bộ, bộ e2e và CI; không có quyền hay API server trong phạm
          vi","status":"approved","supersedes":null,"task_refs":["TASK-001","TASK-002","TASK-003","TASK-004","TASK-005","TASK-006"],"type":"decision","validation_boundary":{"kind":"none","source_refs":["R-001","R-002","R-003","R-004","R-005","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","INV-001","INV-002","INV-003","INV-004"]}},{"evidence_refs":["EVIDENCE-001","EVIDENCE-005"],"id":"INV-001","protected_refs":["R-002","R-003","D-004","AC-001","AC-002","AC-003","AC-004","AC-005","AC-008"],"statement":"Với
          cùng ?timeZone=Asia/Ho_Chi_Minh, mọi giá trị e2e đọc (ô, form.value, payload filter, today/Now) giống hệt nhau khi trình duyệt ở Asia/Bangkok và ở
          UTC.","task_refs":["TASK-001","TASK-004"],"type":"invariant"},{"evidence_refs":["EVIDENCE-002","EVIDENCE-003","EVIDENCE-004"],"id":"INV-002","protected_refs":["R-001","D-002","AC-006","AC-007","AC-009"],"statement":"Param
          timeZone không bao giờ làm Showcase lỗi bootstrap: giá trị sai cho 'local' kèm console.warn, không có param cho
          'local'.","task_refs":["TASK-002","TASK-003"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008"],"id":"INV-003","protected_refs":["R-005","AC-009"],"statement":"Contract
          này không đổi code thư viện: ngoài sd-date-time.md và SYNC-STATUS.md, không file nào dưới versions/ khác bản
          1ff112849.","task_refs":["TASK-004","TASK-005"],"type":"invariant"},{"evidence_refs":["EVIDENCE-009"],"id":"INV-004","protected_refs":["R-004","D-005","AC-010"],"statement":"CI
          chạy bộ e2e trên mọi push và pull request của workflow ci.yml.","task_refs":["TASK-006"],"type":"invariant"}],"revision":2,"schema_version":1}
    goals:
      - id: G-001
        statement: Có bộ e2e Playwright đỏ trước, xanh sau, chạy trên hai múi giờ trình duyệt.
        task_refs:
          - TASK-001
          - TASK-002
      - id: G-002
        statement: Showcase chọn được zone bằng ?timeZone= và có demo đủ để e2e kiểm mọi bề mặt.
        task_refs:
          - TASK-003
          - TASK-004
      - id: G-003
        statement: Tài liệu, mirror v20–v22 và CI giữ bằng chứng lâu dài.
        task_refs:
          - TASK-005
          - TASK-006
    tasks:
      - id: TASK-001
        owner_repository_id: sdcorejs-angular
        dependencies: []
        planned_paths:
          - showcase/package.json
          - showcase/package-lock.json
          - showcase/.gitignore
          - showcase/playwright.config.ts
          - showcase/e2e/time-zone.e2e.ts
        planned_evidence:
          - id: EVIDENCE-001
            record_refs:
              - R-003
              - AC-001
              - AC-002
              - AC-003
              - AC-004
              - AC-005
              - AC-006
              - AC-007
              - AC-008
              - D-001
              - D-004
              - D-007
              - D-008
              - D-009
              - D-010
              - INV-001
        justification_refs:
          - R-003
          - D-001
          - D-004
          - D-007
          - D-008
          - D-009
          - D-010
          - D-011
        enforces_invariant_refs:
          - INV-001
      - id: TASK-002
        owner_repository_id: sdcorejs-angular
        dependencies: []
        planned_paths:
          - showcase/src/app/showcase-time-zone.spec.ts
        planned_evidence:
          - id: EVIDENCE-002
            record_refs:
              - R-001
              - AC-009
              - D-002
              - D-007
              - INV-002
        justification_refs:
          - R-001
          - D-002
          - D-007
          - D-011
        enforces_invariant_refs:
          - INV-002
      - id: TASK-003
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-002
        planned_paths:
          - showcase/src/app/app.config.ts
          - showcase/src/app/showcase-time-zone.ts
        planned_evidence:
          - id: EVIDENCE-003
            record_refs:
              - R-001
              - AC-009
              - D-002
              - INV-002
          - id: EVIDENCE-004
            record_refs:
              - R-001
              - AC-001
              - AC-006
              - AC-007
              - D-002
              - INV-002
        justification_refs:
          - R-001
          - D-002
          - D-011
        enforces_invariant_refs:
          - INV-002
      - id: TASK-004
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-001
          - TASK-003
        planned_paths:
          - showcase/src/app/docs/core/documentation.registry.ts
          - showcase/src/app/docs/core/documentation.registry.spec.ts
          - showcase/src/app/docs/generated/example-manifest.generated.ts
          - showcase/src/app/docs/generated/example-sources.generated.ts
          - showcase/src/app/pages/services/date-time/date-time-demo.component.ts
        planned_evidence:
          - id: EVIDENCE-005
            record_refs:
              - R-002
              - AC-001
              - AC-002
              - AC-003
              - AC-004
              - AC-005
              - AC-006
              - D-003
              - D-010
              - INV-001
          - id: EVIDENCE-006
            record_refs:
              - R-005
              - AC-009
              - D-003
              - INV-003
        justification_refs:
          - R-002
          - R-005
          - D-003
          - D-010
          - D-011
        enforces_invariant_refs:
          - INV-001
          - INV-003
      - id: TASK-005
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-004
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v19/SYNC-STATUS.md
          - versions/v20/SYNC-STATUS.md
          - versions/v21/SYNC-STATUS.md
          - versions/v22/SYNC-STATUS.md
        planned_evidence:
          - id: EVIDENCE-007
            record_refs:
              - R-005
              - AC-009
              - D-003
              - INV-003
          - id: EVIDENCE-008
            record_refs:
              - R-005
              - D-003
              - INV-003
        justification_refs:
          - R-005
          - D-003
          - D-011
        enforces_invariant_refs:
          - INV-003
      - id: TASK-006
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-001
        planned_paths:
          - .github/workflows/ci.yml
        planned_evidence:
          - id: EVIDENCE-009
            record_refs:
              - R-004
              - AC-010
              - D-005
              - D-006
              - INV-004
        justification_refs:
          - R-004
          - D-005
          - D-006
          - D-011
        enforces_invariant_refs:
          - INV-004
    repository_inventory:
      repositories:
        - repository_id: sdcorejs-angular
          existing_paths:
            - showcase/package.json
            - showcase/package-lock.json
            - showcase/.gitignore
            - showcase/src/app/app.config.ts
            - showcase/src/app/docs/core/documentation.registry.ts
            - showcase/src/app/docs/core/documentation.registry.spec.ts
            - showcase/src/app/docs/generated/example-manifest.generated.ts
            - showcase/src/app/docs/generated/example-sources.generated.ts
            - versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md
            - versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md
            - versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md
            - versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md
            - versions/v19/SYNC-STATUS.md
            - versions/v20/SYNC-STATUS.md
            - versions/v21/SYNC-STATUS.md
            - versions/v22/SYNC-STATUS.md
            - .github/workflows/ci.yml
          intended_new_paths:
            - path: showcase/playwright.config.ts
              owner_task_id: TASK-001
            - path: showcase/e2e/time-zone.e2e.ts
              owner_task_id: TASK-001
            - path: showcase/src/app/showcase-time-zone.spec.ts
              owner_task_id: TASK-002
            - path: showcase/src/app/showcase-time-zone.ts
              owner_task_id: TASK-003
            - path: showcase/src/app/pages/services/date-time/date-time-demo.component.ts
              owner_task_id: TASK-004
    critique_history:
      - round: 1
        checker_version: sdcorejs-plan:goal-backward:v1
        blockers: []
        resolved_blockers: []
        unresolved_blockers: []
  validation_map:
    - requirement_id: R-001
      acceptance_criterion_id: AC-001
      invariant_refs:
        - INV-001
        - INV-002
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-001-r-001
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: >-
        the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
        Asia/Ho_Chi_Minh
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-001
      invariant_refs:
        - INV-001
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-001-r-002
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: >-
        the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads
        Asia/Ho_Chi_Minh
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-004
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-002
      invariant_refs:
        - INV-001
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-002-r-002
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: form.value is '1960/05/20 08:00:00'; the ISOString variant gives '1960-05-20T00:00:00.000Z'
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-003
      invariant_refs:
        - INV-001
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-003-r-002
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: >-
        form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN
        '1975-06-12T17:00:00.000Z'
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-004
      invariant_refs:
        - INV-001
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-004-r-002
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-005
      invariant_refs:
        - INV-001
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-005-r-002
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026 00:30
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-001
      acceptance_criterion_id: AC-006
      invariant_refs:
        - INV-002
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-006-r-001
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under UTC
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-006
      invariant_refs:
        - INV-001
        - INV-002
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-006-r-002
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under UTC
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-001
      acceptance_criterion_id: AC-007
      invariant_refs:
        - INV-002
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-007-r-001
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: the page renders, the zone label reads local and the console has a warning containing +07:00
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-003
      acceptance_criterion_id: AC-008
      invariant_refs:
        - INV-001
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - browser-e2e
      case_ids:
        - case-tz-e2e-ac-008-r-003
      planned_command: npm --prefix showcase run e2e
      command_source: package.json
      cwd: .
      evidence_class: FULL_E2E
      automation: automated
      expected_proof: >-
        every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each project
        its own values
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-001
      acceptance_criterion_id: AC-009
      invariant_refs:
        - INV-002
        - INV-003
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - unit
        - integration
      case_ids:
        - case-tz-e2e-ac-009-r-001
      planned_command: >-
        NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts
        --include=src/app/docs/core/documentation.registry.spec.ts && npm run test:showcase-examples && npm run check:sync && node -e "const
        s=require('fs').readFileSync('versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md','utf8');if(!s.includes('?timeZone='))process.exit(1)"
      command_source: project-doc
      cwd: .
      evidence_class: UNIT
      automation: automated
      expected_proof: all pass and sd-date-time.md has the ?timeZone= line
      status: covered
      evidence_refs:
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-005
      acceptance_criterion_id: AC-009
      invariant_refs:
        - INV-002
        - INV-003
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - unit
        - integration
      case_ids:
        - case-tz-e2e-ac-009-r-005
      planned_command: >-
        NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts
        --include=src/app/docs/core/documentation.registry.spec.ts && npm run test:showcase-examples && npm run check:sync && node -e "const
        s=require('fs').readFileSync('versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md','utf8');if(!s.includes('?timeZone='))process.exit(1)"
      command_source: project-doc
      cwd: .
      evidence_class: UNIT
      automation: automated
      expected_proof: all pass and sd-date-time.md has the ?timeZone= line
      status: covered
      evidence_refs:
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-004
      acceptance_criterion_id: AC-010
      invariant_refs:
        - INV-004
      risk: time-zone-consistency
      boundary:
        kind: none
        approval_ref: D-011
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - INV-001
          - INV-002
          - INV-003
          - INV-004
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-tz-e2e-ac-010-r-004
      planned_command: >-
        node -e "const y=require('./versions/v19/node_modules/js-yaml');const
        j=y.load(require('fs').readFileSync('.github/workflows/ci.yml','utf8')).jobs.e2e;const r=(j&&j.steps||[]).map(s=>s.run||'').join(' ');if(!/playwright
        install --with-deps chromium/.test(r)||!/npm run e2e/.test(r))process.exit(1)" && npm run test:ci-selection
      command_source: project-doc
      cwd: .
      evidence_class: UNIT
      automation: automated
      expected_proof: the ci.yml e2e job installs Chromium, runs npm run e2e and passes
      status: covered
      evidence_refs:
        - EVIDENCE-009
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
  contract_id: core-ui-fixed-timezone-e2e
  requirement_id: REQ-core-ui-fixed-timezone-e2e
  approved_spec_path: .sdcorejs/specs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e.md
  approved_spec_hash: sha256:v1:89b50fdb03f43085778713e3637ee0741ff33be6a5cd18bf87221926fd848eef
  approved_spec_reference:
    immutable_identity:
      repository_id: sdcorejs-angular
      repository_relative_path: .sdcorejs/specs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e.md
      artifact_id: spec-core-ui-fixed-timezone-e2e-r1
      revision: 1ff112849923d0f63b518a3f6773acfa531b1235
      approval_hash: sha256:v1:89b50fdb03f43085778713e3637ee0741ff33be6a5cd18bf87221926fd848eef
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: showcase
  execution_host_repository_id: sdcorejs-angular
  integration_owner_repository_id: sdcorejs-angular
  dependency_order:
    - sdcorejs-angular
  gitlink_updates_in_scope: false
  track: test
  stack_profile: core-ui-angular
  task_count: 6
  phase_count: 3
  allowed_paths:
    - showcase/package.json
    - showcase/package-lock.json
    - showcase/.gitignore
    - showcase/playwright.config.ts
    - showcase/e2e/time-zone.e2e.ts
    - showcase/src/app/showcase-time-zone.spec.ts
    - showcase/src/app/app.config.ts
    - showcase/src/app/showcase-time-zone.ts
    - showcase/src/app/docs/core/documentation.registry.ts
    - showcase/src/app/docs/core/documentation.registry.spec.ts
    - showcase/src/app/docs/generated/example-manifest.generated.ts
    - showcase/src/app/docs/generated/example-sources.generated.ts
    - showcase/src/app/pages/services/date-time/date-time-demo.component.ts
    - versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - versions/v22/SYNC-STATUS.md
    - .github/workflows/ci.yml
  prohibited_paths:
    - package.json
    - package-lock.json
    - node_modules/**
    - versions/*/node_modules/**
    - showcase/node_modules/**
    - versions/*/dist/**
    - versions/*/package.json
    - versions/*/package-lock.json
    - published-docs/**
    - published-pages/**
    - CHANGELOG.md
    - showcase/src/app/docs/generated/changelog.generated.ts
    - CLAUDE.md
    - AGENTS.md
    - README.npm.md
    - scripts/**
    - .github/workflows/publish-npm.yml
    - .github/workflows/deploy-pages.yml
  generated_artifacts:
    - showcase/src/app/docs/generated/example-manifest.generated.ts
    - showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - versions/v22/SYNC-STATUS.md
  docs_artifacts:
    - .sdcorejs/docs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e-spec.md
    - .sdcorejs/specs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e.md
    - .sdcorejs/docs/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e-plan.md
    - .sdcorejs/plans/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e.md
    - .sdcorejs/docs/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e-execution.md
  dependency_changes:
    required: true
    packages:
      - '@playwright/test@1.63.0 (devDependency của showcase, pin chính xác)'
    approval_required: true
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: false
    description: null
    approval_required: false
  frontend_architecture:
    required: true
    conformance_invariant_refs:
      - INV-001
      - INV-002
    not_applicable_reason: null
    project_conventions:
      component_style: 'Showcase: standalone component, inline template, OnPush, signals; demo dùng demo-page / demo-section và @if focusedSectionId như các trang service khác'
      folder_convention: >-
        showcase/src/app/pages/<category>/<slug>/<slug>-demo.component.ts; helper app-level ở showcase/src/app/; e2e ở showcase/e2e/*.e2e.ts (ngoài src/, không
        vào tsconfig.app/spec)
      state_convention: signals cục bộ trong demo; FormGroup cho form demo
      service_data_access_convention: inject(SdDateTimeService) để đọc zone đang dùng; sd-table server items() trả mảng cố định và ghi lại pagingReq.filters
      registration_provider_convention: SD_CORE_CONFIGURATION trong app.config.ts (root), dựng từ helper đọc param một lần trước bootstrap
      public_api_barrel_convention: không có public API; Showcase không publish
      test_convention: Karma cho unit Showcase (npm run test -- --include=...), Playwright cho e2e (npm run e2e); registry spec giữ tổng trang và demo section
      evidence_inspected:
        - showcase/src/app/app.config.ts
        - showcase/src/app/app.routes.ts
        - showcase/src/app/pages/services/storage/storage-demo.component.ts
        - showcase/src/app/docs/core/documentation.registry.ts
        - showcase/src/app/docs/core/documentation.registry.spec.ts
        - showcase/package.json
        - showcase/tsconfig.app.json
        - showcase/tsconfig.spec.json
        - .github/workflows/ci.yml
        - scripts/ci-test-selection.test.mjs
    component_tree:
      - route v/:version/services/date-time/:tab → DocsPage (sẵn có) → tab examples → DateTimeDemoComponent (mới)
      - '  demo-section "Zone đang dùng" → nhãn data-e2e=zone'
      - '  demo-section "Form" → sd-date, sd-date[transform=ISOString], sd-datetime, sd-datetime[transform=ISOString], sd-date-range + <pre data-e2e=form-value>'
      - '  demo-section "Table" → sd-table (server, cột date/datetime, external filter daterange) + <pre data-e2e=paging-filters>'
    reuse_decisions:
      - need: khung trang demo
        candidate: showcase/src/app/shared/demo-page.component.ts DemoPageComponent/DemoSectionComponent
        decision: reuse
        reason: mọi trang demo dùng chung
      - need: zone đang dùng
        candidate: '@sdcorejs/angular/services/date-time SdDateTimeService.timeZone'
        decision: reuse
        reason: không tự đọc lại param trong demo
      - need: kiểm id IANA
        candidate: '@sdcorejs/utils DateUtilities.isValidTimeZone'
        decision: reuse
        reason: cùng luật với service (D-002)
    file_decisions:
      - path: showcase/playwright.config.ts
        decision: create
        task: TASK-001
      - path: showcase/e2e/time-zone.e2e.ts
        decision: create
        task: TASK-001
      - path: showcase/package.json
        decision: edit
        task: TASK-001
      - path: showcase/package-lock.json
        decision: edit
        task: TASK-001
      - path: showcase/.gitignore
        decision: edit
        task: TASK-001
      - path: showcase/src/app/showcase-time-zone.spec.ts
        decision: create
        task: TASK-002
      - path: showcase/src/app/showcase-time-zone.ts
        decision: create
        task: TASK-003
      - path: showcase/src/app/app.config.ts
        decision: edit
        task: TASK-003
      - path: showcase/src/app/pages/services/date-time/date-time-demo.component.ts
        decision: create
        task: TASK-004
      - path: showcase/src/app/docs/core/documentation.registry.ts
        decision: edit
        task: TASK-004
      - path: showcase/src/app/docs/core/documentation.registry.spec.ts
        decision: edit
        task: TASK-004
      - path: showcase/src/app/docs/generated/example-manifest.generated.ts
        decision: edit
        task: TASK-004
      - path: showcase/src/app/docs/generated/example-sources.generated.ts
        decision: edit
        task: TASK-004
      - path: versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md
        decision: edit
        task: TASK-005
      - path: versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md
        decision: edit
        task: TASK-005
      - path: versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md
        decision: edit
        task: TASK-005
      - path: versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md
        decision: edit
        task: TASK-005
      - path: versions/v19/SYNC-STATUS.md
        decision: edit
        task: TASK-005
      - path: versions/v20/SYNC-STATUS.md
        decision: edit
        task: TASK-005
      - path: versions/v21/SYNC-STATUS.md
        decision: edit
        task: TASK-005
      - path: versions/v22/SYNC-STATUS.md
        decision: edit
        task: TASK-005
      - path: .github/workflows/ci.yml
        decision: edit
        task: TASK-006
    state_owners:
      - symbol: DateTimeDemoComponent
        state: FormGroup demo, signal pagingFilters
    service_boundaries:
      - symbol: sdShowcaseCoreConfiguration (showcase-time-zone.ts)
        scope: pure_function
      - symbol: SdDateTimeService
        scope: app
    data_flow:
      - location.search → sdShowcaseCoreConfiguration → SD_CORE_CONFIGURATION.timeZone → SdDateTimeService (root)
      - người dùng chọn/gõ ngày → control Core UI → form.value → <pre data-e2e=form-value>
      - external filter daterange → sd-table → SdConvertToPagingReq(dateTime) → items(filterReq, pagingReq) → <pre data-e2e=paging-filters>
    declarations_and_registration:
      - symbol: DateTimeDemoComponent
        mechanism: loadComponent trong defineDocPage của documentation.registry.ts
      - symbol: SD_CORE_CONFIGURATION
        mechanism: app.config.ts providers (root)
    public_exports:
      - 'none: Showcase không publish'
    remaining_contract: Một component demo một trách nhiệm (hiển thị giá trị cho e2e và người đọc); helper thuần đọc param có unit test. Không thêm service hay store.
  agent_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: Không phải track ai-agent.
    contract: null
  verification_strategy:
    package_manager: npm
    commands_planned:
      - command: cd showcase && npm install --save-dev --save-exact @playwright/test@1.63.0 --legacy-peer-deps && npx playwright install chromium
        reason: >-
          TASK-001; cài trong thư mục showcase (không dùng npm --prefix install: quirk thêm package gốc vào lockfile); khôi phục thứ tự dependencies nếu npm sắp
          lại
      - command: npm --prefix showcase run e2e
        reason: 'RED ở TASK-001 rồi GREEN sau TASK-004: AC-001…AC-008'
      - command: >-
          NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts
          --include=src/app/docs/core/documentation.registry.spec.ts
        reason: RED ở TASK-002 rồi GREEN sau TASK-003/004
      - command: npm run generate:showcase-examples
        reason: 'TASK-004: sinh lại manifest/sources của demo'
      - command: >-
          NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=src/app/showcase-time-zone.spec.ts
          --include=src/app/docs/core/documentation.registry.spec.ts && npm run test:showcase-examples && npm run check:sync && node -e "const
          s=require('fs').readFileSync('versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md','utf8');if(!s.includes('?timeZone='))process.exit(1)"
        reason: 'AC-009: unit, registry, guard ví dụ, check:sync, dòng ?timeZone= trong doc'
      - command: npm run sync
        reason: 'TASK-005: lan doc sang v20–v22, rồi đưa file v22 về LF'
      - command: >-
          node -e "const out=require('child_process').execSync('git diff --name-only 1ff112849923d0f63b518a3f6773acfa531b1235 --
          versions').toString().split(String.fromCharCode(10)).filter(Boolean);const
          bad=out.filter(f=>!/services[/]date-time[/]sd-date-time[.]md$/.test(f)&&!/SYNC-STATUS[.]md$/.test(f));if(bad.length){console.error(bad.join(String.fromCharCode(10)));process.exit(1)}"
        reason: 'INV-003: không đổi code thư viện'
      - command: >-
          node -e "const y=require('./versions/v19/node_modules/js-yaml');const
          j=y.load(require('fs').readFileSync('.github/workflows/ci.yml','utf8')).jobs.e2e;const r=(j&&j.steps||[]).map(s=>s.run||'').join(' ');if(!/playwright
          install --with-deps chromium/.test(r)||!/npm run e2e/.test(r))process.exit(1)" && npm run test:ci-selection
        reason: AC-010 (cấu trúc job) + guard ci-test-selection
      - command: npm --prefix showcase run build
        reason: build production của Showcase có demo mới
      - command: npm run test:scripts
        reason: mọi guard script của repo
    commands_skipped:
      - command: eslint cho showcase
        reason: Showcase không có script lint; cấu hình eslint của repo nằm ở versions/v19 và chỉ áp cho thư viện
      - command: Firefox/WebKit
        reason: ngoài phạm vi (spec non-goal)
      - command: chạy job CI trước khi push
        reason: 'job e2e chỉ chạy trên GitHub; AC-010 kiểm cấu trúc local, lần chạy thật là sau push lên PR #84'
    checks: >-
      TDD: e2e và unit đỏ trước; GREEN với param + demo; guard registry/manifest; check:sync; quét không đổi thư viện; cấu trúc job CI; build production
      Showcase
  parallel_candidates:
    allowed: false
    contract: 'Tuần tự: e2e cần param và demo; dùng chung showcase/package.json, registry và một dev server.'
    shared_files:
      - path: showcase/package.json
        owner: TASK-001
        strategy: chỉ TASK-001 sửa
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: sdcorejs-angular
    dependency_order:
      - sdcorejs-angular
    gitlink_updates_in_scope: false
    repositories:
      - repository_id: sdcorejs-angular
        role: library
        module_id: showcase
        available: true
        writable: true
    steps:
      - id: TASK-001
        owner_repository_id: sdcorejs-angular
        action: EDIT
        git_roots:
          - sdcorejs-angular
        depends_on: []
        allowed_paths:
          - showcase/package.json
          - showcase/package-lock.json
          - showcase/.gitignore
          - showcase/playwright.config.ts
          - showcase/e2e/time-zone.e2e.ts
        prohibited_paths:
          - package.json
          - package-lock.json
          - node_modules/**
          - versions/*/node_modules/**
          - showcase/node_modules/**
          - versions/*/dist/**
          - versions/*/package.json
          - versions/*/package-lock.json
          - published-docs/**
          - published-pages/**
          - CHANGELOG.md
          - showcase/src/app/docs/generated/changelog.generated.ts
          - CLAUDE.md
          - AGENTS.md
          - README.npm.md
          - scripts/**
          - .github/workflows/publish-npm.yml
          - .github/workflows/deploy-pages.yml
      - id: TASK-002
        owner_repository_id: sdcorejs-angular
        action: CREATE
        git_roots:
          - sdcorejs-angular
        depends_on: []
        allowed_paths:
          - showcase/src/app/showcase-time-zone.spec.ts
        prohibited_paths:
          - package.json
          - package-lock.json
          - node_modules/**
          - versions/*/node_modules/**
          - showcase/node_modules/**
          - versions/*/dist/**
          - versions/*/package.json
          - versions/*/package-lock.json
          - published-docs/**
          - published-pages/**
          - CHANGELOG.md
          - showcase/src/app/docs/generated/changelog.generated.ts
          - CLAUDE.md
          - AGENTS.md
          - README.npm.md
          - scripts/**
          - .github/workflows/publish-npm.yml
          - .github/workflows/deploy-pages.yml
      - id: TASK-003
        owner_repository_id: sdcorejs-angular
        action: EDIT
        git_roots:
          - sdcorejs-angular
        depends_on:
          - TASK-002
        allowed_paths:
          - showcase/src/app/app.config.ts
          - showcase/src/app/showcase-time-zone.ts
        prohibited_paths:
          - package.json
          - package-lock.json
          - node_modules/**
          - versions/*/node_modules/**
          - showcase/node_modules/**
          - versions/*/dist/**
          - versions/*/package.json
          - versions/*/package-lock.json
          - published-docs/**
          - published-pages/**
          - CHANGELOG.md
          - showcase/src/app/docs/generated/changelog.generated.ts
          - CLAUDE.md
          - AGENTS.md
          - README.npm.md
          - scripts/**
          - .github/workflows/publish-npm.yml
          - .github/workflows/deploy-pages.yml
      - id: TASK-004
        owner_repository_id: sdcorejs-angular
        action: EDIT
        git_roots:
          - sdcorejs-angular
        depends_on:
          - TASK-001
          - TASK-003
        allowed_paths:
          - showcase/src/app/docs/core/documentation.registry.ts
          - showcase/src/app/docs/core/documentation.registry.spec.ts
          - showcase/src/app/docs/generated/example-manifest.generated.ts
          - showcase/src/app/docs/generated/example-sources.generated.ts
          - showcase/src/app/pages/services/date-time/date-time-demo.component.ts
        prohibited_paths:
          - package.json
          - package-lock.json
          - node_modules/**
          - versions/*/node_modules/**
          - showcase/node_modules/**
          - versions/*/dist/**
          - versions/*/package.json
          - versions/*/package-lock.json
          - published-docs/**
          - published-pages/**
          - CHANGELOG.md
          - showcase/src/app/docs/generated/changelog.generated.ts
          - CLAUDE.md
          - AGENTS.md
          - README.npm.md
          - scripts/**
          - .github/workflows/publish-npm.yml
          - .github/workflows/deploy-pages.yml
      - id: TASK-005
        owner_repository_id: sdcorejs-angular
        action: EDIT
        git_roots:
          - sdcorejs-angular
        depends_on:
          - TASK-004
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v20/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v21/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v22/projects/sdcorejs-angular/services/date-time/sd-date-time.md
          - versions/v19/SYNC-STATUS.md
          - versions/v20/SYNC-STATUS.md
          - versions/v21/SYNC-STATUS.md
          - versions/v22/SYNC-STATUS.md
        prohibited_paths:
          - package.json
          - package-lock.json
          - node_modules/**
          - versions/*/node_modules/**
          - showcase/node_modules/**
          - versions/*/dist/**
          - versions/*/package.json
          - versions/*/package-lock.json
          - published-docs/**
          - published-pages/**
          - CHANGELOG.md
          - showcase/src/app/docs/generated/changelog.generated.ts
          - CLAUDE.md
          - AGENTS.md
          - README.npm.md
          - scripts/**
          - .github/workflows/publish-npm.yml
          - .github/workflows/deploy-pages.yml
      - id: TASK-006
        owner_repository_id: sdcorejs-angular
        action: EDIT
        git_roots:
          - sdcorejs-angular
        depends_on:
          - TASK-001
        allowed_paths:
          - .github/workflows/ci.yml
        prohibited_paths:
          - package.json
          - package-lock.json
          - node_modules/**
          - versions/*/node_modules/**
          - showcase/node_modules/**
          - versions/*/dist/**
          - versions/*/package.json
          - versions/*/package-lock.json
          - published-docs/**
          - published-pages/**
          - CHANGELOG.md
          - showcase/src/app/docs/generated/changelog.generated.ts
          - CLAUDE.md
          - AGENTS.md
          - README.npm.md
          - scripts/**
          - .github/workflows/publish-npm.yml
          - .github/workflows/deploy-pages.yml
    contract: >-
      sdcorejs-angular: worktree hiện tại, nhánh claude/core-ui-fixed-timezone (PR #84) từ 1ff112849; commit thêm vào PR #84 khi người dùng yêu cầu; không tag,
      không publish.
  finish_tail:
    contract: 'docs_before_final_branch_ready: execution record trước lần chạy xác minh cuối; verify_before_done rồi branch_ready; no_writes_after_branch_ready: true'
  approval:
    approved: false
    approved_at: null
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

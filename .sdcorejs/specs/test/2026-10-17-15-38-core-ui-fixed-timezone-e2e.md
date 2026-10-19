---
{
  "acceptance_criteria_count": 10,
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-17T08:44:07.000Z",
  "approved_by": "user",
  "artifact_id": "spec-core-ui-fixed-timezone-e2e-r1",
  "artifact_kind": "spec",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "core-ui-fixed-timezone-e2e",
  "commit_policy": "with-change",
  "contract_id": "core-ui-fixed-timezone-e2e",
  "description": "Playwright e2e on the Showcase for ISdCoreConfiguration.timeZone: ?timeZone bootstrap parameter, live demo on services/date-time, sd-date/sd-datetime/sd-date-range/sd-table scenarios under browser zones Asia/Bangkok and UTC, CI e2e job (PR #84).",
  "manual_criteria_count": 0,
  "name": "core-ui-fixed-timezone-e2e",
  "owner": "sdcorejs-spec",
  "owner_module_id": "showcase",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [],
  "parent_repository_id": null,
  "profile_confidence": "high",
  "redaction_applied": false,
  "repository_relative_path": ".sdcorejs/specs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e.md",
  "requirement_id": "REQ-core-ui-fixed-timezone-e2e",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e-spec.md",
  "source_plan": "none",
  "source_revision": "1ff112849923d0f63b518a3f6773acfa531b1235",
  "source_spec": "none",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "test",
  "approval_hash": "sha256:v1:89b50fdb03f43085778713e3637ee0741ff33be6a5cd18bf87221926fd848eef"
}
---
# E2E Playwright cho múi giờ cố định trên Showcase - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - E2E Playwright cho múi giờ cố định trên Showcase - 2026-10-17 15:38

```yaml
spec_context: {
  "source": "sdcorejs-spec",
  "decision_coverage": {
    "schema_version": 1,
    "revision": 1,
    "records": [
      {
        "id": "R-001",
        "type": "requirement",
        "statement": "The Showcase reads the timeZone query parameter once at bootstrap: a valid IANA id (or 'local') becomes SD_CORE_CONFIGURATION.timeZone; no parameter keeps 'local'; an invalid value (numeric offset such as +07:00, unknown id) is ignored, the app runs in 'local' and logs a console.warn naming the value, and the page still renders.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "showcase"
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "The Examples tab of the services/date-time doc page has a live demo: the active zone label; a form with sd-date, sd-date with transform ISOString, sd-datetime, sd-datetime with transform ISOString and sd-date-range plus a live form.value JSON; a server sd-table with date and datetime columns, a row holding the instant 1960-05-19T16:00:00Z and a daterange external filter, plus the pagingReq.filters JSON of the last load; every value read by the e2e has a stable selector.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "showcase"
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "A Playwright e2e suite in showcase/: @playwright/test pinned exactly, playwright.config.ts with two Chromium projects emulating the browser zones Asia/Bangkok and UTC, a webServer running the Showcase and an npm script e2e; e2e files stay out of Karma and tsconfig.app.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "showcase"
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "The .github/workflows/ci.yml workflow has an e2e job on the existing triggers: Node 22.22.3, install and build the v19 library, install the Showcase and run link:library, install Playwright Chromium, run npm run e2e and upload the report as an artifact on failure.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": null
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "The Showcase registry turns services/date-time into a page with a demo (demo section count, generated manifest, registry spec totals); sd-date-time.md has one line on trying the feature in the Showcase with ?timeZone=; every Showcase guard and check:sync stay green.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": null
      },
      {
        "id": "AC-001",
        "type": "acceptance-criterion",
        "statement": "Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString -> the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads Asia/Ho_Chi_Minh",
        "behavior": "Open the date-time demo with ?timeZone=Asia/Ho_Chi_Minh and pick 20/05/1960 in the sd-date picker, also in the sd-date with transform ISOString",
        "expected_result": "the field shows 20/05/1960; its form.value is '1960/05/20'; the ISOString variant gives '1960-05-19T16:00:00.000Z'; the zone label reads Asia/Ho_Chi_Minh",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-002"
        ]
      },
      {
        "id": "AC-002",
        "type": "acceptance-criterion",
        "statement": "Type 20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString -> form.value is '1960/05/20 08:00:00'; the ISOString variant gives '1960-05-20T00:00:00.000Z'",
        "behavior": "Type 20/05/1960 08:00 in sd-datetime and in sd-datetime with transform ISOString",
        "expected_result": "form.value is '1960/05/20 08:00:00'; the ISOString variant gives '1960-05-20T00:00:00.000Z'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-003",
        "type": "acceptance-criterion",
        "statement": "Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter -> form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN '1975-06-12T17:00:00.000Z'",
        "behavior": "Pick 12/06/1975 to 12/06/1975 in the form sd-date-range and in the sd-table daterange external filter",
        "expected_result": "form.value is { from: '1975/06/12', to: '1975/06/12' }; pagingReq.filters holds GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN '1975-06-12T17:00:00.000Z'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-004",
        "type": "acceptance-criterion",
        "statement": "Read the table row holding the instant 1960-05-19T16:00:00Z -> the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00",
        "behavior": "Read the table row holding the instant 1960-05-19T16:00:00Z",
        "expected_result": "the date cell shows 20/05/1960 and the datetime cell shows 20/05/1960 with 00:00:00",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-005",
        "type": "acceptance-criterion",
        "statement": "Fix the page clock at 2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker -> the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026 00:30",
        "behavior": "Fix the page clock at 2026-08-14T17:30:00Z, open the sd-date picker and press Now in the sd-datetime picker",
        "expected_result": "the picker marks day 15 of 08/2026 as today; Now fills 15/08/2026 00:30",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-006",
        "type": "acceptance-criterion",
        "statement": "Open the demo without ?timeZone -> the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under UTC",
        "behavior": "Open the demo without ?timeZone",
        "expected_result": "the zone label reads local; the date cell shows 19/05/1960 in both projects; the datetime cell shows 23:00:00 under Asia/Bangkok and 16:00:00 under UTC",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-002"
        ]
      },
      {
        "id": "AC-007",
        "type": "acceptance-criterion",
        "statement": "Open the demo with ?timeZone=%2B07:00 -> the page renders, the zone label reads local and the console has a warning containing +07:00",
        "behavior": "Open the demo with ?timeZone=%2B07:00",
        "expected_result": "the page renders, the zone label reads local and the console has a warning containing +07:00",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-008",
        "type": "acceptance-criterion",
        "statement": "Run npm run e2e in showcase -> every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each project its own values",
        "behavior": "Run npm run e2e in showcase",
        "expected_result": "every scenario passes in the Asia/Bangkok and the UTC project; AC-001 to AC-005 and AC-007 have the same expectations in both, AC-006 gives each project its own values",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-003"
        ]
      },
      {
        "id": "AC-009",
        "type": "acceptance-criterion",
        "statement": "Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync -> all pass and sd-date-time.md has the ?timeZone= line",
        "behavior": "Run the showcase-time-zone unit spec, documentation.registry.spec.ts, npm run test:showcase-examples, npm run sync and npm run check:sync",
        "expected_result": "all pass and sd-date-time.md has the ?timeZone= line",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001",
          "R-005"
        ]
      },
      {
        "id": "AC-010",
        "type": "acceptance-criterion",
        "statement": "Push to PR #84 -> the ci.yml e2e job installs Chromium, runs npm run e2e and passes",
        "behavior": "Push to PR #84",
        "expected_result": "the ci.yml e2e job installs Chromium, runs npm run e2e and passes",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-004"
        ]
      },
      {
        "id": "A-001",
        "type": "assumption",
        "statement": "Playwright timezoneId (CDP Emulation.setTimezoneOverride) makes Date and Intl in Chromium behave like a host in that zone.",
        "source": "inferred",
        "confidence": "high",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "Both projects would agree even with wrong code, hiding host-zone bugs.",
        "validation_method": "AC-006: without the parameter the two projects must show different datetime cells.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "Documented Playwright context option backed by the CDP override.",
        "impacted_refs": [
          "R-003",
          "AC-006",
          "AC-008"
        ]
      },
      {
        "id": "A-002",
        "type": "assumption",
        "statement": "page.clock.setFixedTime fixes Date.now()/new Date() for the app without blocking Angular timers, which is enough for TODAY and Now.",
        "source": "inferred",
        "confidence": "medium",
        "status": "proposed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "AC-005 would show the wrong day or hang.",
        "validation_method": "AC-005 itself.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "setFixedTime keeps timers running (Playwright clock API).",
        "impacted_refs": [
          "AC-005"
        ]
      },
      {
        "id": "A-003",
        "type": "assumption",
        "statement": "The Showcase dev server starts within the webServer timeout (5 minutes) on a GitHub runner.",
        "source": "inferred",
        "confidence": "medium",
        "status": "proposed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "The CI job times out before the tests run.",
        "validation_method": "The first CI run of AC-010.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "ng serve of the Showcase takes about 1-2 minutes locally.",
        "impacted_refs": [
          "R-004",
          "AC-010"
        ]
      },
      {
        "id": "A-004",
        "type": "assumption",
        "statement": "ubuntu-latest runners install Playwright Chromium with npx playwright install --with-deps chromium.",
        "source": "inferred",
        "confidence": "high",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "The CI job fails before running tests.",
        "validation_method": "The first CI run of AC-010.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "Standard Playwright CI setup.",
        "impacted_refs": [
          "R-004",
          "AC-010"
        ]
      },
      {
        "id": "D-001",
        "type": "decision",
        "statement": "E2E framework and location: Playwright inside showcase/, running against the Showcase app",
        "question": "E2E framework and location",
        "selected_value": "Playwright inside showcase/, running against the Showcase app",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Uses the real doc page, which readers can also try by hand; no extra app to maintain.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-003",
          "AC-008"
        ]
      },
      {
        "id": "D-002",
        "type": "decision",
        "statement": "How a test selects the configured zone: The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a console.warn",
        "question": "How a test selects the configured zone",
        "selected_value": "The ?timeZone=<IANA> query parameter is read at bootstrap into SD_CORE_CONFIGURATION; an invalid value falls back to 'local' with a console.warn",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "SdDateTimeService reads the root injector once, so the zone must exist before bootstrap; a bad value must not break the docs site.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-001",
          "AC-006",
          "AC-007"
        ]
      },
      {
        "id": "D-003",
        "type": "decision",
        "statement": "Demo location: The Examples tab of the services/date-time doc page",
        "question": "Demo location",
        "selected_value": "The Examples tab of the services/date-time doc page",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The feature already has its reference page there.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-002",
          "R-005"
        ]
      },
      {
        "id": "D-004",
        "type": "decision",
        "statement": "Browser zones and browsers: Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium only",
        "question": "Browser zones and browsers",
        "selected_value": "Two Playwright projects with timezoneId 'Asia/Bangkok' and 'UTC'; Chromium only",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "They are the developer and CI zones and give different 1960 results when the code is wrong.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-003",
          "AC-008"
        ]
      },
      {
        "id": "D-005",
        "type": "decision",
        "statement": "Where the e2e runs: A new job in .github/workflows/ci.yml",
        "question": "Where the e2e runs",
        "selected_value": "A new job in .github/workflows/ci.yml",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Every later PR keeps the proof.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-004",
          "AC-010"
        ]
      },
      {
        "id": "D-006",
        "type": "decision",
        "statement": "Branch and PR: Commits on claude/core-ui-fixed-timezone (PR #84)",
        "question": "Branch and PR",
        "selected_value": "Commits on claude/core-ui-fixed-timezone (PR #84)",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The e2e checks the feature before it merges.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-004",
          "AC-010"
        ]
      },
      {
        "id": "D-007",
        "type": "decision",
        "statement": "Coverage approach: TDD: the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it pass",
        "question": "Coverage approach",
        "selected_value": "TDD: the e2e is written first and must fail against the current Showcase, then the parameter and the demo make it pass",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Proves the tests can fail.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "AC-008"
        ]
      },
      {
        "id": "D-008",
        "type": "decision",
        "statement": "Playwright version: @playwright/test 1.63.0, pinned exactly in the Showcase devDependencies",
        "question": "Playwright version",
        "selected_value": "@playwright/test 1.63.0, pinned exactly in the Showcase devDependencies",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Newest stable release older than two weeks (1.64.0 is 10 days old); the repo pins dependencies exactly.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-003"
        ]
      },
      {
        "id": "D-009",
        "type": "decision",
        "statement": "Server for the e2e: Playwright webServer runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a running server locally",
        "question": "Server for the e2e",
        "selected_value": "Playwright webServer runs the Showcase npm run start (its prestart already runs link:library) on a dedicated port and reuses a running server locally",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "No new static server; a dev build is enough for the e2e.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-003",
          "R-004"
        ]
      },
      {
        "id": "D-010",
        "type": "decision",
        "statement": "Selectors and file layout: Demo outputs carry data-e2e attributes; pickers are driven through Material roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and tsconfig.app",
        "question": "Selectors and file layout",
        "selected_value": "Demo outputs carry data-e2e attributes; pickers are driven through Material roles and aria labels; e2e files are showcase/e2e/*.e2e.ts and stay out of Karma (*.spec.ts) and tsconfig.app",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Stable locators and no clash with the existing Karma setup.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-002",
          "R-003"
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
          }
        ],
        "tombstones": []
      }
    ]
  },
  "goal_backward_review": {
    "schema_version": 1,
    "mode": "sdcorejs-plan:goal-backward",
    "stage": "spec",
    "future_gaps": [
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-001.task_refs",
        "record_id": "AC-001",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-002.task_refs",
        "record_id": "AC-002",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-003.task_refs",
        "record_id": "AC-003",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-004.task_refs",
        "record_id": "AC-004",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-005.task_refs",
        "record_id": "AC-005",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-006.task_refs",
        "record_id": "AC-006",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-007.task_refs",
        "record_id": "AC-007",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-008.task_refs",
        "record_id": "AC-008",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-009.task_refs",
        "record_id": "AC-009",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-010.task_refs",
        "record_id": "AC-010",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-001.task_refs",
        "record_id": "R-001",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-002.task_refs",
        "record_id": "R-002",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-003.task_refs",
        "record_id": "R-003",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-004.task_refs",
        "record_id": "R-004",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-005.task_refs",
        "record_id": "R-005",
        "message": "a requirement must map to at least one planned task"
      }
    ]
  },
  "architecture_gate": {
    "valid": true,
    "required": false,
    "status": "not-applicable",
    "signals": [],
    "bypass": {
      "kind": "test-only",
      "rationale": "Only the unpublished Showcase app, its e2e suite and CI change; no library code, public API, data model or @sdcorejs/angular dependency changes, and Playwright is a Showcase devDependency."
    },
    "rationale": "Only the unpublished Showcase app, its e2e suite and CI change; no library code, public API, data model or @sdcorejs/angular dependency changes, and Playwright is a Showcase devDependency."
  },
  "contract_id": "core-ui-fixed-timezone-e2e",
  "requirement_id": "REQ-core-ui-fixed-timezone-e2e",
  "approved_spec_path": "",
  "approved_spec_hash": "",
  "supersedes": null,
  "parent_references": [],
  "related_contract": "core-ui-fixed-timezone (.sdcorejs/specs/angular/2026-10-16-15-37-core-ui-fixed-timezone-r3.md)",
  "target_root": ".",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "showcase",
  "execution_host_repository_id": "sdcorejs-angular",
  "track": "test",
  "stack_profile": "core-ui-angular",
  "profile_confidence": "high",
  "source_requirement_context": "brainstorming 2026-10-17: Playwright e2e on the Showcase for timeZone (?timeZone param, services/date-time demo, Asia/Bangkok + UTC, CI job, PR #84, TDD)",
  "acceptance_criteria_count": 10,
  "manual_criteria_count": 0,
  "non_goals": [
    "Core Legacy port",
    "e2e for unrelated components",
    "library behavior changes",
    "screenshots or visual regression",
    "Firefox, WebKit, mobile"
  ],
  "risks": [
    "flaky picker interaction",
    "CI job duration",
    "page.clock and Angular timers",
    "versioned doc routes"
  ],
  "assumptions": [
    "A-001 Playwright timezoneId (CDP Emulation.setTimezoneOverride) makes Date and Intl in Chromium behave like a host in that zone.",
    "A-002 page.clock.setFixedTime fixes Date.now()/new Date() for the app without blocking Angular timers, which is enough for TODAY and Now.",
    "A-003 The Showcase dev server starts within the webServer timeout (5 minutes) on a GitHub runner.",
    "A-004 ubuntu-latest runners install Playwright Chromium with npx playwright install --with-deps chromium."
  ],
  "redaction_applied": false,
  "approval": {
    "approved": false,
    "approved_at": null,
    "approval_source": "explicit-user-choice"
  },
  "change_control": {
    "revision": 1,
    "supersedes": null,
    "change_reason": null
  }
}
```

## Problem & Goals

PR #84 thêm `ISdCoreConfiguration.timeZone`. Hiện mọi bằng chứng là Karma spec chạy trong Chrome headless ở múi giờ của máy: gọi service, hàm hoặc component qua TestBed, không có test nào thao tác picker thật qua giao diện, và không đổi được múi giờ trình duyệt theo từng test. Repo chưa có hạ tầng e2e.

Mục tiêu: chứng minh trên trình duyệt thật, trước khi PR #84 merge, rằng khi app cấu hình `timeZone: 'Asia/Ho_Chi_Minh'` thì người dùng chọn hoặc gõ ngày qua giao diện ra đúng `form.value`, đúng hiển thị và đúng payload filter của `sd-table`, **giống hệt nhau** dù trình duyệt đang ở Asia/Bangkok hay UTC. Đồng thời giữ được bằng chứng đó lâu dài bằng một job CI.

Người dùng: maintainer Core UI (review PR, chặn hồi quy) và người đọc tài liệu (thử tính năng trên Showcase bằng `?timeZone=`).

## Requirements

- R-001 - Showcase đọc query param `timeZone` **một lần lúc bootstrap**. Id IANA hợp lệ (hoặc `local`) được đưa vào `SD_CORE_CONFIGURATION.timeZone`. Không có param thì cấu hình giữ nguyên (`'local'`). Giá trị không hợp lệ (offset số như `+07:00`, id lạ) bị bỏ qua: app chạy `'local'` và ghi `console.warn` có nêu giá trị đó; trang vẫn render. (explicit-user, active, owner `sdcorejs-angular` / `showcase`)
- R-002 - Tab Examples của trang tài liệu `services/date-time` có demo sống: nhãn zone đang dùng; một form với `sd-date`, `sd-date` có `transform="ISOString"`, `sd-datetime`, `sd-datetime` có `transform="ISOString"`, `sd-date-range`, kèm JSON `form.value` cập nhật trực tiếp; một `sd-table` kiểu server có cột date và datetime, một dòng có instant `1960-05-19T16:00:00Z`, một external filter kiểu `daterange`, kèm JSON `pagingReq.filters` của lần tải gần nhất. Mọi giá trị e2e đọc có selector ổn định. (explicit-user, active, owner `showcase`)
- R-003 - Bộ e2e Playwright trong `showcase/`: `@playwright/test` pin chính xác, `playwright.config.ts` với hai project Chromium giả lập múi giờ trình duyệt `Asia/Bangkok` và `UTC`, `webServer` chạy Showcase, script `npm run e2e`; file e2e tách khỏi Karma và `tsconfig.app`. (explicit-user, active, owner `showcase`)
- R-004 - `.github/workflows/ci.yml` có job e2e chạy trên cùng trigger với CI hiện có: Node 22.22.3, cài và build lib v19, cài Showcase và `link:library`, cài Chromium của Playwright, chạy `npm run e2e`, đẩy report lên artifact khi lỗi. (explicit-user, active, owner `sdcorejs-angular`)
- R-005 - Registry Showcase đổi trang `services/date-time` từ trang chỉ có tài liệu sang trang có demo (số demo section, manifest sinh tự động, tổng trong registry spec); `sd-date-time.md` có một dòng hướng dẫn thử trên Showcase bằng `?timeZone=`; mọi guard Showcase và `check:sync` vẫn xanh. (explicit-user, active, owner `sdcorejs-angular`)

## Decisions

- D-001 - Khung e2e: Playwright đặt trong `showcase/`, chạy trên chính app Showcase. (explicit-user, approved; lý do: dùng trang tài liệu thật, người đọc thử tay được; không thêm app phải bảo trì)
- D-002 - Cách đặt zone: param `?timeZone=<IANA>` đọc lúc bootstrap vào `SD_CORE_CONFIGURATION`; giá trị sai thì `'local'` + `console.warn`. (explicit-user, approved; lý do: service chỉ đọc root injector một lần, nên zone phải có trước bootstrap; giá trị sai không được làm sập trang tài liệu)
- D-003 - Vị trí demo: tab Examples của trang `services/date-time`. (explicit-user, approved)
- D-004 - Múi giờ trình duyệt: mỗi kịch bản chạy trong hai project Playwright `timezoneId: 'Asia/Bangkok'` và `timezoneId: 'UTC'`; chỉ Chromium. (explicit-user, approved; lý do: hai zone này là máy dev và CI, và cho kết quả khác nhau ở năm 1960 nếu code sai)
- D-005 - CI: thêm job mới vào `ci.yml`. (explicit-user, approved)
- D-006 - Nhánh: commit lên `claude/core-ui-fixed-timezone`, tức PR #84. (explicit-user, approved, scope repository)
- D-007 - Cách viết: TDD. E2E viết trước và phải RED trên Showcase hiện tại (chưa có param, chưa có demo), rồi thêm param và demo cho GREEN. (explicit-user, approved, scope repository)
- D-008 - Phiên bản Playwright: `@playwright/test` `1.63.0`, pin chính xác trong `devDependencies` của Showcase. (approved-spec; lý do: bản ổn định mới nhất đã ra hơn hai tuần — `1.64.0` mới 10 ngày; repo pin chính xác các dependency)
- D-009 - Server cho e2e: `webServer` của Playwright chạy `npm run start` của Showcase (đã có `prestart` gọi `link:library`) ở một cổng riêng, dùng lại server đang chạy khi chạy local. (approved-spec; lý do: không thêm static server mới; build dev đủ cho e2e)
- D-010 - Selector và file: giá trị demo mang thuộc tính `data-e2e`; picker thao tác qua role và aria-label của Material; file e2e là `showcase/e2e/*.e2e.ts`, không lọt vào Karma (`*.spec.ts`) hay `tsconfig.app`. (approved-spec, scope repository)

## Assumptions

- A-001 - `timezoneId` của Playwright (CDP `Emulation.setTimezoneOverride`) làm `Date` và `Intl` trong Chromium chạy như máy ở zone đó. (inferred, confidence high, confirmed; nếu sai: kết quả hai project không khác nhau dù code sai; kiểm bằng AC-006 — không có param thì hai project phải ra giá trị khác nhau)
- A-002 - `page.clock.setFixedTime` cố định `Date.now()`/`new Date()` của app mà không chặn timer của Angular, đủ cho kịch bản TODAY và Now. (inferred, confidence medium, proposed; nếu sai: AC-005 lệch giờ hoặc treo; kiểm bằng chính AC-005)
- A-003 - Dev server Showcase khởi động trong giới hạn thời gian của `webServer` trên runner GitHub (đặt timeout 5 phút). (inferred, confidence medium, proposed; nếu sai: job CI timeout; kiểm bằng lần chạy CI đầu tiên của AC-010)
- A-004 - Runner `ubuntu-latest` cài được Chromium của Playwright bằng `npx playwright install --with-deps chromium`. (inferred, confidence high, confirmed; nếu sai: job CI đỏ trước khi chạy test)

## Architecture gate classification

- Status: not-applicable
- Signals: none
- Rationale/bypass: `test-only` — chỉ thay đổi Showcase (app nội bộ, không publish), bộ e2e của nó và CI. Không đổi code thư viện, public API, mô hình dữ liệu hay dependency của `@sdcorejs/angular`; Playwright chỉ là `devDependency` của Showcase.

## Non-goals

- Port tính năng sang Core Legacy (`@sd-angular/core`) — contract kế tiếp.
- E2E cho các component không liên quan đến múi giờ.
- Đổi hành vi thư viện `@sdcorejs/angular`.
- Ảnh chụp màn hình hay visual regression.
- Firefox, WebKit, mobile.

## Architecture

- **Bootstrap:** một hàm thuần trong Showcase đọc `timeZone` từ `location.search`, kiểm bằng `DateUtilities.isValidTimeZone` (hoặc `'local'`), trả cấu hình core. `app.config.ts` dùng kết quả đó khi tạo `SHOWCASE_CORE_CONFIG`. Hàm có unit test Karma riêng (hợp lệ, không có, không hợp lệ + cảnh báo).
- **Demo:** component mới `pages/services/date-time/date-time-demo.component.ts` theo mẫu `demo-page` / `demo-section` của các trang service khác. Form là `FormGroup` thường; JSON `form.value` và `pagingReq.filters` hiển thị trong `<pre data-e2e="…">`. `sd-table` type `server` với `items(filterReq, pagingReq)` ghi lại `pagingReq.filters` rồi trả một mảng cố định. Zone đang dùng lấy từ `inject(SdDateTimeService).timeZone`.
- **Registry:** `services/date-time` chuyển sang `defineDocPage` với `loadComponent` và `demoSectionCount`; manifest sinh lại bằng `npm run generate:showcase-examples`; tổng demo section trong registry spec cập nhật.
- **E2E:** `showcase/playwright.config.ts` khai báo hai project và `webServer`. `showcase/e2e/time-zone.e2e.ts` mở `/v/<version>/services/date-time/examples` (có hoặc không có `?timeZone=`), thao tác picker (chọn năm/tháng/ngày), gõ datetime, mở external filter của table, đọc các `data-e2e`. Kịch bản TODAY dùng `page.clock.setFixedTime('2026-08-14T17:30:00Z')` trước khi mở trang.
- **CI:** job `e2e` độc lập với các job hiện có, cache npm theo lockfile root, v19 và showcase.

## Stack profile and technology assumptions

- Track: test
- Stack profile: core-ui-angular
- Profile evidence: Showcase dùng `@sdcorejs/angular` qua `link:library`; `showcase/src/app/app.config.ts` cung cấp `SD_CORE_CONFIGURATION`.
- Technology assumptions: Playwright `1.63.0`, Chromium; Angular 19 dev server của Showcase; Node 22.22.3 (explicit); `page.clock` (inferred, A-002).

## File structure

- `showcase/package.json`, `showcase/package-lock.json` - thêm `@playwright/test` 1.63.0 và script `e2e`.
- `showcase/playwright.config.ts` - tạo mới: hai project, `webServer`, report.
- `showcase/e2e/time-zone.e2e.ts` - tạo mới: các kịch bản AC-001 đến AC-007.
- `showcase/src/app/showcase-time-zone.ts` - tạo mới: đọc và kiểm param `timeZone`.
- `showcase/src/app/showcase-time-zone.spec.ts` - tạo mới: unit test của hàm trên.
- `showcase/src/app/app.config.ts` - sửa: dùng cấu hình zone từ param.
- `showcase/src/app/pages/services/date-time/date-time-demo.component.ts` - tạo mới: demo.
- `showcase/src/app/docs/core/documentation.registry.ts`, `documentation.registry.spec.ts` - sửa: trang có demo, tổng demo section.
- `showcase/src/app/docs/generated/example-manifest.generated.ts`, `example-sources.generated.ts` - sinh lại.
- `showcase/tsconfig.app.json`, `showcase/tsconfig.spec.json` (nếu cần) - loại `e2e/**`.
- `showcase/.gitignore` - bỏ qua `test-results/`, `playwright-report/`.
- `.github/workflows/ci.yml` - sửa: job `e2e`.
- `versions/v19/projects/sdcorejs-angular/services/date-time/sd-date-time.md` - sửa: dòng thử trên Showcase (rồi `npm run sync` sang v20–v22).

## Acceptance criteria

- AC-001 - `?timeZone=Asia/Ho_Chi_Minh`, chọn 20/05/1960 trong picker của `sd-date` -> ô hiện `20/05/1960`; `form.value` của ô đó là `'1960/05/20'`; bản `transform="ISOString"` chọn cùng ngày cho `'1960-05-19T16:00:00.000Z'`; nhãn zone là `Asia/Ho_Chi_Minh`.
- AC-002 - Gõ `20/05/1960 08:00` vào `sd-datetime` -> `form.value` là `'1960/05/20 08:00:00'`; bản `transform="ISOString"` cho `'1960-05-20T00:00:00.000Z'`.
- AC-003 - Chọn 12/06/1975 → 12/06/1975 trong `sd-date-range` của form và trong external filter `daterange` của `sd-table` -> `form.value` là `{ from: '1975/06/12', to: '1975/06/12' }`; `pagingReq.filters` có `GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z'` và `LESS_THAN '1975-06-12T17:00:00.000Z'`.
- AC-004 - Dòng có instant `1960-05-19T16:00:00Z` -> ô date hiện `20/05/1960`, ô datetime hiện `20/05/1960` và `00:00:00`.
- AC-005 - Đồng hồ trang cố định `2026-08-14T17:30:00Z` -> ngày hôm nay được đánh dấu trong picker của `sd-date` là 15 (tháng 08/2026); nút Now của `sd-datetime` điền `15/08/2026 00:30`.
- AC-006 - Không có `?timeZone` -> nhãn zone là `local`; ô date hiện `19/05/1960` ở cả hai project; ô datetime hiện `23:00:00` (Asia/Bangkok) và `16:00:00` (UTC).
- AC-007 - `?timeZone=%2B07:00` -> trang vẫn render, nhãn zone là `local`, console có cảnh báo chứa `+07:00`.
- AC-008 - Chạy `npm run e2e` trong `showcase` -> mọi kịch bản pass ở cả project `Asia/Bangkok` và `UTC`; AC-001 đến AC-005 và AC-007 có cùng kỳ vọng ở hai project, AC-006 ra đúng giá trị riêng của từng project.
- AC-009 - Chạy unit test `showcase-time-zone.spec.ts`, `documentation.registry.spec.ts`, `npm run test:showcase-examples`, `npm run sync` và `npm run check:sync` -> tất cả pass; `sd-date-time.md` có dòng hướng dẫn `?timeZone=`.
- AC-010 - Push lên PR #84 -> job `e2e` trong `ci.yml` cài Chromium, chạy `npm run e2e` và pass.

## Risks & mitigations

- **Risk:** thao tác picker flaky (animation, điều hướng nhiều trang năm về 1960). -> **Mitigation:** Showcase chạy animation thật, nên test chờ theo trạng thái (`toBeVisible`, `aria-*`) thay vì chờ thời gian; điều hướng năm bằng nút của Material; `retries: 1` trên CI và 0 ở local.
- **Risk:** job CI chậm (build lib + dev server + Chromium). -> **Mitigation:** cache npm, chỉ Chromium, job chạy song song với các job khác.
- **Risk:** `page.clock` xung đột với timer của Angular. -> **Mitigation:** dùng `setFixedTime` (không đóng băng timer); nếu vẫn lỗi thì giới hạn AC-005 vào một trang riêng mở sau khi đặt đồng hồ.
- **Risk:** route có segment version (`v/:version`) khác giữa local và CI. -> **Mitigation:** e2e mở trang qua route không có version (`/services/date-time/examples` nếu redirect có sẵn) hoặc đọc version từ registry lúc chạy.

## Out of scope (deferred)

- E2E cho Core Legacy - defer until bắt đầu contract port Legacy.
- Mở rộng e2e sang Firefox/WebKit - defer until có yêu cầu hỗ trợ trình duyệt cụ thể.

## Decisions captured during review

- The spec was approved as drafted.

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)

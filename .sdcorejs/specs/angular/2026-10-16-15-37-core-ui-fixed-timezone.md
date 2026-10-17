---
{
  "acceptance_criteria_count": 17,
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-16T08:42:41.000Z",
  "approved_by": "user",
  "artifact_id": "spec-core-ui-fixed-timezone-r1",
  "artifact_kind": "spec",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "core-ui-fixed-timezone",
  "commit_policy": "with-change",
  "contract_id": "core-ui-fixed-timezone",
  "description": "Opt-in fixed IANA time zone for Core UI: ISdCoreConfiguration.timeZone (SdTimeZone open union), SdDateTimeService in services/date-time, @sdcorejs/utils 1.3.0 TimeZoneOptions and zoned helpers, wired into pipes, date inputs, table filters/export, import-excel, form-generic and history.",
  "manual_criteria_count": 0,
  "name": "core-ui-fixed-timezone",
  "owner": "sdcorejs-spec",
  "owner_module_id": null,
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [],
  "parent_repository_id": null,
  "profile_confidence": "high",
  "redaction_applied": false,
  "repository_relative_path": ".sdcorejs/specs/angular/2026-10-16-15-37-core-ui-fixed-timezone.md",
  "requirement_id": "REQ-core-ui-fixed-timezone",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/angular/2026-10-16-15-37-core-ui-fixed-timezone-spec.md",
  "source_plan": "none",
  "source_revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
  "source_spec": "none",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:79b4532da5d98e150359b2428755b04d6da70e9e4c74eda4461378865365f0de"
}
---
# Múi giờ cố định cho toàn hệ thống (utils + Core UI) - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Múi giờ cố định cho toàn hệ thống (utils + Core UI) - 2026-10-16 15:37

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
        "statement": "@sdcorejs/utils 1.3.0 adds an opt-in TimeZoneOptions ({ timeZone?: string }, an IANA id) to toFormat, parseDateInput, parseFrom, begin and end, plus isValidTimeZone, toZonedParts and fromZonedParts; calls without the option behave exactly as 1.2.6; no global or module-level state; the dates-time-zones guide, README and changeset describe the API.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-ultis",
        "owner_module_id": "src/fns/date"
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "ISdCoreConfiguration gains timeZone?: SdTimeZone, an open literal union of 'local', common IANA ids and any other IANA id; unset or 'local' keeps the current browser-local behavior; a numeric offset or unknown id throws a clear Error on the first use of the date/time service.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "configurations"
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "@sdcorejs/angular/services/date-time exports SdDateTimeService (providedIn root) bound to the configured zone: timeZone, toFormat, parse, parseFrom, begin, end, today, toWallClock and fromWallClock.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "services/date-time"
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "Display surfaces format an instant as the wall clock of the configured zone: sdFormatDate, sdFormatDatetime (and through them sd-table date/datetime/time cells), history viewDateTime, form-generic read-only display and builder inspector default display, and the import-excel column transform pipe.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "pipes"
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "sd-date, sd-date-range and sd-datetime show an instant model as the calendar day or wall clock of the configured zone, keep picker and control Date objects as wall-clock carriers, serialize transform (ISOString/UTCString) from that wall clock in the zone (00:00 of the day for date inputs), and resolve TODAY in the zone.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms"
      },
      {
        "id": "R-006",
        "type": "requirement",
        "statement": "sd-table server filters (date, daterange, datetime and range payloads), client-side day filtering and Excel export compute in the configured zone: a day filter is [start of the day, start of the next calendar day) in the zone and a datetime filter reads the zone-less value as wall clock in the zone.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "components/table"
      },
      {
        "id": "R-007",
        "type": "requirement",
        "statement": "With a configured zone, import-excel reads Date cells (exceljs UTC fields = Excel wall clock) and text dates parsed with the column format as wall clock in the zone and stores the ISO instant; unset keeps the current output.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "components/import-excel"
      },
      {
        "id": "R-008",
        "type": "requirement",
        "statement": "form-generic resolves the today min/max boundary of datetime fields to the start/end of today in the configured zone.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "components/form-generic"
      },
      {
        "id": "R-009",
        "type": "requirement",
        "statement": "Calendar-only values and wall-clock carriers never shift: date-only strings, zone-less wall-clock strings emitted without transform, sd-chip-calendar values, forms/time values and picker/control Date objects show and emit the same digits under every configuration.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms"
      },
      {
        "id": "R-010",
        "type": "requirement",
        "statement": "Core UI docs (sd-core.configuration, new sd-date-time, pipes, sd-date, sd-datetime, sd-date-range, sd-table filters, import-excel), the CHANGELOG Unreleased entry and the Showcase documentation registry describe timeZone; every Angular line pins @sdcorejs/utils 1.3.0; v20-v22 come only from npm run sync.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": null
      },
      {
        "id": "AC-001",
        "type": "acceptance-criterion",
        "statement": "Call DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm', { timeZone }) with 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok' on any host time zone -> returns '20/05/1960 00:00' and '19/05/1960 23:00'",
        "behavior": "Call DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm', { timeZone }) with 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok' on any host time zone",
        "expected_result": "returns '20/05/1960 00:00' and '19/05/1960 23:00'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-002",
        "type": "acceptance-criterion",
        "statement": "Call fromZonedParts, begin, end and parseDateInput with timeZone 'Asia/Ho_Chi_Minh' around 1960 and the 1975-06-13 offset change -> fromZonedParts({ year: 1960, month: 5, day: 20 }) is 1960-05-19T16:00:00.000Z; the repeated 23:30 of 1975-06-12 resolves to the earlier offset 1975-06-12T15:30:00.000Z; begin/end of 1975/06/12 are 1975-06-11T16:00:00.000Z and 1975-06-12T16:59:59.999Z; parseDateInput('1960/05/20 08:00:00') is 1960-05-20T00:00:00.000Z; an instant with Z is returned unchanged; toZonedParts of each result gives back the input parts",
        "behavior": "Call fromZonedParts, begin, end and parseDateInput with timeZone 'Asia/Ho_Chi_Minh' around 1960 and the 1975-06-13 offset change",
        "expected_result": "fromZonedParts({ year: 1960, month: 5, day: 20 }) is 1960-05-19T16:00:00.000Z; the repeated 23:30 of 1975-06-12 resolves to the earlier offset 1975-06-12T15:30:00.000Z; begin/end of 1975/06/12 are 1975-06-11T16:00:00.000Z and 1975-06-12T16:59:59.999Z; parseDateInput('1960/05/20 08:00:00') is 1960-05-20T00:00:00.000Z; an instant with Z is returned unchanged; toZonedParts of each result gives back the input parts",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-003",
        "type": "acceptance-criterion",
        "statement": "Call isValidTimeZone with valid and invalid values -> true for 'Asia/Ho_Chi_Minh', 'UTC' and 'Etc/GMT-7'; false for '+07:00', 'GMT+7', 'UTC+07:00', 'Mars/Base', 'local', '' and non-strings",
        "behavior": "Call isValidTimeZone with valid and invalid values",
        "expected_result": "true for 'Asia/Ho_Chi_Minh', 'UTC' and 'Etc/GMT-7'; false for '+07:00', 'GMT+7', 'UTC+07:00', 'Mars/Base', 'local', '' and non-strings",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-004",
        "type": "acceptance-criterion",
        "statement": "Run the 1.2.6 date test suite without edits and call every changed function without options, and with two different zones in alternating order -> the unchanged suite passes, results without options equal 1.2.6, and each zoned call depends only on its own option",
        "behavior": "Run the 1.2.6 date test suite without edits and call every changed function without options, and with two different zones in alternating order",
        "expected_result": "the unchanged suite passes, results without options equal 1.2.6, and each zoned call depends only on its own option",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-005",
        "type": "acceptance-criterion",
        "statement": "Provide SD_CORE_CONFIGURATION with timeZone '+07:00' or 'Mars/Base', then inject SdDateTimeService; repeat with 'Asia/Ho_Chi_Minh', 'local' and no timeZone -> the invalid values throw an Error naming the value and asking for an IANA id or 'local'; the valid values inject without error",
        "behavior": "Provide SD_CORE_CONFIGURATION with timeZone '+07:00' or 'Mars/Base', then inject SdDateTimeService; repeat with 'Asia/Ho_Chi_Minh', 'local' and no timeZone",
        "expected_result": "the invalid values throw an Error naming the value and asking for an IANA id or 'local'; the valid values inject without error",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-006",
        "type": "acceptance-criterion",
        "statement": "Use SdDateTimeService with zone 'Asia/Ho_Chi_Minh' and 'Asia/Bangkok' and a mocked clock of 2026-08-14T17:30:00Z on any host zone -> toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy') is '20/05/1960' (VN) and '19/05/1960' (BKK); today() is a local Date of 2026-08-15 for both; toWallClock('1960-05-20T00:00:00Z') has local fields 1960-05-20 08:00 (VN); fromWallClock(new Date(1960, 4, 20, 8, 0)) is 1960-05-20T00:00:00.000Z (VN); timeZone reports the configured id",
        "behavior": "Use SdDateTimeService with zone 'Asia/Ho_Chi_Minh' and 'Asia/Bangkok' and a mocked clock of 2026-08-14T17:30:00Z on any host zone",
        "expected_result": "toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy') is '20/05/1960' (VN) and '19/05/1960' (BKK); today() is a local Date of 2026-08-15 for both; toWallClock('1960-05-20T00:00:00Z') has local fields 1960-05-20 08:00 (VN); fromWallClock(new Date(1960, 4, 20, 8, 0)) is 1960-05-20T00:00:00.000Z (VN); timeZone reports the configured id",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-003"
        ]
      },
      {
        "id": "AC-007",
        "type": "acceptance-criterion",
        "statement": "Render '1960-05-19T16:00:00Z' through sdFormatDate, sdFormatDatetime, an sd-table datetime cell, history viewDateTime and form-generic display with zone 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok' -> VN shows '20/05/1960', '20/05/1960 00:00:00' and '00:00 20/05/1960'; BKK shows '19/05/1960', '19/05/1960 23:00:00' and '23:00 19/05/1960'",
        "behavior": "Render '1960-05-19T16:00:00Z' through sdFormatDate, sdFormatDatetime, an sd-table datetime cell, history viewDateTime and form-generic display with zone 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok'",
        "expected_result": "VN shows '20/05/1960', '20/05/1960 00:00:00' and '00:00 20/05/1960'; BKK shows '19/05/1960', '19/05/1960 23:00:00' and '23:00 19/05/1960'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-004"
        ]
      },
      {
        "id": "AC-008",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' and transform 'ISOString', pick 20/05/1960 and 15/08/2026 in sd-date and as both ends of sd-date-range; bind the model '1960-05-19T16:00:00Z' under VN and under BKK -> the inputs emit '1960-05-19T16:00:00.000Z' and '2026-08-14T17:00:00.000Z'; the bound model shows 20/05/1960 under VN and 19/05/1960 under BKK",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and transform 'ISOString', pick 20/05/1960 and 15/08/2026 in sd-date and as both ends of sd-date-range; bind the model '1960-05-19T16:00:00Z' under VN and under BKK",
        "expected_result": "the inputs emit '1960-05-19T16:00:00.000Z' and '2026-08-14T17:00:00.000Z'; the bound model shows 20/05/1960 under VN and 19/05/1960 under BKK",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ]
      },
      {
        "id": "AC-009",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh', enter 20/05/1960 08:00 in sd-datetime with transform 'ISOString' and without transform; bind the model '1960-05-20T00:00:00Z' -> it emits '1960-05-20T00:00:00.000Z' with transform and '1960/05/20 08:00:00' without; the bound model shows '20/05/1960 08:00'",
        "behavior": "With zone 'Asia/Ho_Chi_Minh', enter 20/05/1960 08:00 in sd-datetime with transform 'ISOString' and without transform; bind the model '1960-05-20T00:00:00Z'",
        "expected_result": "it emits '1960-05-20T00:00:00.000Z' with transform and '1960/05/20 08:00:00' without; the bound model shows '20/05/1960 08:00'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ]
      },
      {
        "id": "AC-010",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z on any host zone, set min and max to 'TODAY' on sd-date, sd-date-range and sd-datetime -> the date bounds are the calendar day 15/08/2026 and the datetime bound is the wall clock 15/08/2026 00:30",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z on any host zone, set min and max to 'TODAY' on sd-date, sd-date-range and sd-datetime",
        "expected_result": "the date bounds are the calendar day 15/08/2026 and the datetime bound is the wall clock 15/08/2026 00:30",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ]
      },
      {
        "id": "AC-011",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh', build sd-table server filters for date 1960/05/20, daterange 1975/06/12-1975/06/12 and datetime '1960/05/20 08:00:00' -> date gives GREATER_OR_EQUAL '1960-05-19T16:00:00.000Z' and LESS_THAN '1960-05-20T16:00:00.000Z'; daterange gives GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN '1975-06-12T17:00:00.000Z'; datetime gives '1960-05-20T00:00:00.000Z'",
        "behavior": "With zone 'Asia/Ho_Chi_Minh', build sd-table server filters for date 1960/05/20, daterange 1975/06/12-1975/06/12 and datetime '1960/05/20 08:00:00'",
        "expected_result": "date gives GREATER_OR_EQUAL '1960-05-19T16:00:00.000Z' and LESS_THAN '1960-05-20T16:00:00.000Z'; daterange gives GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z' and LESS_THAN '1975-06-12T17:00:00.000Z'; datetime gives '1960-05-20T00:00:00.000Z'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-006"
        ]
      },
      {
        "id": "AC-012",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh', filter rows client-side by date 1960/05/20 and export the instant '1960-05-19T16:00:00Z' to Excel as date and datetime columns -> the row with that instant matches the day; the export writes '1960/05/20' and '1960/05/20 00:00:00'",
        "behavior": "With zone 'Asia/Ho_Chi_Minh', filter rows client-side by date 1960/05/20 and export the instant '1960-05-19T16:00:00Z' to Excel as date and datetime columns",
        "expected_result": "the row with that instant matches the day; the export writes '1960/05/20' and '1960/05/20 00:00:00'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-006"
        ]
      },
      {
        "id": "AC-013",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh', import a Date cell for 1960-05-20 (exceljs value new Date(Date.UTC(1960, 4, 20))) and a text cell '20/05/1960' with format 'dd/MM/yyyy'; repeat with no timeZone -> with the zone both rows store '1960-05-19T16:00:00.000Z' and show 20/05/1960; without the zone the Date cell stores '1960-05-20T00:00:00.000Z' as today",
        "behavior": "With zone 'Asia/Ho_Chi_Minh', import a Date cell for 1960-05-20 (exceljs value new Date(Date.UTC(1960, 4, 20))) and a text cell '20/05/1960' with format 'dd/MM/yyyy'; repeat with no timeZone",
        "expected_result": "with the zone both rows store '1960-05-19T16:00:00.000Z' and show 20/05/1960; without the zone the Date cell stores '1960-05-20T00:00:00.000Z' as today",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-007"
        ]
      },
      {
        "id": "AC-014",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z, render a form-generic datetime field whose min and max are 'today' -> min is '2026-08-14T17:00:00.000Z' and max is '2026-08-15T16:59:59.999Z'",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z, render a form-generic datetime field whose min and max are 'today'",
        "expected_result": "min is '2026-08-14T17:00:00.000Z' and max is '2026-08-15T16:59:59.999Z'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-008"
        ]
      },
      {
        "id": "AC-015",
        "type": "acceptance-criterion",
        "statement": "Run the existing specs of the pipes, sd-date, sd-date-range, sd-datetime, sd-table filter/format/export, import-excel and form-generic with no timeZone and with 'local' -> they pass without edits and produce the same values as before the change",
        "behavior": "Run the existing specs of the pipes, sd-date, sd-date-range, sd-datetime, sd-table filter/format/export, import-excel and form-generic with no timeZone and with 'local'",
        "expected_result": "they pass without edits and produce the same values as before the change",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002",
          "R-009"
        ]
      },
      {
        "id": "AC-016",
        "type": "acceptance-criterion",
        "statement": "Under 'Asia/Ho_Chi_Minh', 'Asia/Bangkok' and no timeZone, show and emit the date-only model '1960/05/20', the zone-less model '1960/05/20 08:00:00' (no transform), sd-chip-calendar value ['1960/05/20'] and a forms/time value '08:00' -> every configuration shows and emits the same digits",
        "behavior": "Under 'Asia/Ho_Chi_Minh', 'Asia/Bangkok' and no timeZone, show and emit the date-only model '1960/05/20', the zone-less model '1960/05/20 08:00:00' (no transform), sd-chip-calendar value ['1960/05/20'] and a forms/time value '08:00'",
        "expected_result": "every configuration shows and emits the same digits",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-009"
        ]
      },
      {
        "id": "AC-017",
        "type": "acceptance-criterion",
        "statement": "Run npm run sync, npm run check:sync, the Showcase documentation registry test and a pin check of every versions/v*/projects/sdcorejs-angular/package.json -> all pass; every line pins @sdcorejs/utils 1.3.0; sd-date-time.md is registered; docs and the CHANGELOG describe timeZone",
        "behavior": "Run npm run sync, npm run check:sync, the Showcase documentation registry test and a pin check of every versions/v*/projects/sdcorejs-angular/package.json",
        "expected_result": "all pass; every line pins @sdcorejs/utils 1.3.0; sd-date-time.md is registered; docs and the CHANGELOG describe timeZone",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-010"
        ]
      },
      {
        "id": "A-001",
        "type": "assumption",
        "statement": "Every browser supported by Angular 19-22 implements Intl.DateTimeFormat timeZone with IANA history (ICU tzdata), including Asia/Ho_Chi_Minh +08 for 1959-12-31..1975-06-13.",
        "source": "inferred",
        "confidence": "high",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "A browser with stale tzdata would convert 1960-1975 values with the wrong offset.",
        "validation_method": "Karma (ChromeHeadless) specs assert 1960 and 1975 values; Node 22 Intl gives the same offsets.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "Intl timeZone support is ES2017 baseline; verified with Node 22 Intl on 2026-10-16.",
        "impacted_refs": [
          "R-001",
          "R-003"
        ]
      },
      {
        "id": "A-002",
        "type": "assumption",
        "statement": "exceljs returns a date cell as a JS Date whose UTC fields equal the Excel wall clock.",
        "source": "inferred",
        "confidence": "medium",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "Imported Date cells would shift by the host offset under a configured zone.",
        "validation_method": "An import-excel spec reads a workbook with a real date cell through the excel service.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "exceljs converts the Excel serial with UTC arithmetic; to be confirmed by the spec.",
        "impacted_refs": [
          "R-007"
        ]
      },
      {
        "id": "A-003",
        "type": "assumption",
        "statement": "@sdcorejs/utils 1.3.0 can be published from sdcorejs-ultis before the Core UI release that pins it.",
        "source": "inferred",
        "confidence": "high",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "The Core UI release would be blocked until utils is published.",
        "validation_method": "npm view @sdcorejs/utils@1.3.0 before tagging Core UI.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "Same maintainers; utils already ships through its own release workflow (1.2.6).",
        "impacted_refs": [
          "R-001",
          "R-010"
        ]
      },
      {
        "id": "A-004",
        "type": "assumption",
        "statement": "Existing consumers never set timeZone, so the default local behavior keeps the change non-breaking.",
        "source": "inferred",
        "confidence": "high",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "A consumer would see shifted dates without opting in.",
        "validation_method": "AC-015 runs the existing specs unchanged with no timeZone.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "timeZone is a new optional field with default local.",
        "impacted_refs": [
          "R-002",
          "R-009"
        ]
      },
      {
        "id": "D-001",
        "type": "decision",
        "statement": "Where do the zone-aware convert/parse functions live: @sdcorejs/utils adds opt-in timeZone options and zoned helpers (release 1.3.0); Core UI adds the configuration and a service bound to it and wires every date surface",
        "question": "Where do the zone-aware convert/parse functions live",
        "selected_value": "@sdcorejs/utils adds opt-in timeZone options and zoned helpers (release 1.3.0); Core UI adds the configuration and a service bound to it and wires every date surface",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "One date engine shared with NestJS/Next backends; no second date implementation in Core UI.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-003",
          "AC-001"
        ]
      },
      {
        "id": "D-002",
        "type": "decision",
        "statement": "Where is the time zone configured: ISdCoreConfiguration.timeZone, provided through SD_CORE_CONFIGURATION next to format.number and language (no new provide function)",
        "question": "Where is the time zone configured",
        "selected_value": "ISdCoreConfiguration.timeZone, provided through SD_CORE_CONFIGURATION next to format.number and language (no new provide function)",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Reuses the existing global configuration convention; replaces the provideSdXxx idea from brainstorming.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-002",
          "AC-005"
        ]
      },
      {
        "id": "D-003",
        "type": "decision",
        "statement": "Type of the timeZone value: Open literal union SdTimeZone: 'local' | 'UTC' | 'Asia/Ho_Chi_Minh' | 'Asia/Bangkok' | 'Asia/Jakarta' | 'Asia/Singapore' | 'Asia/Kuala_Lumpur' | 'Asia/Manila' | 'Asia/Shanghai' | 'Asia/Hong_Kong' | 'Asia/Taipei' | 'Asia/Tokyo' | 'Asia/Seoul' | 'Asia/Kolkata' | 'Asia/Dubai' | 'Australia/Sydney' | 'Europe/London' | 'Europe/Paris' | 'Europe/Berlin' | 'America/New_York' | 'America/Chicago' | 'America/Los_Angeles' | (string & {})",
        "question": "Type of the timeZone value",
        "selected_value": "Open literal union SdTimeZone: 'local' | 'UTC' | 'Asia/Ho_Chi_Minh' | 'Asia/Bangkok' | 'Asia/Jakarta' | 'Asia/Singapore' | 'Asia/Kuala_Lumpur' | 'Asia/Manila' | 'Asia/Shanghai' | 'Asia/Hong_Kong' | 'Asia/Taipei' | 'Asia/Tokyo' | 'Asia/Seoul' | 'Asia/Kolkata' | 'Asia/Dubai' | 'Australia/Sydney' | 'Europe/London' | 'Europe/Paris' | 'Europe/Berlin' | 'America/New_York' | 'America/Chicago' | 'America/Los_Angeles' | (string & {})",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Autocomplete for common zones without blocking other IANA ids; Core UI public API uses literal unions, not TS enums.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-002",
          "AC-005"
        ]
      },
      {
        "id": "D-004",
        "type": "decision",
        "statement": "Per-component or per-pipe override: None: one system configuration only",
        "question": "Per-component or per-pipe override",
        "selected_value": "None: one system configuration only",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Smallest API; an override can be added later without breaking.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-004",
          "R-005"
        ]
      },
      {
        "id": "D-005",
        "type": "decision",
        "statement": "Meaning of each value kind under a configured zone: An instant (Z/offset) shows as wall clock in the zone; a zone-less wall-clock string is read as wall clock in the zone when it becomes an instant; a date-only value stays a calendar date (00:00 in the zone when serialized as an instant); today/now are taken in the zone; unset keeps local behavior",
        "question": "Meaning of each value kind under a configured zone",
        "selected_value": "An instant (Z/offset) shows as wall clock in the zone; a zone-less wall-clock string is read as wall clock in the zone when it becomes an instant; a date-only value stays a calendar date (00:00 in the zone when serialized as an instant); today/now are taken in the zone; unset keeps local behavior",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Keeps calendar dates free of time zones and makes every instant show the system wall clock.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-004",
          "R-005",
          "R-006",
          "R-009",
          "AC-007",
          "AC-016"
        ]
      },
      {
        "id": "D-006",
        "type": "decision",
        "statement": "How the Material datepicker works with a configured zone: Picker and control Date objects are wall-clock carriers built from local fields; conversion happens only between the model and the control; the zone is never applied to a carrier",
        "question": "How the Material datepicker works with a configured zone",
        "selected_value": "Picker and control Date objects are wall-clock carriers built from local fields; conversion happens only between the model and the control; the zone is never applied to a carrier",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Material and the date adapters only understand local Date objects; converting at the boundary keeps them unchanged.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-005",
          "R-009",
          "AC-008",
          "AC-009"
        ]
      },
      {
        "id": "D-007",
        "type": "decision",
        "statement": "Public shape of the Core UI service: SdDateTimeService in the new entry point @sdcorejs/angular/services/date-time with timeZone, toFormat, parse, parseFrom, begin, end, today, toWallClock and fromWallClock; method names mirror DateUtilities; parse/parseFrom/begin/end/toWallClock return null and toFormat returns an empty string for invalid input",
        "question": "Public shape of the Core UI service",
        "selected_value": "SdDateTimeService in the new entry point @sdcorejs/angular/services/date-time with timeZone, toFormat, parse, parseFrom, begin, end, today, toWallClock and fromWallClock; method names mirror DateUtilities; parse/parseFrom/begin/end/toWallClock return null and toFormat returns an empty string for invalid input",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Same verbs as DateUtilities so consumers do not learn a second vocabulary; services/* is where Core UI exposes injectable helpers.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-003",
          "AC-006"
        ]
      },
      {
        "id": "D-008",
        "type": "decision",
        "statement": "Public shape of the utils additions: TimeZoneOptions { timeZone?: string } as the last optional argument of toFormat, parseDateInput, parseFrom, begin and end; isValidTimeZone(value); toZonedParts(value, timeZone) returning { year, month (1-12), day, hour, minute, second, millisecond } or null; fromZonedParts(parts, timeZone) returning a Date; a repeated wall clock resolves to the earlier offset and a skipped one moves forward (Temporal 'compatible')",
        "question": "Public shape of the utils additions",
        "selected_value": "TimeZoneOptions { timeZone?: string } as the last optional argument of toFormat, parseDateInput, parseFrom, begin and end; isValidTimeZone(value); toZonedParts(value, timeZone) returning { year, month (1-12), day, hour, minute, second, millisecond } or null; fromZonedParts(parts, timeZone) returning a Date; a repeated wall clock resolves to the earlier offset and a skipped one moves forward (Temporal 'compatible')",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-ultis",
        "rationale": "Follows the existing AddMonthsOptions pattern; compatible disambiguation matches Temporal and java.time defaults.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-002",
          "AC-003"
        ]
      },
      {
        "id": "D-009",
        "type": "decision",
        "statement": "Invalid timeZone handling: Reject numeric offsets ('+07:00', 'GMT+7', 'UTC+07:00') even though Intl accepts '+07:00', reject unknown ids; SdDateTimeService throws on first use with a message naming the value",
        "question": "Invalid timeZone handling",
        "selected_value": "Reject numeric offsets ('+07:00', 'GMT+7', 'UTC+07:00') even though Intl accepts '+07:00', reject unknown ids; SdDateTimeService throws on first use with a message naming the value",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "A fixed offset has no history and reproduces the 1960 bug; with SD_CORE_CONFIGURATION there is no bootstrap hook, so the first use is the earliest check.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-002",
          "AC-005"
        ]
      },
      {
        "id": "D-010",
        "type": "decision",
        "statement": "Test approach: TDD; specs assert fixed strings and instants that do not depend on the host time zone (VN vs BKK for 1960, 1975 and 2026, mocked clock for today); unset-config regression with unchanged existing specs",
        "question": "Test approach",
        "selected_value": "TDD; specs assert fixed strings and instants that do not depend on the host time zone (VN vs BKK for 1960, 1975 and 2026, mocked clock for today); unset-config regression with unchanged existing specs",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "CI runs in UTC and developers run in Asia/Bangkok; tests must pass in both.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "AC-004",
          "AC-015"
        ]
      },
      {
        "id": "D-011",
        "type": "decision",
        "statement": "Surfaces that keep their current behavior: audit-diff, autoid-inspector and the api-contract-builder preview keep raw ISO strings; sd-chip-calendar stays calendar-only; the layout today-info line is deferred",
        "question": "Surfaces that keep their current behavior",
        "selected_value": "audit-diff, autoid-inspector and the api-contract-builder preview keep raw ISO strings; sd-chip-calendar stays calendar-only; the layout today-info line is deferred",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Those ISO outputs are technical, not wall-clock displays; chip-calendar never handles instants.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-009",
          "AC-016"
        ]
      },
      {
        "id": "D-012",
        "type": "decision",
        "statement": "Import-excel Date cells under a configured zone: Read the UTC fields of the exceljs Date as Excel wall clock and convert them in the zone; without a zone keep the current toISOString output",
        "question": "Import-excel Date cells under a configured zone",
        "selected_value": "Read the UTC fields of the exceljs Date as Excel wall clock and convert them in the zone; without a zone keep the current toISOString output",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Excel stores wall clock without a zone; converting it in the system zone matches sd-date transform output.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-007",
          "AC-013"
        ]
      },
      {
        "id": "D-013",
        "type": "decision",
        "statement": "Dependency version: @sdcorejs/angular pins @sdcorejs/utils 1.3.0 exactly in every Angular line, as it pins 1.2.5 today",
        "question": "Dependency version",
        "selected_value": "@sdcorejs/angular pins @sdcorejs/utils 1.3.0 exactly in every Angular line, as it pins 1.2.5 today",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Core UI already pins utils exactly; 1.3.0 is a minor release because the change only adds options.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-010",
          "AC-017"
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
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-011.task_refs",
        "record_id": "AC-011",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-012.task_refs",
        "record_id": "AC-012",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-013.task_refs",
        "record_id": "AC-013",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-014.task_refs",
        "record_id": "AC-014",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-015.task_refs",
        "record_id": "AC-015",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-016.task_refs",
        "record_id": "AC-016",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-017.task_refs",
        "record_id": "AC-017",
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
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-006.task_refs",
        "record_id": "R-006",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-007.task_refs",
        "record_id": "R-007",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-008.task_refs",
        "record_id": "R-008",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-009.task_refs",
        "record_id": "R-009",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-010.task_refs",
        "record_id": "R-010",
        "message": "a requirement must map to at least one planned task"
      }
    ]
  },
  "architecture_gate": {
    "valid": true,
    "required": true,
    "status": "required",
    "signals": [
      "conflicting-independent-unit-decisions",
      "cross-repository-boundary",
      "public-api-contract"
    ],
    "bypass": null,
    "rationale": "Adds public API in two repositories (@sdcorejs/utils options and helpers; Core UI ISdCoreConfiguration.timeZone, SdTimeZone and SdDateTimeService), makes Core UI depend on a new utils minor, and about fifteen independent date surfaces must apply the same wall-clock semantics."
  },
  "contract_id": "core-ui-fixed-timezone",
  "requirement_id": "REQ-core-ui-fixed-timezone",
  "approved_spec_path": "",
  "approved_spec_hash": "",
  "supersedes": null,
  "parent_references": [],
  "target_root": ".",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": null,
  "execution_host_repository_id": "sdcorejs-angular",
  "dependency_repository_ids": [
    "sdcorejs-ultis"
  ],
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "profile_confidence": "high",
  "source_requirement_context": "brainstorming 2026-10-16: fixed system time zone (utils + Core UI, open union, no override, SD_CORE_CONFIGURATION)",
  "acceptance_criteria_count": 17,
  "manual_criteria_count": 0,
  "non_goals": [
    "Legacy @sd-angular/core port",
    "per-component or per-pipe timeZone override",
    "backend changes",
    "migration of stored data",
    "fixed-offset time zones"
  ],
  "risks": [
    "boundary conversion missed in one surface",
    "DST gaps of the viewer zone for picker carriers",
    "data created by backends with a fixed +07:00",
    "utils release ordering",
    "Intl formatter cost in tables"
  ],
  "assumptions": [
    "A-001 Every browser supported by Angular 19-22 implements Intl.DateTimeFormat timeZone with IANA history (ICU tzdata), including Asia/Ho_Chi_Minh +08 for 1959-12-31..1975-06-13.",
    "A-002 exceljs returns a date cell as a JS Date whose UTC fields equal the Excel wall clock.",
    "A-003 @sdcorejs/utils 1.3.0 can be published from sdcorejs-ultis before the Core UI release that pins it.",
    "A-004 Existing consumers never set timeZone, so the default local behavior keeps the change non-breaking."
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

Core UI và `@sdcorejs/utils` 1.2.x tính mọi giá trị ngày giờ theo múi giờ local của trình duyệt. Một instant chỉ đúng khi người tạo và người xem dùng cùng luật múi giờ cho thời điểm đó.

Theo tzdata, `Asia/Ho_Chi_Minh` là +08 trong giai đoạn 1959-12-31 đến 1975-06-13, còn `Asia/Bangkok` luôn là +07. Ví dụ ngày 20/05/1960 chọn ở VN với `transform="ISOString"`:

- giá trị lưu là `1960-05-19T16:00:00Z`;
- người xem ở VN thấy 20/05/1960;
- người xem ở Thái Lan thấy 19/05/1960 23:00, tức lùi một ngày;
- đặt offset cố định `+07:00` cho người xem cũng cho ra 19/05/1960, vì offset cố định không mang lịch sử.

Bài toán liên quan cả date lẫn datetime. Với datetime, mọi người xem lệch 1 giờ (với dữ liệu 1960–1975) so với giờ VN, và lệch cả ngày nếu giờ gần nửa đêm. Filter datetime của table cũng ra kết quả khác nhau tuỳ máy.

Mục tiêu: consumer chọn được một múi giờ IANA cố định cho cả hệ thống. Khi đó mọi chỗ convert/parse của Core UI cho cùng một kết quả trên mọi máy, kể cả máy đặt múi giờ khác. Consumer không cấu hình thì hành vi giữ nguyên như hiện tại.

Thành công khi:

- cấu hình `timeZone: 'Asia/Ho_Chi_Minh'` làm dữ liệu 1960 hiển thị, lọc và gửi đi giống nhau ở VN, ở Thái Lan và trên CI chạy UTC;
- code app có hàm convert/parse đã gắn sẵn múi giờ hệ thống để dùng lại;
- consumer không cấu hình không thấy thay đổi nào.

## Requirements

- R-001 - `@sdcorejs/utils` 1.3.0 thêm `TimeZoneOptions` (`{ timeZone?: string }`, giá trị là IANA id) làm tham số tuỳ chọn cuối cho `toFormat`, `parseDateInput`, `parseFrom`, `begin` và `end`. Thêm ba hàm mới: `isValidTimeZone`, `toZonedParts`, `fromZonedParts`. Gọi không truyền option thì kết quả giống hệt 1.2.6. Không có state global hay state cấp module. Guide `dates-time-zones`, README và changeset của utils mô tả API mới. Nguồn: người dùng. Owner: `sdcorejs-ultis` (`src/fns/date`).
- R-002 - `ISdCoreConfiguration` có thêm `timeZone?: SdTimeZone`. Kiểu này là union literal mở gồm `'local'`, các IANA id hay dùng và mọi IANA id khác. Không đặt, hoặc đặt `'local'`, thì hành vi giữ như hiện tại. Đặt offset số hoặc id không tồn tại thì lần dùng đầu tiên của service ngày giờ throw lỗi rõ ràng. Nguồn: người dùng. Owner: `configurations`.
- R-003 - Entry point mới `@sdcorejs/angular/services/date-time` export `SdDateTimeService` (`providedIn: 'root'`), gắn sẵn múi giờ đã cấu hình. Service có `timeZone`, `toFormat`, `parse`, `parseFrom`, `begin`, `end`, `today`, `toWallClock` và `fromWallClock`. Nguồn: người dùng. Owner: `services/date-time`.
- R-004 - Mọi chỗ hiển thị đưa instant về giờ đồng hồ của múi giờ đã cấu hình:
  - pipe `sdFormatDate`, `sdFormatDatetime`, và qua đó các ô date/datetime/time của `sd-table`;
  - pipe `viewDateTime` của history;
  - phần hiển thị read-only của form-generic, và giá trị mặc định hiển thị trong inspector của builder;
  - pipe column transform của import-excel.

  Nguồn: người dùng. Owner: `pipes` và các component kể trên.
- R-005 - `sd-date`, `sd-date-range`, `sd-datetime`:
  - model là instant thì hiện thành ngày lịch hoặc giờ đồng hồ theo múi giờ đã cấu hình;
  - `Date` của picker và control luôn là "vật mang giờ đồng hồ" (wall-clock carrier);
  - `transform` (`'ISOString'`/`'UTCString'`) serialize từ giờ đồng hồ đó theo múi giờ đã cấu hình; input dạng ngày lấy 00:00 của ngày;
  - `'TODAY'` tính theo múi giờ đã cấu hình.

  Nguồn: người dùng. Owner: `forms`.
- R-006 - `sd-table` tính theo múi giờ đã cấu hình ở ba chỗ:
  - filter gửi server (date, daterange, datetime và payload range);
  - lọc theo ngày ở phía client;
  - export Excel.

  Filter theo ngày là khoảng [đầu ngày, đầu ngày lịch kế tiếp) trong múi giờ đó. Filter datetime đọc giá trị không có múi giờ như giờ đồng hồ trong múi giờ đó. Nguồn: người dùng. Owner: `components/table`.
- R-007 - Khi có cấu hình múi giờ, import-excel đọc hai loại ô ngày như giờ đồng hồ trong múi giờ đó rồi lưu instant ISO:
  - ô kiểu Date: các field UTC của exceljs chính là giờ đồng hồ trong Excel;
  - ô text được parse theo `format` của cột.

  Không cấu hình thì kết quả như hiện tại. Nguồn: người dùng. Owner: `components/import-excel`.
- R-008 - Biên `today` (min/max) của field datetime trong form-generic là đầu ngày và cuối ngày hôm nay theo múi giờ đã cấu hình. Nguồn: người dùng. Owner: `components/form-generic`.
- R-009 - Các giá trị sau không bao giờ bị lệch, và hiển thị/emit cùng chữ số ở mọi cấu hình:
  - giá trị chỉ có ngày lịch;
  - chuỗi giờ đồng hồ không có múi giờ, emit khi không có `transform`;
  - giá trị của `sd-chip-calendar`;
  - giá trị của `forms/time`;
  - `Date` của picker và control.

  Nguồn: người dùng. Owner: `forms`.
- R-010 - Docs, CHANGELOG và rollout:
  - docs của Core UI (`sd-core.configuration`, `sd-date-time` mới, các pipe, `sd-date`, `sd-datetime`, `sd-date-range`, filter của `sd-table`, `sd-import-excel`), mục `## [Unreleased]` của CHANGELOG và registry tài liệu của Showcase mô tả `timeZone`;
  - mọi line Angular pin `@sdcorejs/utils` 1.3.0;
  - v20–v22 chỉ được sinh bằng `npm run sync`.

  Nguồn: người dùng. Owner: `sdcorejs-angular`.

## Decisions

- D-001 - Hàm convert/parse theo múi giờ đặt ở đâu → `@sdcorejs/utils` thêm option và helper (release 1.3.0); Core UI thêm configuration, service gắn sẵn múi giờ, và nối vào mọi chỗ xử lý date. Nguồn: người dùng. Lý do: một bộ xử lý date dùng chung được cho cả BE NestJS/Next; Core UI không có bộ xử lý date thứ hai.
- D-002 - Cấu hình múi giờ ở đâu → `ISdCoreConfiguration.timeZone`, consumer khai qua `SD_CORE_CONFIGURATION` cạnh `format.number` và `language`. Không thêm hàm `provide*` mới. Nguồn: người dùng (thay cho ý `provideSdXxx` lúc brainstorm). Lý do: dùng lại quy ước cấu hình global đang có (API consistency).
- D-003 - Kiểu giá trị → union literal mở `SdTimeZone`:
  - `'local'` và `'UTC'`;
  - châu Á: `'Asia/Ho_Chi_Minh'`, `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Singapore'`, `'Asia/Kuala_Lumpur'`, `'Asia/Manila'`, `'Asia/Shanghai'`, `'Asia/Hong_Kong'`, `'Asia/Taipei'`, `'Asia/Tokyo'`, `'Asia/Seoul'`, `'Asia/Kolkata'`, `'Asia/Dubai'`;
  - nơi khác: `'Australia/Sydney'`, `'Europe/London'`, `'Europe/Paris'`, `'Europe/Berlin'`, `'America/New_York'`, `'America/Chicago'`, `'America/Los_Angeles'`;
  - `(string & {})` cho mọi IANA id còn lại.

  Nguồn: người dùng (danh sách cụ thể duyệt cùng spec). Lý do: có autocomplete cho các múi giờ hay dùng mà không chặn IANA id khác. Public API của Core UI chỉ dùng union literal, không dùng TS `enum`.
- D-004 - Override theo component hoặc pipe → không có, chỉ một cấu hình hệ thống. Nguồn: người dùng. Lý do: API nhỏ nhất; thêm override sau không làm vỡ gì.
- D-005 - Ý nghĩa từng loại giá trị khi có cấu hình múi giờ → xem bảng ở mục Architecture. Nguồn: người dùng.
- D-006 - Datepicker của Material → `Date` của picker và control là vật mang giờ đồng hồ, dựng từ field local. Chỉ quy đổi ở biên giữa model và control. Không bao giờ áp múi giờ lên vật mang. Nguồn: người dùng. Lý do: Material và các date adapter chỉ hiểu `Date` local; quy đổi ở biên để không phải đụng vào chúng.
- D-007 - Hình dạng public của service Core UI → `SdDateTimeService` ở entry point mới `@sdcorejs/angular/services/date-time`.
  - Tên hàm theo `DateUtilities`.
  - Input sai: `parse`, `parseFrom`, `begin`, `end` và `toWallClock` trả `null`; `toFormat` trả chuỗi rỗng.

  Nguồn: duyệt cùng spec. Lý do: cùng động từ với `DateUtilities` nên consumer không phải học bộ tên thứ hai; `services/*` là nơi Core UI đặt các helper inject được.
- D-008 - Hình dạng public phần thêm vào utils:
  - `TimeZoneOptions { timeZone?: string }` làm tham số tuỳ chọn cuối;
  - `isValidTimeZone(value)`;
  - `toZonedParts(value, timeZone)` trả `{ year, month (1-12), day, hour, minute, second, millisecond }` hoặc `null`;
  - `fromZonedParts(parts, timeZone)` trả `Date`;
  - giờ đồng hồ lặp lại (lùi đồng hồ) lấy offset sớm hơn; giờ bị bỏ qua (tiến đồng hồ) dời về sau. Đây là cách `'compatible'` của Temporal.

  Nguồn: duyệt cùng spec. Owner: `sdcorejs-ultis`. Lý do: theo mẫu `AddMonthsOptions` đang có; `'compatible'` khớp mặc định của Temporal và java.time.
- D-009 - Xử lý `timeZone` sai → từ chối offset số (`'+07:00'`, `'GMT+7'`, `'UTC+07:00'`) dù `Intl` nhận `'+07:00'`, và từ chối id không tồn tại. `SdDateTimeService` throw ở lần dùng đầu tiên, thông báo nêu giá trị sai. Nguồn: duyệt cùng spec. Lý do: offset cố định không mang lịch sử nên tái hiện đúng lỗi 1960; `SD_CORE_CONFIGURATION` là token thuần, không có hook bootstrap, nên lần dùng đầu là chỗ sớm nhất kiểm được.
- D-010 - Cách test → TDD. Spec assert chuỗi và instant cố định, không phụ thuộc múi giờ của máy chạy test: VN và BKK cho dữ liệu 1960, 1975 và 2026; mock đồng hồ cho `today`. Thêm test hồi quy khi không cấu hình, giữ nguyên các spec cũ. Nguồn: người dùng. Lý do: CI chạy UTC còn máy dev chạy `Asia/Bangkok`; test phải pass ở cả hai.
- D-011 - Các chỗ giữ nguyên hành vi:
  - audit-diff, autoid-inspector và preview của api-contract-builder giữ chuỗi ISO thô;
  - `sd-chip-calendar` chỉ làm việc với ngày lịch;
  - dòng today-info của layout làm sau.

  Nguồn: duyệt cùng spec. Lý do: các chuỗi ISO kia là output kỹ thuật, không phải giờ đồng hồ cho người đọc; chip-calendar không bao giờ nhận instant.
- D-012 - Ô Date của import-excel khi có cấu hình múi giờ → đọc field UTC của `Date` do exceljs trả về làm giờ đồng hồ Excel, rồi quy đổi trong múi giờ đã cấu hình. Không cấu hình thì giữ output `toISOString()` hiện tại. Nguồn: duyệt cùng spec. Lý do: Excel lưu giờ đồng hồ không kèm múi giờ; quy đổi theo múi giờ hệ thống thì khớp với output `transform` của `sd-date`.
- D-013 - Phiên bản dependency → mọi line pin chính xác `@sdcorejs/utils` 1.3.0, như đang pin 1.2.5. Nguồn: người dùng. Lý do: thay đổi chỉ thêm option nên là bản minor.

## Assumptions

- A-001 - Mọi trình duyệt mà Angular 19–22 hỗ trợ đều có `Intl.DateTimeFormat` với `timeZone` theo lịch sử IANA (tzdata của ICU), kể cả +08 của `Asia/Ho_Chi_Minh` giai đoạn 1959–1975.
  - Nguồn: suy ra; độ tin cậy cao; đã xác nhận; không chặn.
  - Nếu sai: trình duyệt có tzdata cũ sẽ quy đổi dữ liệu 1960–1975 sai offset.
  - Cách kiểm: spec Karma (ChromeHeadless) assert giá trị 1960 và 1975; `Intl` của Node 22 cho cùng offset (đã đo ngày 2026-10-16).
- A-002 - exceljs trả ô kiểu ngày thành `Date` có field UTC đúng bằng giờ đồng hồ trong Excel.
  - Nguồn: suy ra; độ tin cậy trung bình; không chặn.
  - Nếu sai: ô Date import vào sẽ lệch theo offset của máy khi có cấu hình múi giờ.
  - Cách kiểm: spec import-excel đọc một workbook có ô ngày thật qua excel service.
- A-003 - `@sdcorejs/utils` 1.3.0 publish được từ `sdcorejs-ultis` trước bản release Core UI pin nó.
  - Nguồn: suy ra; độ tin cậy cao; không chặn.
  - Nếu sai: release Core UI bị chặn đến khi utils publish xong.
  - Cách kiểm: `npm view @sdcorejs/utils@1.3.0` trước khi tag Core UI.
- A-004 - Consumer hiện tại không đặt `timeZone`, nên mặc định `'local'` làm thay đổi này không breaking.
  - Nguồn: suy ra; độ tin cậy cao; không chặn.
  - Cách kiểm: AC-015 chạy các spec cũ không sửa với cấu hình trống.

## Architecture gate classification

- Status: required
- Signals: `conflicting-independent-unit-decisions`, `cross-repository-boundary`, `public-api-contract`
- Rationale:
  - thêm public API ở hai repo: option và helper của `@sdcorejs/utils`; `ISdCoreConfiguration.timeZone`, `SdTimeZone` và `SdDateTimeService` của Core UI;
  - Core UI phụ thuộc một bản minor mới của utils;
  - khoảng mười lăm chỗ xử lý date độc lập phải áp cùng một ngữ nghĩa giờ đồng hồ.

## Non-goals

- Không port sang Core UI Legacy (`@sd-angular/core`) trong spec này.
- Không thêm input hay tham số `timeZone` riêng cho component hoặc pipe.
- Không đổi backend. Utils dùng được ở BE nhưng spec này không sửa BE nào.
- Không migrate dữ liệu đã lưu.
- Không hỗ trợ múi giờ dạng offset cố định (`+07:00`).
- Không đổi `forms/time`: giá trị giờ trong ngày vẫn không có múi giờ.

## Architecture

### Ngữ nghĩa theo loại giá trị (khi `timeZone` là IANA id)

| Loại giá trị | Ví dụ | Hiển thị | Khi đổi sang instant |
| --- | --- | --- | --- |
| Instant có `Z` hoặc offset | `1960-05-19T16:00:00Z` | giờ đồng hồ trong múi giờ đã cấu hình (VN: `20/05/1960 00:00`) | giữ nguyên |
| Giờ đồng hồ không có múi giờ | `1960/05/20 08:00:00`, `1960-05-20T08:00` | giữ nguyên chữ số | giờ đó trong múi giờ đã cấu hình (VN: `1960-05-20T00:00:00.000Z`) |
| Chỉ có ngày lịch | `1960/05/20`, `1960-05-20` | giữ nguyên chữ số | 00:00 của ngày đó trong múi giờ đã cấu hình |
| `Date` của picker hoặc control | `new Date(1960, 4, 20, 8, 0)` | field local là giờ đồng hồ | `fromZonedParts(field local, zone)` |
| `today` / `now` | đồng hồ hệ thống | ngày lịch / giờ đồng hồ trong múi giờ đã cấu hình | như các dòng trên |

Khi `timeZone` không đặt hoặc là `'local'`, Core UI gọi utils không truyền option, nên kết quả giống hệt hiện tại.

### Thêm vào `@sdcorejs/utils` 1.3.0 (`sdcorejs-ultis`, `src/fns/date.fns.ts`)

```ts
export interface TimeZoneOptions {
  /** IANA id. Omitted = host local time zone (1.2.6 behaviour). */
  timeZone?: string;
}
export interface ZonedDateTimeParts {
  year: number; month: number; day: number; // month 1-12
  hour: number; minute: number; second: number; millisecond: number;
}

toFormat(value, format, options?: TimeZoneOptions): string;
parseDateInput(value, options?: TimeZoneOptions): Date;     // zone-less strings = wall clock in the zone
parseFrom(value, format, options?: TimeZoneOptions): Date | null;
begin(value, options?: TimeZoneOptions): Date | null;        // 00:00 of the value's calendar day in the zone
end(value, options?: TimeZoneOptions): Date | null;          // start of the next calendar day in the zone - 1 ms
isValidTimeZone(value: unknown): boolean;                    // IANA ids only; numeric offsets and 'local' are false
toZonedParts(value, timeZone: string): ZonedDateTimeParts | null;
fromZonedParts(parts: Partial<ZonedDateTimeParts> & Pick<ZonedDateTimeParts, 'year' | 'month' | 'day'>, timeZone: string): Date;
```

Cách cài đặt:

- Chỉ dùng `Intl.DateTimeFormat({ timeZone, hourCycle: 'h23' }).formatToParts`. Không thêm dependency; tzdata đi theo trình duyệt.
- Cache formatter theo từng múi giờ trong một `Map` nội bộ. Cache chỉ để tăng tốc và không đổi kết quả, nên không tính là state ảnh hưởng hành vi.
- `fromZonedParts` đoán offset rồi sửa lại hai lần, theo cách `'compatible'` (D-008). Ví dụ 23:30 ngày 1975-06-12 xảy ra hai lần ở VN; kết quả lấy offset +08, tức `1975-06-12T15:30:00.000Z`.
- `end` tính theo ngày lịch, không cộng 24 giờ. Nhờ vậy ngày 1975-06-12 ở VN dài 25 giờ: từ `1975-06-11T16:00:00.000Z` đến `1975-06-12T16:59:59.999Z`.

### Core UI

**Cấu hình** (`configurations/src/sd-core.configuration.ts`):

```ts
export type SdTimeZone =
  | 'local' | 'UTC'
  | 'Asia/Ho_Chi_Minh' | 'Asia/Bangkok' | 'Asia/Jakarta' | 'Asia/Singapore' | 'Asia/Kuala_Lumpur'
  | 'Asia/Manila' | 'Asia/Shanghai' | 'Asia/Hong_Kong' | 'Asia/Taipei' | 'Asia/Tokyo' | 'Asia/Seoul'
  | 'Asia/Kolkata' | 'Asia/Dubai' | 'Australia/Sydney' | 'Europe/London' | 'Europe/Paris' | 'Europe/Berlin'
  | 'America/New_York' | 'America/Chicago' | 'America/Los_Angeles'
  | (string & {});
export interface ISdCoreConfiguration {
  format?: { number?: '1,234,567.89' | '1.234.567,89' };
  language?: Language | (() => Record<string, string>);
  timeZone?: SdTimeZone; // Default: 'local'
}
```

**Service** (`services/date-time/src/date-time.service.ts`, entry point `@sdcorejs/angular/services/date-time`, được re-export từ `@sdcorejs/angular/services`):

```ts
@Injectable({ providedIn: 'root' })
export class SdDateTimeService {
  readonly timeZone: SdTimeZone;                        // resolved once, validated in the constructor
  toFormat(value: unknown, format: string): string;      // '' when invalid
  parse(value: unknown): Date | null;
  parseFrom(value: unknown, format: string): Date | null;
  begin(value: unknown): Date | null;
  end(value: unknown): Date | null;
  today(): Date;                                         // wall-clock carrier of today 00:00 in the zone
  toWallClock(value: unknown): Date | null;              // instant -> carrier whose local fields = wall clock in the zone
  fromWallClock(value: Date): Date;                      // carrier -> instant in the zone
}
```

- Với `'local'`, mỗi hàm gọi `DateUtilities` không truyền option. `toWallClock` và `fromWallClock` khi đó trả một `Date` có cùng thời điểm.
- Constructor gọi `isValidTimeZone`. Giá trị sai thì throw `Error`:

  > `[@sdcorejs/angular] Invalid ISdCoreConfiguration.timeZone "<value>": use an IANA time zone id such as "Asia/Ho_Chi_Minh", or "local".`

**Chiều phụ thuộc:** `services/date-time` → `configurations` + `@sdcorejs/utils/fns`. Các pipe, form và component → `services/date-time`. Không có vòng phụ thuộc. Code của Core UI không gọi trực tiếp `DateUtilities.toFormat`/`begin`/`end`/`parseFrom` cho giá trị model nữa; mọi lời gọi đi qua service. Lời gọi trên vật mang giờ đồng hồ thì vẫn dùng tính toán local.

**Chỗ nối vào:**

| Khu vực | File | Thay đổi |
| --- | --- | --- |
| Pipe | `pipes/src/format-date.pipe.ts`, `format-datetime.pipe.ts` | `toFormat` của service |
| Table | `table-format.service.ts` | qua hai pipe trên, không sửa |
| Table | `table-filter.model.ts` | `begin` và `end + 1 ms` của service cho date/daterange/range; `parse` cho datetime |
| Table | `table-local.util.ts` | `begin`/`end` của service |
| Table | `table-export.service.ts` | `toFormat` của service |
| sd-date | `forms/date/src/date.component.ts`, `date-input.util.ts` | `normalizeDateModel` lấy ngày lịch trong múi giờ; serialize `transform` bằng `fromZonedParts` của 00:00; `TODAY` bằng `today()` |
| sd-date-range | `forms/date-range/src/date-range.component.ts` | như sd-date, cho từng đầu |
| sd-datetime | `forms/datetime/src/datetime.component.ts` | model instant → `toWallClock`; commit có `transform` → `fromWallClock`; `TODAY` → giờ đồng hồ hiện tại trong múi giờ |
| Transform dùng chung | `forms/models/src/sd-temporal-transform.ts` | nhận instant đã quy đổi; `sdLocalStartOfDay` chỉ còn dùng cho vật mang |
| Form-generic | `form-render/.../datetime/datetime.component.ts` | biên `today` bằng `begin`/`end(now)` |
| Form-generic | `rules/form-generic-display.ts`, `inspector.component.ts` | hiển thị bằng `toFormat` của service |
| History | `components/history/pipes/view-date.pipe.ts` | `toFormat` của service |
| Import-excel | `import-excel.component.ts` | ô Date theo D-012; `parseFrom` của service |
| Import-excel | `pipes/column-transform.pipe.ts` | `toFormat` của service |

Các chỗ sau giữ nguyên theo D-011 và R-009:

- `sd-chip-calendar`: `toFormat` chỉ chạy trên `Date` local của ô lịch;
- `forms/time`;
- `sd-strict-date-adapter`;
- audit-diff, autoid-inspector, api-contract-builder;
- `modules/layout` today-info.

**Rollout:** sửa ở `versions/v19`, rồi `npm run sync` sang v20/v21/v22. Pin `@sdcorejs/utils` 1.3.0 ở `versions/v19/package.json`, lockfile của v19 và `projects/sdcorejs-angular/package.json`; sync mang sang các line còn lại.

## Stack profile and technology assumptions

- Track: `angular`
- Stack profile: `core-ui-angular`. Đây là repo phát triển thư viện `@sdcorejs/angular` (`versions/v19/projects/sdcorejs-angular`).
- Profile evidence: Angular 19 standalone và signals; `SD_CORE_CONFIGURATION` đang có; `@sdcorejs/utils` 1.2.5 pin chính xác; `date-fns` 3.6 và `@angular/material-date-fns-adapter` dùng cho picker.
- Technology assumptions:
  - không thêm package mới; utils lên 1.3.0;
  - không dùng `@date-fns/tz` vì gói này cần date-fns 4;
  - không dùng Temporal vì trình duyệt chưa hỗ trợ đồng đều;
  - `Intl` có sẵn (A-001).

## File structure

**`sdcorejs-ultis`** (repo riêng):

- `src/fns/date.fns.ts` - sửa: `TimeZoneOptions`, `ZonedDateTimeParts`, option cho 5 hàm, 3 hàm mới, export qua `DateUtilities`.
- `src/fns/date.fns.spec.ts` - sửa: các test mới; suite 1.2.6 giữ nguyên không sửa.
- `site/src/content/guides/dates-time-zones.ts` - sửa: section múi giờ cố định.
- `README.md`, `.changeset/*.md` - sửa/tạo: mô tả bản minor 1.3.0.

**`sdcorejs-angular`**: đường dẫn tương đối với `versions/v19/projects/sdcorejs-angular/`, trừ các mục ghi là root.

- `configurations/src/sd-core.configuration.ts` + `.md` - sửa: `SdTimeZone`, `timeZone`.
- `services/date-time/{index.ts,ng-package.json,sd-date-time.md}` - tạo mới.
- `services/date-time/src/date-time.service.ts` + `.spec.ts` - tạo mới.
- `services/index.ts` - sửa: re-export.
- `pipes/src/format-date.pipe.ts`, `format-datetime.pipe.ts` + spec, `format-date.md`, `format-datetime.md` - sửa.
- `forms/models/src/sd-temporal-transform.ts` + spec - sửa.
- `forms/date/src/{date.component.ts,date-input.util.ts}` + spec, `forms/date/sd-date.md` - sửa.
- `forms/date-range/src/date-range.component.ts` + spec, `sd-date-range.md` - sửa.
- `forms/datetime/src/datetime.component.ts` + spec, `sd-datetime.md` - sửa.
- `components/table/src/services/table-filter/table-filter.model.ts`, `table-local/table-local.util.ts`, `table-export/table-export.service.ts` + spec, `sd-table.md` - sửa.
- `components/import-excel/src/import-excel.component.ts`, `pipes/column-transform.pipe.ts` + spec, `sd-import-excel.md` - sửa.
- `components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.ts`, `rules/form-generic-display.ts`, `components/form-builder/inspector/inspector.component.ts` + spec - sửa.
- `components/history/pipes/view-date.pipe.ts` + spec - sửa.
- `package.json` (thư viện), `versions/v19/package.json`, `versions/v19/package-lock.json` - sửa: pin `@sdcorejs/utils` 1.3.0.
- `showcase/src/app/docs/core/documentation.registry.ts` và các con số đếm liên quan (root) - sửa: thêm `services/date-time/sd-date-time`.
- `CHANGELOG.md` (root) - sửa: mục Unreleased.
- `versions/v20|v21|v22/**` - chỉ do `npm run sync` sinh ra.

## Acceptance criteria

Mọi tiêu chí đều tự động hoá. "VN" là `Asia/Ho_Chi_Minh`, "BKK" là `Asia/Bangkok`.

- AC-001 - `DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm', { timeZone })` trên máy ở múi giờ bất kỳ → VN ra `'20/05/1960 00:00'`, BKK ra `'19/05/1960 23:00'`. (R-001)
- AC-002 - Gọi `fromZonedParts`, `begin`, `end`, `parseDateInput` với VN quanh năm 1960 và mốc đổi offset 1975-06-13. (R-001)
  - `fromZonedParts({ year: 1960, month: 5, day: 20 })` ra `1960-05-19T16:00:00.000Z`.
  - 23:30 lặp lại của 1975-06-12 ra `1975-06-12T15:30:00.000Z`.
  - `begin` và `end` của 1975/06/12 ra `1975-06-11T16:00:00.000Z` và `1975-06-12T16:59:59.999Z`.
  - `parseDateInput('1960/05/20 08:00:00')` ra `1960-05-20T00:00:00.000Z`.
  - Instant có `Z` giữ nguyên.
  - `toZonedParts` của từng kết quả trả lại đúng input.
- AC-003 - `isValidTimeZone` → `true` với `'Asia/Ho_Chi_Minh'`, `'UTC'`, `'Etc/GMT-7'`; `false` với `'+07:00'`, `'GMT+7'`, `'UTC+07:00'`, `'Mars/Base'`, `'local'`, `''` và giá trị không phải chuỗi. (R-001)
- AC-004 - Chạy suite date của 1.2.6 không sửa; gọi mọi hàm đã đổi mà không truyền option; gọi xen kẽ với hai múi giờ khác nhau → suite pass, kết quả không option giống 1.2.6, và mỗi lời gọi có múi giờ chỉ phụ thuộc option của chính nó. (R-001)
- AC-005 - `SD_CORE_CONFIGURATION` với `timeZone` là `'+07:00'` hoặc `'Mars/Base'`, rồi inject `SdDateTimeService` → throw `Error` nêu giá trị sai và hướng dẫn dùng IANA id hoặc `'local'`. Với `'Asia/Ho_Chi_Minh'`, `'local'` hoặc không đặt thì inject không lỗi. (R-002)
- AC-006 - `SdDateTimeService` với VN và BKK, đồng hồ mock `2026-08-14T17:30:00Z`, máy ở múi giờ bất kỳ. (R-003)
  - `toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy')`: VN `'20/05/1960'`, BKK `'19/05/1960'`.
  - `today()` là `Date` local ngày 2026-08-15 ở cả hai.
  - `toWallClock('1960-05-20T00:00:00Z')` (VN) có field local 1960-05-20 08:00.
  - `fromWallClock(new Date(1960, 4, 20, 8, 0))` (VN) ra `1960-05-20T00:00:00.000Z`.
  - `timeZone` trả đúng id đã cấu hình.
- AC-007 - Render `'1960-05-19T16:00:00Z'` qua `sdFormatDate`, `sdFormatDatetime`, ô datetime của `sd-table`, `viewDateTime` của history và phần hiển thị của form-generic. (R-004)
  - VN: `'20/05/1960'`, `'20/05/1960 00:00:00'`, `'00:00 20/05/1960'`.
  - BKK: `'19/05/1960'`, `'19/05/1960 23:00:00'`, `'23:00 19/05/1960'`.
- AC-008 - VN, `transform="ISOString"`: chọn 20/05/1960 và 15/08/2026 trong `sd-date` và ở cả hai đầu `sd-date-range`; bind model `'1960-05-19T16:00:00Z'` dưới VN và dưới BKK. (R-005)
  - Emit `'1960-05-19T16:00:00.000Z'` và `'2026-08-14T17:00:00.000Z'`.
  - Model bind vào hiện 20/05/1960 dưới VN, 19/05/1960 dưới BKK.
- AC-009 - VN: nhập 20/05/1960 08:00 vào `sd-datetime`, có và không có `transform="ISOString"`; bind model `'1960-05-20T00:00:00Z'`. (R-005)
  - Có `transform`: emit `'1960-05-20T00:00:00.000Z'`. Không có: emit `'1960/05/20 08:00:00'`.
  - Model bind vào hiện `'20/05/1960 08:00'`.
- AC-010 - VN, đồng hồ mock `2026-08-14T17:30:00Z`, máy ở múi giờ bất kỳ: min/max `'TODAY'` trên `sd-date`, `sd-date-range`, `sd-datetime` → biên ngày là ngày lịch 15/08/2026; biên datetime là giờ đồng hồ 15/08/2026 00:30. (R-005)
- AC-011 - VN, filter gửi server của `sd-table`. (R-006)
  - date 1960/05/20: `GREATER_OR_EQUAL '1960-05-19T16:00:00.000Z'` và `LESS_THAN '1960-05-20T16:00:00.000Z'`.
  - daterange 1975/06/12–1975/06/12: `GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z'` và `LESS_THAN '1975-06-12T17:00:00.000Z'`.
  - datetime `'1960/05/20 08:00:00'`: `'1960-05-20T00:00:00.000Z'`.
- AC-012 - VN: lọc client-side theo ngày 1960/05/20, và export Excel instant `'1960-05-19T16:00:00Z'` ở cột date và cột datetime → dòng có instant đó khớp ngày; export ghi `'1960/05/20'` và `'1960/05/20 00:00:00'`. (R-006)
- AC-013 - VN: import ô Date ngày 1960-05-20 (exceljs value `new Date(Date.UTC(1960, 4, 20))`) và ô text `'20/05/1960'` với format `'dd/MM/yyyy'`; lặp lại khi không cấu hình. (R-007)
  - Có múi giờ: cả hai lưu `'1960-05-19T16:00:00.000Z'` và hiện 20/05/1960.
  - Không có múi giờ: ô Date lưu `'1960-05-20T00:00:00.000Z'` như hiện tại.
- AC-014 - VN, đồng hồ mock `2026-08-14T17:30:00Z`: field datetime của form-generic có min/max `'today'` → min `'2026-08-14T17:00:00.000Z'`, max `'2026-08-15T16:59:59.999Z'`. (R-008)
- AC-015 - Chạy các spec sẵn có của pipe, `sd-date`, `sd-date-range`, `sd-datetime`, filter/format/export của `sd-table`, import-excel và form-generic, với cấu hình trống và với `'local'` → pass không cần sửa, giá trị như trước. (R-002, R-009)
- AC-016 - Dưới VN, BKK và cấu hình trống, hiển thị và emit bốn giá trị sau → mọi cấu hình ra cùng chữ số. (R-009)
  - model chỉ có ngày `'1960/05/20'`;
  - model không có múi giờ `'1960/05/20 08:00:00'`, không `transform`;
  - giá trị `['1960/05/20']` của `sd-chip-calendar`;
  - giá trị `'08:00'` của `forms/time`.
- AC-017 - Chạy `npm run sync`, `npm run check:sync`, test registry tài liệu của Showcase, và kiểm pin trong mọi `versions/v*/projects/sdcorejs-angular/package.json` → tất cả pass; mọi line pin `@sdcorejs/utils` 1.3.0; `sd-date-time.md` đã đăng ký; docs và CHANGELOG mô tả `timeZone`. (R-010)

## Risks & mitigations

- **Risk:** sót một chỗ còn gọi `DateUtilities` theo giờ local cho giá trị model, làm hai chỗ hiển thị lệch nhau. → **Mitigation:** service là cửa duy nhất cho giá trị model. Plan liệt kê từng lời gọi trong bảng chỗ nối vào; review grep `DateUtilities.(toFormat|begin|end|parseFrom)` ngoài service và vật mang.
- **Risk:** người xem ở vùng có DST gặp giờ đồng hồ không tồn tại khi dựng vật mang local, ví dụ 02:30 lúc tiến đồng hồ ở châu Âu. → **Mitigation:** ghi giới hạn này vào `sd-date-time.md`. VN và các múi giờ châu Á trong D-003 không có DST. Ngày lịch không bị ảnh hưởng vì vật mang lấy 00:00.
- **Risk:** dữ liệu cũ do BE tạo bằng offset cố định +07:00 hiển thị lệch 1 giờ với dữ liệu 1960–1975 khi bật `'Asia/Ho_Chi_Minh'`. → **Mitigation:** ghi trong docs và CHANGELOG cách nhận diện nguồn tạo dữ liệu. Migrate dữ liệu là non-goal.
- **Risk:** thứ tự release: Core UI pin 1.3.0 khi utils chưa publish. → **Mitigation:** làm và release utils trước (A-003); kiểm `npm view` trước khi tag Core UI.
- **Risk:** `Intl.formatToParts` chậm trong table lớn. → **Mitigation:** cache formatter theo múi giờ; nhánh `'local'` không gọi `Intl`.

## Out of scope (deferred)

- Port sang Core UI Legacy - làm khi người dùng yêu cầu sau khi bản Core UI ổn định.
- Override `timeZone` theo component hoặc pipe - làm khi có màn hình cần hiển thị nhiều múi giờ cùng lúc.
- Dòng today-info của `modules/layout` (home, forbidden, not-found) theo múi giờ hệ thống - làm khi người dùng yêu cầu hoặc khi có consumer đặt múi giờ khác với múi giờ máy.
- Helper cho BE (NestJS) dùng `TimeZoneOptions` - làm khi BE cần lọc theo cùng múi giờ.

## Decisions captured during review

- D-002 was settled while drafting, before the gate: the time zone lives in `ISdCoreConfiguration.timeZone` (`SD_CORE_CONFIGURATION`) instead of the `provideSdXxx` provider proposed in brainstorming.
- The spec was approved as drafted.

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)

---
{
  "acceptance_criteria_count": 22,
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-16T09:17:23.000Z",
  "approved_by": "user",
  "artifact_id": "spec-core-ui-fixed-timezone-r2",
  "artifact_kind": "spec",
  "change_control": {
    "change_reason": "Architecture review (2026-10-16): parseDateInput is not public, end + 1 ms changes local bounds, missed surfaces (client filter/sort/aggregate, sd-date-range text, sdTimeDifferent, adapter today/Now, min/max), pipes built with new, lockfile/showcase pins; user decisions: form.value holds the model under a zone, FilterUtilities and file-explorer added.",
    "revision": 2,
    "supersedes": "spec-core-ui-fixed-timezone-r1"
  },
  "change_ref": "core-ui-fixed-timezone",
  "commit_policy": "with-change",
  "contract_id": "core-ui-fixed-timezone",
  "description": "Opt-in fixed IANA time zone (r2): ISdCoreConfiguration.timeZone, SdDateTimeService, utils 1.3.0 DateUtilities.parse/TimeZoneOptions/zoned parts and FilterUtilities timeZone; form.value holds the model under a zone; pipes, date inputs (min/max, today, Now), table (server/client filter, sort, aggregate, export), import-excel, form-generic, history, file-explorer.",
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
  "repository_relative_path": ".sdcorejs/specs/angular/2026-10-16-15-37-core-ui-fixed-timezone-r2.md",
  "requirement_id": "REQ-core-ui-fixed-timezone",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/angular/2026-10-16-15-37-core-ui-fixed-timezone-spec.md",
  "source_plan": "none",
  "source_revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
  "source_spec": "none",
  "stack_profile": "core-ui-angular",
  "supersedes": "spec-core-ui-fixed-timezone-r1",
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:2581bd64cbde92c20a82d77a603a6c58992dd898317999335fc36fd860cbfea5"
}
---
# Múi giờ cố định cho toàn hệ thống (utils + Core UI) - Approved Spec (r2)

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Múi giờ cố định cho toàn hệ thống (utils + Core UI) - 2026-10-16 15:37 (r2)

```yaml
spec_context: {
  "source": "sdcorejs-spec",
  "decision_coverage": {
    "schema_version": 1,
    "revision": 2,
    "records": [
      {
        "id": "R-001",
        "type": "requirement",
        "statement": "@sdcorejs/utils 1.3.0 (minor): DateUtilities gains TimeZoneOptions ({ timeZone?: string }, an IANA id) as the last optional argument of toFormat, parseFrom, begin and end, a new public lenient parse(value, options?) returning Date | null for every input isDate accepts, plus isValidTimeZone, toZonedParts and fromZonedParts; FilterUtilities gains timeZone in MatchOptions and ToEpochOptions so date-today, date-relative and zone-less date operands resolve in that zone, and resolveRelativeDate accepts the same option; calls without the option behave exactly as 1.2.6; no global or module-level state; the dates-time-zones guide, README and changeset describe the API.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-ultis",
        "owner_module_id": "src/fns/date"
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "ISdCoreConfiguration gains timeZone?: SdTimeZone, an open literal union of 'local', common IANA ids and any other IANA id, read from the root injector only; unset or 'local' keeps the current browser-local behavior; a numeric offset or unknown id throws a clear Error on the first use of the date/time service.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "configurations"
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "@sdcorejs/angular/services/date-time exports SdDateTimeService (providedIn root) bound to the configured zone: timeZone, toFormat, parse, parseFrom, begin, end, beginOfNextDay, today, now, toWallClock and fromWallClock.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "services/date-time"
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "Display surfaces format an instant as the wall clock of the configured zone: sdFormatDate, sdFormatDatetime and sdTimeDifferent (and through them sd-table cells and aggregate MIN/MAX), the read-only text of sd-date-range (query-bar chips), history viewDateTime, form-generic read-only display and builder inspector default display, the import-excel column transform pipe, and file-explorer modifiedAt including its today/yesterday labels.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "pipes"
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "sd-date, sd-date-range and sd-datetime show an instant model as the calendar day or wall clock of the configured zone, keep picker and control Date objects as wall-clock carriers, serialize transform (ISOString/UTCString) from that wall clock in the zone (00:00 of the day for date inputs), resolve TODAY, min/max bounds and the date adapter today() (calendar today marker, Now button) in the zone, and, when a zone is configured, register the model value instead of the carrier in a parent form even without transform.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms"
      },
      {
        "id": "R-006",
        "type": "requirement",
        "statement": "sd-table server filters (date, daterange, datetime and range payloads), client-side filtering (row values parsed through the service), local sort, aggregate parsing and Excel export compute in the configured zone: a day filter is [begin of the day, begin of the next calendar day) in the zone and a datetime filter reads the zone-less value as wall clock in the zone; in local mode every bound equals the current value.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "components/table"
      },
      {
        "id": "R-007",
        "type": "requirement",
        "statement": "With a configured zone, import-excel reads Date cells (exceljs UTC fields = Excel wall clock) and text dates parsed with the column format (time-only formats use today in the zone) as wall clock in the zone; the stored types stay as today (Date cell: ISO string, text cell: Date) and unset keeps the current values.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "components/import-excel"
      },
      {
        "id": "R-008",
        "type": "requirement",
        "statement": "form-generic resolves the today min/max boundary of datetime fields to the start/end of today in the configured zone, evaluates its rules and validations with FilterUtilities MatchOptions.timeZone, and formats its read-only display through a date formatter passed in its display options.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "components/form-generic"
      },
      {
        "id": "R-009",
        "type": "requirement",
        "statement": "Calendar-only values and wall-clock carriers never shift: date-only strings, zone-less wall-clock strings emitted without transform, sd-chip-calendar values, forms/time values and picker/control Date objects show and emit the same digits under every configuration; pipes created with new outside an injection context keep the local behavior.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms"
      },
      {
        "id": "R-010",
        "type": "requirement",
        "statement": "Core UI docs (sd-core.configuration, new sd-date-time, pipes, sd-date, sd-datetime, sd-date-range, sd-table filters, sd-import-excel, sd-file-explorer, sd-form-generic, query-bar/query-builder backend notes) and the CHANGELOG Unreleased entry (including the form.value change for apps that set timeZone) describe timeZone; the Showcase registers sd-date-time; every Angular line, every versions/v* lockfile and the showcase pin @sdcorejs/utils 1.3.0; v20-v22 sources come only from npm run sync.",
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
        "statement": "Call fromZonedParts, begin, end and parse with timeZone 'Asia/Ho_Chi_Minh' around 1960 and the 1975-06-13 offset change -> fromZonedParts({ year: 1960, month: 5, day: 20 }) is 1960-05-19T16:00:00.000Z and fromZonedParts({ year: 1960, month: 5, day: 32 }) normalizes to 1960-05-31T16:00:00.000Z; the repeated 23:30 of 1975-06-12 resolves to the earlier offset 1975-06-12T15:30:00.000Z; begin/end of 1975/06/12 are 1975-06-11T16:00:00.000Z and 1975-06-12T16:59:59.999Z; parse('1960/05/20 08:00:00') is 1960-05-20T00:00:00.000Z; an instant with Z is returned unchanged; parse('abc') is null; toZonedParts of each result gives back the input parts",
        "behavior": "Call fromZonedParts, begin, end and parse with timeZone 'Asia/Ho_Chi_Minh' around 1960 and the 1975-06-13 offset change",
        "expected_result": "fromZonedParts({ year: 1960, month: 5, day: 20 }) is 1960-05-19T16:00:00.000Z and fromZonedParts({ year: 1960, month: 5, day: 32 }) normalizes to 1960-05-31T16:00:00.000Z; the repeated 23:30 of 1975-06-12 resolves to the earlier offset 1975-06-12T15:30:00.000Z; begin/end of 1975/06/12 are 1975-06-11T16:00:00.000Z and 1975-06-12T16:59:59.999Z; parse('1960/05/20 08:00:00') is 1960-05-20T00:00:00.000Z; an instant with Z is returned unchanged; parse('abc') is null; toZonedParts of each result gives back the input parts",
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
        "statement": "Run the 1.2.6 date and filter test suites without edits and call every changed function without options, and with two different zones in alternating order -> the unchanged suites pass, results without options equal 1.2.6, parse without options returns the same instant isDate validates, and each zoned call depends only on its own option",
        "behavior": "Run the 1.2.6 date and filter test suites without edits and call every changed function without options, and with two different zones in alternating order",
        "expected_result": "the unchanged suites pass, results without options equal 1.2.6, parse without options returns the same instant isDate validates, and each zoned call depends only on its own option",
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
        "statement": "Use SdDateTimeService with zone 'Asia/Ho_Chi_Minh' and 'Asia/Bangkok' and a mocked clock of 2026-08-14T17:30:00Z on any host zone -> toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy') is '20/05/1960' (VN) and '19/05/1960' (BKK); today() is a local Date of 2026-08-15 00:00 and now() of 2026-08-15 00:30 for both; beginOfNextDay('1975/06/12') is 1975-06-12T17:00:00.000Z (VN); toWallClock('1960-05-20T00:00:00Z') has local fields 1960-05-20 08:00 (VN); fromWallClock(new Date(1960, 4, 20, 8, 0)) is 1960-05-20T00:00:00.000Z (VN); timeZone reports the configured id",
        "behavior": "Use SdDateTimeService with zone 'Asia/Ho_Chi_Minh' and 'Asia/Bangkok' and a mocked clock of 2026-08-14T17:30:00Z on any host zone",
        "expected_result": "toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy') is '20/05/1960' (VN) and '19/05/1960' (BKK); today() is a local Date of 2026-08-15 00:00 and now() of 2026-08-15 00:30 for both; beginOfNextDay('1975/06/12') is 1975-06-12T17:00:00.000Z (VN); toWallClock('1960-05-20T00:00:00Z') has local fields 1960-05-20 08:00 (VN); fromWallClock(new Date(1960, 4, 20, 8, 0)) is 1960-05-20T00:00:00.000Z (VN); timeZone reports the configured id",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-003"
        ]
      },
      {
        "id": "AC-007",
        "type": "acceptance-criterion",
        "statement": "Render '1960-05-19T16:00:00Z' through sdFormatDate, sdFormatDatetime, sdTimeDifferent (format 'dd/MM/yyyy', past its threshold), an sd-table datetime cell, history viewDateTime and form-generic display with zone 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok' -> VN shows '20/05/1960', '20/05/1960 00:00:00', '20/05/1960' and '00:00 20/05/1960'; BKK shows '19/05/1960', '19/05/1960 23:00:00', '19/05/1960' and '23:00 19/05/1960'",
        "behavior": "Render '1960-05-19T16:00:00Z' through sdFormatDate, sdFormatDatetime, sdTimeDifferent (format 'dd/MM/yyyy', past its threshold), an sd-table datetime cell, history viewDateTime and form-generic display with zone 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok'",
        "expected_result": "VN shows '20/05/1960', '20/05/1960 00:00:00', '20/05/1960' and '00:00 20/05/1960'; BKK shows '19/05/1960', '19/05/1960 23:00:00', '19/05/1960' and '23:00 19/05/1960'",
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
        "statement": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z on any host zone, set min and max to 'TODAY' on sd-date, sd-date-range and sd-datetime, open the calendars and press Now in sd-datetime -> the date bounds and the calendar today marker are 15/08/2026, the datetime bound is the wall clock 15/08/2026 00:30, and Now writes 15/08/2026 00:30",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z on any host zone, set min and max to 'TODAY' on sd-date, sd-date-range and sd-datetime, open the calendars and press Now in sd-datetime",
        "expected_result": "the date bounds and the calendar today marker are 15/08/2026, the datetime bound is the wall clock 15/08/2026 00:30, and Now writes 15/08/2026 00:30",
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
        "statement": "With zone 'Asia/Ho_Chi_Minh', filter rows client-side by date 1960/05/20, aggregate MIN over a date column ['1960/05/20', '1960/05/21'] and export the instant '1960-05-19T16:00:00Z' to Excel as date and datetime columns, on any host zone -> the rows with '1960-05-19T16:00:00Z' and with the zone-less '1960/05/20 23:30:00' match the day; MIN shows 20/05/1960; the export writes '1960/05/20' and '1960/05/20 00:00:00'",
        "behavior": "With zone 'Asia/Ho_Chi_Minh', filter rows client-side by date 1960/05/20, aggregate MIN over a date column ['1960/05/20', '1960/05/21'] and export the instant '1960-05-19T16:00:00Z' to Excel as date and datetime columns, on any host zone",
        "expected_result": "the rows with '1960-05-19T16:00:00Z' and with the zone-less '1960/05/20 23:30:00' match the day; MIN shows 20/05/1960; the export writes '1960/05/20' and '1960/05/20 00:00:00'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-006"
        ]
      },
      {
        "id": "AC-013",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh', import a Date cell for 1960-05-20 (exceljs value new Date(Date.UTC(1960, 4, 20))) and a text cell '20/05/1960' with format 'dd/MM/yyyy'; repeat with no timeZone -> with the zone the Date cell stores the string '1960-05-19T16:00:00.000Z', the text cell stores a Date whose toISOString() is '1960-05-19T16:00:00.000Z', and both show 20/05/1960; without the zone both cells store the same values as today",
        "behavior": "With zone 'Asia/Ho_Chi_Minh', import a Date cell for 1960-05-20 (exceljs value new Date(Date.UTC(1960, 4, 20))) and a text cell '20/05/1960' with format 'dd/MM/yyyy'; repeat with no timeZone",
        "expected_result": "with the zone the Date cell stores the string '1960-05-19T16:00:00.000Z', the text cell stores a Date whose toISOString() is '1960-05-19T16:00:00.000Z', and both show 20/05/1960; without the zone both cells store the same values as today",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-007"
        ]
      },
      {
        "id": "AC-014",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z, render a form-generic datetime field whose min and max are 'today', and a rule that shows a field when a date field is GREATER_OR_EQUAL date-today -> min is '2026-08-14T17:00:00.000Z' and max is '2026-08-15T16:59:59.999Z'; the rule is true for '2026/08/15' and false for '2026/08/14' on any host zone",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and a mocked clock of 2026-08-14T17:30:00Z, render a form-generic datetime field whose min and max are 'today', and a rule that shows a field when a date field is GREATER_OR_EQUAL date-today",
        "expected_result": "min is '2026-08-14T17:00:00.000Z' and max is '2026-08-15T16:59:59.999Z'; the rule is true for '2026/08/15' and false for '2026/08/14' on any host zone",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-008"
        ]
      },
      {
        "id": "AC-015",
        "type": "acceptance-criterion",
        "statement": "Run the existing specs of the pipes (including those that create pipes with new), sd-date, sd-date-range, sd-datetime, sd-table filter/format/export/local/aggregate, import-excel, file-explorer and form-generic with no timeZone and with 'local' -> they pass without edits and produce the same values as before the change, including every day-filter upper bound and the Date registered in a parent form",
        "behavior": "Run the existing specs of the pipes (including those that create pipes with new), sd-date, sd-date-range, sd-datetime, sd-table filter/format/export/local/aggregate, import-excel, file-explorer and form-generic with no timeZone and with 'local'",
        "expected_result": "they pass without edits and produce the same values as before the change, including every day-filter upper bound and the Date registered in a parent form",
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
        "statement": "Run npm run sync, npm run check:sync, the Showcase documentation registry test and a pin check of every versions/v*/projects/sdcorejs-angular/package.json, versions/v19/package.json, every versions/v*/package-lock.json, showcase/package.json and showcase/package-lock.json -> all pass; every file pins @sdcorejs/utils 1.3.0; sd-date-time.md is registered; docs and the CHANGELOG describe timeZone and the form.value change",
        "behavior": "Run npm run sync, npm run check:sync, the Showcase documentation registry test and a pin check of every versions/v*/projects/sdcorejs-angular/package.json, versions/v19/package.json, every versions/v*/package-lock.json, showcase/package.json and showcase/package-lock.json",
        "expected_result": "all pass; every file pins @sdcorejs/utils 1.3.0; sd-date-time.md is registered; docs and the CHANGELOG describe timeZone and the form.value change",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-010"
        ]
      },
      {
        "id": "AC-018",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' and no transform, bind sd-date, sd-datetime and sd-date-range to a parent FormGroup and enter 20/05/1960 (08:00 for sd-datetime); repeat with no timeZone -> with the zone the FormGroup values are '1960/05/20', '1960/05/20 08:00:00' and the range model { from: '1960/05/20', to: '1960/05/20' }; without the zone the FormGroup still holds the picker Date objects as today",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and no transform, bind sd-date, sd-datetime and sd-date-range to a parent FormGroup and enter 20/05/1960 (08:00 for sd-datetime); repeat with no timeZone",
        "expected_result": "with the zone the FormGroup values are '1960/05/20', '1960/05/20 08:00:00' and the range model { from: '1960/05/20', to: '1960/05/20' }; without the zone the FormGroup still holds the picker Date objects as today",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ]
      },
      {
        "id": "AC-019",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' on any host zone, set sd-datetime min to '2026-08-14T17:00:00Z' and sd-date min to '1960-05-19T16:00:00Z' -> the sd-datetime picker minimum has local fields 2026-08-15 00:00 and the earliest selectable sd-date day is 20/05/1960",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' on any host zone, set sd-datetime min to '2026-08-14T17:00:00Z' and sd-date min to '1960-05-19T16:00:00Z'",
        "expected_result": "the sd-datetime picker minimum has local fields 2026-08-15 00:00 and the earliest selectable sd-date day is 20/05/1960",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ]
      },
      {
        "id": "AC-020",
        "type": "acceptance-criterion",
        "statement": "With zone 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok', render sd-date-range viewed='inline' with the model { from: '1960-05-19T16:00:00Z', to: '1960-05-20T16:00:00Z' } -> VN shows '20/05/1960' and '21/05/1960'; BKK shows '19/05/1960' and '20/05/1960'",
        "behavior": "With zone 'Asia/Ho_Chi_Minh' and with 'Asia/Bangkok', render sd-date-range viewed='inline' with the model { from: '1960-05-19T16:00:00Z', to: '1960-05-20T16:00:00Z' }",
        "expected_result": "VN shows '20/05/1960' and '21/05/1960'; BKK shows '19/05/1960' and '20/05/1960'",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-004"
        ]
      },
      {
        "id": "AC-021",
        "type": "acceptance-criterion",
        "statement": "With a mocked clock of 2026-08-14T18:00:00Z, label file-explorer modifiedAt '2026-08-14T16:30:00Z' under zone 'Asia/Ho_Chi_Minh' and under 'UTC' -> VN labels it yesterday; UTC labels it today",
        "behavior": "With a mocked clock of 2026-08-14T18:00:00Z, label file-explorer modifiedAt '2026-08-14T16:30:00Z' under zone 'Asia/Ho_Chi_Minh' and under 'UTC'",
        "expected_result": "VN labels it yesterday; UTC labels it today",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-004"
        ]
      },
      {
        "id": "AC-022",
        "type": "acceptance-criterion",
        "statement": "Call FilterUtilities.evaluate with a GREATER_OR_EQUAL date-today filter on a field '2026/08/15', now 2026-08-14T17:30:00Z, with and without timeZone 'Asia/Ho_Chi_Minh' -> with the zone today resolves to 2026-08-14T17:00:00.000Z and the item matches; without the zone the result equals 1.2.6",
        "behavior": "Call FilterUtilities.evaluate with a GREATER_OR_EQUAL date-today filter on a field '2026/08/15', now 2026-08-14T17:30:00Z, with and without timeZone 'Asia/Ho_Chi_Minh'",
        "expected_result": "with the zone today resolves to 2026-08-14T17:00:00.000Z and the item matches; without the zone the result equals 1.2.6",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
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
        "statement": "Public shape of the Core UI service: SdDateTimeService in the new entry point @sdcorejs/angular/services/date-time with timeZone, toFormat, parse, parseFrom, begin, end, beginOfNextDay, today, now, toWallClock and fromWallClock; method names mirror DateUtilities; parse/parseFrom/begin/end/beginOfNextDay/toWallClock return null and toFormat returns an empty string for invalid input; in local mode beginOfNextDay is exactly DateUtilities.begin(DateUtilities.addDays(value, 1))",
        "question": "Public shape of the Core UI service",
        "selected_value": "SdDateTimeService in the new entry point @sdcorejs/angular/services/date-time with timeZone, toFormat, parse, parseFrom, begin, end, beginOfNextDay, today, now, toWallClock and fromWallClock; method names mirror DateUtilities; parse/parseFrom/begin/end/beginOfNextDay/toWallClock return null and toFormat returns an empty string for invalid input; in local mode beginOfNextDay is exactly DateUtilities.begin(DateUtilities.addDays(value, 1))",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Same verbs as DateUtilities; beginOfNextDay keeps local mode byte-identical (the review showed end + 1 ms differs on offset-change days).",
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
        "statement": "Public shape of the utils additions: DateUtilities: TimeZoneOptions { timeZone?: string } as the last optional argument of toFormat, parseFrom, begin and end; new parse(value, options?) returning Date | null; isValidTimeZone(value); toZonedParts(value, timeZone) returning { year, month (1-12), day, hour, minute, second, millisecond } or null; fromZonedParts(parts, timeZone) normalizing out-of-range fields like Date.UTC; FilterUtilities: timeZone in MatchOptions and ToEpochOptions, resolveRelativeDate(relative, now, options?); a repeated wall clock resolves to the earlier offset and a skipped one moves forward (Temporal 'compatible')",
        "question": "Public shape of the utils additions",
        "selected_value": "DateUtilities: TimeZoneOptions { timeZone?: string } as the last optional argument of toFormat, parseFrom, begin and end; new parse(value, options?) returning Date | null; isValidTimeZone(value); toZonedParts(value, timeZone) returning { year, month (1-12), day, hour, minute, second, millisecond } or null; fromZonedParts(parts, timeZone) normalizing out-of-range fields like Date.UTC; FilterUtilities: timeZone in MatchOptions and ToEpochOptions, resolveRelativeDate(relative, now, options?); a repeated wall clock resolves to the earlier offset and a skipped one moves forward (Temporal 'compatible')",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-ultis",
        "rationale": "parseDateInput is not public in 1.2.6, so a public parse is added instead of exposing a throwing internal; option objects follow AddMonthsOptions and MatchOptions.",
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
        "statement": "Surfaces that keep their current behavior: audit-diff, autoid-inspector and the api-contract-builder preview keep raw ISO strings; sd-chip-calendar stays calendar-only; carrier-only code stays local (Angular date pipe and toLocaleDateString on min/max carriers, date-input.util); the Excel export filename timestamp and the data-state test hook stay local; query-bar/query-builder send zone-less values and TODAY/relative tokens unchanged (backend resolves them in the zone, documented); the layout today-info line is deferred",
        "question": "Surfaces that keep their current behavior",
        "selected_value": "audit-diff, autoid-inspector and the api-contract-builder preview keep raw ISO strings; sd-chip-calendar stays calendar-only; carrier-only code stays local (Angular date pipe and toLocaleDateString on min/max carriers, date-input.util); the Excel export filename timestamp and the data-state test hook stay local; query-bar/query-builder send zone-less values and TODAY/relative tokens unchanged (backend resolves them in the zone, documented); the layout today-info line is deferred",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Those outputs are technical or carrier values, not wall-clock displays of model data.",
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
      },
      {
        "id": "D-014",
        "type": "decision",
        "statement": "What a parent form receives from sd-date, sd-datetime and sd-date-range when a zone is configured: The model value through the existing model-facing control (yyyy/MM/dd, yyyy/MM/dd HH:mm:ss, the range model, or the transform output); without a zone the carrier Date stays as today",
        "question": "What a parent form receives from sd-date, sd-datetime and sd-date-range when a zone is configured",
        "selected_value": "The model value through the existing model-facing control (yyyy/MM/dd, yyyy/MM/dd HH:mm:ss, the range model, or the transform output); without a zone the carrier Date stays as today",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "A carrier Date serializes to a host-dependent instant, which reproduces the 1960 shift; the model-facing control already exists for transform.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-005",
          "AC-018"
        ]
      },
      {
        "id": "D-015",
        "type": "decision",
        "statement": "Extra surfaces in scope: FilterUtilities today/relative and zone-less operands (utils) used by form-generic rules and validations; file-explorer modifiedAt",
        "question": "Extra surfaces in scope",
        "selected_value": "FilterUtilities today/relative and zone-less operands (utils) used by form-generic rules and validations; file-explorer modifiedAt",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Both decide or show dates for the user and would otherwise follow the host clock.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-004",
          "R-008",
          "AC-021",
          "AC-022"
        ]
      },
      {
        "id": "D-016",
        "type": "decision",
        "statement": "Pipes created with new outside an injection context: Fall back to the local behavior instead of throwing",
        "question": "Pipes created with new outside an injection context",
        "selected_value": "Fall back to the local behavior instead of throwing",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Existing specs and consumers construct sdFormatDate/sdFormatDatetime/sdTimeDifferent/viewDateTime with new; throwing NG0203 would be a breaking change.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-009",
          "AC-015"
        ]
      },
      {
        "id": "D-017",
        "type": "decision",
        "statement": "Import-excel stored types: Unchanged in both modes (Date cell: ISO string, text cell: Date); only the instants change under a zone; time-only formats take today in the zone",
        "question": "Import-excel stored types",
        "selected_value": "Unchanged in both modes (Date cell: ISO string, text cell: Date); only the instants change under a zone; time-only formats take today in the zone",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Consumers already handle the current types; changing them is outside the time-zone goal.",
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
        "id": "D-018",
        "type": "decision",
        "statement": "Release-contract snapshot: Generated in the release ritual of the suffix that ships this change, not in this change",
        "question": "Release-contract snapshot",
        "selected_value": "Generated in the release ritual of the suffix that ships this change, not in this change",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "public-contract",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "scripts/release-contracts/<suffix>.json is produced when the release suffix is chosen; this change has no suffix yet.",
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
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-018.task_refs",
        "record_id": "AC-018",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-019.task_refs",
        "record_id": "AC-019",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-020.task_refs",
        "record_id": "AC-020",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-021.task_refs",
        "record_id": "AC-021",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-022.task_refs",
        "record_id": "AC-022",
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
  "supersedes": "spec-core-ui-fixed-timezone-r1",
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
  "acceptance_criteria_count": 22,
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
    "Intl formatter cost in tables",
    "carrier dates leaking through parent forms",
    "pipes constructed outside an injection context"
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
    "revision": 2,
    "supersedes": "spec-core-ui-fixed-timezone-r1",
    "change_reason": "Architecture review (2026-10-16): parseDateInput is not public, end + 1 ms changes local bounds, missed surfaces (client filter/sort/aggregate, sd-date-range text, sdTimeDifferent, adapter today/Now, min/max), pipes built with new, lockfile/showcase pins; user decisions: form.value holds the model under a zone, FilterUtilities and file-explorer added."
  }
}
```

> **Revision 2** (thay cho `spec-core-ui-fixed-timezone-r1`). Lý do: review kiến trúc ngày 2026-10-16 tìm ra:
> - `parseDateInput` không phải hàm public của utils;
> - `end + 1 ms` làm đổi cận filter ở chế độ local;
> - còn sót nhiều chỗ xử lý date;
> - pipe đang được tạo bằng `new`;
> - pin ở lockfile và showcase chưa được tính.
>
> Người dùng đã chốt: khi có cấu hình múi giờ thì `form.value` giữ giá trị model; thêm `FilterUtilities` và file-explorer vào phạm vi.

## Problem & Goals

Core UI và `@sdcorejs/utils` 1.2.x tính mọi giá trị ngày giờ theo múi giờ local của trình duyệt. Một instant chỉ đúng khi người tạo và người xem dùng cùng luật múi giờ cho thời điểm đó.

Theo tzdata, `Asia/Ho_Chi_Minh` là +08 trong giai đoạn 1959-12-31 đến 1975-06-13, còn `Asia/Bangkok` luôn là +07. Ví dụ ngày 20/05/1960 chọn ở VN:

- lưu dạng instant thì ra `1960-05-19T16:00:00Z`;
- người xem ở VN thấy 20/05/1960;
- người xem ở Thái Lan thấy 19/05/1960 23:00, tức lùi một ngày;
- đặt offset cố định `+07:00` cho người xem cũng cho ra 19/05/1960.

Đường sinh ra instant phổ biến nhất là `form.value`. Khi không có `transform`, FormGroup cha nhận `Date` của picker (00:00 theo giờ máy người nhập). Gửi lên BE dưới dạng JSON thì instant phụ thuộc máy người nhập.

Datetime cũng lệch: 1 giờ với dữ liệu 1960–1975, và lệch cả ngày nếu giờ gần nửa đêm. Filter, rule "hôm nay" và nút "Now" cũng ra kết quả khác nhau tuỳ máy.

Mục tiêu: consumer chọn được một múi giờ IANA cố định cho cả hệ thống. Khi đó mọi chỗ convert/parse/hiển thị của Core UI cho cùng kết quả trên mọi máy. Consumer không cấu hình thì hành vi giữ nguyên như hiện tại.

Thành công khi:

- cấu hình `timeZone: 'Asia/Ho_Chi_Minh'` làm dữ liệu 1960 hiển thị, lọc, kiểm tra rule và gửi đi (`form.value`, `transform`) giống nhau ở VN, ở Thái Lan và trên CI chạy UTC;
- code app có hàm convert/parse đã gắn sẵn múi giờ hệ thống;
- consumer không cấu hình không thấy thay đổi nào.

## Requirements

- R-001 - `@sdcorejs/utils` 1.3.0 (minor). Owner: `sdcorejs-ultis`.
  - `DateUtilities` có `TimeZoneOptions` (`{ timeZone?: string }`, IANA id) làm tham số tuỳ chọn cuối cho `toFormat`, `parseFrom`, `begin`, `end`.
  - Thêm `parse(value, options?)` public: nhận mọi input mà `isDate` nhận, trả `Date | null`.
  - Thêm `isValidTimeZone`, `toZonedParts`, `fromZonedParts`.
  - `FilterUtilities` có `timeZone` trong `MatchOptions` và `ToEpochOptions`, để `date-today`, `date-relative` và toán hạng ngày không có múi giờ được tính trong zone. `resolveRelativeDate` nhận cùng option.
  - Không truyền option thì kết quả giống hệt 1.2.6. Không có state global.
  - Guide `dates-time-zones`, README và changeset mô tả API mới.
- R-002 - `ISdCoreConfiguration` có thêm `timeZone?: SdTimeZone`. Owner: `configurations`.
  - Kiểu là union literal mở: `'local'`, các IANA id hay dùng, và mọi IANA id khác.
  - Chỉ đọc từ root injector.
  - Không đặt, hoặc đặt `'local'`: hành vi như hiện tại.
  - Offset số hoặc id lạ: lần dùng đầu tiên của service throw lỗi rõ ràng.
- R-003 - `@sdcorejs/angular/services/date-time` export `SdDateTimeService` (`providedIn: 'root'`), gắn sẵn zone đã cấu hình. Service có `timeZone`, `toFormat`, `parse`, `parseFrom`, `begin`, `end`, `beginOfNextDay`, `today`, `now`, `toWallClock`, `fromWallClock`. Owner: `services/date-time`.
- R-004 - Mọi chỗ hiển thị đưa instant về giờ đồng hồ của zone:
  - pipe `sdFormatDate`, `sdFormatDatetime`, `sdTimeDifferent`, và qua đó ô và aggregate MIN/MAX của `sd-table`;
  - text read-only của `sd-date-range`, cũng là chip ngày của query-bar;
  - `viewDateTime` của history;
  - phần hiển thị read-only và giá trị mặc định trong inspector của form-generic;
  - pipe column transform của import-excel;
  - `modifiedAt` của file-explorer, kể cả nhãn hôm nay/hôm qua.

  Owner: `pipes` và các component kể trên.
- R-005 - `sd-date`, `sd-date-range`, `sd-datetime`. Owner: `forms`.
  - Model là instant thì hiện thành ngày lịch hoặc giờ đồng hồ theo zone.
  - `Date` của picker và control là vật mang giờ đồng hồ.
  - `transform` serialize từ giờ đồng hồ đó trong zone; input dạng ngày lấy 00:00.
  - `'TODAY'`, min/max và `today()` của date adapter (mốc hôm nay trên lịch, nút Now) tính theo zone.
  - Khi có cấu hình múi giờ, control đăng ký vào form cha mang **giá trị model** thay cho vật mang, kể cả khi không có `transform`.
- R-006 - `sd-table` tính theo zone ở mọi chỗ. Owner: `components/table`.
  - Áp cho: filter gửi server (date, daterange, datetime, payload range), filter client (giá trị của dòng parse qua service), sort local, parse cho aggregate, export Excel.
  - Filter theo ngày là [đầu ngày, đầu ngày lịch kế tiếp) trong zone.
  - Filter datetime đọc giá trị không có múi giờ như giờ đồng hồ trong zone.
  - Ở chế độ local, mọi cận giữ đúng giá trị hiện tại.
- R-007 - Khi có cấu hình múi giờ, import-excel đọc ô Date (field UTC của exceljs là giờ đồng hồ Excel) và ô text parse theo `format` như giờ đồng hồ trong zone. Format chỉ có giờ thì lấy ngày hôm nay trong zone. Kiểu lưu giữ như hiện tại: ô Date lưu chuỗi ISO, ô text lưu `Date`. Không cấu hình thì giá trị như hiện tại. Owner: `components/import-excel`.
- R-008 - form-generic. Owner: `components/form-generic`.
  - Biên `today` của field datetime là đầu và cuối ngày hôm nay trong zone.
  - Rule và validation chạy `FilterUtilities` với `MatchOptions.timeZone`.
  - Phần hiển thị read-only format qua một date formatter truyền trong display options.
- R-009 - Các giá trị sau không bao giờ bị lệch, và hiển thị/emit cùng chữ số ở mọi cấu hình:
  - giá trị chỉ có ngày lịch;
  - chuỗi giờ không có múi giờ, emit khi không có `transform`;
  - giá trị của `sd-chip-calendar` và `forms/time`;
  - `Date` của picker và control.

  Pipe tạo bằng `new` ngoài injection context giữ hành vi local. Owner: `forms`, `pipes`.
- R-010 - Docs, CHANGELOG và rollout. Owner: `sdcorejs-angular`.
  - Docs mô tả `timeZone`: `sd-core.configuration`, `sd-date-time` mới, các pipe, `sd-date`, `sd-datetime`, `sd-date-range`, filter của `sd-table`, `sd-import-excel`, `sd-file-explorer`, `sd-form-generic`, và ghi chú cho BE của query-bar/query-builder.
  - Mục Unreleased của CHANGELOG mô tả `timeZone`, nêu cả thay đổi `form.value` với app có đặt `timeZone`.
  - Showcase đăng ký `sd-date-time`.
  - Pin `@sdcorejs/utils` 1.3.0 ở mọi line, mọi lockfile `versions/v*` và showcase.
  - v20–v22 chỉ sinh từ `npm run sync`.

## Decisions

- D-001 - Hàm convert/parse theo zone đặt ở đâu → utils thêm option và helper (1.3.0); Core UI thêm configuration và service, rồi nối vào mọi chỗ xử lý date. Nguồn: người dùng.
- D-002 - Cấu hình ở đâu → `ISdCoreConfiguration.timeZone` qua `SD_CORE_CONFIGURATION`; không thêm hàm `provide*`. Nguồn: người dùng.
- D-003 - Kiểu giá trị → union literal mở `SdTimeZone`, danh sách như ở mục Architecture. Nguồn: người dùng.
- D-004 - Không có override theo component hay pipe. Nguồn: người dùng.
- D-005 - Ngữ nghĩa theo loại giá trị → bảng ở mục Architecture. Nguồn: người dùng.
- D-006 - `Date` của picker và control là vật mang giờ đồng hồ; chỉ quy đổi ở biên model ↔ control. Nguồn: người dùng.
- D-007 - Service → `SdDateTimeService` ở `@sdcorejs/angular/services/date-time`.
  - Có `timeZone`, `toFormat`, `parse`, `parseFrom`, `begin`, `end`, `beginOfNextDay`, `today`, `now`, `toWallClock`, `fromWallClock`.
  - Input sai: các hàm trả `null`, riêng `toFormat` trả chuỗi rỗng.
  - Ở chế độ local, `beginOfNextDay` đúng bằng `DateUtilities.begin(DateUtilities.addDays(value, 1))`.

  Nguồn: duyệt cùng spec. Lý do: review cho thấy `end + 1 ms` khác cách cũ vào các ngày đổi offset, nên cần hàm riêng giữ local mode y nguyên.
- D-008 - API của utils:
  - `DateUtilities`: `TimeZoneOptions` cho `toFormat`, `parseFrom`, `begin`, `end`; `parse(value, options?)` mới, trả `Date | null`; `isValidTimeZone`; `toZonedParts` trả `{ year, month (1-12), day, hour, minute, second, millisecond }` hoặc `null`; `fromZonedParts` chuẩn hoá field tràn như `Date.UTC`.
  - `FilterUtilities`: `timeZone` trong `MatchOptions` và `ToEpochOptions`; `resolveRelativeDate(relative, now, options?)`.
  - Giờ đồng hồ lặp lại lấy offset sớm hơn; giờ bị bỏ qua dời về sau (`'compatible'` của Temporal).

  Nguồn: duyệt cùng spec. Owner: `sdcorejs-ultis`. Lý do: `parseDateInput` không public và có throw, nên thêm `parse` public thay vì mở hàm nội bộ.
- D-009 - `timeZone` sai → từ chối offset số (dù `Intl` nhận `'+07:00'`) và id lạ; service throw ở lần dùng đầu, thông báo nêu giá trị sai. Nguồn: duyệt cùng spec.
- D-010 - Test → TDD, assert không phụ thuộc múi giờ của máy chạy test; giữ nguyên các spec cũ. Nguồn: người dùng.
- D-011 - Các chỗ giữ nguyên:
  - audit-diff, autoid-inspector, preview của api-contract-builder giữ chuỗi ISO thô;
  - `sd-chip-calendar` chỉ làm việc với ngày lịch;
  - code chỉ chạm vật mang giữ local: pipe `date` của Angular và `toLocaleDateString` trên min/max đã quy đổi, `date-input.util`;
  - timestamp trong tên file export Excel và hook `data-value` của data-state;
  - query-bar/query-builder gửi nguyên giá trị không có múi giờ và token `TODAY`/tương đối (BE tự tính trong zone, có ghi docs);
  - today-info của layout làm sau.

  Nguồn: duyệt cùng spec.
- D-012 - Ô Date của import-excel khi có zone → đọc field UTC làm giờ đồng hồ Excel, quy đổi trong zone. Nguồn: duyệt cùng spec.
- D-013 - Pin chính xác `@sdcorejs/utils` 1.3.0. Nguồn: người dùng.
- D-014 - Form cha nhận gì khi có zone → giá trị model, qua model-facing control có sẵn:
  - `'yyyy/MM/dd'` (date), `'yyyy/MM/dd HH:mm:ss'` (datetime), model range, hoặc output `transform`;
  - không có zone thì vẫn là `Date` như hiện tại.

  Nguồn: người dùng. Lý do: `Date` vật mang serialize ra instant phụ thuộc máy, đúng là lỗi 1960.
- D-015 - Phạm vi thêm → `today`/ngày tương đối và toán hạng không có múi giờ của `FilterUtilities` (rule/validation của form-generic), và `modifiedAt` của file-explorer. Nguồn: người dùng.
- D-016 - Pipe tạo bằng `new` ngoài injection context → dùng hành vi local, không throw. Nguồn: duyệt cùng spec. Lý do: spec hiện có và consumer đang tạo `sdFormatDate`/`sdFormatDatetime`/`sdTimeDifferent`/`viewDateTime` bằng `new`.
- D-017 - Kiểu lưu của import-excel → giữ nguyên ở cả hai chế độ; chỉ instant đổi theo zone; format chỉ có giờ lấy ngày hôm nay trong zone. Nguồn: duyệt cùng spec.
- D-018 - Snapshot release contract → sinh trong release ritual của suffix phát hành thay đổi này, không làm trong thay đổi này. Nguồn: duyệt cùng spec.

## Assumptions

- A-001 - Mọi trình duyệt mà Angular 19–22 hỗ trợ đều có `Intl.DateTimeFormat` với `timeZone` theo lịch sử IANA. Độ tin cậy cao. Cách kiểm: spec Karma assert giá trị 1960/1975.
- A-002 - exceljs trả ô ngày thành `Date` có field UTC đúng bằng giờ đồng hồ trong Excel. Độ tin cậy trung bình. Cách kiểm: spec import-excel đọc workbook có ô ngày thật.
- A-003 - utils 1.3.0 publish được trước bản Core UI pin nó. Độ tin cậy cao. Cách kiểm: `npm view @sdcorejs/utils@1.3.0` trước khi tag.
- A-004 - Consumer hiện tại không đặt `timeZone`, nên thay đổi không breaking. Độ tin cậy cao. Cách kiểm: AC-015.

## Architecture gate classification

- Status: required
- Signals: `conflicting-independent-unit-decisions`, `cross-repository-boundary`, `public-api-contract`
- Rationale:
  - API public mới ở hai repo;
  - Core UI phụ thuộc một bản minor mới của utils;
  - khoảng hai mươi chỗ xử lý date độc lập phải áp cùng ngữ nghĩa.

## Non-goals

- Không port sang Core UI Legacy.
- Không thêm override `timeZone` theo component hay pipe.
- Không đổi backend; không migrate dữ liệu đã lưu.
- Không hỗ trợ offset cố định.
- Không đổi `forms/time`.
- Không sinh snapshot release contract trong thay đổi này (D-018).

## Architecture

### Ngữ nghĩa theo loại giá trị (khi `timeZone` là IANA id)

| Loại giá trị | Ví dụ | Hiển thị | Khi đổi sang instant |
| --- | --- | --- | --- |
| Instant có `Z` hoặc offset | `1960-05-19T16:00:00Z` | giờ đồng hồ trong zone (VN: `20/05/1960 00:00`) | giữ nguyên |
| Giờ đồng hồ không có múi giờ | `1960/05/20 08:00:00` | giữ nguyên chữ số | giờ đó trong zone (VN: `1960-05-20T00:00:00.000Z`) |
| Chỉ có ngày lịch | `1960/05/20`, `1960-05-20` | giữ nguyên chữ số | 00:00 của ngày đó trong zone |
| `Date` của consumer trong model | `new Date(...)` | instant (như dòng đầu) | giữ nguyên |
| Vật mang (picker, control) | `new Date(1960, 4, 20, 8, 0)` | field local là giờ đồng hồ | `fromWallClock` |
| `today` / `now` | đồng hồ hệ thống | ngày lịch / giờ đồng hồ trong zone | như các dòng trên |

Khi `timeZone` không đặt hoặc là `'local'`, Core UI gọi utils không truyền option, nên kết quả giống hệt hiện tại.

### `@sdcorejs/utils` 1.3.0 (`sdcorejs-ultis`)

```ts
export interface TimeZoneOptions { timeZone?: string } // IANA id; omitted = host local (1.2.6)
export interface ZonedDateTimeParts { year: number; month: number; day: number; hour: number; minute: number; second: number; millisecond: number }

// DateUtilities (src/fns/date.fns.ts)
toFormat(value, format, options?: TimeZoneOptions): string;
parse(value, options?: TimeZoneOptions): Date | null;          // NEW: lenient, same inputs as isDate
parseFrom(value, format, options?: TimeZoneOptions): Date | null;
begin(value, options?: TimeZoneOptions): Date | null;
end(value, options?: TimeZoneOptions): Date | null;
isValidTimeZone(value: unknown): boolean;                       // IANA ids only
toZonedParts(value, timeZone: string): ZonedDateTimeParts | null;
fromZonedParts(parts: { year: number; month: number; day: number; hour?: number; minute?: number; second?: number; millisecond?: number }, timeZone: string): Date; // normalizes overflow like Date.UTC

// FilterUtilities (src/fns/filter.fns.ts, src/models/filter.model.ts)
MatchOptions.timeZone?: string;      // date-today, date-relative, zone-less date operands
ToEpochOptions.timeZone?: string;
resolveRelativeDate(relative, now?, options?: TimeZoneOptions): Date;
```

Cài đặt bằng `Intl.DateTimeFormat(...).formatToParts`, cache formatter theo zone. `fromZonedParts` đoán offset rồi sửa hai lần theo `'compatible'`. Đầu/cuối ngày tính theo ngày lịch.

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
  timeZone?: SdTimeZone; // Default: 'local'. Read from the root injector only.
}
```

**Service** (`services/date-time/src/date-time.service.ts`):

```ts
@Injectable({ providedIn: 'root' })
export class SdDateTimeService {
  readonly timeZone: SdTimeZone;
  toFormat(value: unknown, format: string): string;
  parse(value: unknown): Date | null;
  parseFrom(value: unknown, format: string): Date | null;
  begin(value: unknown): Date | null;
  end(value: unknown): Date | null;
  beginOfNextDay(value: unknown): Date | null;  // local: begin(addDays(value, 1)) exactly
  today(): Date;                                 // carrier: today 00:00 in the zone
  now(): Date;                                   // carrier: current wall clock in the zone
  toWallClock(value: unknown): Date | null;
  fromWallClock(value: Date): Date;
}
```

Constructor throw khi zone sai:

> `[@sdcorejs/angular] Invalid ISdCoreConfiguration.timeZone "<value>": use an IANA time zone id such as "Asia/Ho_Chi_Minh", or "local".`

**Chỗ nối vào:**

| Khu vực | Chỗ | Thay đổi |
| --- | --- | --- |
| Pipe | `format-date`, `format-datetime`, `time-different` | `toFormat` của service; tạo bằng `new` thì local (D-016) |
| Table | `table-filter.model.ts` | `begin` và `beginOfNextDay` cho cận ngày; `parse` cho datetime; `begin`/`end` cho range |
| Table | `table-local.util.ts`, `table-local-sort.util.ts`, `table-aggregate.util.ts` | parse giá trị dòng qua service; `begin`/`end` |
| Table | `table-export.service.ts` | `toFormat` của service |
| sd-date | `date.component.ts` | tách hàm chuẩn hoá cho model và cho vật mang; model → service; `transform` → `fromWallClock`; min/max và `TODAY` qua service; model-facing control khi có zone |
| sd-date-range | `date-range.component.ts` | như sd-date cho từng đầu; text read-only qua `toFormat` của service |
| sd-datetime | `datetime.component.ts` | model → `toWallClock`; commit → `fromWallClock`; min/max, `TODAY` và giá trị gợi ý của picker → `now()`; model-facing control khi có zone |
| Date adapter | adapter của Core UI cho picker | `today()` trả vật mang của hôm nay trong zone |
| Transform | `sd-temporal-transform.ts` | fallback chỉ trả instant; chuỗi không có múi giờ trả `null` |
| Form-generic | biên `today`, rule/validation, hiển thị | `begin`/`end(now)`; `MatchOptions.timeZone`; formatter trong display options |
| History | `view-date.pipe.ts` | `toFormat` của service |
| Import-excel | `import-excel.component.ts`, `column-transform.pipe.ts` | D-012, D-017; `parseFrom`/`toFormat` của service |
| File-explorer | `file-explorer.utils.ts` và nơi gọi | ngày và nhãn hôm nay/hôm qua theo zone |

**Giữ nguyên:** xem D-011, cộng `forms/time`.

**Rollout:** sửa ở `versions/v19`, rồi `npm run sync`. Pin 1.3.0 ở `projects/sdcorejs-angular/package.json`; `versions/v19/package.json`; mọi `versions/v*/package-lock.json` (sync không chép lockfile); và `showcase/package.json` cùng lockfile của nó.

## Stack profile and technology assumptions

- Track: `angular`. Stack profile: `core-ui-angular` (repo phát triển thư viện).
- Profile evidence:
  - Angular 19 standalone và signals;
  - `SD_CORE_CONFIGURATION` và model-facing control đã có;
  - `@sdcorejs/utils` 1.2.5 pin chính xác;
  - `date-fns` 3.6 cho picker.
- Technology assumptions:
  - không thêm package mới;
  - không dùng `@date-fns/tz` vì cần date-fns 4;
  - không dùng Temporal;
  - `Intl` có sẵn (A-001).

## File structure

**`sdcorejs-ultis`:**

- `src/fns/date.fns.ts`, `src/fns/filter.fns.ts`, `src/models/filter.model.ts` - sửa.
- Spec tương ứng - sửa: test mới; suite 1.2.6 giữ nguyên.
- `site/src/content/guides/dates-time-zones.ts`, `README.md`, `.changeset/*.md` - sửa/tạo.

**`sdcorejs-angular`:** tương đối với `versions/v19/projects/sdcorejs-angular/`, trừ mục ghi root.

- `configurations/src/sd-core.configuration.ts` + `.md` - sửa.
- `services/date-time/**` - tạo mới: entry point, service, spec, `sd-date-time.md`. Sửa `services/index.ts`.
- `pipes/src/{format-date,format-datetime,time-different}.pipe.ts` + spec + md - sửa.
- `forms/models/src/sd-temporal-transform.ts`, adapter dùng cho picker + spec - sửa.
- `forms/date/**`, `forms/date-range/**`, `forms/datetime/**` (component, spec, md) - sửa.
- `components/table/src/services/{table-filter,table-local,table-export}/**`, `table-aggregate.util.ts` + spec, `sd-table.md` - sửa.
- `components/import-excel/**` (component, pipe, spec, md) - sửa.
- `components/form-generic/**`: biên datetime, `rules/form-generic-display.ts`, `rules/form-generic-filter.ts`, inspector, spec, md - sửa.
- `components/history/pipes/view-date.pipe.ts` + spec - sửa.
- `components/file-explorer/src/file-explorer.utils.ts`, nơi gọi + spec, md - sửa.
- Docs của query-bar và query-builder - sửa: ghi chú cho BE.
- `package.json` (thư viện) - sửa: pin 1.3.0.
- Root: `versions/v19/package.json`, `versions/v{19,20,21,22}/package-lock.json`, `showcase/package.json`, `showcase/package-lock.json` - sửa: pin 1.3.0.
- Root: `showcase/src/app/docs/core/documentation.registry.ts` và các con số đếm liên quan - sửa.
- Root: `CHANGELOG.md` - sửa.
- `versions/v20|v21|v22/projects/**` - chỉ do `npm run sync` sinh ra.

## Acceptance criteria

Mọi tiêu chí đều tự động hoá. "VN" là `Asia/Ho_Chi_Minh`, "BKK" là `Asia/Bangkok`.

- AC-001 - `toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm', { timeZone })` → VN `'20/05/1960 00:00'`, BKK `'19/05/1960 23:00'`, trên máy ở múi giờ bất kỳ. (R-001)
- AC-002 - Các hàm utils với VN. (R-001)
  - `fromZonedParts({1960,5,20})` ra `1960-05-19T16:00:00.000Z`; `day: 32` được chuẩn hoá thành `1960-05-31T16:00:00.000Z`.
  - 23:30 lặp lại của 1975-06-12 ra `1975-06-12T15:30:00.000Z`.
  - `begin`/`end` của 1975/06/12 ra `1975-06-11T16:00:00.000Z` / `1975-06-12T16:59:59.999Z`.
  - `parse('1960/05/20 08:00:00')` ra `1960-05-20T00:00:00.000Z`; instant có `Z` giữ nguyên; `parse('abc')` ra `null`.
  - `toZonedParts` của từng kết quả trả lại đúng input.
- AC-003 - `isValidTimeZone` → `true` với `'Asia/Ho_Chi_Minh'`, `'UTC'`, `'Etc/GMT-7'`; `false` với `'+07:00'`, `'GMT+7'`, `'UTC+07:00'`, `'Mars/Base'`, `'local'`, `''`, giá trị không phải chuỗi. (R-001)
- AC-004 - Suite date và filter của 1.2.6 pass không sửa. Gọi không option thì kết quả như 1.2.6. `parse` không option trả đúng instant mà `isDate` chấp nhận. Gọi xen kẽ hai zone thì kết quả độc lập. (R-001)
- AC-005 - `timeZone` `'+07:00'` hoặc `'Mars/Base'` → inject service throw `Error` nêu giá trị và hướng dẫn. `'Asia/Ho_Chi_Minh'`, `'local'` hoặc không đặt thì không lỗi. (R-002)
- AC-006 - Service với VN/BKK, đồng hồ mock `2026-08-14T17:30:00Z`. (R-003)
  - `toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy')`: VN `'20/05/1960'`, BKK `'19/05/1960'`.
  - `today()`: 2026-08-15 00:00. `now()`: 2026-08-15 00:30.
  - `beginOfNextDay('1975/06/12')` (VN): `1975-06-12T17:00:00.000Z`.
  - `toWallClock('1960-05-20T00:00:00Z')` (VN): 1960-05-20 08:00.
  - `fromWallClock(new Date(1960, 4, 20, 8, 0))` (VN): `1960-05-20T00:00:00.000Z`.
- AC-007 - Render `'1960-05-19T16:00:00Z'` qua `sdFormatDate`, `sdFormatDatetime`, `sdTimeDifferent` (đã quá ngưỡng), ô datetime của table, `viewDateTime`, hiển thị form-generic. (R-004)
  - VN: `'20/05/1960'`, `'20/05/1960 00:00:00'`, `'20/05/1960'`, `'00:00 20/05/1960'`.
  - BKK: `'19/05/1960'`, `'19/05/1960 23:00:00'`, `'19/05/1960'`, `'23:00 19/05/1960'`.
- AC-008 - VN, `transform="ISOString"`: chọn 20/05/1960 và 15/08/2026 trong `sd-date` và ở hai đầu `sd-date-range` → emit `'1960-05-19T16:00:00.000Z'` và `'2026-08-14T17:00:00.000Z'`. Model `'1960-05-19T16:00:00Z'` hiện 20/05/1960 (VN), 19/05/1960 (BKK). (R-005)
- AC-009 - VN: nhập 20/05/1960 08:00 vào `sd-datetime`. (R-005)
  - Có `transform`: emit `'1960-05-20T00:00:00.000Z'`. Không có: emit `'1960/05/20 08:00:00'`.
  - Model `'1960-05-20T00:00:00Z'` hiện `'20/05/1960 08:00'`.
- AC-010 - VN, đồng hồ mock `2026-08-14T17:30:00Z`, máy bất kỳ: min/max `'TODAY'`, mở lịch, bấm Now. (R-005)
  - Biên ngày và mốc hôm nay trên lịch: 15/08/2026.
  - Biên datetime: 15/08/2026 00:30. Now ghi 15/08/2026 00:30.
- AC-011 - VN, filter gửi server của table. (R-006)
  - date 1960/05/20: `GREATER_OR_EQUAL '1960-05-19T16:00:00.000Z'`, `LESS_THAN '1960-05-20T16:00:00.000Z'`.
  - daterange 1975/06/12–1975/06/12: `GREATER_OR_EQUAL '1975-06-11T16:00:00.000Z'`, `LESS_THAN '1975-06-12T17:00:00.000Z'`.
  - datetime `'1960/05/20 08:00:00'`: `'1960-05-20T00:00:00.000Z'`.
- AC-012 - VN, máy bất kỳ. (R-006)
  - Lọc client theo ngày 1960/05/20: dòng `'1960-05-19T16:00:00Z'` và dòng `'1960/05/20 23:30:00'` đều khớp.
  - MIN của `['1960/05/20', '1960/05/21']`: 20/05/1960.
  - Export ghi `'1960/05/20'` và `'1960/05/20 00:00:00'`.
- AC-013 - VN: ô Date `new Date(Date.UTC(1960, 4, 20))` và ô text `'20/05/1960'` (format `'dd/MM/yyyy'`). (R-007)
  - Ô Date lưu chuỗi `'1960-05-19T16:00:00.000Z'`. Ô text lưu `Date` có `toISOString()` là `'1960-05-19T16:00:00.000Z'`. Cả hai hiện 20/05/1960.
  - Không có zone: giá trị như hiện tại.
- AC-014 - VN, đồng hồ mock `2026-08-14T17:30:00Z`. (R-008)
  - Field datetime có min/max `'today'`: min `'2026-08-14T17:00:00.000Z'`, max `'2026-08-15T16:59:59.999Z'`.
  - Rule `GREATER_OR_EQUAL date-today`: đúng với `'2026/08/15'`, sai với `'2026/08/14'`, trên máy bất kỳ.
- AC-015 - Spec cũ của các chỗ bị sửa pass không cần sửa, với cấu hình trống và `'local'`. Bao gồm spec tạo pipe bằng `new`, mọi cận ngày của filter, và `Date` đăng ký vào form cha. (R-002, R-009)
- AC-016 - Dưới VN, BKK và cấu hình trống, bốn giá trị sau hiển thị và emit cùng chữ số: `'1960/05/20'`, `'1960/05/20 08:00:00'` (không `transform`), `['1960/05/20']` của chip-calendar, `'08:00'` của `forms/time`. (R-009)
- AC-017 - `npm run sync`, `check:sync`, test registry của Showcase, và kiểm pin ở mọi `package.json`/lockfile đã liệt kê → tất cả pass; mọi file pin 1.3.0; `sd-date-time.md` đã đăng ký; docs và CHANGELOG mô tả `timeZone` và thay đổi `form.value`. (R-010)
- AC-018 - VN, không `transform`, bind `sd-date`/`sd-datetime`/`sd-date-range` vào FormGroup cha, nhập 20/05/1960 (08:00) → giá trị FormGroup là `'1960/05/20'`, `'1960/05/20 08:00:00'` và `{ from: '1960/05/20', to: '1960/05/20' }`. Không có zone thì FormGroup vẫn giữ `Date` như hiện tại. (R-005)
- AC-019 - VN, máy bất kỳ: `sd-datetime` min `'2026-08-14T17:00:00Z'` → picker minimum có field local 2026-08-15 00:00. `sd-date` min `'1960-05-19T16:00:00Z'` → ngày sớm nhất chọn được là 20/05/1960. (R-005)
- AC-020 - `sd-date-range viewed='inline'` với model `{ from: '1960-05-19T16:00:00Z', to: '1960-05-20T16:00:00Z' }` → VN `'20/05/1960'`, `'21/05/1960'`; BKK `'19/05/1960'`, `'20/05/1960'`. (R-004)
- AC-021 - Đồng hồ mock `2026-08-14T18:00:00Z`, `modifiedAt` `'2026-08-14T16:30:00Z'` → VN gắn nhãn hôm qua; UTC gắn nhãn hôm nay. (R-004)
- AC-022 - `FilterUtilities.evaluate` với filter `GREATER_OR_EQUAL date-today` trên field `'2026/08/15'`, now `2026-08-14T17:30:00Z`. (R-001)
  - Có `timeZone` VN: today là `2026-08-14T17:00:00.000Z`, item khớp.
  - Không có `timeZone`: kết quả như 1.2.6.

## Risks & mitigations

- **Risk:** sót một chỗ còn tính theo giờ local. → **Mitigation:** service là cửa duy nhất cho giá trị model. Grep trong review mở rộng ra `new Date(`, getter local và `Intl.DateTimeFormat`, có allowlist cho code vật mang.
- **Risk:** người xem ở vùng có DST gặp giờ không tồn tại trên vật mang. → **Mitigation:** ghi giới hạn vào docs.
- **Risk:** dữ liệu cũ do BE tạo bằng +07:00 cố định lệch 1 giờ với dữ liệu 1960–1975. → **Mitigation:** ghi trong docs và CHANGELOG.
- **Risk:** thứ tự release. → **Mitigation:** release utils trước (A-003).
- **Risk:** `Intl` chậm trong table lớn. → **Mitigation:** cache formatter; nhánh local không gọi `Intl`.
- **Risk:** `form.value` đổi kiểu (`Date` → chuỗi) với app bật `timeZone`. → **Mitigation:** chỉ khi bật; ghi rõ trong CHANGELOG và docs component.
- **Risk:** pipe tạo bằng `new` không theo zone. → **Mitigation:** D-016 giữ local; docs hướng dẫn dùng pipe qua template hoặc `inject()`.

## Out of scope (deferred)

- Port sang Legacy - khi người dùng yêu cầu.
- Override theo component hoặc pipe - khi có màn cần nhiều múi giờ.
- today-info của layout - khi người dùng yêu cầu.
- Helper cho BE - khi BE cần lọc theo cùng zone.
- Snapshot release contract - trong release ritual (D-018).

## Decisions captured during review

- r2 supersedes r1 after the independent architecture review of 2026-10-16 (see change_control.change_reason).
- The user chose: form.value holds the model value under a configured zone (D-014); FilterUtilities today/relative and file-explorer modifiedAt join the scope (D-015).
- The spec was approved as drafted.

## Skill provenance

sdcorejs-spec (approved on attempt 2 / 3)

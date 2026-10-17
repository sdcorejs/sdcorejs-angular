---
{
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-16T09:28:50.000Z",
  "approved_by": "user",
  "artifact_id": "architecture-core-ui-fixed-timezone-r1",
  "artifact_kind": "architecture",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "core-ui-fixed-timezone",
  "commit_policy": "with-change",
  "contract_id": "core-ui-fixed-timezone",
  "description": "Fixed time zone architecture r1: utils owns zone arithmetic, SdDateTimeService is the only gateway for model dates, carriers convert only at the model/control boundary, local mode byte-identical, model-facing form values under a zone; 10 invariants, 9 validation obligations, D-019..D-029.",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "name": "core-ui-fixed-timezone-architecture",
  "owner": "sdcorejs-architecture",
  "owner_module_id": null,
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [
    {
      "approval_hash": "sha256:v1:ee30a3ada737f889bda593f0f5674d63d25c37a2e23de1ad065b37907eede067",
      "artifact_id": "spec-core-ui-fixed-timezone-r3",
      "artifact_kind": "spec",
      "repository_id": "sdcorejs-angular",
      "revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799"
    }
  ],
  "parent_repository_id": "sdcorejs-angular",
  "profile_confidence": "high",
  "redaction_applied": false,
  "repository_relative_path": ".sdcorejs/architecture/angular/2026-10-16-15-55-core-ui-fixed-timezone.md",
  "requirement_id": "R-003",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/architecture/2026-10-16-15-55-core-ui-fixed-timezone-architecture.md",
  "source_plan": "none",
  "source_revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
  "source_spec": ".sdcorejs/specs/angular/2026-10-16-15-37-core-ui-fixed-timezone-r3.md",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:4d194a5e8ce45efd229b247c3b0433a639f5035c044e8127e14b530a81b1d217"
}
---
# Architecture — Múi giờ cố định cho toàn hệ thống (utils + Core UI) - Approved Architecture

> Snapshot of what the user approved at the `sdcorejs-architecture` gate. Do not edit by hand; re-author through `sdcorejs-architecture` if the contract changes.

## Approved contract

# Architecture — Múi giờ cố định cho toàn hệ thống (utils + Core UI) - 2026-10-16

Spec gốc: `.sdcorejs/specs/angular/2026-10-16-15-37-core-ui-fixed-timezone-r3.md` (`spec-core-ui-fixed-timezone-r3`).

## Trigger và owner

- Gate bắt buộc, có ba signal:
  - `cross-repository-boundary`;
  - `public-api-contract`;
  - `conflicting-independent-unit-decisions`.
- Owner và integration owner là `sdcorejs-angular`, cũng là repo điều phối.
- `sdcorejs-ultis` là repo con. Architecture tham chiếu `src/fns/date.fns.ts`, `src/fns/filter.fns.ts` và `src/models/filter.model.ts` tại `9eb3052c`.

## Ranh giới và hướng phụ thuộc

- **B-001:** utils lo phần tính toán múi giờ: tách field qua `Intl`, parse/format theo zone, đầu ngày lịch, today và ngày tương đối của filter. Core UI chỉ lo configuration và phần nối vào Angular.
- **B-002:** `SdDateTimeService` là cổng duy nhất giữa giá trị model và zone.
- **B-003:** biên model ↔ control của từng form ngày là nơi duy nhất model biến thành vật mang và ngược lại. Biên này gồm: hàm chuẩn hoá model, `writeValue`, commit/serialize, min/max và việc đăng ký model-facing control.

| Từ | Đến | Ghi chú |
| --- | --- | --- |
| `sdcorejs-angular` (mọi line, showcase) | `@sdcorejs/utils` 1.3.0 | pin chính xác, chỉ subpath public |
| `services/date-time` | `configurations`, `@sdcorejs/utils/fns` | mới |
| `pipes`, `forms/models`, `forms/date*`, `components/{table,import-excel,form-generic,history,file-explorer}` | `@sdcorejs/angular/services/date-time` | mới; **import thẳng entry point**, không qua barrel `services` |
| `services/date-time` | `pipes`/`forms`/`components`/`modules` | cấm |

Lý do cấm barrel: `@sdcorejs/angular/services` re-export `services/confirm`, mà `services/confirm` lại import `forms/date` và `forms/datetime` (`dialog-confirm.component.ts:6-7`). Form nào import barrel sẽ tạo vòng build.

## Quyết định kiến trúc

- **D-019 — tách chuẩn hoá model khỏi chuẩn hoá vật mang.**
  - `normalizeDateModel` (sd-date), `#coerceEndpoint` (sd-date-range) và `datetimeModelToControl` (sd-datetime) hiện phục vụ cả model lẫn vật mang. Mỗi hàm tách làm hai: bản cho model đi qua service; bản cho vật mang giữ phép tính local.
  - Fallback chỉ dùng cho những gì utils từ chối: RFC-1123, ISO có dấu cách cộng `Z`/offset, phần giây lẻ quá 9 chữ số, khoảng trắng đầu/cuối.
  - Hàm public `sdParseTransformedTemporal` giữ nguyên. Khi có zone, các form dùng một biến thể nội bộ chỉ trả instant (chuỗi không có múi giờ thì trả `null`).
  - `Date` trong model là instant.
- **D-020 — chỗ quy đổi vật mang.**
  - Chỉ `toWallClock`, `fromWallClock`, `today`, `now` của service đi qua lại giữa model và vật mang.
  - `sdSerializeTemporalValue(instant, transform)` và `sdLocalStartOfDay(carrier)` giữ nguyên, không DI.
  - `SdStrictDateFnsAdapter` (`forms/models`) trả `service.today()` từ `today()`.
  - `sd-datetime` có một adapter con của Core UI, đặt trong `forms/datetime` (không đặt trong `forms/models` để tránh thêm phụ thuộc vào `@sdcorejs/angular-material-datetime`). Adapter này thay class provider và cả hai alias `SdDateAdapter`, `DateAdapter`, và trả `service.now()` từ `today()`, vì nút Now dùng `today()` làm cả ngày lẫn giờ.
- **D-021 — cận trên của filter theo ngày.**
  - Mọi cận `LESS_THAN` theo ngày dùng `service.beginOfNextDay(day)`.
  - Ở chế độ local, hàm này gọi đúng `begin(addDays(day, 1))`, kể cả khi kết quả là `null`. Nơi gọi giữ cách xử lý `null` như hiện tại.
  - Payload `range` giữ `end(day)` có tính cận.
- **D-022 — vòng đời zone.** Service ở root đọc `SD_CORE_CONFIGURATION` của root injector một lần. Provider ở injector lazy hay element không đổi được zone. Điều này được ghi trong docs, cạnh `format.number` (vốn đọc được từ element injector).
- **D-023 — thứ tự giữa hai repo.** utils merge và publish 1.3.0 trước. Core UI chỉ commit pin và lockfile 1.3.0 từ registry. Không commit tarball.
- **D-024 — form cha nhận model khi có zone.** `ɵsdModelFacingControl` của ba form ngày bật khi có `transform` **hoặc** có zone (`service.timeZone !== 'local'`).
- **D-025 — pipe lấy service thế nào.**
  - Bốn pipe gọi `assertInInjectionContext` (public) trong `try`; chỉ bắt NG0203, rồi dùng `DateUtilities` không option.
  - `inject(SdDateTimeService)` gọi ngoài `try`, để lỗi của service (ví dụ `timeZone` sai) vẫn ném ra.
  - Tạo pipe bằng `new` trong constructor hoặc field initializer là đang ở injection context, nên pipe theo zone. Điểm này ghi vào docs.
- **D-026 — import service.** `forms/**` và `pipes/**` (cùng mọi entry `services/confirm` chạm tới) import `@sdcorejs/angular/services/date-time` trực tiếp.
- **D-027 — form-generic.**
  - `sdDisplayValue` giữ là hàm thuần, nhận date formatter qua `SdFormGenericDisplayOptions`, giống `numberFormat`.
  - Rule và validation truyền `{ timeZone }` cho `FilterUtilities` chỉ khi có zone.
- **D-029 — chỗ đang parse bằng `new Date(...)`.**
  - Gồm: filter client (`table-local.util`), `table-local-sort.util`, `table-aggregate.util`, và `#parseDateBoundary` của ba form.
  - Ở chế độ local giữ nguyên `new Date(...)`; chỉ khi có zone mới dùng `service.parse`.
  - Lý do: parse native và parse của utils khác nhau với `yyyy-MM-dd`, số, RFC-1123 và text của `Date.toString()`. Đổi ở chế độ local sẽ phá INV-005.
- **D-028 — min/max và `TODAY`.** Khi có zone, `#parseDateBoundary` của ba form đi qua service:
  - `'TODAY'` là `today()` cho date và `now()` cho datetime;
  - giá trị khác thành vật mang bằng `toWallClock` (datetime) hoặc ngày lịch trong zone (date).

## Invariants

- **INV-001:** Hàm date/filter của utils 1.3.0 gọi không có `timeZone` thì trả đúng như 1.2.6. Kết quả có zone chỉ phụ thuộc tham số.
- **INV-002:** Chỉ import utils qua subpath public. Mọi `package.json` và lockfile đã liệt kê pin 1.3.0. Utils không phụ thuộc Angular.
- **INV-003:** Mọi quy đổi giá trị model đều đi qua service. Ngoài `services/date-time`, không file nào của thư viện áp các thứ sau lên giá trị model: hàm format/parse/đầu-cuối ngày của `DateUtilities`, `new Date(<value>)`, `Date.parse`, getter local, `Intl.DateTimeFormat` không có `timeZone`.
- **INV-004:** Vật mang chỉ xử lý bằng phép tính trên field local. Zone áp đúng một lần, tại biên model.
- **INV-005:** Ở chế độ local, mọi output, kể cả giá trị đăng ký vào form cha và cận ngày, bằng bản release hiện tại.
- **INV-006:** Zone hiệu lực là `'local'` hoặc id hợp lệ, resolve một lần từ root injector. Giá trị sai làm constructor throw.
- **INV-007:** Đầu ngày và đầu ngày kế tiếp tính theo ngày lịch trong zone. Filter theo ngày là `[begin, beginOfNextDay)`.
- **INV-008:** `services/date-time` chỉ phụ thuộc `configurations` và utils. `forms/**` và `pipes/**` không import barrel `services`.
- **INV-009:** Có zone thì control đăng ký vào form cha mang giá trị model. Không có zone thì mang đúng giá trị hiện tại: sd-date là `Date`, sd-datetime là chuỗi hiển thị, sd-date-range là `{ from: Date, to: Date }`.
- **INV-010:** Pipe chạy được cả trong và ngoài injection context. Ngoài injection context thì cư xử như chế độ local.

## Hợp đồng public

- **PC-001 (utils, `api`):** option `timeZone` cho `DateUtilities` và `FilterUtilities`; hàm mới `parse`, `isValidTimeZone`, `toZonedParts`, `fromZonedParts`. Bản minor chỉ thêm.
- **PC-002 (`configurations`, `api`):** `ISdCoreConfiguration.timeZone` và `SdTimeZone`, đọc từ root injector.
- **PC-003 (`services/date-time`, `api`):** entry point mới với `SdDateTimeService`.
- **PC-004 (hành vi, `api`):** khi có zone:
  - output `transform`, payload filter và instant của import-excel tính theo zone;
  - `form.value` của ba form ngày là giá trị model thay cho `Date`.

  Chỉ áp cho app bật `timeZone`; ghi trong CHANGELOG và docs.

## Nơi giữ dữ liệu và state

- Zone hệ thống lấy từ `SD_CORE_CONFIGURATION.timeZone` ở root injector; service resolve một lần.
- tzdata lấy từ `Intl`/ICU của trình duyệt (A-001).

## Tích hợp chéo repo

| Repo con | Đường dẫn | Revision gốc | Bàn giao |
| --- | --- | --- | --- |
| `sdcorejs-ultis` | `src/fns/date.fns.ts`, `src/fns/filter.fns.ts`, `src/models/filter.model.ts` | `9eb3052c` | merge và publish 1.3.0 trước khi Core UI pin (D-023) |

## Validation obligations

- **VAL-001** (INV-001; AC-001…AC-004, AC-022): vitest của utils; suite 1.2.6 không sửa; chạy dưới `TZ=UTC` và `TZ=Asia/Bangkok`.
- **VAL-002** (INV-002, INV-008; AC-017):
  - pin và lockfile ra 1.3.0;
  - grep không thấy import `dist`, import barrel `services` trong `forms`/`pipes`, hay import ngược từ `services/date-time`;
  - build v19 và `check:sync` pass.
- **VAL-003** (INV-003; AC-007, AC-011…AC-014, AC-020, AC-021):
  - spec Karma tương ứng pass;
  - grep `DateUtilities.*`, `new Date(`, `Date.parse`, getter local và `Intl.DateTimeFormat` ngoài service chỉ còn các chỗ vật mang trong allowlist của plan.
- **VAL-004** (INV-004; AC-008…AC-010, AC-016, AC-019): spec form pass trên host UTC và `Asia/Bangkok`.
- **VAL-005** (INV-005; AC-015): spec cũ pass không sửa.
- **VAL-006** (INV-006; AC-005, AC-006): spec service.
- **VAL-007** (INV-007; AC-002, AC-011, AC-012): các ca ngày 1975-06-12 dài 25 giờ.
- **VAL-008** (INV-009; AC-018): spec FormGroup cho ba form, có zone và không có zone.
- **VAL-009** (INV-010; AC-015): spec pipe dùng `new` không sửa vẫn pass; thêm spec cho pipe qua `inject()` theo zone.

## Review kiến trúc

Một agent riêng đã review bản nháp đầu, chỉ đọc. Kết luận là **rework**, với 3 blocker và 17 major. Bản này xử lý như sau:

- **Blocker, đã sửa ở spec r2 và ở đây:**
  - `parseDateInput` không public: thêm `DateUtilities.parse`;
  - `end + 1 ms` làm đổi cận ở chế độ local: dùng `beginOfNextDay` (D-021);
  - pipe đang được tạo bằng `new`: fallback local (D-016, D-025).
- **Major, chỗ còn sót, đã thêm vào phạm vi:**
  - lọc client, sort và aggregate của table;
  - text của `sd-date-range`;
  - `sdTimeDifferent`;
  - file-explorer;
  - `FilterUtilities` today/relative;
  - `today()` của adapter và nút Now;
  - min/max (D-028);
  - `form.value` mang vật mang (D-014, D-024).
- **Major, đã sửa ở đây:**
  - chuẩn hoá model và vật mang dùng chung hàm: tách ra (D-019);
  - danh sách input rơi vào fallback sai: sửa lại (D-019);
  - pin chưa tới lockfile và showcase: thêm vào spec r2.
- **Minor, đã sửa:**
  - vòng phụ thuộc qua barrel `services` (D-026, INV-008);
  - grep VAL-003 quá hẹp: mở rộng;
  - "once per injector": đổi thành root injector (D-022);
  - hiển thị của form-generic là hàm thuần (D-027);
  - kiểu lưu của import-excel (D-017);
  - entry point mới không cần sửa `coverage-includes.spec.ts`; snapshot release contract để đến release (D-018).
- **Ghi nhận, không sửa:** `begin(addDays(...))` hiện tại crash ở ngày mà nửa đêm không tồn tại trong múi giờ của máy (ví dụ `1947/03/31` khi máy ở VN). Chế độ local giữ nguyên hành vi đó (INV-005). Ở chế độ có zone, `beginOfNextDay` tính theo `'compatible'` nên không crash.

### Review lần hai

Reviewer kiểm lại bản làm lại và kết luận **approve with corrections**: 23/26 điểm đã xử lý, 2 điểm chấp nhận (9 và 11), điểm 14 sửa ở spec r3 (D-008). Các điểm mới đã sửa như sau:

- **N1 (major):** chỗ đang parse native giữ nguyên ở chế độ local (D-029).
- **N2:** pipe chỉ bắt NG0203 (D-025).
- **N3:** adapter của `sd-datetime` đặt trong `forms/datetime`, thay cả hai alias, và `today()` trả `now()` (D-020).
- **N4:** giá trị khi không có zone ghi đúng cho từng component (spec r3, INV-009).
- **N5:** hàm public `sdParseTransformedTemporal` giữ nguyên; thêm biến thể nội bộ (D-019).

Reviewer cũng xác nhận: model-facing control có sẵn ở cả ba form (D-024); hai adapter đều tạo trong injection context; `beginOfNextDay` ở chế độ local đúng y cách cũ (D-021).

## Profile frontend, giả định, quyết định hoãn

- **Profile frontend:** plan có `plan_context.frontend_architecture` tuân INV-003, INV-004, INV-008 và INV-009: service ở root; pipe inject có fallback; component form quy đổi ở biên và đăng ký model-facing control.
- **Giả định:** A-001…A-004 của spec. A-002 phải được xác nhận bằng spec import-excel trước khi viết code D-012.
- **Quyết định hoãn:** không có. Các mục deferred của spec giữ nguyên.

## Appendix — architecture_context (machine-readable)

```yaml
architecture_context: {
  "schema_version": 1,
  "source": "sdcorejs-architecture",
  "contract_id": "core-ui-fixed-timezone",
  "requirement_id": "R-003",
  "approved_spec_reference": {
    "repository_id": "sdcorejs-angular",
    "artifact_id": "spec-core-ui-fixed-timezone-r3",
    "artifact_kind": "spec",
    "revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
    "approval_hash": "sha256:v1:ee30a3ada737f889bda593f0f5674d63d25c37a2e23de1ad065b37907eede067"
  },
  "approved_architecture_path": "<filled after approval>",
  "approved_architecture_hash": "<filled after approval>",
  "owner_repository_id": "sdcorejs-angular",
  "owner_module_id": null,
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "trigger": {
    "required": true,
    "signals": [
      "conflicting-independent-unit-decisions",
      "cross-repository-boundary",
      "public-api-contract"
    ],
    "rationale": "Adds public API in two repositories (@sdcorejs/utils options and helpers; Core UI ISdCoreConfiguration.timeZone, SdTimeZone and SdDateTimeService), makes Core UI depend on a new utils minor, and about fifteen independent date surfaces must apply the same wall-clock semantics."
  },
  "invariants": [
    {
      "id": "INV-001",
      "statement": "Every @sdcorejs/utils 1.3.0 date and filter function called without a timeZone option returns exactly what 1.2.6 returns; zoned results depend only on the arguments (a per-zone Intl formatter cache is allowed, no other module state).",
      "scope": "sdcorejs-ultis src/fns/date.fns.ts, src/fns/filter.fns.ts",
      "owner": "sdcorejs-ultis/src/fns",
      "rationale": "Backends and older callers rely on 1.2.6 results; options must be strictly additive.",
      "verification_method": "VAL-001",
      "requirement_refs": [
        "R-001"
      ],
      "decision_refs": [
        "D-001",
        "D-008"
      ]
    },
    {
      "id": "INV-002",
      "statement": "@sdcorejs/angular imports @sdcorejs/utils only through its public subpaths, and every package.json and lockfile listed in the spec pins exactly 1.3.0; @sdcorejs/utils has no dependency on Angular or @sdcorejs/angular.",
      "scope": "package pins, lockfiles and imports of @sdcorejs/utils",
      "owner": "sdcorejs-angular",
      "rationale": "One-way dependency keeps utils framework-free and every workspace installable.",
      "verification_method": "VAL-002",
      "requirement_refs": [
        "R-001",
        "R-010"
      ],
      "decision_refs": [
        "D-001",
        "D-013",
        "D-023"
      ]
    },
    {
      "id": "INV-003",
      "statement": "Inside @sdcorejs/angular every conversion of a model value (instant, zone-less string, date-only string, consumer Date) to display text, calendar day, wall clock, filter bound or serialized instant goes through SdDateTimeService; outside services/date-time no library file applies DateUtilities.toFormat/begin/end/parseFrom/parse, new Date(<value>), Date.parse, local getters or Intl.DateTimeFormat without timeZone to a model value.",
      "scope": "every Core UI surface that handles a model date value",
      "owner": "sdcorejs-angular/services/date-time",
      "rationale": "A single gateway is the only way twenty surfaces stay consistent; one missed call reintroduces the 1960 shift.",
      "verification_method": "VAL-003",
      "requirement_refs": [
        "R-003",
        "R-004",
        "R-005",
        "R-006",
        "R-007",
        "R-008"
      ],
      "decision_refs": [
        "D-005",
        "D-007",
        "D-019",
        "D-027"
      ]
    },
    {
      "id": "INV-004",
      "statement": "Wall-clock carriers (picker and control Date objects, date-fns parsed control values, sd-chip-calendar cells, min/max carriers) are handled only with local-field arithmetic; the zone is applied exactly once per value, at the model boundary, and never to a carrier.",
      "scope": "sd-date, sd-date-range, sd-datetime, picker adapters, sd-chip-calendar, forms/models",
      "owner": "sdcorejs-angular/forms",
      "rationale": "Material and the adapters only understand local Date objects; converting a carrier again shifts it by the zone difference.",
      "verification_method": "VAL-004",
      "requirement_refs": [
        "R-005",
        "R-009"
      ],
      "decision_refs": [
        "D-006",
        "D-019",
        "D-020",
        "D-028"
      ]
    },
    {
      "id": "INV-005",
      "statement": "With timeZone unset or local, SdDateTimeService calls DateUtilities without options (beginOfNextDay = begin(addDays(value, 1))) and every Core UI output, including the value registered in a parent form, equals the current release output.",
      "scope": "SdDateTimeService local branch and every surface using it",
      "owner": "sdcorejs-angular/services/date-time",
      "rationale": "The feature is opt-in; consumers without timeZone must not see any change.",
      "verification_method": "VAL-005",
      "requirement_refs": [
        "R-002",
        "R-009"
      ],
      "decision_refs": [
        "D-005",
        "D-021"
      ]
    },
    {
      "id": "INV-006",
      "statement": "The effective zone is local or an id accepted by isValidTimeZone; numeric offsets and unknown ids make the SdDateTimeService constructor throw; the zone is resolved once from the root injector.",
      "scope": "SdDateTimeService construction",
      "owner": "sdcorejs-angular/services/date-time",
      "rationale": "A fixed offset or a typo would silently reproduce the bug.",
      "verification_method": "VAL-006",
      "requirement_refs": [
        "R-002"
      ],
      "decision_refs": [
        "D-002",
        "D-003",
        "D-009",
        "D-022"
      ]
    },
    {
      "id": "INV-007",
      "statement": "Calendar-day bounds are computed with calendar arithmetic in the zone (begin of the day, begin of the next calendar day), never by adding 24 hours; a day filter is [begin, beginOfNextDay).",
      "scope": "utils begin/end and Core UI day filters",
      "owner": "sdcorejs-angular",
      "rationale": "Days around offset changes are not 24 hours long (1975-06-12 in Asia/Ho_Chi_Minh has 25).",
      "verification_method": "VAL-007",
      "requirement_refs": [
        "R-001",
        "R-006"
      ],
      "decision_refs": [
        "D-008",
        "D-021"
      ]
    },
    {
      "id": "INV-008",
      "statement": "services/date-time depends only on @sdcorejs/angular/configurations and @sdcorejs/utils; forms/** and pipes/** import @sdcorejs/angular/services/date-time directly and never the services barrel; services/date-time imports no pipes, forms, components or modules entry point.",
      "scope": "imports of services/date-time and of the services barrel",
      "owner": "sdcorejs-angular/services/date-time",
      "rationale": "services/confirm imports forms/date and forms/datetime; a barrel import from forms would cycle.",
      "verification_method": "VAL-002",
      "requirement_refs": [
        "R-003"
      ],
      "decision_refs": [
        "D-007",
        "D-026"
      ]
    },
    {
      "id": "INV-009",
      "statement": "With a configured zone, the control that sd-date, sd-datetime and sd-date-range register in a parent form carries the model value; without a zone it carries exactly today's value (sd-date: Date, sd-datetime: display string, sd-date-range: { from: Date, to: Date }).",
      "scope": "model-facing registration of sd-date, sd-datetime, sd-date-range",
      "owner": "sdcorejs-angular/forms",
      "rationale": "A carrier in form.value serializes to a host-dependent instant.",
      "verification_method": "VAL-008",
      "requirement_refs": [
        "R-005"
      ],
      "decision_refs": [
        "D-014",
        "D-024"
      ]
    },
    {
      "id": "INV-010",
      "statement": "The date pipes work with and without an injection context; without one they behave exactly as the local mode.",
      "scope": "sdFormatDate, sdFormatDatetime, sdTimeDifferent, viewDateTime construction",
      "owner": "sdcorejs-angular/pipes",
      "rationale": "Existing specs and consumers create these pipes with new.",
      "verification_method": "VAL-009",
      "requirement_refs": [
        "R-009"
      ],
      "decision_refs": [
        "D-016",
        "D-025"
      ]
    }
  ],
  "boundaries": [
    {
      "id": "B-001",
      "statement": "@sdcorejs/utils owns zone arithmetic (Intl-based parts, zoned parse/format, calendar bounds, filter today/relative); Core UI owns the configuration and the Angular wiring.",
      "invariant_refs": [
        "INV-001",
        "INV-002"
      ]
    },
    {
      "id": "B-002",
      "statement": "SdDateTimeService is the single gateway between model date values and the configured zone inside Core UI.",
      "invariant_refs": [
        "INV-003",
        "INV-005",
        "INV-006"
      ]
    },
    {
      "id": "B-003",
      "statement": "The model<->control boundary of each date form (normalize, writeValue, commit/serialize, min/max, model-facing registration) is the only place where a model value becomes a carrier and back.",
      "invariant_refs": [
        "INV-004",
        "INV-009"
      ]
    }
  ],
  "dependency_directions": [
    {
      "from": "sdcorejs-angular (all lines, showcase)",
      "to": "@sdcorejs/utils 1.3.0 (exact pin, public subpaths only)",
      "rationale": "Core UI consumes TimeZoneOptions, parse, zoned parts and FilterUtilities timeZone.",
      "invariant_refs": [
        "INV-002"
      ]
    },
    {
      "from": "services/date-time",
      "to": "configurations, @sdcorejs/utils/fns",
      "rationale": "Reads SD_CORE_CONFIGURATION.timeZone and delegates the arithmetic.",
      "invariant_refs": [
        "INV-008"
      ]
    },
    {
      "from": "pipes, forms/models, forms/date, forms/date-range, forms/datetime, components/table, components/import-excel, components/form-generic, components/history, components/file-explorer",
      "to": "services/date-time (direct entry point, never the services barrel)",
      "rationale": "Every model date conversion goes through the service.",
      "invariant_refs": [
        "INV-003",
        "INV-008"
      ]
    }
  ],
  "data_state_owners": [
    {
      "subject": "System time zone (root SD_CORE_CONFIGURATION.timeZone), resolved once by the root SdDateTimeService",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-006"
      ]
    },
    {
      "subject": "IANA tzdata (browser Intl / ICU)",
      "owner_repository_id": "sdcorejs-ultis",
      "invariant_refs": [
        "INV-001"
      ]
    }
  ],
  "public_contracts": [
    {
      "id": "PC-001",
      "kind": "api",
      "owner": "sdcorejs-ultis/src/fns",
      "statement": "@sdcorejs/utils 1.3.0: DateUtilities TimeZoneOptions on toFormat/parseFrom/begin/end, parse, isValidTimeZone, toZonedParts, fromZonedParts, ZonedDateTimeParts; FilterUtilities MatchOptions.timeZone, ToEpochOptions.timeZone, resolveRelativeDate(relative, now, options).",
      "compatibility": "Additive minor; calls without options are unchanged (INV-001).",
      "migration": "None. Callers opt in by passing { timeZone }.",
      "invariant_refs": [
        "INV-001",
        "INV-007"
      ]
    },
    {
      "id": "PC-002",
      "kind": "api",
      "owner": "sdcorejs-angular/configurations",
      "statement": "ISdCoreConfiguration.timeZone?: SdTimeZone and the exported SdTimeZone open union, read from the root injector.",
      "compatibility": "Additive; default local keeps current behaviour (INV-005).",
      "migration": "Opt in with { provide: SD_CORE_CONFIGURATION, useValue: { ..., timeZone: 'Asia/Ho_Chi_Minh' } } at the root.",
      "invariant_refs": [
        "INV-005",
        "INV-006"
      ]
    },
    {
      "id": "PC-003",
      "kind": "api",
      "owner": "sdcorejs-angular/services/date-time",
      "statement": "New entry point @sdcorejs/angular/services/date-time exporting SdDateTimeService (timeZone, toFormat, parse, parseFrom, begin, end, beginOfNextDay, today, now, toWallClock, fromWallClock), re-exported by @sdcorejs/angular/services.",
      "compatibility": "New entry point; nothing removed.",
      "migration": "App code that formats or parses model dates may switch from DateUtilities to SdDateTimeService to follow the system zone.",
      "invariant_refs": [
        "INV-003",
        "INV-006",
        "INV-008"
      ]
    },
    {
      "id": "PC-004",
      "kind": "api",
      "owner": "sdcorejs-angular",
      "statement": "Under a configured zone: transform outputs of the date forms, table filter payloads and import-excel instants are computed in that zone, and form.value of sd-date/sd-datetime/sd-date-range holds the model value instead of a Date.",
      "compatibility": "Changes only for apps that set timeZone; documented in the CHANGELOG and component docs.",
      "migration": "Apps that set timeZone and read form.value as Date switch to the model string (or use transform for an ISO instant).",
      "invariant_refs": [
        "INV-003",
        "INV-004",
        "INV-007",
        "INV-009"
      ]
    }
  ],
  "security_trust_boundaries": [],
  "cross_repository_integration": [
    {
      "owner_repository_id": "sdcorejs-angular",
      "statement": "sdcorejs-ultis delivers @sdcorejs/utils 1.3.0 (merge + publish) before the Core UI change pins it (D-023).",
      "child_references": [
        {
          "repository_id": "sdcorejs-ultis",
          "repository_relative_path": "src/fns/date.fns.ts",
          "revision": "9eb3052c9ada0fd5e469cf6fc28902fcce165c9a"
        },
        {
          "repository_id": "sdcorejs-ultis",
          "repository_relative_path": "src/fns/filter.fns.ts",
          "revision": "9eb3052c9ada0fd5e469cf6fc28902fcce165c9a"
        },
        {
          "repository_id": "sdcorejs-ultis",
          "repository_relative_path": "src/models/filter.model.ts",
          "revision": "9eb3052c9ada0fd5e469cf6fc28902fcce165c9a"
        }
      ],
      "invariant_refs": [
        "INV-001",
        "INV-002"
      ]
    }
  ],
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
    "D-029"
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
      "owner": "sdcorejs-ultis",
      "invariant_refs": [
        "INV-001"
      ],
      "acceptance_criterion_refs": [
        "AC-001",
        "AC-002",
        "AC-003",
        "AC-004",
        "AC-022"
      ],
      "expected_proof": "utils vitest: the 1.2.6 date and filter suites pass unedited; new cases for AC-001..AC-004 and AC-022 pass under TZ=UTC and TZ=Asia/Bangkok, including alternating-zone calls."
    },
    {
      "id": "VAL-002",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-002",
        "INV-008"
      ],
      "acceptance_criterion_refs": [
        "AC-017"
      ],
      "expected_proof": "Every package.json and lockfile listed in the spec pins 1.3.0; grep finds no @sdcorejs/utils/dist import, no services-barrel import under forms/** or pipes/**, and no pipes/forms/components/modules import under services/date-time; ng build sdcorejs-angular in v19 and check:sync pass."
    },
    {
      "id": "VAL-003",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-003"
      ],
      "acceptance_criterion_refs": [
        "AC-007",
        "AC-011",
        "AC-012",
        "AC-013",
        "AC-014",
        "AC-020",
        "AC-021"
      ],
      "expected_proof": "Karma specs for those ACs pass; a grep of DateUtilities.(toFormat|begin|end|parseFrom|parse), new Date(, Date.parse, getFullYear|getDate|getHours and Intl.DateTimeFormat in the v19 library outside services/date-time and specs lists only the carrier call sites allowlisted in the plan."
    },
    {
      "id": "VAL-004",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-004"
      ],
      "acceptance_criterion_refs": [
        "AC-008",
        "AC-009",
        "AC-010",
        "AC-016",
        "AC-019"
      ],
      "expected_proof": "Form specs for those ACs pass on the CI host (UTC) and on a developer host (Asia/Bangkok)."
    },
    {
      "id": "VAL-005",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-005"
      ],
      "acceptance_criterion_refs": [
        "AC-015"
      ],
      "expected_proof": "The existing specs of the touched surfaces pass without edits, with no timeZone and with local."
    },
    {
      "id": "VAL-006",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-006"
      ],
      "acceptance_criterion_refs": [
        "AC-005",
        "AC-006"
      ],
      "expected_proof": "SdDateTimeService spec: invalid values throw the documented message, valid values resolve once, methods return the AC-006 values."
    },
    {
      "id": "VAL-007",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-007"
      ],
      "acceptance_criterion_refs": [
        "AC-002",
        "AC-011",
        "AC-012"
      ],
      "expected_proof": "The 1975-06-12 Asia/Ho_Chi_Minh cases (25-hour day) pass in utils and in the sd-table server and client filter specs."
    },
    {
      "id": "VAL-008",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-009"
      ],
      "acceptance_criterion_refs": [
        "AC-018"
      ],
      "expected_proof": "Form specs bind the three components to a FormGroup and assert the model value under a zone and the Date without one."
    },
    {
      "id": "VAL-009",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-010"
      ],
      "acceptance_criterion_refs": [
        "AC-015"
      ],
      "expected_proof": "The existing pipe specs that use new pass unedited; an extra spec shows the injected pipes follow the zone."
    }
  ],
  "profile_sections": {
    "frontend_architecture_ref": {
      "reference": "plan_context.frontend_architecture",
      "conformance_invariant_refs": [
        "INV-003",
        "INV-004",
        "INV-008",
        "INV-009"
      ]
    },
    "agent_architecture_ref": null
  },
  "change_control": {
    "revision": 1,
    "supersedes": null
  }
}
```

## Appendix — decision_coverage revision 4 (thêm D-019…D-029, INV-001…INV-010)

```yaml
decision_coverage: {
  "schema_version": 1,
  "revision": 4,
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
      "statement": "sd-table server filters (date, daterange, datetime and range payloads), client-side filtering (row values parsed through the service), local sort, aggregate parsing and Excel export compute in the configured zone: a day filter is [begin of the day, begin of the next calendar day) in the zone and a datetime filter reads the zone-less value as wall clock in the zone; in local mode every bound equals the current value. Row-value parsing at the client filter, local sort, aggregate and min/max sites also stays exactly as today in local mode.",
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
      "statement": "Calendar-only values and wall-clock carriers never shift: date-only strings, zone-less wall-clock strings emitted without transform, sd-chip-calendar values, forms/time values and picker/control Date objects show and emit the same digits under every configuration; pipes created with new outside an injection context keep the local behavior. sdParseTransformedTemporal keeps its current public behavior.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "forms"
    },
    {
      "id": "R-010",
      "type": "requirement",
      "statement": "Core UI docs (sd-core.configuration, new sd-date-time, pipes, sd-date, sd-datetime, sd-date-range, sd-table filters, sd-import-excel, sd-file-explorer, sd-form-generic, query-bar/query-builder backend notes) and the CHANGELOG Unreleased entry (including the form.value change for apps that set timeZone: sd-date Date -> 'yyyy/MM/dd', sd-datetime display string -> 'yyyy/MM/dd HH:mm:ss', sd-date-range { from: Date, to: Date } -> the range model) describe timeZone; the Showcase registers sd-date-time; every Angular line, every versions/v* lockfile and the showcase pin @sdcorejs/utils 1.3.0; v20-v22 sources come only from npm run sync.",
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
      "statement": "With zone 'Asia/Ho_Chi_Minh' and no transform, bind sd-date, sd-datetime and sd-date-range to a parent FormGroup and enter 20/05/1960 (08:00 for sd-datetime); repeat with no timeZone -> with the zone the FormGroup values are '1960/05/20', '1960/05/20 08:00:00' and the range model { from: '1960/05/20', to: '1960/05/20' }; without the zone the FormGroup keeps today's values: a Date, the display string '20/05/1960 08:00' and { from: Date, to: Date }",
      "behavior": "With zone 'Asia/Ho_Chi_Minh' and no transform, bind sd-date, sd-datetime and sd-date-range to a parent FormGroup and enter 20/05/1960 (08:00 for sd-datetime); repeat with no timeZone",
      "expected_result": "with the zone the FormGroup values are '1960/05/20', '1960/05/20 08:00:00' and the range model { from: '1960/05/20', to: '1960/05/20' }; without the zone the FormGroup keeps today's values: a Date, the display string '20/05/1960 08:00' and { from: Date, to: Date }",
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
      "statement": "Public shape of the utils additions: DateUtilities: TimeZoneOptions { timeZone?: string } as the last optional argument of toFormat, parseFrom, begin and end; new parse(value, options?) returning Date | null; isValidTimeZone(value); toZonedParts(value, timeZone) returning { year, month (1-12), day, hour, minute, second, millisecond } or null; fromZonedParts(parts, timeZone) normalizing out-of-range fields like Date.UTC; FilterUtilities: timeZone in MatchOptions and ToEpochOptions, resolveRelativeDate(relative, now, options?); a repeated wall clock resolves to the earlier offset and a skipped one moves forward (Temporal 'compatible'); with timeZone, zone-less and date-only strings are read from their own fields (never round-tripped through an instant), so their digits never change",
      "question": "Public shape of the utils additions",
      "selected_value": "DateUtilities: TimeZoneOptions { timeZone?: string } as the last optional argument of toFormat, parseFrom, begin and end; new parse(value, options?) returning Date | null; isValidTimeZone(value); toZonedParts(value, timeZone) returning { year, month (1-12), day, hour, minute, second, millisecond } or null; fromZonedParts(parts, timeZone) normalizing out-of-range fields like Date.UTC; FilterUtilities: timeZone in MatchOptions and ToEpochOptions, resolveRelativeDate(relative, now, options?); a repeated wall clock resolves to the earlier offset and a skipped one moves forward (Temporal 'compatible'); with timeZone, zone-less and date-only strings are read from their own fields (never round-tripped through an instant), so their digits never change",
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
      "statement": "What a parent form receives from sd-date, sd-datetime and sd-date-range when a zone is configured: The model value through the existing model-facing control (yyyy/MM/dd, yyyy/MM/dd HH:mm:ss, the range model, or the transform output); without a zone each component keeps today's value (sd-date: Date, sd-datetime: display string dd/MM/yyyy HH:mm, sd-date-range: { from: Date, to: Date })",
      "question": "What a parent form receives from sd-date, sd-datetime and sd-date-range when a zone is configured",
      "selected_value": "The model value through the existing model-facing control (yyyy/MM/dd, yyyy/MM/dd HH:mm:ss, the range model, or the transform output); without a zone each component keeps today's value (sd-date: Date, sd-datetime: display string dd/MM/yyyy HH:mm, sd-date-range: { from: Date, to: Date })",
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
    },
    {
      "id": "D-019",
      "type": "decision",
      "statement": "How a form resolves its model: Each date form splits model normalization from carrier normalization: the original model value goes to SdDateTimeService (toFormat/parse/toWallClock); carriers keep local helpers. sdParseTransformedTemporal is a fallback only for what utils rejects (RFC-1123, ISO with a space separator plus Z/offset, more than 9 fraction digits, surrounding whitespace) ; the public function keeps its current behavior and the forms use an internal instant-only variant (null for zone-less matches) only when a zone is configured. A model Date is an instant",
      "question": "How a form resolves its model",
      "selected_value": "Each date form splits model normalization from carrier normalization: the original model value goes to SdDateTimeService (toFormat/parse/toWallClock); carriers keep local helpers. sdParseTransformedTemporal is a fallback only for what utils rejects (RFC-1123, ISO with a space separator plus Z/offset, more than 9 fraction digits, surrounding whitespace) ; the public function keeps its current behavior and the forms use an internal instant-only variant (null for zone-less matches) only when a zone is configured. A model Date is an instant",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The review found normalizeDateModel, #coerceEndpoint and datetimeModelToControl each serving both models and carriers; one function cannot be zone-aware for one and local for the other.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-005",
        "AC-008",
        "AC-009",
        "INV-004"
      ]
    },
    {
      "id": "D-020",
      "type": "decision",
      "statement": "Where carrier conversions live: Only SdDateTimeService.toWallClock/fromWallClock/today/now convert between model and carrier. forms/models keeps sdSerializeTemporalValue(instant, transform) and sdLocalStartOfDay(carrier) DI-free; SdStrictDateFnsAdapter (forms/models) returns service.today() from today(); sd-datetime gets a Core UI adapter subclass in forms/datetime that replaces the class provider and both the SdDateAdapter and DateAdapter aliases and returns service.now() from today(), because the Now button uses today() as date and time",
      "question": "Where carrier conversions live",
      "selected_value": "Only SdDateTimeService.toWallClock/fromWallClock/today/now convert between model and carrier. forms/models keeps sdSerializeTemporalValue(instant, transform) and sdLocalStartOfDay(carrier) DI-free; SdStrictDateFnsAdapter (forms/models) returns service.today() from today(); sd-datetime gets a Core UI adapter subclass in forms/datetime that replaces the class provider and both the SdDateAdapter and DateAdapter aliases and returns service.now() from today(), because the Now button uses today() as date and time",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "One conversion implementation; the Now button and the calendar today marker come from adapter.today().",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "R-005",
        "AC-006",
        "AC-010",
        "INV-004"
      ]
    },
    {
      "id": "D-021",
      "type": "decision",
      "statement": "Exclusive upper bound of a day filter: service.beginOfNextDay(day) replaces begin(addDays(day, 1)) at every LESS_THAN day bound; in local mode it calls exactly begin(addDays(day, 1)), including its null result, so callers keep their current null handling; range payloads keep the inclusive end(day)",
      "question": "Exclusive upper bound of a day filter",
      "selected_value": "service.beginOfNextDay(day) replaces begin(addDays(day, 1)) at every LESS_THAN day bound; in local mode it calls exactly begin(addDays(day, 1)), including its null result, so callers keep their current null handling; range payloads keep the inclusive end(day)",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The review measured end + 1 ms differing from the current bound on offset-change days in the host zone; local mode must stay byte-identical.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "AC-011",
        "AC-015",
        "INV-007"
      ]
    },
    {
      "id": "D-022",
      "type": "decision",
      "statement": "Lifetime of the configured zone: SdDateTimeService (providedIn root) reads the root SD_CORE_CONFIGURATION once in its constructor and validates it there; providers of SD_CORE_CONFIGURATION in lazy or element injectors do not change the zone",
      "question": "Lifetime of the configured zone",
      "selected_value": "SdDateTimeService (providedIn root) reads the root SD_CORE_CONFIGURATION once in its constructor and validates it there; providers of SD_CORE_CONFIGURATION in lazy or element injectors do not change the zone",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "One resolution keeps every surface consistent; documented next to format.number, which element injectors can override.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-002",
        "AC-005",
        "INV-006"
      ]
    },
    {
      "id": "D-023",
      "type": "decision",
      "statement": "Cross-repository delivery order: sdcorejs-ultis merges and publishes @sdcorejs/utils 1.3.0 first; the Core UI change commits only registry pins and lockfiles for 1.3.0; a local npm pack tarball may be used while iterating and is never committed",
      "question": "Cross-repository delivery order",
      "selected_value": "sdcorejs-ultis merges and publishes @sdcorejs/utils 1.3.0 first; the Core UI change commits only registry pins and lockfiles for 1.3.0; a local npm pack tarball may be used while iterating and is never committed",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Core UI CI installs from the registry and the release install policy forbids local tarballs.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-010",
        "AC-017",
        "INV-002"
      ]
    },
    {
      "id": "D-024",
      "type": "decision",
      "statement": "How the parent form receives the model under a zone: The existing ɵsdModelFacingControl of sd-date, sd-datetime and sd-date-range becomes active when transform is set or a zone is configured (service.timeZone !== local)",
      "question": "How the parent form receives the model under a zone",
      "selected_value": "The existing ɵsdModelFacingControl of sd-date, sd-datetime and sd-date-range becomes active when transform is set or a zone is configured (service.timeZone !== local)",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Reuses the mechanism that already keeps form.get(name).value equal to the model for transform.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-005",
        "AC-018",
        "INV-009"
      ]
    },
    {
      "id": "D-025",
      "type": "decision",
      "statement": "How pipes reach the service: sdFormatDate, sdFormatDatetime, sdTimeDifferent and viewDateTime call the public assertInInjectionContext inside a try (only NG0203 is caught, then DateUtilities without options is used) and call inject(SdDateTimeService) outside the try, so a service error such as an invalid timeZone still propagates; new inside a constructor or field initializer runs in an injection context and follows the zone (documented)",
      "question": "How pipes reach the service",
      "selected_value": "sdFormatDate, sdFormatDatetime, sdTimeDifferent and viewDateTime call the public assertInInjectionContext inside a try (only NG0203 is caught, then DateUtilities without options is used) and call inject(SdDateTimeService) outside the try, so a service error such as an invalid timeZone still propagates; new inside a constructor or field initializer runs in an injection context and follows the zone (documented)",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Keeps new SdFormatDatePipe() working (D-016) without a global.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-009",
        "AC-015",
        "INV-010"
      ]
    },
    {
      "id": "D-026",
      "type": "decision",
      "statement": "Import path of the service inside the library: forms/** and pipes/** (and every entry reachable from services/confirm) import @sdcorejs/angular/services/date-time directly, never the @sdcorejs/angular/services barrel",
      "question": "Import path of the service inside the library",
      "selected_value": "forms/** and pipes/** (and every entry reachable from services/confirm) import @sdcorejs/angular/services/date-time directly, never the @sdcorejs/angular/services barrel",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The barrel re-exports services/confirm, which imports forms/date and forms/datetime; importing the barrel from forms would create an ng-packagr cycle.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "AC-017",
        "INV-008"
      ]
    },
    {
      "id": "D-027",
      "type": "decision",
      "statement": "Form-generic wiring: sdDisplayValue stays pure and receives a date formatter through SdFormGenericDisplayOptions (like numberFormat); rule and validation evaluation pass { timeZone } to FilterUtilities only when a zone is configured",
      "question": "Form-generic wiring",
      "selected_value": "sdDisplayValue stays pure and receives a date formatter through SdFormGenericDisplayOptions (like numberFormat); rule and validation evaluation pass { timeZone } to FilterUtilities only when a zone is configured",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Pure functions cannot inject; passing nothing in local mode keeps 1.2.6 results.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-008",
        "AC-014",
        "AC-022",
        "INV-003"
      ]
    },
    {
      "id": "D-028",
      "type": "decision",
      "statement": "Min/max and TODAY bounds of the date forms: #parseDateBoundary goes through the service: 'TODAY' is today() for dates and now() for datetimes; other values become carriers with toWallClock (datetime) or the zone calendar day (date); without a zone #parseDateBoundary keeps its current code (D-029)",
      "question": "Min/max and TODAY bounds of the date forms",
      "selected_value": "#parseDateBoundary goes through the service: 'TODAY' is today() for dates and now() for datetimes; other values become carriers with toWallClock (datetime) or the zone calendar day (date); without a zone #parseDateBoundary keeps its current code (D-029)",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The review found bounds built with new Date(value), bypassing the model boundary.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-005",
        "AC-010",
        "AC-019",
        "INV-004"
      ]
    },
    {
      "id": "D-029",
      "type": "decision",
      "statement": "Sites that parse with new Date(...) today: table-local.util (client filter), table-local-sort.util, table-aggregate.util and #parseDateBoundary of the three forms keep new Date(...) in local mode and use service.parse only when a zone is configured",
      "question": "Sites that parse with new Date(...) today",
      "selected_value": "table-local.util (client filter), table-local-sort.util, table-aggregate.util and #parseDateBoundary of the three forms keep new Date(...) in local mode and use service.parse only when a zone is configured",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Native parsing and utils parsing differ for yyyy-MM-dd, numbers, RFC-1123 and Date.toString text; switching them in local mode would break INV-005.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "AC-012",
        "AC-015",
        "INV-005"
      ]
    },
    {
      "id": "INV-001",
      "type": "invariant",
      "statement": "Every @sdcorejs/utils 1.3.0 date and filter function called without a timeZone option returns exactly what 1.2.6 returns; zoned results depend only on the arguments (a per-zone Intl formatter cache is allowed, no other module state).",
      "protected_refs": [
        "R-001",
        "D-001",
        "D-008",
        "AC-001",
        "AC-002",
        "AC-003",
        "AC-004",
        "AC-022"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-002",
      "type": "invariant",
      "statement": "@sdcorejs/angular imports @sdcorejs/utils only through its public subpaths, and every package.json and lockfile listed in the spec pins exactly 1.3.0; @sdcorejs/utils has no dependency on Angular or @sdcorejs/angular.",
      "protected_refs": [
        "R-001",
        "R-010",
        "D-001",
        "D-013",
        "D-023",
        "AC-017"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-003",
      "type": "invariant",
      "statement": "Inside @sdcorejs/angular every conversion of a model value (instant, zone-less string, date-only string, consumer Date) to display text, calendar day, wall clock, filter bound or serialized instant goes through SdDateTimeService; outside services/date-time no library file applies DateUtilities.toFormat/begin/end/parseFrom/parse, new Date(<value>), Date.parse, local getters or Intl.DateTimeFormat without timeZone to a model value.",
      "protected_refs": [
        "R-003",
        "R-004",
        "R-005",
        "R-006",
        "R-007",
        "R-008",
        "D-005",
        "D-007",
        "D-019",
        "D-027",
        "AC-007",
        "AC-011",
        "AC-012",
        "AC-013",
        "AC-014",
        "AC-020",
        "AC-021"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-004",
      "type": "invariant",
      "statement": "Wall-clock carriers (picker and control Date objects, date-fns parsed control values, sd-chip-calendar cells, min/max carriers) are handled only with local-field arithmetic; the zone is applied exactly once per value, at the model boundary, and never to a carrier.",
      "protected_refs": [
        "R-005",
        "R-009",
        "D-006",
        "D-019",
        "D-020",
        "D-028",
        "AC-008",
        "AC-009",
        "AC-010",
        "AC-016",
        "AC-019"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-005",
      "type": "invariant",
      "statement": "With timeZone unset or local, SdDateTimeService calls DateUtilities without options (beginOfNextDay = begin(addDays(value, 1))) and every Core UI output, including the value registered in a parent form, equals the current release output.",
      "protected_refs": [
        "R-002",
        "R-009",
        "D-005",
        "D-021",
        "AC-015"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-006",
      "type": "invariant",
      "statement": "The effective zone is local or an id accepted by isValidTimeZone; numeric offsets and unknown ids make the SdDateTimeService constructor throw; the zone is resolved once from the root injector.",
      "protected_refs": [
        "R-002",
        "D-002",
        "D-003",
        "D-009",
        "D-022",
        "AC-005",
        "AC-006"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-007",
      "type": "invariant",
      "statement": "Calendar-day bounds are computed with calendar arithmetic in the zone (begin of the day, begin of the next calendar day), never by adding 24 hours; a day filter is [begin, beginOfNextDay).",
      "protected_refs": [
        "R-001",
        "R-006",
        "D-008",
        "D-021",
        "AC-002",
        "AC-011",
        "AC-012"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-008",
      "type": "invariant",
      "statement": "services/date-time depends only on @sdcorejs/angular/configurations and @sdcorejs/utils; forms/** and pipes/** import @sdcorejs/angular/services/date-time directly and never the services barrel; services/date-time imports no pipes, forms, components or modules entry point.",
      "protected_refs": [
        "R-003",
        "D-007",
        "D-026",
        "AC-017"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-009",
      "type": "invariant",
      "statement": "With a configured zone, the control that sd-date, sd-datetime and sd-date-range register in a parent form carries the model value; without a zone it carries exactly today's value (sd-date: Date, sd-datetime: display string, sd-date-range: { from: Date, to: Date }).",
      "protected_refs": [
        "R-005",
        "D-014",
        "D-024",
        "AC-018",
        "AC-015"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-010",
      "type": "invariant",
      "statement": "The date pipes work with and without an injection context; without one they behave exactly as the local mode.",
      "protected_refs": [
        "R-009",
        "D-016",
        "D-025",
        "AC-015"
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
    }
  ]
}
```

## Decisions captured during review

- Two independent read-only reviews (rework, then approve with corrections); every finding is resolved or explicitly accepted in "Review kiến trúc".
- The architecture was approved as drafted.

## Skill provenance

sdcorejs-architecture (approved on attempt 1 / 3)

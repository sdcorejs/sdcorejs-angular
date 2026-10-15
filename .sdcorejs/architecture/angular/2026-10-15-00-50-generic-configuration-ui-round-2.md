---
{
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-14T18:31:27.000Z",
  "approved_by": "user",
  "artifact_id": "architecture-generic-configuration-ui-round-2-v1-r1",
  "artifact_kind": "architecture",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "generic-configuration-ui-round-2-v1",
  "commit_policy": "with-change",
  "contract_id": "generic-configuration-ui-round-2-v1",
  "description": "Generic configuration UI round 2 architecture r1: modules/icon data-type icon API (leaf, opt-in Lucide registrations), generic -> icon dependency, single source of list.externalFilters, single column reorder writer; 5 invariants, 6 validation obligations.",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "name": "generic-configuration-ui-round-2-architecture",
  "owner": "sdcorejs-architecture",
  "owner_module_id": "modules/generic",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [
    {
      "approval_hash": "sha256:v1:f522514a52c7bdb04fc3412e716eb657dcd43460bb4ef08b8b21f6755b18760f",
      "artifact_id": "spec-generic-configuration-ui-round-2-v1-r1",
      "artifact_kind": "spec",
      "repository_id": "sdcorejs-angular",
      "revision": "3c5fc525c8b342b6e459af867dc236eaac36557b"
    }
  ],
  "parent_repository_id": "sdcorejs-angular",
  "profile_confidence": "high",
  "repository_relative_path": ".sdcorejs/architecture/angular/2026-10-15-00-50-generic-configuration-ui-round-2.md",
  "requirement_id": "R-003",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/architecture/2026-10-15-00-50-generic-configuration-ui-round-2-architecture.md",
  "source_plan": "none",
  "source_revision": "3c5fc525c8b342b6e459af867dc236eaac36557b",
  "source_spec": ".sdcorejs/specs/angular/2026-10-15-00-36-generic-configuration-ui-round-2.md",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:e8aad235991a7a30e0e72944af22526c4dcf50f16c8c7d3ab55020d0a0198aae"
}
---
# Architecture — Màn cấu hình generic vòng 2 và bộ icon kiểu dữ liệu - Approved Architecture

> Snapshot of what the user approved at the `sdcorejs-architecture` gate. Do not edit by hand; re-author through `sdcorejs-architecture` if the contract changes.

## Approved contract

# Architecture — Màn cấu hình generic vòng 2 và bộ icon kiểu dữ liệu - 2026-10-15 00:50

Kiến trúc gọn cho spec `spec-generic-configuration-ui-round-2-v1-r1` (hash `sha256:v1:f522514a…`, revision `3c5fc525`). Chỉ ghi những quyết định mà các phần việc độc lập có thể hiểu khác nhau. Thứ tự file và task thuộc về plan.

## Trigger và owner

- Gate bắt buộc. Signal: `public-api-contract`, `cross-module-boundary`, `persisted-data-model-contract`.
- Owner và integration owner: `sdcorejs-angular` (repo library, không có portal). Module chính: `modules/generic`.
- Mọi thay đổi vào v19 trước rồi sync.

## Ranh giới và hướng phụ thuộc

- **B-001:** `modules/icon` sở hữu bộ icon kiểu dữ liệu. `modules/generic` và `components/form-generic` chỉ dùng nó qua entry point public `@sdcorejs/angular/modules/icon`.
- **B-002:** `SdGenericSchemaService` là ranh giới duy nhất giữa màn cấu hình và kho cấu hình (giữ đúng INV-002 của kiến trúc r1). Bản ghi đi qua đây không mang `list.externalFilters`.

| Từ | Đến | Trạng thái |
| --- | --- | --- |
| `modules/generic` | `modules/icon` | **mới**: dòng cấu hình hiện icon kiểu dữ liệu |
| `components/form-generic` | `modules/icon` | đã có (8 file); palette đọc thêm `SD_DATA_TYPE_ICON` |
| `modules/icon/src/data-type-icon.ts` | `@sdcorejs/angular/*` | **không**: chỉ import class icon của `@lucide/angular` |

Bản thân `modules/icon` vẫn phụ thuộc `@sdcorejs/angular/utilities/models` như trước. Entry point đó không import `modules`, `components` hay `forms` nào, nên không tạo vòng.

## Quyết định kiến trúc

- **D-011 — một nguồn cho `list.externalFilters`.**
  - `SdGenericSchemaService` bỏ `list.externalFilters` khỏi cấu hình đã lưu trước khi validate (lúc load) và trước khi gọi `schemaStore.set` (lúc lưu).
  - Trong `sdGenericMergeSchema` (`generic-merge.ts:94-102`), `schema.list` hiện được chép từ list đã lưu. Merge sẽ xoá `externalFilters` đã lưu, rồi gán lại từ schema nền (lọc theo key còn tồn tại).
- **D-012 — một hàm ghi thứ tự cột.**
  - Kéo thả và nút lên/xuống cùng gọi `reorder(fromIndex, toIndex)`. Hàm này ghi lại `list.columns` và thông báo qua `LiveAnnouncer`.
  - Chỉ số là vị trí trong `list.columns`. Các dòng đang có trong bảng khớp đúng `list.columns`, vì merge đã bỏ các key không còn tồn tại.
  - Thêm cột (nối vào cuối), bỏ cột và sửa cờ không tính là đổi thứ tự.

## Điều chỉnh so với phần Architecture của spec (cần bạn duyệt)

Review đối chiếu với code tìm ra những điểm sau. Các điểm này không đổi requirement hay acceptance criterion; chúng sửa bảng icon và cách làm trong phần Architecture của spec.

1. **D-013 — khoá `number` dùng Material `numbers`, không dùng `tag`.** `SD_DEFAULT_MATERIAL_ALIASES` đã có `tag → local_offer`, nên ở chế độ Material, `tag` sẽ hiện hình nhãn giá. `numbers` không có alias ở bảng nào. Lucide: `hash`.
2. **D-014 — export thêm `SD_DATA_TYPE_LUCIDE_ICONS`.** `@lucide/angular` chỉ render icon đã đăng ký, còn `provideSdIcon` chỉ đăng ký danh sách của app. Danh sách này là opt-in: app dùng Lucide truyền nó vào `provideSdIcon({ lucideIcons })`, còn bundle của app Material không bị thêm gì. Showcase đăng ký sẵn (thêm `showcase/src/app/app.config.ts` vào danh sách file).
3. **D-015 — alias Lucide đi theo hình glyph của tên Material.** Alias là toàn cục theo từng tên Material, nên:
   - `schedule` và `access_time` → `clock`. Spec ghi `datetime → calendar-clock`; nếu giữ, đồng hồ của `sd-time` sẽ thành lịch. Hệ quả: datetime và time dùng chung `clock` khi chạy Lucide.
   - `notes` → `align-left`. Spec ghi `text`, nhưng `text` đã là đích của `text_fields`.

   Thêm alias cũng đổi cách render Lucide cho các chỗ đang dùng sẵn những tên đó (ví dụ `schedule` trong `sd-time`/`sd-datetime`). CHANGELOG sẽ ghi điều này. Chế độ Material không đổi gì.
4. **D-016 — tooltip đặt ở phần tử bọc.** `SdIcon` không có input tooltip. Icon kiểu dữ liệu được bọc trong một phần tử dùng directive `sdTooltip` sẵn có; `sd-icon` nhận `ariaLabel` là tên kiểu đã dịch. `SdIcon` giữ nguyên.
5. **D-017 — `validateSdGenericSchema` không đổi.** Hàm này là public và cũng dùng cho schema khai trong code. AC-004 được chứng minh qua đường load của `SdGenericSchemaService`, nơi bỏ trường trước khi validate. Gọi thẳng với key treo vẫn báo `reference-dangling`.
6. **CHANGELOG:** mục BREAKING i18n hiện có sẽ nêu thêm `core.data-type.*`, `…field.visible-hint`, `…action.drag`, và việc bỏ `…field.external-filter`.

Bảng icon sau khi điều chỉnh:

| Khoá | Material | Lucide |
| --- | --- | --- |
| `string` | `text_fields` | `text` (alias có sẵn) |
| `string-list` | `label` | `tag` |
| `email` | `mail` | `mail` |
| `phone` | `call` | `phone` |
| `url` | `link` | `link` |
| `password` | `lock` | `lock-keyhole` (alias có sẵn) |
| `text` | `notes` | **`align-left`** |
| `number` | **`numbers`** | `hash` |
| `integer` | `pin` | `binary` |
| `decimal` | `calculate` | `calculator` |
| `currency` | `payments` | `banknote` |
| `percent` | `percent` | `percent` |
| `boolean` | `check_box` | `square-check` |
| `date` | `calendar_month` | `calendar-days` (alias có sẵn) |
| `date-list` | `event_note` | `calendar-range` |
| `datetime` | `schedule` | **`clock`** |
| `time` | `access_time` | `clock` |
| `enum` | `arrow_drop_down_circle` | `circle-chevron-down` |
| `enum-multiple` | `checklist` | `list-checks` |
| `relation` | `hub` | `network` |
| `json` | `data_object` | `braces` |
| `file` | `upload_file` | `upload` (alias có sẵn) |

Cả 21 đích Lucide đều đã kiểm: có thật trong `@lucide/angular` 1.22 và có class export tương ứng.

## Invariants

| ID | Invariant | Kiểm bằng |
| --- | --- | --- |
| INV-001 | `data-type-icon.ts` không import gì từ `@sdcorejs/angular`. Trong `modules/icon` không có chỗ nào import generic hay form-generic. | VAL-001 |
| INV-002 | Mỗi khoá có: tên Material không dính alias Material nào, khoá i18n ở cả 5 catalog, và đích Lucide có thật nằm trong `SD_DATA_TYPE_LUCIDE_ICONS`. `SD_DEFAULT_LUCIDE_ALIASES` chỉ được thêm khoá. | VAL-002 |
| INV-003 | Icon kiểu dữ liệu ở dòng cấu hình và ở item dữ liệu của palette chỉ lấy từ `SD_DATA_TYPE_ICON`/`sdDataTypeIcon`. Property generic chỉ ra khoá qua `sdGenericPropertyIconKey`. | VAL-003 |
| INV-004 | Cấu hình đã lưu không mang và không góp `list.externalFilters`: bỏ ra trước validate và trước `set`; merge chỉ lấy từ schema nền. | VAL-004 |
| INV-005 | Thứ tự `list.columns` chỉ đổi qua một hàm `reorder`, với chỉ số là vị trí trong `list.columns`. Thêm, bỏ cột hay sửa cờ không phải là đổi thứ tự. | VAL-005 |

## Hợp đồng public

| ID | Loại | Nội dung | Tương thích | Migration |
| --- | --- | --- | --- | --- |
| PC-001 | api | `SdDataTypeIconKey`, `SD_DATA_TYPE_ICON`, `SD_DATA_TYPE_LABEL`, `SD_DATA_TYPE_LUCIDE_ICONS`, `sdDataTypeIcon()`; `SD_DEFAULT_LUCIDE_ALIASES` thêm khoá | Export chỉ thêm mới. Chỗ đang dùng các tên Material mới có alias sẽ render khác khi chạy Lucide | App Lucide thêm `SD_DATA_TYPE_LUCIDE_ICONS` vào `provideSdIcon` |
| PC-002 | persisted-data-model | Bản ghi cấu hình không còn `list.externalFilters`; khoá storage giữ nguyên | Bản ghi cũ vẫn load, trường đó bị bỏ qua; module chưa phát hành | Khai external filter trong schema backend hoặc `provideSdGenericEntity` |
| PC-003 | api | Catalog i18n thêm `core.data-type.*`, `…field.visible-hint`, `…action.drag`; bỏ `…field.external-filter` | Breaking với catalog typed tự viết; sẽ nêu trong mục BREAKING | Chép khoá từ catalog dựng sẵn |

## Nơi giữ dữ liệu và state

- Cấu hình đã lưu (`schemaStore`, mặc định localStorage `sd-generic:configuration:<module>.<entity>`): `SdGenericSchemaService` (INV-004).
- `list.externalFilters` của schema hiệu lực: schema nền, gồm adapter rồi entity (INV-004).
- Thứ tự `list.columns` trong bản nháp: tab Cột, qua `reorder` (INV-005).

## Validation obligations

- **VAL-001 → AC-005** (chứng minh cấu trúc): `data-type-icon.ts` không import `@sdcorejs/angular`; grep không thấy import ngược; build v19 xanh.
- **VAL-002 → AC-005, AC-006, AC-012:** spec chạy qua mọi khoá và fallback. Với từng khoá, kiểm:
  - tên Material không dính alias Material;
  - đích Lucide là export có thật và class của nó nằm trong `SD_DATA_TYPE_LUCIDE_ICONS`;
  - `SdIcon` ở chế độ Lucide render ra svg.

  Kèm theo: `check:i18n` pass.
- **VAL-003 → AC-007, AC-008, AC-009:**
  - spec cho bảng map;
  - snapshot icon palette theo `id`;
  - spec component kiểm, cho từng dòng: tên icon, `aria-label` của `sd-icon`, và chữ tooltip của phần tử bọc.
- **VAL-004 → AC-002, AC-003, AC-004:**
  - spec service: lưu thì bỏ trường; load thì bỏ qua và không có issue;
  - spec merge: giữ giá trị của schema nền;
  - spec list: vẫn hiện filter khai trong code.
- **VAL-005 → AC-001, AC-010, AC-011:**
  - thả và bấm nút cho ra cùng `list.columns` và cùng thông báo;
  - dòng chưa có trong bảng không có tay nắm;
  - không còn checkbox "Bộ lọc ngoài".
- **VAL-006 → AC-013:**
  - `sync` và `check:sync` pass;
  - test registry/route-shell của Showcase pass với section Icon mới;
  - Showcase có đăng ký `SD_DATA_TYPE_LUCIDE_ICONS`;
  - docs và CHANGELOG khớp với thay đổi.

## Review kiến trúc

Một reviewer read-only độc lập đối chiếu draft với code hiện tại và trả 8 rủi ro, 1 câu hỏi, không có lỗi chặn. Tất cả đã được xử lý trong bản này:

- Merge chép `externalFilters` đã lưu qua `schema.list = { ...list }` → D-011 nêu rõ phải xoá trước rồi gán từ schema nền.
- `validateSdGenericSchema` vẫn báo key treo → D-017: hàm không đổi; AC-004 kiểm qua đường load của service.
- `toggleColumn`/`setColumn` cũng ghi `list.columns`; chỉ số giữa dòng hiển thị và `list.columns` chưa được định nghĩa → INV-005 định nghĩa phạm vi và cơ sở chỉ số.
- Đụng alias Material `tag → local_offer` → D-013.
- Lucide cần icon đã đăng ký → D-014, VAL-002 kiểm đăng ký, VAL-006 kiểm Showcase.
- `SdIcon` không có tooltip → D-016, VAL-003.
- CHANGELOG BREAKING chưa phủ khoá mới → PC-003, mục 6 ở trên.
- INV-001 nói quá rộng → giới hạn lại vào `data-type-icon.ts`.
- AC-013 chưa có VAL; VAL-001 map yếu → thêm VAL-006; VAL-001 ghi rõ là chứng minh cấu trúc.

## Profile frontend, giả định, quyết định hoãn

- Frontend: component standalone OnPush dùng signals, CDK drag handle, `LiveAnnouncer` và directive `sdTooltip`. Phần này tuân INV-003 và INV-005.
- Giả định: A-001, A-002.
- Không có quyết định nào bị hoãn trong phạm vi này.

## Appendix — architecture_context (machine-readable)

```yaml
architecture_context: {
  "schema_version": 1,
  "source": "sdcorejs-architecture",
  "contract_id": "generic-configuration-ui-round-2-v1",
  "requirement_id": "R-003",
  "approved_spec_reference": {
    "repository_id": "sdcorejs-angular",
    "artifact_id": "spec-generic-configuration-ui-round-2-v1-r1",
    "artifact_kind": "spec",
    "revision": "3c5fc525c8b342b6e459af867dc236eaac36557b",
    "approval_hash": "sha256:v1:f522514a52c7bdb04fc3412e716eb657dcd43460bb4ef08b8b21f6755b18760f"
  },
  "approved_architecture_path": "<điền sau khi duyệt>",
  "approved_architecture_hash": "<điền sau khi duyệt>",
  "owner_repository_id": "sdcorejs-angular",
  "owner_module_id": "modules/generic",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "trigger": {
    "required": true,
    "signals": [
      "cross-module-boundary",
      "persisted-data-model-contract",
      "public-api-contract"
    ],
    "rationale": "Adds a public data-type icon API in modules/icon consumed by modules/generic and components/form-generic (new cross-module use), and changes the meaning of the persisted generic configuration (list.externalFilters is no longer stored or honoured)."
  },
  "invariants": [
    {
      "id": "INV-001",
      "statement": "modules/icon/src/data-type-icon.ts imports nothing from @sdcorejs/angular (only @lucide/angular classes for its registration list); nothing in modules/icon imports modules/generic or components/form-generic. modules/icon itself keeps its existing dependency on utilities/models.",
      "scope": "modules/icon/src/data-type-icon.ts and imports into modules/icon",
      "owner": "sdcorejs-angular/modules/icon",
      "rationale": "modules/generic and components/form-generic both import modules/icon; a reverse import would create a cycle in the ng-packagr build order. modules/icon already depends on utilities/models, which imports no modules/components/forms.",
      "verification_method": "VAL-001",
      "requirement_refs": [
        "R-003"
      ],
      "decision_refs": [
        "D-002",
        "D-006",
        "D-014"
      ]
    },
    {
      "id": "INV-002",
      "statement": "Every SdDataTypeIconKey has a Material name in SD_DATA_TYPE_ICON with no SD_DEFAULT_MATERIAL_ALIASES entry, an i18n key core.data-type.<key> in all five catalogs, and a Lucide target (default alias or the name itself) that exists in @lucide/angular and is included in SD_DATA_TYPE_LUCIDE_ICONS; SD_DEFAULT_LUCIDE_ALIASES only gains keys.",
      "scope": "modules/icon data-type icon set, SD_DEFAULT_LUCIDE_ALIASES, SD_DATA_TYPE_LUCIDE_ICONS, i18n catalogs",
      "owner": "sdcorejs-angular/modules/icon",
      "rationale": "An icon must render with either renderer (Lucide renders only registered icons) and a label must exist in every language, otherwise consumers see a blank icon, a wrong glyph or a raw key.",
      "verification_method": "VAL-002",
      "requirement_refs": [
        "R-003",
        "R-008"
      ],
      "decision_refs": [
        "D-007",
        "D-009",
        "D-013",
        "D-014",
        "D-015"
      ]
    },
    {
      "id": "INV-003",
      "statement": "Data-type icons of the generic configuration rows and of the form-generic palette data items come only from SD_DATA_TYPE_ICON / sdDataTypeIcon; generic properties reach a key only through sdGenericPropertyIconKey.",
      "scope": "generic configuration rows, form-generic builder palette",
      "owner": "sdcorejs-angular/modules/generic + components/form-generic",
      "rationale": "One mapping keeps the same data type looking the same everywhere and makes the set reusable.",
      "verification_method": "VAL-003",
      "requirement_refs": [
        "R-004",
        "R-005",
        "R-006"
      ],
      "decision_refs": [
        "D-002",
        "D-006"
      ]
    },
    {
      "id": "INV-004",
      "statement": "A stored generic configuration never carries or contributes list.externalFilters: SdGenericSchemaService strips it before validate and before schemaStore.set, and sdGenericMergeSchema takes list.externalFilters only from the base schema.",
      "scope": "SdGenericSchemaService, sdGenericMergeSchema, schema store records",
      "owner": "sdcorejs-angular/modules/generic",
      "rationale": "External filters are a developer decision declared in code; the base schema must stay the single source.",
      "verification_method": "VAL-004",
      "requirement_refs": [
        "R-001",
        "R-002"
      ],
      "decision_refs": [
        "D-001",
        "D-008",
        "D-011"
      ]
    },
    {
      "id": "INV-005",
      "statement": "The order of list.columns in the configuration screen changes only through one reorder(fromIndex, toIndex) used by both drag-drop and the move buttons; indices are positions in list.columns (the listed rows, which match list.columns because merge drops unknown keys); adding a column (append at the end), removing a column and editing its flags are not reorders.",
      "scope": "Columns tab of the configuration screen",
      "owner": "sdcorejs-angular/modules/generic",
      "rationale": "Drag-drop and the buttons must produce the same list.columns and the same announcement; a defined index base avoids the listed/columns mismatch.",
      "verification_method": "VAL-005",
      "requirement_refs": [
        "R-007"
      ],
      "decision_refs": [
        "D-003",
        "D-012"
      ]
    }
  ],
  "boundaries": [
    {
      "id": "B-001",
      "statement": "modules/icon owns the data-type icon set; modules/generic and components/form-generic consume it only through the public entry point @sdcorejs/angular/modules/icon.",
      "invariant_refs": [
        "INV-001",
        "INV-003"
      ]
    },
    {
      "id": "B-002",
      "statement": "SdGenericSchemaService is the only boundary between the configuration screen and the schema store; stored records cross it without list.externalFilters.",
      "invariant_refs": [
        "INV-004"
      ]
    }
  ],
  "dependency_directions": [
    {
      "from": "modules/generic",
      "to": "modules/icon",
      "rationale": "New: configuration rows render data-type icons.",
      "invariant_refs": [
        "INV-001",
        "INV-003"
      ]
    },
    {
      "from": "components/form-generic",
      "to": "modules/icon",
      "rationale": "Existing (8 files); the palette now also reads SD_DATA_TYPE_ICON.",
      "invariant_refs": [
        "INV-001",
        "INV-003"
      ]
    }
  ],
  "data_state_owners": [
    {
      "subject": "Stored generic configuration (schemaStore, default localStorage sd-generic:configuration:<module>.<entity>)",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-004"
      ]
    },
    {
      "subject": "list.externalFilters of the effective schema",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-004"
      ]
    },
    {
      "subject": "Draft list.columns order in the configuration screen",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-005"
      ]
    }
  ],
  "public_contracts": [
    {
      "id": "PC-001",
      "owner": "sdcorejs-angular/modules/icon",
      "compatibility": "New exports are additive. New SD_DEFAULT_LUCIDE_ALIASES keys do not change existing keys, but existing usages of those Material names (for example schedule in sd-time / sd-datetime) now render the mapped Lucide icon under the Lucide renderer; app overrides still win. No Material rendering changes.",
      "migration": "Lucide apps add SD_DATA_TYPE_LUCIDE_ICONS to provideSdIcon({ lucideIcons }) to render the data-type icons; Material apps need nothing.",
      "kind": "api",
      "statement": "@sdcorejs/angular/modules/icon exports SdDataTypeIconKey, SD_DATA_TYPE_ICON, SD_DATA_TYPE_LABEL, SD_DATA_TYPE_LUCIDE_ICONS and sdDataTypeIcon(key); SD_DEFAULT_LUCIDE_ALIASES gains keys.",
      "invariant_refs": [
        "INV-001",
        "INV-002"
      ]
    },
    {
      "id": "PC-002",
      "owner": "sdcorejs-angular/modules/generic",
      "compatibility": "Older stored records still load; list.externalFilters inside them is ignored. The schema-driven generic module is unreleased (A-001).",
      "migration": "Declare external filters in the backend schema or in the provideSdGenericEntity schema adjustment instead of the configuration screen.",
      "kind": "persisted-data-model",
      "statement": "Stored generic configuration records no longer contain list.externalFilters; older records that contain it still load and the field is ignored. Storage key unchanged.",
      "invariant_refs": [
        "INV-004"
      ]
    },
    {
      "id": "PC-003",
      "owner": "sdcorejs-angular/i18n",
      "compatibility": "Breaking only for custom typed catalogs. The existing Unreleased Changed (BREAKING for consumers) entry is extended to name core.data-type.*, core.module.generic.field.visible-hint, core.module.generic.action.drag and the removal of core.module.generic.field.external-filter.",
      "migration": "Copy the new keys from the built-in catalog of the same language and drop core.module.generic.field.external-filter.",
      "kind": "api",
      "statement": "Built-in i18n catalogs gain core.data-type.*, core.module.generic.field.visible-hint and core.module.generic.action.drag, and drop core.module.generic.field.external-filter.",
      "invariant_refs": [
        "INV-002"
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
    "D-017"
  ],
  "deferred_decision_refs": [],
  "assumption_refs": [
    "A-001",
    "A-002"
  ],
  "validation_obligations": [
    {
      "id": "VAL-001",
      "expected_proof": "Structural proof supporting AC-005: data-type-icon.ts has no @sdcorejs/angular import and a grep over modules/icon finds no modules/generic or components/form-generic import; v19 build stays green.",
      "owner": "sdcorejs-angular/modules/icon",
      "invariant_refs": [
        "INV-001"
      ],
      "acceptance_criterion_refs": [
        "AC-005"
      ]
    },
    {
      "id": "VAL-002",
      "expected_proof": "data-type-icon.spec covers every key and the fallback; for each key it asserts the Material name has no SD_DEFAULT_MATERIAL_ALIASES entry, the Lucide target is exported by @lucide/angular and its class is in SD_DATA_TYPE_LUCIDE_ICONS, and a Lucide-mode SdIcon renders an svg; check:i18n passes with the new keys in all five catalogs.",
      "owner": "sdcorejs-angular/modules/icon",
      "invariant_refs": [
        "INV-002"
      ],
      "acceptance_criterion_refs": [
        "AC-005",
        "AC-006",
        "AC-012"
      ]
    },
    {
      "id": "VAL-003",
      "expected_proof": "generic-property-icon.spec covers the mapping table; the palette spec snapshots icon names by item id; configuration component specs assert, for each row, the icon name, the sd-icon aria label and the sdTooltip text of the wrapper.",
      "owner": "sdcorejs-angular/modules/generic",
      "invariant_refs": [
        "INV-003"
      ],
      "acceptance_criterion_refs": [
        "AC-007",
        "AC-008",
        "AC-009"
      ]
    },
    {
      "id": "VAL-004",
      "expected_proof": "generic-schema.service.spec and generic-merge.spec prove save strips list.externalFilters, load ignores a stored value without an issue, and the merged schema keeps the base value; list page spec keeps rendering code-declared external filters.",
      "owner": "sdcorejs-angular/modules/generic",
      "invariant_refs": [
        "INV-004"
      ],
      "acceptance_criterion_refs": [
        "AC-002",
        "AC-003",
        "AC-004"
      ]
    },
    {
      "id": "VAL-005",
      "expected_proof": "Configuration list spec proves a cdkDropList drop and the move buttons yield the same list.columns and announcement, unlisted rows have no handle, and no external-filter checkbox is rendered.",
      "owner": "sdcorejs-angular/modules/generic",
      "invariant_refs": [
        "INV-005"
      ],
      "acceptance_criterion_refs": [
        "AC-001",
        "AC-010",
        "AC-011"
      ]
    },
    {
      "id": "VAL-006",
      "expected_proof": "npm run sync then check:sync pass; Showcase registry/route-shell tests pass with the new Icon section; the Showcase registers SD_DATA_TYPE_LUCIDE_ICONS; sd-generic.md, sd-icon.md and the Unreleased CHANGELOG (Added icon set, Lucide alias rendering note, extended BREAKING i18n entry) match the change.",
      "owner": "sdcorejs-angular",
      "invariant_refs": [
        "INV-002",
        "INV-004"
      ],
      "acceptance_criterion_refs": [
        "AC-013"
      ]
    }
  ],
  "profile_sections": {
    "frontend_architecture_ref": {
      "reference": "Spec Architecture: \"Dòng property trên màn cấu hình\" (standalone OnPush components, signals, CDK drag handle, LiveAnnouncer)",
      "conformance_invariant_refs": [
        "INV-003",
        "INV-005"
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

## Appendix — decision_coverage revision 2 (thêm D-011…D-017, INV-001…INV-005)

```yaml
decision_coverage: {
  "schema_version": 1,
  "revision": 2,
  "records": [
    {
      "id": "R-001",
      "type": "requirement",
      "statement": "The Columns tab of the generic configuration screen no longer edits external filters; external filters are declared only in code (backend schema or the schema adjustment of provideSdGenericEntity).",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "R-002",
      "type": "requirement",
      "statement": "A stored configuration never carries list.externalFilters: saving strips it, and loading/merging ignores a stored value and keeps the base schema value without reporting an issue.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "R-003",
      "type": "requirement",
      "statement": "modules/icon exports a shared data-type icon set: SdDataTypeIconKey, SD_DATA_TYPE_ICON (Material names), SD_DATA_TYPE_LABEL (i18n keys) and sdDataTypeIcon(key) with a fallback; every icon renders with both the Material and the Lucide renderer.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/icon"
    },
    {
      "id": "R-004",
      "type": "requirement",
      "statement": "The generic module maps a property (dataType, format, multiple) to one SdDataTypeIconKey with a fixed table.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "R-005",
      "type": "requirement",
      "statement": "The form-generic builder palette takes the icon of its data items from SD_DATA_TYPE_ICON and every palette icon stays exactly as it is today.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "components/form-generic"
    },
    {
      "id": "R-006",
      "type": "requirement",
      "statement": "Every property row of the Properties, Columns and Import columns tabs shows the data-type icon (tooltip and accessible name = translated type label) and the property key under its label.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "R-007",
      "type": "requirement",
      "statement": "In the Columns tab a listed column can be reordered by dragging its handle; dropping updates list.columns and announces the new position; the move up/down buttons remain; unlisted rows cannot be dragged.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "R-008",
      "type": "requirement",
      "statement": "The per-column \"visible\" checkbox reads \"Show by default\" (\"Hiện mặc định\") with a tooltip saying the end user can show the column again; the checkbox next to the column name keeps its \"in the table\" meaning; all five catalogs carry the new keys.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "R-009",
      "type": "requirement",
      "statement": "Docs, Showcase and release notes follow the change: sd-generic.md, the icon doc, the form-generic doc where it lists icons, a Showcase Icon section listing the data-type icons, the Unreleased CHANGELOG, and rollout to v20/v21/v22 through npm run sync.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/generic"
    },
    {
      "id": "AC-001",
      "type": "acceptance-criterion",
      "statement": "Open the Columns tab of the configuration screen -> no external-filter checkbox is rendered on any row",
      "behavior": "Open the Columns tab of the configuration screen",
      "expected_result": "no external-filter checkbox is rendered on any row",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001"
      ]
    },
    {
      "id": "AC-002",
      "type": "acceptance-criterion",
      "statement": "An entity declares list.externalFilters in its backend schema or provideSdGenericEntity schema adjustment -> the list shows those external filters (defaultShowing, toolbar hidden) exactly as before",
      "behavior": "An entity declares list.externalFilters in its backend schema or provideSdGenericEntity schema adjustment",
      "expected_result": "the list shows those external filters (defaultShowing, toolbar hidden) exactly as before",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001"
      ]
    },
    {
      "id": "AC-003",
      "type": "acceptance-criterion",
      "statement": "Save a configuration whose effective schema has list.externalFilters -> the value passed to schemaStore.set has no list.externalFilters",
      "behavior": "Save a configuration whose effective schema has list.externalFilters",
      "expected_result": "the value passed to schemaStore.set has no list.externalFilters",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-002"
      ]
    },
    {
      "id": "AC-004",
      "type": "acceptance-criterion",
      "statement": "Load a stored configuration that contains list.externalFilters -> the merged schema keeps the base list.externalFilters, validateSdGenericSchema reports no issue for it, and no banner appears",
      "behavior": "Load a stored configuration that contains list.externalFilters",
      "expected_result": "the merged schema keeps the base list.externalFilters, validateSdGenericSchema reports no issue for it, and no banner appears",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-002"
      ]
    },
    {
      "id": "AC-005",
      "type": "acceptance-criterion",
      "statement": "Call sdDataTypeIcon for every SdDataTypeIconKey and for an unknown key -> each key returns its SD_DATA_TYPE_ICON name and an unknown key returns the fallback",
      "behavior": "Call sdDataTypeIcon for every SdDataTypeIconKey and for an unknown key",
      "expected_result": "each key returns its SD_DATA_TYPE_ICON name and an unknown key returns the fallback",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-003"
      ]
    },
    {
      "id": "AC-006",
      "type": "acceptance-criterion",
      "statement": "Render every SD_DATA_TYPE_ICON name with the Lucide renderer -> each name resolves through SD_DEFAULT_LUCIDE_ALIASES to a registered Lucide icon",
      "behavior": "Render every SD_DATA_TYPE_ICON name with the Lucide renderer",
      "expected_result": "each name resolves through SD_DEFAULT_LUCIDE_ALIASES to a registered Lucide icon",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-003"
      ]
    },
    {
      "id": "AC-007",
      "type": "acceptance-criterion",
      "statement": "Map every generic dataType/format/multiple combination -> each combination returns the key of the mapping table in the spec",
      "behavior": "Map every generic dataType/format/multiple combination",
      "expected_result": "each combination returns the key of the mapping table in the spec",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-004"
      ]
    },
    {
      "id": "AC-008",
      "type": "acceptance-criterion",
      "statement": "Compare the form-generic palette icons before and after the change -> every palette item keeps the same Material icon name",
      "behavior": "Compare the form-generic palette icons before and after the change",
      "expected_result": "every palette item keeps the same Material icon name",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-005"
      ]
    },
    {
      "id": "AC-009",
      "type": "acceptance-criterion",
      "statement": "Open the Properties, Columns and Import columns tabs -> each property row shows its data-type icon with the translated type label as tooltip/accessible name and its key under the label",
      "behavior": "Open the Properties, Columns and Import columns tabs",
      "expected_result": "each property row shows its data-type icon with the translated type label as tooltip/accessible name and its key under the label",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-006"
      ]
    },
    {
      "id": "AC-010",
      "type": "acceptance-criterion",
      "statement": "Drag a listed column by its handle and drop it at another position -> list.columns has the new order and the new position is announced",
      "behavior": "Drag a listed column by its handle and drop it at another position",
      "expected_result": "list.columns has the new order and the new position is announced",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-007"
      ]
    },
    {
      "id": "AC-011",
      "type": "acceptance-criterion",
      "statement": "Use the move up/down buttons and try to drag an unlisted row -> the buttons still reorder and an unlisted row has no drag handle",
      "behavior": "Use the move up/down buttons and try to drag an unlisted row",
      "expected_result": "the buttons still reorder and an unlisted row has no drag handle",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-007"
      ]
    },
    {
      "id": "AC-012",
      "type": "acceptance-criterion",
      "statement": "Open the Columns tab in each of the five languages and run check:i18n -> the visible checkbox shows the new label with its tooltip and the i18n parity check passes",
      "behavior": "Open the Columns tab in each of the five languages and run check:i18n",
      "expected_result": "the visible checkbox shows the new label with its tooltip and the i18n parity check passes",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-008"
      ]
    },
    {
      "id": "AC-013",
      "type": "acceptance-criterion",
      "statement": "Run npm run sync, check:sync and the Showcase registry/doc tests -> mirrors match v19, the Icon page lists the data-type icons and the docs/CHANGELOG describe the change",
      "behavior": "Run npm run sync, check:sync and the Showcase registry/doc tests",
      "expected_result": "mirrors match v19, the Icon page lists the data-type icons and the docs/CHANGELOG describe the change",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-009"
      ]
    },
    {
      "id": "A-001",
      "type": "assumption",
      "statement": "Removing the external-filter editor is not a consumer break: the schema-driven generic module is unreleased (Unreleased in CHANGELOG), so no published configuration depends on it. The modules/generic docs in the 19.1.x-21.1.6 archives describe the older, unrelated SdRegister module.",
      "source": "inferred",
      "confidence": "high",
      "status": "confirmed",
      "blocking": false,
      "evidence_refs": [],
      "consequence_if_wrong": "A consumer using an unpublished build would silently lose stored external filters.",
      "validation_method": "Check that the latest published-docs archive (22.3.1) has no modules/generic and that older archives document SdRegister, not SdGenericSchema.",
      "owner": "sdcorejs-angular maintainers",
      "rationale": "Confirmed by the user in brainstorming on 2026-10-15",
      "impacted_refs": [
        "R-001",
        "R-002"
      ]
    },
    {
      "id": "A-002",
      "type": "assumption",
      "statement": "@angular/cdk/drag-drop is already a dependency used by the library (table config, kanban), so drag-drop adds no new package.",
      "source": "inferred",
      "confidence": "high",
      "status": "confirmed",
      "blocking": false,
      "evidence_refs": [],
      "consequence_if_wrong": "A new dependency would need an approval and lockfile change.",
      "validation_method": "grep for @angular/cdk/drag-drop imports in the library source.",
      "owner": "sdcorejs-angular maintainers",
      "rationale": "Confirmed by the user in brainstorming on 2026-10-15",
      "impacted_refs": [
        "R-007"
      ]
    },
    {
      "id": "D-001",
      "type": "decision",
      "statement": "Where are external filters declared: Only in code: backend schema or provideSdGenericEntity schema adjustment; not in the configuration screen or stored configuration",
      "question": "Where are external filters declared",
      "selected_value": "Only in code: backend schema or provideSdGenericEntity schema adjustment; not in the configuration screen or stored configuration",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Keeps list filtering inline by default and keeps filter declaration a developer decision.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-002",
        "AC-001",
        "AC-003",
        "AC-004"
      ]
    },
    {
      "id": "D-002",
      "type": "decision",
      "statement": "Scope of the shared data-type icon set: Shared set in @sdcorejs/angular/modules/icon, used now by modules/generic and the form-generic palette; query-bar and query-builder migrate later",
      "question": "Scope of the shared data-type icon set",
      "selected_value": "Shared set in @sdcorejs/angular/modules/icon, used now by modules/generic and the form-generic palette; query-bar and query-builder migrate later",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The icons are used in many places; form-generic already depends on modules/icon.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "R-005",
        "AC-005",
        "AC-008"
      ]
    },
    {
      "id": "D-003",
      "type": "decision",
      "statement": "How are columns reordered: CDK drag-drop with a handle plus the existing move up/down buttons",
      "question": "How are columns reordered",
      "selected_value": "CDK drag-drop with a handle plus the existing move up/down buttons",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Drag is faster; the buttons keep a keyboard and single-pointer alternative (WCAG 2.5.7).",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "AC-010",
        "AC-011"
      ]
    },
    {
      "id": "D-004",
      "type": "decision",
      "statement": "How are the two column checkboxes made clear: Relabel \"visible\" to \"Show by default\" with an explanatory tooltip",
      "question": "How are the two column checkboxes made clear",
      "selected_value": "Relabel \"visible\" to \"Show by default\" with an explanatory tooltip",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Smallest change that removes the ambiguity without a new control.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-008",
        "AC-012"
      ]
    },
    {
      "id": "D-005",
      "type": "decision",
      "statement": "Where do the key and the data-type icon appear: On every property row of the Properties, Columns and Import columns tabs",
      "question": "Where do the key and the data-type icon appear",
      "selected_value": "On every property row of the Properties, Columns and Import columns tabs",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Consistent rows across the configuration tabs.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "AC-009"
      ]
    },
    {
      "id": "D-006",
      "type": "decision",
      "statement": "Vocabulary of the icon set: Semantic data-type keys (22), not form-widget ids; form-generic layout items (radio, group, html) keep their own icons",
      "question": "Vocabulary of the icon set",
      "selected_value": "Semantic data-type keys (22), not form-widget ids; form-generic layout items (radio, group, html) keep their own icons",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "modules/icon must not depend on generic or form-generic models.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "R-005",
        "AC-005",
        "AC-008"
      ]
    },
    {
      "id": "D-007",
      "type": "decision",
      "statement": "Icon of a relation property: Material hub, Lucide network",
      "question": "Icon of a relation property",
      "selected_value": "Material hub, Lucide network",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "link is already the url icon; hub reads as a reference to another entity.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "R-004",
        "AC-007"
      ]
    },
    {
      "id": "D-008",
      "type": "decision",
      "statement": "How is a stored list.externalFilters handled: Ignored silently on merge and stripped on save; no validation issue",
      "question": "How is a stored list.externalFilters handled",
      "selected_value": "Ignored silently on merge and stripped on save; no validation issue",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Old stored configurations keep loading; the base schema stays the single source.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-002",
        "AC-004"
      ]
    },
    {
      "id": "D-009",
      "type": "decision",
      "statement": "Public names of the icon set: SdDataTypeIconKey, SD_DATA_TYPE_ICON, SD_DATA_TYPE_LABEL, sdDataTypeIcon()",
      "question": "Public names of the icon set",
      "selected_value": "SdDataTypeIconKey, SD_DATA_TYPE_ICON, SD_DATA_TYPE_LABEL, sdDataTypeIcon()",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Mirrors SD_QUERY_TYPE_ICON / sdQueryFieldIcon and SD_QB_TYPE_ICON naming.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "AC-005"
      ]
    },
    {
      "id": "D-010",
      "type": "decision",
      "statement": "Test approach: TDD for mapping, merge/save, reorder and icon resolution; component specs for the rows",
      "question": "Test approach",
      "selected_value": "TDD for mapping, merge/save, reorder and icon resolution; component specs for the rows",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Repository rule: TDD for components/ and forms/; logic first.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-002",
        "R-003",
        "R-004",
        "R-007"
      ]
    },
    {
      "id": "D-011",
      "type": "decision",
      "statement": "list.externalFilters has one source: the base schema (adapter -> entity).",
      "question": "Where is a stored list.externalFilters removed and where does the merged value come from",
      "selected_value": "SdGenericSchemaService strips list.externalFilters from a stored configuration before validating and before schemaStore.set; sdGenericMergeSchema drops the stored list.externalFilters (it copies the stored list) and sets list.externalFilters from the base schema only, filtered to existing keys",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The current merge copies list.externalFilters from the stored configuration; stripping only on save would drop the code-declared filters after a merge. SdGenericSchemaService is already the only caller of the schema store (r1 INV-002).",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-002",
        "AC-002",
        "AC-003",
        "AC-004"
      ]
    },
    {
      "id": "D-012",
      "type": "decision",
      "statement": "Column reordering has one writer.",
      "question": "How do drag-drop and the move buttons change list.columns",
      "selected_value": "Both call one reorder(fromIndex, toIndex) of the Columns tab that rewrites list.columns and announces the new position through LiveAnnouncer; only listed columns are inside the cdkDropList",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Two writers would drift (announcement, bounds, emitted schema); one function keeps both inputs identical.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "AC-010",
        "AC-011"
      ]
    },
    {
      "id": "D-013",
      "type": "decision",
      "statement": "The number key uses the Material icon numbers.",
      "question": "Which Material name does the number key use",
      "selected_value": "numbers (Lucide hash) instead of the spec table value tag",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "SD_DEFAULT_MATERIAL_ALIASES maps tag to local_offer, so tag would render a price-tag glyph in Material mode; numbers has no alias in either table, so no existing tag usage changes.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "AC-005",
        "AC-006"
      ]
    },
    {
      "id": "D-014",
      "type": "decision",
      "statement": "The data-type icon set ships its Lucide registrations.",
      "question": "How does an app using the Lucide renderer get the data-type icons registered",
      "selected_value": "modules/icon also exports SD_DATA_TYPE_LUCIDE_ICONS (the Lucide icon classes of every alias target) for provideSdIcon({ lucideIcons }); provideSdIcon does not register them automatically; the Showcase registers them",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "@lucide/angular renders only registered icons and provideSdIcon registers only the app list; an opt-in list keeps Lucide apps working without adding icons to Material-only bundles.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "R-009",
        "AC-006",
        "AC-013"
      ]
    },
    {
      "id": "D-015",
      "type": "decision",
      "statement": "Lucide aliases follow the Material glyph.",
      "question": "Which Lucide target does each new alias use",
      "selected_value": "The glyph of the Material name: schedule and access_time -> clock, notes -> align-left, numbers -> hash, label -> tag (datetime and time share clock under Lucide); the new aliases also change how existing usages of those Material names render under Lucide (for example schedule in sd-time / sd-datetime) and the CHANGELOG says so",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "An alias is global per Material name; mapping schedule to calendar-clock would turn the clock of sd-time into a calendar under Lucide.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "R-009",
        "AC-006",
        "AC-013"
      ]
    },
    {
      "id": "D-016",
      "type": "decision",
      "statement": "The type icon of a configuration row carries its tooltip on a wrapper.",
      "question": "How does the data-type icon get a tooltip when SdIcon has no tooltip input",
      "selected_value": "A wrapper element with the existing sdTooltip directive around sd-icon; sd-icon gets ariaLabel with the translated type label; SdIcon is not changed",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Reuses the library tooltip directive without widening the SdIcon API.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "AC-009"
      ]
    },
    {
      "id": "D-017",
      "type": "decision",
      "statement": "validateSdGenericSchema keeps checking list.externalFilters references.",
      "question": "Does validateSdGenericSchema change for list.externalFilters",
      "selected_value": "No; AC-004 is proven through the SdGenericSchemaService load path, which strips the stored value before calling validateSdGenericSchema; a direct call with a dangling key still reports reference-dangling",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "validateSdGenericSchema is public and also guards code-declared schemas; the stored-config rule belongs to the service that owns the store.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-002",
        "AC-004"
      ]
    },
    {
      "id": "INV-001",
      "type": "invariant",
      "statement": "modules/icon/src/data-type-icon.ts imports nothing from @sdcorejs/angular (only @lucide/angular classes for its registration list); nothing in modules/icon imports modules/generic or components/form-generic. modules/icon itself keeps its existing dependency on utilities/models.",
      "protected_refs": [
        "R-003",
        "D-002",
        "D-006",
        "D-014"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-002",
      "type": "invariant",
      "statement": "Every SdDataTypeIconKey has a Material name in SD_DATA_TYPE_ICON with no SD_DEFAULT_MATERIAL_ALIASES entry, an i18n key core.data-type.<key> in all five catalogs, and a Lucide target (default alias or the name itself) that exists in @lucide/angular and is included in SD_DATA_TYPE_LUCIDE_ICONS; SD_DEFAULT_LUCIDE_ALIASES only gains keys.",
      "protected_refs": [
        "R-003",
        "AC-005",
        "AC-006",
        "D-007",
        "D-009",
        "D-013",
        "D-014",
        "D-015"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-003",
      "type": "invariant",
      "statement": "Data-type icons of the generic configuration rows and of the form-generic palette data items come only from SD_DATA_TYPE_ICON / sdDataTypeIcon; generic properties reach a key only through sdGenericPropertyIconKey.",
      "protected_refs": [
        "R-004",
        "R-005",
        "R-006",
        "AC-007",
        "AC-008",
        "AC-009",
        "D-002",
        "D-006"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-004",
      "type": "invariant",
      "statement": "A stored generic configuration never carries or contributes list.externalFilters: SdGenericSchemaService strips it before validate and before schemaStore.set, and sdGenericMergeSchema takes list.externalFilters only from the base schema.",
      "protected_refs": [
        "R-001",
        "R-002",
        "AC-002",
        "AC-003",
        "AC-004",
        "D-001",
        "D-008",
        "D-011"
      ],
      "task_refs": [],
      "evidence_refs": []
    },
    {
      "id": "INV-005",
      "type": "invariant",
      "statement": "The order of list.columns in the configuration screen changes only through one reorder(fromIndex, toIndex) used by both drag-drop and the move buttons; indices are positions in list.columns (the listed rows, which match list.columns because merge drops unknown keys); adding a column (append at the end), removing a column and editing its flags are not reorders.",
      "protected_refs": [
        "R-007",
        "AC-010",
        "AC-011",
        "D-003",
        "D-012"
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
        }
      ],
      "tombstones": []
    }
  ]
}
```

## Decisions captured during review

- Approved with the five adjustments to the spec Architecture section (D-013 numbers icon, D-014 SD_DATA_TYPE_LUCIDE_ICONS, D-015 Lucide aliases follow the Material glyph, D-016 tooltip wrapper, D-017 validateSdGenericSchema unchanged) and D-011/D-012 from the independent review.

## Skill provenance

sdcorejs-architecture (approved on attempt 1 / 3)

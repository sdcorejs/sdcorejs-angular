---
{
  "acceptance_criteria_count": 13,
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-14T17:59:38.000Z",
  "approved_by": "user",
  "artifact_id": "spec-generic-configuration-ui-round-2-v1-r1",
  "artifact_kind": "spec",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "generic-configuration-ui-round-2-v1",
  "commit_policy": "with-change",
  "contract_id": "generic-configuration-ui-round-2-v1",
  "description": "Generic configuration UI round 2: external filters only in code, shared data-type icon set in modules/icon (generic + form-generic palette), drag-drop column order, \"Show by default\" label, key + type icon on every property row.",
  "manual_criteria_count": 0,
  "name": "generic-configuration-ui-round-2",
  "owner": "sdcorejs-spec",
  "owner_module_id": "modules/generic",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [
    {
      "approval_hash": "sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf",
      "artifact_id": "spec-generic-crud-module-v1-r1",
      "artifact_kind": "spec",
      "repository_id": "sdcorejs-angular",
      "revision": "48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a"
    }
  ],
  "parent_repository_id": null,
  "profile_confidence": "high",
  "redaction_applied": false,
  "repository_relative_path": ".sdcorejs/specs/angular/2026-10-15-00-36-generic-configuration-ui-round-2.md",
  "requirement_id": "generic-configuration-ui-round-2-v1",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/angular/2026-10-15-00-36-generic-configuration-ui-round-2-spec.md",
  "source_plan": "none",
  "source_revision": "3c5fc525c8b342b6e459af867dc236eaac36557b",
  "source_spec": "none",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:f522514a52c7bdb04fc3412e716eb657dcd43460bb4ef08b8b21f6755b18760f"
}
---
# Màn cấu hình generic vòng 2 và bộ icon kiểu dữ liệu dùng chung - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Màn cấu hình generic vòng 2 và bộ icon kiểu dữ liệu dùng chung - 2026-10-15 00:36

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
      }
    ]
  },
  "goal_backward_review": {
    "schema_version": 1,
    "mode": "sdcorejs-plan:goal-backward",
    "stage": "spec",
    "future_gaps": [
      "AC_PLAN_COVERAGE_MISSING AC-001",
      "AC_PLAN_COVERAGE_MISSING AC-002",
      "AC_PLAN_COVERAGE_MISSING AC-003",
      "AC_PLAN_COVERAGE_MISSING AC-004",
      "AC_PLAN_COVERAGE_MISSING AC-005",
      "AC_PLAN_COVERAGE_MISSING AC-006",
      "AC_PLAN_COVERAGE_MISSING AC-007",
      "AC_PLAN_COVERAGE_MISSING AC-008",
      "AC_PLAN_COVERAGE_MISSING AC-009",
      "AC_PLAN_COVERAGE_MISSING AC-010",
      "AC_PLAN_COVERAGE_MISSING AC-011",
      "AC_PLAN_COVERAGE_MISSING AC-012",
      "AC_PLAN_COVERAGE_MISSING AC-013",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-001",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-002",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-003",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-004",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-005",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-006",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-007",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-008",
      "REQUIREMENT_PLAN_COVERAGE_MISSING R-009"
    ]
  },
  "architecture_gate": {
    "valid": true,
    "required": true,
    "status": "required",
    "signals": [
      "cross-module-boundary",
      "persisted-data-model-contract",
      "public-api-contract"
    ],
    "bypass": null,
    "rationale": "Adds a public data-type icon API in modules/icon consumed by modules/generic and components/form-generic (new cross-module use), and changes the meaning of the persisted generic configuration (list.externalFilters is no longer stored or honoured)."
  },
  "contract_id": "generic-configuration-ui-round-2-v1",
  "requirement_id": "generic-configuration-ui-round-2-v1",
  "approved_spec_path": "",
  "approved_spec_hash": "",
  "supersedes": null,
  "parent_references": [
    {
      "repository_id": "sdcorejs-angular",
      "artifact_id": "spec-generic-crud-module-v1-r1",
      "artifact_kind": "spec",
      "revision": "48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a",
      "approval_hash": "sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf"
    }
  ],
  "target_root": ".",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "modules/generic",
  "execution_host_repository_id": "sdcorejs-angular",
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "profile_confidence": "high",
  "source_requirement_context": "brainstorming 2026-10-15: generic configuration UI round 2 (5 decisions confirmed by the user)",
  "acceptance_criteria_count": 13,
  "manual_criteria_count": 0,
  "non_goals": [
    "query-bar/query-builder migration to the shared icon set",
    "custom SVG icon set",
    "keyboard drag-drop",
    "reordering in Properties/Import tabs",
    "removing list.externalFilters from SdGenericSchema"
  ],
  "risks": [
    "Lucide alias names",
    "CDK drag-drop inside cfg-row grid",
    "silent loss of stored external filters on unpublished builds",
    "Showcase count drift",
    "Lucide alias table regressions"
  ],
  "assumptions": [
    "A-001 schema-driven generic module is unreleased",
    "A-002 @angular/cdk/drag-drop already used"
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

Màn cấu hình của module generic (`/configuration`) vẫn còn bốn chỗ gây khó hiểu, người dùng góp ý sau khi xem Showcase ngày 2026-10-14:

- Tab Cột có hai checkbox liền nhau: một checkbox cạnh tên cột, một checkbox "Hiển thị". Nhìn vào không biết hai cái khác nhau thế nào.
- Chỉ đổi được thứ tự cột bằng nút lên/xuống, mỗi lần dời một bậc.
- "Bộ lọc ngoài" cho người cấu hình bật external filter từng cột. Theo người dùng, list luôn nên dùng inline filter; external filter là quyết định của developer và phải khai trong code.
- Mỗi dòng chỉ có nhãn. Không thấy key gốc của property và không thấy kiểu dữ liệu, nên khó đối chiếu với backend.

Ngoài ra, repo đang có ba bảng icon theo kiểu dữ liệu riêng rẽ: `SD_QUERY_TYPE_ICON` của query-bar, `SD_QB_TYPE_ICON` của query-builder và icon trong palette form-generic. Mỗi bảng dùng một bộ tên kiểu khác nhau. Phần lớn icon của palette cũng không có alias Lucide, nên không hiện được khi app chọn renderer Lucide.

Thành công khi:

- người cấu hình nhìn một dòng là biết property nào, kiểu gì và trạng thái cột ra sao;
- kéo thả được để đổi thứ tự cột;
- external filter chỉ còn đến từ code;
- có một bộ icon kiểu dữ liệu dùng chung, hiện được với cả renderer Material lẫn Lucide, để các component khác dùng lại.

Spec này là delta của spec gốc `spec-generic-crud-module-v1-r1`, xem `parent_references`. Mọi phần của spec gốc không nhắc tới ở đây vẫn giữ nguyên.

## Requirements

- R-001 - Tab Cột của màn cấu hình không còn chỉnh external filter. External filter chỉ khai trong code: trong schema backend, hoặc trong schema adjustment của `provideSdGenericEntity`. Nguồn: người dùng. Owner: `modules/generic`.
- R-002 - Cấu hình đã lưu không bao giờ mang `list.externalFilters`. Khi lưu, trường này bị bỏ ra trước khi gọi `schemaStore.set`. Khi load hoặc merge, giá trị đã lưu bị bỏ qua và schema nền giữ giá trị của nó; không phát sinh issue nào. Nguồn: người dùng. Owner: `modules/generic`.
- R-003 - `@sdcorejs/angular/modules/icon` export một bộ icon kiểu dữ liệu dùng chung gồm `SdDataTypeIconKey`, `SD_DATA_TYPE_ICON` (tên Material), `SD_DATA_TYPE_LABEL` (khoá i18n) và `sdDataTypeIcon(key)` có fallback. Mọi icon trong bộ hiện được với cả renderer Material lẫn Lucide. Nguồn: người dùng. Owner: `modules/icon`.
- R-004 - Module generic quy một property (`dataType`, `format`, `multiple`) về đúng một `SdDataTypeIconKey` theo bảng cố định ở mục Architecture. Nguồn: người dùng. Owner: `modules/generic`.
- R-005 - Palette của form builder lấy icon cho các item dữ liệu từ `SD_DATA_TYPE_ICON`. Mọi icon của palette giữ nguyên như hiện tại. Nguồn: người dùng. Owner: `components/form-generic`.
- R-006 - Mỗi dòng property ở tab Thuộc tính, Cột và Cột nhập hiện icon kiểu dữ liệu, với tooltip và accessible name là tên kiểu đã dịch. Key gốc của property hiện ngay dưới nhãn. Nguồn: người dùng. Owner: `modules/generic`.
- R-007 - Ở tab Cột, một cột đang có trong bảng đổi được vị trí bằng cách kéo tay nắm. Thả xong thì `list.columns` đổi thứ tự và vị trí mới được thông báo cho trình đọc màn hình. Nút lên/xuống vẫn giữ. Dòng chưa có trong bảng không kéo được. Nguồn: người dùng. Owner: `modules/generic`.
- R-008 - Checkbox "Hiển thị" của từng cột đổi nhãn thành "Hiện mặc định". Kèm tooltip giải thích rằng người dùng cuối vẫn bật lại được cột từ phần cấu hình cột của bảng. Checkbox cạnh tên cột giữ nghĩa "có trong bảng". Đủ khoá ở cả 5 catalog. Nguồn: người dùng. Owner: `modules/generic`.
- R-009 - Tài liệu, Showcase và release notes đi cùng thay đổi:
  - `sd-generic.md`, `sd-icon.md`, và `sd-form-generic.md` ở chỗ nói về icon palette (nếu có);
  - section "Icon kiểu dữ liệu" mới trên trang Icon của Showcase;
  - mục `## [Unreleased]` của `CHANGELOG.md`;
  - rollout sang v20/v21/v22 bằng `npm run sync`.

  Nguồn: người dùng. Owner: `modules/generic`.

## Decisions

- D-001 - Khai external filter ở đâu → chỉ trong code (schema backend hoặc schema adjustment của `provideSdGenericEntity`), không có trên màn cấu hình hay trong cấu hình đã lưu. Nguồn: người dùng, đã duyệt. Lý do: list mặc định lọc inline; khai báo filter ngoài là quyết định của developer.
- D-002 - Phạm vi bộ icon → bộ chung trong `@sdcorejs/angular/modules/icon`, dùng ngay ở `modules/generic` và palette form-generic. Query-bar và query-builder chuyển sau. Nguồn: người dùng, đã duyệt. Scope: public-contract.
- D-003 - Cách đổi thứ tự cột → CDK drag-drop có tay nắm, giữ thêm nút lên/xuống. Nguồn: người dùng, đã duyệt. Lý do: kéo thả nhanh hơn; nút giữ đường thay thế cho bàn phím và thao tác một con trỏ (WCAG 2.5.7).
- D-004 - Làm rõ hai checkbox của cột → đổi nhãn "Hiển thị" thành "Hiện mặc định" và thêm tooltip. Nguồn: người dùng, đã duyệt.
- D-005 - Key gốc và icon kiểu dữ liệu xuất hiện ở đâu → mọi dòng property của tab Thuộc tính, Cột và Cột nhập. Nguồn: người dùng xác nhận mặc định.
- D-006 - Bộ khoá của bộ icon → 22 khoá theo ngữ nghĩa dữ liệu, không theo id widget của form. Ba item bố cục của palette (`radio`, `group`, `html`) giữ icon riêng. Lý do: `modules/icon` không được phụ thuộc model của generic hay form-generic. Nguồn: người dùng xác nhận mặc định. Scope: public-contract.
- D-007 - Icon cho property `relation` → Material `hub`, Lucide `network`. Lý do: `link` đã là icon của `url`, còn `hub` gợi ý tham chiếu sang entity khác. Nguồn: người dùng xác nhận mặc định.
- D-008 - Xử lý `list.externalFilters` có sẵn trong cấu hình đã lưu → bỏ qua khi merge và bỏ ra khi lưu, không tạo issue. Lý do: cấu hình cũ vẫn load được, schema nền là nguồn duy nhất. Nguồn: người dùng xác nhận mặc định.
- D-009 - Tên public của bộ icon → `SdDataTypeIconKey`, `SD_DATA_TYPE_ICON`, `SD_DATA_TYPE_LABEL`, `sdDataTypeIcon()`. Lý do: cùng mẫu với `SD_QUERY_TYPE_ICON`/`sdQueryFieldIcon` và `SD_QB_TYPE_ICON` (API consistency). Nguồn: người dùng xác nhận mặc định. Scope: public-contract.
- D-010 - Cách viết test → TDD cho mapping, merge/lưu, đổi thứ tự và resolve icon; spec component cho các dòng của màn cấu hình. Lý do: luật của repo yêu cầu TDD cho `components/` và `forms/`. Nguồn: người dùng.

## Assumptions

- A-001 - Bỏ trình chỉnh external filter không làm vỡ consumer nào.
  - Lý do: module generic theo schema chưa phát hành (đang ở `## [Unreleased]`). Archive mới nhất `published-docs/22.3.1` không có `modules/generic`. Thư mục `modules/generic` trong các archive 19.1.x–21.1.6 là module `SdRegister` cũ, không liên quan.
  - Nguồn: suy ra, đã được xác nhận. Độ tin cậy cao. Không chặn.
  - Nếu sai: consumer dùng bản build chưa phát hành sẽ mất external filter đã lưu mà không có cảnh báo.
  - Cách kiểm: liệt kê `published-docs`.
- A-002 - `@angular/cdk/drag-drop` đã được thư viện dùng (6 file nguồn, ví dụ table config và kanban), nên drag-drop không thêm package nào. Nguồn: suy ra từ grep. Độ tin cậy cao. Không chặn.

## Architecture gate classification

- Status: required
- Signals: `public-api-contract`, `cross-module-boundary`, `persisted-data-model-contract`
- Rationale:
  - thêm API public về icon kiểu dữ liệu trong `modules/icon`;
  - `modules/generic` lần đầu phụ thuộc `modules/icon`, còn `components/form-generic` vốn đã phụ thuộc;
  - đổi ý nghĩa của cấu hình generic đã lưu: không còn lưu và không còn áp dụng `list.externalFilters`.

## Non-goals

- Không chuyển query-bar và query-builder sang bộ icon chung trong vòng này. `SD_QUERY_TYPE_ICON` và `SD_QB_TYPE_ICON` giữ nguyên.
- Không tự vẽ SVG riêng. Icon đi qua `SdIcon` (Material, hoặc Lucide qua alias).
- Không làm kéo thả bằng bàn phím. Bàn phím dùng nút lên/xuống.
- Không đổi thứ tự ở tab Thuộc tính và tab Cột nhập.
- Không xoá `list.externalFilters` khỏi type `SdGenericSchema` hay khỏi schema backend. Không đổi hành vi runtime của list với external filter khai trong code.
- Không đổi icon đang hiện trên palette form builder.

## Architecture

### Bộ icon kiểu dữ liệu (`modules/icon`, public)

File mới `modules/icon/src/data-type-icon.ts`, export qua barrel của entry point:

```ts
export type SdDataTypeIconKey =
  | 'string' | 'string-list' | 'email' | 'phone' | 'url' | 'password' | 'text'
  | 'number' | 'integer' | 'decimal' | 'currency' | 'percent'
  | 'boolean' | 'date' | 'date-list' | 'datetime' | 'time'
  | 'enum' | 'enum-multiple' | 'relation' | 'json' | 'file';

/** Tên icon Material cho mỗi kiểu dữ liệu; `SdIcon` tự đổi sang Lucide qua alias. */
export const SD_DATA_TYPE_ICON: Readonly<Record<SdDataTypeIconKey, string>>;
/** Khoá i18n tên kiểu: `core.data-type.<key>`. */
export const SD_DATA_TYPE_LABEL: Readonly<Record<SdDataTypeIconKey, string>>;
/** Icon của một khoá; khoá rỗng hoặc lạ trả về `'tune'` (cùng fallback với query-bar/query-builder). */
export function sdDataTypeIcon(key: SdDataTypeIconKey | string | null | undefined): string;
```

| Khoá | Material | Lucide (alias) |
| --- | --- | --- |
| `string` | `text_fields` | alias sẵn có |
| `string-list` | `label` | `tag` |
| `email` | `mail` | `mail` |
| `phone` | `call` | `phone` |
| `url` | `link` | `link` |
| `password` | `lock` | alias sẵn có |
| `text` | `notes` | `text` |
| `number` | `tag` | `hash` |
| `integer` | `pin` | `binary` |
| `decimal` | `calculate` | `calculator` |
| `currency` | `payments` | `banknote` |
| `percent` | `percent` | `percent` |
| `boolean` | `check_box` | `square-check` |
| `date` | `calendar_month` | alias sẵn có |
| `date-list` | `event_note` | `calendar-range` |
| `datetime` | `schedule` | `calendar-clock` |
| `time` | `access_time` | `clock` |
| `enum` | `arrow_drop_down_circle` | `circle-chevron-down` |
| `enum-multiple` | `checklist` | `list-checks` |
| `relation` | `hub` | `network` |
| `json` | `data_object` | `braces` |
| `file` | `upload_file` | alias sẵn có |

- Alias Lucide còn thiếu được thêm vào `SD_DEFAULT_LUCIDE_ALIASES`. Đây là thay đổi chỉ thêm mới; app override alias vẫn thắng như trước. Đích của mọi alias phải là tên icon có thật trong `@lucide/angular`. Nếu một tên Lucide trong bảng không tồn tại, plan chọn tên gần nghĩa nhất và ghi lại.
- `modules/icon` không import thêm entry point nào. Chuỗi trong `SD_DATA_TYPE_LABEL` chỉ là khoá i18n; component dùng sẽ tự dịch.
- Thêm 22 khoá `core.data-type.<key>` vào cả 5 catalog.

### Map property generic sang khoá icon (`modules/generic`, nội bộ)

`sdGenericPropertyIconKey(property)` là hàm thuần trong `modules/generic/src/core`. Hàm này không thuộc public surface của entry point.

| `dataType` | Điều kiện | Khoá |
| --- | --- | --- |
| `string` | `multiple` | `string-list` |
| `string` | `format` `email` / `phone` / `url` / `password` | khoá cùng tên |
| `string` | còn lại | `string` |
| `text` | | `text` |
| `number` | `format` `integer` / `decimal` / `currency` / `percent` | khoá cùng tên |
| `number` | không có `format` | `number` |
| `boolean` | | `boolean` |
| `date` / `datetime` / `time` | | khoá cùng tên |
| `enum` | `multiple` thì `enum-multiple`, không thì `enum` | |
| `relation` | | `relation` (có `multiple` hay không) |
| `json` / `file` | | khoá cùng tên |

### Palette form-generic

Các item dữ liệu của `SD_FORM_BUILDER_PALETTE` lấy icon từ `SD_DATA_TYPE_ICON`:

| Item palette | Khoá |
| --- | --- |
| `text` | `string` |
| `email`, `phone`, `url`, `password` | khoá cùng tên |
| `textarea` | `text` |
| `integer`, `decimal`, `currency`, `percent` | khoá cùng tên |
| `select` | `enum` |
| `multiselect` | `enum-multiple` |
| `checkbox` | `boolean` |
| `date`, `datetime`, `time` | khoá cùng tên |
| `chip-string` | `string-list` |
| `chip-calendar` | `date-list` |
| `upload` | `file` |
| `json` | `json` |

`radio`, `group` và `html` giữ icon literal như cũ. Tên Material của mọi item không đổi; bộ chung được dựng từ chính các icon palette hiện tại.

### External filter và cấu hình đã lưu

- Màn cấu hình bỏ checkbox "Bộ lọc ngoài" cùng hàm `toggleFilter`. Bỏ luôn khoá `core.module.generic.field.external-filter`, vì không còn chỗ nào dùng.
- Khi lưu: bản ghi đưa vào `schemaStore.set` không có `list.externalFilters`.
- Khi load: `list.externalFilters` của cấu hình đã lưu bị bỏ ra trước khi validate và merge, nên không còn issue tham chiếu treo nào từ trường này. Schema nền (adapter → entity) giữ nguyên `list.externalFilters` của nó.
- List vẫn dựng external filter từ schema hiệu lực như hiện tại (`defaultShowing`, ẩn toolbar).
- Type `SdGenericSchema` không đổi.

Persisted contract: khoá storage `sd-generic:configuration:<module>.<entity>` vẫn như cũ. Bản ghi cũ có `list.externalFilters` vẫn load được; trường đó bị bỏ qua.

### Dòng property trên màn cấu hình

- Mỗi dòng ở tab Thuộc tính, Cột và Cột nhập có một khối định danh: icon kiểu dữ liệu (`sd-icon`), nhãn, và key gốc ở dòng dưới (chữ nhỏ, màu phụ, font monospace).
- Icon có tooltip và `aria-label` là tên kiểu đã dịch. Key là text thường, đọc được và copy được.
- Tab Cột:
  - các cột đang có trong bảng nằm trong một `cdkDropList`; mỗi dòng là `cdkDrag` với tay nắm `cdkDragHandle` (icon `drag_indicator`, có nhãn "Kéo để đổi vị trí {label}");
  - thả xong thì gọi lại đúng đường cập nhật của `move`, nên `list.columns` đổi và `LiveAnnouncer` thông báo vị trí mới;
  - dòng chưa có trong bảng nằm ngoài drop list và không có tay nắm;
  - nút lên/xuống giữ nguyên.
- Checkbox `visible` có nhãn "Hiện mặc định" và tooltip.

### i18n

Khoá mới có ở cả 5 catalog (`en`, `vi`, `ja`, `ko`, `zh`), parity do `check:i18n` kiểm:

- `core.data-type.*` (22 khoá);
- `core.module.generic.field.visible` đổi nội dung thành "Hiện mặc định" / "Show by default";
- `core.module.generic.field.visible-hint` cho tooltip;
- `core.module.generic.action.drag` cho tay nắm.

Bỏ `core.module.generic.field.external-filter`.

## Stack profile and technology assumptions

- Track: `angular`
- Stack profile: `core-ui-angular`
- Profile evidence: thư viện `@sdcorejs/angular` (`versions/v19/projects/sdcorejs-angular`), Angular 19 standalone + signals, `sd-section` / `sd-checkbox` / `sd-icon` có sẵn.
- Technology assumptions:
  - `@angular/cdk/drag-drop` đã có trong dependency (A-002);
  - `@lucide/angular` đã có trong dependency của `modules/icon`;
  - không thêm package nào;
  - sửa ở v19 trước rồi rollout v20/v21/v22 bằng `npm run sync`.

## File structure

Đường dẫn tương đối với `versions/v19/projects/sdcorejs-angular/` (trừ các mục ở root, có ghi rõ):

- `modules/icon/src/data-type-icon.ts` - tạo mới: khoá, map icon, map nhãn, `sdDataTypeIcon`.
- `modules/icon/src/data-type-icon.spec.ts` - tạo mới: resolve và fallback, đủ alias Lucide.
- `modules/icon/src/index.ts` - sửa: export file mới.
- `modules/icon/src/icon.model.ts` - sửa: thêm alias Lucide còn thiếu.
- `modules/icon/sd-icon.md` - sửa: mục bộ icon kiểu dữ liệu.
- `modules/generic/src/core/generic-property-icon.ts` + `.spec.ts` - tạo mới: map property sang khoá.
- `modules/generic/src/core/index.ts` - sửa: export nội bộ.
- `modules/generic/src/core/generic-merge.ts` + spec - sửa: bỏ qua `list.externalFilters` của cấu hình đã lưu.
- `modules/generic/src/services/*schema*` và/hoặc `pages/configuration/generic-configuration.page.ts` + spec - sửa: bỏ `list.externalFilters` trước khi `schemaStore.set` và trước khi validate cấu hình đã lưu.
- `modules/generic/src/components/configuration-list/*` - sửa: bỏ external filter, thêm drag-drop, đổi nhãn, thêm khối định danh.
- `modules/generic/src/components/configuration-general/*`, `configuration-import/*` - sửa: thêm khối định danh.
- `modules/generic/src/components/generic-configuration.scss` - sửa: style khối định danh, tay nắm kéo, preview và placeholder khi kéo.
- Spec của các component configuration - sửa hoặc tạo mới.
- `modules/generic/sd-generic.md` - sửa: external filter chỉ khai trong code, mô tả các dòng của màn cấu hình.
- `components/form-generic/src/components/form-builder/state/builder-palette.ts` + spec - sửa: lấy icon từ `SD_DATA_TYPE_ICON`.
- `i18n/src/{en,vi,ja,ko,zh}.ts` - sửa: khoá mới và khoá bị bỏ.
- `showcase/src/app/pages/components/icon/*` (root) - sửa: section "Icon kiểu dữ liệu".
- `showcase/src/app/docs/core/documentation.registry.spec.ts` và `scripts/generate-showcase-route-shells.test.mjs` (root) - sửa: các con số đếm. Example sources sinh lại bằng generator.
- `CHANGELOG.md` (root) - sửa: mục Unreleased.
- `versions/v20|v21|v22/**` - chỉ do `npm run sync` sinh ra.

## Acceptance criteria

- AC-001 - Mở tab Cột của màn cấu hình → không dòng nào có checkbox "Bộ lọc ngoài". (R-001, tự động)
- AC-002 - Entity khai `list.externalFilters` trong schema backend hoặc trong schema adjustment của `provideSdGenericEntity` → list vẫn hiện các external filter đó như trước (`defaultShowing`, ẩn toolbar). (R-001, tự động)
- AC-003 - Lưu một cấu hình mà schema hiệu lực có `list.externalFilters` → giá trị đưa vào `schemaStore.set` không có `list.externalFilters`. (R-002, tự động)
- AC-004 - Load một cấu hình đã lưu có `list.externalFilters` → schema merge giữ `list.externalFilters` của schema nền, `validateSdGenericSchema` không báo issue cho trường này, và không hiện banner. (R-002, tự động)
- AC-005 - Gọi `sdDataTypeIcon` với từng `SdDataTypeIconKey` và với một khoá lạ → mỗi khoá trả đúng tên trong `SD_DATA_TYPE_ICON`; khoá lạ, `null` và `undefined` trả `'tune'`. (R-003, tự động)
- AC-006 - Với mỗi tên trong `SD_DATA_TYPE_ICON`, đích sau alias Lucide (alias mặc định, hoặc chính tên đó nếu không có alias) là một icon có thật trong `@lucide/angular`. (R-003, tự động)
- AC-007 - Chạy map property với mọi tổ hợp `dataType` / `format` / `multiple` của generic → mỗi tổ hợp trả đúng khoá theo bảng ở mục Architecture. (R-004, tự động)
- AC-008 - So icon palette form-generic trước và sau thay đổi → mọi item giữ nguyên tên icon Material (snapshot theo `id`). (R-005, tự động)
- AC-009 - Mở tab Thuộc tính, Cột và Cột nhập → mỗi dòng property có icon kiểu dữ liệu, tooltip/`aria-label` là tên kiểu đã dịch, và key gốc nằm dưới nhãn. (R-006, tự động)
- AC-010 - Kéo một cột đang có trong bảng bằng tay nắm rồi thả sang vị trí khác → `list.columns` có thứ tự mới và vị trí mới được thông báo. (R-007, tự động)
- AC-011 - Dùng nút lên/xuống, và thử kéo một dòng chưa có trong bảng → nút vẫn đổi được thứ tự, còn dòng chưa có trong bảng không có tay nắm. (R-007, tự động)
- AC-012 - Mở tab Cột ở cả 5 ngôn ngữ rồi chạy `check:i18n` → checkbox hiện nhãn mới cùng tooltip, và kiểm tra parity i18n pass. (R-008, tự động)
- AC-013 - Chạy `npm run sync`, `check:sync`, cùng test registry/docs của Showcase → mirror khớp v19, trang Icon liệt kê bộ icon kiểu dữ liệu, docs và CHANGELOG mô tả đúng thay đổi. (R-009, tự động)

## Risks & mitigations

- **Risk:** tên Lucide trong bảng không tồn tại → icon trắng khi app chọn renderer Lucide. → **Mitigation:** AC-006 kiểm từng tên với danh sách export của `@lucide/angular`; tên nào không có thì thay bằng tên gần nghĩa và ghi lại trong plan.
- **Risk:** drag-drop của CDK trong lưới `cfg-row` của `sd-section` bị lệch preview/placeholder, hoặc bắt nhầm click của checkbox/input. → **Mitigation:** chỉ kéo được bằng `cdkDragHandle`; thêm style cho preview và placeholder; kiểm UI trên Showcase.
- **Risk:** cấu hình đã lưu ở máy dev mất external filter mà không báo. → **Mitigation:** module chưa phát hành (A-001); ghi trong `sd-generic.md` và CHANGELOG rằng external filter chỉ khai trong code.
- **Risk:** thêm section Showcase làm lệch các con số đếm của registry và route-shell test. → **Mitigation:** cập nhật số trong cùng commit và chạy lại test Showcase cùng `test:scripts`.
- **Risk:** đổi alias trong `SD_DEFAULT_LUCIDE_ALIASES` làm đổi icon Lucide ở chỗ khác. → **Mitigation:** chỉ thêm khoá chưa có, không sửa khoá sẵn có; có test.

## Out of scope (deferred)

- Chuyển query-bar (`SD_QUERY_TYPE_ICON`) và query-builder (`SD_QB_TYPE_ICON`) sang bộ chung, giữ hằng cũ làm alias - làm khi có vòng chỉnh hai component này hoặc khi người dùng yêu cầu.
- Kéo thả bằng bàn phím (CDK chưa hỗ trợ) - làm khi CDK có hoặc khi có yêu cầu a11y riêng.
- Bộ icon SVG riêng của repo cho kiểu dữ liệu - làm khi bộ Material/Lucide không đủ.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)

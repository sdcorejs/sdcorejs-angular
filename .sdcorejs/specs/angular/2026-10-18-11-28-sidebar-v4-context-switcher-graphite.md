---
acceptance_criteria_count: 23
approval_source: "explicit-user-choice"
approved_at: "2026-10-18T04:37:22.000Z"
approved_by: "user"
artifact_id: "spec-sidebar-v4-context-switcher-graphite-v1-r1"
artifact_kind: "spec"
change_control:
  change_reason: null
  revision: 1
  supersedes: null
change_ref: "sidebar-v4-context-switcher-graphite-v1"
commit_policy: "with-change"
contract_id: "sidebar-v4-context-switcher-graphite-v1"
description: "Sidebar V4 desktop/mobile (fork V3, sections, trailing slot, flyout, bottom bar), shared Context Switcher + SdLayoutContextService on sidebar V1-V4 and mobile, graphite preset with preset component-token overrides, link/text-button audit."
manual_criteria_count: 0
name: "sidebar-v4-context-switcher-graphite"
owner: "sdcorejs-spec"
owner_module_id: "modules/layout"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
parent_references: []
parent_repository_id: null
profile_confidence: "high"
redaction_applied: false
repository_relative_path: ".sdcorejs/specs/angular/2026-10-18-11-28-sidebar-v4-context-switcher-graphite.md"
requirement_id: "sidebar-v4-context-switcher-graphite-v1"
schema_version: 1
sourceDraftPath: ".sdcorejs/docs/angular/2026-10-18-11-28-sidebar-v4-context-switcher-graphite-spec.md"
source_plan: "none"
source_revision: "5f692cd3497a2a1ffa2e2c11d8a358b42476f799"
source_spec: "none"
stack_profile: "core-ui-angular"
supersedes: null
target_root_kind: "target-project"
track: "angular"
approval_hash: "sha256:v1:fb1ff4a6da2a5e03d4675ef5fb9451f356298bb96efaa1cc387b280ad035a131"
---
# Sidebar V4, Context Switcher và preset graphite - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Sidebar V4, Context Switcher và preset graphite - 2026-10-18 11:28

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
        "statement": "A desktop sd-sidebar-v4 component, forked from sd-sidebar-v3, renders the README D1-D4 frames: header (logo, app name, context slot, collapse button), pill search with Ctrl+K/Cmd+K focus and Up/Down/Enter/Esc result navigation, flat accent-insensitive search results with match highlight, Pinned and Recent shortcut sections, menu sections from menu.section, root/group/child rows with pill active state and child marker, a dot on a closed group that contains the active route, the trailing slot, the account footer, the 72px collapsed rail with separators and mini badges, and the collapsed-group flyout. It keeps V3 routing, navigation side effects, the collapse storage entry and the V3 accessibility rules.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "A mobile sd-sidebar-mobile-v4 component, forked from sd-sidebar-mobile-v3, renders the README M1-M3 frames: a 56px app bar, a drawer of min(88vw, 360px) with the V4 tree in mobile mode (44px rows, 44px search, close button), closing on backdrop, menu selection or Esc with a focus trap and focus return, clearing the query on close, and an opt-in bottom bar built from mobile.bottomBar (at most 4 menu ids plus More).",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "SdLayoutMenu gains optional fields section, badge { value, tone }, status { label, tone, live } and comingSoon, replacing the commented notify field. Existing menus compile and behave unchanged. Only V4 desktop and mobile render the new fields; a comingSoon item is aria-disabled, never navigates and is excluded from V4 search. searchMenuLeaves keeps its current behavior.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "SidebarConfigurationV4 (version: 4) extends SidebarConfigurationV3 with itemShape, density, collapsedGroup and mobile.bottomBar. It joins ISdSidebarConfiguration, normalizeSidebarConfiguration fills its defaults, and the sd-layout component renders V4 desktop or mobile by breakpoint. V4 ignores brandColor and brandLightColor.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "Every V4 colour goes through --sd-* tokens: the --sd-sidebar-v4-* colour tokens of the README table live in the theme component-token map with light and dark values, and the size tokens (width 280px, rail width 72px, item and child height, item radius) are declared on the .sd-sidebar-v4 host. V4 has no colour input and no hard-coded hex or 304px; its offsets use var(--sd-sidebar-v4-width) and var(--sd-sidebar-v4-rail-width). V1 and V3 keep their 304px layout.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-006",
        "type": "requirement",
        "statement": "A shared sd-layout-context-switcher component in components/shared/context-switcher renders the README CS1-CS3 states: header trigger, desktop popover with optional accent-insensitive search (auto above 7 items, forced by searchable), label and count, rows with image or initial avatar and an active check, the switching state that locks the list, and the mobile bottom sheet. One item shows the name only and cannot open; no configuration renders nothing. On a collapsed rail it shows the context avatar and opens to the right.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-007",
        "type": "requirement",
        "statement": "SdLayoutContextService (providedIn root) exposes getCurrentContext(): SdLayoutContext | null and setCurrentContext(id): void. Core persists a context snapshot through SdLayoutStorageService, reloads the page after a switch, emits no change event, ignores a re-selection of the active context, and reconciles the stored snapshot with the configured items so that a missing or stale id falls back to items[0] with at most one reload.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-008",
        "type": "requirement",
        "statement": "SidebarConfigurationBase gains context?: SdLayoutContextConfiguration shared by V1-V4. The switcher is mounted in the headers of sidebar V1, V2, V3 and V4 and in the drawer header of mobile V1-V4 at the agreed positions. Without context every sidebar renders exactly as before.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-009",
        "type": "requirement",
        "statement": "When another tab changes the stored context, an open tab shows a notice that the context changed elsewhere with a Reload action, and never reloads by itself.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
      },
      {
        "id": "R-010",
        "type": "requirement",
        "statement": "A ninth named preset 'graphite' is added to the theme presets with the README palette values. It is light-only like the other named presets, inherits the semantic state colours and keeps primary-contrast white.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "assets/scss/themes"
      },
      {
        "id": "R-011",
        "type": "requirement",
        "statement": "A named preset can override component tokens through an optional components sub-map that the theme mixin forwards to the component-token emitter; unknown keys fail compilation. 'graphite' overrides --sd-sidebar-v4-active-bg and --sd-sidebar-v4-active-shadow so the active V4 item is a raised surface.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "assets/scss/themes"
      },
      {
        "id": "R-012",
        "type": "requirement",
        "statement": "The audit of components that colour links or text buttons with --sd-primary is recorded, no new token is created, and the theme docs state that under graphite those elements share the text colour.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "assets/scss/themes"
      },
      {
        "id": "R-013",
        "type": "requirement",
        "statement": "Documentation, Showcase, i18n, tests and release notes follow the change: STYLE-GUIDE.md and THEME.md list nine presets, sd-layout.md documents V4, the new menu fields and the context API, the Showcase layout page gains V4 and context demos with matching counts, the five i18n catalogs get the new keys, theme scripts cover graphite, CHANGELOG.md gets an Unreleased entry, and v20/v21/v22 are produced by npm run sync.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "modules/layout"
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
          "AC-023"
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
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-023.task_refs",
        "record_id": "AC-023",
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
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-011.task_refs",
        "record_id": "R-011",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-012.task_refs",
        "record_id": "R-012",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-013.task_refs",
        "record_id": "R-013",
        "message": "a requirement must map to at least one planned task"
      }
    ]
  },
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
  "contract_id": "sidebar-v4-context-switcher-graphite-v1",
  "requirement_id": "sidebar-v4-context-switcher-graphite-v1",
  "approved_spec_path": "",
  "approved_spec_hash": "",
  "supersedes": null,
  "parent_references": [],
  "target_root": ".",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "modules/layout",
  "execution_host_repository_id": "sdcorejs-angular",
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "profile_confidence": "high",
  "source_requirement_context": "brainstorming 2026-10-18: design_handoff_sidebar_v4 README + 12-item user brief; 13 defaults confirmed by the user",
  "acceptance_criteria_count": 23,
  "manual_criteria_count": 0,
  "non_goals": [
    "Legacy (@sd-angular/core) port in this round",
    "visual or behavioural change to sidebar V1-V3 beyond mounting the context switcher when context is configured",
    "changes to components/shared/menu-tree, searchMenuLeaves or the V1/V3 304px layout",
    "a new link token or fixes to components that colour links/text buttons with --sd-primary",
    "a dark graphite variant or a consumer $theme component-token override API",
    "a context change event/observable or automatic reload in other tabs",
    "permission or menu loading by context inside Core",
    "new routes, packages or fonts"
  ],
  "risks": [
    "reconcile reload loop when storage writes fail or items change between loads",
    "storage namespace that depends on the context itself",
    "Ctrl+K / Cmd+K conflicts with app or browser shortcuts",
    "missing chrome glyphs in the bundled Material Symbols v29 font",
    "links and text buttons blend with body text under graphite",
    "Showcase registry/manifest count drift",
    "npm run sync rewriting v22 as CRLF on a CRLF checkout",
    "large spec reviewed in one pass"
  ],
  "assumptions": [
    "A-001: Reloading the page after a context switch, with no change event, is acceptable to consuming apps.",
    "A-002: The bundled Material Symbols font is the static v29 regular cut, so the FILL axis is unavailable and some chrome glyphs may be missing.",
    "A-003: No layout outside sidebar V1 and V3 hard-codes the 304px sidebar width or a sidebar-dependent fixed offset.",
    "A-004: Consumers read the context through getCurrentContext(), which serves one snapshot per page load, so a tab stays internally consistent after another tab switches."
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

Các backoffice console dùng `@sdcorejs/angular` cần một sidebar gọn hơn V3, chuẩn hoá phần đuôi của dòng menu (số đếm, badge chờ xử lý, trạng thái, sắp ra mắt), và một cách chuyển phạm vi làm việc (project / chi nhánh / tenant) giống nhau ở mọi phiên bản sidebar. Đội product cũng muốn có preset `graphite` (primary đen) để console chỉ cần `@include sd.theme($preset: 'graphite')`.

Nguồn: gói thiết kế `design_handoff_sidebar_v4` (README + các file `.dc.html`, high-fidelity) và brief 12 mục của người dùng ngày 2026-10-18. 13 quyết định mặc định ở bước brainstorming đã được người dùng chốt.

Thành công khi:

- App chọn `version: 4` có sidebar desktop và mobile đúng thiết kế D1–D4 và M1–M3. Route, điều hướng, trạng thái thu gọn đã lưu và các nguyên tắc a11y của V3 vẫn giữ nguyên.
- Consumer chỉ khai `context.items` là có Context Switcher ở V1, V2, V3 và V4. Core tự lo lưu, khôi phục và reload; không khai `context` thì sidebar không đổi gì.
- `graphite` là preset có tên thứ 9: light-only, item active của V4 nổi trắng mà sidebar không có code riêng cho preset.
- Danh sách component dùng `--sd-primary` cho link hoặc text-button được ghi lại, không tạo token mới.

## Requirements

- R-001 - Sidebar V4 desktop `sd-sidebar-v4`, fork từ `sd-sidebar-v3`, dựng đủ các frame D1–D4:
  - header gồm logo, tên app, vị trí Context Switcher và nút thu gọn;
  - search dạng pill: `Ctrl+K`/`⌘K` để focus, `↑ ↓ Enter Esc` để chọn kết quả; kết quả phẳng, không phân biệt dấu, có highlight phần khớp;
  - section Pinned và Recent, section từ `menu.section`;
  - dòng root/group/child với active dạng pill, marker ở child active, chấm trên group đang đóng mà chứa route active;
  - trailing slot và footer tài khoản;
  - rail thu gọn 72px với separator và badge thu nhỏ;
  - flyout cho group khi rail thu gọn.

  Giữ nguyên routing, tác dụng phụ khi điều hướng, entry lưu trạng thái thu gọn và các luật a11y của V3. Nguồn: người dùng. Owner: `modules/layout`.
- R-002 - Sidebar V4 mobile `sd-sidebar-mobile-v4`, fork từ `sd-sidebar-mobile-v3`, dựng M1–M3:
  - app bar 56px;
  - drawer rộng `min(88vw, 360px)` chứa cây V4 ở mode mobile: dòng 44px, search 44px, nút đóng;
  - drawer đóng khi chạm backdrop, chọn menu hoặc nhấn Esc; có focus trap, trả focus về trigger và xoá query khi đóng;
  - bottom bar opt-in lấy từ `mobile.bottomBar`: tối đa 4 menu id, cộng nút "More".

  Nguồn: người dùng. Owner: `modules/layout`.
- R-003 - `SdLayoutMenu` thêm các field optional `section`, `badge { value, tone }`, `status { label, tone, live }` và `comingSoon`. Field `notify` đang bị comment được bỏ hẳn.
  - Menu hiện có compile và chạy như cũ.
  - Chỉ V4 (desktop và mobile) render các field mới.
  - Item `comingSoon` có `aria-disabled`, không điều hướng và bị loại khỏi search của V4.
  - `searchMenuLeaves` giữ nguyên.

  Nguồn: người dùng. Owner: `modules/layout`.
- R-004 - `SidebarConfigurationV4` (`version: 4`) kế thừa `SidebarConfigurationV3` và thêm `itemShape`, `density`, `collapsedGroup`, `mobile.bottomBar`. Kiểu này vào union `ISdSidebarConfiguration`; `normalizeSidebarConfiguration` điền default; component `sd-layout` render V4 desktop hoặc mobile theo breakpoint. V4 bỏ qua `brandColor`/`brandLightColor`. Nguồn: người dùng. Owner: `modules/layout`.
- R-005 - Mọi màu của V4 đi qua token `--sd-*`:
  - token màu `--sd-sidebar-v4-*` theo bảng README nằm trong map component token của theme, có giá trị light và dark;
  - token kích thước (width 280px, rail 72px, chiều cao item/child, radius item) khai trên host `.sd-sidebar-v4`;
  - V4 không có input màu, không có hex và không có `304px`; offset dùng `var(--sd-sidebar-v4-width)` và `var(--sd-sidebar-v4-rail-width)`.

  V1 và V3 giữ layout 304px. Nguồn: người dùng. Owner: `modules/layout`.
- R-006 - Component dùng chung `sd-layout-context-switcher` ở `components/shared/context-switcher` dựng các trạng thái CS1–CS3:
  - trigger ở header;
  - popover desktop có search tuỳ chọn, không phân biệt dấu: tự bật khi có hơn 7 mục, `searchable` để ép bật hoặc tắt;
  - nhãn kèm số lượng; row có avatar ảnh hoặc chữ cái đầu, row active có dấu check;
  - trạng thái đang chuyển: khoá cả danh sách;
  - bottom sheet trên mobile.

  Chỉ có 1 mục: hiện tên, không mở được. Không cấu hình: không render gì. Trên rail thu gọn: hiện avatar context, popover mở sang phải. Nguồn: người dùng. Owner: `modules/layout`.
- R-007 - `SdLayoutContextService` (`providedIn: 'root'`) có `getCurrentContext(): SdLayoutContext | null` và `setCurrentContext(id): void`. Core:
  - lưu snapshot context qua `SdLayoutStorageService` và reload trang sau khi chuyển;
  - không phát event change;
  - bỏ qua khi chọn lại context đang active;
  - đối chiếu snapshot với `items` đã cấu hình: id chưa có hoặc đã cũ thì quay về `items[0]`, reload tối đa một lần.

  Nguồn: người dùng. Owner: `modules/layout`.
- R-008 - `SidebarConfigurationBase` thêm `context?: SdLayoutContextConfiguration`, dùng chung cho V1–V4. Switcher được gắn vào header của V1, V2, V3, V4 và header drawer của mobile V1–V4, đúng vị trí ở D-010. Không có `context` thì mọi sidebar render y như cũ. Nguồn: người dùng. Owner: `modules/layout`.
- R-009 - Khi tab khác đổi context đã lưu, tab đang mở hiện thông báo "Context đã đổi ở tab khác" kèm nút Tải lại, không tự reload. Nguồn: người dùng (đề xuất README #10, đã chốt). Owner: `modules/layout`.
- R-010 - Thêm preset có tên thứ 9 `'graphite'` vào `_presets.scss` với đúng giá trị palette của README. Light-only như các preset khác (D-022); kế thừa màu trạng thái semantic; `primary-contrast` vẫn là trắng. Nguồn: người dùng. Owner: `assets/scss/themes`.
- R-011 - Preset có tên ghi đè được component token qua sub-map `components` (tuỳ chọn). Mixin theme chuyển sub-map này xuống bộ emit component token; key lạ làm compile fail. `graphite` ghi đè `--sd-sidebar-v4-active-bg` và `--sd-sidebar-v4-active-shadow` để item active của V4 thành một bề mặt nổi. Nguồn: người dùng. Owner: `assets/scss/themes`.
- R-012 - Ghi lại kết quả rà các component dùng `--sd-primary` cho link hoặc text-button (mục "Báo cáo mục 9"). Không tạo token mới. Docs theme ghi rõ: với `graphite`, các phần tử này cùng màu chữ thường. Nguồn: người dùng. Owner: `assets/scss/themes`.
- R-013 - Tài liệu, Showcase, i18n, test và release notes đi cùng thay đổi:
  - `STYLE-GUIDE.md` và `THEME.md` liệt kê chín preset;
  - `sd-layout.md` mô tả V4, các field menu mới và API context;
  - trang Layout của Showcase có thêm demo V4 và demo context, số đếm khớp;
  - 5 catalog i18n có đủ key mới;
  - script theme phủ `graphite`;
  - `CHANGELOG.md` có mục Unreleased;
  - v20/v21/v22 sinh ra bằng `npm run sync`.

  Nguồn: người dùng. Owner: `modules/layout`.

## Decisions

- D-001 - Phạm vi repo → chỉ Core UI (`@sdcorejs/angular`). Port sang Legacy là yêu cầu riêng, làm sau. Nguồn: người dùng. Scope: repository.
- D-002 - Phạm vi V4 → đủ README: flyout, `mobile.bottomBar`, `density`, `itemShape`, `Ctrl+K`/`⌘K`, điều hướng kết quả bằng phím và UI kết quả search. Nguồn: người dùng.
- D-003 - Section của V4 → giữ Recent của V3, style giống Pinned. Bỏ heading "All menu", dùng heading từ `menu.section`; item không có section thì không có heading. Nguồn: người dùng.
- D-004 - Nơi lưu trạng thái thu gọn của V4 → dùng chung entry version 3 trong `versionStates`, không thêm key. Lý do: đúng yêu cầu "giữ storage key V3", và app chuyển từ V3 sang V4 vẫn giữ lựa chọn của người dùng. Nguồn: người dùng.
- D-005 - Sidebar nào render field menu mới → chỉ V4 (desktop và mobile). V1–V3 bỏ qua; item `comingSoon` ở V1–V3 vẫn điều hướng như cũ. Nguồn: người dùng. Scope: public-contract.
- D-006 - Nơi khai token V4 → token màu trong map component token của theme (có light và dark). Token kích thước khai trên host `.sd-sidebar-v4`, vì chúng đổi theo `density`, `itemShape` và loại con trỏ. Nguồn: người dùng.
- D-007 - Cách preset ghi đè component token → sub-map `components` tuỳ chọn trong preset; mixin chuyển nó xuống bộ emit; key không có trong `$component-tokens` thì `@error`. Không special-case `graphite` trong mixin. Nguồn: người dùng. Scope: public-contract.
- D-008 - Context lúc bootstrap:
  - `context` nằm ở `SidebarConfigurationBase`;
  - storage giữ snapshot `{ id, title, subtitle?, avatar? }`;
  - `getCurrentContext()` trả snapshot, lần đầu trả `null`;
  - khi có `items`: id hợp lệ thì chỉ cập nhật snapshot; id chưa có hoặc đã cũ thì lưu `items[0]` rồi reload một lần.

  Lý do: config `sidebar` có thể resolve sau `APP_INITIALIZER`, nên lúc đó chưa có `items`. Nguồn: người dùng. Scope: public-contract.
- D-009 - Nơi lưu snapshot → qua `SdLayoutStorageService`: theo `SD_LAYOUT_STORAGE_NAMESPACE`, và bị `clear()` xoá lúc signout. Cùng mô hình riêng tư với pinned/recent. Nguồn: người dùng.
- D-010 - Vị trí switcher:
  - V1 và V3: ngay dưới tên app; khi thu gọn thành avatar context ở đầu rail, popover mở sang phải;
  - V2: avatar context dưới logo ở rail;
  - V4: dưới tên app như README D1, avatar ở đầu rail khi thu gọn;
  - mobile V1–V4: bottom sheet mở từ header drawer.

  Nguồn: người dùng.
- D-011 - Đồng bộ nhiều tab → nghe sự kiện `storage`, hiện thông báo kèm nút Tải lại; không bao giờ tự reload. Nguồn: người dùng.
- D-012 - Icon:
  - icon menu dùng `material-icons-outlined` như V3; root active đổi sang `material-icons` (bản filled) cùng tên;
  - icon điều khiển dùng Material Symbols nếu font kèm theo có glyph, không có thì dùng glyph gần nhất.

  Lý do: font Symbols kèm theo không có trục FILL. Nguồn: người dùng.
- D-013 - Cách viết test → TDD cho `SdLayoutContextService`, normalize config, helper menu và preset theme. Spec component theo kiểu V3 cho sidebar-v4, sidebar-mobile-v4, context switcher và các chỗ gắn vào V1–V3. Nguồn: người dùng. Scope: repository.
- D-014 - Cây menu của V4 → cây riêng nằm trong `sidebar-v4`; không sửa `components/shared/menu-tree`. Lý do: V2, V3 và các sidebar mobile đang dùng cây chung, tách riêng thì không có rủi ro regression. Nguồn: spec này.
- D-015 - Trailing slot → mỗi item tối đa một phần tử, ưu tiên theo thứ tự `comingSoon`, `badge`, `status`. Badge `neutral` là chữ số đếm 12px; `warning`/`error` là pill. Nguồn: spec này.
- D-016 - Kết quả rà link/text-button → báo cáo và ghi giới hạn vào docs; đợt này không tạo token và không sửa component. Nguồn: spec này.
- D-017 - Tên public của API context → `SdLayoutContext`, `SdLayoutContextConfiguration` (README viết `SdLayoutContextConfig`), `SdLayoutContextService` với `getCurrentContext`/`setCurrentContext`, selector `sd-layout-context-switcher`. Tính năng gọi là Context, không dùng "branch" hay "workspace".
  - Lý do (API consistency): repo đặt tên kiểu consumer cấu hình là `*Configuration`, ví dụ `SdLayoutNotificationConfiguration`, `SidebarConfigurationV3`, `ISdLayoutConfiguration`. Chữ "branch" đã dùng cho đường kẻ cây menu.
  - Nguồn: spec này. Scope: public-contract.
- D-018 - `setCurrentContext` với id không có trong `items` → bỏ qua: không ghi, không reload. Lý do: tránh lưu một id mà lần load sau sẽ bị đổi ngay. Nguồn: spec này.

## Assumptions

- A-001 - Consumer chấp nhận reload trang sau khi chuyển context và không có event change.
  - Nguồn: tường minh (README ghi đã chốt với product owner). Độ tin cậy cao. Đã xác nhận. Không chặn.
  - Nếu sai: app cần chuyển tại chỗ sẽ phải có API khác.
- A-002 - Font Material Symbols kèm theo là bản static v29 regular: không có trục FILL và có thể thiếu một số glyph điều khiển (`left_panel_close`, `left_panel_open`, `keep`, `unfold_more`, `unfold_less`, `progress_activity`).
  - Nguồn: suy ra từ `fonts.scss`. Độ tin cậy trung bình. Đang đề xuất. Không chặn.
  - Cách kiểm: khi lập plan, kiểm file font và render từng glyph trên Showcase; glyph nào thiếu thì chọn thay thế theo D-012.
- A-003 - Ngoài sidebar V1 và V3 không có chỗ nào hard-code width 304px hay offset fixed phụ thuộc sidebar.
  - Nguồn: suy ra. Độ tin cậy cao. Đã kiểm.
  - Cách kiểm: grep `304px`, width rail và `calc(100vw - …)` trong lib và Showcase. Chỉ thấy ở V1, V3 và spec của V3.
- A-004 - Consumer đọc context qua `getCurrentContext()`. Hàm này trả một snapshot cố định trong mỗi lần load trang, nên một tab không bị trộn context khi tab khác chuyển.
  - Nguồn: suy ra. Độ tin cậy trung bình. Đang đề xuất. Không chặn.
  - Cách kiểm: ghi luật này trong `sd-layout.md` và phủ hành vi snapshot bằng spec của service.

## Architecture gate classification

- Status: required
- Signals: `public-api-contract`, `state-data-ownership`, `persisted-data-model-contract`
- Rationale:
  - thêm API public: `sd-sidebar-v4`, `sd-sidebar-mobile-v4`, `sd-layout-context-switcher`, `SdLayoutContextService`, `SidebarConfigurationV4`, các field mới của `SdLayoutMenu`, và key `components` cho preset theme;
  - Core trở thành owner của state context hiện tại (đọc lúc bootstrap, đối chiếu, reload);
  - thêm một bản ghi lưu bền phía client: snapshot context trong localStorage, sống qua reload và giữa các tab.

## Non-goals

- Không port sang Legacy (`@sd-angular/core`) trong đợt này.
- Không đổi giao diện hay hành vi của V1–V3, ngoài việc gắn switcher khi có `context`.
- Không sửa `components/shared/menu-tree`, `searchMenuLeaves` và layout 304px của V1/V3.
- Không tạo token link mới. Không sửa các component dùng `--sd-primary` cho link hoặc text-button.
- Không có bản dark cho `graphite`. Không mở API để consumer ghi đè component token qua `$theme`.
- Không có event/observable khi context đổi; tab khác không tự reload.
- Core không load permission hay menu theo context; consumer tự làm ở bootstrap.
- Không thêm route, package hay font mới.

## Architecture

### Phạm vi và nguồn

Nguồn canonical là `versions/v19/projects/sdcorejs-angular/`. v20/v21/v22 chỉ sinh ra qua `npm run sync`. Các file `.dc.html` là bản tham chiếu: dựng lại bằng standalone component, signals, SCSS dùng token `--sd-*`, i18n qua `sdTranslate`, test theo kiểu spec của `sidebar-v3`.

### Sidebar V4 (`modules/layout/components/sidebar-v4`)

- `SdSidebarV4`, selector `sd-sidebar-v4`. Input giống V3: `menus`, `userInfo` (required), `sidebar: SidebarConfigurationV4` (required); content chiếu qua `<ng-content>`. Không có input màu.
- State bằng signals:
  - `isCollapsed`, nhóm đang đóng, `searchText`, `activePath`, `focusedResultIndex`, `flyoutGroupKey`;
  - `searchResults` là danh sách lá đã làm phẳng, bỏ `comingSoon`, so khớp bằng `StringUtilities.aliasIncludes` (không phân biệt dấu, `đ` → `d`, như V3);
  - `sections` nhóm item theo `menu.section`, giữ thứ tự xuất hiện đầu tiên.
- Điều hướng, pinned/recent và cách mở nhánh active copy đúng hành vi V3:
  - `router.navigate` với `queryParams` và `state: { switchTab: true }`; URL ngoài đi qua `sdIsExternalHttpUrl`/`sdOpenExternal`; `recordRecent`; `togglePinned`;
  - nhánh chứa route active chỉ được mở khi route hoặc menu đổi.
- Trạng thái thu gọn đọc/ghi `SdLayoutNavigationStateService.versionState(3)` / `patchVersionState(3)` (D-004).
- Cây menu V4 là component nội bộ trong `sidebar-v4/` (D-014):
  - dòng root 36px pill, icon 20px (chỉ ở root); group có chevron và `aria-expanded`;
  - child 32px chỉ có chữ, indent 16px; branch rail 1px tại `left: 21px`; marker 3px khi active;
  - trailing slot theo D-015;
  - focus-visible: ring `inset 0 0 0 2px var(--sd-primary)` trên mọi dòng và nút.
- Phím tắt:
  - `Ctrl+K`/`⌘K` nghe ở `document` khi V4 đang mount. Bỏ qua nếu event đã `defaultPrevented`. Rail đang thu gọn thì mở rộng rồi focus search.
  - `↑ ↓` đổi kết quả đang chọn (mặc định là kết quả đầu), `Enter` mở, `Esc` xoá query.
- Rail thu gọn:
  - rộng `var(--sd-sidebar-v4-rail-width)`; item 48×36; separator giữa các section; badge thu nhỏ và live dot;
  - item thường có `title` + `aria-label` làm tooltip native.
- Group khi rail thu gọn:
  - `collapsedGroup: 'flyout'` (mặc định): mở panel rộng 232px. Panel đóng khi điều hướng, click ra ngoài hoặc nhấn Esc, rồi trả focus về nút group.
  - `'expand'`: mở rộng drawer và mở đúng group đó, như V3.
- Tôn trọng `prefers-reduced-motion`: tắt transition expand, flyout và popover. Với `pointer: coarse`, mọi dòng tối thiểu 44px.

### Sidebar V4 mobile (`modules/layout/components/sidebar-mobile-v4`)

- Fork `sd-sidebar-mobile-v3`: app bar 56px gồm nút menu 44px, tiêu đề, nút search 44px và avatar.
- Drawer:
  - `role="dialog"`, `aria-modal`, `cdkTrapFocus`;
  - rộng `min(88vw, 360px)`, radius `0 24px 24px 0`, backdrop;
  - chứa cây V4 ở mode mobile: dòng 44px, search sticky 44px, nút đóng 44px.
  - Đóng khi chạm backdrop, chọn menu hoặc nhấn Esc; trả focus về trigger; xoá query.
- Bottom bar chỉ hiện khi có `mobile.bottomBar`:
  - tối đa 4 id hợp lệ (bỏ trùng, rỗng, không tìm thấy) cộng cột "More" mở drawer;
  - indicator 56×30; active thì nền `--sd-sidebar-v4-active-bg` và có `aria-current="page"`.

### Model menu (`services/menu/menu.model.ts`)

```ts
section?: string;
badge?: { value: number | string; tone?: 'neutral' | 'warning' | 'error' };
status?: { label: string; tone: 'success' | 'warning' | 'error'; live?: boolean };
comingSoon?: boolean;
```

Field có ở cả `SdLayoutRootMenu` và `SdLayoutChildrenMenu`; comment `notify` bị xoá. Helper lọc `comingSoon` cho search của V4 là hàm mới trong `menu.utils.ts`; `searchMenuLeaves` không đổi.

### Cấu hình (`configurations/layout.configuration.ts`)

```ts
export interface SdLayoutContext { id: string; title: string; subtitle?: string; avatar?: string }
export interface SdLayoutContextConfiguration { label?: string; items: SdLayoutContext[]; searchable?: boolean }

export interface SidebarConfigurationBase { /* ...hiện có */ context?: SdLayoutContextConfiguration }

export interface SidebarConfigurationV4 extends Omit<SidebarConfigurationV3, 'version'> {
  version: 4;
  itemShape?: 'pill' | 'soft';          // mặc định 'pill'
  density?: 'compact' | 'comfortable';  // mặc định 'compact' (36/32px), comfortable 40/34px
  collapsedGroup?: 'flyout' | 'expand'; // mặc định 'flyout'
  mobile?: { bottomBar?: string[] };    // tối đa 4 menu id
}
```

`ISdSidebarConfiguration` thêm `SidebarConfigurationV4`. `normalizeSidebarConfiguration` có overload cho V4: điền ba default, chuẩn hoá `recent` như V3, lọc `bottomBar` (chuỗi khác rỗng, không trùng, tối đa 4). `SdLayout` thêm computed `sidebarV4` và nhánh render desktop/mobile.

### Token và kích thước

Token màu trong `assets/scss/themes/_component-tokens.scss`, dạng `(light, dark)`. Hầu hết dùng cùng biểu thức cho cả hai mode:

| Token | Giá trị |
|---|---|
| `sidebar-v4-bg` | `color-mix(in srgb, var(--sd-text) 4%, var(--sd-surface))` |
| `sidebar-v4-line` | `color-mix(in srgb, var(--sd-border) 45%, var(--sd-surface))` |
| `sidebar-v4-hover-bg` | `color-mix(in srgb, var(--sd-text) 6%, var(--sd-sidebar-v4-bg))` |
| `sidebar-v4-active-bg` | `var(--sd-primary-light)` |
| `sidebar-v4-active-shadow` | `none` |
| `sidebar-v4-active-ink` | `var(--sd-primary)` |
| `sidebar-v4-avatar-bg` | `color-mix(in srgb, var(--sd-primary) 14%, var(--sd-surface))` |
| `sidebar-v4-avatar-ink` | `var(--sd-primary)` |
| `sidebar-v4-attention` | `var(--sd-warning)` |
| `sidebar-v4-live` | `var(--sd-success)` |

- Màu trung tính của mock map về token có sẵn: chữ `--sd-text`, chữ phụ và icon `--sd-text-secondary`, viền `--sd-border`. Tone `error` dùng `--sd-error`. Ring của live dot là `color-mix` từ màu tone với surface. Không có hex trong SCSS của V4.
- Token kích thước khai trên host `.sd-sidebar-v4` / `.sd-sidebar-mobile-v4`:
  - `--sd-sidebar-v4-width: 280px`, `--sd-sidebar-v4-rail-width: 72px`;
  - `--sd-sidebar-v4-item-height` 36px / comfortable 40px / coarse hoặc mobile 44px;
  - `--sd-sidebar-v4-child-height` 32px / 34px / 44px;
  - `--sd-sidebar-v4-item-radius` 999px / soft 8px.

  Host đổi các giá trị này theo class modifier (`--soft`, `--comfortable`) và theo `@media (pointer: coarse)`.
- Drawer V4 `position: fixed` rộng `var(--sd-sidebar-v4-width)`. Vùng content `margin-left: var(--sd-sidebar-v4-width)`, khi thu gọn là `var(--sd-sidebar-v4-rail-width)`. Ngoài V4 không cần sửa chỗ nào (A-003).

### Context Switcher (`components/shared/context-switcher`)

- `SdLayoutContextSwitcher`, selector `sd-layout-context-switcher`. Input:
  - `configuration: SdLayoutContextConfiguration | undefined`;
  - `appearance: 'header' | 'rail' | 'sheet'`;
  - `placement` cho popover.

  Component lấy `current` và `switching` từ `SdLayoutContextService`.
- Không có `configuration` hoặc `items` rỗng: không render. Một mục: chỉ hiện tên, không chevron, không mở được.
- Popover desktop (CS1):
  - CDK overlay, vị trí ngay dưới header, rộng bằng sidebar trừ 24px;
  - search hiện khi `searchable ?? items.length > 7`, lọc bằng `aliasIncludes`;
  - nhãn `{label} · {n}`;
  - row 48px pill; avatar ảnh, hoặc chữ cái đầu khi không có ảnh hay ảnh lỗi;
  - row active nền `--sd-sidebar-v4-active-bg`, title màu `--sd-primary`, dấu `check`, có `aria-current="true"`.
  - Trên header, cả vùng có nền hover và icon đổi `unfold_more` ↔ `unfold_less`.
- Chọn mục khác (CS2): row đó có `aria-busy="true"`, spinner `progress_activity` và subtitle "Đang chuyển…"; các row khác disabled; gọi `setCurrentContext(id)`. Chọn lại mục đang active: chỉ đóng popover.
- Mobile (CS3): bottom sheet radius `28px 28px 0 0`, có handle, tiêu đề `Chọn {label}`, nút đóng 44px, row 56px. Focus trap, Esc đóng, trả focus về trigger.
- Mặc định của `label` là khoá i18n "Context". Mọi chuỗi đi qua `sdTranslate` (mục i18n).

### SdLayoutContextService và vòng đời

- `providedIn: 'root'`. Không phụ thuộc `SdLayoutService`, nên gọi được trong `provideAppInitializer` trước khi layout resolve config `sidebar` (A-004).
- Lúc khởi tạo đọc snapshot một lần vào signal `current` (D-008). `getCurrentContext()` trả bản sao của snapshot, hoặc `null`.
- `setCurrentContext(id)`:
  - id bằng `current().id`: không làm gì;
  - id không có trong `items` đã biết, hoặc chưa biết `items`: bỏ qua (D-018);
  - còn lại: bật `switching`, ghi snapshot, đọc lại để xác nhận đã ghi được, rồi gọi `location.reload()` qua `DOCUMENT.defaultView` để test được.
- Đối chiếu: `SdLayoutService` gọi `contextService.syncItems(items)` mỗi khi resolve một config `sidebar` có `context`.
  - id hợp lệ: cập nhật snapshot (title có thể đã đổi), không reload;
  - chưa có hoặc đã cũ: lưu `items[0]`, đọc lại thấy đúng thì reload một lần;
  - `items` rỗng: không lưu, switcher ẩn;
  - không ghi được (private mode, quota): giữ `items[0]` trong bộ nhớ và không reload, tránh vòng lặp.
- Storage: thêm handle `currentContext` (`SdStorage<SdLayoutContext>`) vào `SdLayoutStorageService`, theo namespace và bị `clear()` xoá (D-009). `sd-layout.md` cảnh báo: đừng cho namespace phụ thuộc chính context.
- Đồng bộ nhiều tab (D-011): service nghe `window` `storage` cho đúng key của handle (đã gắn namespace). Khi id khác `current().id`, signal `changedElsewhere` bật lên và switcher hiện thông báo kèm nút Tải lại.

### Gắn vào V1–V4

| Sidebar | Vị trí |
|---|---|
| V1 (`sidebar-v1/components/sidebar`) | dưới tiêu đề trong `c-header`; khi `isShowSidebar` tắt thì hiện avatar dưới logo ở rail 56px |
| V2 | avatar dưới nút brand trên rail; popover mở sang phải |
| V3 | dòng dưới tên app trong header; khi thu gọn là avatar ở đầu rail |
| V4 | dòng dưới tên app (README D1); khi thu gọn là avatar ở đầu rail |
| mobile V1–V4 | trigger trong header drawer; mở bottom sheet |

Mỗi sidebar chỉ thêm `<sd-layout-context-switcher>` sau điều kiện `@if (sidebar().context)`. Không có `context` thì DOM, style và spec hiện có của V1–V3 không đổi.

### Preset `graphite` và ghi đè component token

- `_presets.scss` thêm:

  ```scss
  'graphite': (
    primary: #16181d, primary-light: #e3e5ea, primary-dark: #0b0c0f,
    surface: #ffffff, surface-muted: #f3f4f7,
    text: #16181d, text-secondary: #5a606b,
    border: #dadde3, border-strong: #737985,
    components: (
      sidebar-v4-active-bg: var(--sd-surface),
      sidebar-v4-active-shadow: (0 0 0 1px var(--sd-border), 0 1px 2px rgba(20, 22, 28, 0.06)),
    ),
  ),
  ```
- Trong `default.scss`, mixin `theme` tách `components` khỏi map preset trước khi merge palette, rồi chuyển xuống `component-tokens.emit($scheme, $overrides)`.
  - `emit` áp override sau giá trị mặc định.
  - Key không có trong `$component-tokens` thì `@error` kèm danh sách key hợp lệ.
  - Tập tên `--sd-*` emit ra giống hệt giữa các preset, nên test parity hiện có vẫn giữ được.
- D-022 không đổi: `graphite` cộng `$mode: 'dark' | 'auto'` vẫn bị từ chối.
- Script test:
  - `core-theme.test.mjs`: thêm `graphite` vào `expected`, `V215_PRESETS` (đổi tên phù hợp nếu cần) và phần kiểm override;
  - `theme-contrast.test.mjs`: thêm vào `PRESETS`.

### Báo cáo mục 9 (link / text-button dùng `--sd-primary`)

Theme đã có `--sd-link: var(--sd-primary)` (`_semantic.scss`). Token này không thuộc `$public-colors` nên preset không đổi được, và hiện chỉ `upload-file` dùng. Với `graphite`, các chỗ dưới đây sẽ cùng màu chữ thường:

- Link:
  - `a` global (`assets/scss/core/utilities/_base.scss`), `a` trong `editor-content.scss`;
  - tên file trong `upload-file`;
  - breadcrumb của drawer API contract builder;
  - nút "show more" của `inform`.
- Text button:
  - `sd-button` `type='text'` và `outline`;
  - trigger của `operator`, `preview-video`, các action của `job-progress`, `.text-button` của `image-editor`;
  - form-builder: `.fb-add-link`, `.opt__add`, `.fb-add-zone`, `.vb__edit`.
- Chữ active: label active của `tab-group`, `anchor-nav`, label bước đang chọn của `stepper`, `menu-tree` (V2/V3/mobile), màu brand inline của sidebar-v1.
- Chữ giá trị/token: `query-bar` (khoảng 12 chỗ), `query-builder`, `inline-text`, `mapping-box`, `attribute-expression`, số issue của `import-excel`, field type của API contract builder.

Xử lý (D-016): ghi một ghi chú vào mục preset của `THEME.md` và `STYLE-GUIDE.md`. Không đổi component nào.

### i18n

Thêm khoá dưới `core.module.layout.*` cho đủ 5 catalog (`en`, `vi`, `ja`, `ko`, `zh`):

- search V4: placeholder, số kết quả, trạng thái rỗng, gợi ý phím;
- chip "Soon";
- `aria-label` của badge;
- nhãn "More";
- context: nhãn mặc định, placeholder search, tiêu đề sheet, "Đang chuyển…", thông báo đổi ở tab khác, nút "Tải lại".

`check:i18n` và `check:i18n-parity` phải pass.

### Test và kiểm chứng

- TDD (D-013): `context.service.spec.ts`, spec của config normalize, spec helper menu, script theme.
- Spec component kiểu V3:
  - `sidebar-v4/main.component.spec.ts`, `sidebar-mobile-v4/main.component.spec.ts`;
  - `context-switcher.component.spec.ts`;
  - spec của `layout-main` (version 4);
  - spec gắn switcher ở V1/V2/V3 và mobile V1–V3.
- Lệnh kiểm:
  - trong `versions/v19`: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage`;
  - ở root: `npm run test:scripts`, `npm run sync`, `npm run check:sync`;
  - test Showcase sau `npm --prefix showcase run link:library`.

## Stack profile and technology assumptions

- Track: angular
- Stack profile: `core-ui-angular`
- Profile evidence: repo chính chủ của `@sdcorejs/angular` (`versions/v19/projects/sdcorejs-angular`, `ng-package.json`); Angular 19 standalone + signals; module `modules/layout` có sẵn V1–V3.
- Technology assumptions:
  - dùng `@angular/cdk` (overlay, a11y focus trap) đã có trong thư viện; không thêm dependency;
  - icon theo D-012 (font Material Icons và Material Symbols v29 đã kèm theo);
  - SCSS theo tầng token của `assets/scss/themes`;
  - workspace v19 cài/build bằng Node `22.22.3` và `npm ci --legacy-peer-deps`.

## File structure

Đường dẫn tương đối với `versions/v19/projects/sdcorejs-angular/`, trừ các mục ghi "(root)":

- `modules/layout/components/sidebar-v4/main.component.{ts,html,scss,spec.ts}` - tạo mới: sidebar V4 desktop.
- `modules/layout/components/sidebar-v4/menu-tree/*.{ts,html,scss,spec.ts}` - tạo mới: cây menu, trailing slot, section, flyout của V4 (nội bộ).
- `modules/layout/components/sidebar-mobile-v4/main.component.{ts,html,scss,spec.ts}` - tạo mới: app bar, drawer, bottom bar.
- `modules/layout/components/shared/context-switcher/context-switcher.component.{ts,html,scss,spec.ts}` - tạo mới: trigger, popover, bottom sheet, thông báo đổi ở tab khác.
- `modules/layout/services/context/{context.model.ts,context.service.ts,context.service.spec.ts,index.ts}` - tạo mới: model và service context.
- `modules/layout/services/menu/menu.model.ts` - sửa: field mới, bỏ comment `notify`.
- `modules/layout/services/menu/menu.utils.ts` + spec - sửa: helper lọc `comingSoon` và nhóm section cho V4.
- `modules/layout/services/storage/storage.service.ts` + spec - sửa: handle `currentContext`.
- `modules/layout/services/layout.service.ts` + spec - sửa: gọi `syncItems` khi resolve config có `context`.
- `modules/layout/services/index.ts`, `modules/layout/components/index.ts`, `modules/layout/index.ts` - sửa: export public.
- `modules/layout/configurations/layout.configuration.ts` + spec - sửa: `SdLayoutContext*`, `SidebarConfigurationV4`, union, normalize.
- `modules/layout/components/layout-main/layout-main.component.{ts,html,spec.ts}` - sửa: nhánh version 4.
- `modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.{html,scss,ts,spec.ts}` - sửa: gắn switcher.
- `modules/layout/components/sidebar-v2/main.component.{html,scss,ts,spec.ts}` - sửa: gắn switcher.
- `modules/layout/components/sidebar-v3/main.component.{html,scss,ts,spec.ts}` - sửa: gắn switcher.
- `modules/layout/components/sidebar-mobile-v1/**`, `sidebar-mobile-v2/main.component.*`, `sidebar-mobile-v3/main.component.*` + spec - sửa: gắn switcher trong header drawer.
- `modules/layout/sd-layout.md` - sửa: V4, field menu mới, API context (ví dụ `provideAppInitializer`, reload, namespace, `clear()`).
- `i18n/src/{en,vi,ja,ko,zh}.ts` - sửa: khoá mới.
- `assets/scss/themes/_component-tokens.scss` - sửa: token màu `sidebar-v4-*`, `emit` nhận override.
- `assets/scss/themes/_presets.scss` - sửa: preset `graphite` kèm `components`.
- `assets/scss/themes/default.scss` - sửa: tách và chuyển `components` của preset.
- `assets/STYLE-GUIDE.md`, `assets/THEME.md` - sửa: chín preset, cơ chế `components`, ghi chú link/text-button.
- `scripts/core-theme.test.mjs`, `scripts/theme-contrast.test.mjs` (root) - sửa: phủ `graphite` và override.
- `showcase/src/app/pages/modules/layout/layout-demo.component.{ts,spec.ts}` (root) - sửa: demo V4, V4 + `graphite` (scope riêng), context trên V1–V4.
- `showcase/src/app/docs/core/documentation.registry.ts` + spec, manifest sinh lại bằng generator, `scripts/generate-showcase-route-shells.test.mjs` nếu số đếm đổi (root) - sửa: `demoSectionCount` và các con số đếm.
- `showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts` (root) - sửa: ghi chú "8 preset" thành 9.
- `CHANGELOG.md` (root) - sửa: mục `## [Unreleased]`.
- `versions/v20|v21|v22/**` - chỉ do `npm run sync` sinh ra.

## Acceptance criteria

Mọi tiêu chí đều tự động; không có tiêu chí manual.

- AC-001 - Render `sd-sidebar-v4` với menu lồng nhau, route đang ở một child → icon chỉ ở root; dòng active có `aria-current="page"` và class active; child active có marker; group đang đóng mà chứa route active có chấm. (R-001)
- AC-002 - Click item root, child và URL ngoài, sau đó đổi route:
  - item nội bộ gọi `router.navigate` với `queryParams` và `switchTab` như V3, và ghi recent;
  - item http(s) mở qua `sdOpenExternal`;
  - sau khi điều hướng, chỉ nhánh chứa route active được mở; nhánh người dùng đã đóng vẫn đóng cho tới khi route đổi.

  (R-001)
- AC-003 - Thu gọn V4, tạo lại component, liệt kê các key storage đã ghi → trạng thái ghi vào và khôi phục từ `versionState(3)`; không có gì đã lưu thì dùng `defaultCollapsed`; tập key storage giống V3. (R-001, R-005)
- AC-004 - Nhấn `Ctrl+K`/`⌘K`, gõ query không dấu, dùng `↑ ↓`, `Enter`, `Esc`:
  - search được focus; nếu V4 đang thu gọn thì mở rộng trước;
  - title có dấu vẫn khớp; item `comingSoon` không có trong kết quả;
  - kết quả đầu được chọn sẵn, `↑ ↓` đổi lựa chọn, `Enter` điều hướng, `Esc` xoá query;
  - nhãn số kết quả và trạng thái rỗng hiển thị đúng.

  (R-001, R-003)
- AC-005 - Thu gọn V4, click group:
  - `collapsedGroup` là `'flyout'` (mặc định): mở panel danh sách con; panel đóng khi điều hướng, click ra ngoài hoặc nhấn Esc, và focus về nút group;
  - `'expand'`: drawer mở rộng và mở group đó;
  - separator và badge thu nhỏ hiển thị trên rail.

  (R-001)
- AC-006 - Item có `badge` (neutral/warning/error), `status` (có và không có `live`) và `comingSoon`:
  - badge neutral là chữ số; warning/error là pill có accessible label;
  - status có chấm và nhãn; `live` thì có thêm ring;
  - `comingSoon` có chip Soon và `aria-disabled="true"`, click không điều hướng;
  - item có nhiều field chỉ hiện một phần tử, ưu tiên `comingSoon`, `badge`, `status`.

  (R-001, R-003)
- AC-007 - Render V4 với item có section, item không section, pinned và recent → mỗi section có một heading, theo thứ tự xuất hiện đầu tiên; item không section không có heading; Pinned và Recent hiện khi có dữ liệu; Recent theo config `recent` kế thừa từ V3. (R-001, R-003)
- AC-008 - Render V4 với `itemShape: 'soft'`, `density: 'comfortable'`, và với coarse pointer → host resolve radius 8px; chiều cao 40px/34px; dòng tối thiểu 44px khi coarse. Mặc định là pill, 36px và 32px. (R-001, R-005)
- AC-009 - Mở drawer mobile V4 từ app bar, search, rồi đóng bằng backdrop, Esc và chọn menu → drawer có focus trap và dòng 44px; mọi cách đóng đều ẩn drawer, xoá query và trả focus về trigger. (R-002)
- AC-010 - Mobile V4 với `mobile.bottomBar` gồm 5 id, trong đó có 1 id không tồn tại; và không có `mobile.bottomBar` → bottom bar có tối đa 4 đích hợp lệ cộng "More"; "More" mở drawer; đích active được đánh dấu. Không có config thì không có bottom bar. (R-002)
- AC-011 - Chạy spec hiện có của V1, V2, V3 và mobile V1–V3 với menu có field mới, không có `context` → mọi spec pass mà không phải sửa; V3 không render markup badge/status/section. (R-003, R-008)
- AC-012 - Đưa sidebar version 4 vào `sd-layout`, đi qua breakpoint mobile; normalize config V4:
  - desktop render `sd-sidebar-v4`, mobile render `sd-sidebar-mobile-v4`, chuyển trực tiếp không cần reload;
  - normalize ra `itemShape: 'pill'`, `density: 'compact'`, `collapsedGroup: 'flyout'`, `bottomBar` tối đa 4 id không trùng, không rỗng.

  (R-004)
- AC-013 - Compile theme mặc định ở light và dark, quét SCSS của V4 → mọi token màu `--sd-sidebar-v4-*` có ở cả hai mode; SCSS của V4 không có hex và không có `304px`; drawer V3 vẫn đo được 304px. (R-005)
- AC-014 - Mở switcher với 1, 7 và 8 mục; với `searchable` true/false; có và không có ảnh avatar:
  - search hiện khi hơn 7 mục, trừ khi `searchable` ép khác; lọc không phân biệt dấu;
  - nhãn có số lượng; row active có check; avatar là ảnh hoặc chữ cái đầu;
  - 1 mục: chỉ có tên, không chevron, không mở được;
  - không có `context`: không render gì.

  (R-006)
- AC-015 - Chọn một context khác, rồi mở lại và chọn context đang active → row được chọn có `aria-busy` và spinner, các row khác disabled, `setCurrentContext` được gọi đúng một lần; chọn context đang active chỉ đóng popover, không reload. (R-006, R-007)
- AC-016 - Gọi `getCurrentContext`/`setCurrentContext` lần lượt khi có snapshot, khi chưa có, khi có namespace, sau `clear()`, và với id lạ:
  - `getCurrentContext` trả snapshot hoặc `null`;
  - `setCurrentContext` ghi snapshot qua `SdLayoutStorageService` đúng namespace và reload một lần;
  - `clear()` xoá snapshot;
  - id lạ không đổi gì và không reload.

  (R-007)
- AC-017 - Đưa `items` vào khi id đã lưu hợp lệ, chưa có, đã cũ, khi `items` rỗng, và khi ghi storage lỗi:
  - id hợp lệ: cập nhật snapshot, không reload;
  - chưa có hoặc đã cũ: lưu `items[0]` và reload đúng một lần; lần load sau không reload nữa;
  - `items` rỗng: switcher ẩn, không lưu;
  - ghi lỗi: không bao giờ reload.

  (R-007, R-008)
- AC-018 - Cấu hình `context` cho V1, V2, V3, V4 và mobile V1–V4, kể cả khi V1, V3, V4 đang thu gọn → mỗi sidebar render switcher đúng vị trí; rail thu gọn hiện avatar và popover mở sang phải; drawer mobile mở bottom sheet. (R-006, R-008)
- AC-019 - Phát sự kiện `storage` cho key context với id khác, rồi một sự kiện cho key khác → sự kiện của key context hiện thông báo kèm nút Tải lại, chỉ reload khi được click; sự kiện của key khác không hiện gì. (R-009)
- AC-020 - Compile `sd.theme($preset: 'graphite')` và chạy kiểm tra contrast; compile với `$mode` `dark` và `auto` → chín key palette đúng giá trị README; `primary-contrast` là `#ffffff`; các họ màu semantic giống default; mọi cặp contrast pass; `dark`/`auto` fail với "only has a light palette". (R-010)
- AC-021 - Compile `graphite`, một preset khác, và một preset có key `components` lạ → `graphite` emit `--sd-sidebar-v4-active-bg: var(--sd-surface)` và shadow của README; preset khác emit giá trị mặc định; tập key `--sd-*` giống nhau giữa các preset; key lạ fail với `@error`. (R-011)
- AC-022 - Tìm trong docs theme, docs layout và `CHANGELOG.md`:
  - `STYLE-GUIDE.md` và `THEME.md` liệt kê chín preset, có giá trị `graphite` và ghi chú link/text-button;
  - `sd-layout.md` mô tả `SidebarConfigurationV4`, field menu mới và API context kèm ví dụ bootstrap;
  - `CHANGELOG.md` có mục Unreleased.

  (R-012, R-013)
- AC-023 - Chạy test Showcase, `check:i18n`/`check:i18n-parity`, `npm run sync`, `npm run check:sync`, `npm run test:scripts` → trang Layout có demo V4 và demo context, số đếm registry và manifest khớp; parity i18n pass ở 5 catalog; các mirror khớp v19; test script ở root pass. (R-013)

## Risks & mitigations

- **Risk:** reload lặp vô hạn khi đối chiếu context (storage không ghi được, hoặc `items` đổi giữa các lần load). → **Mitigation:** chỉ reload sau khi đọc lại thấy đã ghi đúng `items[0]`; `items` rỗng thì không reload; AC-017 phủ ghi lỗi và lần load thứ hai.
- **Risk:** namespace storage do consumer cấp lại phụ thuộc chính context, tạo vòng lặp. → **Mitigation:** ghi cảnh báo trong `sd-layout.md`; snapshot chỉ đọc lúc khởi tạo service.
- **Risk:** `Ctrl+K`/`⌘K` đụng phím tắt của app hoặc trình duyệt. → **Mitigation:** chỉ nghe khi V4 đang mount và không ở mobile; bỏ qua event đã `defaultPrevented`; chỉ `preventDefault` khi V4 xử lý; ghi trong docs.
- **Risk:** font Symbols v29 thiếu glyph điều khiển → icon trắng. → **Mitigation:** kiểm từng glyph khi lập plan (A-002); có glyph thay thế theo D-012.
- **Risk:** với `graphite`, link và text-button lẫn vào chữ thường. → **Mitigation:** ghi giới hạn trong docs (D-016); xử lý ở vòng token link riêng.
- **Risk:** thêm demo Showcase làm lệch số đếm registry/manifest. → **Mitigation:** cập nhật số trong cùng thay đổi và chạy test Showcase cùng `test:scripts`.
- **Risk:** `npm run sync` trên checkout CRLF đánh dấu hàng loạt file v22 là modified. → **Mitigation:** theo quy trình đã biết: checkout các file chỉ đổi EOL, giữ LF cho file thật sự đổi, rồi `check:sync`.
- **Risk:** spec lớn, khó review một lần. → **Mitigation:** plan chia phase theo ba việc (V4, Context, graphite); mỗi phase có test và điểm kiểm riêng.

## Out of scope (deferred)

- Port Sidebar V4, Context Switcher và `graphite` sang Legacy `@sd-angular/core` - làm khi người dùng yêu cầu.
- Token link riêng và sửa các component ở mục "Báo cáo mục 9" - làm khi có quyết định về token link của theme.
- Font Material Symbols dạng variable (có trục FILL) - làm khi cập nhật asset font.
- API cho consumer ghi đè component token qua `$theme` - làm khi có nhu cầu thật.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)

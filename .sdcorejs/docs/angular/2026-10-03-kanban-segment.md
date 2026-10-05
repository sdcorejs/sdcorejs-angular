---
artifact_id: execution:kanban-segment:2026-10-03
artifact_kind: execution-doc
change_ref: kanban-segment
source_spec: none
source_plan: none
commit_policy: with-change
owner: implementation-owner
---

# Kanban and segmented control implementation

The controlling scope is the delegated implementation request and recovered prior assistant recap supplied by the parent thread on 2026-10-03. No original screenshot or previously approved API/spec artifact was recovered. The choices below are current implementation decisions, not claims of earlier approval.

Base: `b016e478a874923ae1a1b536b41020b7c17883ec` (`origin/main`, release 3.0 documentation). Worktree: isolated `feat/kanban-segment`; existing main and worktrees preserved.

Canonical skill source: `C:/Users/Admin/Documents/sdcorejs/sdcorejs-agent/codex/skills`, repository head `04d7997f6c7faa36724146950fd0599ae7fd4b87`. These generated mirrors carry no per-skill semantic version; head and file hashes identify the exact versions. Explore/design/plan/test/review/ship guidance was read. The portal-focused Angular executor was inspected and is not a library-component generator; this library work follows the repository's actual standalone component patterns. Current task authorization supplies implementation authority without inventing approved snapshot metadata.

Decisions: `SdSegmentedComponent` (display name "Segmented control"), selector `sd-segmented`, secondary entrypoint `forms/segmented`. The control was first built as `SdSegment` / `sd-segment` / `forms/segment` and renamed before release with user approval on 2026-10-04, with no compatibility alias because the old name was never published. It offers single choice by default, optional multiple, form connector, primitive stable values, semantic colors and prefix/suffix icons. Consumer owns content. `SdKanban<T>`, selector `sd-kanban`, secondary entrypoint `components/kanban`; generic mappings, immutable data, full-column move indexes, typed templates, one serial move pipeline, pessimistic asynchronous confirmation and stale-result protection.

Architecture: each reusable component owns its cohesive presentation/keyboard state. Pure kanban proposal helpers own ordering and identity validation; consumer callbacks own data access and persistence. Typed template directives expose presentation context. Showcase route containers own fixture data and simulated persistence; no application facade/store or domain module is introduced. Existing `SdIcon`, `SdDataState`, i18n, form connector and CDK drag/drop/menu are reused. Shared code starts in v19, then the repository sync generates v20/v21/v22.

Scope excludes dependencies/manifests/lockfile changes, existing asset cleanup, release archives/pages, pushes, PRs, commits, publishing and deployment. The implementation includes component docs, public barrels/module registration, showcase registry/generated examples, unit/contract and browser evidence.

Validation outcomes are recorded in the review deliverable after commands run; this document does not claim success from a plan or authored tests. The missing original screenshot prevents pixel-match validation. Independent parent review remains required before accepting the implementation.

Independent review on 2026-10-04 identified three P2 repairs selected by the parent: R1 unchanged filtered drag slots must preserve complete ordering and skip persistence/events; R2 leaving the segmented control clears transient focus so external selection determines the next Tab entry; R3 Kanban restores focus only within its initiating instance and while that interaction still owns focus, tracking explicit transfers through pending settlement and post-render. Canonical repair-loop/debug guidance was read at the same agent head. Deterministic regressions preserve prior assertions. Documentation clarifies immutable segmented-control options and its existing mode-independent event union; no public API migration is introduced. New command receipts and a refreshed candidate freeze belong to the local repair handoff, while original review evidence remains unchanged.

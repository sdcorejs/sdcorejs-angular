# Review trước version bump — 2026-07-03 16:33

## What was requested
User yêu cầu dùng `sdcorejs-review` để review branch hiện tại trước khi bump version mới cho `sdcorejs-angular`.

## What was changed
- REVIEW current dirty diff trên branch `release/0.11` cho Angular/Core UI.
- PROBE icon configuration, `sd-icon`, `sd-button`, `sd-badge`, table/input/select usage, published README font guidance, untracked files, and theme token drift.
- EDIT `.sdcorejs/tasks/current-session.md` — cập nhật checkpoint review session.
- EDIT `.sdcorejs/tasks/angular.md` — thêm các TODO cần xử lý trước bump.

## Decisions made
- Treat as code review, not source edit: no production source file was changed during review.
- Findings focus on bump risk: public API drift, runtime icon configuration not taking effect, untracked showcase artifacts, and published docs mismatch.
- Secondary color `#212121` in `.angular/cache` was treated as stale cache, not source defect; source default theme now uses `secondary: #757575` and `black400: #757575`.

## Findings summary
- Blocker: global icon configuration can still be bypassed by hard-coded `fontSet="material-icons-outlined"` and Material fallback values in core controls.
- Blocker: v20/v21 still expose/document `defaultSet`, `materialFontSet`, and `iconSet` while v19 moved to `defaultFontSet` / `fontSet`.
- Blocker: v19 showcase route imports an untracked `icon-configuration-demo.component.ts`.
- Required: published README files still instruct consumers to load Google Fonts after showcase/Core local font changes.
- Required: untracked `versions/v19/showcase-4220.log` remains in the workspace.

## Verification
- PASS `git diff --check` exit 0; output only had LF/CRLF warnings.
- PASS source search: no `secondary: #212121` / `secondary-light: #E9E9E9` remains in v19/v20/v21 default themes.
- PASS source search: direct `<mat-icon>` outside `modules/icon/src/icon.component.ts` was not found in non-spec core files.
- PASS UTF-8 read of README snippets; Vietnamese text itself is not mojibake.
- Existing checkpoint records recent PASS builds for `sdcorejs-angular` production and `showcase` development across v19/v20/v21 before this read-only review.

## Open questions / follow-ups
- Decide whether the new `fontSet/defaultFontSet` public API must be applied to all v19/v20/v21 packages before this bump, or whether only one major version is in scope.
- Remove or explicitly justify hard-coded Material `fontSet` for controls that should respond to app-level `provideSdIcon({ defaultFontSet })`.
- Track the new icon-configuration showcase file and remove/ignore generated showcase logs.

## Product traceability
- Not updated; this was a technical pre-bump review, not a new user-facing feature ledger.

## Next suggested action
- Fix review blockers before bump: icon config inheritance, v20/v21 API drift, and untracked showcase route target.
- Update published README font setup to match local Core font behavior.
- Re-run package/showcase builds after fixes and re-check `git status --short --untracked-files=all`.

## Skill provenance
Skills invoked this session: `sdcorejs-review` with Angular code review references.

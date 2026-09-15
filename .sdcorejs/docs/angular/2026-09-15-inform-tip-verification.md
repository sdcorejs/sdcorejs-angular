---
artifact_id: 2026-09-15-inform-tip-verification
artifact_kind: execution-doc
change_ref: inform-2.13
source_spec: none
source_plan: .sdcorejs/plans/angular/2026-09-15-inform-tip.md
commit_policy: with-change
owner: angular-integration
---

# SdInform type="tip" verification

## Delivered behavior

- New exported `SdInformType = 'default' | 'tip'`; existing consumers keep the default banner without migration.
- Tip uses `role="note"`, including warning/error colors; no new live-region behavior.
- Scoped tip styles: 8px/12px padding, 3px inline-start border, 4px radius, 13px/20px text and 16px icon aligned to the first text line.
- Reuses existing colors, icons/provider overrides, inputs, actions, closing and content-priority contract. Projected bold/code/links and Angular bindings remain inline; no innerHTML.
- Five new showcase groups, including real `SdInput` and `SdTable`, with registry count 12 and regenerated copyable sources.
- API documentation updated in canonical v19; rolled out with `npm run sync` to v20/v21/v22.

## Evidence

Node 22.22.3, npm, Windows, Chrome Headless 153.

| Check | Result |
| --- | --- |
| Tip RED suite | 3 failed / 2 passed on the previous implementation; initial link-navigation test harness issue corrected with preventDefault before the confirmed RED run |
| Focused inform suite | 64 passed, covering existing behavior, note semantics for six colors, rich text/bindings/events, token updates, layout, action/close and runtime type switching |
| Full v19 unit suite | 5,463 passed |
| Library build | Passed |
| Showcase build | Passed; existing CommonJS optimization warnings |
| Script suite | Passed, including example extraction/registry consistency |
| Sync guard | Passed for v20/v21/v22 |
| Scoped ESLint and diff/text hygiene | Passed |
| Browser desktop | Confirmed 8px/12px padding, 13px font, 16px icons and role note; counter/link actions and input binding work |
| Browser 390px viewport | All 11 live tip banners fit without horizontal overflow; every icon starts 2px below the content top, matching the first 20px text line |
| Dark token override | Surface, text, border, link and inline-code colors all follow custom Core tokens; screenshot inspected |

## Environment notes

- Run showcase build and `npm start` sequentially: both lifecycle scripts copy the library and clear Vite prebundles. An initial concurrent build/start caused missing-module errors; the sequential rebuild passed.
- Local archive endpoints (`docs/versions.json`, published API archives) are not mounted by this dev server. Existing archive-load messages remain separate from live example verification.
- No dependency changes, commit, push, version bump or release. Derived versions were synchronized, not separately built/tested.
- Local showcase remains running at `http://127.0.0.1:4200/v/19.2.12/components/inform/examples#components-inform-example-tip-mot-dong`.

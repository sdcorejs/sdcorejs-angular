# Living TODO - angular - sdcorejs-angular

> Maintained by `sdcorejs-auto-task-tracker`. Edit by hand when needed.
> Format: `[ ]` open / `[x] (YYYY-MM-DD)` completed / `[!]` blocked.

## Now

- [ ] Open and review a PR from the pushed `chore/prepare-1.4` branch.
- [ ] After merge approval, separately authorize tag, published-doc generation and npm publication.
- [ ] Verify the first real tag workflow creates `published-docs` for `19/20/21` and pushes the docs commit to `main`.

## Next

- [ ] Khi được yêu cầu delivery, push `feat/layout-navigation-polish` và mở PR vào `main`.
- [ ] Audit/fix editable `SdInput` đang kế thừa `aria-hidden="true"` trong một task Forms độc lập.
- [ ] Giảm coupling của search-icon spec với Material renderer và tăng integration assertion cho filter/Escape.
- [ ] Add a dedicated Showcase fixture for `SdTable` empty-result reload and capture `images/sd-table-empty-result-reload.png`.
- [ ] Merge the Showcase Loading manifest hotfix PR and confirm `deploy-pages.yml` completes without the runtime exception.
- [ ] Normalize `GenericSelectComponent` output types, then migrate its three `EventEmitter` outputs with Angular safe migration.
- [ ] Revisit the skipped setter/aliased inputs in focused groups with contract tests before attempting manual signal migration.
- [ ] Align the existing Angular 20 package minors so deep `npm ls` no longer reports peer-minor mismatches.
- [ ] Update v19/v20/v21 published README font setup so it no longer instructs consumers to load Google Fonts when Core local fonts are expected.
- [ ] Decide whether to remove, keep, or regenerate the existing `published-docs/19.0.4` archive that was created after npm publish.
- [ ] After Pages deploy, check `/docs/versions.json` includes all three versions for the new release.

## Later

- [ ] If branch protection blocks the docs commit, update repository rules to allow GitHub Actions bot pushes for `published-docs/**`.

## Blocked

- [!] Run the deferred not-found UI and console/network smoke for the removed legacy documentation route - requires the matching deployed artifact.
- [!] Run the dedicated visual/click smoke for `/forms/datetime` - outside the completed release smoke matrix.

## Done

- [x] (2026-07-27) Sửa mobile V2/V3 host containment, thêm regression coverage và xác nhận browser UAT ở 390px không còn top clipping.
- [x] (2026-07-27) Sửa release lint/generated-doc gate, catalog phiên bản 1.2+ và hoàn thiện migration/docs cho release suffix 1.5.
- [x] (2026-07-26) Hoàn thiện shared Layout account menu V1/V2/V3 với role, semantic actions, reactive notification badge, i18n/a11y, Showcase, docs và product traceability.
- [x] (2026-07-25) Căn profile/đăng xuất V2 mobile cùng hàng và giữ avatar account V1 desktop nhìn thấy, mở menu được trong Showcase.
- [x] (2026-07-25) Tinh chỉnh pin desktop/mobile, V3 inline sign-out, sticky search và logo fallback V1; xác nhận Layout 94/94 và build Angular 19/20/21.
- [x] (2026-07-25) Hoàn thiện Layout V1/V2/V3: collapse rail, logo fallback, mobile direct sign-out, hover/focus và ba Showcase độc lập trên Angular 19/20/21.
- [x] (2026-07-23) Audit Changelog and 113 Markdown files, enforce canonical npm README sync, refresh release docs, and pass the fresh commit/push delivery gate.
- [x] (2026-07-23) Complete Task 15 full quality gate: repair full Karma/coverage/i18n/sync issues, browser smoke, review/repair, production builds and package dry-runs.
- [x] (2026-07-23) Repair Showcase Changelog duplicate-section rendering and Layout demo viewport injection; full Showcase 191/191 passes.
- [x] (2026-07-23) Complete Task 14 release `1.4`, manifests `19.1.4`/`20.1.4`/`21.1.4`, generated changelog and v19 → v20/v21 rollout.
- [x] (2026-07-23) Complete Task 13 public-surface smoke, Persistence Showcase, API/service docs, README/npm README and migration guide.
- [x] (2026-07-23) Complete Task 12 `SdAuditDiff`, pure nested/stable-array engine, Showcase/docs and review/repair.
- [x] (2026-07-23) Complete Task 11 `SdTaskService`, `SdJobProgress`, Showcase/docs and review/repair.
- [x] (2026-07-23) Complete Task 10 `SdUnsavedChangesService`, FormGroup/route/close adapters and Modal/Drawer/Tab hooks.
- [x] (2026-07-23) Complete Task 9 `SdEntityPicker`, `SdTreeSelect`, Tree keyboard/error/cascade behavior and Showcase/docs.
- [x] (2026-07-23) Complete Task 8 `SdBreadcrumb`, `SdDataState`, Showcase/docs and review/repair.
- [x] (2026-07-23) Complete Task 7 `SdViewportService`, responsive layout compatibility and Showcase/docs.
- [x] (2026-07-23) Complete Task 6 `SdTime`, `SdTimeRange`, input masks, Showcase and user/technical docs.
- [x] (2026-07-15) Create the evergreen `SdDatetime` user guide and screenshot-capture script after integrating package `1.0.3`.
- [x] (2026-07-13) Refactor the Showcase documentation site across v19/v20/v21 with versioned navigation, catalog/search, accessibility and regression coverage.

## Stale

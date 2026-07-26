---
feature: layout-account-menu
status: verified
tracks: [angular, test, product]
sourceSpecPath: .sdcorejs/specs/angular/2026-07-25-16-14-enhance-layout-account-menu.md
sourcePlanPath: .sdcorejs/plans/angular/2026-07-26-04-57-enhance-layout-account-menu.md
prdPath: product/prds/layout-account-menu.md
userStoriesPath: product/user-stories/layout-account-menu.md
acceptanceCriteriaPath: product/acceptance-criteria/layout-account-menu.md
uatChecklistPath: product/uat-checklists/layout-account-menu.md
updatedAt: 2026-07-26T22:04:33+07:00
---

# Product Feature Ledger - Layout account menu

## Business Goal

Người dùng và consumer developer có một account-menu contract/presentation nhất
quán trên V1/V2/V3, không raw i18n key và không cần duplicate identity/action UI.

## Users And Scenarios

- Người dùng portal xem identity/role và mở account actions.
- Consumer developer nối callback và reactive notification source.
- PO/QC kiểm tra riêng từng version ở desktop/mobile.

## Requirement Contract

| ID             | Requirement / Acceptance Criterion                 | Priority | Source        | Status |
| -------------- | -------------------------------------------------- | -------- | ------------- | ------ |
| AC-001..AC-005 | Identity, role, translated/error signout đồng nhất | Must     | approved spec | agreed |
| AC-006..AC-008 | Ba semantic account actions optional               | Must     | approved spec | agreed |
| AC-009..AC-011 | Reactive notification normalization và cleanup     | Must     | approved spec | agreed |
| AC-012..AC-013 | Mobile geometry và desktop keyboard behavior       | Must     | approved spec | agreed |
| AC-014         | Backward compatibility                             | Must     | approved spec | agreed |
| AC-015         | Independent responsive Showcase/UAT                | Must     | approved spec | agreed |

## Implementation Map

| AC             | Backend | Frontend                                       | Other                         | Status |
| -------------- | ------- | ---------------------------------------------- | ----------------------------- | ------ |
| AC-001..AC-005 | n/a     | shared user menu + V1 wrappers                 | 5 locale messages             | done   |
| AC-006..AC-008 | n/a     | typed config + shared action rendering         | consumer callbacks            | done   |
| AC-009..AC-011 | n/a     | Signal/computed/effect + Observable cleanup    | RxJS source owned by consumer | done   |
| AC-012         | n/a     | shared mobile presentation + V1/V2/V3 hosts    | 390px fixture                 | done   |
| AC-013         | n/a     | menu roles, keydown handler, focus restoration | n/a                           | done   |
| AC-014         | n/a     | optional additions; legacy outputs preserved   | sync v19/v20/v21              | done   |
| AC-015         | n/a     | three independent Showcase sections            | browser UAT                   | done   |

## Test Map

| AC             | Unit                              | Integration     | E2E / UAT                 | Evidence                         | Status |
| -------------- | --------------------------------- | --------------- | ------------------------- | -------------------------------- | ------ |
| AC-001..AC-003 | V1 desktop/mobile user specs      | Layout suite    | desktop/mobile UAT        | v19 105/105                      | done   |
| AC-004..AC-008 | shared user-menu spec             | Showcase spec   | V1/V2/V3 UAT              | focused GREEN                    | done   |
| AC-009..AC-011 | config/shared reactive specs      | Layout suite    | badge visual check        | number/Signal/Observable covered | done   |
| AC-012         | mobile V1/V2/V3 specs             | Showcase spec   | 390px UAT                 | no overflow                      | done   |
| AC-013         | shared keyboard specs             | Layout suite    | manual Escape/focus check | GREEN                            | done   |
| AC-014         | config/shared/V1 regression specs | v20/v21 focused | n/a                       | 40/40 per mirror                 | done   |
| AC-015         | Showcase spec                     | Showcase build  | browser UAT               | six variants checked             | done   |

## UAT Checklist

| Scenario         | Steps                    | Expected Result                                    | Owner   | Status |
| ---------------- | ------------------------ | -------------------------------------------------- | ------- | ------ |
| Desktop V1/V2/V3 | Open avatar menu         | Role/actions/badge and action order are correct    | PO / QC | pass   |
| Mobile V1/V2/V3  | Open mobile drawer/sheet | Identity + signout inline, actions below           | PO / QC | pass   |
| V1 rail          | Collapse and expand      | Geometry and avatar interaction remain stable      | QC      | pass   |
| Search/i18n      | Inspect visible labels   | Search placeholder and account labels are readable | QC      | pass   |

## Gap Review

- Requirement gaps: none.
- Implementation gaps: none in approved scope.
- Test gaps: no automated screenshot capture because the `:4200` dev route has
  an unrelated entity-picker baseline overlay; built Showcase browser UAT passed.
- Ambiguities: none.

## Decisions

- Consumer owns navigation/drawers and notification data acquisition.
- No generic action array in this contract.
- v19 remains source; v20/v21 are synchronized mirrors.

## Open Questions

- None.

## Related Docs

- PRD: `product/prds/layout-account-menu.md`
- User stories: `product/user-stories/layout-account-menu.md`
- Acceptance criteria: `product/acceptance-criteria/layout-account-menu.md`
- UAT checklist: `product/uat-checklists/layout-account-menu.md`
- Decisions: `product/decisions/layout-account-menu.md`
- Spec: `.sdcorejs/specs/angular/2026-07-25-16-14-enhance-layout-account-menu.md`
- Plan: `.sdcorejs/plans/angular/2026-07-26-04-57-enhance-layout-account-menu.md`
- Module guide: `.sdcorejs/documentation/user-guides/viewport-responsive-layout.md`
- Technical doc: `.sdcorejs/documentation/technical-docs/viewport-responsive-layout.md`

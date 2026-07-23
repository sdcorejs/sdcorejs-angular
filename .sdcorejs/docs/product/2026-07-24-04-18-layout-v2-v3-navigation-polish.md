---
feature: layout-v2-v3-navigation-polish
status: verified
tracks: [angular, test, product]
sourceSpecPath: docs/superpowers/specs/2026-07-23-layout-v2-v3-navigation-polish-design.md
sourcePlanPath: docs/superpowers/plans/2026-07-23-layout-v2-v3-navigation-polish.md
prdPath: product/prds/layout-v2-v3-navigation-polish.md
userStoriesPath: product/user-stories/layout-v2-v3-navigation-polish.md
acceptanceCriteriaPath: product/acceptance-criteria/layout-v2-v3-navigation-polish.md
uatChecklistPath: product/uat-checklists/layout-v2-v3-navigation-polish.md
updatedAt: 2026-07-24T04:18:17+07:00
---

# Product Feature Ledger - Layout V2/V3 Navigation Polish

## Business Goal

Làm thanh điều hướng V2/V3 cân đối và nhất quán hơn, đồng thời giữ nguyên hợp
đồng tích hợp hiện tại cho các ứng dụng đang dùng thư viện.

## Users And Scenarios

- Người dùng desktop xem và thao tác account menu ở trạng thái compact/expanded.
- Người dùng desktop/mobile tìm menu bằng từ khóa và bàn phím.
- Đội tích hợp nhận polish qua bản phát hành mà không phải migrate public API.

## Requirement Contract

| ID | Requirement / Acceptance Criterion | Priority | Source | Status |
|---|---|---|---|---|
| AC1 | V2 desktop chỉ hiển thị avatar compact căn giữa. | Must | design | agreed |
| AC2 | V3 collapsed không hiển thị brand hoặc fallback `apps`. | Must | design | agreed |
| AC3 | Control mở V3 được căn giữa trong drawer 72px. | Must | design | agreed |
| AC4 | Account trigger V3 collapsed căn giữa, không overflow/chevron. | Must | design | agreed |
| AC5 | V3 expanded/mobile giữ full identity và disclosure. | Must | design | agreed |
| AC6 | Bốn menu search dùng Soft-pill và search icon. | Must | design | agreed |
| AC7 | Placeholder, `autoId`, filtering và signal flow không đổi. | Must | design | agreed |
| AC8 | Các interactive control có focus indicator rõ. | Must | design | agreed |
| AC9 | Layout V1 và public API không đổi. | Must | design | agreed |
| AC10 | Angular 19/20/21 sync và toàn bộ verification pass. | Must | design | agreed |

## Implementation Map

| AC | Backend | Frontend | Other | Status |
|---|---|---|---|---|
| AC1 | n/a | `modules/layout/components/shared/user-menu` + `sidebar-v2` | n/a | done |
| AC2 | n/a | `modules/layout/components/sidebar-v3` | n/a | done |
| AC3 | n/a | `modules/layout/components/sidebar-v3` | n/a | done |
| AC4 | n/a | `shared/user-menu` + `sidebar-v3` | n/a | done |
| AC5 | n/a | `shared/user-menu` + V3 desktop/mobile callers | n/a | done |
| AC6 | n/a | `shared/search-field` + bốn V2/V3 callers | Layout guide | done |
| AC7 | n/a | Bốn parent components giữ model/binding hiện tại | n/a | done |
| AC8 | n/a | User-menu, sidebar-v3 và search-field SCSS | n/a | done |
| AC9 | n/a | Không đổi V1/public barrels | diff guard | done |
| AC10 | n/a | Canonical v19 và generated v20/v21 | sync/changelog | done |

## Test Map

| AC | Unit | Integration | E2E / UAT | Evidence | Status |
|---|---|---|---|---|---|
| AC1 | user-menu/V2 specs | Layout suite | V2 desktop browser | avatar centered, no chevron | done |
| AC2 | V3 spec | Layout suite | V3 collapsed browser | no brand/apps | done |
| AC3 | V3 spec | computed style | V3 collapsed browser | centered in 72px | done |
| AC4 | user-menu/V3 specs | Layout suite | V3 collapsed browser | no overflow/chevron | done |
| AC5 | user-menu/V3 specs | Layout suite | expanded/mobile browser | full identity retained | done |
| AC6 | search-field specs | four caller specs | desktop/mobile browser | Soft-pill + icon | done |
| AC7 | caller specs | parent binding tests | filter/Escape browser flows | results and signals unchanged | done |
| AC8 | focused specs | SCSS selectors | focus browser checks | visible primary rings | done |
| AC9 | n/a | diff/public barrel guards | n/a | zero V1/public API changes | done |
| AC10 | Layout `84/84` x3 | sync/lint/build | browser console | all release gates pass | done |

## UAT Checklist

| Scenario | Steps | Expected Result | Owner | Status |
|---|---|---|---|---|
| V2 desktop | Quan sát compact account và mở menu | Avatar cân giữa; popup hoạt động | PO / QC | pass |
| V3 desktop | Thu gọn/mở rộng drawer | Brand/control/account đúng từng trạng thái | PO / QC | pass |
| Search desktop/mobile | Focus, lọc và Escape | Soft-pill/focus/filter/cleanup đúng | PO / QC | pass |
| Release regression | Test/lint/build/sync ba version | Không có regression | Dev / QC | pass |

## Gap Review

- Requirement gaps: không có.
- Implementation gaps: không có trong phạm vi đã duyệt.
- Test gaps: optional - integration specs có thể kiểm tra sâu hơn filter/Escape;
  browser UAT hiện đã phủ các flow này.
- Ambiguities: `aria-hidden` trên editable `SdInput` là finding toàn cục có từ
  trước, được tách thành follow-up ngoài phạm vi Layout.

## Decisions

- Search presentation là component nội bộ, không public export.
- Compact state giữ toàn bộ click target và thêm accessible name theo display
  name.
- Chỉ sửa canonical v19 rồi sync sang v20/v21.

## Open Questions

- Không có blocker cho Layout polish.

## Related Docs

- PRD: `product/prds/layout-v2-v3-navigation-polish.md`
- User stories: `product/user-stories/layout-v2-v3-navigation-polish.md`
- Acceptance criteria: `product/acceptance-criteria/layout-v2-v3-navigation-polish.md`
- UAT checklist: `product/uat-checklists/layout-v2-v3-navigation-polish.md`
- Decisions: `product/decisions/layout-v2-v3-navigation-polish.md`
- Spec: `docs/superpowers/specs/2026-07-23-layout-v2-v3-navigation-polish-design.md`
- Plan: `docs/superpowers/plans/2026-07-23-layout-v2-v3-navigation-polish.md`
- Session docs: `.sdcorejs/docs/angular/2026-07-24-04-18-layout-v2-v3-navigation-polish.md`

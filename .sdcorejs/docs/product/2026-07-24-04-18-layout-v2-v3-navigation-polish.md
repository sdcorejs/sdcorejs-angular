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
updatedAt: 2026-07-25T12:49:00+07:00
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

| ID   | Requirement / Acceptance Criterion                                   | Priority | Source        | Status |
| ---- | -------------------------------------------------------------------- | -------- | ------------- | ------ |
| AC1  | V2 desktop chỉ hiển thị avatar compact căn giữa.                     | Must     | design        | agreed |
| AC2  | V3 collapsed không hiển thị brand hoặc fallback `apps`.              | Must     | design        | agreed |
| AC3  | Control mở V3 được căn giữa trong drawer 72px.                       | Must     | design        | agreed |
| AC4  | Account trigger V3 collapsed căn giữa, không overflow/chevron.       | Must     | design        | agreed |
| AC5  | V3 expanded/mobile giữ full identity và disclosure.                  | Must     | design        | agreed |
| AC6  | Bốn menu search dùng Soft-pill và search icon.                       | Must     | design        | agreed |
| AC7  | Placeholder, `autoId`, filtering và signal flow không đổi.           | Must     | design        | agreed |
| AC8  | Các interactive control có focus indicator rõ.                       | Must     | design        | agreed |
| AC9  | Layout V1 và public API không đổi.                                   | Must     | design        | agreed |
| AC10 | Angular 19/20/21 sync và toàn bộ verification pass.                  | Must     | design        | agreed |
| AC11 | Mobile V2/V3 có direct sign-out cùng hàng profile.                   | Must     | user feedback | agreed |
| AC12 | Pin desktop hiện sau hover-delay và vẫn truy cập được bằng bàn phím. | Must     | user feedback | agreed |
| AC13 | Pin mobile luôn hiện với glyph `push_pin`.                           | Must     | user feedback | agreed |
| AC14 | Sticky search V3 có nền kín, không để menu lọt phía dưới.            | Must     | user feedback | agreed |
| AC15 | V1 dùng custom logo hoặc fallback icon `apps` có accessible name.    | Must     | user feedback | agreed |
| AC16 | V1 desktop Showcase giữ avatar account nhìn thấy và mở được menu.    | Must     | user feedback | agreed |

## Implementation Map

| AC   | Backend | Frontend                                                    | Other                       | Status |
| ---- | ------- | ----------------------------------------------------------- | --------------------------- | ------ |
| AC1  | n/a     | `modules/layout/components/shared/user-menu` + `sidebar-v2` | n/a                         | done   |
| AC2  | n/a     | `modules/layout/components/sidebar-v3`                      | n/a                         | done   |
| AC3  | n/a     | `modules/layout/components/sidebar-v3`                      | n/a                         | done   |
| AC4  | n/a     | `shared/user-menu` + `sidebar-v3`                           | n/a                         | done   |
| AC5  | n/a     | `shared/user-menu` + V3 desktop/mobile callers              | n/a                         | done   |
| AC6  | n/a     | `shared/search-field` + bốn V2/V3 callers                   | Layout guide                | done   |
| AC7  | n/a     | Bốn parent components giữ model/binding hiện tại            | n/a                         | done   |
| AC8  | n/a     | User-menu, sidebar-v3 và search-field SCSS                  | n/a                         | done   |
| AC9  | n/a     | Không đổi V1/public barrels                                 | diff guard                  | done   |
| AC10 | n/a     | Canonical v19 và generated v20/v21                          | sync/changelog              | done   |
| AC11 | n/a     | `shared/user-menu` + mobile V2/V3 callers                   | n/a                         | done   |
| AC12 | n/a     | `shared/menu-tree` hover timer + focus styles               | n/a                         | done   |
| AC13 | n/a     | `shared/menu-tree` + mobile caller inputs                   | Material icon compatibility | done   |
| AC14 | n/a     | `sidebar-mobile-v3` sticky search layer                     | n/a                         | done   |
| AC15 | n/a     | `sidebar-v1/components/sidebar`                             | branding fallback           | done   |
| AC16 | n/a     | Showcase Layout fixture + V1 account trigger                | preview containment         | done   |

## Test Map

| AC   | Unit                  | Integration               | E2E / UAT                   | Evidence                                        | Status |
| ---- | --------------------- | ------------------------- | --------------------------- | ----------------------------------------------- | ------ |
| AC1  | user-menu/V2 specs    | Layout suite              | V2 desktop browser          | avatar centered, no chevron                     | done   |
| AC2  | V3 spec               | Layout suite              | V3 collapsed browser        | no brand/apps                                   | done   |
| AC3  | V3 spec               | computed style            | V3 collapsed browser        | centered in 72px                                | done   |
| AC4  | user-menu/V3 specs    | Layout suite              | V3 collapsed browser        | no overflow/chevron                             | done   |
| AC5  | user-menu/V3 specs    | Layout suite              | expanded/mobile browser     | full identity retained                          | done   |
| AC6  | search-field specs    | four caller specs         | desktop/mobile browser      | Soft-pill + icon                                | done   |
| AC7  | caller specs          | parent binding tests      | filter/Escape browser flows | results and signals unchanged                   | done   |
| AC8  | focused specs         | SCSS selectors            | focus browser checks        | visible primary rings                           | done   |
| AC9  | n/a                   | diff/public barrel guards | n/a                         | zero V1/public API changes                      | done   |
| AC10 | Layout `94/94` v19    | sync + v19/v20/v21 build  | browser console             | focused gates pass                              | done   |
| AC11 | user-menu/V2/V3 specs | Layout suite              | mobile browser              | direct/inline sign-out                          | done   |
| AC12 | menu-tree specs       | Layout suite              | timed desktop hover         | hidden at 150ms, visible after 400ms            | done   |
| AC13 | mobile caller specs   | Layout suite              | V2/V3 mobile browser        | opacity 1 + `push_pin`                          | done   |
| AC14 | V3 mobile spec        | Layout suite              | scroll probe                | sticky top stable, hit-test stays inside search | done   |
| AC15 | V1 sidebar spec       | Layout suite              | browser DOM                 | fallback `apps`, no fallback image              | done   |
| AC16 | Showcase Layout spec  | Showcase suite            | V1 desktop browser          | avatar inside preview; account menu opens       | done   |

## UAT Checklist

| Scenario              | Steps                               | Expected Result                                    | Owner    | Status |
| --------------------- | ----------------------------------- | -------------------------------------------------- | -------- | ------ |
| V2 desktop            | Quan sát compact account và mở menu | Avatar cân giữa; popup hoạt động                   | PO / QC  | pass   |
| V3 desktop            | Thu gọn/mở rộng drawer              | Brand/control/account đúng từng trạng thái         | PO / QC  | pass   |
| Search desktop/mobile | Focus, lọc và Escape                | Soft-pill/focus/filter/cleanup đúng                | PO / QC  | pass   |
| Release regression    | Test/lint/build/sync ba version     | Không có regression                                | Dev / QC | pass   |
| Desktop pin           | Hover menu chưa ghim                | Pin hiện sau khoảng 300ms                          | PO / QC  | pass   |
| Mobile account/pin    | Mở V2/V3 mobile menu                | Direct sign-out cùng hàng profile và pin luôn hiện | PO / QC  | pass   |
| V3 sticky search      | Scroll danh sách menu               | Search che kín item phía dưới                      | PO / QC  | pass   |
| V1 logo               | Kiểm tra có/không truyền logo       | Custom image hoặc fallback `apps` đúng contract    | PO / QC  | pass   |
| V1 desktop account    | Mở V1 desktop và nhấn avatar        | Avatar nằm trong preview và account menu mở được   | PO / QC  | pass   |

## Gap Review

- Requirement gaps: không có.
- Implementation gaps: không có trong phạm vi đã duyệt.
- Test gaps: full release lint còn bị chặn bởi formatting của generated
  `changelog.generated.ts` ngoài phạm vi refinement; targeted Layout ESLint,
  test và build đều pass.
- Ambiguities: `aria-hidden` trên editable `SdInput` là finding toàn cục có từ
  trước, được tách thành follow-up ngoài phạm vi Layout.

## Decisions

- Search presentation là component nội bộ, không public export.
- Compact state giữ toàn bộ click target và thêm accessible name theo display
  name.
- Chỉ sửa canonical v19 rồi sync sang v20/v21.
- Pin desktop dùng hover-delay 300ms; mobile luôn hiện.
- V2/V3 mobile dùng account row inline; V1 logo fallback bằng icon `apps`.
- Showcase giới hạn legacy `100vh` của V1 trong preview, không đổi runtime
  ứng dụng.

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

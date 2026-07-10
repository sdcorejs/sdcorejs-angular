---
updated_at: 2026-07-10T08:06:00+07:00
status: complete
track: angular
active_skill: receiving-code-review + sdcorejs-debug + sdcorejs-test
branch: feat/core-ui-confirm-section-controls
---

# Current Session Checkpoint

## User Request
Follow-up visual feedback: the "Thiết lập biểu thức" modal still looked bad; the screenshot matched `sd-feel-expression` rather than only the query-builder `attribute-expression` path.

## Root Cause
- The first hypothesis (`ng-container sdFooterRight` projection) was falsified by a focused `AttributeExpression` spec: the action is projected into the modal footer.
- The actual issue is footer alignment: left/right footer slots use a flex row with `justify-content: space-between`, and empty left slots are hidden. A single right-side flex item stays at the start unless it pushes itself with `margin-left: auto`.
- Review follow-up confirmed the same left/right footer pattern exists in `SdModal`, `SideDrawer`, `Section`, and `ModalResizable`. `ModalResizable` already had the `margin-left: auto` invariant; `SdModal`, `SideDrawer`, and `Section` needed it covered consistently.
- The screenshot's AND/OR/+ UI comes from `sd-feel-expression`, which still had the confirm button inside `<ng-container sdFooterRight>`. That made the DOM contract too weak and could still render the action visually like body content in the running showcase.

## Tasks
- [x] Audit footer/layout pattern for `SdModal`, `SideDrawer`, `Section`, and `ModalResizable`.
- [x] Add RED regression tests for right-only footer alignment.
- [x] Apply the shared footer-right alignment invariant without restoring legacy `sdFooter`.
- [x] Replace expression footer `ng-container` slots with real `sd-button sdFooterRight` hosts.
- [x] Run targeted tests, showcase build, and restart local dev server.

## Artifacts Touched
- ADD `projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts` - guards that the confirm action projects into the modal footer, not the body.
- EDIT `projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.html` - confirm action now uses a real `sdFooterRight` host.
- EDIT `projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss` - empty query-builder wrapper is shorter and scroll-bounded.
- ADD `projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts` - guards that the confirm action projects via a real `sdFooterRight` host.
- EDIT `projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.html` - confirm action now uses a real `sdFooterRight` host.
- EDIT `projects/sdcorejs-angular/components/modal/src/modal.component.scss` - right-only footer actions align to the end.
- EDIT `projects/sdcorejs-angular/components/modal/src/modal.component.spec.ts` - regression guard for right-only footer alignment.
- EDIT `projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.scss` - right-only footer actions align to the end.
- EDIT `projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.spec.ts` - regression guard for right-only footer alignment.
- EDIT `projects/sdcorejs-angular/components/section/src/section.component.scss` - right-only footer actions align to the end.
- EDIT `projects/sdcorejs-angular/components/section/src/section.component.spec.ts` - regression guard for right-only footer alignment.
- ADD `.sdcorejs/tasks/form-generic-showcase-after-expression-footer-fix.png` - static showcase render smoke after the expression modal fix.

## Verification
- RED confirmed: `modal.component.spec.ts`, `side-drawer.component.spec.ts`, and `section.component.spec.ts` failed before their CSS fixes because styles did not contain `margin-left: auto`.
- PASS `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/modal/src/modal.component.spec.ts` (`TOTAL: 41 SUCCESS`)
- PASS `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.spec.ts` (`TOTAL: 39 SUCCESS`)
- PASS `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts` (`TOTAL: 36 SUCCESS`)
- PASS `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts` (`TOTAL: 1 SUCCESS`)
- RED/PASS `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts` (`TOTAL: 1 SUCCESS` after template fix)
- PASS `npx ng build showcase`
- PASS `rg "\bsdFooter\b" versions/v19/projects/sdcorejs-angular -g "*.html" -g "*.ts" -g "*.scss"` returned no matches
- PASS restarted `ng serve showcase --host 127.0.0.1 --port 4201`; route `http://127.0.0.1:4201/components/form-generic` returned `200`.

## Resume From Here
Ready for review or commit.

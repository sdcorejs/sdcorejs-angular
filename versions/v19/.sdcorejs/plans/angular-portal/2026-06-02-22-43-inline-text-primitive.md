---
name: inline-text-primitive
description: TDD plan to extract <sd-inline-text> seamless primitive, migrate sd-input/input-number inline to it, and refactor query-bar inline-value-chip to consume it.
approvedAt: 2026-06-02T22:43+07:00
approvedBy: anh.hoang10@onemount.com
track: angular-portal
module: forms
entity: inline-text
sourceSpecPath: .sdcorejs/specs/angular-portal/2026-06-02-22-43-inline-text-primitive.md
taskCount: 21
phaseCount: 9
---

# `<sd-inline-text>` seamless primitive + content-hug inline input — Approved Plan

> Snapshot of the plan the user approved at the `06-review-plan` gate. The body below is the exact contract `07-write-code` executed. Do not edit by hand — re-author via `05-plan` + `06-review-plan` if the contract changes.

## Scope (recap from spec)

Primitive `<sd-inline-text>` (new entry `forms/inline-text`) — borderless raw `<input [size]>` content-hug + `[data-state]`. sd-input/input-number `viewed='inline'` render the primitive instead of mat-form-field. Refactor query-bar `inline-value-chip` to consume the primitive. Remove dead `sd-inline-input` mixin. Full TDD. Query-builder untouched.

## Phases
- Phase 1 (secondary entry bootstrap): tasks 1-2
- Phase 2 (TDD red — primitive spec): task 3
- Phase 3 (TDD green — primitive impl): tasks 4-6
- Phase 4 (migrate sd-input + sd-input-number inline): tasks 7-11
- Phase 5 (refactor query-bar inline-value-chip): tasks 12-15
- Phase 6 (SCSS cleanup): task 16
- Phase 7 (doc + CHANGELOG): tasks 17-18
- Phase 8 (showcase): tasks 19-21
- Phase 9 (final verify): no new files

## Tasks
1. CREATE projects/sdcorejs-angular/forms/inline-text/ng-package.json — secondary entry (entryFile: index.ts)
2. CREATE projects/sdcorejs-angular/forms/inline-text/index.ts — export * from './src/inline-text.component'
3. CREATE projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.spec.ts — size hug (value/placeholder/clamp), [data-state], clear-× gating, Enter/Esc/blur commit-revert, disabled, autoId, autofocus (TDD red)
4. CREATE projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.ts — SdInlineText (OnPush, signal-first, @let alias)
5. CREATE projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.html — raw input + hover clear-×
6. CREATE projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.scss — seamless styling (lifted from .c-seamless__field-input + sd-inline-input look)
7. EDIT forms/input/src/input.component.html — branch @else if(isInline()) → <sd-inline-text>; remove .sd-inline-input
8. EDIT forms/input/src/input.component.ts — import SdInlineText; inline commit/clear wiring
9. EDIT forms/input/src/input.component.scss — remove @include sd-inline-input
10. EDIT forms/input/src/input.component.spec.ts — inline renders primitive (not mat-form-field), hug
11. EDIT forms/input-number/src/input-number.component.{html,ts,scss,spec.ts} — same + keep format-on-blur / raw-on-focus in consumer
12. EDIT components/query-bar/src/components/inline-value-chip/inline-value-chip.component.html — raw input → <sd-inline-text> (BETWEEN = 2 instances + dash)
13. EDIT .../inline-value-chip.component.ts — import primitive; keep #parse/#format/commit logic
14. EDIT .../inline-value-chip.component.scss — drop .c-seamless__field-input (moved into primitive), keep envelope
15. EDIT .../inline-value-chip.component.spec.ts — re-test single + BETWEEN
16. EDIT assets/scss/core/_inline-edit.scss — remove sd-inline-input mixin (keep sd-inline-panel)
17. CREATE projects/sdcorejs-angular/forms/inline-text/sd-inline-text.md — contract doc
18. EDIT CHANGELOG.md — Unreleased: new primitive + inline input content-hug
19. CREATE projects/showcase/src/app/pages/forms/inline-text/inline-text-demo.component.ts (+ .html/.scss if split)
20. EDIT projects/showcase/src/app/app.routes.ts — route
21. EDIT projects/showcase/src/app/layout/sidebar.config.ts — nav item

## Verification
- npm run build (real gate)
- npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/forms/inline-text/**/*.spec.ts' (Phase 3 green)
- Build lib, then: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/forms/{inline-text,input,input-number}/**/*.spec.ts'
- query-bar suite green (build lib first — dist resolves before source)
- npx ng build showcase --configuration=development
- Manual: npm run showcase → /forms/inline-text + /components/query-bar inline + sd-input/input-number inline demo

## Acceptance ↔ task map
AC1 hug → P2/P3 · AC2 input renders primitive → P4 · AC3 states → P2/P3 · AC4 clear-× → P2/P3 · AC5 Enter/Esc/blur + number format → P2/P4 · AC6 chip + BETWEEN → P5 · AC7 build+showcase → P8/P9 · AC8 no mat ::ng-deep + mixin removed → P4/P6.

## Decisions captured during review

(approved as drafted — attempt 1, no edits)

Planning-style signals locked this round:
- **TDD red→green phasing** (spec before impl) for the new primitive — matches the repo rule "TDD required for components/ and forms/" and the prior sd-tab plan structure.
- **Per-phase verification** (test after Phase 3, build+suite after Phase 5, final gate Phase 9) rather than one final run — mirrors sd-tab plan cadence.
- **Migration grouped per consumer** (Phase 4 = the two form controls, Phase 5 = query-bar chip) rather than per-file-type — keeps each consumer's edits in one reviewable batch.
- **SCSS cleanup deferred to its own phase** (Phase 6) after both consumers migrate, so the dead mixin is removed only once orphaned.
- **Showcase + doc as explicit phases** per the repo rule "new component requires a showcase demo".

## Skill provenance
05-plan → 06-review-plan (approved on attempt 1 / 3)

# `<sd-inline-text>` seamless primitive + content-hug inline input — 2026-06-03 07:36

## What was requested
"inline edit của input và input number đang bị to, vùng hover click nó ko theo content … với thiết kế này khó đưa vào trong query-bar hay query-builder." → extract a shared seamless content-hug primitive and fix the inline input sizing. Follow-up: "viết test và đồng bộ qua sdcorejs-angular".

## What was changed
- CREATE `projects/sdcorejs-angular/forms/inline-text/ng-package.json` — secondary entry
- CREATE `projects/sdcorejs-angular/forms/inline-text/index.ts` — barrel
- CREATE `projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.{ts,html,scss}` — `SdInlineText` primitive
- CREATE `projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.spec.ts` — 25 specs (TDD)
- CREATE `projects/sdcorejs-angular/forms/inline-text/sd-inline-text.md` — contract doc
- EDIT  `forms/input/src/input.component.{html,ts,scss,spec.ts}` — `viewed='inline'` renders `<sd-inline-text>` (controlled, `[control]=formControl`); focus routed to primitive; dropped `sd-inline-input`
- EDIT  `forms/input-number/src/input-number.component.{html,ts,scss,spec.ts}` — same + event passthrough (keydown/paste/composition) keeps vi-VN format/parse; removed orphan `[class.sd-inline-input]`
- EDIT  `components/query-bar/.../inline-value-chip.component.{html,ts,scss,spec.ts}` — consumes `<sd-inline-text chrome="seamless">` (single + BETWEEN); removed `CommonModule`; `revertAndBlur` takes `{blur()}`
- EDIT  `components/query-bar/src/query-bar.component.spec.ts` — selectors `input.c-seamless__field-input` → `sd-inline-text input`
- EDIT  `assets/scss/core/_inline-edit.scss` — removed dead `sd-inline-input` mixin (kept `sd-inline-panel` + `_inline-clear`)
- CREATE `projects/showcase/src/app/pages/forms/inline-text/inline-text-demo.component.ts` + route + sidebar nav
- EDIT  `CHANGELOG.md` — Unreleased: new primitive + content-hug fix + Internal refactor note

## Decisions made
- **Approach B** (extract primitive) over content-hug sd-input in place (A) or `inlineWidth` flag (C) — mat-form-field can't hug content, which is why query-bar already had a separate seamless chip.
- Inline mode **renders the primitive instead of mat-form-field** (no `::ng-deep` mat fight). Accepted tradeoff: inline drops mat suffix / maxlength-counter / mat-error and the `data-invalid/empty/value` attrs (keeps `data-autoId`).
- Primitive is event-forwarding + dual binding: `[(value)]` (chip drafts) or `[control]` (FormControl). Consumers keep their own commit/parse/format.
- Derived getters are `computed()` (review finding); seamless value text colour lives in the primitive (encapsulation blocks the chip pill from styling the inner input).

## Open questions / follow-ups
- **Sync to `sdcorejs-angular` (`@sdcorejs/angular`)** — user requested porting the primitive + inline migration + tests to the parallel repo. PENDING (next step).
- Manual visual smoke deferred to user: `/forms/inline-text`, query-bar inline UX (text retained, clear-×, ring), sd-input/input-number inline.
- `data-invalid/empty/value` not forwarded in inline mode — backfill only if E2E inspector needs the flags inline.

## Next suggested action
- Port to `sdcorejs-angular` (`@sdcorejs/angular`) per user request, with tests.
- `npm run showcase` → visually verify `/forms/inline-text` + query-bar inline.

## Skill provenance
`sdcorejs-recovery` → `sdcorejs-brainstorm` → `sdcorejs-clarify-requirements` → `sdcorejs-write-spec` → `sdcorejs-review-spec` → `sdcorejs-auto-specs` → `sdcorejs-plan` → `sdcorejs-review-plan` → `sdcorejs-auto-plans` → `angular-portal-write-code` (+ `sdcorejs-tdd`) → `sdcorejs-review-code-angular-portal` → `sdcorejs-repair-loop` → `sdcorejs-comment-code` → `sdcorejs-verify-before-done` → `sdcorejs-auto-docs`

## Verification
- `npm run build` → exit 0; `ng build showcase --configuration=development` → exit 0
- specs: inline-text 25 ✓, input+input-number 62+ ✓, query-bar 145 ✓ (0 failed)
- branch-ready sweep: no debug logs / focused / skipped / debugger

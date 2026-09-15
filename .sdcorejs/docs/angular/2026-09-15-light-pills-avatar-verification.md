# Light pills and text avatars — 2026-09-15

Implemented the approved light treatment for pills and initials avatars.

## Changed files

- `versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.scss`: light active background, stable Material active/hover/focus foreground tokens, focus outline and badge treatment.
- `versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.ts`: updated appearance comment.
- `versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.spec.ts`: selected-pill click/focus color regression.
- `versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.{ts,html,scss,spec.ts}`: light backgrounds, darker initials, contrast coverage; retains deterministic color selection and image behavior.
- Canonical `components/tab/sd-tab.md` and `components/avatar/sd-avatar.md`.
- `showcase/src/app/pages/components/{tab/tab,avatar/avatar}-demo.component.ts`, generated showcase catalogs and `CHANGELOG.md`.
- Derived v20/v21/v22 workspaces synchronized using `npm run sync`.

## Verification

- Focused tab/avatar tests: 71 passed.
- Full v19 ChromeHeadless tests: 5446 passed.
- Script tests: 160 passed.
- v19 lint and library build: passed.
- Version sync check: passed.
- Showcase source generation and library linking: passed.
- No manual browser visual verification claimed: the in-app browser previously returned `ERR_NETWORK_CHANGED`.

Test coverage includes computed selected-pill colors after focus/click and initials contrast of at least 4.5:1 across sampled names. No release or published archive artifacts were generated.

# `sd-tree` Vietnamese accents restored

Fixed an accidental ASCII-only rewrite in the tree showcase/docs:

- Restored Vietnamese accents in `projects/showcase/src/app/pages/components/tree/tree-demo.component.ts`.
- Restored the default selected message in `SdTree` to `Đã chọn ... mục`.
- Updated tree docs/user-guide examples and focused spec expectation to keep Vietnamese labels/messages with accents.

Verification:

- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/tree/src/tree.component.spec.ts --progress=false` -> `TOTAL: 14 SUCCESS`
- `npm run build` -> pass
- `npx ng build showcase --configuration=development --progress=false` -> pass, with pre-existing Sass deprecation warnings from `dist/sdcorejs-angular/assets/scss/core/utilities/_grid.scss`

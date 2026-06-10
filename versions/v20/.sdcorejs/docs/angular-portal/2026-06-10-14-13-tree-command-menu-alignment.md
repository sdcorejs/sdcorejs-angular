# sd-tree command menu alignment

## Summary
- Fixed `sd-tree` command menu content alignment by wrapping each command icon and label in a dedicated flex container.
- Reset the command menu icon margin/box alignment so Material menu-item default icon spacing no longer offsets the icon.
- Added a focused browser spec that opens the real CDK overlay menu, verifies icon/label order, flex centering, compact spacing, title line-height, zero icon margin, and the command click callback.

## Verification
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/tree/src/tree.component.spec.ts --progress=false` -> 15 specs passed.
- `npm run build` -> passed.

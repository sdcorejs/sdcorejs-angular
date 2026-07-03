---
generated_at: 2026-06-30T12:15:00+07:00
branch: release/0.11
git_head: 5a6cc2dea47f84a8a96a30ad9967d1309f71d33e
tracks:
  - angular
source: sdcorejs-explore
---

# Project Summary - sdcorejs-angular

## Shape

- Root repo keeps versioned Angular library workspaces under `versions/v19`, `versions/v20`, and `versions/v21`.
- `versions/v19` is the first rollout source for package work unless the user asks to fan changes out to newer versions.
- Published package name is `@sdcorejs/angular`; library sources live under `versions/v19/projects/sdcorejs-angular`.
- Secondary entrypoints are organized by folders such as `components/*`, `modules/*`, `forms/*`, `utilities/*`, each with its own `ng-package.json` and `index.ts`.

## Angular V19 Library

- Build command: `npm run build` from `versions/v19`.
- Test command: `npm run test:ci` from `versions/v19` for full library Karma CI.
- The library uses standalone Angular components, Angular signals, Angular Material, and ng-packagr.
- Core UI components are under `projects/sdcorejs-angular/components`.
- App-level/domain modules are under `projects/sdcorejs-angular/modules`.

## Current Icon Context

- Existing icon model is Material-focused in `utilities/models/src/icon.model.ts` with `MaterialIconFontSet` and `DefaultMaterialIconFontSet`.
- `SdButton` currently rendered prefix/suffix icons with Angular Material `mat-icon`; this session migrates that path to `SdIcon`.
- Layout and generic modules still contain direct `mat-icon` templates and should be migrated incrementally if Core UI icon abstraction is expanded later.

## Session Notes

- For Lucide support in v19, prefer a new `modules/icon` secondary entrypoint exposing `SdIcon` plus provider/config APIs.
- Keep first implementation scoped to v19 and avoid syncing to v20/v21 unless explicitly requested.

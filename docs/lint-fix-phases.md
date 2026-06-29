# Lint Fix Phases

## Baseline

Current v19 lint state on `release/0.10`:

- `npm --prefix versions/v19 run lint` fails with 3080 problems (2844 errors, 236 warnings).
- `npm run lint:phase:release` isolates release-touched v19 files and currently fails with a much smaller set.
- Do not run broad `eslint --fix` across the repo in a release branch. Fix one phase, verify that phase, then continue.

## Entry Points

Root commands:

```powershell
npm run lint:v19
npm run lint:v20
npm run lint:v21
npm run lint:release
npm run lint:phase -- --workspace v19 --phase release-touched
npm run lint:phase -- --workspace v19 --phase forms
npm run lint:phase -- --workspace v19 --phase components-shell
```

List phase names:

```powershell
npm run lint:phase -- --list
```

## Cleanup Order

### Phase 0 - Tooling And Measurement

Goal: keep lint visible but scoped.

Pass criteria:

- `npm run lint:phase -- --list` prints all supported phases.
- `npm run lint:phase:release` runs against release-touched v19 files only.

### Phase 1 - Release-Touched Files

Goal: make the current release delta lint-clean before expanding scope.

Command:

```powershell
npm run lint:phase:release
```

Scope:

- `forms/select`
- `services/notify`
- `utilities/extensions/object`

Pass criteria:

- Phase command exits 0.
- Existing focused tests still pass.
- `npm --prefix versions/v19 run build` still passes.

### Phase 2 - Utilities

Command:

```powershell
npm run lint:phase -- --workspace v19 --phase utilities
```

Focus:

- Prettier noise in extension specs.
- `no-explicit-any` in utility models/tests.
- Unused variables in utility specs.

### Phase 3 - Forms

Command:

```powershell
npm run lint:phase -- --workspace v19 --phase forms
```

Focus:

- Shared form component specs.
- Type-safe test hosts.
- Prettier formatting that is safe to auto-fix within the phase only.

### Phase 4 - Services And Core Modules

Commands:

```powershell
npm run lint:phase -- --workspace v19 --phase services
npm run lint:phase -- --workspace v19 --phase modules-core
```

Focus:

- Injection/service typing.
- Core exports and public API formatting.
- Avoid API-breaking type changes while replacing `any`.

### Phase 5 - Components

Commands:

```powershell
npm run lint:phase -- --workspace v19 --phase components-shell
npm run lint:phase -- --workspace v19 --phase components-editor
npm run lint:phase -- --workspace v19 --phase components-data
npm run lint:phase -- --workspace v19 --phase components-layout
```

Focus:

- Prettier and selector issues first.
- Unused imports/vars second.
- Type strictness last, because it is most likely to touch public contracts.

### Phase 6 - Rollout And Full Release Gate

After v19 is clean:

```powershell
npm run sync
npm run lint:release
npm --prefix versions/v19 run build
```

Pass criteria:

- v19/v20/v21 lint all exit 0.
- Rollout does not reintroduce Angular-major-specific lint failures.
- Release build/test evidence is refreshed before tagging.

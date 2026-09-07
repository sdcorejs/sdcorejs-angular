# Reviewed release snapshots

The original 2.5 gate assumed that Angular 22 support was the only change since
2.4, requiring identical exports, declarations, packed paths and authored source.
Before tagging, PRs [33](https://github.com/sdcorejs/sdcorejs-angular/pull/33),
[34](https://github.com/sdcorejs/sdcorejs-angular/pull/34),
[35](https://github.com/sdcorejs/sdcorejs-angular/pull/35) and
[36](https://github.com/sdcorejs/sdcorejs-angular/pull/36) also added selectable
cards, mobile table cards, number paste normalization and local table sorting.
Exact equality to 2.4 therefore rejected the intended release.

`2.5.json` records SHA-256 fingerprints of both the published baseline and the
reviewed candidate for each Angular line. It was derived from the four retained
packages in the recorded Actions run at `reviewedSourceSha`, after inspecting
the export, declaration, inventory and source differences against npm 2.4.
The only new package entry point is `./components/card`. Additional declarations
cover cards, mobile table rendering and the local sort helper. The two removed
v19 selection-pipe declaration files were internal, absent from package exports;
their selection logic moved to shared helpers. Existing strict consumer fixtures
must still compile against every retained tarball.

The snapshot covers:

- `exports`: the complete package export map.
- `files`: all relative tarball file paths, sorted, without the `package/` prefix.
- `publicSurface`: the complete result of `readPublicSurface`, excluding only
  `version` and `frameworkMajor`. This includes every declaration and every
  authored source embedded in sourcemaps, with the reader's LF normalization.

`fingerprintReleaseValue` recursively sorts object keys, preserves array order,
serializes with `JSON.stringify`, and hashes the UTF-8 result. Both sides must
match their own recorded digest; the gate does not allow arbitrary additions or
changes to a listed component. Framework-specific source transformations are
already present in the per-line candidate snapshots.

Snapshots are loaded from this checkout, never from downloaded artifact metadata.
Unknown release suffixes retain the original exact-baseline checks. Changing a
snapshot requires inspecting the actual package differences and reviewing that
change with the release. Do not regenerate it automatically during CI or simply
replace a failing digest. Inspectable inputs can be recovered with `npm pack` for
the recorded baseline and the linked Actions artifacts (or a fresh build of the
recorded source using the locked toolchain).

Tarball SHA-256, npm integrity/shasum, extracted inventory, source commit binding,
dependency/peer/engine checks, strict consumer compilation and publication
transaction checks still run independently.

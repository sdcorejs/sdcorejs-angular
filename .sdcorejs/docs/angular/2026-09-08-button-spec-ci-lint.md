---
artifact_id: execution-doc:sdcorejs-angular:button-spec-ci-lint
artifact_kind: execution-doc
change_ref: button-spec-ci-lint-20260908
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-angular
track: angular
status: locally-verified
---

# Button spec CI lint correction

CI run 34189671515 for PR #43 stopped at lint in v19, v20, v21 and v22: Prettier rejected an extra blank line before the final closing statement in `components/button/src/button.component.spec.ts`, line 290. Build and coverage steps were not reached in those jobs. The previous local build and focused tests did not detect this formatting failure.

Removed the blank line in canonical v19 and normalized that spec to LF to avoid mixed line endings in the Windows working copy. Ran the repository sync command to generate v20/v21/v22 and their sync status records. The test assertions, component behavior and public API are unchanged.

Verification on exact Node 22.22.3:

- The focused ESLint reproduction confirmed the formatting error; the Windows file also contained mixed line endings.
- Full `ng lint` passed in installed v19, v20 and v21 workspaces after the correction.
- `npm run check:sync` passed for all four versions.
- Diff review confirms only the blank line, generated sync metadata and this record changed. Git reported 45 pre-existing v22 working files with CRLF endings; their normalized contents matched HEAD and contain no additional source edits.
- Local v22 lint was unavailable because its Angular CLI dependencies are not installed. The PR CI run verifies v22 and the complete build/coverage pipeline using clean installations. Its live result is tracked on PR #43 rather than represented as a local pass here.

No new tests are needed for this whitespace-only correction; the existing lint rule is the regression check. Logs remain in temporary local storage outside the repository.

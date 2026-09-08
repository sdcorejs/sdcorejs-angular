---
artifact_id: execution-doc:sdcorejs-angular:drawer-focus-ci
artifact_kind: execution-doc
change_ref: drawer-focus-ci-20260908
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-angular
track: angular
status: locally-verified
---

# Drawer focus during entrance animation

After the button lint correction, CI run 34190397953 passed lint and library builds for v19/v20/v21/v22, but both full v19 and v22 suites reported two SideDrawer focus failures (5,289 of 5,291 tests passed in each suite).

The root drawer transitioned `visibility` over 180ms. Immediately after the open class was applied, computed visibility could still be hidden until the first animation frame. CDK's after-render focus capture then found no visible focusable element and did not capture focus. The local Windows reduced-motion preference removed CSS transitions and concealed the failure in earlier focused runs. NoopAnimationsModule does not control these CSS transitions.

Reproduced both failures in the existing Karma suite using an isolated Playwright browser context with reducedMotion set to no-preference. Diagnostics confirmed reduced motion false, visibility hidden, and focus outside the drawer. A separate Chromium probe compiled the actual component SCSS and reproduced the same immediate focus failure without Angular.

The fix makes visibility a zero-duration change with no delay on opening. Closing retains the 180ms delay before hiding, while opacity/transform keep their existing animation. The component's reduced-motion override remains in place. Strengthened the two regression tests by committing the closed layout before opening and asserting immediate visibility in addition to the existing capture, Tab cycling, close-guard and restore checks. No assertions were removed or timing sleeps added.

Verification on exact Node 22.22.3:

- Before the fix: both focused focus tests failed with normal motion.
- After the fix: all 54 SideDrawer tests passed with normal motion, and all 54 passed again with reduced motion.
- Chromium probes using the real SCSS confirmed immediate visibility and focus capture in both modes, hidden state after closing, and no transitions under reduced motion.
- Full canonical v19 lint passed; four-version sync passed; generated mirrors came from npm run sync.
- Diff and UTF-8 review passed. Temporary diagnostic logging was removed. Browser adapters, scripts and logs remain outside the repository.

Full build and coverage results for the corrected commit are tracked by PR #43 CI. The legacy sd-angular/core Modal/Drawer scope remains excluded.

#!/usr/bin/env bash
# Focused Karma run of some specs (no coverage). Specs resolve @sdcorejs/angular/* from dist first, so run
# `npx ng build sdcorejs-angular` in versions/v19 before a spec that imports another entry point you changed.
#   bash .sdcorejs/handoff/tools/kt.sh 'components/tab-router/**/*.spec.ts' ['components/badge/**/*.spec.ts' …]
ROOT="$(git rev-parse --show-toplevel)"
T="${TMP_DIR:-${TEMP:-/tmp}/claude}"
mkdir -p "$T"
cd "$ROOT/versions/v19" || exit 1
args=(); for g in "$@"; do args+=(--include="projects/sdcorejs-angular/$g"); done
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI "${args[@]}" > "$T/kt.log" 2>&1
sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$T/kt.log" > "$T/kt.clean.log"
grep -E "ERROR|Error:" "$T/kt.clean.log" | grep -v "^\s*at " | head -10
awk '/FAILED$/{p=1} p&&/^\s+at /{p=0} p' "$T/kt.clean.log" | grep -v "Executed" | head -80
grep -E "Executed [0-9]+ of [0-9]+ .*\(.*secs / " "$T/kt.clean.log" | tail -1

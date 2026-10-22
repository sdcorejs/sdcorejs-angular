#!/usr/bin/env bash
# Full checks for one wave-3 step (design handoff). Run from anywhere inside the repo, in the background (~15–20 min):
#   bash .sdcorejs/handoff/tools/run-checks.sh <label> projects/sdcorejs-angular/components/<name>
# The paths after the label (relative to versions/v19) get `eslint --fix` first. Writes $TMP_DIR/full-<label>.log and
# prints it; the last line is DONE. Order: eslint --fix, lib build, full Karma suite with coverage, lint, test:theme,
# check:scss-hex, sync, check:sync, script tests, link:library + webpack cache clear, showcase tests.
LABEL="$1"; shift
ROOT="$(git rev-parse --show-toplevel)"
T="${TMP_DIR:-${TEMP:-/tmp}/claude}"
mkdir -p "$T"
OUT="$T/full-$LABEL.log"
strip() { sed 's/\x1b\[[0-9;]*[A-Za-z]//g'; }
cd "$ROOT/versions/v19" || exit 1
: > "$OUT"
if [ "$#" -gt 0 ]; then npx eslint --fix "$@" > /dev/null 2>&1; echo "eslint-fix=$?" >> "$OUT"; fi
npx ng build sdcorejs-angular > "$T/build-$LABEL.log" 2>&1; echo "build exit=$?" >> "$OUT"
grep -iE "error TS|NG[0-9]{4}" "$T/build-$LABEL.log" | head -5 >> "$OUT"
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage > "$T/karma-$LABEL.log" 2>&1; echo "karma exit=$?" >> "$OUT"
strip < "$T/karma-$LABEL.log" | grep -E "FAILED$" | sed 's/Chrome Headless [0-9.]* ([^)]*) //' | head -30 >> "$OUT"
strip < "$T/karma-$LABEL.log" | grep -E "Executed [0-9]+ of [0-9]+ .*\(.*secs / " | tail -1 >> "$OUT"
strip < "$T/karma-$LABEL.log" | grep -A5 "Coverage summary" >> "$OUT"
npm run lint 2>&1 | tail -2 >> "$OUT"
cd "$ROOT"
npm run test:theme 2>&1 | grep -E "^ℹ (pass|fail)" >> "$OUT"
npm run check:scss-hex 2>&1 | tail -1 >> "$OUT"
npm run sync 2>&1 | tail -1 >> "$OUT"
npm run check:sync 2>&1 | tail -1 >> "$OUT"
for t in test:showcase-examples test:showcase-route-shells test:check-i18n test:collect-docs test:theme-token-list; do
  echo "$t: $(npm run $t 2>&1 | grep -E '^ℹ (pass|fail)' | tr '\n' ' ')" >> "$OUT"
done
npm --prefix showcase run link:library > /dev/null 2>&1
# why: the showcase webpack cache keeps the old copy of the linked library ("export 'X' was not found").
rm -rf showcase/.angular/cache/*/angular-webpack showcase/.angular/cache/*/babel-webpack
npm --prefix showcase run test -- --watch=false --browsers=ChromeHeadless > "$T/sc-$LABEL.log" 2>&1; echo "showcase exit=$?" >> "$OUT"
strip < "$T/sc-$LABEL.log" | grep -E "FAILED$|Error:|Executed [0-9]+ of [0-9]+ .*(SUCCESS|FAILED) \(" | tail -4 >> "$OUT"
echo DONE >> "$OUT"
cat "$OUT"

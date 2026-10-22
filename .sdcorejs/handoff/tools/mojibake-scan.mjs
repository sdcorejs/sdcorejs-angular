// Scans the files changed against HEAD (and untracked ones) for UTF-8-read-as-Windows-1252 artifacts.
// Usage: node .sdcorejs/handoff/tools/mojibake-scan.mjs [base-ref]   (default HEAD; e.g. `5992185b` for the whole wave)
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const base = process.argv[2] ?? 'HEAD';
const git = cmd => execSync(cmd, { encoding: 'utf8' }).split('\n').filter(Boolean);
const files = [...new Set([...git(`git diff --name-only ${base}`), ...git('git ls-files --others --exclude-standard')])].filter(
  // the scanner holds the patterns themselves
  f => existsSync(f) && !f.endsWith('mojibake-scan.mjs') && /\.(ts|html|scss|md|mjs|json|sh)$/.test(f)
);
// Ã/Â followed by a CP1252 continuation, â€ sequences, áº/á» (Vietnamese precomposed read as CP1252), U+FFFD.
const bad = /Ã[\u0080-¿ŒœŠšŸŽžƒˆ˜–-›€™]|Â[\u0080-¿]|â€|á[º»]|�/;
let hits = 0;
for (const f of files) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (bad.test(line)) {
        hits++;
        console.log(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
}
console.log(`${files.length} file(s) scanned, ${hits} hit(s)`);
process.exit(hits ? 1 : 0);

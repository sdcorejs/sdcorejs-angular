/**
 * Regenerates the inlined pdf.js worker source consumed by <sd-preview-pdf>.
 *
 * WHY this exists: esbuild (Angular's bundler) does NOT rewrite
 * `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` into an
 * emitted asset the way webpack/vite do. In a production/AOT build the literal
 * survives untouched, so at runtime the URL resolves against the deployed chunk
 * and points at a file that was never shipped -> 404 -> pdf.js reports
 * "Setting up fake worker failed" and every PDF fails to open.
 *
 * Inlining the worker source and handing pdf.js a blob: URL keeps the library
 * self-contained: consumer apps need no `assets` entry in angular.json and no
 * manual file copy.
 *
 * Run after bumping pdfjs-dist:
 *   npm run generate:pdf-worker
 * Verify it is in sync (CI-friendly, non-mutating):
 *   npm run check:pdf-worker
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const WORKER_ENTRY = join(repoRoot, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const PDFJS_PACKAGE_JSON = join(repoRoot, 'node_modules/pdfjs-dist/package.json');
const OUTPUT_FILE = join(
  repoRoot,
  'projects/sdcorejs-angular/components/preview/src/preview-pdf/pdf-worker-inline.generated.ts'
);

const checkOnly = process.argv.includes('--check');

function buildGeneratedSource() {
  const workerSource = readFileSync(WORKER_ENTRY, 'utf8');
  const { version } = JSON.parse(readFileSync(PDFJS_PACKAGE_JSON, 'utf8'));

  if (!workerSource.includes('WorkerMessageHandler')) {
    throw new Error(`Unexpected worker bundle at ${WORKER_ENTRY} — WorkerMessageHandler not found.`);
  }

  return [
    '// =============================================================================',
    '// GENERATED FILE — DO NOT EDIT BY HAND.',
    '// Produced by scripts/generate-pdf-worker-inline.mjs from',
    '//   node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
    '// Regenerate after bumping pdfjs-dist:  npm run generate:pdf-worker',
    '// =============================================================================',
    '/* eslint-disable */',
    '',
    '/** pdfjs-dist version this worker source was taken from. */',
    `export const PDF_WORKER_PDFJS_VERSION = '${version}';`,
    '',
    '/**',
    ' * Full pdf.js worker bundle, inlined so <sd-preview-pdf> can hand pdf.js a',
    ' * blob: URL instead of a path that the consumer app would have to deploy.',
    ' */',
    `export const PDF_WORKER_SOURCE = ${JSON.stringify(workerSource)};`,
    '',
  ].join('\n');
}

const generated = buildGeneratedSource();

if (checkOnly) {
  let current;
  try {
    current = readFileSync(OUTPUT_FILE, 'utf8');
  } catch {
    console.error(`[pdf-worker] MISSING: ${OUTPUT_FILE}\nRun: npm run generate:pdf-worker`);
    process.exit(1);
  }
  if (current !== generated) {
    console.error(
      '[pdf-worker] OUT OF SYNC with node_modules/pdfjs-dist.\nRun: npm run generate:pdf-worker'
    );
    process.exit(1);
  }
  console.log('[pdf-worker] in sync with installed pdfjs-dist.');
} else {
  writeFileSync(OUTPUT_FILE, generated, 'utf8');
  const kb = (generated.length / 1024).toFixed(0);
  console.log(`[pdf-worker] wrote ${OUTPUT_FILE} (${kb} KB)`);
}

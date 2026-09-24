import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ICON_DIR, OUTPUT_FILE, buildFileExplorerIconsModule, cleanSvg, validateIconSet } from './generate-file-explorer-icons.mjs';

test('checked-in file-explorer-icons.generated.ts is fresh', () => {
  const current = readFileSync(OUTPUT_FILE, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(current, buildFileExplorerIconsModule(), 'run `npm run generate:file-explorer-icons` and commit the result');
});

test('the icon set is consistent: every icon has an SVG and every mapping targets a known icon', () => {
  const manifest = JSON.parse(readFileSync(join(ICON_DIR, 'manifest.json'), 'utf8'));
  const source = buildFileExplorerIconsModule();
  for (const name of manifest.icons) assert.ok(source.includes(`'${name}':\n    '<svg`), `missing markup for ${name}`);
  assert.equal(manifest.icons.length, 45);
  assert.ok(Object.keys(manifest.extensions).length > 100);
});

test('cleanSvg strips the standalone title, ARIA wiring and fixed size but keeps the viewBox', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-labelledby="title">\n' +
    '  <title id="title">PDF file icon</title>\n  <path d="M0 0h1" width="3"/>\n</svg>';
  assert.equal(cleanSvg(svg), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M0 0h1" width="3"/></svg>');
});

test('validateIconSet reports missing files, unlisted files and dangling mappings', () => {
  const problems = validateIconSet({
    manifest: {
      icons: ['file-generic', 'folder-closed', 'folder-open', 'file-pdf'],
      defaultIcon: 'file-generic',
      folder: { closed: 'folder-closed', open: 'folder-open' },
      extensions: { pdf: 'file-pdf', xyz: 'file-xyz' },
      mimeFallback: { 'image/': 'file-image' },
    },
    svgs: { 'file-generic': '<svg/>', 'folder-closed': '<svg/>', 'folder-open': '<svg/>', 'file-extra': '<svg/>' },
  });
  assert.deepEqual(problems, [
    'manifest icon "file-pdf" has no svg/file-pdf.svg',
    'svg/file-extra.svg is not listed in manifest.icons',
    'extensions.xyz points to unknown icon "file-xyz"',
    'mimeFallback.image/ points to unknown icon "file-image"',
  ]);
});

test('buildFileExplorerIconsModule fails closed on an invalid icon set', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sd-fe-icons-'));
  try {
    mkdirSync(join(dir, 'svg'));
    writeFileSync(join(dir, 'svg', 'file-generic.svg'), '<svg viewBox="0 0 64 64"/>');
    writeFileSync(
      join(dir, 'manifest.json'),
      JSON.stringify({ icons: ['file-generic'], defaultIcon: 'file-generic', folder: {}, extensions: {}, mimeFallback: {} })
    );
    assert.throws(() => buildFileExplorerIconsModule(dir), /folder icons must stay/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

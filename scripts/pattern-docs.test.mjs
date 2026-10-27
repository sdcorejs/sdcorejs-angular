import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PATTERN_ROOT, buildManifest, docFiles, extract, fillDoc, manifestFiles, run } from './pattern-docs.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'sd-pattern-docs-'));
  mkdirSync(join(root, 'features', 'demo', 'pages'), { recursive: true });
  mkdirSync(join(root, 'docs'));
  writeFileSync(
    join(root, 'features', 'demo', 'pages', 'list.component.ts'),
    "export class ListComponent {\r\n  // #region columns\r\n  readonly columns = ['code'];\r\n  // #endregion\r\n}\r\n"
  );
  writeFileSync(join(root, 'features', 'demo', 'pages', 'list.component.spec.ts'), 'describe();\n');
  return root;
}

test('checked-in pattern docs and Source manifest are fresh', () => {
  assert.deepEqual(run({ check: true }), [], 'run `npm run pattern:docs` and commit the result');
});

test('extract returns a whole file or one region, dedented, with LF line endings', () => {
  const root = fixture();
  try {
    assert.equal(extract('features/demo/pages/list.component.ts', undefined, root).split('\n').length, 5);
    assert.equal(extract('features/demo/pages/list.component.ts', 'columns', root), "readonly columns = ['code'];");
    assert.throws(() => extract('features/demo/missing.ts', undefined, root), /file does not exist/);
    assert.throws(() => extract('features/demo/pages/list.component.ts', 'rows', root), /region not found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fillDoc rewrites the block after a marker and rejects a marker without a block', () => {
  const root = fixture();
  try {
    const doc = ['# List', '<!-- @source features/demo/pages/list.component.ts#columns -->', '```ts', 'hand edited', '```', 'after'].join('\n');
    assert.equal(
      fillDoc(doc, root),
      ['# List', '<!-- @source features/demo/pages/list.component.ts#columns -->', '```ts', "readonly columns = ['code'];", '```', 'after'].join('\n')
    );
    assert.throws(() => fillDoc('<!-- @source features/demo/pages/list.component.ts -->\ntext', root), /fenced code block/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the manifest holds README, docs and feature source, never specs', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'docs', 'list.md'), '# List\n');
    assert.deepEqual(manifestFiles(root), ['docs/list.md', 'features/demo/pages/list.component.ts']);
    assert.match(buildManifest(root), /'features\/demo\/pages\/list\.component\.ts': 'export class ListComponent \{\\n/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('pattern docs carry no pseudo-code and no version notes (E10, E11)', () => {
  for (const file of docFiles()) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /mã giả/i, `${file} mentions pseudo-code`);
    assert.doesNotMatch(text, /Core \d+\.\d+\.\d+/, `${file} carries a version note`);
  }
});

test('every permission code of the features is in the sample role catalog, and the catalog has no unused code', () => {
  const catalog = readFileSync(join(PATTERN_ROOT, 'core', 'permission', 'pattern-permission.ts'), 'utf8');
  const listed = new Set([...catalog.matchAll(/'(PATTERN_[A-Z_]+)'/g)].map(match => match[1]));
  const used = new Set();
  for (const file of manifestFiles().filter(path => path.startsWith('features/'))) {
    const source = readFileSync(join(PATTERN_ROOT, ...file.split('/')), 'utf8');
    for (const match of source.matchAll(/PATTERN_[A-Z]+_[RCUD]_[A-Z_]+/g)) used.add(match[0]);
  }
  for (const code of used) assert.ok(listed.has(code), `${code} is used by a feature but missing from PATTERN_PERMISSION_CODES`);
  for (const code of listed) assert.ok(used.has(code), `${code} is listed in PATTERN_PERMISSION_CODES but no feature uses it`);
  for (const code of used) assert.match(code, /^PATTERN_[A-Z]+_[RCUD]_[A-Z_]+$/, `${code} breaks PATTERN_<ENTITY>_<R|C|U|D>_<ACTION>`);
});

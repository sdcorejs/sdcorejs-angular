import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { afterEach, test } from 'node:test';
import { annotateWindowDeprecation } from './annotate-window-deprecation.mjs';

const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const ts = require('typescript');
const fixtures = new Set();
afterEach(() => {
  const allowedRoot = resolve(tmpdir()) + sep;
  for (const directory of fixtures) {
    const target = resolve(directory);
    assert.ok(target.startsWith(allowedRoot) && basename(target).startsWith('sd-window-dts-'), 'only owned temporary fixtures may be removed');
    rmSync(target, { recursive: true, force: true });
  }
  fixtures.clear();
});
const fixture = ({ forwarders = false } = {}) => {
  const directory = mkdtempSync(join(tmpdir(), 'sd-window-dts-'));
  fixtures.add(directory);
  const workspace = join(directory, 'versions/v20');
  const root = join(workspace, 'dist/sdcorejs-angular');
  const parser = join(workspace, 'node_modules/typescript');
  mkdirSync(parser, { recursive: true });
  writeFileSync(join(parser, 'index.js'), `module.exports = require(${JSON.stringify(require.resolve('typescript'))});\n`);
  const files = forwarders
    ? { 'index.d.ts': "export * from './components/index';", 'components/index.d.ts': "export * from './modal-resizable/index';", 'components/modal-resizable/index.d.ts': "export * from './alias';", 'components/modal-resizable/alias.d.ts': "export { SdWindow as SdModalResizable } from '@sdcorejs/angular/components/window';" }
    : { 'index.d.ts': "export { SdModalResizable } from '@sdcorejs/angular/components/modal-resizable';", 'components/index.d.ts': "export { SdModalResizable } from '@sdcorejs/angular/components/modal-resizable';", 'components/modal-resizable/index.d.ts': "export { SdWindow as SdModalResizable } from '@sdcorejs/angular/components/window';" };
  for (const [file, content] of Object.entries(files)) { mkdirSync(join(root, file, '..'), { recursive: true }); writeFileSync(join(root, file), content + '\n'); }
  const pkg = { name: '@sdcorejs/angular', exports: { '.': { types: './index.d.ts' }, './components': { types: './components/index.d.ts' }, './components/modal-resizable': { types: './components/modal-resizable/index.d.ts' } } };
  writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
  writeFileSync(join(root, 'untouched.mjs'), "export { SdWindow as SdModalResizable } from '@sdcorejs/angular/components/window';\n");
  return { root, files, pkg, directory, workspace };
};
const ownTags = file => {
  const program = ts.createProgram([file], { noLib: true, noResolve: true, noEmit: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  return checker.getExportsOfModule(checker.getSymbolAtLocation(source)).find(symbol => symbol.name === 'SdModalResizable')?.getJsDocTags(checker) || [];
};

test('flattened public entry points expose a real alias deprecation hint while JavaScript stays byte-identical', () => {
  const { root, files } = fixture();
  const runtime = readFileSync(join(root, 'untouched.mjs'));
  assert.equal(ownTags(join(root, 'components/modal-resizable/index.d.ts')).length, 0);
  const result = annotateWindowDeprecation(root);
  assert.equal(result.updated.length, 3);
  for (const file of Object.keys(files)) {
    assert.ok(ownTags(join(root, file)).some(tag => tag.name === 'deprecated'), file);
    const source = ts.createSourceFile(file, readFileSync(join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
    assert.ok(source.statements.every(node => ts.isExportDeclaration(node)), 'keep exact class re-exports');
  }
  assert.deepEqual(readFileSync(join(root, 'untouched.mjs')), runtime);
});

test('annotation is idempotent and keeps an existing alias hint', () => {
  const { root, files } = fixture();
  annotateWindowDeprecation(root);
  const before = Object.fromEntries(Object.keys(files).map(file => [file, readFileSync(join(root, file), 'utf8')]));
  assert.deepEqual(annotateWindowDeprecation(root).updated, []);
  for (const [file, content] of Object.entries(before)) assert.equal(readFileSync(join(root, file), 'utf8'), content);
});

test('unflattened Angular 19 forwarding entries preserve the leaf alias', () => {
  const { root } = fixture({ forwarders: true });
  const result = annotateWindowDeprecation(root);
  assert.deepEqual(result.updated, ['components/modal-resizable/alias.d.ts']);
  assert.ok(ownTags(join(root, 'components/modal-resizable/alias.d.ts')).some(tag => tag.name === 'deprecated'));
});

test('alias annotation never marks the canonical Window export deprecated', () => {
  const { root } = fixture();
  writeFileSync(join(root, 'index.d.ts'), "export { SdWindow } from '@sdcorejs/angular/components/window';\nexport { SdModalResizable } from '@sdcorejs/angular/components/modal-resizable';\n");
  annotateWindowDeprecation(root);
  const program = ts.createProgram([join(root, 'index.d.ts')], { noLib: true, noResolve: true, noEmit: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(join(root, 'index.d.ts'));
  const canonical = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).find(symbol => symbol.name === 'SdWindow');
  assert.ok(!canonical.getJsDocTags(checker).some(tag => tag.name === 'deprecated'));
});

test('missing or unexpected legacy export fails before any declaration is changed', () => {
  const { root } = fixture();
  writeFileSync(join(root, 'components/modal-resizable/index.d.ts'), 'export declare class SdModalResizable {}\n');
  const primary = readFileSync(join(root, 'index.d.ts'), 'utf8');
  assert.throws(() => annotateWindowDeprecation(root), /alias|re-export/i);
  assert.equal(readFileSync(join(root, 'index.d.ts'), 'utf8'), primary);
});

test('an export path outside the package fails without writing there', () => {
  const { root, pkg } = fixture();
  pkg.exports['./components/modal-resizable'].types = '../foreign.d.ts';
  writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
  assert.throws(() => annotateWindowDeprecation(root), /outside|path/i);
});

test('a foreign package name is rejected', () => {
  const { root, pkg } = fixture();
  pkg.name = 'other-library';
  writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
  assert.throws(() => annotateWindowDeprecation(root), /package/i);
});

test('the build hook uses the target workspace parser when Angular 19 is not installed', () => {
  const { root, directory, workspace } = fixture();
  assert.equal(existsSync(join(directory, 'versions/v19/node_modules')), false);
  const script = join(directory, 'scripts/annotate-window-deprecation.mjs');
  mkdirSync(join(directory, 'scripts'), { recursive: true });
  writeFileSync(script, readFileSync(new URL('./annotate-window-deprecation.mjs', import.meta.url)));
  const result = spawnSync(process.execPath, [script], { cwd: workspace, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(ownTags(join(root, 'components/modal-resizable/index.d.ts')).some(tag => tag.name === 'deprecated'));
});

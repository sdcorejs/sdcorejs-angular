import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { literalFindings, scanLibrary, scanSource } from './check-scss-hex.mjs';

const SCRIPT = fileURLToPath(new URL('./check-scss-hex.mjs', import.meta.url));
const V19 = fileURLToPath(new URL('../versions/v19/', import.meta.url));

// A miniature library tree with one planted violation per rule and one sample per exemption.
const FIXTURE = {
  'assets/scss/themes/_palette.scss': '$brand: (primary: #005cbb);\n',
  'components/card/card.component.scss': [
    '.card {',
    '  color: #212121;', // hex → reported
    '  border: 1px solid var(--sd-card-border, #e6e6e6);', // var() fallback → allowed
    '  background: var(--sd-surface);',
    '  // #ff0000 in a comment is not a colour',
    '  /* nor #00ff00 here */',
    '  &:focus-visible { outline: 2px solid var(--sd-primary); }', // focus without the focus token → reported
    '}',
    '.ok:focus-visible { outline: var(--sd-focus-ring-width) solid var(--sd-focus-ring-color); outline-offset: 2px; }',
    '.hook:focus-visible { outline: 2px solid var(--sd-card-accent, var(--sd-focus-ring-color)); }',
    '.dark:focus-visible { outline: 2px solid var(--sd-preview-pdf-focus-ring); }',
    '.link:focus { outline: 2px solid currentColor; }',
    '.off:focus { outline: none; }',
    '.last:focus-within { outline-color: white }', // last declaration without `;` → reported
    '.c-#{$name} { color: var(--sd-text); }',
    '',
  ].join('\n'),
  'components/card/card.component.ts': [
    "const accent = '#1abc9c';", // colour-looking literal → reported
    'const style = { color: "#fff" };', // → reported
    "const fallback = 'var(--sd-avatar-tint, #ffffff)';", // var() fallback → allowed
    '// const old = "#000";',
    "const anchor = 'section#main';", // not a colour position → ignored
    "const url = 'https://example.com/#abc';",
    '',
  ].join('\n'),
  'components/card/card.component.spec.ts': "expect(el.style.color).toBe('#123456');\n",
  'components/card/icons.generated.ts': "export const ICON = '#abcdef';\n",
  'forms/input-color/src/input-color.component.ts': "if (!v) return '#000000';\n",
  'forms/input-color/src/input-color.component.scss': '.chip { background: #dddddd; }\n',
};

let root;

before(() => {
  root = mkdtempSync(join(tmpdir(), 'sd-hex-'));
  for (const [rel, content] of Object.entries(FIXTURE)) {
    const file = join(root, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content, 'utf8');
  }
});

after(() => rmSync(root, { recursive: true, force: true }));

const summary = findings => findings.map(f => `${f.file}:${f.line} ${f.kind} ${f.text}`).sort();

test('reports planted hex colours and focus outlines, and nothing else', () => {
  assert.deepEqual(summary(scanLibrary({ root })), [
    'components/card/card.component.scss:2 hex #212121',
    'components/card/card.component.scss:7 focus outline: 2px solid var(--sd-primary)',
    'components/card/card.component.scss:14 focus outline-color: white',
    'components/card/card.component.ts:1 hex #1abc9c',
    'components/card/card.component.ts:2 hex #fff',
    'forms/input-color/src/input-color.component.scss:1 hex #dddddd',
  ].sort());
});

test('exempts themes, generated files, specs, input-color data values and var() fallbacks', () => {
  const files = new Set(scanLibrary({ root }).map(f => f.file));
  for (const exempt of [
    'assets/scss/themes/_palette.scss',
    'components/card/icons.generated.ts',
    'components/card/card.component.spec.ts',
    'forms/input-color/src/input-color.component.ts',
  ]) {
    assert.ok(!files.has(exempt), exempt);
  }
  assert.deepEqual(scanSource('components/x/x.scss', '.a { color: var(--sd-a, var(--sd-b, #abcdef)); }'), []);
});

test('focus rule accepts the focus-ring token, component focus-ring tokens, hooks falling back to it and currentColor', () => {
  const ok = [
    '.a:focus-visible { outline: 2px solid var(--sd-focus-ring-color); }',
    '.a:focus-visible { outline: 2px solid var(--sd-tab-label-active-color, var(--sd-focus-ring-color)); }',
    '.a:focus-visible { outline: 2px solid var(--sd-modal-resizable-focus-ring-on-dark); }',
    '.a:focus-visible { outline: var(--sd-focus-ring-width, 2px) solid var(--sd-preview-pdf-focus-ring, white); }',
    '.a:focus-visible { outline: 2px solid var(--sd-focus-ring-color, var(--sd-primary)); }',
    '.a:focus { outline: 2px solid currentColor; }',
    '.a { &:focus-visible { outline: 0; } }',
  ];
  assert.equal(scanSource('components/x/x.scss', '.a:focus-visible { outline: 2px solid var(--sd-focus-ring-color, #005cbb); }').length, 1, 'hex fallback in a focus rule');
  for (const source of ok) assert.deepEqual(scanSource('components/x/x.scss', source), [], source);
  assert.equal(scanSource('components/x/x.scss', '.a { &:focus-visible { .b { outline: 1px dotted red; } } }').length, 1);
});

test('--literals reports values equal to a scale token, with the exact range to replace', () => {
  const source = [
    '.a {',
    '  border-radius: 8px;',
    '  font-size: 13px !important;',
    '  font-weight: 500;',
    '  line-height: 20px;',
    '  z-index: 1000;',
    '  transition: color 120ms ease, background 0.2s cubic-bezier(0.4, 0, 0.2, 1);',
    // Multi-line, with the double spaces of the elevation utilities — still equal to --sd-shadow-md.
    '  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),',
    '    0px 4px 5px  0px rgba(0, 0, 0, 0.14),',
    '    0px 1px 10px 0px rgba(0, 0, 0, 0.12);',
    '  border-radius: 7px;', // no token for 7px
    '  z-index: 20;', // local stacking outside the layout module
    '  --sd-local: 8px;', // custom properties are left alone
    '  padding: 8px;', // spacing is deferred
    '}',
  ].join('\n');
  const found = literalFindings('components/x/x.scss', source)
    .filter(f => f.property !== 'box-shadow')
    .map(f => `${f.property}: ${f.text} -> ${f.replacement}`);
  assert.deepEqual(found, [
    'border-radius: 8px -> var(--sd-radius-8)',
    'font-size: 13px -> var(--sd-font-size-13)',
    'font-weight: 500 -> var(--sd-font-weight-medium)',
    'line-height: 20px -> var(--sd-line-height-20)',
    'z-index: 1000 -> var(--sd-z-dropdown)',
    'transition: 120ms -> var(--sd-duration-fast)',
    'transition: 0.2s -> var(--sd-duration-base)',
    'transition: cubic-bezier(0.4, 0, 0.2, 1) -> var(--sd-ease-standard)',
  ]);
  assert.equal(literalFindings('components/x/x.scss', source).filter(f => f.property === 'box-shadow')[0].replacement, 'var(--sd-shadow-md)');
  // `!important` stays outside the replaced range.
  const size = literalFindings('components/x/x.scss', source).find(f => f.property === 'font-size');
  assert.equal(source.slice(size.index, size.index + size.length), '13px');
  // Layout layers only count inside modules/layout.
  assert.equal(literalFindings('modules/layout/components/x.scss', '.a { z-index: 20; }')[0].replacement, 'var(--sd-z-sidebar)');
});

test('--literals skips at-rule descriptors, where var() is invalid', () => {
  const source = [
    "@font-face { font-family: 'Roboto'; font-weight: 500; font-style: normal; }",
    '@property --sd-x { syntax: "<length>"; inherits: false; initial-value: 8px; }',
    '.material-icons { font-weight: 500; }',
  ].join('\n');
  assert.deepEqual(
    literalFindings('assets/fonts/fonts.scss', source).map(f => `${f.property}: ${f.text}`),
    ['font-weight: 500']
  );
  assert.equal(literalFindings('assets/fonts/fonts.scss', source)[0].index, source.lastIndexOf('500'));
});

test('--literals ignores values already inside a var() fallback', () => {
  const source = '.a { transition: transform var(--sd-duration-slow, 300ms) var(--sd-ease-standard, cubic-bezier(0.4, 0, 0.2, 1)), opacity 0.2s; }';
  assert.deepEqual(
    literalFindings('components/x/x.scss', source).map(f => `${f.text} -> ${f.replacement}`),
    ['0.2s -> var(--sd-duration-base)']
  );
});

test('--path limits the scan to one area', () => {
  const findings = scanLibrary({ root, paths: [join(root, 'forms')] });
  assert.deepEqual(summary(findings), ['forms/input-color/src/input-color.component.scss:1 hex #dddddd']);
});

// The ESLint rule (versions/v19/eslint.config.js) applies the same heuristic to library TS and templates.
test('ESLint rule: reports colour hex in library TS and templates, with the same exemptions', async () => {
  const { ESLint } = createRequire(join(V19, 'package.json'))('eslint');
  const eslint = new ESLint({ cwd: V19, overrideConfigFile: join(V19, 'projects/sdcorejs-angular/eslint.config.js') });
  const hexLines = async (rel, code) => {
    const [result] = await eslint.lintText(code, { filePath: join(V19, 'projects/sdcorejs-angular', rel) });
    return [...new Set(result.messages.filter(m => m.ruleId === 'no-restricted-syntax').map(m => m.line))];
  };

  const ts = [
    "import { Component } from '@angular/core';",
    "export const accent = '#1abc9c';", // 2: string that is a colour -> reported
    'export const style = { color: "#fff" };', // 3 -> reported
    "export const fallback = 'var(--sd-avatar-tint, #ffffff)';", // var() fallback -> allowed
    'export const css = `.a { background: #fff; }`;', // 5: CSS in a template literal -> reported
    "export const anchor = 'section#main';", // not a colour position -> ignored
    "export const url = 'https://example.com/#abc';",
    "@Component({ selector: 'sd-x', template: '<i style=\"color: #abcdef\"></i>' })", // 8: inline template -> reported
    'export class XComponent {}',
    '',
  ].join('\n');
  assert.deepEqual(await hexLines('components/x/x.component.ts', ts), [2, 3, 5, 8]);

  const html = [
    '<svg><path fill="#e5e9ed"></path></svg>', // 1 -> reported
    '<div [style.color]="\'#abc\'"></div>', // 2 -> reported
    '<div [ngStyle]="{ border: \'2px solid var(--sd-primary, #005cbb)\' }"></div>', // fallback -> allowed
    '<a href="#fade">anchor</a>', // anchor, not a colour
    '<span>&#183; x</span>', // character reference, not a colour
    '',
  ].join('\n');
  assert.deepEqual(await hexLines('components/x/x.component.html', html), [1, 2]);

  // Exempt like the scanner: specs, generated files, input-color data values; plus the static Keycloak
  // fallback page, which is served outside the app and never has the theme.
  assert.deepEqual(await hexLines('components/x/x.component.spec.ts', "export const v = '#123456';\n"), []);
  assert.deepEqual(await hexLines('components/x/icons.generated.ts', "export const ICON = '#abcdef';\n"), []);
  assert.deepEqual(await hexLines('forms/input-color/src/input-color.component.ts', "export const EMPTY = '#000000';\n"), []);
  assert.deepEqual(await hexLines('forms/input-color/src/input-color.component.html', '<input placeholder="#1565C0" />\n'), []);
  assert.deepEqual(await hexLines('modules/keycloak/htmls/auth-keycloak-error.html', '<p style="color: #1f2937">x</p>\n'), []);
});

test('CLI: check mode exits 1 on findings, --report exits 0, a clean area exits 0', () => {
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, '--root', root, ...args], { encoding: 'utf8' });
  const check = run();
  assert.equal(check.status, 1);
  assert.match(check.stdout, /6 finding\(s\): 4 hex, 2 focus/);
  assert.equal(run('--report').status, 0);
  assert.equal(run('--path', join(root, 'assets')).status, 0);
});

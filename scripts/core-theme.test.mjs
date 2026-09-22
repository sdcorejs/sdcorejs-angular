import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const sass = require('sass');
const loadPaths = [fileURLToPath(new URL('../versions/v19/projects/sdcorejs-angular/assets/scss', import.meta.url))];
const compile = source => sass.compileString(`@use 'themes/default' as sd; ${source}`, { loadPaths }).css;

test('Core colors are independent and consumer overrides win within their scope', () => {
  const css = compile(`html { @include sd.theme(); }
    .customer { @include sd.theme((primary: #ae7129, surface: #ffffff)); }`);
  assert.doesNotMatch(css, /var\(--mat-sys-/);
  assert.match(css, /html\s*\{[^}]*--sd-primary: #005cbb;/);
  assert.match(css, /html\s*\{[^}]*--sd-surface: #fdfbff;/);
  assert.match(css, /\.customer\s*\{[^}]*--sd-primary: #ae7129;/);
  assert.match(css, /\.customer\s*\{[^}]*--sd-surface: #ffffff;/);
  assert.match(css, /--sd-primary-light: color-mix\(in srgb, var\(--sd-primary\)/);
});

test('Material compatibility is opt-in and explicit overrides still win', () => {
  const css = compile(`.legacy { @include sd.theme($source: 'material'); }
    .custom { @include sd.theme((primary: #ae7129), $source: 'material'); }`);
  assert.match(css, /\.legacy\s*\{[^}]*--sd-primary: var\(--mat-sys-primary, #005cbb\);/);
  assert.match(css, /\.legacy\s*\{[^}]*--sd-surface: var\(--mat-sys-surface, #fdfbff\);/);
  assert.match(css, /\.custom\s*\{[^}]*--sd-primary: #ae7129;/);
});

test('Unknown theme sources fail instead of silently choosing another palette', () => {
  assert.throws(() => compile(`html { @include sd.theme($source: 'typo'); }`), /Unknown Core UI theme source/);
});

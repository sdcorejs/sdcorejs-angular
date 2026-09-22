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

const expected = {
  ocean: ['#005cbb', '#f1f5f9'], indigo: ['#4f46e5', '#f4f4fa'],
  teal: ['#0f766e', '#f0f7f6'], copper: ['#9a6324', '#f4f2f1'],
  slate: ['#475569', '#f5f6f8'], forest: ['#356447', '#f3f6f0'],
  plum: ['#7b3f80', '#f7f3f8'], rose: ['#a33d62', '#faf4f5'],
};
const tokens = css => Object.fromEntries([...css.matchAll(/--sd-([\w-]+): ([^;]+);/g)].map(m => [m[1], m[2]]));
const luminance = hex => {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

for (const [name, [primary, surfaceMuted]] of Object.entries(expected)) {
  test(`${name}: complete independent palette, stable semantic colors and readable text`, () => {
    const baseline = tokens(compile('html { @include sd.theme(); }'));
    const css = compile(`html { @include sd.theme($preset: '${name}'); }`);
    const palette = tokens(css);
    assert.doesNotMatch(css, /var\(--mat-sys-/);
    assert.deepEqual(Object.keys(palette).sort(), Object.keys(baseline).sort());
    assert.equal(palette.primary, primary);
    assert.equal(palette.surface, '#ffffff');
    assert.equal(palette['surface-muted'], surfaceMuted);
    for (const key of Object.keys(baseline).filter(k => /^(secondary|info|success|warning|error)(-|$)/.test(k))) {
      assert.equal(palette[key], baseline[key], key);
    }
    assert.ok(contrast(palette.primary, palette['primary-contrast']) >= 4.5, 'button label');
    assert.ok(contrast(palette['primary-dark'], palette['primary-contrast']) >= 4.5, 'hover label');
    for (const bg of [palette.surface, palette['surface-muted']]) {
      assert.ok(contrast(palette.text, bg) >= 4.5, 'body text');
      assert.ok(contrast(palette['text-secondary'], bg) >= 4.5, 'secondary text');
      assert.ok(contrast(palette['border-strong'], bg) >= 3, 'control boundary');
    }
  });
}

test('Default preset and positional source calls remain backward compatible', () => {
  assert.equal(compile('html { @include sd.theme(); }'), compile("html { @include sd.theme($preset: 'default'); }"));
  assert.equal(compile("html { @include sd.theme((), 'material'); }"), compile("html { @include sd.theme($source: 'material'); }"));
});

test('Overrides win over presets and multiple scopes keep separate palettes', () => {
  const css = compile(".one { @include sd.theme((primary: #123456, surface: #fafafa), $preset: 'ocean'); } .two { @include sd.theme($preset: 'rose'); }");
  const one = tokens(css.match(/\.one\s*\{([^}]+)\}/)[1]);
  const two = tokens(css.match(/\.two\s*\{([^}]+)\}/)[1]);
  assert.equal(one.primary, '#123456');
  assert.equal(one.surface, '#fafafa');
  assert.equal(one['primary-light'], '#e6f0fa');
  assert.equal(two.primary, '#a33d62');
  assert.equal(two.surface, '#ffffff');
});

test('Invalid preset and ambiguous Material/preset combinations fail compilation', () => {
  assert.throws(() => compile("html { @include sd.theme($preset: 'oceann'); }"), /Unknown Core UI preset/);
  assert.throws(() => compile("html { @include sd.theme($preset: 'ocean', $source: 'material'); }"), /presets require/);
});

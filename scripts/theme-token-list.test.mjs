import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

// Keeps `SD_COLOR_TOKENS` (utilities/theme) in sync with what `sd.theme()` really emits (AC-032):
// every --sd-* custom property of the theme, minus the non-colour scales and the component tier.

const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const sass = require('sass');
const loadPaths = [
  fileURLToPath(new URL('../versions/v19/projects/sdcorejs-angular/assets/scss', import.meta.url)),
  fileURLToPath(new URL('../versions/v19/node_modules', import.meta.url)),
];
const TOKENS_TS = new URL('../versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.ts', import.meta.url);

const compile = source => sass.compileString(source, { loadPaths }).css;
/** Keys of a Sass map, read back by emitting one class per key. */
const mapKeys = (module, map) =>
  [...compile(`@use 'themes/${module}' as m; @each $name, $v in m.$${map} { .k-#{$name} { a: b; } }`).matchAll(/\.k-([\w-]+)\s*\{/g)].map(
    m => m[1]
  );

const tsTokens = () => {
  const source = readFileSync(TOKENS_TS, 'utf8');
  const body = /export const SD_COLOR_TOKENS = \[([\s\S]*?)\] as const;/.exec(source);
  assert.ok(body, 'SD_COLOR_TOKENS array literal not found');
  return [...body[1].matchAll(/'([\w-]+)'/g)].map(m => m[1]);
};

const themeColorTokens = scheme => {
  const css = compile(`@use 'themes/default' as sd; .x { @include sd.theme($mode: '${scheme}'); }`);
  const all = [...css.matchAll(/--sd-([\w-]+):/g)].map(m => m[1]);
  const excluded = new Set([...mapKeys('scales', 'scales'), ...mapKeys('component-tokens', 'component-tokens')]);
  return [...new Set(all)].filter(name => !excluded.has(name));
};

test('SD_COLOR_TOKENS matches the colour tokens emitted by sd.theme() in light mode', () => {
  assert.deepEqual([...tsTokens()].sort(), themeColorTokens('light').sort());
});

test('dark mode emits the same colour tokens', () => {
  assert.deepEqual(themeColorTokens('dark').sort(), themeColorTokens('light').sort());
});

test('SD_COLOR_TOKENS has no duplicates', () => {
  const tokens = tsTokens();
  assert.equal(new Set(tokens).size, tokens.length);
});

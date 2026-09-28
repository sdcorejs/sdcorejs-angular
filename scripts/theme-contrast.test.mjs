import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

// Contrast matrix for the Core UI themes (R-020, AC-031, VAL-003): the default preset and every named
// preset in light mode, and the default preset in dark mode. Colours are read from the compiled
// `sd.theme()` output and resolved the way the browser does — `var()` references and
// `color-mix(in srgb, …)` — so a formula change is checked, not just the hex values.

const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const sass = require('sass');
const loadPaths = [
  fileURLToPath(new URL('../versions/v19/projects/sdcorejs-angular/assets/scss', import.meta.url)),
  fileURLToPath(new URL('../versions/v19/node_modules', import.meta.url)),
];

const PRESETS = ['default', 'ocean', 'indigo', 'teal', 'copper', 'slate', 'forest', 'plum', 'rose'];
const STATES = ['info', 'success', 'warning', 'error'];

/** [foreground token, background token, minimum ratio] — names without the `--sd-` prefix. */
const PAIRS = [
  ['text', 'surface', 4.5],
  ['text', 'surface-muted', 4.5],
  ['text-secondary', 'surface', 4.5],
  ['text-secondary', 'surface-muted', 4.5],
  ['border-strong', 'surface', 3],
  ['border-strong', 'surface-muted', 3],
  ['focus-ring-color', 'surface', 3],
  ['focus-ring-color', 'surface-muted', 3],
  ['link', 'surface', 4.5],
  ['primary-contrast', 'primary', 4.5],
  ...STATES.map(state => [`status-${state}-fg`, `status-${state}-bg`, 4.5]),
];

const tokensOf = args => {
  const css = sass.compileString(`@use 'themes/default' as sd; .x { @include sd.theme(${args}); }`, { loadPaths }).css;
  return Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
};

/** Splits on commas that are not nested inside parentheses. */
const splitArgs = value => {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += char;
  }
  parts.push(current.trim());
  return parts;
};

const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };

/** Resolves a CSS colour value to [r, g, b] (0–255). */
const resolve = (tokens, value, depth = 0) => {
  assert.ok(depth < 20, `circular value: ${value}`);
  const v = value.trim();
  if (v.startsWith('var(')) {
    const [name, fallback] = splitArgs(v.slice(4, -1));
    const next = tokens[name] ?? fallback;
    assert.ok(next !== undefined, `undefined custom property ${name}`);
    return resolve(tokens, next, depth + 1);
  }
  if (v.startsWith('color-mix(')) {
    const [space, first, second] = splitArgs(v.slice('color-mix('.length, -1));
    assert.equal(space, 'in srgb', `unsupported colour space in ${v}`);
    const m = /^(.*)\s+(\d+(?:\.\d+)?)%$/.exec(first);
    assert.ok(m, `color-mix needs a percentage on the first colour: ${v}`);
    const share = Number(m[2]) / 100;
    const a = resolve(tokens, m[1], depth + 1);
    const b = resolve(tokens, second, depth + 1);
    return a.map((channel, i) => channel * share + b[i] * (1 - share));
  }
  if (v in NAMED) return NAMED[v];
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  assert.ok(hex, `unsupported colour value: ${v}`);
  const full = hex[1].length === 3 ? [...hex[1]].map(c => c + c).join('') : hex[1];
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
};

const luminance = rgb =>
  rgb
    .map(c => c / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Pairs below their minimum, as readable strings. */
const failures = tokens =>
  PAIRS.flatMap(([fg, bg, min]) => {
    const ratio = contrast(resolve(tokens, `var(--sd-${fg})`), resolve(tokens, `var(--sd-${bg})`));
    return ratio >= min ? [] : [`${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`];
  });

for (const preset of PRESETS) {
  test(`light — ${preset}: every text, boundary, focus, link and status pair meets its minimum`, () => {
    assert.deepEqual(failures(tokensOf(`$preset: '${preset}'`)), []);
  });
}

test('dark — default: every text, boundary, focus, link and status pair meets its minimum', () => {
  assert.deepEqual(failures(tokensOf("$mode: 'dark'")), []);
});

test('the matrix fails when a pair is pushed below its threshold', () => {
  const lowered = failures(tokensOf('(text-secondary: #9a9a9a, border-strong: #dcdcdc)'));
  assert.ok(lowered.some(f => f.startsWith('text-secondary on surface:')), lowered.join('\n'));
  assert.ok(lowered.some(f => f.startsWith('border-strong on surface:')), lowered.join('\n'));
  const loweredDark = failures(tokensOf("(text: #3a3b3f), $mode: 'dark'"));
  assert.ok(loweredDark.some(f => f.startsWith('text on surface:')), loweredDark.join('\n'));
});

test('the resolver follows var() chains and color-mix() like the browser', () => {
  const tokens = { '--a': '#000000', '--b': 'var(--a)', '--c': 'color-mix(in srgb, var(--b) 50%, white)' };
  assert.deepEqual(resolve(tokens, 'var(--c)').map(Math.round), [128, 128, 128]);
  assert.deepEqual(resolve(tokens, 'var(--missing, #fff)'), [255, 255, 255]);
});

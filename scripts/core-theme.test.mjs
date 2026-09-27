import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const sass = require('sass');
// why: theme() gọi mat.theme() cho dark mode (D-024), nên cần resolve được `@angular/material` từ node_modules của v19.
const loadPaths = [
  fileURLToPath(new URL('../versions/v19/projects/sdcorejs-angular/assets/scss', import.meta.url)),
  fileURLToPath(new URL('../versions/v19/node_modules', import.meta.url)),
];
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

// ---------------------------------------------------------------------------
// Core UI 3.0 — token tiers, dark mode (D-020..D-024, VAL-001, VAL-002)
// ---------------------------------------------------------------------------

const declarations = css => Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const ruleBody = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing rule ${selector}`);
  return css.slice(start, css.indexOf('\n}', start));
};

// Exact 2.15 output of `sd.theme()` (default preset) — every declaration must survive unchanged.
const V215_DEFAULT = {
  '--mat-form-field-error-trailing-icon-color': 'var(--sd-error, #ba1a1a)',
  '--mat-form-field-error-hover-trailing-icon-color': 'var(--sd-error-dark, color-mix(in srgb, var(--sd-error) 84%, black))',
  '--mat-form-field-error-focus-trailing-icon-color': 'var(--sd-error-dark, color-mix(in srgb, var(--sd-error) 84%, black))',
  '--sd-primary': '#005cbb',
  '--sd-primary-light': 'color-mix(in srgb, var(--sd-primary) 14%, white)',
  '--sd-primary-dark': 'color-mix(in srgb, var(--sd-primary) 84%, black)',
  '--sd-primary-contrast': '#ffffff',
  '--sd-secondary': '#5c6270',
  '--sd-secondary-light': 'color-mix(in srgb, var(--sd-secondary) 12%, white)',
  '--sd-secondary-dark': 'color-mix(in srgb, var(--sd-secondary) 84%, black)',
  '--sd-secondary-contrast': '#ffffff',
  '--sd-info': '#006a6a',
  '--sd-info-light': 'color-mix(in srgb, var(--sd-info) 14%, white)',
  '--sd-info-dark': 'color-mix(in srgb, var(--sd-info) 84%, black)',
  '--sd-info-contrast': '#ffffff',
  '--sd-success': '#2e7d32',
  '--sd-success-light': 'color-mix(in srgb, var(--sd-success) 14%, white)',
  '--sd-success-dark': 'color-mix(in srgb, var(--sd-success) 84%, black)',
  '--sd-success-contrast': '#ffffff',
  '--sd-warning': '#a66300',
  '--sd-warning-light': 'color-mix(in srgb, var(--sd-warning) 14%, white)',
  '--sd-warning-dark': 'color-mix(in srgb, var(--sd-warning) 84%, black)',
  '--sd-warning-contrast': '#ffffff',
  '--sd-error': '#ba1a1a',
  '--sd-error-light': 'color-mix(in srgb, var(--sd-error) 14%, white)',
  '--sd-error-dark': 'color-mix(in srgb, var(--sd-error) 84%, black)',
  '--sd-error-contrast': '#ffffff',
  '--sd-surface': '#fdfbff',
  '--sd-surface-muted': '#e7e8ed',
  '--sd-text': '#1a1b1f',
  '--sd-text-secondary': '#44474f',
  '--sd-text-muted': 'color-mix(in srgb, var(--sd-text) 62%, transparent)',
  '--sd-border': '#c4c6d0',
  '--sd-border-strong': '#74777f',
  '--sd-disabled-bg': 'color-mix(in srgb, var(--sd-text) 8%, transparent)',
  '--sd-disabled-text': 'color-mix(in srgb, var(--sd-text) 60%, transparent)',
};

// 2.15 values of the keys each named preset overrides.
const PRESET_KEYS = ['primary', 'primary-light', 'primary-dark', 'primary-contrast', 'surface', 'surface-muted', 'text', 'text-secondary', 'border', 'border-strong'];
const V215_PRESETS = {
  ocean: '#005cbb #e6f0fa #004a96 #ffffff #ffffff #f1f5f9 #182230 #475569 #cbd5e1 #64748b',
  indigo: '#4f46e5 #eeecfd #3730a3 #ffffff #ffffff #f4f4fa #232238 #56546c #d5d3e3 #76738d',
  teal: '#0f766e #e5f3f1 #115e59 #ffffff #ffffff #f0f7f6 #18302d #47635f #c9dcd8 #637f79',
  copper: '#9a6324 #f8efe4 #6b4414 #ffffff #ffffff #f4f2f1 #302820 #665a4d #dcd3c9 #8c7a67',
  slate: '#475569 #e9edf2 #334155 #ffffff #ffffff #f5f6f8 #1e293b #526174 #cdd4dd #6b7a8e',
  forest: '#356447 #e8f0e9 #244831 #ffffff #ffffff #f3f6f0 #253128 #53634f #cfd9c9 #72826c',
  plum: '#7b3f80 #f2eaf4 #592b60 #ffffff #ffffff #f7f3f8 #302334 #68576d #dccfdf #8c7492',
  rose: '#a33d62 #faeaf0 #7d2849 #ffffff #ffffff #faf4f5 #35262c #70565f #e1cfd6 #997480',
};

const RAMP_FAMILIES = ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral'];
const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

test('VAL-001: without $mode every 2.15 declaration keeps its exact value', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  for (const [name, value] of Object.entries(V215_DEFAULT)) assert.equal(light[name], value, name);
});

test('VAL-001: named presets keep their 2.15 values, -light/-dark/-contrast included', () => {
  for (const [preset, values] of Object.entries(V215_PRESETS)) {
    const palette = declarations(compile(`.x { @include sd.theme($preset: '${preset}'); }`));
    values.split(' ').forEach((value, i) => assert.equal(palette[`--sd-${PRESET_KEYS[i]}`], value, `${preset} ${PRESET_KEYS[i]}`));
    for (const family of ['secondary', 'info', 'success', 'warning', 'error']) {
      for (const suffix of ['-light', '-dark', '-contrast']) {
        assert.equal(palette[`--sd-${family}${suffix}`], V215_DEFAULT[`--sd-${family}${suffix}`], `${preset} ${family}${suffix}`);
      }
    }
  }
});

test('VAL-001: only additions — no module-level output, new declarations are --sd-* custom properties', () => {
  // Importing the module still emits the colour utilities (as in 2.15), but no longer a :root block.
  assert.doesNotMatch(compile(''), /:root|--mat-form-field/, 'the Material form-field variables moved into theme()');
  const light = declarations(compile('.x { @include sd.theme(); }'));
  for (const name of Object.keys(light).filter(n => !(n in V215_DEFAULT))) assert.match(name, /^--sd-/, name);
  // The Material form-field variables moved from :root into theme(), so every scope re-declares them.
  assert.match(ruleBody(compile('.scope { @include sd.theme(); }'), '.scope'), /--mat-form-field-error-trailing-icon-color: var\(--sd-error, #ba1a1a\);/);
});

test('Ramps: 7 families x 11 steps generated at runtime with color-mix', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  for (const family of RAMP_FAMILIES) {
    for (const step of RAMP_STEPS) assert.ok(light[`--sd-${family}-${step}`], `--sd-${family}-${step}`);
  }
  for (const family of RAMP_FAMILIES.filter(f => f !== 'neutral')) {
    assert.equal(light[`--sd-${family}-500`], `var(--sd-${family})`);
    assert.match(light[`--sd-${family}-50`], new RegExp(`^color-mix\\(in srgb, var\\(--sd-${family}\\) \\d+%, white\\)$`));
    assert.match(light[`--sd-${family}-950`], new RegExp(`^color-mix\\(in srgb, var\\(--sd-${family}\\) \\d+%, black\\)$`));
  }
});

test('Semantic tier maps roles onto the public palette', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  for (const state of ['info', 'success', 'warning', 'error']) {
    assert.equal(light[`--sd-status-${state}-bg`], `var(--sd-${state}-light)`);
    assert.equal(light[`--sd-status-${state}-fg`], `var(--sd-${state}-dark)`);
  }
  assert.equal(light['--sd-link'], 'var(--sd-primary)');
  assert.equal(light['--sd-surface-inverse'], 'var(--sd-text)');
  assert.equal(light['--sd-text-on-solid'], 'var(--sd-primary-contrast)');
  assert.equal(light['--sd-border-focus'], 'var(--sd-primary)');
  assert.equal(light['--sd-border-danger'], 'var(--sd-error)');
  assert.ok(light['--sd-overlay-backdrop']);
  assert.equal(light['--sd-focus-ring-color'], 'var(--sd-primary)');
  assert.equal(light['--sd-focus-ring-width'], '2px');
  assert.equal(light['--sd-focus-ring-offset'], '2px');
});

test('Scale tier exposes space, radius, shadow, z-index, motion and typography', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  assert.equal(light['--sd-space-8'], '8px');
  assert.equal(light['--sd-radius-4'], '4px');
  assert.equal(light['--sd-radius-999'], '999px');
  assert.match(light['--sd-shadow-md'], /^0px 2px 4px -1px rgba\(0, 0, 0, 0\.2\)/);
  assert.equal(light['--sd-z-dropdown'], '1000');
  assert.equal(light['--sd-duration-fast'], '120ms');
  assert.equal(light['--sd-ease-standard'], 'cubic-bezier(0.4, 0, 0.2, 1)');
  assert.equal(light['--sd-font-size-13'], '13px');
  assert.equal(light['--sd-font-weight-medium'], '500');
  assert.equal(light['--sd-line-height-20'], '20px');
});

test('VAL-002: dark re-declares every light declaration, adds color-scheme and Material dark colors', () => {
  const lightCss = compile('.l { @include sd.theme(); }');
  const darkCss = compile(".d { @include sd.theme($mode: 'dark'); }");
  const light = declarations(lightCss);
  const dark = declarations(darkCss);
  for (const name of Object.keys(light)) assert.ok(name in dark, `dark scope misses ${name}`);
  assert.equal(dark['--sd-surface'], '#121316');
  assert.equal(dark['--sd-text'], '#e3e2e6');
  assert.equal(dark['--sd-primary-light'], 'color-mix(in srgb, var(--sd-primary) 16%, var(--sd-surface))');
  assert.equal(dark['--sd-primary-dark'], 'color-mix(in srgb, var(--sd-primary) 72%, white)');
  assert.match(ruleBody(darkCss, '.d'), /color-scheme: dark;/);
  assert.ok(dark['--mat-sys-primary'], 'Material dark color tokens');
  assert.doesNotMatch(lightCss, /--mat-sys-|color-scheme/);
});

test('Component tokens exist in both modes with the 2.15 hex as the light value', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  const dark = declarations(compile(".x { @include sd.theme($mode: 'dark'); }"));
  const lightSd = Object.keys(light).filter(n => n.startsWith('--sd-')).sort();
  const darkSd = Object.keys(dark).filter(n => n.startsWith('--sd-')).sort();
  assert.deepEqual(darkSd, lightSd);
  assert.equal(light['--sd-query-bar-bg'], '#ffffff');
  assert.equal(dark['--sd-query-bar-bg'], '#1d1f23');
  assert.equal(light['--sd-code-editor-bg'], dark['--sd-code-editor-bg'], 'always-dark surfaces keep one value');
  assert.equal(light['--sd-tooltip-bg'], '#616161');
});

test('auto mode: light on the scope plus a prefers-color-scheme block that respects data-sd-theme="light"', () => {
  const css = compile("html { @include sd.theme($mode: 'auto'); }");
  assert.match(ruleBody(css, 'html'), /--sd-surface: #fdfbff;/);
  const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
  assert.match(media, /^@media \(prefers-color-scheme: dark\) \{\s*html:not\(\[data-sd-theme=["']?light["']?\]\) \{/);
  assert.match(media, /--sd-surface: #121316;/);
  assert.match(media, /color-scheme: dark;/);
});

test('Only the default preset has a dark palette; named presets fail with guidance', () => {
  for (const mode of ['dark', 'auto']) {
    assert.throws(() => compile(`.x { @include sd.theme($preset: 'ocean', $mode: '${mode}'); }`), /only has a light palette/);
  }
  assert.throws(() => compile(".x { @include sd.theme($mode: 'dim'); }"), /Unknown Core UI theme mode/);
});

test('Consumer overrides apply on top of the default dark palette', () => {
  const dark = declarations(compile(".x { @include sd.theme((primary: #123456), $mode: 'dark'); }"));
  assert.equal(dark['--sd-primary'], '#123456');
  assert.equal(dark['--sd-surface'], '#121316');
});

test('sd-core ships opt-in [data-sd-theme] blocks for the default preset', () => {
  const css = sass.compile(fileURLToPath(new URL('../versions/v19/projects/sdcorejs-angular/assets/scss/sd-core.scss', import.meta.url)), { loadPaths }).css;
  const dark = ruleBody(css, '[data-sd-theme=dark]');
  assert.match(dark, /--sd-surface: #121316;/);
  assert.match(dark, /color-scheme: dark;/);
  const light = ruleBody(css, '[data-sd-theme=light]');
  assert.match(light, /--sd-surface: #fdfbff;/);
  assert.match(light, /color-scheme: light;/);
});

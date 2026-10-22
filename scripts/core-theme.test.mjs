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
  graphite: ['#16181d', '#f3f4f7'],
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

// Exact values of the keys each named preset overrides: the eight 2.15 presets, then `graphite` (Sidebar V4
// handoff, R-010) with its README palette and the default white primary-contrast.
const PRESET_KEYS = ['primary', 'primary-light', 'primary-dark', 'primary-contrast', 'surface', 'surface-muted', 'text', 'text-secondary', 'border', 'border-strong'];
const PRESET_PALETTES = {
  ocean: '#005cbb #e6f0fa #004a96 #ffffff #ffffff #f1f5f9 #182230 #475569 #cbd5e1 #64748b',
  indigo: '#4f46e5 #eeecfd #3730a3 #ffffff #ffffff #f4f4fa #232238 #56546c #d5d3e3 #76738d',
  teal: '#0f766e #e5f3f1 #115e59 #ffffff #ffffff #f0f7f6 #18302d #47635f #c9dcd8 #637f79',
  copper: '#9a6324 #f8efe4 #6b4414 #ffffff #ffffff #f4f2f1 #302820 #665a4d #dcd3c9 #8c7a67',
  slate: '#475569 #e9edf2 #334155 #ffffff #ffffff #f5f6f8 #1e293b #526174 #cdd4dd #6b7a8e',
  forest: '#356447 #e8f0e9 #244831 #ffffff #ffffff #f3f6f0 #253128 #53634f #cfd9c9 #72826c',
  plum: '#7b3f80 #f2eaf4 #592b60 #ffffff #ffffff #f7f3f8 #302334 #68576d #dccfdf #8c7492',
  rose: '#a33d62 #faeaf0 #7d2849 #ffffff #ffffff #faf4f5 #35262c #70565f #e1cfd6 #997480',
  graphite: '#16181d #e3e5ea #0b0c0f #ffffff #ffffff #f3f4f7 #16181d #5a606b #dadde3 #737985',
};

const RAMP_FAMILIES = ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral'];
const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

test('VAL-001: without $mode every 2.15 declaration keeps its exact value', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  for (const [name, value] of Object.entries(V215_DEFAULT)) assert.equal(light[name], value, name);
});

test('VAL-001, AC-020: named presets keep their exact palette values, -light/-dark/-contrast included', () => {
  for (const [preset, values] of Object.entries(PRESET_PALETTES)) {
    const palette = declarations(compile(`.x { @include sd.theme($preset: '${preset}'); }`));
    values.split(' ').forEach((value, i) => assert.equal(palette[`--sd-${PRESET_KEYS[i]}`], value, `${preset} ${PRESET_KEYS[i]}`));
    for (const family of ['secondary', 'info', 'success', 'warning', 'error']) {
      for (const suffix of ['-light', '-dark', '-contrast']) {
        assert.equal(palette[`--sd-${family}${suffix}`], V215_DEFAULT[`--sd-${family}${suffix}`], `${preset} ${family}${suffix}`);
      }
    }
  }
});

test('VAL-001: only additions — no module-level output, new declarations are --sd-* or Material tokens mapped to one', () => {
  // Importing the module still emits the colour utilities (as in 2.15), but no longer a :root block.
  assert.doesNotMatch(compile(''), /:root|--mat-form-field/, 'the Material form-field variables moved into theme()');
  const light = declarations(compile('.x { @include sd.theme(); }'));
  for (const name of Object.keys(light).filter(n => !(n in V215_DEFAULT))) {
    // The Material tier (themes/_material-tokens.scss) only points Material tokens at a Core token.
    if (/^--(mat|mdc)-/.test(name)) assert.match(light[name], /^var\(--sd-[\w-]+\)$/, name);
    else assert.match(name, /^--sd-/, name);
  }
  // The Material form-field variables moved from :root into theme(), so every scope re-declares them.
  assert.match(ruleBody(compile('.scope { @include sd.theme(); }'), '.scope'), /--mat-form-field-error-trailing-icon-color: var\(--sd-error, #ba1a1a\);/);
});

test('Material tier: focus and selection use the primary, an error reddens only the outline', () => {
  for (const mode of ['light', 'dark']) {
    const tokens = declarations(compile(`.x { @include sd.theme($mode: '${mode}'); }`));
    // Material 19 names first, Material 20+ names second: one source ships to every Angular major.
    for (const prefix of ['--mdc-outlined-text-field-', '--mat-form-field-outlined-']) {
      assert.equal(tokens[`${prefix}container-shape`], 'var(--sd-control-radius)', `${mode} ${prefix}container-shape`);
      assert.equal(tokens[`${prefix}outline-color`], 'var(--sd-control-border)', `${mode} ${prefix}outline-color`);
      assert.equal(tokens[`${prefix}hover-outline-color`], 'var(--sd-control-border-hover)', `${mode} ${prefix}hover-outline-color`);
      assert.equal(tokens[`${prefix}disabled-outline-color`], 'var(--sd-control-border-disabled)', `${mode} ${prefix}disabled-outline-color`);
      assert.equal(tokens[`${prefix}focus-outline-color`], 'var(--sd-primary)', `${mode} ${prefix}focus-outline-color`);
      assert.equal(tokens[`${prefix}focus-label-text-color`], 'var(--sd-primary)', `${mode} ${prefix}focus-label-text-color`);
      assert.equal(tokens[`${prefix}error-outline-color`], 'var(--sd-error)', `${mode} ${prefix}error-outline-color`);
      assert.equal(tokens[`${prefix}error-label-text-color`], 'var(--sd-text-secondary)', `${mode} ${prefix}error-label-text-color`);
      for (const state of ['', 'hover-', 'focus-']) {
        assert.equal(tokens[`${prefix}error-${state}label-text-color`], tokens[`${prefix}${state}label-text-color`], `${mode} ${prefix}error-${state}label`);
      }
    }
    for (const prefix of ['--mdc-filled-text-field-', '--mat-form-field-filled-']) {
      assert.equal(tokens[`${prefix}focus-active-indicator-color`], 'var(--sd-primary)', `${mode} ${prefix}focus-active-indicator-color`);
      assert.equal(tokens[`${prefix}error-label-text-color`], tokens[`${prefix}label-text-color`], `${mode} ${prefix}error-label`);
    }
    assert.equal(tokens['--mat-select-invalid-arrow-color'], 'var(--sd-text-secondary)');
    assert.equal(tokens['--mat-option-selected-state-label-text-color'], 'var(--sd-primary)');
    assert.equal(tokens['--mat-full-pseudo-checkbox-selected-icon-color'], 'var(--sd-primary)');
    assert.equal(tokens['--mat-pseudo-checkbox-full-selected-icon-color'], 'var(--sd-primary)');
    assert.equal(tokens['--mat-datepicker-calendar-date-selected-state-background-color'], 'var(--sd-primary)');
    assert.equal(tokens['--mat-datepicker-calendar-container-shape'], 'var(--sd-panel-radius)');
    // Unselected checkbox / radio / pseudo-checkbox: border-strong at rest, text-secondary on hover and focus.
    for (const prefix of ['--mdc-checkbox-', '--mat-checkbox-', '--mdc-radio-', '--mat-radio-']) {
      assert.equal(tokens[`${prefix}unselected-icon-color`], 'var(--sd-border-strong)', `${mode} ${prefix}unselected-icon-color`);
      assert.equal(tokens[`${prefix}unselected-hover-icon-color`], 'var(--sd-text-secondary)', `${mode} ${prefix}unselected-hover`);
      assert.equal(tokens[`${prefix}unselected-focus-icon-color`], 'var(--sd-text-secondary)', `${mode} ${prefix}unselected-focus`);
    }
    for (const prefix of ['--mat-full-pseudo-checkbox-', '--mat-pseudo-checkbox-full-']) {
      assert.equal(tokens[`${prefix}unselected-icon-color`], 'var(--sd-border-strong)', `${mode} ${prefix}unselected-icon-color`);
    }
  }
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
  for (const mode of ['light', 'dark']) {
    // One set of control expressions for light and dark: they only reference the palette of the scope.
    const tokens = declarations(compile(`.x { @include sd.theme($mode: '${mode}'); }`));
    assert.equal(tokens['--sd-control-border'], 'color-mix(in srgb, var(--sd-border-strong) 82%, var(--sd-surface))', mode);
    assert.equal(tokens['--sd-control-border-hover'], 'var(--sd-border-strong)', mode);
    assert.equal(tokens['--sd-control-border-focus'], 'var(--sd-border-focus)', mode);
    assert.equal(tokens['--sd-control-border-disabled'], 'var(--sd-border)', mode);
    assert.equal(tokens['--sd-control-ring'], '0 0 0 3px color-mix(in srgb, var(--sd-focus-ring-color) 20%, transparent)', mode);
    assert.equal(tokens['--sd-control-ring-error'], '0 0 0 3px color-mix(in srgb, var(--sd-error) 18%, transparent)', mode);
    assert.equal(tokens['--sd-control-bg-disabled'], 'var(--sd-disabled-bg)', mode);
  }
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
  assert.equal(light['--sd-control-height-sm'], '32px');
  assert.equal(light['--sd-control-height-md'], '40px');
  assert.equal(light['--sd-control-height-lg'], '48px');
  assert.equal(light['--sd-control-height-coarse'], '44px');
  assert.equal(light['--sd-control-radius'], '8px');
  assert.equal(light['--sd-panel-radius'], '10px');
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

// Wave 2 · F: the sd-button indicator ring separates it from the button with the page surface.
test('Button indicator ring is the page surface in light and dark', () => {
  for (const mode of ['light', 'dark']) {
    const tokens = declarations(compile(`.x { @include sd.theme($mode: '${mode}'); }`));
    assert.equal(tokens['--sd-button-indicator-ring'], 'var(--sd-surface)', mode);
  }
});

// Wave 3 · 2a: the ring around the sd-avatar status dot separates it from the avatar with the page surface.
test('Avatar status ring is the page surface in light and dark', () => {
  for (const mode of ['light', 'dark']) {
    const tokens = declarations(compile(`.x { @include sd.theme($mode: '${mode}'); }`));
    assert.equal(tokens['--sd-avatar-status-ring'], 'var(--sd-surface)', mode);
  }
});

// Wave 1 · sd-kanban: neutral lanes and drop target derived from the palette, one expression for light and dark.
const KANBAN_TOKENS = {
  '--sd-kanban-lane-bg': 'color-mix(in srgb, var(--sd-text) 4%, var(--sd-surface))',
  '--sd-kanban-lane-target-bg': 'color-mix(in srgb, var(--sd-primary) 6%, var(--sd-surface))',
  '--sd-kanban-lane-target-border': 'color-mix(in srgb, var(--sd-primary) 45%, var(--sd-surface))',
  '--sd-kanban-drop-slot-border': 'color-mix(in srgb, var(--sd-primary) 55%, var(--sd-surface))',
  '--sd-kanban-card-border': 'color-mix(in srgb, var(--sd-border) 80%, var(--sd-surface))',
  '--sd-kanban-card-hover-border': 'color-mix(in srgb, var(--sd-border-strong) 70%, var(--sd-surface))',
};

test('Kanban tokens derive from the palette with one expression in light and dark', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  const dark = declarations(compile(".x { @include sd.theme($mode: 'dark'); }"));
  for (const [name, value] of Object.entries(KANBAN_TOKENS)) {
    assert.equal(light[name], value, `light ${name}`);
    assert.equal(dark[name], value, `dark ${name}`);
  }
});

// Wave 1 · C: table colours derive from the palette, mixed with --sd-table-bg (not surface), and use the
// same expression in light and dark. table-bg, the tree levels and the export panel keep their values.
const TABLE_DERIVED_TOKENS = {
  '--sd-table-header-bg': 'color-mix(in srgb, var(--sd-surface-muted) 50%, var(--sd-table-bg))',
  '--sd-table-header-text': 'var(--sd-text)',
  '--sd-table-group-header-mix': 'var(--sd-table-header-bg)',
  '--sd-table-row-divider': 'color-mix(in srgb, var(--sd-border) 45%, var(--sd-table-bg))',
  '--sd-table-row-hover-bg': 'color-mix(in srgb, var(--sd-text) 4%, var(--sd-table-bg))',
  '--sd-table-row-selected-bg': 'color-mix(in srgb, var(--sd-primary) 9%, var(--sd-table-bg))',
  '--sd-table-row-activated-bg': 'color-mix(in srgb, var(--sd-primary) 14%, var(--sd-table-bg))',
  '--sd-table-group-row-bg': 'color-mix(in srgb, var(--sd-primary) 4%, var(--sd-table-bg))',
  '--sd-table-group-row-border': 'var(--sd-table-row-divider)',
  '--sd-table-select-arrow': 'var(--sd-text-secondary)',
  '--sd-table-spinner': 'var(--sd-primary)',
};

test('Table tokens derive from the palette and --sd-table-bg with one expression in light and dark', () => {
  const light = declarations(compile('.x { @include sd.theme(); }'));
  const dark = declarations(compile(".x { @include sd.theme($mode: 'dark'); }"));
  for (const [name, value] of Object.entries(TABLE_DERIVED_TOKENS)) {
    assert.equal(light[name], value, `light ${name}`);
    assert.equal(dark[name], value, `dark ${name}`);
  }
  assert.equal(light['--sd-table-bg'], '#ffffff');
  assert.equal(dark['--sd-table-bg'], '#1d1f23');
  assert.equal(light['--sd-table-tree-level-0-bg'], '#fbfcfe');
  assert.equal(light['--sd-table-export-panel-bg'], '#f6f6f6');
});

// ---------------------------------------------------------------------------
// Sidebar V4 colour tokens and preset component overrides (R-005, R-011; D-006, D-007, D-029; INV-007, INV-008)
// ---------------------------------------------------------------------------

// Same expression in light and dark: each value is resolved against the palette of its own scope.
const SIDEBAR_V4_COLOUR_TOKENS = {
  '--sd-sidebar-v4-bg': 'color-mix(in srgb, var(--sd-text) 4%, var(--sd-surface))',
  '--sd-sidebar-v4-line': 'color-mix(in srgb, var(--sd-border) 45%, var(--sd-surface))',
  '--sd-sidebar-v4-hover-bg': 'color-mix(in srgb, var(--sd-text) 6%, var(--sd-sidebar-v4-bg))',
  '--sd-sidebar-v4-active-bg': 'var(--sd-primary-light)',
  '--sd-sidebar-v4-active-shadow': 'none',
  '--sd-sidebar-v4-active-ink': 'var(--sd-primary)',
  '--sd-sidebar-v4-avatar-bg': 'color-mix(in srgb, var(--sd-primary) 14%, var(--sd-surface))',
  '--sd-sidebar-v4-avatar-ink': 'var(--sd-primary)',
  '--sd-sidebar-v4-attention': 'var(--sd-warning)',
  '--sd-sidebar-v4-live': 'var(--sd-success)',
};
const GRAPHITE_ACTIVE_SHADOW = '0 0 0 1px var(--sd-border), 0 1px 2px rgba(20, 22, 28, 0.06)';
const sdKeys = css => Object.keys(declarations(css)).filter(n => n.startsWith('--sd-')).sort();
const compileComponentTokens = source => sass.compileString(`@use 'themes/component-tokens' as ct; ${source}`, { loadPaths }).css;

test('AC-013: the default theme emits every Sidebar V4 colour token in light and dark, and no size token', () => {
  for (const mode of ['light', 'dark']) {
    const theme = declarations(compile(`.x { @include sd.theme($mode: '${mode}'); }`));
    for (const [name, value] of Object.entries(SIDEBAR_V4_COLOUR_TOKENS)) assert.equal(theme[name], value, `${mode} ${name}`);
    // D-006: sizes follow density, itemShape and the pointer, so they are declared on the .sd-sidebar-v4 host.
    assert.deepEqual(Object.keys(theme).filter(n => /^--sd-sidebar-v4-.*(width|height|radius)$/.test(n)), [], `${mode} size tokens`);
  }
});

test('INV-007, AC-021: every named preset emits the same --sd-* key set, Sidebar V4 colour tokens included', () => {
  const baseline = sdKeys(compile('.x { @include sd.theme(); }'));
  for (const name of Object.keys(SIDEBAR_V4_COLOUR_TOKENS)) assert.ok(baseline.includes(name), name);
  for (const preset of Object.keys(PRESET_PALETTES)) {
    assert.deepEqual(sdKeys(compile(`.x { @include sd.theme($preset: '${preset}'); }`)), baseline, preset);
  }
});

test('AC-021: graphite raises the active V4 item through its components map, other presets keep the defaults', () => {
  const graphite = declarations(compile(".x { @include sd.theme($preset: 'graphite'); }"));
  assert.equal(graphite['--sd-sidebar-v4-active-bg'], 'var(--sd-surface)');
  assert.equal(graphite['--sd-sidebar-v4-active-shadow'], GRAPHITE_ACTIVE_SHADOW, 'the whole box-shadow list');
  for (const [name, value] of Object.entries(SIDEBAR_V4_COLOUR_TOKENS).filter(([n]) => !/-active-(bg|shadow)$/.test(n))) {
    assert.equal(graphite[name], value, `graphite ${name}`);
  }
  for (const args of ['', "$preset: 'default'", "$preset: 'ocean'"]) {
    const theme = declarations(compile(`.x { @include sd.theme(${args}); }`));
    assert.equal(theme['--sd-sidebar-v4-active-bg'], 'var(--sd-primary-light)', args || 'no arguments');
    assert.equal(theme['--sd-sidebar-v4-active-shadow'], 'none', args || 'no arguments');
  }
});

test('D-029, INV-008: component-token overrides are validated, then replace the default value as-is', () => {
  // $presets is not configurable from outside, so the unknown-key path is proved on the shared emitter.
  assert.throws(
    () => compileComponentTokens('.x { @include ct.emit(light, (unknown-token: red)); }'),
    /Unknown Core UI component token 'unknown-token'/
  );
  const overridden = declarations(compileComponentTokens(
    `.x { @include ct.emit(light, (sidebar-v4-live: red, sidebar-v4-active-shadow: (${GRAPHITE_ACTIVE_SHADOW}))); }`
  ));
  assert.equal(overridden['--sd-sidebar-v4-live'], 'red');
  assert.equal(overridden['--sd-sidebar-v4-active-shadow'], GRAPHITE_ACTIVE_SHADOW);
  assert.equal(overridden['--sd-sidebar-v4-bg'], SIDEBAR_V4_COLOUR_TOKENS['--sd-sidebar-v4-bg'], 'keys without an override keep their default');
  assert.equal(compileComponentTokens('.x { @include ct.emit(dark); }'), compileComponentTokens('.x { @include ct.emit(dark, ()); }'));
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
  for (const preset of ['ocean', 'graphite']) {
    for (const mode of ['dark', 'auto']) {
      assert.throws(() => compile(`.x { @include sd.theme($preset: '${preset}', $mode: '${mode}'); }`), /only has a light palette/, `${preset} ${mode}`);
    }
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

// The three record overlays share a semantic surface; a palette change must reach their chrome.
const componentCss = name => sass.compile(fileURLToPath(new URL(
  `../versions/v19/projects/sdcorejs-angular/components/${name}/src/${name}.component.scss`, import.meta.url
)), { loadPaths }).css;
const selectorDeclarations = (css, selector) => Object.assign({}, ...[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(m => m[1].split(',').some(s => s.trim() === selector))
  .map(m => Object.fromEntries([...m[2].matchAll(/(--[\w-]+|background(?:-color)?):\s*([^;]+);/g)]
    .map(d => [d[1], d[2].trim()]))));
const resolveSurface = (tokens, value, depth = 0) => {
  assert.ok(depth < 20, 'surface token cycle');
  const match = /^var\((--[\w-]+)(?:,\s*(.*))?\)$/.exec(value);
  return match ? resolveSurface(tokens, tokens[match[1]] ?? match[2], depth + 1) : value;
};

for (const mode of ['light', 'dark']) {
  test(`Window/Modal/Drawer surface and chrome follow the shared ${mode} theme`, () => {
    const theme = declarations(compile(`.x { @include sd.theme($mode: '${mode}'); }`));
    const expected = mode === 'light' ? '#fdfbff' : '#121316';
    for (const [component, root, header, footer] of [
      ['window', '.modal-resizable', '.modal-resizable__header', '.modal-resizable__footer'],
      ['modal', '.sd-modal-root', '.sd-modal-header', '.sd-modal-footer'],
      ['side-drawer', '.sd-side-drawer', '.sd-side-drawer-header', '.sd-side-drawer-footer'],
    ]) {
      const css = componentCss(component);
      const rootStyles = selectorDeclarations(css, root);
      const panelStyles = component === 'modal' ? selectorDeclarations(css, '.sd-modal-panel') : {};
      const tokens = { ...theme, ...panelStyles, ...rootStyles };
      const rootBg = rootStyles.background ?? rootStyles['background-color'];
      assert.equal(resolveSurface(tokens, rootBg), expected, `${component} root`);
      for (const region of [header, footer]) {
        const styles = selectorDeclarations(css, region);
        assert.equal(resolveSurface(tokens, styles.background ?? styles['background-color'] ?? rootBg), expected, region);
      }
    }
  });
}

test('Window surface hooks follow consumer palettes while preserving legacy overrides', () => {
  const theme = declarations(compile('.x { @include sd.theme((surface: #ffeecc)); }'));
  // Unset canonical hooks avoid aliases being computed/inherited at the theme root before local overrides.
  assert.equal(theme['--sd-window-surface'], undefined);
  const css = componentCss('window');
  const body = selectorDeclarations(css, '.modal-resizable').background;
  const header = selectorDeclarations(css, '.modal-resizable__header').background;
  assert.equal(resolveSurface(theme, body), '#ffeecc');
  assert.equal(resolveSurface(theme, header), '#ffeecc');
  const legacy = { ...theme, '--sd-modal-resizable-bg': '#123456', '--sd-modal-resizable-header-bg': '#345678' };
  assert.equal(resolveSurface(legacy, body), '#123456');
  assert.equal(resolveSurface(legacy, header), '#345678');
  const modern = { ...legacy, '--sd-window-surface': '#654321' };
  assert.equal(resolveSurface(modern, body), '#654321');
  assert.equal(resolveSurface(modern, header), '#654321');
});

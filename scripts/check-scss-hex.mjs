#!/usr/bin/env node
// Token guard for the Core UI library (R-018, D-016, D-031, INV-007). No dependencies.
//
// Reports:
//   - hex    : a raw hex colour in SCSS, or a colour-looking hex literal in TypeScript;
//   - focus  : an `outline` / `outline-color` inside a :focus / :focus-visible / :focus-within rule whose
//              colour does not come from the focus-ring token (`var(--sd-focus-ring-color)`, a component
//              focus-ring token such as `var(--sd-preview-pdf-focus-ring)`) or `currentColor`.
// Exempt: `assets/scss/themes/**` (where colours are declared), `*.generated.ts`, `*.spec.ts`, the data
// values of `forms/input-color` (TypeScript), and `var(--x, #hex)` fallbacks.
//
// Usage:
//   node scripts/check-scss-hex.mjs                      # check the whole library, exit 1 on findings
//   node scripts/check-scss-hex.mjs --report             # list findings, always exit 0
//   node scripts/check-scss-hex.mjs --report --path components/table [--path forms/select]
//   node scripts/check-scss-hex.mjs --report --literals --path components/table
//     `--literals` also lists values that equal a scale token exactly (radius, font size / weight / line
//     height, global z-index layers, 120/200/300ms, the standard easing, elevation shadows) — the
//     exact-value migration report of D-014. Literals are report-only and never fail the check.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_LIBRARY_ROOT = join(REPO_ROOT, 'versions', 'v19', 'projects', 'sdcorejs-angular');

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
// Same heuristic as the ESLint rule: a hex right after `:` `(` `,` `=` (optionally spaced) or opening a string.
const TS_COLOR_HEX = /(?:[:(,=]\s*|['"`])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
const VAR_FALLBACK_HEX = /var\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g;
// A component focus-ring token may carry a keyword fallback (`var(--sd-preview-pdf-focus-ring, white)`);
// a hex anywhere in the value is rejected separately.
const FOCUS_OK = /var\(\s*--sd-focus-ring-color\b|var\(\s*--sd-[\w-]*focus-ring[\w-]*\s*[,)]|\bcurrentColor\b/i;
const OUTLINE_OFF = /^(?:none|0|0px|unset|inherit|initial|revert)(?:\s*!important)?$/i;

const toPosix = p => p.split(sep).join('/');

/** Blanks `/* */` and `//` comments, keeping offsets and line numbers. Quoted strings are left alone. */
export function stripComments(source) {
  let out = '';
  let i = 0;
  let quote = '';
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (c === quote) quote = '';
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end < 0 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    // `//` comment — but not inside `url(http://…)` (preceded by `:`).
    if (c === '/' && next === '/' && source[i - 1] !== ':') {
      const end = source.indexOf('\n', i);
      const stop = end < 0 ? source.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Blanks `var(--x, #hex)` fallbacks, innermost first, so they are not reported. */
function blankVarFallbacks(source) {
  let previous;
  let current = source;
  do {
    previous = current;
    current = current.replace(VAR_FALLBACK_HEX, m => ' '.repeat(m.length));
  } while (current !== previous);
  return current;
}

const lineAndColumn = (source, index) => {
  const before = source.slice(0, index);
  const line = before.split('\n').length;
  return { line, column: index - before.lastIndexOf('\n') };
};

/**
 * Every `property: value` declaration with its offsets and the selector stack around it. Understands SCSS
 * nesting and `#{}` interpolation; a declaration ends at `;` or, when it is the last of a block, at `}`.
 */
export function declarations(source) {
  const result = [];
  const stack = [];
  let segmentStart = 0;
  let interpolation = 0;
  const take = end => {
    const text = source.slice(segmentStart, end);
    const match = /^(\s*)([\w-]+)(\s*:\s*)([\s\S]*?)\s*$/.exec(text);
    if (!match || match[2].startsWith('--') || /[{}]/.test(match[4])) return;
    const start = segmentStart + match[1].length;
    const valueStart = start + match[2].length + match[3].length;
    result.push({ property: match[2].toLowerCase(), value: match[4], start, valueStart, valueEnd: valueStart + match[4].length, selectors: [...stack] });
  };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '#' && source[i + 1] === '{') {
      interpolation++;
      i++;
      continue;
    }
    if (interpolation) {
      if (c === '}') interpolation--;
      continue;
    }
    if (c === '{') {
      stack.push(source.slice(segmentStart, i).trim());
      segmentStart = i + 1;
    } else if (c === '}') {
      take(i);
      stack.pop();
      segmentStart = i + 1;
    } else if (c === ';') {
      take(i);
      segmentStart = i + 1;
    }
  }
  return result;
}

/** Finds outline declarations inside focus rules whose colour is not the focus-ring token. */
function focusFindings(source) {
  return declarations(source)
    .filter(d => (d.property === 'outline' || d.property === 'outline-color') && d.selectors.some(s => /:focus(?:-visible|-within)?\b/.test(s)))
    .filter(d => {
      const value = d.value.trim();
      // R-013: màu focus lấy từ token — và không được còn hex, kể cả trong fallback của var().
      return !OUTLINE_OFF.test(value) && (!FOCUS_OK.test(value) || /#[0-9a-fA-F]{3,8}\b/.test(value));
    })
    .map(d => ({ index: d.start, text: `${d.property}: ${d.value.trim()}` }));
}

// ---- Exact-value literals (D-014, R-015): report only, never a failure in check mode ----

const pxScale = (values, prefix) => new Map(values.map(n => [`${n}px`, `${prefix}-${n}`]));
const SINGLE_VALUE_SCALES = {
  'border-radius': pxScale([2, 4, 6, 8, 10, 12, 16, 24, 999], '--sd-radius'),
  'font-size': pxScale([10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 48], '--sd-font-size'),
  'line-height': pxScale([16, 18, 20, 22, 24, 28], '--sd-line-height'),
  'font-weight': new Map([
    ['400', '--sd-font-weight-regular'],
    ['500', '--sd-font-weight-medium'],
    ['600', '--sd-font-weight-semibold'],
    ['700', '--sd-font-weight-bold'],
  ]),
};
// Global layers everywhere; the layout layers only inside modules/layout (elsewhere 20/30/… are local stacking).
const Z_GLOBAL = new Map([
  ['99', '--sd-z-floating'],
  ['998', '--sd-z-backdrop'],
  ['999', '--sd-z-drawer'],
  ['1000', '--sd-z-dropdown'],
  ['9999', '--sd-z-overlay'],
  ['10000', '--sd-z-modal'],
  ['100000', '--sd-z-devtools'],
]);
const Z_LAYOUT = new Map([
  ['20', '--sd-z-sidebar'],
  ['30', '--sd-z-header'],
  ['40', '--sd-z-popover'],
  ['50', '--sd-z-drawer-mobile'],
]);
const DURATIONS = new Map([
  ['120ms', '--sd-duration-fast'],
  ['0.12s', '--sd-duration-fast'],
  ['.12s', '--sd-duration-fast'],
  ['200ms', '--sd-duration-base'],
  ['0.2s', '--sd-duration-base'],
  ['.2s', '--sd-duration-base'],
  ['300ms', '--sd-duration-slow'],
  ['0.3s', '--sd-duration-slow'],
  ['.3s', '--sd-duration-slow'],
]);
const EASE_STANDARD = /cubic-bezier\(\s*0?\.4\s*,\s*0\s*,\s*0?\.2\s*,\s*1\s*\)/g;
const canonicalShadow = value => value.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\b0px\b/g, '0').trim();
const SHADOWS = new Map(
  [
    ['--sd-shadow-xs', '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)'],
    ['--sd-shadow-sm', '0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)'],
    ['--sd-shadow-md', '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'],
    ['--sd-shadow-lg', '0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)'],
    ['--sd-shadow-xl', '0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)'],
  ].map(([token, value]) => [canonicalShadow(value), token])
);

// Declarations inside these at-rules are descriptors, not properties: var() is invalid there, so
// `font-weight: var(--sd-font-weight-regular)` inside @font-face would drop the descriptor.
const DESCRIPTOR_AT_RULE = /^@(?:font-face|property|counter-style|page|font-palette-values|font-feature-values)\b/i;

/** Offsets `[start, end)` of every `var(--x, <fallback>)` fallback in `value` — already tokenised, never a finding. */
function varFallbackRanges(value) {
  const ranges = [];
  for (const m of value.matchAll(/var\(\s*--[\w-]+\s*,/g)) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    for (; i < value.length && depth; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth--;
    }
    ranges.push([start, i - 1]);
  }
  return ranges;
}

/**
 * Literals whose value equals a scale token exactly. Each finding carries the character range to replace
 * and the replacement text, so a migration can apply it mechanically.
 */
export function literalFindings(rel, source) {
  const findings = [];
  for (const d of declarations(source)) {
    if (d.selectors.some(s => DESCRIPTOR_AT_RULE.test(s))) continue;
    const important = /\s*!important\s*$/.exec(d.value);
    const core = important ? d.value.slice(0, important.index) : d.value;
    const add = (offset, length, text, token) =>
      findings.push({ index: d.valueStart + offset, length, text, replacement: `var(${token})`, property: d.property });
    const single = SINGLE_VALUE_SCALES[d.property];
    if (single?.has(core.trim())) add(core.indexOf(core.trim()), core.trim().length, core.trim(), single.get(core.trim()));
    if (d.property === 'z-index') {
      const token = Z_GLOBAL.get(core.trim()) ?? (rel.startsWith('modules/layout/') ? Z_LAYOUT.get(core.trim()) : undefined);
      if (token) add(core.indexOf(core.trim()), core.trim().length, core.trim(), token);
    }
    if (/^(transition|animation)(-duration|-timing-function)?$/.test(d.property)) {
      const fallbacks = varFallbackRanges(core);
      const inFallback = offset => fallbacks.some(([start, end]) => offset >= start && offset < end);
      for (const m of core.matchAll(/(^|[\s,])(\d*\.?\d+(?:ms|s))(?=[\s,]|$)/g)) {
        const token = DURATIONS.get(m[2]);
        if (token && !inFallback(m.index + m[1].length)) add(m.index + m[1].length, m[2].length, m[2], token);
      }
      for (const m of core.matchAll(EASE_STANDARD)) if (!inFallback(m.index)) add(m.index, m[0].length, m[0], '--sd-ease-standard');
    }
    if (d.property === 'box-shadow' && SHADOWS.has(canonicalShadow(core))) add(0, core.length, core, SHADOWS.get(canonicalShadow(core)));
  }
  return findings;
}

function isExempt(rel) {
  return (
    rel.startsWith('assets/scss/themes/') ||
    rel.endsWith('.generated.ts') ||
    rel.endsWith('.spec.ts') ||
    (rel.startsWith('forms/input-color/') && rel.endsWith('.ts'))
  );
}

/**
 * Scans one file. `rel` is its path relative to the library root (POSIX separators).
 * `literals: true` adds report-only `literal` findings (values that equal a scale token exactly).
 */
export function scanSource(rel, source, { literals = false } = {}) {
  if (isExempt(rel)) return [];
  const stripped = stripComments(source);
  const clean = blankVarFallbacks(stripped);
  const findings = [];
  if (rel.endsWith('.scss')) {
    for (const m of clean.matchAll(HEX)) findings.push({ file: rel, kind: 'hex', ...lineAndColumn(clean, m.index), text: m[0] });
    for (const f of focusFindings(stripped)) findings.push({ file: rel, kind: 'focus', ...lineAndColumn(stripped, f.index), text: f.text });
    if (literals) {
      for (const f of literalFindings(rel, stripped)) {
        findings.push({ file: rel, kind: 'literal', ...lineAndColumn(stripped, f.index), text: `${f.property}: ${f.text} -> ${f.replacement}` });
      }
    }
  } else if (rel.endsWith('.ts')) {
    for (const m of clean.matchAll(TS_COLOR_HEX)) {
      const hexIndex = m.index + m[0].indexOf('#');
      findings.push({ file: rel, kind: 'hex', ...lineAndColumn(clean, hexIndex), text: m[0].slice(m[0].indexOf('#')) });
    }
  }
  return findings;
}

function collectFiles(target, acc) {
  const stat = statSync(target);
  if (stat.isDirectory()) {
    for (const name of readdirSync(target)) {
      if (name === 'node_modules' || name === 'dist') continue;
      collectFiles(join(target, name), acc);
    }
  } else if (/\.(scss|ts)$/.test(target)) {
    acc.push(target);
  }
  return acc;
}

/** Scans `paths` (default: the whole library) under `root`. */
export function scanLibrary({ root = DEFAULT_LIBRARY_ROOT, paths = [], literals = false } = {}) {
  const targets = paths.length ? paths.map(p => (isAbsolute(p) ? p : existsSync(resolve(p)) ? resolve(p) : join(root, p))) : [root];
  const files = targets.flatMap(target => collectFiles(target, []));
  return files.flatMap(file => scanSource(toPosix(relative(root, file)), readFileSync(file, 'utf8'), { literals }));
}

function main(argv) {
  const report = argv.includes('--report');
  const literals = argv.includes('--literals');
  const paths = [];
  let root = DEFAULT_LIBRARY_ROOT;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--path') paths.push(argv[++i]);
    if (argv[i] === '--root') root = resolve(argv[++i]);
  }
  const findings = scanLibrary({ root, paths, literals });
  const byFile = new Map();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);
  for (const [file, list] of [...byFile].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${file} (${list.length})`);
    for (const f of list) console.log(`  ${f.line}:${f.column}  ${f.kind.padEnd(7)} ${f.text}`);
  }
  const hex = findings.filter(f => f.kind === 'hex').length;
  const focus = findings.filter(f => f.kind === 'focus').length;
  const literal = findings.filter(f => f.kind === 'literal').length;
  console.log(`\n${hex + focus} finding(s): ${hex} hex, ${focus} focus, in ${new Set(findings.filter(f => f.kind !== 'literal').map(f => f.file)).size} file(s).`);
  if (literals) console.log(`${literal} literal(s) equal to a scale token (report only).`);
  // why: literal khớp scale chỉ để báo cáo migrate (D-014) — không bao giờ làm fail check.
  if (!report && hex + focus) {
    console.error('Use a --sd-* token (see assets/THEME.md) or a var(--x, #hex) fallback. Colours are declared only in assets/scss/themes/.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2));
}

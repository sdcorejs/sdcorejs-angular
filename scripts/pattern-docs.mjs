/**
 * Keeps the pattern docs and the Source manifest of `@sdcorejs/angular/modules/pattern` in step with the code.
 *
 * Source of truth: `versions/v19/projects/sdcorejs-angular/modules/pattern/features/**`.
 *
 * 1. Code blocks of `README.md` and `docs/*.md` are extracted from that code (E10: no pseudo-code). A block is a
 *    marker followed by a fenced block; the script rewrites the fence:
 *
 *        <!-- @source features/product/pages/list/list.component.ts -->
 *        <!-- @source features/order/pages/list/list.component.ts#columns -->   (a `#region columns` of the file)
 *
 * 2. `core/pattern-shell/source/pattern-source.generated.ts` maps every file of `README.md`, `docs/` and
 *    `features/` (specs excluded) to its content, for the "Xem source" drawer of the pattern toolbar.
 *
 * Usage (repo root):
 *   node scripts/pattern-docs.mjs          # rewrite the code blocks and the manifest
 *   node scripts/pattern-docs.mjs --check  # exit 1 when a block or the manifest is stale or a source is missing
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PATTERN_ROOT = join(REPO_ROOT, 'versions', 'v19', 'projects', 'sdcorejs-angular', 'modules', 'pattern');
export const MANIFEST_FILE = join(PATTERN_ROOT, 'core', 'pattern-shell', 'source', 'pattern-source.generated.ts');

const MARKER = /^<!-- @source ([^\s#]+)(?:#([\w-]+))? -->$/;
const FENCE_LANGUAGE = { '.ts': 'ts', '.html': 'html', '.scss': 'scss', '.md': 'md', '.json': 'json' };
const SOURCE_EXTENSIONS = new Set(['.ts', '.html', '.scss']);

const toPosix = path => path.split(sep).join('/');
const lf = text => text.replace(/\r\n/g, '\n');

function walk(dir, accept, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, accept, acc);
    else if (accept(name)) acc.push(full);
  }
  return acc;
}

/** Markdown files whose code blocks are extracted: `README.md` and `docs/*.md`. */
export function docFiles(root = PATTERN_ROOT) {
  const readme = join(root, 'README.md');
  return [...(existsSync(readme) ? [readme] : []), ...walk(join(root, 'docs'), name => name.endsWith('.md'))];
}

/** Files of the Source manifest, relative to the module root. */
export function manifestFiles(root = PATTERN_ROOT) {
  const features = walk(join(root, 'features'), name => SOURCE_EXTENSIONS.has(extname(name)) && !name.endsWith('.spec.ts'));
  return [...docFiles(root), ...features].map(file => toPosix(relative(root, file))).sort((a, b) => a.localeCompare(b));
}

/** Content of `path` (relative to the module root), or of its `#region name` without the region lines, dedented. */
export function extract(path, region, root = PATTERN_ROOT) {
  const file = join(root, ...path.split('/'));
  if (!existsSync(file)) throw new Error(`@source ${path}: file does not exist`);
  const text = lf(readFileSync(file, 'utf8')).replace(/\n+$/, '');
  if (!region) return text;
  const lines = text.split('\n');
  const start = lines.findIndex(line => new RegExp(`#region ${region}\\b`).test(line));
  const end = lines.findIndex((line, index) => index > start && /#endregion\b/.test(line));
  if (start < 0 || end < 0) throw new Error(`@source ${path}#${region}: region not found`);
  const body = lines.slice(start + 1, end);
  const indent = Math.min(...body.filter(line => line.trim()).map(line => line.match(/^ */)[0].length));
  return body.map(line => line.slice(Number.isFinite(indent) ? indent : 0)).join('\n');
}

/** The Markdown with every `@source` block rewritten from the code. */
export function fillDoc(markdown, root = PATTERN_ROOT) {
  const lines = lf(markdown).split('\n');
  const out = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(MARKER);
    out.push(lines[index]);
    if (!match) continue;
    const [, path, region] = match;
    const open = lines[index + 1] ?? '';
    if (!open.startsWith('```')) throw new Error(`@source ${path}: the marker must be followed by a fenced code block`);
    const close = lines.findIndex((line, next) => next > index + 1 && line.startsWith('```'));
    if (close < 0) throw new Error(`@source ${path}: unclosed code block`);
    const language = FENCE_LANGUAGE[extname(path)] ?? '';
    out.push('```' + language, extract(path, region, root), '```');
    index = close;
  }
  return out.join('\n');
}

const quote = value => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

/** The Source manifest module. */
export function buildManifest(root = PATTERN_ROOT) {
  const entries = manifestFiles(root).map(path => `  ${quote(path)}: ${quote(lf(readFileSync(join(root, ...path.split('/')), 'utf8')))},`);
  return [
    '// Generated by scripts/pattern-docs.mjs from README.md, docs/ and features/ of modules/pattern. Do not edit:',
    '// run `npm run pattern:docs` after changing those files.',
    'export const PATTERN_SOURCE: Readonly<Record<string, string>> = {',
    ...entries,
    '};',
    '',
  ].join('\n');
}

/** Rewrites (or, with `check`, verifies) the docs and the manifest; returns the stale files. */
export function run({ check = false, root = PATTERN_ROOT, manifestFile = MANIFEST_FILE } = {}) {
  const stale = [];
  for (const file of docFiles(root)) {
    const current = readFileSync(file, 'utf8');
    const filled = fillDoc(current, root);
    if (lf(current) !== filled) {
      stale.push(toPosix(relative(root, file)));
      if (!check) writeFileSync(file, filled);
    }
  }
  const manifest = buildManifest(root);
  if (!existsSync(manifestFile) || lf(readFileSync(manifestFile, 'utf8')) !== manifest) {
    stale.push(toPosix(relative(root, manifestFile)));
    if (!check) writeFileSync(manifestFile, manifest);
  }
  return stale;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes('--check');
  try {
    const stale = run({ check });
    if (check && stale.length) {
      console.error(`Pattern docs are stale: ${stale.join(', ')}. Run \`npm run pattern:docs\` and commit the result.`);
      process.exit(1);
    }
    console.log(check ? 'Pattern docs are fresh.' : stale.length ? `Updated ${stale.join(', ')}.` : 'Pattern docs already fresh.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

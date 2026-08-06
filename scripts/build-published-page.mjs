#!/usr/bin/env node
// Build the root `showcase/` workspace into `published-pages/<release-suffix>/`.
//
// Each release suffix gets its own committed, self-contained static site, served by
// GitHub Pages at `/<repo>/<suffix>/`. The Pages deploy is then a pure copy — it never
// builds — so a docs-only or page-only change cannot trigger an Angular build.
//
// Retention: only the newest N suffixes per leading digit are kept (see prunePublishedPages).
// `1.6` and `1.5` share the leading digit `1`; `0.11` belongs to `0`.
//
// Usage:
//   node scripts/build-published-page.mjs --suffix 1.6
//   node scripts/build-published-page.mjs --suffix 1.6 --skip-build   # re-copy an existing build
//   node scripts/build-published-page.mjs --prune-only
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOWCASE_ROOT = join(REPO_ROOT, 'showcase');
const PAGES_ROOT = join(REPO_ROOT, 'published-pages');
const BUILD_OUTPUT = join(SHOWCASE_ROOT, 'dist', 'showcase', 'browser');
const REPO_NAME = 'sdcorejs-angular';

// Keep this many suffixes per leading digit. `1` and `0` are pruned independently so an
// older line does not get evicted by a burst of releases on the newer one.
export const RETENTION_PER_LEADING_DIGIT = 5;

const SUFFIX_PATTERN = /^(\d+)\.(\d+)$/;

export function parseSuffix(suffix) {
  const match = SUFFIX_PATTERN.exec(String(suffix));
  if (!match) {
    throw new Error(`Invalid release suffix "${suffix}" (expected <digits>.<digits>, for example 1.6).`);
  }
  return { major: Number(match[1]), minor: Number(match[2]) };
}

export function listPageSuffixes(pagesRoot) {
  if (!existsSync(pagesRoot)) return [];
  return readdirSync(pagesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && SUFFIX_PATTERN.test(entry.name))
    .map(entry => entry.name);
}

export function sortSuffixesDesc(suffixes) {
  return [...suffixes].sort((a, b) => {
    const left = parseSuffix(a);
    const right = parseSuffix(b);
    return right.major - left.major || right.minor - left.minor;
  });
}

// Returns the suffixes that must be removed to honor the retention rule.
export function selectSuffixesToPrune(suffixes, keepPerLeadingDigit = RETENTION_PER_LEADING_DIGIT) {
  const groups = new Map();
  for (const suffix of sortSuffixesDesc(suffixes)) {
    const { major } = parseSuffix(suffix);
    if (!groups.has(major)) groups.set(major, []);
    groups.get(major).push(suffix);
  }

  const prune = [];
  for (const group of groups.values()) prune.push(...group.slice(keepPerLeadingDigit));
  return sortSuffixesDesc(prune);
}

export function buildPagesIndex(suffixes) {
  const ordered = sortSuffixesDesc(suffixes);
  return {
    repository: REPO_NAME,
    latest: ordered[0] ?? null,
    retentionPerLeadingDigit: RETENTION_PER_LEADING_DIGIT,
    suffixes: ordered,
  };
}

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function writePagesIndex() {
  const index = buildPagesIndex(listPageSuffixes(PAGES_ROOT));
  writeFileSync(join(PAGES_ROOT, 'pages.json'), JSON.stringify(index, null, 2) + '\n');
  return index;
}

export function prunePublishedPages({ dryRun = false } = {}) {
  const prune = selectSuffixesToPrune(listPageSuffixes(PAGES_ROOT));
  for (const suffix of prune) {
    const target = join(PAGES_ROOT, suffix);
    console.log(`[published-page] prune ${suffix}${dryRun ? ' (dry run)' : ''}`);
    if (!dryRun) rmSync(target, { recursive: true, force: true });
  }
  if (!prune.length) console.log('[published-page] nothing to prune');
  return prune;
}

function runNode(args, cwd, label) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
}

function buildShowcase(suffix) {
  const baseHref = `/${REPO_NAME}/${suffix}/`;

  // why: the generated .ts data sources must exist before the Angular build reads them.
  // These run here (page build time) rather than at deploy time, so the Pages deploy stays
  // a pure copy of committed artifacts.
  console.log('[published-page] generating showcase data sources');
  runNode([join(REPO_ROOT, 'scripts', 'generate-showcase-changelog.mjs')], REPO_ROOT, 'changelog generator');
  runNode([join(REPO_ROOT, 'scripts', 'generate-showcase-example-sources.mjs')], REPO_ROOT, 'example-source generator');

  console.log(`[published-page] building showcase with base-href ${baseHref}`);
  runNode(
    [
      '--max_old_space_size=8000',
      join('node_modules', '@angular', 'cli', 'bin', 'ng'),
      'build',
      'showcase',
      '--configuration',
      'production',
      `--base-href=${baseHref}`,
    ],
    SHOWCASE_ROOT,
    'showcase build',
  );

  // why: indexable 200 shells per route must be baked into the committed page — the deploy
  // no longer runs any generator. `--suffix` scopes them to THIS release only; the page
  // directory already encodes the version, so pre-rendering every published release would
  // multiply the shell HTML ~12x for nothing.
  console.log('[published-page] generating route shells');
  runNode(
    [join(REPO_ROOT, 'scripts', 'generate-showcase-route-shells.mjs'), '--suffix', suffix],
    REPO_ROOT,
    'route-shell generator',
  );
}

function main() {
  if (hasFlag('prune-only')) {
    prunePublishedPages({ dryRun: hasFlag('dry-run') });
    if (existsSync(PAGES_ROOT)) writePagesIndex();
    return;
  }

  const suffix = getArg('suffix');
  if (!suffix) throw new Error('Missing --suffix (for example: --suffix 1.6).');
  parseSuffix(suffix);

  if (!existsSync(SHOWCASE_ROOT)) throw new Error(`Showcase workspace not found: ${SHOWCASE_ROOT}`);

  if (!hasFlag('skip-build')) buildShowcase(suffix);

  if (!existsSync(BUILD_OUTPUT)) {
    throw new Error(`Build output not found: ${BUILD_OUTPUT}. Run without --skip-build first.`);
  }

  const target = join(PAGES_ROOT, suffix);
  if (existsSync(target)) {
    if (!hasFlag('force')) {
      throw new Error(`published-pages/${suffix}/ already exists. Pass --force to rebuild it intentionally.`);
    }
    rmSync(target, { recursive: true, force: true });
  }
  mkdirSync(target, { recursive: true });
  cpSync(BUILD_OUTPUT, target, { recursive: true });

  // why: SPA deep links must fall back to the version's own index.html, not the root one.
  cpSync(join(target, 'index.html'), join(target, '404.html'));

  const fileCount = countFiles(target);
  prunePublishedPages();
  const index = writePagesIndex();

  console.log(`[published-page] published-pages/${suffix}/ — ${fileCount} files`);
  console.log(`[published-page] pages.json: latest=${index.latest}, kept=[${index.suffixes.join(', ')}]`);
}

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else if (statSync(full).isFile()) count += 1;
  }
  return count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}

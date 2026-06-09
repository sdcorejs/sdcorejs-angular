#!/usr/bin/env node
// Collect public API docs (*.md) from the synced v19 library into a versioned,
// repo-owned archive under `published-docs/<version>/`, and refresh the
// `published-docs/versions.json` registry.
//
// The archive is committed to the repo (NOT a build artifact) so every published
// version persists. The deploy-pages workflow copies `published-docs/**` into the
// GitHub Pages output, where an AI agent can fetch docs by URL without a local clone:
//
//   https://sdcorejs.github.io/sdcorejs-angular/docs/versions.json   (registry)
//   https://sdcorejs.github.io/sdcorejs-angular/docs/<version>/index.json
//   https://sdcorejs.github.io/sdcorejs-angular/docs/<version>/forms/select/sd-select.md
//   https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json (alias built at deploy)
//
// Source of truth is the synced lib at `versions/v19/projects/sdcorejs-angular`,
// where the sync step has already rewritten `@sd-angular/core` -> `@sdcorejs/angular`.
// Do NOT hand-edit `versions/**` or `published-docs/<version>/**` — re-run this script.
//
// Usage:
//   node scripts/collect-docs.mjs                       # version from lib package.json
//   node scripts/collect-docs.mjs --version 19.0.4      # explicit release version
//   node scripts/collect-docs.mjs --version 19.0.4 --commit a9a19e7c --date 2026-06-09

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SRC_ROOT = join(REPO_ROOT, 'versions', 'v19', 'projects', 'sdcorejs-angular');
const OUT_ROOT = join(REPO_ROOT, 'published-docs');

const PACKAGE = '@sdcorejs/angular';
const BASE_URL = 'https://sdcorejs.github.io/sdcorejs-angular/docs';

// Internal / non-API md that must never be published.
const EXCLUDE_FILES = new Set(['HANDOFF.md']);
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.angular', 'coverage', '.git']);

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function resolveVersion() {
  const explicit = getArg('version');
  if (explicit) return explicit;
  const pkgPath = join(SRC_ROOT, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`Cannot resolve version: pass --version, or ensure ${pkgPath} exists.`);
  }
  return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
}

function resolveCommit() {
  const explicit = getArg('commit');
  if (explicit) return explicit;
  // Best-effort: parse the source commit recorded by the sync step.
  const statusPath = join(REPO_ROOT, 'versions', 'v19', 'SYNC-STATUS.md');
  if (existsSync(statusPath)) {
    const text = readFileSync(statusPath, 'utf8');
    const m = text.match(/[Ss]ource\s*[Cc]ommit[^\n|]*[|:]\s*([0-9a-f]{7,40})/);
    if (m) return m[1];
  }
  return '';
}

function todayIso() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!EXCLUDE_DIRS.has(name)) walk(full, acc);
    } else if (name.endsWith('.md') && !EXCLUDE_FILES.has(name)) {
      acc.push(full);
    }
  }
  return acc;
}

function titleOf(content, fallback) {
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) return m[1].replace(/`/g, '').trim();
  }
  return fallback;
}

// Descending semver-ish comparison (numeric segments; beta suffixes sort low).
function cmpVersionDesc(a, b) {
  const parse = v => v.split('.').map(s => parseInt(s, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pb[i] || 0) - (pa[i] || 0);
    if (d) return d;
  }
  return 0;
}

function main() {
  if (!existsSync(SRC_ROOT)) {
    throw new Error(`Synced library not found: ${SRC_ROOT}. Run \`npm run sync\` first.`);
  }

  const version = resolveVersion();
  const released = getArg('date') || todayIso();
  const syncedFrom = resolveCommit();

  const outVersionDir = join(OUT_ROOT, version);
  // Idempotent: rebuild only this version's folder.
  if (existsSync(outVersionDir)) rmSync(outVersionDir, { recursive: true, force: true });
  mkdirSync(outVersionDir, { recursive: true });

  const docs = [];
  for (const file of walk(SRC_ROOT)) {
    const rel = relative(SRC_ROOT, file).split(sep).join('/');
    const content = readFileSync(file, 'utf8');
    const id = rel.replace(/\.md$/, '');
    const category = rel.split('/')[0];
    const title = titleOf(content, id.split('/').pop());

    const dest = join(outVersionDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(file, dest);

    docs.push({ id, title, category, path: rel, url: `${BASE_URL}/${version}/${rel}` });
  }
  docs.sort((a, b) => a.id.localeCompare(b.id));

  const index = {
    package: PACKAGE,
    version,
    released,
    baseUrl: `${BASE_URL}/${version}`,
    count: docs.length,
    docs,
  };
  if (syncedFrom) index.syncedFrom = syncedFrom;
  writeFileSync(join(outVersionDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');

  // Refresh registry.
  const registryPath = join(OUT_ROOT, 'versions.json');
  let registry = { package: PACKAGE, latest: version, baseUrl: BASE_URL, versions: [] };
  if (existsSync(registryPath)) {
    try {
      registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    } catch {
      /* corrupt registry — rebuild from scratch */
    }
  }
  registry.package = PACKAGE;
  registry.baseUrl = BASE_URL;
  const entry = { version, index: `${BASE_URL}/${version}/index.json`, released, count: docs.length };
  registry.versions = [entry, ...(registry.versions || []).filter(v => v.version !== version)];
  registry.versions.sort((a, b) => cmpVersionDesc(a.version, b.version));
  registry.latest = registry.versions[0].version;
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

  console.log(`[collect-docs] ${PACKAGE}@${version}: ${docs.length} docs -> published-docs/${version}/`);
  console.log(`[collect-docs] registry: ${registry.versions.length} version(s), latest=${registry.latest}`);
}

main();

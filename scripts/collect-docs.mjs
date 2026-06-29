#!/usr/bin/env node
// Collect public API docs (*.md) from one synced Angular workspace into a
// versioned, repo-owned archive under `published-docs/<version>/`, and refresh
// the `published-docs/versions.json` registry + `published-docs/catalog.json`
// aggregate.
//
// The archive is committed to the repo so every published version persists.
// The deploy-pages workflow copies `published-docs/**` into the GitHub Pages
// output, where an AI agent can fetch docs by URL without a local clone:
//
//   https://sdcorejs.github.io/sdcorejs-angular/docs/versions.json
//   https://sdcorejs.github.io/sdcorejs-angular/docs/catalog.json
//   https://sdcorejs.github.io/sdcorejs-angular/docs/<version>/index.json
//   https://sdcorejs.github.io/sdcorejs-angular/docs/<version>/forms/select/sd-select.md
//   https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json
//
// Source of truth is the repo-owned lib at `versions/v<N>/projects/sdcorejs-angular`.
// Do not hand-edit `published-docs/<version>/**`; edit the workspace source and
// re-run this script.
//
// Usage:
//   node scripts/collect-docs.mjs --workspace v19 --version 19.0.5
//   node scripts/collect-docs.mjs --workspace v20 --version 20.0.5 --date 2026-06-10
//   node scripts/collect-docs.mjs --workspace v21 --version 21.0.5 --skip-existing

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const PACKAGE = '@sdcorejs/angular';
const BASE_URL = 'https://sdcorejs.github.io/sdcorejs-angular/docs';
const WORKSPACES = new Map([
  ['v19', 19],
  ['v20', 20],
  ['v21', 21],
]);

// Internal / non-API md that must never be published.
const EXCLUDE_FILES = new Set(['HANDOFF.md']);
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.angular', 'coverage', '.git']);

// UTF-8-as-CP1252 double-encode mojibake. Matches
// only multi-char digraphs + C1 controls that never occur in valid Vietnamese/English,
// so legitimate precomposed VN (ể U+1EC3) and uppercase words (ĐÃ, NÂNG) are NOT flagged.
const MOJIBAKE = new RegExp([
  '\\u00e1\\u00bb', '\\u00e1\\u00ba', '\\u00c6\\u00b0', '\\u00c4\\u2018',
  '\\u00c3\\u00a1', '\\u00c3\\u00a0', '\\u00c3\\u00a2', '\\u00c3\\u00a3',
  '\\u00c3\\u00a9', '\\u00c3\\u00a8', '\\u00c3\\u00ad', '\\u00c3\\u00ac',
  '\\u00c3\\u00b3', '\\u00c3\\u00b2', '\\u00c3\\u00b4', '\\u00c3\\u00b5',
  '\\u00c3\\u00ba', '\\u00c3\\u00b9', '\\u00c3\\u00bd', '\\u00c3\\u00ab',
  '\\u00c3\\u00b6', '\\u00c3\\u00bc', '\\u00e2\\u20ac\\u201c',
  '\\u00e2\\u20ac\\u201d', '\\u00e2\\u20ac\\u0153', '\\u00e2\\u20ac\\u2122',
  '\\u00e2\\u20ac\\u00a6', '\\u00ef\\u00bf\\u00bd', '[\\u0080-\\u009f]',
].join('|'));

// Fail-closed gate: scan every doc BEFORE creating output, refuse to publish if any
// is mojibaked. Repair the repo-owned source workspace before publishing docs.
function assertNoMojibake(srcRoot) {
  const hits = [];
  for (const file of walk(srcRoot)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    const bad = [];
    lines.forEach((l, i) => {
      if (MOJIBAKE.test(l)) bad.push(i + 1);
    });
    if (bad.length) hits.push({ file: displayPath(file), lines: bad });
  }
  if (hits.length) {
    const detail = hits.map(h => `  - ${h.file} (line${h.lines.length > 1 ? 's' : ''} ${h.lines.join(', ')})`).join('\n');
    throw new Error(
      `Refusing to publish: ${hits.length} doc(s) contain UTF-8-as-CP1252 mojibake:\n${detail}\n` +
        `Fix the source under versions/<workspace>/projects/sdcorejs-angular, roll out if needed, then retry \`collect-docs\`.`,
    );
  }
}

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function resolvePathArg(name, fallback) {
  const explicit = getArg(name);
  if (!explicit) return fallback;
  return isAbsolute(explicit) ? explicit : resolve(REPO_ROOT, explicit);
}

function resolveWorkspace() {
  const explicit = getArg('workspace') || getArg('major') || 'v19';
  const workspace = explicit.startsWith('v') ? explicit : `v${explicit}`;
  if (!WORKSPACES.has(workspace)) {
    throw new Error(`Unsupported workspace "${explicit}". Expected one of: ${[...WORKSPACES.keys()].join(', ')}.`);
  }
  return workspace;
}

function resolveVersion(srcRoot) {
  const explicit = getArg('version');
  if (explicit) return explicit;
  const pkgPath = join(srcRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`Cannot resolve version: pass --version, or ensure ${pkgPath} exists.`);
  }
  return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
}

function assertVersionMatchesWorkspace(version, major, workspace) {
  const m = version.match(/^(\d+)\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  if (!m) {
    throw new Error(`Invalid package version "${version}". Expected format like 19.0.5 or 19.0.5-beta.1.`);
  }
  const versionMajor = Number(m[1]);
  if (versionMajor !== major) {
    throw new Error(`Version ${version} does not match workspace ${workspace}. Expected major ${major}.`);
  }
}

function resolveCommit() {
  const explicit = getArg('commit');
  if (explicit) return explicit;
  // After the final legacy sync, new releases are repo-owned. Do not infer
  // `syncedFrom` from SYNC-STATUS.md, or future docs would keep pointing at the
  // final legacy vn-angular commit.
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

function displayPath(path) {
  const rel = relative(REPO_ROOT, path).split(sep).join('/');
  return rel && !rel.startsWith('..') ? rel : path;
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function majorOf(version) {
  const m = version.match(/^(\d+)/);
  return m ? Number(m[1]) : 0;
}

// Descending semver-ish comparison. Stable releases sort above prereleases.
function cmpVersionDesc(a, b) {
  const parse = v => {
    const [core, prerelease = ''] = v.split('-', 2);
    return { nums: core.split('.').map(s => parseInt(s, 10) || 0), prerelease };
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.nums.length, pb.nums.length); i++) {
    const d = (pb.nums[i] || 0) - (pa.nums[i] || 0);
    if (d) return d;
  }
  if (pa.prerelease && !pb.prerelease) return 1;
  if (!pa.prerelease && pb.prerelease) return -1;
  if (pa.prerelease || pb.prerelease) return pb.prerelease.localeCompare(pa.prerelease);
  return 0;
}

function refreshDocsCatalog(outRoot, registry) {
  const versions = [];

  for (const entry of registry.versions || []) {
    if (!entry?.version) continue;

    const version = entry.version;
    const indexPath = join(outRoot, version, 'index.json');
    const index = readJson(indexPath, null);
    if (!index) continue;

    const docs = (index.docs || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      path: doc.path,
      url: doc.url,
    }));

    const versionEntry = {
      version,
      major: majorOf(version),
      released: index.released || entry.released || '',
      count: index.count ?? docs.length,
      baseUrl: index.baseUrl || `${BASE_URL}/${version}`,
      index: entry.index || `${BASE_URL}/${version}/index.json`,
      docs,
    };
    if (index.syncedFrom) versionEntry.syncedFrom = index.syncedFrom;

    versions.push(versionEntry);
  }

  versions.sort((a, b) => cmpVersionDesc(a.version, b.version));

  const majorsByName = new Map();
  for (const item of versions) {
    const key = String(item.major);
    if (!majorsByName.has(key)) {
      majorsByName.set(key, { major: item.major, latest: item.version, versions: [] });
    }

    majorsByName.get(key).versions.push({
      version: item.version,
      released: item.released,
      count: item.count,
      index: item.index,
    });
  }

  const majors = [...majorsByName.values()]
    .sort((a, b) => b.major - a.major)
    .map(major => ({
      ...major,
      versions: major.versions.sort((a, b) => cmpVersionDesc(a.version, b.version)),
    }));

  const catalog = {
    package: PACKAGE,
    schemaVersion: 1,
    baseUrl: BASE_URL,
    registry: `${BASE_URL}/versions.json`,
    latest: registry.latest || versions[0]?.version || '',
    majors,
    versions,
  };

  const catalogPath = join(outRoot, 'catalog.json');
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`[collect-docs] catalog: ${versions.length} version(s) -> ${displayPath(catalogPath)}`);
}

function main() {
  const workspace = resolveWorkspace();
  const workspaceMajor = WORKSPACES.get(workspace);
  const srcRoot = join(REPO_ROOT, 'versions', workspace, 'projects', 'sdcorejs-angular');
  const outRoot = resolvePathArg('out-root', join(REPO_ROOT, 'published-docs'));
  const registryPath = join(outRoot, 'versions.json');

  if (!existsSync(srcRoot)) {
    throw new Error(`Library workspace not found: ${srcRoot}. Restore or generate the version workspace first.`);
  }

  // Fail-closed mojibake gate — runs before any output is created/overwritten.
  assertNoMojibake(srcRoot);

  const version = resolveVersion(srcRoot);
  assertVersionMatchesWorkspace(version, workspaceMajor, workspace);
  const released = getArg('date') || todayIso();
  const syncedFrom = resolveCommit();

  const outVersionDir = join(outRoot, version);
  const outVersionLabel = displayPath(outVersionDir);
  if (existsSync(outVersionDir)) {
    if (hasFlag('skip-existing')) {
      console.log(`[collect-docs] skip existing ${PACKAGE}@${version}: ${outVersionLabel}/ already exists`);
      const registry = readJson(registryPath, { package: PACKAGE, latest: version, baseUrl: BASE_URL, versions: [] });
      refreshDocsCatalog(outRoot, registry);
      return;
    }
    if (!hasFlag('force')) {
      throw new Error(
        `${outVersionLabel}/ already exists. Refusing to overwrite a release archive; pass --force to rebuild intentionally.`,
      );
    }
    rmSync(outVersionDir, { recursive: true, force: true });
  }
  mkdirSync(outVersionDir, { recursive: true });

  const docs = [];
  for (const file of walk(srcRoot)) {
    const rel = relative(srcRoot, file).split(sep).join('/');
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

  let registry = { package: PACKAGE, latest: version, baseUrl: BASE_URL, versions: [] };
  if (existsSync(registryPath)) {
    try {
      registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    } catch {
      // Corrupt registry: rebuild from scratch.
    }
  }
  registry.package = PACKAGE;
  registry.baseUrl = BASE_URL;
  const entry = { version, index: `${BASE_URL}/${version}/index.json`, released, count: docs.length };
  registry.versions = [entry, ...(registry.versions || []).filter(v => v.version !== version)];
  registry.versions.sort((a, b) => cmpVersionDesc(a.version, b.version));
  registry.latest = registry.versions[0].version;
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
  refreshDocsCatalog(outRoot, registry);

  console.log(`[collect-docs] ${workspace} ${PACKAGE}@${version}: ${docs.length} docs -> ${outVersionLabel}/`);
  console.log(`[collect-docs] registry: ${registry.versions.length} version(s), latest=${registry.latest}`);
}

main();

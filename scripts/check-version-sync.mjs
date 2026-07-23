#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceWorkspace = 'v19';
const targetWorkspaces = ['v20', 'v21'];

const syncedRoots = [
  'projects/sdcorejs-angular',
  'projects/showcase',
];
const syncedWorkspaceFiles = [
  'scripts/check-i18n-parity.mjs',
  'scripts/check-i18n.mjs',
];

const excludeDirs = new Set(['.angular', '.git', 'coverage', 'dist', 'node_modules']);
const maxDetails = 40;

const domPortalOutletCalls = [
  'new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector)',
  'new DomPortalOutlet(document.body, this.#ar, this.#injector)',
];
const domPortalOutletMarker = 'new DomPortalOutlet(__SDCOREJS_SYNC_MAJOR_SHIM__)';

function toPosix(path) {
  return path.split(sep).join('/');
}

function walk(root) {
  const out = [];

  function visit(dir) {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isDirectory() && excludeDirs.has(entry.name)) continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (entry.isFile()) out.push(toPosix(relative(root, fullPath)));
    }
  }

  visit(root);
  return out;
}

function normalizeContent(filePath, relativePath) {
  let content = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');

  if (relativePath === 'projects/sdcorejs-angular/package.json') {
    content = content.replace(/"version"\s*:\s*"[^"]+"/, '"version": "__SDCOREJS_SYNC_VERSION__"');
  }

  if (relativePath === 'projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts') {
    for (const call of domPortalOutletCalls) {
      content = content.split(call).join(domPortalOutletMarker);
    }
  }

  return content;
}

function collectWorkspaceFiles(workspace) {
  const workspaceRoot = join(repoRoot, 'versions', workspace);
  const files = new Map();

  for (const root of syncedRoots) {
    const absoluteRoot = join(workspaceRoot, root);
    if (!existsSync(absoluteRoot) || !statSync(absoluteRoot).isDirectory()) {
      throw new Error(`Missing synced root: versions/${workspace}/${root}`);
    }

    for (const relativeFile of walk(absoluteRoot)) {
      const workspaceRelative = toPosix(join(root, relativeFile));
      files.set(workspaceRelative, join(absoluteRoot, relativeFile));
    }
  }

  return files;
}

function compareWorkspace(targetWorkspace) {
  const sourceFiles = collectWorkspaceFiles(sourceWorkspace);
  const targetFiles = collectWorkspaceFiles(targetWorkspace);
  const allFiles = new Set([...sourceFiles.keys(), ...targetFiles.keys()]);
  const failures = [];

  for (const file of [...allFiles].sort()) {
    const sourcePath = sourceFiles.get(file);
    const targetPath = targetFiles.get(file);

    if (!sourcePath) {
      failures.push(`extra in ${targetWorkspace}: ${file}`);
      continue;
    }

    if (!targetPath) {
      failures.push(`missing in ${targetWorkspace}: ${file}`);
      continue;
    }

    const sourceContent = normalizeContent(sourcePath, file);
    const targetContent = normalizeContent(targetPath, file);

    if (sourceContent !== targetContent) {
      failures.push(`content differs in ${targetWorkspace}: ${file}`);
    }
  }

  return failures;
}

function compareLibraryVersion(targetWorkspace) {
  const sourcePackagePath = join(repoRoot, 'versions', sourceWorkspace, 'projects', 'sdcorejs-angular', 'package.json');
  const targetPackagePath = join(repoRoot, 'versions', targetWorkspace, 'projects', 'sdcorejs-angular', 'package.json');
  const sourceVersion = JSON.parse(readFileSync(sourcePackagePath, 'utf8')).version;
  const targetVersion = JSON.parse(readFileSync(targetPackagePath, 'utf8')).version;
  const targetMajor = targetWorkspace.replace(/^v/, '');
  const expectedVersion = sourceVersion.replace(/^\d+/, targetMajor);

  return targetVersion === expectedVersion
    ? []
    : [`package version differs in ${targetWorkspace}: expected ${expectedVersion}, found ${targetVersion}`];
}

function compareSyncedWorkspaceFiles(targetWorkspace) {
  const failures = [];

  for (const relativePath of syncedWorkspaceFiles) {
    const sourcePath = join(repoRoot, 'versions', sourceWorkspace, relativePath);
    const targetPath = join(repoRoot, 'versions', targetWorkspace, relativePath);

    if (!existsSync(sourcePath)) {
      failures.push(`missing in ${sourceWorkspace}: ${relativePath}`);
      continue;
    }

    if (!existsSync(targetPath)) {
      failures.push(`missing in ${targetWorkspace}: ${relativePath}`);
      continue;
    }

    if (normalizeContent(sourcePath, relativePath) !== normalizeContent(targetPath, relativePath)) {
      failures.push(`content differs in ${targetWorkspace}: ${relativePath}`);
    }
  }

  return failures;
}

function compareCanonicalNpmReadme(workspace) {
  const canonicalPath = join(repoRoot, 'docs', 'npm-README.md');
  const packageReadmePath = join(repoRoot, 'versions', workspace, 'projects', 'sdcorejs-angular', 'README.md');

  if (!existsSync(canonicalPath)) return ['missing canonical npm README: docs/npm-README.md'];
  if (!existsSync(packageReadmePath)) {
    return [`missing in ${workspace}: projects/sdcorejs-angular/README.md`];
  }

  return normalizeContent(canonicalPath, 'docs/npm-README.md') ===
    normalizeContent(packageReadmePath, 'projects/sdcorejs-angular/README.md')
    ? []
    : [`npm README differs in ${workspace}: expected docs/npm-README.md`];
}

const failures = [
  ...targetWorkspaces.flatMap(targetWorkspace => [
    ...compareWorkspace(targetWorkspace),
    ...compareLibraryVersion(targetWorkspace),
    ...compareSyncedWorkspaceFiles(targetWorkspace),
  ]),
  ...[sourceWorkspace, ...targetWorkspaces].flatMap(compareCanonicalNpmReadme),
];

if (failures.length > 0) {
  console.error('Version workspace sync check failed.');
  console.error('');
  console.error(`Expected versions/${targetWorkspaces.join(' and versions/')} to be generated from versions/${sourceWorkspace}.`);
  console.error('Run `npm run sync`, review the generated diff, and commit the synced workspaces before release.');
  console.error('');
  for (const failure of failures.slice(0, maxDetails)) {
    console.error(`- ${failure}`);
  }
  if (failures.length > maxDetails) {
    console.error(`- ... ${failures.length - maxDetails} more difference(s) omitted`);
  }
  process.exit(1);
}

console.log(`Version workspace sync check passed: ${targetWorkspaces.join(', ')} match ${sourceWorkspace}.`);

#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lintExtensions = /\.(ts|js|mjs|html)$/i;
const versionFolders = new Set(['v19', 'v20', 'v21']);

const phasePaths = {
  forms: ['projects/sdcorejs-angular/forms'],
  services: ['projects/sdcorejs-angular/services'],
  utilities: ['projects/sdcorejs-angular/utilities'],
  'modules-core': [
    'projects/sdcorejs-angular/configurations',
    'projects/sdcorejs-angular/directives',
    'projects/sdcorejs-angular/handlers',
    'projects/sdcorejs-angular/i18n',
    'projects/sdcorejs-angular/interceptors',
    'projects/sdcorejs-angular/models',
    'projects/sdcorejs-angular/modules',
    'projects/sdcorejs-angular/pipes',
    'projects/sdcorejs-angular/src',
    'projects/sdcorejs-angular/testing',
  ],
  'components-shell': [
    'projects/sdcorejs-angular/components/anchor',
    'projects/sdcorejs-angular/components/autoid-inspector',
    'projects/sdcorejs-angular/components/avatar',
    'projects/sdcorejs-angular/components/badge',
    'projects/sdcorejs-angular/components/button',
    'projects/sdcorejs-angular/components/chart',
  ],
  'components-editor': [
    'projects/sdcorejs-angular/components/ckeditor-styles',
    'projects/sdcorejs-angular/components/code-editor',
    'projects/sdcorejs-angular/components/document-builder',
    'projects/sdcorejs-angular/components/editor',
    'projects/sdcorejs-angular/components/mini-editor',
  ],
  'components-data': [
    'projects/sdcorejs-angular/components/import-excel',
    'projects/sdcorejs-angular/components/operator',
    'projects/sdcorejs-angular/components/query-bar',
    'projects/sdcorejs-angular/components/query-builder',
    'projects/sdcorejs-angular/components/table',
    'projects/sdcorejs-angular/components/tree',
  ],
  'components-layout': [
    'projects/sdcorejs-angular/components/form-generic',
    'projects/sdcorejs-angular/components/history',
    'projects/sdcorejs-angular/components/inform',
    'projects/sdcorejs-angular/components/modal',
    'projects/sdcorejs-angular/components/modal-resizable',
    'projects/sdcorejs-angular/components/org-chart',
    'projects/sdcorejs-angular/components/preview',
    'projects/sdcorejs-angular/components/quick-action',
    'projects/sdcorejs-angular/components/section',
    'projects/sdcorejs-angular/components/side-drawer',
    'projects/sdcorejs-angular/components/splitter',
    'projects/sdcorejs-angular/components/stepper',
    'projects/sdcorejs-angular/components/tab',
    'projects/sdcorejs-angular/components/tab-router',
    'projects/sdcorejs-angular/components/upload-file',
    'projects/sdcorejs-angular/components/view',
  ],
};

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function changedFilesForWorkspace(workspace) {
  const ranges = ['origin/main...HEAD', 'HEAD~1..HEAD'];
  for (const range of ranges) {
    try {
      const output = execSync(`git diff --name-only ${range}`, { cwd: rootPath, encoding: 'utf8' });
      const prefix = `versions/${workspace}/`;
      const files = output
        .split(/\r?\n/)
        .filter(Boolean)
        .filter(file => file.startsWith(prefix) && lintExtensions.test(file))
        .map(file => file.slice(prefix.length))
        .filter(file => existsSync(path.join(rootPath, prefix, file)));
      if (files.length > 0) return files;
    } catch {
      // Try the next range.
    }
  }
  return [];
}

function printHelp() {
  console.log('Usage: node scripts/lint-phase.mjs --workspace v19 --phase <phase>');
  console.log('');
  console.log('Phases:');
  console.log('  release-touched');
  for (const phase of Object.keys(phasePaths)) console.log(`  ${phase}`);
}

const workspace = readArg('workspace', 'v19');
const phase = readArg('phase', 'release-touched');

if (process.argv.includes('--list') || process.argv.includes('--help')) {
  printHelp();
  process.exit(0);
}

if (!versionFolders.has(workspace)) {
  console.error(`Invalid workspace "${workspace}". Expected one of: ${Array.from(versionFolders).join(', ')}`);
  process.exit(2);
}

const workspacePath = path.join(rootPath, 'versions', workspace);
if (!existsSync(workspacePath)) {
  console.error(`Workspace not found: ${workspacePath}`);
  process.exit(2);
}

const targets =
  phase === 'release-touched'
    ? changedFilesForWorkspace(workspace)
    : (phasePaths[phase] || []).filter(target => existsSync(path.join(workspacePath, target)));

if (!targets.length) {
  console.log(`[lint-phase] no lintable targets for workspace=${workspace}, phase=${phase}`);
  process.exit(0);
}

console.log(`[lint-phase] workspace=${workspace}, phase=${phase}`);
for (const target of targets) console.log(`  - ${target}`);

const localEslintBin = path.join(workspacePath, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
const command = existsSync(localEslintBin) ? localEslintBin : process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = existsSync(localEslintBin) ? targets : ['eslint', ...targets];
const result = spawnSync(command, args, {
  cwd: workspacePath,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`[lint-phase] failed to run ${command}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

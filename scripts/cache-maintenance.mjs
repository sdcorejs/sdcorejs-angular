#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { lstat, readdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceCachePaths = new Map([
  ['v19', 'versions/v19/.angular/cache'],
  ['v20', 'versions/v20/.angular/cache'],
  ['v21', 'versions/v21/.angular/cache'],
  ['v22', 'versions/v22/.angular/cache'],
  ['showcase', 'showcase/.angular/cache'],
]);

function assertKnownWorkspace(workspace) {
  if (!workspaceCachePaths.has(workspace)) {
    throw new Error(`Unknown workspace "${workspace}". Expected one of: ${Array.from(workspaceCachePaths.keys()).join(', ')}`);
  }
}

export function parseCacheArguments(argv) {
  const [command, ...options] = argv;
  if (command !== 'report' && command !== 'prune') {
    throw new Error('Expected command "report" or "prune".');
  }

  const workspaces = [];
  let apply = false;

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option === '--apply') {
      apply = true;
      continue;
    }

    let workspace;
    if (option === '--workspace') {
      workspace = options[index + 1];
      index += 1;
      if (!workspace) throw new Error('--workspace requires a value.');
    } else if (option.startsWith('--workspace=')) {
      workspace = option.slice('--workspace='.length);
      if (!workspace) throw new Error('--workspace requires a value.');
    } else {
      throw new Error(`Unknown option "${option}".`);
    }

    assertKnownWorkspace(workspace);
    if (!workspaces.includes(workspace)) workspaces.push(workspace);
  }

  if (apply && command !== 'prune') {
    throw new Error('--apply is only valid with prune.');
  }

  return { command, apply, workspaces };
}

export function resolveCacheTargets(repoRoot, requestedWorkspaces = []) {
  const resolvedRoot = path.resolve(repoRoot);
  const workspaces = requestedWorkspaces.length ? requestedWorkspaces : Array.from(workspaceCachePaths.keys());

  return workspaces.map(name => {
    assertKnownWorkspace(name);
    const relativePath = workspaceCachePaths.get(name);
    const targetPath = path.resolve(resolvedRoot, ...relativePath.split('/'));
    const relativeTarget = path.relative(resolvedRoot, targetPath);

    if (
      !relativeTarget ||
      relativeTarget === '..' ||
      relativeTarget.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativeTarget) ||
      path.basename(targetPath) !== 'cache' ||
      path.basename(path.dirname(targetPath)) !== '.angular'
    ) {
      throw new Error(`Unsafe cache target resolved for ${name}: ${targetPath}`);
    }

    return { name, relativePath, path: targetPath, repoRoot: resolvedRoot };
  });
}

function isPathWithin(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return !relativePath || (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath));
}

async function inspectCacheTarget(target) {
  const repoRoot = path.resolve(target.repoRoot || '');
  const expectedRelativePath = workspaceCachePaths.get(target.name);
  const expectedPath = expectedRelativePath ? path.resolve(repoRoot, ...expectedRelativePath.split('/')) : undefined;

  if (
    !expectedRelativePath ||
    target.relativePath !== expectedRelativePath ||
    path.resolve(target.path) !== expectedPath ||
    !isPathWithin(repoRoot, expectedPath)
  ) {
    throw new Error(`Refusing unsafe cache target: ${target.path}`);
  }

  const canonicalRoot = await realpath(repoRoot);
  const relativeTarget = path.relative(repoRoot, expectedPath);
  let currentPath = repoRoot;

  for (const segment of relativeTarget.split(path.sep)) {
    currentPath = path.join(currentPath, segment);
    let currentStat;
    try {
      currentStat = await lstat(currentPath);
    } catch (error) {
      if (error?.code === 'ENOENT') return { exists: false };
      throw error;
    }

    if (currentStat.isSymbolicLink()) {
      throw new Error(`Refusing cache target with a symlink or junction ancestor: ${currentPath}`);
    }
    if (!currentStat.isDirectory()) {
      throw new Error(`Cache target ancestor is not a directory: ${currentPath}`);
    }

    const canonicalCurrentPath = await realpath(currentPath);
    if (!isPathWithin(canonicalRoot, canonicalCurrentPath)) {
      throw new Error(`Refusing cache target outside the repository: ${currentPath}`);
    }
  }

  return { exists: true };
}

async function measureCache(target) {
  let files = 0;
  let bytes = 0;

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile()) {
        const entryStat = await lstat(entryPath);
        files += 1;
        bytes += entryStat.size;
      }
    }
  }

  const targetState = await inspectCacheTarget(target);
  if (!targetState.exists) return { ...target, exists: false, files: 0, bytes: 0 };

  await visit(target.path);
  return { ...target, exists: true, files, bytes };
}

export function collectCacheReport(targets) {
  return Promise.all(targets.map(measureCache));
}

function normalizeCommandLine(value) {
  return String(value || '')
    .replaceAll('\\', '/')
    .toLowerCase();
}

export function filterActiveBuildProcesses(processes, repoRoot, currentPid = process.pid) {
  const normalizedRoot = normalizeCommandLine(path.resolve(repoRoot));
  const processNamePattern = /^(?:node|npm|npx|ng|pnpm|yarn)(?:\.exe|\.cmd)?$/iu;
  const buildMarkerPattern = /(?:@angular\/cli|node_modules\/\.bin\/ng|\bng(?:\.cmd)?\s+(?:build|test|serve|lint)\b|karma|webpack|vite)/iu;
  const relativeToolPattern =
    /(?:^|[\s"'=])(?:\.\.\/|\.\/)?node_modules\/(?:@angular\/cli\/bin\/ng(?:\.js)?|\.bin\/(?:ng|karma|webpack|vite)(?:\.cmd)?|(?:karma|webpack|vite)\/)/iu;
  const bareToolPattern = /(?:^|[\s"'=])(?:ng|karma|webpack|vite)(?:\.cmd|\.js)?\s+(?:build|test|serve|start|lint)\b/iu;

  return processes.filter(candidate => {
    const pid = Number(candidate.pid ?? candidate.ProcessId);
    const name = String(candidate.name ?? candidate.Name ?? '');
    const commandLine = String(candidate.commandLine ?? candidate.CommandLine ?? '');
    const normalizedCommandLine = normalizeCommandLine(commandLine);

    const isScopedBuild = normalizedCommandLine.includes(normalizedRoot) && buildMarkerPattern.test(normalizedCommandLine);
    const isAmbiguousRelativeBuild = relativeToolPattern.test(normalizedCommandLine) || bareToolPattern.test(normalizedCommandLine);

    return pid !== currentPid && processNamePattern.test(name) && (isScopedBuild || isAmbiguousRelativeBuild);
  });
}

function listSystemProcesses() {
  if (process.platform === 'win32') {
    const result = spawnSync(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Get-CimInstance Win32_Process | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress',
      ],
      { encoding: 'utf8', windowsHide: true }
    );
    if (result.error || result.status !== 0) {
      throw new Error(`Unable to inspect running processes: ${result.error?.message || result.stderr}`);
    }
    if (!result.stdout.trim()) return [];
    const parsed = JSON.parse(result.stdout);
    return (Array.isArray(parsed) ? parsed : [parsed]).map(item => ({
      pid: item.ProcessId,
      name: item.Name,
      commandLine: item.CommandLine,
    }));
  }

  const result = spawnSync('ps', ['-eo', 'pid=,comm=,args='], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`Unable to inspect running processes: ${result.error?.message || result.stderr}`);
  }
  return result.stdout
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(line => {
      const match = line.trim().match(/^(\d+)\s+(\S+)\s+(.*)$/u);
      return match ? { pid: Number(match[1]), name: match[2], commandLine: match[3] } : null;
    })
    .filter(Boolean);
}

export function findActiveBuildProcesses(repoRoot = defaultRepoRoot) {
  return filterActiveBuildProcesses(listSystemProcesses(), repoRoot);
}

async function assertNoActiveBuildProcesses(getActiveProcesses) {
  if (typeof getActiveProcesses !== 'function') {
    throw new Error('Refusing to prune without an active-process safety check.');
  }

  const activeProcesses = await getActiveProcesses();
  if (!Array.isArray(activeProcesses)) {
    throw new Error('Refusing to prune because the active-process safety check returned invalid data.');
  }
  if (activeProcesses.length > 0) {
    const details = activeProcesses.map(item => `${item.name} (PID ${item.pid})`).join(', ');
    throw new Error(`Refusing to prune while an active build/test process is running: ${details}`);
  }
}

export async function pruneCacheTargets({ targets, apply, getActiveProcesses }) {
  if (apply) await assertNoActiveBuildProcesses(getActiveProcesses);

  const reports = await collectCacheReport(targets);
  const results = [];
  for (const report of reports) {
    if (!apply || !report.exists) {
      results.push({ ...report, removed: false });
      continue;
    }

    const targetState = await inspectCacheTarget(report);
    if (!targetState.exists) {
      results.push({ ...report, exists: false, removed: false });
      continue;
    }

    await assertNoActiveBuildProcesses(getActiveProcesses);
    await rm(report.path, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    results.push({ ...report, removed: true });
  }
  return results;
}

function formatGiB(bytes) {
  return (bytes / 1024 ** 3).toFixed(2);
}

function printResults(results, action) {
  for (const result of results) {
    const state = !result.exists ? 'missing' : action === 'removed' && result.removed ? 'removed' : 'present';
    console.log(`${result.name.padEnd(8)} ${formatGiB(result.bytes).padStart(8)} GiB  ${String(result.files).padStart(8)} files  ${state}`);
  }
  const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);
  const totalFiles = results.reduce((sum, result) => sum + result.files, 0);
  console.log(`total    ${formatGiB(totalBytes).padStart(8)} GiB  ${String(totalFiles).padStart(8)} files`);
}

async function runCli() {
  const options = parseCacheArguments(process.argv.slice(2));
  const targets = resolveCacheTargets(defaultRepoRoot, options.workspaces);

  if (options.command === 'report') {
    printResults(await collectCacheReport(targets), 'report');
    return;
  }

  const results = await pruneCacheTargets({
    targets,
    apply: options.apply,
    getActiveProcesses: options.apply ? () => findActiveBuildProcesses(defaultRepoRoot) : undefined,
  });
  printResults(results, options.apply ? 'removed' : 'dry-run');
  if (!options.apply) {
    console.log('Dry run only. Re-run with --apply to remove the listed cache directories.');
  }
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  runCli().catch(error => {
    console.error(`[cache-maintenance] ${error.message}`);
    process.exitCode = 1;
  });
}

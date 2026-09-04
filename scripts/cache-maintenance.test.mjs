import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  collectCacheReport,
  filterActiveBuildProcesses,
  parseCacheArguments,
  pruneCacheTargets,
  resolveCacheTargets,
} from './cache-maintenance.mjs';

test('parses report and guarded prune arguments', () => {
  assert.deepEqual(parseCacheArguments(['report']), {
    command: 'report',
    apply: false,
    workspaces: [],
  });
  assert.deepEqual(parseCacheArguments(['prune', '--workspace', 'v19']), {
    command: 'prune',
    apply: false,
    workspaces: ['v19'],
  });
  assert.deepEqual(parseCacheArguments(['prune', '--workspace=v19', '--apply']), {
    command: 'prune',
    apply: true,
    workspaces: ['v19'],
  });
  assert.throws(() => parseCacheArguments(['report', '--apply']), /only valid with prune/u);
  assert.throws(() => parseCacheArguments(['prune', '--workspace', 'v18']), /Unknown workspace/u);
});

test('resolves only the fixed repository cache roots', () => {
  const repoRoot = path.resolve('fixture-repo');
  const targets = resolveCacheTargets(repoRoot, ['v19', 'showcase']);

  assert.deepEqual(
    targets.map(target => ({ name: target.name, relativePath: target.relativePath })),
    [
      { name: 'v19', relativePath: 'versions/v19/.angular/cache' },
      { name: 'showcase', relativePath: 'showcase/.angular/cache' },
    ]
  );
  assert.equal(targets[0].path, path.join(repoRoot, 'versions', 'v19', '.angular', 'cache'));
});

test('reports cache size and dry-run never removes data', async t => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'sdcorejs-cache-report-'));
  t.after(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(repoRoot, { recursive: true, force: true });
  });

  const [target] = resolveCacheTargets(repoRoot, ['v19']);
  await mkdir(path.join(target.path, 'nested'), { recursive: true });
  await writeFile(path.join(target.path, 'first.pack'), '12345');
  await writeFile(path.join(target.path, 'nested', 'second.pack'), '1234567');

  const [report] = await collectCacheReport([target]);
  assert.equal(report.exists, true);
  assert.equal(report.files, 2);
  assert.equal(report.bytes, 12);

  const [result] = await pruneCacheTargets({
    targets: [target],
    apply: false,
  });
  assert.equal(result.removed, false);
  assert.equal((await stat(target.path)).isDirectory(), true);
});

test('apply removes an approved cache root', async t => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'sdcorejs-cache-apply-'));
  t.after(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(repoRoot, { recursive: true, force: true });
  });

  const [target] = resolveCacheTargets(repoRoot, ['v19']);
  await mkdir(target.path, { recursive: true });
  await writeFile(path.join(target.path, 'cache.pack'), 'cache');

  const [result] = await pruneCacheTargets({
    targets: [target],
    apply: true,
    getActiveProcesses: () => [],
  });
  assert.equal(result.removed, true);
  await assert.rejects(
    () => stat(target.path),
    error => error.code === 'ENOENT'
  );
});

test('apply refuses to remove caches while a repository build or test is active', async t => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'sdcorejs-cache-active-'));
  t.after(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(repoRoot, { recursive: true, force: true });
  });

  const [target] = resolveCacheTargets(repoRoot, ['v19']);
  await mkdir(target.path, { recursive: true });

  await assert.rejects(
    () =>
      pruneCacheTargets({
        targets: [target],
        apply: true,
        getActiveProcesses: () => [{ pid: 42, name: 'node.exe', commandLine: 'ng test' }],
      }),
    /active build\/test process/u
  );
  assert.equal((await stat(target.path)).isDirectory(), true);
});

test('detects Angular work in this repository without flagging unrelated Node processes', () => {
  const repoRoot = path.resolve('repo');
  const angularCli = path.join(repoRoot, 'versions', 'v19', 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  const processes = [
    { pid: 10, name: 'node.exe', commandLine: `node ${angularCli} test --watch=false` },
    { pid: 11, name: 'node.exe', commandLine: 'node C:\\other-repo\\node_modules\\@angular\\cli\\bin\\ng.js build' },
    { pid: 12, name: 'node.exe', commandLine: `node ${path.join(repoRoot, 'scripts', 'cache-maintenance.mjs')} prune --apply` },
    { pid: 13, name: 'Code.exe', commandLine: repoRoot },
    {
      pid: 14,
      name: 'node.exe',
      commandLine: 'node --max_old_space_size=8000 ./node_modules/@angular/cli/bin/ng build sdcorejs-angular',
    },
  ];

  assert.deepEqual(
    filterActiveBuildProcesses(processes, repoRoot, 99).map(process => process.pid),
    [10, 14]
  );
});

test('apply rechecks active processes after measuring and before removal', async t => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'sdcorejs-cache-process-race-'));
  t.after(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(repoRoot, { recursive: true, force: true });
  });

  const [target] = resolveCacheTargets(repoRoot, ['v19']);
  await mkdir(target.path, { recursive: true });
  await writeFile(path.join(target.path, 'cache.pack'), 'cache');

  let checks = 0;
  await assert.rejects(
    () =>
      pruneCacheTargets({
        targets: [target],
        apply: true,
        getActiveProcesses: () => {
          checks += 1;
          return checks === 1 ? [] : [{ pid: 43, name: 'node.exe', commandLine: 'ng build' }];
        },
      }),
    /active build\/test process/u
  );

  assert.equal(checks, 2);
  assert.equal((await stat(target.path)).isDirectory(), true);
});

test('apply refuses a cache path that escapes through an ancestor junction or symlink', async t => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'sdcorejs-cache-link-escape-'));
  t.after(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  const repoRoot = path.join(fixtureRoot, 'repo');
  const externalRoot = path.join(fixtureRoot, 'external');
  const angularParent = path.join(repoRoot, 'versions', 'v19', '.angular');
  const sentinelPath = path.join(externalRoot, 'cache', 'sentinel.pack');
  await mkdir(path.dirname(angularParent), { recursive: true });
  await mkdir(path.dirname(sentinelPath), { recursive: true });
  await writeFile(sentinelPath, 'keep');
  await symlink(externalRoot, angularParent, process.platform === 'win32' ? 'junction' : 'dir');

  const [target] = resolveCacheTargets(repoRoot, ['v19']);
  await assert.rejects(
    () =>
      pruneCacheTargets({
        targets: [target],
        apply: true,
        getActiveProcesses: () => [],
      }),
    /unsafe|outside|symlink|junction/iu
  );
  assert.equal(await readFile(sentinelPath, 'utf8'), 'keep');
});

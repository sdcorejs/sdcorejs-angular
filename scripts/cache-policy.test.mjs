import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, ...relativePath.split('/')), 'utf8'));
}

test('every Angular workspace declares the bounded local cache policy', async () => {
  const expectedCachePolicy = {
    enabled: true,
    environment: 'local',
    path: '.angular/cache',
  };

  for (const workspace of ['versions/v19', 'versions/v20', 'versions/v21', 'versions/v22', 'showcase']) {
    const angularConfig = await readJson(`${workspace}/angular.json`);
    assert.deepEqual(angularConfig.cli?.cache, expectedCachePolicy, workspace);
  }
});

test('version workspaces route local tests through the no-cache wrapper', async () => {
  for (const workspace of ['v19', 'v20', 'v21', 'v22']) {
    const manifest = await readJson(`versions/${workspace}/package.json`);
    assert.equal(manifest.scripts.test, 'node ../../scripts/run-ng-test-no-cache.mjs', workspace);
    assert.equal(
      manifest.scripts['test:ci'],
      'node ../../scripts/run-ng-test-no-cache.mjs sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage',
      workspace
    );
  }
});

test('showcase keeps its test defaults while routing through the no-cache wrapper', async () => {
  const manifest = await readJson('showcase/package.json');
  assert.equal(
    manifest.scripts.test,
    'node ../scripts/run-ng-test-no-cache.mjs showcase --watch=false --browsers=ChromeHeadless --source-map=false'
  );
});

test('root scripts expose report, guarded prune, and their contract tests', async () => {
  const manifest = await readJson('package.json');
  assert.equal(manifest.scripts['cache:report'], 'node scripts/cache-maintenance.mjs report');
  assert.equal(manifest.scripts['cache:prune'], 'node scripts/cache-maintenance.mjs prune');
  assert.equal(
    manifest.scripts['test:cache-tools'],
    'node --test scripts/cache-maintenance.test.mjs scripts/run-ng-test-no-cache.test.mjs scripts/cache-policy.test.mjs'
  );
  assert.match(manifest.scripts['test:scripts'], /npm run test:cache-tools/u);
});

test('documented local test commands route through the no-cache npm scripts', async () => {
  const rootGuide = await readFile(path.join(repoRoot, 'CLAUDE.md'), 'utf8');

  assert.match(rootGuide, /npm run test:ci/u);
  assert.doesNotMatch(rootGuide, /npx ng test/u);
});

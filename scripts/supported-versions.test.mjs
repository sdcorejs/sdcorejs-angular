import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { applyAngular22EagerMigration } from './check-version-sync.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUPPORTED_MAJORS = [19, 20, 21, 22];
const SUPPORTED_WORKSPACES = SUPPORTED_MAJORS.map(major => `v${major}`);
const LOCKFILES = [
  'package-lock.json',
  'showcase/package-lock.json',
  ...SUPPORTED_WORKSPACES.map(workspace => `versions/${workspace}/package-lock.json`),
];
const SHARED_ANGULAR_PEERS = '^19.0.0 || ^20.0.0 || ^21.0.0';
const V22_NODE_ENGINES = '^22.22.3 || ^24.15.0 || ^26.0.0';
const CANONICAL_PRETTIER = '3.8.3';
const ANGULAR_PEER_NAMES = [
  '@angular/animations',
  '@angular/cdk',
  '@angular/common',
  '@angular/core',
  '@angular/forms',
  '@angular/material',
  '@angular/material-date-fns-adapter',
  '@angular/platform-browser',
  '@angular/router',
];
const V22_ROOT_ANGULAR_PACKAGES = [
  '@angular/animations',
  '@angular/cdk',
  '@angular/common',
  '@angular/compiler',
  '@angular/core',
  '@angular/forms',
  '@angular/material',
  '@angular/material-date-fns-adapter',
  '@angular/platform-browser',
  '@angular/platform-browser-dynamic',
  '@angular/router',
  '@angular-devkit/build-angular',
  '@angular/cli',
  '@angular/compiler-cli',
];
const ANGULAR_DEVKIT_ZERO_MAJOR_PACKAGES = new Set([
  '@angular-devkit/architect',
  '@angular-devkit/build-webpack',
]);
const LOCAL_OR_GIT_SPEC = /^(?:file:|link:|workspace:|github:|gitlab:|bitbucket:|gist:|git(?:\+[^:]+)?:|ssh:|\.\.?[\\/]|~[\\/]|[a-z]:[\\/]|[\\/]{1,2}|[a-z0-9_.-]+\/[a-z0-9_.-]+(?:#.*)?$)|\.git(?:#|$)/iu;

function readText(relativePath) {
  return readFileSync(join(REPO_ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function walkFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function orderedWorkspaceRecords(source) {
  return [...source.matchAll(/@\{\s*Folder\s*=\s*"v(\d+)"\s*;\s*Major\s*=\s*"(\d+)"\s*\}/gu)]
    .map(match => ({ workspace: `v${match[1]}`, major: Number(match[2]) }));
}

function sortedWorkspaceReferences(source) {
  const executableSource = source
    .split(/\r?\n/u)
    .filter(line => !line.trimStart().startsWith('#'))
    .join('\n');
  return [...new Set(
    [...executableSource.matchAll(/(?:versions\/|version:\s*)v(\d+)/gu)].map(match => Number(match[1])),
  )].sort((left, right) => left - right);
}

function assertV22RegistryLock(packages) {
  for (const [packagePath, packageEntry] of Object.entries(packages)) {
    const packageName = packagePath.slice(packagePath.lastIndexOf('node_modules/') + 'node_modules/'.length);
    let expectedVersion;
    if (packageName.startsWith('@angular/')) expectedVersion = /^22\./u;
    else if (ANGULAR_DEVKIT_ZERO_MAJOR_PACKAGES.has(packageName)) expectedVersion = /^0\.2201\./u;
    else if (packageName.startsWith('@angular-devkit/')) expectedVersion = /^22\./u;
    else if (packageName === 'angular-eslint' || packageName.startsWith('@angular-eslint/')) expectedVersion = /^22\./u;
    else if (packageName === 'typescript-eslint') expectedVersion = /^8\.60\.0$/u;
    else if (packageName === 'typescript') expectedVersion = /^6\.0\./u;
    else if (packageName === 'zone.js') expectedVersion = /^0\.16\./u;

    if (expectedVersion) {
      assert.match(
        packageEntry.version ?? '',
        expectedVersion,
        `${packagePath} resolved an unapproved toolchain version ${packageEntry.version ?? '<missing>'}`,
      );
    }

    assert.notEqual(packageEntry.link, true, `${packagePath || '<root>'} must not be a local link`);
    for (const field of ['version', 'resolved']) {
      const value = packageEntry[field];
      if (typeof value !== 'string') continue;
      assert.doesNotMatch(value, LOCAL_OR_GIT_SPEC, `${packagePath || '<root>'}.${field}`);
      if (field === 'resolved' && /^https?:/iu.test(value)) {
        assert.match(value, /^https:\/\/registry\.npmjs\.org\//iu, `${packagePath || '<root>'}.resolved must use the npm registry`);
      }
    }
  }
}

function resolvesLockedDependency(packages, packagePath, dependencyName) {
  const marker = 'node_modules/';
  const markerIndexes = [];
  let searchFrom = 0;
  while (true) {
    const index = packagePath.indexOf(marker, searchFrom);
    if (index < 0) break;
    markerIndexes.push(index);
    searchFrom = index + marker.length;
  }

  const candidates = packagePath ? [`${packagePath}/node_modules/${dependencyName}`] : [`node_modules/${dependencyName}`];
  candidates.push(...markerIndexes.reverse().map(index => {
    const prefix = packagePath.slice(0, index).replace(/\/$/u, '');
    return `${prefix ? `${prefix}/` : ''}node_modules/${dependencyName}`;
  }));

  return candidates.map(candidate => packages[candidate]).find(Boolean);
}

test('[workspace] repository contains exactly the four supported Angular workspaces', () => {
  const actual = readdirSync(join(REPO_ROOT, 'versions'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^v\d+$/u.test(entry.name))
    .map(entry => entry.name)
    .sort((left, right) => Number(left.slice(1)) - Number(right.slice(1)));

  assert.deepEqual(actual, SUPPORTED_WORKSPACES);
});

test('[workspace] root lockfile exactly represents the orchestrator manifest used by npm ci', () => {
  const manifest = readJson('package.json');
  const lock = readJson('package-lock.json');
  const root = lock.packages?.[''];

  assert.equal(lock.name, manifest.name);
  assert.equal(lock.version, manifest.version);
  assert.equal(root?.name, manifest.name);
  assert.equal(root?.version, manifest.version);
  assert.deepEqual(root?.dependencies ?? {}, manifest.dependencies ?? {});
  assert.deepEqual(root?.devDependencies ?? {}, manifest.devDependencies ?? {});

  for (const dependencyName of [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]) {
    assert.ok(
      lock.packages?.[`node_modules/${dependencyName}`],
      `root lockfile is missing direct dependency ${dependencyName}`,
    );
  }
});

test('[workspace] every lockfile retains complete cross-platform dependency closure', () => {
  for (const workspace of SUPPORTED_WORKSPACES) {
    const packages = readJson(`versions/${workspace}/package-lock.json`).packages ?? {};
    for (const [packagePath, packageEntry] of Object.entries(packages)) {
      const dependencies = {
        ...(packageEntry.dependencies ?? {}),
        ...(packageEntry.optionalDependencies ?? {}),
      };
      for (const [dependencyName, dependencySpec] of Object.entries(dependencies)) {
        const resolved = resolvesLockedDependency(packages, packagePath, dependencyName);
        assert.ok(
          resolved,
          `${workspace}:${packagePath} cannot resolve dependency ${dependencyName}`,
        );
        if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(dependencySpec)) {
          assert.equal(
            resolved.version,
            dependencySpec,
            `${workspace}:${packagePath} resolved ${dependencyName} to the wrong version`,
          );
        }
      }
    }
  }
});

test('[workspace] every registry package is pinned by URL and integrity in every lockfile', () => {
  for (const lockfile of LOCKFILES) {
    const packages = readJson(lockfile).packages ?? {};
    for (const [packagePath, packageEntry] of Object.entries(packages)) {
      if (!packagePath.startsWith('node_modules/') || packageEntry.link || !packageEntry.version) continue;

      assert.match(
        packageEntry.resolved ?? '',
        /^https:\/\/registry\.npmjs\.org\//u,
        `${lockfile}:${packagePath} must pin its npm registry tarball URL`,
      );
      assert.match(
        packageEntry.integrity ?? '',
        /^sha512-[A-Za-z0-9+/]+={0,2}$/u,
        `${lockfile}:${packagePath} must pin a SHA-512 integrity digest`,
      );
    }
  }
});

test('[workspace] root lint and script gates enumerate every line in order', () => {
  const scripts = readJson('package.json').scripts;

  for (const workspace of SUPPORTED_WORKSPACES) {
    assert.equal(scripts[`lint:${workspace}`], `npm --prefix versions/${workspace} run lint`);
  }
  assert.equal(
    scripts['lint:release'],
    SUPPORTED_WORKSPACES.map(workspace => `npm run lint:${workspace}`).join(' && '),
  );

  assert.equal(scripts['test:supported-versions'], 'node --test scripts/supported-versions.test.mjs');
  assert.equal(scripts['test:version-sync-contract'], 'node --test scripts/check-version-sync.test.mjs');
  assert.equal(scripts['test:release-package-contract'], 'node --test scripts/release-package-contract.test.mjs');
  assert.equal(scripts['test:publish-npm-workflow'], 'node --test scripts/publish-npm-workflow.test.mjs');
  assert.equal(
    scripts['test:cache-tools'],
    'node --test scripts/cache-maintenance.test.mjs scripts/run-ng-test-no-cache.test.mjs scripts/cache-policy.test.mjs',
  );

  assert.deepEqual(scripts['test:scripts'].split(' && '), [
    'npm run test:showcase-generators',
    'npm run test:showcase-branding',
    'npm run test:collect-docs',
    'npm run test:published-page',
    'npm run test:check-i18n',
    'npm run test:supported-versions',
    'npm run test:version-sync-contract',
    'npm run test:release-package-contract',
    'npm run test:publish-npm-workflow',
    'npm run test:cache-tools',
  ]);
});

test('[workspace] sync, deploy, lint and documentation tooling share one ordered version set', () => {
  const expectedRecords = SUPPORTED_MAJORS.map(major => ({ workspace: `v${major}`, major }));
  const syncSource = readText('scripts/sync-multi-version-workspaces.ps1');
  const deploySource = readText('scripts/deploy.ps1');
  const lintSource = readText('scripts/lint-phase.mjs');
  const collectDocsSource = readText('scripts/collect-docs.mjs');
  const collectReleaseDocsSource = readText('scripts/collect-release-docs.mjs');
  const legacyRecoverySource = readText('scripts/sync-from-vn-angular.ps1');

  assert.deepEqual(orderedWorkspaceRecords(syncSource), expectedRecords);
  assert.deepEqual(orderedWorkspaceRecords(deploySource), expectedRecords);
  assert.match(syncSource, /Order: v19.+v20.+v21.+v22/u);
  assert.match(syncSource, /Version workspaces synchronized: v19, v20, v21, v22/u);
  assert.match(legacyRecoverySource, /Rollout to v20, v21, v22 based on v19 workspace/u);
  assert.match(legacyRecoverySource, /versions\/v19 -> v20\/v21\/v22/u);

  const lintFolders = lintSource.match(/const versionFolders = new Set\(\[(.*?)\]\)/su)?.[1]
    .match(/v\d+/gu) ?? [];
  assert.deepEqual(lintFolders, SUPPORTED_WORKSPACES);

  const docsWorkspaces = [...collectDocsSource.matchAll(/\['v(\d+)',\s*(\d+)\]/gu)]
    .map(match => ({ workspace: `v${match[1]}`, major: Number(match[2]) }));
  assert.deepEqual(docsWorkspaces, expectedRecords);

  const releaseMajors = collectReleaseDocsSource.match(/const MAJORS = \[(.*?)\]/su)?.[1]
    .match(/\d+/gu)
    .map(Number) ?? [];
  assert.deepEqual(releaseMajors, SUPPORTED_MAJORS);
});

test('[workspace] Angular 22 manifest pins the reviewed toolchain without peer bypasses', () => {
  const manifestPath = join(REPO_ROOT, 'versions', 'v22', 'package.json');
  assert.ok(existsSync(manifestPath), 'versions/v22/package.json must exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  for (const dependency of [
    '@angular/animations',
    '@angular/cdk',
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/material',
    '@angular/material-date-fns-adapter',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
  ]) {
    assert.equal(manifest.dependencies[dependency], '~22.1.4', dependency);
  }
  assert.equal(manifest.dependencies['@sdcorejs/angular-material-datetime'], '1.0.4');
  assert.equal(manifest.dependencies['zone.js'], '~0.16.2');
  assert.equal(manifest.devDependencies['@angular-devkit/build-angular'], '~22.1.6');
  assert.equal(manifest.devDependencies['@angular/cli'], '~22.1.6');
  assert.equal(manifest.devDependencies['@angular/compiler-cli'], '~22.1.4');
  assert.equal(manifest.devDependencies['angular-eslint'], '~22.1.0');
  assert.equal(manifest.devDependencies['ng-packagr'], '~22.1.1');
  assert.equal(manifest.devDependencies.typescript, '~6.0.3');
  assert.equal(manifest.devDependencies['typescript-eslint'], '8.60.0');
  assert.equal(manifest.engines.node, V22_NODE_ENGINES);
  assert.equal(manifest.overrides, undefined);
});

test('[workspace] every generated line pins the canonical formatter used by the shared source', () => {
  for (const workspace of SUPPORTED_WORKSPACES) {
    const manifest = readJson(`versions/${workspace}/package.json`);
    assert.equal(manifest.devDependencies.prettier, CANONICAL_PRETTIER, workspace);
  }
});

test('[workspace] Angular 22 removes the TypeScript 6 baseUrl deprecation without suppressing it', () => {
  const config = readText('versions/v22/projects/sdcorejs-angular/tsconfig.spec.json');
  assert.doesNotMatch(config, /"baseUrl"\s*:/u);
  assert.doesNotMatch(config, /"ignoreDeprecations"\s*:/u);
  assert.match(config, /"@sdcorejs\/angular"\s*:\s*\["\.\/src\/public-api"\]/u);
  assert.match(config, /"@sdcorejs\/angular\/\*"\s*:\s*\["\.\/\*"\]/u);
});

test('[workspace] Angular 22 generated text has deterministic Git line-ending attributes', () => {
  const attributes = readText('versions/v22/.gitattributes');
  const syncScript = readText('scripts/sync-multi-version-workspaces.ps1');

  assert.match(attributes, /^\* text=auto eol=lf$/mu);
  for (const extension of ['html', 'scss', 'svg']) {
    assert.match(attributes, new RegExp(`^\\*\\.${extension} text eol=lf$`, 'mu'));
  }
  assert.match(attributes, /^\*\.woff2 -text$/mu);
  assert.match(syncScript, /\/XF CHANGELOG\.md package-lock\.json \.gitattributes/u);
});

test('[workspace] coverage bootstrap keeps the direct webpack-analyzable import.meta call', () => {
  for (const workspace of ['v19', 'v20', 'v21']) {
    const source = readText(`versions/${workspace}/projects/sdcorejs-angular/coverage-includes.spec.ts`);
    assert.match(source, /const webpackMeta\s*=\s*import\.meta\s+as\s+unknown/u, workspace);
    assert.match(source, /const sources\s*=\s*webpackMeta\.webpackContext\('\.\/'/u, workspace);
  }

  const source = readText('versions/v22/projects/sdcorejs-angular/coverage-includes.spec.ts');
  assert.doesNotMatch(source, /\bwebpackMeta\.webpackContext\s*\(/u, 'v22');
  assert.match(
    source,
    /const sources\s*=\s*\(\s*import\.meta\s+as\s+unknown\s+as\s+\{[\s\S]*?\}\s*\)\.webpackContext\('\.\/'/u,
    'v22',
  );
});

test('[workspace] every Angular 22 component explicitly preserves or reviews change detection', () => {
  const projectRoot = join(REPO_ROOT, 'versions/v22/projects/sdcorejs-angular');
  const componentFiles = walkFiles(projectRoot)
    .filter(path => path.endsWith('.ts'))
    .filter(path => /@Component\s*\(/u.test(readFileSync(path, 'utf8')));

  assert.ok(componentFiles.length > 200, 'the guard must cover the complete component and test-host surface');
  for (const path of componentFiles) {
    const source = readFileSync(path, 'utf8');
    assert.equal(
      applyAngular22EagerMigration(source),
      source,
      `${path} still relies on Angular 22's implicit OnPush default`,
    );
  }
});

test('[workspace] package manifests retain shared peers for v19-v21 and use v22-only peers for v22', () => {
  for (const major of [19, 20, 21]) {
    const manifest = readJson(`versions/v${major}/projects/sdcorejs-angular/package.json`);
    for (const peer of ANGULAR_PEER_NAMES) {
      assert.equal(manifest.peerDependencies[peer], SHARED_ANGULAR_PEERS, `v${major} ${peer}`);
    }
  }

  const manifest = readJson('versions/v22/projects/sdcorejs-angular/package.json');
  assert.match(manifest.version, /^22\./u);
  for (const peer of ANGULAR_PEER_NAMES) {
    assert.equal(manifest.peerDependencies[peer], '^22.0.0', peer);
  }
  assert.equal(manifest.peerDependencies.rxjs, '^7.8.0');
  assert.equal(manifest.dependencies['@sdcorejs/angular-material-datetime'], '1.0.4');
  assert.equal(manifest.engines.node, V22_NODE_ENGINES);
});

test('[workspace] Angular 22 lock resolves only the approved registry toolchain', () => {
  const lockPath = join(REPO_ROOT, 'versions', 'v22', 'package-lock.json');
  assert.ok(existsSync(lockPath), 'versions/v22/package-lock.json must exist');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const packages = lock.packages ?? {};

  const versionOf = name => packages[`node_modules/${name}`]?.version;
  for (const dependency of V22_ROOT_ANGULAR_PACKAGES) {
    assert.match(versionOf(dependency) ?? '', /^22\./u, dependency);
  }
  assert.match(versionOf('angular-eslint') ?? '', /^22\./u);
  assert.equal(versionOf('typescript-eslint'), '8.60.0');
  assert.match(versionOf('typescript') ?? '', /^6\.0\./u);
  assert.match(versionOf('zone.js') ?? '', /^0\.16\./u);
  assert.equal(versionOf('@sdcorejs/angular-material-datetime'), '1.0.4');

  const rootManifest = packages[''] ?? {};
  const declaredSpecs = {
    ...(rootManifest.dependencies ?? {}),
    ...(rootManifest.devDependencies ?? {}),
  };
  assert.equal(rootManifest.overrides, undefined);
  for (const [name, spec] of Object.entries(declaredSpecs)) {
    assert.doesNotMatch(spec, LOCAL_OR_GIT_SPEC, name);
  }
  assertV22RegistryLock(packages);
});

test('[workspace] Angular 22 lock guard rejects nested old Angular packages and local or Git resolutions', () => {
  assert.throws(() => assertV22RegistryLock({
    'node_modules/tool/node_modules/@angular/core': {
      version: '21.2.0',
      resolved: 'https://registry.npmjs.org/@angular/core/-/core-21.2.0.tgz',
    },
  }), /21\.2\.0/u);
  assert.throws(() => assertV22RegistryLock({
    'node_modules/@angular-devkit/architect': { version: '0.2102.4' },
  }), /0\.2102\.4/u);
  assert.throws(() => assertV22RegistryLock({
    'node_modules/local-package': { version: 'file:../local-package', link: true },
  }), /local link|file:/u);
  assert.throws(() => assertV22RegistryLock({
    'node_modules/git-package': { version: '1.0.0', resolved: 'git+https://github.com/example/package.git#abc123' },
  }), /git-package\.resolved/u);
  for (const spec of ['workspace:*', 'link:../pkg', 'github:owner/repo', 'gitlab:owner/repo', 'gist:1234', 'owner/repo', '../pkg', '/tmp/pkg', 'C:\\pkg']) {
    assert.throws(() => assertV22RegistryLock({
      'node_modules/local-or-git-package': { version: spec },
    }), /local-or-git-package\.version/u);
  }
  assert.throws(() => assertV22RegistryLock({
    'node_modules/tool/node_modules/typescript-eslint': { version: '8.26.0' },
  }), /8\.26\.0/u);
});

test('[release] CI and publish workflows enumerate exactly the four package lines', () => {
  assert.deepEqual(sortedWorkspaceReferences(readText('.github/workflows/ci.yml')), SUPPORTED_MAJORS);
  assert.deepEqual(sortedWorkspaceReferences(readText('.github/workflows/publish-npm.yml')), SUPPORTED_MAJORS);
});

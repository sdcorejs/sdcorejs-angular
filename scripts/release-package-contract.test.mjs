import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  createConsumerPackageJson,
  executePublishTransaction,
  releaseTargets,
  validatePackedManifest,
  validatePublicSurface,
  validateReleaseBundle,
} from './release-package-contract.mjs';

const SHARED_ANGULAR_PEER = '^19.0.0 || ^20.0.0 || ^21.0.0';
const V22_ANGULAR_PEER = '^22.0.0';
const V22_NODE_ENGINE = '^22.22.3 || ^24.15.0 || ^26.0.0';
const REPOSITORY = {
  type: 'git',
  url: 'git+https://github.com/sdcorejs/sdcorejs-angular.git',
};
const ANGULAR_PEER_KEYS = [
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
const EXPECTED_EXPORTS = {
  './package.json': { default: './package.json' },
  '.': { types: './index.d.ts', default: './fesm2022/sdcorejs-angular.mjs' },
  './components/button': {
    types: './components/button/index.d.ts',
    default: './fesm2022/sdcorejs-angular-components-button.mjs',
  },
  './forms/date-range': {
    types: './forms/date-range/index.d.ts',
    default: './fesm2022/sdcorejs-angular-forms-date-range.mjs',
  },
};
const EXPECTED_FILES = [
  'package.json',
  'index.d.ts',
  'fesm2022/sdcorejs-angular.mjs',
  'fesm2022/sdcorejs-angular-components-button.mjs',
  'fesm2022/sdcorejs-angular-forms-date-range.mjs',
  'components/button/index.d.ts',
  'forms/date-range/index.d.ts',
];

function angularPeers(value) {
  return Object.fromEntries(ANGULAR_PEER_KEYS.map(key => [key, value]));
}

function manifestFor(target) {
  const angularPeer = target.major === 22 ? V22_ANGULAR_PEER : SHARED_ANGULAR_PEER;
  return {
    name: '@sdcorejs/angular',
    version: target.version,
    repository: { ...REPOSITORY },
    ...(target.major === 22 ? { engines: { node: V22_NODE_ENGINE } } : { engines: { node: '>=20.11.0' } }),
    peerDependencies: {
      ...angularPeers(angularPeer),
      rxjs: '^7.8.0',
    },
    dependencies: {
      '@sdcorejs/angular-material-datetime': '1.0.4',
      '@sdcorejs/utils': '1.1.4',
    },
    exports: structuredClone(EXPECTED_EXPORTS),
  };
}

function publicSurfaceFor(target) {
  return {
    version: target.version,
    frameworkMajor: target.major,
    exports: structuredClone(EXPECTED_EXPORTS),
    declarations: {
      'index.d.ts': "export * from './components/index';\n",
      'components/button/index.d.ts': "export * from './src/button.component';\n",
      'forms/date-range/index.d.ts': "export * from './src/date-range.component';\n",
    },
    sourceFiles: {
      'components/button/src/button.component.ts': 'sha256:button-source',
      'forms/date-range/src/date-range.component.ts': 'sha256:date-range-source',
    },
  };
}

function artifactFor(target, index) {
  const manifest = manifestFor(target);
  const publicSurface = publicSurfaceFor(target);
  const baselineTarget = { ...target, version: target.baselineVersion, major: target.baselineMajor };
  return {
    target,
    tarball: `sdcorejs-angular-${target.version}.tgz`,
    sha256: String(index + 1).repeat(64),
    pack: {
      integrity: `sha512-${Buffer.alloc(64, index + 1).toString('base64')}`,
      shasum: String(index + 5).repeat(40),
      files: EXPECTED_FILES.map(path => ({ path })),
    },
    manifest,
    publicSurface,
    baseline: {
      ...publicSurfaceFor(baselineTarget),
      version: target.baselineVersion,
      frameworkMajor: target.baselineMajor,
    },
  };
}

test('releaseTargets returns the immutable 19/20/21/22 publish order and final-only latest', () => {
  assert.deepEqual(releaseTargets('2.5'), [
    { major: 19, workspace: 'v19', version: '19.2.5', tag: 'angular19', baselineVersion: '19.2.4', baselineMajor: 19 },
    { major: 20, workspace: 'v20', version: '20.2.5', tag: 'angular20', baselineVersion: '20.2.4', baselineMajor: 20 },
    { major: 21, workspace: 'v21', version: '21.2.5', tag: 'angular21', baselineVersion: '21.2.4', baselineMajor: 21 },
    { major: 22, workspace: 'v22', version: '22.2.5', tag: 'latest', baselineVersion: '21.2.4', baselineMajor: 21 },
  ]);
});

test('packed manifests keep historical peers and enforce the v22-only peer and engine contract', () => {
  for (const target of releaseTargets('2.5')) {
    assert.doesNotThrow(() =>
      validatePackedManifest({
        manifest: manifestFor(target),
        target,
        datetimeVersion: '1.0.4',
        expectedExports: EXPECTED_EXPORTS,
        expectedFiles: EXPECTED_FILES,
        packedFiles: EXPECTED_FILES,
      }),
    );
  }
});

test('packed manifest validation rejects identity, repository, peer, engine and datetime drift', () => {
  const target = releaseTargets('2.5').at(-1);
  const valid = manifestFor(target);
  const cases = [
    ['package name', { ...valid, name: '@sd-angular/core' }],
    ['package version', { ...valid, version: '22.2.4' }],
    ['repository missing', { ...valid, repository: undefined }],
    ['repository URL', { ...valid, repository: { ...REPOSITORY, url: 'git+https://github.com/example/fork.git' } }],
    ['repository directory', { ...valid, repository: { ...REPOSITORY, directory: 'versions/v22' } }],
    ['Angular peer', { ...valid, peerDependencies: { ...valid.peerDependencies, '@angular/core': SHARED_ANGULAR_PEER } }],
    ['Node engine', { ...valid, engines: { node: '>=22' } }],
    [
      'datetime dependency',
      { ...valid, dependencies: { ...valid.dependencies, '@sdcorejs/angular-material-datetime': '^1.0.4' } },
    ],
  ];

  for (const [label, manifest] of cases) {
    assert.throws(
      () =>
        validatePackedManifest({
          manifest,
          target,
          datetimeVersion: '1.0.4',
          expectedExports: EXPECTED_EXPORTS,
          expectedFiles: EXPECTED_FILES,
          packedFiles: EXPECTED_FILES,
        }),
      undefined,
      label,
    );
  }
});

test('packed manifest validation rejects unexpected exports and packed files', () => {
  const target = releaseTargets('2.5')[0];
  const manifest = manifestFor(target);

  assert.throws(() =>
    validatePackedManifest({
      manifest: { ...manifest, exports: { ...manifest.exports, './internal': './internal.js' } },
      target,
      datetimeVersion: '1.0.4',
      expectedExports: EXPECTED_EXPORTS,
      expectedFiles: EXPECTED_FILES,
      packedFiles: EXPECTED_FILES,
    }),
  );
  assert.throws(() =>
    validatePackedManifest({
      manifest,
      target,
      datetimeVersion: '1.0.4',
      expectedExports: EXPECTED_EXPORTS,
      expectedFiles: EXPECTED_FILES,
      packedFiles: [...EXPECTED_FILES, 'src/private.ts'],
    }),
  );
  assert.throws(() =>
    validatePackedManifest({
      manifest,
      target,
      datetimeVersion: '1.0.4',
      expectedExports: EXPECTED_EXPORTS,
      expectedFiles: EXPECTED_FILES,
      packedFiles: [...EXPECTED_FILES, 'components/button/button.component.spec.d.ts'],
    }),
  );
});

test('public surfaces use exact 2.4 baselines and normalize only release/framework metadata', () => {
  for (const target of releaseTargets('2.5')) {
    const candidate = publicSurfaceFor(target);
    const baselineTarget = { ...target, version: target.baselineVersion, major: target.baselineMajor };
    const baseline = publicSurfaceFor(baselineTarget);

    assert.doesNotThrow(() => validatePublicSurface({ candidate, baseline, target }));
  }
});

test('public surface validation rejects source, export and declaration changes', () => {
  const target = releaseTargets('2.5')[3];
  const candidate = publicSurfaceFor(target);
  const baselineTarget = { ...target, version: target.baselineVersion, major: target.baselineMajor };
  const baseline = publicSurfaceFor(baselineTarget);

  assert.throws(() =>
    validatePublicSurface({
      target,
      baseline,
      candidate: { ...candidate, sourceFiles: { ...candidate.sourceFiles, 'forms/date-range/src/date-range.component.ts': 'changed' } },
    }),
  );
  assert.throws(() =>
    validatePublicSurface({
      target,
      baseline,
      candidate: { ...candidate, exports: { ...candidate.exports, './new-entry': './new-entry.js' } },
    }),
  );
  assert.throws(() =>
    validatePublicSurface({
      target,
      baseline,
      candidate: {
        ...candidate,
        declarations: { ...candidate.declarations, 'index.d.ts': `${candidate.declarations['index.d.ts']}export type NewApi = true;\n` },
      },
    }),
  );
});

test('release bundle is complete and immutable before returning a publish plan', () => {
  const targets = releaseTargets('2.5');
  const bundle = {
    sourceSha: '0123456789abcdef0123456789abcdef01234567',
    artifacts: targets.map(artifactFor),
  };

  assert.deepEqual(validateReleaseBundle({ suffix: '2.5', datetimeVersion: '1.0.4', ...bundle }), {
    sourceSha: bundle.sourceSha,
    publishOrder: targets.map((target, index) => ({
      major: target.major,
      version: target.version,
      tag: target.tag,
      tarball: bundle.artifacts[index].tarball,
      sha256: bundle.artifacts[index].sha256,
      integrity: bundle.artifacts[index].pack.integrity,
      shasum: bundle.artifacts[index].pack.shasum,
    })),
  });
});

test('release bundle refuses any plan until all four tarballs, hashes and one source SHA exist', () => {
  const targets = releaseTargets('2.5');
  const completeArtifacts = targets.map(artifactFor);
  const cases = [
    ['one artifact missing', { sourceSha: '0123456789abcdef0123456789abcdef01234567', artifacts: completeArtifacts.slice(0, 3) }],
    ['source SHA missing', { sourceSha: '', artifacts: completeArtifacts }],
    [
      'tarball missing',
      { sourceSha: '0123456789abcdef0123456789abcdef01234567', artifacts: completeArtifacts.map((item, index) => (index === 1 ? { ...item, tarball: '' } : item)) },
    ],
    [
      'SHA-256 missing',
      { sourceSha: '0123456789abcdef0123456789abcdef01234567', artifacts: completeArtifacts.map((item, index) => (index === 1 ? { ...item, sha256: '' } : item)) },
    ],
    [
      'npm integrity missing',
      { sourceSha: '0123456789abcdef0123456789abcdef01234567', artifacts: completeArtifacts.map((item, index) => (index === 1 ? { ...item, pack: { ...item.pack, integrity: '' } } : item)) },
    ],
    [
      'npm shasum missing',
      { sourceSha: '0123456789abcdef0123456789abcdef01234567', artifacts: completeArtifacts.map((item, index) => (index === 1 ? { ...item, pack: { ...item.pack, shasum: '' } } : item)) },
    ],
  ];

  for (const [label, bundle] of cases) {
    assert.throws(
      () => validateReleaseBundle({ suffix: '2.5', datetimeVersion: '1.0.4', ...bundle }),
      undefined,
      label,
    );
  }
});

test('publish transaction preflights every artifact before publishing and verifies the exact validated order', async () => {
  const targets = releaseTargets('2.5');
  const plan = validateReleaseBundle({
    suffix: '2.5',
    datetimeVersion: '1.0.4',
    sourceSha: '0123456789abcdef0123456789abcdef01234567',
    artifacts: targets.map(artifactFor),
  });
  const events = [];

  await executePublishTransaction({
    plan,
    preflightArtifact: async target => {
      events.push(`preflight:${target.version}`);
      return { action: 'publish' };
    },
    publishArtifact: async target => events.push(`publish:${target.version}:${target.tag}`),
    verifyArtifact: async target => events.push(`verify:${target.version}:${target.tag}`),
  });

  assert.deepEqual(events, [
    'preflight:19.2.5',
    'preflight:20.2.5',
    'preflight:21.2.5',
    'preflight:22.2.5',
    'publish:19.2.5:angular19',
    'verify:19.2.5:angular19',
    'publish:20.2.5:angular20',
    'verify:20.2.5:angular20',
    'publish:21.2.5:angular21',
    'verify:21.2.5:angular21',
    'publish:22.2.5:latest',
    'verify:22.2.5:latest',
  ]);
});

test('publish transaction aborts all publication when the final preflight collides', async () => {
  const targets = releaseTargets('2.5');
  const plan = validateReleaseBundle({
    suffix: '2.5',
    datetimeVersion: '1.0.4',
    sourceSha: '0123456789abcdef0123456789abcdef01234567',
    artifacts: targets.map(artifactFor),
  });
  const published = [];

  await assert.rejects(() => executePublishTransaction({
    plan,
    preflightArtifact: async target => {
      if (target.version === '22.2.5') throw new Error('immutable registry collision');
      return { action: 'publish' };
    },
    publishArtifact: async target => published.push(target.version),
    verifyArtifact: async () => undefined,
  }), /immutable registry collision/u);
  assert.deepEqual(published, []);
});

test('publish transaction reuses an exact recovery artifact but still verifies every line', async () => {
  const targets = releaseTargets('2.5');
  const plan = validateReleaseBundle({
    suffix: '2.5',
    datetimeVersion: '1.0.4',
    sourceSha: '0123456789abcdef0123456789abcdef01234567',
    artifacts: targets.map(artifactFor),
  });
  const published = [];
  const verified = [];

  await executePublishTransaction({
    plan,
    preflightArtifact: async target => ({ action: target.version === '20.2.5' ? 'reuse' : 'publish' }),
    publishArtifact: async target => published.push(target.version),
    verifyArtifact: async target => verified.push(target.version),
  });

  assert.deepEqual(published, ['19.2.5', '21.2.5', '22.2.5']);
  assert.deepEqual(verified, ['19.2.5', '20.2.5', '21.2.5', '22.2.5']);
});

test('strict consumer fixture preserves the documented syntax and direct utils subpath imports', () => {
  const source = readFileSync(new URL('./fixtures/package-consumer/fixture.component.ts', import.meta.url), 'utf8');
  const tsconfig = JSON.parse(readFileSync(new URL('./fixtures/package-consumer/tsconfig.json', import.meta.url), 'utf8'));

  assert.match(source, /from '@sdcorejs\/angular\/components\/button'/u);
  assert.match(source, /from '@sdcorejs\/angular\/forms\/date-range'/u);
  assert.match(source, /from '@sdcorejs\/utils\/fns'/u);
  assert.match(source, /from '@sdcorejs\/utils\/models'/u);
  assert.match(source, /from '@sdcorejs\/utils\/constants'/u);
  assert.doesNotMatch(source, /@sdcorejs\/angular\/utilities/u);
  assert.match(source, /template: '<sd-button \[color\]="color">Save<\/sd-button><sd-date-range \/>'/u);
  assert.match(source, /readonly color: Color = 'primary'/u);
  assert.match(source, /readonly empty = EMPTY_STR/u);
  assert.match(source, /readonly utilities = Utilities/u);
  assert.equal(tsconfig.compilerOptions.strict, true);
  assert.equal(tsconfig.compilerOptions.skipLibCheck, false);
  assert.equal(tsconfig.angularCompilerOptions.strictTemplates, true);
});

test('every generated strict consumer declares exact direct utils and its matching candidate tarball', () => {
  for (const target of releaseTargets('2.5')) {
    const candidateManifest = manifestFor(target);
    const angularVersion = target.major === 22 ? '22.1.4' : `${target.major}.0.0`;
    const consumer = createConsumerPackageJson({
      target,
      candidateManifest,
      tarballPath: `../artifacts/sdcorejs-angular-${target.version}.tgz`,
      angularVersion,
    });

    assert.equal(consumer.dependencies['@sdcorejs/utils'], '1.1.4');
    assert.equal(consumer.dependencies['@sdcorejs/angular'], `file:../artifacts/sdcorejs-angular-${target.version}.tgz`);
    for (const dependency of ANGULAR_PEER_KEYS) assert.equal(consumer.dependencies[dependency], angularVersion);
    assert.ok(Object.hasOwn(consumer.dependencies, '@sdcorejs/utils'));
  }

  const target = releaseTargets('2.5')[0];
  const missingUtils = manifestFor(target);
  delete missingUtils.dependencies['@sdcorejs/utils'];
  assert.throws(() =>
    createConsumerPackageJson({
      target,
      candidateManifest: missingUtils,
      tarballPath: '../candidate.tgz',
      angularVersion: '19.0.0',
    }),
  );
});

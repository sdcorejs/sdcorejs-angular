import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  createConsumerPackageJson,
  executePublishTransaction,
  publishTarballWithNpm,
  publishValidatedBundle,
  readPublicSurface,
  releaseTargets,
  resolveNpmInvocation,
  runReleaseCli,
  runNpmCli,
  validatePackedFileInventory,
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

test('npm CLI runner avoids direct .cmd execution and works on the current platform', () => {
  assert.deepEqual(
    resolveNpmInvocation(['--version'], {
      platform: 'win32',
      nodeExecutable: 'C:\\runtime\\node.exe',
      npmExecPath: 'C:\\runtime\\node_modules\\npm\\bin\\npm-cli.js',
    }),
    {
      executable: 'C:\\runtime\\node.exe',
      args: ['C:\\runtime\\node_modules\\npm\\bin\\npm-cli.js', '--version'],
    },
  );

  const result = runNpmCli(['--version']);
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/u);
});

test('production publish invocation uses the exact validated tarball, tag, access and provenance arguments', () => {
  const calls = [];
  const target = releaseTargets('2.5')[1];
  const tarballPath = 'C:\\artifacts\\sdcorejs-angular-20.2.5.tgz';

  const result = publishTarballWithNpm(target, tarballPath, (args, options) => {
    calls.push({ args, options });
    return commandResult(0);
  });

  assert.equal(result.status, 0);
  assert.deepEqual(calls, [{
    args: ['publish', tarballPath, '--access', 'public', '--tag', 'angular20', '--provenance'],
    options: { allowFailure: true },
  }]);
});

test('CLI fails closed at its argument boundary before touching release artifacts', () => {
  const cliPath = fileURLToPath(new URL('./release-package-contract.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [cliPath], { encoding: 'utf8', windowsHide: true });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    process.version === 'v22.22.3'
      ? /Required: --artifact-root, --suffix, --baseline-suffix and --datetime-version\./u
      : /Release verification requires exact Node v22\.22\.3/u,
  );
});

test('CLI enforces exact runtime, provenance pairing, OIDC and token-free trusted publishing', async () => {
  const argv = [
    'node',
    'release-package-contract.mjs',
    '--artifact-root',
    'release-artifacts',
    '--suffix',
    '2.5',
    '--baseline-suffix',
    '2.4',
    '--datetime-version',
    '1.0.4',
  ];
  const base = { argv, pathExists: () => true, materialize: () => assert.fail('must fail before materialization') };

  await assert.rejects(() => runReleaseCli({ ...base, nodeVersion: 'v22.22.2' }), /requires exact Node v22\.22\.3/u);
  await assert.rejects(
    () => runReleaseCli({ ...base, nodeVersion: 'v22.22.3', argv: [...argv, '--require-provenance'] }),
    /valid only with --publish/u,
  );
  await assert.rejects(
    () => runReleaseCli({ ...base, nodeVersion: 'v22.22.3', argv: [...argv, '--publish'], env: { GITHUB_ACTIONS: 'true' } }),
    /GitHub OIDC environment is unavailable/u,
  );
  for (const tokenName of ['NODE_AUTH_TOKEN', 'NPM_TOKEN']) {
    await assert.rejects(
      () =>
        runReleaseCli({
          ...base,
          nodeVersion: 'v22.22.3',
          argv: [...argv, '--publish'],
          env: {
            GITHUB_ACTIONS: 'true',
            ACTIONS_ID_TOKEN_REQUEST_URL: 'https://actions.example/oidc',
            ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'oidc-request-token',
            [tokenName]: 'long-lived-token',
          },
        }),
      /Long-lived npm credentials are prohibited/u,
      tokenName,
    );
  }
});

test('CLI validation compiles consumers without publishing and authorized mode delegates provenance publication', async () => {
  const argv = [
    'node',
    'release-package-contract.mjs',
    '--artifact-root',
    'release-artifacts',
    '--suffix',
    '2.5',
    '--baseline-suffix',
    '2.4',
    '--datetime-version',
    '1.0.4',
  ];
  const bundle = { ...bundleForPublication(), cleanup: () => events.push('cleanup') };
  const events = [];
  const outputs = [];
  const common = {
    nodeVersion: 'v22.22.3',
    pathExists: () => true,
    materialize: options => {
      events.push(`materialize:${options.suffix}:${options.baselineSuffix}:${options.datetimeVersion}`);
      return bundle;
    },
    compileConsumers: value => {
      assert.equal(value, bundle);
      events.push('compile');
    },
    publishBundle: async (_value, requireProvenance) => {
      events.push(`publish:${requireProvenance}`);
      return { verified: true };
    },
    writeOutput: output => outputs.push(output),
  };

  const validation = await runReleaseCli({ ...common, argv: [...argv, '--compile-consumers'], env: {} });
  assert.equal(validation.consumersCompiled, true);
  assert.equal(validation.publication, undefined);
  assert.deepEqual(events, ['materialize:2.5:2.4:1.0.4', 'compile', 'cleanup']);
  assert.equal(outputs.length, 1);

  events.length = 0;
  outputs.length = 0;
  const publication = await runReleaseCli({
    ...common,
    argv: [...argv, '--publish', '--require-provenance'],
    env: {
      GITHUB_ACTIONS: 'true',
      ACTIONS_ID_TOKEN_REQUEST_URL: 'https://actions.example/oidc',
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'oidc-request-token',
    },
  });
  assert.deepEqual(events, ['materialize:2.5:2.4:1.0.4', 'publish:true', 'cleanup']);
  assert.deepEqual(publication.publication, { verified: true });
  assert.equal(outputs.length, 1);
  assert.equal(JSON.parse(outputs[0]).artifacts.length, 4);
});

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
    typings: 'index.d.ts',
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

function bundleForPublication() {
  const targets = releaseTargets('2.5');
  const artifacts = targets.map(artifactFor);
  return {
    plan: validateReleaseBundle({
      suffix: '2.5',
      datetimeVersion: '1.0.4',
      sourceSha: '0123456789abcdef0123456789abcdef01234567',
      artifacts,
    }),
    artifacts,
    tarballPaths: new Map(targets.map(target => [target.version, `C:\\artifacts\\sdcorejs-angular-${target.version}.tgz`])),
  };
}

function commandResult(status, stderr = '') {
  return { status, stdout: '', stderr, error: undefined };
}

function createRegistryHarness({ dists = {}, tags = { latest: '21.2.4' }, publishOnce } = {}) {
  const registryDists = new Map(Object.entries(dists));
  const registryTags = { ...tags };
  const events = [];
  const publishCounts = new Map();

  const succeed = target => {
    registryDists.set(target.version, {
      integrity: target.integrity,
      shasum: target.shasum,
      attestations: { url: `https://registry.example/${target.version}` },
    });
    registryTags[target.tag] = target.version;
    return commandResult(0);
  };

  return {
    dists: registryDists,
    tags: registryTags,
    events,
    publishCounts,
    adapter: {
      viewDist: version => {
        events.push(`view:${version}`);
        return registryDists.get(version) ?? null;
      },
      viewTags: () => {
        events.push('tags');
        return { ...registryTags };
      },
      verifyDownloaded: target => events.push(`download:${target.version}`),
      sleep: async () => undefined,
      publishOnce: (target, tarballPath) => {
        events.push(`publish:${target.version}:${target.tag}:${tarballPath}`);
        publishCounts.set(target.version, (publishCounts.get(target.version) ?? 0) + 1);
        return publishOnce?.({ target, tarballPath, registryDists, registryTags, succeed }) ?? succeed(target);
      },
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

test('packed manifest validation follows the APF declaration entry instead of assuming root index.d.ts', () => {
  const target = releaseTargets('2.5')[2];
  const manifest = manifestFor(target);
  const exports = {
    './package.json': { default: './package.json' },
    '.': {
      types: './types/sdcorejs-angular.d.ts',
      default: './fesm2022/sdcorejs-angular.mjs',
    },
    './components/button': {
      types: './types/sdcorejs-angular-components-button.d.ts',
      default: './fesm2022/sdcorejs-angular-components-button.mjs',
    },
  };
  const files = [
    'package.json',
    'types/sdcorejs-angular.d.ts',
    'types/sdcorejs-angular-components-button.d.ts',
    'fesm2022/sdcorejs-angular.mjs',
    'fesm2022/sdcorejs-angular-components-button.mjs',
  ];

  assert.doesNotThrow(() =>
    validatePackedManifest({
      manifest: {
        ...manifest,
        typings: 'types/sdcorejs-angular.d.ts',
        exports,
      },
      target,
      datetimeVersion: '1.0.4',
      expectedExports: exports,
      expectedFiles: files,
      packedFiles: files,
    }),
  );
});

test('packed declaration entries and npm metadata must point to files physically extracted from the tarball', () => {
  const target = releaseTargets('2.5')[2];
  const manifest = manifestFor(target);

  assert.throws(
    () =>
      validatePackedManifest({
        manifest,
        target,
        datetimeVersion: '1.0.4',
        expectedExports: EXPECTED_EXPORTS,
        expectedFiles: EXPECTED_FILES,
        packedFiles: EXPECTED_FILES.filter(path => path !== 'components/button/index.d.ts'),
      }),
    /packed files mismatch|types export .* is absent/u,
  );
  assert.doesNotThrow(() =>
    validatePackedFileInventory({
      target,
      metadataFiles: EXPECTED_FILES.map(path => ({ path })),
      extractedFiles: EXPECTED_FILES,
    }),
  );
  assert.throws(
    () =>
      validatePackedFileInventory({
        target,
        metadataFiles: EXPECTED_FILES.map(path => ({ path })),
        extractedFiles: EXPECTED_FILES.filter(path => path !== 'index.d.ts'),
      }),
    /npm pack metadata inventory mismatch/u,
  );
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

test('production public-surface reader captures normalized authored sources from packed sourcemaps', () => {
  const packageRoot = mkdtempSync(join(tmpdir(), 'sdcorejs-public-surface-'));
  try {
    mkdirSync(join(packageRoot, 'fesm2022'), { recursive: true });
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({ exports: { '.': { types: './index.d.ts', default: './fesm2022/sdcorejs-angular.mjs' } } }),
    );
    writeFileSync(join(packageRoot, 'index.d.ts'), 'export declare class SdButton {}\n');
    writeFileSync(
      join(packageRoot, 'fesm2022', 'sdcorejs-angular.mjs.map'),
      JSON.stringify({
        version: 3,
        file: 'sdcorejs-angular.mjs',
        sources: ['../../../projects/sdcorejs-angular/components/button/src/button.component.ts'],
        sourcesContent: ['export class SdButton {}\r\n'],
        names: [],
        mappings: '',
      }),
    );

    const surface = readPublicSurface(packageRoot, '19.2.5', 19);
    assert.deepEqual(surface.sourceFiles, {
      'components/button/src/button.component.ts': 'export class SdButton {}\n',
    });
  }
  finally {
    rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('v22 source comparison permits only the deterministic Angular 22 component migration', () => {
  const target = releaseTargets('2.5')[3];
  const baseline = publicSurfaceFor({ ...target, version: target.baselineVersion, major: target.baselineMajor });
  const candidate = publicSurfaceFor(target);
  const path = 'components/example/src/example.component.ts';
  baseline.sourceFiles = {
    [path]: "import { Component } from '@angular/core';\n@Component({\n  selector: 'sd-example',\n})\nexport class Example {}\n",
  };
  candidate.sourceFiles = {
    [path]: "import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';\nimport { Component } from '@angular/core';\n@Component({\n  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,\n  selector: 'sd-example',\n})\nexport class Example {}\n",
  };

  assert.doesNotThrow(() => validatePublicSurface({ candidate, baseline, target }));
  assert.throws(() =>
    validatePublicSurface({
      candidate: { ...candidate, sourceFiles: { ...candidate.sourceFiles, [path]: `${candidate.sourceFiles[path]}export const drift = true;\n` } },
      baseline,
      target,
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

test('publish transaction reports already verified immutable successes when a later line fails', async () => {
  const plan = bundleForPublication().plan;

  await assert.rejects(
    () =>
      executePublishTransaction({
        plan,
        preflightArtifact: async () => ({ action: 'publish' }),
        publishArtifact: async target => {
          if (target.version === '20.2.5') throw new Error('v20 publish failed');
        },
        verifyArtifact: async () => undefined,
      }),
    error => {
      assert.match(error.message, /v20 publish failed/u);
      assert.match(error.message, /Verified immutable successes: 19\.2\.5 \(publish\)/u);
      assert.deepEqual(error.completedResults, [{ version: '19.2.5', action: 'publish', verified: true }]);
      return true;
    },
  );
});

test('registry transaction preflights all artifacts, publishes exact tags in order and moves latest only for v22', async () => {
  const bundle = bundleForPublication();
  const registry = createRegistryHarness();

  const result = await publishValidatedBundle(bundle, true, registry.adapter);

  const firstPublish = registry.events.findIndex(event => event.startsWith('publish:'));
  assert.deepEqual(registry.events.slice(0, firstPublish), [
    'tags',
    'view:19.2.5',
    'view:20.2.5',
    'view:21.2.5',
    'view:22.2.5',
  ]);
  assert.deepEqual(
    registry.events.filter(event => event.startsWith('publish:')).map(event => event.split(':').slice(1, 3).join(':')),
    ['19.2.5:angular19', '20.2.5:angular20', '21.2.5:angular21', '22.2.5:latest'],
  );
  assert.equal(registry.tags.latest, '22.2.5');
  assert.deepEqual(result.results.map(item => item.action), ['publish', 'publish', 'publish', 'publish']);
});

test('registry transaction rejects a final immutable collision before publishing anything', async () => {
  const bundle = bundleForPublication();
  const registry = createRegistryHarness({
    dists: {
      '22.2.5': { integrity: 'sha512-different', shasum: 'f'.repeat(40), attestations: { url: 'different' } },
    },
  });

  await assert.rejects(() => publishValidatedBundle(bundle, true, registry.adapter), /immutable registry collision/u);
  assert.deepEqual(registry.events.filter(event => event.startsWith('publish:')), []);
});

test('registry transaction rejects an unexpected starting latest before publishing anything', async () => {
  const bundle = bundleForPublication();
  const registry = createRegistryHarness({ tags: { latest: '23.0.0' } });

  await assert.rejects(
    () => publishValidatedBundle(bundle, true, registry.adapter),
    /unexpected initial latest 23\.0\.0/u,
  );
  assert.deepEqual(registry.events.filter(event => event.startsWith('publish:')), []);
});

test('registry transaction reuses only an exact, correctly tagged provenance artifact', async () => {
  const bundle = bundleForPublication();
  const recovered = bundle.plan.publishOrder[0];
  const exactDist = {
    integrity: recovered.integrity,
    shasum: recovered.shasum,
    attestations: { url: 'https://registry.example/recovered' },
  };
  const registry = createRegistryHarness({
    dists: { [recovered.version]: exactDist },
    tags: { latest: '21.2.4', angular19: recovered.version },
  });

  const result = await publishValidatedBundle(bundle, true, registry.adapter);

  assert.equal(registry.publishCounts.get(recovered.version), undefined);
  assert.ok(registry.events.filter(event => event === `download:${recovered.version}`).length >= 2);
  assert.equal(result.decisions[recovered.version].action, 'reuse');

  for (const [label, dist, tags, pattern] of [
    ['provenance', { integrity: recovered.integrity, shasum: recovered.shasum }, { latest: '21.2.4', angular19: recovered.version }, /no provenance/u],
    ['tag', exactDist, { latest: '21.2.4', angular19: '19.2.4' }, /recovery tag angular19 is incorrect/u],
  ]) {
    const invalid = createRegistryHarness({ dists: { [recovered.version]: dist }, tags });
    await assert.rejects(() => publishValidatedBundle(bundle, true, invalid.adapter), pattern, label);
    assert.deepEqual(invalid.events.filter(event => event.startsWith('publish:')), [], label);
  }
});

test('registry transaction bounds uncertain publish retries and rejects a different observed artifact', async () => {
  const bundle = bundleForPublication();
  const firstVersion = bundle.plan.publishOrder[0].version;
  const observed = createRegistryHarness({
    publishOnce: ({ target, registryDists, registryTags }) => {
      if (target.version === firstVersion) {
        registryDists.set(target.version, {
          integrity: target.integrity,
          shasum: target.shasum,
          attestations: { url: 'https://registry.example/uncertain-success' },
        });
        registryTags[target.tag] = target.version;
        return commandResult(1, 'socket closed after upload');
      }
      registryDists.set(target.version, {
        integrity: target.integrity,
        shasum: target.shasum,
        attestations: { url: 'https://registry.example/success' },
      });
      registryTags[target.tag] = target.version;
      return commandResult(0);
    },
  });

  await publishValidatedBundle(bundle, true, observed.adapter);
  assert.equal(observed.publishCounts.get(firstVersion), 1);

  const retry = createRegistryHarness({
    publishOnce: ({ target, succeed }) =>
      target.version === firstVersion && (retry.publishCounts.get(target.version) ?? 0) === 1
        ? commandResult(1, 'temporary registry timeout')
        : succeed(target),
  });
  await publishValidatedBundle(bundle, true, retry.adapter);
  assert.equal(retry.publishCounts.get(firstVersion), 2);

  const collision = createRegistryHarness({
    publishOnce: ({ target, registryDists }) => {
      registryDists.set(target.version, { integrity: 'sha512-different', shasum: 'e'.repeat(40) });
      return commandResult(1, 'uncertain response');
    },
  });
  await assert.rejects(
    () => publishValidatedBundle(bundle, true, collision.adapter),
    /registry contains a different artifact after an uncertain publish response/u,
  );
  assert.equal(collision.publishCounts.get(firstVersion), 1);
});

test('registry transaction fails if historical publication moves latest', async () => {
  const bundle = bundleForPublication();
  const registry = createRegistryHarness({
    publishOnce: ({ target, registryTags, succeed }) => {
      const result = succeed(target);
      if (target.major < 22) registryTags.latest = target.version;
      return result;
    },
  });

  await assert.rejects(() => publishValidatedBundle(bundle, true, registry.adapter), /historical publication moved latest/u);
  assert.equal(registry.publishCounts.get('19.2.5'), 1);
  assert.equal(registry.publishCounts.get('20.2.5'), undefined);
});

test('registry transaction fails if the final v22 artifact does not move latest', async () => {
  const bundle = bundleForPublication();
  const registry = createRegistryHarness({
    publishOnce: ({ target, registryTags, succeed }) => {
      const result = succeed(target);
      if (target.major === 22) registryTags.latest = '21.2.4';
      return result;
    },
  });

  await assert.rejects(() => publishValidatedBundle(bundle, true, registry.adapter), /final latest tag was not promoted/u);
  assert.equal(registry.publishCounts.get('22.2.5'), 1);
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

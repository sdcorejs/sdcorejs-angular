#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

import { compareNormalizedWorkspaceContent } from './check-version-sync.mjs';

const PACKAGE_NAME = '@sdcorejs/angular';
const REPOSITORY = {
  type: 'git',
  url: 'git+https://github.com/sdcorejs/sdcorejs-angular.git',
};
const SHARED_ANGULAR_PEER = '^19.0.0 || ^20.0.0 || ^21.0.0';
const V22_ANGULAR_PEER = '^22.0.0';
const HISTORICAL_NODE_ENGINE = '>=20.11.0';
const V22_NODE_ENGINE = '^22.22.3 || ^24.15.0 || ^26.0.0';
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
const ANGULAR_MATERIAL_KEYS = new Set([
  '@angular/cdk',
  '@angular/material',
  '@angular/material-date-fns-adapter',
]);
const TYPESCRIPT_BY_MAJOR = new Map([
  [19, '~5.7.2'],
  [20, '~5.8.3'],
  [21, '~5.9.3'],
  [22, '~6.0.3'],
]);
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertExact(actual, expected, label) {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${label} mismatch.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function parseSuffix(suffix) {
  const match = /^(\d+)\.(\d+)$/u.exec(String(suffix));
  invariant(match, `Invalid stable release suffix "${suffix}"; expected <minor>.<patch>, for example 2.5.`);
  const releaseMinor = Number(match[1]);
  const releasePatch = Number(match[2]);
  invariant(releasePatch > 0, `Release suffix "${suffix}" has no automatic 2.4-style baseline.`);
  return { releaseMinor, releasePatch };
}

export function releaseTargets(suffix) {
  const { releaseMinor, releasePatch } = parseSuffix(suffix);
  const baselineSuffix = `${releaseMinor}.${releasePatch - 1}`;
  return [19, 20, 21, 22].map(major => ({
    major,
    workspace: `v${major}`,
    version: `${major}.${suffix}`,
    tag: major === 22 ? 'latest' : `angular${major}`,
    baselineVersion: `${major === 22 ? 21 : major}.${baselineSuffix}`,
    baselineMajor: major === 22 ? 21 : major,
  }));
}

function normalizedFileList(files) {
  invariant(Array.isArray(files), 'Packed file inventory must be an array.');
  return files
    .map(file => typeof file === 'string' ? file : file?.path)
    .map(file => String(file ?? '').replaceAll('\\', '/').replace(/^package\//u, ''))
    .filter(Boolean)
    .sort();
}

function normalizedManifestPath(path, label) {
  invariant(typeof path === 'string' && path.length > 0, `${label} is missing.`);
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//u, '');
  invariant(!normalized.startsWith('/') && !normalized.split('/').includes('..'), `${label} is unsafe: ${path}.`);
  return normalized;
}

export function validatePackedFileInventory({ target, metadataFiles, extractedFiles }) {
  const version = target?.version ?? 'package';
  assertExact(
    normalizedFileList(metadataFiles),
    normalizedFileList(extractedFiles),
    `${version} npm pack metadata inventory`,
  );
}

export function validatePackedManifest({
  manifest,
  target,
  datetimeVersion,
  expectedDependencies,
  expectedExports,
  expectedFiles,
  packedFiles,
}) {
  invariant(manifest && typeof manifest === 'object', `${target?.version ?? 'package'} manifest is missing.`);
  invariant(target && typeof target === 'object', 'Release target is missing.');
  invariant(manifest.name === PACKAGE_NAME, `${target.version}: expected package name ${PACKAGE_NAME}.`);
  invariant(manifest.version === target.version, `${target.version}: packed version is ${manifest.version ?? '<missing>'}.`);
  assertExact(manifest.repository, REPOSITORY, `${target.version} repository`);

  const expectedAngularPeer = target.major === 22 ? V22_ANGULAR_PEER : SHARED_ANGULAR_PEER;
  const expectedPeers = {
    ...Object.fromEntries(ANGULAR_PEER_KEYS.map(name => [name, expectedAngularPeer])),
    rxjs: '^7.8.0',
  };
  assertExact(manifest.peerDependencies, expectedPeers, `${target.version} peerDependencies`);

  const expectedNodeEngine = target.major === 22 ? V22_NODE_ENGINE : HISTORICAL_NODE_ENGINE;
  invariant(manifest.engines?.node === expectedNodeEngine, `${target.version}: invalid Node engine ${manifest.engines?.node ?? '<missing>'}.`);
  invariant(
    manifest.dependencies?.['@sdcorejs/angular-material-datetime'] === datetimeVersion,
    `${target.version}: datetime dependency must be exact ${datetimeVersion}.`,
  );
  invariant(
    /^\d+\.\d+\.\d+$/u.test(manifest.dependencies?.['@sdcorejs/utils'] ?? ''),
    `${target.version}: @sdcorejs/utils must be a direct exact dependency.`,
  );
  if (expectedDependencies) assertExact(manifest.dependencies, expectedDependencies, `${target.version} dependencies`);

  assertExact(manifest.exports, expectedExports, `${target.version} exports`);
  const actualFiles = normalizedFileList(packedFiles);
  const baselineFiles = normalizedFileList(expectedFiles);
  assertExact(actualFiles, baselineFiles, `${target.version} packed files`);
  invariant(actualFiles.includes('package.json'), `${target.version}: package.json is absent from the tarball.`);
  const typingsPath = normalizedManifestPath(manifest.typings, `${target.version}: typings entry`);
  invariant(actualFiles.includes(typingsPath), `${target.version}: typings entry ${typingsPath} is absent from the tarball.`);
  invariant(
    normalizedManifestPath(manifest.exports?.['.']?.types, `${target.version}: root types export`) === typingsPath,
    `${target.version}: root types export must match typings entry ${typingsPath}.`,
  );
  for (const [exportName, conditions] of Object.entries(manifest.exports)) {
    if (!conditions || typeof conditions !== 'object' || !('types' in conditions)) continue;
    const exportedTypesPath = normalizedManifestPath(conditions.types, `${target.version}: ${exportName} types export`);
    invariant(
      actualFiles.includes(exportedTypesPath),
      `${target.version}: ${exportName} types export ${exportedTypesPath} is absent from the tarball.`,
    );
  }
  invariant(actualFiles.some(file => /^fesm2022\/[^/]+\.mjs$/u.test(file)), `${target.version}: APF FESM output is absent.`);
  for (const file of actualFiles) {
    invariant(!/(?:^|\/)(?:node_modules|coverage|\.angular|\.cache)(?:\/|$)/u.test(file), `${target.version}: forbidden packed path ${file}.`);
    invariant(!/\.spec\.(?:[cm]?[jt]s|d\.ts)$/u.test(file), `${target.version}: spec leaked into package: ${file}.`);
  }

  return manifest;
}

function withoutReleaseMetadata(surface) {
  const copy = structuredClone(surface);
  delete copy.version;
  delete copy.frameworkMajor;
  return copy;
}

export function validatePublicSurface({ candidate, baseline, target }) {
  invariant(candidate?.version === target.version, `${target.version}: candidate surface has the wrong version.`);
  invariant(candidate?.frameworkMajor === target.major, `${target.version}: candidate surface has the wrong framework major.`);
  invariant(baseline?.version === target.baselineVersion, `${target.version}: expected exact baseline ${target.baselineVersion}.`);
  invariant(baseline?.frameworkMajor === target.baselineMajor, `${target.version}: baseline framework major is invalid.`);
  const candidateNormalized = withoutReleaseMetadata(candidate);
  const baselineNormalized = withoutReleaseMetadata(baseline);
  const candidateSources = candidateNormalized.sourceFiles;
  const baselineSources = baselineNormalized.sourceFiles;
  delete candidateNormalized.sourceFiles;
  delete baselineNormalized.sourceFiles;
  assertExact(
    candidateNormalized,
    baselineNormalized,
    `${target.version} normalized public surface against ${target.baselineVersion}`,
  );
  validatePackedSources({ candidateSources, baselineSources, target });
}

const APPROVED_API_MODULE_DOCUMENTATION = [
  '    //',
  '    // Angular 21 cung cấp HttpClient ở root mặc định, nên check này cố ý im lặng trên v21. Consumer',
  '    // vẫn phải gọi `provideHttpClient(withInterceptorsFromDi())` nếu muốn HTTP_INTERCEPTORS dạng',
  '    // class (bao gồm SdHttpInterceptor) tham gia request chain; public API không có token để module',
  '    // phân biệt cấu hình đó với HttpClient mặc định.',
].join('\n');

function normalizeApprovedSourceDocumentation(content, path) {
  const normalized = content.replace(/\r\n?/gu, '\n');
  return path === 'services/api/src/api.module.ts'
    ? normalized.replace(`${APPROVED_API_MODULE_DOCUMENTATION}\n`, '')
    : normalized;
}

function validatePackedSources({ candidateSources, baselineSources, target }) {
  invariant(candidateSources && typeof candidateSources === 'object', `${target.version}: packed sources are missing.`);
  invariant(baselineSources && typeof baselineSources === 'object', `${target.baselineVersion}: baseline packed sources are missing.`);
  const candidatePaths = Object.keys(candidateSources).sort();
  const baselinePaths = Object.keys(baselineSources).sort();
  assertExact(candidatePaths, baselinePaths, `${target.version} packed source inventory`);

  for (const path of candidatePaths) {
    const relativePath = `projects/sdcorejs-angular/${path}`;
    const matches = compareNormalizedWorkspaceContent({
      sourceContent: normalizeApprovedSourceDocumentation(baselineSources[path], path),
      sourceWorkspace: `v${target.baselineMajor}`,
      targetContent: normalizeApprovedSourceDocumentation(candidateSources[path], path),
      targetWorkspace: `v${target.major}`,
      relativePath,
    });
    invariant(matches, `${target.version}: packed source differs from ${target.baselineVersion}: ${path}.`);
  }
}

function validIntegrity(value) {
  return /^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(value ?? '');
}

export function validateReleaseBundle({ suffix, datetimeVersion, sourceSha, artifacts }) {
  const targets = releaseTargets(suffix);
  invariant(/^[a-f0-9]{40}$/iu.test(sourceSha ?? ''), 'Release bundle must contain one full source SHA.');
  invariant(Array.isArray(artifacts) && artifacts.length === targets.length, 'Release bundle must contain all four artifacts.');

  const seenVersions = new Set();
  const publishOrder = targets.map((target, index) => {
    const artifact = artifacts[index];
    invariant(artifact && typeof artifact === 'object', `${target.version}: artifact is missing.`);
    assertExact(artifact.target, target, `${target.version} target metadata`);
    invariant(!seenVersions.has(target.version), `${target.version}: duplicate artifact.`);
    seenVersions.add(target.version);
    invariant(typeof artifact.tarball === 'string' && artifact.tarball.endsWith('.tgz'), `${target.version}: tarball is missing.`);
    invariant(/^[a-f0-9]{64}$/iu.test(artifact.sha256 ?? ''), `${target.version}: SHA-256 is missing or invalid.`);
    invariant(validIntegrity(artifact.pack?.integrity), `${target.version}: npm integrity is missing or invalid.`);
    invariant(/^[a-f0-9]{40}$/iu.test(artifact.pack?.shasum ?? ''), `${target.version}: npm shasum is missing or invalid.`);

    const packedFiles = normalizedFileList(artifact.pack?.files);
    validatePackedManifest({
      manifest: artifact.manifest,
      target,
      datetimeVersion,
      expectedExports: artifact.baseline?.exports,
      expectedFiles: artifact.expectedFiles ?? artifact.baseline?.files ?? packedFiles,
      packedFiles,
    });
    validatePublicSurface({ candidate: artifact.publicSurface, baseline: artifact.baseline, target });

    return {
      major: target.major,
      version: target.version,
      tag: target.tag,
      tarball: artifact.tarball,
      sha256: artifact.sha256,
      integrity: artifact.pack.integrity,
      shasum: artifact.pack.shasum,
    };
  });

  return { sourceSha, publishOrder };
}

export function createConsumerPackageJson({ target, candidateManifest, tarballPath, angularVersion, angularVersions }) {
  invariant(target && candidateManifest, 'Consumer target and candidate manifest are required.');
  invariant(/^\d+\.\d+\.\d+$/u.test(candidateManifest.dependencies?.['@sdcorejs/utils'] ?? ''), 'Consumer requires candidate direct exact @sdcorejs/utils.');
  invariant(typeof tarballPath === 'string' && tarballPath.length > 0, `${target.version}: consumer tarball path is missing.`);

  const resolvedAngularVersions = angularVersions ?? Object.fromEntries([
    ...ANGULAR_PEER_KEYS,
    '@angular/compiler-cli',
  ].map(name => [name, angularVersion]));
  for (const name of [...ANGULAR_PEER_KEYS, '@angular/compiler-cli']) {
    invariant(
      typeof resolvedAngularVersions[name] === 'string' && resolvedAngularVersions[name].startsWith(`${target.major}.`),
      `${target.version}: consumer ${name} version must match its Angular major.`,
    );
  }

  const tarballSpec = tarballPath.startsWith('file:') ? tarballPath : `file:${tarballPath.replaceAll('\\', '/')}`;
  return {
    name: `sdcorejs-angular-${target.workspace}-strict-consumer`,
    version: '0.0.0',
    private: true,
    type: 'module',
    dependencies: {
      ...Object.fromEntries(ANGULAR_PEER_KEYS.map(name => [name, resolvedAngularVersions[name]])),
      '@sdcorejs/angular': tarballSpec,
      '@sdcorejs/utils': candidateManifest.dependencies['@sdcorejs/utils'],
      rxjs: candidateManifest.peerDependencies?.rxjs ?? '^7.8.0',
    },
    devDependencies: {
      '@angular/compiler-cli': resolvedAngularVersions['@angular/compiler-cli'],
      typescript: TYPESCRIPT_BY_MAJOR.get(target.major),
    },
  };
}

export async function executePublishTransaction({ plan, preflightArtifact, publishArtifact, verifyArtifact }) {
  invariant(Array.isArray(plan?.publishOrder) && plan.publishOrder.length === 4, 'Validated four-artifact publish plan is required.');
  invariant(typeof preflightArtifact === 'function', 'preflightArtifact callback is required.');
  invariant(typeof publishArtifact === 'function', 'publishArtifact callback is required.');
  invariant(typeof verifyArtifact === 'function', 'verifyArtifact callback is required.');

  const decisions = [];
  for (const target of plan.publishOrder) {
    const decision = await preflightArtifact(target);
    invariant(decision?.action === 'publish' || decision?.action === 'reuse', `${target.version}: invalid preflight decision.`);
    decisions.push(decision);
  }

  const results = [];
  for (let index = 0; index < plan.publishOrder.length; index += 1) {
    const target = plan.publishOrder[index];
    const decision = decisions[index];
    try {
      if (decision.action === 'publish') await publishArtifact(target);
      await verifyArtifact(target);
      results.push({ version: target.version, action: decision.action, verified: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const completedSummary = results.length > 0
        ? `\nVerified immutable successes: ${results.map(result => `${result.version} (${result.action})`).join(', ')}.`
        : '';
      const error = new Error(`${message}${completedSummary}`, { cause });
      error.completedResults = structuredClone(results);
      error.failedTarget = target.version;
      error.failedAction = decision.action;
      throw error;
    }
  }
  return results;
}

function getArg(name, argv = process.argv) {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
}

function hasFlag(name, argv = process.argv) {
  return argv.includes(`--${name}`);
}

function command(executable, args, { cwd = REPO_ROOT, allowFailure = false } = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
    timeout: 300_000,
    windowsHide: true,
  });
  if (result.error && !allowFailure) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${executable} ${args.join(' ')} failed (${result.status}).\n${result.stderr || result.stdout}`.trim());
  }
  return result;
}

export function resolveNpmInvocation(
  args,
  {
    platform = process.platform,
    nodeExecutable = process.execPath,
    npmExecPath = process.env.npm_execpath,
  } = {},
) {
  invariant(Array.isArray(args) && args.every(arg => typeof arg === 'string'), 'npm arguments must be strings.');
  if (platform !== 'win32') return { executable: 'npm', args: [...args] };

  // why: modern Node rejects direct spawn of .cmd shims on Windows with EINVAL. Execute npm's
  // JavaScript entry point through the already verified Node binary without enabling a shell.
  const npmCliPath = npmExecPath || join(dirname(nodeExecutable), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  return { executable: nodeExecutable, args: [npmCliPath, ...args] };
}

export function runNpmCli(args, options = {}) {
  const invocation = resolveNpmInvocation(args);
  return command(invocation.executable, invocation.args, options);
}

function parseJsonOutput(output, label) {
  const text = String(output ?? '').trim();
  invariant(text, `${label} returned no JSON.`);
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error(`${label} returned invalid JSON: ${cause.message}\n${text}`);
  }
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function sha1File(path) {
  return createHash('sha1').update(readFileSync(path)).digest('hex');
}

function integrityFile(path) {
  return `sha512-${createHash('sha512').update(readFileSync(path)).digest('base64')}`;
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  return files.sort();
}

function extractTarball(tarballPath, outputRoot) {
  const listing = command('tar', ['-tzf', tarballPath]).stdout.split(/\r?\n/u).filter(Boolean);
  invariant(listing.length > 0, `Tarball ${tarballPath} is empty.`);
  for (const entry of listing) {
    const normalized = entry.replaceAll('\\', '/');
    invariant(normalized.startsWith('package/'), `Tarball ${tarballPath} contains an unexpected root entry: ${entry}.`);
    invariant(!normalized.split('/').includes('..'), `Tarball ${tarballPath} contains path traversal: ${entry}.`);
  }
  mkdirSync(outputRoot, { recursive: true });
  command('tar', ['-xzf', tarballPath, '-C', outputRoot]);
  const packageRoot = join(outputRoot, 'package');
  invariant(existsSync(join(packageRoot, 'package.json')), `Tarball ${tarballPath} has no package/package.json.`);
  return packageRoot;
}

function normalizePackedSourcePath(source, mapPath) {
  invariant(typeof source === 'string', `Packed sourcemap ${mapPath} has a non-string source path.`);
  const normalized = source.replaceAll('\\', '/');
  const marker = 'projects/sdcorejs-angular/';
  const markerIndex = normalized.lastIndexOf(marker);
  invariant(markerIndex >= 0, `Packed sourcemap ${mapPath} contains an external source: ${source}.`);
  const path = normalized.slice(markerIndex + marker.length);
  invariant(path.length > 0 && !path.split('/').includes('..'), `Packed sourcemap ${mapPath} contains an invalid source: ${source}.`);
  return path;
}

function readPackedSources(packageRoot) {
  const sourceFiles = {};
  const mapFiles = walkFiles(packageRoot).filter(file => file.endsWith('.mjs.map'));
  invariant(mapFiles.length > 0, `Package ${packageRoot} has no FESM sourcemaps.`);

  for (const file of mapFiles) {
    const mapPath = relative(packageRoot, file).replaceAll('\\', '/');
    let map;
    try {
      map = JSON.parse(readFileSync(file, 'utf8'));
    }
    catch (error) {
      throw new Error(`Packed sourcemap ${mapPath} is invalid JSON.`, { cause: error });
    }
    invariant(Array.isArray(map.sources), `Packed sourcemap ${mapPath} has no sources array.`);
    invariant(Array.isArray(map.sourcesContent), `Packed sourcemap ${mapPath} has no sourcesContent array.`);
    invariant(map.sources.length === map.sourcesContent.length, `Packed sourcemap ${mapPath} source arrays differ in length.`);

    for (let index = 0; index < map.sources.length; index += 1) {
      const path = normalizePackedSourcePath(map.sources[index], mapPath);
      const content = map.sourcesContent[index];
      invariant(typeof content === 'string', `Packed sourcemap ${mapPath} has no source content for ${path}.`);
      const normalizedContent = content.replace(/\r\n?/gu, '\n');
      invariant(
        sourceFiles[path] === undefined || sourceFiles[path] === normalizedContent,
        `Packed sourcemaps contain conflicting content for ${path}.`,
      );
      sourceFiles[path] = normalizedContent;
    }
  }

  invariant(Object.keys(sourceFiles).length > 0, `Package ${packageRoot} exposes no authored sources through sourcemaps.`);
  return Object.fromEntries(Object.entries(sourceFiles).sort(([left], [right]) => left.localeCompare(right)));
}

export function readPublicSurface(packageRoot, version, frameworkMajor) {
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const declarations = {};
  for (const file of walkFiles(packageRoot).filter(file => file.endsWith('.d.ts'))) {
    const path = relative(packageRoot, file).replaceAll('\\', '/');
    declarations[path] = readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
  }
  return {
    version,
    frameworkMajor,
    exports: manifest.exports,
    declarations,
    sourceFiles: readPackedSources(packageRoot),
  };
}

function packRegistryBaseline(version, cacheRoot) {
  const destination = join(cacheRoot, version);
  mkdirSync(destination, { recursive: true });
  const result = runNpmCli(['pack', `${PACKAGE_NAME}@${version}`, '--json', '--pack-destination', destination]);
  const pack = parseJsonOutput(result.stdout, `npm pack ${PACKAGE_NAME}@${version}`)[0];
  invariant(pack?.filename, `${version}: npm pack did not return a filename.`);
  const tarballPath = join(destination, pack.filename);
  const packageRoot = extractTarball(tarballPath, join(destination, 'unpacked'));
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  return {
    manifest,
    pack,
    publicSurface: readPublicSurface(packageRoot, version, Number(version.split('.')[0])),
  };
}

function loadArtifactMetadata(artifactRoot) {
  const metadataPaths = walkFiles(artifactRoot).filter(path => basename(path) === 'artifact.json');
  invariant(metadataPaths.length === 4, `Expected four artifact.json files under ${artifactRoot}; found ${metadataPaths.length}.`);
  return metadataPaths.map(path => ({
    metadataPath: path,
    directory: dirname(path),
    metadata: JSON.parse(readFileSync(path, 'utf8')),
  }));
}

function materializeValidatedBundle({ artifactRoot, suffix, baselineSuffix, datetimeVersion }) {
  const targets = releaseTargets(suffix);
  invariant(baselineSuffix === suffix.replace(/\d+$/u, value => String(Number(value) - 1)), `Expected baseline suffix derived from ${suffix}.`);
  const records = loadArtifactMetadata(artifactRoot);
  const tempRoot = mkdtempSync(join(tmpdir(), 'sdcorejs-release-contract-'));
  const baselines = new Map();
  const tarballPaths = new Map();

  try {
    const artifacts = targets.map((target, index) => {
      const record = records.find(item => item.metadata?.target?.version === target.version);
      invariant(record, `${target.version}: artifact metadata not found.`);
      assertExact(record.metadata.target, target, `${target.version} staged target`);
      const pack = Array.isArray(record.metadata.pack) ? record.metadata.pack[0] : record.metadata.pack;
      invariant(pack && typeof pack === 'object', `${target.version}: npm pack metadata is missing.`);
      const tarballName = record.metadata.tarball ?? pack.filename;
      invariant(basename(tarballName) === tarballName, `${target.version}: tarball metadata must use a basename.`);
      const tarballPath = join(record.directory, tarballName);
      invariant(existsSync(tarballPath) && statSync(tarballPath).isFile(), `${target.version}: staged tarball is missing.`);
      invariant(sha256File(tarballPath) === record.metadata.sha256, `${target.version}: staged SHA-256 mismatch.`);
      invariant(sha1File(tarballPath) === pack.shasum, `${target.version}: staged npm shasum mismatch.`);
      invariant(integrityFile(tarballPath) === pack.integrity, `${target.version}: staged npm integrity mismatch.`);
      invariant(record.metadata.sourceSha, `${target.version}: staged source SHA is missing.`);
      tarballPaths.set(target.version, tarballPath);

      const candidateRoot = extractTarball(tarballPath, join(tempRoot, `candidate-${target.workspace}`));
      const manifest = JSON.parse(readFileSync(join(candidateRoot, 'package.json'), 'utf8'));
      const extractedFiles = walkFiles(candidateRoot).map(file => relative(candidateRoot, file).replaceAll('\\', '/'));
      validatePackedFileInventory({ target, metadataFiles: pack.files, extractedFiles });
      if (!baselines.has(target.baselineVersion)) {
        baselines.set(target.baselineVersion, packRegistryBaseline(target.baselineVersion, join(tempRoot, 'baselines')));
      }
      const baseline = baselines.get(target.baselineVersion);
      const expectedFiles = normalizedFileList(baseline.pack.files);
      const publicSurface = readPublicSurface(candidateRoot, target.version, target.major);
      validatePackedManifest({
        manifest,
        target,
        datetimeVersion,
        expectedDependencies: {
          ...baseline.manifest.dependencies,
          '@sdcorejs/angular-material-datetime': datetimeVersion,
        },
        expectedExports: baseline.manifest.exports,
        expectedFiles,
        packedFiles: extractedFiles,
      });
      validatePublicSurface({ candidate: publicSurface, baseline: baseline.publicSurface, target });

      return {
        target,
        tarball: tarballName,
        sha256: record.metadata.sha256,
        pack,
        manifest,
        publicSurface,
        baseline: baseline.publicSurface,
        expectedFiles,
        sourceSha: record.metadata.sourceSha,
      };
    });

    const sourceShas = new Set(artifacts.map(artifact => artifact.sourceSha));
    invariant(sourceShas.size === 1, 'All four artifacts must come from one source SHA.');
    const sourceSha = artifacts[0].sourceSha;
    const checkoutSha = command('git', ['rev-parse', 'HEAD']).stdout.trim();
    invariant(sourceSha === checkoutSha, `Artifact source ${sourceSha} does not match checkout ${checkoutSha}.`);
    const plan = validateReleaseBundle({ suffix, datetimeVersion, sourceSha, artifacts });
    return { plan, artifacts, tarballPaths, cleanup: () => rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (cause) {
    rmSync(tempRoot, { recursive: true, force: true });
    throw cause;
  }
}

function workspaceAngularVersions(target) {
  const lockPath = join(REPO_ROOT, 'versions', target.workspace, 'package-lock.json');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const coreVersion = lock.packages?.['node_modules/@angular/core']?.version;
  invariant(
    typeof coreVersion === 'string' && coreVersion.startsWith(`${target.major}.`),
    `${target.workspace}: cannot resolve exact @angular/core version.`,
  );
  return Object.fromEntries([...ANGULAR_PEER_KEYS, '@angular/compiler-cli'].map(name => {
    const version = ANGULAR_MATERIAL_KEYS.has(name)
      ? lock.packages?.[`node_modules/${name}`]?.version
      : coreVersion;
    invariant(
      typeof version === 'string' && version.startsWith(`${target.major}.`),
      `${target.workspace}: cannot resolve exact ${name} version.`,
    );
    return [name, version];
  }));
}

function compileStrictConsumers(bundle) {
  const fixtureRoot = join(REPO_ROOT, 'scripts', 'fixtures', 'package-consumer');
  for (const artifact of bundle.artifacts) {
    const consumerRoot = mkdtempSync(join(tmpdir(), `sdcorejs-${artifact.target.workspace}-consumer-`));
    try {
      const angularVersions = workspaceAngularVersions(artifact.target);
      const packageJson = createConsumerPackageJson({
        target: artifact.target,
        candidateManifest: artifact.manifest,
        tarballPath: bundle.tarballPaths.get(artifact.target.version),
        angularVersions,
      });
      writeFileSync(join(consumerRoot, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
      cpSync(join(fixtureRoot, 'fixture.component.ts'), join(consumerRoot, 'fixture.component.ts'));
      cpSync(join(fixtureRoot, 'tsconfig.json'), join(consumerRoot, 'tsconfig.json'));
      runNpmCli(['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: consumerRoot });
      runNpmCli(['exec', '--', 'ngc', '-p', 'tsconfig.json'], { cwd: consumerRoot });
    } finally {
      rmSync(consumerRoot, { recursive: true, force: true });
    }
  }
}

function npmViewDist(version, { allowMissing = false } = {}) {
  const result = runNpmCli(['view', `${PACKAGE_NAME}@${version}`, 'dist', '--json'], { allowFailure: allowMissing });
  if (result.status !== 0) {
    const output = `${result.stdout}\n${result.stderr}`;
    if (allowMissing && /E404|404 Not Found|is not in this registry/iu.test(output)) return null;
    throw new Error(`npm view ${PACKAGE_NAME}@${version} failed.\n${output}`);
  }
  return parseJsonOutput(result.stdout, `npm view ${PACKAGE_NAME}@${version} dist`);
}

function npmViewTags() {
  const result = runNpmCli(['view', PACKAGE_NAME, 'dist-tags', '--json']);
  return parseJsonOutput(result.stdout, `npm view ${PACKAGE_NAME} dist-tags`);
}

async function delay(milliseconds) {
  await new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
}

async function waitForExactDist(
  target,
  {
    attempts = 12,
    requireProvenance = false,
    viewDist = npmViewDist,
    sleep = delay,
  } = {},
) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const dist = viewDist(target.version, { allowMissing: true });
    if (
      dist?.integrity === target.integrity &&
      dist?.shasum === target.shasum &&
      (!requireProvenance || dist.attestations || dist.provenance)
    ) return dist;
    if (dist && (dist.integrity !== target.integrity || dist.shasum !== target.shasum)) {
      throw new Error(`${target.version}: immutable registry collision after publish.`);
    }
    if (attempt < attempts) await sleep(5_000);
  }
  throw new Error(`${target.version}: registry did not expose the verified artifact in time.`);
}

async function observeExactDistAfterUncertainPublish(
  target,
  {
    attempts = 3,
    viewDist = npmViewDist,
    sleep = delay,
  } = {},
) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const dist = viewDist(target.version, { allowMissing: true });
    if (dist?.integrity === target.integrity && dist?.shasum === target.shasum) return dist;
    if (dist) throw new Error(`${target.version}: registry contains a different artifact after an uncertain publish response.`);
    if (attempt < attempts) await sleep(2_000);
  }
  return null;
}

function verifyDownloadedRegistryTarball(target) {
  const tempRoot = mkdtempSync(join(tmpdir(), `sdcorejs-registry-${target.major}-`));
  try {
    const result = runNpmCli(['pack', `${PACKAGE_NAME}@${target.version}`, '--json', '--pack-destination', tempRoot]);
    const pack = parseJsonOutput(result.stdout, `npm pack ${PACKAGE_NAME}@${target.version}`)[0];
    const hash = sha256File(join(tempRoot, pack.filename));
    invariant(hash === target.sha256, `${target.version}: downloaded registry SHA-256 differs from staged artifact.`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

export function publishTarballWithNpm(target, tarballPath, npmRunner = runNpmCli) {
  invariant(target && typeof target === 'object', 'Validated publish target is required.');
  invariant(typeof tarballPath === 'string' && tarballPath.endsWith('.tgz'), `${target.version}: validated tarball path is missing.`);
  return npmRunner(
    ['publish', tarballPath, '--access', 'public', '--tag', target.tag, '--provenance'],
    { allowFailure: true },
  );
}

export async function publishValidatedBundle(
  bundle,
  requireProvenance,
  {
    viewDist = npmViewDist,
    viewTags = npmViewTags,
    publishOnce = publishTarballWithNpm,
    verifyDownloaded = verifyDownloadedRegistryTarball,
    sleep = delay,
  } = {},
) {
  const initialTags = viewTags();
  const initialLatest = initialTags.latest;
  const finalArtifact = bundle.artifacts.find(artifact => artifact.target.major === 22);
  invariant(finalArtifact, 'Validated Angular 22 artifact is missing from the publication bundle.');
  const expectedInitialLatest = finalArtifact.target.baselineVersion;
  invariant(
    initialLatest === expectedInitialLatest || initialLatest === finalArtifact.target.version,
    `Refusing publication from unexpected initial latest ${initialLatest ?? '<missing>'}; expected ${expectedInitialLatest} or exact ${finalArtifact.target.version} recovery.`,
  );
  const decisions = new Map();

  const results = await executePublishTransaction({
    plan: bundle.plan,
    preflightArtifact: async target => {
      const existing = viewDist(target.version, { allowMissing: true });
      if (!existing) {
        invariant(
          !(target.major === 22 && initialLatest === target.version),
          `${target.version}: latest points to the final version but its exact recovery artifact is absent.`,
        );
        const decision = { action: 'publish' };
        decisions.set(target.version, decision);
        return decision;
      }
      invariant(
        existing.integrity === target.integrity && existing.shasum === target.shasum,
        `${target.version}: immutable registry collision (existing integrity/shasum differ).`,
      );
      if (requireProvenance) {
        invariant(existing.attestations || existing.provenance, `${target.version}: existing recovery artifact has no provenance/attestation metadata.`);
      }
      const tags = viewTags();
      invariant(tags[target.tag] === target.version, `${target.version}: existing recovery tag ${target.tag} is incorrect.`);
      verifyDownloaded(target);
      const decision = { action: 'reuse' };
      decisions.set(target.version, decision);
      return decision;
    },
    publishArtifact: async target => {
      const tarballPath = bundle.tarballPaths.get(target.version);
      let firstAttempt;
      try {
        firstAttempt = await publishOnce(target, tarballPath);
      } catch (error) {
        firstAttempt = { status: null, stdout: '', stderr: '', error };
      }
      if (firstAttempt.status === 0) return;

      const observed = await observeExactDistAfterUncertainPublish(target, { viewDist, sleep });
      if (observed) return;

      let retry;
      try {
        retry = await publishOnce(target, tarballPath);
      } catch (error) {
        retry = { status: null, stdout: '', stderr: '', error };
      }
      if (retry.status === 0) return;
      const observedAfterRetry = await observeExactDistAfterUncertainPublish(target, { viewDist, sleep });
      if (observedAfterRetry) return;
      const details = retry.stderr || retry.stdout || retry.error?.message || firstAttempt.stderr || firstAttempt.stdout || firstAttempt.error?.message;
      throw new Error(
        `${target.version}: npm publish failed after one bounded retry.\n${details ?? 'No npm diagnostic was returned.'}`.trim(),
      );
    },
    verifyArtifact: async target => {
      const dist = await waitForExactDist(target, { requireProvenance, viewDist, sleep });
      const tags = viewTags();
      if (target.major < 22) {
        invariant(tags[target.tag] === target.version, `${target.version}: recovery tag ${target.tag} is incorrect.`);
        invariant(tags.latest === initialLatest, `${target.version}: historical publication moved latest.`);
      } else {
        invariant(tags.latest === target.version, `${target.version}: final latest tag was not promoted.`);
      }
      if (requireProvenance) invariant(dist.attestations || dist.provenance, `${target.version}: provenance/attestation metadata is missing.`);
      verifyDownloaded(target);
    },
  });

  return { initialLatest, decisions: Object.fromEntries(decisions), results };
}

export async function runReleaseCli({
  argv = process.argv,
  env = process.env,
  nodeVersion = process.version,
  pathExists = existsSync,
  materialize = materializeValidatedBundle,
  compileConsumers = compileStrictConsumers,
  publishBundle = publishValidatedBundle,
  writeOutput = output => process.stdout.write(output),
} = {}) {
  invariant(nodeVersion === 'v22.22.3', `Release verification requires exact Node v22.22.3; found ${nodeVersion}.`);
  const artifactRootArg = getArg('artifact-root', argv);
  const artifactRoot = resolve(artifactRootArg ?? '');
  const suffix = getArg('suffix', argv);
  const baselineSuffix = getArg('baseline-suffix', argv);
  const datetimeVersion = getArg('datetime-version', argv);
  const compileRequested = hasFlag('compile-consumers', argv);
  const publishRequested = hasFlag('publish', argv);
  const provenanceRequired = hasFlag('require-provenance', argv);
  invariant(artifactRootArg && suffix && baselineSuffix && datetimeVersion, 'Required: --artifact-root, --suffix, --baseline-suffix and --datetime-version.');
  invariant(pathExists(artifactRoot), `Artifact root not found: ${artifactRoot}`);
  invariant(!provenanceRequired || publishRequested, '--require-provenance is valid only with --publish.');
  if (publishRequested) {
    invariant(env.GITHUB_ACTIONS === 'true', 'Registry publication is allowed only in GitHub Actions trusted publishing.');
    invariant(env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'GitHub OIDC environment is unavailable.');
    invariant(!env.NODE_AUTH_TOKEN && !env.NPM_TOKEN, 'Long-lived npm credentials are prohibited for this transaction.');
  }

  const bundle = materialize({ artifactRoot, suffix, baselineSuffix, datetimeVersion });
  try {
    if (compileRequested) compileConsumers(bundle);
    const output = {
      ...bundle.plan,
      targets: releaseTargets(suffix),
      artifacts: bundle.plan.publishOrder,
      consumersCompiled: compileRequested,
    };
    if (publishRequested) output.publication = await publishBundle(bundle, provenanceRequired);
    writeOutput(`${JSON.stringify(output, null, 2)}\n`);
    return output;
  } finally {
    bundle.cleanup();
  }
}

async function main() {
  return runReleaseCli();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(cause => {
    console.error(cause instanceof Error ? cause.stack : cause);
    process.exitCode = 1;
  });
}

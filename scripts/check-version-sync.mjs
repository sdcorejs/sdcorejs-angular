#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceWorkspace = 'v19';
const targetWorkspaces = ['v20', 'v21', 'v22'];

// why: only the published library is mirrored across Angular lines. The showcase is a
// repo-owned dev/test app that lives at the root `showcase/` workspace and is never
// published, so it is not part of the per-version sync surface.
const syncedRoots = ['projects/sdcorejs-angular'];
const syncedWorkspaceFiles = [
  'package.json',
  'README.md',
  'scripts/check-i18n-parity.mjs',
  'scripts/check-i18n.mjs',
  'scripts/generate-pdf-worker-inline.mjs',
];

const excludeDirs = new Set(['.angular', '.git', 'coverage', 'dist', 'node_modules']);
const maxDetails = 40;

const domPortalOutletCalls = [
  'new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector)',
  'new DomPortalOutlet(document.body, this.#ar, this.#injector)',
];
const domPortalOutletMarker = 'new DomPortalOutlet(__SDCOREJS_SYNC_MAJOR_SHIM__)';
const angular22EagerImport =
  "import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';";
const angular22EagerProperty =
  'changeDetection: SdAngular22ChangeDetectionStrategy.Eager,';

const angularRootPackages = [
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
];

const angularPeerPackages = [
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

const sharedAngularPeer = '^19.0.0 || ^20.0.0 || ^21.0.0';
const v22NodeEngine = '^22.22.3 || ^24.15.0 || ^26.0.0';

const rootManifestContracts = {
  v19: {
    angular: '^19.0.0',
    zone: '~0.15.0',
    buildAngular: '^19.0.0',
    cli: '^19.0.0',
    compilerCli: '^19.0.0',
    angularEslint: '19.2.1',
    ngPackagr: '^19.0.0',
    typescript: '~5.7.2',
    typescriptEslint: '8.26.0',
    nodeEngine: null,
  },
  v20: {
    angular: '^20.0.0',
    zone: '~0.15.0',
    buildAngular: '^20.0.0',
    cli: '^20.0.0',
    compilerCli: '^20.0.0',
    angularEslint: '19.2.1',
    ngPackagr: '^20.0.0',
    typescript: '~5.8.3',
    typescriptEslint: '8.26.0',
    nodeEngine: null,
  },
  v21: {
    angular: '^21.0.0',
    zone: '~0.15.0',
    buildAngular: '^21.0.0',
    cli: '^21.0.0',
    compilerCli: '^21.0.0',
    angularEslint: '^21.0.0',
    ngPackagr: '^21.0.0',
    typescript: '~5.9.3',
    typescriptEslint: '^8.60.0',
    nodeEngine: null,
  },
  v22: {
    angular: '~22.1.4',
    zone: '~0.16.2',
    buildAngular: '~22.1.6',
    cli: '~22.1.6',
    compilerCli: '~22.1.4',
    angularEslint: '~22.1.0',
    ngPackagr: '~22.1.1',
    typescript: '~6.0.3',
    typescriptEslint: '8.60.0',
    nodeEngine: v22NodeEngine,
  },
};

const libraryManifestContracts = {
  v19: { angularPeer: sharedAngularPeer, nodeEngine: '>=20.11.0' },
  v20: { angularPeer: sharedAngularPeer, nodeEngine: '>=20.11.0' },
  v21: { angularPeer: sharedAngularPeer, nodeEngine: '>=20.11.0' },
  v22: { angularPeer: '^22.0.0', nodeEngine: v22NodeEngine },
};

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskTypeScriptNonCode(content) {
  const masked = content.split('');
  let mode = 'code';
  let quote = null;
  let inRegexClass = false;

  const blank = index => {
    if (masked[index] !== '\r' && masked[index] !== '\n') masked[index] = ' ';
  };
  const isRegexStart = index => {
    for (let cursor = index - 1; cursor >= 0; cursor--) {
      const previous = masked[cursor];
      if (/\s/u.test(previous)) continue;
      return /[([{=:;,!?&|+\-*%^~<>]/u.test(previous);
    }
    return true;
  };

  for (let index = 0; index < content.length; index++) {
    const char = content[index];
    const next = content[index + 1];

    if (mode === 'line-comment') {
      blank(index);
      if (char === '\n') mode = 'code';
      continue;
    }
    if (mode === 'block-comment') {
      blank(index);
      if (char === '*' && next === '/') {
        blank(index + 1);
        index++;
        mode = 'code';
      }
      continue;
    }
    if (mode === 'string') {
      blank(index);
      if (char === '\\') {
        blank(index + 1);
        index++;
      } else if (char === quote) {
        mode = 'code';
        quote = null;
      }
      continue;
    }
    if (mode === 'regex') {
      blank(index);
      if (char === '\\') {
        blank(index + 1);
        index++;
      } else if (char === '[') {
        inRegexClass = true;
      } else if (char === ']') {
        inRegexClass = false;
      } else if (char === '/' && !inRegexClass) {
        mode = 'code';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      blank(index);
      blank(index + 1);
      index++;
      mode = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      blank(index);
      blank(index + 1);
      index++;
      mode = 'block-comment';
      continue;
    }
    if (char === '/' && isRegexStart(index)) {
      blank(index);
      mode = 'regex';
      inRegexClass = false;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      blank(index);
      mode = 'string';
      quote = char;
    }
  }

  return masked.join('');
}

function findMatchingObjectBrace(content, openIndex) {
  let depth = 0;
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;
  let inRegex = false;
  let inRegexClass = false;

  const isRegexStart = index => {
    for (let cursor = index - 1; cursor >= 0; cursor--) {
      const previous = content[cursor];
      if (/\s/u.test(previous)) continue;
      return /[([{=:;,!?&|+\-*%^~<>]/u.test(previous);
    }
    return true;
  };

  for (let index = openIndex; index < content.length; index++) {
    const char = content[index];
    const next = content[index + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (char === '\\') {
        index++;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (inRegex) {
      if (char === '\\') {
        index++;
      } else if (char === '[') {
        inRegexClass = true;
      } else if (char === ']') {
        inRegexClass = false;
      } else if (char === '/' && !inRegexClass) {
        inRegex = false;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      index++;
      continue;
    }
    if (char === '/' && isRegexStart(index)) {
      inRegex = true;
      inRegexClass = false;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth++;
      continue;
    }
    if (char === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }

  throw new Error(`Unclosed @Component metadata object at offset ${openIndex}`);
}

function hasTopLevelObjectProperty(metadata, originalMetadata, propertyName) {
  let objectDepth = 0;
  let arrayDepth = 0;
  let parenthesisDepth = 0;

  for (let index = 0; index < metadata.length; index++) {
    const char = metadata[index];
    if (char === '{') objectDepth++;
    else if (char === '}') objectDepth--;
    else if (char === '[') arrayDepth++;
    else if (char === ']') arrayDepth--;
    else if (char === '(') parenthesisDepth++;
    else if (char === ')') parenthesisDepth--;
    else if (objectDepth === 0 && arrayDepth === 0 && parenthesisDepth === 0 &&
      metadata.startsWith(propertyName, index)) {
      const before = metadata[index - 1];
      const afterNameIndex = index + propertyName.length;
      const after = metadata[afterNameIndex];
      if ((before && /[$\w]/u.test(before)) || (after && /[$\w]/u.test(after))) continue;

      let cursor = afterNameIndex;
      while (/\s/u.test(metadata[cursor] ?? '')) cursor++;
      if (metadata[cursor] === ':') return true;
    } else if (objectDepth === 0 && arrayDepth === 0 && parenthesisDepth === 0 &&
      (originalMetadata[index] === "'" || originalMetadata[index] === '"')) {
      const quote = originalMetadata[index];
      const afterNameIndex = index + propertyName.length + 1;
      if (originalMetadata.slice(index + 1, afterNameIndex) !== propertyName ||
        originalMetadata[afterNameIndex] !== quote) continue;

      let cursor = afterNameIndex + 1;
      while (/\s/u.test(metadata[cursor] ?? '')) cursor++;
      if (metadata[cursor] === ':') return true;
    }
  }

  return false;
}

function splitTopLevelObjectProperties(metadata, originalMetadata) {
  const properties = [];
  let objectDepth = 0;
  let arrayDepth = 0;
  let parenthesisDepth = 0;
  let propertyStart = 0;

  for (let index = 0; index < metadata.length; index++) {
    const char = metadata[index];
    if (char === '{') objectDepth++;
    else if (char === '}') objectDepth--;
    else if (char === '[') arrayDepth++;
    else if (char === ']') arrayDepth--;
    else if (char === '(') parenthesisDepth++;
    else if (char === ')') parenthesisDepth--;
    else if (char === ',' && objectDepth === 0 && arrayDepth === 0 && parenthesisDepth === 0) {
      const property = originalMetadata.slice(propertyStart, index).trim();
      if (property) properties.push(property);
      propertyStart = index + 1;
    }
  }

  const finalProperty = originalMetadata.slice(propertyStart).trim();
  if (finalProperty) properties.push(finalProperty);
  return properties;
}

export function applyAngular22EagerMigration(content) {
  const decoratorPattern = /@Component\s*\(\s*\{/gu;
  const edits = [];
  const executableSource = maskTypeScriptNonCode(content);
  const lineBreak = content.includes('\r\n') ? '\r\n' : '\n';

  for (const match of executableSource.matchAll(decoratorPattern)) {
    const openIndex = match.index + match[0].lastIndexOf('{');
    const closeIndex = findMatchingObjectBrace(executableSource, openIndex);
    const metadata = executableSource.slice(openIndex + 1, closeIndex);
    const originalMetadata = content.slice(openIndex + 1, closeIndex);
    if (hasTopLevelObjectProperty(metadata, originalMetadata, 'changeDetection')) continue;

    if (!/[\r\n]/u.test(originalMetadata)) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const decoratorIndent = /^[ \t]*/u.exec(content.slice(lineStart, match.index))?.[0] ?? '';
      const propertyIndent = `${decoratorIndent}  `;
      const properties = splitTopLevelObjectProperties(metadata, originalMetadata);
      const replacement = [
        '{',
        `${propertyIndent}${angular22EagerProperty}`,
        ...properties.map(property => `${propertyIndent}${property},`),
        `${decoratorIndent}}`,
      ].join(lineBreak);
      edits.push({ start: openIndex, end: closeIndex + 1, replacement });
      continue;
    }

    const afterOpen = content.slice(openIndex + 1);
    const nextLine = new RegExp(`^${lineBreak.replace('\\', '\\\\')}([ \\t]*)`, 'u').exec(afterOpen);
    const insertion = nextLine
      ? `${lineBreak}${nextLine[1]}${angular22EagerProperty}`
      : ` ${angular22EagerProperty}`;
    edits.push({ start: openIndex + 1, end: openIndex + 1, replacement: insertion });
  }

  if (edits.length === 0) return content;

  let migrated = content;
  for (const { start, end, replacement } of edits.reverse()) {
    migrated = `${migrated.slice(0, start)}${replacement}${migrated.slice(end)}`;
  }

  if (!migrated.includes(angular22EagerImport)) {
    const lineBreak = migrated.includes('\r\n') ? '\r\n' : '\n';
    const firstImport = /^import\b/mu.exec(migrated);
    const importIndex = firstImport?.index ?? (migrated.charCodeAt(0) === 0xFEFF ? 1 : 0);
    migrated = `${migrated.slice(0, importIndex)}${angular22EagerImport}${lineBreak}${migrated.slice(importIndex)}`;
  }

  return migrated;
}

export function applyAngular22CoverageBootstrap(content) {
  const declarationPattern =
    /const webpackMeta = import\.meta as unknown as \{\r?\n  webpackContext\(path: string, options\?: \{ recursive\?: boolean; regExp\?: RegExp \}\): WebpackModuleContext;\r?\n\};\r?\n\r?\n/u;
  if (!declarationPattern.test(content)) return content;

  const lineBreak = content.includes('\r\n') ? '\r\n' : '\n';
  const migrated = content
    .replace(declarationPattern, '')
    .replace(
      "const sources = webpackMeta.webpackContext('./', {",
      [
        'const sources = (',
        '  import.meta as unknown as {',
        '    webpackContext(path: string, options?: { recursive?: boolean; regExp?: RegExp }): WebpackModuleContext;',
        '  }',
        ").webpackContext('./', {",
      ].join(lineBreak),
    );
  return migrated.replace(/\r?\n/gu, lineBreak);
}

export function applyAngular22SpecTsConfigMigration(content) {
  let migrated = content.replace(/^[ \t]*"baseUrl"\s*:\s*"\.\.\/\.\.\/",\r?\n/mu, '');
  migrated = replaceExactJsonStringArrayValue(
    migrated,
    '@sdcorejs/angular',
    './projects/sdcorejs-angular/src/public-api',
    './src/public-api',
  );
  return replaceExactJsonStringArrayValue(
    migrated,
    '@sdcorejs/angular/*',
    './projects/sdcorejs-angular/*',
    './*',
  );
}

export function applyAngular22StyleAssertionMigration(content, relativePath) {
  const formBuilderSpec =
    'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts';
  if (relativePath !== formBuilderSpec) return content;

  // why: Angular 22's test compiler namespaces CSS custom properties in component
  // metadata as `%NS%`; the packed FESM and browser CSS keep the public property name.
  return content.replace(
    "expect(styles).toContain('--fb-placeholder-columns');",
    "expect(styles).toMatch(/--(?:%NS%)?fb-placeholder-columns/);",
  );
}

function applyAngular22GeneratedTextHygiene(content, relativePath) {
  if (!/\.(?:html|scss|svg)$/u.test(relativePath)) return content;

  const normalized = content
    .replace(/\r\n?/gu, '\n')
    .replace(/[ \t]+$/gmu, '');
  return normalized.includes('\n') ? normalized.replace(/\n+$/u, '\n') : normalized;
}

export function applyAngular22GeneratedCompatibility(content, relativePath) {
  let migrated = applyAngular22GeneratedTextHygiene(content, relativePath);
  if (relativePath === 'projects/sdcorejs-angular/coverage-includes.spec.ts') {
    migrated = applyAngular22CoverageBootstrap(migrated);
  }
  if (relativePath.startsWith('projects/sdcorejs-angular/') && relativePath.endsWith('.ts')) {
    migrated = applyAngular22EagerMigration(migrated);
  }
  return applyAngular22StyleAssertionMigration(migrated, relativePath);
}

function replaceExactJsonString(content, propertyName, expectedValue, marker) {
  const pattern = new RegExp(
    `("${escapeRegExp(propertyName)}"\\s*:\\s*)"${escapeRegExp(expectedValue)}"`,
    'u',
  );
  return content.replace(pattern, (_match, prefix) => `${prefix}"${marker}"`);
}

function replaceExactJsonStringArrayValue(
  content,
  propertyName,
  expectedValue,
  replacementValue,
) {
  const pattern = new RegExp(
    `("${escapeRegExp(propertyName)}"\\s*:\\s*\\[\\s*)"${escapeRegExp(expectedValue)}"(\\s*\\])`,
    'u',
  );
  return content.replace(
    pattern,
    (_match, prefix, suffix) => `${prefix}"${replacementValue}"${suffix}`,
  );
}

function removeExactRootEngine(content, manifest, expectedNodeEngine) {
  const engines = manifest.engines;
  if (!engines || engines.node !== expectedNodeEngine || Object.keys(engines).length !== 1) return content;

  const engineProperty =
    `"engines"\\s*:\\s*\\{\\s*"node"\\s*:\\s*"${escapeRegExp(expectedNodeEngine)}"\\s*\\}`;
  const middleProperty = new RegExp(`^[ \\t]*${engineProperty},\\n`, 'mu');
  if (middleProperty.test(content)) return content.replace(middleProperty, '');

  const finalProperty = new RegExp(`,\\n[ \\t]*${engineProperty}(?=\\n?\\s*\\})`, 'u');
  return content.replace(finalProperty, '');
}

function normalizeRootManifest(content, workspace) {
  const contract = rootManifestContracts[workspace];
  if (!contract) return content;

  const manifest = JSON.parse(content);
  let normalized = content;

  for (const packageName of angularRootPackages) {
    if (manifest.dependencies?.[packageName] === contract.angular) {
      normalized = replaceExactJsonString(
        normalized,
        packageName,
        contract.angular,
        `__SDCOREJS_SYNC_ROOT_${packageName}__`,
      );
    }
  }

  const exactFields = [
    ['zone.js', manifest.dependencies, contract.zone, '__SDCOREJS_SYNC_ROOT_ZONE__'],
    ['@angular-devkit/build-angular', manifest.devDependencies, contract.buildAngular, '__SDCOREJS_SYNC_ROOT_BUILD_ANGULAR__'],
    ['@angular/cli', manifest.devDependencies, contract.cli, '__SDCOREJS_SYNC_ROOT_CLI__'],
    ['@angular/compiler-cli', manifest.devDependencies, contract.compilerCli, '__SDCOREJS_SYNC_ROOT_COMPILER_CLI__'],
    ['angular-eslint', manifest.devDependencies, contract.angularEslint, '__SDCOREJS_SYNC_ROOT_ANGULAR_ESLINT__'],
    ['ng-packagr', manifest.devDependencies, contract.ngPackagr, '__SDCOREJS_SYNC_ROOT_NG_PACKAGR__'],
    ['typescript', manifest.devDependencies, contract.typescript, '__SDCOREJS_SYNC_ROOT_TYPESCRIPT__'],
    ['typescript-eslint', manifest.devDependencies, contract.typescriptEslint, '__SDCOREJS_SYNC_ROOT_TYPESCRIPT_ESLINT__'],
  ];

  for (const [propertyName, section, expectedValue, marker] of exactFields) {
    if (section?.[propertyName] === expectedValue) {
      normalized = replaceExactJsonString(normalized, propertyName, expectedValue, marker);
    }
  }

  if (contract.nodeEngine) {
    normalized = removeExactRootEngine(normalized, manifest, contract.nodeEngine);
  }

  return normalized;
}

function normalizeLibraryManifest(content, workspace) {
  const contract = libraryManifestContracts[workspace];
  if (!contract) return content;

  const manifest = JSON.parse(content);
  let normalized = content;
  const major = workspace.slice(1);
  const versionMatch = new RegExp(`^${major}\\.(.+)$`, 'u').exec(manifest.version ?? '');
  if (versionMatch) {
    normalized = replaceExactJsonString(
      normalized,
      'version',
      manifest.version,
      `__SDCOREJS_SYNC_MAJOR__.${versionMatch[1]}`,
    );
  }

  for (const packageName of angularPeerPackages) {
    if (manifest.peerDependencies?.[packageName] === contract.angularPeer) {
      normalized = replaceExactJsonString(
        normalized,
        packageName,
        contract.angularPeer,
        `__SDCOREJS_SYNC_PEER_${packageName}__`,
      );
    }
  }

  if (manifest.engines?.node === contract.nodeEngine) {
    normalized = replaceExactJsonString(
      normalized,
      'node',
      contract.nodeEngine,
      '__SDCOREJS_SYNC_LIBRARY_NODE_ENGINE__',
    );
  }

  return normalized;
}

export function normalizeWorkspaceContent(content, relativePath, workspace) {
  let normalized = content.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n');

  if (relativePath === 'package.json') {
    normalized = normalizeRootManifest(normalized, workspace);
  }

  if (relativePath === 'projects/sdcorejs-angular/package.json') {
    normalized = normalizeLibraryManifest(normalized, workspace);
  }

  if (relativePath === 'projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts') {
    const expectedCall = workspace === 'v19' ? domPortalOutletCalls[0] : domPortalOutletCalls[1];
    normalized = normalized.split(expectedCall).join(domPortalOutletMarker);
  }

  return normalized;
}

export function compareNormalizedWorkspaceContent({
  sourceContent,
  sourceWorkspace: source,
  targetContent,
  targetWorkspace: target,
  relativePath,
}) {
  let preparedSource = sourceContent;
  if (source !== 'v22' && target === 'v22') {
    preparedSource = relativePath === 'projects/sdcorejs-angular/tsconfig.spec.json'
      ? applyAngular22SpecTsConfigMigration(preparedSource)
      : applyAngular22GeneratedCompatibility(preparedSource, relativePath);
  }

  return normalizeWorkspaceContent(preparedSource, relativePath, source) ===
    normalizeWorkspaceContent(targetContent, relativePath, target);
}

function normalizeFile(filePath, relativePath, workspace) {
  return normalizeWorkspaceContent(readFileSync(filePath, 'utf8'), relativePath, workspace);
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

    if (!compareNormalizedWorkspaceContent({
      sourceContent: readFileSync(sourcePath, 'utf8'),
      sourceWorkspace,
      targetContent: readFileSync(targetPath, 'utf8'),
      targetWorkspace,
      relativePath: file,
    })) {
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

    if (normalizeFile(sourcePath, relativePath, sourceWorkspace) !==
      normalizeFile(targetPath, relativePath, targetWorkspace)) {
      failures.push(`content differs in ${targetWorkspace}: ${relativePath}`);
    }
  }

  return failures;
}

function compareCanonicalNpmReadme(workspace) {
  const canonicalPath = join(repoRoot, 'README.npm.md');
  const packageReadmePath = join(repoRoot, 'versions', workspace, 'projects', 'sdcorejs-angular', 'README.md');

  if (!existsSync(canonicalPath)) return ['missing canonical npm README: README.npm.md'];
  if (!existsSync(packageReadmePath)) {
    return [`missing in ${workspace}: projects/sdcorejs-angular/README.md`];
  }

  return normalizeFile(canonicalPath, 'README.npm.md', workspace) ===
    normalizeFile(packageReadmePath, 'projects/sdcorejs-angular/README.md', workspace)
    ? []
    : [`npm README differs in ${workspace}: expected README.npm.md`];
}

function main() {
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
    process.exitCode = 1;
    return;
  }

  console.log(`Version workspace sync check passed: ${targetWorkspaces.join(', ')} match ${sourceWorkspace}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}

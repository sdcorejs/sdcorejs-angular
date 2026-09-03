import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const checkerUrl = new URL('./check-version-sync.mjs', import.meta.url);

const SHARED_ANGULAR_PEER = '^19.0.0 || ^20.0.0 || ^21.0.0';
const V22_NODE_ENGINE = '^22.22.3 || ^24.15.0 || ^26.0.0';

const V19_ROOT_MANIFEST = {
  name: 'sdcorejs-angular',
  version: '0.0.0',
  private: true,
  dependencies: {
    '@angular/animations': '^19.0.0',
    '@angular/cdk': '^19.0.0',
    '@angular/common': '^19.0.0',
    '@angular/compiler': '^19.0.0',
    '@angular/core': '^19.0.0',
    '@angular/forms': '^19.0.0',
    '@angular/material': '^19.0.0',
    '@angular/material-date-fns-adapter': '^19.0.0',
    '@angular/platform-browser': '^19.0.0',
    '@angular/platform-browser-dynamic': '^19.0.0',
    '@angular/router': '^19.0.0',
    '@sdcorejs/angular-material-datetime': '1.0.4',
    '@sdcorejs/utils': '1.1.4',
    'date-fns': '^3.6.0',
    'rxjs': '~7.8.0',
    'zone.js': '~0.15.0',
  },
  devDependencies: {
    '@angular-devkit/build-angular': '^19.0.0',
    '@angular/cli': '^19.0.0',
    '@angular/compiler-cli': '^19.0.0',
    'angular-eslint': '19.2.1',
    'ng-packagr': '^19.0.0',
    'typescript': '~5.7.2',
    'typescript-eslint': '8.26.0',
  },
};

const V22_ROOT_MANIFEST = {
  ...V19_ROOT_MANIFEST,
  engines: { node: V22_NODE_ENGINE },
  dependencies: {
    ...V19_ROOT_MANIFEST.dependencies,
    '@angular/animations': '~22.1.4',
    '@angular/cdk': '~22.1.4',
    '@angular/common': '~22.1.4',
    '@angular/compiler': '~22.1.4',
    '@angular/core': '~22.1.4',
    '@angular/forms': '~22.1.4',
    '@angular/material': '~22.1.4',
    '@angular/material-date-fns-adapter': '~22.1.4',
    '@angular/platform-browser': '~22.1.4',
    '@angular/platform-browser-dynamic': '~22.1.4',
    '@angular/router': '~22.1.4',
    '@sdcorejs/angular-material-datetime': '1.0.4',
    'zone.js': '~0.16.2',
  },
  devDependencies: {
    ...V19_ROOT_MANIFEST.devDependencies,
    '@angular-devkit/build-angular': '~22.1.6',
    '@angular/cli': '~22.1.6',
    '@angular/compiler-cli': '~22.1.4',
    'angular-eslint': '~22.1.0',
    'ng-packagr': '~22.1.1',
    'typescript': '~6.0.3',
    'typescript-eslint': '8.60.0',
  },
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

const V19_LIBRARY_MANIFEST = {
  name: '@sdcorejs/angular',
  version: '19.1.4',
  engines: { node: '>=20.11.0' },
  dependencies: {
    '@sdcorejs/angular-material-datetime': '1.0.4',
    '@sdcorejs/utils': '1.1.4',
  },
  peerDependencies: {
    ...Object.fromEntries(ANGULAR_PEER_KEYS.map(name => [name, SHARED_ANGULAR_PEER])),
    rxjs: '^7.8.0',
  },
};

const V22_LIBRARY_MANIFEST = {
  ...V19_LIBRARY_MANIFEST,
  version: '22.1.4',
  engines: { node: V22_NODE_ENGINE },
  dependencies: { ...V19_LIBRARY_MANIFEST.dependencies },
  peerDependencies: {
    ...Object.fromEntries(ANGULAR_PEER_KEYS.map(name => [name, '^22.0.0'])),
    rxjs: '^7.8.0',
  },
};

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function syncHelpers() {
  const checker = await import(checkerUrl.href);
  assert.equal(
    typeof checker.normalizeWorkspaceContent,
    'function',
    'check-version-sync.mjs must export normalizeWorkspaceContent',
  );
  assert.equal(
    typeof checker.compareNormalizedWorkspaceContent,
    'function',
    'check-version-sync.mjs must export compareNormalizedWorkspaceContent',
  );
  return checker;
}

function compare(compareNormalizedWorkspaceContent, {
  sourceContent,
  targetContent,
  relativePath,
}) {
  return compareNormalizedWorkspaceContent({
    sourceContent,
    sourceWorkspace: 'v19',
    targetContent,
    targetWorkspace: 'v22',
    relativePath,
  });
}

test('[workspace] sync helpers are importable without executing the CLI', () => {
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', `await import(${JSON.stringify(checkerUrl.href)});`],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '', 'importing check-version-sync.mjs must not run the sync CLI');
  assert.equal(result.stderr, '', 'importing check-version-sync.mjs must not write CLI diagnostics');
});

test('[workspace] normalizes only the exact Angular 22 root-manifest overrides', async () => {
  const { normalizeWorkspaceContent, compareNormalizedWorkspaceContent } = await syncHelpers();
  const sourceContent = json(V19_ROOT_MANIFEST);
  const targetContent = json(V22_ROOT_MANIFEST);

  assert.notEqual(sourceContent, targetContent);
  assert.equal(
    normalizeWorkspaceContent(sourceContent, 'package.json', 'v19'),
    normalizeWorkspaceContent(targetContent, 'package.json', 'v22'),
  );
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent,
    relativePath: 'package.json',
  }), true);
});

test('[workspace] requires every reviewed Angular 22 root-manifest value exactly', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();
  const cases = [
    ['framework train', manifest => { manifest.dependencies['@angular/core'] = '^22.0.0'; }],
    ['build toolchain train', manifest => { manifest.devDependencies['@angular-devkit/build-angular'] = '~22.1.5'; }],
    ['datetime dependency', manifest => { manifest.dependencies['@sdcorejs/angular-material-datetime'] = '1.0.5'; }],
    ['TypeScript train', manifest => { manifest.devDependencies.typescript = '~6.0.2'; }],
    ['typescript-eslint exact version', manifest => { manifest.devDependencies['typescript-eslint'] = '^8.60.0'; }],
    ['Node engine union', manifest => { manifest.engines.node = '>=22.22.3'; }],
  ];

  for (const [label, mutate] of cases) {
    const target = structuredClone(V22_ROOT_MANIFEST);
    mutate(target);
    assert.equal(compare(compareNormalizedWorkspaceContent, {
      sourceContent: json(V19_ROOT_MANIFEST),
      targetContent: json(target),
      relativePath: 'package.json',
    }), false, label);
  }
});

test('[workspace] normalizes only package version, v22 Angular peers and Node engines in the public manifest', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(V19_LIBRARY_MANIFEST),
    targetContent: json(V22_LIBRARY_MANIFEST),
    relativePath: 'projects/sdcorejs-angular/package.json',
  }), true);

  const wrongSuffix = structuredClone(V22_LIBRARY_MANIFEST);
  wrongSuffix.version = '22.9.9';
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(V19_LIBRARY_MANIFEST),
    targetContent: json(wrongSuffix),
    relativePath: 'projects/sdcorejs-angular/package.json',
  }), false, 'the Angular major may change, but the package release suffix may not drift');

  const wrongPeer = structuredClone(V22_LIBRARY_MANIFEST);
  wrongPeer.peerDependencies['@angular/core'] = '^21.0.0 || ^22.0.0';
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(V19_LIBRARY_MANIFEST),
    targetContent: json(wrongPeer),
    relativePath: 'projects/sdcorejs-angular/package.json',
  }), false, 'v22 artifacts must advertise Angular 22 peers only');
});

test('[workspace] rejects unlisted root and public-manifest drift', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();
  const rootWithOverride = structuredClone(V22_ROOT_MANIFEST);
  rootWithOverride.overrides = { typescript: '~6.0.3' };
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(V19_ROOT_MANIFEST),
    targetContent: json(rootWithOverride),
    relativePath: 'package.json',
  }), false, 'npm overrides are not an approved sync exception');

  const rootWithDependencyDrift = structuredClone(V22_ROOT_MANIFEST);
  rootWithDependencyDrift.dependencies['@sdcorejs/utils'] = '2.0.0';
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(V19_ROOT_MANIFEST),
    targetContent: json(rootWithDependencyDrift),
    relativePath: 'package.json',
  }), false, 'an unlisted dependency change must remain fatal');

  const libraryWithExportDrift = structuredClone(V22_LIBRARY_MANIFEST);
  libraryWithExportDrift.exports = { './utilities': './utilities/index.js' };
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(V19_LIBRARY_MANIFEST),
    targetContent: json(libraryWithExportDrift),
    relativePath: 'projects/sdcorejs-angular/package.json',
  }), false, 'an unlisted public-manifest field must remain fatal');
});

test('[workspace] normalizes only the known side-drawer constructor shim', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();
  const relativePath = 'projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts';
  const sourceContent = [
    'export class SdSideDrawer {',
    '  outlet = new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector);',
    '}',
    '',
  ].join('\n');
  const targetContent = sourceContent.replace(
    'new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector)',
    'new DomPortalOutlet(document.body, this.#ar, this.#injector)',
  );

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent,
    relativePath,
  }), true);

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: targetContent.replace('export class SdSideDrawer', 'export class ChangedSideDrawer'),
    relativePath,
  }), false, 'unrelated side-drawer source drift must remain fatal');

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: targetContent.replace(
      'new DomPortalOutlet(document.body, this.#ar, this.#injector)',
      'new DomPortalOutlet(document.body, this.#injector)',
    ),
    relativePath,
  }), false, 'no second constructor shim is approved');
});

test('[workspace] keeps ordinary source and public-barrel differences fatal', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: 'export class SdButton {}\n',
    targetContent: 'export class SdButton { disabled = false; }\n',
    relativePath: 'projects/sdcorejs-angular/components/button/src/button.component.ts',
  }), false);

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: "export * from './button.component';\n",
    targetContent: "export * from './button.component';\nexport * from './compat';\n",
    relativePath: 'projects/sdcorejs-angular/components/button/src/public-api.ts',
  }), false);
});

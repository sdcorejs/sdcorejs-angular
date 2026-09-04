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
  targetWorkspace = 'v22',
}) {
  return compareNormalizedWorkspaceContent({
    sourceContent,
    sourceWorkspace: 'v19',
    targetContent,
    targetWorkspace,
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

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: sourceContent,
    relativePath,
  }), false, 'v22 must not retain the Angular 19 four-argument constructor');
});

test('[workspace] requires the Angular 22 eager-change-detection compatibility migration', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();
  const relativePath = 'projects/sdcorejs-angular/components/example/src/example.component.ts';
  const sourceContent = [
    "import { Component } from '@angular/core';",
    '',
    '@Component({',
    "  selector: 'sd-example',",
    "  template: '',",
    '})',
    'export class SdExample {}',
    '',
  ].join('\n');
  const targetContent = [
    "import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';",
    "import { Component } from '@angular/core';",
    '',
    '@Component({',
    '  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,',
    "  selector: 'sd-example',",
    "  template: '',",
    '})',
    'export class SdExample {}',
    '',
  ].join('\n');

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent,
    relativePath,
  }), true, 'v22 generated components must explicitly preserve the pre-v22 eager behavior');

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: sourceContent,
    relativePath,
  }), false, 'an implicit v22 component would silently switch to OnPush');

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: targetContent.replace(
      'SdAngular22ChangeDetectionStrategy.Eager',
      'SdAngular22ChangeDetectionStrategy.OnPush',
    ),
    relativePath,
  }), false, 'the compatibility migration must not change existing runtime behavior');
});

test('[workspace] Angular 22 eager migration handles real component-file shapes and is idempotent', async () => {
  const { applyAngular22EagerMigration } = await syncHelpers();
  assert.equal(typeof applyAngular22EagerMigration, 'function');

  const source = [
    '/* retained file header */',
    'import {',
    '  ChangeDetectionStrategy,',
    '  Component,',
    "} from '@angular/core';",
    '',
    '@Component({',
    "  selector: 'sd-first',",
    '  template: `{{ label }} { literal brace }`,',
    '  providers: [{ useFactory: () => ({ label: /a{2}/u }) }],',
    '})',
    'class FirstComponent {}',
    '',
    '@Component({',
    '  changeDetection: ChangeDetectionStrategy.OnPush,',
    "  template: '',",
    '})',
    'class AlreadyOnPushComponent {}',
    '',
    "@Component({ template: '' })",
    'class InlineComponent {}',
    '',
    '@Component({',
    '  providers: [{ useValue: { changeDetection: true } }],',
    "  template: '',",
    '})',
    'class NestedPropertyComponent {}',
    '',
    '@Component({',
    "  'changeDetection': ChangeDetectionStrategy.OnPush,",
    "  template: '',",
    '})',
    'class SingleQuotedStrategyComponent {}',
    '',
    '@Component({',
    '  "changeDetection": ChangeDetectionStrategy.OnPush,',
    "  template: '',",
    '})',
    'class DoubleQuotedStrategyComponent {}',
    '',
  ].join('\n');

  const migrated = applyAngular22EagerMigration(source);
  assert.match(migrated, /^\/\* retained file header \*\/\nimport \{ ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy \} from '@angular\/core';\n/u);
  assert.equal(
    [...migrated.matchAll(/changeDetection: SdAngular22ChangeDetectionStrategy\.Eager,/gu)].length,
    3,
    'a nested provider property must not masquerade as component changeDetection metadata',
  );
  assert.equal(
    [...migrated.matchAll(/ChangeDetectionStrategy\.OnPush,/gu)].length,
    3,
    'explicitly reviewed identifier and quoted-key strategies must remain untouched',
  );
  assert.match(
    migrated,
    /@Component\(\{\n  changeDetection: SdAngular22ChangeDetectionStrategy\.Eager,\n  template: '',\n\}\)\nclass InlineComponent/u,
    'an inline decorator must expand to the formatter-stable multiline form',
  );
  assert.equal(applyAngular22EagerMigration(migrated), migrated, 'the generated migration must be idempotent');
});

test('[workspace] Angular 22 eager migration ignores decorator-shaped comments and strings', async () => {
  const { applyAngular22EagerMigration } = await syncHelpers();
  const documentationOnly = [
    '/**',
    " * @Component({ template: '<sd-button></sd-button>' })",
    ' * class DocumentationHost {}',
    ' */',
    "const example = \"@Component({ template: '' })\";",
    "const template = `@Component({ template: '' })`;",
    '',
  ].join('\n');

  assert.equal(
    applyAngular22EagerMigration(documentationOnly),
    documentationOnly,
    'documentation and string literals must remain byte-identical',
  );

  const withRealDecorator = [
    "import { Component } from '@angular/core';",
    documentationOnly,
    '@Component({',
    "  template: '',",
    '})',
    'class RealHost {}',
    '',
  ].join('\n');
  const migrated = applyAngular22EagerMigration(withRealDecorator);
  assert.equal(
    [...migrated.matchAll(/SdAngular22ChangeDetectionStrategy\.Eager/gu)].length,
    1,
    'only the executable decorator may be migrated',
  );
  assert.match(migrated, /\* @Component\(\{ template: '<sd-button><\/sd-button>' \}\)/u);
});

test('[workspace] keeps Angular 22 generated shims out of v20 and v21', async () => {
  const { compareNormalizedWorkspaceContent, applyAngular22EagerMigration, applyAngular22CoverageBootstrap } =
    await syncHelpers();
  const componentPath = 'projects/sdcorejs-angular/components/example/src/example.component.ts';
  const component = [
    "import { Component } from '@angular/core';",
    '@Component({',
    "  template: '',",
    '})',
    'export class ExampleComponent {}',
    '',
  ].join('\n');
  const coveragePath = 'projects/sdcorejs-angular/coverage-includes.spec.ts';
  const coverage = [
    'interface WebpackModuleContext {',
    '  keys(): string[];',
    '  (id: string): unknown;',
    '}',
    '',
    'const webpackMeta = import.meta as unknown as {',
    '  webpackContext(path: string, options?: { recursive?: boolean; regExp?: RegExp }): WebpackModuleContext;',
    '};',
    '',
    "const sources = webpackMeta.webpackContext('./', {",
    '  recursive: true,',
    '});',
    '',
  ].join('\n');
  const specConfig = json({
    compilerOptions: {
      baseUrl: '../../',
      paths: {
        '@sdcorejs/angular': ['./projects/sdcorejs-angular/src/public-api'],
        '@sdcorejs/angular/*': ['./projects/sdcorejs-angular/*'],
      },
    },
  });
  const leakedSpecConfig = specConfig.replace('    "baseUrl": "../../",\n', '');
  assert.notEqual(leakedSpecConfig, specConfig, 'the fixture must remove the legacy baseUrl');

  for (const targetWorkspace of ['v20', 'v21']) {
    assert.equal(compare(compareNormalizedWorkspaceContent, {
      sourceContent: component,
      targetContent: applyAngular22EagerMigration(component),
      relativePath: componentPath,
      targetWorkspace,
    }), false, `${targetWorkspace} must not receive the v22 Eager marker`);
    assert.equal(compare(compareNormalizedWorkspaceContent, {
      sourceContent: coverage,
      targetContent: applyAngular22CoverageBootstrap(coverage),
      relativePath: coveragePath,
      targetWorkspace,
    }), false, `${targetWorkspace} must retain its working legacy webpack bootstrap`);
    assert.equal(compare(compareNormalizedWorkspaceContent, {
      sourceContent: specConfig,
      targetContent: leakedSpecConfig,
      relativePath: 'projects/sdcorejs-angular/tsconfig.spec.json',
      targetWorkspace,
    }), false, `${targetWorkspace} must retain the legacy baseUrl mapping`);
  }
});

test('[workspace] Angular 22 coverage migration keeps dominant CRLF formatting stable', async () => {
  const { applyAngular22CoverageBootstrap } = await syncHelpers();
  const source = [
    'const webpackMeta = import.meta as unknown as {',
    '  webpackContext(path: string, options?: { recursive?: boolean; regExp?: RegExp }): WebpackModuleContext;',
    '};',
    '',
    "const sources = webpackMeta.webpackContext('./', {",
    '  recursive: true,',
    '});',
  ].join('\r\n') + '\n';

  const migrated = applyAngular22CoverageBootstrap(source);
  assert.doesNotMatch(migrated, /(?<!\r)\n/u);
  assert.match(migrated, /const sources = \(\r\n  import\.meta as unknown as \{\r\n/u);
});

test('[workspace] Angular 22 generated templates and styles remove inherited whitespace-only Git noise', async () => {
  const { applyAngular22GeneratedCompatibility } = await syncHelpers();
  const inherited = '<section>  \r\n  <span>Value</span>\r\r\n</section>\t\r\n\r\n';
  const expected = '<section>\n  <span>Value</span>\n\n</section>\n';

  for (const relativePath of [
    'projects/sdcorejs-angular/components/example/src/example.component.html',
    'projects/sdcorejs-angular/components/example/src/example.component.scss',
    'projects/sdcorejs-angular/assets/images/example.svg',
  ]) {
    assert.equal(applyAngular22GeneratedCompatibility(inherited, relativePath), expected, relativePath);
  }
  assert.equal(
    applyAngular22GeneratedCompatibility(inherited, 'projects/sdcorejs-angular/components/example/src/example.component.ts'),
    inherited,
    'TypeScript formatting remains governed by the targeted Angular compatibility transforms',
  );
});

test('[workspace] normalizes only the Angular 22 compiled-style namespace assertion', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();
  const relativePath =
    'projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts';
  const sourceContent = [
    "const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\\n');",
    "expect(styles).toContain('--fb-placeholder-columns');",
    '',
  ].join('\n');
  const targetContent = sourceContent.replace(
    "expect(styles).toContain('--fb-placeholder-columns');",
    "expect(styles).toMatch(/--(?:%NS%)?fb-placeholder-columns/);",
  );

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent,
    relativePath,
  }), true);
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: sourceContent,
    relativePath,
  }), false, 'v22 must accept Angular compiler namespace placeholders without weakening the assertion');
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent,
    targetContent: targetContent.replace('fb-placeholder-columns', 'anything'),
    relativePath,
  }), false, 'unrelated assertion drift must remain fatal');
});

test('[workspace] normalizes only the TypeScript 6 spec-path migration required by v22', async () => {
  const { compareNormalizedWorkspaceContent } = await syncHelpers();
  const relativePath = 'projects/sdcorejs-angular/tsconfig.spec.json';
  const source = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      outDir: '../../out-tsc/spec',
      types: ['jasmine'],
      baseUrl: '../../',
      paths: {
        '@sdcorejs/angular': ['./projects/sdcorejs-angular/src/public-api'],
        '@sdcorejs/angular/*': ['./projects/sdcorejs-angular/*'],
      },
    },
    include: ['**/*.ts'],
  };
  const target = structuredClone(source);
  delete target.compilerOptions.baseUrl;
  target.compilerOptions.paths = {
    '@sdcorejs/angular': ['./src/public-api'],
    '@sdcorejs/angular/*': ['./*'],
  };

  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(source),
    targetContent: json(target),
    relativePath,
  }), true);

  const suppressed = structuredClone(target);
  suppressed.compilerOptions.ignoreDeprecations = '6.0';
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(source),
    targetContent: json(suppressed),
    relativePath,
  }), false, 'the v22 migration must remove the deprecated option instead of suppressing it');

  const wrongPath = structuredClone(target);
  wrongPath.compilerOptions.paths['@sdcorejs/angular'] = ['./dist/sdcorejs-angular'];
  assert.equal(compare(compareNormalizedWorkspaceContent, {
    sourceContent: json(source),
    targetContent: json(wrongPath),
    relativePath,
  }), false, 'the v22 test build must keep resolving the working source tree');
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

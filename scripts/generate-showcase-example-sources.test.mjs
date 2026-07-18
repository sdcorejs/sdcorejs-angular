import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  collectDemoSourceFiles,
  DEFAULT_MANIFEST_OUTPUT_FILE,
  DEFAULT_OUTPUT_FILE,
  extractExampleSource,
  extractExampleSources,
  generateExampleSourceModule,
  renderGeneratedManifest,
  renderGeneratedModule,
} from './generate-showcase-example-sources.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function normalizeLineEndings(content) {
  return content.replace(/\r\n?/g, '\n');
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'sdcorejs-showcase-sources-'));
  const pagesRoot = join(root, 'pages');

  return {
    root,
    pagesRoot,
    write(relativePath, content) {
      const filePath = join(root, relativePath);
      mkdirSync(join(filePath, '..'), { recursive: true });
      writeFileSync(filePath, content, 'utf8');
      return filePath;
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test('extracts the primary demo inline template and styles while preserving full TypeScript source', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'fixture-helper',
  template: \`<span>Helper</span>\`,
})
export class FixtureHelperComponent {}

@Component({
  selector: 'app-button-demo',
  template: \`
    <demo-page title="Button">
      <button>Save</button>
    </demo-page>
  \`,
  styles: [\`
    :host { display: block; }
    button { color: red; }
  \`],
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    const result = extractExampleSource(sourceFile, fixture.pagesRoot);

    assert.equal(result.key, 'components/button');
    assert.equal(result.typescript, source);
    assert.equal(result.html, '<demo-page title="Button">\n  <button>Save</button>\n</demo-page>');
    assert.equal(result.scss, ':host { display: block; }\nbutton { color: red; }');
  } finally {
    fixture.cleanup();
  }
});

test('extracts inline styles declared as a single string literal', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-demo',
  template: \`<demo-page>Loading</demo-page>\`,
  styles: \`
    :host { display: block; }
    .demo-host { min-height: 120px; }
  \`,
})
export class LoadingDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/services/loading/loading-demo.component.ts', source);
    const result = extractExampleSource(sourceFile, fixture.pagesRoot);

    assert.equal(result.scss, ':host { display: block; }\n.demo-host { min-height: 120px; }');
  } finally {
    fixture.cleanup();
  }
});

test('reads external templateUrl and styleUrls relative to the demo component', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-stepper-demo',
  templateUrl: './stepper-demo.component.html',
  styleUrls: ['./stepper-demo.component.scss', './stepper-theme.scss'],
})
export class StepperDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/stepper/stepper-demo.component.ts', source);
    fixture.write('pages/components/stepper/stepper-demo.component.html', '<demo-page>Stepper</demo-page>\n');
    fixture.write('pages/components/stepper/stepper-demo.component.scss', ':host { display: block; }\n');
    fixture.write('pages/components/stepper/stepper-theme.scss', '.theme { color: blue; }\n');

    const result = extractExampleSource(sourceFile, fixture.pagesRoot);

    assert.equal(result.html, '<demo-page>Stepper</demo-page>');
    assert.equal(result.scss, ':host { display: block; }\n\n.theme { color: blue; }');
  } finally {
    fixture.cleanup();
  }
});

test('expands demo sections into focused stable source records', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-button-demo',
  template: \`
    <demo-page #demoPage title="Button">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-basic-usage') {
        <demo-section heading="Basic usage"><button>Save</button></demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading') {
        <demo-section heading="Loading" note="Async submit state."><button>Send</button></demo-section>
      }
    </demo-page>
  \`,
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    const records = extractExampleSources(sourceFile, fixture.pagesRoot);

    assert.deepEqual(
      records.map(record => record.key),
      ['components/button/example-basic-usage', 'components/button/example-loading']
    );
    assert.equal(records[0].html, '<demo-section heading="Basic usage"><button>Save</button></demo-section>');
    assert.equal(records[1].description, 'Async submit state.');
  } finally {
    fixture.cleanup();
  }
});

test('uses focused component files as the displayed source when a section registers them', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-button-demo',
  template: \`
    <demo-page #demoPage>
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-basic-usage') {
        <demo-section
          heading="Basic usage"
          data-example-typescript="./examples/basic.example.ts"
          data-example-template="./examples/basic.example.html">
          <app-basic-example />
        </demo-section>
      }
    </demo-page>
  \`,
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    fixture.write('pages/components/button/examples/basic.example.ts', 'export class BasicExample {}\n');
    fixture.write('pages/components/button/examples/basic.example.html', '<button>Save</button>\n');

    const [record] = extractExampleSources(sourceFile, fixture.pagesRoot);
    assert.equal(record.typescript, 'export class BasicExample {}');
    assert.equal(record.html, '<button>Save</button>');
    assert.equal(record.sourceGroupKey, 'components/button/example-basic-usage');
  } finally {
    fixture.cleanup();
  }
});

test('renders records in deterministic key order regardless of input order', () => {
  const a = { key: 'components/avatar', typescript: 'avatar ts', html: 'avatar html' };
  const b = { key: 'components/button', typescript: 'button ts', html: 'button html', scss: 'button scss' };

  const forward = renderGeneratedModule([a, b]);
  const reverse = renderGeneratedModule([b, a]);

  assert.equal(reverse, forward);
  assert.ok(forward.indexOf('"components/avatar"') < forward.indexOf('"components/button"'));
  assert.match(forward, /export interface ShowcaseExampleSource/);
  assert.match(forward, /export const SHOWCASE_EXAMPLE_SOURCES/);
  assert.equal(renderGeneratedManifest([b, a]), renderGeneratedManifest([a, b]));
});

test('preserves authored section order in the manifest instead of alphabetizing a page gallery', () => {
  const variants = {
    key: 'components/button/example-variants',
    pageKey: 'components/button',
    sectionOrder: 0,
    sectionId: 'example-variants',
    title: 'Variants',
    description: 'Variants',
  };
  const colors = {
    key: 'components/button/example-colors',
    pageKey: 'components/button',
    sectionOrder: 1,
    sectionId: 'example-colors',
    title: 'Colors',
    description: 'Colors',
  };

  const manifest = renderGeneratedManifest([colors, variants]);
  assert.ok(manifest.indexOf('title: "Variants"') < manifest.indexOf('title: "Colors"'));
});

test('fails when a demo section is not protected by its matching focused guard', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-button-demo',
  template: \`<demo-page #demoPage><demo-section heading="Basic usage">Save</demo-section></demo-page>\`,
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    assert.throws(() => extractExampleSources(sourceFile, fixture.pagesRoot), /matching focused structural guard/);
  } finally {
    fixture.cleanup();
  }
});

test('fails with a useful error when an external template is missing', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-missing-demo',
  templateUrl: './missing-demo.component.html',
})
export class MissingDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/missing/missing-demo.component.ts', source);

    assert.throws(() => extractExampleSource(sourceFile, fixture.pagesRoot), /Missing external template.*missing-demo\.component\.html/);
  } finally {
    fixture.cleanup();
  }
});

test('fails when a focused style is registered without focused TypeScript and template files', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-button-demo',
  template: \`
    <demo-page #demoPage>
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-basic') {
        <demo-section heading="Basic" data-example-style="./examples/basic.example.scss">Save</demo-section>
      }
    </demo-page>
  \`,
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    fixture.write('pages/components/button/examples/basic.example.scss', 'button { display: block; }');
    assert.throws(() => extractExampleSources(sourceFile, fixture.pagesRoot), /Focused style.*requires TypeScript and template/);
  } finally {
    fixture.cleanup();
  }
});

test('fails when two source files resolve to the same category/slug key', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-button-demo',
  template: \`<button>Save</button>\`,
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    const outputFile = join(fixture.root, 'example-sources.generated.ts');

    assert.throws(
      () => generateExampleSourceModule({ pagesRoot: fixture.pagesRoot, outputFile, sourceFiles: [sourceFile, sourceFile] }),
      /Duplicate example source key "components\/button"/
    );
  } finally {
    fixture.cleanup();
  }
});

test('writes exactly the deterministic module returned by the renderer', () => {
  const fixture = createFixture();
  const source = `import { Component } from '@angular/core';

@Component({
  selector: 'app-button-demo',
  template: \`<button>Save</button>\`,
})
export class ButtonDemoComponent {}
`;

  try {
    const sourceFile = fixture.write('pages/components/button/button-demo.component.ts', source);
    const outputFile = join(fixture.root, 'generated', 'example-sources.generated.ts');
    const records = generateExampleSourceModule({ pagesRoot: fixture.pagesRoot, outputFile, sourceFiles: [sourceFile] });

    assert.equal(readFileSync(outputFile, 'utf8'), renderGeneratedModule(records));
  } finally {
    fixture.cleanup();
  }
});

test('checked-in published-doc manifests, indexes, registry mappings, and document files are consistent', () => {
  const publishedDocsRoot = join(REPO_ROOT, 'published-docs');
  const manifest = JSON.parse(readFileSync(join(publishedDocsRoot, 'versions.json'), 'utf8'));
  const catalog = JSON.parse(readFileSync(join(publishedDocsRoot, 'catalog.json'), 'utf8'));
  const manifestVersions = manifest.versions.map(entry => entry.version);

  assert.ok(manifest.latest, 'Published-doc versions manifest must declare a latest version');
  assert.equal(new Set(manifestVersions).size, manifestVersions.length, 'Published-doc manifest contains duplicate versions');
  assert.ok(manifestVersions.includes(manifest.latest), `Latest published-doc version is not in the manifest: ${manifest.latest}`);
  assert.equal(catalog.package, manifest.package, 'Published-doc catalog and manifest packages differ');
  assert.equal(catalog.baseUrl, manifest.baseUrl, 'Published-doc catalog and manifest base URLs differ');
  assert.equal(catalog.latest, manifest.latest, 'Published-doc catalog and manifest latest versions differ');
  assert.equal(
    catalog.registry,
    new URL('versions.json', `${manifest.baseUrl}/`).toString(),
    'Published-doc catalog registry URL is inconsistent'
  );
  assert.deepEqual(
    catalog.versions.map(entry => entry.version),
    manifestVersions,
    'Published-doc catalog and manifest version order differs'
  );

  let latestPublishedIds;
  for (const entry of manifest.versions) {
    const versionRoot = join(publishedDocsRoot, entry.version);
    const indexPath = join(versionRoot, 'index.json');
    const expectedIndexUrl = new URL(`${entry.version}/index.json`, `${manifest.baseUrl}/`).toString();

    assert.equal(entry.index, expectedIndexUrl, `[${entry.version}] Manifest index URL is inconsistent`);
    assert.ok(existsSync(indexPath), `[${entry.version}] Missing referenced index: ${entry.index}`);

    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const publishedIds = index.docs.map(document => document.id);

    assert.equal(index.version, entry.version, `[${entry.version}] Index declares a different version`);
    assert.equal(entry.count, index.count, `[${entry.version}] Manifest and index counts differ`);
    assert.equal(index.count, index.docs.length, `[${entry.version}] Index count and document array length differ`);
    assert.equal(new Set(publishedIds).size, publishedIds.length, `[${entry.version}] Index contains duplicate document IDs`);

    const catalogEntry = catalog.versions.find(candidate => candidate.version === entry.version);
    assert.ok(catalogEntry, `[${entry.version}] Catalog is missing the manifest version`);
    assert.equal(catalogEntry.major, Number(entry.version.split('.')[0]), `[${entry.version}] Catalog major is inconsistent`);
    assert.equal(catalogEntry.released, entry.released, `[${entry.version}] Catalog release date differs from manifest`);
    assert.equal(catalogEntry.count, entry.count, `[${entry.version}] Catalog count differs from manifest`);
    assert.equal(catalogEntry.baseUrl, index.baseUrl, `[${entry.version}] Catalog base URL differs from index`);
    assert.equal(catalogEntry.index, entry.index, `[${entry.version}] Catalog index URL differs from manifest`);
    assert.deepEqual(catalogEntry.docs, index.docs, `[${entry.version}] Catalog documents differ from index`);

    for (const document of index.docs) {
      assert.ok(document.path, `[${entry.version}] Document ${document.id} has no path`);
      assert.ok(existsSync(join(versionRoot, document.path)), `[${entry.version}] Missing referenced document file: ${document.path}`);
    }

    if (entry.version === manifest.latest) latestPublishedIds = new Set(publishedIds);
  }

  const expectedMajors = [...new Set(manifest.versions.map(entry => Number(entry.version.split('.')[0])))];
  assert.deepEqual(
    catalog.majors.map(entry => entry.major),
    expectedMajors,
    'Published-doc catalog major order differs from manifest'
  );
  for (const major of expectedMajors) {
    const manifestEntries = manifest.versions.filter(entry => Number(entry.version.split('.')[0]) === major);
    const catalogMajor = catalog.majors.find(entry => entry.major === major);
    assert.ok(catalogMajor, `[v${major}] Catalog is missing the major group`);
    assert.equal(catalogMajor.latest, manifestEntries[0].version, `[v${major}] Catalog latest version is inconsistent`);
    assert.deepEqual(
      catalogMajor.versions,
      manifestEntries.map(entry => ({
        version: entry.version,
        released: entry.released,
        count: entry.count,
        index: entry.index,
      })),
      `[v${major}] Catalog major versions differ from manifest`
    );
  }

  assert.ok(latestPublishedIds, `Latest published-doc index was not loaded: ${manifest.latest}`);
  const registry = readFileSync(
    join(REPO_ROOT, 'versions', 'v19', 'projects', 'showcase', 'src', 'app', 'docs', 'core', 'documentation.registry.ts'),
    'utf8'
  );
  const mappedIds = new Set([...registry.matchAll(/publishedDocId:\s*'([^']+)'/g)].map(match => match[1]));

  assert.ok(mappedIds.size > 0, 'Documentation registry must contain published-doc mappings');
  assert.equal(
    mappedIds.size,
    latestPublishedIds.size,
    'Latest published-doc index and registry contain different numbers of document IDs'
  );
  for (const mappedId of mappedIds) {
    assert.ok(latestPublishedIds.has(mappedId), `Latest index is missing registry published-doc mapping: ${mappedId}`);
  }
  for (const publishedId of latestPublishedIds) {
    assert.ok(mappedIds.has(publishedId), `Documentation registry is missing latest published document: ${publishedId}`);
  }
});

test('checked-in generated example artifacts are fresh', () => {
  const records = collectDemoSourceFiles().flatMap(sourceFile => extractExampleSources(sourceFile));
  assert.equal(normalizeLineEndings(readFileSync(DEFAULT_OUTPUT_FILE, 'utf8')), renderGeneratedModule(records));
  assert.equal(normalizeLineEndings(readFileSync(DEFAULT_MANIFEST_OUTPUT_FILE, 'utf8')), renderGeneratedManifest(records));
});

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

    assert.deepEqual(records.map(record => record.key), [
      'components/button/example-basic-usage',
      'components/button/example-loading',
    ]);
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
    key: 'components/button/example-variants', pageKey: 'components/button', sectionOrder: 0,
    sectionId: 'example-variants', title: 'Variants', description: 'Variants',
  };
  const colors = {
    key: 'components/button/example-colors', pageKey: 'components/button', sectionOrder: 1,
    sectionId: 'example-colors', title: 'Colors', description: 'Colors',
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

test('every registry published-doc mapping exists in the latest checked-in index', () => {
  const registry = readFileSync(
    join(REPO_ROOT, 'versions', 'v19', 'projects', 'showcase', 'src', 'app', 'docs', 'core', 'documentation.registry.ts'),
    'utf8',
  );
  const index = JSON.parse(readFileSync(join(REPO_ROOT, 'published-docs', '21.1.2', 'index.json'), 'utf8'));
  const publishedIds = new Set(index.docs.map(document => document.id));
  const mappings = [...registry.matchAll(/publishedDocId:\s*'([^']+)'/g)].map(match => match[1]);

  assert.equal(mappings.length, 53);
  for (const mapping of mappings) assert.ok(publishedIds.has(mapping), `Missing published doc mapping: ${mapping}`);
});

test('checked-in generated example artifacts are fresh', () => {
  const records = collectDemoSourceFiles().flatMap(sourceFile => extractExampleSources(sourceFile));
  assert.equal(readFileSync(DEFAULT_OUTPUT_FILE, 'utf8'), renderGeneratedModule(records));
  assert.equal(readFileSync(DEFAULT_MANIFEST_OUTPUT_FILE, 'utf8'), renderGeneratedManifest(records));
});

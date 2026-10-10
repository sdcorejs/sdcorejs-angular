import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// The scripts CI job installs v19. Use Angular's real Karma discovery, without
// installing historical workspaces or starting a browser/compiler in this guard.
const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const { load } = require('js-yaml');
const { findTests } = require(join(dirname(require.resolve('@angular/build/package.json')), 'src/builders/karma/find-tests.js'));
const root = fileURLToPath(new URL('../', import.meta.url));
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const scopes = ['components/file-explorer', 'components/form-generic', 'components/button', 'services/confirm', 'components/tab', 'components/stepper'];
const formPattern = 'projects/sdcorejs-angular/components/form-generic/**/*.spec.ts';

function specFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? specFiles(path) : entry.name.endsWith('.spec.ts') ? [resolve(path)] : [];
  });
}

function historicalStep(source) {
  const job = load(source).jobs.compatibility;
  assert.deepEqual(job.strategy.matrix.include.map(line => line.version).sort(), ['v20', 'v21', 'v22']);
  const steps = job.steps.filter(step => /\bng test sdcorejs-angular\b/u.test(step.run ?? '') && /--include(?:=|\s)/u.test(step.run));
  assert.equal(steps.length, 1, 'one executable historical selection step is required');
  const step = steps[0];
  assert.equal(step.if, "${{ matrix.version != 'v22' }}");
  assert.equal(step['working-directory'], 'versions/${{ matrix.version }}');
  return step;
}

async function assertCompleteSelection(source, major) {
  const command = historicalStep(source).run;
  const flags = name => [...command.matchAll(new RegExp(`--${name}(?:=|\\s+)([^\\s]+)`, 'gu'))].map(match => match[1].replace(/^['"]|['"]$/gu, ''));
  const workspace = join(root, 'versions', major);
  const config = JSON.parse(readFileSync(join(workspace, 'angular.json'), 'utf8'));
  const project = config.projects['sdcorejs-angular'];
  const projectRoot = join(workspace, project.sourceRoot);
  const excluded = [...(project.architect.test.options.exclude ?? []), ...flags('exclude')];
  const actual = (await findTests(flags('include'), excluded, workspace, projectRoot)).map(path => resolve(path)).sort();
  const expected = scopes.flatMap(scope => specFiles(join(projectRoot, scope))).sort();
  for (const scope of scopes) {
    assert.ok(specFiles(join(projectRoot, scope)).length > 0, `${major}: ${scope} must contain specs`);
  }
  const selected = new Set(actual);
  const missing = expected.filter(path => !selected.has(path)).map(path => relative(workspace, path));
  assert.equal(missing.length, 0, `${major}: missing scoped specs: ${missing.join(', ')}`);
  assert.deepEqual(actual, expected, `${major}: selection must equal all six affected scope trees`);
}

for (const major of ['v20', 'v21']) {
  test(`${major} selects every Explorer, Form, Button, Confirm, Tab and Stepper spec, including nested specs`, async () => {
    await assertCompleteSelection(workflow, major);
  });

  test(`${major} rejects an omitted Form selector even when its text remains in a comment`, async () => {
    const omitted = workflow.replace(`          --include=${formPattern}`, '');
    assert.notEqual(omitted, workflow, 'mutation must remove the executable selector');
    const commentOnly = omitted + `\n# --include=${formPattern}\n`;
    await assert.rejects(assertCompleteSelection(commentOnly, major), /missing scoped specs.*form-generic/u);
  });

  test(`${major} rejects a Form selector that misses nested builder/render tests`, async () => {
    const narrowed = workflow.replace(formPattern, 'projects/sdcorejs-angular/components/form-generic/*.spec.ts');
    assert.notEqual(narrowed, workflow, 'mutation must narrow the executable selector');
    await assert.rejects(assertCompleteSelection(narrowed, major), /missing scoped specs.*form-generic/u);
  });
}

test('canonical v19 and new-major v22 keep their unfiltered coverage suites', () => {
  const jobs = load(workflow).jobs;
  const coverage = steps => steps.filter(step => /\bng test sdcorejs-angular\b/u.test(step.run ?? '') && /--code-coverage\b/u.test(step.run));
  const canonical = coverage(jobs['canonical-v19'].steps);
  const newest = coverage(jobs.compatibility.steps);
  assert.equal(canonical.length, 1);
  assert.equal(newest.length, 1);
  assert.equal(newest[0].if, "${{ matrix.version == 'v22' }}");
  for (const step of [...canonical, ...newest]) assert.doesNotMatch(step.run, /--(?:include|exclude)(?:=|\s)/u);
});

test('the repository contracts entrypoint runs the selection guard in CI', () => {
  const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts;
  assert.equal(scripts['test:ci-selection'], 'node --test scripts/ci-test-selection.test.mjs');
  assert.ok(scripts['test:scripts'].split(' && ').includes('npm run test:ci-selection'));
  assert.ok(load(workflow).jobs.scripts.steps.some(step => step.run === 'npm run test:scripts'));
});

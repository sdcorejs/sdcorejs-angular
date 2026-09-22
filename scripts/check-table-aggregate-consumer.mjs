import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const line = process.argv[2] ?? 'v19';
assert.ok(['v19', 'v20', 'v21', 'v22'].includes(line));
const workspace = join(root, 'versions', line);
const packageRoot = join(workspace, 'dist/sdcorejs-angular');
const modelPath = join(packageRoot, 'components/table/src/models');
const declaration = readFileSync(join(modelPath, 'table-aggregate.model.d.ts'), 'utf8');
const docs = readFileSync(join(workspace, 'projects/sdcorejs-angular/components/table/sd-table.md'), 'utf8');
const consumer = [...docs.matchAll(/```ts\r?\n([\s\S]*?)```/g)].find(match => match[1].includes('export class OrderTotals'))?.[1];
const example = declaration.replace(/^\s*\* ?/gm, '').match(/```ts\r?\n([\s\S]*?)```/)?.[1];
assert.ok(consumer && example, 'Missing complete consumer or declaration JSDoc example');
assert.match(
  readFileSync(join(modelPath, 'table-column.model.d.ts'), 'utf8'),
  /Independent summary above the existing footer[\s\S]*?aggregate\?/
);
assert.match(readFileSync(join(modelPath, 'table-option.model.d.ts'), 'utf8'), /@defaultValue[\s\S]*?aggregate\?/);
assert.match(readFileSync(join(modelPath, 'index.d.ts'), 'utf8'), /export type \* from '.\/table-aggregate.model'/);

const taskRoot = join(workspace, 'node_modules');
const taskDir = mkdtempSync(join(taskRoot, '.sd-aggregate-consumer-'));
try {
  const config = {
    compilerOptions: {
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      target: 'ES2022',
      module: 'preserve',
      moduleResolution: 'bundler',
      experimentalDecorators: true,
      useDefineForClassFields: false,
      lib: ['ES2022', 'dom'],
      types: [],
      paths: { '@sdcorejs/angular/*': [join(packageRoot, '*')] },
    },
    angularCompilerOptions: { strictTemplates: true },
    files: ['consumer.ts', 'assets.d.ts'],
  };
  writeFileSync(join(taskDir, 'tsconfig.json'), JSON.stringify(config));
  writeFileSync(join(taskDir, 'assets.d.ts'), "declare module '*.css';\n");
  const compile = (source, label) => {
    writeFileSync(join(taskDir, 'consumer.ts'), source);
    const result = spawnSync(
      process.execPath,
      [join(workspace, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'), '-p', 'tsconfig.json'],
      {
        cwd: taskDir,
        encoding: 'utf8',
        timeout: 300_000,
      }
    );
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `${label}: ${result.stdout}${result.stderr}`);
    console.log(`PASS (${line}): ${label}`);
  };
  compile(example, 'templateRef JSDoc example from built declarations');
  compile(consumer, 'documented typed consumer with existing footer');
  compile(consumer.replace("from '@sdcorejs/angular/components/table'", "from '@sdcorejs/angular/components'"), 'components barrel');

  // Language-service metadata is the input to editor hover, without claiming to test the editor UI.
  writeFileSync(join(taskDir, 'consumer.ts'), consumer);
  const require = createRequire(import.meta.url);
  const ts = require(join(workspace, 'node_modules/typescript'));
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, taskDir);
  let revision = 0;
  const service = ts.createLanguageService({
    ...ts.sys,
    getCompilationSettings: () => parsed.options,
    getScriptFileNames: () => parsed.fileNames,
    getScriptVersion: () => String(revision),
    getScriptSnapshot: file => {
      const text = ts.sys.readFile(file);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => taskDir,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
  });
  for (const [label, source] of [
    ['built-in + template', consumer],
    ['template-only', consumer.replace("calculate: 'SUM', ", '')],
    ['callback + template', consumer.replace("calculate: 'SUM'", 'calculate: items => items.length')],
  ]) {
    writeFileSync(join(taskDir, 'consumer.ts'), source);
    revision++;
    const info = service.getQuickInfoAtPosition(join(taskDir, 'consumer.ts'), source.indexOf('templateRef:') + 3);
    const hover = JSON.stringify({ documentation: info?.documentation, tags: info?.tags });
    for (const text of ['ng-template', 'let-isComplete', 'ViewChild', 'ngOnInit', "calculate: 'SUM'"]) {
      assert.ok(hover.includes(text), `${label}: templateRef hover metadata lost ${text}`);
    }
  }
  service.dispose();
  console.log(`PASS (${line}): public exports, property JSDoc and templateRef hover metadata preserved.`);
} finally {
  assert.ok(resolve(taskDir).startsWith(resolve(taskRoot) + sep), 'Cleanup must stay inside workspace node_modules');
  rmSync(taskDir, { recursive: true, force: true });
}

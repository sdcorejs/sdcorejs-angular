import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Compile the actual documented consumer against the built package, including a
// negative template check: a green build alone cannot prove item is not `any`.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const line = process.argv[2] ?? 'v19';
assert.ok(['v19', 'v20', 'v21', 'v22'].includes(line), 'Expected v19, v20, v21 or v22');
const workspace = join(root, 'versions', line);
const docs = readFileSync(join(workspace, 'projects/sdcorejs-angular/components/table/sd-table.md'), 'utf8');
const consumer = docs.split('### Complete standalone consumer')[1]?.match(/```ts\r?\n([\s\S]*?)```/)?.[1];
assert.ok(consumer, 'Missing documented mobile consumer');
const taskDir = mkdtempSync(join(workspace, 'node_modules', '.sd-mobile-consumer-'));
try {
  const config = {
    compilerOptions: {
      strict: true, skipLibCheck: false, noEmit: true, target: 'ES2022', module: 'preserve',
      moduleResolution: 'bundler', experimentalDecorators: true, useDefineForClassFields: false,
      lib: ['ES2022', 'dom'], types: [],
      paths: { '@sdcorejs/angular/*': [join(workspace, 'dist/sdcorejs-angular/*')] },
    },
    angularCompilerOptions: { strictTemplates: true },
    files: ['consumer.ts', 'assets.d.ts'],
  };
  writeFileSync(join(taskDir, 'tsconfig.json'), JSON.stringify(config));
  // The components barrel also exports CKEditor. Its CSS imports are assets
  // handled by the app bundler; keep declaration checking enabled for real TS.
  writeFileSync(join(taskDir, 'assets.d.ts'), "declare module '*.css';\n");
  const compile = (source, label) => {
    console.log(`Checking (${line}): ${label}`);
    writeFileSync(join(taskDir, 'consumer.ts'), source);
    const result = spawnSync(process.execPath, [join(workspace, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'), '-p', 'tsconfig.json'], {
      cwd: taskDir, encoding: 'utf8', timeout: 300_000,
    });
    if (result.error) throw result.error;
    return result;
  };
  const typed = compile(consumer, 'documented typed consumer');
  assert.equal(typed.status, 0, typed.stdout + typed.stderr);
  const publicationFixture = compile(readFileSync(join(root, 'scripts/fixtures/package-consumer/fixture.component.ts'), 'utf8'), 'publication fixture');
  assert.equal(publicationFixture.status, 0, publicationFixture.stdout + publicationFixture.stderr);
  const barrel = compile(consumer.replace("from '@sdcorejs/angular/components/table'", "from '@sdcorejs/angular/components'"), 'public components barrel');
  assert.equal(barrel.status, 0, barrel.stdout + barrel.stderr);
  const bare = compile(consumer.replace('[sdTableRowMobileDef]="tableOption"', 'sdTableRowMobileDef'), 'bare attribute');
  assert.equal(bare.status, 0, bare.stdout + bare.stderr);
  const invalid = compile(consumer.replace('{{ row.id }}', '{{ row.notARealField }}'), 'reject missing Order property');
  assert.notEqual(invalid.status, 0, 'Typed template unexpectedly accepted a missing field');
  assert.match(invalid.stdout + invalid.stderr, /Property 'notARealField' does not exist on type 'Order'/);
  console.log(`PASS (${line}): documented typed consumer; public table/components barrels; bare attribute; missing Order property rejected by strictTemplates.`);
} finally {
  // taskDir is a fresh child of this workspace's node_modules, never a caller path.
  rmSync(taskDir, { recursive: true, force: true });
}
